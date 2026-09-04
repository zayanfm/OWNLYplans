import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import { FALLBACK_SGFINDEX_AGGREGATE, FALLBACK_SGFINDEX_INSTITUTIONS } from '../../../constants/mockData';

export const SgFinDexStep: React.FC<{
  onNext: (aggregate: any) => void;
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  const [selected, setSelected] = useState<string[]>(FALLBACK_SGFINDEX_INSTITUTIONS.map((i) => i.id));
  const [loading, setLoading] = useState<boolean>(false);
  const [aggregate, setAggregate] = useState<any>(null);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleRetrieve = async () => {
    setLoading(true);
    try {
      const res = await api.getSgFinDexAggregate();
      setAggregate(res);
    } catch {
      setAggregate(FALLBACK_SGFINDEX_AGGREGATE);
    } finally {
      setLoading(false);
    }
  };

  const money = (v?: number) => `S$${(v || 0).toLocaleString()}`;
  const summary = aggregate?.summary;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Connect your other banks</Text>
        <Text style={styles.subtitle}>
          SGFinDex lets you retrieve your financial information from participating banks and
          government agencies using Singpass.
        </Text>

        <View style={styles.card}>
          {FALLBACK_SGFINDEX_INSTITUTIONS.map((inst) => {
            const active = selected.includes(inst.id);
            return (
              <TouchableOpacity
                key={inst.id}
                style={styles.instRow}
                onPress={() => toggle(inst.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, active && styles.checkboxActive]}>
                  {active ? <Text style={styles.checkboxTick}>✓</Text> : null}
                </View>
                <View style={styles.instTextWrap}>
                  <Text style={styles.instName}>{inst.name}</Text>
                  <Text style={styles.instDetail}>{inst.detail}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {summary ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Retrieved via SGFinDex</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Liquid cash across banks</Text>
              <Text style={styles.resultValue}>{money(summary.totalLiquidCash)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Investments</Text>
              <Text style={styles.resultValue}>{money(summary.totalInvestments)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Household CPF</Text>
              <Text style={styles.resultValue}>{money(summary.householdCpfTotal)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Household net worth</Text>
              <Text style={styles.resultValue}>{money(summary.netWorth)}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {summary ? (
          <TouchableOpacity style={styles.primaryButton} onPress={() => onNext(aggregate)} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, (loading || selected.length === 0) && styles.primaryButtonDisabled]}
            onPress={handleRetrieve}
            disabled={loading || selected.length === 0}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Retrieve with Singpass</Text>
            )}
          </TouchableOpacity>
        )}
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
    borderRadius: 16,
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
  instRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#D81E05',
    borderColor: '#D81E05',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  instTextWrap: {
    flex: 1,
  },
  instName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  instDetail: {
    fontSize: 11,
    color: '#888888',
    marginTop: 1,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 14,
    marginTop: 14,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultLabel: {
    fontSize: 12,
    color: '#666666',
  },
  resultValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9E5DE',
  },
  primaryButton: {
    backgroundColor: '#D81E05',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default SgFinDexStep;
