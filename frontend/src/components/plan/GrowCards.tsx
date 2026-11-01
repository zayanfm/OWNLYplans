import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import type { GrowOverview } from '../../services/api';
import { FALLBACK_GROW } from '../../constants/planningFallback';
import { COLORS, money, stepStyles } from './stepStyles';

/**
 * Cockpit (Grow): the savings-to-investment handoff (#9) and the advisory pathway that leads
 * into the RM briefing (#11, #12).
 */
export const GrowCards: React.FC<{ onTalkToAdviser: () => void }> = ({ onTalkToAdviser }) => {
  const [overview, setOverview] = useState<GrowOverview | null>(null);
  const [investConfirming, setInvestConfirming] = useState<boolean>(false);
  const [handedOff, setHandedOff] = useState<boolean>(false);

  useEffect(() => {
    api.getGrowOverview().then(setOverview).catch(() => setOverview(FALLBACK_GROW));
  }, []);

  if (!overview) {
    return <ActivityIndicator color={COLORS.red} style={styles.loader} />;
  }

  const { readiness, advisory } = overview;

  return (
    <View>
      <View style={stepStyles.card}>
        <Text style={stepStyles.sectionLabel}>Ready to grow</Text>
        <Text style={stepStyles.cardTitle}>
          {readiness.ready ? `Invest ${money(readiness.totalMonthly)}/month for long-term goals` : 'Not ready to invest yet'}
        </Text>
        {readiness.checks.map((check) => (
          <Text key={check.id} style={styles.check}>{check.passed ? '✓' : '○'} {check.label} <Text style={stepStyles.note}>({check.detail})</Text></Text>
        ))}
        {readiness.suggestions.map((item) => (
          <View key={item.goalKey} style={stepStyles.row}>
            <Text style={stepStyles.rowLabel}>{item.goalName} → {item.product}</Text>
            <Text style={stepStyles.rowValue}>{money(item.monthlyAmount)}/mo</Text>
          </View>
        ))}
        {readiness.ready && readiness.handoff ? (
          handedOff ? (
            <Text style={[styles.decisionText, styles.topGap]}>✓ Sent to {readiness.handoff.destination}. {readiness.handoff.note}</Text>
          ) : investConfirming ? (
            <View style={styles.topGap}>
              <Text style={stepStyles.note}>
                Your BTO fund and emergency buffer stay in cash. {readiness.handoff.note}
              </Text>
              <TouchableOpacity style={[stepStyles.primaryButton, styles.topGap]} onPress={() => setHandedOff(true)}>
                <Text style={stepStyles.primaryButtonText}>{readiness.handoff.label}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[stepStyles.secondaryButton, styles.topGap]} onPress={() => setInvestConfirming(true)}>
              <Text style={stepStyles.secondaryButtonText}>Review and confirm</Text>
            </TouchableOpacity>
          )
        ) : (
          <Text style={[stepStyles.note, styles.topGap]}>{readiness.blockedReason}</Text>
        )}
      </View>

      <View style={stepStyles.card}>
        <Text style={stepStyles.sectionLabel}>Advice</Text>
        <Text style={stepStyles.cardTitle}>{advisory.title}</Text>
        <Text style={stepStyles.cardSub}>{advisory.reason}</Text>
        {advisory.flags.map((flag) => <Text key={flag.id} style={styles.check}>• {flag.label}</Text>)}
        <TouchableOpacity style={[stepStyles.primaryButton, styles.topGap]} onPress={onTalkToAdviser} activeOpacity={0.85}>
          <Text style={stepStyles.primaryButtonText}>Share our plan with an adviser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loader: { marginVertical: 16 },
  topGap: { marginTop: 10 },
  decisionText: { fontSize: 12, lineHeight: 18, fontWeight: '700', color: COLORS.green },
  check: { fontSize: 12, lineHeight: 18, color: COLORS.ink, marginTop: 4 },
});

export default GrowCards;
