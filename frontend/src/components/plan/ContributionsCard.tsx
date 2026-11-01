import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import type { Contributions, ContributionPerson } from '../../services/api';
import { COLORS, money, stepStyles } from './stepStyles';
import { Stepper } from './Stepper';

const firstName = (name: string) => String(name).split(' ')[0];

const percent = (part: number, whole: number) => (whole > 0 ? Math.round(part / whole * 100) : 0);

const PersonRow = ({ person, othersShared, editable, asPartnerDemo, onSaved }: {
  person: ContributionPerson;
  // What everyone else puts into the family pot, so this person's share updates as they edit.
  othersShared: number;
  editable: boolean;
  asPartnerDemo?: boolean;
  onSaved: () => void;
}) => {
  const [editing, setEditing] = useState<boolean>(false);
  const [toShared, setToShared] = useState<number>(person.toShared);
  const [toPersonal, setToPersonal] = useState<number>(person.toPersonal);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const name = firstName(person.name);
  const potShare = percent(editing ? toShared : person.toShared, (editing ? toShared : person.toShared) + othersShared);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.setContribution(person.member, toShared, toPersonal, asPartnerDemo);
      setEditing(false);
      onSaved();
    } catch (err: any) {
      setError(err?.status ? err.message : 'Changing amounts needs the planning engine. Start the backend and try again.');
    } finally {
      setSaving(false);
    }
  };

  const status = person.member === 'partner'
    ? person.status === 'CONFIRMED' ? `Set by ${name}` : `Suggested. ${name} confirms this when reviewing the plan`
    : person.status === 'CONFIRMED' ? 'Your amounts' : 'Suggested for you';

  return (
    <View style={styles.person}>
      <View style={styles.personHead}>
        <Text style={styles.personName}>{name}</Text>
        <Text style={stepStyles.note}>{status}</Text>
      </View>
      <View style={stepStyles.row}><Text style={stepStyles.rowLabel}>Take-home</Text><Text style={stepStyles.rowValue}>{money(person.takeHome)}</Text></View>
      <View style={stepStyles.row}><Text style={stepStyles.rowLabel}>Share of shared bills ({Math.round(person.billShare * 100)}%)</Text><Text style={stepStyles.rowValue}>−{money(person.sharedBills)}</Text></View>
      {person.personalBills ? (
        <View style={stepStyles.row}><Text style={stepStyles.rowLabel}>Own commitments</Text><Text style={stepStyles.rowValue}>−{money(person.personalBills)}</Text></View>
      ) : null}
      <View style={[stepStyles.row, styles.leftRow]}><Text style={styles.leftLabel}>Left that&apos;s {name}&apos;s</Text><Text style={styles.leftValue}>{money(person.leftover)}</Text></View>

      {editing ? (
        <View style={styles.gap}>
          <Stepper label={`To family goals (${potShare}% of the pot)`} value={toShared} step={25} min={0} max={person.leftover}
            display={money(toShared)} onChange={(value) => { setToShared(value); setToPersonal(Math.min(toPersonal, person.leftover - value)); }} />
          <Stepper label={`To ${name}'s own goals`} value={toPersonal} step={25} min={0} max={Math.max(0, person.leftover - toShared)}
            display={money(toPersonal)} onChange={setToPersonal} />
          <View style={stepStyles.row}><Text style={stepStyles.rowLabel}>Kept free</Text><Text style={stepStyles.rowValue}>{money(person.leftover - toShared - toPersonal)}</Text></View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={[stepStyles.secondaryButton, styles.flex]} onPress={() => { setEditing(false); setToShared(person.toShared); setToPersonal(person.toPersonal); }}>
              <Text style={stepStyles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[stepStyles.primaryButton, styles.flex]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={stepStyles.primaryButtonText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={stepStyles.row}>
            <Text style={stepStyles.rowLabel}>→ Family goals</Text>
            <Text style={styles.percent}>{potShare}% of the pot</Text>
            <Text style={stepStyles.rowValue}>{money(person.toShared)}</Text>
          </View>
          <View style={stepStyles.row}><Text style={stepStyles.rowLabel}>→ {name}&apos;s own goals</Text><Text style={stepStyles.rowValue}>{money(person.toPersonal)}</Text></View>
          <View style={stepStyles.row}><Text style={stepStyles.rowLabel}>Kept free</Text><Text style={stepStyles.rowValue}>{money(person.keptFree)}</Text></View>
          {editable ? (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={[stepStyles.linkText, styles.gap]}>{asPartnerDemo ? `Demo: ${name} changes her amounts in her app` : 'Change my amounts'}</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
};

/**
 * Who puts in what: shared bills split by take-home pay, what each person has left, and how much
 * each chooses to put into the family pot and their own goals. Only each person sets their own.
 */
export const ContributionsCard: React.FC<{ contributions: Contributions; onChanged: () => void }> = ({ contributions, onChanged }) => (
  <View style={stepStyles.card}>
    <Text style={stepStyles.cardTitle}>Who puts in what</Text>
    <Text style={stepStyles.cardSub}>
      Shared bills ({money(contributions.sharedBills)}/month) are split by take-home pay. What is left is each person&apos;s own; each decides how much goes to family goals and their own goals.
    </Text>
    {contributions.people.map((person) => (
      <PersonRow
        key={`${person.member}-${person.toShared}-${person.toPersonal}`}
        person={person}
        othersShared={contributions.people.filter((other) => other.member !== person.member).reduce((sum, other) => sum + other.toShared, 0)}
        editable
        asPartnerDemo={person.member === 'partner'}
        onSaved={onChanged}
      />
    ))}
    <View style={[stepStyles.row, styles.potRow]}>
      <Text style={styles.potLabel}>Family pot for shared goals</Text>
      <Text style={styles.potValue}>{money(contributions.familyPot.available)}/mo</Text>
    </View>
    <View style={styles.splitBar}>
      {contributions.people.map((person, index) => (
        <View key={person.member} style={{ flex: Math.max(person.toShared, 0.001), backgroundColor: index === 0 ? COLORS.red : '#7AB5E8' }} />
      ))}
    </View>
    <Text style={styles.splitText}>
      {contributions.people.map((person) => `${firstName(person.name)} ${percent(person.toShared, contributions.familyPot.contributed)}% (${money(person.toShared)})`).join('  ·  ')}
    </Text>
    <Text style={stepStyles.note}>
      {money(contributions.familyPot.contributed)} put in, less {money(contributions.familyPot.protectionPremium)} for family protection.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { marginTop: 8 },
  person: { borderTopWidth: 1, borderTopColor: '#F2F2F2', paddingTop: 10, marginTop: 10 },
  personHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  personName: { fontSize: 14, fontWeight: '900', color: COLORS.ink },
  leftRow: { backgroundColor: '#F7F5F1', borderRadius: 8, paddingHorizontal: 8 },
  leftLabel: { fontSize: 12, fontWeight: '800', color: COLORS.ink, flex: 1 },
  leftValue: { fontSize: 13, fontWeight: '900', color: COLORS.ink },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  error: { fontSize: 12, fontWeight: '700', color: COLORS.red, marginTop: 4 },
  potRow: { marginTop: 10, backgroundColor: COLORS.greenBg, borderRadius: 10, paddingHorizontal: 10 },
  percent: { fontSize: 11, fontWeight: '800', color: COLORS.muted },
  splitBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 8 },
  splitText: { fontSize: 12, fontWeight: '800', color: COLORS.ink, marginTop: 4, marginBottom: 4 },
  potLabel: { fontSize: 13, fontWeight: '900', color: COLORS.green, flex: 1 },
  potValue: { fontSize: 14, fontWeight: '900', color: COLORS.green },
});

export default ContributionsCard;
