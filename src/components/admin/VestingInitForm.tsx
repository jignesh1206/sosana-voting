'use client';

import React, { useState } from 'react';

interface VestingInitFormProps {
  type: string;
  name: string;
  onInit: (type: string, totalTokens: number, decimals: number) => Promise<void>;
  onClose: () => void;
}

const VestingInitForm: React.FC<VestingInitFormProps> = ({
  type,
  name,
  onInit,
  onClose,
}) => {
  const [totalTokens, setTotalTokens] = useState('');
  const [decimals, setDecimals] = useState('9');
  const [isLoading, setIsLoading] = useState(false);

  const parseTokens = (displayAmount: string, decimals: number) => {
    const numAmount = parseFloat(displayAmount);
    if (isNaN(numAmount)) return 0;
    // Convert display amount to raw amount (smallest unit) for blockchain
    return Math.floor(numAmount * Math.pow(10, decimals));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalTokens || !decimals) return;

    const tokenAmount = parseFloat(totalTokens);
    const decimalAmount = parseInt(decimals);
    
    if (tokenAmount <= 0) {
      alert('Please enter a valid token amount');
      return;
    }
    
    if (decimalAmount < 0 || decimalAmount > 18) {
      alert('Decimals must be between 0 and 18');
      return;
    }

    setIsLoading(true);
    try {
      const totalTokensInSmallestUnit = parseTokens(totalTokens, decimalAmount);
      await onInit(type, totalTokensInSmallestUnit, decimalAmount);
      onClose();
    } catch (error) {
      console.error('Error initializing vesting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-foreground mb-4">
        Initialize {name}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Total Tokens
          </label>
          <input
            type="number"
            step="0.000000001"
            value={totalTokens}
            onChange={(e) => setTotalTokens(e.target.value)}
            className="w-full px-3 py-2 border border-accent/30 rounded-lg bg-background text-foreground"
            placeholder="Enter total tokens (e.g., 1000000)"
            required
          />
          <p className="text-xs text-foreground/60 mt-1">
            Enter the total number of tokens for this vesting schedule
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Token Decimals
          </label>
          <input
            type="number"
            min="0"
            max="18"
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
            className="w-full px-3 py-2 border border-accent/30 rounded-lg bg-background text-foreground"
            placeholder="Enter decimals (e.g., 9)"
            required
          />
          <p className="text-xs text-foreground/60 mt-1">
            Number of decimal places for the token (usually 9 for Solana tokens)
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
            className="flex-1 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Initializing...' : 'Initialize'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VestingInitForm;
