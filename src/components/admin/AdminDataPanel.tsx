'use client';

import React from 'react';
import { 
  useGetAdminVotesQuery,
  useGetAdminNominationsQuery,
  useGetAllAdminVotesQuery,
  useGetAllAdminNominationsQuery
} from '@/store/api/adminApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface AdminDataPanelProps {
  roundId?: string;
  className?: string;
}

export default function AdminDataPanel({ 
  roundId,
  className = ''
}: AdminDataPanelProps) {
  // Query hooks
  const adminVotesQuery = useGetAdminVotesQuery(roundId || '', { skip: !roundId });
  const adminNominationsQuery = useGetAdminNominationsQuery(roundId || '', { skip: !roundId });
  const allAdminVotesQuery = useGetAllAdminVotesQuery();
  const allAdminNominationsQuery = useGetAllAdminNominationsQuery();

  const isLoading = adminVotesQuery.isLoading || adminNominationsQuery.isLoading || 
                   allAdminVotesQuery.isLoading || allAdminNominationsQuery.isLoading;

  const hasError = adminVotesQuery.error || adminNominationsQuery.error || 
                  allAdminVotesQuery.error || allAdminNominationsQuery.error;

  if (isLoading) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading admin data..." />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <ErrorBoundary
          error={hasError}
          onRetry={() => {
            adminVotesQuery.refetch();
            adminNominationsQuery.refetch();
            allAdminVotesQuery.refetch();
            allAdminNominationsQuery.refetch();
          }}
          title="Error Loading Admin Data"
          message="Failed to load admin votes and nominations"
        />
      </div>
    );
  }

  const votes = roundId ? adminVotesQuery.data?.data : allAdminVotesQuery.data?.data;
  const nominations = roundId ? adminNominationsQuery.data?.data : allAdminNominationsQuery.data?.data;

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">📊 Admin Data Panel</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-foreground/60">
            {roundId ? `Round: ${roundId}` : 'All Rounds'}
          </span>
          <button
            onClick={() => {
              adminVotesQuery.refetch();
              adminNominationsQuery.refetch();
              allAdminVotesQuery.refetch();
              allAdminNominationsQuery.refetch();
            }}
            className="flex items-center space-x-2 px-3 py-1 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm"
            title="Refresh data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Votes Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <span>🗳️</span>
            <span>Votes</span>
            <span className="text-sm text-foreground/60">({votes?.length || 0})</span>
          </h3>
          
          {votes && votes.length > 0 ? (
            <div className="space-y-3">
              {votes.slice(0, 5).map((vote: any, index: number) => (
                <div key={vote.id || index} className="p-3 rounded-lg border border-card-border bg-secondary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {vote.tokenName || vote.tokenSymbol || 'Unknown Token'}
                    </span>
                    <span className="text-xs text-foreground/60">
                      {new Date(vote.timestamp || vote.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-foreground/60">
                    <p>Voter: {vote.voterAddress || vote.userAddress || 'Unknown'}</p>
                    <p>Vote Count: {vote.voteCount || vote.amount || 1}</p>
                    {vote.roundId && <p>Round: {vote.roundId}</p>}
                  </div>
                </div>
              ))}
              {votes.length > 5 && (
                <p className="text-sm text-foreground/60 text-center">
                  Showing 5 of {votes.length} votes
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🗳️</div>
              <p className="text-foreground/60">No votes found</p>
            </div>
          )}
        </div>

        {/* Nominations Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <span>🚀</span>
            <span>Nominations</span>
            <span className="text-sm text-foreground/60">({nominations?.length || 0})</span>
          </h3>
          
          {nominations && nominations.length > 0 ? (
            <div className="space-y-3">
              {nominations.slice(0, 5).map((nomination: any, index: number) => (
                <div key={nomination.id || index} className="p-3 rounded-lg border border-card-border bg-secondary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {nomination.tokenName || nomination.tokenSymbol || 'Unknown Token'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      nomination.status === 'approved' 
                        ? 'bg-green-900/30 text-green-400 border border-green-400/30'
                        : nomination.status === 'rejected'
                        ? 'bg-red-900/30 text-red-400 border border-red-400/30'
                        : 'bg-yellow-900/30 text-yellow-400 border border-yellow-400/30'
                    }`}>
                      {nomination.status || 'pending'}
                    </span>
                  </div>
                  <div className="text-xs text-foreground/60">
                    <p>Nominator: {nomination.nominatorAddress || nomination.userAddress || 'Unknown'}</p>
                    <p>Date: {new Date(nomination.timestamp || nomination.createdAt).toLocaleDateString()}</p>
                    {nomination.roundId && <p>Round: {nomination.roundId}</p>}
                  </div>
                </div>
              ))}
              {nominations.length > 5 && (
                <p className="text-sm text-foreground/60 text-center">
                  Showing 5 of {nominations.length} nominations
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🚀</div>
              <p className="text-foreground/60">No nominations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 p-4 rounded-lg border border-card-border bg-secondary/20">
        <h3 className="text-lg font-semibold text-foreground mb-3">📈 Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-foreground/60">Total Votes:</p>
            <p className="font-medium text-accent">{votes?.length || 0}</p>
          </div>
          <div>
            <p className="text-foreground/60">Total Nominations:</p>
            <p className="font-medium text-blue-400">{nominations?.length || 0}</p>
          </div>
          <div>
            <p className="text-foreground/60">Approved Nominations:</p>
            <p className="font-medium text-green-400">
              {nominations?.filter((n: any) => n.status === 'approved').length || 0}
            </p>
          </div>
          <div>
            <p className="text-foreground/60">Pending Nominations:</p>
            <p className="font-medium text-yellow-400">
              {nominations?.filter((n: any) => n.status === 'pending').length || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 