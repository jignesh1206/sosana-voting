'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useStaticContext } from '@/context/StaticContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import VoteButton from '@/components/voting/VoteButton';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { TokenType } from '@/types';

interface TokenListProps {
  className?: string;
  showVoteButton?: boolean;
  onVote?: (tokenId: string) => void;
  roundType?: TokenType;
  roundId?: string;
}

export default function TokenList({ 
  className = '',
  showVoteButton = false,
  onVote,
  roundType = 'live',
  roundId
}: TokenListProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { publicKey } = useWallet();
  const { getTokensForRound } = useStaticContext();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isClient) {
    return (
      <div className={`space-y-4 ${className}`}>
        <LoadingSpinner size="lg" text="Loading tokens..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <LoadingSpinner size="lg" text="Loading tokens..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary
        error={error}
        onRetry={() => {
          setError(null);
          setIsLoading(true);
          setTimeout(() => setIsLoading(false), 500);
        }}
        className={className}
        title="Error Loading Tokens"
        message="Failed to load token information"
      />
    );
  }

  // Get tokens from static data
  const tokens = roundId ? getTokensForRound(roundId, roundType) : [];

  if (tokens.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Tokens Found</h3>
        <p className="text-foreground/60">
          {roundType === 'live' 
            ? 'No live tokens have been nominated for this round yet.'
            : 'No pre-launch projects have been submitted for this round yet.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {tokens.map((token: any) => (
        <div
          key={token._id}
          className="cosmic-card p-4 border border-card-border hover:border-accent/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Token Logo */}
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <img
                  src={token.logoUrl || token.tokenLogo || '/placeholder.svg'}
                  alt={token.name || token.tokenName}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>

              {/* Token Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-foreground">
                    {token.name || token.tokenName}
                  </h4>
                  <span className="text-sm text-foreground/60">
                    ({token.symbol || token.tokenSymbol})
                  </span>
                  {token.isNominatedByUser && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      Your Nomination
                    </span>
                  )}
                  {token.isVotedByUser && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      Voted
                    </span>
                  )}
                </div>
                
                {roundType === 'pre-launch' && (
                  <p className="text-sm text-foreground/60 line-clamp-2">
                    {token.projectDescription}
                  </p>
                )}

                <div className="flex items-center space-x-4 mt-2 text-xs text-foreground/40">
                  <span>Votes: {token.voteCount || 0}</span>
                  <span>Value: {token.totalVoteValue || 0}</span>
                  {roundType === 'live' && (
                    <span>Nomination: {token.nominationValue || 0}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Vote Button */}
            {showVoteButton && onVote && publicKey && (
              <VoteButton
                tokenId={token._id}
                tokenName={token.name || token.tokenName}
                onVote={onVote}
                disabled={token.isVotedByUser}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 