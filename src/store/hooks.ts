import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Admin-specific hooks
export const useAdminState = () => {
  return useAppSelector((state) => state.admin);
};

export const useAdminActions = () => {
  const dispatch = useAppDispatch();
  const adminState = useAdminState();
  
  return {
    // State
    currentPhase: adminState.currentPhase,
    previousPhase: adminState.previousPhase,
    phaseHistory: adminState.phaseHistory,
    phaseTimers: adminState.phaseTimers,
    actionLoading: adminState.actionLoading,
    isActionInProgress: adminState.isActionInProgress,
    
    // Phase Actions
    setCurrentPhase: (phase: import('./slices/adminSlice').RoundPhase) => 
      dispatch({ type: 'admin/setCurrentPhase', payload: phase }),
    advanceToNextPhase: (data: {
      newPhase: import('./slices/adminSlice').RoundPhase;
      actionName: string;
      triggeredBy: string;
    }) => dispatch({ type: 'admin/advanceToNextPhase', payload: data }),
    setPhaseTimer: (data: {
      phase: import('./slices/adminSlice').RoundPhase;
      startTime: number;
      endTime: number;
      duration: number;
    }) => dispatch({ type: 'admin/setPhaseTimer', payload: data }),
    
    // Loading Actions
    setActionLoading: (action: string | null) => 
      dispatch({ type: 'admin/setActionLoading', payload: action }),
    setIsActionInProgress: (inProgress: boolean) => 
      dispatch({ type: 'admin/setIsActionInProgress', payload: inProgress }),
    
    // Reset
    resetPhaseState: () => 
      dispatch({ type: 'admin/resetPhaseState' }),
  };
}; 