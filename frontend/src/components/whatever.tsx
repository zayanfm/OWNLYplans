import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ==========================================
// 1. DATA TYPES & INTERFACES
// ==========================================

export interface AgentData {
  id: string;
  icon: string;
  label: string;
  conf: number;
  finding: string;
  action: string;
  color: string;
  text: string;
}

export interface PromoData {
  id: string;
  brand: string;
  tag: string;
  tagCls: string;
  title: string;
  sub: string;
  cta: string;
  grad: string;
  logo: string;
}

export interface RouteData {
  icon: string;
  to: string;
  yield: string;
  color: string;
  amt: string;
}

export interface ModeConfig {
  pill: string;
  cls: string;
  bg: string;
  ring: string;
  style: string;
}

// ==========================================
// 2. MOCK CONSTANTS & PLACEHOLDERS
// ==========================================

const USER = { first: 'Alex', partner: 'Sam', segment: 'Premier Wealth' };

const MODES: Record<string, ModeConfig> = {
  Low: {
    pill: 'Low Autonomy',
    cls: 'text-blue-600',
    bg: 'bg-blue-600',
    ring: 'border-blue-200',
    style: 'Notify & Wait',
  },
  Medium: {
    pill: 'Medium Autonomy',
    cls: 'text-amber-600',
    bg: 'bg-amber-600',
    ring: 'border-amber-200',
    style: 'Auto-Execute with 24h Window',
  },
  High: {
    pill: 'High Autonomy',
    cls: 'text-green-600',
    bg: 'bg-green-600',
    ring: 'border-green-200',
    style: 'Full Auto Execution',
  },
};

const AGENTS: AgentData[] = [
  {
    id: 'a1',
    icon: '📊',
    label: 'Cashflow Agent',
    conf: 98,
    finding: 'Idle cash S$1,000 detected earning 0.05% p.a.',
    action: 'Sweep to LionGlobal MMF at 3.85% p.a.',
    color: 'border-amber-200 bg-amber-50/50',
    text: 'text-amber-800',
  },
  {
    id: 'a2',
    icon: '🏠',
    label: 'BTO Goal Agent',
    conf: 94,
    finding: 'S$40,800 saved of S$60,000 target by Dec 2027.',
    action: 'Increase monthly pot allocation from S$400 → S$600.',
    color: 'border-red-200 bg-red-50/50',
    text: 'text-red-800',
  },
];

const PROMOS: PromoData[] = [
  {
    id: 'p1',
    brand: 'GREAT EASTERN',
    tag: 'RECOMMENDED',
    tagCls: 'bg-white/20 text-white',
    title: 'FlexiLife Health',
    sub: 'Comprehensive medical coverage tailored to your family setup.',
    cta: 'Get Quote',
    grad: 'from-red-600 to-rose-700',
    logo: '🛡️',
  },
];

const ALLOC_ROUTES: RouteData[] = [
  { icon: '📈', to: 'LionGlobal MMF', yield: '3.85% p.a.', color: 'text-green-600', amt: '+S$1,000' },
  { icon: '🏠', to: 'BTO Pot Allocation', yield: 'Target: Dec 2027', color: 'text-red-600', amt: '+S$200' },
];

// Placeholder components imported or defined elsewhere in your project
const AgentOrchestration = () => <View style={{ height: 40, backgroundColor: '#EAEAEA', borderRadius: 12, marginBottom: 12 }} />;
const HomeScreen = ({ onOwnly, onNav }: { onOwnly: () => void; onNav: (key: string) => void }) => <View />;
const PlanLandingTab = ({ onStart, onNav }: { onStart: () => void; onNav: (key: string) => void }) => <View />;
const AIPlannerFlow = ({ onNav, onComplete, onBackToLanding }: { onNav: (key: string) => void; onComplete: (setup: any) => void; onBackToLanding: () => void }) => <View />;
const AIPlanDashboard = ({ setup, onNav }: { setup: any; onNav: (key: string) => void }) => <View />;
const HelpFAB = ({ onClick }: { onClick: () => void }) => (
  <TouchableOpacity style={styles.fab} onPress={onClick}>
    <Text style={{ color: '#FFF' }}>?</Text>
  </TouchableOpacity>
);
const HelpPortal = ({ onClose }: { onClose: () => void }) => <View />;

// ==========================================
// 3. AGENT CARD COMPONENT
// ==========================================

export const AgentCard: React.FC<{ a: AgentData; i: number }> = ({ a }) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setOpen((o) => !o)}
      style={styles.agentCardContainer}
    >
      <View style={styles.agentCardHeader}>
        <Text style={styles.agentIcon}>{a.icon}</Text>
        <View style={styles.agentMetaContainer}>
          <View style={styles.agentTagRow}>
            <Text style={styles.agentLabel}>{a.label}</Text>
            <Text style={styles.agentConf}>· {a.conf}% conf.</Text>
          </View>
          <Text style={styles.agentFinding}>{a.finding}</Text>

          {open && (
            <View style={styles.agentActionBox}>
              <Text style={styles.agentActionTitle}>Action</Text>
              <Text style={styles.agentActionBody}>{a.action}</Text>
            </View>
          )}
        </View>
        <Text style={styles.agentChevron}>{open ? '▲' : '▼'}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ==========================================
// 4. OWNLYSCREEN COMPONENT
// ==========================================

export const OwnlyScreen: React.FC<{ onNav: (screenKey: string) => void; onHelp?: () => void }> = ({ onNav }) => {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<string>('Medium');
  const [approved, setApproved] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const m = MODES[mode] || MODES.Medium;

  function approve() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setApproved(true);
    }, 1400);
  }

  const COMPLETED_ACTIONS = [
    { action: 'MMF Route: S$1,000 → LionGlobal', status: '✅ Completed' },
    { action: 'Spend cap S$420/mo activated', status: '✅ Completed' },
    { action: 'BTO Goal Pot +S$200 allocation', status: '✅ Completed' },
    { action: 'FRANK Card auto-pay S$1,240', status: '✅ Completed' },
    { action: 'GE FlexiLife Health quote dispatched', status: '✅ Completed' },
    { action: 'Audit trail logged & immutable', status: '✅ Completed' },
  ];

  if (approved) {
    return (
      <SafeAreaView style={styles.containerBg}>
        <ScrollView contentContainerStyle={styles.successContent}>
          <View style={styles.successIconCircle}>
            <Svg width="36" height="28" viewBox="0 0 36 28" fill="none">
              <Path d="M2 14L13 25L34 2" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={styles.successTitle}>Plan Activated!</Text>
          <Text style={styles.successSub}>OWNLYplans executed your June 2026 strategy in</Text>
          <Text style={styles.successModePill}>{m.pill}</Text>

          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Execution Summary</Text>
            {COMPLETED_ACTIONS.map((item, i) => (
              <View key={i} style={styles.summaryRow}>
                <Text style={styles.summaryActionText}>{item.action}</Text>
                <Text style={styles.summaryStatusText}>{item.status}</Text>
              </View>
            ))}
          </View>

          <View style={styles.darkCard}>
            <Text style={styles.darkSectionHeader}>Governance</Text>
            {[
              'Immutable audit trail recorded',
              'FEAT compliance confirmed',
              'Manual override remains available',
            ].map((g, i) => (
              <View key={i} style={styles.govRow}>
                <Text style={styles.govCheck}>✓</Text>
                <Text style={styles.govText}>{g}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.homeButton} onPress={() => onNav('home')}>
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.containerBg}>
      {/* Top Header */}
      <View style={styles.topHeaderNav}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => onNav('plan')}>
          <Svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <Path d="M9 1L1 9l8 8" stroke="#D81E05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitleText}>OWNLYplans</Text>
          <Text style={styles.headerSubText}>June 2026 Monthly Review</Text>
        </View>
        <View style={styles.aiBadgeRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.aiBadgeText}>AI Active</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.reviewScrollContent}>
        {/* Dark Strategy Hero */}
        <View style={styles.darkHeroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.darkHeroSubTag}>OCBC AI Monthly Plan</Text>
          </View>
          <Text style={styles.darkHeroTitle}>June 2026 Strategy</Text>
          <Text style={styles.darkHeroSubtitle}>
            {USER.first} & {USER.partner} · {USER.segment}
          </Text>

          <View style={styles.darkGrid}>
            {[
              ['Est. Gain', '+S$340/mo', '#4ADE80'],
              ['Actions', '6 planned', '#FFFFFF'],
              ['Source', 'Financial.pdf', '#60A5FA'],
            ].map(([l, v, c]) => (
              <View key={l} style={styles.darkGridItem}>
                <Text style={[styles.darkGridValue, { color: c }]}>{v}</Text>
                <Text style={styles.darkGridLabel}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* We Guide, U Decide Selector */}
        <View style={styles.card}>
          <View style={styles.cardHeaderFlex}>
            <Text style={styles.cardTitle}>We Guide, U Decide</Text>
            <TouchableOpacity><Text style={styles.linkText}>What's this?</Text></TouchableOpacity>
          </View>

          <View style={styles.pillContainer}>
            {['Low', 'Medium', 'High'].map((lv) => (
              <TouchableOpacity
                key={lv}
                onPress={() => setMode(lv)}
                style={[styles.modePill, mode === lv && styles.modePillActive]}
              >
                <Text style={[styles.modePillText, mode === lv && styles.modePillTextActive]}>{lv}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modeStatusRow}>
            <Text style={styles.modeStatusLabel}>Current mode</Text>
            <Text style={styles.modeStatusValue}>{m.style}</Text>
          </View>
        </View>

        <AgentOrchestration />

        {/* Agent Recommendations */}
        <Text style={styles.sectionTitleText}>
          Agent Recommendations <Text style={styles.sectionSubtitleText}>Tap to expand</Text>
        </Text>
        {AGENTS.map((a, i) => (
          <AgentCard key={a.id} a={a} i={i} />
        ))}

        {/* For You Promo Carousel */}
        <View style={{ marginBottom: 16, marginTop: 8 }}>
          <View style={styles.cardHeaderFlex}>
            <Text style={styles.cardTitle}>For You</Text>
            <Text style={styles.linkText}>Curated by OWNLYplans</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {PROMOS.map((p) => (
              <View key={p.id} style={styles.promoCardContainer}>
                <View style={styles.badgeRow}>
                  <Text style={{ fontSize: 24 }}>{p.logo}</Text>
                  <View>
                    <Text style={styles.promoBrandText}>{p.brand}</Text>
                    <View style={styles.promoTagPill}>
                      <Text style={styles.promoTagText}>{p.tag}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.promoTitle}>{p.title}</Text>
                <Text style={styles.promoSub}>{p.sub}</Text>
                <TouchableOpacity style={styles.promoCtaButton}>
                  <Text style={styles.promoCtaText}>{p.cta} →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Surplus Routing Section */}
        <View style={styles.surplusContainer}>
          <View style={styles.cardHeaderFlex}>
            <Text style={styles.cardTitle}>Surplus Routing</Text>
            <View style={styles.yieldTag}><Text style={styles.yieldTagText}>0.05% → 3.85%</Text></View>
          </View>
          {ALLOC_ROUTES.map((r, i) => (
            <View key={i} style={styles.routeRow}>
              <Text style={{ fontSize: 18 }}>{r.icon}</Text>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.routeToText}>{r.to}</Text>
                <Text style={styles.routeYieldText}>{r.yield}</Text>
              </View>
              <Text style={[styles.routeAmtText, { color: r.color === 'text-green-600' ? '#16A34A' : '#D81E05' }]}>
                {r.amt}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimerText}>For information only. Not financial advice.</Text>
      </ScrollView>

      {/* Sticky Approve Drawer */}
      <View style={[styles.approveDrawer, { bottom: 82 + insets.bottom }]}>
        <View style={styles.approveDrawerMeta}>
          <View>
            <Text style={styles.drawerMetaText}>Mode: <Text style={{ fontWeight: '700' }}>{mode} Autonomy</Text></Text>
            <Text style={styles.drawerMetaText}>Est. monthly gain: <Text style={{ color: '#16A34A', fontWeight: '700' }}>+S$340</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.greenDot} />
            <Text style={styles.drawerMetaText}>Plan verified</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.approveButton, loading && styles.approveButtonDisabled]}
          disabled={loading}
          onPress={approve}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.approveButtonText}>Executing Plan…</Text>
            </View>
          ) : (
            <Text style={styles.approveButtonText}>Approve & Execute Plan</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// 5. ROOT APP COMPONENT
// ==========================================

export default function App() {
  const [screen, setScreen] = useState<string>('home');
  const [planStarted, setPlanStarted] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [planSetup, setPlanSetup] = useState<any>(null);

  function nav(to: string) {
    setScreen(to);
    if (to !== 'plan') setPlanStarted(false);
  }

  const onPlan = screen === 'plan';
  const inWizard = onPlan && planStarted && !planSetup;
  const onDashboard = onPlan && !!planSetup;
  const onLanding = onPlan && !planStarted && !planSetup;

  return (
    <View style={{ flex: 1 }}>
      {screen === 'ownly' && <OwnlyScreen onNav={nav} onHelp={() => setShowHelp(true)} />}
      {screen === 'home' && <HomeScreen onOwnly={() => nav('ownly')} onNav={nav} />}

      {onLanding && (
        <PlanLandingTab onStart={() => setPlanStarted(true)} onNav={nav} />
      )}

      {inWizard && (
        <AIPlannerFlow
          onNav={nav}
          onComplete={(setup) => setPlanSetup(setup)}
          onBackToLanding={() => setPlanStarted(false)}
        />
      )}

      {onDashboard && (
        <AIPlanDashboard setup={planSetup} onNav={nav} />
      )}

      {!inWizard && !onDashboard && <HelpFAB onClick={() => setShowHelp(true)} />}
      {showHelp && <HelpPortal onClose={() => setShowHelp(false)} />}
    </View>
  );
}

// ==========================================
// 6. STYLESHEET
// ==========================================

const styles = StyleSheet.create({
  containerBg: { flex: 1, backgroundColor: '#F5F4F0' },
  topHeaderNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 12, backgroundColor: '#F5F4F0' },
  backIconButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  headerTitleText: { color: '#1A1A1A', fontWeight: '700', fontSize: 16 },
  headerSubText: { color: '#767676', fontSize: 10 },
  aiBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBadgeText: { fontSize: 9, color: '#767676', fontWeight: '600' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D81E05' },
  reviewScrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 180 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEAEA', padding: 16, marginBottom: 16 },
  darkCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 24 },
  cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: '#1A1A1A', fontWeight: '700', fontSize: 14 },
  linkText: { color: '#767676', fontSize: 10 },
  pillContainer: { flexDirection: 'row', backgroundColor: '#F5F4F0', borderRadius: 12, padding: 4, gap: 4, marginBottom: 12 },
  modePill: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modePillActive: { backgroundColor: '#D81E05' },
  modePillText: { fontSize: 12, color: '#767676', fontWeight: '700' },
  modePillTextActive: { color: '#FFFFFF' },
  modeStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  modeStatusLabel: { color: '#767676', fontSize: 12 },
  modeStatusValue: { fontSize: 14, fontWeight: '900', color: '#D81E05' },
  darkHeroCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 16 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  darkHeroSubTag: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  darkHeroTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
  darkHeroSubtitle: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 12, marginTop: 2 },
  darkGrid: { flexDirection: 'row', gap: 8, marginTop: 16 },
  darkGridItem: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 10, alignItems: 'center' },
  darkGridValue: { fontWeight: '700', fontSize: 14 },
  darkGridLabel: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 9, marginTop: 2 },
  sectionTitleText: { color: '#1A1A1A', fontWeight: '700', fontSize: 14, marginBottom: 8 },
  sectionSubtitleText: { color: '#767676', fontWeight: '400', fontSize: 12 },
  agentCardContainer: { borderRadius: 16, borderWidth: 1, borderColor: '#EAEAEA', backgroundColor: '#FFFFFF', padding: 14, marginBottom: 10 },
  agentCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  agentIcon: { fontSize: 20 },
  agentMetaContainer: { flex: 1 },
  agentTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  agentLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: '#1A1A1A' },
  agentConf: { fontSize: 9, color: '#767676' },
  agentFinding: { color: '#1A1A1A', fontSize: 12, fontWeight: '500' },
  agentActionBox: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  agentActionTitle: { fontSize: 9, color: '#767676', textTransform: 'uppercase', fontWeight: '700', marginBottom: 2 },
  agentActionBody: { fontSize: 12, color: '#1A1A1A', fontWeight: '600' },
  agentChevron: { fontSize: 10, color: '#1A1A1A', fontWeight: '700' },
  promoCardContainer: { width: 208, borderRadius: 16, backgroundColor: '#D81E05', padding: 16, marginRight: 12 },
  promoBrandText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  promoTagPill: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginTop: 2 },
  promoTagText: { color: '#FFFFFF', fontSize: 8, fontWeight: '700' },
  promoTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, marginVertical: 4 },
  promoSub: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, marginBottom: 12 },
  promoCtaButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  promoCtaText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  surplusContainer: { backgroundColor: '#EDE8DF', borderRadius: 16, padding: 16, marginBottom: 16 },
  yieldTag: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  yieldTagText: { fontSize: 9, fontWeight: '700', color: '#166534' },
  routeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  routeToText: { fontSize: 12, color: '#1A1A1A', fontWeight: '600' },
  routeYieldText: { fontSize: 9, color: '#767676' },
  routeAmtText: { fontSize: 14, fontWeight: '700' },
  disclaimerText: { color: '#767676', fontSize: 9, marginBottom: 8 },
  approveDrawer: { position: 'absolute', left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EAEAEA', elevation: 10 },
  approveDrawerMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  drawerMetaText: { fontSize: 10, color: '#767676' },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  approveButton: { backgroundColor: '#D81E05', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  approveButtonDisabled: { opacity: 0.7 },
  approveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  successContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 64, paddingBottom: 110 },
  successIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D81E05', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { color: '#1A1A1A', fontWeight: '900', fontSize: 24, marginBottom: 8 },
  successSub: { color: '#767676', fontSize: 14, textAlign: 'center', marginBottom: 4 },
  successModePill: { fontSize: 14, fontWeight: '900', color: '#D81E05', marginBottom: 20 },
  sectionHeader: { fontSize: 9, fontWeight: '900', color: '#767676', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  summaryActionText: { fontSize: 12, fontWeight: '500', color: '#1A1A1A', flex: 1, paddingRight: 8 },
  summaryStatusText: { fontSize: 10, color: '#16A34A', fontWeight: '700' },
  darkSectionHeader: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  govRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  govCheck: { color: '#4ADE80', fontSize: 12 },
  govText: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  homeButton: { width: '100%', backgroundColor: '#D81E05', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  homeButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', elevation: 5 },
});
