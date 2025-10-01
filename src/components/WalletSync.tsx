'use client';

import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAppDispatch } from '@/store/hooks';
import { setWalletAddress, setConnectionStatus } from '@/store/slices/userSlice';

export default function WalletSync() {
  const { publicKey, connected, connecting, disconnecting } = useWallet();
  const dispatch = useAppDispatch();

  // Sync wallet state with Redux
  useEffect(() => {
    if (connected && publicKey) {
      dispatch(setWalletAddress(publicKey.toString()));
      dispatch(setConnectionStatus(true));
    } else if (!connected) {
      dispatch(setConnectionStatus(false));
      dispatch(setWalletAddress(null));
    }
  }, [connected, publicKey, dispatch]);

  // Handle connection states
  useEffect(() => {
    if (connecting) {
      console.log('🔄 Wallet connecting...');
    }
    if (disconnecting) {
      console.log('🔄 Wallet disconnecting...');
    }
  }, [connecting, disconnecting]);

  // This component doesn't render anything, it just syncs state
  return null;
} 