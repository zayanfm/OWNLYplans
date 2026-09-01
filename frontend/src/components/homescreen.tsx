import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

// --- Interfaces & Types ---

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

export interface PlanScreenProps {
  onOwnly?: () => void;
  onNav?: (screenKey: string) => void;
}

type TabCategory = 'Accounts' | 'Cards' | 'Investments';

// --- Mock Data & Component Placeholders ---
// Replace these with your actual imported components and data constants

const ACCOUNTS: AccountItem[] = [
  { id: '1', name: '360 Account', balance: 'S$42,500.00', accountNumber: '588-123456-001' },
  { id: '2', name: 'Frank Account', balance: 'S$3,240.50', accountNumber: '588-987654-001' },
];

const CARDS: AccountItem[] = [
  { id: 'c1', name: 'OCBC 365 Credit Card', balance: 'S$1,240.00' },
];

const INVESTMENTS: AccountItem[] = [
  { id: 'i1', name: 'LionGlobal SGD MMF', balance: 'S$18,450.00' },
];

const TopActionBar = () => <View style={styles.placeholderBar} />;
const HeroBanner = ({ onOwnly }: { onOwnly?: () => void }) => (
  <TouchableOpacity style={styles.heroPlaceholder} onPress={onOwnly}>
    <Text style={styles.heroPlaceholderText}>Hero Banner (Tap for OWNLY)</Text>
  </TouchableOpacity>
);
const QuickActions = () => <View style={styles.placeholderBar} />;
const FilterTabs = ({ tab, onTab }: { tab: TabCategory; onTab: (t: TabCategory) => void }) => (
  <View style={styles.filterRow}>
    {(['Accounts', 'Cards', 'Investments'] as TabCategory[]).map((t) => (
      <TouchableOpacity
        key={t}
        style={[styles.tabButton, tab === t && styles.tabButtonActive]}
        onPress={() => onTab(t)}
      >
        <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
      </TouchableOpacity>
    ))}
  </View>
);
const AccountCard = ({ acct }: { acct: AccountItem; delay?: number }) => (
  <View style={styles.accountCard}>
    <Text style={styles.accountName}>{acct.name}</Text>
    <Text style={styles.accountBalance}>{acct.balance}</Text>
  </View>
);
const AllocationFlow = () => <View style={styles.placeholderBar} />;
const BottomNav = ({ active, onNavigate }: { active: string; onNavigate?: (key: string) => void }) => <View />;

// --- Component 1: HomeScreen ---

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOwnly, onNav }) => {
  const [tab, setTab] = useState<TabCategory>('Accounts');

  const list: AccountItem[] =
    tab === 'Accounts' ? ACCOUNTS : tab === 'Cards' ? CARDS : tab === 'Investments' ? INVESTMENTS : [];

  return (
    <SafeAreaView style={styles.container}>
      <TopActionBar />
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <HeroBanner onOwnly={onOwnly} />
        <QuickActions />
        <FilterTabs tab={tab} onTab={setTab} />
        {list.length > 0 ? (
          list.map((a, i) => (
            <AccountCard key={a.id} acct={a} delay={i * 0.05} />
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No {tab.toLowerCase()} linked yet.</Text>
          </View>
        )}
      </ScrollView>
      <BottomNav active="home" onNavigate={onNav} />
    </SafeAreaView>
  );
};

// --- Component 2: PlanScreen ---

export const PlanScreen: React.FC<PlanScreenProps> = ({ onOwnly, onNav }) => {
  return (
    <SafeAreaView style={styles.containerBg}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Plan</Text>
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusBadgeText}>AI Active</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* OWNLYplans Hero Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onOwnly}
          style={styles.ownlyHeroCard}
        >
          <View style={styles.badgeRow}>
            <View style={styles.whiteDot} />
            <Text style={styles.badgeText}>New · OWNLYplans AI</Text>
          </View>
          <Text style={styles.ownlyTitle}>Your June 2026{'\n'}plan is ready.</Text>
          <View style={styles.metricsRow}>
            {[
              ['Est. gain', '+S$340/mo'],
              ['Agents', '4 active'],
              ['Actions', '6 planned'],
            ].map(([l, v]) => (
              <View key={l} style={styles.metricItem}>
                <Text style={styles.metricValue}>{v}</Text>
                <Text style={styles.metricLabel}>{l}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Savings Goal Progress */}
        <View style={styles.card}>
          <Text style={styles.cardSubHeader}>BTO Goal · Dec 2027</Text>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.goalValue}>
              S$40,800 <Text style={styles.goalTarget}>of S$60,000</Text>
            </Text>
            <Text style={styles.goalPct}>68%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '68%' }]} />
          </View>
          <Text style={styles.progressFooter}>
            On track · OWNLYplans suggests +S$200/mo to hit 2 months early
          </Text>
        </View>

        {/* AI Life Planner Entry Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => onNav?.('aiPlanner')}
          style={styles.aiPlannerCard}
        >
          <View style={styles.badgeRow}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
            <Text style={styles.aiPlannerTag}>AI Life Planner</Text>
          </View>

          <Text style={styles.aiPlannerTitle}>
            Build your long-term{'\n'}financial roadmap
          </Text>
          <Text style={styles.aiPlannerSub}>
            Personalised 5 or 10-year plan · Powered by OWNLYplans AI
          </Text>

          <View style={styles.aiPlannerFeaturesRow}>
            <View style={styles.featurePill}>
              <Text style={styles.featureEmoji}>🤖</Text>
              <Text style={styles.featurePillText}>4 AI Agents</Text>
            </View>
            <View style={styles.featurePill}>
              <Text style={styles.featureEmoji}>⚡</Text>
              <Text style={styles.featurePillText}>Ready in 30s</Text>
            </View>
            <View style={styles.ctaRight}>
              <Text style={styles.ctaText}>Get started →</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Step 2: Smart Allocation Flow */}
        <AllocationFlow />
      </ScrollView>

      <BottomNav active="plan" onNavigate={onNav} />
    </SafeAreaView>
  );
};

// --- StyleSheet ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerBg: {
    flex: 1,
    backgroundColor: '#F5F4F0',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D81E05',
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#767676',
  },
  placeholderBar: {
    height: 16,
    marginBottom: 12,
  },
  heroPlaceholder: {
    backgroundColor: '#EAEAEA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  heroPlaceholderText: {
    color: '#767676',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F4F0',
  },
  tabButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  tabText: {
    fontSize: 12,
    color: '#767676',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 10,
  },
  accountName: {
    fontSize: 12,
    color: '#767676',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  emptyStateContainer: {
    marginHorizontal: 16,
    backgroundColor: '#EDE8DF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#767676',
    fontSize: 14,
  },
  ownlyHeroCard: {
    backgroundColor: '#D81E05',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  whiteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  ownlyTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
    lineHeight: 28,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  metricItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricValue: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 9,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 12,
  },
  cardSubHeader: {
    color: '#767676',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalValue: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  goalTarget: {
    color: '#767676',
    fontWeight: '400',
    fontSize: 12,
  },
  goalPct: {
    color: '#D81E05',
    fontWeight: '700',
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F0EDE8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D81E05',
    borderRadius: 4,
  },
  progressFooter: {
    color: '#767676',
    fontSize: 10,
    marginTop: 8,
  },
  aiPlannerCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  newBadge: {
    backgroundColor: '#D81E05',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  aiPlannerTag: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  aiPlannerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  aiPlannerSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginBottom: 16,
  },
  aiPlannerFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  featureEmoji: {
    fontSize: 14,
  },
  featurePillText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  ctaRight: {
    marginLeft: 'auto',
  },
  ctaText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '700',
  },
});