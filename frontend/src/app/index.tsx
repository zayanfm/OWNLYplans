import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

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

export default function MainApp() {
  const [screen, setScreen] = useState<string>('home'); // 'home' | 'ownly' | 'plan'
  const [wizardStep, setWizardStep] = useState<number>(0); // 0 = landing, 1-8 = wizard screens, 9 = dashboard
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [planSetup, setPlanSetup] = useState<any>(null);

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

  const handleWizardComplete = (setupData: any) => {
    setPlanSetup(setupData);
    setWizardStep(9); // Render AIPlanDashboard
  };

  return (
    <SafeAreaProvider>
      {/* Restrict safe area padding to top edges so BottomNav handles its own bottom insets */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
              <View style={styles.wizardContainer}>
                {wizardStep === 0 && (
                  <PlanLandingTab onStart={() => setWizardStep(1)} onNav={nav} />
                )}
                {wizardStep === 1 && (
                  <Screen1_Anomaly onNext={handleNextStep} onBack={handlePrevStep} />
                )}
                {wizardStep === 2 && (
                  <Screen2_allocationFlow {...({ onNext: handleNextStep, onBack: handlePrevStep } as any)} />
                )}
                {wizardStep === 3 && (
                  <Screen3_agentStatux {...({ onNext: handleNextStep, onBack: handlePrevStep } as any)} />
                )}
                {wizardStep === 4 && (
                  <Screen4_GoalSelect {...({ onNext: handleNextStep, onBack: handlePrevStep } as any)} />
                )}
                {wizardStep === 5 && (
                  <Screen5_Waiting {...({ onNext: handleNextStep, onBack: handlePrevStep } as any)} />
                )}
                {wizardStep === 6 && (
                  <Screen6_PlannerConfig {...({ onNext: handleNextStep, onBack: handlePrevStep } as any)} />
                )}
                {wizardStep === 7 && (
                  <Screen7_PlannerLoading {...({ onNext: handleNextStep, onBack: handlePrevStep } as any)} />
                )}
                {wizardStep === 8 && (
                  <Screen8_PlannerOutput {...({ onComplete: handleWizardComplete, onBack: handlePrevStep } as any)} />
                )}
                {wizardStep === 9 && (
                  <AIPlanDashboard setup={planSetup} onNav={nav} />
                )}
              </View>
            )}
          </View>

          {/* 3. Global Overlays & Bottom Navigation */}
          {wizardStep === 0 && (
            <BottomNav active={screen} onNavigate={nav} />
          )}

          {wizardStep === 0 && (
            <HelpFAB onPress={() => setShowHelp(true)} />
          )}

          {showHelp && <HelpPortal onClose={() => setShowHelp(false)} visible={false} />}
          {showChat && <ChatbotOverlay onClose={() => setShowChat(false)} />}
        </View>
      </SafeAreaView>
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