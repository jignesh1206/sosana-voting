'use client';

import React from 'react';
import { TokenType } from '@/types';
import { useWallet } from '@solana/wallet-adapter-react';
import { useStaticContext } from '@/context/StaticContext';
import TokenList from '../TokenList';

interface VotingPhaseProps {
  round: any;
  roundType: TokenType;
  className?: string;
}

export default function VotingPhase({
  round,
  roundType,
  className = ''
}: VotingPhaseProps) {
  const { publicKey } = useWallet();
  const { voteForToken } = useStaticContext();
  
  // In static design, we simulate user voting state
  const [userHasVoted, setUserHasVoted] = React.useState(false);
  const [userVote, setUserVote] = React.useState<any>(null);

  const handleVote = async (tokenId: string) => {
    if (!publicKey) return;
    
    try {
      await voteForToken(tokenId, roundType);
      setUserHasVoted(true);
      setUserVote({ tokenId, voteValue: 10 }); // Mock vote data
    } catch (error) {
      console.error('Voting failed:', error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Voting Instructions */}
      <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-2xl mr-3">🗳️</div>
          <div>
            <h3 className="text-lg font-semibold text-blue-300 mb-2">
              {roundType === 'live' ? 'Vote for Live Tokens' : 'Vote for Pre-Launch Projects'}
            </h3>
            <p className="text-blue-200/80 text-sm mb-3">
              {roundType === 'live'
                ? 'Cast your vote for the best live tokens in this round. Each vote costs tokens and helps determine the winners.'
                : 'Cast your vote for the most promising pre-launch projects. Each vote costs tokens and helps determine the winners.'
              }
            </p>
            <div className="text-xs text-blue-200/60">
              <p>• You can vote for only one token per round</p>
              <p>• Each vote has a cost (check your balance)</p>
              <p>• Voting ends when the timer reaches zero</p>
            </div>
          </div>
        </div>
      </div>

      {/* Show if user has already voted */}
      {userHasVoted && userVote && (
        <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">✅</div>
            <div>
              <h4 className="font-medium text-foreground">Voted</h4>
              <p className="text-xs text-foreground/40 mt-1">
                Vote Value: {userVote.voteValue || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tokens List with Voting */}
      <div className="border border-card-border rounded-lg overflow-hidden">
        <div className="bg-secondary/20 p-4 border-b border-card-border">
          <h3 className="text-lg font-semibold text-foreground">
            {roundType === 'live' ? '🪙 Live Tokens to Vote' : '🚀 Pre-Launch Projects to Vote'}
          </h3>
          <p className="text-sm text-foreground/60">
            {roundType === 'live'
              ? 'Select the live token you want to vote for in this round'
              : 'Select the pre-launch project you want to vote for in this round'
            }
          </p>
        </div>
        <div className="p-6">
          <TokenList 
            roundType={roundType}
            showVoteButton={!userHasVoted} // Hide vote button if user already voted
            roundId={round.round.toString()}
            onVote={handleVote}
          />
        </div>
      </div>
    </div>
  );
} 