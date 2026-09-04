import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { PlannerConfigData } from '../components/Screen6_PlannerConfig';

import { HomeScreen } from '../components/homescreen';
import { OwnlyScreen } from '../components/whatever';
import { AIPlanDashboard } from '../components/AIPlanDashboard';
import { PlanLandingPage } from '../components/PlanLandingPage';
import { TermsAndConditions } from '../components/termsAndConditions';
import { UserProfile } from '../components/userProfile';

import Screen2_allocationFlow from '../components/Screen2_allocationFlow';
import Screen3_agentStatux from '../components/screen3_agentStatux';
import { Screen4_GoalSelect } from '../components/Screen4_GoalSelect';
import { Screen5_Waiting } from '../components/Screen5_Waiting';
import { Screen6_PlannerConfig } from '../components/Screen6_PlannerConfig';
import { Screen7_PlannerLoading } from '../components/Screen7_PlannerLoading';
import { Screen8_PlannerOutput } from '../components/Screen8_PlannerOutput';

import { HelpFAB } from '../components/helpFAB';
import { HelpPortal } from '../components/helpPortal';
import { ChatbotOverlay } from '../components/chatbotoverlay';
import { BottomNav } from '../components/BottomNav';

type PlanSetup = PlannerConfigData & {
  goalType: 'personal' | 'shared';
  partnerAccount: string;
};

type OnboardingStep = 'landing' | 'terms' | 'profile' | 'planning' | 'agent-status' | 'waiting' | 'config' | 'loading' | 'output';

export default function MainApp() {
  const [screen, setScreen] = useState<string>('home');
  const [hasApprovedPlan, setHasApprovedPlan] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('landing');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [planSetup, setPlanSetup] = useState<PlanSetup | null>(null);
  const [goalType, setGoalType] = useState<'personal' | 'shared'>('shared');
  const [partnerAccount, setPartnerAccount] = useState<string>('');
  const [plannerConfig, setPlannerConfig] = useState<PlannerConfigData>({
    split: 60,
    timeline: '5',
    goals: ['BTO (Build-To-Order)', 'Car', 'Retirement Planning', 'Education'],
    aiTier: 'medium',
  });

  const nav = (to: string) => {
    // If user saved a plan, direct "plan" navigation straight to the final dashboard
    if (to === 'plan' && hasApprovedPlan) {
      setScreen('dashboard');
      return;
    }
    setScreen(to);
  };

  const goToNext = () => {
    const steps: OnboardingStep[] = ['landing', 'terms', 'profile', 'planning', 'agent-status', 'waiting', 'config', 'loading', 'output'];
    const currentIndex = steps.indexOf(onboardingStep);
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      setOnboardingStep(steps[currentIndex + 1]);
    }
  };

  const goToBack = () => {
    const steps: OnboardingStep[] = ['landing', 'terms', 'profile', 'planning', 'agent-status', 'waiting', 'config', 'loading', 'output'];
    const currentIndex = steps.indexOf(onboardingStep);
    if (currentIndex > 0) {
      setOnboardingStep(steps[currentIndex - 1]);
    }
  };

  const goToOnboarding = () => {
    setOnboardingStep('terms');
  };

  const handleApprovePlan = () => {
    setHasApprovedPlan(true);
    setScreen('dashboard');
  };

  const handleConfigComplete = (config: PlannerConfigData) => {
    setPlannerConfig(config);
    setOnboardingStep('loading');
  };

  // Keep Bottom Nav visible on Home, Ownly, Dashboard, and Plan Landing
  const showBottomNav = screen === 'home' || screen === 'ownly' || screen === 'dashboard' || (screen === 'plan' && onboardingStep === 'landing');

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <View style={styles.content}>
          {screen === 'home' && (
            <HomeScreen onOwnly={() => nav('ownly')} onNav={nav} />
          )}

          {screen === 'ownly' && (
            <OwnlyScreen onNav={nav} onHelp={() => setShowHelp(true)} />
          )}

          {screen === 'dashboard' && (
            <SafeAreaView style={styles.wizardContainer} edges={['top', 'left', 'right']}>
              <AIPlanDashboard />
            </SafeAreaView>
          )}

          {screen === 'plan' && (
            <SafeAreaView
              style={styles.wizardContainer}
              edges={['top', 'left', 'right']}
            >
              {onboardingStep === 'landing' && (
                <PlanLandingPage
                  onStart={goToOnboarding}
                />
              )}

              {onboardingStep === 'terms' && (
                <TermsAndConditions
                  onAgree={() => setOnboardingStep('profile')}
                  onBack={() => setOnboardingStep('landing')}
                />
              )}

              {onboardingStep === 'profile' && (
                <UserProfile
                  onNext={() => setOnboardingStep('planning')}
                  onBack={() => setOnboardingStep('terms')}
                />
              )}

              {onboardingStep === 'planning' && (
                <Screen4_GoalSelect
                  onPersonal={() => {
                    setGoalType('personal');
                    setPartnerAccount('');
                    setOnboardingStep('agent-status');
                  }}
                  onShared={(account) => {
                    setGoalType('shared');
                    setPartnerAccount(account);
                    if (account.replace(/\s/g, '').length >= 6) {
                      setOnboardingStep('agent-status');
                    } else {
                      setOnboardingStep('waiting');
                    }
                  }}
                  onBack={() => setOnboardingStep('profile')}
                />
              )}

              {onboardingStep === 'agent-status' && (
                <Screen3_agentStatux
                  onNext={() => setOnboardingStep('waiting')}
                  onBack={goToBack}
                />
              )}

              {onboardingStep === 'waiting' && (
                <Screen5_Waiting
                  partnerAccount={partnerAccount}
                  onComplete={() => setOnboardingStep('config')}
                />
              )}

              {onboardingStep === 'config' && (
                <Screen6_PlannerConfig
                  goalType={goalType}
                  onComplete={handleConfigComplete}
                  onBack={() => setOnboardingStep(onboardingStep === 'waiting' ? 'waiting' : 'planning')}
                />
              )}

              {onboardingStep === 'loading' && (
                <Screen7_PlannerLoading onComplete={() => setOnboardingStep('output')} />
              )}

              {onboardingStep === 'output' && (
                <Screen8_PlannerOutput
                  timeline={plannerConfig.timeline}
                  split={plannerConfig.split}
                  goalType={goalType}
                  onApprove={handleApprovePlan}
                  onBack={() => setOnboardingStep('config')}
                />
              )}
            </SafeAreaView>
          )}
        </View>

        {showBottomNav && (
          <BottomNav active={screen === 'dashboard' ? 'plan' : screen} onNavigate={nav} />
        )}

        {/* Show Help FAB strictly on Home screen */}
        {screen === 'home' && (
          <HelpFAB onPress={() => setShowHelp(true)} />
        )}

        {/* Floating AI Chatbot Button on Dashboard */}
        {screen === 'dashboard' && (
          <TouchableOpacity
            style={styles.chatFab}
            activeOpacity={0.85}
            onPress={() => setShowChat(true)}
          >
            <Text style={styles.chatFabIcon}>🤖</Text>
          </TouchableOpacity>
        )}

        <HelpPortal onClose={() => setShowHelp(false)} visible={showHelp} />
        <ChatbotOverlay onClose={() => setShowChat(false)} visible={showChat} setup={planSetup} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0',
  },
  content: {
    flex: 1,
  },
  wizardContainer: {
    flex: 1,
  },
  chatFab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 99,
  },
  chatFabIcon: {
    fontSize: 24,
  },
});