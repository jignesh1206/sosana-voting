// Unified Type Definitions - Matches Backend Models Exactly

// Round Types
export interface Round {
  _id: string;
  round: number;
  roundName: string;
  roundType: 'live' | 'pre-launch';
  status: 'scheduled' | 'nominating' | 'voting' | 'results_pending' | 'results_declared' | 'completed' | 'canceled';
  nominationStartDate: string;
  nominationEndDate: string;
  votingStartDate: string;
  votingEndDate: string;
  nominationFee: number;
  votingFee: number;
  description: string;
  resultDeclarationType: 'manual' | 'automatic';
  automaticDeclarationDelay: number;
  completionDelay: number;
  results?: {
    declaredAt: string;
    totalTokens: number;
    totalVotes: number;
    winners: Array<{
      tokenId: string;
      tokenAddress: string;
      symbol: string;
      name: string;
      voteCount: number;
    }>;
    allResults: Array<{
      tokenId: string;
      tokenAddress: string;
      symbol: string;
      name: string;
      logoUrl: string;
      nominator: string;
      voteCount: number;
      nominationValue: number;
    }>;
  };
  statistics?: {
    nominationsCount: number;
    votesCount: number;
    participantsCount: number;
    totalNominationValue: number;
    totalVoteValue: number;
  };
  templateId?: string;
  startDate?: string; // legacy
  endDate?: string; // legacy
  createdAt: string;
  updatedAt: string;
}

// Token Types (Live Tokens) - Updated to match blockchain structure
export interface Token {
  _id: string;
  round: number;
  tokenAddress: string;
  symbol: string;
  name: string;
  logoUrl: string;
  nominationValue: number;
  userAddress: string;
  isAdminAdded: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed fields (not in backend model but added by frontend)
  isNominatedByUser?: boolean;
  isVotedByUser?: boolean;
}

// Blockchain Token Type (for API responses with nested tokenId structure)
export interface BlockchainToken {
  _id: string;
  tokenId: {
    _id: string;
    address: string;
    name: string;
    symbol: string;
    logoUrl: string;
  };
  nominator: string;
  date: string;
  isNominatedByUser?: boolean;
  isVotedByUser?: boolean;
}

// Pre-Launch Token Types
export interface PreLaunchToken {
  _id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string;
  tokenMintAddress?: string;
  projectDescription: string;
  goals: string;
  teamBackground: string;
  roadmap: string;
  expectedLaunchDate: string;
  targetBlockchain: string;
  tokenomics: string;
  website: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  uniqueValueProposition: string;
  marketPotential: string;
  nominatorAddress: string;
  roundId: string;
  round: number;
  status: 'active'; // Only active status in backend
  voteCount: number;
  totalVoteValue: number;
  nominationDate: string;
  updatedAt: string;
  createdAt: string;
  // Computed fields (not in backend model but added by frontend)
  isUserNomination?: boolean;
}

// Vote Types
export interface Vote {
  _id: string;
  round: number;
  tokenId: string;
  userAddress: string;
  voteValue: number;
  txId?: string;
  createdAt: string;
  updatedAt: string;
}

// Round Template Types
export interface RoundTemplate {
  _id: string;
  name: string;
  description: string;
  roundType: 'live' | 'pre-launch';
  nominationDuration: number;
  votingDuration: number;
  nominationFee: number;
  votingFee: number;
  resultDeclarationType: 'manual' | 'automatic';
  automaticDeclarationDelay: number;
  isRecurring: boolean;
  recurringPattern: 'weekly' | 'monthly';
  recurringFrequency: number;
  recurringDayOfWeek: number;
  recurringDayOfMonth: number;
  recurringTime: string;
  createdBy: string;
  isActive: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

// Token Info Types
export interface TokenInfo {
  _id: string;
  address: string;
  name: string;
  symbol: string;
  logoUrl: string;
}

// History Types
export interface History {
  _id: string;
  round: number;
  userAddress: string;
  tokenId: string;
  action: string;
  requiredBalance: number;
  date: string;
}

// API Request/Response Types
export interface VoteRequest {
  userAddress: string;
  tokenId: string;
  type?: 'live' | 'pre-launch';
}

export interface NominationRequest {
  userAddress: string;
  tokenAddress: string;
  roundType?: 'live' | 'pre-launch';
}

export interface PreLaunchNominationRequest {
  tokenName: string;
  tokenSymbol: string;
  projectDescription: string;
  goals: string;
  teamBackground: string;
  roadmap: string;
  expectedLaunchDate: string;
  targetBlockchain: string;
  tokenomics: string;
  website: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  uniqueValueProposition: string;
  marketPotential: string;
  nominatorAddress: string;
  roundId: string;
  round: number;
}

// User Types
export interface UserBalance {
  balance: number;
  spentBalance: number;
  availableBalance: number;
  currency: 'SOSANA' | 'SOL';
}

export interface UserProfile {
  _id: string;
  walletAddress: string;
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Token Type for UI
export type TokenType = 'live' | 'pre-launch';

// Round Status for UI
export type RoundStatus = 'scheduled' | 'nominating' | 'voting' | 'results_pending' | 'results_declared' | 'completed' | 'canceled';

// Blockchain Round Types (Solana/Anchor)
export interface BlockchainRound {
  publicKey: string;
  account: {
    roundNo: string;
    nominators: string[];
    roundStartTime: string;
    votingStartTime: string;
    roundEndTime: string;
    tokenMints: string[];
    created: string;
    winnersAddress: string[];
    isClaim: boolean;
    isPreLaunch: boolean;
  };
}

// Blockchain Round Account Type (for internal use)
export interface BlockchainRoundAccount {
  roundNo: string;
  nominators: string[];
  roundStartTime: string;
  votingStartTime: string;
  roundEndTime: string;
  tokenMints: string[];
  created: string;
  winnersAddress: string[];
  isClaim: boolean;
  isPreLaunch: boolean;
} 