import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import type { PlanGoalOutcome, PlanOption, PlanOptionId, PlanOptions, PlanProposal } from '../../../services/api';
import { FALLBACK_PLAN_OPTIONS } from '../../../constants/planningFallback';
import { futureValue } from '../planPersonalization';
import { COLORS, money, monthLabel, statusPill, stepStyles } from '../stepStyles';
import { CompactStepper } from '../Stepper';
import { GoalIcon } from '../GoalIcon';
import { ContributionsCard } from '../ContributionsCard';

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

const GoalRow = ({ goal, expanded, onPress }: { goal: PlanGoalOutcome; expanded: boolean; onPress?: () => void }) => {
  const pill = statusPill(goal.status);
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} style={stepStyles.rowDivider}>
      <View style={stepStyles.row}>
        <GoalIcon group={goal.group} size={30} />
        <View style={styles.flex}>
          <Text style={styles.goalName}>{goal.name}{onPress ? (expanded ? '  ▴' : '  ▾') : ''}</Text>
          <Text style={stepStyles.cardSub}>Done {monthLabel(goal.completesBy)} · due {monthLabel(goal.deadline)}</Text>
        </View>
        <Text style={stepStyles.rowValue}>{money(goal.monthlyNow)}/mo</Text>
        <View style={[stepStyles.pill, { backgroundColor: pill.bg }]}><Text style={[stepStyles.pillText, { color: pill.fg }]}>{pill.label}</Text></View>
      </View>
      {expanded ? <ProjectionRange goal={goal} /> : null}
    </TouchableOpacity>
  );
};

// A shared goal you can rank and fund directly: ↑↓ change the order, −/+ set the monthly amount.
const SharedGoalRow = ({ goal, rank, isFirst, isLast, amount, isOwnAmount, max, expanded, onToggle, onMove, onAmount, onAuto }: {
  goal: PlanGoalOutcome;
  rank: number;
  isFirst: boolean;
  isLast: boolean;
  amount: number;
  isOwnAmount: boolean;
  max: number;
  expanded: boolean;
  onToggle?: () => void;
  onMove: (delta: number) => void;
  onAmount: (value: number) => void;
  onAuto: () => void;
}) => {
  const pill = statusPill(goal.status);
  return (
    <View style={[stepStyles.rowDivider, styles.sharedRow]}>
      <View style={styles.sharedHead}>
        <Text style={styles.editRank}>{rank}</Text>
        <GoalIcon group={goal.group} size={30} />
        <TouchableOpacity style={styles.flex} onPress={onToggle} disabled={!onToggle} activeOpacity={0.7}>
          <Text style={styles.goalName}>{goal.name}{onToggle ? (expanded ? '  ▴' : '  ▾') : ''}</Text>
          <Text style={stepStyles.cardSub}>Done {monthLabel(goal.completesBy)} · due {monthLabel(goal.deadline)}</Text>
        </TouchableOpacity>
        <View style={[stepStyles.pill, { backgroundColor: pill.bg }]}><Text style={[stepStyles.pillText, { color: pill.fg }]}>{pill.label}</Text></View>
      </View>
      <View style={styles.sharedControls}>
        <View style={styles.moveGroup}>
          <TouchableOpacity style={[styles.moveButton, isFirst && styles.moveDisabled]} onPress={() => onMove(-1)} disabled={isFirst} accessibilityLabel={`Move ${goal.name} up`}><Text style={styles.moveText}>↑</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.moveButton, isLast && styles.moveDisabled]} onPress={() => onMove(1)} disabled={isLast} accessibilityLabel={`Move ${goal.name} down`}><Text style={styles.moveText}>↓</Text></TouchableOpacity>
        </View>
        <View style={styles.flex}>
          {isOwnAmount ? (
            <TouchableOpacity onPress={onAuto}><Text style={styles.autoLink}>Your amount · back to auto</Text></TouchableOpacity>
          ) : (
            <Text style={stepStyles.note}>Auto: what it needs</Text>
          )}
        </View>
        <CompactStepper label={`${goal.name} monthly amount`} value={amount} step={25} min={0} max={max} display={`${money(amount)}/mo`} onChange={onAmount} />
      </View>
      {expanded ? <ProjectionRange goal={goal} /> : null}
    </View>
  );
};

// One option in the plan dropdown: what it prioritises and what it trades off.
const PlanChoice = ({ plan, selected, onSelect }: { plan: PlanOption; selected: boolean; onSelect: () => void }) => (
  <TouchableOpacity style={[styles.choice, selected && styles.choiceSelected]} onPress={onSelect} activeOpacity={0.8}>
    <View style={styles.planHead}>
      <Text style={styles.goalName}>{selected ? '● ' : '○ '}{plan.name}</Text>
      {plan.recommended ? <Text style={styles.recBadge}>Recommended</Text> : null}
    </View>
    <Text style={stepStyles.cardSub}>{plan.tagline}</Text>
    {plan.tradeOffs.map((line) => <Text key={line} style={styles.tradeOff}>• {line}</Text>)}
  </TouchableOpacity>
);

/**
 * Our Plan (Decide): who puts in what, one editable list of goals from the goal optimiser (#5)
 * with the education projection (#8), and agreeing the plan with the partner (#7).
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
      if (selectedId === 'custom' && ownPlan?.definition) await calculate(ownPlan.definition.order, ownPlan.definition.monthlyOverrides);
    } catch {
      // Offline: keep showing the last plans.
    }
  };

  // Editing the list makes it the family's own plan. `amounts` holds only the monthly amounts the
  // family set; every other shared goal gets what it needs, in priority order.
  const calculate = async (nextOrder: string[], nextAmounts: Record<string, number>) => {
    try {
      const result = (await api.customPlan(nextOrder, nextAmounts)).plan;
      setOwnPlan(result);
      setOwnError(null);
      setSelectedId('custom');
      setProposal(null);
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

  const sharedGoals = plan.goals.filter((goal) => goal.owner === 'household');
  const personalGoals = plan.goals.filter((goal) => goal.owner !== 'household');
  const planOrder = plan.priorityOrder?.length ? plan.priorityOrder : sharedGoals.map((goal) => goal.key);
  const currentOrder = order.length ? order : planOrder;
  const orderedShared = currentOrder.map((key) => sharedGoals.find((goal) => goal.key === key)).filter(Boolean) as PlanGoalOutcome[];

  const move = (key: string, delta: number) => {
    const index = currentOrder.indexOf(key);
    const target = index + delta;
    if (target < 0 || target >= currentOrder.length) return;
    const next = [...currentOrder];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    recalculate(next, amounts);
  };

  const setAmount = (key: string, value: number) => {
    const next = { ...amounts, [key]: value };
    setOrder(currentOrder);
    setAmounts(next);
    recalculate(currentOrder, next);
  };

  const resetAmount = (key: string) => {
    const { [key]: removed, ...rest } = amounts;
    setAmounts(rest);
    recalculate(currentOrder, rest);
  };

  // Choosing a suggested plan again drops the family's edits from the list.
  const selectSuggested = (id: PlanOptionId) => {
    if (debounce.current) clearTimeout(debounce.current);
    setOrder([]);
    setAmounts({});
    setOwnError(null);
    setSelectedId(id);
    setProposal(null);
  };

  const familyPot = options.contributions?.familyPot.available ?? options.investable;
  const familyFree = plan.pots?.find((pot) => pot.id === 'household')?.free ?? 0;
  const everythingFits = familyFree > 0 && !sharedGoals.some((goal) => goal.status === 'AT_RISK');
  const sharedStepUps = plan.stepUps.filter((step) => step.pot === 'household');

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
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowAlternatives(!showAlternatives)} activeOpacity={0.8}
            accessibilityLabel="Choose a plan">
            <View style={styles.flex}>
              <Text style={stepStyles.cardTitle}>{plan.name} {showAlternatives ? '▴' : '▾'}</Text>
              <Text style={stepStyles.cardSub}>{plan.tagline}</Text>
            </View>
            {plan.recommended ? <Text style={styles.recBadge}>Recommended</Text> : null}
          </TouchableOpacity>
          {showAlternatives ? (
            <View style={styles.choices}>
              {options.plans.map((item) => (
                <PlanChoice key={item.id} plan={item} selected={item.id === selectedId}
                  onSelect={() => { selectSuggested(item.id); setShowAlternatives(false); }} />
              ))}
              {ownPlan ? (
                <PlanChoice plan={ownPlan} selected={selectedId === 'custom'}
                  onSelect={() => { setSelectedId('custom'); setProposal(null); setShowAlternatives(false); }} />
              ) : null}
              <Text style={stepStyles.note}>Each plan funds the shared goals in a different order. Choosing one reorders the list below.</Text>
            </View>
          ) : null}
          {options.lumpSum ? (
            <View style={styles.lumpSum}>
              <Text style={styles.lumpSumText}>Today: move {money(options.lumpSum.amount)} of spare cash into the emergency buffer.</Text>
            </View>
          ) : null}

          <Text style={[stepStyles.sectionLabel, styles.sectionTop]}>Shared goals · family pot {money(familyPot)}/mo</Text>
          <Text style={stepStyles.note}>
            Goal 1 is funded first. Use ↑↓ to change the order and −/+ to set your own amount.
            {everythingFits ? ' Everything fits right now, so the order only matters if money gets tight.' : ''}
          </Text>
          {orderedShared.map((goal, index) => (
            <SharedGoalRow
              key={goal.key}
              goal={goal}
              rank={index + 1}
              isFirst={index === 0}
              isLast={index === orderedShared.length - 1}
              amount={amounts[goal.key] ?? goal.monthlyNow}
              isOwnAmount={amounts[goal.key] !== undefined}
              max={familyPot}
              expanded={expandedGoal === goal.key}
              onToggle={goal.routeKey === 'education' ? () => setExpandedGoal(expandedGoal === goal.key ? null : goal.key) : undefined}
              onMove={(delta) => move(goal.key, delta)}
              onAmount={(value) => setAmount(goal.key, value)}
              onAuto={() => resetAmount(goal.key)}
            />
          ))}
          <View style={stepStyles.row}>
            <Text style={stepStyles.rowLabel}>Kept free in the family pot</Text>
            <Text style={stepStyles.rowValue}>{money(familyFree)}/mo</Text>
          </View>
          {ownError ? <Text style={styles.errorText}>{ownError}</Text> : null}
          {selectedId === 'custom' ? plan.tradeOffs.map((line) => <Text key={line} style={styles.tradeOff}>• {line}</Text>) : null}

          {personalGoals.length ? (
            <>
              <Text style={[stepStyles.sectionLabel, styles.sectionTop]}>Personal goals · each person&apos;s own money</Text>
              <Text style={stepStyles.note}>Change these amounts in Who puts in what.</Text>
              {personalGoals.map((goal) => (
                <GoalRow key={goal.key} goal={goal} expanded={false} />
              ))}
            </>
          ) : null}

          {sharedStepUps.length ? (
            <View style={styles.stepUps}>
              <Text style={stepStyles.sectionLabel}>As shared goals finish</Text>
              {sharedStepUps.slice(0, 2).map((step) => (
                <Text key={step.month + step.fromGoal} style={styles.stepUpText}>{monthLabel(step.month)}: {step.text}</Text>
              ))}
            </View>
          ) : null}
        </View>

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
  dropdown: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FBF8F4', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 10 },
  choices: { marginTop: 8, gap: 8 },
  choice: { borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 10 },
  choiceSelected: { borderColor: COLORS.red, backgroundColor: '#FFF8F6' },
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
  editRank: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.red, color: '#FFFFFF', textAlign: 'center', lineHeight: 22, fontSize: 11, fontWeight: '900', overflow: 'hidden' },
  moveButton: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  moveText: { fontSize: 14, fontWeight: '900', color: COLORS.ink },
  errorText: { fontSize: 12, fontWeight: '700', color: COLORS.red, marginTop: 6 },
  autoLink: { fontSize: 11, fontWeight: '800', color: COLORS.red },
  sectionTop: { marginTop: 14 },
  sharedRow: { paddingVertical: 8 },
  sharedHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sharedControls: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, paddingLeft: 30 },
  moveGroup: { flexDirection: 'row', gap: 6 },
  moveDisabled: { opacity: 0.3 },
});

export default OurPlanStep;
