'use client';

import React, { useState } from 'react';

interface VestingWithdrawFormProps {
  type: string;
  name: string;
  availableAmount: number;
  decimals: number;
  onWithdraw: (type: string, amount: number) => Promise<void>;
  onClose: () => void;
}

const VestingWithdrawForm: React.FC<VestingWithdrawFormProps> = ({
  type,
  name,
  availableAmount,
  decimals,
  onWithdraw,
  onClose,
}) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatTokens = (amount: number, decimals: number) => {
    return (amount / Math.pow(10, decimals)).toLocaleString();
  };

  const parseTokens = (displayAmount: string, decimals: number) => {
    const numAmount = parseFloat(displayAmount);
    if (isNaN(numAmount)) return 0;
    // Convert display amount to raw amount (smallest unit)
    return Math.floor(numAmount * Math.pow(10, decimals));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const withdrawAmount = parseTokens(amount, decimals);
    const maxAmount = availableAmount;
    
    if (withdrawAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (withdrawAmount > maxAmount) {
      alert(`Amount exceeds available balance. Maximum: ${formatTokens(maxAmount, decimals)} tokens`);
      return;
    }

    setIsLoading(true);
    try {
      await onWithdraw(type, withdrawAmount);
      onClose();
    } catch (error) {
      console.error('Error withdrawing tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxAmount = () => {
    setAmount(formatTokens(availableAmount, decimals));
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-foreground mb-4">
        Withdraw from {name}
      </h3>
      
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
        <p className="text-sm text-green-600 font-medium">
          Available for withdrawal: {formatTokens(availableAmount, decimals)} tokens
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Amount to Withdraw (tokens)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.000000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-3 py-2 border border-accent/30 rounded-lg bg-background text-foreground"
              placeholder="Enter amount"
              required
            />
            <button
              type="button"
              onClick={handleMaxAmount}
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg font-medium transition-colors"
            >
              Max
            </button>
          </div>
          <p className="text-xs text-foreground/60 mt-1">
            Maximum: {formatTokens(availableAmount, decimals)} tokens
          </p>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-accent/30 rounded-lg text-foreground hover:bg-accent/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Withdrawing...' : 'Withdraw'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VestingWithdrawForm;
