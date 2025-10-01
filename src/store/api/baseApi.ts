import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { votingApi } from './votingApi';
import { preLaunchApi } from './preLaunchApi';
import { userApi } from './userApi';

export const baseApi = createApi({
  reducerPath: 'api',
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
  tagTypes: ['Round', 'Token', 'Vote', 'Nomination', 'User', 'PreLaunchToken', 'PreLaunchAdmin', 'Profile'],
  endpoints: () => ({}),
});

// Common response types
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

// Export all API slices
export { votingApi, preLaunchApi, userApi }; 