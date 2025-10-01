'use client';

import { useStaticContext } from '@/context/StaticContext';
import TokenTypeTabs from '@/components/TokenTypeTabs';
import UserBalanceDisplay from '@/components/user/UserBalanceDisplay';
import TokenRoundManager from '@/components/voting/TokenRoundManager';

export default function Home() {
  const { activeTab, setActiveTab } = useStaticContext();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">SOSANA Voting Platform</h1>
      
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">🎉 Welcome to SOSANA</h2>
        <p className="text-foreground/60 mb-4">
          Vote for your favorite Solana tokens and earn rewards. Connect your wallet to get started!
        </p>
        <div className="space-x-4">
          <a href="/vote" className="text-blue-500 hover:text-blue-700 underline">Go to Vote Page</a>
          <a href="/info" className="text-green-500 hover:text-green-700 underline">Go to Info Page</a>
          <a href="/docs" className="text-purple-500 hover:text-purple-700 underline">Go to Docs Page</a>
        </div>
      </div>

      {/* User Balance Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">User Balance Display</h2>
        <UserBalanceDisplay />
      </div>

      {/* Token Type Tabs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Token Categories</h2>
          <TokenTypeTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* Token Round Manager */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {activeTab === 'live' ? 'Live Token' : 'Pre-Launch Token'} Round Management
        </h2>
        <TokenRoundManager roundType={activeTab} />
      </div>
    </div>
  );
}
