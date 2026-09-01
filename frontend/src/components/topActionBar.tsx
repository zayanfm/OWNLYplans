import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { COPY } from '../constants/mockData';

interface TopActionBarProps {
  onScan: () => void;
  onLogout?: () => void;
}

export const TopActionBar: React.FC<TopActionBarProps> = ({ onScan, onLogout }) => {
  return (
    <View style={styles.container}>
      {/* Scan Button */}
      <TouchableOpacity style={styles.iconButton} onPress={onScan} activeOpacity={0.7}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
          <Rect x="7" y="7" width="4" height="4" rx="0.5" fill="#1A1A1A" />
          <Rect x="13" y="7" width="4" height="4" rx="0.5" fill="#1A1A1A" />
          <Rect x="7" y="13" width="4" height="4" rx="0.5" fill="#1A1A1A" />
          <Rect x="13" y="13" width="2" height="2" fill="#1A1A1A" />
          <Rect x="16" y="15" width="2" height="2" fill="#1A1A1A" />
        </Svg>
      </TouchableOpacity>

      <View style={styles.rightActions}>
        {/* Notification Bell */}
        <TouchableOpacity style={styles.relativeButton} activeOpacity={0.7}>
          <Svg width={22} height={24} viewBox="0 0 22 24" fill="none">
            <Path d="M11 1a7 7 0 00-7 7v4l-2 2v1h18v-1l-2-2V8a7 7 0 00-7-7z" stroke="#1A1A1A" strokeWidth={1.8} />
            <Path d="M8.5 20a2.5 2.5 0 005 0" stroke="#1A1A1A" strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <View style={styles.badgeDot} />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity onPress={onLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>{COPY.logout}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  relativeButton: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D81E05',
  },
  logoutText: {
    color: '#D81E05',
    fontSize: 14,
    fontWeight: '600',
  },
});