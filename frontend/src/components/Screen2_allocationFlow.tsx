import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  ALLOCATION_NOTICE,
  FINANCE,
  ALLOCATION_SOURCE,
  ALLOC_ROUTES,
} from '../constants/mockData';

export const Screen2_AllocationFlow: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Timing Conflict Alert */}
      <View style={styles.noticeBar}>
        <Text style={styles.noticeIcon}>{ALLOCATION_NOTICE.icon}</Text>
        <Text style={styles.noticeText}>{ALLOCATION_NOTICE.text}</Text>
        <Text style={styles.noticeBadge}>{ALLOCATION_NOTICE.badge}</Text>
      </View>

      {/* Routing Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Surplus Routing</Text>
          <View style={styles.yieldPill}>
            <Text style={styles.yieldText}>{FINANCE.yieldLift}</Text>
          </View>
        </View>

        {/* Source Account */}
        <View style={styles.sourceRow}>
          <View style={styles.sourceAvatar}>
            <Text style={styles.sourceAvatarText}>{ALLOCATION_SOURCE.avatar}</Text>
          </View>
          <View style={styles.sourceContent}>
            <Text style={styles.sourceLabel}>{ALLOCATION_SOURCE.label}</Text>
            <Text style={styles.sourceSub}>{ALLOCATION_SOURCE.sub}</Text>
          </View>
          <Text style={styles.sourceTag}>{ALLOCATION_SOURCE.tag}</Text>
        </View>

        {/* Destinations */}
        {ALLOC_ROUTES.map((route, index) => {
          const isLast = index === ALLOC_ROUTES.length - 1;

          return (
            <View key={index} style={[styles.routeRow, !isLast && styles.routeBorder]}>
              <Text style={styles.routeIcon}>{route.icon}</Text>
              <View style={styles.routeContent}>
                <Text style={styles.routeTo} numberOfLines={1}>
                  {route.to}
                </Text>
                <Text style={styles.routeYield}>{route.yield}</Text>
              </View>
              <Text style={[styles.routeAmt, { color: route.color }]}>{route.amt}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noticeIcon: {
    fontSize: 16,
  },
  noticeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  noticeBadge: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  yieldPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yieldText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16A34A',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  sourceAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7AB5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceAvatarText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  sourceContent: {
    flex: 1,
  },
  sourceLabel: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '600',
  },
  sourceSub: {
    color: '#767676',
    fontSize: 9,
  },
  sourceTag: {
    color: '#D81E05',
    fontSize: 9,
    fontWeight: '900',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  routeBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  routeIcon: {
    fontSize: 18,
  },
  routeContent: {
    flex: 1,
  },
  routeTo: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '600',
  },
  routeYield: {
    color: '#767676',
    fontSize: 9,
  },
  routeAmt: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default Screen2_AllocationFlow;