"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getOrCreateUserATA, getOrCreateUserATACustom, TokenAccountUtils } from "@/utils/vestingUtils";
import { toast } from "react-toastify";

export default function UserATATestComponent() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState<string | null>(null);
  const [mintAddress, setMintAddress] = useState("So11111111111111111111111111111111111111112"); // SOL mint as default
  const [result, setResult] = useState<string>("");

  const testStandardATA = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setLoading("Standard ATA");
    setResult("");

    try {
      const tokenAccountAddress = await getOrCreateUserATA(
        connection,
        wallet,
        mintAddress
      );
      
      setResult(`✅ Standard ATA created successfully!\nToken Account: ${tokenAccountAddress}`);
      toast.success("Standard ATA created successfully!");
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const testCustomATA = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setLoading("Custom ATA");
    setResult("");

    try {
      const tokenAccountAddress = await getOrCreateUserATACustom(
        connection,
        wallet,
        mintAddress
      );
      
      setResult(`✅ Custom ATA created successfully!\nToken Account: ${tokenAccountAddress}`);
      toast.success("Custom ATA created successfully!");
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const testUtilityATA = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setLoading("Utility ATA");
    setResult("");

    try {
      const tokenAccountAddress = await TokenAccountUtils.getUserATA(
        connection,
        wallet,
        mintAddress
      );
      
      setResult(`✅ Utility ATA created successfully!\nToken Account: ${tokenAccountAddress}`);
      toast.success("Utility ATA created successfully!");
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="cosmic-card p-6 text-center">
        <p className="text-foreground/60">Please connect your wallet to test user ATA functionality.</p>
      </div>
    );
  }

  return (
    <div className="cosmic-card p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">🧪 User ATA Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Token Mint Address
          </label>
          <input
            type="text"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            placeholder="Enter token mint address"
            className="w-full p-2 border border-card-border rounded-lg bg-background text-foreground"
          />
          <p className="text-xs text-foreground/60 mt-1">
            Default: SOL mint address (So11111111111111111111111111111111111111112)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={testStandardATA}
            disabled={loading !== null || !mintAddress}
            className="btn-primary px-4 py-2"
          >
            {loading === "Standard ATA" ? "Testing..." : "Test Standard ATA"}
          </button>

          <button
            onClick={testCustomATA}
            disabled={loading !== null || !mintAddress}
            className="btn-primary px-4 py-2"
          >
            {loading === "Custom ATA" ? "Testing..." : "Test Custom ATA"}
          </button>

          <button
            onClick={testUtilityATA}
            disabled={loading !== null || !mintAddress}
            className="btn-primary px-4 py-2"
          >
            {loading === "Utility ATA" ? "Testing..." : "Test Utility ATA"}
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-background/50 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Result:</h3>
            <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-mono">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Test Information</h3>
          <div className="text-sm text-blue-300 space-y-2">
            <p><strong>Standard ATA:</strong> Uses @solana/spl-token's getOrCreateAssociatedTokenAccount</p>
            <p><strong>Custom ATA:</strong> Checks for existing accounts first, then creates if needed</p>
            <p><strong>Utility ATA:</strong> Uses the TokenAccountUtils object for cleaner code</p>
            <p><strong>Wallet:</strong> {wallet.publicKey?.toString()}</p>
            <p><strong>Program ID:</strong> TOKEN_2022_PROGRAM_ID</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Common Mint Addresses</h3>
          <div className="text-sm text-green-300 space-y-1">
            <p><strong>SOL:</strong> So11111111111111111111111111111111111111112</p>
            <p><strong>USDC:</strong> EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v</p>
            <p><strong>USDT:</strong> Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
