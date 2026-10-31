import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import type { GrowOverview, PlanReview } from '../../services/api';
import { FALLBACK_GROW } from '../../constants/planningFallback';
import { COLORS, money, monthLabel, statusPill, stepStyles } from './stepStyles';

const DECISION_TEXT: Record<'accept' | 'revise' | 'reject', string> = {
  accept: 'Plan updated. We will keep watching for changes.',
  revise: 'Noted. Pick what to trim from lifestyle spending in the What-if sheet.',
  reject: 'Kept as is. We will check again next month.',
};

/**
 * Cockpit (Grow): the family's ongoing cards — a plan check-in (#10), the savings-to-investment
 * handoff (#9), and the advisory pathway that leads into the RM briefing (#11, #12).
 */
export const GrowCards: React.FC<{ onTalkToAdviser: () => void }> = ({ onTalkToAdviser }) => {
  const [overview, setOverview] = useState<GrowOverview | null>(null);
  const [review, setReview] = useState<PlanReview | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [reviewDecision, setReviewDecision] = useState<'accept' | 'revise' | 'reject' | null>(null);
  const [investConfirming, setInvestConfirming] = useState<boolean>(false);
  const [handedOff, setHandedOff] = useState<boolean>(false);

  useEffect(() => {
    api.getGrowOverview().then(setOverview).catch(() => setOverview(FALLBACK_GROW));
  }, []);

  const runCheckIn = async () => {
    setChecking(true);
    setReviewDecision(null);
    try {
      setReview((await api.simulateReview()).review);
    } catch {
      setReview(null);
    } finally {
      setChecking(false);
    }
  };

  const decide = async (decision: 'accept' | 'revise' | 'reject') => {
    setReviewDecision(decision);
    if (!review) return;
    try {
      await api.respondToReview(review.id, decision);
    } catch {
      // Offline: the decision is shown locally.
    }
  };

  if (!overview) {
    return <ActivityIndicator color={COLORS.red} style={styles.loader} />;
  }

  const { readiness, advisory } = overview;

  return (
    <View>
      <View style={[stepStyles.card, styles.checkInCard]}>
        <Text style={stepStyles.sectionLabel}>Check-in</Text>
        {!review ? (
          <>
            <Text style={stepStyles.cardTitle}>Your plan is up to date</Text>
            <Text style={stepStyles.cardSub}>OWNLYplan re-checks the plan when spending, income or goals change.</Text>
            <TouchableOpacity style={[stepStyles.secondaryButton, styles.topGap]} onPress={runCheckIn} disabled={checking}>
              {checking ? <ActivityIndicator color={COLORS.red} /> : <Text style={stepStyles.secondaryButtonText}>Demo: simulate 3 months later</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={stepStyles.cardTitle}>Something changed: review?</Text>
            <Text style={stepStyles.cardSub}>{monthLabel(review.detectedFor)} · {review.trigger.description}</Text>
            <View style={[stepStyles.row, styles.topGap]}>
              <Text style={stepStyles.rowLabel}>Monthly surplus</Text>
              <Text style={stepStyles.rowValue}>{money(review.surplusBefore)} → {money(review.surplusAfter)}</Text>
            </View>
            {review.changes.map((goal) => {
              const pill = statusPill(goal.after.status);
              return (
                <View key={goal.key} style={stepStyles.row}>
                  <Text style={stepStyles.rowLabel}>{goal.name}: {money(goal.before?.monthlyNow)} → {money(goal.after.monthlyNow)}/mo</Text>
                  <View style={[stepStyles.pill, { backgroundColor: pill.bg }]}><Text style={[stepStyles.pillText, { color: pill.fg }]}>{pill.label}</Text></View>
                </View>
              );
            })}
            {reviewDecision ? (
              <Text style={[styles.decisionText, styles.topGap]}>✓ {DECISION_TEXT[reviewDecision]}</Text>
            ) : (
              review.suggestions.map((suggestion) => (
                <TouchableOpacity key={suggestion.id} style={styles.option} onPress={() => decide(suggestion.id)} activeOpacity={0.8}>
                  <Text style={styles.optionTitle}>{suggestion.label}</Text>
                  <Text style={stepStyles.note}>{suggestion.detail}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </View>

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
  checkInCard: { borderColor: '#F3C9C1' },
  option: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 10, marginTop: 8 },
  optionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.ink, marginBottom: 2 },
  decisionText: { fontSize: 12, lineHeight: 18, fontWeight: '700', color: COLORS.green },
  check: { fontSize: 12, lineHeight: 18, color: COLORS.ink, marginTop: 4 },
});

export default GrowCards;
