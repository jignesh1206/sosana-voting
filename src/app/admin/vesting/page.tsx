'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import vestingIdl from '../../../contracts/vesting.json';
import { AdminDashboard } from '../../../components/admin';

export default function VestingAdminPage() {
  const { connection } = useConnection();
  const { wallet, publicKey } = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize program
  useEffect(() => {
    const initializeProgram = async () => {
      if (wallet && connection) {
        try {
          const provider = new AnchorProvider(connection, wallet as any, {});
          // Use the program ID from the IDL metadata
          const programId = new PublicKey(vestingIdl.metadata?.address || process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID || "");
          const programInstance = new Program(vestingIdl as any, programId, provider);
          setProgram(programInstance);
        } catch (error) {
          console.error('Failed to initialize program:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeProgram();
  }, [wallet, connection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Initializing vesting contract...</div>
        </div>
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Required</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to access vesting admin functions</p>
          <div className="text-sm text-gray-500">
            Only authorized administrators can access this dashboard
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract Error</h2>
          <p className="text-gray-600 mb-6">Failed to initialize vesting contract</p>
          <div className="text-sm text-gray-500">
            Please check your network connection and try again
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard />
    </div>
  );
}