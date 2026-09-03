import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FinancialAccount } from '../constants/mockData';

interface AccountCardProps {
  acct: FinancialAccount;
  delay?: number;
  onPress?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ acct, onPress }) => {
  const avatarLabel = acct.label.substring(0, 3).toUpperCase();

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.innerPadding}>
        <View style={styles.headerRow}>
          <View style={styles.accountInfo}>
            <View style={[styles.avatarBubble, { backgroundColor: acct.avatarBg || '#D81E05' }]}>
              <Text style={styles.avatarText}>{avatarLabel}</Text>
            </View>
            <View>
              <Text style={styles.label}>{acct.label}</Text>
              <Text style={styles.maskedAccount}>
                {acct.accountNumber ? `•••• ${acct.accountNumber.slice(-4)}` : '•••• ••••'}
              </Text>
            </View>
          </View>
          <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
            <Path d="M1 1l6 6-6 6" stroke="#666666" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>

        <View style={styles.balanceSection}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>{acct.balance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#F5F3EF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  innerPadding: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  maskedAccount: {
    color: '#888888',
    fontSize: 12,
  },
  balanceSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fieldLabel: {
    color: '#888888',
    fontSize: 13,
  },
  balanceValue: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 20,
  },
});