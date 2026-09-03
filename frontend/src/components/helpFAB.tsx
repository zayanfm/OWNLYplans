import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface HelpFABProps {
  onPress?: () => void;
  onClick?: () => void;
}

export const HelpFAB: React.FC<HelpFABProps> = ({ onPress, onClick }) => {
  const handlePress = onPress || onClick || (() => {});

  return (
    <TouchableOpacity
      style={styles.fab}
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
    bottom: 90,
    right: 16,
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
    zIndex: 999,
  },
  questionMark: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
});
