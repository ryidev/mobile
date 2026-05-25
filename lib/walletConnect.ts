import { createAppKit, defaultWagmiConfig } from '@reown/appkit-wagmi-react-native';
import { hardhat, sepolia } from 'viem/chains';

// ─── Config ─────────────────────────────────────────────────────────────────
// Get a free Project ID at https://cloud.walletconnect.com
const projectId =
  (process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID as string) ||
  'YOUR_WALLETCONNECT_PROJECT_ID';

const metadata = {
  name: 'VoteDecen',
  description: 'Decentralized E-Voting on Ethereum',
  url: 'https://votedecen.app',
  icons: ['https://votedecen.app/icon.png'],
  redirect: {
    // Must match the scheme in app.json
    native: 'votedecen://',
    universal: 'https://votedecen.app',
  },
};

// ─── Chains ──────────────────────────────────────────────────────────────────
// For local Hardhat: use `hardhat` chain. For testnet: use `sepolia`.
// NOTE: Mobile wallets (MetaMask) cannot reach localhost directly.
// Use ngrok to tunnel local Hardhat, OR redeploy to Sepolia.
const chains = [sepolia, hardhat] as const;

// ─── Wagmi Config ────────────────────────────────────────────────────────────
export const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// ─── AppKit Init ─────────────────────────────────────────────────────────────
// Call this ONCE at app startup (in _layout.tsx)
export function initAppKit() {
  createAppKit({
    projectId,
    wagmiConfig,
    defaultChain: sepolia,
    enableAnalytics: false,
  });
}
