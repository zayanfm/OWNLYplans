import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FinancialAccount } from '../constants/mockData';

interface AccountCardProps {
  acct: FinancialAccount;
  delay?: number;
}

export const AccountCard: React.FC<AccountCardProps> = ({ acct }) => {
  return (
    <TouchableOpacity style={styles.cardContainer} activeOpacity={0.85}>
      <View style={styles.innerPadding}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.accountInfo}>
            <View style={[styles.avatar, { backgroundColor: acct.avatarBg }]}>
              <Text style={styles.avatarText}>{acct.avatar}</Text>
            </View>
            <View>
              <Text style={styles.label}>{acct.label}</Text>
              <Text style={styles.subText}>{acct.sub}</Text>
            </View>
          </View>
          <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
            <Path d="M1 1l6 6-6 6" stroke="#767676" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{acct.field}</Text>
            <Text style={styles.balanceValue}>{acct.bal}</Text>
          </View>
          <View style={[styles.fieldRow, styles.borderTopLight]}>
            <Text style={styles.fieldLabel}>{acct.field2}</Text>
            <Text style={styles.fieldValue}>{acct.field2val}</Text>
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
    backgroundColor: '#EDE8DF',
    overflow: 'hidden',
  },
  innerPadding: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  subText: {
    color: '#767676',
    fontSize: 12,
  },
  balanceSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  borderTopLight: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  fieldLabel: {
    color: '#767676',
    fontSize: 12,
  },
  balanceValue: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  fieldValue: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '500',
  },
});