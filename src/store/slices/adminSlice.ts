import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RoundPhase = 'scheduled' | 'nominating' | 'voting' | 'results_pending' | 'results_declared' | 'completed' | 'canceled';

interface RoundPhaseState {
  currentPhase: RoundPhase;
  previousPhase: RoundPhase | null;
  phaseHistory: Array<{
    phase: RoundPhase;
    timestamp: number;
    action: string;
    triggeredBy: string;
  }>;
  phaseTimers: {
    [phase in RoundPhase]?: {
      startTime: number;
      endTime: number;
      duration: number; // in minutes
    };
  };
  actionLoading: string | null;
  isActionInProgress: boolean;
}

const initialState: RoundPhaseState = {
  currentPhase: 'scheduled',
  previousPhase: null,
  phaseHistory: [],
  phaseTimers: {},
  actionLoading: null,
  isActionInProgress: false,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    // Phase management
    setCurrentPhase: (state, action: PayloadAction<RoundPhase>) => {
      state.previousPhase = state.currentPhase;
      state.currentPhase = action.payload;
    },
    
    advanceToNextPhase: (state, action: PayloadAction<{
      newPhase: RoundPhase;
      actionName: string;
      triggeredBy: string;
    }>) => {
      const { newPhase, actionName, triggeredBy } = action.payload;
      
      // Add to phase history
      state.phaseHistory.push({
        phase: newPhase,
        timestamp: Date.now(),
        action: actionName,
        triggeredBy,
      });
      
      // Update phases
      state.previousPhase = state.currentPhase;
      state.currentPhase = newPhase;
    },
    
    setPhaseTimer: (state, action: PayloadAction<{
      phase: RoundPhase;
      startTime: number;
      endTime: number;
      duration: number;
    }>) => {
      const { phase, startTime, endTime, duration } = action.payload;
      state.phaseTimers[phase] = { startTime, endTime, duration };
    },
    
    // Action loading states
    setActionLoading: (state, action: PayloadAction<string | null>) => {
      state.actionLoading = action.payload;
    },
    
    setIsActionInProgress: (state, action: PayloadAction<boolean>) => {
      state.isActionInProgress = action.payload;
    },
    
    // Reset state
    resetPhaseState: (state) => {
      state.currentPhase = 'scheduled';
      state.previousPhase = null;
      state.phaseHistory = [];
      state.phaseTimers = {};
      state.actionLoading = null;
      state.isActionInProgress = false;
    },
  },
});

export const {
  setCurrentPhase,
  advanceToNextPhase,
  setPhaseTimer,
  setActionLoading,
  setIsActionInProgress,
  resetPhaseState,
} = adminSlice.actions;

export default adminSlice.reducer; 