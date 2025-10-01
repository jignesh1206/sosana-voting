'use client';

import { useState, useEffect } from 'react';
import { useGetWalletBalancesQuery } from '@/store/api/adminApi';
import { WalletBalances } from '@/store/api/adminApi';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorBoundary from '../ui/ErrorBoundary';

interface WalletBalancePanelProps {
  className?: string;
}

export default function WalletBalancePanel({ className = '' }: WalletBalancePanelProps) {
  const [isClient, setIsClient] = useState(false);
  const { data: balanceData, isLoading, error, refetch } = useGetWalletBalancesQuery();

  // Debug logging
  console.log('WalletBalancePanel - balanceData:', balanceData);
  console.log('WalletBalancePanel - isLoading:', isLoading);
  console.log('WalletBalancePanel - error:', error);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading wallet balances..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading wallet balances..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary
        error={error}
        onRetry={refetch}
        className={className}
        title="Error Loading Wallet Balances"
        message="Failed to load wallet balance data"
      />
    );
  }

  const balances: WalletBalances = balanceData?.data || {};

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(balance);
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'LP Wallet':
        return '💧';
      case 'Marketing Wallet':
        return '📢';
      case 'Fee Vault':
        return '💰';
      case 'Withdraw Authority':
        return '🔐';
      default:
        return '💼';
    }
  };

  const getWalletColor = (type: string) => {
    switch (type) {
      case 'LP Wallet':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'Marketing Wallet':
        return 'border-purple-500/30 bg-purple-500/10';
      case 'Fee Vault':
        return 'border-green-500/30 bg-green-500/10';
      case 'Withdraw Authority':
        return 'border-orange-500/30 bg-orange-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const walletEntries = Object.entries(balances).filter(([_, balance]) => balance);

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Wallet Balances</h2>
          <p className="text-foreground/60 mt-1">
            Token balances across all system wallets
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {walletEntries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">💼</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Wallet Data</h3>
          <p className="text-foreground/60">
            Wallet addresses not configured or no balances found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {walletEntries.map(([key, wallet]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border ${getWalletColor(wallet.type)} hover:scale-105 transition-transform`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getWalletIcon(wallet.type)}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{wallet.type}</h3>
                    <p className="text-sm text-foreground/60 font-mono">
                      {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/80">Balance:</span>
                  <span className="font-bold text-lg text-foreground">
                    {formatBalance(wallet.balance)}
                  </span>
                </div>
                
                {wallet.error && (
                  <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded">
                    ⚠️ Error: {wallet.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-foreground/5 rounded-lg">
        <h4 className="font-semibold text-foreground mb-2">Reward Distribution Info</h4>
        <div className="text-sm text-foreground/70 space-y-1">
          <p>• <strong>LP Wallet:</strong> Main liquidity wallet for distributing rewards</p>
          <p>• <strong>Marketing Wallet:</strong> For marketing and promotional activities</p>
          <p>• <strong>Fee Vault:</strong> Collects fees from nominations and voting</p>
          <p>• <strong>Withdraw Authority:</strong> Manages withdrawal operations</p>
        </div>
      </div>
    </div>
  );
} 