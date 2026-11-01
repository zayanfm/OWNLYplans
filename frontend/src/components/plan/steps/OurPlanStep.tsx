import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import type { PlanGoalOutcome, PlanOption, PlanOptionId, PlanOptions, PlanProposal } from '../../../services/api';
import { FALLBACK_PLAN_OPTIONS } from '../../../constants/planningFallback';
import { futureValue } from '../planPersonalization';
import { COLORS, money, monthLabel, statusPill, stepStyles } from '../stepStyles';
import { Stepper } from '../Stepper';
import { GoalIcon } from '../GoalIcon';
import { ContributionsCard } from '../ContributionsCard';

const ROUTE_ORDER = ['housing', 'education', 'custom', 'emergency'];
const EDIT_DEBOUNCE_MS = 400;

const PROPOSAL_POLL_MS = 1000;
const OFFLINE_REPLY_MS = 3000;
const RANGE_RATES = { low: 0.025, mid: 0.045, high: 0.065 };

const monthsUntil = (isoMonth: string) => {
  const [year, month] = isoMonth.split('-').map(Number);
  const now = new Date();
  return Math.max(1, (year - now.getFullYear()) * 12 + (month - 1) - now.getMonth());
};

// Education & Wealth Projection (#8): the outcome range under three return assumptions.
const ProjectionRange = ({ goal }: { goal: PlanGoalOutcome }) => {
  const months = monthsUntil(goal.deadline);
  const values = {
    low: futureValue(goal.startingAmount, goal.monthlyNow, RANGE_RATES.low, months),
    mid: futureValue(goal.startingAmount, goal.monthlyNow, RANGE_RATES.mid, months),
    high: futureValue(goal.startingAmount, goal.monthlyNow, RANGE_RATES.high, months),
  };
  const scale = Math.max(values.high, goal.targetAmount);
  return (
    <View style={styles.projection}>
      <Text style={styles.projectionTitle}>By {monthLabel(goal.deadline)}, {money(goal.monthlyNow)}/month could grow to</Text>
      {(['low', 'mid', 'high'] as const).map((key) => (
        <View key={key} style={styles.rangeRow}>
          <Text style={styles.rangeLabel}>{key === 'low' ? 'Weak markets' : key === 'mid' ? 'Expected' : 'Strong markets'}</Text>
          <View style={styles.rangeTrack}><View style={[styles.rangeFill, { width: `${values[key] / scale * 100}%` }, values[key] < goal.targetAmount && styles.rangeShort]} /></View>
          <Text style={styles.rangeValue}>{money(values[key])}</Text>
        </View>
      ))}
      <Text style={stepStyles.note}>
        Target {money(goal.targetAmount)}. Uses 2.5% / 4.5% / 6.5% a year; returns are not guaranteed.{goal.childName ? ' Starts from the CDA balance, which can move to Edusave/PSEA for education fees.' : ''}
      </Text>
    </View>
  );
};

const GoalRow = ({ goal, expanded, onPress, rank }: { goal: PlanGoalOutcome; expanded: boolean; onPress?: () => void; rank?: number }) => {
  const pill = statusPill(goal.status);
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} style={stepStyles.rowDivider}>
      <View style={stepStyles.row}>
        <GoalIcon group={goal.group} size={30} />
        <View style={styles.flex}>
          <Text style={styles.goalName}>{rank ? `${rank}. ` : ''}{goal.name}{onPress ? (expanded ? '  ▴' : '  ▾') : ''}</Text>
          <Text style={stepStyles.cardSub}>{goal.owner === 'household' ? '' : 'Personal · '}Done {monthLabel(goal.completesBy)} · due {monthLabel(goal.deadline)}</Text>
        </View>
        <Text style={stepStyles.rowValue}>{money(goal.monthlyNow)}/mo</Text>
        <View style={[stepStyles.pill, { backgroundColor: pill.bg }]}><Text style={[stepStyles.pillText, { color: pill.fg }]}>{pill.label}</Text></View>
      </View>
      {expanded ? <ProjectionRange goal={goal} /> : null}
    </TouchableOpacity>
  );
};

const AlternativeCard = ({ plan, selected, onSelect }: { plan: PlanOption; selected: boolean; onSelect: () => void }) => (
  <TouchableOpacity style={[stepStyles.card, selected && styles.selectedCard]} onPress={onSelect} activeOpacity={0.8}>
    <View style={styles.planHead}>
      <Text style={stepStyles.cardTitle}>{plan.name}</Text>
      {plan.recommended ? <Text style={styles.recBadge}>Recommended</Text> : null}
    </View>
    <Text style={stepStyles.cardSub}>{plan.tagline}</Text>
    {plan.tradeOffs.map((line) => <Text key={line} style={styles.tradeOff}>• {line}</Text>)}
  </TouchableOpacity>
);

/**
 * Our Plan (Decide): one recommended split from the goal optimiser (#5), the education
 * projection (#8), the What-if sheet (#6), and agreeing the plan with the partner (#7).
 */
export const OurPlanStep: React.FC<{
  partnerFirstName?: string;
  saving: boolean;
  onBack: () => void;
  onAgreed: (planId: PlanOptionId) => void;
}> = ({ partnerFirstName = 'Your partner', saving, onBack, onAgreed }) => {
  const [options, setOptions] = useState<PlanOptions | null>(null);
  const [selectedId, setSelectedId] = useState<PlanOptionId>('balanced');
  const [showAlternatives, setShowAlternatives] = useState<boolean>(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [proposal, setProposal] = useState<PlanProposal | null>(null);
  const [proposing, setProposing] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [order, setOrder] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [ownPlan, setOwnPlan] = useState<PlanOption | null>(null);
  const [ownError, setOwnError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.getPlanOptions()
      .then((result) => {
        setOptions(result);
        setSelectedId(result.recommendedPlanId);
      })
      .catch(() => {
        setOptions(FALLBACK_PLAN_OPTIONS);
        setSelectedId(FALLBACK_PLAN_OPTIONS.recommendedPlanId);
      });
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  if (!options) {
    return <View style={styles.loading}><ActivityIndicator color={COLORS.red} /></View>;
  }

  const plan = (selectedId === 'custom' && ownPlan) || options.plans.find((item) => item.id === selectedId) || options.plans[0];

  // After someone changes what they put in, recalculate every plan (and the family's own).
  const reloadOptions = async () => {
    try {
      setOptions(await api.getPlanOptions());
      if (ownPlan?.definition) await calculate(ownPlan.definition.order, ownPlan.definition.monthlyOverrides);
    } catch {
      // Offline: keep showing the last plans.
    }
  };

  // The family's own plan. `amounts` holds only the monthly amounts the family set themselves;
  // every other goal is funded by priority order with what it needs to stay on time.
  const startEditing = () => {
    const saved = selectedId === 'custom' ? ownPlan?.definition : undefined;
    const startOrder = saved?.order || plan.goals.filter((goal) => goal.owner === 'household')
      .sort((a, b) => ROUTE_ORDER.indexOf(a.routeKey) - ROUTE_ORDER.indexOf(b.routeKey))
      .map((goal) => goal.key);
    const startAmounts = saved?.monthlyOverrides || {};
    setOrder(startOrder);
    setAmounts(startAmounts);
    setEditing(true);
    recalculate(startOrder, startAmounts);
  };

  const calculate = async (nextOrder: string[], nextAmounts: Record<string, number>) => {
    try {
      const result = (await api.customPlan(nextOrder, nextAmounts)).plan;
      setOwnPlan(result);
      setOwnError(null);
      return result;
    } catch (err: any) {
      setOwnError(err?.status ? err.message : 'Changing the plan needs the planning engine. Start the backend and try again.');
      return null;
    }
  };

  const recalculate = (nextOrder: string[], nextAmounts: Record<string, number>) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => calculate(nextOrder, nextAmounts), EDIT_DEBOUNCE_MS);
  };

  // 3: always save the latest order and amounts, even if a recalculation is still pending.
  const useOurPlan = async () => {
    if (debounce.current) clearTimeout(debounce.current);
    const saved = await calculate(order, amounts);
    if (!saved) return;
    setSelectedId('custom');
    setEditing(false);
    setProposal(null);
  };

  const resetAmount = (key: string) => {
    const { [key]: removed, ...rest } = amounts;
    setAmounts(rest);
    recalculate(order, rest);
  };

  const move = (key: string, delta: number) => {
    const index = order.indexOf(key);
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    recalculate(next, amounts);
  };

  const setAmount = (key: string, value: number) => {
    const next = { ...amounts, [key]: value };
    setAmounts(next);
    recalculate(order, next);
  };

  const goalName = (key: string) => plan.goals.find((goal) => goal.key === key)?.name || ownPlan?.goals.find((goal) => goal.key === key)?.name || key;
  const ownAmount = (key: string) => amounts[key] ?? ownPlan?.goals.find((goal) => goal.key === key)?.monthlyNow ?? 0;
  // When retirement still receives money, every dated goal already got what it needs this month,
  // so the order only starts to matter if money gets tighter.
  const familyPot = options.contributions?.familyPot.available ?? options.investable;
  const ownFree = ownPlan?.pots?.find((pot) => pot.id === 'household')?.free ?? 0;
  const everythingFits = Boolean(ownPlan && ownFree > 0 && !ownPlan.goals.some((goal) => goal.owner === 'household' && goal.status === 'AT_RISK'));

  // 4: the family's plan is listed in their priority order; the others by deadline.
  const priorityOrder = plan.definition?.order || [];
  const rank = (key: string) => {
    const index = priorityOrder.indexOf(key);
    return index === -1 ? priorityOrder.length : index;
  };
  const goals = [...plan.goals].sort((a, b) => (priorityOrder.length
    ? rank(a.key) - rank(b.key) || a.deadline.localeCompare(b.deadline)
    : a.deadline.localeCompare(b.deadline)));

  const pollReply = (online: boolean, sent: PlanProposal) => {
    timer.current = setTimeout(async () => {
      if (!online) {
        setProposal({ ...sent, status: 'AGREED', response: { decision: 'AGREED', message: `${partnerFirstName}: Looks good to me.` } });
        return;
      }
      try {
        const latest = (await api.getLatestProposal()).proposal;
        if (latest && latest.status !== 'PENDING') {
          setProposal(latest);
          return;
        }
      } catch {
        // Keep waiting.
      }
      pollReply(online, sent);
    }, online ? PROPOSAL_POLL_MS : OFFLINE_REPLY_MS);
  };

  const propose = async () => {
    setProposing(true);
    let sent: PlanProposal = {
      id: 'local', proposedAt: new Date().toISOString(), status: 'PENDING', planId: plan.id, planName: plan.name,
      proposedBy: 'You', reviewer: partnerFirstName, note: null, response: null,
    };
    let online = true;
    try {
      sent = (await api.proposePlan(plan.id)).proposal;
    } catch {
      online = false;
    } finally {
      setProposing(false);
    }
    setProposal(sent);
    pollReply(online, sent);
  };

  const finish = async (planId: PlanOptionId) => {
    try {
      await api.resolveProposal(planId);
    } catch {
      // Offline: continue with the agreed plan locally.
    }
    onAgreed(planId);
  };

  const suggested = proposal?.response?.suggestedPlanId
    ? options.plans.find((item) => item.id === proposal.response?.suggestedPlanId)
    : null;

  return (
    <View style={stepStyles.container}>
      <ScrollView contentContainerStyle={stepStyles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={stepStyles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={stepStyles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={stepStyles.eyebrow}>Decide together</Text>
        <Text style={stepStyles.title}>Our plan</Text>
        <Text style={stepStyles.subtitle}>
          Each of you decides what to put in. Shared goals come from the family pot, personal goals from each person&apos;s own money, and the rest stays free.
        </Text>

        {options.contributions ? <ContributionsCard contributions={options.contributions} onChanged={reloadOptions} /> : null}

        <View style={[stepStyles.card, styles.planCard]}>
          <View style={styles.planHead}>
            <Text style={stepStyles.cardTitle}>{plan.name}</Text>
            {plan.recommended ? <Text style={styles.recBadge}>Recommended</Text> : null}
          </View>
          <Text style={stepStyles.cardSub}>{plan.tagline}</Text>
          {options.lumpSum ? (
            <View style={styles.lumpSum}>
              <Text style={styles.lumpSumText}>Today: move {money(options.lumpSum.amount)} of spare cash into the emergency buffer.</Text>
            </View>
          ) : null}
          {priorityOrder.length ? <Text style={[stepStyles.note, styles.gap]}>Shared goals in your priority order; personal goals come from each person&apos;s own money.</Text> : null}
          {goals.map((goal) => (
            <GoalRow
              key={goal.key}
              rank={priorityOrder.includes(goal.key) ? rank(goal.key) + 1 : undefined}
              goal={goal}
              expanded={expandedGoal === goal.key}
              onPress={goal.routeKey === 'education' ? () => setExpandedGoal(expandedGoal === goal.key ? null : goal.key) : undefined}
            />
          ))}
          {plan.keptFree > 0 ? (
            <Text style={[stepStyles.note, styles.gap]}>{money(plan.keptFree)}/month stays free in the pots this plan does not need.</Text>
          ) : null}
          {plan.stepUps.length ? (
            <View style={styles.stepUps}>
              <Text style={stepStyles.sectionLabel}>As goals finish</Text>
              {plan.stepUps.slice(0, 2).map((step) => (
                <Text key={step.month + step.fromGoal} style={styles.stepUpText}>{monthLabel(step.month)}: {step.text}</Text>
              ))}
            </View>
          ) : null}
        </View>

        <TouchableOpacity onPress={() => setShowAlternatives(!showAlternatives)} activeOpacity={0.7}>
          <Text style={[stepStyles.linkText, styles.gap]}>{showAlternatives ? 'Hide alternatives' : `Compare ${options.plans.length - 1} alternatives`}</Text>
        </TouchableOpacity>
        {showAlternatives ? options.plans.map((item) => (
          <AlternativeCard key={item.id} plan={item} selected={item.id === selectedId} onSelect={() => { setSelectedId(item.id); setProposal(null); }} />
        )) : null}

        {!editing ? (
          <TouchableOpacity style={[stepStyles.secondaryButton, styles.gap]} onPress={startEditing} activeOpacity={0.8}>
            <Text style={stepStyles.secondaryButtonText}>Change priorities or amounts</Text>
          </TouchableOpacity>
        ) : (
          <View style={[stepStyles.card, styles.gap]}>
            <Text style={stepStyles.cardTitle}>Make it ours</Text>
            <Text style={stepStyles.cardSub}>
              Family-pot money goes to goal 1 first, then 2, and so on; anything left stays free. Leave an amount on auto and the goal gets what it needs to stay on time, or set your own.
            </Text>
            {everythingFits ? (
              <Text style={styles.fitNote}>
                Right now every goal gets what it needs, so changing the order does not change the amounts. Order decides who waits when money is short: ask the assistant a what-if, or set your own amounts.
              </Text>
            ) : null}
            {order.map((key, index) => {
              const outcome = ownPlan?.goals.find((goal) => goal.key === key);
              const pill = outcome ? statusPill(outcome.status) : null;
              return (
                <View key={key} style={styles.editRow}>
                  <View style={styles.editHead}>
                    <Text style={styles.editRank}>{index + 1}</Text>
                    <GoalIcon group={(ownPlan?.goals.find((goal) => goal.key === key) || plan.goals.find((goal) => goal.key === key))?.group} size={26} />
                    <Text style={[styles.goalName, styles.flex]}>{goalName(key)}</Text>
                    {pill ? <View style={[stepStyles.pill, { backgroundColor: pill.bg }]}><Text style={[stepStyles.pillText, { color: pill.fg }]}>{pill.label}</Text></View> : null}
                    <TouchableOpacity style={styles.moveButton} onPress={() => move(key, -1)} accessibilityLabel={`Move ${goalName(key)} up`}><Text style={styles.moveText}>↑</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.moveButton} onPress={() => move(key, 1)} accessibilityLabel={`Move ${goalName(key)} down`}><Text style={styles.moveText}>↓</Text></TouchableOpacity>
                  </View>
                  <Stepper label={amounts[key] === undefined ? 'Each month (auto)' : 'Each month (yours)'} value={ownAmount(key)} step={25} min={0} max={familyPot}
                    display={money(ownAmount(key))} onChange={(value) => setAmount(key, value)} />
                  <View style={styles.editFoot}>
                    {outcome ? <Text style={[stepStyles.note, styles.flex]}>Done {monthLabel(outcome.completesBy)} · due {monthLabel(outcome.deadline)}</Text> : null}
                    {amounts[key] !== undefined ? (
                      <TouchableOpacity onPress={() => resetAmount(key)}><Text style={styles.autoLink}>Back to auto</Text></TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}
            <View style={stepStyles.row}>
              <Text style={stepStyles.rowLabel}>Kept free in the family pot</Text>
              <Text style={stepStyles.rowValue}>{money(ownFree)}/mo</Text>
            </View>
            {ownError ? <Text style={styles.errorText}>{ownError}</Text> : null}
            {ownPlan?.tradeOffs.map((line) => <Text key={line} style={styles.tradeOff}>• {line}</Text>)}
            <View style={[styles.choiceRow, styles.gap]}>
              <TouchableOpacity style={[stepStyles.secondaryButton, styles.flex]} onPress={() => { setEditing(false); setSelectedId(options.recommendedPlanId); }}>
                <Text style={stepStyles.secondaryButtonText}>Back to suggestion</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[stepStyles.primaryButton, styles.flex, (!ownPlan || Boolean(ownError)) && stepStyles.primaryButtonDisabled]}
                onPress={useOurPlan}
                disabled={!ownPlan || Boolean(ownError)}
              >
                <Text style={stepStyles.primaryButtonText}>Use our plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}


        {proposal ? (
          <View style={[stepStyles.card, styles.proposalCard]}>
            {proposal.status === 'PENDING' ? (
              <View style={styles.pendingRow}>
                <ActivityIndicator color={COLORS.red} />
                <Text style={styles.proposalText}>Waiting for {partnerFirstName} to review {proposal.planName}…</Text>
              </View>
            ) : (
              <>
                <Text style={styles.proposalText}>💬 {proposal.response?.message}</Text>
                <Text style={[stepStyles.note, styles.gap]}>
                  {partnerFirstName} saw the plan and goal totals only. Accounts you marked private stayed private.
                </Text>
              </>
            )}
          </View>
        ) : null}
      </ScrollView>


      <View style={stepStyles.footer}>
        {!proposal ? (
          <TouchableOpacity style={[stepStyles.primaryButton, proposing && stepStyles.primaryButtonDisabled]} onPress={propose} disabled={proposing} activeOpacity={0.85}>
            <Text style={stepStyles.primaryButtonText}>Send to {partnerFirstName} to agree</Text>
          </TouchableOpacity>
        ) : proposal.status === 'PENDING' ? (
          <View style={[stepStyles.primaryButton, stepStyles.primaryButtonDisabled]}>
            <Text style={stepStyles.primaryButtonText}>Waiting for {partnerFirstName}…</Text>
          </View>
        ) : proposal.status === 'SUGGESTED_CHANGE' && suggested ? (
          <View style={styles.choiceRow}>
            <TouchableOpacity style={[stepStyles.secondaryButton, styles.flex]} onPress={() => finish(plan.id)} disabled={saving}>
              <Text style={stepStyles.secondaryButtonText}>Keep {plan.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[stepStyles.primaryButton, styles.flex]} onPress={() => finish(suggested.id)} disabled={saving}>
              <Text style={stepStyles.primaryButtonText}>Use {suggested.name}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[stepStyles.primaryButton, saving && stepStyles.primaryButtonDisabled]} onPress={() => finish(proposal.planId)} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={stepStyles.primaryButtonText}>Activate our plan</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gap: { marginTop: 10, marginBottom: 6 },
  planCard: { borderColor: '#F3C9C1', borderWidth: 1.5 },
  selectedCard: { borderColor: COLORS.red, borderWidth: 1.5 },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recBadge: { fontSize: 10, fontWeight: '900', color: '#FFFFFF', backgroundColor: COLORS.red, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  lumpSum: { backgroundColor: COLORS.greenBg, borderRadius: 10, padding: 8, marginTop: 10 },
  lumpSumText: { fontSize: 12, fontWeight: '700', color: COLORS.green },
  goalName: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  stepUps: { marginTop: 12 },
  stepUpText: { fontSize: 11, lineHeight: 16, color: COLORS.muted },
  tradeOff: { fontSize: 12, lineHeight: 17, color: COLORS.ink, marginTop: 4 },
  projection: { backgroundColor: '#F7FAFF', borderRadius: 12, padding: 10, marginBottom: 8 },
  projectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.ink, marginBottom: 6 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rangeLabel: { width: 92, fontSize: 11, color: COLORS.muted },
  rangeTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#E3ECF7', overflow: 'hidden' },
  rangeFill: { height: 8, borderRadius: 4, backgroundColor: '#1F5FA8' },
  rangeShort: { backgroundColor: COLORS.amber },
  rangeValue: { width: 72, textAlign: 'right', fontSize: 11, fontWeight: '800', color: COLORS.ink },
  proposalCard: { marginTop: 8 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  proposalText: { fontSize: 13, lineHeight: 19, fontWeight: '700', color: COLORS.ink, flex: 1 },
  choiceRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  editRow: { borderTopWidth: 1, borderTopColor: '#F2F2F2', paddingTop: 10, marginTop: 10 },
  editHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  editRank: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.red, color: '#FFFFFF', textAlign: 'center', lineHeight: 22, fontSize: 11, fontWeight: '900', overflow: 'hidden' },
  moveButton: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  moveText: { fontSize: 14, fontWeight: '900', color: COLORS.ink },
  errorText: { fontSize: 12, fontWeight: '700', color: COLORS.red, marginTop: 6 },
  fitNote: { fontSize: 12, lineHeight: 17, color: COLORS.green, backgroundColor: COLORS.greenBg, borderRadius: 10, padding: 8, marginTop: 8 },
  editFoot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  autoLink: { fontSize: 11, fontWeight: '800', color: COLORS.red },
});

export default OurPlanStep;
