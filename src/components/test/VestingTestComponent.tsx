'use client';

import React from 'react';
import VestingTokenManagement from '@/components/admin/VestingTokenManagement';

const VestingTestComponent: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Vesting Token Management Test</h1>
      <VestingTokenManagement />
    </div>
  );
};

export default VestingTestComponent;
