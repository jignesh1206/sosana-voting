'use client';

import React from 'react';
import { TokenType } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { format } from 'date-fns';

interface UpcomingRoundsSectionProps {
  roundType: TokenType;
  roundsData?: any[];
  className?: string;
}

export default function UpcomingRoundsSection({ 
  roundType, 
  roundsData = [],
  className = '' 
}: UpcomingRoundsSectionProps) {
  const getUpcomingRounds = () => {
    if (!roundsData || roundsData.length === 0) return [];
    
    const now = new Date();
    return roundsData
      .filter((round: any) => 
        round.roundType === roundType && 
        round.status === 'scheduled' &&
        new Date(round.nominationStartDate) > now
      )
      .sort((a: any, b: any) => 
        new Date(a.nominationStartDate).getTime() - new Date(b.nominationStartDate).getTime()
      )
      .slice(0, 3); // Show only next 3 upcoming rounds
  };

  const upcomingRounds = getUpcomingRounds();

  if (upcomingRounds.length === 0) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <div className="text-center py-4">
          <div className="text-4xl mb-2">📅</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {roundType === 'live' ? 'No Upcoming Live Token Rounds' : 'No Upcoming Pre-Launch Rounds'}
          </h3>
          <p className="text-foreground/60">
            {roundType === 'live'
              ? 'No upcoming live token rounds are scheduled at the moment.'
              : 'No upcoming pre-launch rounds are scheduled at the moment.'
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
          {roundType === 'live' ? '📅 Upcoming Live Token Rounds' : '📅 Upcoming Pre-Launch Rounds'}
        </h3>
        <span className="text-sm text-foreground/60">
          {upcomingRounds.length} round{upcomingRounds.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {upcomingRounds.map((round: any) => (
          <div 
            key={round._id} 
            className="border border-card-border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
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
                  Starts {format(new Date(round.nominationStartDate), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-900/40 text-gray-300 border border-gray-400/50">
                  Scheduled
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-foreground/60">Nomination Period:</span>
                <div className="mt-1">
                  <CountdownTimer 
                    targetDate={round.nominationStartDate}
                    mode="starts"
                    compact={true}
                    size="sm"
                  />
                </div>
              </div>
              <div>
                <span className="text-foreground/60">Voting Period:</span>
                <div className="mt-1">
                  <CountdownTimer 
                    targetDate={round.votingStartDate}
                    mode="starts"
                    compact={true}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {round.description && (
              <p className="text-sm text-foreground/60 mt-2">
                {round.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 