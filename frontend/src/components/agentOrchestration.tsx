import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AGENT_STATUSES } from '../constants/mockData';

export const AgentOrchestration: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Agent Status</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>4 / 4 Active</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {AGENT_STATUSES.map((agent) => {
          return (
            <View key={agent.id} style={styles.agentCard}>
              <Text style={styles.icon}>{agent.icon}</Text>
              <Text style={styles.agentName}>{agent.name}</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>✓ {agent.status}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
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
});