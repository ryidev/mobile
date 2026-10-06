import React, { useState, useEffect } from 'react';
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
import { useReadContract, useSignTypedData } from 'wagmi';

import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/hooks/useWallet';
import { useVotingSession } from '@/hooks/useVotingSession';
import { supabase } from '@/lib/supabaseClient';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/evotingContract';
import { CandidateCard } from '@/components/CandidateCard';
import { StatusBadge } from '@/components/StatusBadge';
import { SbtBadge } from '@/components/SbtBadge';
import { Toast, useToast } from '@/components/Toast';
import { WalletButton } from '@/components/WalletButton';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3000';

interface SessionVoter {
  id: number;
  session_id: number;
  identifier: string;
  full_name: string;
  wallet_address: string | null;
  is_claimed: boolean;
}

// ─── DPT Gate Component ────────────────────────────────────────────────────────
function DptGate({
  onVerified,
  walletAddress,
  sessionId,
  idLabel = 'NPM',
  idLength = 8,
}: {
  onVerified: (fullName: string) => void;
  walletAddress: string;
  sessionId: string;
  idLabel?: string;
  idLength?: number;
}) {
  const { colors } = useTheme();
  const { showToast, toast, hideToast } = useToast();
  const [npmInput, setNpmInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundVoter, setFoundVoter] = useState<SessionVoter | null>(null);
  const [linking, setLinking] = useState(false);
  const [dptAlert, setDptAlert] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  // Timer countdown lockout jika 3x gagal
  useEffect(() => {
    if (lockCountdown > 0) {
      const timer = setTimeout(() => {
        setLockCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked) {
      setIsLocked(false);
      setFailedAttempts(0);
      setDptAlert(null);
    }
  }, [lockCountdown, isLocked]);

  const recordFailedAttempt = (customMsg: string) => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 3) {
      setIsLocked(true);
      setLockCountdown(60);
      const lockMsg = `Akses Dikunci Demi Keamanan (3/3 Kesalahan)! Anda telah 3 kali salah memasukkan data. Silakan tunggu 60 detik atau hubungi panitia.`;
      setDptAlert(lockMsg);
      showToast(lockMsg, 'error');
    } else {
      const remaining = 3 - nextAttempts;
      const warningMsg = `${customMsg} (Percobaan gagal: ${nextAttempts}/3 — Sisa: ${remaining}x lagi)`;
      setDptAlert(warningMsg);
      showToast(warningMsg, 'error');
    }
  };

  // STEP 1: Cari Identifier (NPM/NIK/NIM) di DPT ruangan ini
  const handleSearch = async () => {
    if (isLocked) {
      return showToast(`Akses masih terkunci demi keamanan. Tunggu ${lockCountdown} detik.`, 'error');
    }
    if (!walletAddress) return showToast('Hubungkan dompet terlebih dahulu', 'error');
    const inputVal = npmInput.trim();
    if (!inputVal) return showToast(`Masukkan ${idLabel} Anda`, 'error');

    // Validasi batasan panjang digit jika ditentukan admin
    if (idLength > 0 && inputVal.length !== idLength) {
      const msg = `${idLabel} harus terdiri dari ${idLength} digit/karakter!`;
      return recordFailedAttempt(msg);
    }

    setSearching(true);
    try {
      // 1. Cari target ID di DPT sesi ini terlebih dahulu
      const { data: voter, error } = await supabase
        .from('session_voters')
        .select('*')
        .eq('session_id', Number(sessionId))
        .eq('identifier', inputVal)
        .maybeSingle();

      if (error) throw new Error(error.message);

      // Kasus A: Identifier tidak terdaftar
      if (!voter) {
        const msg = `${idLabel} "${inputVal}" tidak terdaftar dalam DPT ruangan ini!`;
        return recordFailedAttempt(msg);
      }

      // Kasus B: Identifier sudah diklaim
      if (voter.wallet_address) {
        if (voter.wallet_address.toLowerCase() === walletAddress.toLowerCase()) {
          // Identitas milik dompet ini sendiri!
          setDptAlert(null);
          setFailedAttempts(0);
          showToast(`Selamat datang kembali, ${voter.full_name}!`, 'success');
          onVerified(voter.full_name);
          return;
        } else {
          const shortAddr = `${voter.wallet_address.slice(0, 6)}...${voter.wallet_address.slice(38)}`;
          const msg = `${idLabel} "${inputVal}" ini sudah diklaim oleh dompet lain (${shortAddr})!`;
          return recordFailedAttempt(msg);
        }
      }

      // Kasus C: ID Belum Diklaim (wallet_address: null)
      // CEK KEAMANAN ANTI-HIJACK: Apakah dompet ini sudah pernah klaim ID lain di sesi ini?
      const { data: myExistingVoter } = await supabase
        .from('session_voters')
        .select('*')
        .eq('session_id', Number(sessionId))
        .ilike('wallet_address', walletAddress.toLowerCase())
        .maybeSingle();

      if (myExistingVoter) {
        const msg = `Anda sudah mengambil tiket SBT untuk sesi ini sebagai "${myExistingVoter.full_name}" (${idLabel}: ${myExistingVoter.identifier}). Anda tidak dapat menggunakan ID lain!`;
        return recordFailedAttempt(msg);
      }

      // Tampilkan pertanyaan konfirmasi nama
      setDptAlert(null);
      setFailedAttempts(0);
      setFoundVoter(voter);
    } catch (err: any) {
      recordFailedAttempt(err.message);
    } finally {
      setSearching(false);
    }
  };

  // STEP 2: Konfirmasi "Ya, Saya [Nama]"
  const handleConfirm = async () => {
    if (!foundVoter || !walletAddress) return;

    setLinking(true);
    try {
      // 1. Tautkan wallet ke DPT ruangan ini
      const { error: linkErr } = await supabase
        .from('session_voters')
        .update({
          wallet_address: walletAddress.toLowerCase(),
          is_claimed: true,
        })
        .eq('session_id', Number(sessionId))
        .eq('identifier', foundVoter.identifier);

      if (linkErr) throw new Error(linkErr.message);

      // 2. Minta backend relayer mencetak tiket SBT resmi (0 ETH)
      try {
        const res = await fetch(`${API_BASE_URL}/api/mint-sbt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voterAddress: walletAddress,
            sessionId,
            identifier: foundVoter.identifier,
          }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error);
      } catch (e: any) {
        console.warn('Mint SBT notice:', e.message);
      }

      showToast(`Selamat datang ${foundVoter.full_name}! Tiket SBT resmi berhasil diterbitkan. 🛡️🎫`, 'success');
      setTimeout(() => onVerified(foundVoter.full_name), 800);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLinking(false);
    }
  };

  return (
    <View style={[styles.gate, { backgroundColor: colors.bgCard, borderColor: colors.accent }]}>
      <View style={[styles.gateIcon, { backgroundColor: colors.accent }]}>
        <Text style={{ fontSize: 26, color: '#fff' }}>🛡️</Text>
      </View>

      <Text style={[styles.gateTitle, { color: colors.text }]}>
        Klaim Hak Suara SBT
      </Text>
      <Text style={[styles.gateSub, { color: colors.textMuted }]}>
        Masukkan {idLabel} Anda untuk mencocokkan data pada Daftar Pemilih Tetap (DPT) ruangan ini.
      </Text>

      {/* FORM INPUT IDENTIFIER (Jika belum menemukan data) */}
      {!foundVoter ? (
        <>
          <View style={[styles.inputWrap, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                Nomor Identitas ({idLabel})
              </Text>
              {idLength > 0 && (
                <Text style={{ fontSize: 10, color: colors.accent, fontWeight: '700' }}>
                  Wajib {idLength} Digit
                </Text>
              )}
            </View>
            <TextInput
              value={npmInput}
              editable={!isLocked && !searching}
              onChangeText={(text) => {
                setNpmInput(text);
                if (dptAlert) setDptAlert(null);
              }}
              placeholder={isLocked ? `Akses Dikunci (${lockCountdown}s)` : `Masukkan ${idLength ? `${idLength} digit ` : ''}${idLabel}`}
              placeholderTextColor={colors.textMuted}
              keyboardType="default"
              maxLength={idLength > 0 ? idLength : undefined}
              style={[styles.input, { color: isLocked ? colors.textMuted : colors.text }]}
              autoCapitalize="characters"
            />
          </View>

          {/* PROPER INLINE ALERT BANNER JIKA IDENTITAS TIDAK DITEMUKAN ATAU TERKUNCI */}
          {dptAlert ? (
            <View style={[styles.alertBanner, isLocked && { backgroundColor: '#450a0a', borderColor: '#ef4444' }]}>
              <View style={styles.alertIconCircle}>
                <Text style={{ fontSize: 16 }}>⚠️</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.alertHeader}>
                  {isLocked ? `AKSES DIKUNCI (${lockCountdown} DETIK)` : 'PERINGATAN SISTEM DPT'}
                </Text>
                <Text style={styles.alertBody}>{dptAlert}</Text>
                <Text style={styles.alertHint}>
                  {isLocked 
                    ? 'Sistem mendeteksi 3x kesalahan input berturut-turut demi melindungi akun pemilih.' 
                    : 'Maksimal 3 kali kesalahan input sebelum akses dikunci otomatis.'}
                </Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.gateBtn, { backgroundColor: isLocked ? '#71717a' : colors.accent }]}
            onPress={handleSearch}
            disabled={searching || isLocked}
            activeOpacity={0.85}
          >
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : isLocked ? (
              <Text style={styles.gateBtnText}>AKSES DIKUNCI SEMENTARA ({lockCountdown}S)</Text>
            ) : (
              <Text style={styles.gateBtnText}>CARI & VERIFIKASI {idLabel.toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        /* KONFIRMASI NAMA: "Apakah Anda benar [User.Nama]?" */
        <View style={styles.confirmBox}>
          <Text style={[styles.confirmSubtitle, { color: colors.textMuted }]}>
            Data DPT ditemukan! Apakah Anda benar:
          </Text>

          <View style={[styles.identityCard, { backgroundColor: colors.bgMuted, borderColor: colors.border }]}>
            <Text style={[styles.identityName, { color: colors.text }]}>
              {foundVoter.full_name}
            </Text>
            <Text style={[styles.identityNpm, { color: colors.accent }]}>
              {idLabel}: {foundVoter.identifier}
            </Text>
          </View>

          <Text style={[styles.confirmNotice, { color: colors.textMuted }]}>
            Jika dikonfirmasi, dompet Anda akan dikunci ke identitas ini dan Anda akan langsung menerima 1 Tiket SBT resmi (0 ETH).
          </Text>

          <TouchableOpacity
            style={[styles.gateBtn, { backgroundColor: colors.accent }]}
            onPress={handleConfirm}
            disabled={linking}
            activeOpacity={0.85}
          >
            {linking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.gateBtnText}>
                YA, SAYA {foundVoter.full_name.split(' ')[0].toUpperCase()} & KLAIM SBT
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setFoundVoter(null)}
            disabled={linking}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
              Bukan Saya (Ganti {idLabel})
            </Text>
          </TouchableOpacity>
        </View>
      )}

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

  const { session, candidates, setCandidates, isVotingActive, loading, refetch } = useVotingSession(id);

  const [isVerified, setIsVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [votingIndex, setVotingIndex] = useState<number | null>(null);
  const [isMintingSbt, setIsMintingSbt] = useState(false);
  const { showToast, toast, hideToast } = useToast();

  // Read contract owner
  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  });

  // Read SBT ticket status
  const { data: ticketData, refetch: refetchTicket } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'checkVoterTicket',
    args: address && id ? [address as `0x${string}`, BigInt(id)] : undefined,
    query: {
      enabled: !!address && !!id,
    },
  });

  const hasTicket = Boolean(ticketData ? (ticketData as any)[0] : false);
  const tokenId = ticketData ? (ticketData as any)[1]?.toString() : null;
  const isTicketUsed = Boolean(ticketData ? (ticketData as any)[2] : false);

  // Read voter nonce
  const { data: voterNonce, refetch: refetchNonce } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'nonces',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Check if voter already voted
  const { data: hasVoted, refetch: refetchHasVoted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'userSudahVoting',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { signTypedDataAsync } = useSignTypedData();

  // Menerbitkan tiket SBT resmi on-chain (0 ETH)
  const handleClaimSbt = async () => {
    if (!address || !id) return;
    setIsMintingSbt(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mint-sbt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterAddress: address,
          sessionId: id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Tiket SBT resmi berhasil diterbitkan! 🛡️🎫`, 'success');
      refetchTicket();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsMintingSbt(false);
    }
  };

  // Cek apakah wallet sudah terdaftar di DPT sesi ini
  React.useEffect(() => {
    async function checkVerification() {
      if (!address || !id) {
        setIsVerified(false);
        setVerifiedName(null);
        return;
      }
      try {
        const { data } = await supabase
          .from('session_voters')
          .select('*')
          .eq('session_id', Number(id))
          .eq('wallet_address', address.toLowerCase())
          .maybeSingle();

        if (data) {
          setIsVerified(true);
          setVerifiedName(data.full_name);
          // Jika terdaftar tapi belum punya tiket on-chain, klaim tiket otomatis
          if (!hasTicket) {
            handleClaimSbt();
          }
        } else {
          setIsVerified(false);
          setVerifiedName(null);
        }
      } catch (err) {
        setIsVerified(false);
      }
    }
    checkVerification();
  }, [address, id, hasTicket]);

  // Gasless voting via EIP-712
  const handleVote = async (index: number) => {
    if (!isConnected) return showToast('Hubungkan dompet MetaMask Anda', 'error');
    if (!isVerified) return showToast('Lakukan verifikasi NPM terlebih dahulu', 'error');
    if (session?.status === 'finished' || !isVotingActive) return showToast('Voting sedang tidak aktif', 'error');

    // Validasi Owner
    if (contractOwner && address && contractOwner.toLowerCase() === address.toLowerCase()) {
      return showToast('Owner kontrak dilarang memilih! Silakan ganti ke akun pemilih.', 'error');
    }

    // Validasi Tiket Hangus
    if (isTicketUsed || hasVoted) {
      return showToast('Tiket SBT Anda sudah pernah digunakan untuk mencoblos!', 'error');
    }

    if (!hasTicket) {
      showToast('Tiket SBT belum ditemukan on-chain, mencoba menerbitkan...', 'info');
      return handleClaimSbt();
    }

    try {
      setVotingIndex(index);
      showToast("Silakan klik 'Sign / Tanda Tangan' di MetaMask (Gratis 0 ETH)...", 'info');

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const currentNonce = voterNonce ? BigInt(voterNonce as any) : 0n;

      // 1. Tanda Tangan EIP-712
      const signature = await signTypedDataAsync({
        domain: {
          name: 'VoteDecenSBT',
          version: '1',
          chainId: 31337,
          verifyingContract: CONTRACT_ADDRESS,
        },
        types: {
          VoteWithBallot: [
            { name: 'candidateIndex', type: 'uint256' },
            { name: 'sessionId', type: 'uint256' },
            { name: 'voter', type: 'address' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        primaryType: 'VoteWithBallot',
        message: {
          candidateIndex: BigInt(index),
          sessionId: BigInt(id!),
          voter: address as `0x${string}`,
          nonce: currentNonce,
          deadline: BigInt(deadline),
        },
      });

      // 2. Broadcast lewat Relayer API Panitia
      const res = await fetch(`${API_BASE_URL}/api/relay-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIndex: index,
          sessionId: id,
          voterAddress: address,
          deadline,
          signature,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal relay transaksi on-chain');

      showToast('Berhasil mencoblos dengan Tiket SBT (0 ETH Bebas Gas)! 🗳✨', 'success');
      // Update optimistik instan di mobile
      setCandidates((prev: any) => prev.map((c: any) => 
        c.index === index ? { ...c, votes: c.votes + 1 } : c
      ));
      refetch();
      refetchTicket();
      refetchNonce();
      refetchHasVoted();
    } catch (err: any) {
      let friendlyError = 'Transaksi gagal dilakukan';
      const errMsg = err.message || '';

      if (errMsg.includes('User rejected the request') || errMsg.includes('rejected')) {
        friendlyError = 'Tanda tangan dibatalkan di aplikasi dompet.';
      } else if (errMsg.includes('Tiket SBT Anda sudah pernah')) {
        friendlyError = 'Tiket SBT Anda sudah pernah digunakan untuk mencoblos!';
      } else if (errMsg.includes('Network request failed') || errMsg.includes('Failed to fetch')) {
        friendlyError = 'Gagal menghubungi server Relayer (Pastikan adb reverse tcp:3000 aktif)';
      } else {
        friendlyError = errMsg;
      }

      showToast(friendlyError, 'error');
    } finally {
      setVotingIndex(null);
    }
  };

  const isFinished = session?.status === 'finished';
  const showDptGate = !isVerified && !hasTicket && !isFinished && isConnected;
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
            Hubungkan dompet MetaMask Anda untuk mengakses forum e-voting ini.
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
            <Text style={[styles.sessionDesc, { color: colors.textMuted }]}>
              {session?.description}
            </Text>
          </View>

          {/* Verified Voter Bar */}
          {verifiedName && (
            <View style={[styles.verifiedBanner, { backgroundColor: colors.bgCard, borderColor: colors.accent + '40' }]}>
              <Text style={[styles.verifiedText, { color: colors.text }]}>
                Pemilih Terdaftar: <Text style={{ fontWeight: '900', color: colors.accent }}>{verifiedName}</Text>
              </Text>
              <Text style={[styles.verifiedStatus, { color: '#059669' }]}>DPT Terverifikasi ✓</Text>
            </View>
          )}

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

          {/* DPT Gate (Search & Confirm) */}
          {showDptGate && (
            <DptGate
              walletAddress={address!}
              sessionId={id!}
              idLabel={session?.id_label || 'NPM'}
              idLength={Number(session?.id_length) || 8}
              onVerified={(name) => {
                setIsVerified(true);
                setVerifiedName(name);
                refetchTicket();
              }}
            />
          )}

          {/* SBT Badge Display */}
          {(!showDptGate || isFinished) && (
            <SbtBadge
              hasTicket={hasTicket}
              tokenId={tokenId}
              isUsed={isTicketUsed || Boolean(hasVoted)}
              isMinting={isMintingSbt}
              onClaim={!hasTicket && isVerified ? handleClaimSbt : undefined}
            />
          )}

          {/* Candidates */}
          {(!showDptGate || isFinished) && (
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
                  isVoting={votingIndex === candidate.index}
                  hasTicket={hasTicket}
                  isTicketUsed={isTicketUsed || Boolean(hasVoted)}
                  onVote={handleVote}
                />
              ))}
            </>
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              ⛓ Powered by ERC-5192 Soulbound Token & EIP-712
            </Text>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              ⚡ Gasless Voting Enabled (0 ETH)
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  sessionHeader: { gap: 12, marginBottom: 20 },
  sessionTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 36 },
  sessionDesc: { fontSize: 13, lineHeight: 20 },

  verifiedBanner: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifiedText: { fontSize: 11, fontWeight: '600' },
  verifiedStatus: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

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

  // DPT Gate styles
  gate: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    marginBottom: 28,
    gap: 16,
    alignItems: 'stretch',
  },
  gateIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  gateTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },
  gateSub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  inputWrap: { borderBottomWidth: 1, paddingBottom: 10, gap: 4 },
  inputLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  input: { fontSize: 18, paddingVertical: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  gateBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  gateBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },

  confirmBox: {
    gap: 12,
    alignItems: 'stretch',
  },
  confirmSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  identityCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  identityName: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  identityNpm: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  confirmNotice: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  alertBanner: {
    backgroundColor: '#881337',
    borderColor: '#f43f5e',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  alertHeader: {
    color: '#fb7185',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  alertBody: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  alertHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  footer: { borderTopWidth: 1, marginTop: 32, paddingTop: 24, gap: 8, alignItems: 'center' },
  footerText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
