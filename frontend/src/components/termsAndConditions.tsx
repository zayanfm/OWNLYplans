import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const TermsAndConditions: React.FC<{ onAgree?: () => void; onBack?: () => void }> = ({
  onAgree,
  onBack,
}) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms & Conditions</Text>
        <Text style={styles.subtitle}>
          Please review the MAS FEAT compliance and data consent requirements.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Regulatory Compliance</Text>
          <Text style={styles.paragraph}>
            This AI Life Planner is registered with the Monetary Authority of Singapore (MAS) under the Financial Advisory and Activity Tutorial (FAAT) framework. All financial advice provided is for informational purposes only.
          </Text>

          <Text style={styles.sectionTitle}>Data Consent & PDPA</Text>
          <Text style={styles.paragraph}>
            We collect and process your banking data solely to provide personalized financial planning. Your data is protected under Singapore's Personal Data Protection Act (PDPA). You may withdraw consent at any time.
          </Text>

          <Text style={styles.sectionTitle}>AI Sourcing</Text>
          <Text style={styles.paragraph}>
            Your financial data is sourced from OCBC banking systems and processed through our secure AI planning engine. No third-party data sharing occurs without explicit consent.
          </Text>

          <View style={styles.checkContainer}>
            <View style={styles.checkBox}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.checkText}>I agree to the Terms & Conditions</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.agreeButton} onPress={onAgree}>
          <Text style={styles.agreeButtonText}>Agree</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 4,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 18,
    marginBottom: 12,
  },
  checkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkMark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  agreeButton: {
    backgroundColor: '#D81E05',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  agreeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});