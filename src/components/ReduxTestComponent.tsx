'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setActiveTab, addNotification } from '@/store/slices/uiSlice';
import { setWalletAddress } from '@/store/slices/userSlice';
import { useGetCurrentRoundQuery, useGetNominatedTokensQuery } from '@/store/api/votingApi';

export default function ReduxTestComponent() {
  const dispatch = useAppDispatch();
  
  // UI State
  const activeTab = useAppSelector((state) => state.ui.activeTab);
  const isLoading = useAppSelector((state) => state.ui.isLoading);
  
  // User State
  const userAddress = useAppSelector((state) => state.user.address);
  const isConnected = useAppSelector((state) => state.user.isConnected);
  
  // API Queries with RTK Query
  const { data: currentRound, isLoading: roundLoading, error: roundError } = useGetCurrentRoundQuery({});
  const { data: nominatedTokens, isLoading: tokensLoading } = useGetNominatedTokensQuery();

  const handleTabChange = (tab: 'live' | 'pre-launch') => {
    dispatch(setActiveTab(tab));
    dispatch(addNotification({
      type: 'info',
      message: `Switched to ${tab} tab`,
      duration: 3000,
    }));
  };

  const handleConnectWallet = () => {
    const mockAddress = 'mock-wallet-address-' + Date.now();
    dispatch(setWalletAddress(mockAddress));
    dispatch(addNotification({
      type: 'success',
      message: 'Wallet connected successfully!',
      duration: 3000,
    }));
  };

  const handleDisconnectWallet = () => {
    dispatch(setWalletAddress(null));
    dispatch(addNotification({
      type: 'warning',
      message: 'Wallet disconnected',
      duration: 3000,
    }));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Redux + RTK Query Test</h2>
      
      {/* UI State */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">UI State</h3>
        <p>Active Tab: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{activeTab}</span></p>
        <p>Loading: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{isLoading ? 'true' : 'false'}</span></p>
        
        <div className="mt-2 space-x-2">
          <button
            onClick={() => handleTabChange('live')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Live Tab
          </button>
          <button
            onClick={() => handleTabChange('pre-launch')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Pre-launch Tab
          </button>
        </div>
      </div>

      {/* User State */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">User State</h3>
        <p>Connected: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{isConnected ? 'true' : 'false'}</span></p>
        <p>Address: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{userAddress || 'Not connected'}</span></p>
        
        <div className="mt-2 space-x-2">
          <button
            onClick={handleConnectWallet}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Connect Wallet
          </button>
          <button
            onClick={handleDisconnectWallet}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>

      {/* API Data */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">API Data (RTK Query)</h3>
        
        {/* Current Round */}
        <div className="mb-4">
          <h4 className="font-medium">Current Round:</h4>
          {roundLoading ? (
            <p className="text-gray-500">Loading round...</p>
          ) : roundError ? (
            <p className="text-red-500">Error: {JSON.stringify(roundError)}</p>
          ) : currentRound ? (
            <div className="bg-gray-50 p-3 rounded">
              <p><strong>Round Name:</strong> {currentRound.roundName}</p>
              <p><strong>Status:</strong> {currentRound.status}</p>
              <p><strong>Total Votes:</strong> {currentRound.statistics.votesCount}</p>
            </div>
          ) : (
            <p className="text-gray-500">No current round</p>
          )}
        </div>

        {/* Nominated Tokens */}
        <div>
          <h4 className="font-medium">Nominated Tokens:</h4>
          {tokensLoading ? (
            <p className="text-gray-500">Loading tokens...</p>
          ) : nominatedTokens ? (
            <div className="bg-gray-50 p-3 rounded">
              <p><strong>Count:</strong> {nominatedTokens.length}</p>
              {nominatedTokens.slice(0, 3).map((token, index) => (
                <div key={index} className="mt-2 p-2 bg-white rounded border">
                  <p><strong>{token.tokenName}</strong> ({token.tokenSymbol})</p>
                  <p className="text-sm text-gray-600">Votes: {token.votesReceived}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tokens found</p>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p>✅ Redux store is working</p>
        <p>✅ RTK Query is handling API calls</p>
        <p>✅ State management is centralized</p>
        <p>✅ Automatic caching and loading states</p>
      </div>
    </div>
  );
} 