'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Solana imports
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, BN, web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '@/contracts/idl.json';

interface Round {
  publicKey: PublicKey;
  account: any; // Using any to handle Anchor's complex type system
}

export default function CreateRoundPage() {
  const router = useRouter();
  
  // Solana wallet and connection hooks
  const wallet = useWallet();
  const { connection } = useConnection();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [existingRounds, setExistingRounds] = useState<Round[]>([]);
  const [configPublicKey, setConfigPublicKey] = useState<PublicKey | null>(null);
  const [showInitPopup, setShowInitPopup] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [formData, setFormData] = useState({
    roundStartTime: '',
    votingStartTime: '',
    roundEndTime: '',
    preLaunch: false
  });

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
      [Buffer.from("sosana-pda")],
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

  // Fetch existing rounds
  const fetchExistingRounds = async () => {
    try {
      if (!wallet.connected) return;
      
      const program = getSolanaProgram();
      const rounds = await program.account.rounds.all();
      setExistingRounds(rounds);
      console.log('📋 Fetched existing rounds:', rounds);
    } catch (error) {
      console.error('❌ Error fetching rounds:', error);
      toast.error('Failed to fetch existing rounds');
    }
  };

  // Load existing rounds on component mount and wallet connection
  useEffect(() => {
    if (wallet.connected) {
      checkConfigAccount();
      fetchExistingRounds();
    }
  }, [wallet.connected]);

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
      if (!wallet.connected) {
        toast.error('Please connect your Solana wallet');
        return;
      }

      // Validate required fields
      if (!formData.roundStartTime || !formData.votingStartTime || !formData.roundEndTime) {
        toast.error('Please fill in all required timing fields');
        return;
      }

      // Validate dates
      const roundStart = new Date(formData.roundStartTime);
      const votingStart = new Date(formData.votingStartTime);
      const roundEnd = new Date(formData.roundEndTime);

      if (isNaN(roundStart.getTime()) || isNaN(votingStart.getTime()) || isNaN(roundEnd.getTime())) {
        toast.error('Invalid date/time format');
        return;
      }

      if (roundStart >= votingStart || votingStart >= roundEnd) {
        toast.error('Invalid timeline: Round start < Voting start < Round end');
        return;
      }

      setIsLoading(true);

      const program = getSolanaProgram();
      
      // Convert dates to timestamps (seconds since epoch)
      const roundStartTimestamp = Math.floor(roundStart.getTime() / 1000);
      const votingStartTimestamp = Math.floor(votingStart.getTime() / 1000);
      const roundEndTimestamp = Math.floor(roundEnd.getTime() / 1000);
      
      console.log('🔗 Creating round with parameters:', {
        roundStartTime: roundStartTimestamp,
        votingStartTime: votingStartTimestamp,
        roundEndTime: roundEndTimestamp,
        preLaunch: formData.preLaunch
      });

      // Generate round account keypair
      const roundKeypair = web3.Keypair.generate();
      
             // Call the startRound instruction
       const tx = await program.methods
         .startRound(
           new BN(roundStartTimestamp),
           new BN(votingStartTimestamp),
           new BN(roundEndTimestamp),
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
        preLaunch: false
      });

      // Refresh existing rounds
      await fetchExistingRounds();
      
    } catch (error: any) {
      console.error('❌ Error creating round:', error);
      const errorMessage = error.message || 'Failed to create round';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: any) => {
    if (timestamp && timestamp.toNumber) {
      return new Date(timestamp.toNumber() * 1000).toLocaleString();
    }
    return 'Invalid timestamp';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card-highlight">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create New Round
            </h1>
            <p className="text-foreground/60 mt-2">Create and manage voting rounds on Solana blockchain</p>
          </div>
          <Link
            href="/admin/rounds"
            className="flex items-center space-x-2 px-4 py-2 text-foreground/80 bg-secondary rounded-lg hover:bg-card-highlight transition-all duration-200"
          >
            <span>←</span>
            <span>Back to Rounds</span>
          </Link>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Round Form */}
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

                     {/* Existing Rounds */}
           <div className="cosmic-card p-8">
             <div className="mb-6">
               <h2 className="text-2xl font-bold text-foreground mb-2">Existing Rounds</h2>
               <p className="text-foreground/60">Rounds created on the blockchain</p>
               {configPublicKey && (
                 <div className="mt-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                   <p className="text-sm text-green-400">
                     ✅ Config initialized: {configPublicKey.toString().slice(0, 8)}...{configPublicKey.toString().slice(-8)}
                   </p>
                 </div>
               )}
             </div>

            {existingRounds.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Rounds Found</h3>
                <p className="text-foreground/60">Create your first round to get started</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {existingRounds.map((round, index) => (
                  <div key={round.publicKey.toString()} className="p-4 bg-card-highlight rounded-xl border border-card-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">
                        Round #{index + 1}
                      </h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        round.account?.isActive 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {round.account?.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Type:</span>
                        <span className="text-foreground">
                          {round.account?.preLaunch ? '🚀 Pre-Launch' : '🪙 Live Token'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Nomination Start:</span>
                        <span className="text-foreground">{formatTimestamp(round.account?.roundStartTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Voting Start:</span>
                        <span className="text-foreground">{formatTimestamp(round.account?.votingStartTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Round End:</span>
                        <span className="text-foreground">{formatTimestamp(round.account?.roundEndTime)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-card-border">
                      <p className="text-xs text-foreground/40 font-mono">
                        {round.publicKey.toString().slice(0, 8)}...{round.publicKey.toString().slice(-8)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-card-border">
              <button
                onClick={fetchExistingRounds}
                disabled={!wallet.connected}
                className="w-full px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-card-highlight transition-colors disabled:opacity-50"
              >
                Refresh Rounds
              </button>
            </div>
          </div>
        </div>
      </div>
      
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