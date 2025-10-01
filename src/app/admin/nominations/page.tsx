'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getSolanaProgram,
  fetchBlockchainRounds,
  fetchBlockchainNominations,
  fetchNominationsByRound,
  formatNominationForDisplay,
  getTokenMetadata,
  BlockchainNomination,
  BlockchainRound,
  safeToNumber,
} from '@/utils/smartContractUtils';

interface Nomination {
  _id: string;
  round: number;
  tokenAddress: string;
  symbol: string;
  name: string;
  nominationValue: number;
  userAddress: string;
  date?: string;
  createdAt?: string;
  isAdminAdded?: boolean;
  isPreLaunch?: boolean;
  projectDescription?: string;
  targetBlockchain?: string;
  expectedLaunchDate?: string;
  status?: string;
  tokenInfo?: {
    symbol: string;
    name: string;
    price: number;
    marketCap: number;
  };
  voteCount?: number;
  isWinner?: boolean;
  isClaim?: boolean;
  roundAddress?: string;
  voters?: string[];
}

export default function NominationsPage() {
  const wallet = useWallet();
  const { connection } = useConnection();
  
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [rounds, setRounds] = useState<BlockchainRound[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize program when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      try {
        const programInstance = getSolanaProgram(wallet, connection);
        setProgram(programInstance);
      } catch (error) {
        console.error('Failed to initialize program:', error);
        setError('Failed to connect to smart contract');
      }
    }
  }, [wallet.connected, connection]);

  useEffect(() => {
    if (program) {
      fetchRounds();
      fetchNominations();
    }
  }, [program, selectedRound]);

  const handleRefresh = () => {
    if (program) {
      fetchRounds();
      fetchNominations();
    }
  };

  const fetchRounds = async () => {
    if (!program) return;
    
    try {
      const blockchainRounds = await fetchBlockchainRounds(program);
      setRounds(blockchainRounds);
    } catch (error) {
      console.error('Error fetching rounds:', error);
      setError('Failed to fetch rounds from blockchain');
    }
  };

  const fetchNominations = async () => {
    if (!program) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let blockchainNominations: BlockchainNomination[] = [];
      
      if (selectedRound === 'all') {
        blockchainNominations = await fetchBlockchainNominations(program);
      } else {
        // Find the round by round number
        const selectedRoundData = rounds.find(r => safeToNumber(r.roundNo).toString() === selectedRound);
        if (selectedRoundData) {
          blockchainNominations = await fetchNominationsByRound(program, selectedRoundData.publicKey);
        }
      }

      // Format nominations and fetch token metadata
      const formattedNominations = await Promise.all(
        blockchainNominations.map(async (nomination) => {
          const round = rounds.find(r => r.publicKey.equals(nomination.roundAddress));
          const formatted = formatNominationForDisplay(nomination, round);
          
          // Try to fetch token metadata
          try {
            const metadata = await getTokenMetadata(connection, nomination.tokenMint);
            formatted.symbol = metadata.symbol;
            formatted.name = metadata.name;
          } catch (error) {
            console.warn('Failed to fetch token metadata:', error);
          }
          
          return formatted;
        })
      );

      setNominations(formattedNominations);
    } catch (error) {
      console.error('Error fetching nominations:', error);
      setError('Failed to fetch nominations from blockchain');
      setNominations([]);
    } finally {
      setLoading(false);
    }
  };

  

  const handleApprove = async (nomination: any) => {
    if (!program) {
      toast.error('Smart contract not connected');
      return;
    }
    console.log('Approving nomination:', nomination);
    try {
      const { approveNomination } = await import('@/utils/smartContractUtils');
      const txSig = await approveNomination(program, new PublicKey(nomination.publicKey));
      if (txSig) {
        toast.success('Nomination approved');
        await fetchNominations();
      } else {
        toast.error('Failed to approve nomination');
      }
    } catch (error) {
      console.error('Error approving nomination:', error);
      toast.error('Error approving nomination');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (!wallet.connected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-foreground text-lg font-medium mb-2">Wallet Not Connected</div>
          <div className="text-foreground/60">Please connect your wallet to view nominations</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-400 text-lg font-medium mb-2">Error</div>
          <div className="text-foreground/60">{error}</div>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-foreground">Loading nominations from blockchain...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nominations Management</h1>
          <p className="text-foreground/60">View and manage all token nominations from blockchain</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          title="Refresh nominations"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="cosmic-card p-4">
        <div className="flex items-center space-x-4">
          <label className="text-foreground font-medium">Filter by Round:</label>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="px-3 py-2 bg-background border border-card-border rounded-md text-foreground"
          >
            <option value="all">All Rounds</option>
            {rounds.map((round) => (
              <option key={round.publicKey.toString()} value={safeToNumber(round.roundNo).toString()}>
                Round {safeToNumber(round.roundNo)} - {round.isPreLaunch ? 'Pre-Launch' : 'Live Token'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nominations Table */}
      <div className="cosmic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-card-border">
            <thead className="bg-card-highlight">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Round</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Token</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Votes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Nominated By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {nominations && nominations.length > 0 ? nominations.map((nomination) => (
                <tr key={(nomination as any).publicKey || nomination._id} className="hover:bg-card-highlight transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/admin/rounds/${nomination.round}`}
                      className="text-accent hover:text-accent/80 font-medium"
                    >
                      Round {nomination.round}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {nomination.isPreLaunch ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-400/10 text-purple-400 border border-purple-400/30">
                        Pre-Launch
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/30">
                        Live Token
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-foreground font-medium">{nomination.symbol || 'Unknown'}</div>
                    <div className="text-foreground/60 text-sm">{nomination.name || 'Unknown Token'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground/60 text-sm">
                    {formatAddress(nomination.tokenAddress)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">
                    {nomination.nominationValue ? formatCurrency(nomination.nominationValue) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">
                    {nomination.voteCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-foreground/60 text-sm">
                      {formatAddress(nomination.userAddress)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {nomination.isWinner && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-400/10 text-green-400 border border-green-400/30">
                          Winner
                        </span>
                      )}
                      {nomination.isClaim && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
                          Claimed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {nomination as any && (nomination as any).isApproved === false && (
                        <button
                          onClick={() => handleApprove(nomination)}
                          className="text-green-400 hover:text-green-300 transition-colors px-2 py-1 rounded text-xs border border-green-400/30 hover:bg-green-400/10"
                          title="Approve nomination"
                        >
                          Approve
                        </button>
                      )}
                      {nomination.isAdminAdded && (
                        <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/30">
                          Admin Added
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-foreground/60">
                    No nominations found on blockchain
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {nominations.length === 0 && (
        <div className="cosmic-card p-8 text-center">
          <div className="text-foreground/60">No nominations found on blockchain</div>
        </div>
      )}

      {/* Info Card */}
      <div className="cosmic-card p-4 bg-blue-400/5 border border-blue-400/20">
        <div className="flex items-start space-x-3">
          <div className="text-blue-400 mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-blue-400 font-medium">Blockchain Data</h3>
            <p className="text-foreground/60 text-sm mt-1">
              This page now displays nominations directly from the Solana blockchain using the smart contract IDL. 
              Token metadata is fetched from Metaplex when available. Remove nomination functionality requires 
              implementation in the smart contract.
            </p>
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
} 