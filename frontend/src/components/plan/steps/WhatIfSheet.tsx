import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Switch, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import type { PlanOptionId, ScenarioLevers, ScenarioResult } from '../../../services/api';
import { COLORS, money, monthLabel, statusPill, stepStyles } from '../stepStyles';
import { Stepper, stepperStyles } from '../Stepper';

const DEFAULT_LEVERS: ScenarioLevers = { extraChild: false, incomeChangePct: 0, schoolFeesMonthly: 0, extraSavingsMonthly: 0 };

/**
 * AI What-if Scenario Simulator (#6). Preset levers are recalculated by the planning engine;
 * nothing here is generated, so the before/after numbers match the plan exactly.
 */
export const WhatIfSheet: React.FC<{
  visible: boolean;
  planId?: PlanOptionId;
  onClose: () => void;
}> = ({ visible, planId, onClose }) => {
  const [levers, setLevers] = useState<ScenarioLevers>(DEFAULT_LEVERS);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<ScenarioLevers>) => {
    setLevers({ ...levers, ...patch });
    setResult(null);
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await api.simulateScenario(levers, planId));
    } catch {
      setError('What-if needs the planning engine. Start the backend and try again.');
    } finally {
      setLoading(false);
    }
  };

  const changed = result?.goals.filter((goal) => goal.isNew || !goal.before
    || goal.before.monthlyNow !== goal.after.monthlyNow || goal.before.status !== goal.after.status) || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={stepStyles.title}>What if…</Text>
            <Text style={stepStyles.subtitle}>Change one thing and see the effect on every goal at once.</Text>

            <View style={stepperStyles.row}>
              <Text style={stepperStyles.label}>Another child</Text>
              <Switch value={levers.extraChild} onValueChange={(extraChild) => update({ extraChild })} trackColor={{ true: COLORS.red }} />
            </View>
            <Stepper label="Household income" value={levers.incomeChangePct} step={5} min={-30} max={20}
              display={`${levers.incomeChangePct > 0 ? '+' : ''}${levers.incomeChangePct}%`} onChange={(incomeChangePct) => update({ incomeChangePct })} />
            <Stepper label="Higher school fees" value={levers.schoolFeesMonthly} step={100} min={0} max={1000}
              display={`${money(levers.schoolFeesMonthly)}/mo`} onChange={(schoolFeesMonthly) => update({ schoolFeesMonthly })} />
            <Stepper label="Save more (from lifestyle)" value={levers.extraSavingsMonthly} step={50} min={0} max={700}
              display={`${money(levers.extraSavingsMonthly)}/mo`} onChange={(extraSavingsMonthly) => update({ extraSavingsMonthly })} />

            <TouchableOpacity style={[stepStyles.primaryButton, styles.topGap]} onPress={run} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={stepStyles.primaryButtonText}>See the impact</Text>}
            </TouchableOpacity>
            {error ? <Text style={[stepStyles.note, styles.topGap]}>{error}</Text> : null}

            {result ? (
              <View style={[stepStyles.card, styles.topGap]}>
                <View style={stepStyles.row}>
                  <Text style={stepStyles.rowLabel}>Monthly surplus</Text>
                  <Text style={stepStyles.rowValue}>{money(result.surplusBefore)} → {money(result.surplusAfter)}</Text>
                </View>
                {result.summary.map((line) => <Text key={line} style={styles.summaryLine}>{line}</Text>)}
                {changed.map((goal) => {
                  const pill = statusPill(goal.after.status);
                  return (
                    <View key={goal.key} style={[stepStyles.row, stepStyles.rowDivider]}>
                      <View style={styles.flex}>
                        <Text style={styles.goalName}>{goal.isNew ? '＋ ' : ''}{goal.name}</Text>
                        <Text style={stepStyles.cardSub}>
                          {goal.before ? `${money(goal.before.monthlyNow)} → ` : ''}{money(goal.after.monthlyNow)}/mo · done {monthLabel(goal.after.completesBy)}
                        </Text>
                      </View>
                      <View style={[stepStyles.pill, { backgroundColor: pill.bg }]}><Text style={[stepStyles.pillText, { color: pill.fg }]}>{pill.label}</Text></View>
                    </View>
                  );
                })}
                <Text style={[stepStyles.note, styles.topGap]}>Calculated by the planning engine. Returns are assumptions, not guarantees.</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[stepStyles.secondaryButton, styles.topGap]} onPress={() => { setLevers(DEFAULT_LEVERS); setResult(null); onClose(); }}>
              <Text style={stepStyles.secondaryButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topGap: { marginTop: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.page, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '88%' },
  summaryLine: { fontSize: 12, lineHeight: 18, color: COLORS.ink, marginTop: 4 },
  goalName: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
});

export default WhatIfSheet;
