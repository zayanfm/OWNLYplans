import { StyleSheet } from 'react-native';

export const money = (value?: number | null) =>
  `${(value || 0) < 0 ? '-' : ''}S$${Math.abs(Math.round(value || 0)).toLocaleString()}`;

// "2028-09" -> "Sep 2028"
export const monthLabel = (isoMonth?: string | null) => {
  if (!isoMonth) return '—';
  const [year, month] = isoMonth.split('-').map(Number);
  return new Date(year, (month || 1) - 1, 1).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
};

export const COLORS = {
  red: '#D81E05',
  ink: '#1A1A1A',
  muted: '#666666',
  faint: '#888888',
  border: '#EAEAEA',
  green: '#2E7D32',
  greenBg: '#EAF6EC',
  amber: '#B45309',
  amberBg: '#FFF4E5',
  page: '#F5F4F0',
};

// Shared layout for the OWNLYplan step screens.
export const stepStyles = StyleSheet.create({
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
  backButtonText: { fontSize: 18, color: COLORS.red, fontWeight: '700' },
  eyebrow: { fontSize: 11, fontWeight: '800', color: COLORS.red, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '900', color: COLORS.ink, marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 19, color: COLORS.muted, marginBottom: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: COLORS.ink },
  cardSub: { fontSize: 11, color: COLORS.faint, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#767676', textTransform: 'uppercase', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, gap: 10 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  rowLabel: { fontSize: 12, color: COLORS.muted, flex: 1 },
  rowValue: { fontSize: 12, fontWeight: '800', color: COLORS.ink },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  pillText: { fontSize: 10, fontWeight: '800' },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#E9E5DE' },
  primaryButton: { backgroundColor: COLORS.red, borderRadius: 14, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  secondaryButton: { borderRadius: 12, borderWidth: 1, borderColor: COLORS.red, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { fontSize: 13, fontWeight: '800', color: COLORS.red },
  linkText: { fontSize: 13, fontWeight: '800', color: COLORS.red },
  note: { fontSize: 11, lineHeight: 16, color: COLORS.faint },
});

export const statusPill = (status: string) => {
  if (status === 'ON_TRACK' || status === 'REACHED' || status === 'AGREED') {
    return { bg: COLORS.greenBg, fg: COLORS.green, label: status === 'REACHED' ? 'Reached' : status === 'AGREED' ? 'Agreed' : 'On track' };
  }
  return { bg: COLORS.amberBg, fg: COLORS.amber, label: status === 'AT_RISK' ? 'At risk' : status.replace(/_/g, ' ').toLowerCase() };
};
