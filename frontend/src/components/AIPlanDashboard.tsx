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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { SetupProps } from './chatbotoverlay';
import api, { AgentAnalysisData, MockPassAuthResponse } from '../services/api';
import type { GoalOutlook, OwnlyPlan } from './plan/types';

export interface AIPlanDashboardProps {
  setup?: SetupProps;
  onNav?: (screenKey: string) => void;
  activePlan?: OwnlyPlan | null;
  analysis?: AgentAnalysisData | null;
  profile?: MockPassAuthResponse | null;
  aggregate?: any | null;
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

interface RecommendationDetail {
  why: string;
  impact: string;
  tradeoff: string;
  dataUsed: string[];
  nextStep: string;
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
    id: 'education',
    icon: '🎓',
    brand: 'OCBC FAMILY BANKING',
    title: 'Close the education gap',
    sub: 'Adjust the monthly education contribution',
    colors: ['#F97316', '#C2410C'],
    cta: 'Review Goal',
  },
  {
    id: 'gl',
    icon: '🌿',
    brand: 'LionGlobal',
    title: 'Review an SGD cash fund',
    sub: 'Compare its current yield, risk and liquidity',
    colors: ['#10B981', '#0F766E'],
    cta: 'View Now',
  },
  {
    id: 'cpp',
    icon: '📊',
    brand: 'CPF Board',
    title: 'Retirement readiness review',
    sub: 'Coordinate CPF, investments and liquid cash',
    colors: ['#0EA5E9', '#1D4ED8'],
    cta: 'Learn More',
  },
  {
    id: 'subscriptions',
    icon: '✂️',
    brand: 'OWNLY INSIGHT',
    title: 'Free S$54 each month',
    sub: 'Pause subscriptions your household rarely uses',
    colors: ['#334155', '#1E293B'],
    cta: 'Review subscriptions',
  },
  {
    id: 'support',
    icon: '🎁',
    brand: 'GOVERNMENT SUPPORT',
    title: 'Review family support',
    sub: 'Check education and household schemes that may apply',
    colors: ['#0369A1', '#075985'],
    cta: 'See eligible grants',
  },
];

const RECOMMENDATION_DETAILS: Record<string, RecommendationDetail> = {
  ge: {
    why: 'Your existing life cover does not fully cover the mortgage and dependent-income benchmark used by the Household Risk Agent.',
    impact: 'Closes the identified S$160K protection gap for an estimated S$28 per month.',
    tradeoff: 'Premiums reduce the monthly amount available for savings by S$28.',
    dataUsed: ['Recommended household cover', 'Existing cover', 'Dependent count', 'Housing commitment'],
    nextStep: 'Review coverage details',
  },
  education: {
    why: 'The current monthly education contribution does not fully fund the selected target by its deadline.',
    impact: 'A targeted monthly adjustment can close the forecast gap before the eldest child reaches the planning age.',
    tradeoff: 'Increasing this contribution leaves less monthly surplus for the other family goals.',
    dataUsed: ['MyInfo child records', 'Current education balance', 'Selected monthly allocation', 'Target date'],
    nextStep: 'Edit contribution',
  },
  gl: {
    why: 'The Health Agent found cash above your operating reserve earning approximately 0.05% in secondary accounts.',
    impact: 'Cash above the protected emergency floor may earn more, subject to the fund’s current yield and fees.',
    tradeoff: 'Money-market funds are investments; returns are not guaranteed and are different from bank deposits.',
    dataUsed: ['Linked low-yield cash', 'Protected emergency floor', 'Current deposit rate', 'Illustrative fund yield'],
    nextStep: 'Review fund factsheet',
  },
  cpp: {
    why: 'Alex and Lila have a long planning horizon, so coordinating CPF, investments and liquid cash can compound meaningfully alongside near-term family goals.',
    impact: 'Shows whether retirement-ready assets can support family commitments without weakening near-term liquidity.',
    tradeoff: 'CPF top-ups have withdrawal restrictions and should not compromise near-term liquidity.',
    dataUsed: ['Verified age', 'CPF balances', 'Goal horizon', 'Emergency cash reserve'],
    nextStep: 'Model a CPF top-up',
  },
  subscriptions: {
    why: 'Two recurring subscriptions show low or overlapping usage across the linked household transaction history.',
    impact: 'Redirecting S$54 monthly adds S$3,240 to family goals over five years before investment returns.',
    tradeoff: 'Only cancel services the family agrees are no longer useful.',
    dataUsed: ['Recurring merchant detection', '90-day usage pattern', 'S$80.97 monthly subscription spend', 'Household goal shortfall'],
    nextStep: 'Choose subscriptions to pause',
  },
  support: {
    why: 'Your household profile includes dependants and an existing HDB home, which may correspond to education or household support schemes.',
    impact: 'Confirmed support can reduce the amount that needs to be funded from monthly cash flow.',
    tradeoff: 'Final eligibility and amounts remain subject to agency assessment and application deadlines.',
    dataUsed: ['Household income', 'Children’s ages', 'Housing record', 'Singpass/MyInfo profile'],
    nextStep: 'Open grant checklist',
  },
};

const GoalProjectionChart = ({ goal }: { goal: GoalOutlook }) => {
  const maximum = Math.max(goal.targetAmount, goal.projectedAtTarget, 1);
  const y = (amount: number) => 128 - Math.min(1, amount / maximum) * 94;
  const currentY = y(goal.currentAmount);
  const projectedY = y(goal.projectedAtTarget);
  const targetY = y(goal.targetAmount);
  const forecastColor = goal.status === 'AT_RISK' ? '#D97706' : '#16803A';
  return (
    <View>
      <Svg width="100%" height={142} viewBox="0 0 330 142">
        <Line x1="18" y1={targetY} x2="316" y2={targetY} stroke="#D8A39D" strokeWidth="1" strokeDasharray="4 5" />
        <Path d={`M18 ${currentY} C100 ${currentY - 8} 226 ${projectedY + 12} 316 ${projectedY}`} stroke={forecastColor} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="7 6" />
        <Circle cx="18" cy={currentY} r="6" fill="#FFFFFF" stroke={forecastColor} strokeWidth="3" />
        <Circle cx="316" cy={projectedY} r="6" fill="#FFFFFF" stroke={forecastColor} strokeWidth="3" />
        <Line x1="18" y1="132" x2="316" y2="132" stroke="#E7E2DA" strokeWidth="1" />
      </Svg>
      <View style={styles.chartLabels}>
        <Text style={styles.chartLabel}>Today{`\n`}S${goal.currentAmount.toLocaleString()}</Text>
        <Text style={[styles.chartLabel, styles.chartLabelCenter]}>By {goal.targetDate}{`\n`}S${goal.projectedAtTarget.toLocaleString()}</Text>
        <Text style={[styles.chartLabel, styles.chartLabelRight]}>Expected goal{`\n`}{goal.projectedCompletionDate}</Text>
      </View>
      <Text style={styles.chartTarget}>Target S${goal.targetAmount.toLocaleString()}</Text>
    </View>
  );
};

const getGreeting = (): string => {
  const hours = new Date().getHours();
  if (hours < 12) return 'Good Morning';
  if (hours < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export const AIPlanDashboard: React.FC<AIPlanDashboardProps> = ({ setup, onNav, activePlan, analysis, profile, aggregate, onEditPlan }) => {
  const timeline = String(activePlan?.timelineYears || setup?.timeline || '5');
  const split = setup?.split ?? 60;
  const goalType = setup?.goalType || 'shared';

  const partnerSplit = 100 - split;
  const [rmModalVisible, setRmModalVisible] = useState(false);
  const [shareJointOnly, setShareJointOnly] = useState(false);
  const [maskNric, setMaskNric] = useState(true);
  const [exportingRM, setExportingRM] = useState(false);
  const [rmBriefing, setRmBriefing] = useState<any>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendCard | null>(null);
  const [recommendationAccepted, setRecommendationAccepted] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [selectedGoalKey, setSelectedGoalKey] = useState<string>(activePlan?.goalOutlooks?.[0]?.key || 'housing');

  const label = `${timeline}-Year Plan`;
  const planRoutes = activePlan?.routes || [];
  const routeColors = ['#D81E05', '#7AB5E8', '#22A06B'];
  const totalRouted = activePlan?.summary.totalMonthlyRouted || 1340;
  const projected = activePlan?.summary.projectedAtHorizon || (timeline === '10' ? 500000 : 200000);
  const protectionCoverage = activePlan?.protection.enabled ? activePlan.protection.coverageAmount : 0;
  const snapshot = activePlan?.householdSnapshot;
  const goals = activePlan?.goalOutlooks || [];
  const selectedGoal = goals.find((goal) => goal.key === selectedGoalKey) || goals[0];
  const onTrackCount = goals.filter((goal) => goal.status !== 'AT_RISK').length;
  const primaryName = snapshot?.firstName || profile?.user?.name?.split(' ')[0] || 'Alex';
  const familyDescription = snapshot?.dependentNames?.length
    ? [primaryName, snapshot.partnerName, ...snapshot.dependentNames].filter(Boolean).join(', ')
    : `${primaryName}'s household`;
  const educationGoal = goals.find((goal) => goal.key === 'education');
  const liquidExcess = Math.max(0, (snapshot?.totalLiquidCash || 0) - (snapshot?.emergencyFund || 0));
  const personalizedRecommendations = RECOMMENDS.map((recommendation) => {
    if (recommendation.id === 'ge' && activePlan?.protection.enabled) {
      return { ...recommendation, title: `Review your S$${Math.round(protectionCoverage / 1000)}K cover`, sub: 'Protection is included in your active OWNLYplan', cta: 'See why it fits' };
    }
    if (recommendation.id === 'education' && educationGoal) {
      return { ...recommendation, title: educationGoal.status === 'AT_RISK' ? 'Close the education gap' : 'Education goal is on track', sub: educationGoal.actionText };
    }
    if (recommendation.id === 'gl') {
      return { ...recommendation, sub: liquidExcess > 0 ? `S$${liquidExcess.toLocaleString()} sits above your emergency floor` : 'Your emergency cash floor is currently protected' };
    }
    if (recommendation.id === 'cpp') {
      return { ...recommendation, title: 'Review retirement readiness', sub: `Built around S$${Math.round((snapshot?.cpfTotal || 0) / 1000)}K verified CPF` };
    }
    if (recommendation.id === 'support') {
      return { ...recommendation, title: `Review support for ${snapshot?.dependentCount || 0} children` };
    }
    return recommendation;
  });
  const recommendationDetails: Record<string, RecommendationDetail> = {
    ...RECOMMENDATION_DETAILS,
    ge: {
      ...RECOMMENDATION_DETAILS.ge,
      impact: protectionCoverage
        ? `Your active plan includes S$${protectionCoverage.toLocaleString()} of selected protection.`
        : 'Reviewing cover can quantify the amount needed to protect housing and dependent commitments.',
      dataUsed: [`${snapshot?.dependentCount || 0} dependants`, snapshot?.housingType || 'Housing record', `${activePlan?.protection.tier || 'Essential'} protection tier`, 'Linked financial commitments'],
    },
    education: {
      ...RECOMMENDATION_DETAILS.education,
      impact: educationGoal?.actionText || RECOMMENDATION_DETAILS.education.impact,
      dataUsed: educationGoal?.dataUsed || RECOMMENDATION_DETAILS.education.dataUsed,
    },
    gl: {
      ...RECOMMENDATION_DETAILS.gl,
      why: liquidExcess > 0
        ? `Linked balances show S$${liquidExcess.toLocaleString()} above the emergency-fund floor.`
        : 'The emergency-fund floor currently uses the available liquid cash, so no additional sweep is recommended.',
      dataUsed: [`S$${(snapshot?.totalLiquidCash || 0).toLocaleString()} liquid cash`, `S$${(snapshot?.emergencyFund || 0).toLocaleString()} emergency floor`, 'Linked-account balances'],
    },
    cpp: {
      ...RECOMMENDATION_DETAILS.cpp,
      dataUsed: [`${profile?.user?.age || 'Verified'} age`, `S$${Math.round(snapshot?.cpfTotal || 0).toLocaleString()} CPF`, `${timeline}-year horizon`, 'Emergency cash reserve'],
    },
    support: {
      ...RECOMMENDATION_DETAILS.support,
      dataUsed: [`${snapshot?.dependentCount || 0} MyInfo child records`, snapshot?.housingType || 'Housing record', `S$${(snapshot?.monthlyTakeHome || 0).toLocaleString()} linked take-home`, 'Agency eligibility rules'],
    },
  };
  const lastSyncedLabel = snapshot?.lastSynced
    ? new Date(snapshot.lastSynced).toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : 'Not synced';
  const contributorTotal = snapshot?.contributors.reduce((sum, contributor) => sum + contributor.amount, 0) || 1;

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
              <Text style={styles.greetingText}>{getGreeting()}, {primaryName}</Text>
              <Text style={styles.welcomeText}>Your OWNLYplan</Text>
              <Text style={styles.planStatusText}>{label} · Active · {activePlan?.predictionScenario || 'balanced'} outlook</Text>
              <Text style={styles.syncText}>SGFinDex synced {lastSyncedLabel}</Text>
              <Text style={styles.intelligenceSourceText}>
                {analysis?.intelligenceSource === 'GEMINI_2_5_FLASH' ? 'Gemini-enhanced explanation · verified calculations' : 'Explainable rules · deterministic fallback'}
              </Text>
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

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>How we calculated your surplus</Text>
                <Text style={styles.cardSubHeader}>From linked household income and spending</Text>
              </View>
              <View style={styles.verifiedPill}><Text style={styles.verifiedPillText}>SGFinDex</Text></View>
            </View>
            <View style={styles.surplusEquation}>
              <View><Text style={styles.equationLabel}>Take-home</Text><Text style={styles.equationValue}>S${(snapshot?.monthlyTakeHome || aggregate?.summary?.monthlyHouseholdTakeHome || 0).toLocaleString()}</Text></View>
              <Text style={styles.equationOperator}>−</Text>
              <View><Text style={styles.equationLabel}>Outgoings</Text><Text style={styles.equationValue}>S${(snapshot?.monthlyExpenses || aggregate?.summary?.monthlyHouseholdExpenses || 0).toLocaleString()}</Text></View>
              <Text style={styles.equationOperator}>=</Text>
              <View><Text style={styles.equationLabel}>Surplus</Text><Text style={styles.equationValueAccent}>S${(activePlan?.monthlySurplus || 0).toLocaleString()}</Text></View>
            </View>
            <View style={styles.incomeBar}>
              {(snapshot?.contributors || []).map((contributor, index) => (
                <View key={contributor.label} style={[styles.incomeSegment, { width: `${contributor.amount / contributorTotal * 100}%`, backgroundColor: routeColors[index % routeColors.length] }]} />
              ))}
            </View>
            <View style={styles.memberContributionRow}>
              {(snapshot?.contributors || []).map((contributor, index) => (
                <View style={styles.memberContribution} key={contributor.label}><View style={[styles.legendDot, { backgroundColor: routeColors[index % routeColors.length] }]} /><Text style={styles.memberContributionText}>{contributor.label} · {Math.round(contributor.amount / contributorTotal * 100)}%</Text></View>
              ))}
            </View>
            <View style={styles.breakdownRows}>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Liquid cash across linked banks</Text><Text style={styles.breakdownValue}>S${(snapshot?.totalLiquidCash || 0).toLocaleString()}</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Investments</Text><Text style={styles.breakdownValue}>S${(snapshot?.totalInvestments || 0).toLocaleString()}</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Protected emergency floor</Text><Text style={styles.breakdownValue}>S${(snapshot?.emergencyFund || 0).toLocaleString()}</Text></View>
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
                { id: 'fallback-1', percentage: split, name: 'Home' },
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

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Can we reach our goals?</Text>
                <Text style={styles.cardSubHeader}>Current balances, deadlines and forecast range</Text>
              </View>
              <View style={[styles.onTrackPill, onTrackCount < goals.length && styles.atRiskPill]}>
                <Text style={[styles.onTrackText, onTrackCount < goals.length && styles.atRiskText]}>{onTrackCount}/{goals.length} on track</Text>
              </View>
            </View>
            {goals.length > 0 ? (
              <>
                <View style={styles.goalTabs}>
                  {goals.map((goal) => (
                    <TouchableOpacity key={goal.key} style={[styles.goalTab, selectedGoal?.key === goal.key && styles.goalTabActive]} onPress={() => setSelectedGoalKey(goal.key)}>
                      <Text style={[styles.goalTabText, selectedGoal?.key === goal.key && styles.goalTabTextActive]}>{goal.key === 'housing' ? 'Home' : goal.key === 'education' ? 'Education' : 'Retirement'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedGoal ? (
                  <>
                    <View style={styles.goalHeadlineRow}>
                      <View style={styles.headerTextGroup}>
                        <Text style={styles.goalHeadline}>{selectedGoal.label}</Text>
                        <Text style={styles.goalMeta}>S${selectedGoal.monthlyContribution.toLocaleString()}/month · target {selectedGoal.targetDate}</Text>
                      </View>
                      <View style={[styles.goalStatus, selectedGoal.status === 'AT_RISK' ? styles.goalStatusRisk : styles.goalStatusGood]}>
                        <Text style={[styles.goalStatusText, selectedGoal.status === 'AT_RISK' ? styles.goalStatusTextRisk : styles.goalStatusTextGood]}>{selectedGoal.status === 'AT_RISK' ? 'At risk' : selectedGoal.status === 'REACHED' ? 'Reached' : 'On track'}</Text>
                      </View>
                    </View>
                    <GoalProjectionChart goal={selectedGoal} />
                    <View style={styles.goalNumbersRow}>
                      <View style={styles.goalNumber}><Text style={styles.goalNumberLabel}>CURRENT</Text><Text style={styles.goalNumberValue}>S${selectedGoal.currentAmount.toLocaleString()}</Text></View>
                      <View style={styles.goalNumber}><Text style={styles.goalNumberLabel}>TARGET</Text><Text style={styles.goalNumberValue}>S${selectedGoal.targetAmount.toLocaleString()}</Text></View>
                      <View style={styles.goalNumber}><Text style={styles.goalNumberLabel}>FORECAST RANGE</Text><Text style={styles.goalNumberValue}>S${Math.round(selectedGoal.lowEstimate / 1000)}K–{Math.round(selectedGoal.highEstimate / 1000)}K</Text></View>
                    </View>
                    <View style={[styles.goalActionBox, selectedGoal.status === 'AT_RISK' ? styles.goalActionRisk : styles.goalActionGood]}>
                      <Text style={styles.goalActionTitle}>{selectedGoal.actionText}</Text>
                      <Text style={styles.goalActionBody}>{selectedGoal.confidence}% forecast confidence · {Math.round(selectedGoal.returnRate * 1000) / 10}% annual return assumption</Text>
                      {selectedGoal.status === 'AT_RISK' && onEditPlan ? (
                        <TouchableOpacity style={styles.adjustGoalButton} onPress={onEditPlan}><Text style={styles.adjustGoalText}>Adjust contributions</Text></TouchableOpacity>
                      ) : null}
                    </View>
                    <Text style={styles.dataSourceText}>Uses: {selectedGoal.dataUsed.join(' · ')}</Text>
                  </>
                ) : null}
              </>
            ) : (
              <Text style={styles.emptyStateText}>Edit and reconfirm this plan to generate goal-level forecasts.</Text>
            )}
          </View>
        </View>

        {/* OCBC Recommends Horizontal Scroll */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>OCBC Recommends</Text>
              <Text style={styles.cardSubHeader}>Personalised next steps for {familyDescription}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAllRecommendations((current) => !current)}>
              <Text style={styles.seeAllText}>{showAllRecommendations ? 'Show less' : 'See all →'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {(showAllRecommendations ? personalizedRecommendations : personalizedRecommendations.slice(0, 4)).map((p) => (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.85}
                style={[styles.recommendCard, { backgroundColor: p.colors[0] }]}
                onPress={() => { setRecommendationAccepted(false); setSelectedRecommendation(p); }}
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
              { icon: '🎯', label: 'Goal Outlook', value: `${onTrackCount}/${goals.length}`, sub: goals.length ? 'Goals currently on track' : 'Reconfirm plan to forecast', color: '#D81E05' },
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

      <Modal visible={Boolean(selectedRecommendation)} transparent animationType="slide" onRequestClose={() => setSelectedRecommendation(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedRecommendation && (
              <>
                <View style={styles.recModalHeader}>
                  <View style={[styles.recModalIcon, { backgroundColor: selectedRecommendation.colors[0] }]}><Text style={styles.recModalEmoji}>{selectedRecommendation.icon}</Text></View>
                  <View style={styles.headerTextGroup}>
                    <Text style={styles.explainabilityLabel}>WHY THIS FITS YOUR FAMILY</Text>
                    <Text style={styles.recModalTitle}>{selectedRecommendation.title}</Text>
                  </View>
                  <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setSelectedRecommendation(null)}><Text style={styles.modalCloseIconText}>×</Text></TouchableOpacity>
                </View>

                <View style={styles.explanationBlock}>
                  <Text style={styles.explanationTitle}>How the AI arrived here</Text>
                  <Text style={styles.explanationBody}>{recommendationDetails[selectedRecommendation.id].why}</Text>
                </View>

                <Text style={styles.dataTitle}>Data used</Text>
                <View style={styles.dataChips}>
                  {recommendationDetails[selectedRecommendation.id].dataUsed.map((item) => <View key={item} style={styles.dataChip}><Text style={styles.dataChipText}>{item}</Text></View>)}
                </View>

                <View style={styles.impactRow}>
                  <View style={styles.impactCard}><Text style={styles.impactEyebrow}>POTENTIAL IMPACT</Text><Text style={styles.impactBody}>{recommendationDetails[selectedRecommendation.id].impact}</Text></View>
                  <View style={styles.tradeoffCard}><Text style={styles.tradeoffEyebrow}>TRADE-OFF</Text><Text style={styles.impactBody}>{recommendationDetails[selectedRecommendation.id].tradeoff}</Text></View>
                </View>

                {recommendationAccepted ? (
                  <View style={styles.acceptedBox}><Text style={styles.acceptedTitle}>Added to your action list</Text><Text style={styles.acceptedText}>Nothing will be moved or purchased without your confirmation.</Text></View>
                ) : (
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.secondaryAction} onPress={() => setSelectedRecommendation(null)}><Text style={styles.secondaryActionText}>Not now</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.primaryAction} onPress={() => setRecommendationAccepted(true)}><Text style={styles.primaryActionText}>{recommendationDetails[selectedRecommendation.id].nextStep}</Text></TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

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
  syncText: { color: '#9A958E', fontSize: 9, marginTop: 2 },
  intelligenceSourceText: { color: '#16803A', fontSize: 9, fontWeight: '700', marginTop: 4 },
  verifiedPill: { backgroundColor: '#EAF2FF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  verifiedPillText: { color: '#2563EB', fontSize: 9, fontWeight: '800' },
  surplusEquation: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 10 },
  equationLabel: { color: '#8A857E', fontSize: 9, fontWeight: '700', marginBottom: 2 },
  equationValue: { color: '#1A1A1A', fontSize: 15, fontWeight: '800' },
  equationValueAccent: { color: '#D81E05', fontSize: 17, fontWeight: '900' },
  equationOperator: { color: '#B0AAA2', fontSize: 16, paddingBottom: 1 },
  incomeBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  incomeSegment: { height: 8 },
  memberContributionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 10 },
  memberContribution: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  memberContributionText: { color: '#716C65', fontSize: 9, fontWeight: '600' },
  breakdownRows: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0EDE8' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { color: '#767676', fontSize: 10 },
  breakdownValue: { color: '#333333', fontSize: 10, fontWeight: '700' },
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
  onTrackPill: { backgroundColor: '#E9F8EE', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  onTrackText: { color: '#16803A', fontSize: 9, fontWeight: '800' },
  atRiskPill: { backgroundColor: '#FFF4DD' },
  atRiskText: { color: '#A45C00' },
  goalTabs: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  goalTab: { flex: 1, minHeight: 34, borderRadius: 10, backgroundColor: '#F3F1ED', alignItems: 'center', justifyContent: 'center' },
  goalTabActive: { backgroundColor: '#1A1A1A' },
  goalTabText: { color: '#6E6962', fontSize: 10, fontWeight: '700' },
  goalTabTextActive: { color: '#FFFFFF' },
  goalHeadlineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  goalHeadline: { color: '#1A1A1A', fontSize: 15, fontWeight: '800' },
  goalMeta: { color: '#767676', fontSize: 10, marginTop: 3 },
  goalStatus: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  goalStatusGood: { backgroundColor: '#E9F8EE' },
  goalStatusRisk: { backgroundColor: '#FFF4DD' },
  goalStatusText: { fontSize: 9, fontWeight: '800' },
  goalStatusTextGood: { color: '#16803A' },
  goalStatusTextRisk: { color: '#A45C00' },
  goalNumbersRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  goalNumber: { flex: 1, backgroundColor: '#F7F5F1', borderRadius: 11, padding: 9 },
  goalNumberLabel: { color: '#8A857E', fontSize: 7, fontWeight: '900', letterSpacing: 0.4 },
  goalNumberValue: { color: '#292725', fontSize: 11, fontWeight: '800', marginTop: 3 },
  goalActionBox: { borderRadius: 13, padding: 12, marginTop: 10 },
  goalActionGood: { backgroundColor: '#EDF8F1' },
  goalActionRisk: { backgroundColor: '#FFF7E8' },
  goalActionTitle: { color: '#34312E', fontSize: 11, fontWeight: '800' },
  goalActionBody: { color: '#6E6962', fontSize: 9, lineHeight: 14, marginTop: 3 },
  adjustGoalButton: { alignSelf: 'flex-start', backgroundColor: '#D81E05', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7, marginTop: 9 },
  adjustGoalText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  dataSourceText: { color: '#918C85', fontSize: 8, lineHeight: 12, marginTop: 9 },
  emptyStateText: { color: '#767676', fontSize: 12, lineHeight: 18, paddingVertical: 12 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -13, paddingHorizontal: 2 },
  chartLabel: { width: '33%', color: '#7A756E', fontSize: 8, lineHeight: 12 },
  chartLabelCenter: { textAlign: 'center', color: '#D81E05', fontWeight: '700' },
  chartLabelRight: { textAlign: 'right' },
  chartTarget: { position: 'absolute', right: 4, top: 2, color: '#B34B3F', fontSize: 8, fontWeight: '700' },
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
  recModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  recModalIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  recModalEmoji: { fontSize: 22 },
  explainabilityLabel: { color: '#D81E05', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  recModalTitle: { color: '#1A1A1A', fontSize: 17, fontWeight: '900', marginTop: 2 },
  modalCloseIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F1ED', alignItems: 'center', justifyContent: 'center' },
  modalCloseIconText: { color: '#555555', fontSize: 20, lineHeight: 22 },
  explanationBlock: { backgroundColor: '#F8F6F2', borderRadius: 15, padding: 14 },
  explanationTitle: { color: '#252321', fontSize: 12, fontWeight: '800' },
  explanationBody: { color: '#66615B', fontSize: 11, lineHeight: 17, marginTop: 4 },
  dataTitle: { color: '#252321', fontSize: 11, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  dataChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dataChip: { backgroundColor: '#EEF3F8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  dataChipText: { color: '#466176', fontSize: 9, fontWeight: '600' },
  impactRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  impactCard: { flex: 1, backgroundColor: '#EDF8F1', borderRadius: 14, padding: 12 },
  tradeoffCard: { flex: 1, backgroundColor: '#FFF7E8', borderRadius: 14, padding: 12 },
  impactEyebrow: { color: '#16803A', fontSize: 8, fontWeight: '900', marginBottom: 4 },
  tradeoffEyebrow: { color: '#A25F00', fontSize: 8, fontWeight: '900', marginBottom: 4 },
  impactBody: { color: '#4F4B46', fontSize: 10, lineHeight: 15 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  secondaryAction: { minHeight: 48, flex: 0.42, borderRadius: 14, borderWidth: 1, borderColor: '#D9D5CF', alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { color: '#55514C', fontSize: 12, fontWeight: '700' },
  primaryAction: { minHeight: 48, flex: 1, borderRadius: 14, backgroundColor: '#D81E05', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  primaryActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  acceptedBox: { backgroundColor: '#EDF8F1', borderRadius: 14, padding: 14, marginTop: 18 },
  acceptedTitle: { color: '#16803A', fontSize: 12, fontWeight: '800' },
  acceptedText: { color: '#5D7163', fontSize: 10, marginTop: 3 },
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
