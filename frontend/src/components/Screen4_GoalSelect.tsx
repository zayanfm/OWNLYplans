import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface PlanningForProps {
  onPersonal: () => void;
  onShared: (partnerAccount?: string) => void;
  onBack: () => void;
}

const GOAL_OPTIONS = [
  {
    val: 'personal' as const,
    label: 'Myself',
    sub: 'Plan for yourself — savings, investments, protection',
  },
  {
    val: 'shared' as const,
    label: 'With Partner / Couple',
    sub: 'Plan together with a partner toward joint milestones',
  },
];

export const Screen4_GoalSelect: React.FC<PlanningForProps> = ({
  onPersonal,
  onShared,
  onBack,
}) => {
  const [selectedGoal, setSelectedGoal] = React.useState<'personal' | 'shared' | null>(null);
  const [partnerAccount, setPartnerAccount] = React.useState<string>('');

  const canSubmit = selectedGoal === 'personal' || (selectedGoal === 'shared' && partnerAccount.replace(/\s/g, '').length >= 6);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Who are you planning for?</Text>
        <Text style={styles.subtitle}>
          Choose your planning mode to personalise your AI roadmap.
        </Text>

        <View style={styles.optionGroup}>
          {GOAL_OPTIONS.map((o) => {
            const isSelected = selectedGoal === o.val;
            return (
              <TouchableOpacity
                key={o.val}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedGoal(o.val);
                  if (o.val === 'shared') {
                    setPartnerAccount('');
                  }
                }}
                style={[
                  styles.optionCard,
                  isSelected ? styles.optionSelected : styles.optionUnselected,
                ]}
              >
                <Text style={styles.optionIcon}>{o.label === 'Myself' ? '👤' : '👫'}</Text>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {o.label}
                  </Text>
                  <Text style={styles.optionSub}>{o.sub}</Text>
                </View>

                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedGoal === 'shared' && (
          <View style={styles.partnerContainer}>
            <Text style={styles.partnerTitle}>Partner's OCBC 360 Account</Text>
            <View style={styles.inputCard}>
              <TextInput
                value={partnerAccount}
                onChangeText={(text: string) => setPartnerAccount(text)}
                placeholder="e.g.  360-123-456-7"
                placeholderTextColor="#A3A3A3"
                keyboardType="numeric"
                style={styles.textInput}
              />
              {partnerAccount.length > 0 && !canSubmit && (
                <Text style={styles.warningText}>
                  Enter at least 6 digits to continue
                </Text>
              )}
            </View>
            <Text style={styles.disclaimerText}>
              Your partner will receive an in-app invitation to join your shared plan.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {selectedGoal === 'personal' && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryBtn}
            onPress={() => {
              onPersonal();
            }}
          >
            <Text style={styles.primaryBtnText}>Continue →</Text>
          </TouchableOpacity>
        )}

        {selectedGoal === 'shared' && canSubmit && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryBtn}
            onPress={() => {
              onShared(partnerAccount);
            }}
          >
            <Text style={styles.primaryBtnText}>Continue →</Text>
          </TouchableOpacity>
        )}

        {!canSubmit && (
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledBtnText}>
              {selectedGoal === 'shared'
                ? 'Enter partner account number above'
                : 'Select a planning mode above'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backBtnText: {
    fontSize: 20,
    color: '#D81E05',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  optionGroup: {
    gap: 16,
  },
  optionCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    gap: 16,
  },
  optionUnselected: {
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    borderColor: '#D81E05',
    backgroundColor: '#FEF2F2',
  },
  optionIcon: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1A1A1A',
  },
  optionLabelSelected: {
    color: '#D81E05',
  },
  optionSub: {
    color: '#767676',
    fontSize: 12,
    marginTop: 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  partnerContainer: {
    marginTop: 20,
  },
  partnerTitle: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 12,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    padding: 16,
    marginBottom: 12,
  },
  textInput: {
    width: '100%',
    backgroundColor: '#F5F4F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  warningText: {
    color: '#D97706',
    fontSize: 10,
    marginTop: 8,
  },
  disclaimerText: {
    color: '#767676',
    fontSize: 10,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
  },
  disabledBtnText: {
    color: '#AAAAAA',
    fontWeight: '700',
    fontSize: 16,
  },
});