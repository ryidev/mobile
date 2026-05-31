import { WagmiAdapter, formatNetworks } from '@reown/appkit-wagmi-react-native';
import { createAppKit } from '@reown/appkit-react-native';
import type { Storage } from '@reown/appkit-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sepolia, hardhat } from 'viem/chains';

// ─── Project ID ──────────────────────────────────────────────────────────────
// Get a free Project ID at https://cloud.walletconnect.com
export const projectId =
  (process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID as string) ||
  'YOUR_WALLETCONNECT_PROJECT_ID';

const metadata = {
  name: 'VoteDecen',
  description: 'Decentralized E-Voting on Ethereum',
  url: 'https://votedecen.app',
  icons: ['https://votedecen.app/icon.png'],
  redirect: {
    native: 'votedecen://',
    universal: 'https://votedecen.app',
  },
};

// ─── Storage Adapter ─────────────────────────────────────────────────────────
// AppKit requires a Storage implementation — we use AsyncStorage
const appKitStorage: Storage = {
  getKeys: async () => {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys];
  },
  getEntries: async <T>(): Promise<[string, T][]> => {
    const keys = await AsyncStorage.getAllKeys();
    const result: [string, T][] = [];
    for (const key of keys) {
      const val = await AsyncStorage.getItem(key);
      result.push([key, val ? JSON.parse(val) : undefined]);
    }
    return result;
  },
  getItem: async <T>(key: string): Promise<T | undefined> => {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : undefined;
  },
  setItem: async <T>(key: string, value: T): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },
};

// ─── Chains ──────────────────────────────────────────────────────────────────
// WagmiAdapter needs a tuple: [Chain, ...Chain[]]
// NOTE: Mobile wallets can't connect to hardhat localhost.
// Redeploy to Sepolia and update EXPO_PUBLIC_CONTRACT_ADDRESS, or use ngrok.
export const wagmiChains = [sepolia, hardhat] as const satisfies readonly [
  typeof sepolia,
  ...typeof hardhat[]
];

// ─── Wagmi Adapter ───────────────────────────────────────────────────────────
export const wagmiAdapter = new WagmiAdapter({
  networks: wagmiChains,
  projectId,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Convert to Reown Network[] for createAppKit
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const appKitNetworks = formatNetworks(wagmiChains as any) as any[];

// ─── AppKit Singleton ────────────────────────────────────────────────────────
type AppKitInstance = ReturnType<typeof createAppKit>;
let _appKit: AppKitInstance | null = null;

export function initAppKit(): AppKitInstance {
  if (_appKit) return _appKit;

  _appKit = createAppKit({
    projectId,
    networks: appKitNetworks,
    adapters: [wagmiAdapter],
    metadata,
    storage: appKitStorage,
  });

  return _appKit;
}
