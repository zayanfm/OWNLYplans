import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { COLORS, stepStyles } from './stepStyles';

/**
 * "The AI cannot overreach on people": shows what is shared and lets anyone leave.
 * Alex can leave (deleting the household's OWNLYplan data); the partner leaves from their own
 * app, which the sandbox simulates here.
 */
export const HouseholdPrivacyCard: React.FC<{
  partnerFirstName?: string;
  onLeft: (member: 'primary' | 'partner') => void;
}> = ({ partnerFirstName, onLeft }) => {
  const [confirming, setConfirming] = useState<'primary' | 'partner' | null>(null);
  const [working, setWorking] = useState<boolean>(false);
  const [note, setNote] = useState<string | null>(null);

  const leave = async (member: 'primary' | 'partner') => {
    setWorking(true);
    try {
      const result = await api.leaveHousehold(member);
      if (member === 'partner') setNote(result.reviewNote || `${partnerFirstName} left the household.`);
    } catch (err: any) {
      setNote(err?.message || 'Could not complete that right now.');
      setWorking(false);
      setConfirming(null);
      return;
    }
    setWorking(false);
    setConfirming(null);
    onLeft(member);
  };

  return (
    <View style={stepStyles.card}>
      <Text style={stepStyles.sectionLabel}>Your data, your choice</Text>
      <Text style={stepStyles.cardSub}>
        Each person chose what to share. Private accounts are never used in the plan, and anyone can leave at any time.
      </Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}

      {confirming ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmText}>
            {confirming === 'primary'
              ? 'Leave OWNLYplan? Your household plan, goals and sharing choices will be deleted. Your OCBC accounts are not affected.'
              : `Simulate ${partnerFirstName} leaving from their own app? Their income, accounts and personal goal stop being used.`}
          </Text>
          <View style={styles.row}>
            <TouchableOpacity style={[stepStyles.secondaryButton, styles.flex]} onPress={() => setConfirming(null)} disabled={working}>
              <Text style={stepStyles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[stepStyles.primaryButton, styles.flex]} onPress={() => leave(confirming)} disabled={working}>
              {working ? <ActivityIndicator color="#FFFFFF" /> : <Text style={stepStyles.primaryButtonText}>Leave</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => setConfirming('primary')}>
            <Text style={stepStyles.linkText}>Leave OWNLYplan and delete our plan</Text>
          </TouchableOpacity>
          {partnerFirstName && !note ? (
            <TouchableOpacity onPress={() => setConfirming('partner')}>
              <Text style={[stepStyles.linkText, styles.muted]}>Demo: {partnerFirstName} leaves</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actions: { gap: 10, marginTop: 10 },
  muted: { color: COLORS.muted },
  note: { fontSize: 12, lineHeight: 18, fontWeight: '700', color: COLORS.amber, marginTop: 8 },
  confirm: { marginTop: 10 },
  confirmText: { fontSize: 12, lineHeight: 18, color: COLORS.ink },
});

export default HouseholdPrivacyCard;
