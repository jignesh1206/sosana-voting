import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  PreLaunchToken, 
  PreLaunchNominationRequest, 
  ApiResponse 
} from '@/types';

// Pre-Launch API slice
export const preLaunchApi = createApi({
  reducerPath: 'preLaunchApi',
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
  tagTypes: ['PreLaunchToken', 'PreLaunchAdmin'],
  endpoints: (builder) => ({
    // Get pre-launch tokens
    getPreLaunchTokens: builder.query<ApiResponse<PreLaunchToken[]>, void>({
      query: () => '/api/pre-launch/tokens',
      providesTags: ['PreLaunchToken'],
    }),

    // Submit pre-launch nomination
    submitPreLaunchNomination: builder.mutation<ApiResponse<PreLaunchToken>, PreLaunchNominationRequest>({
      query: (nomination) => ({
        url: '/api/pre-launch/nominate',
        method: 'POST',
        body: nomination,
      }),
      invalidatesTags: ['PreLaunchToken'],
    }),

    // Get pre-launch admin data
    getPreLaunchAdminData: builder.query<ApiResponse<PreLaunchToken[]>, void>({
      query: () => '/api/pre-launch/admin/active',
      providesTags: ['PreLaunchAdmin'],
    }),

    // Get pre-launch tokens by round
    getPreLaunchTokensByRound: builder.query<ApiResponse<PreLaunchToken[]>, string>({
      query: (roundId) => `/api/pre-launch/tokens/${roundId}`,
      providesTags: ['PreLaunchToken'],
    }),

    // Get pre-launch admin data for specific round
    getPreLaunchAdminDataByRound: builder.query<ApiResponse<PreLaunchToken[]>, string>({
      query: (roundId) => `/api/pre-launch/admin/round/${roundId}`,
      providesTags: ['PreLaunchAdmin'],
    }),

    // Health check
    getPreLaunchHealth: builder.query<{ success: boolean; status: string }, void>({
      query: () => '/api/pre-launch/health',
    }),
  }),
});

export const {
  useGetPreLaunchTokensQuery,
  useSubmitPreLaunchNominationMutation,
  useGetPreLaunchAdminDataQuery,
  useGetPreLaunchTokensByRoundQuery,
  useGetPreLaunchAdminDataByRoundQuery,
  useGetPreLaunchHealthQuery,
} = preLaunchApi; 