import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import type { FamilyGoal, FamilyPicture, GoalInput, GoalInputStatus, SupportItem } from '../../../services/api';
import { FALLBACK_PICTURE } from '../../../constants/planningFallback';
import { COLORS, money, monthLabel, statusPill, stepStyles } from '../stepStyles';
import { GoalEditSheet, GoalSheetResult } from './GoalEditSheet';

const GROUP_COLORS = ['#D81E05', '#E86A55', '#F2A08F', '#7AB5E8', '#A8CDEE', '#22A06B', '#8FD3B0'];
const SUPPORT_STATUS: Record<SupportItem['status'], string> = {
  AVAILABLE: 'Available',
  RECEIVING: 'Being paid',
  RECEIVED: 'Received',
  UPCOMING: 'Upcoming',
  NOT_ELIGIBLE: 'Not eligible',
};
const FUND_TYPE: Record<SupportItem['fundType'], string> = {
  CASH: 'Flexible cash',
  RESTRICTED_CDA: 'Restricted · CDA',
  CPF: 'Restricted · CPF',
  VOUCHER: 'Restricted · voucher',
};

const SupportChip = ({ item }: { item: SupportItem }) => (
  <View style={styles.support}>
    <View style={styles.supportHead}>
      <Text style={styles.supportName}>🏛 {item.name}</Text>
      <Text style={styles.supportAmount}>{money(item.amount)}</Text>
    </View>
    <Text style={styles.supportMeta}>
      {SUPPORT_STATUS[item.status]} · {FUND_TYPE[item.fundType]}{item.nextDate ? ` · by ${monthLabel(item.nextDate)}` : ''}
    </Text>
    <Text style={stepStyles.note}>{item.action}</Text>
  </View>
);

const DECISION_BADGES: Record<Exclude<GoalInputStatus, 'CONFIRMED'>, { bg: string; fg: string; label: string }> = {
  NEEDS_DECISION: { bg: '#FDECEA', fg: COLORS.red, label: 'Suggested · review' },
  AWAITING_PARTNER: { bg: '#F3F1EC', fg: COLORS.muted, label: 'Waiting for partner' },
  OFF: { bg: '#F3F1EC', fg: COLORS.faint, label: 'Switched off' },
};

const GoalCard = ({ goal, goalsByKey, onPress }: { goal: FamilyGoal; goalsByKey: Record<string, FamilyGoal>; onPress: () => void }) => {
  const pill = goal.inputStatus === 'CONFIRMED' ? statusPill(goal.status) : DECISION_BADGES[goal.inputStatus];
  const progress = Math.min(1, goal.currentAmount / Math.max(1, goal.targetAmount));
  return (
    <TouchableOpacity style={[stepStyles.card, goal.inputStatus === 'NEEDS_DECISION' && styles.reviewCard, goal.inputStatus === 'OFF' && styles.offCard]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.goalHead}>
        <View style={styles.flex}>
          <Text style={stepStyles.cardTitle}>{goal.name}</Text>
          <Text style={stepStyles.cardSub}>Due {monthLabel(goal.deadline)} · {goal.basis}</Text>
        </View>
        <View style={[stepStyles.pill, { backgroundColor: pill.bg }]}><Text style={[stepStyles.pillText, { color: pill.fg }]}>{pill.label}</Text></View>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
      <View style={stepStyles.row}>
        <Text style={stepStyles.rowLabel}>{money(goal.currentAmount)} of {money(goal.targetAmount)}</Text>
        <Text style={stepStyles.rowValue}>{goal.shortfall > 0 ? `${money(goal.shortfall)} to go` : 'Fully funded'}</Text>
      </View>
      {goal.planned && goal.shortfall > 0 ? (
        <Text style={stepStyles.note}>Needs about {money(goal.requiredMonthlyAllocation)}/month if funded on its own.</Text>
      ) : null}
      {!goal.planned ? <Text style={styles.sourceNote}>{goal.source}</Text> : null}
      {goal.dependsOn.length ? (
        <View style={styles.dependsRow}>
          {goal.dependsOn.map((key) => (
            <View key={key} style={styles.dependsChip}>
              <Text style={styles.dependsText}>Depends on {goalsByKey[key]?.name.toLowerCase() || key}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {goal.inputStatus === 'CONFIRMED' ? goal.support.map((item) => <SupportChip key={item.id} item={item} />) : null}
      <Text style={[stepStyles.linkText, styles.topGap]}>
        {goal.inputStatus === 'NEEDS_DECISION' ? 'Review and confirm →' : goal.inputStatus === 'OFF' ? 'Switch back on →' : goal.inputStatus === 'AWAITING_PARTNER' ? 'Details' : 'Change →'}
      </Text>
    </TouchableOpacity>
  );
};

// Offline: apply decisions made in this session on top of the saved picture.
const applyLocalDecisions = (picture: FamilyPicture, decisions: Record<string, GoalInput>): FamilyPicture => ({
  ...picture,
  goals: picture.goals.map((goal) => {
    const input = decisions[goal.key];
    if (!input) return goal;
    return { ...goal, input, inputStatus: input.status, planned: input.status === 'CONFIRMED', status: input.status === 'CONFIRMED' ? 'ON_TRACK' : input.status };
  }),
});

/**
 * Our Family Picture (Understand): cash flow (#2), goals with deadlines and dependencies (#3),
 * and government support placed inside the goal it funds (#4).
 */
export const FamilyPictureStep: React.FC<{
  onNext: (picture: FamilyPicture) => void;
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  const [picture, setPicture] = useState<FamilyPicture | null>(null);
  const [offline, setOffline] = useState<boolean>(false);
  const [showIneligible, setShowIneligible] = useState<boolean>(false);
  const [editing, setEditing] = useState<GoalInput | null>(null);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const [localDecisions, setLocalDecisions] = useState<Record<string, GoalInput>>({});

  const load = (decisions = localDecisions) => {
    api.getPicture()
      .then(setPicture)
      .catch(() => {
        setOffline(true);
        setPicture(applyLocalDecisions(FALLBACK_PICTURE, decisions));
      });
  };

  useEffect(() => {
    load();
  }, []);

  const openGoal = (input: GoalInput | null) => {
    setEditing(input);
    setSheetOpen(true);
  };

  const handleSaved = (result: GoalSheetResult) => {
    setSheetOpen(false);
    const decisions = result.offline && result.input ? { ...localDecisions, [result.key]: result.input } : localDecisions;
    setLocalDecisions(decisions);
    load(decisions);
  };

  if (!picture) {
    return <View style={styles.loading}><ActivityIndicator color={COLORS.red} /></View>;
  }

  const { cashflow, support } = picture;
  const goals = [...picture.goals].sort((a, b) => {
    // Decided goals by deadline first, then those still waiting for a decision.
    const rank = (goal: FamilyGoal) => (goal.planned ? 0 : goal.inputStatus === 'NEEDS_DECISION' ? 1 : 2);
    return rank(a) - rank(b) || a.deadline.localeCompare(b.deadline);
  });
  const toDecide = picture.goals.filter((goal) => goal.inputStatus === 'NEEDS_DECISION').length;
  const decided = picture.goals.filter((goal) => goal.inputStatus === 'CONFIRMED' || goal.inputStatus === 'OFF').length;
  const goalsByKey = Object.fromEntries(picture.goals.map((goal) => [goal.key, goal]));
  const segments = [
    ...cashflow.groups.map((group, index) => ({ label: group.label, amount: group.monthlyAmount, color: GROUP_COLORS[index % GROUP_COLORS.length] })),
    { label: 'Free to plan', amount: cashflow.freeToPlan, color: COLORS.green },
  ];

  return (
    <View style={stepStyles.container}>
      <ScrollView contentContainerStyle={stepStyles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={stepStyles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={stepStyles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={stepStyles.eyebrow}>Understand</Text>
        <Text style={stepStyles.title}>Our family picture</Text>
        <Text style={stepStyles.subtitle}>
          What comes in, what is already committed, and what each goal needs.{offline ? ' Showing saved data while offline.' : ''}
        </Text>

        <View style={stepStyles.card}>
          <Text style={stepStyles.cardTitle}>Where the money goes each month</Text>
          <Text style={stepStyles.cardSub}>{cashflow.method}</Text>
          <View style={styles.stackBar}>
            {segments.map((segment) => (
              <View key={segment.label} style={{ flex: Math.max(0, segment.amount), backgroundColor: segment.color }} />
            ))}
          </View>
          <View style={[stepStyles.row, stepStyles.rowDivider]}>
            <Text style={stepStyles.rowLabel}>Take-home ({cashflow.income.map((item) => item.name.split(' ')[0]).join(' + ')})</Text>
            <Text style={stepStyles.rowValue}>{money(cashflow.totalTakeHome)}</Text>
          </View>
          {cashflow.groups.map((group, index) => (
            <View key={group.category} style={stepStyles.row}>
              <View style={[styles.dot, { backgroundColor: GROUP_COLORS[index % GROUP_COLORS.length] }]} />
              <View style={styles.flex}>
                <Text style={stepStyles.rowLabel}>{group.label}</Text>
                {group.benchmark ? <Text style={styles.benchmark}>Average household: {money(group.benchmark.amount)}</Text> : null}
              </View>
              <Text style={stepStyles.rowValue}>−{money(group.monthlyAmount)}</Text>
            </View>
          ))}
          <View style={[stepStyles.row, styles.freeRow]}>
            <Text style={styles.freeLabel}>Free to plan</Text>
            <Text style={styles.freeValue}>{money(cashflow.freeToPlan)}/month</Text>
          </View>
          <Text style={stepStyles.note}>
            {money(cashflow.essentialMonthly)} is essential; {money(cashflow.flexibleMonthly)} is flexible. Account balances are not treated as spendable income. Averages: {cashflow.groups.find((group) => group.benchmark)?.benchmark?.source || 'SingStat'}, for context only.
          </Text>
        </View>

        <Text style={[stepStyles.sectionLabel, styles.sectionGap]}>Our goals · {decided} of {decided + toDecide} decided</Text>
        <Text style={[stepStyles.note, styles.bottomGap]}>
          Each goal starts as a suggestion with its source. You choose the amounts and dates; nothing is planned until you confirm it. You&apos;ll put them in order of priority on the next step.
        </Text>
        {goals.map((goal) => <GoalCard key={goal.key} goal={goal} goalsByKey={goalsByKey} onPress={() => openGoal(goal.input)} />)}
        <TouchableOpacity style={[stepStyles.secondaryButton, styles.bottomGap]} onPress={() => openGoal(null)} activeOpacity={0.8}>
          <Text style={stepStyles.secondaryButtonText}>+ Add our own goal</Text>
        </TouchableOpacity>

        <View style={stepStyles.card}>
          <Text style={stepStyles.cardTitle}>Government support</Text>
          <View style={[stepStyles.row, styles.topGap]}>
            <Text style={stepStyles.rowLabel}>Still available or upcoming (estimate)</Text>
            <Text style={stepStyles.rowValue}>{money(support.totalGrantValue)}</Text>
          </View>
          <View style={stepStyles.row}>
            <Text style={stepStyles.rowLabel}>Restricted to specific uses</Text>
            <Text style={stepStyles.rowValue}>{money(support.restrictedValue)}</Text>
          </View>
          {support.upcomingDates.map((date) => (
            <View key={date.grantId} style={stepStyles.row}>
              <Text style={stepStyles.rowLabel}>📅 {date.name}</Text>
              <Text style={stepStyles.rowValue}>{monthLabel(date.date)}</Text>
            </View>
          ))}
          {support.notEligible.length ? (
            <TouchableOpacity onPress={() => setShowIneligible(!showIneligible)} activeOpacity={0.7}>
              <Text style={[stepStyles.linkText, styles.topGap]}>
                {showIneligible ? 'Hide' : 'Show'} {support.notEligible.length} schemes you don&apos;t qualify for
              </Text>
            </TouchableOpacity>
          ) : null}
          {showIneligible ? support.notEligible.map((item) => (
            <Text key={item.id} style={[stepStyles.note, styles.topGap]}>• {item.name}: {item.reason}</Text>
          )) : null}
          <Text style={[stepStyles.note, styles.topGap]}>{support.disclaimer}</Text>
        </View>

        <View style={[stepStyles.card, styles.insight]}>
          {picture.findings.slice(0, 1).map((finding) => <Text key={finding} style={styles.insightText}>{finding}</Text>)}
        </View>
      </ScrollView>

      <GoalEditSheet visible={sheetOpen} goal={editing} onClose={() => setSheetOpen(false)} onSaved={handleSaved} />

      <View style={stepStyles.footer}>
        <TouchableOpacity
          style={[stepStyles.primaryButton, toDecide > 0 && stepStyles.primaryButtonDisabled]}
          onPress={() => onNext(picture)}
          disabled={toDecide > 0}
          activeOpacity={0.85}
        >
          <Text style={stepStyles.primaryButtonText}>
            {toDecide > 0 ? `Review ${toDecide} suggested goal${toDecide === 1 ? '' : 's'} first` : 'Build our plan'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topGap: { marginTop: 8 },
  sectionGap: { marginTop: 6, marginBottom: 4 },
  bottomGap: { marginBottom: 10 },
  reviewCard: { borderColor: '#F3C9C1', borderStyle: 'dashed' },
  offCard: { opacity: 0.6 },
  stackBar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginVertical: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  benchmark: { fontSize: 10, color: COLORS.faint, marginTop: 1 },
  freeRow: { marginTop: 4, backgroundColor: COLORS.greenBg, borderRadius: 10, paddingHorizontal: 10 },
  freeLabel: { fontSize: 13, fontWeight: '900', color: COLORS.green, flex: 1 },
  freeValue: { fontSize: 15, fontWeight: '900', color: COLORS.green },
  goalHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#F0EDE8', marginTop: 12, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.red },
  dependsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  dependsChip: { backgroundColor: '#F3F1EC', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  dependsText: { fontSize: 10, fontWeight: '700', color: COLORS.muted },
  support: { marginTop: 10, backgroundColor: '#F7FAFF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#DCE8F7' },
  supportHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  supportName: { fontSize: 12, fontWeight: '800', color: COLORS.ink, flex: 1 },
  supportAmount: { fontSize: 12, fontWeight: '900', color: '#1F5FA8' },
  sourceNote: { fontSize: 11, lineHeight: 16, color: '#1F5FA8', marginTop: 6 },
  supportMeta: { fontSize: 10, fontWeight: '700', color: '#1F5FA8', marginVertical: 3 },
  insight: { backgroundColor: '#FFF8F6', borderColor: '#F6D5CF' },
  insightText: { fontSize: 12, lineHeight: 18, color: COLORS.ink },
});

export default FamilyPictureStep;
