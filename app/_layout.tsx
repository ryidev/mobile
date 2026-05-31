import 'react-native-get-random-values';
import '@walletconnect/react-native-compat';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppKit, AppKitProvider } from '@reown/appkit-react-native';

import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { WalletProvider } from '@/context/WalletContext';
import { wagmiConfig, initAppKit } from '@/lib/walletConnect';

// Initialize AppKit once and get the instance
const appKit = initAppKit();

const queryClient = new QueryClient();

function AppContent() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="forums" />
        <Stack.Screen name="vote/[id]" />
      </Stack>
      {/* WalletConnect modal overlay */}
      <AppKit />
    </>
  );
}

export default function RootLayout() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* AppKitProvider takes the AppKit instance directly */}
        <AppKitProvider instance={appKit}>
          <ThemeProvider>
            <WalletProvider>
              <AppContent />
            </WalletProvider>
          </ThemeProvider>
        </AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
