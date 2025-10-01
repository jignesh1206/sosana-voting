import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN, web3, Idl } from "@project-serum/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import vestingIdl from "../contracts/vesting.json";
const { 
  getAccount, 
  getOrCreateAssociatedTokenAccount, 
  TOKEN_2022_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotent, 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} = await import('@solana/spl-token');

// Custom implementation of getOrCreateAssociatedTokenAccount that checks for existing accounts first
export const getOrCreateAssociatedTokenAccountCustom = async (
  connection: any,
  owner: { publicKey: PublicKey },
  payer: any,
  tokenMint: PublicKey,
  programId: PublicKey = TOKEN_2022_PROGRAM_ID
): Promise<PublicKey> => {
  let tokenAccount: PublicKey;

  // Check if token account already exists
  const existingAccounts = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId, mint: tokenMint }
  );

  if (existingAccounts.value.length > 0) {
    tokenAccount = new PublicKey(existingAccounts.value[0].pubkey);
    console.log('Using existing token account:', tokenAccount.toString());
  } else {
    console.log('Creating new token account for:', owner.publicKey.toString());
    tokenAccount = await createAssociatedTokenAccountIdempotent(
      connection,
      payer,
      tokenMint,
      owner.publicKey,
      {},
      programId
    );
    console.log('Created new token account:', tokenAccount.toString());
  }

  return tokenAccount;
};

// Specific implementation for fee vault (as per your original pattern)
export const getOrCreateFeeVaultTokenAccount = async (
  connection: any,
  feeVault: { publicKey: PublicKey },
  withdrawWithheldAuthority: any,
  tokenPubkey: PublicKey
): Promise<PublicKey> => {
  return getOrCreateAssociatedTokenAccountCustom(
    connection,
    feeVault,
    withdrawWithheldAuthority,
    tokenPubkey,
    TOKEN_2022_PROGRAM_ID
  );
};

// Enhanced version with better error handling and options
export const getOrCreateAssociatedTokenAccountEnhanced = async (
  connection: any,
  owner: { publicKey: PublicKey },
  payer: any,
  tokenMint: PublicKey,
  options: {
    programId?: PublicKey;
    skipPreflight?: boolean;
    preflightCommitment?: any;
  } = {}
): Promise<{ address: PublicKey; isNew: boolean }> => {
  const {
    programId = TOKEN_2022_PROGRAM_ID,
    skipPreflight = false,
    preflightCommitment = 'processed'
  } = options;

  let tokenAccount: PublicKey;
  let isNew = false;

  try {
    // Check if token account already exists
    const existingAccounts = await connection.getTokenAccountsByOwner(
      owner.publicKey,
      { programId, mint: tokenMint }
    );

    if (existingAccounts.value.length > 0) {
      tokenAccount = new PublicKey(existingAccounts.value[0].pubkey);
      console.log('Using existing token account:', tokenAccount.toString());
    } else {
      console.log('Creating new token account for:', owner.publicKey.toString());
      tokenAccount = await createAssociatedTokenAccountIdempotent(
        connection,
        payer,
        tokenMint,
        owner.publicKey,
        {
          skipPreflight,
          preflightCommitment
        },
        programId
      );
      isNew = true;
      console.log('Created new token account:', tokenAccount.toString());
    }

    return { address: tokenAccount, isNew };
  } catch (error) {
    console.error('Error in getOrCreateAssociatedTokenAccountEnhanced:', error);
    throw new Error(`Failed to get or create associated token account: ${error.message}`);
  }
};

// User ATA creation function (as per your implementation)
export async function getOrCreateUserATA(
  connection: Connection,
  wallet: any,            // wallet adapter from @solana/wallet-adapter-react
  mintAddress: string     // token mint as string
) {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const mintPubkey = new PublicKey(mintAddress);

  // This will pay the rent & fees from the connected wallet
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,                  // payer (must support signTransaction)
    mintPubkey,
    wallet.publicKey,        // owner of the ATA
    undefined,               // optional token account keypair
    undefined,               // optional owner keypair
    undefined,               // confirmation options
    TOKEN_2022_PROGRAM_ID    // required for Token-2022
  );

  return tokenAccount.address.toBase58();
}

// Custom version that checks for existing accounts first (following your pattern)
export async function getOrCreateUserATACustom(
  connection: Connection,
  wallet: any,
  mintAddress: string
) {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const mintPubkey = new PublicKey(mintAddress);
  let tokenAccount: PublicKey;

  // Check if token account already exists
  const existingAccounts = await connection.getTokenAccountsByOwner(
    wallet.publicKey,
    { programId: TOKEN_2022_PROGRAM_ID, mint: mintPubkey }
  );

  if (existingAccounts.value.length > 0) {
    tokenAccount = new PublicKey(existingAccounts.value[0].pubkey);
    console.log('Using existing user ATA:', tokenAccount.toString());
  } else {
    console.log('Creating new user ATA for:', wallet.publicKey.toString());
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintPubkey,
      wallet.publicKey,
      undefined,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    tokenAccount = ata.address;
    console.log('Created new user ATA:', tokenAccount.toString());
  }

  return tokenAccount.toBase58();
}

// Usage examples and documentation will be added after all function declarations

// Types based on the vesting IDL structure
export interface TeamAccount {
  total: BN;                    // Total tokens allocated to team pool
  decimal: BN;                  // Token mint decimals
  tokenMint: PublicKey;         // Token mint address
  remain: BN;                   // Remaining tokens in team pool
  startAt: BN;                  // Vesting start timestamp (UNIX seconds)
  currentMonth: number;         // Current month tracking
  nextMonth: number;            // Next month tracking
  currentMonthTotal: BN;        // Total for current month
  currentMonthRemain: BN;       // Remaining for current month
}

export interface WhiteList {
  userAddress: PublicKey;       // User's wallet address
  total: BN;                    // Total tokens allocated to this user
  claim: BN;                    // Total tokens user already claimed
  remain: BN;                   // Remaining tokens for user
  lastWithdrawAt: BN;           // Timestamp of user's last claim (UNIX seconds)
  lastWithdrawTreasuryAt: BN;   // Last treasury withdraw timestamp
}

// Vesting schedule entry
export interface VestingScheduleEntry {
  monthIndex: number;           // Month number (1, 2, 3, ...)
  percentBps: number;           // Monthly percent in basis points (1% = 100 bps)
  tokensForMonth?: BN;          // Optional precomputed token count for that month
}

// Time calculation constants
export const TIME_CONSTANTS = {
  SECONDS_PER_DAY: 86400,       // 1 day = 86,400 seconds
  SECONDS_PER_MONTH: 2592000,   // 1 month = 30 days = 2,592,000 seconds
  DAYS_PER_MONTH: 30,           // Vesting months are 30 days
} as const;

export interface ConfigAccount {
  owner: PublicKey;
  degenWallet: PublicKey;
  prelaunchWallet: PublicKey;
  marketingWallet: PublicKey;
}

// Default token mint address
export const DEFAULT_TOKEN_MINT = "ENq17x3cvYuh58Xy6wtjQCt9Vv3z6RAPwoNTnCeCvEku";

// Initialize Vesting Program
export const getVestingProgram = (wallet: any, connection: any) => {
  console.log('getVestingProgram called with wallet:', wallet);
  
  // Check if wallet is connected - handle both wallet adapter and anchor wallet formats
  let isConnected = false;
  let publicKey = null;
  
  if (wallet) {
    // For anchor wallet (from useAnchorWallet) - it has publicKey but no connected property
    if (wallet.publicKey && wallet.publicKey.toString() !== '11111111111111111111111111111111') {
      isConnected = true;
      publicKey = wallet.publicKey;
    }
    // For wallet adapter (from useWallet) - it has both connected and publicKey
    else if (wallet.connected && wallet.publicKey) {
      isConnected = true;
      publicKey = wallet.publicKey;
    }
  }
  
  if (!isConnected || !publicKey) {
    console.error('Wallet not connected:', { wallet, isConnected, publicKey });
    throw new Error('Wallet not connected');
  }

  console.log('Creating provider with wallet:', { publicKey: publicKey.toString() });
  
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  
  const programId = new PublicKey(process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID || "");
  return new Program(vestingIdl as Idl, programId, provider);
};

// Get token mint address with fallback
export const getTokenMintAddress = (): PublicKey => {
  const tokenMint = process.env.NEXT_PUBLIC_TOKEN_MINT || DEFAULT_TOKEN_MINT;
  
  if (!tokenMint) {
    throw new Error('Token mint address is not configured. Please set NEXT_PUBLIC_TOKEN_MINT environment variable.');
  }
  
  try {
    return new PublicKey(tokenMint);
  } catch (error) {
    throw new Error(`Invalid token mint address: ${tokenMint}. Please check your NEXT_PUBLIC_TOKEN_MINT environment variable.`);
  }
};

// Generate config PDA for vesting
export const getVestingConfigPDA = () => {
  const programId = new PublicKey(process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID || "");
  const [configPda, configBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("sosana-vesting-pda")],
    programId
  );
  return configPda;
};

// Derive team token account PDA (owned by config)
export const getTeamTokenAccountPDA = (tokenMint: PublicKey) => {
  const programId = new PublicKey(process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID || "");
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("team_token_account"), tokenMint.toBuffer()],
    programId
  );
  return pda;
};

// Generate whitelist PDA for a user
export const getWhiteListPDA = (userAddress: PublicKey) => {
  const programId = new PublicKey( process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID || "");
  const [whitelistPda, whitelistBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("sosana_user_whitelist"), userAddress.toBuffer()],
    programId
  );
  return whitelistPda;
};

// Generate config PDA
export const getConfigPDA = () => {
  const programId = new PublicKey( process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID || "");
  const [configPda, configBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("sosana-vesting-pda")],
    programId
  );
  return { configPda, configBump };
};

// Get or create user's token account
export const getUserTokenAccount = async (connection: any, userAddress: PublicKey, tokenMint: PublicKey) => {
  try {
    // First try to get existing token account
    const tokenAccounts = await connection.getTokenAccountsByOwner(userAddress, {
      mint: tokenMint
    });
    
    if (tokenAccounts.value.length > 0) {
      return tokenAccounts.value[0].pubkey;
    }
    
    // If no token account exists, we need to create one
    // This should be handled by the calling function with getOrCreateAssociatedTokenAccount
    throw new Error('No token account found for user. Token account must be created first.');
  } catch (error) {
    console.error('Error getting user token account:', error);
    throw error;
  }
};

// Create or get user's token account using TOKEN_2022_PROGRAM_ID
export const getOrCreateUserTokenAccount = async (connection: any, wallet: any, tokenMint: PublicKey) => {
  // Validate wallet object
  if (!wallet) {
    throw new Error('Wallet is required but not provided');
  }
  
  console.log('Wallet object:', wallet);
  console.log('Wallet type:', typeof wallet);
  console.log('Wallet keys:', Object.keys(wallet || {}));
  
  if (!wallet.publicKey) {
    console.error('Wallet publicKey is missing. Wallet structure:', wallet);
    throw new Error('Wallet publicKey is required but not found. Please ensure wallet is connected.');
  }
  
  console.log('Creating token account for:', wallet.publicKey.toString());
  console.log('Token mint:', tokenMint.toString());
  
  try {
    // First, try to check if account already exists
    const existingAccounts = await connection.getTokenAccountsByOwner(
      wallet.publicKey,
      { programId: TOKEN_2022_PROGRAM_ID, mint: tokenMint }
    );

    if (existingAccounts.value.length > 0) {
      const existingAccount = new PublicKey(existingAccounts.value[0].pubkey);
      console.log('Using existing token account:', existingAccount.toString());
      return existingAccount;
    }

    // If no existing account, try to create one using the standard method
    console.log('No existing account found, creating new one...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      tokenMint,
      wallet.publicKey,
      undefined,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    console.log('Created new token account:', tokenAccount.address.toString());
    return tokenAccount.address;
  } catch (error) {
    console.error('Error creating user token account:', error);
    
    // If the standard method fails, try our custom method as fallback
    try {
      console.log('Standard method failed, trying custom method...');
      const tokenAccountAddress = await getOrCreateUserATACustom(
        connection,
        wallet,
        tokenMint.toString()
      );
      
      console.log('Custom method succeeded:', tokenAccountAddress);
      return new PublicKey(tokenAccountAddress);
    } catch (customError) {
      console.error('Both methods failed:', { standard: error, custom: customError });
      throw new Error(`Failed to create user token account. Standard error: ${error.message}. Custom error: ${customError.message}`);
    }
  }
};

// Alternative approach that mimics Token class behavior
export const getOrCreateUserATATokenClass = async (
  connection: Connection,
  wallet: any,
  mintAddress: string,
  useToken2022: boolean = false
) => {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  try {
    const mintPubkey = new PublicKey(mintAddress);
    const programId = useToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    
    // Use the standard getOrCreateAssociatedTokenAccount with the specified program
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintPubkey,
      wallet.publicKey,
      undefined,
      undefined,
      undefined,
      programId
    );

    console.log('Token class alternative - Account address:', tokenAccount.address.toString());
    return tokenAccount.address.toBase58();
  } catch (error) {
    console.error('Error with Token class alternative approach:', error);
    throw new Error(`Token class alternative approach failed: ${error.message}`);
  }
};

// Enhanced alternative approach with better error handling
export const getOrCreateUserATATokenClassEnhanced = async (
  connection: Connection,
  wallet: any,
  mintAddress: string,
  options: {
    useToken2022?: boolean;
    skipPreflight?: boolean;
    preflightCommitment?: any;
  } = {}
) => {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const {
    useToken2022 = false,
    skipPreflight = false,
    preflightCommitment = 'processed'
  } = options;

  try {
    const mintPubkey = new PublicKey(mintAddress);
    const programId = useToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    
    // Use the standard getOrCreateAssociatedTokenAccount with options
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintPubkey,
      wallet.publicKey,
      undefined,
      undefined,
      {
        skipPreflight,
        preflightCommitment
      },
      programId
    );

    console.log('Enhanced Token class alternative - Account address:', tokenAccount.address.toString());
    return {
      address: tokenAccount.address.toBase58(),
      accountInfo: tokenAccount
    };
  } catch (error) {
    console.error('Error with enhanced Token class alternative approach:', error);
    throw new Error(`Enhanced Token class alternative approach failed: ${error.message}`);
  }
};

// Check if a user has a token account for a specific mint
export const checkUserTokenAccountExists = async (
  connection: any,
  userPublicKey: PublicKey,
  tokenMint: PublicKey
): Promise<{ exists: boolean; accountAddress?: PublicKey }> => {
  try {
    const existingAccounts = await connection.getTokenAccountsByOwner(
      userPublicKey,
      { programId: TOKEN_2022_PROGRAM_ID, mint: tokenMint }
    );

    if (existingAccounts.value.length > 0) {
      return {
        exists: true,
        accountAddress: new PublicKey(existingAccounts.value[0].pubkey)
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('Error checking token account existence:', error);
    return { exists: false };
  }
};

// Get token account information using getAccount
export const getTokenAccountInfo = async (connection: any, tokenAccountAddress: PublicKey) => {
  const { getAccount, TOKEN_2022_PROGRAM_ID } = await import('@solana/spl-token');
  
  try {
    const accountInfo = await getAccount(
      connection,
      tokenAccountAddress,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );
    
    return accountInfo;
  } catch (error) {
    console.error('Error getting token account info:', error);
    throw error;
  }
};

// Get user's token account balance
export const getUserTokenBalance = async (connection: any, userAddress: PublicKey, tokenMint: PublicKey) => {
  try {
    // First try to get existing token account
    const tokenAccounts = await connection.getTokenAccountsByOwner(userAddress, {
      mint: tokenMint
    });
    
    if (tokenAccounts.value.length === 0) {
      return { balance: 0, accountExists: false };
    }
    
    const tokenAccountAddress = tokenAccounts.value[0].pubkey;
    const accountInfo = await getTokenAccountInfo(connection, tokenAccountAddress);
    
    return {
      balance: Number(accountInfo.amount),
      accountExists: true,
      accountAddress: tokenAccountAddress
    };
  } catch (error) {
    console.error('Error getting user token balance:', error);
    return { balance: 0, accountExists: false, error: error.message };
  }
};

// Get team token account
// Resolve team token account via PDA derivation
export const getTeamTokenAccount = async (_connection: any, _teamAccount: PublicKey, tokenMint: PublicKey) => {
  return getTeamTokenAccountPDA(tokenMint);
};

// Get marketing token account
export const getMarketingTokenAccount = async (connection: any, marketingAccount: PublicKey, tokenMint: PublicKey) => {
  try {
    const tokenAccounts = await connection.getTokenAccountsByOwner(marketingAccount, {
      mint: tokenMint
    });

    if (tokenAccounts.value.length === 0) {
      throw new Error('No token account found for marketing');
    }

    return tokenAccounts.value[0].pubkey;
  } catch (error) {
    console.error('Error getting marketing token account:', error);
    throw error;
  }
};

// Fetch team account data
export const fetchTeamAccount = async (program: Program, teamAccountAddress: PublicKey): Promise<TeamAccount | null> => {
  try {
    const teamAccount = await program.account.teamAccount.fetch(teamAccountAddress);
    return teamAccount as TeamAccount;
  } catch (error) {
    console.error('Error fetching team account:', error);
    return null;
  }
};

// Fetch user's whitelist data
export const fetchUserWhiteList = async (program: Program, userAddress: PublicKey): Promise<WhiteList | null> => {
  try {
    const whitelistPDA = getWhiteListPDA(userAddress);
    console.log('whitelistPDA', whitelistPDA);
    const whitelistAccount = await program.account.whiteList.fetch(whitelistPDA);
    console.log('whitelistAccount', whitelistAccount);
    return whitelistAccount as WhiteList;
  } catch (error) {
    console.error('Error fetching user whitelist:', error);
    return null;
  }
};

// Alternative method using the pattern you showed
export const fetchUserWhiteListWithBump = async (program: Program, userAddress: PublicKey): Promise<{
  whitelistData: WhiteList | null;
  pda: PublicKey;
  bump: number;
} | null> => {
  try {
    const [userPDA, userBump] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("sosana_user_whitelist"), userAddress.toBuffer()],
      program.programId
    );
    
    const whiteListUsers = await program.account.whiteList.fetch(userPDA);
    console.log({ whiteListUsers });
    
    return {
      whitelistData: whiteListUsers as WhiteList,
      pda: userPDA,
      bump: userBump
    };
  } catch (error) {
    console.error('Error fetching user whitelist with bump:', error);
    return null;
  }
};

// Fetch MarketingAccount by provided address
export const fetchMarketingAccount = async (program: Program, marketingAccountAddress: PublicKey): Promise<any | null> => {
  try {
    const account = await program.account.marketingAccount.fetch(marketingAccountAddress);
    return account;
  } catch (error) {
    console.error('Error fetching marketing account:', error);
    return null;
  }
};

// Comprehensive claim eligibility check following the specification
export const checkClaimEligibility = async (
  program: Program, 
  userAddress: PublicKey,
  teamAccountAddress?: PublicKey
): Promise<{
  isEligible: boolean;
  claimableAmount: BN;
  reason?: string;
  timeMetrics?: any;
  scheduleEntry?: VestingScheduleEntry;
}> => {
  try {
    // 1. Fetch user whitelist data
    const whitelistData = await fetchUserWhiteList(program, userAddress);
    
    if (!whitelistData) {
      return {
        isEligible: false,
        claimableAmount: new BN(0),
        reason: 'User not whitelisted'
      };
    }

    // 2. Check if user has allocation
    if (whitelistData.total.isZero()) {
      return {
        isEligible: false,
        claimableAmount: new BN(0),
        reason: 'No tokens allocated to user'
      };
    }

    // 3. Fetch team account data if not provided
    let teamData: TeamAccount | null = null;
    if (teamAccountAddress) {
      teamData = await fetchTeamAccount(program, teamAccountAddress);
    }

    if (!teamData) {
      return {
        isEligible: false,
        claimableAmount: new BN(0),
        reason: 'Team account not found'
      };
    }

    // 4. Check if vesting has started
    const now = Math.floor(Date.now() / 1000);
    const timeMetrics = calculateTimeMetrics(teamData.startAt, now);
    
    if (!timeMetrics.hasStarted) {
      return {
        isEligible: false,
        claimableAmount: new BN(0),
        reason: 'Vesting has not started yet',
        timeMetrics
      };
    }

    // 5. Check if user already claimed today
    if (hasClaimedToday(whitelistData.lastWithdrawAt, now)) {
      return {
        isEligible: false,
        claimableAmount: new BN(0),
        reason: 'Already claimed today',
        timeMetrics
      };
    }

    // 6. Get current month schedule
    const schedule = getVestingSchedule();
    const currentScheduleEntry = schedule.find(entry => entry.monthIndex === timeMetrics.month);
    
    if (!currentScheduleEntry) {
      return {
        isEligible: false,
        claimableAmount: new BN(0),
        reason: `No schedule entry for month ${timeMetrics.month}`,
        timeMetrics
      };
    }

    // 7. Calculate claimable amount
    const mintDecimals = teamData.decimal.toNumber();
    const claimableAmount = calculateDailyClaimableAmount(
      whitelistData.total,
      currentScheduleEntry,
      timeMetrics.daysIntoCurrentMonth,
      mintDecimals
    );

    // 8. Check if there's anything to claim
    if (claimableAmount.isZero()) {
      return {
        isEligible: false,
        claimableAmount: new BN(0),
        reason: 'No tokens available to claim today',
        timeMetrics,
        scheduleEntry: currentScheduleEntry
      };
    }

    // 9. Check if team pool has enough tokens
    if (teamData.remain.lt(claimableAmount)) {
      return {
        isEligible: false,
        claimableAmount: new BN(0),
        reason: 'Insufficient tokens in team pool',
        timeMetrics,
        scheduleEntry: currentScheduleEntry
      };
    }

    // 10. Check if user has remaining allocation
    if (whitelistData.remain.lt(claimableAmount)) {
      return {
        isEligible: false,
        claimableAmount: new BN(0),
        reason: 'Insufficient remaining allocation',
        timeMetrics,
        scheduleEntry: currentScheduleEntry
      };
    }

    return {
      isEligible: true,
      claimableAmount,
      timeMetrics,
      scheduleEntry: currentScheduleEntry
    };

  } catch (error) {
    console.error('Error checking claim eligibility:', error);
    return {
      isEligible: false,
      claimableAmount: new BN(0),
      reason: 'Error checking eligibility'
    };
  }
};

// Claim team reward (airdrop)
export const claimTeamReward = async (
  program: Program,
  userAddress: PublicKey,
  connection: any,
  teamAccountAddress: PublicKey,
  wallet?: any
): Promise<{ success: boolean; signature?: string; error?: string }> => {
  try {
    const configPDA = getVestingConfigPDA();
    const teamPDA = teamAccountAddress;
    const whitelistPDA = getWhiteListPDA(userAddress);

    // Get team account to find token mint
    const teamData = await fetchTeamAccount(program, teamPDA);
    if (!teamData) {
      throw new Error('Team account not found');
    }

    const tokenMint = teamData.tokenMint;
    
    // Get or create user's associated token account
    let userTokenAccount: PublicKey;
    try {
      userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        userAddress,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      // Check if the account exists, if not create it
      try {
        await getAccount(connection, userTokenAccount, 'confirmed', TOKEN_2022_PROGRAM_ID);
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
          // Create the associated token account
          const createAccountIx = createAssociatedTokenAccountInstruction(
            userAddress, // payer
            userTokenAccount, // associated token account
            userAddress, // owner
            tokenMint, // mint
            TOKEN_2022_PROGRAM_ID, // token program
            ASSOCIATED_TOKEN_PROGRAM_ID // associated token program
          );
          
          const transaction = new web3.Transaction().add(createAccountIx);
          await program.provider.sendAndConfirm(transaction);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error setting up user token account:', error);
      throw new Error('Failed to setup user token account');
    }

    // Get team's token account using PDA
    const [teamTokenVault] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("team_token_account"), tokenMint.toBuffer()],
      program.programId
    );
    const teamTokenAccount = teamTokenVault;
    
    console.log('configPDA:', configPDA.toString());
    console.log('whitelistPDA:', whitelistPDA.toString());
    console.log('teamPDA:', teamPDA.toString());
    console.log('userTokenAccount:', userTokenAccount.toString());
    console.log('teamTokenAccount (PDA):', teamTokenAccount.toString());
    console.log('tokenMint:', tokenMint.toString());
    console.log('tokenProgram:', TOKEN_2022_PROGRAM_ID.toString());
    console.log('systemProgram:', web3.SystemProgram.programId.toString());
    const signature = await program.methods
      .teamClaimReward()
      .accounts({
        config: configPDA,
        whiteList: whitelistPDA,
        teamAccount: teamPDA,
        signer: userAddress,
        userTokenAccount: userTokenAccount,
        teamTokenAccount: teamTokenAccount,
        tokenMint: tokenMint,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    return {
      success: true,
      signature
    };
  } catch (error: any) {
    console.error('Error claiming team reward:', error);
    return {
      success: false,
      error: error.message || 'Failed to claim reward'
    };
  }
};

// Claim marketing reward (airdrop) using provided MarketingAccount public key
export const claimMarketingReward = async (
  program: Program,
  marketingAccountAddress: PublicKey,
  userAddress: PublicKey,
  connection: any,
  amount: BN,
  wallet?: any
): Promise<{ success: boolean; signature?: string; error?: string }> => {
  try {
    const configPDA = getVestingConfigPDA();

    // Fetch marketing account to get token mint
    const marketingAccount: any = await fetchMarketingAccount(program, marketingAccountAddress);
    if (!marketingAccount) {
      throw new Error('Marketing account not found');
    }

    const tokenMint: PublicKey = marketingAccount.tokenMint as PublicKey;
    
    // Get or create user token account
    let userTokenAccount: PublicKey;
    if (wallet) {
      // Use getOrCreateUserTokenAccount if wallet is provided
      userTokenAccount = await getOrCreateUserTokenAccount(connection, wallet, tokenMint);
    } else {
      // Fallback to getUserTokenAccount (will throw if account doesn't exist)
      userTokenAccount = await getUserTokenAccount(connection, userAddress, tokenMint);
    }
    
    const marketingTokenAccount = await getMarketingTokenAccount(connection, marketingAccountAddress, tokenMint);

    // Call the marketingClaimReward instruction (takes amount: u64)
    const token2022ProgramId = process.env.NEXT_PUBLIC_TOKEN_2022_PROGRAM_ID;
    if (!token2022ProgramId) {
      throw new Error('Missing NEXT_PUBLIC_TOKEN_2022_PROGRAM_ID');
    }
    const signature = await program.methods
      .marketingClaimReward(amount)
      .accounts({
        config: configPDA,
        marketingAccount: marketingAccountAddress,
        signer: userAddress,
        userTokenAccount: userTokenAccount,
        marketingTokenAccount: marketingTokenAccount,
        tokenMint: tokenMint,
        tokenProgram: new PublicKey(token2022ProgramId),
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    return { success: true, signature };
  } catch (error: any) {
    console.error('Error claiming marketing reward:', error);
    return { success: false, error: error.message || 'Failed to claim marketing reward' };
  }
};

// Helper function to format token amounts
export const formatTokenAmount = (amount: BN, _decimals: number = 0): string => {
  // Amounts are already provided in human-readable units by the program logic
  return amount.toString();
};

// Convert human-readable token amount to raw units for blockchain transfer
export const convertToRawAmount = (humanAmount: BN, mintDecimals: number): BN => {
  const multiplier = new BN(10).pow(new BN(mintDecimals));
  return humanAmount.mul(multiplier);
};

// Convert raw token amount to human-readable units
export const convertFromRawAmount = (rawAmount: BN, mintDecimals: number): BN => {
  const divisor = new BN(10).pow(new BN(mintDecimals));
  return rawAmount.div(divisor);
};

// Get next claim time (next calendar day)
export const getNextClaimTime = (lastWithdrawAt: BN, now: number = Math.floor(Date.now() / 1000)): number => {
  const lastClaimDay = Math.floor(lastWithdrawAt.toNumber() / TIME_CONSTANTS.SECONDS_PER_DAY);
  const currentDay = Math.floor(now / TIME_CONSTANTS.SECONDS_PER_DAY);
  
  if (lastClaimDay < currentDay) {
    // Can claim now
    return now;
  } else {
    // Next claim is tomorrow at midnight UTC
    const nextDay = currentDay + 1;
    return nextDay * TIME_CONSTANTS.SECONDS_PER_DAY;
  }
};

// Time math functions following the specification
export const calculateTimeMetrics = (startAt: BN, now: number = Math.floor(Date.now() / 1000)) => {
  const startTime = startAt.toNumber();
  const elapsedSeconds = now - startTime;
  
  if (elapsedSeconds < 0) {
    return {
      elapsedSeconds: 0,
      elapsedMonths: 0,
      month: 0,
      elapsedDays: 0,
      daysIntoCurrentMonth: 0,
      hasStarted: false
    };
  }
  
  const elapsedMonths = Math.floor(elapsedSeconds / TIME_CONSTANTS.SECONDS_PER_MONTH);
  const month = elapsedMonths + 1; // Month numbering starts at 1
  const elapsedDays = Math.floor(elapsedSeconds / TIME_CONSTANTS.SECONDS_PER_DAY);
  const daysIntoCurrentMonth = elapsedDays % TIME_CONSTANTS.DAYS_PER_MONTH;
  
  return {
    elapsedSeconds,
    elapsedMonths,
    month,
    elapsedDays,
    daysIntoCurrentMonth,
    hasStarted: true
  };
};

// Get current month from team account
export const getCurrentVestingMonth = (teamData: TeamAccount): number => {
  if (!teamData.startAt) return 0;
  
  const timeMetrics = calculateTimeMetrics(teamData.startAt);
  return timeMetrics.month;
};

// Check if user already claimed today (calendar day check)
export const hasClaimedToday = (lastWithdrawAt: BN, now: number = Math.floor(Date.now() / 1000)): boolean => {
  const lastClaimDay = Math.floor(lastWithdrawAt.toNumber() / TIME_CONSTANTS.SECONDS_PER_DAY);
  const currentDay = Math.floor(now / TIME_CONSTANTS.SECONDS_PER_DAY);
  
  return lastClaimDay === currentDay;
};

// Calculate daily claimable amount based on specification
export const calculateDailyClaimableAmount = (
  userTotal: BN,
  scheduleEntry: VestingScheduleEntry,
  daysIntoCurrentMonth: number,
  mintDecimals: number
): BN => {
  let monthlyAmount: BN;
  
  if (scheduleEntry.tokensForMonth) {
    // Use explicit tokens per month (avoids rounding issues)
    monthlyAmount = scheduleEntry.tokensForMonth;
  } else {
    // Use percent-based calculation
    // monthly_amount = floor(user_total * percent_bps / 10000)
    monthlyAmount = userTotal.mul(new BN(scheduleEntry.percentBps)).div(new BN(10000));
  }
  
  // per_day = floor(monthly_amount / 30)
  const perDay = monthlyAmount.div(new BN(TIME_CONSTANTS.DAYS_PER_MONTH));
  
  // claim_amount = per_day * days_to_claim
  // For daily claims, we claim for 1 day at a time
  const claimAmount = perDay.mul(new BN(1));
  
  return claimAmount;
};

// Get vesting schedule (this should match your on-chain schedule)
export const getVestingSchedule = (): VestingScheduleEntry[] => {
  return [
    { monthIndex: 1, percentBps: 1000 },  // 10% = 1000 bps
    { monthIndex: 2, percentBps: 800 },   // 8% = 800 bps
    { monthIndex: 3, percentBps: 800 },   // 8% = 800 bps
    { monthIndex: 4, percentBps: 800 },   // 8% = 800 bps
    { monthIndex: 5, percentBps: 800 },   // 8% = 800 bps
    { monthIndex: 6, percentBps: 800 },   // 8% = 800 bps
    { monthIndex: 7, percentBps: 600 },   // 6% = 600 bps
    { monthIndex: 8, percentBps: 600 },   // 6% = 600 bps
    { monthIndex: 9, percentBps: 600 },   // 6% = 600 bps
    { monthIndex: 10, percentBps: 600 },  // 6% = 600 bps
    { monthIndex: 11, percentBps: 600 },  // 6% = 600 bps
    { monthIndex: 12, percentBps: 400 },  // 4% = 400 bps
    { monthIndex: 13, percentBps: 300 },  // 3% = 300 bps
    { monthIndex: 14, percentBps: 300 },  // 3% = 300 bps
    { monthIndex: 15, percentBps: 300 },  // 3% = 300 bps
    { monthIndex: 16, percentBps: 300 },  // 3% = 300 bps
    { monthIndex: 17, percentBps: 200 },  // 2% = 200 bps
    { monthIndex: 18, percentBps: 200 },  // 2% = 200 bps
  ];
};

// Daily drip schedule utility with carry-forward rounding
export type MonthlyPercent = { month: number; percent: number };
export interface DailyDripDay {
  dateISO: string;
  dayIndex: number; // 1..daysInMonth
  amount: string; // high-precision decimal string
}
export interface DailyDripMonthPlan {
  month: number;
  percent: number;
  daysInMonth: number;
  daily: DailyDripDay[];
  totalForMonth: string; // sums exactly to allocation
}

// monthPercents: [{month:2, percent:8}, ...] without Month-1
export const generateDailyDripPlan = (
  totalAllocation: string, // human units, high-precision decimal string
  startAtUnix: number, // unix seconds for Month-1 start
  monthPercents: MonthlyPercent[],
  month1DisbursedOn: number // unix seconds for relaunch airdrop (Month-1 considered disbursed)
): DailyDripMonthPlan[] => {
  // Use integer math by scaling to 1e6 (string-based, compatible with ES2017)
  const SCALE = 1e6;
  const toScaled = (s: string) => Math.round(parseFloat(s) * SCALE);
  const fromScaled = (n: number) => (n / SCALE).toString();

  const totalScaled = toScaled(totalAllocation);
  const plans: DailyDripMonthPlan[] = [];
  for (const { month, percent } of monthPercents) {
    // Compute month start by adding (month-1) months from startAtUnix
    const startDate = new Date(startAtUnix * 1000);
    const monthStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + (month - 1), 1));
    const nextMonthStart = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
    const daysInMonth = Math.round((+nextMonthStart - +monthStart) / (24 * 3600 * 1000));

    // Allocation for this month
    const monthAllocScaled = Math.floor((totalScaled * percent) / 100);

    // Daily base and carry-forward remainder
    const dailyBase = Math.floor(monthAllocScaled / daysInMonth);
    let remainder = monthAllocScaled % daysInMonth;

    const daily: DailyDripDay[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      let amt = dailyBase;
      if (remainder > 0) {
        amt += 1; // distribute one extra unit for first `remainder` days
        remainder -= 1;
      }
      const dayDate = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), d));
      daily.push({
        dateISO: dayDate.toISOString().slice(0, 10),
        dayIndex: d,
        amount: fromScaled(amt),
      });
    }

    const totalForMonth = fromScaled(daily.reduce((acc, d) => acc + toScaled(d.amount), 0));
    plans.push({ month, percent, daysInMonth, daily, totalForMonth });
  }
  return plans;
};

// Frontend helper: compare two unix seconds as same UTC calendar date
export const isSameUtcDate = (aSec: number, bSec: number): boolean => {
  if (!aSec || !bSec) return false;
  const a = new Date(aSec * 1000);
  const b = new Date(bSec * 1000);
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
};

// Usage examples and documentation
export const TokenAccountUtils = {
  /**
   * Get or create an associated token account with the pattern you specified
   * @param connection - Solana connection
   * @param owner - Account that will own the token account
   * @param payer - Account that will pay for the transaction
   * @param tokenMint - The token mint address
   * @param programId - Token program ID (defaults to TOKEN_2022_PROGRAM_ID)
   * @returns Promise<PublicKey> - The token account address
   */
  getOrCreate: getOrCreateAssociatedTokenAccountCustom,
  
  /**
   * Enhanced version with additional options and return information
   * @param connection - Solana connection
   * @param owner - Account that will own the token account
   * @param payer - Account that will pay for the transaction
   * @param tokenMint - The token mint address
   * @param options - Additional options for account creation
   * @returns Promise<{address: PublicKey, isNew: boolean}> - Token account address and whether it was newly created
   */
  getOrCreateEnhanced: getOrCreateAssociatedTokenAccountEnhanced,
  
  /**
   * Specific implementation for fee vault accounts
   * @param connection - Solana connection
   * @param feeVault - Fee vault account
   * @param withdrawWithheldAuthority - Authority for withdrawing withheld tokens
   * @param tokenPubkey - Token mint address
   * @returns Promise<PublicKey> - The fee vault token account address
   */
  getOrCreateFeeVault: getOrCreateFeeVaultTokenAccount,
  
  /**
   * Create user ATA using standard @solana/spl-token function
   * @param connection - Solana connection
   * @param wallet - Wallet adapter
   * @param mintAddress - Token mint address as string
   * @returns Promise<string> - Token account address as base58 string
   */
  getUserATA: getOrCreateUserATA,
  
  /**
   * Create user ATA with custom pattern (checks existing accounts first)
   * @param connection - Solana connection
   * @param wallet - Wallet adapter
   * @param mintAddress - Token mint address as string
   * @returns Promise<string> - Token account address as base58 string
   */
  getUserATACustom: getOrCreateUserATACustom,
  
  /**
   * Check if a user has a token account for a specific mint
   * @param connection - Solana connection
   * @param userPublicKey - User's public key
   * @param tokenMint - Token mint address
   * @returns Promise<{exists: boolean, accountAddress?: PublicKey}> - Check result
   */
  checkUserTokenAccountExists: checkUserTokenAccountExists,
  
  /**
   * Create user ATA using Token class approach (legacy method)
   * @param connection - Solana connection
   * @param wallet - Wallet adapter
   * @param mintAddress - Token mint address as string
   * @param useToken2022 - Whether to use Token-2022 program (default: false)
   * @returns Promise<string> - Token account address as base58 string
   */
  getUserATATokenClass: getOrCreateUserATATokenClass,
  
  /**
   * Create user ATA using enhanced Token class approach
   * @param connection - Solana connection
   * @param wallet - Wallet adapter
   * @param mintAddress - Token mint address as string
   * @param options - Additional options for account creation
   * @returns Promise<{address: string, accountInfo: any}> - Token account address and info
   */
  getUserATATokenClassEnhanced: getOrCreateUserATATokenClassEnhanced
};

// Frontend helper: determine if user can attempt a claim today (daily drip)
// Assumes Month-1 already disbursed; caller should also ensure hasStarted from on-chain startAt
export const canClaimToday = (whitelist: WhiteList | null, nowSec: number): boolean => {
  if (!whitelist) return false;
  if (whitelist.remain.isZero()) return false;
  if (whitelist.lastWithdrawAt && isSameUtcDate(Number(whitelist.lastWithdrawAt), nowSec)) return false;
  return true;
};

// Compute next UTC unix time when user may claim again based on last_withdraw_at
// If already claimable now, returns nowSec
export const getNextClaimUnix = (
  whitelist: WhiteList | null,
  nowSec: number,
  teamStartAtSec?: number | null
): number | null => {
  if (!whitelist) return null;
  if (whitelist.remain.isZero()) return null;
  const last = Number(whitelist.lastWithdrawAt || 0);
  if (last === 0) {
    if (teamStartAtSec && nowSec < teamStartAtSec) {
      return teamStartAtSec;
    }
    return nowSec;
  }
  if (last && isSameUtcDate(last, nowSec)) {
    const d = new Date(nowSec * 1000);
    const nextMidnightUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0) / 1000;
    return Math.floor(nextMidnightUtc);
  }
  return nowSec;
};

// ============================================================================
// ADMIN WHITELIST MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Add a user to the whitelist (Admin only)
 * @param program - Anchor program instance
 * @param userAddress - User's public key as string
 * @param totalTokens - Total tokens to allocate to user
 * @returns Promise<string> - Transaction signature
 */
export const addUserToWhitelist = async (
  program: Program,
  userAddress: string,
  totalTokens: number,
  ownerPublicKey?: PublicKey
): Promise<string> => {
  try {
    const userPubkey = new PublicKey(userAddress);
    const whitelistPda = getWhiteListPDA(userPubkey);
    const { configPda } = getConfigPDA();

    console.log('Adding user to whitelist:', {
      userAddress,
      totalTokens,
      whitelistPda: whitelistPda.toString(),
      configPda: configPda.toString(),
      ownerPublicKey: ownerPublicKey.toString()
    });

    const ownerPk = ownerPublicKey ?? (program.provider as any).wallet.publicKey;

    const tx = await program.methods
      .addUserWhiteList(
        userPubkey,
        new BN(totalTokens)
      )
      .accounts({
        whiteList: whitelistPda,
        config: configPda,
        owner: ownerPk,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    console.log('User added to whitelist successfully:', tx);
    return tx;
  } catch (error) {
    console.error('Error adding user to whitelist:', error);
    throw error;
  }
};

/**
 * Remove a user from the whitelist (Admin only)
 * @param program - Anchor program instance
 * @param userAddress - User's public key as string
 * @returns Promise<string> - Transaction signature
 */
export const removeUserFromWhitelist = async (
  program: Program,
  userAddress: string
): Promise<string> => {
  try {
    const userPubkey = new PublicKey(userAddress);
    const whitelistPda = getWhiteListPDA(userPubkey);
    const { configPda } = getConfigPDA();

    console.log('Removing user from whitelist:', {
      userAddress,
      whitelistPda: whitelistPda.toString(),
      configPda: configPda.toString()
    });

    const tx = await program.methods
      .removeUserWhiteList()
      .accounts({
        whiteList: whitelistPda,
        config: configPda,
        owner: (program.provider as any).wallet.publicKey
      })
      .rpc();

    console.log('User removed from whitelist successfully:', tx);
    return tx;
  } catch (error) {
    console.error('Error removing user from whitelist:', error);
    throw error;
  }
};

/**
 * Fetch all whitelisted users (Admin only)
 * @param program - Anchor program instance
 * @returns Promise<Array<{publicKey: string, account: WhiteList}>> - Array of whitelisted users with public keys
 */
export const fetchAllWhitelistedUsers = async (
  program: Program
): Promise<Array<{publicKey: string, account: WhiteList}>> => {
  try {
    const whitelistAccounts = await program.account.whiteList.all();
    
    const users = whitelistAccounts.map(item => ({
      publicKey: item.publicKey.toString(),
      account: item.account as WhiteList
    }));
    
    console.log('Fetched whitelisted users:', users);
    return users;
  } catch (error) {
    console.error('Error fetching whitelisted users:', error);
    throw error;
  }
};

/**
 * Check if a user is whitelisted
 * @param program - Anchor program instance
 * @param userAddress - User's public key as string
 * @returns Promise<boolean> - Whether user is whitelisted
 */
export const isUserWhitelisted = async (
  program: Program,
  userAddress: string
): Promise<boolean> => {
  try {
    const userPubkey = new PublicKey(userAddress);
    const whitelistPda = getWhiteListPDA(userPubkey);
    
    const whitelistAccount = await program.account.whiteList.fetch(whitelistPda);
    return whitelistAccount !== null;
  } catch (error) {
    console.log('User not whitelisted or account not found:', error);
    return false;
  }
};

/**
 * Batch add multiple users to whitelist (Admin only)
 * @param program - Anchor program instance
 * @param users - Array of users to add with address and total tokens
 * @returns Promise<string[]> - Array of transaction signatures
 */
export const batchAddUsersToWhitelist = async (
  program: Program,
  users: Array<{ userAddress: string; totalTokens: number }>
): Promise<string[]> => {
  const signatures: string[] = [];
  
  for (const user of users) {
    try {
      const signature = await addUserToWhitelist(
        program,
        user.userAddress,
        user.totalTokens
      );
      signatures.push(signature);
      console.log(`Added user ${user.userAddress} with signature: ${signature}`);
    } catch (error) {
      console.error(`Failed to add user ${user.userAddress}:`, error);
      throw error;
    }
  }
  
  return signatures;
};

/**
 * Batch remove multiple users from whitelist (Admin only)
 * @param program - Anchor program instance
 * @param userAddresses - Array of user addresses to remove
 * @returns Promise<string[]> - Array of transaction signatures
 */
export const batchRemoveUsersFromWhitelist = async (
  program: Program,
  userAddresses: string[]
): Promise<string[]> => {
  const signatures: string[] = [];
  
  for (const userAddress of userAddresses) {
    try {
      const signature = await removeUserFromWhitelist(program, userAddress);
      signatures.push(signature);
      console.log(`Removed user ${userAddress} with signature: ${signature}`);
    } catch (error) {
      console.error(`Failed to remove user ${userAddress}:`, error);
      throw error;
    }
  }
  
  return signatures;
};