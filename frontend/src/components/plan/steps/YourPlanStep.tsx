import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import type { OwnlyPlan, PlanPreferences, PlanRouteId, PredictionScenario } from '../types';

const ROUTE_LABELS: Record<PlanRouteId, { title: string; subtitle: string; icon: string }> = {
  housing: { title: 'Home & mortgage', subtitle: 'Mortgage-payment safety reserve', icon: '🏠' },
  education: { title: 'Children’s education', subtitle: 'Education funding before age 18', icon: '🎓' },
  wealth: { title: 'Retirement & wealth', subtitle: 'CPF, investments and liquid wealth', icon: '📈' },
};

const SCENARIOS: Array<{ id: PredictionScenario; label: string; rate: string }> = [
  { id: 'conservative', label: 'Conservative', rate: '2.5%' },
  { id: 'balanced', label: 'Balanced', rate: '4.5%' },
  { id: 'growth', label: 'Growth', rate: '6.5%' },
];

export const YourPlanStep: React.FC<{
  plan: OwnlyPlan;
  saving: boolean;
  onBack: () => void;
  onConfirm: (preferences: PlanPreferences) => void;
}> = ({ plan, saving, onBack, onConfirm }) => {
  const [priorities, setPriorities] = useState<PlanRouteId[]>(plan.priorities);
  const [split, setSplit] = useState<Record<PlanRouteId, number>>(() => ({
    housing: plan.routes.find((route) => route.key === 'housing')?.percentage || 50,
    education: plan.routes.find((route) => route.key === 'education')?.percentage || 30,
    wealth: plan.routes.find((route) => route.key === 'wealth')?.percentage || 20,
  }));
  const [protectionEnabled, setProtectionEnabled] = useState(plan.protection.enabled);
  const [protectionTier, setProtectionTier] = useState<'essential' | 'enhanced'>(plan.protection.tier);
  const [predictionScenario, setPredictionScenario] = useState<PredictionScenario>(plan.predictionScenario);
  const [timeline, setTimeline] = useState<'5' | '10'>(String(plan.timelineYears) === '10' ? '10' : '5');

  const monthlyPremium = protectionEnabled ? (protectionTier === 'enhanced' ? 52 : 28) : 0;
  const investable = Math.max(0, plan.monthlySurplus - monthlyPremium);
  const scenarioRate = predictionScenario === 'growth' ? 0.065 : predictionScenario === 'conservative' ? 0.025 : 0.045;
  const projected = useMemo(() => {
    const months = Number(timeline) * 12;
    const monthlyRate = scenarioRate / 12;
    return Math.round(investable * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
  }, [investable, scenarioRate, timeline]);
  const goalPreviews = useMemo(() => (plan.goalOutlooks || []).map((goal) => {
    const monthlyContribution = Math.round(investable * split[goal.key] / 100);
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setFullYear(targetDate.getFullYear() + Number(timeline));
    const months = Math.max(1, (targetDate.getFullYear() - now.getFullYear()) * 12 + targetDate.getMonth() - now.getMonth());
    const annualRate = goal.key === 'housing' ? 0.015 : scenarioRate;
    const monthlyRate = annualRate / 12;
    const rawProjected = goal.currentAmount * Math.pow(1 + monthlyRate, months)
      + monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const projectedAtTarget = Number.isFinite(rawProjected) ? Math.round(rawProjected) : goal.currentAmount + monthlyContribution * months;
    const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    const rawRequired = (goal.targetAmount - goal.currentAmount * Math.pow(1 + monthlyRate, months)) / factor;
    const requiredMonthly = Number.isFinite(rawRequired) ? Math.max(0, Math.ceil(rawRequired)) : 0;
    const onTrack = projectedAtTarget >= goal.targetAmount;
    return { ...goal, targetDate: targetDate.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' }), monthlyContribution, projectedAtTarget, requiredMonthly, onTrack };
  }), [investable, plan.goalOutlooks, scenarioRate, split, timeline]);
  const goalsOnTrack = goalPreviews.filter((goal) => goal.onTrack).length;
  const minimumGoalFunding = goalPreviews.reduce((sum, goal) => sum + goal.requiredMonthly, 0);
  const flexibleCash = Math.max(0, investable - minimumGoalFunding);
  const monthlyFundingGap = Math.max(0, minimumGoalFunding - investable);

  const movePriority = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= priorities.length) return;
    const next = [...priorities];
    [next[index], next[target]] = [next[target], next[index]];
    setPriorities(next);
  };

  const adjustSplit = (key: PlanRouteId, amount: number) => {
    const donorOrder = priorities.filter((item) => item !== key).reverse();
    const donor = donorOrder.find((item) => amount < 0 || split[item] >= amount + 10);
    if (!donor) return;
    if (split[key] + amount < 10 || split[key] + amount > 80) return;
    setSplit((current) => ({ ...current, [key]: current[key] + amount, [donor]: current[donor] - amount }));
  };

  const confirm = () => onConfirm({
    priorities,
    split: {
      housing: split.housing / 100,
      education: split.education / 100,
      wealth: split.wealth / 100,
    },
    protection: { enabled: protectionEnabled, tier: protectionTier },
    predictionScenario,
    timeline,
    mode: plan.autonomyMode || '24H_WINDOW',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={saving}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Your Plan</Text>
          <Text style={styles.subtitle}>Review the plan before activating it.</Text>
        </View>
        <View style={styles.readyPill}><Text style={styles.readyText}>AI ready</Text></View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>MONTHLY HOUSEHOLD SURPLUS</Text>
          <Text style={styles.heroValue}>S${plan.monthlySurplus.toLocaleString()}</Text>
          <Text style={styles.heroDetail}>S${investable.toLocaleString()} routed · S${monthlyPremium}/mo protection</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Goal priority</Text>
          <Text style={styles.cardHint}>Move the goals into the order your family cares about most.</Text>
          {priorities.map((key, index) => (
            <View key={key} style={[styles.priorityRow, index === 0 && styles.priorityRowTop]}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Text style={styles.routeIcon}>{ROUTE_LABELS[key].icon}</Text>
              <View style={styles.routeCopy}>
                <Text style={styles.routeTitle}>{ROUTE_LABELS[key].title}</Text>
                <Text style={styles.routeSubtitle}>{ROUTE_LABELS[key].subtitle}</Text>
              </View>
              <View>
                <TouchableOpacity disabled={index === 0} onPress={() => movePriority(index, -1)}><Text style={[styles.arrow, index === 0 && styles.disabled]}>▲</Text></TouchableOpacity>
                <TouchableOpacity disabled={index === priorities.length - 1} onPress={() => movePriority(index, 1)}><Text style={[styles.arrow, index === priorities.length - 1 && styles.disabled]}>▼</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly contributions</Text>
          <Text style={styles.cardHint}>Allocations always add up to 100% of your investable surplus.</Text>
          {priorities.map((key) => (
            <View key={key} style={styles.contributionRow}>
              <View style={styles.routeCopy}>
                <Text style={styles.routeTitle}>{ROUTE_LABELS[key].title}</Text>
                <Text style={styles.money}>S${Math.round(investable * split[key] / 100)}/mo</Text>
              </View>
              <TouchableOpacity style={styles.stepButton} onPress={() => adjustSplit(key, -5)}><Text style={styles.stepText}>−</Text></TouchableOpacity>
              <Text style={styles.percent}>{split[key]}%</Text>
              <TouchableOpacity style={styles.stepButton} onPress={() => adjustSplit(key, 5)}><Text style={styles.stepText}>+</Text></TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.routeCopy}>
              <Text style={styles.cardTitle}>Asset protection</Text>
              <Text style={styles.cardHint}>Close the household's S$160K protection gap.</Text>
            </View>
            <Switch value={protectionEnabled} onValueChange={setProtectionEnabled} trackColor={{ true: '#D81E05' }} />
          </View>
          {protectionEnabled && (
            <View style={styles.choiceRow}>
              {(['essential', 'enhanced'] as const).map((tier) => (
                <TouchableOpacity key={tier} style={[styles.choice, protectionTier === tier && styles.choiceActive]} onPress={() => setProtectionTier(tier)}>
                  <Text style={[styles.choiceTitle, protectionTier === tier && styles.choiceTitleActive]}>{tier === 'essential' ? 'Essential' : 'Enhanced'}</Text>
                  <Text style={styles.choiceDetail}>{tier === 'essential' ? 'S$160K · S$28/mo' : 'S$300K · S$52/mo'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Can we reach our goals?</Text>
          <Text style={styles.cardHint}>Choose when you want to reach the goals. A 10-year horizon lowers the minimum monthly amount and eases near-term cash-flow pressure. Home cash uses 1.5%; invested goals use the selected scenario.</Text>
          <View style={styles.choiceRow}>
            {SCENARIOS.map((scenario) => (
              <TouchableOpacity key={scenario.id} style={[styles.choice, predictionScenario === scenario.id && styles.choiceActive]} onPress={() => setPredictionScenario(scenario.id)}>
                <Text style={[styles.choiceTitle, predictionScenario === scenario.id && styles.choiceTitleActive]}>{scenario.label}</Text>
                <Text style={styles.choiceDetail}>{scenario.rate} p.a.</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.horizonRow}>
            {(['5', '10'] as const).map((years) => (
              <TouchableOpacity key={years} style={[styles.horizonButton, timeline === years && styles.horizonActive]} onPress={() => setTimeline(years)}>
                <Text style={[styles.horizonText, timeline === years && styles.horizonTextActive]}>{years} years</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.projectionBox}>
            <Text style={styles.projectionLabel}>GOAL OUTLOOK</Text>
            <Text style={styles.projectionValue}>{goalsOnTrack}/{goalPreviews.length} on track</Text>
            <Text style={styles.projectionFine}>Minimum across all goals: S${minimumGoalFunding.toLocaleString()}/month. {monthlyFundingGap > 0 ? `That is S$${monthlyFundingGap.toLocaleString()} above today’s available surplus.` : `This leaves S$${flexibleCash.toLocaleString()}/month flexible.`}</Text>
            <Text style={styles.projectionFine}>Projected family pot if the full surplus remains routed: S${projected.toLocaleString()}. Returns are not guaranteed.</Text>
          </View>
          {goalPreviews.map((goal) => (
            <View style={styles.forecastRow} key={goal.key}>
              <View style={styles.forecastHeader}>
                <Text style={styles.forecastTitle}>{goal.label}</Text>
                <Text style={[styles.forecastStatus, goal.onTrack ? styles.forecastGood : styles.forecastRisk]}>{goal.onTrack ? 'ON TRACK' : 'AT RISK'}</Text>
              </View>
              <Text style={styles.forecastAmounts}>S${goal.currentAmount.toLocaleString()} now → S${goal.projectedAtTarget.toLocaleString()} by {goal.targetDate}</Text>
              <Text style={styles.forecastTarget}>Target S${goal.targetAmount.toLocaleString()} · currently allocated S${goal.monthlyContribution.toLocaleString()}/month</Text>
              <Text style={styles.forecastAction}>{goal.onTrack ? `Minimum needed is about S$${goal.requiredMonthly.toLocaleString()}/month. You can reduce the allocation to free up cash flow.` : `Minimum needed is about S$${goal.requiredMonthly.toLocaleString()}/month to close the gap.`}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>This is an AI-generated planning illustration, not financial advice. You remain in control and can edit the plan later.</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.confirmButton, saving && styles.disabledButton]} onPress={confirm} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmText}>Confirm & activate plan</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3EF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, gap: 12 },
  backButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
  backText: { color: '#D81E05', fontSize: 18, fontWeight: '800' },
  headerCopy: { flex: 1 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '900', color: '#1A1A1A' },
  subtitle: { fontSize: 12, lineHeight: 17, color: '#767676', marginTop: 1 },
  readyPill: { backgroundColor: '#E6F4EA', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  readyText: { color: '#16803A', fontSize: 10, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  hero: { backgroundColor: '#1A1A1A', borderRadius: 22, padding: 20, marginBottom: 14 },
  heroEyebrow: { color: '#B9B9B9', fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  heroValue: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 3 },
  heroDetail: { color: '#D8D8D8', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E7E2DA' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  cardHint: { fontSize: 11, lineHeight: 16, color: '#767676', marginTop: 2, marginBottom: 10 },
  priorityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 9 },
  priorityRowTop: { borderTopWidth: 0 },
  rank: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#D81E05', color: '#FFFFFF', textAlign: 'center', lineHeight: 24, fontSize: 11, fontWeight: '900' },
  routeIcon: { fontSize: 18 },
  routeCopy: { flex: 1 },
  routeTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  routeSubtitle: { fontSize: 10, color: '#888888', marginTop: 2 },
  arrow: { color: '#666666', fontSize: 11, paddingHorizontal: 8, paddingVertical: 3 },
  disabled: { opacity: 0.2 },
  contributionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 7 },
  money: { fontSize: 11, color: '#D81E05', fontWeight: '700', marginTop: 2 },
  stepButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F1ED', alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, color: '#1A1A1A', lineHeight: 20 },
  percent: { width: 36, textAlign: 'center', fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  choiceRow: { flexDirection: 'row', gap: 7 },
  choice: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 11, paddingVertical: 9, paddingHorizontal: 7, alignItems: 'center' },
  choiceActive: { borderColor: '#D81E05', backgroundColor: '#FFF3F1' },
  choiceTitle: { color: '#555555', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  choiceTitleActive: { color: '#D81E05' },
  choiceDetail: { color: '#888888', fontSize: 9, marginTop: 2, textAlign: 'center' },
  horizonRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  horizonButton: { flex: 1, borderRadius: 10, backgroundColor: '#F3F1ED', paddingVertical: 9, alignItems: 'center' },
  horizonActive: { backgroundColor: '#1A1A1A' },
  horizonText: { color: '#666666', fontSize: 11, fontWeight: '700' },
  horizonTextActive: { color: '#FFFFFF' },
  projectionBox: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: '#F4FAF5' },
  projectionLabel: { color: '#50705A', fontSize: 10, fontWeight: '700' },
  projectionValue: { color: '#16803A', fontSize: 22, fontWeight: '900', marginTop: 2 },
  projectionFine: { color: '#718078', fontSize: 9, lineHeight: 13, marginTop: 2 },
  forecastRow: { borderTopWidth: 1, borderTopColor: '#EEEAE4', paddingTop: 11, marginTop: 11 },
  forecastHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  forecastTitle: { flex: 1, color: '#242220', fontSize: 12, fontWeight: '800' },
  forecastStatus: { fontSize: 8, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  forecastGood: { color: '#16803A', backgroundColor: '#E9F8EE' },
  forecastRisk: { color: '#A45C00', backgroundColor: '#FFF4DD' },
  forecastAmounts: { color: '#4D4944', fontSize: 10, fontWeight: '700', marginTop: 6 },
  forecastTarget: { color: '#817B74', fontSize: 9, marginTop: 3 },
  forecastAction: { color: '#D81E05', fontSize: 9, fontWeight: '700', marginTop: 5 },
  disclaimer: { fontSize: 10, color: '#888888', lineHeight: 15, textAlign: 'center', paddingHorizontal: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: '#F5F3EF', borderTopWidth: 1, borderTopColor: '#E9E5DE' },
  confirmButton: { backgroundColor: '#D81E05', borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.65 },
});

export default YourPlanStep;
