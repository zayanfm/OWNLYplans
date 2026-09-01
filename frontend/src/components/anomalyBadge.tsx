import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ANOMALY_NOTICE } from '../constants/mockData';

export const AnomalyBadge: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.badgeCard}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.content}>
          <Text style={styles.title}>{ANOMALY_NOTICE.title}</Text>
          <Text style={styles.detail}>{ANOMALY_NOTICE.detail}</Text>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{ANOMALY_NOTICE.badge}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 14,
  },
  detail: {
    color: '#D97706',
    fontSize: 12,
    marginTop: 2,
  },
  badgePill: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '900',
  },
});