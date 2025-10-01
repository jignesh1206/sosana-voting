import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponse } from '@/types';

// Results API slice
export const resultsApi = createApi({
  reducerPath: 'resultsApi',
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
  tagTypes: ['Results', 'RoundResults'],
  endpoints: (builder) => ({
    // Get all results
    getAllResults: builder.query<ApiResponse<any[]>, void>({
      query: () => '/api/results',
      providesTags: ['Results'],
    }),

    // Get results for specific round
    getResultsByRound: builder.query<ApiResponse<any>, string>({
      query: (roundId) => `/api/results/${roundId}`,
      providesTags: ['RoundResults'],
    }),

    // Declare results for a round (admin only)
    declareResults: builder.mutation<ApiResponse<any>, string>({
      query: (roundId) => ({
        url: `/api/results/declare/${roundId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Results', 'RoundResults'],
    }),
  }),
});

export const {
  useGetAllResultsQuery,
  useGetResultsByRoundQuery,
  useDeclareResultsMutation,
} = resultsApi; 