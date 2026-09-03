import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { PlannerConfigData } from '../components/Screen6_PlannerConfig';

// Main Screen Components
import { HomeScreen } from '../components/homescreen';
import { PlanLandingTab } from '../components/PlanLandingTab';
import { OwnlyScreen } from '../components/whatever';
import { AIPlanDashboard } from '../components/AIPlanDashboard';

// Wizard Flow Screens
import Screen1_Anomaly from '../components/Screen1_anomaly';
import Screen2_allocationFlow from '../components/Screen2_allocationFlow';
import Screen3_agentStatux from '../components/screen3_agentStatux';
import { Screen4_GoalSelect } from '../components/Screen4_GoalSelect';
import { Screen5_Waiting } from '../components/Screen5_Waiting';
import { Screen6_PlannerConfig } from '../components/Screen6_PlannerConfig';
import { Screen7_PlannerLoading } from '../components/Screen7_PlannerLoading';
import { Screen8_PlannerOutput } from '../components/Screen8_PlannerOutput';

// Global Overlay & UI Components
import { HelpFAB } from '../components/helpFAB';
import { HelpPortal } from '../components/helpPortal';
import { ChatbotOverlay } from '../components/chatbotoverlay';
import { BottomNav } from '../components/BottomNav';

type PlanSetup = PlannerConfigData & {
  goalType: 'personal' | 'shared';
  partnerAccount: string;
};

export default function MainApp() {
  const [screen, setScreen] = useState<string>('home'); // 'home' | 'ownly' | 'plan'
  const [wizardStep, setWizardStep] = useState<number>(0); // 0 = landing, 1-8 = wizard screens, 9 = dashboard
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

  // Global Navigation Handler
  function nav(to: string) {
    setScreen(to);
    if (to !== 'plan') {
      setWizardStep(0);
    }
  }

  // Handle Wizard Advancement
  const handleNextStep = () => setWizardStep((prev) => prev + 1);
  const handlePrevStep = () => setWizardStep((prev) => Math.max(0, prev - 1));

  const handleWizardComplete = (setupData: PlanSetup) => {
    setPlanSetup(setupData);
    setWizardStep(9); // Render AIPlanDashboard
  };

  const handleConfigComplete = (config: PlannerConfigData) => {
    setPlannerConfig(config);
    setWizardStep(7);
  };

  const showBottomNav = wizardStep === 0 || (screen === 'plan' && wizardStep === 9);
  const showHelpFab = wizardStep === 0;

  return (
    <SafeAreaProvider>
      <View style={styles.safeArea}>
        <View style={styles.container}>
          
          {/* Main Content Viewport */}
          <View style={styles.content}>
            {/* 1. Main Root Navigation */}
            {screen === 'home' && (
              <HomeScreen onOwnly={() => nav('ownly')} onNav={nav} />
            )}

            {screen === 'ownly' && (
              <OwnlyScreen onNav={nav} onHelp={() => setShowHelp(true)} />
            )}

            {/* 2. Planning Tab & 8-Step Wizard Engine */}
            {screen === 'plan' && (
              <SafeAreaView
                style={styles.wizardContainer}
                edges={wizardStep > 0 && wizardStep < 9 ? ['top', 'left', 'right'] : ['left', 'right']}
              >
                {wizardStep === 0 && (
                  <PlanLandingTab onStart={() => setWizardStep(1)} onNav={nav} />
                )}
                {wizardStep === 1 && (
                  <Screen1_Anomaly onNext={handleNextStep} onBack={handlePrevStep} />
                )}
                {wizardStep === 2 && (
                  <Screen2_allocationFlow onNext={handleNextStep} onBack={handlePrevStep} />
                )}
                {wizardStep === 3 && (
                  <Screen3_agentStatux onNext={handleNextStep} onBack={handlePrevStep} />
                )}
                {wizardStep === 4 && (
                  <Screen4_GoalSelect
                    onPersonal={() => {
                      setGoalType('personal');
                      setPartnerAccount('');
                      setWizardStep(6);
                    }}
                    onShared={(account) => {
                      setGoalType('shared');
                      setPartnerAccount(account);
                      setWizardStep(5);
                    }}
                    onBack={handlePrevStep}
                  />
                )}
                {wizardStep === 5 && (
                  <Screen5_Waiting partnerAccount={partnerAccount} onComplete={handleNextStep} />
                )}
                {wizardStep === 6 && (
                  <Screen6_PlannerConfig
                    goalType={goalType}
                    onComplete={handleConfigComplete}
                    onBack={() => setWizardStep(goalType === 'shared' ? 5 : 4)}
                  />
                )}
                {wizardStep === 7 && (
                  <Screen7_PlannerLoading onComplete={handleNextStep} />
                )}
                {wizardStep === 8 && (
                  <Screen8_PlannerOutput
                    timeline={plannerConfig.timeline}
                    split={plannerConfig.split}
                    goalType={goalType}
                    onApprove={() => handleWizardComplete({
                      goalType,
                      partnerAccount,
                      ...plannerConfig,
                    })}
                    onBack={() => setWizardStep(6)}
                  />
                )}
                {wizardStep === 9 && (
                  <AIPlanDashboard setup={planSetup} onNav={nav} />
                )}
              </SafeAreaView>
            )}
          </View>

          {/* 3. Global Overlays & Bottom Navigation */}
          {showBottomNav && (
            <BottomNav active={screen} onNavigate={nav} />
          )}

          {showHelpFab && (
            <HelpFAB onPress={() => setShowHelp(true)} />
          )}

          <HelpPortal onClose={() => setShowHelp(false)} visible={showHelp} />
          {showChat && <ChatbotOverlay onClose={() => setShowChat(false)} />}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F4F0',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  wizardContainer: {
    flex: 1,
  },
});
