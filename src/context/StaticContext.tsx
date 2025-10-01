'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TokenType } from '@/types';
import { 
  mockUserBalance, 
  getCurrentRound, 
  getUpcomingRounds, 
  getCompletedRounds,
  getTokensForRound,
  StaticRound,
  StaticToken,
  StaticPreLaunchToken,
  StaticUserBalance
} from '@/data/mockData';

interface StaticContextType {
  // User state
  userAddress: string | null;
  isConnected: boolean;
  userBalance: StaticUserBalance;
  
  // UI state
  activeTab: TokenType;
  setActiveTab: (tab: TokenType) => void;
  
  // Data getters
  getCurrentRound: (roundType: TokenType) => StaticRound | null;
  getUpcomingRounds: (roundType: TokenType) => StaticRound[];
  getCompletedRounds: (roundType: TokenType) => StaticRound[];
  getTokensForRound: (roundId: string, roundType: TokenType) => StaticToken[] | StaticPreLaunchToken[];
  
  // Mock actions
  connectWallet: () => void;
  disconnectWallet: () => void;
  nominateToken: (tokenAddress: string, roundType: TokenType) => Promise<void>;
  voteForToken: (tokenId: string, roundType: TokenType) => Promise<void>;
}

const StaticContext = createContext<StaticContextType | undefined>(undefined);

export const useStaticContext = () => {
  const context = useContext(StaticContext);
  if (context === undefined) {
    throw new Error('useStaticContext must be used within a StaticProvider');
  }
  return context;
};

interface StaticProviderProps {
  children: ReactNode;
}

export const StaticProvider: React.FC<StaticProviderProps> = ({ children }) => {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<TokenType>('live');

  const connectWallet = () => {
    setUserAddress('mock-wallet-address-123456789');
    setIsConnected(true);
  };

  const disconnectWallet = () => {
    setUserAddress(null);
    setIsConnected(false);
  };

  const nominateToken = async (tokenAddress: string, roundType: TokenType) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Token ${tokenAddress} nominated for ${roundType} round`);
  };

  const voteForToken = async (tokenId: string, roundType: TokenType) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Voted for token ${tokenId} in ${roundType} round`);
  };

  const value: StaticContextType = {
    userAddress,
    isConnected,
    userBalance: mockUserBalance,
    activeTab,
    setActiveTab,
    getCurrentRound,
    getUpcomingRounds,
    getCompletedRounds,
    getTokensForRound,
    connectWallet,
    disconnectWallet,
    nominateToken,
    voteForToken,
  };

  return (
    <StaticContext.Provider value={value}>
      {children}
    </StaticContext.Provider>
  );
};
