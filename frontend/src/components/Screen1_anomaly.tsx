import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ANOMALY_NOTICE } from '../constants/mockData';

interface Screen1Props {
  onNext?: () => void;
  onBack?: () => void;
}

export const Screen1_Anomaly: React.FC<Screen1Props> = ({ onNext, onBack }) => {
  return (
    <View style={styles.container}>
      {/* Top Warning Banner */}
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={styles.badgeCard} 
        onPress={onNext}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.content}>
          <Text style={styles.title}>{ANOMALY_NOTICE.title}</Text>
          <Text style={styles.detail}>{ANOMALY_NOTICE.detail}</Text>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{ANOMALY_NOTICE.badge}</Text>
        </View>
      </TouchableOpacity>

      {/* Main Viewport Content Placeholder */}
      <View style={styles.mainBody}>
        <Text style={styles.bodyHint}>Review your cashflow anomaly details above.</Text>
      </View>

      {/* Bottom Action Area */}
      {onNext && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Proceed to Allocation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0',
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
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
  mainBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyHint: {
    color: '#8A8A8A',
    fontSize: 14,
  },
  footer: {
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#D81E05',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default Screen1_Anomaly;
