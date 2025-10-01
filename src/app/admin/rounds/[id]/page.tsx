'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Countdown from 'react-countdown';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  useGetRoundByIdQuery,
  useStartRoundMutation,
  useEndNominationMutation,
  useEndVotingMutation,
  useCancelRoundMutation,
  useRestartRoundMutation,
  useExtendRoundTimeMutation,
  useInstantCompleteRoundMutation,
  useDeleteRoundMutation,
  useTriggerAutoDeclareMutation
} from '@/store/api/adminApi';
import RewardDistributionPanel from '@/components/admin/RewardDistributionPanel';
import { useDeclareResultsMutation } from '@/store/api/resultsApi';
import { useAdminActions } from '@/store/hooks';

export default function RoundDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.id as string;
  
  // Redux state management
  const {
    currentPhase,
    previousPhase,
    phaseHistory,
    actionLoading,
    isActionInProgress,
    setActionLoading,
    setIsActionInProgress,
    advanceToNextPhase,
  } = useAdminActions();

  // RTK Query hooks
  const { 
    data: roundData, 
    isLoading: loading, 
    error: roundError,
    refetch: fetchRoundDetails 
  } = useGetRoundByIdQuery(roundId, {
    // COMPLETELY DISABLE ALL AUTOMATIC BEHAVIOR
    skip: false, // Still make the initial call
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    // Add polling interval set to 0 to completely disable any polling
    pollingInterval: 0,
  });

  // RTK Query mutations
  const [startRound, { isLoading: startLoading }] = useStartRoundMutation();
  const [endNomination, { isLoading: endNominationLoading }] = useEndNominationMutation();
  const [endVoting, { isLoading: endVotingLoading }] = useEndVotingMutation();
  const [cancelRound, { isLoading: cancelLoading }] = useCancelRoundMutation();
  const [restartRound, { isLoading: restartLoading }] = useRestartRoundMutation();
  const [extendRoundTime, { isLoading: extendLoading }] = useExtendRoundTimeMutation();
  const [instantCompleteRound, { isLoading: instantCompleteLoading }] = useInstantCompleteRoundMutation();
  const [deleteRound] = useDeleteRoundMutation();
  const [triggerAutoDeclare, { isLoading: triggerAutoLoading }] = useTriggerAutoDeclareMutation();
  const [declareResults, { isLoading: declareLoading }] = useDeclareResultsMutation();

  const round = roundData?.round || null;

  const handleRefresh = () => {
    fetchRoundDetails();
  };

  // Generic action handler using RTK mutations with phase advancement
  const handleAction = async (action: string, mutationFn: any, newPhase: any, confirmMessage?: string, bodyData?: any) => {
    if (confirmMessage && !confirm(confirmMessage)) return;
    
    setActionLoading(action);
    setIsActionInProgress(true);
    
    try {
      console.log(`🔄 Executing ${action} for round ${roundId}...`);
      
      const result = await mutationFn(bodyData || roundId).unwrap();
      
      console.log(`✅ ${action} successful!`, result);
      toast.success(`${action} successful!`);
      
      // Advance to next phase in Redux
      if (newPhase) {
        advanceToNextPhase({
          newPhase,
          actionName: action,
          triggeredBy: 'admin',
        });
      }
      
      // REMOVED: Automatic refetch - RTK Query will handle cache invalidation
      // No need to manually fetch data as RTK Query automatically updates the cache
    } catch (error: any) {
      console.error(`❌ ${action} failed:`, error);
      const errorMessage = error?.data?.error || error?.message || `Failed to ${action.toLowerCase()}`;
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setActionLoading(null);
      setIsActionInProgress(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this round? This action cannot be undone.')) return;
    
    setActionLoading('delete');
    setIsActionInProgress(true);
    
    try {
      await deleteRound(roundId).unwrap();
      toast.success('Round deleted successfully!');
      
      // Advance to canceled phase in Redux
      advanceToNextPhase({
        newPhase: 'canceled',
        actionName: 'delete',
        triggeredBy: 'admin',
      });
      
      router.push('/admin/rounds');
    } catch (error: any) {
      console.error('Error deleting round:', error);
      const errorMessage = error?.data?.error || error?.message || 'Failed to delete round';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setActionLoading(null);
      setIsActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground">Loading round details...</div>
      </div>
    );
  }

  if (roundError) {
    const errorMessage = 'status' in roundError 
      ? (roundError.data as any)?.error || 'Network error'
      : roundError.message || 'Unknown error';
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Error loading round details: {errorMessage}</div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground">Round not found</div>
      </div>
    );
  }

  // Countdown renderer
  const countdownRenderer = ({ days, hours, minutes, seconds, completed }: { days: number, hours: number, minutes: number, seconds: number, completed: boolean }) => {
    if (completed) {
      return <span className="text-red-400 font-semibold">⏰ Time's Up!</span>;
    } else {
      return (
        <div className="flex items-center space-x-3">
          {days > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-accent">{days}</div>
              <div className="text-xs text-foreground/60">Days</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-lg font-bold text-accent">{hours.toString().padStart(2, '0')}</div>
            <div className="text-xs text-foreground/60">Hours</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-accent">{minutes.toString().padStart(2, '0')}</div>
            <div className="text-xs text-foreground/60">Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-accent">{seconds.toString().padStart(2, '0')}</div>
            <div className="text-xs text-foreground/60">Seconds</div>
          </div>
        </div>
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'nominating': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'voting': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'results_pending': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'results_declared': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'completed': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'canceled': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {/* Header */}
      <div className="cosmic-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/rounds"
              className="text-accent hover:text-accent/80 transition-colors"
            >
              ← Back to Rounds
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Round {round.round} - {round.roundName}
              </h1>
              <p className="text-foreground/60 mt-1">{round.description}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            title="Refresh round details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <div className={`px-4 py-2 rounded-lg border ${getStatusColor(round.status)}`}>
            <span className="font-semibold capitalize">{round.status}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="cosmic-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Round Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Edit Button */}
          {['scheduled', 'canceled'].includes(round.status) && (
            <Link
              href={`/admin/rounds/${roundId}/edit`} 
              className="flex items-center justify-center p-4 rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Round
            </Link>
          )}

          {/* Start Button */}
          {round.status === 'scheduled' && (
            <button
              onClick={() => handleAction('Start', startRound, 'nominating', 'Are you sure you want to start this round?')}
              disabled={startLoading || actionLoading === 'start'}
              className="flex items-center justify-center p-4 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {startLoading || actionLoading === 'start' ? 'Starting...' : 'Start Round'}
            </button>
          )}

          {/* End Nomination Button - NEW ACTION */}
          {round.status === 'nominating' && (
            <button
              onClick={() => handleAction('End Nomination', endNomination, 'voting', 'Are you sure you want to end nomination and start voting?')}
              disabled={endNominationLoading || actionLoading === 'end-nomination'}
              className="flex items-center justify-center p-4 rounded-lg border border-orange-400/30 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {endNominationLoading || actionLoading === 'end-nomination' ? 'Ending...' : 'End Nomination'}
            </button>
          )}

          {/* End Voting Button - UPDATED */}
          {round.status === 'voting' && (
            <button
              onClick={() => handleAction('End Voting', endVoting, 'results_pending', 'Are you sure you want to end voting and move to results pending?')}
              disabled={endVotingLoading || actionLoading === 'end-voting'}
              className="flex items-center justify-center p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {endVotingLoading || actionLoading === 'end-voting' ? 'Ending...' : 'End Voting'}
            </button>
          )}

          {/* Cancel Button */}
          {['nominating', 'voting'].includes(round.status) && (
            <button
              onClick={() => handleAction('Cancel', cancelRound, 'Are you sure you want to cancel this round?')}
              disabled={cancelLoading || actionLoading === 'cancel'}
              className="flex items-center justify-center p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {cancelLoading || actionLoading === 'cancel' ? 'Canceling...' : 'Cancel Round'}
            </button>
          )}

          {/* Restart Button */}
          {round.status === 'canceled' && (
            <button
              onClick={() => handleAction('Restart', restartRound, 'Are you sure you want to restart this round?')}
              disabled={restartLoading || actionLoading === 'restart'}
              className="flex items-center justify-center p-4 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {restartLoading || actionLoading === 'restart' ? 'Restarting...' : 'Restart Round'}
            </button>
          )}

          {/* Delete Button */}
          {['scheduled', 'canceled'].includes(round.status) && (
            <button
              onClick={handleDelete}
              disabled={actionLoading === 'delete'}
              className="flex items-center justify-center p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {actionLoading === 'delete' ? 'Deleting...' : 'Delete Round'}
            </button>
          )}

          {/* Extend Time Button */}
          {['nominating', 'voting'].includes(round.status) && (
            <button
              onClick={() => {
                const extensionMinutes = prompt('Enter extension time in minutes (1-1440):', '30');
                if (extensionMinutes && !isNaN(Number(extensionMinutes))) {
                  const phase = round.status === 'nominating' ? 'nomination' : 'voting';
                  handleAction('Extend', extendRoundTime, null, `Are you sure you want to extend ${phase} by ${extensionMinutes} minutes?`, {
                    id: roundId,
                    extensionMinutes: Number(extensionMinutes),
                    phase: phase
                  });
                }
              }}
              disabled={extendLoading || actionLoading === 'extend'}
              className="flex items-center justify-center p-4 rounded-lg border border-purple-400/30 bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {extendLoading || actionLoading === 'extend' ? 'Extending...' : 'Extend Time'}
            </button>
          )}

          {/* Declare Results Now Button - Available for all rounds without results or for re-declaration */}
          {(['voting', 'results_pending', 'results_declared', 'completed'].includes(round.status)) && (
            <button
              onClick={async () => {
                const message = round.results?.declaredAt 
                  ? 'Are you sure you want to re-declare results? This will update the results with the latest data including pre-launch tokens.'
                  : (round.resultDeclarationType === 'automatic' 
                    ? 'Are you sure you want to declare results now? This will override the automatic declaration timer.'
                    : 'Are you sure you want to declare results for this round?');
                
                if (!confirm(message)) return;
                
                setActionLoading('declare');
                try {
                  await declareResults(roundId).unwrap();
                  toast.success(round.results?.declaredAt ? 'Results re-declared successfully!' : 'Results declared successfully!');
                  
                  // Only advance to results_declared phase if the round is not already completed
                  if (round.status !== 'completed') {
                    advanceToNextPhase({
                      newPhase: 'results_declared',
                      actionName: round.results?.declaredAt ? 'Re-declare Results' : 'Declare Results',
                      triggeredBy: 'admin',
                    });
                  }
                  
                  fetchRoundDetails();
                } catch (error: any) {
                  console.error('Error declaring results:', error);
                  toast.error(`Error: ${error?.data?.error || error?.message || 'Failed to declare results'}`);
                } finally {
                  setActionLoading(null);
                }
              }}
              disabled={declareLoading || actionLoading === 'declare'}
              className="flex items-center justify-center p-4 rounded-lg border border-purple-400/30 bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {declareLoading || actionLoading === 'declare' 
                ? 'Declaring...' 
                : (round.results?.declaredAt ? 'Re-declare Results' : 'Declare Results Now')
              }
            </button>
          )}

          {/* Instant Complete Button - Available for results_declared rounds */}
          {round.status === 'results_declared' && (
            <button
              onClick={() => handleAction('Instant Complete', instantCompleteRound, 'completed', 'Are you sure you want to instantly complete this round? This will skip the completion timer.')}
              disabled={instantCompleteLoading || actionLoading === 'instant-complete'}
              className="flex items-center justify-center p-4 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {instantCompleteLoading || actionLoading === 'instant-complete' ? 'Completing...' : 'Instant Complete'}
            </button>
          )}

          {/* Completion Timer - Show for results_declared rounds */}
          {round.status === 'results_declared' && round.results && round.results.declaredAt && (
            <div className="flex items-center justify-center p-4 rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-400">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-center">
                <p className="font-semibold">⏰ Round Completion Timer</p>
                <p className="text-sm mb-2">
                  Round will be completed in:
                </p>
                <Countdown
                  date={new Date(new Date(round.results.declaredAt).getTime() + ((round.completionDelay || 2) * 60 * 1000))}
                  onComplete={() => {
                    fetchRoundDetails();
                  }}
                  renderer={({ days, hours, minutes, seconds, completed }) => {
                    if (completed) {
                      return <span className="text-green-400 font-semibold">Completing now...</span>;
                    }
                    return (
                      <div className="flex items-center justify-center space-x-2">
                        {days > 0 && (
                          <div className="text-center">
                            <div className="text-lg font-bold">{days}</div>
                            <div className="text-xs">Days</div>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-lg font-bold">{hours.toString().padStart(2, '0')}</div>
                          <div className="text-xs">Hours</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{minutes.toString().padStart(2, '0')}</div>
                          <div className="text-xs">Minutes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{seconds.toString().padStart(2, '0')}</div>
                          <div className="text-xs">Seconds</div>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </div>
          )}


          {/* View Results Button - Available when results exist but status might not be completed */}
          {round.results && round.results.declaredAt && (
            <button
              onClick={() => {
                window.open(`/admin/results`, '_blank');
              }}
              className="flex items-center justify-center p-4 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Results
            </button>
          )}

          {/* Results Pending Status - Show when in results pending */}
          {round.status === 'results_pending' && !round.results && (
            <div className="flex items-center justify-center p-4 rounded-lg border border-purple-400/30 bg-purple-400/10 text-purple-400">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="text-center">
                <p className="font-semibold">🏆 Results Phase</p>
                <p className="text-sm mb-2">
                  Voting has ended. Results are being prepared...
                </p>
              </div>
            </div>
          )}

          {/* Automatic Declaration Status - Show for automatic rounds without results */}
          {['voting', 'results_pending'].includes(round.status) && !round.results?.declaredAt && round.resultDeclarationType === 'automatic' && (
            <>
              <div className="flex items-center justify-center p-4 rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-400">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-center">
                  <p className="font-semibold">Automatic Declaration</p>
                  <p className="text-sm mb-2">
                    Results will be declared automatically in {round.automaticDeclarationDelay} minutes after voting ends
                  </p>
                  {round.status === 'results_pending' && (
                    <div className="mt-2">
                      <p className="text-xs text-blue-400/80 mb-1">Declaration in:</p>
                      <Countdown
                        date={new Date(new Date(round.votingEndDate).getTime() + (round.automaticDeclarationDelay * 60 * 1000))}
                        onComplete={() => {
                          fetchRoundDetails();
                        }}
                        renderer={({ days, hours, minutes, seconds, completed }) => {
                          if (completed) {
                            return <span className="text-green-400 font-semibold">Declaring now...</span>;
                          }
                          return (
                            <div className="flex items-center justify-center space-x-2">
                              {days > 0 && (
                                <div className="text-center">
                                  <div className="text-lg font-bold">{days}</div>
                                  <div className="text-xs">Days</div>
                                </div>
                              )}
                              <div className="text-center">
                                <div className="text-lg font-bold">{hours.toString().padStart(2, '0')}</div>
                                <div className="text-xs">Hours</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold">{minutes.toString().padStart(2, '0')}</div>
                                <div className="text-xs">Minutes</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold">{seconds.toString().padStart(2, '0')}</div>
                                <div className="text-xs">Seconds</div>
                              </div>
                            </div>
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              
            </>
          )}
        </div>
      </div>

      {/* Results Display - Show when results are declared */}
      {round.results && (
        <div className="cosmic-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">🏆 Round Results</h2>
          <div className="space-y-4">
            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                <h3 className="text-sm font-medium text-foreground/60 mb-1">Total Tokens</h3>
                <p className="text-2xl font-bold text-accent">{round.results.totalTokens}</p>
              </div>
              <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                <h3 className="text-sm font-medium text-foreground/60 mb-1">Total Votes</h3>
                <p className="text-2xl font-bold text-accent">{round.results.totalVotes}</p>
              </div>
              <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                <h3 className="text-sm font-medium text-foreground/60 mb-1">Winners</h3>
                <p className="text-2xl font-bold text-accent">{round.results.winners.length}</p>
              </div>
            </div>

            {/* Winners Section */}
            {round.results.winners && round.results.winners.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">🥇 Winners</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {round.results.winners.map((winner, index) => (
                    <div key={winner.tokenId} className="p-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">🥇</span>
                          <div>
                            <h4 className="text-lg font-bold text-yellow-400">{winner.symbol}</h4>
                            <p className="text-sm text-foreground/60">{winner.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-yellow-400">{winner.voteCount}</p>
                          <p className="text-sm text-foreground/60">votes</p>
                        </div>
                      </div>
                      <p className="text-xs text-foreground/60 break-all">
                        {winner.tokenAddress}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Results Section */}
            {round.results.allResults && round.results.allResults.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">📊 All Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-card-border">
                        <th className="text-left p-3 text-sm font-medium text-foreground/60">Rank</th>
                        <th className="text-left p-3 text-sm font-medium text-foreground/60">Token</th>
                        <th className="text-left p-3 text-sm font-medium text-foreground/60">Nominator</th>
                        <th className="text-right p-3 text-sm font-medium text-foreground/60">Votes</th>
                        <th className="text-right p-3 text-sm font-medium text-foreground/60">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {round.results.allResults.map((result, index) => (
                        <tr key={result.tokenId} className="border-b border-card-border/50 hover:bg-card-highlight/30">
                          <td className="p-3 text-sm font-medium text-foreground">
                            #{index + 1}
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-foreground">{result.symbol}</p>
                              <p className="text-sm text-foreground/60">{result.name}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="text-sm text-foreground/80 font-mono">
                              {result.nominator ? `${result.nominator.slice(0, 8)}...${result.nominator.slice(-8)}` : 'N/A'}
                            </p>
                          </td>
                          <td className="p-3 text-right">
                            <p className="font-medium text-foreground">{result.voteCount}</p>
                          </td>
                          <td className="p-3 text-right">
                            {round.results.winners.some(w => w.tokenId === result.tokenId) ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-400">
                                🏆 Winner
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-foreground/10 text-foreground/60">
                                Runner-up
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Declaration Info */}
            <div className="pt-4 border-t border-card-border">
              <p className="text-sm text-foreground/60">
                Results declared on {new Date(round.results.declaredAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reward Distribution Panel - Show for completed rounds (both live and pre-launch) */}
      {(() => {
        console.log('🔍 Debug - Round status:', round.status);
        console.log('🔍 Debug - Round results:', round.results);
        console.log('🔍 Debug - Round winners:', round.results?.winners);
        console.log('🔍 Debug - Round type:', round.roundType);
        console.log('🔍 Debug - Should show reward panel:', round.status === 'completed' && round.results && round.results.winners && round.results.winners.length > 0);
        
        return round.status === 'completed' && round.results && round.results.winners && round.results.winners.length > 0;
      })() && (
        <div className="cosmic-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            💰 Reward Distribution 
            {round.roundType === 'pre-launch' && (
              <span className="ml-2 text-sm font-normal text-blue-400">(Pre-Launch Round)</span>
            )}
          </h2>
          <RewardDistributionPanel
            roundId={roundId}
            roundName={round.roundName || `Round ${round.round}`}
            roundStatus={round.status}
            onSuccess={(action) => {
              console.log(`Reward distribution ${action} successful`);
              toast.success(`Reward distribution ${action} successful!`);
              fetchRoundDetails();
            }}
            onError={(error) => {
              console.error('Reward distribution error:', error);
              toast.error(`Reward distribution error: ${error}`);
            }}
          />
        </div>
      )}

      {/* Round Information */}
      <div className="cosmic-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Round Information</h2>
          {/* View Results Button - Show when results are already declared */}
          {round.results && round.results.declaredAt && (
            <Link
              href={`/admin/results`}
              className="flex items-center px-4 py-2 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Results
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-foreground/60">Nomination Fee:</span>
              <span className="text-foreground font-semibold">${round.nominationFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Voting Fee:</span>
              <span className="text-foreground font-semibold">${round.votingFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Nominations:</span>
              <span className="text-foreground font-semibold">{round.statistics?.nominationsCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Result Declaration:</span>
              <span className={`font-semibold ${round.resultDeclarationType === 'automatic' ? 'text-blue-400' : 'text-purple-400'}`}>
                {round.resultDeclarationType === 'automatic' ? 'Automatic' : 'Manual'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-foreground/60">Votes:</span>
              <span className="text-foreground font-semibold">{round.statistics?.votesCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Participants:</span>
              <span className="text-foreground font-semibold">{round.statistics?.participantsCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Total Value:</span>
              <span className="text-foreground font-semibold">
                ${((round.statistics?.totalNominationValue || 0) + (round.statistics?.totalVoteValue || 0)).toFixed(2)}
              </span>
            </div>
            {round.resultDeclarationType === 'automatic' && (
              <div className="flex justify-between">
                <span className="text-foreground/60">Declaration Delay:</span>
                <span className="text-foreground font-semibold">{round.automaticDeclarationDelay} minutes</span>
              </div>
            )}
          </div>
        </div>
      </div>
        
      {/* Timeline with Countdowns */}
      <div className="cosmic-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Timeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-md font-semibold text-foreground">Nomination Period</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground/80 mb-1">Start:</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(round.nominationStartDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <p className="text-xs text-foreground/60 ml-4">
                  {new Date(round.nominationStartDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/80 mb-1">End:</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(round.nominationEndDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <p className="text-xs text-foreground/60 ml-4">
                  {new Date(round.nominationEndDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
            {round.status === 'nominating' && (
              <div className="mt-3 p-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10">
                <p className="text-sm text-yellow-400 mb-1">Time Remaining:</p>
                <Countdown
                  date={new Date(round.nominationEndDate)}
                  onComplete={() => {
                    fetchRoundDetails();
                  }}
                  renderer={countdownRenderer}
                />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="text-md font-semibold text-foreground">Voting Period</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground/80 mb-1">Start:</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(round.votingStartDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <p className="text-xs text-foreground/60 ml-4">
                  {new Date(round.votingStartDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/80 mb-1">End:</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(round.votingEndDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <p className="text-xs text-foreground/60 ml-4">
                  {new Date(round.votingEndDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
            {round.status === 'voting' && (
              <div className="mt-3 p-3 rounded-lg border border-green-400/30 bg-green-400/10">
                <p className="text-sm text-green-400 mb-1">Time Remaining:</p>
                <Countdown
                  date={new Date(round.votingEndDate)}
                  onComplete={() => {
                    fetchRoundDetails();
                  }}
                  renderer={countdownRenderer}
                />
              </div>
            )}
            {round.status === 'results_pending' && (
              <div className="mt-3 p-3 rounded-lg border border-purple-400/30 bg-purple-400/10">
                <p className="text-sm text-purple-400 mb-1">🏆 Voting Ended</p>
                <p className="text-xs text-purple-400/80">Results pending - waiting for declaration</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="cosmic-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/nominations"
            className="flex items-center justify-center p-3 rounded-lg border border-card-border bg-secondary/60 text-foreground hover:bg-card-highlight transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View All Nominations
          </Link>
          <Link
            href="/admin/votes"
            className="flex items-center justify-center p-3 rounded-lg border border-card-border bg-secondary/60 text-foreground hover:bg-card-highlight transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View All Votes
          </Link>
          <Link
            href="/admin/results"
            className="flex items-center justify-center p-3 rounded-lg border border-card-border bg-secondary/60 text-foreground hover:bg-card-highlight transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Results
          </Link>
        </div>
      </div>

      {/* Phase Management & History */}
      <div className="cosmic-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">🔄 Phase Management & History</h2>
        
        {/* Current Phase Display */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-foreground mb-3">Current Phase Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-blue-400/30 bg-blue-400/10">
              <div className="text-sm text-blue-400/80 mb-1">Current Phase</div>
              <div className="text-lg font-bold text-blue-400 capitalize">{currentPhase}</div>
            </div>
            {previousPhase && (
              <div className="p-4 rounded-lg border border-gray-400/30 bg-gray-400/10">
                <div className="text-sm text-gray-400/80 mb-1">Previous Phase</div>
                <div className="text-lg font-bold text-gray-400 capitalize">{previousPhase}</div>
              </div>
            )}
          </div>
        </div>

        {/* Phase History */}
        {phaseHistory.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold text-foreground mb-3">Phase Transition History</h3>
            <div className="space-y-2">
              {phaseHistory.slice(-10).reverse().map((phase, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-green-400/30 bg-green-400/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 font-medium">
                        🔄 {phase.action} → {phase.phase}
                      </span>
                      <span className="text-xs text-green-400/60">by {phase.triggeredBy}</span>
                    </div>
                    <span className="text-xs text-green-400/60">
                      {new Date(phase.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redux State Debug Info */}
        <div className="mt-6 p-4 rounded-lg border border-gray-400/30 bg-gray-400/10">
          <h3 className="text-md font-semibold text-foreground mb-2">🔧 Redux State Debug</h3>
          <div className="text-xs space-y-1">
            <div>Current Phase: <span className="font-mono capitalize">{currentPhase}</span></div>
            <div>Previous Phase: <span className="font-mono capitalize">{previousPhase || 'null'}</span></div>
            <div>Action Loading: <span className="font-mono">{actionLoading || 'null'}</span></div>
            <div>Action In Progress: <span className="font-mono">{isActionInProgress ? 'true' : 'false'}</span></div>
            <div>Round ID (from URL): <span className="font-mono">{roundId}</span></div>
            <div>Phase History Count: <span className="font-mono">{phaseHistory.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}