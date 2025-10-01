'use client';

import React from 'react';
import WalletBalancePanel from '@/components/admin/WalletBalancePanel';
import WhitelistManagementPanel from '@/components/admin/WhitelistManagementPanel';

export default function AdminWalletsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet Management</h1>
          <p className="text-foreground/60">Manage wallet setup and tax collection</p>
        </div>
        <a
          href="/admin/wallets/setup"
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors"
        >
          🏦 Wallet Setup
        </a>
      </div>

      {/* Wallet Balances */}
      <WalletBalancePanel />

      {/* Whitelist Management */}
      <WhitelistManagementPanel />
    </div>
  );
}
