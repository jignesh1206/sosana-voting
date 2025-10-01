'use client';

import React, { useState } from 'react';
import { useDeleteRoundMutation } from '@/store/api/adminApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DeleteRoundButtonProps {
  roundId: string;
  roundName?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  variant?: 'button' | 'icon';
}

export default function DeleteRoundButton({ 
  roundId,
  roundName = 'this round',
  className = '',
  onSuccess,
  onError,
  variant = 'button'
}: DeleteRoundButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteRound, { isLoading }] = useDeleteRoundMutation();

  const handleDelete = async () => {
    try {
      await deleteRound(roundId).unwrap();
      setShowConfirmation(false);
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to delete round';
      onError?.(errorMessage);
    }
  };

  const handleConfirmClick = () => {
    setShowConfirmation(true);
  };

  const handleCancelClick = () => {
    setShowConfirmation(false);
  };

  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleConfirmClick}
          disabled={isLoading}
          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Delete round"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border border-card-border rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-red-500 text-2xl">⚠️</div>
                <h3 className="text-lg font-semibold text-foreground">Delete Round</h3>
              </div>
              
              <p className="text-foreground/80 mb-6">
                Are you sure you want to delete <strong>{roundName}</strong>? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelClick}
                  className="flex-1 px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground hover:bg-secondary/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={handleConfirmClick}
        disabled={isLoading}
        className="btn btn-danger flex items-center space-x-2"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Deleting...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Delete Round</span>
          </>
        )}
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-card-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-red-500 text-2xl">⚠️</div>
              <h3 className="text-lg font-semibold text-foreground">Delete Round</h3>
            </div>
            
            <p className="text-foreground/80 mb-6">
              Are you sure you want to delete <strong>{roundName}</strong>? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCancelClick}
                className="flex-1 px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground hover:bg-secondary/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 