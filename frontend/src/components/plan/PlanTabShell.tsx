import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlanOcbcTab } from './PlanOcbcTab';
import { OwnlyPlanFlow } from './OwnlyPlanFlow';

type PlanPill = 'OCBC' | 'OWNLYplan';

const PILLS: PlanPill[] = ['OCBC', 'OWNLYplan'];

export interface PlanTabShellProps {
  onHelp?: () => void;
  onNav?: (screenKey: string) => void;
}

export const PlanTabShell: React.FC<PlanTabShellProps> = ({ onHelp, onNav }) => {
  const insets = useSafeAreaInsets();
  // OCBC stays the default pill so the Plan tab opens exactly as it does today.
  const [activePill, setActivePill] = useState<PlanPill>('OCBC');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan</Text>
        <Text style={styles.headerSubtitle}>Build wealth around the life you want.</Text>
      </View>

      <View style={styles.tabsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {PILLS.map((pill) => (
            <TouchableOpacity
              key={pill}
              style={[styles.tabPill, activePill === pill && styles.tabPillActive]}
              onPress={() => setActivePill(pill)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabPillText, activePill === pill && styles.tabPillTextActive]}>
                {pill}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Both pills stay mounted so switching never resets the OWNLYplan journey. */}
      <View style={[styles.pillBody, { paddingBottom: 82 + insets.bottom }, activePill !== 'OCBC' && styles.pillBodyHidden]}>
        <PlanOcbcTab />
      </View>
      <View style={[styles.pillBody, { paddingBottom: 82 + insets.bottom }, activePill !== 'OWNLYplan' && styles.pillBodyHidden]}>
        <OwnlyPlanFlow onHelp={onHelp} onNav={onNav} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F3',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  headerSubtitle: { color: '#7A756E', fontSize: 12, marginTop: 2 },
  tabsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  tabsScroll: {
    paddingRight: 16,
    gap: 6,
    backgroundColor: '#ECE9E4',
    borderRadius: 18,
    padding: 4,
  },
  tabPill: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginRight: 2,
  },
  tabPillActive: {
    backgroundColor: '#D81E05',
    borderColor: '#D81E05',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  pillBody: {
    flex: 1,
  },
  pillBodyHidden: {
    display: 'none',
  },
});

export default PlanTabShell;
