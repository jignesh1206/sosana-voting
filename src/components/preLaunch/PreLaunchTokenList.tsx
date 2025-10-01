'use client';

import React, { useState, useEffect } from 'react';
import { useGetPreLaunchTokensQuery } from '@/store/api/preLaunchApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/20/solid';

interface PreLaunchTokenListProps {
  className?: string;
  showAdminActions?: boolean;
  onApprove?: (tokenId: string) => void;
  onReject?: (tokenId: string, reason: string) => void;
}

export default function PreLaunchTokenList({ 
  className = '',
  showAdminActions = false,
  onApprove,
  onReject
}: PreLaunchTokenListProps) {
  const [isClient, setIsClient] = useState(false);
  const { data: response, isLoading, error, refetch } = useGetPreLaunchTokensQuery();

  // Extract tokens from response, ensuring it's always an array
  // Pre-launch API returns { success: true, data: [] }
  const tokens = response?.data || [];

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading pre-launch tokens..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading pre-launch tokens..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary
        error={error}
        onRetry={refetch}
        className={className}
        title="Error Loading Pre-Launch Tokens"
        message="Failed to load pre-launch tokens"
      />
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Pre-Launch Tokens</h3>
          <p className="text-foreground/60">
            No pre-launch tokens have been nominated yet.
          </p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-900/30 text-green-400 border-green-400/30';
      case 'rejected':
        return 'bg-red-900/30 text-red-400 border-red-400/30';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-400/30';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-400/30';
    }
  };

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">🚀 Pre-Launch Tokens</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-foreground/60">
            {tokens.length} token{tokens.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-3 py-1 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm"
            title="Refresh tokens"
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

      <div className="space-y-4">
        {tokens.map((token) => (
          <div
            key={token.id}
            className="p-4 rounded-lg border border-card-border bg-secondary/20 hover:bg-card-highlight/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {token.tokenName} ({token.tokenSymbol})
                  </h3>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(token.status)}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        token.status
                      )}`}
                    >
                      {token.status.charAt(0).toUpperCase() + token.status.slice(1)}
                    </span>
                  </div>
                </div>

                <p className="text-foreground/80 text-sm mb-3 line-clamp-2">
                  {token.projectDescription}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-foreground/60">Blockchain:</span>
                    <p className="font-medium">{token.targetBlockchain}</p>
                  </div>
                  <div>
                    <span className="text-foreground/60">Launch Date:</span>
                    <p className="font-medium">
                      {new Date(token.expectedLaunchDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-foreground/60">Votes:</span>
                    <p className="font-medium">{token.votesReceived}</p>
                  </div>
                  <div>
                    <span className="text-foreground/60">Nominated:</span>
                    <p className="font-medium">
                      {new Date(token.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Social Links */}
                {(token.website || token.twitter || token.telegram || token.discord) && (
                  <div className="mt-3 flex items-center space-x-3">
                    {token.website && (
                      <a
                        href={token.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent/80 text-sm"
                      >
                        🌐 Website
                      </a>
                    )}
                    {token.twitter && (
                      <a
                        href={token.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent/80 text-sm"
                      >
                        🐦 Twitter
                      </a>
                    )}
                    {token.telegram && (
                      <a
                        href={token.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent/80 text-sm"
                      >
                        📱 Telegram
                      </a>
                    )}
                    {token.discord && (
                      <a
                        href={token.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent/80 text-sm"
                      >
                        💬 Discord
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {showAdminActions && token.status === 'pending' && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onApprove?.(token.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject?.(token.id, 'Rejected by admin')}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 