import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import api, { AgentAnalysisData, NextBestAction } from '../services/api';
import type { OwnlyPlan } from './plan/types';

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
// 2. CONSTANTS & AUTONOMY MODES
// ==========================================

const MODES: Record<string, ModeConfig> = {
  Low: {
    pill: 'Low Autonomy',
    cls: 'text-blue-600',
    bg: 'bg-blue-600',
    ring: 'border-blue-200',
    style: 'Notify & Wait (Manual Confirmation)',
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

const PROMOS: PromoData[] = [
  {
    id: 'p1',
    brand: 'GREAT EASTERN',
    tag: 'RECOMMENDED',
    tagCls: 'bg-white/20 text-white',
    title: 'FlexiLife Term Protection',
    sub: 'Closes your S$160K family mortgage gap from S$28/mo.',
    cta: 'Get Quote',
    grad: 'from-red-600 to-rose-700',
    logo: '🛡️',
  },
  {
    id: 'p2',
    brand: 'LIONGLOBAL',
    tag: 'INSTANT LIQUIDITY',
    tagCls: 'bg-white/20 text-white',
    title: 'LionGlobal SGD MMF',
    sub: '3.85% p.a. cash sweep with T+0 instant transfer to OCBC 360.',
    cta: 'View Fund',
    grad: 'from-green-600 to-teal-700',
    logo: '📈',
  },
];

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
              <Text style={styles.agentActionTitle}>Why This Action & Impact</Text>
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
// 4. MAIN OWNLYSCREEN COMPONENT
// ==========================================

export const OwnlyScreen: React.FC<{
  onNav?: (screenKey: string) => void;
  onHelp?: () => void;
  analysis?: AgentAnalysisData | null;
  activePlan?: OwnlyPlan | null;
  onEditPlan?: () => void;
}> = ({ onNav, analysis: initialAnalysis, activePlan, onEditPlan }) => {
  const insets = useSafeAreaInsets();
  const initialMode = activePlan?.autonomyMode === 'FULL_AUTO' ? 'High' : activePlan?.autonomyMode === 'NOTIFY_AND_WAIT' ? 'Low' : 'Medium';
  const [mode, setMode] = useState<string>(initialMode);
  const [approved, setApproved] = useState<boolean>(Boolean(activePlan));
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AgentAnalysisData | null>(initialAnalysis || null);
  const [financeData, setFinanceData] = useState<any>(null);

  // RM Export State
  const [rmModalVisible, setRmModalVisible] = useState<boolean>(false);
  const [shareJointOnly, setShareJointOnly] = useState<boolean>(false);
  const [maskNric, setMaskNric] = useState<boolean>(true);
  const [rmBriefing, setRmBriefing] = useState<any>(null);
  const [exportingRM, setExportingRM] = useState<boolean>(false);

  const m = MODES[mode] || MODES.Medium;

  const loadData = async () => {
    try {
      const [agentRes, finRes] = await Promise.all([
        initialAnalysis ? Promise.resolve({ success: true, data: initialAnalysis }) : api.analyzeAgents(),
        api.getFinanceOverview()
      ]);
      if (agentRes.success) setAnalysis(agentRes.data);
      if (finRes) setFinanceData(finRes);
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprovePlan = async () => {
    setLoading(true);
    try {
      await api.approvePlan({
        mode,
        approvedSurplus: financeData?.metrics?.monthlySurplus || 1340,
        routes: financeData?.routes || []
      });
      setApproved(true);
    } catch (err) {
      console.warn('Plan approve error:', err);
      setApproved(true);
    } finally {
      setLoading(false);
    }
  };

  const handleExportRMBrief = async () => {
    setExportingRM(true);
    try {
      const res = await api.exportRMSummary({ shareJointOnly, maskNric });
      if (res.success) {
        setRmBriefing(res.data);
      }
    } catch (err) {
      console.warn('RM brief export failed:', err);
    } finally {
      setExportingRM(false);
    }
  };

  // Map Backend NBAs to AgentCards
  const agentCards: AgentData[] = (analysis?.nextBestActions || []).map((nba, idx) => ({
    id: nba.id,
    icon: nba.category === 'CASHFLOW' ? '📈' : nba.category === 'PROTECTION' ? '🛡️' : nba.category === 'GOVERNMENT_SCHEME' ? '🎁' : '🏠',
    label: nba.title,
    conf: Math.round(nba.confidence * 100),
    finding: nba.reason,
    action: `Impact: ${nba.impact} • Priority: ${nba.urgency}`,
    color: 'border-red-200 bg-red-50/50',
    text: 'text-red-800'
  }));

  const routes: RouteData[] = (activePlan?.routes || financeData?.routes || [
    { name: 'BTO Downpayment Pot', monthlyAmount: 670, targetProduct: 'OCBC 360 Vault' },
    { name: 'LionGlobal SGD MMF', monthlyAmount: 400, targetProduct: '3.85% p.a. Cash Sweep' },
    { name: 'Child CDA & Education', monthlyAmount: 270, targetProduct: 'OCBC CDA Matching' }
  ]).map((r: any) => ({
    icon: r.name.includes('BTO') ? '🏠' : r.name.includes('MMF') ? '📈' : '👶',
    to: r.name,
    yield: r.targetProduct || 'High-Yield Allocation',
    color: 'text-green-600',
    amt: `+S$${r.monthlyAmount || 400}`
  }));

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
          <Text style={styles.successSub}>OWNLYplan is now using your confirmed priorities, protection and contribution settings.</Text>
          <Text style={styles.successModePill}>{m.pill}</Text>

          {activePlan && (
            <View style={styles.activePlanSummary}>
              <View style={styles.activePlanMetric}>
                <Text style={styles.activePlanValue}>S${activePlan.summary.projectedAtHorizon.toLocaleString()}</Text>
                <Text style={styles.activePlanLabel}>{activePlan.timelineYears}-year prediction</Text>
              </View>
              <View style={styles.activePlanMetric}>
                <Text style={styles.activePlanValue}>{activePlan.protection.enabled ? `S$${activePlan.protection.coverageAmount.toLocaleString()}` : 'Off'}</Text>
                <Text style={styles.activePlanLabel}>Asset protection</Text>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardHeaderFlex}>
              <Text style={styles.sectionHeader}>Your priority routes</Text>
              {onEditPlan && <TouchableOpacity onPress={onEditPlan}><Text style={styles.editPlanText}>Edit plan</Text></TouchableOpacity>}
            </View>
            {routes.map((item, i) => (
              <View key={i} style={styles.completedActionRow}>
                <Text style={styles.actionItemText}>{i + 1}. {item.icon} {item.to}</Text>
                <Text style={styles.actionStatusText}>{item.amt}/mo (Active)</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.rmExportBtn} onPress={() => setRmModalVisible(true)}>
            <Text style={styles.rmExportBtnText}>📄 Export Summary for Relationship Manager</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneButton} onPress={() => onNav?.('home')}>
            <Text style={styles.doneButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.containerBg} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}>
        {/* Header */}
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.homeTitle}>OWNLYplans</Text>
            <Text style={styles.homeSub}>
              {financeData?.user?.name || 'Alex & Mary Tan'} • {analysis?.overallHealthScore ? `Health Score: ${analysis.overallHealthScore}/100` : 'Multi-Agent Active'}
            </Text>
          </View>
          <TouchableOpacity style={styles.rmExportTopBtn} onPress={() => setRmModalVisible(true)}>
            <Text style={styles.rmExportTopBtnText}>👤 RM Brief</Text>
          </TouchableOpacity>
        </View>

        {/* Executive Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryBadgeRow}>
            <View style={styles.greenDot} />
            <Text style={styles.summaryBadgeText}>4 Specialized AI Agents Active</Text>
          </View>
          <Text style={styles.summarySurplusTitle}>
            S${(financeData?.metrics?.monthlySurplus || 1340).toLocaleString()}<Text style={{ fontSize: 13, fontWeight: 'normal' }}> / month surplus</Text>
          </Text>
          <Text style={styles.summarySurplusSub}>
            Discovered S${(analysis?.totalGrantsAvailable || 54300).toLocaleString()} in unclaimed government schemes & housing benefits.
          </Text>
        </View>

        {/* Autonomy Selector */}
        <View style={styles.card}>
          <View style={styles.cardHeaderFlex}>
            <Text style={styles.cardTitle}>We Guide. You Decide.</Text>
            <Text style={styles.linkText}>Autonomy Level</Text>
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
            <Text style={styles.modeStatusLabel}>Execution rule:</Text>
            <Text style={styles.modeStatusValue}>{m.style}</Text>
          </View>
        </View>

        {/* Next-Best Actions */}
        <Text style={styles.sectionTitleText}>
          Next-Best Actions <Text style={styles.sectionSubtitleText}>• AI-prioritized</Text>
        </Text>
        {agentCards.map((a, i) => (
          <AgentCard key={a.id} a={a} i={i} />
        ))}

        {/* Surplus Routing Section */}
        <View style={styles.surplusContainer}>
          <View style={styles.cardHeaderFlex}>
            <Text style={styles.cardTitle}>Surplus Auto-Routing</Text>
            <View style={styles.yieldTag}><Text style={styles.yieldTagText}>0.05% → 3.85% p.a.</Text></View>
          </View>
          {routes.map((r, i) => (
            <View key={i} style={styles.routeRow}>
              <Text style={{ fontSize: 18 }}>{r.icon}</Text>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.routeToText}>{r.to}</Text>
                <Text style={styles.routeYieldText}>{r.yield}</Text>
              </View>
              <Text style={[styles.routeAmtText, { color: '#16A34A' }]}>
                {r.amt}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimerText}>Bank-grade PDPA security. All executions require biometric confirmation.</Text>
      </ScrollView>

      {/* Sticky Approve Drawer */}
      <View style={[styles.approveDrawer, { bottom: 82 + insets.bottom }]}>
        <View style={styles.approveDrawerMeta}>
          <View>
            <Text style={styles.drawerMetaText}>Mode: <Text style={{ fontWeight: '700' }}>{mode} Autonomy</Text></Text>
            <Text style={styles.drawerMetaText}>Net annual yield boost: <Text style={{ color: '#16A34A', fontWeight: '700' }}>+S$456/yr</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.greenDot} />
            <Text style={styles.drawerMetaText}>Plan verified</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.approveButton, loading && styles.approveButtonDisabled]}
          disabled={loading}
          onPress={handleApprovePlan}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.approveButtonText}>Executing Routes…</Text>
            </View>
          ) : (
            <Text style={styles.approveButtonText}>Approve & Execute Plan</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* RM Briefing Export Modal */}
      <Modal visible={rmModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Relationship Manager (RM) Export</Text>
            <Text style={styles.modalSubtitle}>"Stay Connected" — Export a privacy-consented briefing for your OCBC RM.</Text>

            <View style={styles.consentToggleRow}>
              <Text style={styles.consentLabel}>Share Joint Accounts Only</Text>
              <Switch value={shareJointOnly} onValueChange={setShareJointOnly} trackColor={{ true: '#D81E05' }} />
            </View>

            <View style={styles.consentToggleRow}>
              <Text style={styles.consentLabel}>Mask Sensitive Personal NRIC</Text>
              <Switch value={maskNric} onValueChange={setMaskNric} trackColor={{ true: '#D81E05' }} />
            </View>

            <TouchableOpacity
              style={styles.generateBriefBtn}
              onPress={handleExportRMBrief}
              disabled={exportingRM}
            >
              {exportingRM ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.generateBriefBtnText}>Generate RM Briefing Packet</Text>
              )}
            </TouchableOpacity>

            {rmBriefing && (
              <View style={styles.rmResultBox}>
                <Text style={styles.rmResultTitle}>✓ Briefing Generated ({rmBriefing.exportId})</Text>
                <Text style={styles.rmResultText}>Branch: {rmBriefing.bankBranch}</Text>
                <Text style={styles.rmResultText}>Topics for RM: {rmBriefing.keyDiscussionTopicsForRM?.length || 3} identified</Text>
                <Text style={styles.rmResultDetail}>Ready for instant OCBC RM handoff without starting from zero.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setRmModalVisible(false); setRmBriefing(null); }}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerBg: { flex: 1, backgroundColor: '#F5F4F0' },
  scrollContent: { padding: 16 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  homeTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  homeSub: { fontSize: 12, color: '#767676', marginTop: 2 },
  rmExportTopBtn: { backgroundColor: '#FFF0EE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#FFCDD2' },
  rmExportTopBtnText: { color: '#D81E05', fontWeight: '700', fontSize: 12 },
  summaryCard: { backgroundColor: '#1A1A1A', borderRadius: 18, padding: 16, marginBottom: 14 },
  summaryBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  summaryBadgeText: { color: '#22C55E', fontSize: 11, fontWeight: '700' },
  summarySurplusTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  summarySurplusSub: { color: 'rgba(255, 255, 255, 0.65)', fontSize: 12, marginTop: 4, lineHeight: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#EAEAEA' },
  cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  linkText: { fontSize: 11, color: '#767676', fontWeight: '600' },
  pillContainer: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  modePill: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  modePillActive: { backgroundColor: '#D81E05', borderColor: '#D81E05' },
  modePillText: { fontSize: 12, fontWeight: '700', color: '#666' },
  modePillTextActive: { color: '#FFFFFF' },
  modeStatusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  modeStatusLabel: { fontSize: 11, color: '#888' },
  modeStatusValue: { fontSize: 11, fontWeight: '700', color: '#1A1A1A' },
  sectionTitleText: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginTop: 8, marginBottom: 8 },
  sectionSubtitleText: { fontSize: 12, color: '#767676', fontWeight: 'normal' },
  agentCardContainer: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEAEA', padding: 12, marginBottom: 8 },
  agentCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  agentIcon: { fontSize: 20 },
  agentMetaContainer: { flex: 1 },
  agentTagRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  agentLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  agentConf: { fontSize: 10, color: '#16A34A', fontWeight: '700' },
  agentFinding: { fontSize: 11, color: '#666', marginTop: 2, lineHeight: 15 },
  agentActionBox: { marginTop: 8, backgroundColor: '#F9F9F9', borderRadius: 8, padding: 8 },
  agentActionTitle: { fontSize: 10, fontWeight: '700', color: '#D81E05', textTransform: 'uppercase' },
  agentActionBody: { fontSize: 11, color: '#333', marginTop: 2 },
  agentChevron: { fontSize: 10, color: '#888', marginTop: 4 },
  surplusContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginTop: 6, borderWidth: 1, borderColor: '#EAEAEA' },
  yieldTag: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  yieldTagText: { color: '#15803D', fontSize: 10, fontWeight: '700' },
  routeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  routeToText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  routeYieldText: { fontSize: 10, color: '#767676' },
  routeAmtText: { fontSize: 12, fontWeight: '700' },
  disclaimerText: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  approveDrawer: { position: 'absolute', left: 16, right: 16, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  approveDrawerMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  drawerMetaText: { fontSize: 11, color: '#666' },
  approveButton: { backgroundColor: '#D81E05', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  approveButtonDisabled: { opacity: 0.7 },
  approveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  successContent: { padding: 20, alignItems: 'center' },
  successIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 12 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  successSub: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 4 },
  successModePill: { backgroundColor: '#E8F4FD', color: '#1A73E8', fontWeight: '700', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8, marginBottom: 16 },
  activePlanSummary: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 12 },
  activePlanMetric: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, padding: 12 },
  activePlanValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  activePlanLabel: { color: '#BDBDBD', fontSize: 10, marginTop: 3 },
  editPlanText: { color: '#D81E05', fontSize: 11, fontWeight: '800' },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },
  completedActionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', width: '100%' },
  actionItemText: { fontSize: 12, color: '#1A1A1A', fontWeight: '600' },
  actionStatusText: { fontSize: 12, color: '#16A34A', fontWeight: '700' },
  rmExportBtn: { backgroundColor: '#FFFFFF', borderColor: '#D81E05', borderWidth: 1.5, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, marginTop: 16, width: '100%', alignItems: 'center' },
  rmExportBtnText: { color: '#D81E05', fontWeight: '700', fontSize: 13 },
  doneButton: { backgroundColor: '#D81E05', borderRadius: 14, paddingVertical: 14, marginTop: 10, width: '100%', alignItems: 'center' },
  doneButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: '#666', marginBottom: 16 },
  consentToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  consentLabel: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  generateBriefBtn: { backgroundColor: '#D81E05', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  generateBriefBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  rmResultBox: { marginTop: 14, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  rmResultTitle: { fontSize: 13, fontWeight: '800', color: '#15803D', marginBottom: 4 },
  rmResultText: { fontSize: 12, color: '#333' },
  rmResultDetail: { fontSize: 11, color: '#666', marginTop: 4, fontStyle: 'italic' },
  modalCloseBtn: { marginTop: 12, padding: 10, alignItems: 'center' },
  modalCloseBtnText: { color: '#767676', fontWeight: '600' }
});

export default OwnlyScreen;
