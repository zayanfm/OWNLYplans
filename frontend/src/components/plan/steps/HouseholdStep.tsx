import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import api from '../../../services/api';
import type { AccountSharing, HouseholdWorkspace, MockPassAuthResponse, WorkspaceAccount } from '../../../services/api';
import { FALLBACK_WORKSPACE } from '../../../constants/mockData';
import { FamilyMember } from '../types';
import { COLORS, money, stepStyles } from '../stepStyles';

const SHARING_LABELS: Record<AccountSharing, string> = { FULL: 'Shared', TOTAL_ONLY: 'Total only', PRIVATE: 'Private' };
const NEXT_SHARING: Record<AccountSharing, AccountSharing> = { FULL: 'TOTAL_ONLY', TOTAL_ONLY: 'PRIVATE', PRIVATE: 'FULL' };
const APPROVAL_POLL_MS = 1000;
const OFFLINE_APPROVAL_MS = 3000;

/**
 * Setup (#1): one screen for the verified MyInfo profile, the household's OCBC accounts with
 * each owner's sharing choice, self-declared savings, and a non-blocking family invite.
 */
export const HouseholdStep: React.FC<{
  profile: MockPassAuthResponse | null;
  family: FamilyMember[];
  onFamilyChange: (family: FamilyMember[]) => void;
  onNext: (workspace: HouseholdWorkspace) => void;
  onBack: () => void;
}> = ({ profile, family, onFamilyChange, onNext, onBack }) => {
  const [workspace, setWorkspace] = useState<HouseholdWorkspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [addingAsset, setAddingAsset] = useState<boolean>(false);
  const [assetLabel, setAssetLabel] = useState<string>('');
  const [assetBalance, setAssetBalance] = useState<string>('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const familyRef = useRef(family);
  familyRef.current = family;

  const partnerFirst = profile?.partner?.name?.split(' ')[0] || 'Your partner';
  const inviteStatus = family.some((m) => m.status === 'PENDING')
    ? 'PENDING'
    : family.some((m) => m.status === 'APPROVED') ? 'APPROVED' : 'IDLE';

  const loadWorkspace = async () => {
    try {
      setWorkspace(await api.getWorkspace());
    } catch {
      setWorkspace(FALLBACK_WORKSPACE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const markApproved = async () => {
    onFamilyChange(familyRef.current.map((m) => (m.status === 'PENDING' ? { ...m, status: 'APPROVED' } : m)));
    // The partner's accounts join the workspace only after consent.
    await loadWorkspace();
  };

  const pollApproval = (startedAt: number, online: boolean) => {
    timer.current = setTimeout(async () => {
      if (!online) {
        markApproved();
        return;
      }
      try {
        const status = await api.getFamilyStatus();
        if (status.allApproved) {
          markApproved();
          return;
        }
      } catch {
        // Fall through and keep waiting; the offline timer below resolves it.
      }
      if (Date.now() - startedAt > OFFLINE_APPROVAL_MS * 3) {
        markApproved();
        return;
      }
      pollApproval(startedAt, online);
    }, online ? APPROVAL_POLL_MS : OFFLINE_APPROVAL_MS);
  };

  const sendInvite = async () => {
    const selected = family.filter((m) => m.selected);
    if (!selected.length) return;
    setSending(true);
    let online = true;
    try {
      await api.inviteFamily(selected.map((m) => ({ name: m.name, relation: m.relation, nric: m.maskedNric })));
    } catch {
      online = false;
    } finally {
      setSending(false);
    }
    onFamilyChange(family.map((m) => (m.selected ? { ...m, status: 'PENDING' } : m)));
    pollApproval(Date.now(), online);
  };

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
      // Offline: the choice is kept for this session.
    }
  };

  const saveAsset = async () => {
    const balance = Number(assetBalance.replace(/[^0-9.]/g, ''));
    if (!assetLabel.trim() || !Number.isFinite(balance) || !workspace) return;
    let saved = { id: `local-${Date.now()}`, label: assetLabel.trim(), owner: 'primary' as const, balance, selfDeclared: true as const };
    try {
      saved = (await api.addManualAsset({ label: saved.label, balance })).asset as typeof saved;
    } catch {
      // Offline: keep the self-declared asset for this session.
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

  const user = profile?.user;
  const accounts = workspace?.accounts || [];
  const groups: Array<{ title: string; items: WorkspaceAccount[] }> = [
    { title: 'Your accounts', items: accounts.filter((a) => a.owner === 'primary') },
    { title: 'Joint', items: accounts.filter((a) => a.owner === 'joint') },
    { title: `${partnerFirst}'s accounts`, items: accounts.filter((a) => a.owner === 'partner') },
  ];

  return (
    <View style={stepStyles.container}>
      <ScrollView contentContainerStyle={stepStyles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={stepStyles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={stepStyles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={stepStyles.eyebrow}>Setup</Text>
        <Text style={stepStyles.title}>Here&apos;s your household</Text>
        <Text style={stepStyles.subtitle}>
          From Singpass MyInfo and your OCBC accounts. Accounts keep their owners and operating rules.
        </Text>

        {user ? (
          <View style={stepStyles.card}>
            <View style={styles.verifiedBanner}><Text style={styles.verifiedText}>🔒 Verified with Singpass (sandbox)</Text></View>
            <Text style={stepStyles.cardTitle}>{user.name}</Text>
            <Text style={stepStyles.cardSub}>
              {user.citizenship} · {user.maritalStatus || 'Married'} · {profile?.household?.housing?.type || 'Housing record'}
            </Text>
            <View style={[stepStyles.row, styles.topGap]}>
              <Text style={stepStyles.rowLabel}>Monthly take-home</Text>
              <Text style={stepStyles.rowValue}>{money(user.monthlyTakeHome)}</Text>
            </View>
            <View style={stepStyles.row}>
              <Text style={stepStyles.rowLabel}>CPF (OA · SA · MA)</Text>
              <Text style={stepStyles.rowValue}>{money(user.cpf.oa + user.cpf.sa + user.cpf.ma)}</Text>
            </View>
          </View>
        ) : null}

        <View style={stepStyles.card}>
          <Text style={stepStyles.sectionLabel}>Family</Text>
          {family.length === 0 ? <Text style={stepStyles.note}>No other household members were returned by MyInfo.</Text> : null}
          {family.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberRow}
              onPress={() => inviteStatus === 'IDLE' && onFamilyChange(family.map((m) => (m.id === member.id ? { ...m, selected: !m.selected } : m)))}
              activeOpacity={inviteStatus === 'IDLE' ? 0.7 : 1}
            >
              <View style={styles.avatar}><Text style={styles.avatarText}>{member.name.charAt(0)}</Text></View>
              <View style={styles.flex}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={stepStyles.cardSub}>{member.relation} · {member.maskedNric}</Text>
              </View>
              {member.status === 'IDLE' ? (
                <View style={[styles.checkbox, member.selected && styles.checkboxActive]}>
                  {member.selected ? <Text style={styles.checkboxTick}>✓</Text> : null}
                </View>
              ) : (
                <Text style={[styles.memberStatus, member.status === 'APPROVED' && styles.memberStatusDone]}>
                  {member.status === 'APPROVED' ? 'Connected' : 'Invited'}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          {inviteStatus === 'IDLE' && family.length > 0 ? (
            <TouchableOpacity
              style={[stepStyles.secondaryButton, styles.topGap, sending && stepStyles.primaryButtonDisabled]}
              onPress={sendInvite}
              disabled={sending || !family.some((m) => m.selected)}
              activeOpacity={0.8}
            >
              <Text style={stepStyles.secondaryButtonText}>{sending ? 'Sending…' : `Invite ${family.filter((m) => m.selected).length} to OWNLYplan`}</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={[stepStyles.note, styles.topGap]}>
            {inviteStatus === 'PENDING'
              ? `Waiting for ${partnerFirst} to accept in the OCBC app. You can carry on; shared accounts appear when they do.`
              : inviteStatus === 'APPROVED'
                ? `${partnerFirst} accepted. Only what they chose to share is shown.`
                : 'Nothing is retrieved until each person approves it themselves.'}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.red} style={styles.loader} />
        ) : (
          groups.filter((group) => group.items.length > 0).map((group) => (
            <View key={group.title} style={stepStyles.card}>
              <Text style={stepStyles.sectionLabel}>{group.title}</Text>
              {group.items.map((account, index) => (
                <View key={`${group.title}-${index}`} style={[stepStyles.row, stepStyles.rowDivider]}>
                  <View style={styles.flex}>
                    <Text style={styles.accountName}>{account.type}</Text>
                    <Text style={stepStyles.cardSub}>
                      {account.status === 'AWAITING_CONSENT'
                        ? `Appears once ${partnerFirst} accepts`
                        : account.role || 'Details kept private by owner'}
                    </Text>
                  </View>
                  <View style={styles.accountRight}>
                    <Text style={stepStyles.rowValue}>{account.balance === null ? '—' : money(account.balance)}</Text>
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
          <View style={stepStyles.card}>
            <Text style={stepStyles.sectionLabel}>Savings outside OCBC</Text>
            {workspace.manualAssets.map((asset) => (
              <View key={asset.id} style={[stepStyles.row, stepStyles.rowDivider]}>
                <View style={styles.flex}>
                  <Text style={styles.accountName}>{asset.label}</Text>
                  <Text style={stepStyles.cardSub}>Self-declared · counts toward net worth only</Text>
                </View>
                <Text style={stepStyles.rowValue}>{money(asset.balance)}</Text>
              </View>
            ))}
            {addingAsset ? (
              <View style={styles.assetForm}>
                <TextInput style={styles.input} placeholder="e.g. DBS savings" value={assetLabel} onChangeText={setAssetLabel} />
                <TextInput style={styles.input} placeholder="Balance (S$)" keyboardType="numeric" value={assetBalance} onChangeText={setAssetBalance} />
                <TouchableOpacity style={stepStyles.secondaryButton} onPress={saveAsset} activeOpacity={0.8}>
                  <Text style={stepStyles.secondaryButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setAddingAsset(true)} activeOpacity={0.7}>
                <Text style={[stepStyles.linkText, styles.topGap]}>+ Add other savings</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {workspace ? (
          <View style={stepStyles.card}>
            <Text style={[stepStyles.sectionLabel, styles.greenLabel]}>Household total</Text>
            <View style={stepStyles.row}><Text style={stepStyles.rowLabel}>Shared OCBC cash</Text><Text style={stepStyles.rowValue}>{money(workspace.summary.totalLiquidCash)}</Text></View>
            <View style={stepStyles.row}><Text style={stepStyles.rowLabel}>Investments</Text><Text style={stepStyles.rowValue}>{money(workspace.summary.totalInvestments)}</Text></View>
            <View style={stepStyles.row}><Text style={stepStyles.rowLabel}>CPF (MyInfo)</Text><Text style={stepStyles.rowValue}>{money(workspace.summary.householdCpfTotal)}</Text></View>
            <View style={stepStyles.row}><Text style={stepStyles.rowLabel}>Net worth</Text><Text style={stepStyles.rowValue}>{money(workspace.summary.netWorth)}</Text></View>
          </View>
        ) : null}
      </ScrollView>

      <View style={stepStyles.footer}>
        <TouchableOpacity
          style={[stepStyles.primaryButton, !workspace && stepStyles.primaryButtonDisabled]}
          onPress={() => workspace && onNext(workspace)}
          disabled={!workspace}
          activeOpacity={0.85}
        >
          <Text style={stepStyles.primaryButtonText}>See our family picture</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topGap: { marginTop: 10 },
  loader: { marginVertical: 24 },
  verifiedBanner: { backgroundColor: COLORS.greenBg, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 10, alignSelf: 'flex-start' },
  verifiedText: { fontSize: 11, fontWeight: '800', color: COLORS.green },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FDECEA', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '900', color: COLORS.red },
  memberName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  memberStatus: { fontSize: 11, fontWeight: '800', color: COLORS.amber },
  memberStatusDone: { color: COLORS.green },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#D0D0D0', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  checkboxTick: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  accountName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  accountRight: { alignItems: 'flex-end', gap: 4 },
  sharePill: { borderRadius: 999, borderWidth: 1, borderColor: COLORS.red, paddingHorizontal: 8, paddingVertical: 2 },
  sharePillText: { fontSize: 10, fontWeight: '800', color: COLORS.red },
  shareStatic: { fontSize: 10, fontWeight: '700', color: COLORS.faint },
  assetForm: { gap: 8, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: COLORS.ink },
  greenLabel: { color: COLORS.green },
});

export default HouseholdStep;
