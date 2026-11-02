import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import type { FamilyPlanState, Member, PlanGoalOutcome, PlanOptionId } from '../../../services/api';
import { FALLBACK_PLAN_OPTIONS } from '../../../constants/planningFallback';
import { futureValue } from '../planPersonalization';
import { COLORS, money, monthLabel, statusPill, stepStyles } from '../stepStyles';
import { GoalIcon } from '../GoalIcon';
import { PlanChatSheet } from './PlanChatSheet';

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
      <Text style={stepStyles.note}>Target {money(goal.targetAmount)}. Returns are not guaranteed.</Text>
    </View>
  );
};

const GoalRow = ({ goal, rank, expanded, onPress }: { goal: PlanGoalOutcome; rank?: number; expanded: boolean; onPress?: () => void }) => {
  const pill = statusPill(goal.status);
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} disabled={!onPress} style={stepStyles.rowDivider}>
      <View style={stepStyles.row}>
        {rank ? <Text style={styles.rank}>{rank}</Text> : null}
        <GoalIcon group={goal.group} size={30} />
        <View style={styles.flex}>
          <Text style={styles.goalName}>{goal.name}{onPress ? (expanded ? '  ▴' : '  ▾') : ''}</Text>
          <Text style={stepStyles.cardSub}>Done {monthLabel(goal.completesBy)} · due {monthLabel(goal.deadline)}</Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={stepStyles.rowValue}>{money(goal.monthlyNow)}/mo</Text>
          <View style={[stepStyles.pill, { backgroundColor: pill.bg }]}><Text style={[stepStyles.pillText, { color: pill.fg }]}>{pill.label}</Text></View>
        </View>
      </View>
      {expanded ? <ProjectionRange goal={goal} /> : null}
    </TouchableOpacity>
  );
};

// Offline: show the recommended plan from the saved optimiser output. Changes need the backend.
const offlineState = (partnerJoined: boolean): FamilyPlanState => ({
  success: true,
  plan: FALLBACK_PLAN_OPTIONS.plans.find((item) => item.id === FALLBACK_PLAN_OPTIONS.recommendedPlanId) || FALLBACK_PLAN_OPTIONS.plans[0],
  investable: FALLBACK_PLAN_OPTIONS.investable,
  contributions: FALLBACK_PLAN_OPTIONS.contributions,
  lumpSum: FALLBACK_PLAN_OPTIONS.lumpSum,
  adults: partnerJoined ? ['primary', 'partner'] : ['primary'],
  approvals: {},
  editedBy: null,
  agreed: false,
});

/**
 * Our Plan (Decide #2): one family plan. It starts as the recommended plan from the goal
 * optimiser (#5); either adult changes it through the plan assistant, and both approve it (#7)
 * before it is activated. Education goals show their projection range (#8).
 */
export const OurPlanStep: React.FC<{
  primaryName?: string;
  partnerFirstName?: string;
  partnerJoined?: boolean;
  saving: boolean;
  onBack: () => void;
  onAgreed: (planId: PlanOptionId) => void;
}> = ({ primaryName = 'You', partnerFirstName = 'Your partner', partnerJoined = false, saving, onBack, onAgreed }) => {
  const [state, setState] = useState<FamilyPlanState | null>(null);
  const [offline, setOffline] = useState<boolean>(false);
  const [viewer, setViewer] = useState<Member>('primary');
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [approving, setApproving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const names: Record<Member, string> = { primary: primaryName, partner: partnerFirstName };
  const other: Member = viewer === 'primary' ? 'partner' : 'primary';

  useEffect(() => {
    api.getFamilyPlan()
      .then(setState)
      .catch(() => {
        setOffline(true);
        setState(offlineState(partnerJoined));
      });
  }, []);

  if (!state) {
    return <View style={styles.loading}><ActivityIndicator color={COLORS.red} /></View>;
  }

  const { plan } = state;
  const shared = (plan.priorityOrder?.length ? plan.priorityOrder : plan.goals.filter((goal) => goal.owner === 'household').map((goal) => goal.key))
    .map((key) => plan.goals.find((goal) => goal.key === key && goal.owner === 'household'))
    .filter(Boolean) as PlanGoalOutcome[];
  const personal = plan.goals.filter((goal) => goal.owner !== 'household');
  const pot = plan.pots?.find((item) => item.id === 'household');
  const sharedStepUps = plan.stepUps.filter((step) => step.pot === 'household');
  const iApproved = Boolean(state.approvals[viewer]);
  const waitingOn = state.adults.filter((member) => !state.approvals[member]);

  const approve = async () => {
    setApproving(true);
    setError(null);
    try {
      setState(await api.approveFamilyPlan(viewer === 'partner'));
    } catch (err: any) {
      if (err?.status) {
        setError(err.message);
      } else {
        // Offline: record the approval for this session.
        const approvals = { ...state.approvals, [viewer]: true };
        setState({ ...state, approvals, agreed: state.adults.every((member) => approvals[member]) });
      }
    } finally {
      setApproving(false);
    }
  };

  return (
    <View style={stepStyles.container}>
      <ScrollView contentContainerStyle={stepStyles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={stepStyles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={stepStyles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={stepStyles.eyebrow}>Decide together</Text>
        <Text style={stepStyles.title}>Our plan</Text>
        <Text style={stepStyles.subtitle}>One plan for the family pot. Change it with the assistant.</Text>

        {partnerJoined ? (
          <View style={styles.viewerRow}>
            {(['primary', 'partner'] as Member[]).map((member) => (
              <TouchableOpacity key={member} style={[styles.viewerTab, viewer === member && styles.viewerTabActive]} onPress={() => setViewer(member)} activeOpacity={0.8}>
                <Text style={[styles.viewerText, viewer === member && styles.viewerTextActive]}>
                  {member === 'primary' ? `${primaryName} (you)` : `${partnerFirstName}'s phone · demo`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={[stepStyles.card, styles.planCard]}>
          <View style={styles.planHead}>
            <View style={styles.flex}>
              <Text style={stepStyles.cardTitle}>{plan.recommended ? 'Recommended plan' : 'Our own plan'}</Text>
              <Text style={stepStyles.cardSub}>Family pot {money(pot?.available ?? state.investable)}/month</Text>
            </View>
            {state.editedBy ? (
              <View style={[stepStyles.pill, styles.changedPill]}><Text style={[stepStyles.pillText, styles.changedText]}>Changed by {names[state.editedBy]}</Text></View>
            ) : plan.recommended ? (
              <Text style={styles.recBadge}>Recommended</Text>
            ) : null}
          </View>

          {state.lumpSum ? (
            <View style={styles.lumpSum}>
              <Text style={styles.lumpSumText}>Today: move {money(state.lumpSum.amount)} of spare cash into the emergency buffer.</Text>
            </View>
          ) : null}

          <Text style={[stepStyles.sectionLabel, styles.sectionTop]}>Shared goals · funded in this order</Text>
          {shared.map((goal, index) => (
            <GoalRow
              key={goal.key}
              goal={goal}
              rank={index + 1}
              expanded={expandedGoal === goal.key}
              onPress={goal.routeKey === 'education' ? () => setExpandedGoal(expandedGoal === goal.key ? null : goal.key) : undefined}
            />
          ))}
          <View style={stepStyles.row}>
            <Text style={stepStyles.rowLabel}>Kept free</Text>
            <Text style={stepStyles.rowValue}>{money(pot?.free ?? plan.keptFree)}/mo</Text>
          </View>

          {personal.length ? (
            <>
              <Text style={[stepStyles.sectionLabel, styles.sectionTop]}>Personal goals · own money</Text>
              {personal.map((goal) => <GoalRow key={goal.key} goal={goal} expanded={false} />)}
            </>
          ) : null}

          {sharedStepUps.length ? (
            <View style={styles.stepUps}>
              <Text style={stepStyles.sectionLabel}>As goals finish</Text>
              {sharedStepUps.slice(0, 2).map((step) => (
                <Text key={step.month + step.fromGoal} style={styles.stepUpText}>{monthLabel(step.month)}: {step.text}</Text>
              ))}
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[stepStyles.secondaryButton, styles.chatButton, offline && stepStyles.primaryButtonDisabled]}
          onPress={() => setChatOpen(true)}
          disabled={offline}
          activeOpacity={0.8}
        >
          <Text style={stepStyles.secondaryButtonText}>💬 Change the plan with the assistant</Text>
        </TouchableOpacity>
        {offline ? <Text style={[stepStyles.note, styles.offlineNote]}>Changing the plan needs the planning engine.</Text> : null}

        <View style={stepStyles.card}>
          <Text style={stepStyles.sectionLabel}>Approved by</Text>
          <View style={styles.approvals}>
            {state.adults.map((member) => (
              <View key={member} style={[styles.approval, state.approvals[member] && styles.approvalDone]}>
                <Text style={[styles.approvalText, state.approvals[member] && styles.approvalTextDone]}>
                  {state.approvals[member] ? '✓' : '○'} {names[member]}
                </Text>
              </View>
            ))}
          </View>
          {!iApproved ? (
            <TouchableOpacity style={[stepStyles.primaryButton, styles.topGap, approving && stepStyles.primaryButtonDisabled]} onPress={approve} disabled={approving}>
              {approving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={stepStyles.primaryButtonText}>Approve this plan</Text>}
            </TouchableOpacity>
          ) : !state.agreed ? (
            <Text style={[stepStyles.note, styles.topGap]}>Waiting for {names[other]} to approve.</Text>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>

      <View style={stepStyles.footer}>
        <TouchableOpacity
          style={[stepStyles.primaryButton, (!state.agreed || saving) && stepStyles.primaryButtonDisabled]}
          onPress={() => onAgreed(plan.id)}
          disabled={!state.agreed || saving}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color="#FFFFFF" /> : (
            <Text style={stepStyles.primaryButtonText}>
              {state.agreed ? 'Activate our plan' : `Waiting for ${waitingOn.map((member) => names[member]).join(' and ')}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {!offline ? (
        <PlanChatSheet
          visible={chatOpen}
          viewer={viewer}
          viewerName={names[viewer]}
          otherName={partnerJoined ? names[other] : null}
          state={state}
          onClose={() => setChatOpen(false)}
          onChanged={setState}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topGap: { marginTop: 10 },
  offlineNote: { marginBottom: 10, textAlign: 'center' },
  planCard: { borderColor: '#F3C9C1', borderWidth: 1.5 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recBadge: { fontSize: 10, fontWeight: '900', color: '#FFFFFF', backgroundColor: COLORS.red, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  changedPill: { backgroundColor: '#F3F1EC' },
  changedText: { color: COLORS.muted },
  lumpSum: { backgroundColor: COLORS.greenBg, borderRadius: 10, padding: 8, marginTop: 10 },
  lumpSumText: { fontSize: 12, fontWeight: '700', color: COLORS.green },
  goalName: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  rank: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.red, color: '#FFFFFF', textAlign: 'center', lineHeight: 22, fontSize: 11, fontWeight: '900', overflow: 'hidden' },
  amountCol: { alignItems: 'flex-end', gap: 4 },
  stepUps: { marginTop: 12 },
  stepUpText: { fontSize: 11, lineHeight: 16, color: COLORS.muted },
  projection: { backgroundColor: '#F7FAFF', borderRadius: 12, padding: 10, marginBottom: 8 },
  projectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.ink, marginBottom: 6 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rangeLabel: { width: 92, fontSize: 11, color: COLORS.muted },
  rangeTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#E3ECF7', overflow: 'hidden' },
  rangeFill: { height: 8, borderRadius: 4, backgroundColor: '#1F5FA8' },
  rangeShort: { backgroundColor: COLORS.amber },
  rangeValue: { width: 72, textAlign: 'right', fontSize: 11, fontWeight: '800', color: COLORS.ink },
  sectionTop: { marginTop: 14 },
  chatButton: { minHeight: 48, justifyContent: 'center', marginBottom: 12 },
  viewerRow: { flexDirection: 'row', backgroundColor: '#EDEAE4', borderRadius: 12, padding: 3, marginBottom: 12 },
  viewerTab: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  viewerTabActive: { backgroundColor: '#FFFFFF' },
  viewerText: { fontSize: 12, fontWeight: '700', color: COLORS.muted },
  viewerTextActive: { color: COLORS.ink, fontWeight: '800' },
  approvals: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  approval: { borderRadius: 999, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 10, paddingVertical: 4 },
  approvalDone: { backgroundColor: COLORS.greenBg, borderColor: COLORS.greenBg },
  approvalText: { fontSize: 12, fontWeight: '700', color: COLORS.faint },
  approvalTextDone: { color: COLORS.green },
  errorText: { fontSize: 12, fontWeight: '700', color: COLORS.red, marginTop: 6 },
});

export default OurPlanStep;
