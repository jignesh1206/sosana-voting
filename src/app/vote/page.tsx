"use client"

import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { useState, useEffect, useCallback } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { PublicKey } from "@solana/web3.js"
import { CheckCircleIcon } from "@heroicons/react/20/solid"
import type { BlockchainToken, BlockchainRound } from "@/components/interface"
import Countdown from "react-countdown"
// Solana imports
import { AnchorProvider, Program, web3 } from '@project-serum/anchor';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import idl from '@/contracts/idl.json';
// Metaplex imports
import { Metaplex } from '@metaplex-foundation/js';

// Polyfill for crypto in browser environment



export default function Vote() {
  const wallet = useWallet()
  const { connection } = useConnection()
  
  // State
  const [balance, setBalance] = useState(0)
  const [spentBalance, setSpentBalance] = useState(0)
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokens, setTokens] = useState<BlockchainToken[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [currentRound, setCurrentRound] = useState<BlockchainRound | null>(null)
  const [allRounds, setAllRounds] = useState<BlockchainRound[]>([])
  const [isVotingEnabled, setIsVotingEnabled] = useState(false)
  const [isNominationEnabled, setIsNominationEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [nominations, setNominations] = useState<any[]>([])
  const [voteTrackers, setVoteTrackers] = useState<any[]>([])
  const [configAccount, setConfigAccount] = useState<any>(null)
  const metaplex = Metaplex.make(connection);
  
  // Live SOSANA to USD conversion rate
  const [sosanaToUsdRate, setSosanaToUsdRate] = useState(0.0001); // Default fallback rate
  
  // Minimum USD requirements
  const MIN_VOTING_USD = 50; // $50 minimum for voting
  const MIN_NOMINATING_USD = 500; // $500 minimum for nominating
  
  // Calculate minimum SOSANA requirements based on live price
  const getMinVotingSosana = (): number => {
    return sosanaToUsdRate > 0 ? MIN_VOTING_USD / sosanaToUsdRate : 500000;
  };
  
  const getMinNominatingSosana = (): number => {
    return sosanaToUsdRate > 0 ? MIN_NOMINATING_USD / sosanaToUsdRate : 5000000;
  };
  
  // Fetch live SOSANA price from CoinGecko API
  const fetchSosanaPrice = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=49jdQxUkKtuvorvnwWqDzUoYKEjfgroTzHkQqXG9YFMj&vs_currencies=usd'
      );
      
      if (response.ok) {
        const data = await response.json();
        const price = data['49jdQxUkKtuvorvnwWqDzUoYKEjfgroTzHkQqXG9YFMj']?.usd;
        if (price && price > 0) {
          setSosanaToUsdRate(price);
          console.log('💰 Fetched live SOSANA price:', price, 'USD');
        }
      } else {
        console.warn('⚠️ Failed to fetch SOSANA price, using fallback rate');
      }
    } catch (error) {
      console.error('❌ Error fetching SOSANA price:', error);
      console.warn('⚠️ Using fallback SOSANA price');
    }
  };

  // Calculate USD value from SOSANA balance
  const getUsdValue = (sosanaBalance: number): number => {
    return sosanaBalance * sosanaToUsdRate;
  };

  // Check if user is eligible to vote
  const isEligibleToVote = (): boolean => {
    return balance >= getMinVotingSosana();
  };

  // Check if user is eligible to nominate
  const isEligibleToNominate = (): boolean => {
    return balance >= getMinNominatingSosana();
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
  

  // Generate config PDA
  const getConfigPDA = () => {
    const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
    const [sosanaPda, sosanaBump] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("sosana-pda")],
      programId
    );
    return sosanaPda;
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
      } else {
        return 0;
      }
    } catch (error) {
      console.error('Error converting to number:', error, value);
      return 0;
    }
  };

  // Fetch SOSANA token balance for user wallet
  const fetchSosanaBalance = async () => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        setBalance(0);
        return;
      }

      setIsBalanceLoading(true);
      const userPubkey = wallet.publicKey;
      
      if (!process.env.NEXT_PUBLIC_TOKEN_MINT) {
        console.error('❌ NEXT_PUBLIC_TOKEN_MINT environment variable is not set');
        toast.error('Token mint address not configured');
        setBalance(0);
        return;
      }
      
      const tokenPubkey = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT);

      const associatedTokenAccount = await connection.getTokenAccountsByOwner(
        userPubkey,
        {
          mint: tokenPubkey,
          programId: TOKEN_2022_PROGRAM_ID,
        }
      );

      if (associatedTokenAccount.value.length === 0) {
        setBalance(0); // No associated token account, balance is 0
        return;
      }

      const tokenAccountAddress = associatedTokenAccount.value[0].pubkey;

      const info = await connection.getTokenAccountBalance(tokenAccountAddress);

      const balance = info?.value?.uiAmount || 0;
      setBalance(balance);
      
      console.log('💰 Fetched SOSANA balance:', balance);
      
    } catch (error) {
      console.error('❌ Error fetching SOSANA balance:', error);
      setBalance(0);
      toast.error('Failed to fetch SOSANA balance');
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Fetch all blockchain rounds
  const fetchBlockchainRounds = async () => {
    try {
      if (!wallet.connected) return;
      
      const program = getSolanaProgram();
      const allRounds = await program.account.rounds.all();
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Convert to BlockchainRound format
      const formattedRounds: BlockchainRound[] = allRounds.map(round => ({
        publicKey: round.publicKey.toString(),
        account: {
          roundNo: safeToNumber((round.account as any).roundNo).toString(),
          nominators: (round.account as any).nominators.map((n: any) => n.toString()),
          roundStartTime: safeToNumber((round.account as any).roundStartTime).toString(),
          votingStartTime: safeToNumber((round.account as any).votingStartTime).toString(),
          roundEndTime: safeToNumber((round.account as any).roundEndTime).toString(),
          tokenMints: (round.account as any).tokenMints.map((t: any) => t.toString()),
          created: safeToNumber((round.account as any).created).toString(),
          winnersAddress: (round.account as any).winnersAddress.map((w: any) => w.toString()),
          isClaim: (round.account as any).isClaim,
          isPreLaunch: (round.account as any).isPreLaunch
        }
      }));
      
      setAllRounds(formattedRounds);
      
      // Find current active round - a round is considered running if current time is between roundStartTime and roundEndTime
      const activeRound = formattedRounds.find(round => {
        const startTime = parseInt(round.account.roundStartTime);
        const endTime = parseInt(round.account.roundEndTime);
        return currentTime >= startTime && currentTime <= endTime;
      });
      
      setCurrentRound(activeRound || null);
      console.log('📋 Fetched blockchain rounds:', formattedRounds);
      console.log('🎯 Current active round:', activeRound);
      
    } catch (error) {
      console.error('❌ Error fetching blockchain rounds:', error);
      toast.error('Failed to fetch blockchain rounds');
    }
  };

  // Fetch config account to get current round
  const fetchConfigAccount = async () => {
    try {
      if (!wallet.connected) return;
      
      const program = getSolanaProgram();
      const configs = await program.account.config.all();
      
      if (configs.length > 0) {
        setConfigAccount(configs[0]);
        console.log('📋 Config account:', configs[0]);
      }
    } catch (error) {
      console.error('❌ Error fetching config account:', error);
    }
  };

  // Fetch token metadata from Metaplex
  const fetchTokenMetadata = async (tokenMint: string) => {
    try {
      const mint = new PublicKey(tokenMint);
      
      // Try to fetch metadata using the Metaplex JS SDK
      const metadata = await metaplex.nfts().findByMint({ mintAddress: mint });
      
      return {
        name: metadata.name,
        symbol: metadata.symbol,
        logoUrl: metadata.json?.image || "/placeholder.svg"
      };
    } catch (error) {
      console.log('⚠️ Could not fetch metadata for token:', tokenMint, error);
      
      // Fallback: Try to fetch from Jupiter API or other sources
      try {
        const response = await fetch(`https://price.jup.ag/v4/metadata?list=${tokenMint}`);
        if (response.ok) {
          const data = await response.json();
          const tokenInfo = data.data[tokenMint];
          if (tokenInfo) {
            return {
              name: tokenInfo.name || `Token ${tokenMint.slice(0, 8)}`,
              symbol: tokenInfo.symbol || "TKN",
              logoUrl: tokenInfo.logoURI || "/placeholder.svg"
            };
          }
        }
      } catch (fallbackError) {
        console.log('⚠️ Fallback metadata fetch also failed:', fallbackError);
      }
      
      // Final fallback
      return {
        name: `Token ${tokenMint.slice(0, 8)}`,
        symbol: "TKN",
        logoUrl: "/placeholder.svg"
      };
    }
  };

    // Fetch nominations for current round
  const fetchNominations = async () => {
    try {
      if (!wallet.connected || !currentRound) return;
      
      const program = getSolanaProgram();
      const allNominations = await program.account.nomination.all();
      
      console.log('📝 All nominations from blockchain:', allNominations);
      
      console.log({currentRound});
      // Filter nominations for current round using roundAddress
      const roundNominations = allNominations.filter(nomination => {
        console.log({nomination});
        const nominationRoundAddress = (nomination.account as any).roundAddress?.toString();
        const currentRoundAddress = currentRound.publicKey;
        console.log('🔍 Comparing nomination round:', nominationRoundAddress, 'with current round:', currentRoundAddress);
        return nominationRoundAddress === currentRoundAddress;
      });
      
      setNominations(roundNominations);
      console.log('📝 Fetched nominations for current round:', roundNominations);
      
      // Debug: Log the first nomination structure if available
      if (roundNominations.length > 0) {
        console.log('🔍 First nomination structure:', roundNominations[0]);
        console.log('🔍 First nomination account structure:', roundNominations[0].account);
      }
      
      // Apply privacy filter based on current phase
      const currentTime = Math.floor(Date.now() / 1000);
      const votingStartTime = parseInt(currentRound.account.votingStartTime);
      const isNominationPhase = currentTime < votingStartTime;
      
      let filteredNominations = roundNominations;
      
      // During nomination phase, only show user's own nominations
      if (isNominationPhase) {
        filteredNominations = roundNominations.filter(nomination => 
          (nomination.account as any).nominator?.toString() === wallet.publicKey?.toString()
        );
        console.log('🔒 Nomination phase: Only showing user\'s own nominations');
      } else {
        console.log('👁️ Voting phase: Showing all nominations');
      }
      
      // Convert nominations to tokens format with Metaplex metadata
      const formattedTokens: BlockchainToken[] = await Promise.all(
        filteredNominations.map(async (nomination) => {
          const tokenMint = (nomination.account as any).tokenMint?.toString();
          const metadata = await fetchTokenMetadata(tokenMint);
          
          return {
            _id: nomination.publicKey.toString(),
            tokenId: {
              _id: tokenMint || '',
              address: tokenMint || '',
              name: metadata.name,
              symbol: metadata.symbol,
              logoUrl: metadata.logoUrl
            },
            nominator: (nomination.account as any).nominator?.toString() || '',
            date: new Date(safeToNumber(currentRound?.account.created || 0) * 1000).toISOString(),
            isNominatedByUser: (nomination.account as any).nominator?.toString() === wallet.publicKey?.toString(),
            isVotedByUser: false // Will be updated when we fetch vote trackers
          };
        })
      );
      
      setTokens(formattedTokens);
      
    } catch (error) {
      console.error('❌ Error fetching nominations:', error);
      toast.error('Failed to fetch nominations');
    }
  };

  // Fetch vote trackers for current user
  const fetchVoteTrackers = async () => {
    try {
      if (!wallet.connected || !currentRound) return;
      
      const program = getSolanaProgram();
      const allVoteTrackers = await program.account.voteTracker.all();
      
      // Get current round public key
      const currentRoundAddress = currentRound.publicKey;
      
      // Filter vote trackers for current user and round
      const userVoteTrackers = allVoteTrackers.filter(tracker => 
        (tracker.account as any).voter?.toString() === wallet.publicKey?.toString() &&
        (tracker.account as any).round?.toString() === currentRoundAddress
      );
      
      setVoteTrackers(userVoteTrackers);
      console.log('🗳️ Fetched vote trackers:', userVoteTrackers);
      
      // Update tokens to show voting status
      setTokens(prevTokens => prevTokens.map(token => ({
        ...token,
        isVotedByUser: userVoteTrackers.some(tracker => 
          (tracker.account as any).hasVoted && (tracker.account as any).round?.toString() === currentRoundAddress
        )
      })));
      
    } catch (error) {
      console.error('❌ Error fetching vote trackers:', error);
      toast.error('Failed to fetch vote trackers');
    }
  };

  // Handle nomination
  const handleNominate = async () => {
    try {
      setIsLoading(true);
      
      // Validate tokenAddress
      try {
        new PublicKey(tokenAddress);
      } catch (error) {
        console.error("Invalid token address", error);
        toast.error("Invalid token address");
        return;
      }

      if (!wallet.connected || !configAccount) {
        toast.error("Wallet not connected or no active round");
        return;
      }

      // Check nomination eligibility
      if (!isEligibleToNominate()) {
        const requiredSosana = getMinNominatingSosana();
        toast.error(`Insufficient SOSANA balance for nomination. Required: $${MIN_NOMINATING_USD} (${requiredSosana.toLocaleString()} SOSANA)`);
        return;
      }

      const program = getSolanaProgram();
      const tokenMint = new PublicKey(tokenAddress);
      const roundPubkey = new PublicKey(currentRound.publicKey);
      const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");

      // Derive PDAs
      const [tokenTrackerPDA] = web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("sosana_token_tracker"),
          wallet.publicKey!.toBuffer(),
          roundPubkey.toBuffer(),
          tokenMint.toBuffer(),
        ],
        programId
      );

      const [nominationPDA] = web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("sosana_nomination"),
          roundPubkey.toBuffer(),
          tokenMint.toBuffer(),
        ],
        programId
      );

      console.log('📝 Creating nomination...');
      console.log('🔑 Token mint:', tokenMint.toString());
      console.log('🎯 Round:', roundPubkey.toString());
      console.log('📌 Token tracker PDA:', tokenTrackerPDA.toString());
      console.log('📌 Nomination PDA:', nominationPDA.toString());

      // Call the createNominate instruction (updated signature)
      const tx = await program.methods
        .createNominate(roundPubkey)
        .accounts({
          nomination: nominationPDA,
          rounds: roundPubkey,
          tokenTracker: tokenTrackerPDA,
          signer: wallet.publicKey!,
          tokenMint: tokenMint,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([])
        .rpc();

      console.log('✅ Nomination created successfully!');
      console.log('📝 Transaction signature:', tx);
      
      toast.success('Token nominated successfully!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Clear input and refresh data
      setTokenAddress("");
      await fetchNominations();
      await fetchSosanaBalance(); // Refresh balance after successful nomination
      
    } catch (error: any) {
      console.error('❌ Error nominating token:', error);
      const errorMessage = error.message || 'Failed to nominate token';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voting
  const handleVote = async (nominationPublicKey: string) => {
    try {
      setIsLoading(true);
      
      if (!wallet.connected || !configAccount) {
        toast.error("Wallet not connected or no active round");
        return;
      }

      // Check voting eligibility
      if (!isEligibleToVote()) {
        const requiredSosana = getMinVotingSosana();
        toast.error(`Insufficient SOSANA balance for voting. Required: $${MIN_VOTING_USD} (${requiredSosana.toLocaleString()} SOSANA)`);
        return;
      }

      const program = getSolanaProgram();
      const nominationPubkey = new PublicKey(nominationPublicKey);
      const roundPubkey = new PublicKey(currentRound.publicKey);
      console.log('🗳️ Casting vote...');
      console.log('📝 Nomination:', nominationPubkey.toString());
      console.log('🎯 Round:', roundPubkey.toString());
             // Generate vote tracker PDA
       const [voteTrackerPDA] = web3.PublicKey.findProgramAddressSync(
         [
           Buffer.from("sosana_vote_tracker"),
           wallet.publicKey!.toBuffer(),
           new PublicKey(roundPubkey).toBuffer()
         ],
         new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "")
       );
      
     
      console.log('👤 Vote tracker:', voteTrackerPDA.toString());
      
      // Call the castVote instruction
      const tx = await program.methods
        .castVote(roundPubkey)
        .accounts({
          nomination: nominationPubkey,
          rounds: roundPubkey,
          voteTracker: voteTrackerPDA,
          signer: wallet.publicKey!,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Vote cast successfully!');
      console.log('📝 Transaction signature:', tx);
      
      toast.success('Vote cast successfully!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Refresh vote trackers and balance
      await fetchVoteTrackers();
      await fetchSosanaBalance(); // Refresh balance after successful vote
      
    } catch (error: any) {
     // console.error('❌ Error casting vote:', error);
     console.log({error});
      const errorMessage = error.errorMessage || 'Failed to cast vote';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update voting/nomination status based on current time
  useEffect(() => {
    if (currentRound) {
      const now = Math.floor(Date.now() / 1000);
      const roundStartTime = parseInt(currentRound.account.roundStartTime);
      const votingStartTime = parseInt(currentRound.account.votingStartTime);
      const roundEndTime = parseInt(currentRound.account.roundEndTime);

      console.log('⏰ Round timing check:', {
        now,
        roundStartTime,
        votingStartTime,
        roundEndTime,
        isRoundActive: now >= roundStartTime && now <= roundEndTime
      });

      // Enable nomination if current time is between roundStartTime and votingStartTime
      if (now >= roundStartTime && now < votingStartTime) {
        setIsNominationEnabled(true);
        setIsVotingEnabled(false);
        console.log('📝 Nomination phase active');
      } 
      // Enable voting if current time is between votingStartTime and roundEndTime
      else if (now >= votingStartTime && now <= roundEndTime) {
        setIsVotingEnabled(true);
        setIsNominationEnabled(false);
        console.log('🗳️ Voting phase active');
      } 
      // Round is finished
      else if (now > roundEndTime) {
        setIsVotingEnabled(false);
        setIsNominationEnabled(false);
        setIsFinished(true);
        console.log('🏁 Round finished');
      }
      // Round hasn't started yet
      else {
        setIsVotingEnabled(false);
        setIsNominationEnabled(false);
        console.log('⏳ Round not started yet');
      }
    }
  }, [currentRound]);

  // Fetch data when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      fetchSosanaBalance();
      fetchBlockchainRounds();
      fetchConfigAccount();
    }
  }, [wallet.connected]);

  // Fetch SOSANA price on component mount
  useEffect(() => {
    fetchSosanaPrice();
  }, []);

  useEffect(() => {
    if (wallet.connected && currentRound) {
     
      fetchVoteTrackers();
    }
  }, [wallet.connected, currentRound]);

  // Periodically refresh SOSANA balance
  useEffect(() => {
    if (!wallet.connected) return;

   fetchSosanaBalance(); 

    
  }, [wallet.connected]);

  const handleCountdownComplete = () => {
    setIsFinished(true);
    setTimeout(() => {
      setIsFinished(false);
    }, 10000); // 10 secs delay
  };

  const handleEnableVotingCountdownComplete = () => {
    setIsVotingEnabled(true);
    setIsNominationEnabled(false);
  };

  // Countdown renderer
  const countdownRenderer = (props: any) => {
    const { days, hours, minutes, seconds, completed } = props;
    
    if (completed) {
      return <span>Completed</span>
    } else {
      return (
        <span className="flex space-x-2 justify-end">
          {days > 0 && (
            <span className="countdown-item">
              <span className="text-accent">{days}</span>d
            </span>
          )}
          <span className="countdown-item">
            <span className="text-accent">{hours}</span>h
          </span>
          <span className="countdown-item">
            <span className="text-accent">{minutes}</span>m
          </span>
          <span className="countdown-item">
            <span className="text-accent">{seconds}</span>s
          </span>
        </span>
      )
    }
  }

  // Helper function to convert timestamp to Date
  const timestampToDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {wallet.connected && wallet.publicKey ? (
        <div className="space-y-8">
          <div className="cosmic-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Wallet Information</h2>
              <div className="flex space-x-2">
                <button
                  onClick={fetchSosanaBalance}
                  disabled={isBalanceLoading}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh SOSANA balance"
                >
                  <svg className={`w-4 h-4 ${isBalanceLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isBalanceLoading ? 'Refreshing...' : 'Refresh Balance'}</span>
                </button>
                <button
                  onClick={fetchSosanaPrice}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  title="Refresh SOSANA price"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Refresh Price</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-foreground/60">SOSANA Balance</p>
                <p className="text-xl font-bold">
                  {isBalanceLoading ? (
                    <span className="text-accent">Loading...</span>
                  ) : (
                    `$${getUsdValue(balance).toFixed(4)}`
                  )}
                </p>
                <p className="text-xs text-foreground/40">
                  Live Price: ${sosanaToUsdRate.toFixed(6)} USD
                </p>
              </div>
              <div>
                
              </div>
             
              <div>
                <p className="text-sm text-foreground/60">Spent Balance</p>
                <p className="text-xl font-bold">{spentBalance.toFixed(2)}</p>
              </div>
            </div>
            
            {/* Eligibility Status */}
           
          </div>

          {currentRound ? (
            <div className="cosmic-card p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h2 className="text-2xl font-bold mb-4">
                  Current Round: <span className="text-accent">{`Round ${currentRound.account.roundNo}`}</span>
                </h2>
                <div className="text-xl font-bold">
                  {isFinished ? (
                    <span>Round Finished</span>
                  ) : (
                    <Countdown
                      date={timestampToDate(currentRound.account.roundEndTime)}
                      onComplete={handleCountdownComplete}
                      renderer={countdownRenderer}
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-foreground/60">Round Start</p>
                  <p className="text-base">{timestampToDate(currentRound.account.roundStartTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Round End</p>
                  <p className="text-base">{timestampToDate(currentRound.account.roundEndTime).toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <h2 className="text-xl font-bold">Voting Count Down:</h2>
                <div className="text-xl font-bold">
                  {isVotingEnabled ? (
                    <span className="text-green-400">Voting Started</span>
                  ) : (
                    <Countdown
                      date={timestampToDate(currentRound.account.votingStartTime)}
                      onComplete={handleEnableVotingCountdownComplete}
                      renderer={countdownRenderer}
                    />
                  )}
                </div>
              </div>
              <div className="mt-4 p-4 bg-card-highlight rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">ℹ️</div>
                  <div>
                    <h4 className="font-semibold text-foreground">Round Type</h4>
                    <p className="text-sm text-foreground/60">
                      {currentRound.account.isPreLaunch ? '🚀 Pre-Launch Round' : '🪙 Live Token Round'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="cosmic-card p-6">
              <div className="text-center py-8">
                <div className="text-3xl mb-2">⏰</div>
                <h4 className="text-lg font-semibold text-foreground mb-1">No Active Round</h4>
                <p className="text-foreground/60">There are currently no active rounds on the blockchain</p>
              </div>
            </div>
          )}


                     {currentRound && (
             <div className="cosmic-card p-6">
               <div className="flex items-center justify-between mb-4">
                 <div>
                   <h2 className="text-2xl font-bold">Current Round Nominations</h2>
                   {/* Phase indicator */}
                   {(() => {
                     const currentTime = Math.floor(Date.now() / 1000);
                     const votingStartTime = parseInt(currentRound.account.votingStartTime);
                     const isNominationPhase = currentTime < votingStartTime;
                     
                     return (
                       <div className="mt-2">
                         {isNominationPhase ? (
                           <div className="flex items-center space-x-2 text-sm">
                             <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                               🔒 Nomination Phase
                             </span>
                             <span className="text-foreground/60">
                               Only your nominations are visible
                             </span>
                           </div>
                         ) : (
                           <div className="flex items-center space-x-2 text-sm">
                             <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                               👁️ Voting Phase
                             </span>
                             <span className="text-foreground/60">
                               All nominations are visible for voting
                             </span>
                           </div>
                         )}
                       </div>
                     );
                   })()}
                 </div>
                 <button
                   onClick={() => {
                     fetchNominations();
                     fetchVoteTrackers();
                   }}
                   className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                   title="Refresh nominations"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                   </svg>
                   <span>Refresh</span>
                 </button>
               </div>
               {tokens.length === 0 ? (
                 <div className="text-center py-8">
                   <div className="text-3xl mb-2">📝</div>
                   {(() => {
                     const currentTime = Math.floor(Date.now() / 1000);
                     const votingStartTime = parseInt(currentRound.account.votingStartTime);
                     const isNominationPhase = currentTime < votingStartTime;
                     
                     return isNominationPhase ? (
                       <>
                         <h4 className="text-lg font-semibold text-foreground mb-1">No Nominations Yet</h4>
                         <p className="text-foreground/60">You haven't nominated any tokens for this round yet</p>
                         <p className="text-sm text-foreground/40 mt-2">During nomination phase, only your own nominations are visible</p>
                       </>
                     ) : (
                       <>
                         <h4 className="text-lg font-semibold text-foreground mb-1">No Nominations Available</h4>
                         <p className="text-foreground/60">No tokens have been nominated for this round</p>
                       </>
                     );
                   })()}
                 </div>
               ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-card-border">
                        <th className="p-2">Logo</th>
                        <th className="p-2">Name / Symbol</th>
                        <th className="p-2">Address</th>
                        <th className="p-2">Nominator</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.map((token, index) => (
                        <tr
                          key={index}
                          className="border-b border-card-border/50 hover:bg-card-highlight/30 transition-colors"
                        >
                          <td className="p-2">
                            <img
                              src={token.tokenId.logoUrl || "/placeholder.svg"}
                              alt={token.tokenId.name}
                              width="30"
                              height="30"
                              className="rounded-full"
                            />
                          </td>
                          <td className="p-2">
                            {token.tokenId.name} / {token.tokenId.symbol}
                          </td>
                          <td
                            className="p-2 text-xs cursor-pointer hover:text-accent transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(token.tokenId.address)
                              toast.success("Copied to clipboard")
                            }}
                          >
                            {token.tokenId.address.slice(0, 8)}
                            ...
                            {token.tokenId.address.slice(-8)}
                          </td>
                          <td
                            className="p-2 flex items-center cursor-pointer hover:text-accent transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(token.nominator)
                              toast.success("Copied to clipboard")
                            }}
                          >
                            {token.nominator.slice(0, 4)}...
                            {token.nominator.slice(-4)}
                            {token.isNominatedByUser && <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />}
                          </td>
                          <td className="p-2">{new Date(token.date).toLocaleDateString()}</td>
                          <td className="p-2">
                            {!isVotingEnabled ? (
                              <span className="text-foreground/60">Voting not started</span>
                            ) : !token.isVotedByUser ? (
                              <button
                                onClick={() => handleVote(token._id)}
                                className="btn btn-primary"
                                disabled={!isEligibleToVote() || isLoading}
                              >
                                {isLoading ? 'Voting...' : !isEligibleToVote() ? 'Insufficient Balance' : 'Vote'}
                              </button>
                            ) : (
                              <span className="text-green-500">Voted</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

                     {currentRound && isNominationEnabled && (
            <div className="cosmic-card-highlight p-6">
              <h2 className="text-2xl font-bold mb-4">Nominate Token</h2>
              
              {/* Privacy Notice */}
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <h4 className="font-semibold text-amber-400 mb-2">🔒 Privacy Notice</h4>
                <div className="text-sm text-foreground/80">
                  <p>During the nomination phase, only you can see your own nominations. Other users' nominations will become visible once the voting phase begins.</p>
                </div>
              </div>
              
              {/* Rules Information */}
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="font-semibold text-blue-400 mb-2">📋 Participation Rules</h4>
                <div className="text-sm text-foreground/80 space-y-1">
                  <p>• <strong>Voting:</strong> Minimum ${MIN_VOTING_USD} USD ({getMinVotingSosana().toLocaleString()} SOSANA)</p>
                  <p>• <strong>Nominating:</strong> Minimum ${MIN_NOMINATING_USD} USD ({getMinNominatingSosana().toLocaleString()} SOSANA)</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-2">
                <input
                  type="text"
                  placeholder="Enter token address"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="flex-grow p-2 rounded border border-card-border bg-secondary/60 text-black min-w-[150px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button 
                  onClick={handleNominate} 
                  className="btn btn-primary" 
                 
                >
                  {isLoading ? 'Nominating...' : isEligibleToNominate() ? 'Insufficient Balance' : 'Nominate'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 cosmic-card-highlight p-8">
          <p className="text-2xl font-bold mb-4 glow-text">Connect your wallet to Vote</p>
          <p className="text-lg text-foreground/80">You need to connect your Solana wallet to participate in voting.</p>
        </div>
      )}
    </div>
  )
}
