import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/lib/supabaseClient';
import { WalletButton } from '@/components/WalletButton';
import { StatusBadge } from '@/components/StatusBadge';

interface VotingSession {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'paused' | 'finished';
  require_nik: boolean;
}

export default function ForumsScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { shortAddress, disconnect } = useWallet();
  const router = useRouter();

  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('voting_sessions')
      .select('*')
      .order('id', { ascending: false });
    if (!error && data) setSessions(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  const renderSession = ({ item }: { item: VotingSession }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: item.status === 'active' ? colors.accent + '60' : colors.border,
        },
      ]}
      onPress={() => router.push(`/vote/${item.id}`)}
      activeOpacity={0.85}
    >
      {/* Status badge row */}
      <View style={styles.cardTop}>
        <StatusBadge status={item.status} isVotingActive={item.status === 'active'} />
        {item.require_nik && (
          <View style={[styles.nikBadge, { backgroundColor: colors.accentLight, borderColor: colors.accent + '50' }]}>
            <Text style={[styles.nikText, { color: colors.accent }]}>🛡 NIK Required</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>
        {item.description}
      </Text>

      {/* Arrow */}
      <View style={styles.cardFooter}>
        <Text style={[styles.cardId, { color: colors.textMuted }]}>
          Session #{item.id}
        </Text>
        <View style={[styles.arrowBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>VoteDecen</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            Voting Forums
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggle} style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <WalletButton size="sm" />
        </View>
      </View>
      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            SYNCING_NODE...
          </Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>🗳</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Sessions</Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            Check back later for upcoming voting sessions.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: { padding: 8 },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  nikBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  nikText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, lineHeight: 26 },
  cardDesc: { fontSize: 13, lineHeight: 20 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardId: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { color: '#fff', fontSize: 16, fontWeight: '700' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  loadingText: { fontSize: 10, fontWeight: '900', letterSpacing: 3, marginTop: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
