import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GoalGroup } from '../../services/api';

// One icon per goal category, used wherever a goal is listed.
export const GOAL_GROUPS: Record<GoalGroup, { emoji: string; bg: string; label: string }> = {
  EMERGENCY: { emoji: '🛡️', bg: '#EAF2FB', label: 'Emergency' },
  HOUSING: { emoji: '🏠', bg: '#FDECEA', label: 'Housing' },
  EDUCATION: { emoji: '🎓', bg: '#FFF4E5', label: 'Education' },
  RETIREMENT: { emoji: '📈', bg: '#EAF6EC', label: 'Retirement' },
  FAMILY: { emoji: '👨‍👩‍👧', bg: '#F3ECFB', label: 'Family' },
  OTHER: { emoji: '⭐', bg: '#F3F1EC', label: 'Other' },
};

export const GoalIcon = ({ group, size = 34 }: { group?: GoalGroup | null; size?: number }) => {
  const item = GOAL_GROUPS[group || 'OTHER'] || GOAL_GROUPS.OTHER;
  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: item.bg }]}
      accessibilityLabel={`${item.label} goal`}
    >
      <Text style={{ fontSize: size * 0.5 }}>{item.emoji}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});

export default GoalIcon;
