"use client";

import React from "react";
import WhitelistDataViewer from "@/components/admin/WhitelistDataViewer";
import WhitelistTestComponent from "@/components/test/WhitelistTestComponent";
import { sampleWhitelistData } from "@/utils/whitelistUtils";

export default function WhitelistTestPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Whitelist Data Viewer
        </h1>
        <p className="text-foreground/60">
          View and analyze whitelist data for team vesting airdrops
        </p>
      </div>

      <WhitelistDataViewer whitelistData={sampleWhitelistData} />
      
      {/* Test Component */}
      <div className="mt-8">
        <WhitelistTestComponent />
      </div>
      
      <div className="mt-8 cosmic-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Integration Notes</h2>
        <div className="space-y-3 text-foreground/80">
          <p>
            <strong>Current Whitelist:</strong> 2 users with 15,000 SOSANA each (30,000 total)
          </p>
          <p>
            <strong>User Addresses:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li className="font-mono text-sm">
              7MPW5D3fv8RN9a95CdEHfym3x8MqWG9TfQQfsns2tiFj
            </li>
            <li className="font-mono text-sm">
              7TvGfZfUUvMhZp1SNGvfReHFqmmc7E1wepvB76cZKk8s
            </li>
          </ul>
          <p>
            <strong>Status:</strong> Both users have 0 claimed, 15,000 remaining
          </p>
          <p>
            <strong>Integration:</strong> These users will be able to claim daily drips once vesting starts
          </p>
        </div>
      </div>
    </div>
  );
}
