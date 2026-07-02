import { useState, useEffect, useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { supabase } from '@/lib/supabaseClient';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/evotingContract';

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

export interface Candidate {
  id: number;
  name: string;
  wallet_address: string;
  description: string;
  image_url: string;
  session_id: number;
  votes: number;
  index: number;
}

export interface VotingSession {
  id: number;
  title: string;
  description: string;
  winner_address?: string;
  status?: 'active' | 'paused' | 'finished';
  require_nik?: boolean;
  enforce_age?: boolean;
  id_label?: string;
  id_length?: number;
}

export function useVotingSession(sessionId: string | number) {
  const [session, setSession] = useState<VotingSession | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read voting status from blockchain
  const { data: isVotingActive, refetch: refetchActive } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'sudahBisaVoting',
  });

  const fetchData = useCallback(async () => {
    try {
      // Fetch session metadata from Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch candidates from Supabase
      const { data: candData, error: candError } = await supabase
        .from('candidates')
        .select('*')
        .eq('session_id', sessionId);

      if (candError) throw candError;

      // Enrich candidates with on-chain vote counts
      const enriched = await Promise.all(
        (candData || []).map(async (c: Candidate, index: number) => {
          try {
            const result = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'kandidat',
              args: [BigInt(index)],
            }) as [string, bigint];
            return { ...c, votes: Number(result[1]), index };
          } catch (e: any) {
            console.warn('Error fetching on-chain votes for candidate index', index, e.message);
            return { ...c, votes: 0, index };
          }
        })
      );

      // Sort by votes if finished
      if (sessionData?.status === 'finished') {
        enriched.sort((a, b) => b.votes - a.votes);
      }

      setCandidates(enriched);
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchData();
    // Poll every 10 seconds for live vote count updates
    const interval = setInterval(() => {
      fetchData();
      refetchActive();
    }, 10_000);
    return () => clearInterval(interval);
  }, [fetchData, refetchActive]);

  return {
    session,
    candidates,
    setCandidates,
    isVotingActive: Boolean(isVotingActive),
    loading,
    error,
    refetch: fetchData,
  };
}
