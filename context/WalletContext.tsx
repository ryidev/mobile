import React, { createContext, useContext, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit-react-native';

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  openWallet: () => void;
  disconnect: () => void;
  shortAddress: string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const openWallet = () => open();

  return (
    <WalletContext.Provider
      value={{
        address: address ?? null,
        isConnected,
        openWallet,
        disconnect,
        shortAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be within WalletProvider');
  return ctx;
}
