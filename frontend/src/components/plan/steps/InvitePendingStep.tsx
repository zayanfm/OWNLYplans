import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import { FamilyMember } from '../types';

const APPROVAL_DELAY_MS = 3000;
const REVEAL_DELAY_MS = 900;

export const InvitePendingStep: React.FC<{
  members: FamilyMember[];
  onApproved: () => void;
}> = ({ members, onApproved }) => {
  const [approved, setApproved] = useState<boolean>(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let cancelled = false;

    const approveTimer = setTimeout(async () => {
      try {
        await api.getFamilyStatus();
      } catch {
        // Offline: the simulated approval still resolves locally.
      }
      if (cancelled) return;
      setApproved(true);

      const revealTimer = setTimeout(() => {
        if (!cancelled) onApproved();
      }, REVEAL_DELAY_MS);
      timers.current.push(revealTimer);
    }, APPROVAL_DELAY_MS);

    timers.current.push(approveTimer);

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [onApproved]);

  const invited = members.filter((m) => m.selected);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Invitations sent</Text>
        <Text style={styles.subtitle}>
          Each member has been notified in their OCBC app. The plan unlocks once they approve.
        </Text>

        <View style={styles.card}>
          {invited.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
              </View>
              <View style={styles.memberTextWrap}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberMeta}>
                  {member.relation} · {member.maskedNric}
                </Text>
              </View>
              {approved ? (
                <View style={styles.approvedPill}>
                  <Text style={styles.approvedPillText}>Approved</Text>
                </View>
              ) : (
                <View style={styles.pendingPill}>
                  <ActivityIndicator size="small" color="#B26A00" />
                  <Text style={styles.pendingPillText}>Awaiting approval…</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.footnote}>
          You stay in control: members can revoke access at any time from their own profile.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#666666',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D81E05',
  },
  memberTextWrap: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  memberMeta: {
    fontSize: 11,
    color: '#888888',
    marginTop: 1,
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF6E5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pendingPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B26A00',
  },
  approvedPill: {
    backgroundColor: '#E6F4EA',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  approvedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  footnote: {
    fontSize: 11,
    color: '#888888',
    marginTop: 14,
    lineHeight: 16,
  },
});

export default InvitePendingStep;
