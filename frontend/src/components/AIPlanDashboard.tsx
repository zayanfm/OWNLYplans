import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ChatbotOverlay, SetupProps } from './chatbotoverlay';

export interface AIPlanDashboardProps {
  setup?: SetupProps;
  onNav?: (screenKey: string) => void;
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

export const AIPlanDashboard: React.FC<AIPlanDashboardProps> = ({ setup, onNav }) => {
  const timeline = setup?.timeline || '5';
  const split = setup?.split ?? 60;
  const goalType = setup?.goalType || 'shared';

  const partnerSplit = 100 - split;
  const maryMonthly = Math.round((1340 * split) / 100);
  const zayanMonthly = Math.round((1340 * partnerSplit) / 100);
  const [showChat, setShowChat] = useState(false);

  const label = `${timeline}-Year Plan`;

  // Circular progress ring calculations
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * 0.25;
  const strokeDasharray = `${circumference * 0.68} ${circumference}`;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.welcomeText}>Welcome, Mary! 👋</Text>
              <Text style={styles.planStatusText}>{label} · Active</Text>
            </View>

            {/* BTO Progress SVG Ring */}
            <View style={styles.ringContainer}>
              <Svg width="64" height="64" viewBox="0 0 64 64">
                <Circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="#F0EDE8"
                  strokeWidth="6"
                  fill="none"
                />
                <Circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="#D81E05"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.ringCenterText}>
                <Text style={styles.ringPctText}>68%</Text>
                <Text style={styles.ringLabelText}>BTO</Text>
              </View>
            </View>
          </View>

          {/* Contribution Split Bar */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Contribution Split</Text>
              <Text style={styles.cardSubHeader}>S$1,340 / mo combined</Text>
            </View>
            <View style={styles.splitBarContainer}>
              <View style={[styles.splitBarSegment, { width: `${split}%`, backgroundColor: '#D81E05' }]}>
                {split >= 18 && (
                  <Text style={styles.splitSegmentText}>Mary {split}%</Text>
                )}
              </View>
              {goalType === 'shared' && (
                <View style={[styles.splitBarSegment, { width: `${partnerSplit}%`, backgroundColor: '#7AB5E8' }]}>
                  {partnerSplit >= 18 && (
                    <Text style={styles.splitSegmentText}>Zayan {partnerSplit}%</Text>
                  )}
                </View>
              )}
            </View>
            <View style={styles.splitLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#D81E05' }]} />
                <Text style={styles.legendText}>Mary — S${maryMonthly}/mo</Text>
              </View>
              {goalType === 'shared' && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#7AB5E8' }]} />
                  <Text style={styles.legendText}>Zayan — S${zayanMonthly}/mo</Text>
                </View>
              )}
            </View>
          </View>

          {/* Goal Progress Tracker */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Goal Progress</Text>
              <Text style={styles.cardSubHeader}>June 2026</Text>
            </View>
            {[
              { label: 'BTO Goal Pot', pct: 68, bar: '#D81E05', val: 'S$40,800 / S$60K' },
              { label: 'Emergency Fund', pct: 100, bar: '#4ADE80', val: 'S$24,000 ✓' },
              { label: 'Investment Portfolio', pct: 37, bar: '#7AB5E8', val: 'S$18,450 / S$50K' },
            ].map((g) => (
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
              <Text style={styles.statusFooterText}>All goals on track · Est. gain +S$340/mo</Text>
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
              { icon: '💰', label: 'Monthly Surplus', value: 'S$1,340', sub: 'Routed to MMF', color: '#2563EB' },
              { icon: '📈', label: 'Portfolio Return', value: '+3.2%', sub: 'This month', color: '#16A34A' },
              { icon: '🛡️', label: 'Protection Gap', value: 'S$160K', sub: 'GE plan available', color: '#9333EA' },
              { icon: '🏠', label: 'BTO Countdown', value: '18 mo', sub: 'On schedule ✓', color: '#D81E05' },
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

      {/* Floating Action Chatbot Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setShowChat(true)}
      >
        <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <Rect x="2" y="3" width="18" height="12" rx="4" fill="white" fillOpacity="0.92" />
          <Circle cx="7" cy="9" r="1.5" fill="#D81E05" />
          <Circle cx="11" cy="9" r="1.5" fill="#D81E05" />
          <Circle cx="15" cy="9" r="1.5" fill="#D81E05" />
          <Path
            d="M5 19l4-4h6"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Chat Overlay Modal */}
      {showChat && (
        <ChatbotOverlay setup={setup} onClose={() => setShowChat(false)} />
      )}
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
    paddingBottom: 110,
  },
  headerSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 12,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 12,
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
    paddingHorizontal: 16,
    marginBottom: 16,
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
    borderRadius: 16,
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
    paddingHorizontal: 16,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tileCard: {
    width: (Dimensions.get('window').width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D81E05',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 140,
  },
});