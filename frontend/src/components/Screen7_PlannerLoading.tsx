import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export interface Screen7Props {
  onComplete: () => void;
}

const ITEMS = [
  'Analysing 6 months of transactions',
  'Mapping goal milestones & timelines',
  'Optimising your surplus allocation',
  'Generating personalised roadmap',
];

export const Screen7_PlannerLoading: React.FC<Screen7Props> = ({ onComplete }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 2.8s total completion timer
    const timer = setTimeout(() => {
      onComplete();
    }, 2800);

    // Continuous 360-degree orbit rotation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulse animation for background rings
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      clearTimeout(timer);
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [onComplete, spinValue, pulseValue]);

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseScaleOuter = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const pulseScaleInner = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.05],
  });

  return (
    <View style={styles.container}>
      {/* Central Pulsing & Orbiting Animation */}
      <View style={styles.animationWrapper}>
        <Animated.View
          style={[
            styles.pulseOuter,
            { transform: [{ scale: pulseScaleOuter }] },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseInner,
            { transform: [{ scale: pulseScaleInner }] },
          ]}
        />

        {/* Center Icon Badge */}
        <View style={styles.centerBadge}>
          <View style={styles.robotHead}>
            <View style={styles.eyeRow}>
              <View style={styles.eye} />
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <View style={styles.antennaStem} />
            <View style={styles.antennaCap} />
          </View>
        </View>

        {/* Orbiting Dot Container */}
        <Animated.View
          style={[
            styles.orbitContainer,
            { transform: [{ rotate: spinInterpolate }] },
          ]}
        >
          <View style={styles.orbitDot} />
        </Animated.View>
      </View>

      <Text style={styles.headline}>AI is cooking</Text>
      <Text style={styles.subtext}>Generating your personalised roadmap…</Text>

      {/* Progress Items */}
      <View style={styles.itemsContainer}>
        {ITEMS.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <View style={styles.statusDot} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  animationWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  pulseOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(216, 30, 5, 0.12)',
  },
  pulseInner: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(216, 30, 5, 0.22)',
  },
  centerBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#D81E05',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  robotHead: {
    width: 28,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 3,
  },
  eye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D81E05',
  },
  antennaStem: {
    position: 'absolute',
    top: -5,
    width: 2,
    height: 5,
    backgroundColor: '#FFFFFF',
  },
  antennaCap: {
    position: 'absolute',
    top: -7,
    width: 6,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  orbitContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
  },
  orbitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D81E05',
    position: 'absolute',
    top: 0,
  },
  headline: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 24,
    marginBottom: 8,
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    marginBottom: 32,
  },
  itemsContainer: {
    width: 260,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D81E05',
  },
  itemText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
  },
});