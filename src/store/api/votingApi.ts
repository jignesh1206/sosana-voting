import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseApi } from './baseApi';
import { 
  Round, 
  Token, 
  VoteRequest, 
  NominationRequest, 
  TokenType,
  ApiResponse 
} from '@/types';

// Voting API slice
export const votingApi = createApi({
  reducerPath: 'votingApi',
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
  tagTypes: ['Round', 'Token', 'Vote', 'Nomination', 'User'],
  endpoints: (builder) => ({
    // Get current voting round
    getCurrentRound: builder.query<{ success: boolean; round: any }, { type?: TokenType }>({
      query: ({ type } = {}) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        return {
          url: `/api/get-round?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Round'],
    }),

    // Get all voting rounds
    getVotingRounds: builder.query<Round[], void>({
      query: () => '/api/admin/rounds',
      providesTags: ['Round'],
    }),

    // Get nominated tokens
    getNominatedTokens: builder.query<{ success: boolean; tokens: Token[] }, { userAddress?: string; type?: TokenType }>({
      query: ({ userAddress, type }) => {
        const params = new URLSearchParams();
        if (userAddress) params.append('userAddress', userAddress);
        if (type) params.append('type', type);
        return {
          url: `/api/get-tokens?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Token'],
    }),

    // Get tokens (alias for getNominatedTokens)
    getTokens: builder.query<{ success: boolean; tokens: Token[] }, { type?: TokenType }>({
      query: ({ type } = {}) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        return {
          url: `/api/get-tokens?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Token'],
    }),

    // Submit token nomination
    submitNomination: builder.mutation<ApiResponse<Token>, NominationRequest>({
      query: (nomination) => ({
        url: '/api/nominate',
        method: 'POST',
        body: nomination,
      }),
      invalidatesTags: ['Token', 'Nomination'],
    }),

    // Vote for token
    voteForToken: builder.mutation<ApiResponse<{ success: boolean }>, VoteRequest>({
      query: (voteData) => ({
        url: '/api/vote',
        method: 'POST',
        body: voteData,
      }),
      invalidatesTags: ['Vote', 'Token'],
    }),

    // Get rank info
    getRankInfo: builder.query<any, void>({
      query: () => '/api/get-rank-info',
      providesTags: ['User'],
    }),

    // Get user balance
    getUserBalance: builder.query<{ success: boolean; balance: number }, string>({
      query: (publicKey) => `/api/get-balance?publicKey=${publicKey}`,
      providesTags: ['User'],
    }),

    // Get user spent balance
    getUserSpentBalance: builder.query<{ success: boolean; spentBalance: number }, { userAddress: string; type?: TokenType }>({
      query: ({ userAddress, type }) => {
        const params = new URLSearchParams();
        params.append('userAddress', userAddress);
        if (type) params.append('type', type);
        return `/api/get-spent-balance?${params.toString()}`;
      },
      providesTags: ['User'],
    }),
  }),
});

export const {
  useGetCurrentRoundQuery,
  useGetVotingRoundsQuery,
  useGetNominatedTokensQuery,
  useGetTokensQuery,
  useSubmitNominationMutation,
  useVoteForTokenMutation,
  useGetRankInfoQuery,
  useGetUserBalanceQuery,
  useGetUserSpentBalanceQuery,
} = votingApi; 