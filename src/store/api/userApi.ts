import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { UserProfile, UserBalance, ApiResponse } from '@/types';

// User API slice
export const userApi = createApi({
  reducerPath: 'userApi',
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
  tagTypes: ['User', 'Profile', 'UserVotes'],
  endpoints: (builder) => ({
    // Get user profile
    getUserProfile: builder.query<ApiResponse<UserProfile>, string>({
      query: (walletAddress) => `/api/user/profile?walletAddress=${walletAddress}`,
      providesTags: ['Profile'],
    }),

    // Update user profile
    updateUserProfile: builder.mutation<ApiResponse<UserProfile>, Partial<UserProfile>>({
      query: (profile) => ({
        url: '/api/user/profile',
        method: 'PUT',
        body: profile,
      }),
      invalidatesTags: ['Profile'],
    }),

    // Get user tokens (nominations)
    getUserTokens: builder.query<ApiResponse<any[]>, string>({
      query: (userAddress) => `/api/get-tokens?userAddress=${userAddress}`,
      providesTags: ['User'],
    }),

    // Get user votes for a specific round
    getUserVotes: builder.query<ApiResponse<any[]>, { userAddress: string; roundId: string }>({
      query: ({ userAddress, roundId }) => `/api/get-user-votes?userAddress=${userAddress}&roundId=${roundId}`,
      providesTags: ['UserVotes'],
    }),

    // Get user's current vote for a round (one vote per user per round)
    getUserCurrentVote: builder.query<ApiResponse<any>, { userAddress: string; roundId: string }>({
      query: ({ userAddress, roundId }) => `/api/get-user-current-vote?userAddress=${userAddress}&roundId=${roundId}`,
      providesTags: ['UserVotes'],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetUserTokensQuery,
  useGetUserVotesQuery,
  useGetUserCurrentVoteQuery,
} = userApi; 