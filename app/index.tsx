import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/WalletButton';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { isConnected } = useWallet();
  const router = useRouter();

  // Fade-in animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  // Auto-redirect if already connected
  useEffect(() => {
    if (isConnected) {
      router.replace('/forums');
    }
  }, [isConnected]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background gradient blobs */}
      <View
        style={[
          styles.blob1,
          { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff', opacity: 0.7 },
        ]}
      />
      <View
        style={[
          styles.blob2,
          { backgroundColor: isDark ? '#0f172a' : '#f0fdf4', opacity: 0.5 },
        ]}
      />

      <SafeAreaView style={styles.safe}>
        {/* Theme toggle */}
        <TouchableOpacity style={styles.themeBtn} onPress={toggle}>
          <Text style={{ fontSize: 20 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>

        {/* Main content */}
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Logo / Icon */}
          <View style={[styles.logoWrap, { backgroundColor: colors.accent }]}>
            <Text style={styles.logoIcon}>🗳</Text>
          </View>

          {/* Tag */}
          <View
            style={[
              styles.tag,
              { backgroundColor: colors.accentLight, borderColor: colors.accent + '40' },
            ]}
          >
            <View style={[styles.tagDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.tagText, { color: colors.accent }]}>
              BLOCKCHAIN_VERIFIED
            </Text>
          </View>

          {/* Headline */}
          <Text style={[styles.headline, { color: colors.text }]}>
            Vote{'\n'}
            <Text style={{ color: colors.accent }}>Decen</Text>
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Decentralized e-voting secured by Ethereum.{'\n'}
            Transparent. Immutable. Yours.
          </Text>

          {/* Feature pills */}
          <View style={styles.pills}>
            {['On-Chain Votes', 'NIK Verified', 'Real-Time'].map((f) => (
              <View
                key={f}
                style={[
                  styles.pill,
                  { backgroundColor: colors.bgMuted, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.pillText, { color: colors.textMuted }]}>{f}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Bottom CTA */}
        <Animated.View
          style={[styles.cta, { opacity: fadeAnim }]}
        >
          <WalletButton size="lg" />

          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
            By connecting, you agree to interact with the Ethereum network.{'\n'}
            No account. No password. Just your wallet.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24 },
  blob1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    top: -width * 0.2,
    right: -width * 0.2,
  },
  blob2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    bottom: height * 0.1,
    left: -width * 0.2,
  },
  themeBtn: {
    alignSelf: 'flex-end',
    marginTop: 12,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoIcon: { fontSize: 36 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 20,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  headline: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 66,
    marginBottom: 16,
  },
  sub: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 28,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cta: {
    paddingBottom: 32,
    gap: 16,
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
});
