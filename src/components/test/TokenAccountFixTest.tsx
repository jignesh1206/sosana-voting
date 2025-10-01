"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { 
  checkUserTokenAccountExists, 
  getOrCreateUserTokenAccount,
  TokenAccountUtils 
} from "@/utils/vestingUtils";
import { PublicKey } from "@solana/web3.js";
import { toast } from "react-toastify";

export default function TokenAccountFixTest() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState<string | null>(null);
  const [mintAddress, setMintAddress] = useState("So11111111111111111111111111111111111111112");
  const [result, setResult] = useState<string>("");

  const testAccountCheck = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setLoading("Checking Account");
    setResult("");

    try {
      const mintPubkey = new PublicKey(mintAddress);
      const checkResult = await checkUserTokenAccountExists(
        connection,
        wallet.publicKey!,
        mintPubkey
      );

      if (checkResult.exists && checkResult.accountAddress) {
        setResult(`✅ Account exists!\nAddress: ${checkResult.accountAddress.toString()}`);
        toast.success("Account found!");
      } else {
        setResult("❌ No account found for this mint");
        toast.info("No account found");
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const testCreateAccount = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setLoading("Creating Account");
    setResult("");

    try {
      const mintPubkey = new PublicKey(mintAddress);
      const tokenAccount = await getOrCreateUserTokenAccount(
        connection,
        wallet,
        mintPubkey
      );

      setResult(`✅ Account created successfully!\nAddress: ${tokenAccount.toString()}`);
      toast.success("Account created!");
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const testUtilityCheck = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setLoading("Utility Check");
    setResult("");

    try {
      const mintPubkey = new PublicKey(mintAddress);
      const checkResult = await TokenAccountUtils.checkUserTokenAccountExists(
        connection,
        wallet.publicKey!,
        mintPubkey
      );

      if (checkResult.exists && checkResult.accountAddress) {
        setResult(`✅ Utility check - Account exists!\nAddress: ${checkResult.accountAddress.toString()}`);
        toast.success("Utility check - Account found!");
      } else {
        setResult("❌ Utility check - No account found for this mint");
        toast.info("Utility check - No account found");
      }
    } catch (error: any) {
      setResult(`❌ Utility check error: ${error.message}`);
      toast.error(`Utility check error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="cosmic-card p-6 text-center">
        <p className="text-foreground/60">Please connect your wallet to test the token account fix.</p>
      </div>
    );
  }

  return (
    <div className="cosmic-card p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">🔧 Token Account Fix Test</h2>
      
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={testAccountCheck}
            disabled={loading !== null || !mintAddress}
            className="btn-primary px-4 py-2"
          >
            {loading === "Checking Account" ? "Checking..." : "Check Account Exists"}
          </button>

          <button
            onClick={testCreateAccount}
            disabled={loading !== null || !mintAddress}
            className="btn-primary px-4 py-2"
          >
            {loading === "Creating Account" ? "Creating..." : "Create Account"}
          </button>

          <button
            onClick={testUtilityCheck}
            disabled={loading !== null || !mintAddress}
            className="btn-primary px-4 py-2"
          >
            {loading === "Utility Check" ? "Checking..." : "Utility Check"}
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
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Fix Details</h3>
          <div className="text-sm text-blue-300 space-y-2">
            <p><strong>Problem:</strong> TokenAccountNotFoundError when creating user token accounts</p>
            <p><strong>Solution:</strong> Check for existing accounts first before creating new ones</p>
            <p><strong>Fallback:</strong> Multiple methods with error handling</p>
            <p><strong>Wallet:</strong> {wallet.publicKey?.toString()}</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Test Steps</h3>
          <div className="text-sm text-green-300 space-y-1">
            <p>1. Click "Check Account Exists" to see if you have a token account</p>
            <p>2. Click "Create Account" to create a new token account</p>
            <p>3. Click "Utility Check" to test the utility function</p>
            <p>4. Try with different mint addresses to test various scenarios</p>
          </div>
        </div>
      </div>
    </div>
  );
}
