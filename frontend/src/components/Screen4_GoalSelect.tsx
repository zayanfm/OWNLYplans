import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface Screen4Props {
  onPersonal: () => void;
  onShared: (partnerAccount: string) => void;
  onBack: () => void;
}

type GoalType = 'personal' | 'shared';

interface GoalOption {
  val: GoalType;
  icon: string;
  label: string;
  sub: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    val: 'personal',
    icon: '👤',
    label: 'Personal Goals',
    sub: 'Plan for yourself — savings, investments, protection',
  },
  {
    val: 'shared',
    icon: '👫',
    label: 'Shared Goals',
    sub: 'Plan together with a partner toward joint milestones',
  },
];

export const Screen4_GoalSelect: React.FC<Screen4Props> = ({
  onPersonal,
  onShared,
  onBack,
}) => {
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [partnerAccount, setPartnerAccount] = useState<string>('');

  const canSubmit = partnerAccount.replace(/\s/g, '').length >= 6;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Your Goal</Text>
          <Text style={styles.headerSub}>Choose how you'd like to plan</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>What are you planning for?</Text>
        <Text style={styles.subtitle}>
          Your choice shapes the AI's recommendations and timeline.
        </Text>

        {/* Goal Type Selector */}
        <View style={styles.optionGroup}>
          {GOAL_OPTIONS.map((o) => {
            const isSelected = goalType === o.val;
            return (
              <TouchableOpacity
                key={o.val}
                activeOpacity={0.8}
                onPress={() => setGoalType(o.val)}
                style={[
                  styles.optionCard,
                  isSelected ? styles.optionSelected : styles.optionUnselected,
                ]}
              >
                <Text style={styles.optionIcon}>{o.icon}</Text>
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

        {/* Dynamic Partner Input */}
        {goalType === 'shared' && (
          <View style={styles.partnerContainer}>
            <Text style={styles.partnerTitle}>Link Your Partner's Account</Text>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Partner's Account Number</Text>
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

      {/* Bottom Action Footer */}
      <View style={styles.footer}>
        {goalType === 'personal' && (
          <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={onPersonal}>
            <Text style={styles.primaryBtnText}>Continue →</Text>
          </TouchableOpacity>
        )}

        {goalType === 'shared' && canSubmit && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryBtn}
            onPress={() => onShared(partnerAccount)}
          >
            <Text style={styles.primaryBtnText}>Submit Invitation →</Text>
          </TouchableOpacity>
        )}

        {(!goalType || (goalType === 'shared' && !canSubmit)) && (
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledBtnText}>
              {goalType === 'shared'
                ? 'Enter account number above'
                : 'Select a goal type above'}
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
    backgroundColor: '#F5F4F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  backBtnText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  headerTitle: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 16,
  },
  headerSub: {
    color: '#767676',
    fontSize: 10,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    color: '#1A1A1A',
    fontWeight: '900',
    fontSize: 20,
    marginBottom: 8,
  },
  subtitle: {
    color: '#767676',
    fontSize: 14,
    marginBottom: 20,
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
    fontSize: 36,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
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
  inputLabel: {
    color: '#767676',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
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