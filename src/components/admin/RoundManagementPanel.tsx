'use client';

import React, { useState } from 'react';
import { 
  useStartRoundMutation,
  useEndNominationMutation,
  useEndVotingMutation,
  useCancelRoundMutation,
  useRestartRoundMutation,
  useExtendRoundTimeMutation,
  useInstantCompleteRoundMutation
} from '@/store/api/adminApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import RewardDistributionPanel from './RewardDistributionPanel';

interface RoundManagementPanelProps {
  roundId: string;
  roundName?: string;
  roundStatus?: string;
  className?: string;
  onSuccess?: (action: string) => void;
  onError?: (error: string) => void;
}

export default function RoundManagementPanel({ 
  roundId,
  roundName = 'Round',
  roundStatus = 'pending',
  className = '',
  onSuccess,
  onError
}: RoundManagementPanelProps) {
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extensionMinutes, setExtensionMinutes] = useState(30);

  // Round management mutations
  const [startRound, { isLoading: isStarting }] = useStartRoundMutation();
  const [endNomination, { isLoading: isEndingNomination }] = useEndNominationMutation();
  const [endVoting, { isLoading: isEndingVoting }] = useEndVotingMutation();
  const [cancelRound, { isLoading: isCanceling }] = useCancelRoundMutation();
  const [restartRound, { isLoading: isRestarting }] = useRestartRoundMutation();
  const [extendRoundTime, { isLoading: isExtending }] = useExtendRoundTimeMutation();
  const [instantComplete, { isLoading: isCompleting }] = useInstantCompleteRoundMutation();

  const handleAction = async (action: string, mutationCall: () => Promise<any>) => {
    try {
      await mutationCall();
      onSuccess?.(action);
    } catch (error: any) {
      const errorMessage = error?.data?.message || `Failed to ${action.toLowerCase()} round`;
      onError?.(errorMessage);
    }
  };

  const handleExtendRound = async () => {
    try {
      await extendRoundTime({ id: roundId, extensionMinutes }).unwrap();
      setShowExtendModal(false);
      onSuccess?.('extend');
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to extend round time';
      onError?.(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'completed':
        return 'text-blue-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'pending':
        return '🟡';
      case 'completed':
        return '🔵';
      case 'cancelled':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">🎮 Round Management</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-foreground/60">Status:</span>
          <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(roundStatus)} border-current/30`}>
            <span>{getStatusIcon(roundStatus)}</span>
            <span>{roundStatus.charAt(0).toUpperCase() + roundStatus.slice(1)}</span>
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-foreground/80">
          Managing: <strong>{roundName}</strong> (ID: {roundId})
        </p>
      </div>

      {/* Round Management Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Start Round */}
        <button
          onClick={() => handleAction('start', () => startRound(roundId).unwrap())}
          disabled={isStarting || roundStatus === 'active'}
          className="btn btn-primary flex items-center space-x-2"
        >
          {isStarting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Starting...</span>
            </>
          ) : (
            <>
              <span>▶️</span>
              <span>Start Round</span>
            </>
          )}
        </button>

        {/* End Nomination */}
        <button
          onClick={() => handleAction('end nomination', () => endNomination(roundId).unwrap())}
          disabled={isEndingNomination || roundStatus !== 'active'}
          className="btn btn-secondary flex items-center space-x-2"
        >
          {isEndingNomination ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Ending...</span>
            </>
          ) : (
            <>
              <span>⏹️</span>
              <span>End Nomination</span>
            </>
          )}
        </button>

        {/* End Voting */}
        <button
          onClick={() => handleAction('end voting', () => endVoting(roundId).unwrap())}
          disabled={isEndingVoting || roundStatus !== 'active'}
          className="btn btn-secondary flex items-center space-x-2"
        >
          {isEndingVoting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Ending...</span>
            </>
          ) : (
            <>
              <span>🏁</span>
              <span>End Voting</span>
            </>
          )}
        </button>

        {/* Cancel Round */}
        <button
          onClick={() => handleAction('cancel', () => cancelRound(roundId).unwrap())}
          disabled={isCanceling || roundStatus === 'cancelled' || roundStatus === 'completed'}
          className="btn btn-danger flex items-center space-x-2"
        >
          {isCanceling ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Canceling...</span>
            </>
          ) : (
            <>
              <span>❌</span>
              <span>Cancel Round</span>
            </>
          )}
        </button>

        {/* Restart Round */}
        <button
          onClick={() => handleAction('restart', () => restartRound(roundId).unwrap())}
          disabled={isRestarting || roundStatus === 'active'}
          className="btn btn-secondary flex items-center space-x-2"
        >
          {isRestarting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Restarting...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Restart Round</span>
            </>
          )}
        </button>

        {/* Extend Round Time */}
        <button
          onClick={() => setShowExtendModal(true)}
          disabled={isExtending || roundStatus !== 'active'}
          className="btn btn-secondary flex items-center space-x-2"
        >
          {isExtending ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Extending...</span>
            </>
          ) : (
            <>
              <span>⏰</span>
              <span>Extend Time</span>
            </>
          )}
        </button>

        {/* Instant Complete */}
        <button
          onClick={() => handleAction('instant complete', () => instantComplete(roundId).unwrap())}
          disabled={isCompleting || roundStatus === 'completed'}
          className="btn btn-warning flex items-center space-x-2"
        >
          {isCompleting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Completing...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Instant Complete</span>
            </>
          )}
        </button>
      </div>

      {/* Reward Distribution for Completed Rounds */}
      {roundStatus === 'completed' && (
        <div className="mt-6">
          <RewardDistributionPanel 
            roundId={roundId} 
            roundNumber={parseInt(roundName.replace('Round ', '')) || 1}
          />
        </div>
      )}

      {/* Status Information */}
      <div className="mt-6 p-4 rounded-lg border border-card-border bg-secondary/20">
        <h3 className="text-lg font-semibold text-foreground mb-3">Round Status Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-foreground/60 mb-2">Available Actions by Status:</p>
            <ul className="space-y-1 text-foreground/80">
              <li><span className="text-yellow-500">🟡 Pending:</span> Start, Cancel</li>
              <li><span className="text-green-500">🟢 Active:</span> End Nomination, End Voting, Extend Time, Instant Complete</li>
              <li><span className="text-blue-500">🔵 Completed:</span> Restart, Distribute Rewards</li>
              <li><span className="text-red-500">🔴 Cancelled:</span> Restart</li>
            </ul>
          </div>
          <div>
            <p className="text-foreground/60 mb-2">Action Descriptions:</p>
            <ul className="space-y-1 text-foreground/80">
              <li><strong>Start:</strong> Begin the round</li>
              <li><strong>End Nomination:</strong> Close nomination phase</li>
              <li><strong>End Voting:</strong> Close voting phase</li>
              <li><strong>Extend Time:</strong> Add more time to current phase</li>
              <li><strong>Instant Complete:</strong> Immediately end round</li>
              <li><strong>Distribute Rewards:</strong> Send rewards to winners (completed rounds only)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Extend Time Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-card-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">⏰ Extend Round Time</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Extension Time (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={extensionMinutes}
                onChange={(e) => setExtensionMinutes(parseInt(e.target.value) || 30)}
                className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <p className="text-xs text-foreground/60 mt-1">
                Enter minutes to extend (1-1440 minutes)
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowExtendModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground hover:bg-secondary/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendRound}
                disabled={isExtending}
                className="flex-1 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {isExtending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Extending...</span>
                  </div>
                ) : (
                  'Extend Time'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 