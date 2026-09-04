import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const HERO_CONTENT = {
  title: 'OWNLYplans',
  subtitle: 'Personalised goal tracking & automated wealth management',
  badge: 'NEW FEATURE',
};

interface HeroBannerProps {
  onOwnly: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onOwnly }) => {
  return (
    <View style={styles.container}>
      {/* Background Graphic Box */}
      <View style={styles.backgroundGraphic} />

      {/* Content Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.titleText}>{HERO_CONTENT.title}</Text>
        <Text style={styles.subtitleText}>
          {HERO_CONTENT.subtitle} <Text style={styles.arrowText}>›</Text>
        </Text>
      </View>

      {/* Interactive Badge Button */}
      <TouchableOpacity style={styles.badgeButton} onPress={onOwnly} activeOpacity={0.8}>
        <View style={styles.pulseDot} />
        <Text style={styles.badgeText}>{HERO_CONTENT.badge}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 170,
    marginHorizontal: 0,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  backgroundGraphic: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#991B1B',
    opacity: 0.85,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  titleText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 24,
    lineHeight: 28,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    maxWidth: 200,
  },
  arrowText: {
    fontWeight: '700',
  },
  badgeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    backgroundColor: '#D81E05',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});