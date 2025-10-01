// Static mock data for the SOSANA voting platform
export interface StaticRound {
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
  createdAt: string;
  updatedAt: string;
}

export interface StaticToken {
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
  isNominatedByUser?: boolean;
  isVotedByUser?: boolean;
}

export interface StaticPreLaunchToken {
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
  status: 'active';
  voteCount: number;
  totalVoteValue: number;
  nominationDate: string;
  updatedAt: string;
  createdAt: string;
  isUserNomination?: boolean;
}

export interface StaticUserBalance {
  balance: number;
  spentBalance: number;
  availableBalance: number;
  currency: 'SOSANA' | 'SOL';
}

// Mock data
export const mockRounds: StaticRound[] = [
  {
    _id: '1',
    round: 1,
    roundName: 'Live Token Round 1',
    roundType: 'live',
    status: 'voting',
    nominationStartDate: '2024-01-01T00:00:00Z',
    nominationEndDate: '2024-01-07T23:59:59Z',
    votingStartDate: '2024-01-08T00:00:00Z',
    votingEndDate: '2024-01-15T23:59:59Z',
    nominationFee: 10,
    votingFee: 5,
    description: 'First round of live token voting',
    resultDeclarationType: 'manual',
    automaticDeclarationDelay: 24,
    completionDelay: 7,
    statistics: {
      nominationsCount: 25,
      votesCount: 150,
      participantsCount: 45,
      totalNominationValue: 250,
      totalVoteValue: 750
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z'
  },
  {
    _id: '2',
    round: 2,
    roundName: 'Pre-Launch Round 1',
    roundType: 'pre-launch',
    status: 'nominating',
    nominationStartDate: '2024-01-16T00:00:00Z',
    nominationEndDate: '2024-01-23T23:59:59Z',
    votingStartDate: '2024-01-24T00:00:00Z',
    votingEndDate: '2024-01-31T23:59:59Z',
    nominationFee: 15,
    votingFee: 8,
    description: 'First pre-launch token round',
    resultDeclarationType: 'automatic',
    automaticDeclarationDelay: 48,
    completionDelay: 14,
    statistics: {
      nominationsCount: 12,
      votesCount: 0,
      participantsCount: 12,
      totalNominationValue: 180,
      totalVoteValue: 0
    },
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z'
  },
  {
    _id: '3',
    round: 3,
    roundName: 'Live Token Round 2',
    roundType: 'live',
    status: 'scheduled',
    nominationStartDate: '2024-02-01T00:00:00Z',
    nominationEndDate: '2024-02-07T23:59:59Z',
    votingStartDate: '2024-02-08T00:00:00Z',
    votingEndDate: '2024-02-15T23:59:59Z',
    nominationFee: 12,
    votingFee: 6,
    description: 'Second round of live token voting',
    resultDeclarationType: 'manual',
    automaticDeclarationDelay: 24,
    completionDelay: 7,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
];

export const mockLiveTokens: StaticToken[] = [
  {
    _id: '1',
    round: 1,
    tokenAddress: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    logoUrl: '/logo.png',
    nominationValue: 10,
    userAddress: 'user123',
    isAdminAdded: false,
    isNominatedByUser: true,
    isVotedByUser: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '2',
    round: 1,
    tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    logoUrl: '/placeholder.svg',
    nominationValue: 10,
    userAddress: 'user456',
    isAdminAdded: false,
    isNominatedByUser: false,
    isVotedByUser: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    _id: '3',
    round: 1,
    tokenAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    logoUrl: '/placeholder.svg',
    nominationValue: 10,
    userAddress: 'user789',
    isAdminAdded: false,
    isNominatedByUser: false,
    isVotedByUser: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  }
];

export const mockPreLaunchTokens: StaticPreLaunchToken[] = [
  {
    _id: '1',
    tokenName: 'DeFi Protocol Token',
    tokenSymbol: 'DEFI',
    tokenLogo: '/placeholder.svg',
    projectDescription: 'A revolutionary DeFi protocol for decentralized lending',
    goals: 'To provide secure and efficient lending services',
    teamBackground: 'Experienced blockchain developers with 5+ years in DeFi',
    roadmap: 'Q1: MVP, Q2: Beta, Q3: Mainnet, Q4: Expansion',
    expectedLaunchDate: '2024-06-01',
    targetBlockchain: 'Solana',
    tokenomics: 'Total supply: 100M, Initial price: $0.10',
    website: 'https://defiprotocol.com',
    twitter: '@defiprotocol',
    telegram: '@defiprotocol',
    discord: 'discord.gg/defiprotocol',
    uniqueValueProposition: 'First cross-chain lending protocol on Solana',
    marketPotential: 'Targeting $1B TVL within 12 months',
    nominatorAddress: 'user123',
    roundId: '2',
    round: 2,
    status: 'active',
    voteCount: 0,
    totalVoteValue: 0,
    nominationDate: '2024-01-16T00:00:00Z',
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
    isUserNomination: true
  },
  {
    _id: '2',
    tokenName: 'Gaming Token',
    tokenSymbol: 'GAME',
    tokenLogo: '/placeholder.svg',
    projectDescription: 'Next-generation gaming token for P2E games',
    goals: 'To revolutionize the gaming industry with blockchain',
    teamBackground: 'Gaming industry veterans with blockchain expertise',
    roadmap: 'Q1: Game development, Q2: Alpha testing, Q3: Beta launch',
    expectedLaunchDate: '2024-08-01',
    targetBlockchain: 'Solana',
    tokenomics: 'Total supply: 50M, Initial price: $0.05',
    website: 'https://gametoken.com',
    twitter: '@gametoken',
    telegram: '@gametoken',
    discord: 'discord.gg/gametoken',
    uniqueValueProposition: 'First AAA-quality P2E game on Solana',
    marketPotential: 'Targeting 1M active players within 6 months',
    nominatorAddress: 'user456',
    roundId: '2',
    round: 2,
    status: 'active',
    voteCount: 0,
    totalVoteValue: 0,
    nominationDate: '2024-01-17T00:00:00Z',
    createdAt: '2024-01-17T00:00:00Z',
    updatedAt: '2024-01-17T00:00:00Z',
    isUserNomination: false
  }
];

export const mockUserBalance: StaticUserBalance = {
  balance: 1000,
  spentBalance: 150,
  availableBalance: 850,
  currency: 'SOSANA'
};

// Helper functions to simulate API behavior
export const getCurrentRound = (roundType: 'live' | 'pre-launch'): StaticRound | null => {
  return mockRounds.find(round => 
    round.roundType === roundType && 
    ['nominating', 'voting'].includes(round.status)
  ) || null;
};

export const getUpcomingRounds = (roundType: 'live' | 'pre-launch'): StaticRound[] => {
  return mockRounds.filter(round => 
    round.roundType === roundType && 
    round.status === 'scheduled'
  );
};

export const getCompletedRounds = (roundType: 'live' | 'pre-launch'): StaticRound[] => {
  return mockRounds.filter(round => 
    round.roundType === roundType && 
    ['results_declared', 'completed'].includes(round.status)
  );
};

export const getTokensForRound = (roundId: string, roundType: 'live' | 'pre-launch'): StaticToken[] | StaticPreLaunchToken[] => {
  if (roundType === 'live') {
    return mockLiveTokens.filter(token => token.round === parseInt(roundId));
  } else {
    return mockPreLaunchTokens.filter(token => token.roundId === roundId);
  }
};
