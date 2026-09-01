import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

export interface PlannerConfigData {
  split: number;
  timeline: string;
  goals: string[];
  aiTier: string;
}

export interface Screen6Props {
  goalType: 'personal' | 'shared';
  onComplete: (config: PlannerConfigData) => void;
  onBack: () => void;
}

interface AiTierOption {
  id: string;
  tag: string;
  label: string;
  desc: string;
  icon: string;
}

const AI_TIERS: AiTierOption[] = [
  {
    id: 'low',
    tag: 'Plan Only',
    label: 'Low Intervention',
    desc: 'AI only provides the personalised plan. You must manually execute all actions.',
    icon: '📋',
  },
  {
    id: 'medium',
    tag: 'Co-Pilot',
    label: 'Medium Intervention',
    desc: 'AI handles allocation logic, but all fund movements must be approved by you.',
    icon: '🤝',
  },
  {
    id: 'high',
    tag: 'Autopilot',
    label: 'High Intervention',
    desc: 'AI moves funds freely to optimise goals. Includes a mandatory monthly review and check-in.',
    icon: '🚀',
  },
];

export const Screen6_PlannerConfig: React.FC<Screen6Props> = ({
  goalType,
  onComplete,
  onBack,
}) => {
  const [split, setSplit] = useState<number>(60);
  const [timeline, setTimeline] = useState<string>('5');
  const [goals, setGoals] = useState<string[]>([
    'BTO (Build-To-Order)',
    'Car',
    'Retirement Planning',
    'Education',
  ]);
  const [aiTier, setAiTier] = useState<string>('medium');

  const partner = 'Zayan';
  const partnerPct = 100 - split;

  // Reordering helpers for React Native mobile lists
  const moveGoal = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= goals.length) return;
    const updatedGoals = [...goals];
    const [movedItem] = updatedGoals.splice(fromIndex, 1);
    updatedGoals.splice(toIndex, 0, movedItem);
    setGoals(updatedGoals);
  };

  const selectedTierObj = AI_TIERS.find((t) => t.id === aiTier);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Configure Your Plan</Text>
          <Text style={styles.headerSub}>Goals · AI tier · Split · Horizon</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* SECTION 1: Financial Goals Reordering */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What are your financial goals?</Text>
          <Text style={styles.cardSub}>
            Reorder your top priorities. Your contribution split will automatically weigh towards your highest-ranked items.
          </Text>

          <View style={styles.goalList}>
            {goals.map((g, i) => {
              const isFirst = i === 0;
              return (
                <View
                  key={g}
                  style={[
                    styles.goalRow,
                    isFirst ? styles.goalRowFirst : styles.goalRowDefault,
                  ]}
                >
                  <View style={[styles.rankBadge, isFirst ? styles.rankBadgeFirst : styles.rankBadgeDefault]}>
                    <Text style={[styles.rankBadgeText, isFirst ? styles.rankBadgeTextFirst : styles.rankBadgeTextDefault]}>
                      {i + 1}
                    </Text>
                  </View>

                  <Text style={[styles.goalLabel, isFirst ? styles.goalLabelFirst : styles.goalLabelDefault]}>
                    {g}
                  </Text>

                  {isFirst && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityBadgeText}>Highest Priority</Text>
                    </View>
                  )}

                  {/* Reorder Buttons */}
                  <View style={styles.reorderControls}>
                    <TouchableOpacity
                      disabled={i === 0}
                      onPress={() => moveGoal(i, i - 1)}
                      style={[styles.arrowBtn, i === 0 && styles.arrowBtnDisabled]}
                    >
                      <Text style={styles.arrowText}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={i === goals.length - 1}
                      onPress={() => moveGoal(i, i + 1)}
                      style={[styles.arrowBtn, i === goals.length - 1 && styles.arrowBtnDisabled]}
                    >
                      <Text style={styles.arrowText}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* SECTION 2: AI Intervention Tier */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Choose your AI Intervention Tier</Text>
          <Text style={styles.cardSub}>
            Select how much autonomy you want to grant your financial copilot.
          </Text>

          <View style={styles.tierList}>
            {AI_TIERS.map((t) => {
              const active = aiTier === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.8}
                  onPress={() => setAiTier(t.id)}
                  style={[
                    styles.tierCard,
                    active ? styles.tierCardActive : styles.tierCardDefault,
                  ]}
                >
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierIcon}>{t.icon}</Text>
                    <View style={[styles.tagBadge, active ? styles.tagBadgeActive : styles.tagBadgeDefault]}>
                      <Text style={[styles.tagText, active ? styles.tagTextActive : styles.tagTextDefault]}>
                        {t.tag}
                      </Text>
                    </View>
                    <Text style={[styles.tierLabel, active ? styles.tierLabelActive : styles.tierLabelDefault]}>
                      {t.label}
                    </Text>
                    {active && (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tierDesc}>{t.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 3: Contribution Split (Shared goals only) */}
        {goalType === 'shared' && (
          <View style={styles.card}>
            <View style={styles.splitHeader}>
              <Text style={styles.cardTitle}>Contribution Split</Text>
              <Text style={styles.splitSubTag}>Adjust proportion</Text>
            </View>

            {/* Split Visual Bar */}
            <View style={styles.splitBarContainer}>
              <View style={[styles.splitBarLeft, { flex: split }]}>
                {split >= 20 && <Text style={styles.splitBarText}>Mary {split}%</Text>}
              </View>
              <View style={[styles.splitBarRight, { flex: partnerPct }]}>
                {partnerPct >= 20 && <Text style={styles.splitBarText}>{partner} {partnerPct}%</Text>}
              </View>
            </View>

            {/* Quick Adjust Buttons */}
            <View style={styles.splitAdjustRow}>
              {[30, 40, 50, 60, 70].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setSplit(val)}
                  style={[styles.splitPresetBtn, split === val && styles.splitPresetBtnActive]}
                >
                  <Text style={[styles.splitPresetText, split === val && styles.splitPresetTextActive]}>
                    {val}/{100 - val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Split Legend */}
            <View style={styles.splitLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#D81E05' }]} />
                <Text style={styles.legendText}>Mary — {split}%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#7AB5E8' }]} />
                <Text style={styles.legendText}>{partner} — {partnerPct}%</Text>
              </View>
            </View>

            {/* Split Monthly Breakdown */}
            <View style={styles.monthlyBreakdown}>
              <View style={styles.breakdownCol}>
                <Text style={styles.breakdownLabel}>Mary / mo</Text>
                <Text style={[styles.breakdownVal, { color: '#D81E05' }]}>
                  S${Math.round((1340 * split) / 100)}
                </Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownCol}>
                <Text style={styles.breakdownLabel}>{partner} / mo</Text>
                <Text style={[styles.breakdownVal, { color: '#7AB5E8' }]}>
                  S${Math.round((1340 * partnerPct) / 100)}
                </Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownCol}>
                <Text style={styles.breakdownLabel}>Combined</Text>
                <Text style={[styles.breakdownVal, { color: '#1A1A1A' }]}>S$1,340</Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 4: Planning Horizon */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Planning Horizon</Text>
          <View style={styles.horizonRow}>
            {[
              { val: '5', label: '5-Year Plan', sub: 'Focused milestones · BTO, protection, growth' },
              { val: '10', label: '10-Year Plan', sub: 'Long-term wealth · Family, property, retirement prep' },
            ].map((o) => {
              const active = timeline === o.val;
              return (
                <TouchableOpacity
                  key={o.val}
                  activeOpacity={0.8}
                  onPress={() => setTimeline(o.val)}
                  style={[styles.horizonCard, active ? styles.horizonCardActive : styles.horizonCardDefault]}
                >
                  <Text style={[styles.horizonLabel, active ? styles.horizonLabelActive : styles.horizonLabelDefault]}>
                    {o.label}
                  </Text>
                  <Text style={styles.horizonSub}>{o.sub}</Text>
                  {active && (
                    <View style={styles.horizonCheckBadge}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 5: Plan Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeader}>Plan Summary</Text>
          <View style={styles.summaryGroup}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Top Goal</Text>
              <Text style={styles.summaryVal}>{goals[0]}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>AI Tier</Text>
              <Text style={styles.summaryVal}>{selectedTierObj?.tag}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Goal Type</Text>
              <Text style={styles.summaryVal}>
                {goalType === 'shared' ? 'Shared Goals' : 'Personal Goals'}
              </Text>
            </View>
            {goalType === 'shared' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Split</Text>
                <Text style={styles.summaryVal}>
                  Mary {split}% · {partner} {partnerPct}%
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Horizon</Text>
              <Text style={styles.summaryVal}>{timeline}-Year Plan</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onComplete({ split, timeline, goals, aiTier })}
          style={styles.submitBtn}
        >
          <Text style={styles.submitBtnText}>Generate Plan</Text>
        </TouchableOpacity>
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
    marginBottom: 4,
  },
  cardSub: {
    color: '#767676',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 12,
  },
  goalList: {
    gap: 8,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    gap: 8,
  },
  goalRowDefault: {
    borderColor: '#F0EDE8',
    backgroundColor: '#FAFAF9',
  },
  goalRowFirst: {
    borderColor: 'rgba(216, 30, 5, 0.3)',
    backgroundColor: 'rgba(216, 30, 5, 0.05)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeDefault: {
    backgroundColor: '#F0EDE8',
  },
  rankBadgeFirst: {
    backgroundColor: '#D81E05',
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  rankBadgeTextDefault: {
    color: '#767676',
  },
  rankBadgeTextFirst: {
    color: '#FFFFFF',
  },
  goalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  goalLabelDefault: {
    color: '#767676',
  },
  goalLabelFirst: {
    color: '#1A1A1A',
  },
  priorityBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(216, 30, 5, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityBadgeText: {
    color: '#D81E05',
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  reorderControls: {
    flexDirection: 'column',
    gap: 2,
  },
  arrowBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  arrowBtnDisabled: {
    opacity: 0.2,
  },
  arrowText: {
    fontSize: 10,
    color: '#767676',
  },
  tierList: {
    gap: 8,
  },
  tierCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  tierCardDefault: {
    borderColor: '#F0EDE8',
    backgroundColor: '#FAFAF9',
  },
  tierCardActive: {
    borderColor: '#D81E05',
    backgroundColor: '#FEF2F2',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tierIcon: {
    fontSize: 16,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagBadgeDefault: {
    backgroundColor: '#F0EDE8',
  },
  tagBadgeActive: {
    backgroundColor: '#D81E05',
  },
  tagText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  tagTextDefault: {
    color: '#767676',
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  tierLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
  },
  tierLabelDefault: {
    color: '#1A1A1A',
  },
  tierLabelActive: {
    color: '#D81E05',
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
    fontSize: 10,
    fontWeight: '900',
  },
  tierDesc: {
    color: '#767676',
    fontSize: 10,
    lineHeight: 14,
    paddingLeft: 24,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitSubTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#767676',
    backgroundColor: '#F5F4F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  splitBarContainer: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  splitBarLeft: {
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitBarRight: {
    backgroundColor: '#7AB5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitBarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  splitAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  splitPresetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F5F4F0',
  },
  splitPresetBtnActive: {
    backgroundColor: '#1A1A1A',
  },
  splitPresetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#767676',
  },
  splitPresetTextActive: {
    color: '#FFFFFF',
  },
  splitLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  monthlyBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  breakdownCol: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F0EDE8',
  },
  breakdownLabel: {
    color: '#767676',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  breakdownVal: {
    fontWeight: '900',
    fontSize: 16,
    marginTop: 2,
  },
  horizonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  horizonCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  horizonCardDefault: {
    borderColor: '#E8E8E8',
  },
  horizonCardActive: {
    borderColor: '#D81E05',
    backgroundColor: '#FEF2F2',
  },
  horizonLabel: {
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 4,
  },
  horizonLabelDefault: {
    color: '#1A1A1A',
  },
  horizonLabelActive: {
    color: '#D81E05',
  },
  horizonSub: {
    color: '#767676',
    fontSize: 10,
    lineHeight: 14,
  },
  horizonCheckBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#EDE8DF',
    borderRadius: 16,
    padding: 16,
  },
  summaryHeader: {
    color: '#767676',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  summaryGroup: {
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryKey: {
    color: '#767676',
    fontSize: 12,
  },
  summaryVal: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#D81E05',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});