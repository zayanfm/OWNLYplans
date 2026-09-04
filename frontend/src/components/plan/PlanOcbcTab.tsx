import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { MOCK_OCBC_POSITION } from '../../constants/mockData';

const PLAN_TILES = [
  { id: 'goals', label: 'Savings Goals', detail: '3 household goals tracked' },
  { id: 'insights', label: 'Money Insights', detail: 'S$54/month flagged for review' },
  { id: 'wealth', label: 'Wealth Dashboard', detail: `S$${MOCK_OCBC_POSITION.investments.toLocaleString()} invested` },
  { id: 'life', label: 'Life Goals', detail: 'Retirement · Education' },
];

const NET_POSITION = [
  { label: 'Deposits', value: `S$${MOCK_OCBC_POSITION.deposits.toLocaleString()}.00` },
  { label: 'Investments', value: `S$${MOCK_OCBC_POSITION.investments.toLocaleString()}.00` },
  { label: 'Card balances', value: 'S$0.00' },
];

const ChevronRightIcon = () => (
  <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
    <Path d="M1 1l6 6-6 6" stroke="#666666" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TileIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#D81E05" strokeWidth={1.8} />
    <Path d="M12 8v4l3 2" stroke="#D81E05" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const PlanOcbcTab: React.FC = () => (
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>Total net position</Text>
      <Text style={styles.summaryValue}>S${MOCK_OCBC_POSITION.total.toLocaleString()}.00</Text>
      {NET_POSITION.map((row, index) => (
        <View key={row.label} style={[styles.summaryRow, index > 0 && styles.summaryRowBorder]}>
          <Text style={styles.summaryRowLabel}>{row.label}</Text>
          <Text style={styles.summaryRowValue}>{row.value}</Text>
        </View>
      ))}
    </View>

    <Text style={styles.sectionTitle}>Plan with OCBC</Text>
    <View style={styles.tileStack}>
      {PLAN_TILES.map((tile) => (
        <TouchableOpacity key={tile.id} style={styles.tile} activeOpacity={0.7}>
          <View style={styles.tileIconWrap}>
            <TileIcon />
          </View>
          <View style={styles.tileTextWrap}>
            <Text style={styles.tileLabel}>{tile.label}</Text>
            <Text style={styles.tileDetail}>{tile.detail}</Text>
          </View>
          <ChevronRightIcon />
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 18,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A1A1A',
    marginTop: 2,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  summaryRowLabel: {
    fontSize: 13,
    color: '#888888',
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 12,
  },
  tileStack: {
    gap: 12,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    gap: 14,
  },
  tileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTextWrap: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tileDetail: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
});

export default PlanOcbcTab;
