import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MockPassAuthResponse } from '../../../services/api';

const Field = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

export const MyInfoReviewStep: React.FC<{
  profile: MockPassAuthResponse;
  onNext: () => void;
  onBack: () => void;
}> = ({ profile, onNext, onBack }) => {
  const user = profile.user;
  const money = (v?: number) => `S$${(v || 0).toLocaleString()}`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Retrieved from MyInfo</Text>
        <Text style={styles.subtitle}>
          Verified by Singpass — these fields are read-only and cannot be edited.
        </Text>

        <View style={styles.card}>
          <View style={styles.verifiedBanner}>
            <Text style={styles.verifiedText}>🔒 Singpass MyInfo Verified</Text>
          </View>

          <Field label="Name" value={user.name} />
          <Field label="NRIC" value={user.nric} />
          <Field label="Citizenship" value={user.citizenship} />
          <Field label="Marital Status" value={user.maritalStatus || 'Married'} />
          <Field label="Employment" value={user.employment} />
          <Field label="Monthly Gross Income" value={money(user.monthlyGrossIncome)} />
          <Field label="CPF Ordinary (OA)" value={money(user.cpf?.oa)} />
          <Field label="CPF Special (SA)" value={money(user.cpf?.sa)} />
          <Field label="CPF MediSave (MA)" value={money(user.cpf?.ma)} />
          <Field label="Housing" value={profile.household?.housing?.type || '4-Room BTO (Pending)'} />
          <Field label="Dependents" value={`${profile.household?.dependentsCount || 0} dependent(s)`} />
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Because you are married</Text>
          <Text style={styles.insightBody}>
            OWNLYplan will next connect your other banks through SGFinDex, and ask your spouse and
            children for permission to join the household plan.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Continue</Text>
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
    paddingTop: 8,
    paddingBottom: 32,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 18,
    color: '#D81E05',
    fontWeight: '700',
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
    color: '#666666',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
  },
  verifiedBanner: {
    backgroundColor: '#E8F4FD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A73E8',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  insightCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 14,
    marginTop: 14,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D81E05',
    marginBottom: 4,
  },
  insightBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#666666',
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

export default MyInfoReviewStep;
