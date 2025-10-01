'use client';

import React, { useState, useEffect } from 'react';
import { TokenType } from '@/types';
import { useStaticContext } from '@/context/StaticContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ActiveRoundSection from './ActiveRoundSection';
import UpcomingRoundsSection from './UpcomingRoundsSection';
import CompletedRoundsSection from './CompletedRoundsSection';
import NoActiveRoundSection from './NoActiveRoundSection';

interface TokenRoundManagerProps {
  roundType: TokenType;
  className?: string;
}

export default function TokenRoundManager({ 
  roundType, 
  className = '' 
}: TokenRoundManagerProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { 
    getCurrentRound, 
    getUpcomingRounds, 
    getCompletedRounds 
  } = useStaticContext();

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
      <div className={`space-y-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading round data..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <LoadingSpinner size="lg" text={`Loading ${roundType} round data...`} />
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
        title={`Error Loading ${roundType} Round`}
        message={`Failed to load ${roundType} round information`}
      />
    );
  }

  // Get current active round for the specified type
  const currentRound = getCurrentRound(roundType);
  const upcomingRounds = getUpcomingRounds(roundType);
  const completedRounds = getCompletedRounds(roundType);

  // Debug: Log the rounds data and current round
  console.log('TokenRoundManager - roundType:', roundType);
  console.log('TokenRoundManager - currentRound:', currentRound);
  console.log('TokenRoundManager - upcomingRounds:', upcomingRounds);
  console.log('TokenRoundManager - completedRounds:', completedRounds);

  // Check if there's an active round (nominating or voting)
  const isActiveRound = currentRound && 
    ['nominating', 'voting'].includes(currentRound.status);

  console.log('TokenRoundManager - isActiveRound:', isActiveRound);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Active Round Section */}
      {isActiveRound ? (
        <ActiveRoundSection 
          round={currentRound} 
          roundType={roundType} 
        />
      ) : (
        <NoActiveRoundSection 
          roundType={roundType} 
        />
      )}

      {/* Upcoming Rounds Section */}
      <UpcomingRoundsSection 
        roundType={roundType} 
        roundsData={upcomingRounds}
      />

      {/* Completed Rounds Section */}
      <CompletedRoundsSection 
        roundType={roundType} 
        roundsData={completedRounds}
      />
    </div>
  );
} 