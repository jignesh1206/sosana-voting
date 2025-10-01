"use client";

import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN, web3, Idl } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../contracts/idl.json";

export default function IdlIntegrationExamples() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInitModal, setShowInitModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize provider and program
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
  const program = new Program(idl as Idl, programId, provider);

  // Check if program is initialized on component mount
  useEffect(() => {
    if (wallet.connected) {
      checkInitialization();
    }
  }, [wallet.connected]);

  const checkInitialization = async () => {
    try {
      setIsInitialized(true);
    } catch (err) {
      setIsInitialized(false);
      setShowInitModal(true);
    }
  };

  // Helper function to handle async operations
  const handleAsyncOperation = async (
    operation: () => Promise<any>,
    operationName: string
  ) => {
    try {
      setLoading(operationName);
      setError(null);
      setSuccess(null);
      
      await operation();
      
      setSuccess(`${operationName} completed successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`${operationName} failed: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(null);
    }
  };

  // ✅ Initialize Config (Admin Only)
  const handleInitialize = async () => {
    const configKeypair = web3.Keypair.generate();
    await handleAsyncOperation(
      async () => {
        await program.methods
          .initialize()
          .accounts({
            config: configKeypair.publicKey,
            signer: wallet.publicKey!,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([configKeypair])
          .rpc();
        
        setIsInitialized(true);
        setShowInitModal(false);
      },
      "Initialize Config"
    );
  };

  // ✅ Start Round
  const handleStartRound = async () => {
    const newRound = web3.Keypair.generate();
    const now = Math.floor(Date.now() / 1000);
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .startRound(
            new BN(now),                // roundStartTime
            new BN(now + 60),           // votingStartTime
            new BN(now + 3600),         // roundEndTime
            false                       // preLaunch
          )
          .accounts({
            rounds: newRound.publicKey,
            config: new PublicKey(prompt("Enter config account address:") || ""),
            signer: wallet.publicKey!,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([newRound])
          .rpc();
      },
      "Start Round"
    );
  };

  // ✅ Create Nomination
  const handleCreateNomination = async () => {
    const tokenMint = prompt("Enter token mint address:");
    const roundPubkey = prompt("Enter round public key:");
    const snapshotAmount = prompt("Enter snapshot amount (default: 1000):") || "1000";
    
    if (!tokenMint || !roundPubkey) return;
    
    const nomination = web3.Keypair.generate();
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .createNominate(new BN(snapshotAmount))
          .accounts({
            nomination: nomination.publicKey,
            rounds: new PublicKey(roundPubkey),
            signer: wallet.publicKey!,
            tokenMint: new PublicKey(tokenMint),
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([nomination])
          .rpc();
      },
      "Create Nomination"
    );
  };

  // ✅ Cast Vote
  const handleCastVote = async () => {
    const nominationPubkey = prompt("Enter nomination public key:");
    const roundPubkey = prompt("Enter round public key:");
    
    if (!nominationPubkey || !roundPubkey) return;
    
    const voteTracker = web3.Keypair.generate();
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .castVote(new PublicKey(roundPubkey))
          .accounts({
            nomination: new PublicKey(nominationPubkey),
            rounds: new PublicKey(roundPubkey),
            voteTracker: voteTracker.publicKey,
            signer: wallet.publicKey!,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([voteTracker])
          .rpc();
      },
      "Cast Vote"
    );
  };

  // ✅ Declare Winner (Admin Only)
  const handleDeclareWinner = async () => {
    const nominationAddress = prompt("Enter nomination address to declare as winner:");
    if (!nominationAddress) return;
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .declareWinner(new PublicKey(nominationAddress))
          .accounts({
            config: new PublicKey(prompt("Enter config account address:") || ""),
            nomination: new PublicKey(nominationAddress),
            rounds: new PublicKey(prompt("Enter rounds account address:") || ""),
            owner: wallet.publicKey!,
          })
          .rpc();
      },
      "Declare Winner"
    );
  };

  // ✅ Add User to Whitelist
  const handleAddUserWhitelist = async () => {
    const userAddress = prompt("Enter user address to whitelist:");
    if (!userAddress) return;
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .addUserWhiteList(new PublicKey(userAddress))
          .accounts({
            config: new PublicKey(prompt("Enter config account address:") || ""),
            owner: wallet.publicKey!,
          })
          .rpc();
      },
      "Add User to Whitelist"
    );
  };

  // ✅ Remove User from Whitelist
  const handleRemoveUserWhitelist = async () => {
    const userAddress = prompt("Enter user address to remove from whitelist:");
    if (!userAddress) return;
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .removeUserWhiteList(new PublicKey(userAddress))
          .accounts({
            config: new PublicKey(prompt("Enter config account address:") || ""),
            owner: wallet.publicKey!,
          })
          .rpc();
      },
      "Remove User from Whitelist"
    );
  };

  // ============================================================================
  // 🎨 UI COMPONENTS
  // ============================================================================

  if (!wallet.connected) {
    return (
      <div className="cosmic-card p-6 text-center">
        <p className="text-foreground/60">Please connect your wallet to use the IDL integration examples.</p>
      </div>
    );
  }

  // Initialization Modal
  if (showInitModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="cosmic-card p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">🚀 Program Initialization Required</h2>
          <p className="text-foreground/60 mb-6">
            The SOSANA program needs to be initialized before you can use any functions. 
            This will create the main configuration account.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleInitialize}
              disabled={loading !== null}
              className="btn-primary flex-1"
            >
              {loading === "Initialize Config" ? "Initializing..." : "Initialize Program"}
            </button>
            <button
              onClick={() => setShowInitModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-card p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">🔧 IDL Integration Examples</h2>
      
      {/* Status Messages */}
      {loading && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400">⏳ {loading}...</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <p className="text-green-400">✅ {success}</p>
        </div>
      )}

      {/* Program Status */}
      <div className="mb-6 p-4 bg-background/50 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-2">Program Status</h3>
        <p className="text-sm text-foreground/60">
          <strong>Initialized:</strong> {isInitialized ? "✅ Yes" : "❌ No"}
        </p>
        <p className="text-sm text-foreground/60">
          <strong>Program ID:</strong> {programId.toString()}
        </p>
        <p className="text-sm text-foreground/60">
          <strong>Wallet:</strong> {wallet.publicKey?.toString()}
        </p>
      </div>

      {/* Function Categories */}
      <div className="space-y-8">
        {/* 🚀 Initialization */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">🚀 Initialization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleInitialize}
              disabled={loading !== null || isInitialized}
              className="btn-primary"
            >
              🚀 Initialize Config
            </button>
          </div>
        </div>

        {/* 📝 Whitelist Management */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">📝 Whitelist Management (Admin)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleAddUserWhitelist}
              disabled={loading !== null}
              className="btn-primary"
            >
              ➕ Add User to Whitelist
            </button>
            <button
              onClick={handleRemoveUserWhitelist}
              disabled={loading !== null}
              className="btn-primary"
            >
              ➖ Remove User from Whitelist
            </button>
          </div>
        </div>

        {/* 🎯 Round Management */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">🎯 Round Management (Admin)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleStartRound}
              disabled={loading !== null}
              className="btn-primary"
            >
              🎯 Start Round
            </button>
            <button
              onClick={handleDeclareWinner}
              disabled={loading !== null}
              className="btn-primary"
            >
              🏅 Declare Winner
            </button>
          </div>
        </div>

        {/* 🏆 Nomination & Voting */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">🏆 Nomination & Voting (Users)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCreateNomination}
              disabled={loading !== null}
              className="btn-primary"
            >
              🏆 Create Nomination
            </button>
            <button
              onClick={handleCastVote}
              disabled={loading !== null}
              className="btn-primary"
            >
              🗳️ Cast Vote
            </button>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-8 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-300 space-y-1">
          <li>• Admin functions require owner permissions</li>
          <li>• Replace placeholder addresses with actual account public keys</li>
          <li>• Ensure you have sufficient SOL for transaction fees</li>
          <li>• Test on devnet first before mainnet</li>
          <li>• Some functions require specific account setups</li>
        </ul>
      </div>
    </div>
  );
}
