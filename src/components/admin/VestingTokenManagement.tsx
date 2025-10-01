'use client';

import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { getAccount, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { getTokenMintAddress } from '@/utils/vestingUtils';
import { SystemProgram, PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { toast } from 'react-toastify';
import idl from '@/contracts/idl.json';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import VestingCard from './VestingCard';

interface VestingAccount {
  total: number;
  decimal: number;
  tokenMint: string;
  remain: number;
  startTime: number;
  lastReleaseMonth: number;
}

interface VestingData {
  team?: VestingAccount;
  marketing?: VestingAccount;
  liquidity?: VestingAccount;
  reserveTreasury?: VestingAccount;
}

const VestingTokenManagement: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [vestingData, setVestingData] = useState<VestingData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);

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

  // Helper function to get token account PDA
  const getTokenAccountPDA = (type: string): PublicKey => {
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    let seed: Buffer;
    switch (type) {
      case 'team':
        seed = Buffer.from("team_token_account");
        break;
      case 'marketing':
        seed = Buffer.from("marketing_token_account");
        break;
      case 'liquidity':
        seed = Buffer.from("liquidity_token_account");
        break;
      case 'reserveTreasury':
        seed = Buffer.from("reserve_treasury_token_account");
        break;
      default:
        throw new Error('Invalid vesting type');
    }
    
    const [pda] = PublicKey.findProgramAddressSync(
      [seed, getTokenMintAddress().toBuffer()],
      program.programId
    );
    return pda;
  };

  // Helper function to check if vesting account exists
  const checkVestingAccountExists = async (type: string): Promise<boolean> => {
    if (!program) return false;
    
    try {
      // Since vesting accounts are now keypairs, we need to check if any exist
      const accounts = await program.account[`${type}Account`].all();
      return accounts.length > 0;
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    if (wallet) {
      const provider = new AnchorProvider(connection, wallet, {
        preflightCommitment: "processed",
      });
      const programInstance = new Program(idl as any, new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!), provider);
      setProgram(programInstance);
      fetchVestingData(programInstance);
    }
  }, [wallet, connection]);

  const fetchVestingData = async (programInstance: Program) => {
    try {
      setIsLoading(true);
      setError(null);

      const data: VestingData = {};

      // Check each vesting account type using .all() method
      const vestingTypes = ['team', 'marketing', 'liquidity', 'reserveTreasury'];
      
      for (const type of vestingTypes) {
        try {
          // Get all accounts of this type
          let accounts: any[];
          switch (type) {
            case 'team':
              accounts = await programInstance.account.teamAccount.all();
              break;
            case 'marketing':
              accounts = await programInstance.account.marketingAccount.all();
              break;
            case 'liquidity':
              accounts = await programInstance.account.liquidityAccount.all();
              break;
            case 'reserveTreasury':
              accounts = await programInstance.account.reserveTreasuryAccount.all();
              break;
            default:
              continue;
          }

          // Use the first account if any exist
          if (accounts.length > 0) {
            const account = accounts[0].account;
            const vestingData = {
              total: safeToNumber(account.total),
              decimal: safeToNumber(account.decimal),
              tokenMint: safeToString(account.tokenMint),
              remain: safeToNumber(account.remain),
              startTime: safeToNumber(account.startTime),
              lastReleaseMonth: safeToNumber(account.lastReleaseMonth),
            };

            switch (type) {
              case 'team':
                data.team = vestingData;
                break;
              case 'marketing':
                data.marketing = vestingData;
                break;
              case 'liquidity':
                data.liquidity = vestingData;
                break;
              case 'reserveTreasury':
                data.reserveTreasury = vestingData;
                break;
            }
          }
        } catch (err) {
          console.log(`${type} account not found or error:`, err);
          // Account doesn't exist, which is fine - it means it needs to be initialized
        }
      }

      setVestingData(data);
      console.log('📋 Fetched vesting data:', data);
    } catch (err) {
      console.error('Error fetching vesting data:', err);
      setError('Failed to fetch vesting data');
      toast.error('Failed to fetch vesting data');
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  const handleVestingInit = async (type: string, totalTokens: number, decimals: number) => {
    if (!program || !wallet) {
      toast.error('Wallet not connected');
      return;
    }

    // Validate parameters
    if (totalTokens <= 0) {
      toast.error('Total tokens must be greater than 0');
      return;
    }

    if (decimals < 0 || decimals > 18) {
      toast.error('Decimals must be between 0 and 18');
      return;
    }

    // Check if account already exists
    const accountExists = await checkVestingAccountExists(type);
    if (accountExists) {
      toast.error(`${type} vesting account already exists`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setOperationInProgress(`Initializing ${type} vesting...`);

      // Get or create user token account
      const userTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet as any,
        getTokenMintAddress(),
        wallet.publicKey,
        undefined, // (Optional) token account keypair (only used for non-ATA)
        undefined, // Optional keypair, default to Associated Token Account
        undefined, // Confirmation options
        TOKEN_2022_PROGRAM_ID // Token Extension Program ID
      );

      // Get config PDA
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("sosana-pda")],
        program.programId
      );

      // Create vesting account keypair and get token account PDA
      const vestingAccountKey = new web3.Keypair();
      const tokenAccountPDA = getTokenAccountPDA(type);
      let tx;

      switch (type) {
        case 'team':
          tx = await program.methods
            .initializeTeamVesting(new BN(totalTokens), new BN(decimals))
            .accounts({
              teamAccount: vestingAccountKey.publicKey,
              teamTokenAccount: tokenAccountPDA,
              config: configPda,
              signer: wallet.publicKey,
              userTokenAccount: userTokenAccount.address,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              tokenMint: getTokenMintAddress(),
              systemProgram: SystemProgram.programId,
            })
            .signers([vestingAccountKey])
            .rpc();
          break;

        case 'marketing':
          tx = await program.methods
            .initializeMarketingVesting(new BN(totalTokens), new BN(decimals))
            .accounts({
              marketingAccount: vestingAccountKey.publicKey,
              marketingTokenAccount: tokenAccountPDA,
              config: configPda,
              signer: wallet.publicKey,
              userTokenAccount: userTokenAccount.address,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              tokenMint: getTokenMintAddress(),
              systemProgram: SystemProgram.programId,
            })
            .signers([vestingAccountKey])
            .rpc();
          break;

        case 'liquidity':
          tx = await program.methods
            .initializeLiquidityVesting(new BN(totalTokens), new BN(decimals))
            .accounts({
              liquidityAccount: vestingAccountKey.publicKey,
              liquidityTokenAccount: tokenAccountPDA,
              config: configPda,
              signer: wallet.publicKey,
              userTokenAccount: userTokenAccount.address,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              tokenMint: getTokenMintAddress(),
              systemProgram: SystemProgram.programId,
            })
            .signers([vestingAccountKey])
            .rpc();
          break;

        case 'reserveTreasury':
          tx = await program.methods
            .initializeReserveTreasuryVesting(new BN(totalTokens), new BN(decimals))
            .accounts({
              reserveTreasuryAccount: vestingAccountKey.publicKey,
              reserveTreasuryTokenAccount: tokenAccountPDA,
              config: configPda,
              signer: wallet.publicKey,
              userTokenAccount: userTokenAccount.address,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              tokenMint: getTokenMintAddress(),
              systemProgram: SystemProgram.programId,
            })
            .signers([vestingAccountKey])
            .rpc();
          break;

        default:
          throw new Error('Invalid vesting type');
      }

      console.log(`${type} vesting initialized with transaction:`, tx);
      toast.success(`${type} vesting initialized successfully!`);
      await fetchVestingData(program);
    } catch (err: any) {
      console.error(`Error initializing ${type} vesting:`, err);
      const errorMessage = err.errorMessage || err.message || 'Unknown error';
      setError(`Failed to initialize ${type} vesting: ${errorMessage}`);
      toast.error(`Failed to initialize ${type} vesting: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  const handleVestingWithdraw = async (type: string, amount: number) => {
    if (!program || !wallet) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setOperationInProgress(`Withdrawing from ${type} vesting...`);

      // Get user token account
      const userTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet as any,
        getTokenMintAddress(),
        wallet.publicKey,
        undefined, // (Optional) token account keypair (only used for non-ATA)
        undefined, // Optional keypair, default to Associated Token Account
        undefined, // Confirmation options
        TOKEN_2022_PROGRAM_ID // Token Extension Program ID
      );

      // Get config PDA
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      // Get existing vesting account and token account PDA
      let vestingAccount: any;
      let tokenAccountPDA: PublicKey;
      let tx;

      // Find the existing vesting account
      let accounts: any[];
      switch (type) {
        case 'team':
          accounts = await program.account.teamAccount.all();
          if (accounts.length === 0) {
            throw new Error('Team vesting account not found');
          }
          vestingAccount = accounts[0];
          tokenAccountPDA = getTokenAccountPDA(type);
          
          tx = await program.methods
            .ownerWithdrawToken(new BN(amount))
            .accounts({
              config: configPda,
              teamAccount: vestingAccount.publicKey,
              signer: wallet.publicKey,
              userTokenAccount: userTokenAccount.address,
              teamTokenAccount: tokenAccountPDA,
              tokenMint: getTokenMintAddress(),
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
          break;

        case 'marketing':
          accounts = await program.account.marketingAccount.all();
          if (accounts.length === 0) {
            throw new Error('Marketing vesting account not found');
          }
          vestingAccount = accounts[0];
          tokenAccountPDA = getTokenAccountPDA(type);
          
          tx = await program.methods
            .ownerMarketingWithdrawToken(new BN(amount))
            .accounts({
              config: configPda,
              marketingAccount: vestingAccount.publicKey,
              signer: wallet.publicKey,
              userTokenAccount: userTokenAccount.address,
              marketingTokenAccount: tokenAccountPDA,
              tokenMint: getTokenMintAddress(),
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
          break;

        case 'liquidity':
          accounts = await program.account.liquidityAccount.all();
          if (accounts.length === 0) {
            throw new Error('Liquidity vesting account not found');
          }
          vestingAccount = accounts[0];
          tokenAccountPDA = getTokenAccountPDA(type);
          
          tx = await program.methods
            .ownerLiquidityWithdrawToken(new BN(amount))
            .accounts({
              config: configPda,
              liquidityAccount: vestingAccount.publicKey,
              signer: wallet.publicKey,
              userTokenAccount: userTokenAccount.address,
              liquidityTokenAccount: tokenAccountPDA,
              tokenMint: getTokenMintAddress(),
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
          break;

        case 'reserveTreasury':
          accounts = await program.account.reserveTreasuryAccount.all();
          if (accounts.length === 0) {
            throw new Error('Reserve Treasury vesting account not found');
          }
          vestingAccount = accounts[0];
          tokenAccountPDA = getTokenAccountPDA(type);
          
          tx = await program.methods
            .ownerReserveTreasuryWithdrawToken(new BN(amount))
            .accounts({
              config: configPda,
              reserveTreasuryAccount: vestingAccount.publicKey,
              signer: wallet.publicKey,
              userTokenAccount: userTokenAccount.address,
              reserveTreasuryTokenAccount: tokenAccountPDA,
              tokenMint: getTokenMintAddress(),
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
          break;

        default:
          throw new Error('Invalid vesting type');
      }

      console.log(`${type} tokens withdrawn with transaction:`, tx);
      toast.success(`${type} tokens withdrawn successfully!`);
      await fetchVestingData(program);
    } catch (err: any) {
      console.error(`Error withdrawing from ${type} vesting:`, err);
      const errorMessage = err.errorMessage || err.message || 'Unknown error';
      setError(`Failed to withdraw from ${type} vesting: ${errorMessage}`);
      toast.error(`Failed to withdraw from ${type} vesting: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  const canWithdraw = (vestingAccount: VestingAccount): boolean => {
    if (!vestingAccount) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const sixMonthsInSeconds = 6 * 30 * 24 * 60 * 60; // 6 months in seconds
    const cliffEndTime = Number(vestingAccount.startTime) + sixMonthsInSeconds;
    
    // Check if cliff period has passed
    if (now < cliffEndTime) return false;
    
    // Check if there are tokens remaining
    if (Number(vestingAccount.remain) <= 0) return false;
    
    return true;
  };

  const getAvailableAmount = (vestingAccount: VestingAccount): number => {
    if (!canWithdraw(vestingAccount)) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    const monthsSinceStart = Math.floor((now - Number(vestingAccount.startTime)) / (30 * 24 * 60 * 60));
    const monthsSinceLastRelease = monthsSinceStart - Number(vestingAccount.lastReleaseMonth);
    
    if (monthsSinceLastRelease < 1) return 0;
    
    // Calculate monthly release amount (assuming linear vesting over 24 months)
    const monthlyRelease = Number(vestingAccount.total) / 24;
    const availableThisMonth = Math.min(monthlyRelease * monthsSinceLastRelease, Number(vestingAccount.remain));
    
    return Math.floor(availableThisMonth);
  };

  if (!wallet) {
    return (
      <div className="cosmic-card p-6">
        <div className="text-center py-8">
          <div className="text-3xl mb-2">🔗</div>
          <h4 className="text-lg font-semibold text-foreground mb-1">Wallet Not Connected</h4>
          <p className="text-foreground/60">Please connect your Solana wallet to manage vesting schedules</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="cosmic-card p-6">
        <LoadingSpinner 
          size="lg" 
          text={operationInProgress || "Loading vesting data..."} 
        />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary
        error={new Error(error)}
        onRetry={() => program && fetchVestingData(program)}
        title="Error Loading Vesting Data"
        message={error}
      />
    );
  }

  const vestingTypes = [
    { key: 'team', name: 'Team Vesting', data: vestingData.team, color: 'blue' },
    { key: 'marketing', name: 'Marketing Vesting', data: vestingData.marketing, color: 'green' },
    { key: 'liquidity', name: 'Liquidity Vesting', data: vestingData.liquidity, color: 'purple' },
    { key: 'reserveTreasury', name: 'Reserve Treasury Vesting', data: vestingData.reserveTreasury, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Vesting Management</h2>
        <button
          onClick={() => program && fetchVestingData(program)}
          disabled={isLoading || !!operationInProgress}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh vesting data"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="cosmic-card p-4 bg-red-500/10 border border-red-500/30">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Operation Progress Display */}
      {operationInProgress && (
        <div className="cosmic-card p-4 bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <p className="text-blue-500">{operationInProgress}</p>
          </div>
        </div>
      )}

      {/* Vesting Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vestingTypes.map(({ key, name, data, color }) => (
          <VestingCard
            key={key}
            type={key}
            name={name}
            data={data}
            color={color}
            canWithdraw={data ? canWithdraw(data) : false}
            availableAmount={data ? getAvailableAmount(data) : 0}
            onInit={handleVestingInit}
            onWithdraw={handleVestingWithdraw}
            isOperationInProgress={!!operationInProgress}
          />
        ))}
      </div>

      {/* Summary Section */}
      <div className="cosmic-card p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Vesting Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {vestingTypes.map(({ key, name, data }) => (
            <div key={key} className="text-center">
              <p className="text-sm text-foreground/60">{name}</p>
              <p className="text-lg font-semibold text-foreground">
                {data ? `${(Number(data.remain)).toLocaleString()}` : 'Not Initialized'}
              </p>
              <p className="text-xs text-foreground/40">Remaining Tokens</p>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Section - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="cosmic-card p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Debug Information</h3>
          <div className="space-y-4">
            {vestingTypes.map(({ key, name, data }) => (
              <div key={key} className="border border-accent/30 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">{name}</h4>
                {data ? (
                  <div className="text-sm space-y-1">
                    <p><span className="text-foreground/60">Raw Total:</span> {String(data.total)}</p>
                    <p><span className="text-foreground/60">Raw Remain:</span> {String(data.remain)}</p>
                    <p><span className="text-foreground/60">Decimals:</span> {String(data.decimal)}</p>
                    <p><span className="text-foreground/60">Token Mint:</span> {String(data.tokenMint)}</p>
                    <p><span className="text-foreground/60">Start Time:</span> {String(data.startTime)}</p>
                    <p><span className="text-foreground/60">Last Release Month:</span> {String(data.lastReleaseMonth)}</p>
                    <p><span className="text-foreground/60">Display Total:</span> {(data.total / Math.pow(10, data.decimal)).toLocaleString()}</p>
                    <p><span className="text-foreground/60">Display Remain:</span> {(data.remain / Math.pow(10, data.decimal)).toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-foreground/60">Not initialized</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VestingTokenManagement;
