import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface StatusBarProps {
  dark?: boolean;
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export const StatusBar: React.FC<StatusBarProps> = ({ dark = false }) => {
  const [timeStr, setTimeStr] = useState<string>(getCurrentTime());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeStr(getCurrentTime());
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const textColor = dark ? '#FFFFFF' : '#1A1A1A';
  const iconColor = dark ? '#FFFFFF' : '#1A1A1A';

  return (
    <View style={[styles.statusBarContainer, dark ? styles.bgDark : styles.bgLight]}>
      {/* Simulated Dynamic Island Pill */}
      <View style={styles.dynamicIsland} />

      <View style={styles.contentRow}>
        <Text style={[styles.timeText, { color: textColor }]}>{timeStr}</Text>

        <View style={styles.iconsRow}>
          {/* WiFi SVG Icon */}
          <Svg width={16} height={12} viewBox="0 0 16 12" fill="none">
            <Path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill={iconColor} />
            <Path
              d="M8 6.5C9.7 6.5 11.2 7.2 12.3 8.3l1.4-1.4A8 8 0 008 4.5a8 8 0 00-5.7 2.4l1.4 1.4C4.8 7.2 6.3 6.5 8 6.5z"
              fill={iconColor}
            />
            <Path
              d="M8 3A10.9 10.9 0 0115.5 6l1.4-1.4A13 13 0 008 1 13 13 0 00.9 4.5L2.3 6A10.9 10.9 0 018 3z"
              fill={iconColor}
              opacity={0.5}
            />
          </Svg>

          {/* Battery SVG Icon */}
          <Svg width={26} height={13} viewBox="0 0 26 13" fill="none">
            <Rect
              x="0.5"
              y="0.5"
              width="22"
              height="12"
              rx="3.5"
              stroke={iconColor}
              strokeOpacity={0.7}
              strokeWidth={1}
            />
            <Rect x="2" y="2" width="17" height="9" rx="2" fill={iconColor} />
            <Path d="M23.5 4.5v4a2 2 0 000-4z" fill={iconColor} opacity={0.4} />
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBarContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bgDark: {
    backgroundColor: 'transparent',
  },
  bgLight: {
    backgroundColor: '#F5F4F0',
  },
  dynamicIsland: {
    width: 100,
    height: 24,
    backgroundColor: '#000000',
    borderRadius: 20,
    marginBottom: 4,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});