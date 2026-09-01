import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

export const ACCOUNT_TABS = ['Accounts', 'Cards', 'Investments'];

interface FilterTabsProps {
  tab: string;
  onTab: (selectedTab: string) => void;
  tabs?: string[];
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  tab,
  onTab,
  tabs = ACCOUNT_TABS,
}) => {
  return (
    <View style={styles.container}>
      {/* Eye Visibility Toggle Button */}
      <TouchableOpacity style={styles.eyeButton} activeOpacity={0.7}>
        <Svg width={18} height={12} viewBox="0 0 18 12" fill="none">
          <Path
            d="M9 1C5 1 1.7 3.6 1 6c.7 2.4 4 5 8 5s7.3-2.6 8-5c-.7-2.4-4-5-8-5z"
            stroke="#767676"
            strokeWidth={1.5}
          />
          <Circle cx="9" cy="6" r="2.5" stroke="#767676" strokeWidth={1.5} />
        </Svg>
      </TouchableOpacity>

      <View style={styles.verticalSeparator} />

      {/* Horizontal Scrollable Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tabs.map((t) => {
          const isActive = tab === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => onTab(t)}
              activeOpacity={0.7}
              style={[styles.tabChip, isActive ? styles.tabActive : styles.tabInactive]}
            >
              <Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]}>
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  eyeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  scrollContent: {
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#1A1A1A',
  },
  tabInactive: {
    backgroundColor: '#EAEAEA',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextInactive: {
    color: '#767676',
  },
});