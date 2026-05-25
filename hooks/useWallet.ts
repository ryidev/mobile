import { useWalletContext } from '@/context/WalletContext';

/**
 * Convenience hook — wraps WalletContext.
 * Usage: const { address, isConnected, openWallet, disconnect } = useWallet();
 */
export function useWallet() {
  return useWalletContext();
}
