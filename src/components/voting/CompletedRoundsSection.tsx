'use client';

import React from 'react';
import { TokenType } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

interface CompletedRoundsSectionProps {
  roundType: TokenType;
  roundsData?: any[];
  className?: string;
}

export default function CompletedRoundsSection({ 
  roundType, 
  roundsData = [],
  className = '' 
}: CompletedRoundsSectionProps) {
  const getCompletedRounds = () => {
    if (!roundsData || roundsData.length === 0) return [];
    
    return roundsData
      .filter((round: any) => 
        round.roundType === roundType && 
        ['completed', 'results_declared'].includes(round.status)
      )
      .sort((a: any, b: any) => 
        new Date(b.votingEndDate).getTime() - new Date(a.votingEndDate).getTime()
      )
      .slice(0, 5); // Show only last 5 completed rounds
  };

  const completedRounds = getCompletedRounds();

  if (completedRounds.length === 0) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <div className="text-center py-4">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {roundType === 'live' ? 'No Completed Live Token Rounds' : 'No Completed Pre-Launch Rounds'}
          </h3>
          <p className="text-foreground/60">
            {roundType === 'live'
              ? 'No live token rounds have been completed yet.'
              : 'No pre-launch rounds have been completed yet.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {roundType === 'live' ? '🏆 Completed Live Token Rounds' : '🏆 Completed Pre-Launch Rounds'}
        </h3>
        <span className="text-sm text-foreground/60">
          {completedRounds.length} round{completedRounds.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {completedRounds.map((round: any) => (
          <div 
            key={round._id} 
            className="border border-card-border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-foreground">
                  Round {round.round}
                  {round.roundName && (
                    <span className="text-sm text-foreground/60 ml-2">
                      ({round.roundName})
                    </span>
                  )}
                </h4>
                <p className="text-sm text-foreground/60">
                  Completed {format(new Date(round.votingEndDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  round.status === 'results_declared' 
                    ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-400/50'
                    : 'bg-emerald-900/40 text-emerald-300 border border-emerald-400/50'
                }`}>
                  {round.status === 'results_declared' ? 'Results Declared' : 'Completed'}
                </div>
              </div>
            </div>

            {/* Round Statistics */}
            {round.statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                <div className="text-center">
                  <div className="font-medium text-foreground">
                    {round.statistics.nominationsCount || 0}
                  </div>
                  <div className="text-foreground/60">Nominations</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-foreground">
                    {round.statistics.votesCount || 0}
                  </div>
                  <div className="text-foreground/60">Votes</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-foreground">
                    {round.statistics.participantsCount || 0}
                  </div>
                  <div className="text-foreground/60">Participants</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-foreground">
                    {round.statistics.totalVoteValue || 0}
                  </div>
                  <div className="text-foreground/60">Total Value</div>
                </div>
              </div>
            )}

            {/* Winners Section */}
            {round.results?.winners && round.results.winners.length > 0 && (
              <div className="border-t border-card-border pt-3">
                <h5 className="text-sm font-medium text-foreground mb-2">🏆 Winners</h5>
                <div className="space-y-2">
                  {round.results.winners.slice(0, 3).map((winner: any, index: number) => (
                    <div key={winner.tokenId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                        <div>
                          <div className="font-medium text-foreground">
                            {winner.name} ({winner.symbol})
                          </div>
                          <div className="text-foreground/60 text-xs">
                            {winner.voteCount} votes
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Results Button */}
            <div className="mt-3 pt-3 border-t border-card-border">
              <button className="w-full px-4 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors text-sm font-medium">
                View Full Results
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 