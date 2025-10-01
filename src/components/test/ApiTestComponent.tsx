'use client';

import React, { useEffect } from 'react';
import { useGetAdminNominationsQuery } from '@/store/api/adminApi';

export default function ApiTestComponent() {
  const testRoundId = '4'; // Test with round 4
  
  const { data, isLoading, error, refetch } = useGetAdminNominationsQuery(testRoundId, {
    skip: false
  });

  console.log('ApiTestComponent - testRoundId:', testRoundId);
  console.log('ApiTestComponent - data:', data);
  console.log('ApiTestComponent - error:', error);
  console.log('ApiTestComponent - isLoading:', isLoading);

  // Manual fetch test
  useEffect(() => {
    const testManualFetch = async () => {
      try {
        console.log('Testing manual fetch...');
        const response = await fetch(`http://localhost:5000/api/admin/nominations/${testRoundId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();
        console.log('Manual fetch result:', result);
      } catch (err) {
        console.error('Manual fetch error:', err);
      }
    };
    
    testManualFetch();
  }, [testRoundId]);

  return (
    <div className="p-4 border border-red-500 bg-red-50">
      <h3 className="text-lg font-bold mb-2">API Test Component</h3>
      <p><strong>Round ID:</strong> {testRoundId}</p>
      <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
      <p><strong>Error:</strong> {error ? JSON.stringify(error) : 'None'}</p>
      <p><strong>Data:</strong> {data ? JSON.stringify(data, null, 2) : 'None'}</p>
        <button
        onClick={() => refetch()} 
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Refetch
          </button>
    </div>
  );
} 