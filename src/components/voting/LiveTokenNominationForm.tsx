'use client';

import React, { useState } from 'react';
import { useSubmitNominationMutation } from '@/store/api/votingApi';
import { useAppSelector } from '@/store/hooks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface LiveTokenNominationFormProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function LiveTokenNominationForm({ 
  className = '',
  onSuccess,
  onError
}: LiveTokenNominationFormProps) {
  const [tokenMintAddress, setTokenMintAddress] = useState('');
  const [error, setError] = useState('');
  const userAddress = useAppSelector((state) => state.user.address);
  const [submitNomination, { isLoading }] = useSubmitNominationMutation();

  const validateForm = (): boolean => {
    if (!tokenMintAddress.trim()) {
      setError('Token mint address is required');
      return false;
    } else if (tokenMintAddress.length < 32) {
      setError('Invalid token mint address format');
      return false;
    }
    setError('');
    return true;
  };

  const handleInputChange = (value: string) => {
    setTokenMintAddress(value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      // For now, we'll use the regular nomination endpoint
      // The backend will need to handle live token nominations differently
      await submitNomination({
        tokenMintAddress: tokenMintAddress.trim(),
        name: '', // Will be fetched from blockchain
        symbol: '', // Will be fetched from blockchain
        decimals: 0, // Will be fetched from blockchain
        supply: '0', // Will be fetched from blockchain
        chain: 'solana',
        category: 'live',
        description: 'Live token nomination',
        signature: '', // Will be added by backend
        message: '', // Will be added by backend
        timestamp: Date.now()
      }).unwrap();

      setTokenMintAddress('');
      onSuccess?.();
    } catch (err: any) {
      console.error('Nomination error details:', err);
      const errorMessage = err?.data?.message || err?.data?.error || err?.error || 'Failed to submit nomination. Please ensure your wallet is connected and you have sufficient balance.';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="tokenMintAddress" className="block text-sm font-medium text-foreground mb-2">
            Token Mint Address *
          </label>
          <input
            type="text"
            id="tokenMintAddress"
            value={tokenMintAddress}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter Solana token mint address"
            className={`w-full px-4 py-3 rounded-lg border bg-card-highlight text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors ${
              error ? 'border-red-500' : 'border-card-border'
            }`}
            disabled={isLoading}
          />
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
          <p className="mt-2 text-sm text-foreground/60">
            Enter the mint address of an existing token on Solana. We'll automatically fetch the token details.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-foreground/60">
            Connected: {userAddress ? `${userAddress.slice(0, 4)}...${userAddress.slice(-4)}` : 'Not connected'}
          </div>
          <button
            type="submit"
            disabled={isLoading || !userAddress}
            className="flex items-center space-x-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>🪙</span>
                <span>Nominate Token</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 