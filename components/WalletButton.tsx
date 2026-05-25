import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/hooks/useWallet';

interface WalletButtonProps {
  size?: 'sm' | 'md' | 'lg';
  onConnected?: () => void;
}

export function WalletButton({ size = 'md', onConnected }: WalletButtonProps) {
  const { colors } = useTheme();
  const { address, isConnected, openWallet, disconnect, shortAddress } = useWallet();

  const handlePress = () => {
    if (isConnected) {
      disconnect();
    } else {
      openWallet();
      onConnected?.();
    }
  };

  const padding = size === 'lg' ? 18 : size === 'sm' ? 10 : 14;
  const fontSize = size === 'lg' ? 11 : size === 'sm' ? 9 : 10;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: isConnected ? colors.bgMuted : colors.accent,
          borderColor: isConnected ? colors.border : colors.accent,
          paddingVertical: padding,
          paddingHorizontal: padding * 1.8,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {isConnected ? (
        <View style={styles.connectedInner}>
          {/* Wallet indicator dot */}
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={[styles.label, { color: colors.text, fontSize }]}>
            {shortAddress}
          </Text>
        </View>
      ) : (
        <Text style={[styles.label, { color: '#fff', fontSize }]}>
          CONNECT WALLET
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontWeight: '900',
    letterSpacing: 2,
  },
});
