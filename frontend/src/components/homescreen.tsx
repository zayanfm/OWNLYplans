import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

export interface AccountItem {
  id: string;
  name: string;
  balance: string;
  accountNumber?: string;
  type?: string;
}

export interface HomeScreenProps {
  onOwnly?: () => void;
  onNav?: (screenKey: string) => void;
}

type TabCategory = 'Accounts' | 'Cards' | 'Investments' | 'Loans';

const ACCOUNTS_DATA = [
  {
    id: '1',
    label: 'OCBC FRANK Account',
    accountNumber: '•••• ••••',
    balance: 'S$ •,•••.••',
    subFields: [
      { label: 'Available balance', value: 'S$ •,•••.••' },
      { label: 'Debit card no.', value: '•••• •••• 1234' },
    ],
    avatarLabel: 'FRA',
    avatarBg: '#EE6C4D',
  },
  {
    id: '2',
    label: 'OCBC 360 Account',
    accountNumber: '•••• 4892',
    balance: 'S$24,180.33',
    subFields: [
      { label: 'Available balance', value: 'S$24,180.33' },
      { label: 'Savings bonus', value: 'S$12.80' },
    ],
    avatarLabel: '360',
    avatarBg: '#60A5FA',
  },
];

const QUICK_ACTIONS = [
  { id: 'paynow', label: 'PayNow' },
  { id: 'scan', label: 'Scan & Pay' },
  { id: 'fx', label: 'Foreign Exchange' },
  { id: 'customise', label: 'Customise' },
];

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    {visible ? (
      <>
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666666" strokeWidth={1.8} />
        <Circle cx={12} cy={12} r={3} stroke="#666666" strokeWidth={1.8} />
      </>
    ) : (
      <>
        <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="#666666" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </Svg>
);

const QuickActionIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'paynow':
      return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Rect x={2} y={2} width={9} height={9} rx={1.5} stroke="#D81E05" strokeWidth={1.8} />
          <Rect x={13} y={2} width={9} height={9} rx={1.5} stroke="#D81E05" strokeWidth={1.8} />
          <Rect x={2} y={13} width={9} height={9} rx={1.5} stroke="#D81E05" strokeWidth={1.8} />
          <Path d="M18.5 13.5v6M15.5 16.5h6" stroke="#D81E05" strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'scan':
      return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" stroke="#60A5FA" strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx={12} cy={12} r={3} stroke="#60A5FA" strokeWidth={1.8} />
        </Svg>
      );
    case 'fx':
      return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5" stroke="#10B981" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={3} stroke="#666666" strokeWidth={1.8} />
          <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="#666666" strokeWidth={1.8} />
        </Svg>
      );
  }
};

const ChevronRightIcon = () => (
  <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
    <Path d="M1 1l6 6-6 6" stroke="#666666" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const NavIcon = ({ name, active }: { name: string; active: boolean }) => {
  const color = active ? '#D81E05' : '#888888';
  switch (name) {
    case 'home':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'plan':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.8} />
          <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={8} y1={2} x2={8} y2={6} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={3} y1={10} x2={21} y2={10} stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case 'rewards':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={1} fill={color} />
          <Circle cx={19} cy={12} r={1} fill={color} />
          <Circle cx={5} cy={12} r={1} fill={color} />
        </Svg>
      );
  }
};

const AccountCard = ({
  account,
  hidden,
}: {
  account: (typeof ACCOUNTS_DATA)[0];
  hidden: boolean;
}) => (
  <View style={styles.accountCard}>
    <View style={styles.accountHeader}>
      <View style={styles.accountInfo}>
        <View style={[styles.avatarBadge, { backgroundColor: account.avatarBg }]}>
          <Text style={styles.avatarText}>{account.avatarLabel}</Text>
        </View>
        <View>
          <Text style={styles.accountLabel}>{account.label}</Text>
          <Text style={styles.accountNumber}>{account.accountNumber}</Text>
        </View>
      </View>
      <ChevronRightIcon />
    </View>
    {account.subFields.map((field, index) => (
      <View key={index} style={[styles.fieldRow, index > 0 && styles.fieldRowBorder]}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <Text style={[styles.fieldValue, hidden && styles.fieldValueHidden]}>
          {hidden ? '••••••' : field.value}
        </Text>
      </View>
    ))}
  </View>
);

const HeroBanner = ({ onOwnly }: { onOwnly?: () => void }) => (
  <TouchableOpacity style={styles.heroBanner} onPress={onOwnly} activeOpacity={0.9}>
    <View style={styles.heroGradient}>
      <View style={styles.heroBadge}>
        <View style={styles.heroDot} />
        <Text style={styles.heroBadgeText}>OWNLYplans Ready</Text>
      </View>
      <Text style={styles.heroWelcome}>Welcome</Text>
      <Text style={styles.heroPromoText}>
        Score S$20 cash for every friend you refer to OCBC FRANK! No limit! ›
      </Text>
    </View>
  </TouchableOpacity>
);

const QuickActionsGrid = () => (
  <View style={styles.quickActionsCard}>
    <View style={styles.quickActionsGrid}>
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity key={action.id} style={styles.quickActionItem} activeOpacity={0.7}>
          <View style={styles.quickActionIconWrap}>
            <QuickActionIcon type={action.id} />
          </View>
          <Text style={styles.quickActionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const FilterTabs = ({
  tab,
  onTab,
  privacyMode,
  onTogglePrivacy,
}: {
  tab: TabCategory;
  onTab: (t: TabCategory) => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
}) => {
  const tabs: TabCategory[] = ['Accounts', 'Cards', 'Investments', 'Loans'];
  return (
    <View style={styles.tabsSection}>
      <TouchableOpacity style={styles.privacyToggle} onPress={onTogglePrivacy} activeOpacity={0.7}>
        <EyeIcon visible={!privacyMode} />
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabPill, tab === t && styles.tabPillActive]}
            onPress={() => onTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabPillText, tab === t && styles.tabPillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const BottomNav = ({ active, onNavigate }: { active: string; onNavigate?: (key: string) => void }) => (
  <View style={styles.bottomNav}>
    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate?.('home')} activeOpacity={0.7}>
      <NavIcon name="home" active={active === 'home'} />
      <Text style={active === 'home' ? styles.navLabelActive : styles.navLabel}>Home</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate?.('plan')} activeOpacity={0.7}>
      <NavIcon name="plan" active={active === 'plan'} />
      <Text style={active === 'plan' ? styles.navLabelActive : styles.navLabel}>Plan</Text>
    </TouchableOpacity>

    <View style={styles.centerActionWrapper}>
      <TouchableOpacity style={styles.centerAction} activeOpacity={0.8}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
      <Text style={styles.centerActionLabel}>Pay & Transfer</Text>
    </View>

    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate?.('rewards')} activeOpacity={0.7}>
      <NavIcon name="rewards" active={active === 'rewards'} />
      <Text style={active === 'rewards' ? styles.navLabelActive : styles.navLabel}>Rewards</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate?.('more')} activeOpacity={0.7}>
      <NavIcon name="more" active={active === 'more'} />
      <Text style={active === 'more' ? styles.navLabelActive : styles.navLabel}>More</Text>
    </TouchableOpacity>
  </View>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOwnly }) => {
  const [tab, setTab] = useState<TabCategory>('Accounts');
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeroBanner onOwnly={onOwnly} />
        <QuickActionsGrid />
        <FilterTabs
          tab={tab}
          onTab={setTab}
          privacyMode={privacyMode}
          onTogglePrivacy={() => setPrivacyMode(!privacyMode)}
        />
        <View style={styles.accountsStack}>
          {ACCOUNTS_DATA.map((account) => (
            <AccountCard key={account.id} account={account} hidden={privacyMode} />
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroBanner: {
    marginBottom: 0,
  },
  heroGradient: {
    backgroundColor: '#D81E05',
    paddingTop: 24,
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroWelcome: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroPromoText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: -36,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickActionItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  quickActionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    color: '#1A1A1A',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  privacyToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  tabsScroll: {
    paddingRight: 16,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  tabPillActive: {
    backgroundColor: '#D81E05',
    borderColor: '#D81E05',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  accountsStack: {
    paddingHorizontal: 16,
    gap: 12,
  },
  accountCard: {
    backgroundColor: '#F5F3EF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  accountHeader: {
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
  avatarBadge: {
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
  accountLabel: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  accountNumber: {
    color: '#888888',
    fontSize: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  fieldRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  fieldLabel: {
    color: '#888888',
    fontSize: 13,
  },
  fieldValue: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
  fieldValueHidden: {
    letterSpacing: 2,
  },
  bottomSpacer: {
    height: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  navLabel: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '600',
    marginTop: 4,
  },
  navLabelActive: {
    fontSize: 10,
    color: '#D81E05',
    fontWeight: '700',
    marginTop: 4,
  },
  centerActionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  centerAction: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D81E05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  centerActionLabel: {
    fontSize: 9,
    color: '#888888',
    fontWeight: '600',
    marginTop: 4,
  },
});
