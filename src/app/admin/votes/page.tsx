'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGetAllAdminVotesQuery, useGetAdminVotesQuery, useRemoveVoteMutation, useGetAdminRoundsQuery } from '@/store/api/adminApi';
import { toast } from 'react-toastify';

interface Vote {
  _id: string;
  round: number;
  userAddress: string;
  voteValue: number;
  voteDate?: string;
  createdAt?: string;
  tokenId: {
    _id: string;
    symbol: string;
    name: string;
    tokenAddress: string;
  };
}

export default function VotesPage() {
  const [selectedRound, setSelectedRound] = useState<string>('all');

  // RTK Query hooks
  const { data: roundsResponse, isLoading: roundsLoading } = useGetAdminRoundsQuery();
  const { data: allVotesResponse, isLoading: allVotesLoading, refetch: refetchAllVotes } = useGetAllAdminVotesQuery(undefined, {
    skip: selectedRound !== 'all'
  });
  const { data: roundVotesResponse, isLoading: roundVotesLoading, refetch: refetchRoundVotes } = useGetAdminVotesQuery(selectedRound, {
    skip: selectedRound === 'all'
  });
  const [removeVote, { isLoading: isRemoving }] = useRemoveVoteMutation();

  // Get the appropriate data based on selected round
  const votes = selectedRound === 'all' 
    ? allVotesResponse?.data || []
    : roundVotesResponse?.data || [];
  
  const rounds = roundsResponse?.data || [];
  const isLoading = roundsLoading || (selectedRound === 'all' ? allVotesLoading : roundVotesLoading);

  const handleRefresh = () => {
    if (selectedRound === 'all') {
      refetchAllVotes();
    } else {
      refetchRoundVotes();
    }
  };

  const handleRemoveVote = async (voteId: string) => {
    if (!confirm('Are you sure you want to remove this vote?')) {
      return;
    }

    try {
      await removeVote(voteId).unwrap();
      toast.success('Vote removed successfully!');
      handleRefresh(); // Refresh the list
    } catch (error: any) {
      console.error('Error removing vote:', error);
      toast.error(error?.data?.error || 'Failed to remove vote');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-foreground">Loading votes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Votes Management</h1>
          <p className="text-foreground/60">View and manage all votes</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          title="Refresh votes"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="cosmic-card p-4">
        <div className="flex items-center space-x-4">
          <label className="text-foreground font-medium">Filter by Round:</label>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="px-3 py-2 bg-background border border-card-border rounded-md text-foreground"
          >
            <option value="all">All Rounds</option>
            {rounds.map((round) => (
              <option key={round._id} value={round.round}>
                Round {round.round} - {round.roundName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Votes Table */}
      <div className="cosmic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-card-border">
            <thead className="bg-card-highlight">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Round</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Token</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Voter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Vote Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {votes && votes.length > 0 ? votes.map((vote) => (
                <tr key={vote._id} className="hover:bg-card-highlight transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/admin/rounds/${vote.round}`}
                      className="text-accent hover:text-accent/80 font-medium"
                    >
                      Round {vote.round}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-foreground font-medium">{vote.tokenId?.symbol || 'Unknown'}</div>
                    <div className="text-foreground/60 text-sm">{vote.tokenId?.name || 'Unknown Token'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground/60 text-sm">
                    {formatAddress(vote.userAddress)}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(vote.userAddress);
                        toast.success('Address copied to clipboard');
                      }}
                      className="ml-2 text-xs text-accent hover:text-accent/80"
                      title="Copy address"
                    >
                      📋
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">
                    {formatCurrency(vote.voteValue || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground/60 text-sm">
                    {formatDate(vote.createdAt || vote.voteDate || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleRemoveVote(vote._id)}
                      disabled={isRemoving}
                      className="text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded text-xs border border-red-400/30 hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRemoving ? 'Removing...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-foreground/60">
                    No votes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {votes.length === 0 && (
        <div className="cosmic-card p-8 text-center">
          <div className="text-foreground/60">No votes found</div>
        </div>
      )}
    </div>
  );
} 