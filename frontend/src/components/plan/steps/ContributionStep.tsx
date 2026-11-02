import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Switch, ActivityIndicator, LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import api from '../../../services/api';
import type { Contributions } from '../../../services/api';
import { FALLBACK_PLAN_OPTIONS } from '../../../constants/planningFallback';
import { COLORS, money, stepStyles } from '../stepStyles';

const STEP = 10;

// A drag-or-tap bar; the responder API works the same on iOS, Android and web.
const AmountSlider = ({ value, max, onChange }: { value: number; max: number; onChange: (value: number) => void }) => {
  const [width, setWidth] = useState<number>(0);
  const fill = max > 0 ? Math.min(1, value / max) : 0;
  const pick = (event: GestureResponderEvent) => {
    if (!width) return;
    const ratio = Math.min(1, Math.max(0, event.nativeEvent.locationX / width));
    onChange(Math.round(ratio * max / STEP) * STEP);
  };
  return (
    <View
      style={sliderStyles.hit}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={pick}
      onResponderMove={pick}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max, now: value }}
    >
      <View style={sliderStyles.track} pointerEvents="none">
        <View style={[sliderStyles.fill, { width: `${fill * 100}%` }]} />
      </View>
      <View style={[sliderStyles.thumb, { left: Math.max(0, fill * width - 11) }]} pointerEvents="none" />
    </View>
  );
};

/**
 * Setup (#2): private to this person. What they could afford (calculated), what they are willing
 * to put into the family pot (their choice), and what is committed (nothing until a plan is agreed).
 */
export const ContributionStep: React.FC<{
  partnerJoined: boolean;
  jointBalance: number;
  onNext: () => void;
  onBack: () => void;
}> = ({ partnerJoined, jointBalance, onNext, onBack }) => {
  const [contributions, setContributions] = useState<Contributions | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [typed, setTyped] = useState<string>('0');
  const [shareAmount, setShareAmount] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // After saving, a partner who has joined sees the shared view before moving on.
  const [showShared, setShowShared] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      let result: Contributions;
      try {
        result = await api.getContributions();
      } catch {
        result = FALLBACK_PLAN_OPTIONS.contributions;
      }
      setContributions(result);
      const mine = result.people.find((p) => p.member === 'primary');
      setAmount(mine?.toShared || 0);
      setTyped(String(mine?.toShared || 0));
    };
    load();
  }, []);

  const me = contributions?.people.find((p) => p.member === 'primary');
  const partner = contributions?.people.find((p) => p.member === 'partner');
  const partnerFirst = partner?.name.split(' ')[0] || 'Your partner';
  const capacity = me?.leftover || 0;
  const overCapacity = Number(typed) > capacity;

  const choose = (value: number) => {
    const next = Math.min(capacity, Math.max(0, value));
    setAmount(next);
    setTyped(String(next));
  };

  const onType = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setTyped(digits);
    const value = Number(digits || 0);
    if (value <= capacity) setAmount(value);
  };

  const save = async () => {
    if (!me) return;
    setSaving(true);
    setError(null);
    try {
      // Own goals keep their amount, trimmed if the family pot now needs that money.
      await api.setContribution('primary', amount, Math.min(me.toPersonal, capacity - amount));
    } catch (err: any) {
      if (err?.status) {
        setError(err.message);
        setSaving(false);
        return;
      }
      // Offline: the choice is kept for this session.
    }
    setSaving(false);
    if (partnerJoined) setShowShared(true);
    else onNext();
  };

  if (!contributions || !me) {
    return <ActivityIndicator color={COLORS.red} style={styles.loader} />;
  }

  const together = amount + (partner?.toShared || 0);

  if (showShared && partner) {
    const partnerSet = partner.status === 'CONFIRMED';
    return (
      <View style={stepStyles.container}>
        <ScrollView contentContainerStyle={stepStyles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headRow}>
            <TouchableOpacity style={stepStyles.backButton} onPress={() => setShowShared(false)} activeOpacity={0.7}>
              <Text style={stepStyles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={[stepStyles.pill, styles.sharedPill]}><Text style={[stepStyles.pillText, { color: COLORS.green }]}>👥 You and {partnerFirst}</Text></View>
          </View>

          <Text style={stepStyles.eyebrow}>Shared view</Text>
          <Text style={stepStyles.title}>What you&apos;re both putting in</Text>
          <Text style={stepStyles.subtitle}>Only what each of you chose to share.</Text>

          <View style={stepStyles.card}>
            <View style={styles.cardHead}>
              <Text style={[stepStyles.cardTitle, styles.flex]}>{partnerFirst}</Text>
              <View style={[stepStyles.pill, partnerSet ? styles.greyPill : { backgroundColor: COLORS.amberBg }]}>
                <Text style={[stepStyles.pillText, { color: partnerSet ? COLORS.muted : COLORS.amber }]}>{partnerSet ? `Shared by ${partnerFirst}` : 'Suggested'}</Text>
              </View>
            </View>
            <Text style={styles.bigValue}>{money(partner.toShared)}<Text style={styles.perMonth}> / month</Text></Text>
            <Text style={stepStyles.note}>{partnerSet ? 'A preference, not a commitment.' : `${partnerFirst} hasn't set an amount yet.`}</Text>
          </View>

          <View style={[stepStyles.card, styles.activeCard]}>
            <View style={styles.cardHead}>
              <Text style={[stepStyles.cardTitle, styles.flex]}>You</Text>
              <View style={[stepStyles.pill, shareAmount ? styles.choosePill : styles.greyPill]}>
                <Text style={[stepStyles.pillText, { color: shareAmount ? COLORS.red : COLORS.muted }]}>{shareAmount ? 'You chose' : `Hidden from ${partnerFirst}`}</Text>
              </View>
            </View>
            <Text style={styles.bigValue}>{money(amount)}<Text style={styles.perMonth}> / month</Text></Text>
            <View style={[stepStyles.row, styles.totalRow]}>
              <Text style={styles.label}>Together</Text>
              <Text style={styles.totalValue}>{money(together)} / month</Text>
            </View>
          </View>

          {jointBalance > 0 ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteBoxText}>Joint account ({money(jointBalance)}): you both see it, counted once.</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={stepStyles.footer}>
          <TouchableOpacity style={stepStyles.primaryButton} onPress={onNext} activeOpacity={0.85}>
            <Text style={stepStyles.primaryButtonText}>See our family picture</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={stepStyles.container}>
      <ScrollView contentContainerStyle={stepStyles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headRow}>
          <TouchableOpacity style={stepStyles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={stepStyles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={[stepStyles.pill, styles.privatePill]}><Text style={[stepStyles.pillText, styles.privatePillText]}>🔒 Only you</Text></View>
        </View>

        <Text style={stepStyles.eyebrow}>Your contribution</Text>
        <Text style={stepStyles.title}>How much can you put in?</Text>
        <Text style={stepStyles.subtitle}>Nothing moves until you both agree on a plan.</Text>

        <View style={stepStyles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.stepNum}>1</Text>
            <Text style={[stepStyles.cardTitle, styles.flex]}>What you could afford</Text>
            <View style={[stepStyles.pill, styles.greyPill]}><Text style={[stepStyles.pillText, styles.greyPillText]}>Calculated</Text></View>
          </View>
          <Text style={styles.bigValue}>{money(capacity)}<Text style={styles.perMonth}> / month</Text></Text>
          <Text style={stepStyles.note}>Left after your share of bills ({Math.round(me.billShare * 100)}%) and own commitments. A guide, not a limit.</Text>
        </View>

        <View style={[stepStyles.card, styles.activeCard]}>
          <View style={styles.cardHead}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={[stepStyles.cardTitle, styles.flex]}>What you&apos;ll put in</Text>
            <View style={[stepStyles.pill, styles.choosePill]}><Text style={[stepStyles.pillText, { color: COLORS.red }]}>You choose</Text></View>
          </View>
          <Text style={styles.bigValue}>{money(amount)}<Text style={styles.perMonth}> / month</Text></Text>
          <AmountSlider value={amount} max={capacity} onChange={choose} />
          <View style={styles.inputRow}>
            <Text style={styles.currency}>S$</Text>
            <TextInput
              style={[styles.input, overCapacity && styles.inputError]}
              value={typed}
              onChangeText={onType}
              onBlur={() => choose(Number(typed || 0))}
              keyboardType="number-pad"
              accessibilityLabel="Monthly amount"
            />
          </View>
          {overCapacity ? <Text style={styles.errorText}>Above what you could afford ({money(capacity)})</Text> : null}
          <View style={stepStyles.row}>
            <Text style={stepStyles.rowLabel}>Share of what you could afford</Text>
            <Text style={stepStyles.rowValue}>{capacity ? Math.round(amount / capacity * 100) : 0}%</Text>
          </View>
          <View style={stepStyles.row}>
            <Text style={stepStyles.rowLabel}>Kept for you</Text>
            <Text style={stepStyles.rowValue}>{money(capacity - amount)}</Text>
          </View>
        </View>

        <View style={stepStyles.card}>
          <View style={styles.cardHead}>
            <Text style={[styles.stepNum, styles.stepNumMuted]}>3</Text>
            <Text style={[stepStyles.cardTitle, styles.flex]}>Committed</Text>
            <View style={[stepStyles.pill, { backgroundColor: COLORS.amberBg }]}><Text style={[stepStyles.pillText, { color: COLORS.amber }]}>Not yet</Text></View>
          </View>
          <Text style={[styles.bigValue, styles.mutedValue]}>S$0<Text style={styles.perMonth}> / month</Text></Text>
          <Text style={stepStyles.note}>Starts only after you both approve a plan, and you OK each transfer.</Text>
        </View>

        {partnerJoined && partner ? (
          <>
            <View style={stepStyles.card}>
              <View style={stepStyles.row}>
                <View style={styles.flex}>
                  <Text style={styles.label}>Share this amount with {partnerFirst}</Text>
                  <Text style={stepStyles.cardSub}>Only the amount, not how you worked it out</Text>
                </View>
                <Switch
                  value={shareAmount}
                  onValueChange={setShareAmount}
                  trackColor={{ true: COLORS.red, false: '#D6D3CD' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D6D3CD"
                  accessibilityLabel={`Share this amount with ${partnerFirst}`}
                />
              </View>
            </View>

          </>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={stepStyles.footer}>
        <TouchableOpacity style={[stepStyles.primaryButton, saving && stepStyles.primaryButtonDisabled]} onPress={save} disabled={saving} activeOpacity={0.85}>
          <Text style={stepStyles.primaryButtonText}>{saving ? 'Saving…' : 'Save my amount'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  hit: { height: 36, justifyContent: 'center', marginTop: 6 },
  track: { height: 6, borderRadius: 3, backgroundColor: '#EDEAE4', overflow: 'hidden' },
  fill: { height: 6, backgroundColor: COLORS.red },
  thumb: { position: 'absolute', top: 7, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: COLORS.red },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { marginTop: 48 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  privatePill: { backgroundColor: COLORS.ink, marginTop: 6 },
  privatePillText: { color: '#FFFFFF' },
  sharedPill: { backgroundColor: COLORS.greenBg, marginTop: 6 },
  noteBox: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  noteBoxText: { fontSize: 12, lineHeight: 18, color: COLORS.muted },
  greyPill: { backgroundColor: '#F2F0EC' },
  greyPillText: { color: COLORS.muted },
  choosePill: { backgroundColor: '#FFF7F5', borderWidth: 1, borderColor: '#F3B9B0', borderStyle: 'dashed' },
  activeCard: { borderColor: COLORS.red, borderWidth: 1.5 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.red, color: '#FFFFFF', fontSize: 12, fontWeight: '900', textAlign: 'center', lineHeight: 24, overflow: 'hidden' },
  stepNumMuted: { backgroundColor: '#C9C5BE' },
  bigValue: { fontSize: 28, fontWeight: '900', color: COLORS.ink, marginBottom: 4 },
  mutedValue: { color: COLORS.faint },
  perMonth: { fontSize: 13, fontWeight: '700', color: COLORS.faint },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 4 },
  currency: { fontSize: 14, fontWeight: '800', color: COLORS.muted },
  input: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 12, minHeight: 44, fontSize: 16, fontWeight: '800', color: COLORS.ink, backgroundColor: '#FFFFFF' },
  inputError: { borderColor: COLORS.red },
  errorText: { fontSize: 11, color: COLORS.red, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  totalRow: { borderTopWidth: 1, borderTopColor: '#F2F2F2', marginTop: 4 },
  totalValue: { fontSize: 14, fontWeight: '900', color: COLORS.red },
});

export default ContributionStep;
