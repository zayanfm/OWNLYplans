import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '../components/homescreen';
import { OwnlyScreen } from '../components/whatever';
import { PlanTabShell } from '../components/plan/PlanTabShell';

import { HelpFAB } from '../components/helpFAB';
import { HelpPortal } from '../components/helpPortal';
import { ChatbotOverlay } from '../components/chatbotoverlay';
import { BottomNav } from '../components/BottomNav';

type Screen = 'home' | 'plan' | 'ownly' | 'rewards' | 'more';

export default function MainApp() {
  return (
    <SafeAreaProvider>
      <MainAppContent />
    </SafeAreaProvider>
  );
}

function MainAppContent() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('home');
  const [planMounted, setPlanMounted] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);

  const nav = (to: string) => {
    if (to === 'plan') setPlanMounted(true);
    setScreen(to as Screen);
  };

  return (
      <View style={styles.container}>
        <View style={styles.content}>
          {screen === 'home' && (
            <HomeScreen onOwnly={() => nav('ownly')} onNav={nav} />
          )}

          {screen === 'ownly' && (
            <OwnlyScreen onNav={nav} onHelp={() => setShowHelp(true)} />
          )}

          {/* The Plan tab stays mounted once visited so returning users keep their
              OWNLYplan progress instead of restarting onboarding. */}
          {planMounted && (
            <View style={[styles.fill, screen !== 'plan' && styles.hidden]}>
              <PlanTabShell onNav={nav} onHelp={() => setShowHelp(true)} />
            </View>
          )}
        </View>

        <BottomNav active={screen} onNavigate={nav} />

        {/* Show Help FAB strictly on Home screen */}
        {screen === 'home' && (
          <HelpFAB onPress={() => setShowHelp(true)} />
        )}

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
