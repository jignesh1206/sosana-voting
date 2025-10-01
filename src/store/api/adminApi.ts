import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


// Types
export interface AdminRound {
  _id: string;
  round: number;
  roundName: string;
  roundType: 'live' | 'pre-launch';
  nominationStartDate: string;
  nominationEndDate: string;
  votingStartDate: string;
  votingEndDate: string;
  nominationFee: number;
  votingFee: number;
  status: 'scheduled' | 'nominating' | 'voting' | 'results_pending' | 'results_declared' | 'completed' | 'canceled';
  description: string;
  resultDeclarationType: 'manual' | 'automatic';
  automaticDeclarationDelay: number;
  completionDelay: number;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringFrequency?: number;
  recurringDayOfWeek?: number;
  recurringDayOfMonth?: number;
  recurringTime?: string;
  results?: {
    declaredAt?: string;
    totalTokens?: number;
    totalVotes?: number;
    winners?: Array<{
      tokenId: string;
      tokenAddress: string;
      symbol: string;
      name: string;
      voteCount: number;
    }>;
    allResults?: Array<{
      tokenId: string;
      tokenAddress: string;
      symbol: string;
      name: string;
      logoUrl?: string;
      nominator: string;
      voteCount: number;
      nominationValue: number;
    }>;
  };
  statistics: {
    nominationsCount: number;
    votesCount: number;
    participantsCount: number;
    totalNominationValue: number;
    totalVoteValue: number;
  };
  templateId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminToken {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenMintAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  nomineeWallet: string;
  votesReceived: number;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface CreateRoundRequest {
  roundNumber?: number;
  roundName?: string;
  roundType?: 'live' | 'pre-launch';
  nominationStartDate: string;
  nominationEndDate: string;
  votingStartDate: string;
  votingEndDate: string;
  nominationFee?: number;
  votingFee?: number;
  description?: string;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringFrequency?: number;
  recurringDayOfWeek?: number;
  recurringDayOfMonth?: number;
  recurringTime?: string;
  resultDeclarationType?: 'manual' | 'automatic';
  automaticDeclarationDelay?: number;
  completionDelay?: number;
}

export interface WalletBalance {
  address: string;
  balance: number;
  type: string;
  error?: string;
}

export interface WalletBalances {
  lpWallet?: WalletBalance;
  marketingWallet?: WalletBalance;
  feeVault?: WalletBalance;
  withdrawAuthority?: WalletBalance;
}

export interface VestingAccount {
  total: number;
  decimal: number;
  tokenMint: string;
  remain: number;
  startTime: number;
  lastReleaseMonth: number;
}

export interface VestingData {
  team?: VestingAccount;
  marketing?: VestingAccount;
  liquidity?: VestingAccount;
  reserveTreasury?: VestingAccount;
}

export interface VestingInitRequest {
  totalTokens: number;
  decimals: number;
}

export interface VestingWithdrawRequest {
  amount: number;
}

export interface RewardDistribution {
  roundId: string;
  roundNumber: number;
  roundType?: string;
  winningToken: {
    id: string;
    symbol: string;
    name: string;
  };
  nominator: {
    wallet: string;
    reward: number;
    type: string;
  };
  voters: Array<{
    wallet: string;
    votingPower: number;
    reward: number;
    type: string;
  }>;
  totalVotingPower: number;
  totalVoterReward: number;
  totalNominatorReward: number;
  totalReward: number;
  createdAt?: string;
  updatedAt?: string;
}


// src/constants/apiRoutes.ts

export const API_ROUTES = {
  ADMIN: {
    ROUNDS: {
      BASE: '/api/admin/rounds',
      BY_ID: (id: string) => `/api/admin/rounds/${id}`,
      START: (id: string) => `/api/admin/rounds/${id}/start`,
      END_NOMINATION: (id: string) => `/api/admin/rounds/${id}/end-nomination`,
      END_VOTING: (id: string) => `/api/admin/rounds/${id}/end-voting`,
      CANCEL: (id: string) => `/api/admin/rounds/${id}/cancel`,
      RESTART: (id: string) => `/api/admin/rounds/${id}/restart`,
      EXTEND: (id: string) => `/api/admin/rounds/${id}/extend`,
      INSTANT_COMPLETE: (id: string) => `/api/admin/rounds/${id}/instant-complete`,
      CALCULATE_REWARDS: (roundId: string) => `/api/admin/rounds/${roundId}/calculate-rewards`,
      DISTRIBUTE_REWARDS: (roundId: string) => `/api/admin/rounds/${roundId}/distribute-rewards`,
    },
    VOTES: {
      BASE: '/api/admin/votes',
      BY_ROUND: (roundId: string) => `/api/admin/votes/${roundId}`,
      BY_ID: (voteId: string) => `/api/admin/votes/${voteId}`,
    },
    NOMINATIONS: {
      BASE: '/api/admin/nominations',
      BY_ROUND: (roundId: string) => `/api/admin/nominations/${roundId}`,
      BY_ID: (nominationId: string) => `/api/admin/nominations/${nominationId}`,
    },
    DASHBOARD: '/api/admin/dashboard',
    WALLET_BALANCES: '/api/admin/wallet-balances',
    RESULTS: {
      BASE: '/api/admin/results',
      BY_ROUND: (roundId: string) => `/api/admin/results/${roundId}`,
    },
    VESTING: {
      BASE: '/api/admin/vesting',
      INIT_TEAM: '/api/admin/vesting/team/init',
      INIT_MARKETING: '/api/admin/vesting/marketing/init',
      INIT_LIQUIDITY: '/api/admin/vesting/liquidity/init',
      INIT_RESERVE_TREASURY: '/api/admin/vesting/reserve-treasury/init',
      WITHDRAW_TEAM: '/api/admin/vesting/team/withdraw',
      WITHDRAW_MARKETING: '/api/admin/vesting/marketing/withdraw',
      WITHDRAW_LIQUIDITY: '/api/admin/vesting/liquidity/withdraw',
      WITHDRAW_RESERVE_TREASURY: '/api/admin/vesting/reserve-treasury/withdraw',
      ACCOUNTS: '/api/admin/vesting/accounts',
    },
    TOKEN_INFO: '/api/admin/token-info',
  },
};


// Admin API slice
export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('sosana_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      const state = getState() as any;
      const userAddress = state.user?.address;
      if (userAddress) {
        headers.set('X-Wallet-Address', userAddress);
      }
      
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['AdminRound', 'AdminToken', 'Admin', 'WalletBalances', 'RewardDistribution', 'Vesting'],
  endpoints: (builder) => ({
    // Get all rounds
    getAdminRounds: builder.query<{ success: boolean; data: AdminRound[] }, void>({
      query: () => API_ROUTES.ADMIN.ROUNDS.BASE,
      providesTags: ['AdminRound'],
    }),

    // Get round by ID
    getRoundById: builder.query<{ success: boolean; round: AdminRound }, string>({
      query: (id) => API_ROUTES.ADMIN.ROUNDS.BY_ID(id),
      providesTags: (result, error, id) => [{ type: 'AdminRound', id }],
      // Keep data in cache for longer to prevent unnecessary refetches
      keepUnusedDataFor: 300, // 5 minutes
    }),

    // Create round
    createRound: builder.mutation<AdminRound, CreateRoundRequest>({
      query: (roundData) => ({
        url: API_ROUTES.ADMIN.ROUNDS.BASE,
        method: 'POST',
        body: roundData,
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // Update round
    updateRound: builder.mutation<{ success: boolean; message: string; round: AdminRound }, { id: string; data: Partial<CreateRoundRequest> }>({
      query: ({ id, data }) => ({
        url: API_ROUTES.ADMIN.ROUNDS.BY_ID(id),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // Delete round
    deleteRound: builder.mutation<void, string>({
      query: (id) => ({
        url: API_ROUTES.ADMIN.ROUNDS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // Start round
    startRound: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: API_ROUTES.ADMIN.ROUNDS.START(id),
        method: 'POST',
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // End nomination
    endNomination: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: API_ROUTES.ADMIN.ROUNDS.END_NOMINATION(id),
        method: 'POST',
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // End voting
    endVoting: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: API_ROUTES.ADMIN.ROUNDS.END_VOTING(id),
        method: 'POST',
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // Cancel round
    cancelRound: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: API_ROUTES.ADMIN.ROUNDS.CANCEL(id),
        method: 'POST',
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // Restart round
    restartRound: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: API_ROUTES.ADMIN.ROUNDS.RESTART(id),
        method: 'POST',
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // Extend round
    extendRoundTime: builder.mutation<{ success: boolean }, { id: string; extensionMinutes: number; phase: string }>({
      query: ({ id, extensionMinutes, phase }) => ({
        url: API_ROUTES.ADMIN.ROUNDS.EXTEND(id),
        method: 'POST',
        body: { extensionMinutes, phase },
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // Instant complete
    instantCompleteRound: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: API_ROUTES.ADMIN.ROUNDS.INSTANT_COMPLETE(id),
        method: 'POST',
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // Get wallet balances
    getWalletBalances: builder.query<{ success: boolean; data: WalletBalances }, void>({
      query: () => API_ROUTES.ADMIN.WALLET_BALANCES,
      providesTags: ['WalletBalances'],
    }),

    // Calculate reward distribution
    calculateRewardDistribution: builder.query<{ success: boolean; data: RewardDistribution; distributedAt?: string }, string>({
      query: (roundId) => API_ROUTES.ADMIN.ROUNDS.CALCULATE_REWARDS(roundId),
      providesTags: (result, error, roundId) => [{ type: 'RewardDistribution', id: roundId }],
    }),

    // Distribute rewards
    distributeRewards: builder.mutation<{ success: boolean; message: string; data?: RewardDistribution; distribution?: RewardDistribution; alreadyDistributed?: boolean; distributedAt?: string; createdAt?: string }, string>({
      query: (roundId) => ({
        url: API_ROUTES.ADMIN.ROUNDS.DISTRIBUTE_REWARDS(roundId),
        method: 'POST',
      }),
      invalidatesTags: ['AdminRound', 'RewardDistribution'],
    }),

    // Votes
    getAdminVotes: builder.query<{ success: boolean; data: any[] }, string>({
      query: (roundId) => API_ROUTES.ADMIN.VOTES.BY_ROUND(roundId),
      providesTags: ['Admin'],
    }),

    getAllAdminVotes: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => API_ROUTES.ADMIN.VOTES.BASE,
      providesTags: ['Admin'],
    }),

    removeVote: builder.mutation<{ success: boolean }, string>({
      query: (voteId) => ({
        url: API_ROUTES.ADMIN.VOTES.BY_ID(voteId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Admin'],
    }),

    // Add vote
    addVote: builder.mutation<{ success: boolean }, { tokenId: string; userAddress: string; roundType?: string }>({
      query: (voteData) => ({
        url: '/api/vote',
        method: 'POST',
        body: voteData,
      }),
      invalidatesTags: ['Admin'],
    }),

    // Nominations
    getAdminNominations: builder.query<{ success: boolean; data: any[] }, string>({
      query: (roundId) => API_ROUTES.ADMIN.NOMINATIONS.BY_ROUND(roundId),
      providesTags: ['Admin'],
    }),

    getAllAdminNominations: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => API_ROUTES.ADMIN.NOMINATIONS.BASE,
      providesTags: ['Admin'],
    }),

    addNomination: builder.mutation<any, any>({
      query: (nomination) => ({
        url: API_ROUTES.ADMIN.NOMINATIONS.BASE,
        method: 'POST',
        body: nomination,
      }),
      invalidatesTags: ['Admin'],
    }),

    removeNomination: builder.mutation<{ success: boolean }, string>({
      query: (nominationId) => ({
        url: API_ROUTES.ADMIN.NOMINATIONS.BY_ID(nominationId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Admin'],
    }),

    // Dashboard
    getAdminDashboard: builder.query<{ success: boolean; data: any }, void>({
      query: () => API_ROUTES.ADMIN.DASHBOARD,
      providesTags: ['Admin'],
    }),

    // Results
    getAdminResults: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => API_ROUTES.ADMIN.RESULTS.BASE,
      providesTags: ['Admin'],
    }),

    getAdminResultsByRound: builder.query<any, string>({
      query: (roundId) => API_ROUTES.ADMIN.RESULTS.BY_ROUND(roundId),
      providesTags: ['Admin'],
    }),

    // Get token info by mint address
    getTokenInfo: builder.query<{ success: boolean; data: any }, string>({
      query: (mintAddress) => `${API_ROUTES.ADMIN.TOKEN_INFO}?mintAddress=${mintAddress}`,
      providesTags: ['Admin'],
    }),

    // Debug: Trigger auto-declaration
    triggerAutoDeclare: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/api/debug/trigger-auto-declare',
        method: 'POST',
      }),
      invalidatesTags: ['AdminRound'],
    }),

    // Vesting Management
    getVestingAccounts: builder.query<{ success: boolean; data: VestingData }, void>({
      query: () => API_ROUTES.ADMIN.VESTING.ACCOUNTS,
      providesTags: ['Vesting'],
    }),

    initializeTeamVesting: builder.mutation<{ success: boolean; message: string }, VestingInitRequest>({
      query: (data) => ({
        url: API_ROUTES.ADMIN.VESTING.INIT_TEAM,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vesting'],
    }),

    initializeMarketingVesting: builder.mutation<{ success: boolean; message: string }, VestingInitRequest>({
      query: (data) => ({
        url: API_ROUTES.ADMIN.VESTING.INIT_MARKETING,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vesting'],
    }),

    initializeLiquidityVesting: builder.mutation<{ success: boolean; message: string }, VestingInitRequest>({
      query: (data) => ({
        url: API_ROUTES.ADMIN.VESTING.INIT_LIQUIDITY,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vesting'],
    }),

    initializeReserveTreasuryVesting: builder.mutation<{ success: boolean; message: string }, VestingInitRequest>({
      query: (data) => ({
        url: API_ROUTES.ADMIN.VESTING.INIT_RESERVE_TREASURY,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vesting'],
    }),

    withdrawTeamTokens: builder.mutation<{ success: boolean; message: string }, VestingWithdrawRequest>({
      query: (data) => ({
        url: API_ROUTES.ADMIN.VESTING.WITHDRAW_TEAM,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vesting'],
    }),

    withdrawMarketingTokens: builder.mutation<{ success: boolean; message: string }, VestingWithdrawRequest>({
      query: (data) => ({
        url: API_ROUTES.ADMIN.VESTING.WITHDRAW_MARKETING,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vesting'],
    }),

    withdrawLiquidityTokens: builder.mutation<{ success: boolean; message: string }, VestingWithdrawRequest>({
      query: (data) => ({
        url: API_ROUTES.ADMIN.VESTING.WITHDRAW_LIQUIDITY,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vesting'],
    }),

    withdrawReserveTreasuryTokens: builder.mutation<{ success: boolean; message: string }, VestingWithdrawRequest>({
      query: (data) => ({
        url: API_ROUTES.ADMIN.VESTING.WITHDRAW_RESERVE_TREASURY,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vesting'],
    }),
  }),
});

export const {
  useGetAdminRoundsQuery,
  useCreateRoundMutation,
  useUpdateRoundMutation,
  useDeleteRoundMutation,
  useStartRoundMutation,
  useEndNominationMutation,
  useEndVotingMutation,
  useCancelRoundMutation,
  useRestartRoundMutation,
  useExtendRoundTimeMutation,
  useInstantCompleteRoundMutation,
  useGetWalletBalancesQuery,
  useCalculateRewardDistributionQuery,
  useDistributeRewardsMutation,
  useGetAdminVotesQuery,
  useGetAllAdminVotesQuery,
  useRemoveVoteMutation,
  useAddVoteMutation,
  useGetAdminNominationsQuery,
  useGetAllAdminNominationsQuery,
  useAddNominationMutation,
  useRemoveNominationMutation,
  useGetAdminDashboardQuery,
  useGetAdminResultsQuery,
  useGetAdminResultsByRoundQuery,
  useGetRoundByIdQuery,
  useGetTokenInfoQuery,
  useTriggerAutoDeclareMutation,
  // Vesting hooks
  useGetVestingAccountsQuery,
  useInitializeTeamVestingMutation,
  useInitializeMarketingVestingMutation,
  useInitializeLiquidityVestingMutation,
  useInitializeReserveTreasuryVestingMutation,
  useWithdrawTeamTokensMutation,
  useWithdrawMarketingTokensMutation,
  useWithdrawLiquidityTokensMutation,
  useWithdrawReserveTreasuryTokensMutation,
} = adminApi;
