import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';

export interface MilestoneItem {
  icon: string;
  year: string;
  title: string;
  detail: string;
}

export interface Screen8Props {
  timeline: string;
  split?: number;
  goalType?: 'shared' | 'personal';
  onApprove: () => void;
  onBack: () => void;
}

const PLAN_MILESTONES_5YR: MilestoneItem[] = [
  {
    icon: '🏠',
    year: 'Year 1 - 2',
    title: 'BTO Downpayment Fund',
    detail: 'Target S$45,000 accumulated in high-yield MMF account.',
  },
  {
    icon: '🛡️',
    year: 'Year 3',
    title: 'Comprehensive Protection Layer',
    detail: 'Establish joint term life & critical illness coverage.',
  },
  {
    icon: '📈',
    year: 'Year 4 - 5',
    title: 'Balanced Growth Allocation',
    detail: 'Transition surplus towards multi-asset index portfolios.',
  },
];

const PLAN_MILESTONES_10YR: MilestoneItem[] = [
  {
    icon: '🏠',
    year: 'Year 1 - 3',
    title: 'Property & Renovation Reserve',
    detail: 'Accumulate core capital for housing initial costs.',
  },
  {
    icon: '👶',
    year: 'Year 4 - 6',
    title: 'Family & Education Cushion',
    detail: 'Structure dedicated education endowment bucket.',
  },
  {
    icon: '🌴',
    year: 'Year 7 - 10',
    title: 'Long-Term Retirement Engine',
    detail: 'Scale equity allocation to compound wealth for early independence.',
  },
];

export const Screen8_PlannerOutput: React.FC<Screen8Props> = ({
  timeline,
  split = 60,
  goalType = 'shared',
  onApprove,
  onBack,
}) => {
  const milestones = timeline === '5' ? PLAN_MILESTONES_5YR : PLAN_MILESTONES_10YR;
  const label = `${timeline}-Year Plan`;
  const partnerSplit = 100 - split;

  // Animation values for approve morph transition
  const animValue = useRef(new Animated.Value(0)).current;

  const handleApprove = () => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start(() => {
      onApprove();
    });
  };

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.08],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0.2, 0],
  });

  return (
    <View style={styles.container}>
      {/* Top Bar Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Your {label}</Text>
          <Text style={styles.headerSub}>AI-generated · Tap Edit to customise</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.readyDot} />
          <Text style={styles.readyText}>Ready</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Dark Summary Hero Card */}
        <View style={styles.darkCard}>
          <View style={styles.aiTagRow}>
            <View style={styles.aiDot} />
            <Text style={styles.aiTagText}>OWNLYplans AI</Text>
          </View>
          <Text style={styles.darkHeroTitle}>Your {label}</Text>
          <Text style={styles.darkHeroSub}>
            {goalType === 'shared'
              ? `Mary ${split}% · Zayan ${partnerSplit}%`
              : 'Mary · Personal Goals'}
          </Text>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={[styles.gridValue, { color: '#60A5FA' }]}>{timeline} Years</Text>
              <Text style={styles.gridLabel}>Timeline</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={[styles.gridValue, { color: '#4ADE80' }]}>
                {timeline === '5' ? '+S$200K' : '+S$500K'}
              </Text>
              <Text style={styles.gridLabel}>Est. Wealth</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={[styles.gridValue, { color: '#FFFFFF' }]}>
                {milestones.length} Goals
              </Text>
              <Text style={styles.gridLabel}>Milestones</Text>
            </View>
          </View>
        </View>

        {/* Milestone Timeline Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Roadmap</Text>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineLine} />
            {milestones.map((m, i) => (
              <View key={i} style={styles.milestoneRow}>
                <View style={styles.iconCol}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconEmoji}>{m.icon}</Text>
                  </View>
                  <Text style={styles.yearText}>{m.year}</Text>
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneTitle}>{m.title}</Text>
                  <Text style={styles.milestoneDetail}>{m.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Key Assumptions Card */}
        <View style={styles.assumptionsCard}>
          <Text style={styles.cardTitle}>Key Assumptions</Text>
          {[
            ['Monthly Surplus', 'S$1,340/mo'],
            [
              'Contribution',
              goalType === 'shared' ? `${split}/${partnerSplit}` : '100% Mary',
            ],
            ['MMF Yield', '3.85% p.a.'],
            ['Inflation Buffer', '2.5% annual'],
          ].map(([l, v], idx, arr) => (
            <View
              key={l}
              style={[
                styles.assumptionRow,
                idx === arr.length - 1 && styles.noBorderBottom,
              ]}
            >
              <Text style={styles.assumptionKey}>{l}</Text>
              <Text style={styles.assumptionVal}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimerText}>
          AI-generated plan. Not financial advice. Consult an OCBC adviser for personalised guidance.
        </Text>
      </ScrollView>

      {/* Footer Action Buttons with Morph Animation */}
      <Animated.View
        style={[
          styles.footerActions,
          {
            opacity,
            transform: [
              { translateX },
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => console.log('[Demo] Edit plan tapped')}
          style={styles.editBtn}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleApprove}
          style={styles.approveBtn}
        >
          <Text style={styles.approveBtnText}>Approve Plan</Text>
        </TouchableOpacity>
      </Animated.View>
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
  headerTextGroup: {
    flex: 1,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  readyText: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  darkCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  aiTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D81E05',
  },
  aiTagText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  darkHeroTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    marginBottom: 2,
  },
  darkHeroSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gridCol: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  gridValue: {
    fontWeight: '700',
    fontSize: 14,
  },
  gridLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 16,
  },
  timelineContainer: {
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 27,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: '#F0EDE8',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  iconCol: {
    width: 56,
    alignItems: 'center',
    zIndex: 2,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 12,
  },
  yearText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#D81E05',
    marginTop: 4,
  },
  milestoneContent: {
    flex: 1,
    paddingTop: 2,
  },
  milestoneTitle: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  milestoneDetail: {
    color: '#767676',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  assumptionsCard: {
    backgroundColor: '#EDE8DF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  assumptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  noBorderBottom: {
    borderBottomWidth: 0,
  },
  assumptionKey: {
    color: '#767676',
    fontSize: 12,
  },
  assumptionVal: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '600',
  },
  disclaimerText: {
    color: '#767676',
    fontSize: 9,
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  editBtnText: {
    color: '#767676',
    fontWeight: '700',
    fontSize: 16,
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#D81E05',
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});