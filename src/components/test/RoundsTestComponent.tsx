'use client';

import React from 'react';
import { useGetAdminRoundsQuery } from '@/store/api/adminApi';

export default function RoundsTestComponent() {
  const { data, isLoading, error, refetch } = useGetAdminRoundsQuery();

  console.log('RoundsTestComponent - data:', data);
  console.log('RoundsTestComponent - error:', error);
  console.log('RoundsTestComponent - isLoading:', isLoading);

  // Filter for live rounds with nominating status
  const liveNominatingRounds = data?.data?.filter((round: any) => 
    round.roundType === 'live' && round.status === 'nominating'
  ) || [];

  console.log('RoundsTestComponent - liveNominatingRounds:', liveNominatingRounds);

  return (
    <div className="p-4 border border-blue-500 bg-blue-50">
      <h3 className="text-lg font-bold mb-2">Rounds Test Component</h3>
      <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
      <p><strong>Error:</strong> {error ? JSON.stringify(error) : 'None'}</p>
      <p><strong>Total Rounds:</strong> {data?.data?.length || 0}</p>
      <p><strong>Live Nominating Rounds:</strong> {liveNominatingRounds.length}</p>
      <p><strong>Live Nominating Rounds Data:</strong> {JSON.stringify(liveNominatingRounds, null, 2)}</p>
      <button 
        onClick={() => refetch()} 
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Refetch Rounds
      </button>
    </div>
  );
} 