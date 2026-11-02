import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../../services/api';
import type { Contributions, FamilyPicture, GoalsState, MockPassAuthResponse } from '../../services/api';
import { FALLBACK_PICTURE, FALLBACK_PLAN_OPTIONS } from '../../constants/planningFallback';
import { COLORS, money, monthLabel } from './stepStyles';
import { GoalIcon } from './GoalIcon';

const PERSON_COLORS = ['#D81E05', '#7AB5E8'];
const CHECK_IN_MONTHS = 3;

const inMonths = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * The family overview at the top of the cockpit: who is in the plan, progress on shared goals,
 * what each person agreed to put in, and what is coming up.
 */
export const FamilyOverviewCards: React.FC<{
  profile?: MockPassAuthResponse | null;
  onEditGoals?: () => void;
}> = ({ profile, onEditGoals }) => {
  const [goalState, setGoalState] = useState<GoalsState | null>(null);
  const [picture, setPicture] = useState<FamilyPicture | null>(null);
  const [contributions, setContributions] = useState<Contributions | null>(null);

  useEffect(() => {
    api.getGoals().then(setGoalState).catch(() => setGoalState(null));
    api.getPicture().then(setPicture).catch(() => setPicture(FALLBACK_PICTURE));
    api.getContributions().then(setContributions).catch(() => setContributions(FALLBACK_PLAN_OPTIONS.contributions));
  }, []);

  const primaryFirst = profile?.user?.name?.split(' ')[0] || 'You';
  const partnerFirst = profile?.partner?.name?.split(' ')[0] || null;
  const partnerJoined = goalState ? goalState.adults.includes('partner') : Boolean(partnerFirst);
  const children = (profile?.household?.dependents || []).filter((child: any) => child.relation === 'Child');

  const sharedGoals = (picture?.goals || []).filter((goal) => goal.owner === 'household' && goal.planned);
  const people = contributions?.people || [];
  const potTotal = people.reduce((sum, person) => sum + person.toShared, 0);

  const events = [
    ...(partnerJoined ? [{ date: inMonths(CHECK_IN_MONTHS), text: `Suggested plan check-in with ${partnerFirst}` }] : []),
    ...(picture?.support.upcomingDates || []).map((item) => ({ date: item.date, text: item.name })),
    ...sharedGoals.filter((goal) => goal.deadline).map((goal) => ({ date: goal.deadline, text: `${goal.name} due` })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.label}>Family</Text>
        <View style={styles.memberRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{primaryFirst.charAt(0)}</Text></View>
          <View style={styles.flex}>
            <Text style={styles.name}>{primaryFirst} (you)</Text>
            <Text style={styles.sub}>Sharing goals and your agreed amount</Text>
          </View>
          <View style={[styles.pill, styles.pillDark]}><Text style={[styles.pillText, styles.pillTextLight]}>You</Text></View>
        </View>
        {partnerFirst ? (
          <View style={styles.memberRow}>
            <View style={[styles.avatar, !partnerJoined && styles.avatarPending]}><Text style={styles.avatarText}>{partnerFirst.charAt(0)}</Text></View>
            <View style={styles.flex}>
              <Text style={styles.name}>{partnerFirst}</Text>
              <Text style={styles.sub}>{partnerJoined ? 'Sharing goals and their agreed amount' : 'Not in the plan yet'}</Text>
            </View>
            <View style={[styles.pill, partnerJoined ? styles.pillGreen : styles.pillAmber]}>
              <Text style={[styles.pillText, { color: partnerJoined ? COLORS.green : COLORS.amber }]}>{partnerJoined ? 'Joined' : 'Not joined'}</Text>
            </View>
          </View>
        ) : null}
        {children.length ? (
          <Text style={[styles.sub, styles.topGap]}>Children: {children.map((child: any) => `${child.name.split(' ')[0]} (${child.age})`).join(', ')}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.headRow}>
          <Text style={styles.label}>Shared goals</Text>
          <View style={[styles.pill, styles.pillGreen]}><Text style={[styles.pillText, { color: COLORS.green }]}>Approved by both</Text></View>
        </View>
        {sharedGoals.length === 0 ? <Text style={styles.sub}>No shared goals yet.</Text> : null}
        {sharedGoals.map((goal) => (
          <View key={goal.key} style={styles.goal}>
            <View style={styles.goalRow}>
              <GoalIcon group={goal.group} size={26} />
              <Text style={[styles.name, styles.flex]}>{goal.name}</Text>
              <Text style={styles.goalAmount}>{money(goal.currentAmount)} of {money(goal.targetAmount)}</Text>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(1, goal.currentAmount / Math.max(1, goal.targetAmount)) * 100}%` }]} /></View>
          </View>
        ))}
        {onEditGoals ? (
          <TouchableOpacity onPress={onEditGoals} style={styles.topGap}>
            <Text style={styles.link}>View and edit goals</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {people.length ? (
        <View style={styles.card}>
          <View style={styles.headRow}>
            <Text style={styles.label}>Agreed monthly contributions</Text>
            <View style={[styles.pill, styles.pillGreen]}><Text style={[styles.pillText, { color: COLORS.green }]}>Agreed</Text></View>
          </View>
          <Text style={styles.big}>{money(potTotal)}<Text style={styles.perMonth}> a month</Text></Text>
          <View style={styles.splitBar}>
            {people.map((person, index) => (
              <View key={person.member} style={{ flex: Math.max(1, person.toShared), backgroundColor: PERSON_COLORS[index % PERSON_COLORS.length] }} />
            ))}
          </View>
          <View style={styles.splitLegend}>
            {people.map((person, index) => (
              <View key={person.member} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: PERSON_COLORS[index % PERSON_COLORS.length] }]} />
                <Text style={styles.sub}>
                  {person.name.split(' ')[0]} {money(person.toShared)} ({potTotal ? Math.round(person.toShared / potTotal * 100) : 0}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {events.length ? (
        <View style={styles.card}>
          <Text style={styles.label}>Coming up</Text>
          {events.map((event, index) => (
            <View key={event.text + event.date} style={[styles.listRow, index > 0 && styles.divider]}>
              <Text style={styles.eventDate}>{monthLabel(event.date)}</Text>
              <Text style={[styles.sub, styles.flex, styles.eventText]}>{event.text}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topGap: { marginTop: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '800', color: '#767676', textTransform: 'uppercase', marginBottom: 6 },
  name: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  sub: { fontSize: 11, lineHeight: 16, color: COLORS.muted },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FDECEA', alignItems: 'center', justifyContent: 'center' },
  avatarPending: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F3B9B0', borderStyle: 'dashed' },
  avatarText: { fontSize: 14, fontWeight: '900', color: COLORS.red },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 10, fontWeight: '800' },
  pillTextLight: { color: '#FFFFFF' },
  pillDark: { backgroundColor: COLORS.ink },
  pillGreen: { backgroundColor: COLORS.greenBg },
  pillAmber: { backgroundColor: COLORS.amberBg },
  goal: { marginTop: 8 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  goalAmount: { fontSize: 11, fontWeight: '700', color: COLORS.muted },
  track: { height: 8, borderRadius: 4, backgroundColor: '#F0EDE8', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: COLORS.red },
  link: { fontSize: 13, fontWeight: '800', color: COLORS.red },
  big: { fontSize: 26, fontWeight: '900', color: COLORS.ink, marginTop: 2 },
  perMonth: { fontSize: 12, fontWeight: '700', color: COLORS.faint },
  splitBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 10, gap: 2 },
  splitLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: '#F2F2F2' },
  eventDate: { width: 72, fontSize: 12, fontWeight: '900', color: COLORS.ink },
  eventText: { fontSize: 12, color: COLORS.ink },
});

export default FamilyOverviewCards;
