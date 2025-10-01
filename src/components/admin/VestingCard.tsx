'use client';

import React, { useState } from 'react';
import { web3 } from '@project-serum/anchor';
import VestingInitForm from './VestingInitForm';
import VestingWithdrawForm from './VestingWithdrawForm';

interface VestingAccount {
  total: number;
  decimal: number;
  tokenMint: string;
  remain: number;
  startTime: number;
  lastReleaseMonth: number;
}

interface VestingCardProps {
  type: string;
  name: string;
  data?: VestingAccount;
  color: string;
  canWithdraw: boolean;
  availableAmount: number;
  onInit: (type: string, totalTokens: number, decimals: number) => Promise<void>;
  onWithdraw: (type: string, amount: number) => Promise<void>;
  isOperationInProgress?: boolean;
}

const VestingCard: React.FC<VestingCardProps> = ({
  type,
  name,
  data,
  color,
  canWithdraw,
  availableAmount,
  onInit,
  onWithdraw,
  isOperationInProgress = false,
}) => {
  const [showInitForm, setShowInitForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'green':
        return 'border-green-500/30 bg-green-500/5';
      case 'purple':
        return 'border-purple-500/30 bg-purple-500/5';
      case 'orange':
        return 'border-orange-500/30 bg-orange-500/5';
      default:
        return 'border-accent/30 bg-accent/5';
    }
  };

  const getStatusColor = (isInitialized: boolean, canWithdraw: boolean) => {
    if (!isInitialized) return 'text-yellow-500';
    if (canWithdraw) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusText = (isInitialized: boolean, canWithdraw: boolean) => {
    if (!isInitialized) return 'Not Initialized';
    if (canWithdraw) return 'Available for Withdrawal';
    return 'Cliff Period Active';
  };

  const formatDate = (timestamp: number) => {
    // Ensure we're working with a number
    const numTimestamp = typeof timestamp === 'number' ? timestamp : Number(timestamp);
    return new Date(numTimestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTokens = (amount: number, decimals: number) => {
    // Ensure we're working with numbers
    const numAmount = typeof amount === 'number' ? amount : Number(amount);
    const numDecimals = typeof decimals === 'number' ? decimals : Number(decimals);
    // The blockchain data already contains the raw amounts, so we need to apply decimal conversion
    return (numAmount).toLocaleString();
  };

  const isInitialized = !!data;

  return (
    <div className={`cosmic-card p-6 border ${getColorClasses(color)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground">{name}</h3>
        <span className={`text-sm font-medium ${getStatusColor(isInitialized, canWithdraw)}`}>
          {getStatusText(isInitialized, canWithdraw)}
        </span>
      </div>

      {isInitialized ? (
        <>
          {/* Vesting Details */}
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground/60">Total Tokens</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatTokens(data!.total, data!.decimal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground/60">Remaining</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatTokens(data!.remain, data!.decimal)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground/60">Start Time</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(data!.startTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground/60">Last Release</p>
                <p className="text-sm font-medium text-foreground">
                  Month {data!.lastReleaseMonth}
                </p>
              </div>
            </div>

            {canWithdraw && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-600 font-medium">
                  Available for withdrawal: {formatTokens(availableAmount, data!.decimal)} tokens
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {canWithdraw ? (
              <button
                onClick={() => setShowWithdrawForm(true)}
                disabled={isOperationInProgress}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Withdraw Tokens
              </button>
            ) : (
              <button
                disabled
                className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed"
              >
                Cliff Period Active
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Not Initialized State */}
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔒</div>
            <p className="text-foreground/60 mb-4">
              This vesting schedule has not been initialized yet.
            </p>
            <button
              onClick={() => setShowInitForm(true)}
              disabled={isOperationInProgress}
              className="bg-accent hover:bg-accent/80 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Initialize Vesting
            </button>
          </div>
        </>
      )}

      {/* Init Form Modal */}
      {showInitForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="cosmic-card p-6 max-w-md w-full mx-4">
            <VestingInitForm
              type={type}
              name={name}
              onInit={onInit}
              onClose={() => setShowInitForm(false)}
            />
          </div>
        </div>
      )}

      {/* Withdraw Form Modal */}
      {showWithdrawForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="cosmic-card p-6 max-w-md w-full mx-4">
            <VestingWithdrawForm
              type={type}
              name={name}
              availableAmount={availableAmount}
              decimals={data!.decimal}
              onWithdraw={onWithdraw}
              onClose={() => setShowWithdrawForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VestingCard;
