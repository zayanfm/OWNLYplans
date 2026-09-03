import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

export interface PlanLandingPageProps {
  onStart: () => void;
}

export const PlanLandingPage: React.FC<PlanLandingPageProps> = ({ onStart }) => {
  const highlights = [
    { icon: '🔒', text: 'Bank-grade security & PDPA compliant' },
    { icon: '🤖', text: '4 AI agents working in parallel' },
    { icon: '⚡', text: 'Ready in under 30 seconds' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <Rect x="10" y="16" width="44" height="30" rx="9" fill="white" fillOpacity={0.95} />
            <Circle cx="22" cy="31" r="4.5" fill="#D81E05" />
            <Circle cx="42" cy="31" r="4.5" fill="#D81E05" />
            <Path d="M22 31c0 5.5 4.5 10 10 10s10-4.5 10-10" stroke="#D81E05" strokeWidth="2.8" strokeLinecap="round" />
            <Path d="M32 16V9M27 9h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </Svg>
        </View>

        <Text style={styles.title}>AI Life Planner</Text>
        <Text style={styles.subtitle}>
          Your personalised AI-powered financial roadmap, built from your real OCBC data.
        </Text>

        <View style={styles.featureList}>
          {highlights.map((item) => (
            <View key={item.text} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{item.icon}</Text>
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} activeOpacity={0.85} onPress={onStart}>
          <Text style={styles.startButtonText}>START</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#F5F4F0',
  paddingBottom: 82,
},
content: {
  alignItems: 'center',
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
footer: {
  paddingHorizontal: 24,
  paddingBottom: 48,
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