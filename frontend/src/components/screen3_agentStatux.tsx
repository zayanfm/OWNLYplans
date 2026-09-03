import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AGENT_STATUSES } from '../constants/mockData';

interface Screen3Props {
  onNext: () => void;
  onBack: () => void;
}

export const Screen3_AgentStatus: React.FC<Screen3Props> = ({ onNext, onBack }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agent Status</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>4 / 4 Active</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {AGENT_STATUSES.map((agent) => (
          <View key={agent.id} style={styles.agentCard}>
            <Text style={styles.icon}>{agent.icon}</Text>
            <Text style={styles.agentName}>{agent.name}</Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>✓ {agent.status}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 20,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  statusPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16A34A',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  agentCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  agentName: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#15803D',
    fontSize: 8,
    fontWeight: '700',
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  secondaryButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#E8E8E8' },
  secondaryButtonText: { color: '#1A1A1A', fontWeight: '700' },
  primaryButton: { flex: 2, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#D81E05' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
});

export default Screen3_AgentStatus;
