"use client";

import React, { useMemo, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import vestingIdl from '../../contracts/vesting.json';
import WhitelistManagement from './WhitelistManagement';
import AdminNav, { AdminNavItem } from './AdminNav';

const AdminDashboard: React.FC = () => {
  const { connection } = useConnection();
  const { wallet, publicKey } = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [activeTab, setActiveTab] = useState<'whitelist' | 'vesting' | 'settings'>('whitelist');

  // Initialize program
  const provider = useMemo(() => {
    if (!wallet) return null as any;
    return new AnchorProvider(connection, wallet as any, {});
  }, [connection, wallet]);

  const programId = useMemo(() => {
    const id = process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID || "";
    return id ? new PublicKey(id) : null;
  }, []);

  React.useEffect(() => {
    if (provider && programId) {
      const programInstance = new Program(vestingIdl as any, programId, provider);
      setProgram(programInstance);
    } else {
      setProgram(null);
    }
  }, [provider, programId]);

  const tabs = [
    { id: 'whitelist-link', label: 'Whitelist Management', icon: '👥', href: '/admin/whitelist' },
    { id: 'vesting', label: 'Vesting Control', icon: '⏰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'whitelist': {
        const WL = WhitelistManagement as unknown as React.FC<{ program?: Program | null }>;
        return <WL program={program} />;
      }
      case 'vesting':
        return (
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Vesting Control</h3>
            <p className="text-gray-600">Vesting management features coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <p className="text-gray-600">Admin settings coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to access admin functions</p>
          <div className="text-sm text-gray-500">
            Only authorized administrators can access this dashboard
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sosana Admin Dashboard</h1>
              <p className="text-gray-600">Manage vesting and whitelist operations</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Connected as:</div>
              <div className="font-mono text-sm text-gray-900">
                {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Left Sidebar */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Menu */}
          <aside className="md:col-span-3">
            <AdminNav
              items={tabs as unknown as AdminNavItem[]}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as any)}
              title="Admin Menu"
            />
          </aside>

          {/* Content */}
          <section className="md:col-span-9">
            {renderTabContent()}
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            Sosana Vesting Admin Dashboard - Use with caution
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;