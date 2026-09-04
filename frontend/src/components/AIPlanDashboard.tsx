import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SetupProps } from './chatbotoverlay';
import api, { AgentAnalysisData } from '../services/api';
import type { OwnlyPlan } from './plan/types';

export interface AIPlanDashboardProps {
  setup?: SetupProps;
  onNav?: (screenKey: string) => void;
  activePlan?: OwnlyPlan | null;
  analysis?: AgentAnalysisData | null;
  onEditPlan?: () => void;
}

interface RecommendCard {
  id: string;
  icon: string;
  brand: string;
  title: string;
  sub: string;
  colors: [string, string];
  cta: string;
}

const RECOMMENDS: RecommendCard[] = [
  {
    id: 'ge',
    icon: '🛡️',
    brand: 'Great Eastern',
    title: 'FlexiLife Term Plan',
    sub: 'Closes your S$160K protection gap',
    colors: ['#6B21A8', '#581C87'],
    cta: 'Get Covered',
  },
  {
    id: 'frank',
    icon: '💳',
    brand: 'OCBC FRANK',
    title: '6% Dining Cashback',
    sub: 'Matches your top spending category',
    colors: ['#F97316', '#E11D48'],
    cta: 'Apply Now',
  },
  {
    id: 'gl',
    icon: '🌿',
    brand: 'LionGlobal',
    title: 'SGD MMF · 3.85% p.a.',
    sub: 'Your surplus is already earning here',
    colors: ['#10B981', '#0F766E'],
    cta: 'View Now',
  },
  {
    id: 'cpp',
    icon: '📊',
    brand: 'CPF Board',
    title: 'CPF OA Top-Up',
    sub: 'Boost retirement with S$42K OA base',
    colors: ['#0EA5E9', '#1D4ED8'],
    cta: 'Learn More',
  },
];

const getGreeting = (): string => {
  const hours = new Date().getHours();
  if (hours < 12) return 'Good Morning';
  if (hours < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export const AIPlanDashboard: React.FC<AIPlanDashboardProps> = ({ setup, onNav, activePlan, analysis, onEditPlan }) => {
  const timeline = String(activePlan?.timelineYears || setup?.timeline || '5');
  const split = setup?.split ?? 60;
  const goalType = setup?.goalType || 'shared';

  const partnerSplit = 100 - split;
  const [rmModalVisible, setRmModalVisible] = useState(false);
  const [shareJointOnly, setShareJointOnly] = useState(false);
  const [maskNric, setMaskNric] = useState(true);
  const [exportingRM, setExportingRM] = useState(false);
  const [rmBriefing, setRmBriefing] = useState<any>(null);

  const label = `${timeline}-Year Plan`;
  const planRoutes = activePlan?.routes || [];
  const routeColors = ['#D81E05', '#7AB5E8', '#22A06B'];
  const totalRouted = activePlan?.summary.totalMonthlyRouted || 1340;
  const projected = activePlan?.summary.projectedAtHorizon || (timeline === '10' ? 500000 : 200000);
  const protectionCoverage = activePlan?.protection.enabled ? activePlan.protection.coverageAmount : 0;

  const handleExportRMBrief = async () => {
    setExportingRM(true);
    try {
      const result = await api.exportRMSummary({ shareJointOnly, maskNric });
      if (result.success) setRmBriefing(result.data);
    } catch {
      setRmBriefing({ exportId: 'OFFLINE-PREVIEW', bankBranch: 'OCBC Digital', keyDiscussionTopicsForRM: [] });
    } finally {
      setExportingRM(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.welcomeText}>Your OWNLYplan</Text>
              <Text style={styles.planStatusText}>{label} · Active · {activePlan?.predictionScenario || 'balanced'} outlook</Text>
            </View>

            <View style={styles.headerActions}>
              {onEditPlan && (
                <TouchableOpacity style={styles.headerIconButton} onPress={onEditPlan} accessibilityLabel="Edit plan">
                  <Text style={styles.editIcon}>✎</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.exportIconButton} onPress={() => setRmModalVisible(true)} accessibilityLabel="Export for relationship manager">
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contribution Split Bar */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Monthly contribution plan</Text>
              <Text style={styles.cardSubHeader}>S${totalRouted.toLocaleString()} routed</Text>
            </View>
            <View style={styles.splitBarContainer}>
              {(planRoutes.length ? planRoutes : [
                { id: 'fallback-1', percentage: split, name: 'BTO' },
                { id: 'fallback-2', percentage: partnerSplit, name: 'Family' },
              ]).map((route, index) => (
                <View key={route.id} style={[styles.splitBarSegment, { width: `${route.percentage}%`, backgroundColor: routeColors[index % routeColors.length] }]}>
                  {route.percentage >= 18 && <Text style={styles.splitSegmentText}>{route.percentage}%</Text>}
                </View>
              ))}
            </View>
            <View style={styles.routeLegendStack}>
              {planRoutes.map((route, index) => (
                <View style={styles.routeLegendRow} key={route.id}>
                  <View style={[styles.legendDot, { backgroundColor: routeColors[index % routeColors.length] }]} />
                  <Text style={styles.routeLegendName}>{index + 1}. {route.name}</Text>
                  <Text style={styles.legendText}>S${route.monthlyAmount}/mo</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Goal Progress Tracker */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Goal Progress</Text>
              <Text style={styles.cardSubHeader}>June 2026</Text>
            </View>
            {(planRoutes.length ? planRoutes.map((route, index) => ({
              label: route.name,
              pct: [68, 52, 37][index] || 35,
              bar: routeColors[index % routeColors.length],
              val: `S$${route.projectedAtEnd.toLocaleString()} projected`,
            })) : [
              { label: 'BTO Goal Pot', pct: 68, bar: '#D81E05', val: 'S$40,800 / S$60K' },
              { label: 'Emergency Fund', pct: 100, bar: '#4ADE80', val: 'S$24,000 ✓' },
              { label: 'Investment Portfolio', pct: 37, bar: '#7AB5E8', val: 'S$18,450 / S$50K' },
            ]).map((g) => (
              <View key={g.label} style={styles.goalRow}>
                <View style={styles.goalLabelRow}>
                  <Text style={styles.goalLabel}>{g.label}</Text>
                  <Text style={styles.goalVal}>{g.val}</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${g.pct}%`, backgroundColor: g.bar }]} />
                </View>
              </View>
            ))}
            <View style={styles.statusFooter}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusFooterText}>Plan aligned · S${projected.toLocaleString()} projected over {timeline} years</Text>
            </View>
          </View>
        </View>

        {/* OCBC Recommends Horizontal Scroll */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>OCBC Recommends</Text>
              <Text style={styles.cardSubHeader}>Personalised for your {label}</Text>
            </View>
            <TouchableOpacity onPress={() => onNav && onNav('recommends_all')}>
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {RECOMMENDS.map((p) => (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.85}
                style={[styles.recommendCard, { backgroundColor: p.colors[0] }]}
              >
                <View style={styles.brandRow}>
                  <Text style={styles.cardIcon}>{p.icon}</Text>
                  <Text style={styles.brandText}>{p.brand}</Text>
                </View>
                <Text style={styles.recTitle}>{p.title}</Text>
                <Text style={styles.recSub}>{p.sub}</Text>
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>{p.cta} →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Stat Tiles Grid */}
        <View style={styles.gridSection}>
          <View style={styles.tilesGrid}>
            {[
              { icon: '💰', label: 'Monthly Surplus', value: `S$${(activePlan?.monthlySurplus || 1340).toLocaleString()}`, sub: `${planRoutes.length} active routes`, color: '#2563EB' },
              { icon: '📈', label: 'Plan Projection', value: `S$${Math.round(projected / 1000)}K`, sub: `${timeline}-year ${activePlan?.predictionScenario || 'balanced'} case`, color: '#16A34A' },
              { icon: '🛡️', label: 'Asset Protection', value: protectionCoverage ? `S$${Math.round(protectionCoverage / 1000)}K` : 'Off', sub: activePlan?.protection.enabled ? `${activePlan.protection.tier} cover active` : 'Not included', color: '#9333EA' },
              { icon: '🎁', label: 'Grants Found', value: `S$${Math.round((analysis?.totalGrantsAvailable || 54300) / 1000)}K`, sub: 'Household opportunities', color: '#D81E05' },
            ].map((s) => (
              <View key={s.label} style={styles.tileCard}>
                <Text style={styles.tileIcon}>{s.icon}</Text>
                <Text style={styles.tileLabel}>{s.label}</Text>
                <Text style={[styles.tileValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.tileSub}>{s.sub}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={rmModalVisible} transparent animationType="slide" onRequestClose={() => setRmModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}><Text style={styles.modalIconText}>RM</Text></View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.modalTitle}>Share with your RM</Text>
                <Text style={styles.modalSubtitle}>Create a consent-filtered household briefing.</Text>
              </View>
            </View>
            <View style={styles.consentRow}>
              <Text style={styles.consentLabel}>Joint accounts only</Text>
              <Switch value={shareJointOnly} onValueChange={setShareJointOnly} trackColor={{ true: '#D81E05' }} />
            </View>
            <View style={styles.consentRow}>
              <Text style={styles.consentLabel}>Mask NRIC details</Text>
              <Switch value={maskNric} onValueChange={setMaskNric} trackColor={{ true: '#D81E05' }} />
            </View>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportRMBrief} disabled={exportingRM}>
              {exportingRM ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.exportButtonText}>Generate briefing</Text>}
            </TouchableOpacity>
            {rmBriefing && (
              <View style={styles.exportResult}>
                <Text style={styles.exportResultTitle}>Briefing ready</Text>
                <Text style={styles.exportResultText}>{rmBriefing.exportId} · {rmBriefing.bankBranch}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => { setRmModalVisible(false); setRmBriefing(null); }}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerSection: {
    paddingHorizontal: 20,
    marginBottom: 18,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E1DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D81E05',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  editIcon: { fontSize: 20, color: '#D81E05', fontWeight: '700' },
  greetingText: {
    color: '#767676',
    fontSize: 12,
    fontWeight: '600',
  },
  welcomeText: {
    color: '#1A1A1A',
    fontWeight: '900',
    fontSize: 24,
  },
  planStatusText: {
    color: '#767676',
    fontSize: 12,
    marginTop: 2,
  },
  ringContainer: {
    width: 64,
    height: 64,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPctText: {
    color: '#D81E05',
    fontWeight: '900',
    fontSize: 13,
  },
  ringLabelText: {
    color: '#767676',
    fontSize: 8,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  cardSubHeader: {
    color: '#767676',
    fontSize: 10,
  },
  splitBarContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  splitBarSegment: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  splitSegmentText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  splitLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeLegendStack: { gap: 8 },
  routeLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  routeLegendName: { flex: 1, color: '#333333', fontSize: 10, fontWeight: '600' },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#1A1A1A',
    fontSize: 10,
    fontWeight: '600',
  },
  goalRow: {
    marginBottom: 12,
  },
  goalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalLabel: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '500',
  },
  goalVal: {
    color: '#767676',
    fontSize: 10,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F0EDE8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusFooterText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '600',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  seeAllText: {
    color: '#D81E05',
    fontSize: 10,
    fontWeight: '600',
  },
  horizontalScrollContent: {
    gap: 12,
    paddingRight: 16,
    paddingTop: 4,
  },
  recommendCard: {
    width: 208,
    borderRadius: 20,
    padding: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 20,
  },
  brandText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  recTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  recSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 12,
  },
  ctaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  gridSection: {
    paddingHorizontal: 20,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tileCard: {
    width: (Dimensions.get('window').width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 14,
  },
  tileIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  tileLabel: {
    color: '#767676',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tileValue: {
    fontWeight: '900',
    fontSize: 16,
  },
  tileSub: {
    color: '#767676',
    fontSize: 9,
    marginTop: 2,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(17,17,17,0.48)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  modalIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF0EE', alignItems: 'center', justifyContent: 'center' },
  modalIconText: { color: '#D81E05', fontSize: 12, fontWeight: '900' },
  modalTitle: { color: '#1A1A1A', fontSize: 18, fontWeight: '900' },
  modalSubtitle: { color: '#767676', fontSize: 11, marginTop: 2 },
  consentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, borderTopWidth: 1, borderTopColor: '#F0EDE8' },
  consentLabel: { color: '#333333', fontSize: 13, fontWeight: '600' },
  exportButton: { minHeight: 48, marginTop: 12, borderRadius: 14, backgroundColor: '#D81E05', alignItems: 'center', justifyContent: 'center' },
  exportButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  exportResult: { backgroundColor: '#EEF8F1', borderRadius: 12, padding: 12, marginTop: 12 },
  exportResultTitle: { color: '#16803A', fontSize: 12, fontWeight: '800' },
  exportResultText: { color: '#52715C', fontSize: 10, marginTop: 2 },
  closeButton: { alignItems: 'center', paddingVertical: 13, marginTop: 4 },
  closeButtonText: { color: '#666666', fontSize: 13, fontWeight: '700' },
});
