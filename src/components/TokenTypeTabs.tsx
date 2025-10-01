'use client';

import React from 'react';
import { useStaticContext } from '@/context/StaticContext';
import { TokenType } from '@/types';

interface TokenTypeTabsProps {
  activeTab: TokenType;
  onTabChange: (tab: TokenType) => void;
  liveTokensCount?: number;
  preLaunchTokensCount?: number;
  className?: string;
}

export default function TokenTypeTabs({
  activeTab,
  onTabChange,
  liveTokensCount,
  preLaunchTokensCount,
  className = ''
}: TokenTypeTabsProps) {
  const { getCurrentRound, getTokensForRound } = useStaticContext();

  // Get current active rounds for both types
  const liveRound = getCurrentRound('live');
  const preLaunchRound = getCurrentRound('pre-launch');

  // Get token counts from static data
  const liveTokens = liveRound ? getTokensForRound(liveRound._id, 'live') : [];
  const preLaunchTokens = preLaunchRound ? getTokensForRound(preLaunchRound._id, 'pre-launch') : [];

  // Get actual counts
  const actualLiveCount = liveTokensCount || liveTokens.length;
  const actualPreLaunchCount = preLaunchTokensCount || preLaunchTokens.length;

  // Check if rounds are active
  const isLiveActive = liveRound && ['nominating', 'voting'].includes(liveRound.status);
  const isPreLaunchActive = preLaunchRound && ['nominating', 'voting'].includes(preLaunchRound.status);

  return (
    <div className={`flex space-x-1 p-1 bg-secondary/30 rounded-lg ${className}`}>
      <button
        onClick={() => onTabChange('live')}
        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md font-medium transition-all duration-200 ${
          activeTab === 'live'
            ? 'bg-accent text-white shadow-lg'
            : 'text-foreground/60 hover:text-foreground hover:bg-secondary/50'
        }`}
      >
        <span className="mr-2">🪙</span>
        Live Tokens
        {isLiveActive && (
          <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        )}
        {actualLiveCount > 0 && (
          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'live' 
              ? 'bg-white/20 text-white' 
              : 'bg-accent/20 text-accent'
          }`}>
            {actualLiveCount}
          </span>
        )}
      </button>
      
      <button
        onClick={() => onTabChange('pre-launch')}
        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md font-medium transition-all duration-200 ${
          activeTab === 'pre-launch'
            ? 'bg-accent text-white shadow-lg'
            : 'text-foreground/60 hover:text-foreground hover:bg-secondary/50'
        }`}
      >
        <span className="mr-2">🚀</span>
        Pre-launch Tokens
        {isPreLaunchActive && (
          <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        )}
        {actualPreLaunchCount > 0 && (
          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'pre-launch' 
              ? 'bg-white/20 text-white' 
              : 'bg-accent/20 text-accent'
          }`}>
            {actualPreLaunchCount}
          </span>
        )}
      </button>
    </div>
  );
} 