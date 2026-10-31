import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FamilyMember } from '../types';

export const AccountsConnectedStep: React.FC<{
  members: FamilyMember[];
  institutionsCount: number;
  onStartPlanning: () => void;
}> = ({ members, institutionsCount, onStartPlanning }) => {
  const linked = members.filter((m) => m.selected);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successCircle}>
          <Text style={styles.successTick}>✓</Text>
        </View>

        <Text style={styles.title}>Accounts Connected</Text>
        <Text style={styles.subtitle}>
          Your household is linked. OWNLYplan can now build one consolidated family plan.
        </Text>

        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Members linked</Text>
            <Text style={styles.summaryValue}>{linked.length + 1}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Institutions aggregated</Text>
            <Text style={styles.summaryValue}>{institutionsCount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Consent status</Text>
            <Text style={[styles.summaryValue, styles.summaryValueGreen]}>All approved</Text>
          </View>
        </View>

        <View style={styles.memberChips}>
          {linked.map((member) => (
            <View key={member.id} style={styles.chip}>
              <Text style={styles.chipText}>
                {member.name} · {member.relation}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onStartPlanning} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Start Family Planning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTick: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2E7D32',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#666666',
    marginBottom: 18,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  summaryValueGreen: {
    color: '#2E7D32',
  },
  memberChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9E5DE',
  },
  primaryButton: {
    backgroundColor: '#D81E05',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default AccountsConnectedStep;
