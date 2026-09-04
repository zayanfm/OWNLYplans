import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import type { OwnlyPlan, PlanMode, PlanPreferences, PlanRouteId, PredictionScenario } from '../types';

const ROUTE_LABELS: Record<PlanRouteId, { title: string; subtitle: string; icon: string }> = {
  housing: { title: 'BTO & home', subtitle: 'Downpayment and renovation reserve', icon: '🏠' },
  education: { title: 'Child & education', subtitle: 'CDA matching and education fund', icon: '👶' },
  wealth: { title: 'Liquid wealth', subtitle: 'High-yield cash and investments', icon: '📈' },
};

const SCENARIOS: Array<{ id: PredictionScenario; label: string; rate: string }> = [
  { id: 'conservative', label: 'Conservative', rate: '2.5%' },
  { id: 'balanced', label: 'Balanced', rate: '4.5%' },
  { id: 'growth', label: 'Growth', rate: '6.5%' },
];

const MODES: Array<{ id: PlanMode; label: string }> = [
  { id: 'NOTIFY_AND_WAIT', label: 'Confirm each' },
  { id: '24H_WINDOW', label: '24h window' },
  { id: 'FULL_AUTO', label: 'Full auto' },
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
  const [mode, setMode] = useState<PlanMode>(plan.autonomyMode);

  const monthlyPremium = protectionEnabled ? (protectionTier === 'enhanced' ? 52 : 28) : 0;
  const investable = Math.max(0, plan.monthlySurplus - monthlyPremium);
  const scenarioRate = predictionScenario === 'growth' ? 0.065 : predictionScenario === 'conservative' ? 0.025 : 0.045;
  const projected = useMemo(() => {
    const months = Number(timeline) * 12;
    const monthlyRate = scenarioRate / 12;
    return Math.round(investable * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
  }, [investable, scenarioRate, timeline]);

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
    mode,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={saving}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Your Plan</Text>
          <Text style={styles.subtitle}>Review and shape the plan before activating it.</Text>
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
          <Text style={styles.cardTitle}>Goal prediction</Text>
          <Text style={styles.cardHint}>Choose the return assumption used for this illustration.</Text>
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
            <Text style={styles.projectionLabel}>Projected family pot</Text>
            <Text style={styles.projectionValue}>S${projected.toLocaleString()}</Text>
            <Text style={styles.projectionFine}>Illustration based on {Math.round(scenarioRate * 1000) / 10}% p.a.; returns are not guaranteed.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How OWNLYplan acts</Text>
          <View style={styles.choiceRow}>
            {MODES.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.choice, mode === item.id && styles.choiceActive]} onPress={() => setMode(item.id)}>
                <Text style={[styles.choiceTitle, mode === item.id && styles.choiceTitleActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  disclaimer: { fontSize: 10, color: '#888888', lineHeight: 15, textAlign: 'center', paddingHorizontal: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: '#F5F3EF', borderTopWidth: 1, borderTopColor: '#E9E5DE' },
  confirmButton: { backgroundColor: '#D81E05', borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.65 },
});

export default YourPlanStep;
