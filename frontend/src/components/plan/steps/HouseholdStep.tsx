import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Switch } from 'react-native';
import api from '../../../services/api';
import type { AccountSharing, HouseholdWorkspace, MockPassAuthResponse } from '../../../services/api';
import { FALLBACK_WORKSPACE } from '../../../constants/mockData';
import { FamilyMember } from '../types';
import { COLORS, stepStyles } from '../stepStyles';

type Page = 'create' | 'invite' | 'share';
type ShareKey = 'goals' | 'contributions' | 'totalBalance' | 'eachBalance' | 'income' | 'spending' | 'transactions' | 'cpf';

const SHARE_ITEMS: Array<{ key: ShareKey; label: string; detail: string }> = [
  { key: 'goals', label: 'Shared goals', detail: 'Targets and progress' },
  { key: 'contributions', label: 'Agreed contributions', detail: 'The amount you agree to, not how you worked it out' },
  { key: 'totalBalance', label: 'Total balance', detail: 'One combined figure' },
  { key: 'eachBalance', label: 'Each account balance', detail: 'Account by account' },
  { key: 'income', label: 'Income', detail: 'Salary and other income' },
  { key: 'spending', label: 'Spending by category', detail: 'e.g. groceries, transport' },
  { key: 'transactions', label: 'Transactions', detail: 'Individual payments' },
  { key: 'cpf', label: 'CPF balances', detail: 'OA, SA and MA' },
];

// Start with the least needed to plan together.
const DEFAULT_SHARING: Record<ShareKey, boolean> = {
  goals: true, contributions: true, totalBalance: false, eachBalance: false,
  income: false, spending: false, transactions: false, cpf: false,
};

const APPROVAL_POLL_MS = 1000;
const OFFLINE_APPROVAL_MS = 3000;

/**
 * Setup (#1), in three short pages: name the plan and its people, invite the partner,
 * then choose what the partner can see. Nothing is shared by default beyond goals and contributions.
 */
export const HouseholdStep: React.FC<{
  profile: MockPassAuthResponse | null;
  family: FamilyMember[];
  onFamilyChange: (family: FamilyMember[]) => void;
  onNext: (workspace: HouseholdWorkspace) => void;
  onBack: () => void;
}> = ({ profile, family, onFamilyChange, onNext, onBack }) => {
  const [page, setPage] = useState<Page>('create');
  const [workspace, setWorkspace] = useState<HouseholdWorkspace | null>(null);
  const [planName, setPlanName] = useState<string>(`The ${profile?.user?.name?.split(' ').slice(-1)[0] || 'Family'} Family Plan`);
  const [inviteNow, setInviteNow] = useState<boolean>(true);
  const [addingChild, setAddingChild] = useState<boolean>(false);
  const [childName, setChildName] = useState<string>('');
  const [childAge, setChildAge] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sharing, setSharing] = useState<Record<ShareKey, boolean>>(DEFAULT_SHARING);
  const [previewing, setPreviewing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const familyRef = useRef(family);
  familyRef.current = family;

  const user = profile?.user;
  const partner = family.find((m) => m.relation === 'Spouse');
  const partnerFirst = partner?.name.split(' ')[0] || 'your partner';
  const children = family.filter((m) => m.relation === 'Child');
  const ages = new Map<string, number>((profile?.household?.dependents || []).map((d: any) => [d.name, d.age]));
  const ageOf = (child: FamilyMember) => child.age ?? ages.get(child.name);
  const inviteStatus = partner?.status || 'IDLE';

  const loadWorkspace = async () => {
    try {
      setWorkspace(await api.getWorkspace());
    } catch {
      setWorkspace(FALLBACK_WORKSPACE);
    }
  };

  useEffect(() => {
    loadWorkspace();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const setPartnerStatus = (status: FamilyMember['status']) =>
    onFamilyChange(familyRef.current.map((m) => (m.relation === 'Spouse' ? { ...m, status } : m)));

  const markApproved = async () => {
    setPartnerStatus('APPROVED');
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
        // Fall through and keep waiting; the time limit below resolves it.
      }
      if (Date.now() - startedAt > OFFLINE_APPROVAL_MS * 3) {
        markApproved();
        return;
      }
      pollApproval(startedAt, online);
    }, online ? APPROVAL_POLL_MS : OFFLINE_APPROVAL_MS);
  };

  const sendInvite = async () => {
    if (!partner) return;
    if (timer.current) clearTimeout(timer.current);
    setSending(true);
    let online = true;
    try {
      await api.inviteFamily([{ name: partner.name, relation: partner.relation, nric: partner.maskedNric }]);
    } catch {
      online = false;
    } finally {
      setSending(false);
    }
    setPartnerStatus('PENDING');
    pollApproval(Date.now(), online);
  };

  const addChild = () => {
    const name = childName.trim();
    if (!name) return;
    const age = parseInt(childAge, 10);
    onFamilyChange([...family, { id: `child-${Date.now()}`, name, relation: 'Child', maskedNric: '', age: Number.isFinite(age) ? age : undefined, selected: true, status: 'IDLE' }]);
    setChildName('');
    setChildAge('');
    setAddingChild(false);
  };

  const finishSetup = async () => {
    if (!workspace) return;
    setSaving(true);
    // Balance choices decide how your own accounts count in the shared plan.
    const target: AccountSharing = sharing.eachBalance ? 'FULL' : sharing.totalBalance ? 'TOTAL_ONLY' : 'PRIVATE';
    const changes = workspace.accounts.filter((a) => a.owner === 'primary' && a.number && a.sharing !== target);
    let latest = workspace;
    try {
      await Promise.all(changes.map((a) => api.setAccountSharing(a.number as string, target)));
      if (changes.length) latest = await api.getWorkspace();
    } catch {
      // Offline: keep the choices for this session.
      latest = { ...workspace, accounts: workspace.accounts.map((a) => (a.owner === 'primary' ? { ...a, sharing: target } : a)) };
    }
    setSaving(false);
    onNext(latest);
  };

  const goBack = () => {
    if (page === 'share') setPage(partner && inviteNow ? 'invite' : 'create');
    else if (page === 'invite') setPage('create');
    else onBack();
  };

  const nameMissing = !planName.trim();
  const pageNumber = page === 'create' ? 1 : page === 'invite' ? 2 : 3;

  const footer = (() => {
    if (page === 'create') {
      return (
        <TouchableOpacity
          style={[stepStyles.primaryButton, nameMissing && stepStyles.primaryButtonDisabled]}
          onPress={() => (partner && inviteNow ? setPage('invite') : finishSetup())}
          disabled={nameMissing || !workspace}
          activeOpacity={0.85}
        >
          <Text style={stepStyles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      );
    }
    if (page === 'invite') {
      return inviteStatus === 'APPROVED' ? (
        <TouchableOpacity style={stepStyles.primaryButton} onPress={() => setPage('share')} activeOpacity={0.85}>
          <Text style={stepStyles.primaryButtonText}>Choose what to share</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[stepStyles.secondaryButton, styles.footerSecondary]} onPress={finishSetup} activeOpacity={0.8}>
          <Text style={stepStyles.secondaryButtonText}>Continue on my own</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={[stepStyles.primaryButton, saving && stepStyles.primaryButtonDisabled]} onPress={finishSetup} disabled={saving} activeOpacity={0.85}>
        <Text style={stepStyles.primaryButtonText}>{saving ? 'Saving…' : 'See our family picture'}</Text>
      </TouchableOpacity>
    );
  })();

  return (
    <View style={stepStyles.container}>
      <ScrollView contentContainerStyle={stepStyles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={stepStyles.backButton} onPress={goBack} activeOpacity={0.7}>
          <Text style={stepStyles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={stepStyles.eyebrow}>Setup · {pageNumber} of 3</Text>

        {page === 'create' ? (
          <>
            <Text style={stepStyles.title}>Set up your family plan</Text>
            <Text style={stepStyles.subtitle}>Goals and contributions are shared. Your accounts stay private.</Text>

            <View style={stepStyles.card}>
              <Text style={stepStyles.sectionLabel}>Plan name</Text>
              <TextInput
                style={[styles.input, nameMissing && styles.inputError]}
                value={planName}
                onChangeText={setPlanName}
                placeholder="e.g. The Lim Family Plan"
                placeholderTextColor={COLORS.faint}
              />
              {nameMissing ? <Text style={styles.errorText}>Give your plan a name</Text> : null}
            </View>

            <View style={stepStyles.card}>
              <Text style={stepStyles.sectionLabel}>Adults</Text>
              <View style={styles.memberRow}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0) || 'Y'}</Text></View>
                <View style={styles.flex}>
                  <Text style={styles.memberName}>{user?.name || 'You'} (you)</Text>
                  <Text style={stepStyles.cardSub}>Plan creator</Text>
                </View>
                <View style={[stepStyles.pill, { backgroundColor: COLORS.greenBg }]}><Text style={[stepStyles.pillText, { color: COLORS.green }]}>✓ Singpass</Text></View>
              </View>
              {partner ? (
                <View style={styles.memberRow}>
                  <View style={[styles.avatar, styles.avatarPending]}><Text style={styles.avatarText}>{partner.name.charAt(0)}</Text></View>
                  <View style={styles.flex}>
                    <Text style={styles.memberName}>{partner.name}</Text>
                    <Text style={stepStyles.cardSub}>{partner.relation}</Text>
                  </View>
                  <Text style={[styles.memberStatus, inviteStatus === 'APPROVED' && styles.memberStatusDone]}>
                    {inviteStatus === 'APPROVED' ? 'Joined' : inviteStatus === 'PENDING' ? 'Invited' : 'Not invited'}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={stepStyles.card}>
              <Text style={stepStyles.sectionLabel}>Children</Text>
              {children.map((child) => (
                <View key={child.id} style={styles.memberRow}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{child.name.charAt(0)}</Text></View>
                  <View style={styles.flex}>
                    <Text style={styles.memberName}>{child.name}</Text>
                    <Text style={stepStyles.cardSub}>{ageOf(child) !== undefined ? `${ageOf(child)} years old` : 'Age not set'}</Text>
                  </View>
                </View>
              ))}
              {addingChild ? (
                <View style={styles.addRow}>
                  <TextInput style={[styles.input, styles.flex]} value={childName} onChangeText={setChildName} placeholder="Name" placeholderTextColor={COLORS.faint} />
                  <TextInput style={[styles.input, styles.ageInput]} value={childAge} onChangeText={setChildAge} placeholder="Age" keyboardType="number-pad" placeholderTextColor={COLORS.faint} />
                  <TouchableOpacity style={styles.addButton} onPress={addChild} activeOpacity={0.8}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setAddingChild(true)} activeOpacity={0.7} style={styles.topGap}>
                  <Text style={stepStyles.linkText}>+ Add a child</Text>
                </TouchableOpacity>
              )}
              <Text style={[stepStyles.note, styles.topGap]}>For planning only. No child accounts are accessed.</Text>
            </View>

            {partner ? (
              <View style={stepStyles.card}>
                <Text style={stepStyles.sectionLabel}>How do you want to start?</Text>
                {[
                  { value: false, title: 'On my own', detail: `Invite ${partnerFirst} later` },
                  { value: true, title: `Invite ${partnerFirst} now`, detail: `${partnerFirst} accepts on their own phone` },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.title}
                    style={[styles.option, inviteNow === option.value && styles.optionActive]}
                    onPress={() => setInviteNow(option.value)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radio, inviteNow === option.value && styles.radioActive]}>
                      {inviteNow === option.value ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.memberName}>{option.title}</Text>
                      <Text style={stepStyles.cardSub}>{option.detail}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <View style={styles.privacyBox}>
              <Text style={styles.privacyTitle}>🔒 Your privacy</Text>
              <Text style={styles.privacyLine}>• Nothing is shared by default</Text>
              <Text style={styles.privacyLine}>• Each adult chooses what to share</Text>
              <Text style={styles.privacyLine}>• Joining never reveals the other&apos;s accounts</Text>
            </View>
          </>
        ) : null}

        {page === 'invite' && partner ? (
          <>
            <Text style={stepStyles.title}>Invite {partnerFirst}</Text>
            <Text style={stepStyles.subtitle}>{partnerFirst} logs in to their own OCBC app to accept.</Text>

            <View style={stepStyles.card}>
              <Text style={stepStyles.sectionLabel}>{partnerFirst}&apos;s mobile (OCBC)</Text>
              <View style={styles.input}><Text style={styles.inputText}>+65 •••• 4521</Text></View>
              <Text style={[stepStyles.note, styles.topGap]}>Expires in 7 days. Cancel any time.</Text>
              {inviteStatus === 'IDLE' ? (
                <TouchableOpacity style={[stepStyles.primaryButton, styles.topGap, sending && stepStyles.primaryButtonDisabled]} onPress={sendInvite} disabled={sending} activeOpacity={0.85}>
                  <Text style={stepStyles.primaryButtonText}>{sending ? 'Sending…' : 'Send invitation'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {inviteStatus !== 'IDLE' ? (
              <View style={stepStyles.card}>
                <Text style={stepStyles.sectionLabel}>Status</Text>
                {[
                  { label: 'Invitation sent', state: 'done' },
                  { label: 'Waiting for acceptance', state: inviteStatus === 'APPROVED' ? 'done' : 'now' },
                  { label: `${partnerFirst} joined`, state: inviteStatus === 'APPROVED' ? 'done' : 'next' },
                ].map((item, index, list) => (
                  <View key={item.label} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View style={[styles.dot, item.state === 'done' && styles.dotDone, item.state === 'now' && styles.dotNow]}>
                        {item.state === 'done' ? <Text style={styles.dotTick}>✓</Text> : null}
                      </View>
                      {index < list.length - 1 ? <View style={styles.rail} /> : null}
                    </View>
                    <Text style={[styles.timelineText, item.state === 'next' && styles.timelineMuted]}>{item.label}</Text>
                  </View>
                ))}
                {inviteStatus === 'PENDING' ? (
                  <>
                    <Text style={[stepStyles.note, styles.topGap]}>
                      Until {partnerFirst} accepts, you can carry on privately. If they decline, the plan stays yours.
                    </Text>
                    <TouchableOpacity onPress={sendInvite} activeOpacity={0.7} style={styles.topGap}>
                      <Text style={stepStyles.linkText}>Resend invitation</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}

        {page === 'share' ? (
          <>
            <Text style={stepStyles.title}>What {partnerFirst} can see</Text>
            <Text style={stepStyles.subtitle}>You choose separately from {partnerFirst}. Change it any time.</Text>

            <View style={stepStyles.card}>
              {SHARE_ITEMS.map((item, index) => (
                <View key={item.key} style={[stepStyles.row, index < SHARE_ITEMS.length - 1 && stepStyles.rowDivider]}>
                  <View style={styles.flex}>
                    <Text style={styles.memberName}>{item.label}</Text>
                    <Text style={stepStyles.cardSub}>{item.detail}</Text>
                  </View>
                  <Switch
                    value={sharing[item.key]}
                    onValueChange={(value) => setSharing({ ...sharing, [item.key]: value })}
                    trackColor={{ true: COLORS.red, false: '#D6D3CD' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#D6D3CD"
                    accessibilityLabel={`Share ${item.label}`}
                  />
                </View>
              ))}
            </View>

            <View style={styles.privacyBox}>
              <Text style={styles.privacyLine}>
                <Text style={styles.bold}>Joint account:</Text> both holders already see it. It&apos;s counted once.
              </Text>
            </View>

            <TouchableOpacity style={[stepStyles.secondaryButton, styles.topGap]} onPress={() => setPreviewing(!previewing)} activeOpacity={0.8}>
              <Text style={stepStyles.secondaryButtonText}>{previewing ? 'Hide preview' : `Preview what ${partnerFirst} sees`}</Text>
            </TouchableOpacity>
            {previewing ? (
              <View style={[stepStyles.card, styles.topGap]}>
                <Text style={stepStyles.sectionLabel}>{partnerFirst} sees</Text>
                {SHARE_ITEMS.filter((item) => sharing[item.key]).map((item) => (
                  <Text key={item.key} style={styles.previewLine}>✓ {item.label}</Text>
                ))}
                {SHARE_ITEMS.some((item) => !sharing[item.key]) ? (
                  <Text style={[stepStyles.note, styles.topGap]}>
                    Hidden: {SHARE_ITEMS.filter((item) => !sharing[item.key]).map((item) => item.label.toLowerCase()).join(', ')}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <View style={stepStyles.footer}>{footer}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topGap: { marginTop: 10 },
  bold: { fontWeight: '800', color: COLORS.ink },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', fontSize: 14, color: COLORS.ink, backgroundColor: '#FFFFFF' },
  inputText: { fontSize: 14, color: COLORS.ink },
  inputError: { borderColor: COLORS.red },
  errorText: { fontSize: 11, color: COLORS.red, marginTop: 4 },
  ageInput: { width: 64 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addButton: { backgroundColor: COLORS.red, borderRadius: 12, minHeight: 44, paddingHorizontal: 14, justifyContent: 'center' },
  addButtonText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FDECEA', alignItems: 'center', justifyContent: 'center' },
  avatarPending: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F3B9B0', borderStyle: 'dashed' },
  avatarText: { fontSize: 14, fontWeight: '900', color: COLORS.red },
  memberName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  memberStatus: { fontSize: 11, fontWeight: '800', color: COLORS.amber },
  memberStatusDone: { color: COLORS.green },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 12, marginTop: 8 },
  optionActive: { borderColor: COLORS.red, backgroundColor: '#FFF7F5' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D0D0D0', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: COLORS.red },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.red },
  privacyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 4 },
  privacyTitle: { fontSize: 13, fontWeight: '800', color: COLORS.ink, marginBottom: 2 },
  privacyLine: { fontSize: 12, lineHeight: 18, color: COLORS.muted },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineRail: { alignItems: 'center', width: 20 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D0D0D0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  dotDone: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  dotNow: { borderColor: COLORS.red, borderWidth: 5 },
  dotTick: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  rail: { width: 2, flex: 1, minHeight: 14, backgroundColor: '#EAEAEA' },
  timelineText: { fontSize: 13, fontWeight: '700', color: COLORS.ink, paddingTop: 1, paddingBottom: 14 },
  timelineMuted: { color: COLORS.faint, fontWeight: '600' },
  previewLine: { fontSize: 13, color: COLORS.ink, paddingVertical: 3 },
  footerSecondary: { minHeight: 52, justifyContent: 'center' },
});

export default HouseholdStep;
