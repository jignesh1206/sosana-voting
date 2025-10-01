import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  activeTab: 'live' | 'pre-launch';
  isLoading: boolean;
  error: string | null;
  refreshTrigger: number;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
}

const initialState: UIState = {
  activeTab: 'live',
  isLoading: false,
  error: null,
  refreshTrigger: 0,
  sidebarOpen: false,
  theme: 'dark',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'live' | 'pre-launch'>) => {
      state.activeTab = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    triggerRefresh: (state) => {
      state.refreshTrigger += 1;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({ ...action.payload, id });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setActiveTab,
  setLoading,
  setError,
  triggerRefresh,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer; 