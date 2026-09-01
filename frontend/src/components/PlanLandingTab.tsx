import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

// --- Interfaces & Types ---

export interface SetupProps {
  goalType: 'personal' | 'shared';
  partnerAccount: string;
  split: number;
  timeline: string;
  goals: string[];
  aiTier: string;
}

export interface PlanLandingTabProps {
  onStart: () => void;
  onNav: (screenKey: string) => void;
}

export interface AIPlannerFlowProps {
  onNav: (screenKey: string) => void;
  onComplete: (setup: SetupProps) => void;
  initialStep?: StepType;
  onBackToLanding?: () => void;
}

type StepType =
  | 'terms'
  | 'profile'
  | 'goalSelect'
  | 'waiting'
  | 'config'
  | 'loading'
  | 'output';

// Placeholder sub-components (Replace with your actual implementations)
const PlannerTerms = ({ onAgree, onBack }: { onAgree: () => void; onBack: () => void }) => <View />;
const PlannerProfile = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => <View />;
const PlannerGoalSelect = ({ onPersonal, onShared, onBack }: { onPersonal: () => void; onShared: (acct: string) => void; onBack: () => void }) => <View />;
const PlannerWaiting = ({ partnerAccount, onComplete }: { partnerAccount: string; onComplete: () => void }) => <View />;
const PlannerConfig = ({ goalType, onComplete, onBack }: { goalType: string; onComplete: (config: { split: number; timeline: string; goals: string[]; aiTier: string }) => void; onBack: () => void }) => <View />;
const PlannerLoading = ({ onComplete }: { onComplete: () => void }) => <View />;
const PlannerOutput = ({ timeline, split, goalType, onApprove, onBack }: { timeline: string; split: number; goalType: string; onApprove: () => void; onBack: () => void }) => <View />;
const BottomNav = ({ active, onNavigate }: { active: string; onNavigate: (key: string) => void }) => <View />;

// --- Component 1: PlanLandingTab ---

export const PlanLandingTab: React.FC<PlanLandingTabProps> = ({ onStart, onNav }) => {
  const highlights = [
    { icon: '🔒', text: 'Bank-grade security & PDPA compliant' },
    { icon: '🤖', text: '4 AI agents working in parallel' },
    { icon: '⚡', text: 'Ready in under 30 seconds' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.landingContent}>
        {/* Main Hero Card Icon */}
        <View style={styles.iconContainer}>
          <Svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <Rect x="10" y="16" width="44" height="30" rx="9" fill="white" fillOpacity={0.95} />
            <Circle cx="22" cy="31" r="4.5" fill="#D81E05" />
            <Circle cx="42" cy="31" r="4.5" fill="#D81E05" />
            <Path d="M22 31c0 5.5 4.5 10 10 10s10-4.5 10-10" stroke="#D81E05" strokeWidth="2.8" strokeLinecap="round" />
            <Path d="M32 16V9M27 9h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </Svg>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>AI Life Planner</Text>
        <Text style={styles.subtitle}>
          Your personalised AI-powered financial roadmap, built from your real OCBC data.
        </Text>

        {/* Highlight Feature Badges */}
        <View style={styles.featureList}>
          {highlights.map((item) => (
            <View key={item.text} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{item.icon}</Text>
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Footer Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.startButton} activeOpacity={0.85} onPress={onStart}>
          <Text style={styles.startButtonText}>START</Text>
        </TouchableOpacity>
      </View>

      <BottomNav active="plan" onNavigate={onNav} />
    </SafeAreaView>
  );
};

// --- Component 2: AIPlannerFlow Controller ---

export const AIPlannerFlow: React.FC<AIPlannerFlowProps> = ({
  onNav,
  onComplete,
  initialStep = 'terms',
  onBackToLanding,
}) => {
  const [step, setStep] = useState<StepType>(initialStep);
  const [goalType, setGoalType] = useState<'personal' | 'shared'>('shared');
  const [partnerAccount, setPartnerAccount] = useState<string>('');
  const [split, setSplit] = useState<number>(60);
  const [timeline, setTimeline] = useState<string>('5');
  const [goals, setGoals] = useState<string[]>([
    'BTO (Build-To-Order)',
    'Car',
    'Retirement Planning',
    'Education',
  ]);
  const [aiTier, setAiTier] = useState<string>('medium');

  if (step === 'terms') {
    return (
      <PlannerTerms
        onAgree={() => setStep('profile')}
        onBack={() => (onBackToLanding ? onBackToLanding() : onNav('home'))}
      />
    );
  }

  if (step === 'profile') {
    return (
      <PlannerProfile
        onNext={() => setStep('goalSelect')}
        onBack={() => setStep('terms')}
      />
    );
  }

  if (step === 'goalSelect') {
    return (
      <PlannerGoalSelect
        onPersonal={() => {
          setGoalType('personal');
          setStep('config');
        }}
        onShared={(acct: string) => {
          setGoalType('shared');
          setPartnerAccount(acct);
          setStep('waiting');
        }}
        onBack={() => setStep('profile')}
      />
    );
  }

  if (step === 'waiting') {
    return (
      <PlannerWaiting
        partnerAccount={partnerAccount}
        onComplete={() => setStep('config')}
      />
    );
  }

  if (step === 'config') {
    return (
      <PlannerConfig
        goalType={goalType}
        onComplete={({ split: s, timeline: t, goals: g, aiTier: a }) => {
          setSplit(s);
          setTimeline(t);
          setGoals(g);
          setAiTier(a);
          setStep('loading');
        }}
        onBack={() => setStep(goalType === 'shared' ? 'waiting' : 'goalSelect')}
      />
    );
  }

  if (step === 'loading') {
    return <PlannerLoading onComplete={() => setStep('output')} />;
  }

  if (step === 'output') {
    return (
      <PlannerOutput
        timeline={timeline}
        split={split}
        goalType={goalType}
        onApprove={() =>
          onComplete({ goalType, partnerAccount, split, timeline, goals, aiTier })
        }
        onBack={() => setStep('config')}
      />
    );
  }

  return null;
};

// --- StyleSheet ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 18,
  },
  landingContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#D81E05',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    color: '#1A1A1A',
    fontWeight: '900',
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  subtitle: {
    color: '#767676',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  featureList: {
    width: '100%',
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '600',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 96,
  },
  startButton: {
    width: '100%',
    backgroundColor: '#D81E05',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D81E05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
  },
});