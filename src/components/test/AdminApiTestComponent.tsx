'use client';

import React, { useState } from 'react';
import { 
  useGetAdminRoundsQuery, 
  useGetAllAdminNominationsQuery,
  useGetAllAdminVotesQuery,
  useGetTokenInfoQuery
} from '@/store/api/adminApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminApiTestComponent() {
  const [activeTab, setActiveTab] = useState<'rounds' | 'nominations' | 'votes' | 'token-info'>('rounds');
  const [testMintAddress, setTestMintAddress] = useState('So11111111111111111111111111111111111111112'); // SOL token
  
  const { data: roundsData, isLoading: roundsLoading, error: roundsError, refetch: refetchRounds } = useGetAdminRoundsQuery();
  const { data: nominationsData, isLoading: nominationsLoading, error: nominationsError, refetch: refetchNominations } = useGetAllAdminNominationsQuery();
  const { data: votesData, isLoading: votesLoading, error: votesError, refetch: refetchVotes } = useGetAllAdminVotesQuery();
  const { data: tokenInfoData, isLoading: tokenInfoLoading, error: tokenInfoError, refetch: refetchTokenInfo } = useGetTokenInfoQuery(testMintAddress);

  const isLoading = roundsLoading || nominationsLoading || votesLoading || tokenInfoLoading;
  const error = roundsError || nominationsError || votesError || tokenInfoError;

  const refetch = () => {
    refetchRounds();
    refetchNominations();
    refetchVotes();
    refetchTokenInfo();
  };

  if (isLoading) {
    return (
      <div className="cosmic-card p-6">
        <LoadingSpinner size="lg" text="Loading admin data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="cosmic-card p-6">
        <div className="text-center py-4">
          <div className="text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Admin Data</h3>
          <p className="text-foreground/60 mb-4">
            {error ? (typeof error === 'object' && 'message' in error ? error.message : 'Failed to load admin data') : 'Failed to load admin data'}
          </p>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const rounds = roundsData?.data || [];
  const nominations = nominationsData?.data || [];
  const votes = votesData?.data || [];

  return (
    <div className="cosmic-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Admin API Test - Complete Data
        </h3>
        <button 
          onClick={refetch}
          className="px-3 py-1 bg-accent/10 text-accent rounded text-sm hover:bg-accent/20"
        >
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4">
        <button
          onClick={() => setActiveTab('rounds')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            activeTab === 'rounds' 
              ? 'bg-accent text-white' 
              : 'bg-secondary/30 text-foreground/60 hover:text-foreground'
          }`}
        >
          Rounds ({rounds.length})
        </button>
        <button
          onClick={() => setActiveTab('nominations')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            activeTab === 'nominations' 
              ? 'bg-accent text-white' 
              : 'bg-secondary/30 text-foreground/60 hover:text-foreground'
          }`}
        >
          Nominations ({nominations.length})
        </button>
        <button
          onClick={() => setActiveTab('votes')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            activeTab === 'votes' 
              ? 'bg-accent text-white' 
              : 'bg-secondary/30 text-foreground/60 hover:text-foreground'
          }`}
        >
          Votes ({votes.length})
        </button>
        <button
          onClick={() => setActiveTab('token-info')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            activeTab === 'token-info' 
              ? 'bg-accent text-white' 
              : 'bg-secondary/30 text-foreground/60 hover:text-foreground'
          }`}
        >
          Token Info
        </button>
      </div>

      {/* Rounds Tab */}
      {activeTab === 'rounds' && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {rounds.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-foreground/60">No rounds found</p>
            </div>
          ) : (
            rounds.map((round: any) => (
              <div 
                key={round._id} 
                className="border border-card-border rounded-lg p-4 hover:bg-secondary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">
                    Round {round.round}
                    {round.roundName && (
                      <span className="text-sm text-foreground/60 ml-2">
                        ({round.roundName})
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      round.status === 'scheduled' ? 'bg-gray-900/40 text-gray-300' :
                      round.status === 'nominating' ? 'bg-blue-900/40 text-blue-300' :
                      round.status === 'voting' ? 'bg-green-900/40 text-green-300' :
                      round.status === 'completed' ? 'bg-emerald-900/40 text-emerald-300' :
                      'bg-card-highlight text-accent'
                    }`}>
                      {round.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      round.roundType === 'live' ? 'bg-blue-900/40 text-blue-300' : 'bg-purple-900/40 text-purple-300'
                    }`}>
                      {round.roundType}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-foreground/60">Nomination:</span>
                    <p className="text-foreground">
                      {new Date(round.nominationStartDate).toLocaleDateString()} - {new Date(round.nominationEndDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-foreground/60">Voting:</span>
                    <p className="text-foreground">
                      {new Date(round.votingStartDate).toLocaleDateString()} - {new Date(round.votingEndDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {round.statistics && (
                  <div className="mt-2 pt-2 border-t border-card-border">
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{round.statistics.nominationsCount || 0}</div>
                        <div className="text-foreground/60">Nominations</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{round.statistics.votesCount || 0}</div>
                        <div className="text-foreground/60">Votes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{round.statistics.participantsCount || 0}</div>
                        <div className="text-foreground/60">Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{round.statistics.totalVoteValue || 0}</div>
                        <div className="text-foreground/60">Total Value</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Nominations Tab */}
      {activeTab === 'nominations' && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {nominations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-foreground/60">No nominations found</p>
            </div>
          ) : (
            nominations.map((nomination: any) => (
              <div 
                key={nomination._id} 
                className="border border-card-border rounded-lg p-4 hover:bg-secondary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">
                    {nomination.tokenName || nomination.tokenSymbol || 'Unnamed Token'}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    nomination.roundType === 'live' ? 'bg-blue-900/40 text-blue-300' : 'bg-purple-900/40 text-purple-300'
                  }`}>
                    {nomination.roundType}
                  </span>
                </div>
                
                <div className="text-sm text-foreground/60 mb-2">
                  Round: {nomination.roundId || 'Unknown'}
                </div>
                
                <div className="text-sm text-foreground/60 mb-2">
                  Nominated by: {nomination.nomineeWallet || 'Unknown'}
                </div>

                {nomination.description && (
                  <p className="text-sm text-foreground/80">
                    {nomination.description.substring(0, 100)}...
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Votes Tab */}
      {activeTab === 'votes' && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {votes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🗳️</div>
              <p className="text-foreground/60">No votes found</p>
            </div>
          ) : (
            votes.map((vote: any) => (
              <div 
                key={vote._id} 
                className="border border-card-border rounded-lg p-4 hover:bg-secondary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">
                    Vote for {vote.tokenName || vote.tokenSymbol || 'Unknown Token'}
                  </h4>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-300">
                    {vote.voteCount || 0} votes
                  </span>
                </div>
                
                <div className="text-sm text-foreground/60 mb-2">
                  Round: {vote.roundId || 'Unknown'}
                </div>
                
                <div className="text-sm text-foreground/60 mb-2">
                  Voted by: {vote.userAddress || 'Unknown'}
                </div>

                {vote.totalVoteValue && (
                  <div className="text-sm text-foreground/60">
                    Value: {vote.totalVoteValue}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Token Info Tab */}
      {activeTab === 'token-info' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              value={testMintAddress}
              onChange={(e) => setTestMintAddress(e.target.value)}
              placeholder="Enter mint address"
              className="flex-1 px-3 py-2 bg-secondary/20 border border-card-border rounded text-foreground"
            />
            <button
              onClick={() => refetchTokenInfo()}
              className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80"
            >
              Fetch
            </button>
          </div>

          {tokenInfoLoading ? (
            <div className="flex items-center space-x-3 p-4 bg-secondary/20 border border-card-border rounded-lg">
              <LoadingSpinner size="sm" />
              <span className="text-foreground/60">Fetching token information...</span>
            </div>
          ) : tokenInfoError ? (
            <div className="p-4 bg-red-900/20 border border-red-400/30 rounded-lg">
              <p className="text-red-400 text-sm">
                Failed to fetch token information. Please check the mint address and try again.
              </p>
            </div>
          ) : tokenInfoData?.success ? (
            <div className="p-4 bg-green-900/20 border border-green-400/30 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Token Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-foreground/60">Name:</span>
                  <span className="ml-2 text-foreground">{tokenInfoData.data.name}</span>
                </div>
                <div>
                  <span className="text-foreground/60">Symbol:</span>
                  <span className="ml-2 text-foreground">{tokenInfoData.data.symbol}</span>
                </div>
                <div>
                  <span className="text-foreground/60">Mint Address:</span>
                  <span className="ml-2 text-foreground font-mono">{tokenInfoData.data.mintAddress}</span>
                </div>
                {tokenInfoData.data.logoUrl && (
                  <div>
                    <span className="text-foreground/60">Logo:</span>
                    <img 
                      src={tokenInfoData.data.logoUrl} 
                      alt={tokenInfoData.data.name}
                      className="ml-2 w-6 h-6 rounded inline-block"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-foreground/60">Enter a mint address to fetch token information</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 