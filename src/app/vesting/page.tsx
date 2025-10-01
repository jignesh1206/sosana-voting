'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { 
  ShieldCheckIcon, 
  ClockIcon, 
  LockClosedIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { 
  getVestingProgram, 
  checkClaimEligibility, 
  claimTeamReward,
  formatTokenAmount,
  fetchTeamAccount,
  fetchUserWhiteList,
  fetchUserWhiteListWithBump,
  getCurrentVestingMonth,
  generateDailyDripPlan,
  canClaimToday,
  getNextClaimUnix,
  calculateTimeMetrics,
  getVestingSchedule,
  getNextClaimTime
} from '@/utils/vestingUtils';
import { BN } from '@project-serum/anchor';
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  getAccount,
  getOrCreateAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  Account,
} from "@solana/spl-token";
import * as splToken from "@solana/spl-token";
// Vesting data based on the Litepaper
const vestingData = [
  { month: 1, percentage: 10, tokens: 3322241, notes: 'Relaunch Airdrop (considered disbursed)' },
  { month: 2, percentage: 8, tokens: 2657792, notes: '' },
  { month: 3, percentage: 8, tokens: 2657792, notes: '' },
  { month: 4, percentage: 8, tokens: 2657792, notes: '' },
  { month: 5, percentage: 8, tokens: 2657792, notes: '' },
  { month: 6, percentage: 8, tokens: 2657792, notes: '' },
  { month: 7, percentage: 6, tokens: 1993344, notes: '' },
  { month: 8, percentage: 6, tokens: 1993344, notes: '' },
  { month: 9, percentage: 6, tokens: 1993344, notes: '' },
  { month: 10, percentage: 6, tokens: 1993344, notes: '' },
  { month: 11, percentage: 6, tokens: 1993344, notes: '' },
  { month: 12, percentage: 4, tokens: 1328896, notes: '' },
  { month: 13, percentage: 3, tokens: 996672, notes: '' },
  { month: 14, percentage: 3, tokens: 996672, notes: '' },
  { month: 15, percentage: 3, tokens: 996672, notes: '' },
  { month: 16, percentage: 3, tokens: 996672, notes: '' },
  { month: 17, percentage: 2, tokens: 664448, notes: '' },
  { month: 18, percentage: 2, tokens: 664448, notes: 'Final unlock' },
];

const totalVestingTokens = 33222412;

// Tooltip component
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 max-w-xs">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Hero Section Component
const HeroSection = () => (
  <div className="text-center space-y-6 mb-12">
    <h1 className="text-4xl md:text-6xl font-bold text-foreground glow-text">
      Team Vesting — Transparent & Enforced
    </h1>
    <p className="text-xl md:text-2xl text-foreground/80 max-w-4xl mx-auto">
      33,222,412 SOSANA locked • 18-month smart-contract vesting schedule • immutable, on-chain releases
    </p>
    
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
      <a 
        href="#schedule" 
        className="btn btn-primary px-8 py-3 text-lg glow-button"
      >
        View Full Vesting Schedule
      </a>
      <a 
        href="#airdrops" 
        className="btn btn-secondary px-8 py-3 text-lg"
      >
        How to Qualify for Airdrops
      </a>
    </div>
    
    <p className="text-sm text-foreground/60 mt-4">
      "All vesting tokens are held in a smart contract — no admin overrides, no early access."
    </p>
  </div>
);

// Quick Facts Grid Component
const QuickFactsGrid = () => {
  const facts = [
    {
      icon: ShieldCheckIcon,
      title: "Total Vesting Tokens",
      value: "33,222,412 SOSANA",
      subtitle: "37.4% of supply"
    },
    {
      icon: ClockIcon,
      title: "Vesting Duration", 
      value: "18 months",
      subtitle: "monthly unlocks"
    },
    {
      icon: LockClosedIcon,
      title: "Enforcement",
      value: "Smart contract locked",
      subtitle: "immutable"
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-12">
      {facts.map((fact, index) => {
        const IconComponent = fact.icon;
        return (
          <div key={index} className="cosmic-card p-6 text-center">
            <IconComponent className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{fact.title}</h3>
            <p className="text-2xl font-bold text-accent mb-1">{fact.value}</p>
            <p className="text-sm text-foreground/60">{fact.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};

// Vesting Table Component
const VestingTable = () => {
  const downloadCSV = () => {
    const csvContent = [
      ['Month', '% Released', 'Token Amount (SOSANA)', 'Notes'],
      ...vestingData.map(row => [
        row.month.toString(),
        `${row.percentage}%`,
        row.tokens.toLocaleString(),
        row.notes
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sosana-vesting-schedule.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div id="schedule" className="cosmic-card p-6 mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Vesting Schedule</h2>
        <button
          onClick={downloadCSV}
          className="btn btn-secondary flex items-center gap-2"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Download CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              <th className="text-left py-3 px-4 font-semibold text-foreground">Month</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                <Tooltip content="On-chain accounting may distribute residual 'dust' per contract rules">
                  % Released
                </Tooltip>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Token Amount (SOSANA)</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Notes</th>
            </tr>
          </thead>
          <tbody>
            {vestingData.map((row, index) => (
              <tr 
                key={row.month} 
                className={`border-b border-card-border/50 ${
                  row.month === 1 ? 'bg-accent/10 font-semibold' : 'hover:bg-secondary/30'
                }`}
              >
                <td className="py-3 px-4 text-foreground">{row.month}</td>
                <td className="py-3 px-4 text-foreground">{row.percentage}%</td>
                <td className="py-3 px-4 text-foreground">{row.tokens.toLocaleString()}</td>
                <td className="py-3 px-4 text-foreground/60">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="text-xs text-foreground/60 mt-4">
        Source: SOSANA_Litepaper_v2.0
      </p>
    </div>
  );
};

// Enforcement Section
const EnforcementSection = () => (
  <div className="cosmic-card p-6 mb-12">
    <h2 className="text-2xl font-bold text-foreground mb-4">How This Is Enforced</h2>
    <ul className="space-y-3 text-foreground/80">
      <li className="flex items-start gap-3">
        <ShieldCheckIcon className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
        <span>All vesting tokens are locked in a smart contract — no manual overrides.</span>
      </li>
      <li className="flex items-start gap-3">
        <ClockIcon className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
        <span>Releases occur monthly per the schedule — on-chain unlocks only.</span>
      </li>
      <li className="flex items-start gap-3">
        <InformationCircleIcon className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
        <span>Contract logs and release transactions are publicly viewable (link to explorer).</span>
      </li>
    </ul>
  </div>
);

// Snapshot Widget Component
const SnapshotWidget = () => {
  const { publicKey, wallet, connected, sendTransaction } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [claimableAmount, setClaimableAmount] = useState<string>('0');
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimStatus, setClaimStatus] = useState<string>('');
  const [teamData, setTeamData] = useState<any>(null);
  const [whitelistData, setWhitelistData] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [nextClaimAt, setNextClaimAt] = useState<number | null>(null);
  const [nextClaimCountdown, setNextClaimCountdown] = useState<string>("");
  const [teamDataError, setTeamDataError] = useState<string>("");

  // Check eligibility and claimable amount
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    let nextClaimInterval: NodeJS.Timeout | null = null;

    const runCheckEligibility = async () => {
      if (connected && publicKey && connection) {
        try {
          const program = getVestingProgram({ connected: true, publicKey }, connection);
          
          // Fetch team data
          const teamAccountEnv = process.env.NEXT_PUBLIC_TEAM_ACCOUNT || '';
          console.log('Team Account Env:', teamAccountEnv);
          
          if (!teamAccountEnv) {
            setTeamDataError('NEXT_PUBLIC_TEAM_ACCOUNT environment variable not set');
            setTeamData(null);
            return;
          }
          
          const teamAddress = new (await import('@solana/web3.js')).PublicKey(teamAccountEnv);
          console.log('Team Address:', teamAddress.toString());
          
          const team = await fetchTeamAccount(program, teamAddress);
          console.log('Team Data:', team);
          
          if (!team) {
            setTeamDataError('Team vesting account not found or not initialized');
            setTeamData(null);
            return;
          }
          
          setTeamDataError('');
          setTeamData(team);
          
          // Get current time for calculations
          const nowSec = Math.floor(Date.now() / 1000);
          
          // Airdrop start logic from on-chain startAt
          if (team && team.startAt) {
            const startAtSec = typeof team.startAt.toNumber === 'function' ? team.startAt.toNumber() : Number(team.startAt);
            const updateCountdown = () => {
              const currentNowSec = Math.floor(Date.now() / 1000);
              const diff = startAtSec - currentNowSec;
              const started = diff <= 0;
              setHasStarted(started);
              if (!started) {
                const d = Math.floor(diff / 86400);
                const h = Math.floor((diff % 86400) / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;
                setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
              } else {
                setTimeLeft("");
              }
            };
            updateCountdown();
            countdownInterval = setInterval(updateCountdown, 1000);
          }
          
          // Fetch user whitelist data
          const whitelist = await fetchUserWhiteList(program, publicKey);
          console.log('whitelist', whitelist);
          setWhitelistData(whitelist);
          
          // Check claim eligibility with team account
          const eligibility = await checkClaimEligibility(program, publicKey, teamAddress);
          console.log('eligibility', eligibility);
          
          // Set eligibility status
          setIsEligible(eligibility.isEligible);
          setClaimableAmount(formatTokenAmount(eligibility.claimableAmount, team && team.decimal && typeof team.decimal.toNumber === 'function' ? team.decimal.toNumber() : 6));

          // Next claim time & countdown
          const teamStartAt = team && team.startAt && typeof team.startAt.toNumber === 'function' ? team.startAt.toNumber() : (team && Number(team.startAt)) || null;
          const nextAt = getNextClaimUnix(whitelist, nowSec, teamStartAt || null);
          setNextClaimAt(nextAt);
          if (nextAt && nextAt > nowSec) {
            const updateNextCountdown = () => {
              const now = Math.floor(Date.now() / 1000);
              const diff = Math.max(0, nextAt - now);
              const h = Math.floor(diff / 3600);
              const m = Math.floor((diff % 3600) / 60);
              const s = diff % 60;
              setNextClaimCountdown(`${h}h ${m}m ${s}s`);
            };
            updateNextCountdown();
            nextClaimInterval = setInterval(updateNextCountdown, 1000);
          } else {
            setNextClaimCountdown("");
          }
          
          // Mock balance for display (in real implementation, get actual SOSANA balance)
          const mockBalance = Math.random() * 100;
          setUserBalance(mockBalance);
        } catch (error) {
          console.error('Error checking eligibility:', error);
          setClaimStatus('Error checking eligibility');
        }
      }
    };

    runCheckEligibility();

    // Cleanup function
    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
      if (nextClaimInterval) clearInterval(nextClaimInterval);
    };
  }, [connected, publicKey, connection, hasStarted]);

  const handleClaim = async () => {
    if (!connected || !publicKey || !connection) {
      setClaimStatus('Please connect your wallet');
      return;
    }

    if (!anchorWallet && !wallet) {
      setClaimStatus('Wallet not ready. Please try again.');
      return;
    }

    setIsClaiming(true);
    setClaimStatus('');

    try {
      const teamAccountEnv = process.env.NEXT_PUBLIC_TEAM_ACCOUNT || '';
      if (!teamAccountEnv) {
        setClaimStatus('Missing NEXT_PUBLIC_TEAM_ACCOUNT environment variable');
        setIsClaiming(false);
        return;
      }
      
      const { PublicKey } = await import('@solana/web3.js');
      const teamAddress = new PublicKey(teamAccountEnv);
      
      setClaimStatus('Setting up token accounts...');
      
      // Debug wallet state
      console.log('Wallet state:', { connected, publicKey, anchorWallet, wallet });
      console.log('Anchor wallet:', anchorWallet);
      
      // Use available wallet for the program (prefer anchorWallet, fallback to wallet)
      const walletToUse = anchorWallet || wallet;
      console.log('Using wallet:', walletToUse);
      
      const program = getVestingProgram(walletToUse, connection);
      
      setClaimStatus('Claiming airdrop tokens...');
      const result = await claimTeamReward(program, publicKey, connection, teamAddress, walletToUse);
      
      if (result.success) {
        setClaimStatus(`Success! Transaction: ${result.signature}`);
        
        // Refresh eligibility after successful claim
        setClaimStatus('Updating your vesting status...');
        const eligibility = await checkClaimEligibility(program, publicKey, teamAddress);
        const refreshedWhitelist = await fetchUserWhiteList(program, publicKey);
        setWhitelistData(refreshedWhitelist);
        const decimals = teamData && teamData.decimal && typeof teamData.decimal.toNumber === 'function' ? teamData.decimal.toNumber() : 6;
        const nowSec = Math.floor(Date.now() / 1000);
        const eligibleToday = eligibility.isEligible && hasStarted && canClaimToday(refreshedWhitelist, nowSec);
        setIsEligible(eligibleToday);
        setClaimableAmount(formatTokenAmount(eligibility.claimableAmount, decimals));

        // Update next claim timing after claim
        const teamStartAt = teamData && teamData.startAt && typeof teamData.startAt.toNumber === 'function' ? teamData.startAt.toNumber() : (teamData && Number(teamData.startAt)) || null;
        const nextAt = getNextClaimUnix(refreshedWhitelist, nowSec, teamStartAt || null);
        setNextClaimAt(nextAt);
        setNextClaimCountdown("");
        
        setClaimStatus(`Successfully claimed ${formatTokenAmount(eligibility.claimableAmount, decimals)} SOSANA! Transaction: ${result.signature}`);
      } else {
        setClaimStatus(`Claim failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Claim error:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Provide more specific error messages
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL for transaction fees. Please add SOL to your wallet.';
      } else if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (errorMessage.includes('Account does not exist')) {
        errorMessage = 'Required account not found. Please contact support.';
      } else if (errorMessage.includes('Insufficient token balance')) {
        errorMessage = 'Insufficient token balance in team account.';
      }
      
      setClaimStatus(`Error: ${errorMessage}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const testAssociate = async () => {
    if (!connected || !publicKey || !connection) {
      setClaimStatus('Wallet not ready. Please try again.');
      return;
    }

    // Testing purpose
  
    
    // Define required variables for testing
    const mint = new PublicKey("ENq17x3cvYuh58Xy6wtjQCt9Vv3z6RAPwoNTnCeCvEku");
    const owner = publicKey;
    const allowOwnerOffCurve = false;
    const programId = TOKEN_2022_PROGRAM_ID;
    const associatedTokenProgramId = TOKEN_2022_PROGRAM_ID;
    const commitment = 'confirmed' as const;

    const associatedToken = await getAssociatedTokenAddress(
      mint,
      owner,
      allowOwnerOffCurve,
      programId
    );
    console.log("associatedToken : ", associatedToken.toString())
    let account: Account;
    try {
      
      account = await getAccount(connection, associatedToken, commitment, programId);
      const receiverAccountInfo = await connection.getAccountInfo(associatedToken);
    } catch (error: unknown) {
      if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
        try {
          const transaction = new Transaction().add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              associatedToken,
              owner,
              mint,
              programId,
              associatedTokenProgramId
            )
          );
    
          await sendTransaction(transaction, connection);
        } catch (error: unknown) {
          console.error('Error creating associated token account:', error);
        }
        account = await getAccount(connection, associatedToken, commitment, programId);
      } else {
        throw error;
      }
    }
    return account;
  }
  useEffect(() => {
    ///testAssociate();
  }, [connected, publicKey, connection]);
  return (
    <div className="cosmic-card p-6 mb-8">
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <GiftIcon className="w-6 h-6 text-accent" />
        Airdrop Claim Center
      </h3>
      
      {!connected ? (
        <div className="text-center py-8">
          <p className="text-foreground/60 mb-4">Connect your wallet to check eligibility and claim rewards</p>
          <button className="btn btn-primary">Connect Wallet</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground">Current SOSANA Balance:</span>
            <span className="font-semibold text-foreground">${userBalance.toFixed(2)}</span>
          </div>
          
          

          {/* Team Data Error */}
          {teamDataError && (
            <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-lg">
              <h4 className="font-semibold text-red-400 mb-2">Team Vesting Status</h4>
              <p className="text-red-400 text-sm">{teamDataError}</p>
              <p className="text-xs text-red-400/60 mt-1">
                Contact admin to initialize team vesting or check environment configuration.
              </p>
              {teamDataError.includes('environment variable') && (
                <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
                  <p className="text-gray-300 mb-1">Required environment variable:</p>
                  <code className="text-green-400">NEXT_PUBLIC_TEAM_ACCOUNT=your_team_account_public_key</code>
                </div>
              )}
            </div>
          )}

          {/* No Team Data - Show Vesting Schedule Info */}
          {!teamData && !teamDataError && (
            <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-400 mb-2">Team Vesting Schedule</h4>
              <p className="text-blue-400 text-sm mb-2">
                Team vesting will begin once the smart contract is initialized by the admin.
              </p>
              <div className="text-xs text-blue-400/80">
                <p>• 33,222,412 SOSANA tokens (37.4% of supply)</p>
                <p>• 18-month vesting schedule with daily drips</p>
                <p>• Month 1: 10% (relaunch airdrop)</p>
                <p>• Months 2-6: 8% each</p>
                <p>• Months 7-11: 6% each</p>
                <p>• And so on...</p>
              </div>
            </div>
          )}

          {/* Start time / countdown */}
          {teamData && teamData.startAt && !hasStarted && (
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Airdrop Starts In</h4>
              <p className="text-accent font-semibold">{timeLeft || '...'}
              </p>
              <p className="text-xs text-foreground/60 mt-1">
                Start time (UTC): {new Date((typeof teamData.startAt.toNumber === 'function' ? teamData.startAt.toNumber() : Number(teamData.startAt)) * 1000).toUTCString()}
              </p>
            </div>
          )}

          {/* Vesting has started */}
          {teamData && teamData.startAt && hasStarted && (
            <div className="bg-green-500/20 border border-green-500/30 p-4 rounded-lg">
              <h4 className="font-semibold text-green-400 mb-2">Vesting Active</h4>
              <p className="text-green-400 text-sm">
                Team vesting started on {new Date((typeof teamData.startAt.toNumber === 'function' ? teamData.startAt.toNumber() : Number(teamData.startAt)) * 1000).toUTCString()}
              </p>
            </div>
          )}


          {whitelistData && (
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Your Vesting Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/80">Total Allocated:</span>
                  <span className="font-semibold">{formatTokenAmount(whitelistData.total, teamData && teamData.decimal && typeof teamData.decimal.toNumber === 'function' ? teamData.decimal.toNumber() : 6)} SOSANA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/80">Already Claimed:</span>
                  <span className="font-semibold">{formatTokenAmount(whitelistData.claim, teamData && teamData.decimal && typeof teamData.decimal.toNumber === 'function' ? teamData.decimal.toNumber() : 6)} SOSANA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/80">Remaining:</span>
                  <span className="font-semibold text-accent">{formatTokenAmount(whitelistData.remain, teamData && teamData.decimal && typeof teamData.decimal.toNumber === 'function' ? teamData.decimal.toNumber() : 6)} SOSANA</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 py-4">
            {isEligible ? (
              <>
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
                <span className="text-green-400 font-semibold">You have {claimableAmount} SOSANA available to claim!</span>
              </>
            ) : (
              <>
                <XCircleIcon className="w-6 h-6 text-red-400" />
                <span className="text-red-400 font-semibold">No tokens available to claim at this time</span>
              </>
            )}
          </div>

          {/* Detailed Status Information */}
          {whitelistData && teamData && (
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-semibold text-foreground mb-3">Vesting Status Details</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground/80">Current Month:</span>
                    <span className="font-semibold text-foreground">
                      {teamData.startAt ? calculateTimeMetrics(teamData.startAt).month : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/80">Days in Month:</span>
                    <span className="font-semibold text-foreground">
                      {teamData.startAt ? calculateTimeMetrics(teamData.startAt).daysIntoCurrentMonth : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/80">Monthly %:</span>
                    <span className="font-semibold text-foreground">
                      {teamData.startAt ? 
                        (() => {
                          const month = calculateTimeMetrics(teamData.startAt).month;
                          const schedule = getVestingSchedule();
                          const entry = schedule.find(s => s.monthIndex === month);
                          return entry ? `${entry.percentBps / 100}%` : 'N/A';
                        })() : 'N/A'
                      }
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground/80">Last Claim:</span>
                    <span className="font-semibold text-foreground">
                      {whitelistData.lastWithdrawAt.toNumber() === 0 ? 'Never' : 
                        new Date(whitelistData.lastWithdrawAt.toNumber() * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/80">Next Claim:</span>
                    <span className="font-semibold text-foreground">
                      {whitelistData.lastWithdrawAt.toNumber() === 0 ? 'Available now' :
                        new Date(getNextClaimTime(whitelistData.lastWithdrawAt) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/80">Progress:</span>
                    <span className="font-semibold text-foreground">
                      {whitelistData.total.gt(new BN(0)) ? 
                        `${Math.round(whitelistData.claim.toNumber() / whitelistData.total.toNumber() * 100)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isEligible && nextClaimCountdown && (
            <div className="text-center p-4 rounded-lg bg-secondary/30">
              <h4 className="font-semibold text-foreground mb-1">Next claim in</h4>
              <p className="text-accent font-bold">{nextClaimCountdown}</p>
              {nextClaimAt && (
                <p className="text-xs text-foreground/60 mt-1">
                  At (UTC): {new Date(nextClaimAt * 1000).toUTCString()}
                </p>
              )}
            </div>
          )}

          {isEligible && whitelistData && (
            <div className="text-center">
              <button
                onClick={handleClaim}
                disabled={isClaiming || !hasStarted}
                className={`btn btn-primary px-8 py-3 text-lg glow-button flex items-center gap-2 mx-auto ${
                  (isClaiming || !hasStarted) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isClaiming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Claiming...
                  </>
                ) : (
                  <>
                    <GiftIcon className="w-5 h-5" />
                    Claim {claimableAmount} SOSANA
                  </>
                )}
              </button>
            </div>
          )}


          {claimStatus && (
            <div className={`text-center p-3 rounded-lg ${
              claimStatus.includes('Success') 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              <p className="text-sm">{claimStatus}</p>
            </div>
          )}
          

          <div className="text-center">
            <p className="text-sm text-foreground/60">
              Next snapshot: TBD (Check announcements)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Airdrop How-To Section
const AirdropHowTo = () => (
  <div id="airdrops" className="cosmic-card p-6 mb-12">
    <h2 className="text-2xl font-bold text-foreground mb-6">Want an Airdrop? Here's How to Qualify</h2>
    
    <div className="mb-8">
      <p className="text-foreground/80 mb-4">
        Airdrop & Marketing pool = 8,888,888 SOSANA reserved for community giveaways and promotional campaigns.
      </p>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Eligibility Checklist:</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-foreground">Hold $50 worth of SOSANA at the snapshot time</span>
              <Tooltip content="Snapshot = a blockchain timestamp when balances are recorded. If your balance is below the required threshold at that timestamp, you will not be eligible — topping up later won't help until the next snapshot.">
                <span className="text-accent cursor-help ml-1">(snapshot)</span>
              </Tooltip>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <span className="text-foreground">Complete required actions for specific airdrops (e.g., voting, referral points, community tasks)</span>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <span className="text-foreground">Be verified where required (some programs require KYC or upgrade)</span>
          </div>
        </div>
      </div>
    </div>

    <SnapshotWidget />

    <div className="bg-secondary/30 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-foreground mb-4">Step-by-Step Guide:</h3>
      <div className="space-y-3 text-foreground/80">
        <div className="flex items-start gap-3">
          <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">A</span>
          <span>Connect your wallet (Phantom recommended)</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">B</span>
          <span>Ensure you hold ≥ $50 SOSANA at the next snapshot</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">C</span>
          <span>Complete the campaign-specific actions (vote, refer, or perform social tasks)</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">D</span>
          <div>
            <span>Claim airdrop after distribution window</span>
            <Tooltip content="Some rewards are auto-sent, some require an on-chain claim transaction to reduce gas.">
              <span className="text-accent cursor-help ml-1">(claim)</span>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// FAQ Section
const FAQSection = () => {
  const faqs = [
    {
      question: "Who controls the vesting?",
      answer: "No one — vesting is enforced by smart contract; no admin overrides."
    },
    {
      question: "How do I know when tokens unlock?",
      answer: "On-chain TXs are published each month — link to explorer."
    },
    {
      question: "How are airdrops distributed?",
      answer: "Airdrop pool = 8,888,888 SOSANA reserved for community giveaways and marketing. Specific airdrops follow individual campaign rules (snapshots, $50 holding, tasks, referrals)."
    }
  ];

  return (
    <div className="cosmic-card p-6 mb-12">
      <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index}>
            <h3 className="text-lg font-semibold text-foreground mb-2">{faq.question}</h3>
            <p className="text-foreground/80">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Footer Legal
const FooterLegal = () => (
  <div className="text-center text-xs text-foreground/60 py-4 border-t border-card-border">
    <p>Not financial advice. DYOR.</p>
  </div>
);

export default function TeamVestingPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <HeroSection />
      <QuickFactsGrid />
      <VestingTable />
      <EnforcementSection />
      <div className="cosmic-card p-6 mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">Daily Drip Policy</h2>
        <ul className="list-disc pl-6 space-y-2 text-foreground/80">
          <li>Month-1 (10%) is considered disbursed with the relaunch airdrop.</li>
          <li>From Month-2 onward: distribute daily, pro-rated across the calendar month.</li>
          <li>Daily amount = (Total vesting allocation × monthly %) ÷ (days in that month).</li>
          <li>Split each person’s daily amount evenly across all of their wallets.</li>
          <li>Month-2 daily drip begins the day after the relaunch airdrop.</li>
          <li>Rounding: calculated at high precision with carry-forward; monthly totals match exactly.</li>
        </ul>
      </div>
      <AirdropHowTo />
      <FAQSection />
      <FooterLegal />
    </div>
  );
}
