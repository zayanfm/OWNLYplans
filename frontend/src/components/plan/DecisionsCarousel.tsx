import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import type { Contributions, FamilyPicture, GoalInput, GoalsState, PlanAlert } from '../../services/api';
import { FALLBACK_PICTURE, FALLBACK_PLAN_OPTIONS } from '../../constants/planningFallback';
import { COLORS, money, monthLabel } from './stepStyles';

export interface ProductCard {
  id: string;
  brand: string;
  title: string;
  sub: string;
  cta: string;
}

type Card = {
  key: string;
  kind: 'alert-bad' | 'alert-good' | 'decision' | 'product';
  label: string;
  title: string;
  body: string;
  links: Array<{ label: string; onPress?: () => void; muted?: boolean }>;
  note?: string;
};

const LINK_BLUE = '#1A66E0';
const BACKGROUNDS: Record<Card['kind'], string> = {
  'alert-bad': '#FBEFE6',
  'alert-good': '#EAF5EC',
  decision: '#F1EFF4',
  product: '#F6F3EE',
};
// A slightly deeper shade of each background, so every card has a clear edge.
const OUTLINES: Record<Card['kind'], string> = {
  'alert-bad': '#EBC7AE',
  'alert-good': '#B9DCC0',
  decision: '#D6D1DE',
  product: '#E2DCD2',
};

// Suggested goals carry no name of their own; name them the way the plan does.
const goalLabel = (goal: GoalInput) => goal.name
  || (goal.type === 'EDUCATION' ? `${String(goal.childName || 'Child').split(' ')[0]}'s education` : goal.type === 'EMERGENCY' ? 'Emergency buffer' : 'a goal');

const monthsBetween = (from: string, to: string) => {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
};

/**
 * Decisions: one carousel of everything waiting on the family. Alerts come first (big changes that
 * move a goal's date, to accept or not), then decisions waiting on someone, then OCBC products.
 */
export const DecisionsCarousel: React.FC<{
  partnerName?: string | null;
  products: ProductCard[];
  onOpenProduct: (id: string) => void;
  onEditGoals?: () => void;
  onChanged?: () => void;
}> = ({ partnerName, products, onOpenProduct, onEditGoals, onChanged }) => {
  const [alerts, setAlerts] = useState<PlanAlert[]>([]);
  const [goalState, setGoalState] = useState<GoalsState | null>(null);
  const [picture, setPicture] = useState<FamilyPicture | null>(null);
  const [contributions, setContributions] = useState<Contributions | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    api.getAlerts().then((result) => setAlerts(result.alerts)).catch(() => setAlerts([]));
    api.getGoals().then(setGoalState).catch(() => setGoalState(null));
    api.getPicture().then(setPicture).catch(() => setPicture(FALLBACK_PICTURE));
    api.getContributions().then(setContributions).catch(() => setContributions(FALLBACK_PLAN_OPTIONS.contributions));
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (alert: PlanAlert, decision: 'accept' | 'dismiss') => {
    setBusy(alert.id);
    try {
      await api.respondToAlert(alert.id, decision, alert.after.deadline);
      const moved = alert.after.deadline !== alert.before.deadline;
      setNotes({
        ...notes,
        [alert.goalKey]: decision === 'dismiss'
          ? `Kept ${alert.goalName} as it was.`
          : moved && partnerName ? `${alert.goalName} now due ${monthLabel(alert.after.deadline)}. ${partnerName} will be asked to approve it.` : `${alert.goalName} updated.`,
      });
      onChanged?.();
    } catch (err: any) {
      setNotes({ ...notes, [alert.goalKey]: err?.status ? err.message : 'That needs the planning engine.' });
    } finally {
      setBusy(null);
      load();
    }
  };

  const cards: Card[] = [];

  alerts.forEach((alert) => {
    const good = alert.tone === 'POSITIVE';
    const moved = alert.after.deadline !== alert.before.deadline;
    const shift = monthsBetween(alert.before.reachedBy, alert.after.reachedBy);
    cards.push({
      key: alert.id,
      kind: good ? 'alert-good' : 'alert-bad',
      label: good ? 'Alert · good news' : 'Alert',
      title: alert.title,
      body: `${alert.goalName}: ${monthLabel(alert.before.reachedBy)} → ${monthLabel(alert.after.reachedBy)}, ${Math.abs(shift)} month${Math.abs(shift) === 1 ? '' : 's'} ${shift > 0 ? 'later' : 'sooner'} at the same ${money(alert.monthly)}/month.${moved ? ` Move the target date to ${monthLabel(alert.after.deadline)}?` : ' The target date stays.'}`,
      links: [
        { label: moved ? 'Accept new date' : 'Accept', onPress: () => respond(alert, 'accept') },
        { label: 'Not now', onPress: () => respond(alert, 'dismiss'), muted: true },
      ],
      note: notes[alert.goalKey],
    });
  });

  // Answered alerts leave a short confirmation in their place.
  Object.entries(notes).filter(([key]) => !alerts.some((alert) => alert.goalKey === key)).forEach(([key, text]) => {
    cards.push({ key: `note-${key}`, kind: 'decision', label: 'Done', title: '✓ Answered', body: text, links: [] });
  });

  (goalState?.goals || []).filter((goal) => goal.status === 'NEEDS_DECISION').forEach((goal) => {
    cards.push({
      key: `approve-${goal.key}`, kind: 'decision', label: 'Decision',
      title: `Approve ${goalLabel(goal)}`, body: 'It changed since you last approved it.',
      links: onEditGoals ? [{ label: 'Review goals', onPress: onEditGoals }] : [],
    });
  });
  (goalState?.goals || []).filter((goal) => goal.status === 'AWAITING_PARTNER' && goal.owner === 'household').forEach((goal) => {
    cards.push({
      key: `waiting-${goal.key}`, kind: 'decision', label: 'Waiting',
      title: `${partnerName || 'Your partner'} to approve ${goalLabel(goal)}`, body: 'You changed it, for example its target date.',
      links: [],
    });
  });
  const partnerAmount = contributions?.people.find((person) => person.member === 'partner');
  if (goalState?.adults.includes('partner') && partnerAmount && partnerAmount.status !== 'CONFIRMED') {
    cards.push({
      key: 'partner-amount', kind: 'decision', label: 'Waiting',
      title: `${partnerName || 'Your partner'} to set their amount`, body: `${money(partnerAmount.toShared)}/month is a suggestion until then.`,
      links: [],
    });
  }
  const support = (picture?.goals || []).filter((goal) => goal.owner === 'household' && goal.planned)
    .flatMap((goal) => goal.support).filter((item) => item.status === 'AVAILABLE' || item.status === 'UPCOMING');
  if (support.length) {
    cards.push({
      key: 'support', kind: 'decision', label: 'Decision',
      title: 'Check government support', body: [...new Set(support.map((item) => item.name))].slice(0, 3).join(', '),
      links: [{ label: 'See what applies', onPress: () => onOpenProduct('support') }],
    });
  }

  products.filter((product) => product.id !== 'support').forEach((product) => {
    cards.push({
      key: `product-${product.id}`, kind: 'product', label: product.brand,
      title: product.title, body: product.sub,
      links: [{ label: product.cta, onPress: () => onOpenProduct(product.id) }],
    });
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Decisions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.bleed}>
        {cards.map((card) => (
          <View key={card.key} style={[styles.card, { backgroundColor: BACKGROUNDS[card.kind], borderColor: OUTLINES[card.kind] }]}>
            <Text style={[styles.label, card.kind === 'alert-bad' && styles.labelBad, card.kind === 'alert-good' && styles.labelGood]}>{card.label}</Text>
            <Text style={styles.title}>{card.title}</Text>
            <Text style={styles.body}>{card.body}</Text>
            <View style={styles.flex} />
            {busy === card.key ? <ActivityIndicator color={LINK_BLUE} style={styles.busy} /> : (
              <View style={styles.links}>
                {card.links.map((link) => (
                  <TouchableOpacity key={link.label} onPress={link.onPress} disabled={Boolean(busy)}>
                    <Text style={[styles.link, link.muted && styles.linkMuted]}>{link.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {card.note ? <Text style={styles.note}>{card.note}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { marginBottom: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#767676', textTransform: 'uppercase', marginBottom: 8 },
  bleed: { marginHorizontal: -20 },
  row: { paddingHorizontal: 20, gap: 12 },
  card: { width: 280, minHeight: 190, borderRadius: 16, borderWidth: 1.5, padding: 18 },
  label: { fontSize: 11, fontWeight: '700', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  labelBad: { color: COLORS.amber },
  labelGood: { color: COLORS.green },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '800', color: '#222222' },
  body: { fontSize: 12, lineHeight: 17, color: '#555555', marginTop: 6 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 12 },
  link: { fontSize: 14, fontWeight: '600', color: LINK_BLUE },
  linkMuted: { color: '#777777' },
  busy: { alignSelf: 'flex-start', marginTop: 12 },
  note: { fontSize: 11, lineHeight: 15, color: '#555555', marginTop: 8 },
});

export default DecisionsCarousel;
