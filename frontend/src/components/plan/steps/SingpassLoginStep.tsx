import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api, { MockPassAuthResponse } from '../../../services/api';
import { FALLBACK_MYINFO } from '../../../constants/mockData';

export const SingpassLoginStep: React.FC<{
  onAuthenticated: (profile: MockPassAuthResponse) => void;
  onBack: () => void;
}> = ({ onAuthenticated, onBack }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [offline, setOffline] = useState<boolean>(false);

  const handleLogin = async () => {
    setLoading(true);
    setOffline(false);
    try {
      const profile = await api.mockpassLogin();
      onAuthenticated(profile);
    } catch {
      setOffline(true);
      onAuthenticated({
        ...FALLBACK_MYINFO,
        authenticatedAt: new Date().toISOString(),
      } as MockPassAuthResponse);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.singpassCard}>
          <View style={styles.singpassLogoRow}>
            <View style={styles.singpassMark}>
              <Text style={styles.singpassMarkText}>sp</Text>
            </View>
            <Text style={styles.singpassWordmark}>singpass</Text>
          </View>

          <Text style={styles.singpassTitle}>Log in with Singpass</Text>
          <Text style={styles.singpassBody}>
            OWNLYplan will retrieve your verified MyInfo profile — identity, marital status,
            employment income and CPF balances — so you never have to type them in.
          </Text>

          <View style={styles.scopeStack}>
            {['Name, NRIC & citizenship', 'Marital status & dependents', 'Employment & assessable income', 'CPF OA / SA / MediSave balances'].map((scope) => (
              <View key={scope} style={styles.scopeRow}>
                <Text style={styles.scopeTick}>✓</Text>
                <Text style={styles.scopeText}>{scope}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.simulationNote}>
            Prototype uses MockPass, the open-source Singpass simulator.
          </Text>
        </View>

        {offline ? (
          <Text style={styles.offlineNote}>
            Backend unreachable — continuing with the bundled household profile.
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.singpassButton, loading && styles.singpassButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.singpassButtonText}>Log in with Singpass</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 18,
    color: '#D81E05',
    fontWeight: '700',
  },
  singpassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 20,
  },
  singpassLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  singpassMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  singpassMarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  singpassWordmark: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D81E05',
    letterSpacing: -0.5,
  },
  singpassTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  singpassBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#666666',
    marginBottom: 16,
  },
  scopeStack: {
    gap: 8,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scopeTick: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D32',
  },
  scopeText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  simulationNote: {
    fontSize: 11,
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 16,
  },
  offlineNote: {
    fontSize: 11,
    color: '#B26A00',
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9E5DE',
  },
  singpassButton: {
    backgroundColor: '#D81E05',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singpassButtonDisabled: {
    opacity: 0.7,
  },
  singpassButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default SingpassLoginStep;
