import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Candidate } from '@/hooks/useVotingSession';

interface CandidateCardProps {
  candidate: Candidate;
  index: number;
  isWinner: boolean;
  isFinished: boolean;
  isVotingActive: boolean;
  isVoting: boolean;
  onVote: (index: number) => void;
}

export function CandidateCard({
  candidate,
  index,
  isWinner,
  isFinished,
  isVotingActive,
  isVoting,
  onVote,
}: CandidateCardProps) {
  const { colors, isDark } = useTheme();

  const avatarUri =
    candidate.image_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(candidate.name)}`;

  const canVote = !isFinished && isVotingActive && !isVoting;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: isWinner ? colors.accent : colors.border,
          shadowColor: isWinner ? colors.accent : '#000',
        },
      ]}
    >
      {/* Rank badge (when session is finished) */}
      {isFinished && (
        <View
          style={[
            styles.rankBadge,
            { backgroundColor: index === 0 ? colors.accent : colors.bgMuted },
          ]}
        >
          <Text
            style={[
              styles.rankText,
              { color: index === 0 ? '#fff' : colors.textMuted },
            ]}
          >
            RANK #{index + 1}
          </Text>
        </View>
      )}

      {/* Header: avatar + vote count */}
      <View style={styles.header}>
        <View style={[styles.avatarWrap, { borderColor: colors.border }]}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>
        <View style={styles.voteCount}>
          <Text style={[styles.voteNumber, { color: colors.text }]}>
            {candidate.votes}
          </Text>
          <Text style={[styles.voteLabel, { color: colors.textMuted }]}>
            VOTES
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {candidate.name}
        </Text>
        <Text
          style={[styles.address, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {candidate.wallet_address?.slice(0, 20)}...
        </Text>
        {candidate.description ? (
          <Text
            style={[styles.description, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {candidate.description}
          </Text>
        ) : null}
      </View>

      {/* Vote Button */}
      <TouchableOpacity
        style={[
          styles.voteBtn,
          {
            backgroundColor: isWinner
              ? colors.accent
              : canVote
              ? colors.accent
              : colors.bgMuted,
            borderColor: canVote ? colors.accent : colors.border,
          },
        ]}
        onPress={() => onVote(candidate.index)}
        disabled={!canVote}
        activeOpacity={0.8}
      >
        {isVoting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text
            style={[
              styles.voteBtnText,
              {
                color: canVote || isWinner ? '#fff' : colors.textMuted,
              },
            ]}
          >
            {isFinished
              ? 'SESSION ARCHIVED'
              : isVoting
              ? 'CASTING...'
              : isVotingActive
              ? 'CAST YOUR VOTE'
              : 'PAUSED'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  rankBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomRightRadius: 14,
  },
  rankText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  voteCount: {
    alignItems: 'flex-end',
  },
  voteNumber: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 36,
  },
  voteLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 2,
  },
  info: {
    marginBottom: 16,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  address: {
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  voteBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
