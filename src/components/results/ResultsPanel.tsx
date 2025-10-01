'use client';

import React, { useState } from 'react';
import { useGetAllResultsQuery, useGetResultsByRoundQuery, useDeclareResultsMutation } from '@/store/api/resultsApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface ResultsPanelProps {
  roundId?: string;
  className?: string;
  showDeclareButton?: boolean;
  onSuccess?: (action: string) => void;
  onError?: (error: string) => void;
}

export default function ResultsPanel({ 
  roundId,
  className = '',
  showDeclareButton = false,
  onSuccess,
  onError
}: ResultsPanelProps) {
  const [selectedRound, setSelectedRound] = useState<string>(roundId || '');

  // Query hooks
  const allResultsQuery = useGetAllResultsQuery();
  const roundResultsQuery = useGetResultsByRoundQuery(selectedRound, { skip: !selectedRound });
  const [declareResults, { isLoading: isDeclaring }] = useDeclareResultsMutation();

  const handleDeclareResults = async () => {
    if (!selectedRound) {
      onError?.('No round selected for result declaration');
      return;
    }

    try {
      await declareResults(selectedRound).unwrap();
      onSuccess?.('declare results');
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to declare results';
      onError?.(errorMessage);
    }
  };

  const isLoading = allResultsQuery.isLoading || roundResultsQuery.isLoading;
  const hasError = allResultsQuery.error || roundResultsQuery.error;

  if (isLoading) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading results..." />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <ErrorBoundary
          error={hasError}
          onRetry={() => {
            allResultsQuery.refetch();
            roundResultsQuery.refetch();
          }}
          title="Error Loading Results"
          message="Failed to load voting results"
        />
      </div>
    );
  }

  const allResults = allResultsQuery.data?.data;
  const roundResults = roundResultsQuery.data?.data;

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">🏆 Voting Results</h2>
        {showDeclareButton && selectedRound && (
          <button
            onClick={handleDeclareResults}
            disabled={isDeclaring}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 transition-colors"
          >
            {isDeclaring ? 'Declaring...' : 'Declare Results'}
          </button>
        )}
      </div>

      {/* Round Selection */}
      {!roundId && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Select Round for Detailed Results
          </label>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">All Rounds</option>
            {allResults?.map((result: any) => (
              <option key={result.roundId || result.round} value={result.roundId || result.round}>
                Round {result.round || result.roundId} - {result.roundName || 'Voting Round'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Results Summary */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">📊 All Rounds Summary</h3>
          {allResults && allResults.length > 0 ? (
            <div className="space-y-3">
              {allResults.map((result: any) => (
                <div key={result.roundId || result.round} className="p-3 rounded-lg border border-card-border bg-secondary/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">
                      Round {result.round || result.roundId}
                    </h4>
                    <span className="text-sm text-foreground/60">
                      {result.totalVotes || 0} votes
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60">
                    {result.totalTokens || 0} tokens nominated
                  </p>
                  {result.winners && result.winners.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-foreground/60 mb-1">Winner(s):</p>
                      <div className="flex flex-wrap gap-1">
                        {result.winners.slice(0, 3).map((winner: any, index: number) => (
                          <span key={winner.tokenId} className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">
                            {winner.symbol || winner.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/60">No results available yet.</p>
          )}
        </div>

        {/* Detailed Round Results */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            📋 {selectedRound ? `Round ${selectedRound} Details` : 'Select a Round'}
          </h3>
          {selectedRound && roundResults ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                <h4 className="font-medium text-foreground mb-2">Round Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-foreground/60">Total Tokens</p>
                    <p className="font-medium text-foreground">{roundResults.totalTokens || 0}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Total Votes</p>
                    <p className="font-medium text-foreground">{roundResults.totalVotes || 0}</p>
                  </div>
                </div>
              </div>

              {roundResults.winners && roundResults.winners.length > 0 && (
                <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                  <h4 className="font-medium text-foreground mb-3">🏆 Winners</h4>
                  <div className="space-y-2">
                    {roundResults.winners.map((winner: any, index: number) => (
                      <div key={winner.tokenId} className="flex items-center justify-between p-2 bg-background/50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                          <span className="font-medium text-foreground">{winner.symbol || winner.name}</span>
                        </div>
                        <span className="text-sm font-medium text-accent">{winner.voteCount || 0} votes</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {roundResults.allResults && roundResults.allResults.length > 0 && (
                <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                  <h4 className="font-medium text-foreground mb-3">📊 All Results</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {roundResults.allResults.map((result: any, index: number) => (
                      <div key={result.tokenId} className="flex items-center justify-between p-2 bg-background/50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-foreground/60">#{index + 1}</span>
                          <span className="font-medium text-foreground">{result.symbol || result.name}</span>
                        </div>
                        <span className="text-sm text-foreground/60">{result.voteCount || 0} votes</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : selectedRound ? (
            <p className="text-foreground/60">No detailed results available for this round.</p>
          ) : (
            <p className="text-foreground/60">Select a round to view detailed results.</p>
          )}
        </div>
      </div>
    </div>
  );
} 