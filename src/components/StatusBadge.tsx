import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ORDER_STATUS_STYLE } from '@constants/theme';

const StatusBadge = ({ status }: { status: string }) => {
  const style = ORDER_STATUS_STYLE[status] ?? { label: status, color: '#374151', bg: '#E5E7EB' };
  return <Text style={[styles.badge, { color: style.color, backgroundColor: style.bg }]}>{style.label}</Text>;
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
});

export default StatusBadge;
