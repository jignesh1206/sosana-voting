import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { votingApi } from './api/votingApi';
import { userApi } from './api/userApi';
import { adminApi } from './api/adminApi';
import { preLaunchApi } from './api/preLaunchApi';
import { resultsApi } from './api/resultsApi';
import uiSlice from './slices/uiSlice';
import userSlice from './slices/userSlice';
import adminSlice from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    // API slices
    [votingApi.reducerPath]: votingApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [preLaunchApi.reducerPath]: preLaunchApi.reducer,
    [resultsApi.reducerPath]: resultsApi.reducer,
    
    // Regular slices
    ui: uiSlice,
    user: userSlice,
    admin: adminSlice,
  },
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(
      votingApi.middleware,
      userApi.middleware,
      adminApi.middleware,
      preLaunchApi.middleware,
      resultsApi.middleware
    ),
});

// DISABLED: setupListeners to prevent automatic refetching behaviors
// This was causing unnecessary API calls every 10 seconds
// setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 