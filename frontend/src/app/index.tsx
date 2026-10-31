import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { HomeScreen } from '../components/homescreen';
import { PlanTabShell } from '../components/plan/PlanTabShell';

import { HelpPortal } from '../components/helpPortal';
import { ChatbotOverlay } from '../components/chatbotoverlay';
import { BottomNav } from '../components/BottomNav';
import api from '../services/api';
import type { MockPassAuthResponse } from '../services/api';
import type { OwnlyPlan } from '../components/plan/types';

type Screen = 'home' | 'plan' | 'rewards' | 'more';

export default function MainApp() {
  return (
    <SafeAreaProvider>
      <MainAppContent />
    </SafeAreaProvider>
  );
}

function MainAppContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const callbackParams = useLocalSearchParams<{ mockpassSession?: string | string[] }>();
  const handledSession = useRef<string | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [planMounted, setPlanMounted] = useState<boolean>(false);
  const [planEntryPill, setPlanEntryPill] = useState<'OCBC' | 'OWNLYplan'>('OCBC');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [activePlan, setActivePlan] = useState<OwnlyPlan | null>(null);
  const [authenticatedProfile, setAuthenticatedProfile] = useState<MockPassAuthResponse | null>(null);

  useEffect(() => {
    api.getFinanceOverview()
      .then((overview) => setActivePlan(overview?.activePlan || null))
      .catch(() => setActivePlan(null));
  }, []);

  useEffect(() => {
    const session = Array.isArray(callbackParams.mockpassSession)
      ? callbackParams.mockpassSession[0]
      : callbackParams.mockpassSession;
    if (!session || handledSession.current === session) return;

    handledSession.current = session;
    setPlanEntryPill('OWNLYplan');
    setPlanMounted(true);
    setScreen('plan');
    api.completeMockpassLogin(session)
      .then(setAuthenticatedProfile)
      .catch((error) => console.warn('[MockPass] Could not retrieve completed login:', error?.message || error))
      .finally(() => router.setParams({ mockpassSession: undefined }));
  }, [callbackParams.mockpassSession, router]);

  const nav = (to: string) => {
    if (to === 'ownly') {
      setPlanEntryPill('OWNLYplan');
      setPlanMounted(true);
      setScreen('plan');
      return;
    }
    if (to === 'plan') setPlanMounted(true);
    setScreen(to as Screen);
  };

  return (
      <View style={styles.container}>
        <View style={styles.content}>
          {screen === 'home' && (
            <HomeScreen hasOwnlyPlan={Boolean(activePlan)} onOwnly={() => nav('ownly')} onNav={nav} />
          )}

          {/* The Plan tab stays mounted once visited so returning users keep their
              OWNLYplan progress instead of restarting onboarding. */}
          {planMounted && (
            <View style={[styles.fill, screen !== 'plan' && styles.hidden]}>
              <PlanTabShell authenticatedProfile={authenticatedProfile} initialPill={planEntryPill} activePlan={activePlan} onPlanActivated={setActivePlan} onNav={nav} onHelp={() => setShowHelp(true)} />
            </View>
          )}
        </View>

        <BottomNav active={screen} onNavigate={nav} />

        {/* Floating AI Chatbot Button inside the Plan tab */}
        {screen === 'plan' && (
          <TouchableOpacity
            style={[styles.chatFab, { bottom: 168 + insets.bottom }]}
            activeOpacity={0.85}
            onPress={() => setShowChat(true)}
          >
            <Text style={styles.chatFabIcon}>🤖</Text>
          </TouchableOpacity>
        )}

        <HelpPortal onClose={() => setShowHelp(false)} visible={showHelp} />
        <ChatbotOverlay onClose={() => setShowChat(false)} visible={showChat} />
      </View>
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
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hidden: {
    display: 'none',
  },
  chatFab: {
    position: 'absolute',
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
    zIndex: 200,
  },
  chatFabIcon: {
    fontSize: 24,
  },
});
