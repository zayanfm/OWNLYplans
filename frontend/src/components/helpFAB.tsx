import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HelpFABProps {
  onPress?: () => void;
  onClick?: () => void;
}

export const HelpFAB: React.FC<HelpFABProps> = ({ onPress, onClick }) => {
  const insets = useSafeAreaInsets();
  const handlePress = onPress || onClick || (() => {});

  // 64px (BottomNav base height) + inset + 16px offset gap
  const bottomPosition = 64 + Math.max(insets.bottom, 8) + 16;

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: bottomPosition }]}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityLabel="Help and transparency"
    >
      <Text style={styles.questionMark}>?</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 99,
  },
  questionMark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
});