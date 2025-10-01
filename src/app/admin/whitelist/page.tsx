"use client";

import { useMemo, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import vestingIdl from '@/contracts/vesting.json';
import WhitelistManagement from '@/components/admin/WhitelistManagement';

export default function WhitelistPage() {
  const { connection } = useConnection();
  const { wallet, publicKey } = useWallet();
  const [program, setProgram] = useState<Program | null>(null);

  const provider = useMemo(() => {
    if (!wallet) return null as any;
    return new AnchorProvider(connection, wallet as any, {});
  }, [connection, wallet]);

  const programId = useMemo(() => {
    const id = process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID || "";
    return id ? new PublicKey(id) : null;
  }, []);

  useEffect(() => {
    if (provider && programId) {
      const programInstance = new Program(vestingIdl as any, programId, provider);
      setProgram(programInstance);
    } else {
      setProgram(null);
    }
  }, [provider, programId]);

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to access whitelist management</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <WhitelistManagement program={program} />
      </div>
    </div>
  );
}



