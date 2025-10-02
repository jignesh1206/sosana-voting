'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Solana imports
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, BN, web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '@/contracts/idl.json';
import { BlockchainRound } from '@/types';

interface Nomination {
  publicKey: PublicKey;
  account: any; // Using any to handle Anchor's complex type system
}

export default function RoundsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Solana wallet and connection hooks
  const wallet = useWallet();
  const { connection } = useConnection();
  
  // Smart contract state
  const [isLoading, setIsLoading] = useState(false);
  const [existingBlockchainRounds, setExistingBlockchainRounds] = useState<any[]>([]);
  const [configPublicKey, setConfigPublicKey] = useState<PublicKey | null>(null);
  const [showInitPopup, setShowInitPopup] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [formData, setFormData] = useState({
    roundStartTime: '',
    votingStartTime: '',
    roundEndTime: '',
    preLaunch: false,
    numberOfNominations: '25'
  });

  // Nominations modal state
  const [showNominationsModal, setShowNominationsModal] = useState(false);
  const [selectedRound, setSelectedRound] = useState<any>(null);
  const [roundNominations, setRoundNominations] = useState<Nomination[]>([]);
  const [nominationsLoading, setNominationsLoading] = useState(false);

  // Initialize Solana program
  const getSolanaProgram = () => {
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
    });
    
    const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
    return new Program(idl as any, programId, provider);
  };

  // Generate config PDA
  const getConfigPDA = () => {
    const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
    const [sosanaPda, sosanaBump] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("sosana-vote-pda")],
      programId
    );
    return sosanaPda;
  };

  // Check if config account exists
  const checkConfigAccount = async () => {
    try {
      if (!wallet.connected) return;
      
      const program = getSolanaProgram();
      const configs = await program.account.config.all();
      
      if (configs.length === 0) {
        console.log('⚠️ No config account found, showing initialization popup');
        setShowInitPopup(true);
        setConfigPublicKey(null);
      } else {
        console.log('✅ Config account found:', configs[0].publicKey.toString());
        setConfigPublicKey(configs[0].publicKey);
        setShowInitPopup(false);
      }
    } catch (error) {
      console.error('❌ Error checking config account:', error);
      // If error occurs, assume config doesn't exist
      setShowInitPopup(true);
      setConfigPublicKey(null);
    }
  };

  // Initialize config account
  const initializeConfig = async () => {
    try {
      setInitLoading(true);
      
      if (!wallet.connected) {
        toast.error('Please connect your Solana wallet');
        return;
      }

      const program = getSolanaProgram();
      const configPDA = getConfigPDA();
      
      console.log('🔗 Initializing config account...');
      console.log('📋 Config PDA:', configPDA.toString());
      
      // Call the initialize instruction
      const tx = await program.methods
        .initialize()
        .accounts({
          config: configPDA,
          signer: wallet.publicKey!,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Config account initialized successfully!');
      console.log('📝 Transaction signature:', tx);
      
      toast.success('Config account initialized successfully!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Update state
      setConfigPublicKey(configPDA);
      setShowInitPopup(false);
      
    } catch (error: any) {
      console.error('❌ Error initializing config:', error);
      const errorMessage = error.message || 'Failed to initialize config account';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setInitLoading(false);
    }
  };

  // Fetch existing blockchain rounds
  const fetchExistingBlockchainRounds = async () => {
    try {
      if (!wallet.connected) return;
      
      const program = getSolanaProgram();
      const allRounds = await program.account.rounds.all();
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Filter for active rounds (current time between roundStartTime and roundEndTime)
      const activeRounds = allRounds?.filter(round => {
        const startTime = safeToNumber((round?.account as any).roundStartTime);
        const endTime = safeToNumber((round.account as any).roundEndTime);
        
        return currentTime >= startTime && currentTime <= endTime;
      });
      
      setExistingBlockchainRounds(allRounds);
      console.log('📋 Fetched existing blockchain rounds:', allRounds);
      console.log('🎯 Active rounds:', activeRounds);
    } catch (error) {
      console.error('❌ Error fetching blockchain rounds:', error);
      toast.error('Failed to fetch existing blockchain rounds');
    }
  };

  useEffect(() => {
    if (wallet.connected) {
      checkConfigAccount();
      fetchExistingBlockchainRounds();
    }
  }, [wallet.connected]);

  const handleRefresh = () => {
    if (wallet.connected) {
      fetchExistingBlockchainRounds();
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Submit form and call startRound
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      
      if (!wallet.connected) {
        toast.error('Please connect your Solana wallet');
        return;
      }

      if (!configPublicKey) {
        toast.error('Please initialize config account first');
        return;
      }

      // Convert datetime-local inputs to timestamps
      const roundStartTimestamp = Math.floor(new Date(formData.roundStartTime).getTime() / 1000);
      const votingStartTimestamp = Math.floor(new Date(formData.votingStartTime).getTime() / 1000);
      const roundEndTimestamp = Math.floor(new Date(formData.roundEndTime).getTime() / 1000);

      console.log('📅 Timestamps:', {
        roundStart: roundStartTimestamp,
        votingStart: votingStartTimestamp,
        roundEnd: roundEndTimestamp,
        preLaunch: formData.preLaunch
      });

      const program = getSolanaProgram();
      const roundKeypair = web3.Keypair.generate();
      
      // Call the startRound instruction
      const tx = await program.methods
        .startRound(
          new BN(roundStartTimestamp),
          new BN(votingStartTimestamp),
          new BN(roundEndTimestamp),
          new BN(parseInt(formData.numberOfNominations || '0')),
          formData.preLaunch
        )
        .accounts({
          rounds: roundKeypair.publicKey,
          config: configPublicKey || getConfigPDA(),
          signer: wallet.publicKey!,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([roundKeypair])
        .rpc();

      console.log('✅ Round created successfully!');
      console.log('📝 Transaction signature:', tx);
      console.log('🔑 Round public key:', roundKeypair.publicKey.toString());
      
      toast.success('Round created successfully on blockchain!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Reset form
      setFormData({
        roundStartTime: '',
        votingStartTime: '',
        roundEndTime: '',
        preLaunch: false,
        numberOfNominations: '25'
      });

      // Hide create form
      setShowCreateForm(false);

      // Refresh existing rounds
      await fetchExistingBlockchainRounds();
      
    } catch (error: any) {
      console.error('❌ Error creating round:', error);
      const errorMessage = error.message || 'Failed to create round';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to safely convert BN objects to numbers
  const safeToNumber = (value: any): number => {
    try {
      if (typeof value === 'number') {
        return value;
      } else if (typeof value === 'string') {
        return parseInt(value);
      } else if (value && typeof value === 'object' && value.toNumber) {
        return value.toNumber();
      } else if (value && typeof value === 'object' && value.toString) {
        return parseInt(value.toString());
      } else {
        return 0;
      }
    } catch (error) {
      console.error('Error converting to number:', error, value);
      return 0;
    }
  };

  // Helper function to safely convert to string
  const safeToString = (value: any): string => {
    try {
      if (typeof value === 'string') {
        return value;
      } else if (value && typeof value === 'object' && value.toString) {
        return value.toString();
      } else {
        return '';
      }
    } catch (error) {
      console.error('Error converting to string:', error, value);
      return '';
    }
  };

  // Helper function to safely get array length
  const safeArrayLength = (value: any): number => {
    try {
      if (Array.isArray(value)) {
        return value.length;
      } else if (value && typeof value === 'object' && Array.isArray(value)) {
        return value.length;
      } else {
        return 0;
      }
    } catch (error) {
      console.error('Error getting array length:', error, value);
      return 0;
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: any) => {
    try {
      const timeValue = safeToNumber(timestamp);
      return new Date(timeValue * 1000).toLocaleString();
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Invalid timestamp';
    }
  };

  // Fetch nominations for a specific round
  const fetchRoundNominations = async (roundAddress: PublicKey) => {
    try {
      setNominationsLoading(true);
      
      if (!wallet.connected) {
        toast.error('Please connect your Solana wallet');
        return;
      }

      const program = getSolanaProgram();
      const allNominations = await program.account.nomination.all();
      
      // Filter nominations by round address
      const filteredNominations = allNominations.filter(nomination => 
        (nomination.account as any).roundAddress.equals(roundAddress)
      );
      
      setRoundNominations(filteredNominations);
      console.log('📋 Fetched nominations for round:', roundAddress.toString());
      console.log('🎯 Nominations found:', filteredNominations.length);
      
    } catch (error) {
      console.error('❌ Error fetching round nominations:', error);
      toast.error('Failed to fetch nominations for this round');
    } finally {
      setNominationsLoading(false);
    }
  };

  // Handle view nominations button click
  const handleViewNominations = (round: any) => {
    setSelectedRound(round);
    setShowNominationsModal(true);
    fetchRoundNominations(round.publicKey);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rounds Management</h1>
          <p className="text-foreground/60">Manage voting rounds and schedules</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            title="Refresh rounds"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors glow-button"
          >
            {showCreateForm ? 'Cancel Create' : 'Create New Round'}
          </button>
        </div>
      </div>

      {/* Wallet Connection Status */}
      {!wallet.connected && (
        <div className="cosmic-card p-6 border-2 border-yellow-500/50 bg-yellow-500/10">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Wallet Not Connected</h3>
              <p className="text-foreground/60 mt-1">
                Please connect your Solana wallet to create rounds on the blockchain.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Config Initialization Popup */}
      {showInitPopup && wallet.connected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="cosmic-card p-8 max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-bold text-foreground mb-2">Initialize Config Account</h3>
              <p className="text-foreground/60">
                The config account needs to be initialized before creating rounds. This is a one-time setup.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-card-highlight rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">ℹ️</div>
                  <div>
                    <h4 className="font-semibold text-foreground">Config PDA</h4>
                    <p className="text-sm text-foreground/60 font-mono">
                      {getConfigPDA().toString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInitPopup(false)}
                  disabled={initLoading}
                  className="flex-1 px-4 py-2 text-foreground/80 bg-secondary rounded-lg hover:bg-card-highlight transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={initializeConfig}
                  disabled={initLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                >
                  {initLoading ? 'Initializing...' : 'Initialize Config'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Round Form */}
      {showCreateForm && (
        <div className="cosmic-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Create New Round</h2>
            <p className="text-foreground/60">Set up a new voting round with smart contract integration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Round Type */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Round Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  !formData.preLaunch 
                    ? 'border-primary bg-primary/10' 
                    : 'border-card-border hover:border-primary/50'
                }`} onClick={() => setFormData(prev => ({ ...prev, preLaunch: false }))}>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🪙</div>
                    <div>
                      <div className="font-semibold text-foreground">Live Token Round</div>
                      <div className="text-sm text-foreground/60">Existing tokens on Solana</div>
                    </div>
                  </div>
                </div>
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  formData.preLaunch 
                    ? 'border-primary bg-primary/10' 
                    : 'border-card-border hover:border-primary/50'
                }`} onClick={() => setFormData(prev => ({ ...prev, preLaunch: true }))}>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🚀</div>
                    <div>
                      <div className="font-semibold text-foreground">Pre-Launch Round</div>
                      <div className="text-sm text-foreground/60">Upcoming token projects</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Fields */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">⏰ Round Timeline</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20">
                  <div className="text-center mb-3">
                    <div className="text-2xl mb-1">🏆</div>
                    <h4 className="font-semibold text-foreground">Nomination Start</h4>
                  </div>
                  <input
                    type="datetime-local"
                    name="roundStartTime"
                    value={formData.roundStartTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-secondary text-foreground"
                  />
                </div>

                <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20">
                  <div className="text-center mb-3">
                    <div className="text-2xl mb-1">🗳️</div>
                    <h4 className="font-semibold text-foreground">Voting Start</h4>
                  </div>
                  <input
                    type="datetime-local"
                    name="votingStartTime"
                    value={formData.votingStartTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-secondary text-foreground"
                  />
                </div>

                <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl border border-red-500/20">
                  <div className="text-center mb-3">
                    <div className="text-2xl mb-1">🏁</div>
                    <h4 className="font-semibold text-foreground">Round End</h4>
                  </div>
                  <input
                    type="datetime-local"
                    name="roundEndTime"
                    value={formData.roundEndTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-secondary text-foreground"
                  />
                </div>
              </div>

              <div className="p-4 bg-card-highlight rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">ℹ️</div>
                  <div>
                    <h4 className="font-semibold text-foreground">Timeline Requirements</h4>
                    <p className="text-sm text-foreground/60">
                      Nomination Start &lt; Voting Start &lt; Round End
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Number of Nominations */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Number of Nominations
              </label>
              <input
                type="number"
                name="numberOfNominations"
                min={1}
                value={formData.numberOfNominations}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-secondary text-foreground"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !wallet.connected || !configPublicKey}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
            >
              {isLoading ? 'Creating Round...' : 
               !wallet.connected ? 'Connect Wallet' : 
               !configPublicKey ? 'Initialize Config First' :
               'Create Round on Blockchain'}
            </button>
          </form>
        </div>
      )}

      {/* Active Rounds List */}
      {wallet.connected && (
        <div className="cosmic-card p-6">
         

          {(() => {
            const currentTime = Math.floor(Date.now() / 1000);
                         const activeRounds = existingBlockchainRounds?.filter(round => {
               const startTime = safeToNumber((round.account as any).roundStartTime);
               const endTime = safeToNumber((round.account as any).roundEndTime);
               return currentTime >= startTime && currentTime <= endTime;
             });

            if (activeRounds.length === 0) {
              return (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">⏰</div>
                  <h4 className="text-lg font-semibold text-foreground mb-1">No Active Rounds</h4>
                  <p className="text-foreground/60">There are currently no active rounds on the blockchain</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {activeRounds.map((round, index) => {
                   const startTime = safeToNumber((round.account as any).roundStartTime);
                   const votingStartTime = safeToNumber((round.account as any).votingStartTime);
                   const endTime = safeToNumber((round.account as any).roundEndTime);
                   const isNominating = currentTime >= startTime && currentTime < votingStartTime;
                   const isVoting = currentTime >= votingStartTime && currentTime <= endTime;

                  return (
                    <div key={round.publicKey.toString()} className="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-foreground">
                          Round #{safeToString((round.account as any).roundNo)}
                        </h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isNominating 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {isNominating ? '📝 Nominating' : '🗳️ Voting'}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Type:</span>
                          <span className="text-foreground">
                            {(round.account as any).isPreLaunch ? '🚀 Pre-Launch' : '🪙 Live Token'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Created:</span>
                          <span className="text-foreground">{formatTimestamp((round.account as any).created)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Round Start:</span>
                          <span className="text-foreground">{formatTimestamp((round.account as any).roundStartTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Voting Start:</span>
                          <span className="text-foreground">{formatTimestamp((round.account as any).votingStartTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Round End:</span>
                          <span className="text-foreground">{formatTimestamp((round.account as any).roundEndTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Nominators:</span>
                          <span className="text-foreground">{safeArrayLength((round.account as any).nominators)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Token Mints:</span>
                          <span className="text-foreground">{safeArrayLength((round.account as any).tokenMints)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Winners:</span>
                          <span className="text-foreground">{safeArrayLength((round.account as any).winnersAddress)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Claimed:</span>
                          <span className={`text-foreground ${(round.account as any).isClaim ? 'text-green-400' : 'text-red-400'}`}>
                            {(round.account as any).isClaim ? '✅ Yes' : '❌ No'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-card-border">
                        <p className="text-xs text-foreground/40 font-mono mb-3">
                          {round.publicKey.toString().slice(0, 8)}...{round.publicKey.toString().slice(-8)}
                        </p>
                        <button
                          onClick={() => handleViewNominations(round)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium text-sm"
                        >
                          📋 View Nominations
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* All Blockchain Rounds Display */}
      {wallet.connected && (
        <div className="cosmic-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">🔗 All Blockchain Rounds</h3>
            <p className="text-foreground/60">All rounds created on Solana blockchain</p>
          </div>

          {existingBlockchainRounds.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📋</div>
              <h4 className="text-lg font-semibold text-foreground mb-1">No Blockchain Rounds Found</h4>
              <p className="text-foreground/60">Create your first round to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                             {existingBlockchainRounds.map((round, index) => {
                 const currentTime = Math.floor(Date.now() / 1000);
                 const startTime = safeToNumber((round.account as any).roundStartTime);
                 const endTime = safeToNumber((round.account as any).roundEndTime);
                 const isActive = currentTime >= startTime && currentTime <= endTime;
                 const isUpcoming = currentTime < startTime;
                 const isFinished = currentTime > endTime;

                 // Determine status and styling
                 let statusText, statusClass;
                 if (isUpcoming) {
                   statusText = 'Upcoming';
                   statusClass = 'bg-amber-500/20 text-amber-400';
                 } else if (isActive) {
                   statusText = 'Active';
                   statusClass = 'bg-green-500/20 text-green-400';
                 } else if (isFinished) {
                   statusText = 'Finished';
                   statusClass = 'bg-red-500/20 text-red-400';
                 } else {
                   statusText = 'Inactive';
                   statusClass = 'bg-gray-500/20 text-gray-400';
                 }

                return (
                  <div key={round.publicKey.toString()} className="p-4 bg-card-highlight rounded-xl border border-card-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">
                        Round #{safeToString((round.account as any).roundNo)}
                      </h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                        {isUpcoming ? '⏳' : isActive ? '🟢' : isFinished ? '🏁' : '⚫'} {statusText}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Type:</span>
                        <span className="text-foreground">
                          {(round.account as any).isPreLaunch ? '🚀 Pre-Launch' : '🪙 Live Token'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Created:</span>
                        <span className="text-foreground">{formatTimestamp((round.account as any).created)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Nomination Start:</span>
                        <span className="text-foreground">{formatTimestamp((round.account as any).roundStartTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Voting Start:</span>
                        <span className="text-foreground">{formatTimestamp((round.account as any).votingStartTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Round End:</span>
                        <span className="text-foreground">{formatTimestamp((round.account as any).roundEndTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Nominators:</span>
                        <span className="text-foreground">{safeArrayLength((round.account as any).nominators)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Token Mints:</span>
                        <span className="text-foreground">{safeArrayLength((round.account as any).tokenMints)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Winners:</span>
                        <span className="text-foreground">{safeArrayLength((round.account as any).winnersAddress)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Claimed:</span>
                        <span className={`text-foreground ${(round.account as any).isClaim ? 'text-green-400' : 'text-red-400'}`}>
                          {(round.account as any).isClaim ? '✅ Yes' : '❌ No'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-card-border">
                      <p className="text-xs text-foreground/40 font-mono mb-3">
                        {round.publicKey.toString().slice(0, 8)}...{round.publicKey.toString().slice(-8)}
                      </p>
                      <button
                        onClick={() => handleViewNominations(round)}
                        className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium text-sm"
                      >
                        📋 View Nominations
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Nominations Modal */}
      {showNominationsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="cosmic-card p-8 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  📋 Round Nominations
                </h3>
                <p className="text-foreground/60 mt-1">
                  Round #{selectedRound ? safeToString((selectedRound.account as any).roundNo) : 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setShowNominationsModal(false)}
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {nominationsLoading ? (
              <div className="text-center py-8">
                <div className="text-2xl mb-4">⏳</div>
                <p className="text-foreground/60">Loading nominations...</p>
              </div>
            ) : roundNominations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-4">📭</div>
                <h4 className="text-lg font-semibold text-foreground mb-2">No Nominations Found</h4>
                <p className="text-foreground/60">This round has no nominations yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {roundNominations.map((nomination, index) => {
                  const account = nomination.account as any;
                  return (
                    <div key={nomination.publicKey.toString()} className="p-6 bg-card-highlight rounded-xl border border-card-border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">🪙</div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              Nomination #{index + 1}
                            </h4>
                            <p className="text-sm text-foreground/60 font-mono">
                              {nomination.publicKey.toString().slice(0, 8)}...{nomination.publicKey.toString().slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {account.isWinner && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                              🏆 Winner
                            </span>
                          )}
                          {account.isClaim && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                              ✅ Claimed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-foreground/60">Token Mint:</span>
                            <span className="text-foreground font-mono text-sm">
                              {account.tokenMint.toString().slice(0, 8)}...{account.tokenMint.toString().slice(-8)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground/60">Nominator:</span>
                            <span className="text-foreground font-mono text-sm">
                              {account.nominator.toString().slice(0, 8)}...{account.nominator.toString().slice(-8)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-foreground/60">Vote Count:</span>
                            <span className="text-foreground font-semibold">
                              {safeToNumber(account.voteCount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Voters List */}
                      <div className="border-t border-card-border pt-4">
                        <h5 className="font-semibold text-foreground mb-3 flex items-center">
                          <span className="mr-2">👥</span>
                          Voters ({safeArrayLength(account.voters)})
                        </h5>
                        {safeArrayLength(account.voters) === 0 ? (
                          <p className="text-foreground/60 text-sm">No votes yet</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {account.voters.map((voter: PublicKey, voterIndex: number) => (
                              <div key={voterIndex} className="p-2 bg-secondary rounded-lg">
                                <p className="text-xs font-mono text-foreground/80">
                                  {voter.toString().slice(0, 6)}...{voter.toString().slice(-6)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={3000}
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