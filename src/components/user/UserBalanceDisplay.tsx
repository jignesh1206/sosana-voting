'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useStaticContext } from '@/context/StaticContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface UserBalanceDisplayProps {
  className?: string;
  showRefreshButton?: boolean;
}

export default function UserBalanceDisplay({ 
  className = '',
  showRefreshButton = true
}: UserBalanceDisplayProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { connected, publicKey } = useWallet();
  const { userBalance } = useStaticContext();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  if (!isClient) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading balance..." />
      </div>
    );
  }

  if (!connected || !publicKey) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-bold text-foreground mb-2">Wallet Not Connected</h3>
          <p className="text-foreground/60">
            Please connect your Solana wallet to view your balance.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading balance..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary
        error={error}
        onRetry={handleRefresh}
        className={className}
        title="Error Loading Balance"
        message="Failed to load user balance information"
      />
    );
  }

  const { balance, spentBalance, availableBalance, currency } = userBalance;
  const userAddress = publicKey.toString();

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">💰 User Balance</h2>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-foreground/60">
            {userAddress.slice(0, 4)}...{userAddress.slice(-4)}
          </div>
          {showRefreshButton && (
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-3 py-1 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm"
              title="Refresh balance"
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
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Balance */}
        <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground/80">Total Balance</p>
            <div className="text-xs text-foreground/60">{currency}</div>
          </div>
          <p className="text-2xl font-bold text-accent">
            {balance.toLocaleString()}
          </p>
          <p className="text-sm text-foreground/60 mt-1">
            Your total {currency} balance
          </p>
        </div>

        {/* Available Balance */}
        <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground/80">Available</p>
            <div className="text-xs text-foreground/60">{currency}</div>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {availableBalance.toLocaleString()}
          </p>
          <p className="text-sm text-foreground/60 mt-1">
            Available for voting/nominations
          </p>
        </div>

        {/* Spent Balance */}
        <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground/80">Spent</p>
            <div className="text-xs text-foreground/60">{currency}</div>
          </div>
          <p className="text-2xl font-bold text-orange-400">
            {spentBalance.toLocaleString()}
          </p>
          <p className="text-sm text-foreground/60 mt-1">
            Used for voting/nominations
          </p>
        </div>
      </div>

    </div>
  );
} 