'use client';

import React from 'react';
import { TokenType } from '@/types';
import CountdownTimer from '@/components/ui/CountdownTimer';
import NominationPhase from './phases/NominationPhase';
import VotingPhase from './phases/VotingPhase';

interface ActiveRoundSectionProps {
  round: any;
  roundType: TokenType;
  className?: string;
}

export default function ActiveRoundSection({ 
  round, 
  roundType, 
  className = '' 
}: ActiveRoundSectionProps) {
  const isNominating = round.status === 'nominating';
  const isVoting = round.status === 'voting';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nominating':
        return 'bg-blue-900/30 text-blue-400 border-blue-400/30';
      case 'voting':
        return 'bg-green-900/30 text-green-400 border-green-400/30';
      default:
        return 'bg-card-highlight text-accent border-accent/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'nominating':
        return '📝';
      case 'voting':
        return '🗳️';
      default:
        return '🔄';
    }
  };

  const getPhaseTitle = () => {
    if (isNominating) {
      return roundType === 'live' ? 'Live Token Nomination' : 'Pre-Launch Token Nomination';
    }
    if (isVoting) {
      return roundType === 'live' ? 'Live Token Voting' : 'Pre-Launch Token Voting';
    }
    return 'Active Round';
  };

  const getPhaseDescription = () => {
    if (isNominating) {
      return roundType === 'live' 
        ? 'Nominate your favorite live tokens for this round'
        : 'Submit pre-launch token projects for community voting';
    }
    if (isVoting) {
      return roundType === 'live'
        ? 'Vote for the best live tokens in this round'
        : 'Vote for the most promising pre-launch projects';
    }
    return 'Round is currently active';
  };

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      {/* Round Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {getPhaseTitle()}
          </h2>
          <p className="text-foreground/60">
            {getPhaseDescription()}
          </p>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(round.status)}`}>
            <span className="mr-2">{getStatusIcon(round.status)}</span>
            {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
          </div>
        </div>
      </div>

      {/* Round Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
          <h4 className="font-medium text-foreground mb-2">Round Info</h4>
          <p className="text-sm text-foreground/60">
            Round {round.round}
            {round.roundName && (
              <span className="block text-xs text-foreground/40">
                {round.roundName}
              </span>
            )}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
          <h4 className="font-medium text-foreground mb-2">Current Phase</h4>
          <p className="text-sm text-foreground/60">
            {isNominating ? 'Nominating tokens...' : 'Voting in progress...'}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
          <h4 className="font-medium text-foreground mb-2">
            {isNominating ? 'Nomination Ends' : 'Voting Ends'}
          </h4>
          <div className="text-sm">
            <CountdownTimer 
              targetDate={isNominating ? round.nominationEndDate : round.votingEndDate}
              mode="ends"
              compact={true}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Phase Content */}
      {isNominating && (
        <NominationPhase 
          round={round} 
          roundType={roundType} 
        />
      )}

      {isVoting && (
        <VotingPhase 
          round={round} 
          roundType={roundType} 
        />
      )}
    </div>
  );
} 