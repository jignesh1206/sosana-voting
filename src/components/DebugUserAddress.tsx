'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAppSelector } from '@/store/hooks';

export default function DebugUserAddress() {
  const { publicKey, connected } = useWallet();
  const userAddress = useAppSelector((state) => state.user.address);
  const isConnected = useAppSelector((state) => state.user.isConnected);

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h4 className="font-bold mb-2">🔍 Debug Info</h4>
      <div className="space-y-1">
        <div>
          <strong>Wallet Connected:</strong> {connected ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Wallet Public Key:</strong> {publicKey ? publicKey.toString().slice(0, 8) + '...' : 'None'}
        </div>
        <div>
          <strong>Redux Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Redux Address:</strong> {userAddress ? userAddress.slice(0, 8) + '...' : 'None'}
        </div>
        <div>
          <strong>Address Match:</strong> {
            publicKey && userAddress && publicKey.toString() === userAddress 
              ? '✅ Yes' 
              : '❌ No'
          }
        </div>
      </div>
    </div>
  );
} 