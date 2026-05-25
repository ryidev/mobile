import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type Status = 'active' | 'paused' | 'finished' | string;

interface StatusBadgeProps {
  status: Status;
  isVotingActive?: boolean;
}

export function StatusBadge({ status, isVotingActive }: StatusBadgeProps) {
  const { colors } = useTheme();

  const isFinished = status === 'finished';
  const isLive = !isFinished && isVotingActive;

  const label = isFinished ? 'ARCHIVED' : isLive ? 'LIVE' : 'PAUSED';

  const dotColor = isFinished
    ? colors.textMuted
    : isLive
    ? colors.accent
    : colors.error;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bgMuted, borderColor: colors.border }]}>
      <View
        style={[
          styles.dot,
          { backgroundColor: dotColor },
          isLive && styles.pulse,
        ]}
      />
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulse: {
    // React Native doesn't support CSS animation natively without Reanimated
    // For production: wrap with Animated.View + pulsing opacity
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
