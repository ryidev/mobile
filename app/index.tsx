import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/WalletButton';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { isConnected } = useWallet();
  const router = useRouter();

  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fade-in & slide-up animation for the screen content
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setActiveSlide(currentIndex);
  };

  const scrollToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveSlide(index);
  };

  const slides = [
    {
      id: 1,
      tag: 'VISI & MISI',
      headline: 'Aman &\nTransparan',
      content: (
        <View style={styles.slideCard}>
          <Text style={[styles.cardTitle, { color: colors.accent }]}>🎯 Visi Kami</Text>
          <Text style={[styles.cardText, { color: colors.textMuted }]}>
            Mewujudkan sistem pemungutan suara elektronik (e-voting) yang aman, transparan, dan terpercaya tanpa adanya otoritas terpusat yang dapat memanipulasi data pemilihan.
          </Text>
          
          <View style={[styles.cardSeparator, { backgroundColor: colors.border }]} />
          
          <Text style={[styles.cardTitle, { color: colors.accent }]}>🚀 Misi Kami</Text>
          <Text style={[styles.cardText, { color: colors.textMuted }]}>
            Menggunakan teknologi Blockchain Ethereum untuk menjamin integritas suara (immutable) dan database Supabase untuk verifikasi identitas pemilih yang valid.
          </Text>
        </View>
      ),
    },
    {
      id: 2,
      tag: 'KEUNGGULAN',
      headline: 'Kenapa\nVoteDecen?',
      content: (
        <View style={styles.slideCard}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Keamanan Mutlak (Immutable)</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                Setiap hak suara disimpan langsung di dalam ledger blockchain terdistribusi yang tidak dapat dirubah atau dihapus oleh siapa pun.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🚫</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Cegah Hak Suara Ganda</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                Logika smart contract Solidity secara mutlak memastikan setiap alamat wallet dan NIK pemilih hanya dapat melakukan voting sekali.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Audit & Pantau Real-Time</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                Proses rekapitulasi suara bersifat publik dan transparan, dapat dipantau langsung dari blockchain oleh pemilih secara real-time.
              </Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: 3,
      tag: 'ALUR VOTING',
      headline: 'Langkah\nMulai',
      content: (
        <View style={styles.slideCard}>
          {[
            { step: '1', title: 'Hubungkan Dompet Kripto', desc: 'Hubungkan dompet MetaMask Anda ke aplikasi dengan klik tombol "Connect Wallet".' },
            { step: '2', title: 'Verifikasi NIK (KYC)', desc: 'Masukkan 16 digit NIK dan tanggal lahir Anda untuk validasi kelayakan usia (17+) {Jika dibutuhkan}.' },
            { step: '3', title: 'Berikan Suara Anda', desc: 'Pilih kandidat pilihan Anda dan tanda tangani transaksi voting di MetaMask secara gratis.' },
            { step: '4', title: 'Pantau Hasil Real-Time', desc: 'Data suara Anda langsung tercatat on-chain dan terakumulasi di dashboard secara real-time.' },
          ].map((item) => (
            <View key={item.step} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: colors.accent }]}>
                <Text style={styles.stepNumText}>{item.step}</Text>
              </View>
              <View style={styles.stepTextCol}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      ),
    },
  ];

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

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header: Brand Name + Theme Toggle */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Text style={[styles.brandIcon, { color: colors.accent }]}>🗳</Text>
            <Text style={[styles.brandText, { color: colors.text }]}>VoteDecen</Text>
          </View>
          <TouchableOpacity style={styles.themeBtn} onPress={toggle}>
            <Text style={{ fontSize: 20 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Slider */}
        <Animated.View
          style={[
            styles.animatedContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            style={styles.scrollView}
          >
            {slides.map((slide) => (
              <View key={slide.id} style={styles.slide}>
                <View style={styles.slideHeader}>
                  {/* Tag */}
                  <View
                    style={[
                      styles.tag,
                      { backgroundColor: colors.accentLight, borderColor: colors.accent + '40' },
                    ]}
                  >
                    <View style={[styles.tagDot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.tagText, { color: colors.accent }]}>
                      {slide.tag}
                    </Text>
                  </View>

                  {/* Headline */}
                  <Text style={[styles.headline, { color: colors.text }]}>
                    {slide.headline}
                  </Text>
                </View>

                {/* Content Card */}
                <View style={[styles.cardOuter, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  {slide.content}
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Footer controls: Pagination dots & Action Buttons */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => scrollToSlide(idx)}
                style={[
                  styles.dot,
                  {
                    backgroundColor: activeSlide === idx ? colors.accent : colors.border,
                    width: activeSlide === idx ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Action buttons (Next/Connect) */}
          <View style={styles.actionRow}>
            {activeSlide < 2 ? (
              <>
                <TouchableOpacity
                  style={[styles.btnSecondary, { borderColor: colors.border }]}
                  onPress={() => scrollToSlide(2)}
                >
                  <Text style={[styles.btnSecondaryText, { color: colors.textMuted }]}>
                    SKIP
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnPrimary, { backgroundColor: colors.accent }]}
                  onPress={() => scrollToSlide(activeSlide + 1)}
                >
                  <Text style={styles.btnPrimaryText}>NEXT →</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.walletBtnContainer}>
                <WalletButton size="lg" />
                <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
                  Dengan menghubungkan wallet, Anda setuju untuk berinteraksi dengan smart contract blockchain lokal/testnet.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
    height: 50,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    fontSize: 24,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  themeBtn: {
    padding: 8,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: height * 0.02,
    paddingBottom: height * 0.02,
    flex: 1,
  },
  slideHeader: {
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  headline: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 42,
  },
  cardOuter: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    marginTop: 16,
    flex: 1,
    justifyContent: 'center',
  },
  slideCard: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  cardSeparator: {
    height: 1,
    marginVertical: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  stepTextCol: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 1,
  },
  stepDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 32,
    paddingTop: 16,
    gap: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    height: 10,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  btnPrimary: {
    flex: 1.5,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  walletBtnContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  disclaimer: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
  },
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
});
