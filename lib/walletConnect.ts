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

const customHardhat = {
  ...hardhat,
  rpcUrls: {
    ...hardhat.rpcUrls,
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
};

export const wagmiChains = [sepolia, customHardhat] as const satisfies readonly [
  typeof sepolia,
  ...any[]
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
    customWallets: [
      {
        id: 'metaMask',
        name: 'MetaMask',
        homepage: 'https://metamask.io',
        image_url: 'https://registry.walletconnect.org/v2/logo/md/5195e9db-94d8-4579-6f11-ef553be95100',
        mobile_link: 'metamask://',
        app_store: 'https://apps.apple.com/us/app/metamask/id1438144202',
        play_store: 'https://play.google.com/store/apps/details?id=io.metamask',
      },
    ],
  });

  return _appKit;
}
