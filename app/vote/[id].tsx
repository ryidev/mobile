import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/hooks/useWallet';
import { useVotingSession } from '@/hooks/useVotingSession';
import { supabase } from '@/lib/supabaseClient';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/evotingContract';
import { CandidateCard } from '@/components/CandidateCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Toast, useToast } from '@/components/Toast';
import { WalletButton } from '@/components/WalletButton';

// ─── NIK Gate ─────────────────────────────────────────────────────────────────
function NikGate({
  onVerified,
  walletAddress,
}: {
  onVerified: () => void;
  walletAddress: string;
}) {
  const { colors } = useTheme();
  const { showToast, toast, hideToast } = useToast();
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [nik, setNik] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateAge = (dateStr: string) => {
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) age--;
    return age;
  };

  const handleAuth = async () => {
    if (!walletAddress) return showToast('Connect your wallet first', 'error');
    if (nik.length !== 16) return showToast('NIK must be exactly 16 digits', 'error');

    setLoading(true);
    try {
      if (authMode === 'register') {
        if (!birthDate) throw new Error('Enter your birth date');
        const age = calculateAge(birthDate);
        if (age < 17) throw new Error('You must be 17+ to vote');

        const { error } = await supabase.from('verified_voters').insert([
          {
            nik,
            birth_date: birthDate,
            wallet_address: walletAddress.toLowerCase(),
            full_name: 'Verified Voter',
          },
        ]);
        if (error) {
          throw new Error(error.code === '23505' ? 'This NIK is already registered' : error.message);
        }
        showToast('Registration successful!', 'success');
        setTimeout(onVerified, 1000);
      } else {
        const { data, error } = await supabase
          .from('verified_voters')
          .select('*')
          .eq('nik', nik)
          .eq('wallet_address', walletAddress.toLowerCase())
          .single();

        if (error || !data) throw new Error('NIK does not match this wallet');
        const age = calculateAge(data.birth_date);
        if (age < 17) throw new Error('You must be 17+ to vote');

        showToast('Verified!', 'success');
        setTimeout(onVerified, 1000);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.gate, { backgroundColor: colors.bgCard, borderColor: colors.accent }]}>
      {/* Tab toggle */}
      <View style={[styles.tabBar, { backgroundColor: colors.bgMuted }]}>
        {(['register', 'login'] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.tab,
              authMode === mode && { backgroundColor: colors.bgCard },
            ]}
            onPress={() => setAuthMode(mode)}
          >
            <Text
              style={[
                styles.tabText,
                { color: authMode === mode ? colors.accent : colors.textMuted },
              ]}
            >
              {mode === 'register' ? '📝 REGISTER' : '🔐 LOGIN'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Icon */}
      <View style={[styles.gateIcon, { backgroundColor: colors.accent }]}>
        <Text style={{ fontSize: 28 }}>{loading ? '⟳' : '🛡'}</Text>
      </View>

      <Text style={[styles.gateTitle, { color: colors.text }]}>
        {authMode === 'register' ? 'NIK Registration' : 'Verify Identity'}
      </Text>
      <Text style={[styles.gateSub, { color: colors.textMuted }]}>
        {authMode === 'register'
          ? 'Link your NIK to this wallet address.'
          : 'Enter your NIK to verify wallet linkage.'}
      </Text>

      {/* NIK Input */}
      <View style={[styles.inputWrap, { borderBottomColor: colors.border }]}>
        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
          National ID (NIK)
        </Text>
        <TextInput
          value={nik}
          onChangeText={(t) => setNik(t.replace(/\D/g, '').slice(0, 16))}
          placeholder="16 Digit Number"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          maxLength={16}
          style={[styles.input, { color: colors.text }]}
        />
      </View>

      {/* Birth Date (register only) */}
      {authMode === 'register' && (
        <View style={[styles.inputWrap, { borderBottomColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
            Birth Date (YYYY-MM-DD)
          </Text>
          <TextInput
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="e.g. 2000-01-15"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
          />
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.gateBtn, { backgroundColor: colors.accent }]}
        onPress={handleAuth}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.gateBtnText}>
            {authMode === 'register' ? 'REGISTER & LINK' : 'LOGIN & VERIFY'}
          </Text>
        )}
      </TouchableOpacity>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  );
}

// ─── Main Vote Screen ──────────────────────────────────────────────────────────
export default function VoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { address, isConnected, openWallet } = useWallet();
  const router = useRouter();

  const { session, candidates, setCandidates, isVotingActive, loading, refetch } =
    useVotingSession(id);

  const [isVerified, setIsVerified] = useState(false);
  const [votingIndex, setVotingIndex] = useState<number | null>(null);
  const { showToast, toast, hideToast } = useToast();

  // wagmi contract write
  const { writeContract, data: txHash, isPending } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // On tx confirmed → refetch + show success
  React.useEffect(() => {
    if (isSuccess) {
      showToast('Vote cast successfully! 🗳', 'success');
      setVotingIndex(null);
      refetch();
    }
  }, [isSuccess]);

  const handleVote = async (index: number) => {
    if (!isConnected) return showToast('Connect your wallet first', 'error');
    if (session?.require_nik && !isVerified) return showToast('NIK verification required', 'error');
    if (session?.status === 'finished' || !isVotingActive) return showToast('Voting is closed', 'error');

    try {
      setVotingIndex(index);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'voting',
        args: [BigInt(index)],
      });
    } catch (err: any) {
      showToast(err.reason || err.message || 'Transaction failed', 'error');
      setVotingIndex(null);
    }
  };

  const isFinished = session?.status === 'finished';
  const showNikGate = session?.require_nik && !isVerified && !isFinished && isConnected;
  const winnerCandidate = candidates.find(
    (c) => c.wallet_address?.toLowerCase() === session?.winner_address?.toLowerCase()
  );

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.textMuted }]}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={{ fontSize: 56 }}>🔒</Text>
          <Text style={[styles.gateTitle, { color: colors.text, textAlign: 'center' }]}>
            Wallet Required
          </Text>
          <Text style={[styles.gateSub, { color: colors.textMuted, textAlign: 'center' }]}>
            Connect your wallet to access this voting forum.
          </Text>
          <WalletButton size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>SYNCING_NODE...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Back nav */}
          <View style={styles.backRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.textMuted }]}>← Back</Text>
            </TouchableOpacity>
            <WalletButton size="sm" />
          </View>

          {/* Session Header */}
          <View style={styles.sessionHeader}>
            <StatusBadge status={session?.status || ''} isVotingActive={isVotingActive} />
            <Text style={[styles.sessionTitle, { color: colors.text }]}>
              {session?.title}
            </Text>
            {session?.require_nik && (
              <View style={[styles.nikPill, { backgroundColor: colors.accentLight, borderColor: colors.accent + '50' }]}>
                <Text style={[styles.nikPillText, { color: colors.accent }]}>
                  🛡 NIK Verification Required
                </Text>
              </View>
            )}
            <Text style={[styles.sessionDesc, { color: colors.textMuted }]}>
              {session?.description}
            </Text>
          </View>

          {/* Winner Banner */}
          {isFinished && winnerCandidate && (
            <View style={[styles.winnerBanner, { backgroundColor: colors.bgCard, borderColor: colors.accent }]}>
              <View style={[styles.winnerIcon, { backgroundColor: colors.accent }]}>
                <Text style={{ fontSize: 24 }}>🏆</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.winnerLabel, { color: colors.accent }]}>
                  OFFICIAL WINNER DECLARED
                </Text>
                <Text style={[styles.winnerName, { color: colors.text }]}>
                  {winnerCandidate.name}
                </Text>
                <Text style={[styles.winnerAddr, { color: colors.textMuted }]} numberOfLines={1}>
                  {winnerCandidate.wallet_address}
                </Text>
              </View>
            </View>
          )}

          {/* NIK Gate */}
          {showNikGate && (
            <NikGate
              walletAddress={address!}
              onVerified={() => setIsVerified(true)}
            />
          )}

          {/* Candidates */}
          {(!showNikGate || isFinished) && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                CANDIDATES — {candidates.length}
              </Text>
              {candidates.map((candidate, idx) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  index={idx}
                  isWinner={
                    candidate.wallet_address?.toLowerCase() ===
                    session?.winner_address?.toLowerCase()
                  }
                  isFinished={isFinished}
                  isVotingActive={isVotingActive}
                  isVoting={votingIndex === candidate.index && (isPending || isConfirming)}
                  onVote={handleVote}
                />
              ))}
            </>
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              ⛓ Powered by Ethereum Network
            </Text>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              📊 Real-time analytics active
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Global toast */}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  loadingText: { fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  backRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { fontSize: 14, fontWeight: '600' },
  sessionHeader: { gap: 12, marginBottom: 24 },
  sessionTitle: { fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  sessionDesc: { fontSize: 14, lineHeight: 22 },
  nikPill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  nikPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    marginBottom: 24,
  },
  winnerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  winnerName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  winnerAddr: { fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 12 },

  // NIK Gate styles
  gate: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    marginBottom: 28,
    gap: 16,
    alignItems: 'stretch',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  gateIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  gateTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },
  gateSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  inputWrap: { borderBottomWidth: 1, paddingBottom: 10, gap: 4 },
  inputLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  input: { fontSize: 16, paddingVertical: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  gateBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  gateBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 2 },

  footer: { borderTopWidth: 1, marginTop: 32, paddingTop: 24, gap: 8, alignItems: 'center' },
  footerText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
