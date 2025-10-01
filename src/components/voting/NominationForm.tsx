'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useStaticContext } from '@/context/StaticContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface NominationFormProps {
  className?: string;
  onSuccess?: () => void;
  roundId?: string;
  roundType?: 'live' | 'pre-launch';
}

interface TokenInfo {
  mintAddress: string;
  name: string;
  symbol: string;
  logoUrl: string;
}

export default function NominationForm({ 
  className = '',
  onSuccess,
  roundId,
  roundType = 'live'
}: NominationFormProps) {
  const [mintAddress, setMintAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publicKey } = useWallet();
  const { nominateToken } = useStaticContext();

  // Mock token info for demonstration
  const mockTokenInfo: TokenInfo = {
    mintAddress: 'So11111111111111111111111111111111111111112',
    name: 'Solana',
    symbol: 'SOL',
    logoUrl: '/logo.png'
  };

  // Simulate token info fetch
  useEffect(() => {
    if (mintAddress && mintAddress.length >= 32) {
      // Simulate API delay
      const timer = setTimeout(() => {
        setTokenInfo(mockTokenInfo);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setTokenInfo(null);
    }
  }, [mintAddress]);

  const validateForm = (): boolean => {
    if (!mintAddress.trim()) {
      console.error('Token mint address is required');
      return false;
    }
    
    if (mintAddress.length < 32) {
      console.error('Invalid token mint address format');
      return false;
    }

    if (!tokenInfo) {
      console.error('Please enter a valid token mint address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      console.error('Please connect your wallet to nominate');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await nominateToken(mintAddress, roundType);
      setMintAddress('');
      setTokenInfo(null);
      onSuccess?.();
      console.log('Token nominated successfully!');
    } catch (error) {
      console.error('Failed to nominate token:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div>
        <label htmlFor="mintAddress" className="block text-sm font-medium text-foreground mb-2">
          Token Mint Address
        </label>
        <input
          type="text"
          id="mintAddress"
          value={mintAddress}
          onChange={(e) => setMintAddress(e.target.value)}
          placeholder="Enter Solana token mint address..."
          className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          disabled={isSubmitting}
        />
        <p className="text-xs text-foreground/60 mt-1">
          Enter the mint address of the token you want to nominate
        </p>
      </div>

      {/* Token Info Display */}
      {tokenInfo && (
        <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
          <div className="flex items-center space-x-3">
            <img
              src={tokenInfo.logoUrl}
              alt={tokenInfo.name}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <div>
              <h4 className="font-medium text-foreground">{tokenInfo.name}</h4>
              <p className="text-sm text-foreground/60">{tokenInfo.symbol}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !publicKey || !tokenInfo}
        className="w-full px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Nominating...</span>
          </>
        ) : (
          <>
            <span>📝</span>
            <span>Nominate Token</span>
          </>
        )}
      </button>

      {!publicKey && (
        <p className="text-sm text-red-400 text-center">
          Please connect your wallet to nominate tokens
        </p>
      )}
    </form>
  );
} 