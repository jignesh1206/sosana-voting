'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useStaticContext } from '@/context/StaticContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface VoteButtonProps {
  tokenId: string;
  tokenName: string;
  roundType?: string;
  className?: string;
  onVote?: (tokenId: string) => void;
  disabled?: boolean;
}

export default function VoteButton({ 
  tokenId, 
  tokenName, 
  roundType = 'live',
  className = '',
  onVote,
  disabled = false
}: VoteButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey } = useWallet();
  const { voteForToken } = useStaticContext();

  const handleVote = async () => {
    if (!publicKey) {
      console.error('Please connect your wallet to vote');
      return;
    }

    if (!tokenId) {
      console.error('Invalid token ID');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call delay
      await voteForToken(tokenId, roundType as 'live' | 'pre-launch');
      
      setShowConfirmation(false);
      onVote?.(tokenId);
      console.log(`Successfully voted for ${tokenName}`);
    } catch (error: any) {
      console.error('Failed to submit vote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <button
        disabled
        className={`px-4 py-2 rounded-lg bg-gray-500 text-white cursor-not-allowed ${className}`}
        title="Connect wallet to vote"
      >
        🔗 Connect Wallet
      </button>
    );
  }

  if (showConfirmation) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={handleVote}
          disabled={isLoading || disabled}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Voting...</span>
            </>
          ) : (
            <>
              <span>✅</span>
              <span>Confirm Vote</span>
            </>
          )}
        </button>
        <button
          onClick={() => setShowConfirmation(false)}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirmation(true)}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${className}`}
      title={`Vote for ${tokenName}`}
    >
      🗳️ Vote
    </button>
  );
} 