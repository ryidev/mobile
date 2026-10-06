import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SbtBadgeProps {
  hasTicket: boolean;
  tokenId?: string | number | null;
  isUsed: boolean;
  isMinting?: boolean;
  onClaim?: () => void;
}

export function SbtBadge({
  hasTicket,
  tokenId,
  isUsed,
  isMinting = false,
  onClaim,
}: SbtBadgeProps) {
  const { colors } = useTheme();

  if (!hasTicket) {
    return (
      <View style={[styles.container, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
        <View style={styles.leftRow}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
          </View>
          <View style={styles.textBox}>
            <Text style={[styles.title, { color: '#d97706' }]}>BELUM MEMILIKI TIKET SBT</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Verifikasi NIK untuk menerbitkan NFT Tiket Suara resmi (ERC-5192).
            </Text>
          </View>
        </View>

        {onClaim && (
          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: '#d97706' }]}
            onPress={onClaim}
            disabled={isMinting}
            activeOpacity={0.8}
          >
            {isMinting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.claimBtnText}>KLAIM TIKET (0 ETH)</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (isUsed) {
    return (
      <View style={[styles.container, { backgroundColor: 'rgba(113, 113, 122, 0.1)', borderColor: 'rgba(113, 113, 122, 0.3)', opacity: 0.8 }]}>
        <View style={styles.leftRow}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(113, 113, 122, 0.2)' }]}>
            <Text style={{ fontSize: 18 }}>🎟</Text>
          </View>
          <View style={styles.textBox}>
            <Text style={[styles.title, { color: colors.text, textDecorationLine: 'line-through' }]}>
              TIKET SBT #{tokenId || '1'} (TERPAKAI / HANGUS)
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Hak suara Anda telah resmi tercatat on-chain di blockchain.
            </Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: '#3f3f46' }]}>
          <Text style={styles.statusPillText}>TERPAKAI</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
      <View style={styles.leftRow}>
        <View style={[styles.iconBox, { backgroundColor: '#059669' }]}>
          <Text style={{ fontSize: 18, color: '#fff' }}>🛡️</Text>
        </View>
        <View style={styles.textBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.title, { color: '#059669' }]}>
              OFFICIAL BALLOT #{tokenId || '1'}
            </Text>
            <View style={styles.ercPill}>
              <Text style={styles.ercPillText}>ERC-5192</Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            NFT Sah & Non-Transferable (Bebas Gas Fee 0 ETH)
          </Text>
        </View>
      </View>

      <View style={[styles.statusPill, { backgroundColor: '#059669' }]}>
        <Text style={styles.statusPillText}>SIAP DICOBLOS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
    flexDirection: 'column',
    gap: 12,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  ercPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ercPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#059669',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  claimBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
