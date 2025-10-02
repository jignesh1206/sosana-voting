'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, web3 } from '@project-serum/anchor';
import { useGetAdminDashboardQuery, useGetAdminRoundsQuery } from '@/store/api/adminApi';
import { useGetPreLaunchAdminDataQuery } from '@/store/api/preLaunchApi';
import idl from '@/contracts/idl.json';

interface DashboardStats {
  totalRounds: number;
  activeRounds: number;
  totalNominations: number;
  totalVotes: number;
  totalUsers: number;
  currentRound?: {
    round: number;
    roundName?: string;
    status: string;
    nominationStartDate?: string;
    nominationEndDate?: string;
    votingStartDate?: string;
    votingEndDate?: string;
    nominationFee?: number;
    votingFee?: number;
    description?: string;
  };
  nextRound?: {
    round: number;
    roundName?: string;
    nominationStartDate?: string;
  };
  recentActivity: Array<{
    id: string;
    type: 'round_created' | 'nomination' | 'vote' | 'round_ended';
    message: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'live' | 'pre-launch'>('live');
  const [configDetails, setConfigDetails] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [isInitiating, setIsInitiating] = useState<boolean>(false);
  const wallet = useWallet();
  const { connection } = useConnection();
  
  // Use RTK Query hooks for data fetching
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useGetAdminDashboardQuery();
  const { data: preLaunchData, isLoading: preLaunchLoading, refetch: refetchPreLaunch } = useGetPreLaunchAdminDataQuery();
  const { data: roundsData, isLoading: roundsLoading, refetch: refetchRounds } = useGetAdminRoundsQuery();
  
  const stats = dashboardData?.data || {
    totalRounds: 0,
    activeRounds: 0,
    totalNominations: 0,
    totalVotes: 0,
    totalUsers: 0,
    recentActivity: []
  };
  
  const preLaunchTokens = preLaunchData?.data || [];
  const rounds = roundsData?.data || [];

  // Get current live round
  const currentLiveRound = rounds.find(round => 
    round.status === 'nominating' || round.status === 'voting'
  );

  // Get current pre-launch round
  const currentPreLaunchRound = rounds.find(round => 
    round.status === 'nominating' || round.status === 'voting'
  );

  const handleRefresh = () => {
    refetchDashboard();
    refetchPreLaunch();
    refetchRounds();
    toast.success('Dashboard refreshed successfully!');
  };

  // On load: derive sosana-vote-pda and fetch config account
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigLoading(true);
        setConfigError(null);
        if (!wallet.connected || !wallet.publicKey) return;
        const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || '');
        const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
        const program = new Program(idl as any, programId, provider);
        const [sosanaPda] = web3.PublicKey.findProgramAddressSync(
          [Buffer.from('sosana-vote-pda')],
          program.programId
        );
        const cfg = await program.account.config.fetch(sosanaPda);
        setConfigDetails(cfg);
        if (!cfg) {
          setShowConfigModal(true);
        }
      } catch (err: any) {
        console.error('Error fetching config account:', err);
        setConfigError(err?.message || 'Failed to fetch config');
        setShowConfigModal(true);
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, [wallet.connected, wallet.publicKey, connection]);

  const initiateVotingConfiguration = async () => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        toast.error('Connect wallet to initiate configuration');
        return;
      }
      setIsInitiating(true);
      const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || '');
      const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
      const program = new Program(idl as any, programId, provider);
      const [sosanaPda] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('sosana-vote-pda')],
        program.programId
      );

      const tx = await program.methods
        .initialize()
        .accounts({
          config: sosanaPda,
          signer: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([])
        .rpc();

      toast.success('Voting configuration initialized');
      setShowConfigModal(false);

      // Optionally refetch config
      try {
        const cfg = await program.account.config.fetch(sosanaPda);
        setConfigDetails(cfg);
      } catch {}

      console.log(`Initialized config. Tx: ${tx}`);
    } catch (err: any) {
      console.error('Failed to initialize voting configuration:', err);
      toast.error(err?.message || 'Failed to initialize voting configuration');
    } finally {
      setIsInitiating(false);
    }
  };

  const StatCard = ({ title, value, icon }: { 
    title: string; 
    value: number; 
    icon: string; 
  }) => (
    <div className="cosmic-card p-6 hover:bg-card-highlight/30 transition-all duration-300 border border-card-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-4">
            <span className="text-3xl">{icon}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="w-2 h-2 bg-accent rounded-full"></div>
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }: { activity: DashboardStats['recentActivity'][0] }) => {
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'round_created': return '⏰';
        case 'nomination': return '🏆';
        case 'vote': return '🗳️';
        case 'round_ended': return '🏅';
        default: return '📝';
      }
    };

    const getActivityColor = (type: string) => {
      switch (type) {
        case 'round_created': return 'text-accent';
        case 'nomination': return 'text-green-400';
        case 'vote': return 'text-purple-400';
        case 'round_ended': return 'text-orange-400';
        default: return 'text-foreground/80';
      }
    };

    return (
      <div className="flex items-center space-x-3 py-3 border-b border-card-border last:border-b-0">
        <span className="text-lg">{getActivityIcon(activity.type)}</span>
        <div className="flex-1">
          <p className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
            {activity.message}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full"></div>
            <p className="text-xs text-foreground/60">
              {new Date(activity.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
        </div>
      </div>
    );
  };

 

  if (dashboardLoading || preLaunchLoading || roundsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <div className="text-lg text-foreground/60">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {/* Overview Stats */}
      <div className="cosmic-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Overview</h2>
          <button
            onClick={handleRefresh}
            className="px-3 py-2 rounded-md border border-card-border hover:bg-card-highlight transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Total Rounds" value={stats.totalRounds} icon="📦" />
          <StatCard title="Active Rounds" value={stats.activeRounds} icon="⏱️" />
          <StatCard title="Nominations" value={stats.totalNominations} icon="🏆" />
          <StatCard title="Votes" value={stats.totalVotes} icon="🗳️" />
          <StatCard title="Users" value={stats.totalUsers} icon="👥" />
        </div>
      </div>

      {/* Vesting Management Section removed in favor of left menu */}

      {/* Wallet Setup removed */}

      {/* Token Categories Tabs */}
    
      {/* Quick Actions */}
      <div className="cosmic-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
          <span className="text-2xl mr-3">⚡</span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/rounds"
            className="group flex items-center p-6 cosmic-card border border-card-border/50 rounded-xl hover:bg-card-highlight/50 hover:border-accent/30 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex-shrink-0 mr-4">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">⏰</span>
            </div>
            <div>
              <p className="font-bold text-foreground text-lg mb-1">Manage Rounds</p>
              <p className="text-sm text-foreground/70">Create, edit, and monitor voting rounds</p>
            </div>
          </Link>
          <Link
            href="/admin/nominations"
            className="group flex items-center p-6 cosmic-card border border-card-border/50 rounded-xl hover:bg-card-highlight/50 hover:border-accent/30 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex-shrink-0 mr-4">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">🏆</span>
            </div>
            <div>
              <p className="font-bold text-foreground text-lg mb-1">View Nominations</p>
              <p className="text-sm text-foreground/70">Monitor and manage token nominations</p>
            </div>
          </Link>
          <Link
            href="/admin/results"
            className="group flex items-center p-6 cosmic-card border border-card-border/50 rounded-xl hover:bg-card-highlight/50 hover:border-accent/30 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex-shrink-0 mr-4">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">🏅</span>
            </div>
            <div>
              <p className="font-bold text-foreground text-lg mb-1">View Results</p>
              <p className="text-sm text-foreground/70">Check and analyze round results</p>
            </div>
          </Link>
          <Link
            href="/admin/whitelist"
            className="group flex items-center p-6 cosmic-card border border-card-border/50 rounded-xl hover:bg-card-highlight/50 hover:border-accent/30 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex-shrink-0 mr-4">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">📋</span>
            </div>
            <div>
              <p className="font-bold text-foreground text-lg mb-1">Manage Whitelist</p>
              <p className="text-sm text-foreground/70">Add or remove whitelisted users</p>
            </div>
          </Link>
          <Link
            href="/admin/vesting"
            className="group flex items-center p-6 cosmic-card border border-card-border/50 rounded-xl hover:bg-card-highlight/50 hover:border-accent/30 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex-shrink-0 mr-4">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">🔒</span>
            </div>
            <div>
              <p className="font-bold text-foreground text-lg mb-1">Vesting Control</p>
              <p className="text-sm text-foreground/70">Manage vesting configuration</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="cosmic-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            <p className="text-foreground/60 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Config account status (optional display) */}
      <div className="cosmic-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">On-chain Config</h2>
        {configLoading && <p className="text-foreground/60">Loading config...</p>}
        {!configLoading && configError && (
          <p className="text-red-400">{configError}</p>
        )}
        {!configLoading && !configError && configDetails && (
          <p className="text-foreground/80">Config loaded.</p>
        )}
        {!configLoading && !configError && !configDetails && (
          <p className="text-foreground/60">Connect wallet to load config.</p>
        )}
      </div>

      {/* Modal: Prompt to initiate voting configuration */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="cosmic-card p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">Voting configuration not found</h3>
            <p className="text-foreground/70 mb-6">We couldn't find the on-chain voting configuration. Initiate it to get started.</p>
            <div className="flex items-center justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-lg border border-card-border hover:bg-card-highlight transition-colors"
                onClick={() => setShowConfigModal(false)}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${isInitiating ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={isInitiating}
                onClick={initiateVotingConfiguration}
              >
                {isInitiating ? 'Initializing...' : 'Initiate voting configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 