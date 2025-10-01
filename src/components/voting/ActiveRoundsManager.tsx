'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, BN, web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'react-toastify';
import idl from '@/contracts/idl.json';
import { TokenType } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CountdownTimer from '@/components/ui/CountdownTimer';

interface BlockchainRound {
  publicKey: PublicKey;
  account: any; // Using any to handle Anchor's complex type system
}

interface Nomination {
  publicKey: PublicKey;
  account: any; // Using any to handle Anchor's complex type system
}

interface VoteTracker {
  publicKey: PublicKey;
  account: any; // Using any to handle Anchor's complex type system
}

interface ActiveRoundsManagerProps {
  roundType: TokenType;
  className?: string;
}

export default function ActiveRoundsManager({ 
  roundType, 
  className = '' 
}: ActiveRoundsManagerProps) {
  const wallet = useWallet();
  const { connection } = useConnection();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeRounds, setActiveRounds] = useState<BlockchainRound[]>([]);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [voteTrackers, setVoteTrackers] = useState<VoteTracker[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [nominationForm, setNominationForm] = useState({
    tokenMint: ''
  });

  // Helper function to safely convert values to strings
  const safeToString = (value: any): string => {
    if (!value) return 'N/A';
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && value.toNumber) {
      return value.toNumber().toString();
    }
    if (typeof value === 'object' && value.toString) {
      return value.toString();
    }
    return String(value);
  };

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

  // Initialize program when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      try {
        const programInstance = getSolanaProgram();
        setProgram(programInstance);
      } catch (error) {
        console.error('Failed to initialize program:', error);
      }
    }
  }, [wallet.connected, connection]);

  // Fetch active rounds from blockchain
  const fetchActiveRounds = async () => {
    if (!program) return;

    try {
      setIsLoading(true);
      const allRounds = await program.account.rounds.all();
      const currentTime = Math.floor(Date.now() / 1000);
      
             // Filter for active rounds (current time between roundStartTime and roundEndTime)
       const active = allRounds.filter(round => {
         const startTime = parseInt((round.account as any).roundStartTime);
         const endTime = parseInt((round.account as any).roundEndTime);
         const isPreLaunch = (round.account as any).isPreLaunch;
         
         return currentTime >= startTime && 
                currentTime <= endTime && 
                isPreLaunch === (roundType === 'pre-launch');
       });

      setActiveRounds(active);
      console.log('Active rounds:', active);
    } catch (error) {
      console.error('Error fetching active rounds:', error);
      toast.error('Failed to fetch active rounds');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch nominations for a specific round
  const fetchNominations = async (roundPubkey: PublicKey) => {
    if (!program) return;

    try {
      const allNominations = await program.account.nomination.all();
      const roundNominations = allNominations.filter(nom => 
        nom.account.roundAddress.equals(roundPubkey)
      );
      
      setNominations(roundNominations);
      console.log('Nominations for round:', roundNominations);
    } catch (error) {
      console.error('Error fetching nominations:', error);
      toast.error('Failed to fetch nominations');
    }
  };

  // Check if user has already voted in a round
  const checkUserVote = async (roundPubkey: PublicKey) => {
    if (!program || !wallet.publicKey) return;

    try {
      const allVoteTrackers = await program.account.voteTracker.all();
      const userVote = allVoteTrackers.find(vote => 
        vote.account.voter.equals(wallet.publicKey!) && 
        vote.account.round.equals(roundPubkey)
      );
      
      if (userVote) {
        setUserVotes(prev => new Set([...prev, roundPubkey.toString()]));
      }
    } catch (error) {
      console.error('Error checking user vote:', error);
    }
  };

  // Create nomination
  const handleCreateNomination = async (roundPubkey: PublicKey) => {
    if (!program || !wallet.publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!nominationForm.tokenMint) {
      toast.error('Please enter a token mint address');
      return;
    }

    try {
      const nomination = web3.Keypair.generate();
      const snapshotAmount = new BN(1000); // Default snapshot amount
      
      await program.methods
        .createNominate(snapshotAmount)
        .accounts({
          nomination: nomination.publicKey,
          rounds: roundPubkey,
          signer: wallet.publicKey!,
          tokenMint: new PublicKey(nominationForm.tokenMint),
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([nomination])
        .rpc();

      toast.success('Nomination created successfully!');
      
      // Refresh nominations for all active rounds
      activeRounds.forEach(round => {
        fetchNominations(round.publicKey);
      });
      
      // Reset form
      setNominationForm({
        tokenMint: ''
      });
    } catch (error: any) {
      console.error('Error creating nomination:', error);
      toast.error(`Failed to create nomination: ${error.message}`);
    }
  };

  // Cast vote
  const handleCastVote = async (roundPubkey: PublicKey, nominationPubkey: PublicKey) => {
    if (!program || !wallet.publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    // Check if user has already voted
    if (userVotes.has(roundPubkey.toString())) {
      toast.error('You have already voted in this round');
      return;
    }

    try {
      const voteTracker = web3.Keypair.generate();
      
      await program.methods
        .castVote(roundPubkey)
        .accounts({
          nomination: nominationPubkey,
          rounds: roundPubkey,
          voteTracker: voteTracker.publicKey,
          signer: wallet.publicKey!,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([voteTracker])
        .rpc();

      toast.success('Vote cast successfully!');
      
      // Refresh vote trackers and nominations
      await fetchVoteTrackers();
      await fetchNominations(roundPubkey);
    } catch (error: any) {
      console.error('Error casting vote:', error);
      toast.error(`Failed to cast vote: ${error.message}`);
    }
  };

  // Load data when program is ready
  useEffect(() => {
    if (program) {
      fetchActiveRounds();
    }
  }, [program]);

  // Fetch all vote trackers for the current user
  const fetchVoteTrackers = async () => {
    if (!program || !wallet.publicKey) return;

    try {
      const allVoteTrackers = await program.account.voteTracker.all();
      const userVoteTrackers = allVoteTrackers.filter(vote => 
        vote.account.voter.equals(wallet.publicKey!)
      );
      setVoteTrackers(userVoteTrackers);
      console.log('User vote trackers:', userVoteTrackers);
    } catch (error) {
      console.error('Error fetching vote trackers:', error);
    }
  };

  // Load nominations and check votes when active rounds change
  useEffect(() => {
    if (program && activeRounds.length > 0) {
      activeRounds.forEach(round => {
        fetchNominations(round.publicKey);
      });
      fetchVoteTrackers();
    }
  }, [program, activeRounds]);

  // Check user votes when vote trackers change
  useEffect(() => {
    if (voteTrackers.length > 0 && activeRounds.length > 0) {
      const votedRounds = new Set<string>();
      voteTrackers.forEach(tracker => {
        activeRounds.forEach(round => {
          if (tracker.account.round.equals(round.publicKey)) {
            votedRounds.add(round.publicKey.toString());
          }
        });
      });
      setUserVotes(votedRounds);
    }
  }, [voteTrackers, activeRounds]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading active rounds..." />
      </div>
    );
  }

  if (activeRounds.length === 0) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">No Active Rounds</h3>
          <p className="text-foreground/60 mb-4">
            There are currently no active {roundType} rounds. Check back later!
          </p>
          <button
            onClick={fetchActiveRounds}
            className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Refresh Rounds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Debug Info */}
      <div className="cosmic-card p-4 bg-secondary/20">
        <h4 className="font-medium text-foreground mb-2">Debug Information</h4>
        <p className="text-sm text-foreground/60">
          Active Rounds: {activeRounds.length} | 
          Nominations: {nominations.length} | 
          User Vote Trackers: {voteTrackers.length} | 
          User Voted Rounds: {userVotes.size}
        </p>
      </div>

             {activeRounds.map((round) => {
         const currentTime = Math.floor(Date.now() / 1000);
         const startTime = parseInt((round.account as any).roundStartTime);
         const votingStartTime = parseInt((round.account as any).votingStartTime);
         const endTime = parseInt((round.account as any).roundEndTime);
        
        const isNominating = currentTime >= startTime && currentTime < votingStartTime;
        const isVoting = currentTime >= votingStartTime && currentTime <= endTime;
        const hasUserVoted = userVotes.has(round.publicKey.toString());

        return (
          <div key={round.publicKey.toString()} className="cosmic-card p-6">
            {/* Round Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {roundType === 'live' ? 'Live Token' : 'Pre-Launch Token'} Round
                </h3>
                <p className="text-foreground/60">
                  Round ID: {round.publicKey.toString().slice(0, 8)}...
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  isNominating 
                    ? 'bg-blue-900/30 text-blue-400 border-blue-400/30' 
                    : 'bg-green-900/30 text-green-400 border-green-400/30'
                }`}>
                  <span className="mr-2">
                    {isNominating ? '📝' : '🗳️'}
                  </span>
                  {isNominating ? 'Nominating' : 'Voting'}
                </div>
                <button
                  onClick={() => {
                    fetchNominations(round.publicKey);
                    fetchVoteTrackers();
                  }}
                  className="ml-2 bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Round Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                <h4 className="font-medium text-foreground mb-2">Round Start</h4>
                <p className="text-sm text-foreground/60">
                  {new Date(startTime * 1000).toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                <h4 className="font-medium text-foreground mb-2">Voting Start</h4>
                <p className="text-sm text-foreground/60">
                  {new Date(votingStartTime * 1000).toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                <h4 className="font-medium text-foreground mb-2">Round End</h4>
                <div className="text-sm">
                  <CountdownTimer 
                    targetDate={new Date(endTime * 1000)}
                    mode="ends"
                    compact={true}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Nomination Phase */}
            {isNominating && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Create Nomination</h4>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Token Mint Address"
                    value={nominationForm.tokenMint}
                    onChange={(e) => setNominationForm(prev => ({ ...prev, tokenMint: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40"
                  />
                </div>
                <button
                  onClick={() => handleCreateNomination(round.publicKey)}
                  className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Nomination
                </button>
              </div>
            )}

            {/* Voting Phase */}
            {isVoting && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Vote for Tokens</h4>
                {nominations.length === 0 ? (
                  <p className="text-foreground/60">No nominations available for voting.</p>
                ) : (
                  <div className="space-y-4">
                    {nominations.map((nomination) => (
                      <div key={nomination.publicKey.toString()} className="p-4 rounded-lg border border-card-border bg-secondary/20">
                        <div className="flex items-center justify-between">
                          <div>
                                                         <p className="font-medium text-foreground">
                               Token: {(nomination.account as any).tokenMint?.toString?.().slice(0, 8) || 'Unknown'}...
                             </p>
                             <p className="text-sm text-foreground/60">
                               Nominator: {(nomination.account as any).nominator?.toString?.().slice(0, 8) || 'Unknown'}...
                             </p>
                                                         <p className="text-sm text-foreground/60">
                               Snapshot Amount: {safeToString((nomination.account as any).snapshotAmount)}
                             </p>
                             <p className="text-sm text-foreground/60">
                               Votes: {safeToString((nomination.account as any).voteCount)}
                             </p>
                          </div>
                          <button
                            onClick={() => handleCastVote(round.publicKey, nomination.publicKey)}
                            disabled={hasUserVoted}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              hasUserVoted
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                : 'bg-accent hover:bg-accent/80 text-white'
                            }`}
                          >
                            {hasUserVoted ? 'Already Voted' : 'Vote'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Current Nominations Display */}
            {nominations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-4">Current Nominations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nominations.map((nomination) => (
                    <div key={nomination.publicKey.toString()} className="p-4 rounded-lg border border-card-border bg-secondary/20">
                                             <p className="font-medium text-foreground mb-2">
                         {(nomination.account as any).tokenMint?.toString?.().slice(0, 8) || 'Unknown'}...
                       </p>
                       <p className="text-sm text-foreground/60 mb-1">
                         Nominator: {(nomination.account as any).nominator?.toString?.().slice(0, 8) || 'Unknown'}...
                       </p>
                                             <p className="text-sm text-foreground/60 mb-1">
                         Amount: {safeToString((nomination.account as any).snapshotAmount)}
                       </p>
                       <p className="text-sm text-foreground/60">
                         Votes: {safeToString((nomination.account as any).voteCount)}
                       </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
