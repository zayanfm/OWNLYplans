import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import api from '../../../services/api';
import type { AccountSharing, HouseholdWorkspace, WorkspaceAccount } from '../../../services/api';
import { FALLBACK_WORKSPACE } from '../../../constants/mockData';

const SHARING_LABELS: Record<AccountSharing, string> = {
  FULL: 'Shared',
  TOTAL_ONLY: 'Total only',
  PRIVATE: 'Private',
};
const NEXT_SHARING: Record<AccountSharing, AccountSharing> = {
  FULL: 'TOTAL_ONLY',
  TOTAL_ONLY: 'PRIVATE',
  PRIVATE: 'FULL',
};

const money = (v?: number | null) => `S$${Math.round(v || 0).toLocaleString()}`;

export const OcbcAccountsStep: React.FC<{
  partnerFirstName?: string;
  onNext: (workspace: HouseholdWorkspace) => void;
  onBack: () => void;
}> = ({ partnerFirstName = 'Your partner', onNext, onBack }) => {
  const [workspace, setWorkspace] = useState<HouseholdWorkspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [addingAsset, setAddingAsset] = useState<boolean>(false);
  const [assetLabel, setAssetLabel] = useState<string>('');
  const [assetBalance, setAssetBalance] = useState<string>('');

  const load = async () => {
    try {
      setWorkspace(await api.getWorkspace());
    } catch {
      setWorkspace(FALLBACK_WORKSPACE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cycleSharing = async (account: WorkspaceAccount) => {
    if (!account.number || !workspace) return;
    const sharing = NEXT_SHARING[account.sharing];
    setWorkspace({
      ...workspace,
      accounts: workspace.accounts.map((item) => (item.number === account.number ? { ...item, sharing } : item)),
    });
    try {
      await api.setAccountSharing(account.number, sharing);
    } catch {
      // Offline: the choice is kept locally for this session.
    }
  };

  const saveAsset = async () => {
    const balance = Number(assetBalance.replace(/[^0-9.]/g, ''));
    if (!assetLabel.trim() || !Number.isFinite(balance) || !workspace) return;
    let saved = { id: `local-${Date.now()}`, label: assetLabel.trim(), owner: 'primary' as const, balance, selfDeclared: true as const };
    try {
      saved = (await api.addManualAsset({ label: saved.label, balance })).asset as typeof saved;
    } catch {
      // Offline: keep the self-declared asset locally.
    }
    setWorkspace({
      ...workspace,
      manualAssets: [...workspace.manualAssets, saved],
      summary: { ...workspace.summary, totalManualAssets: workspace.summary.totalManualAssets + balance, netWorth: workspace.summary.netWorth + balance },
    });
    setAssetLabel('');
    setAssetBalance('');
    setAddingAsset(false);
  };

  const accounts = workspace?.accounts || [];
  const groups: Array<{ title: string; items: WorkspaceAccount[] }> = [
    { title: 'Your accounts', items: accounts.filter((a) => a.owner === 'primary') },
    { title: 'Joint accounts', items: accounts.filter((a) => a.owner === 'joint') },
    { title: `${partnerFirstName}'s accounts`, items: accounts.filter((a) => a.owner === 'partner') },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Your OCBC accounts</Text>
        <Text style={styles.subtitle}>
          Choose what the household can see. Accounts keep their existing owners and operating rules.
        </Text>

        {loading ? (
          <ActivityIndicator color="#D81E05" style={styles.loader} />
        ) : (
          groups.filter((group) => group.items.length > 0).map((group) => (
            <View key={group.title} style={styles.card}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.items.map((account, index) => (
                <View key={`${group.title}-${index}`} style={styles.accountRow}>
                  <View style={styles.accountTextWrap}>
                    <Text style={styles.accountName}>{account.type}</Text>
                    <Text style={styles.accountDetail}>
                      {account.status === 'AWAITING_CONSENT'
                        ? `Appears once ${partnerFirstName} accepts the invite`
                        : account.role || 'Details kept private by owner'}
                    </Text>
                  </View>
                  <View style={styles.accountRight}>
                    <Text style={styles.accountBalance}>{account.balance === null ? '—' : money(account.balance)}</Text>
                    {account.owner === 'primary' ? (
                      <TouchableOpacity style={styles.sharePill} onPress={() => cycleSharing(account)} activeOpacity={0.7}>
                        <Text style={styles.sharePillText}>{SHARING_LABELS[account.sharing]}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.shareStatic}>
                        {account.owner === 'joint' ? 'Both holders' : account.status === 'AWAITING_CONSENT' ? 'Pending' : SHARING_LABELS[account.sharing]}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        {workspace ? (
          <View style={styles.card}>
            <Text style={styles.groupTitle}>Savings outside OCBC</Text>
            {workspace.manualAssets.map((asset) => (
              <View key={asset.id} style={styles.accountRow}>
                <View style={styles.accountTextWrap}>
                  <Text style={styles.accountName}>{asset.label}</Text>
                  <Text style={styles.accountDetail}>Self-declared · counts toward net worth only</Text>
                </View>
                <Text style={styles.accountBalance}>{money(asset.balance)}</Text>
              </View>
            ))}
            {addingAsset ? (
              <View style={styles.assetForm}>
                <TextInput style={styles.input} placeholder="e.g. DBS savings" value={assetLabel} onChangeText={setAssetLabel} />
                <TextInput style={styles.input} placeholder="Balance (S$)" keyboardType="numeric" value={assetBalance} onChangeText={setAssetBalance} />
                <TouchableOpacity style={styles.secondaryButton} onPress={saveAsset} activeOpacity={0.8}>
                  <Text style={styles.secondaryButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setAddingAsset(true)} activeOpacity={0.7}>
                <Text style={styles.linkText}>+ Add other savings</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {workspace ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>From Singpass MyInfo and OCBC</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Shared OCBC cash</Text>
              <Text style={styles.resultValue}>{money(workspace.summary.totalLiquidCash)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Investments</Text>
              <Text style={styles.resultValue}>{money(workspace.summary.totalInvestments)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>CPF (MyInfo)</Text>
              <Text style={styles.resultValue}>{money(workspace.summary.householdCpfTotal)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Net worth</Text>
              <Text style={styles.resultValue}>{money(workspace.summary.netWorth)}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, !workspace && styles.primaryButtonDisabled]}
          onPress={() => workspace && onNext(workspace)}
          disabled={!workspace}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
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
  backButtonText: { fontSize: 18, color: '#D81E05', fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '900', color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 19, color: '#666666', marginBottom: 14 },
  loader: { marginVertical: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 14,
    marginBottom: 12,
  },
  groupTitle: { fontSize: 12, fontWeight: '800', color: '#767676', textTransform: 'uppercase', marginBottom: 4 },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: '#F4F4F4' },
  accountTextWrap: { flex: 1 },
  accountName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  accountDetail: { fontSize: 11, color: '#888888', marginTop: 1 },
  accountRight: { alignItems: 'flex-end', gap: 4 },
  accountBalance: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  sharePill: { borderRadius: 999, borderWidth: 1, borderColor: '#D81E05', paddingHorizontal: 8, paddingVertical: 2 },
  sharePillText: { fontSize: 10, fontWeight: '800', color: '#D81E05' },
  shareStatic: { fontSize: 10, fontWeight: '700', color: '#888888' },
  assetForm: { gap: 8, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#1A1A1A' },
  linkText: { fontSize: 13, fontWeight: '800', color: '#D81E05', marginTop: 10 },
  secondaryButton: { borderRadius: 10, borderWidth: 1, borderColor: '#D81E05', paddingVertical: 8, alignItems: 'center' },
  secondaryButtonText: { fontSize: 13, fontWeight: '800', color: '#D81E05' },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 14,
  },
  resultTitle: { fontSize: 13, fontWeight: '800', color: '#2E7D32', marginBottom: 8 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultLabel: { fontSize: 12, color: '#666666' },
  resultValue: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#E9E5DE' },
  primaryButton: { backgroundColor: '#D81E05', borderRadius: 14, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});

export default OcbcAccountsStep;
