"use client";

import React, { useState, useEffect } from "react";
import { 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { BN } from "@project-serum/anchor";
import { 
  parseWhitelistData, 
  formatWhitelistTokenAmount, 
  validateWhitelistData,
  sampleWhitelistData,
  WhitelistUser,
  WhitelistSummary
} from "@/utils/whitelistUtils";

interface WhitelistDataViewerProps {
  whitelistData?: WhitelistUser[];
  className?: string;
}

const WhitelistDataViewer: React.FC<WhitelistDataViewerProps> = ({ 
  whitelistData = sampleWhitelistData, 
  className = '' 
}) => {
  const [summary, setSummary] = useState<WhitelistSummary | null>(null);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] } | null>(null);
  const [selectedUser, setSelectedUser] = useState<WhitelistUser | null>(null);

  useEffect(() => {
    const parsedSummary = parseWhitelistData(whitelistData);
    const validationResult = validateWhitelistData(whitelistData);
    
    setSummary(parsedSummary);
    setValidation(validationResult);
  }, [whitelistData]);

  const formatDate = (timestamp: string): string => {
    const timestampNum = parseInt(timestamp);
    if (timestampNum === 0) return "Never";
    return new Date(timestampNum * 1000).toLocaleDateString();
  };

  const getStatusColor = (user: WhitelistUser) => {
    const claimed = new BN(user.account.claim);
    const total = new BN(user.account.total);
    
    if (claimed.isZero()) return "text-yellow-500";
    if (claimed.eq(total)) return "text-green-500";
    return "text-blue-500";
  };

  const getStatusText = (user: WhitelistUser) => {
    const claimed = new BN(user.account.claim);
    const total = new BN(user.account.total);
    
    if (claimed.isZero()) return "Not Claimed";
    if (claimed.eq(total)) return "Fully Claimed";
    return "Partially Claimed";
  };

  if (!summary) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="cosmic-card p-4">
          <div className="flex items-center gap-3">
            <UserGroupIcon className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-foreground/60">Total Users</p>
              <p className="text-xl font-bold text-foreground">{summary.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="cosmic-card p-4">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-foreground/60">Total Allocated</p>
              <p className="text-xl font-bold text-foreground">
                {formatWhitelistTokenAmount(summary.totalAllocated)} SOSANA
              </p>
            </div>
          </div>
        </div>

        <div className="cosmic-card p-4">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-foreground/60">Total Claimed</p>
              <p className="text-xl font-bold text-foreground">
                {formatWhitelistTokenAmount(summary.totalClaimed)} SOSANA
              </p>
            </div>
          </div>
        </div>

        <div className="cosmic-card p-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-foreground/60">Remaining</p>
              <p className="text-xl font-bold text-foreground">
                {formatWhitelistTokenAmount(summary.totalRemaining)} SOSANA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      {validation && (
        <div className={`cosmic-card p-4 ${
          validation.isValid 
            ? 'border-green-500/30 bg-green-500/5' 
            : 'border-red-500/30 bg-red-500/5'
        }`}>
          <div className="flex items-center gap-3">
            {validation.isValid ? (
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
            ) : (
              <XCircleIcon className="w-6 h-6 text-red-500" />
            )}
            <div>
              <h3 className={`font-semibold ${
                validation.isValid ? 'text-green-500' : 'text-red-500'
              }`}>
                Whitelist Data {validation.isValid ? 'Valid' : 'Invalid'}
              </h3>
              {!validation.isValid && (
                <ul className="text-sm text-red-400 mt-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="cosmic-card p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Whitelisted Users</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">User Address</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Claimed</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Remaining</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Last Claim</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {summary.users.map((user, index) => (
                <tr key={user.publicKey} className="border-b border-card-border/50 hover:bg-secondary/30">
                  <td className="py-3 px-4">
                    <div className="font-mono text-sm">
                      {user.account.userAddress.slice(0, 8)}...{user.account.userAddress.slice(-8)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    {formatWhitelistTokenAmount(user.account.total)} SOSANA
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    {formatWhitelistTokenAmount(user.account.claim)} SOSANA
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    {formatWhitelistTokenAmount(user.account.remain)} SOSANA
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${getStatusColor(user)}`}>
                      {getStatusText(user)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground/60">
                    {formatDate(user.account.lastWithdrawAt)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="btn btn-sm btn-secondary"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="cosmic-card p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-foreground">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-sm btn-secondary"
              >
                Close
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground/60">Public Key</label>
                <p className="font-mono text-sm text-foreground break-all">{selectedUser.publicKey}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-foreground/60">User Address</label>
                <p className="font-mono text-sm text-foreground break-all">{selectedUser.account.userAddress}</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground/60">Total Allocated</label>
                  <p className="text-lg font-bold text-foreground">
                    {formatWhitelistTokenAmount(selectedUser.account.total)} SOSANA
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-foreground/60">Claimed</label>
                  <p className="text-lg font-bold text-blue-500">
                    {formatWhitelistTokenAmount(selectedUser.account.claim)} SOSANA
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-foreground/60">Remaining</label>
                  <p className="text-lg font-bold text-yellow-500">
                    {formatWhitelistTokenAmount(selectedUser.account.remain)} SOSANA
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground/60">Last Withdraw</label>
                  <p className="text-foreground">{formatDate(selectedUser.account.lastWithdrawAt)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-foreground/60">Last Treasury Withdraw</label>
                  <p className="text-foreground">{formatDate(selectedUser.account.lastWithdrawTreasuryAt)}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-card-border">
                <div className="flex items-center gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-accent" />
                  <span className="text-sm text-foreground/80">
                    This user is eligible for daily drip claims once vesting starts.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhitelistDataViewer;
