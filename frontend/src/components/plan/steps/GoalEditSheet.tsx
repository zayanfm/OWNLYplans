import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, TextInput, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import type { EducationPath, GoalCategory, GoalInput } from '../../../services/api';
import { COLORS, money, monthLabel, stepStyles } from '../stepStyles';
import { Stepper } from '../Stepper';

const PATHS: Array<{ id: EducationPath; label: string; years: number; annualCost: number; startAge: number }> = [
  { id: 'UNIVERSITY', label: 'University', years: 4, annualCost: 11000, startAge: 19 },
  { id: 'POLYTECHNIC', label: 'Polytechnic', years: 3, annualCost: 3100, startAge: 17 },
  { id: 'UNDECIDED', label: 'Not decided', years: 0, annualCost: 0, startAge: 0 },
];

const CATEGORIES: Array<{ id: GoalCategory; label: string; hint: string }> = [
  { id: 'HOUSING', label: 'Housing', hint: 'e.g. BTO downpayment, renovation. Housing support such as the Climate Friendly Households Programme shows with this goal.' },
  { id: 'EDUCATION', label: 'Education', hint: 'e.g. enrichment classes, a course for yourself.' },
  { id: 'FAMILY', label: 'Family', hint: 'e.g. wedding, a new baby, caring for parents.' },
  { id: 'OTHER', label: 'Other', hint: 'e.g. a car or a family holiday.' },
];

const shiftMonth = (isoMonth: string, delta: number) => {
  const [year, month] = isoMonth.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const nextYearMonth = () => shiftMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, 12);
const toNumber = (text: string) => Number(text.replace(/[^0-9.]/g, ''));

export type GoalSheetResult = { key: string; input?: GoalInput; removed?: boolean; offline?: boolean };

/**
 * Lets the family confirm, change or switch off one goal at a time. Every pre-filled value is a
 * suggestion with its source shown; nothing is planned until the family confirms it here.
 */
export const GoalEditSheet: React.FC<{
  visible: boolean;
  goal: GoalInput | null;
  onClose: () => void;
  onSaved: (result: GoalSheetResult) => void;
}> = ({ visible, goal, onClose, onSaved }) => {
  const creating = !goal;
  const [draft, setDraft] = useState<Partial<GoalInput>>({});
  const [amountText, setAmountText] = useState<string>('');
  const [costText, setCostText] = useState<string>('');
  const [savedText, setSavedText] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const initial: Partial<GoalInput> = goal
      ? { ...goal }
      : { type: 'CUSTOM', name: '', category: 'HOUSING', amount: 10000, saved: 0, dueDate: nextYearMonth() };
    setDraft(initial);
    setAmountText(String(initial.amount ?? ''));
    setSavedText(String(initial.saved ?? 0));
    setCostText(String(initial.annualCost ?? ''));
    setError(null);
  }, [visible, goal]);

  const type = goal?.type || 'CUSTOM';
  const partnerOwned = goal?.owner === 'partner';
  const ownerFirst = String(goal?.adultName || '').split(' ')[0] || 'Your partner';
  const update = (patch: Partial<GoalInput>) => setDraft({ ...draft, ...patch });

  const payload = (): Partial<GoalInput> => {
    if (type === 'EMERGENCY') return { months: draft.months, withinMonths: draft.withinMonths, enabled: true };
    if (type === 'EDUCATION') {
      return draft.path === 'UNDECIDED'
        ? { path: 'UNDECIDED', enabled: true }
        : { path: draft.path, startYear: draft.startYear, years: draft.years, annualCost: toNumber(costText), enabled: true };
    }
    if (type === 'RETIREMENT') return { retireAge: draft.retireAge, amount: toNumber(amountText), enabled: true };
    return { name: draft.name, category: draft.category, amount: toNumber(amountText), saved: toNumber(savedText), dueDate: draft.dueDate, enabled: true };
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (creating) {
        const body = payload();
        const result = await api.addGoal({ name: String(body.name || ''), category: body.category || 'OTHER', amount: Number(body.amount), saved: Number(body.saved || 0), dueDate: String(body.dueDate) });
        onSaved({ key: result.goal.key, input: result.goal });
      } else {
        const result = await api.updateGoal(goal.key, payload());
        onSaved({ key: goal.key, input: result.goal });
      }
    } catch (err: any) {
      if (err?.status) {
        setError(err.message);
      } else {
        // Offline: keep the decision for this session.
        onSaved({ key: goal?.key || `custom_local_${Date.now()}`, input: { ...(goal as GoalInput), ...payload(), confirmed: true, status: 'CONFIRMED' } as GoalInput, offline: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const switchOff = async () => {
    if (!goal) return;
    setSaving(true);
    try {
      await api.removeGoal(goal.key);
    } catch {
      // Offline: switch it off for this session.
    } finally {
      setSaving(false);
    }
    onSaved({ key: goal.key, removed: goal.type === 'CUSTOM', input: goal.type === 'CUSTOM' ? undefined : { ...goal, enabled: false, status: 'OFF' } });
  };

  const selectPath = (id: EducationPath) => {
    const path = PATHS.find((item) => item.id === id)!;
    const birthYear = (goal?.suggested?.startYear || new Date().getFullYear() + 19) - 19;
    update({ path: id, years: path.years, startYear: id === 'UNDECIDED' ? draft.startYear : birthYear + path.startAge });
    setCostText(String(path.annualCost));
  };

  const title = creating ? 'Add a goal'
    : type === 'EMERGENCY' ? 'Emergency buffer'
      : type === 'EDUCATION' ? `${String(goal?.childName || '').split(' ')[0]}'s education`
        : type === 'RETIREMENT' ? `${ownerFirst}'s retirement` : goal?.name || 'Our goal';
  const categoryHint = CATEGORIES.find((item) => item.id === draft.category)?.hint;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={stepStyles.title}>{title}</Text>
            <Text style={styles.source}>{creating ? 'Pick a category, then tell us the amount and when you need it.' : goal?.source}</Text>

            {partnerOwned ? (
              <View style={stepStyles.card}>
                <Text style={stepStyles.cardTitle}>Only {ownerFirst} can set this goal</Text>
                <Text style={[stepStyles.note, styles.gap]}>
                  {goal?.status === 'AWAITING_PARTNER'
                    ? `It is confirmed by ${ownerFirst} in their own OCBC app once they accept the invite.`
                    : `${ownerFirst} confirmed retiring at ${goal?.retireAge} with ${money(goal?.amount)} on top of CPF LIFE.`}
                </Text>
              </View>
            ) : null}

            {!partnerOwned && type === 'EMERGENCY' ? (
              <>
                <Stepper label="Months of essentials" value={draft.months || 6} step={1} min={3} max={12}
                  display={`${draft.months || 6} months`} onChange={(months) => update({ months })} />
                <Stepper label="Build it within" value={draft.withinMonths || 18} step={3} min={6} max={36}
                  display={`${draft.withinMonths || 18} months`} onChange={(withinMonths) => update({ withinMonths })} />
              </>
            ) : null}

            {!partnerOwned && type === 'CUSTOM' ? (
              <>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.segment}>
                  {CATEGORIES.map((item) => (
                    <TouchableOpacity key={item.id} style={[styles.segmentItem, draft.category === item.id && styles.segmentActive]} onPress={() => update({ category: item.id })}>
                      <Text style={[styles.segmentText, draft.category === item.id && styles.segmentTextActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {categoryHint ? <Text style={[stepStyles.note, styles.hint]}>{categoryHint}</Text> : null}
                <TextInput style={styles.input} placeholder="Goal name, e.g. BTO downpayment" value={draft.name || ''} onChangeText={(name) => update({ name })} />
                <Text style={styles.fieldLabel}>Amount needed (S$)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={amountText} onChangeText={setAmountText} />
                <Text style={styles.fieldLabel}>Already set aside (S$)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={savedText} onChangeText={setSavedText} />
                {/* The stepper reports a ±1 change; the month itself is kept in the draft. */}
                <Stepper label="Needed by" value={0} step={1} min={-600} max={600}
                  display={monthLabel(draft.dueDate)} onChange={(delta) => update({ dueDate: shiftMonth(String(draft.dueDate), delta) })} />
                <Text style={stepStyles.note}>You&apos;ll put all your goals in order of priority together when you build the plan.</Text>
              </>
            ) : null}

            {!partnerOwned && type === 'EDUCATION' ? (
              <>
                <View style={styles.segment}>
                  {PATHS.map((path) => (
                    <TouchableOpacity key={path.id} style={[styles.segmentItem, draft.path === path.id && styles.segmentActive]} onPress={() => selectPath(path.id)}>
                      <Text style={[styles.segmentText, draft.path === path.id && styles.segmentTextActive]}>{path.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {draft.path !== 'UNDECIDED' ? (
                  <>
                    <Stepper label="Starts in" value={draft.startYear || 0} step={1} min={new Date().getFullYear() + 1} max={(draft.startYear || 0) + 10}
                      display={String(draft.startYear)} onChange={(startYear) => update({ startYear })} />
                    <Stepper label="Years of study" value={draft.years || 1} step={1} min={1} max={6}
                      display={`${draft.years} years`} onChange={(years) => update({ years })} />
                    <Text style={styles.fieldLabel}>Cost per year in today&apos;s dollars (S$)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={costText} onChangeText={setCostText} />
                    <Text style={stepStyles.note}>Planned total: {money(toNumber(costText) * (draft.years || 0))}</Text>
                  </>
                ) : (
                  <Text style={stepStyles.note}>No amount is planned until you choose a path. You can come back to this any time.</Text>
                )}
              </>
            ) : null}

            {!partnerOwned && type === 'RETIREMENT' ? (
              <>
                <Stepper label="Retire at" value={draft.retireAge || 65} step={1} min={55} max={70}
                  display={`age ${draft.retireAge || 65}`} onChange={(retireAge) => update({ retireAge })} />
                <Text style={styles.fieldLabel}>Savings wanted on top of CPF LIFE (S$)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={amountText} onChangeText={setAmountText} />
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {!partnerOwned ? (
              <TouchableOpacity style={[stepStyles.primaryButton, styles.gap, saving && stepStyles.primaryButtonDisabled]} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={stepStyles.primaryButtonText}>{creating ? 'Add goal' : goal?.status === 'OFF' ? 'Switch back on' : 'Confirm'}</Text>}
              </TouchableOpacity>
            ) : null}
            {!creating && !partnerOwned && goal?.status !== 'OFF' ? (
              <TouchableOpacity style={[stepStyles.secondaryButton, styles.gap]} onPress={switchOff} disabled={saving}>
                <Text style={stepStyles.secondaryButtonText}>{goal?.type === 'CUSTOM' ? 'Delete this goal' : 'Not planning for this'}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text style={stepStyles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.page, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '88%' },
  source: { fontSize: 12, lineHeight: 17, color: '#1F5FA8', backgroundColor: '#F2F7FD', borderRadius: 10, padding: 10, marginBottom: 12 },
  gap: { marginTop: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.muted, marginBottom: 4 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.ink, marginBottom: 8 },
  segment: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 3, marginBottom: 8 },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: COLORS.red },
  segmentText: { fontSize: 12, fontWeight: '800', color: COLORS.muted },
  segmentTextActive: { color: '#FFFFFF' },
  error: { fontSize: 12, fontWeight: '700', color: COLORS.red, marginTop: 6 },
  cancel: { alignItems: 'center', paddingVertical: 12 },
  hint: { marginBottom: 8 },
});

export default GoalEditSheet;
