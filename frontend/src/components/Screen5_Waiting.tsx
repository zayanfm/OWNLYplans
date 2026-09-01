import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export interface Screen5Props {
  partnerAccount: string;
  onComplete: () => void;
}

export const Screen5_Waiting: React.FC<Screen5Props> = ({
  partnerAccount,
  onComplete,
}) => {
  const pulseAnim = useRef<Animated.Value>(new Animated.Value(0)).current;

  useEffect(() => {
    // 5-second auto-forward countdown timer
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    // Continuous pulse animation loop
    const animation = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    
    animation.start();

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [onComplete, pulseAnim]);

  const scalePill = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.45],
  });

  const opacityPill = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.6, 0.2, 0],
  });

  return (
    <View style={styles.container}>
      {/* Top Header Label */}
      <View style={styles.header}>
        <Text style={styles.title}>Invitation Sent</Text>
        <Text style={styles.subtitle}>Account {partnerAccount}</Text>
      </View>

      {/* Main Center Content */}
      <View style={styles.centerContainer}>
        <View style={styles.avatarWrapper}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: scalePill }],
                opacity: opacityPill,
              },
            ]}
          />
          <View style={styles.iconCircle}>
            <Text style={styles.emojiIcon}>👫</Text>
          </View>
        </View>

        <Text style={styles.headline}>Waiting for partner</Text>
        <Text style={styles.bodyText}>
          Waiting for partner to accept invitation...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 16,
  },
  subtitle: {
    color: '#767676',
    fontSize: 10,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D81E05',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D81E05',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  emojiIcon: {
    fontSize: 28,
  },
  headline: {
    color: '#1A1A1A',
    fontWeight: '900',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  bodyText: {
    color: '#767676',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
});