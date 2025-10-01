import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN, web3, Idl } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../contracts/idl.json";

// Types based on the IDL structure
export interface BlockchainNomination {
  publicKey: PublicKey;
  tokenMint: PublicKey;
  nominator: PublicKey;
  snapshotAmount: BN;
  voteCount: BN;
  voters: PublicKey[];
  isApproved: boolean;
  isWinner: boolean;
  isClaim: boolean;
  roundAddress: PublicKey;
}

export interface BlockchainRound {
  publicKey: PublicKey;
  roundNo: BN;
  nominators: PublicKey[];
  roundStartTime: BN;
  votingStartTime: BN;
  roundEndTime: BN;
  tokenMints: PublicKey[];
  created: BN;
  winnersAddress: PublicKey[];
  isClaim: boolean;
  isPreLaunch: boolean;
}

export interface ConfigAccount {
  owner: PublicKey;
  currentRound: BN;
  liquidityWallet: PublicKey;
  degenWallet: PublicKey;
  prelaunchWallet: PublicKey;
  marketingWallet: PublicKey;
  whitelistuser: PublicKey[];
  whitelisttoken: PublicKey[];
}

// Initialize Solana program
export const getSolanaProgram = (wallet: any, connection: any) => {
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
  return new Program(idl as Idl, programId, provider);
};

// Generate config PDA
export const getConfigPDA = () => {
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
  const [sosanaPda, sosanaBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("sosana-vote-pda")],
    programId
  );
  return sosanaPda;
};

// Helper function to safely convert BN objects to numbers
export const safeToNumber = (value: any): number => {
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

// Helper function to safely convert to string
export const safeToString = (value: any): string => {
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

// Fetch all blockchain rounds
export const fetchBlockchainRounds = async (program: Program): Promise<BlockchainRound[]> => {
  try {
    const rounds = await program.account.rounds.all();
    return rounds.map(round => ({
      publicKey: round.publicKey,
      roundNo: round.account.roundNo,
      nominators: round.account.nominators,
      roundStartTime: round.account.roundStartTime,
      votingStartTime: round.account.votingStartTime,
      roundEndTime: round.account.roundEndTime,
      tokenMints: round.account.tokenMints,
      created: round.account.created,
      winnersAddress: round.account.winnersAddress,
      isClaim: round.account.isClaim,
      isPreLaunch: round.account.isPreLaunch,
    }));
  } catch (error) {
    console.error('Error fetching blockchain rounds:', error);
    return [];
  }
};

// Fetch all blockchain nominations
export const fetchBlockchainNominations = async (program: Program): Promise<BlockchainNomination[]> => {
  try {
    const nominations = await program.account.nomination.all();
    return nominations.map(nomination => ({
      publicKey: nomination.publicKey,
      tokenMint: nomination.account.tokenMint,
      nominator: nomination.account.nominator,
      snapshotAmount: nomination.account.snapshotAmount,
      voteCount: nomination.account.voteCount,
      voters: nomination.account.voters,
      isApproved: nomination.account.isApproved,
      isWinner: nomination.account.isWinner,
      isClaim: nomination.account.isClaim,
      roundAddress: nomination.account.roundAddress,
    }));
  } catch (error) {
    console.error('Error fetching blockchain nominations:', error);
    return [];
  }
};

// Fetch nominations for a specific round
export const fetchNominationsByRound = async (program: Program, roundAddress: PublicKey): Promise<BlockchainNomination[]> => {
  try {
    const nominations = await program.account.nomination.all([
      {
        memcmp: {
          offset: 8 + 32, // Skip discriminator and roundAddress field
          bytes: roundAddress.toBase58(),
        },
      },
    ]);
    return nominations.map(nomination => ({
      publicKey: nomination.publicKey,
      tokenMint: nomination.account.tokenMint,
      nominator: nomination.account.nominator,
      snapshotAmount: nomination.account.snapshotAmount,
      voteCount: nomination.account.voteCount,
      voters: nomination.account.voters,
      isApproved: nomination.account.isApproved,
      isWinner: nomination.account.isWinner,
      isClaim: nomination.account.isClaim,
      roundAddress: nomination.account.roundAddress,
    }));
  } catch (error) {
    console.error('Error fetching nominations by round:', error);
    return [];
  }
};

// Fetch config account
export const fetchConfigAccount = async (program: Program): Promise<ConfigAccount | null> => {
  try {
    const configPDA = getConfigPDA();
    const configAccount = await program.account.config.fetch(configPDA);
    return {
      owner: configAccount.owner,
      currentRound: configAccount.currentRound,
      liquidityWallet: configAccount.liquidityWallet,
      degenWallet: configAccount.degenWallet,
      prelaunchWallet: configAccount.prelaunchWallet,
      marketingWallet: configAccount.marketingWallet,
      whitelistuser: configAccount.whitelistuser,
      whitelisttoken: configAccount.whitelisttoken,
    };
  } catch (error) {
    console.error('Error fetching config account:', error);
    return null;
  }
};

// Remove nomination (admin function)
export const removeNomination = async (program: Program, nominationAddress: PublicKey): Promise<boolean> => {
  try {
    // Note: The IDL doesn't show a direct remove nomination instruction
    // This would need to be implemented in the smart contract
    // For now, we'll return false to indicate it's not implemented
    console.warn('Remove nomination not implemented in smart contract');
    return false;
  } catch (error) {
    console.error('Error removing nomination:', error);
    return false;
  }
};

// Get token metadata from Metaplex
export const getTokenMetadata = async (connection: any, tokenMint: PublicKey) => {
  try {
    const { Metaplex } = await import('@metaplex-foundation/js');
    const metaplex = Metaplex.make(connection);
    
    const metadata = await metaplex.nfts().findByMint({ mintAddress: tokenMint });
    return {
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return {
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      uri: '',
    };
  }
};

// Format nomination data for display
export const formatNominationForDisplay = (nomination: BlockchainNomination, round?: BlockchainRound) => {
  return {
    publicKey: nomination.publicKey.toString(),
    _id: nomination.publicKey.toString(),
    round: round ? safeToNumber(round.roundNo) : 0,
    tokenAddress: nomination.tokenMint.toString(),
    symbol: 'Unknown', // Will be populated with metadata
    name: 'Unknown Token', // Will be populated with metadata
    nominationValue: safeToNumber(nomination.snapshotAmount),
    userAddress: nomination.nominator.toString(),
    voteCount: safeToNumber(nomination.voteCount),
    isApproved: nomination.isApproved,
    isWinner: nomination.isWinner,
    isClaim: nomination.isClaim,
    roundAddress: nomination.roundAddress.toString(),
    voters: nomination.voters.map(voter => voter.toString()),
    createdAt: new Date().toISOString(), // Blockchain doesn't store creation date
    isAdminAdded: false, // Would need to be determined by business logic
    isPreLaunch: round ? round.isPreLaunch : false,
  };
};

// Approve nomination (admin action)
export const approveNomination = async (program: Program, nominationAddress: PublicKey): Promise<string | null> => {
  try {
    const configPda = getConfigPDA();
    const tx = await program.methods
      .nominateApprove()
      .accounts({
        config: configPda,
        nomination: nominationAddress,
        signer: (program.provider as any).wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    return tx;
  } catch (error) {
    console.error('Error approving nomination:', error);
    return null;
  }
};
