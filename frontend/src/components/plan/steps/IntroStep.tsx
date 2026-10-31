import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const HIGHLIGHTS = [
  {
    icon: '👨‍👩‍👦',
    title: 'One household view',
    detail: 'Every member, account, CPF balance and goal in a single place.',
  },
  {
    icon: '🇸🇬',
    title: 'Never miss a grant',
    detail: 'We scan HDB, CPF and MSF schemes your family is eligible for.',
  },
  {
    icon: '🧠',
    title: 'We guide. You decide.',
    detail: 'Explainable next-best actions — every decision stays with you.',
  },
];

export const IntroStep: React.FC<{ onStart: () => void; onHelp?: () => void }> = ({ onStart, onHelp }) => (
  <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>NEW · FAMILY FINANCIAL ENGINE</Text>
        </View>
        {onHelp ? (
          <TouchableOpacity
            style={styles.helpButton}
            onPress={onHelp}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="OWNLYplan help and transparency"
          >
            <Text style={styles.helpButtonText}>?</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.title}>OWNLYplan</Text>
      <Text style={styles.description}>
        Your family&apos;s finances, life stages and government support brought into one evolving plan.
        OWNLYplan connects your household through Singpass and SGFinDex, then keeps the plan up to
        date as life changes.
      </Text>

      <View style={styles.highlightStack}>
        {HIGHLIGHTS.map((item) => (
          <View key={item.title} style={styles.highlightRow}>
            <View style={styles.highlightIconWrap}>
              <Text style={styles.highlightIcon}>{item.icon}</Text>
            </View>
            <View style={styles.highlightTextWrap}>
              <Text style={styles.highlightTitle}>{item.title}</Text>
              <Text style={styles.highlightDetail}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>
        Setup takes about a minute. Nothing is shared with your family members without their approval.
      </Text>
    </ScrollView>

    <View style={styles.footer}>
      <TouchableOpacity style={styles.primaryButton} onPress={onStart} activeOpacity={0.85}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  topRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0EE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D81E05',
    letterSpacing: 0.6,
  },
  helpButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEDAD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    color: '#4F4B45',
    fontSize: 16,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#666666',
    marginBottom: 20,
  },
  highlightStack: {
    gap: 12,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    gap: 12,
  },
  highlightIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightIcon: {
    fontSize: 20,
  },
  highlightTextWrap: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  highlightDetail: {
    fontSize: 12,
    lineHeight: 17,
    color: '#666666',
  },
  footnote: {
    fontSize: 11,
    color: '#888888',
    marginTop: 16,
    lineHeight: 16,
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

export default IntroStep;
