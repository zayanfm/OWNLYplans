import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface AgentStatusProps {
  onComplete?: () => void;
  onBack?: () => void;
}

export const AgentStatus: React.FC<AgentStatusProps> = ({ onComplete, onBack }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      if (onComplete) onComplete();
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, onComplete]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.agentCard}>
          <Text style={styles.title}>Agent Status</Text>
          <Text style={styles.subtitle}>Connecting to 4 AI agents...</Text>

          <View style={styles.agentList}>
            {[
              { name: 'Planning Agent', status: 'Active', icon: '🧠' },
              { name: 'Surplus Yield', status: 'Active', icon: '📈' },
              { name: 'Risk Assessor', status: 'Active', icon: '⚡' },
              { name: 'Recommendation Engine', status: 'Active', icon: '✅' },
            ].map((agent) => (
              <View key={agent.name} style={styles.agentRow}>
                <Text style={styles.agentIcon}>{agent.icon}</Text>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentStatus}>{agent.status}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {countdown} seconds until configuration...
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backBtnText: {
    fontSize: 20,
    color: '#D81E05',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  agentList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  agentIcon: {
    fontSize: 24,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  agentStatus: {
    fontSize: 12,
    color: '#16A34A',
  },
  progressContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  progressText: {
    fontSize: 14,
    color: '#767676',
  },
});