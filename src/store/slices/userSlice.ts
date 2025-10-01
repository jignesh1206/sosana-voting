import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  address: string | null;
  isConnected: boolean;
  balance: number;
  spentBalance: number;
  profile: {
    username?: string;
    email?: string;
    avatar?: string;
    bio?: string;
    kycStatus: 'pending' | 'verified' | 'rejected';
  } | null;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    theme: 'light' | 'dark';
  };
  lastActivity: string | null;
}

const initialState: UserState = {
  address: null,
  isConnected: false,
  balance: 0,
  spentBalance: 0,
  profile: null,
  preferences: {
    notifications: true,
    emailUpdates: true,
    theme: 'dark',
  },
  lastActivity: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setWalletAddress: (state, action: PayloadAction<string | null>) => {
      state.address = action.payload;
      state.isConnected = !!action.payload;
      if (action.payload) {
        state.lastActivity = new Date().toISOString();
      }
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (!action.payload) {
        state.address = null;
        state.balance = 0;
        state.spentBalance = 0;
        state.profile = null;
      }
    },
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    setSpentBalance: (state, action: PayloadAction<number>) => {
      state.spentBalance = action.payload;
    },
    setProfile: (state, action: PayloadAction<UserState['profile']>) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserState['profile']>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setPreferences: (state, action: PayloadAction<Partial<UserState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    updateLastActivity: (state) => {
      state.lastActivity = new Date().toISOString();
    },
    clearUserData: (state) => {
      state.address = null;
      state.isConnected = false;
      state.balance = 0;
      state.spentBalance = 0;
      state.profile = null;
      state.lastActivity = null;
    },
  },
});

export const {
  setWalletAddress,
  setConnectionStatus,
  setBalance,
  setSpentBalance,
  setProfile,
  updateProfile,
  setPreferences,
  updateLastActivity,
  clearUserData,
} = userSlice.actions;

export default userSlice.reducer; 