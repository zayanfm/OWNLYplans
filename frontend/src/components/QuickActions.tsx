import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

export interface QuickActionItem {
  label: string;
  svg: React.ReactNode;
  divider?: boolean;
}

export const QUICK_ACTIONS: QuickActionItem[] = [
  {
    label: 'PayNow',
    svg: (
      <Svg width={28} height={18} viewBox="0 0 28 18" fill="none">
        <Rect x="0" y="0" width="12" height="8" rx="1" fill="#D81E05" />
        <Rect x="14" y="0" width="14" height="4" rx="1" fill="#1A1A1A" />
        <Rect x="14" y="6" width="10" height="2" rx="1" fill="#1A1A1A" />
        <Rect x="14" y="10" width="14" height="4" rx="1" fill="#1A1A1A" />
        <Rect x="14" y="16" width="8" height="2" rx="1" fill="#1A1A1A" />
      </Svg>
    ),
  },
  {
    label: 'Scan & Pay',
    svg: (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#1A1A1A" strokeWidth="1.8" />
        <Rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#1A1A1A" strokeWidth="1.8" />
        <Rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#1A1A1A" strokeWidth="1.8" />
        <Rect x="5" y="5" width="4" height="4" rx="0.5" fill="#1A1A1A" />
        <Rect x="15" y="5" width="4" height="4" rx="0.5" fill="#1A1A1A" />
        <Rect x="5" y="15" width="4" height="4" rx="0.5" fill="#1A1A1A" />
        <Rect x="13" y="13" width="4" height="4" rx="0.5" fill="#1A1A1A" />
        <Rect x="19" y="19" width="2" height="2" rx="0.5" fill="#1A1A1A" />
      </Svg>
    ),
  },
  {
    label: 'Foreign\nExchange',
    svg: (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke="#1A1A1A" strokeWidth="1.8" />
        <Path d="M12 3c0 0-4 3-4 9s4 9 4 9M12 3c0 0 4 3 4 9s-4 9-4 9M3 12h18" stroke="#1A1A1A" strokeWidth="1.5" />
        <Path d="M8 7.5C9 6.5 10.4 6 12 6" stroke="#1A1A1A" strokeWidth="1.3" strokeLinecap="round" />
      </Svg>
    ),
  },
  {
    label: 'Customise',
    divider: true,
    svg: (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="3" stroke="#1A1A1A" strokeWidth="1.8" />
        <Path
          d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          stroke="#1A1A1A"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },
];

interface QuickActionsProps {
  actions?: QuickActionItem[];
  onSelectAction?: (label: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions = QUICK_ACTIONS,
  onSelectAction,
}) => {
  return (
    <View style={styles.container}>
      {actions.map((item, index) => (
        <React.Fragment key={item.label}>
          {item.divider && <View style={styles.divider} />}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSelectAction && onSelectAction(item.label)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>{item.svg}</View>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: -20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 12,
  },
  divider: {
    width: 1,
    backgroundColor: '#E8E8E8',
    alignSelf: 'stretch',
    marginHorizontal: 4,
  },
});