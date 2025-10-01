'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PreLaunchNominationForm from '@/components/PreLaunchNominationForm';
import { PreLaunchToken } from '@/components/interface';
import { toast } from 'react-toastify';

export default function PreLaunchNominatePage() {
  const wallet = useWallet();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = (token: PreLaunchToken) => {
    toast.success('Pre-launch token nominated successfully!');
    router.push('/vote');
  };

  const handleCancel = () => {
    router.push('/vote');
  };

  if (!wallet.connected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="cosmic-card p-8 text-center">
          <h1 className="text-3xl font-bold mb-4 text-foreground">🚀 Pre-Launch Token Nomination</h1>
          <p className="text-lg text-foreground/80 mb-6">
            You need to connect your Solana wallet to nominate pre-launch tokens.
          </p>
          <Link
            href="/vote"
            className="btn btn-primary px-6 py-3"
          >
            Go to Vote Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="cosmic-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">🚀 Nominate Pre-Launch Token</h1>
            <p className="text-foreground/80 mt-2">
              Submit detailed information about your upcoming token project
            </p>
          </div>
          <Link
            href="/vote"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            ← Back to Vote
          </Link>
        </div>

        <PreLaunchNominationForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          userAddress={wallet.publicKey?.toString() || ''}
        />
      </div>
    </div>
  );
} 