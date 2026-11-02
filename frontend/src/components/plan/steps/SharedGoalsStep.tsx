import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import type { FamilyGoal, GoalInput, GoalsState, Member } from '../../../services/api';
import { COLORS, money, monthLabel, stepStyles } from '../stepStyles';
import { GoalIcon } from '../GoalIcon';
import { GoalChatSheet } from './GoalChatSheet';
import { GoalEditSheet } from './GoalEditSheet';

/**
 * Shared goals (Decide #1). The list starts empty. Each adult adds goals with the goal assistant;
 * the other approves or edits each shared goal (an edit goes back for approval). Once every goal
 * is approved and both say they are done, the family moves on.
 */
export const SharedGoalsStep: React.FC<{
  primaryName: string;
  partnerName: string | null;
  partnerJoined: boolean;
  onNext: () => void;
  onBack: () => void;
}> = ({ primaryName, partnerName, partnerJoined, onNext, onBack }) => {
  const [state, setState] = useState<GoalsState | null>(null);
  const [goals, setGoals] = useState<FamilyGoal[]>([]);
  const [failed, setFailed] = useState<boolean>(false);
  const [viewer, setViewer] = useState<Member>('primary');
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<GoalInput | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const names: Record<Member, string> = { primary: primaryName, partner: partnerName || 'Partner' };
  const other: Member = viewer === 'primary' ? 'partner' : 'primary';
  const asPartner = viewer === 'partner';

  const load = async () => {
    try {
      const [goalState, picture] = await Promise.all([api.getGoals(), api.getPicture()]);
      setState(goalState);
      setGoals(picture.goals);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, action: () => Promise<unknown>) => {
    setBusy(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (err: any) {
      setError(err?.status ? err.message : 'That needs the planning engine. Start the backend and try again.');
    } finally {
      setBusy(null);
    }
  };

  if (failed) {
    return (
      <View style={[stepStyles.container, styles.centered]}>
        <Text style={stepStyles.cardTitle}>Can&apos;t reach the planning engine</Text>
        <Text style={[stepStyles.note, styles.centerText]}>Shared goals are saved by the backend. Start it, then try again.</Text>
        <TouchableOpacity style={[stepStyles.secondaryButton, styles.retry]} onPress={load}>
          <Text style={stepStyles.secondaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!state) return <ActivityIndicator color={COLORS.red} style={styles.loader} />;

  const inputs = Object.fromEntries(state.goals.map((input) => [input.key, input]));
  const listed = goals.filter((goal) => inputs[goal.key]).map((goal) => ({ goal, input: inputs[goal.key] }));
  const iAmDone = Boolean(state.done[viewer]);
  const waitingOn = state.adults.filter((member) => !state.done[member]);

  return (
    <View style={stepStyles.container}>
      <ScrollView contentContainerStyle={stepStyles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={stepStyles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={stepStyles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={stepStyles.eyebrow}>Shared goals</Text>
        <Text style={stepStyles.title}>Our family goals</Text>
        <Text style={stepStyles.subtitle}>
          {partnerJoined ? `Add goals with the assistant. Shared goals need you both to approve.` : 'Add goals with the assistant.'}
        </Text>

        {partnerJoined && partnerName ? (
          <View style={styles.viewerRow}>
            {(['primary', 'partner'] as Member[]).map((member) => (
              <TouchableOpacity key={member} style={[styles.viewerTab, viewer === member && styles.viewerTabActive]} onPress={() => setViewer(member)} activeOpacity={0.8}>
                <Text style={[styles.viewerText, viewer === member && styles.viewerTextActive]}>
                  {member === 'primary' ? `${primaryName} (you)` : `${partnerName}'s phone · demo`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {listed.length === 0 ? (
          <View style={[stepStyles.card, styles.empty]}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={stepStyles.cardTitle}>No goals yet</Text>
            <Text style={[stepStyles.note, styles.centerText]}>Chat with the assistant to add your first one.</Text>
          </View>
        ) : null}

        {listed.map(({ goal, input }) => {
          const mine = input.owner === 'household' || input.owner === viewer;
          const required = input.requiredApprovers || [];
          const approvedByMe = Boolean(input.approvals?.[viewer]);
          const needsMe = mine && required.includes(viewer) && !approvedByMe;
          const approved = required.every((member) => input.approvals?.[member]);
          const pill = approved
            ? { bg: COLORS.greenBg, fg: COLORS.green, label: '✓ Approved' }
            : needsMe
              ? { bg: '#FDECEA', fg: COLORS.red, label: 'Needs your OK' }
              : { bg: COLORS.amberBg, fg: COLORS.amber, label: `Waiting for ${names[other]}` };
          const progress = Math.min(1, goal.currentAmount / Math.max(1, goal.targetAmount));
          const changedBy = input.editedBy && input.editedBy !== input.proposedBy ? input.editedBy : null;
          return (
            <View key={goal.key} style={[stepStyles.card, needsMe && styles.needsCard]}>
              <View style={styles.goalHead}>
                <GoalIcon group={goal.group} />
                <View style={styles.flex}>
                  <Text style={stepStyles.cardTitle}>{goal.name}</Text>
                  <Text style={stepStyles.cardSub}>
                    {goal.groupLabel} · {input.owner === 'household' ? 'Shared' : `Just ${names[input.owner as Member]}`}
                  </Text>
                </View>
                <View style={[stepStyles.pill, { backgroundColor: pill.bg }]}><Text style={[stepStyles.pillText, { color: pill.fg }]}>{pill.label}</Text></View>
              </View>

              <View style={[stepStyles.row, styles.topGap]}>
                <Text style={stepStyles.rowLabel}>Target · by {monthLabel(goal.deadline)}</Text>
                <Text style={stepStyles.rowValue}>{money(goal.targetAmount)}</Text>
              </View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
              <View style={stepStyles.row}>
                <Text style={stepStyles.rowLabel}>Saved {money(goal.currentAmount)}</Text>
                <Text style={stepStyles.rowValue}>{goal.shortfall > 0 ? `${money(goal.shortfall)} to go` : 'Fully funded'}</Text>
              </View>

              {input.owner === 'household' && required.length > 1 ? (
                <View style={styles.approvals}>
                  {required.map((member) => (
                    <View key={member} style={[styles.approval, input.approvals?.[member] && styles.approvalDone]}>
                      <Text style={[styles.approvalText, input.approvals?.[member] && styles.approvalTextDone]}>
                        {input.approvals?.[member] ? '✓' : '○'} {names[member]}
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.addedBy}>
                    {changedBy ? `Changed by ${names[changedBy]}` : input.proposedBy ? `Added by ${names[input.proposedBy]}` : ''}
                  </Text>
                </View>
              ) : null}

              {mine ? (
                <View style={styles.actions}>
                  {needsMe ? (
                    <TouchableOpacity style={styles.approveButton} onPress={() => act(goal.key, () => api.approveGoal(goal.key, asPartner))} disabled={busy === goal.key}>
                      {busy === goal.key ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.approveText}>Approve</Text>}
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.editButton} onPress={() => setEditing(input)}>
                    <Text style={stepStyles.linkText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[stepStyles.note, styles.topGap]}>Only {names[input.owner as Member]} can change this.</Text>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={[stepStyles.secondaryButton, styles.addButton]} onPress={() => setChatOpen(true)} activeOpacity={0.8}>
          <Text style={stepStyles.secondaryButtonText}>💬 Add a goal with the assistant</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {listed.length > 0 ? (
          <View style={stepStyles.card}>
            <Text style={stepStyles.sectionLabel}>Finished adding goals?</Text>
            {state.adults.map((member) => (
              <View key={member} style={stepStyles.row}>
                <Text style={stepStyles.rowLabel}>{names[member]}</Text>
                <Text style={[styles.doneStatus, state.done[member] && styles.doneStatusDone]}>{state.done[member] ? '✓ Done' : 'Not yet'}</Text>
              </View>
            ))}
            {!iAmDone ? (
              <TouchableOpacity
                style={[stepStyles.primaryButton, styles.topGap, (!state.allApproved || busy === 'done') && stepStyles.primaryButtonDisabled]}
                onPress={() => act('done', () => api.markGoalsDone(asPartner))}
                disabled={!state.allApproved || busy === 'done'}
              >
                <Text style={stepStyles.primaryButtonText}>{state.allApproved ? 'I\'m done' : 'Approve every goal first'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={stepStyles.footer}>
        <TouchableOpacity style={[stepStyles.primaryButton, !state.ready && stepStyles.primaryButtonDisabled]} onPress={onNext} disabled={!state.ready} activeOpacity={0.85}>
          <Text style={stepStyles.primaryButtonText}>
            {state.ready ? 'Continue' : waitingOn.length && state.allApproved ? `Waiting for ${waitingOn.map((member) => names[member]).join(' and ')}` : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      <GoalChatSheet
        visible={chatOpen}
        viewer={viewer}
        viewerName={names[viewer]}
        otherName={partnerJoined ? names[other] : null}
        available={state.available}
        onClose={() => setChatOpen(false)}
        onAdded={load}
      />
      <GoalEditSheet
        visible={Boolean(editing)}
        goal={editing}
        asPartner={asPartner}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topGap: { marginTop: 8 },
  loader: { marginTop: 48 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  centerText: { textAlign: 'center' },
  retry: { paddingHorizontal: 24, marginTop: 8 },
  viewerRow: { flexDirection: 'row', backgroundColor: '#EDEAE4', borderRadius: 12, padding: 3, marginBottom: 12 },
  viewerTab: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  viewerTabActive: { backgroundColor: '#FFFFFF' },
  viewerText: { fontSize: 12, fontWeight: '700', color: COLORS.muted },
  viewerTextActive: { color: COLORS.ink, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyIcon: { fontSize: 32 },
  needsCard: { borderColor: COLORS.red, borderWidth: 1.5 },
  goalHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#F0EDE8', marginTop: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.red },
  approvals: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  approval: { borderRadius: 999, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 8, paddingVertical: 3 },
  approvalDone: { backgroundColor: COLORS.greenBg, borderColor: COLORS.greenBg },
  approvalText: { fontSize: 11, fontWeight: '700', color: COLORS.faint },
  approvalTextDone: { color: COLORS.green },
  addedBy: { fontSize: 11, color: COLORS.faint, marginLeft: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  approveButton: { backgroundColor: COLORS.red, borderRadius: 12, minHeight: 40, paddingHorizontal: 22, justifyContent: 'center' },
  approveText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  editButton: { paddingVertical: 8 },
  addButton: { minHeight: 48, justifyContent: 'center', marginBottom: 12 },
  error: { fontSize: 12, color: COLORS.red, marginBottom: 10 },
  doneStatus: { fontSize: 12, fontWeight: '800', color: COLORS.amber },
  doneStatusDone: { color: COLORS.green },
});

export default SharedGoalsStep;
