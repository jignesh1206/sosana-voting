"use client";

import React from "react";
import WhitelistTestComponent from "@/components/test/WhitelistTestComponent";

export default function TestWhitelistPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Whitelist Data Test
          </h1>
          <p className="text-foreground/60">
            Testing whitelist data integration with vesting calculations
          </p>
        </div>
        
        <WhitelistTestComponent />
        
        <div className="mt-8 cosmic-card p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Integration Notes</h2>
          <div className="space-y-3 text-foreground/80">
            <p>
              <strong>User Address:</strong> 7MPW5D3fv8RN9a95CdEHfym3x8MqWG9TfQQfsns2tiFj
            </p>
            <p>
              <strong>Total Allocation:</strong> 15,000 SOSANA
            </p>
            <p>
              <strong>Status:</strong> Ready to claim (0 claimed, 15,000 remaining)
            </p>
            <p>
              <strong>Daily Claims:</strong> Varies by month (see calculations above)
            </p>
            <p>
              <strong>Integration:</strong> This data matches your whitelist and will work with the vesting system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

