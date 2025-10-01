'use client';

import { useState, useEffect } from 'react';
import { 
  useCalculateRewardDistributionQuery, 
  useDistributeRewardsMutation 
} from '@/store/api/adminApi';
import { RewardDistribution } from '@/store/api/adminApi';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorBoundary from '../ui/ErrorBoundary';

interface RewardDistributionPanelProps {
  roundId: string;
  roundName?: string;
  roundStatus?: string;
  className?: string;
  onSuccess?: (action: string) => void;
  onError?: (error: string) => void;
}

export default function RewardDistributionPanel({ 
  roundId, 
  roundName = 'Round',
  roundStatus = 'completed',
  className = '',
  onSuccess,
  onError
}: RewardDistributionPanelProps) {
  const [isClient, setIsClient] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);
  const [rewardsAlreadyDistributed, setRewardsAlreadyDistributed] = useState(false);
  
  const { 
    data: distributionData, 
    isLoading: isLoadingDistribution, 
    error: distributionError, 
    refetch: refetchDistribution 
  } = useCalculateRewardDistributionQuery(roundId, {
    skip: !showDistribution
  });

  const [distributeRewards, { isLoading: isDistributing }] = useDistributeRewardsMutation();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if rewards are already distributed when component loads
  useEffect(() => {
    if (isClient) {
      // Automatically show distribution for completed rounds
      setShowDistribution(true);
    }
  }, [isClient]);

  // Check if rewards are already distributed based on the distribution data
  useEffect(() => {
    // Only set as already distributed if we have distribution data AND it's from a completed distribution
    // The calculateRewardDistribution endpoint always returns data, so we need to check if it's actually distributed
    if (distributionData?.data && distributionData?.distributedAt) {
      setRewardsAlreadyDistributed(true);
    } else if (distributionData?.data) {
      // If we have distribution data but no distributedAt, it means it's just calculated, not distributed
      setRewardsAlreadyDistributed(false);
    }
  }, [distributionData]);

  if (!isClient) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading reward distribution..." />
      </div>
    );
  }

  const handleCalculateDistribution = () => {
    setShowDistribution(true);
  };

  const handleDistributeRewards = async () => {
    try {
      const result = await distributeRewards(roundId).unwrap();
      
      // Check if rewards are already distributed
      if (result.alreadyDistributed) {
        setRewardsAlreadyDistributed(true);
        // Update the distribution data with the returned data
        if (result.distribution) {
          // Force refetch to show the distribution data
          refetchDistribution();
        }
        onSuccess?.('already-distributed');
        return;
      }
      
      // If distribution was successful, refetch to show the new data
      if (result.success) {
        setRewardsAlreadyDistributed(true);
        refetchDistribution();
        onSuccess?.('distribute');
      }
    } catch (error: any) {
      console.error('Failed to distribute rewards:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to distribute rewards';
      onError?.(errorMessage);
    }
  };

  const formatReward = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  // Fix: Properly extract distribution data from API response
  const distribution: RewardDistribution | undefined = distributionData?.data;
  
  // Add additional debugging
  console.log('RewardDistributionPanel - distributionData:', distributionData);
  console.log('RewardDistributionPanel - distribution:', distribution);
  console.log('RewardDistributionPanel - showDistribution:', showDistribution);
  console.log('RewardDistributionPanel - rewardsAlreadyDistributed:', rewardsAlreadyDistributed);
  console.log('RewardDistributionPanel - isLoadingDistribution:', isLoadingDistribution);
  console.log('RewardDistributionPanel - distributionError:', distributionError);
  console.log('RewardDistributionPanel - roundId:', roundId);
  console.log('RewardDistributionPanel - roundName:', roundName);
  console.log('RewardDistributionPanel - roundStatus:', roundStatus);

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            🎁 Reward Distribution
          </h2>
          <p className="text-foreground/60">
            {roundName} - {roundStatus}
          </p>
        </div>
        
        {!rewardsAlreadyDistributed && (
          <button
            onClick={handleCalculateDistribution}
            disabled={showDistribution}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {showDistribution ? '📊 Calculating...' : '📊 Calculate Distribution'}
          </button>
        )}
      </div>

        {isLoadingDistribution && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" text="Calculating reward distribution..." />
          </div>
        )}

        {distributionError && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Distribution</h3>
            <p className="text-foreground/60 mb-4">
              {(distributionError as any)?.data?.message || (distributionError as any)?.message || 'Failed to load distribution data'}
            </p>
            <button
              onClick={() => refetchDistribution()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              🔄 Retry
            </button>
          </div>
        )}

        {distribution && (
          <div className="space-y-6">
            {/* Round Type Info */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <h3 className="font-semibold text-amber-400 mb-2">
                {distribution.roundType === 'pre-launch' ? '🚀 Pre-Launch Round' : '🪙 Live Token Round'}
              </h3>
              <p className="text-sm text-foreground/60">
                Round {distribution.roundNumber} • {distribution.roundType === 'pre-launch' ? 'Pre-Launch Token Voting' : 'Live Token Voting'}
              </p>
            </div>

            {/* Winning Token */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">🏆 Winning Token</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{distribution.winningToken.symbol}</p>
                  <p className="text-sm text-foreground/60">{distribution.winningToken.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Token ID</p>
                  <p className="font-mono text-xs">{distribution.winningToken.id}</p>
                </div>
              </div>
            </div>

            {/* Nominator Reward */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2">👑 Nominator Reward</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-mono text-sm">{distribution.nominator.wallet}</p>
                  <p className="text-xs text-foreground/60">Nominator</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{formatReward(distribution.nominator.reward)} tokens</p>
                  <p className="text-xs text-foreground/60">Reward</p>
                </div>
              </div>
            </div>

            {/* Voter Rewards */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <h3 className="font-semibold text-purple-400 mb-2">🗳️ Voter Rewards</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-foreground/60">
                  <span>Total Voters: {distribution.voters.length}</span>
                  <span>Total Reward Pool: {formatReward(distribution.totalVoterReward)} tokens</span>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {distribution.voters.map((voter, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-foreground/5 rounded">
                    <div className="flex-1">
                      <p className="font-mono text-sm">{voter.wallet}</p>
                      <p className="text-xs text-foreground/60">
                        Voting Power: {formatReward(voter.votingPower)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatReward(voter.reward)} tokens</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-foreground/5 border rounded-lg">
              <h3 className="font-semibold text-foreground mb-3">📊 Distribution Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-foreground/60">Nominator Reward:</span>
                  <p className="font-semibold">{formatReward(distribution.totalNominatorReward)} tokens</p>
                </div>
                <div>
                  <span className="text-foreground/60">Voter Rewards:</span>
                  <p className="font-semibold">{formatReward(distribution.totalVoterReward)} tokens</p>
                </div>
                <div>
                  <span className="text-foreground/60">Total Distribution:</span>
                  <p className="font-bold text-lg">{formatReward(distribution.totalReward)} tokens</p>
                </div>
              </div>
            </div>

            {/* Distribute Button or Already Distributed Message */}
            <div className="flex justify-center">
              {rewardsAlreadyDistributed ? (
                <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Rewards Already Distributed</h3>
                  <p className="text-foreground/60">
                    Rewards for this round have already been distributed successfully.
                  </p>
                  <p className="text-sm text-foreground/40 mt-2">
                    Distribution completed on {distributionData?.distributedAt ? new Date(distributionData.distributedAt).toLocaleString() : (distribution?.createdAt ? new Date(distribution.createdAt).toLocaleString() : 'Unknown date')}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleDistributeRewards}
                  disabled={isDistributing}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 font-semibold text-lg"
                >
                  {isDistributing ? '🔄 Distributing Rewards...' : '🎁 Distribute Rewards'}
                </button>
              )}
            </div>
          </div>
        )}

        {!distribution && !isLoadingDistribution && !distributionError && showDistribution && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-foreground mb-2">Calculate Distribution</h3>
            <p className="text-foreground/60 mb-4">
              Click the button above to calculate reward distribution for this round.
            </p>
          </div>
        )}

        {!showDistribution && !rewardsAlreadyDistributed && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-xl font-bold text-foreground mb-2">Ready to Calculate Distribution</h3>
            <p className="text-foreground/60 mb-4">
              Click the "Calculate Distribution" button to see the reward breakdown for this round.
            </p>
          </div>
        )}
    </div>
  );
} 