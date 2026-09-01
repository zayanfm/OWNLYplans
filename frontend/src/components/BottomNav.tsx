import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface NavItem {
  id: string;
  label: string;
  big?: boolean;
  renderIcon: (active: boolean) => React.ReactNode;
}

export const NAV: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    renderIcon: (active) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z"
          fill={active ? '#D81E05' : 'none'}
          stroke={active ? '#D81E05' : '#8A8A8A'}
          strokeWidth={1.8}
        />
        <Path d="M9 22V12h6v10" stroke={active ? '#D81E05' : '#8A8A8A'} strokeWidth={1.8} />
      </Svg>
    ),
  },
  {
    id: 'plan',
    label: 'Plan',
    renderIcon: (active) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2v8l4 4" stroke={active ? '#D81E05' : '#8A8A8A'} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx="12" cy="14" r="8" stroke={active ? '#D81E05' : '#8A8A8A'} strokeWidth={1.8} />
        <Path
          d="M8.5 19.5C9.5 17 11 15.5 12 14c1 1.5 2.5 3 3.5 5.5"
          stroke={active ? '#D81E05' : '#8A8A8A'}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    ),
  },
  {
    id: 'pay',
    label: 'Pay & Transfer',
    big: true,
    renderIcon: () => (
      <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
        <Circle cx="13" cy="13" r="10" stroke="#FFFFFF" strokeWidth={1.8} />
        <Path d="M9 13h8M14 10l3 3-3 3" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
  },
  {
    id: 'rewards',
    label: 'Rewards',
    renderIcon: (active) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="10" width="18" height="12" rx="2" stroke={active ? '#D81E05' : '#8A8A8A'} strokeWidth={1.8} />
        <Path d="M12 10V22M3 14h18" stroke={active ? '#D81E05' : '#8A8A8A'} strokeWidth={1.5} />
        <Path d="M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke={active ? '#D81E05' : '#8A8A8A'} strokeWidth={1.8} />
        <Path d="M12 6C11 4 8 2 7 4s2 4 5 6" stroke={active ? '#D81E05' : '#8A8A8A'} strokeWidth={1.3} strokeLinecap="round" />
        <Path d="M12 6c1-2 4-4 5-2s-2 4-5 6" stroke={active ? '#D81E05' : '#8A8A8A'} strokeWidth={1.3} strokeLinecap="round" />
      </Svg>
    ),
  },
  {
    id: 'more',
    label: 'More',
    renderIcon: (active) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle cx="7" cy="7" r="2.5" fill={active ? '#D81E05' : '#8A8A8A'} />
        <Circle cx="17" cy="7" r="2.5" fill={active ? '#D81E05' : '#8A8A8A'} />
        <Circle cx="7" cy="17" r="2.5" fill={active ? '#D81E05' : '#8A8A8A'} />
        <Circle cx="17" cy="17" r="2.5" fill={active ? '#D81E05' : '#8A8A8A'} />
      </Svg>
    ),
  },
];

interface BottomNavProps {
  active?: string;
  activeScreen?: string;
  onNavigate?: (routeId: string) => void;
  onNav?: (routeId: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  active,
  activeScreen,
  onNavigate,
  onNav,
}) => {
  const insets = useSafeAreaInsets();
  const currentTab = active || activeScreen || 'home';
  const handlePress = onNavigate || onNav || (() => {});

  return (
    <View style={[styles.navContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {NAV.map((item) => {
        const isActive = currentTab === item.id || (currentTab === 'ownly' && item.id === 'plan');
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => handlePress(item.id)}
            activeOpacity={0.7}
          >
            {item.big ? (
              <View style={styles.bigButtonWrapper}>
                {item.renderIcon(true)}
              </View>
            ) : (
              item.renderIcon(isActive)
            )}
            <Text style={[styles.navLabel, isActive ? styles.labelActive : styles.labelInactive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigButtonWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D81E05',
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  navLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  labelActive: {
    color: '#D81E05',
  },
  labelInactive: {
    color: '#8A8A8A',
  },
});