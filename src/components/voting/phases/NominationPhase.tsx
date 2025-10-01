'use client';

import React, { useState } from 'react';
import { TokenType } from '@/types';
import { useStaticContext } from '@/context/StaticContext';
import NominationForm from '../NominationForm';
import PreLaunchNominationForm from '../../preLaunch/PreLaunchNominationForm';
import TokenList from '../TokenList';

interface NominationPhaseProps {
  round: any;
  roundType: TokenType;
  className?: string;
}

export default function NominationPhase({ 
  round, 
  roundType, 
  className = '' 
}: NominationPhaseProps) {
  const [showForm, setShowForm] = useState(false);
  const { nominateToken } = useStaticContext();

  const handleNominationSuccess = () => {
    setShowForm(false);
    // In a static design, we just show a success message
    console.log('Nomination submitted successfully!');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Nomination Form Section */}
      <div className="border border-card-border rounded-lg overflow-hidden">
        <div className="bg-secondary/20 p-4 border-b border-card-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {roundType === 'live' ? '📝 Nominate Live Token' : '📝 Submit Pre-Launch Project'}
              </h3>
              <p className="text-sm text-foreground/60">
                {roundType === 'live' 
                  ? 'Nominate your favorite live token for this round'
                  : 'Submit a pre-launch token project for community voting'
                }
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                showForm 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-accent text-white hover:bg-accent/80'
              }`}
            >
              {showForm ? 'Cancel' : 'Nominate Token'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="p-6">
            {roundType === 'live' ? (
              <NominationForm
                onSuccess={handleNominationSuccess}
                roundId={round.round.toString()}
                roundType={roundType}
              />
            ) : (
              <PreLaunchNominationForm
                onSuccess={handleNominationSuccess}
                roundId={round.round.toString()}
              />
            )}
          </div>
        )}
      </div>

      {/* Nominated Tokens List */}
      <div className="border border-card-border rounded-lg overflow-hidden">
        <div className="bg-secondary/20 p-4 border-b border-card-border">
          <h3 className="text-lg font-semibold text-foreground">
            {roundType === 'live' ? '📋 Nominated Live Tokens' : '📋 Submitted Pre-Launch Projects'}
          </h3>
          <p className="text-sm text-foreground/60">
            {roundType === 'live'
              ? 'View all nominated live tokens in this round'
              : 'View all submitted pre-launch projects in this round'
            }
          </p>
        </div>
        <div className="p-6">
          <TokenList 
            roundType={roundType}
            showVoteButton={false}
            roundId={round.round.toString()}
          />
        </div>
      </div>
    </div>
  );
} 