import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../../services/api';
import type { PlanGoalOutcome, PlanOption } from '../../services/api';
import { FALLBACK_PLAN_OPTIONS } from '../../constants/planningFallback';
import { COLORS, money, monthLabel, statusPill } from './stepStyles';
import { GoalIcon } from './GoalIcon';

const GOAL_COLORS = ['#D81E05', '#E86A55', '#7AB5E8', '#22A06B', '#F2A08F', '#A8CDEE'];
const FREE_COLOR = '#E3E0DA';

/**
 * The agreed plan, month by month: where the family pot goes, goal by goal in priority order,
 * and what each person's own money puts into their personal goals.
 */
export const MonthlyPlanCard: React.FC<{ onEditPlan?: () => void }> = ({ onEditPlan }) => {
  const [plan, setPlan] = useState<PlanOption | null>(null);

  useEffect(() => {
    api.getFamilyPlan()
      .then((state) => setPlan(state.plan))
      .catch(() => setPlan(FALLBACK_PLAN_OPTIONS.plans.find((item) => item.id === FALLBACK_PLAN_OPTIONS.recommendedPlanId) || FALLBACK_PLAN_OPTIONS.plans[0]));
  }, []);

  if (!plan) return null;

  const shared = (plan.priorityOrder || [])
    .map((key) => plan.goals.find((goal) => goal.key === key && goal.owner === 'household'))
    .filter(Boolean) as PlanGoalOutcome[];
  const personal = plan.goals.filter((goal) => goal.owner !== 'household' && goal.monthlyNow > 0);
  const pot = plan.pots?.find((item) => item.id === 'household');
  const potTotal = pot?.available || shared.reduce((sum, goal) => sum + goal.monthlyNow, 0) + (pot?.free || 0);
  const free = pot?.free ?? 0;
  const share = (amount: number) => (potTotal ? Math.round(amount / potTotal * 100) : 0);

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <View style={styles.flex}>
          <Text style={styles.title}>Monthly contribution plan</Text>
          <Text style={styles.sub}>Family pot {money(potTotal)}/month · funded in this order</Text>
        </View>
        {onEditPlan ? (
          <TouchableOpacity onPress={onEditPlan}><Text style={styles.link}>Change</Text></TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.bar}>
        {shared.filter((goal) => goal.monthlyNow > 0).map((goal, index) => (
          <View key={goal.key} style={{ flex: goal.monthlyNow, backgroundColor: GOAL_COLORS[index % GOAL_COLORS.length] }} />
        ))}
        {free > 0 ? <View style={{ flex: free, backgroundColor: FREE_COLOR }} /> : null}
      </View>

      {shared.map((goal, index) => {
        const pill = statusPill(goal.status);
        return (
          <View key={goal.key} style={[styles.row, index > 0 && styles.divider]}>
            <View style={[styles.dot, { backgroundColor: GOAL_COLORS[index % GOAL_COLORS.length] }]} />
            <Text style={styles.rank}>{index + 1}</Text>
            <GoalIcon group={goal.group} size={26} />
            <View style={styles.flex}>
              <Text style={styles.name}>{goal.name}</Text>
              <Text style={styles.sub}>Done {monthLabel(goal.completesBy)}</Text>
            </View>
            <View style={styles.amountCol}>
              <Text style={styles.amount}>{money(goal.monthlyNow)} <Text style={styles.percent}>{share(goal.monthlyNow)}%</Text></Text>
              <View style={[styles.pill, { backgroundColor: pill.bg }]}><Text style={[styles.pillText, { color: pill.fg }]}>{pill.label}</Text></View>
            </View>
          </View>
        );
      })}
      <View style={[styles.row, styles.divider]}>
        <View style={[styles.dot, { backgroundColor: FREE_COLOR }]} />
        <Text style={[styles.sub, styles.flex]}>Kept free</Text>
        <Text style={styles.amount}>{money(free)} <Text style={styles.percent}>{share(free)}%</Text></Text>
      </View>

      {personal.length ? (
        <>
          <Text style={styles.sectionLabel}>From each person&apos;s own money</Text>
          {personal.map((goal) => (
            <View key={goal.key} style={styles.row}>
              <GoalIcon group={goal.group} size={26} />
              <Text style={[styles.name, styles.flex]}>{goal.name}</Text>
              <Text style={styles.amount}>{money(goal.monthlyNow)}/mo</Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  sub: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  link: { fontSize: 13, fontWeight: '800', color: COLORS.red },
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2, marginTop: 12, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9 },
  divider: { borderTopWidth: 1, borderTopColor: '#F2F2F2' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rank: { width: 14, fontSize: 11, fontWeight: '900', color: COLORS.faint, textAlign: 'center' },
  name: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  amountCol: { alignItems: 'flex-end', gap: 3 },
  amount: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  percent: { fontSize: 11, fontWeight: '700', color: COLORS.faint },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 10, fontWeight: '800' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#767676', textTransform: 'uppercase', marginTop: 12 },
});

export default MonthlyPlanCard;
