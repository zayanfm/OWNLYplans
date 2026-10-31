import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api, { AgentAnalysisData } from '../../../services/api';

const AGENTS = [
  { id: 'health', icon: '🩺', name: 'Household Health & Risk', detail: 'Buffer, debt ratio & protection gap' },
  { id: 'goals', icon: '🎯', name: 'Multi-Generational Goals', detail: 'Home resilience, education & retirement' },
  { id: 'grants', icon: '🇸🇬', name: 'Grants & Schemes', detail: 'Verifying support without assuming eligibility' },
  { id: 'orchestrator', icon: '🧠', name: 'Orchestrator', detail: 'Ranking your next-best actions' },
];

const STEP_MS = 700;

export const AnalyzingStep: React.FC<{
  onComplete: (analysis: AgentAnalysisData | null) => void;
}> = ({ onComplete }) => {
  const [completedCount, setCompletedCount] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let analysis: AgentAnalysisData | null = null;

    intervalRef.current = setInterval(() => {
      setCompletedCount((prev) => Math.min(prev + 1, AGENTS.length));
    }, STEP_MS);

    const analysisRequest = api.analyzeAgents()
      .then((res) => { analysis = res?.data || null; })
      .catch(() => { analysis = null; });

    const animationDelay = new Promise<void>((resolve) => {
      setTimeout(resolve, STEP_MS * AGENTS.length);
    });

    Promise.all([analysisRequest, animationDelay]).then(() => {
      if (cancelled) return;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCompletedCount(AGENTS.length);
      onComplete(analysis);
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onComplete]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Building your family plan</Text>
        <Text style={styles.subtitle}>
          Four specialised agents are reviewing your household. This takes a few seconds.
        </Text>

        <View style={styles.card}>
          {AGENTS.map((agent, index) => {
            const done = index < completedCount;
            const running = index === completedCount;
            return (
              <View key={agent.id} style={styles.agentRow}>
                <View style={styles.agentIconWrap}>
                  <Text style={styles.agentIcon}>{agent.icon}</Text>
                </View>
                <View style={styles.agentTextWrap}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentDetail}>{agent.detail}</Text>
                </View>
                {done ? (
                  <Text style={styles.agentTick}>✓</Text>
                ) : running ? (
                  <ActivityIndicator size="small" color="#D81E05" />
                ) : (
                  <Text style={styles.agentQueued}>·</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#666666',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 6,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 12,
  },
  agentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentIcon: {
    fontSize: 18,
  },
  agentTextWrap: {
    flex: 1,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  agentDetail: {
    fontSize: 11,
    color: '#888888',
    marginTop: 1,
  },
  agentTick: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2E7D32',
  },
  agentQueued: {
    fontSize: 20,
    color: '#C4C4C4',
  },
});

export default AnalyzingStep;
