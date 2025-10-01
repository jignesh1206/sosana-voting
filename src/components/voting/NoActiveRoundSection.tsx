'use client';

import React from 'react';
import { TokenType } from '@/types';

interface NoActiveRoundSectionProps {
  roundType: TokenType;
  className?: string;
}

export default function NoActiveRoundSection({ 
  roundType, 
  className = '' 
}: NoActiveRoundSectionProps) {
  const getIcon = () => {
    return roundType === 'live' ? '🪙' : '🚀';
  };

  const getTitle = () => {
    return roundType === 'live' ? 'No Active Live Token Round' : 'No Active Pre-Launch Round';
  };

  const getDescription = () => {
    return roundType === 'live'
      ? 'There is currently no active live token voting round. Check back later for new rounds or view upcoming rounds below.'
      : 'There is currently no active pre-launch token voting round. Check back later for new rounds or view upcoming rounds below.';
  };

  return (
    <div className={`cosmic-card p-8 text-center ${className}`}>
      <div className="text-6xl mb-4">{getIcon()}</div>
      <h3 className="text-xl font-bold text-foreground mb-2">
        {getTitle()}
      </h3>
      <p className="text-foreground/60 mb-6 max-w-md mx-auto">
        {getDescription()}
      </p>
      
      <div className="flex items-center justify-center space-x-4 text-sm text-foreground/40">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
          <span>No active round</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
          <span>Nominating phase</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          <span>Voting phase</span>
        </div>
      </div>
    </div>
  );
} 