'use client';

import React, { useState, useEffect } from 'react';
import { useUpdateRoundMutation, useGetAdminRoundsQuery } from '@/store/api/adminApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface UpdateRoundFormProps {
  roundId?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface FormData {
  roundName: string;
  description: string;
  nominationStartDate: string;
  nominationEndDate: string;
  votingStartDate: string;
  votingEndDate: string;
  nominationFee: number;
  votingFee: number;
  rewardPool: number;
  rewardCurrency: 'SOSANA' | 'SOL';
  minTokenBalance: number;
  minVotingBalance: number;
  allowMultipleVotes: boolean;
  requireKYC: boolean;
  maxNominationsPerUser: number;
  votingWeightMultiplier: number;
}

export default function UpdateRoundForm({ 
  roundId,
  className = '',
  onSuccess,
  onError
}: UpdateRoundFormProps) {
  const [formData, setFormData] = useState<FormData>({
    roundName: '',
    description: '',
    nominationStartDate: '',
    nominationEndDate: '',
    votingStartDate: '',
    votingEndDate: '',
    nominationFee: 0.1,
    votingFee: 0.05,
    rewardPool: 1000,
    rewardCurrency: 'SOL',
    minTokenBalance: 100,
    minVotingBalance: 50,
    allowMultipleVotes: true,
    requireKYC: false,
    maxNominationsPerUser: 3,
    votingWeightMultiplier: 1
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [updateRound, { isLoading: isUpdating }] = useUpdateRoundMutation();
  const { data: roundsData, isLoading: isLoadingRounds } = useGetAdminRoundsQuery();

  // Find the round to update
  const rounds = roundsData?.data || [];
  const roundToUpdate = roundId ? rounds.find(round => round.id === roundId) : null;

  // Populate form with existing data when round is found
  useEffect(() => {
    if (roundToUpdate) {
      setFormData({
        roundName: roundToUpdate.roundName || '',
        description: roundToUpdate.description || '',
        nominationStartDate: roundToUpdate.nominationStartDate ? 
          new Date(roundToUpdate.nominationStartDate).toISOString().slice(0, 16) : '',
        nominationEndDate: roundToUpdate.nominationEndDate ? 
          new Date(roundToUpdate.nominationEndDate).toISOString().slice(0, 16) : '',
        votingStartDate: roundToUpdate.votingStartDate ? 
          new Date(roundToUpdate.votingStartDate).toISOString().slice(0, 16) : '',
        votingEndDate: roundToUpdate.votingEndDate ? 
          new Date(roundToUpdate.votingEndDate).toISOString().slice(0, 16) : '',
        nominationFee: roundToUpdate.nominationFee || 0.1,
        votingFee: roundToUpdate.votingFee || 0.05,
        rewardPool: roundToUpdate.rewardPool || 1000,
        rewardCurrency: roundToUpdate.rewardCurrency || 'SOL',
        minTokenBalance: roundToUpdate.minTokenBalance || 100,
        minVotingBalance: roundToUpdate.minVotingBalance || 50,
        allowMultipleVotes: roundToUpdate.settings?.allowMultipleVotes ?? true,
        requireKYC: roundToUpdate.settings?.requireKYC ?? false,
        maxNominationsPerUser: roundToUpdate.settings?.maxNominationsPerUser || 3,
        votingWeightMultiplier: roundToUpdate.settings?.votingWeightMultiplier || 1
      });
    }
  }, [roundToUpdate]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.roundName.trim()) {
      newErrors.roundName = 'Round name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.nominationStartDate) {
      newErrors.nominationStartDate = 'Nomination start date is required';
    }

    if (!formData.nominationEndDate) {
      newErrors.nominationEndDate = 'Nomination end date is required';
    }

    if (!formData.votingStartDate) {
      newErrors.votingStartDate = 'Voting start date is required';
    }

    if (!formData.votingEndDate) {
      newErrors.votingEndDate = 'Voting end date is required';
    }

    // Validate date logic
    const nominationStart = new Date(formData.nominationStartDate);
    const nominationEnd = new Date(formData.nominationEndDate);
    const votingStart = new Date(formData.votingStartDate);
    const votingEnd = new Date(formData.votingEndDate);

    if (nominationEnd <= nominationStart) {
      newErrors.nominationEndDate = 'Nomination end date must be after start date';
    }

    if (votingStart <= nominationEnd) {
      newErrors.votingStartDate = 'Voting start date must be after nomination end date';
    }

    if (votingEnd <= votingStart) {
      newErrors.votingEndDate = 'Voting end date must be after start date';
    }

    if (formData.nominationFee < 0) {
      newErrors.nominationFee = 'Nomination fee cannot be negative';
    }

    if (formData.votingFee < 0) {
      newErrors.votingFee = 'Voting fee cannot be negative';
    }

    if (formData.rewardPool <= 0) {
      newErrors.rewardPool = 'Reward pool must be greater than 0';
    }

    if (formData.minTokenBalance < 0) {
      newErrors.minTokenBalance = 'Minimum token balance cannot be negative';
    }

    if (formData.minVotingBalance < 0) {
      newErrors.minVotingBalance = 'Minimum voting balance cannot be negative';
    }

    if (formData.maxNominationsPerUser <= 0) {
      newErrors.maxNominationsPerUser = 'Max nominations per user must be greater than 0';
    }

    if (formData.votingWeightMultiplier <= 0) {
      newErrors.votingWeightMultiplier = 'Voting weight multiplier must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roundId) {
      onError?.('No round ID provided for update');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const roundData = {
        ...formData,
        settings: {
          allowMultipleVotes: formData.allowMultipleVotes,
          requireKYC: formData.requireKYC,
          maxNominationsPerUser: formData.maxNominationsPerUser,
          votingWeightMultiplier: formData.votingWeightMultiplier
        }
      };

      await updateRound({ id: roundId, data: roundData }).unwrap();
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to update round';
      onError?.(errorMessage);
    }
  };

  if (isLoadingRounds) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading round data..." />
      </div>
    );
  }

  if (!roundId) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Round Selected</h3>
          <p className="text-foreground/60">
            Please select a round to update.
          </p>
        </div>
      </div>
    );
  }

  if (!roundToUpdate) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-foreground mb-2">Round Not Found</h3>
          <p className="text-foreground/60">
            The selected round could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">✏️ Update Voting Round</h2>
        <div className="text-sm text-foreground/60">
          Round ID: {roundId}
        </div>
      </div>

      <p className="text-foreground/80 mb-6">
        Update the settings and configuration for the selected voting round.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Round Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Round Name *
            </label>
            <input
              type="text"
              value={formData.roundName}
              onChange={(e) => handleInputChange('roundName', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.roundName 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50`}
              placeholder="e.g., Q1 2024 Token Voting"
            />
            {errors.roundName && (
              <p className="text-red-400 text-sm mt-1">{errors.roundName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reward Currency *
            </label>
            <select
              value={formData.rewardCurrency}
              onChange={(e) => handleInputChange('rewardCurrency', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="SOL">SOL</option>
              <option value="SOSANA">SOSANA</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.description 
                ? 'border-red-500 bg-red-500/10' 
                : 'border-card-border bg-secondary/20'
            } text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none`}
            placeholder="Describe the voting round and its objectives..."
          />
          {errors.description && (
            <p className="text-red-400 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Nomination Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nomination Start Date *
            </label>
            <input
              type="datetime-local"
              value={formData.nominationStartDate}
              onChange={(e) => handleInputChange('nominationStartDate', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.nominationStartDate 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.nominationStartDate && (
              <p className="text-red-400 text-sm mt-1">{errors.nominationStartDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nomination End Date *
            </label>
            <input
              type="datetime-local"
              value={formData.nominationEndDate}
              onChange={(e) => handleInputChange('nominationEndDate', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.nominationEndDate 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.nominationEndDate && (
              <p className="text-red-400 text-sm mt-1">{errors.nominationEndDate}</p>
            )}
          </div>
        </div>

        {/* Voting Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Voting Start Date *
            </label>
            <input
              type="datetime-local"
              value={formData.votingStartDate}
              onChange={(e) => handleInputChange('votingStartDate', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.votingStartDate 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.votingStartDate && (
              <p className="text-red-400 text-sm mt-1">{errors.votingStartDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Voting End Date *
            </label>
            <input
              type="datetime-local"
              value={formData.votingEndDate}
              onChange={(e) => handleInputChange('votingEndDate', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.votingEndDate 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.votingEndDate && (
              <p className="text-red-400 text-sm mt-1">{errors.votingEndDate}</p>
            )}
          </div>
        </div>

        {/* Fees and Rewards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nomination Fee ({formData.rewardCurrency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.nominationFee}
              onChange={(e) => handleInputChange('nominationFee', parseFloat(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.nominationFee 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.nominationFee && (
              <p className="text-red-400 text-sm mt-1">{errors.nominationFee}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Voting Fee ({formData.rewardCurrency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.votingFee}
              onChange={(e) => handleInputChange('votingFee', parseFloat(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.votingFee 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.votingFee && (
              <p className="text-red-400 text-sm mt-1">{errors.votingFee}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reward Pool ({formData.rewardCurrency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.rewardPool}
              onChange={(e) => handleInputChange('rewardPool', parseFloat(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.rewardPool 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.rewardPool && (
              <p className="text-red-400 text-sm mt-1">{errors.rewardPool}</p>
            )}
          </div>
        </div>

        {/* Balance Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Min Token Balance *
            </label>
            <input
              type="number"
              min="0"
              value={formData.minTokenBalance}
              onChange={(e) => handleInputChange('minTokenBalance', parseInt(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.minTokenBalance 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.minTokenBalance && (
              <p className="text-red-400 text-sm mt-1">{errors.minTokenBalance}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Min Voting Balance *
            </label>
            <input
              type="number"
              min="0"
              value={formData.minVotingBalance}
              onChange={(e) => handleInputChange('minVotingBalance', parseInt(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.minVotingBalance 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.minVotingBalance && (
              <p className="text-red-400 text-sm mt-1">{errors.minVotingBalance}</p>
            )}
          </div>
        </div>

        {/* Voting Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Max Nominations Per User *
            </label>
            <input
              type="number"
              min="1"
              value={formData.maxNominationsPerUser}
              onChange={(e) => handleInputChange('maxNominationsPerUser', parseInt(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.maxNominationsPerUser 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.maxNominationsPerUser && (
              <p className="text-red-400 text-sm mt-1">{errors.maxNominationsPerUser}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Voting Weight Multiplier *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.votingWeightMultiplier}
              onChange={(e) => handleInputChange('votingWeightMultiplier', parseFloat(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.votingWeightMultiplier 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-card-border bg-secondary/20'
              } text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50`}
            />
            {errors.votingWeightMultiplier && (
              <p className="text-red-400 text-sm mt-1">{errors.votingWeightMultiplier}</p>
            )}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="allowMultipleVotes"
              checked={formData.allowMultipleVotes}
              onChange={(e) => handleInputChange('allowMultipleVotes', e.target.checked)}
              className="w-4 h-4 text-accent bg-secondary/20 border-card-border rounded focus:ring-accent/50"
            />
            <label htmlFor="allowMultipleVotes" className="text-sm font-medium text-foreground">
              Allow Multiple Votes
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="requireKYC"
              checked={formData.requireKYC}
              onChange={(e) => handleInputChange('requireKYC', e.target.checked)}
              className="w-4 h-4 text-accent bg-secondary/20 border-card-border rounded focus:ring-accent/50"
            />
            <label htmlFor="requireKYC" className="text-sm font-medium text-foreground">
              Require KYC for Voting
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="btn btn-primary flex items-center space-x-2"
          >
            {isUpdating ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Updating Round...</span>
              </>
            ) : (
              <>
                <span>✏️</span>
                <span>Update Voting Round</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 