"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN, web3, Idl } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../contracts/idl.json";

export default function IdlIntegrationDemo() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize provider and program
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
  const program = new Program(idl as Idl, programId, provider);

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

  // ✅ Example 1: Initialize Config
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
      },
      "Initialize Config"
    );
  };

  // ✅ Example 2: Add User to Whitelist
  const handleAddWhitelist = async () => {
    const userAddress = prompt("Enter user address to whitelist:");
    if (!userAddress) return;
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .addUserWhiteList(new PublicKey(userAddress))
          .accounts({
            config: new PublicKey("CONFIG_ACCOUNT_PUBKEY"), // Replace with actual
            owner: wallet.publicKey!,
          })
          .rpc();
      },
      "Add User to Whitelist"
    );
  };

  // ✅ Example 3: Start Round
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
            config: new PublicKey("CONFIG_ACCOUNT_PUBKEY"), // Replace with actual
            signer: wallet.publicKey!,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([newRound])
          .rpc();
      },
      "Start Round"
    );
  };

  // ✅ Example 4: Create Nomination
  const handleNominate = async () => {
    const tokenMint = prompt("Enter token mint address:");
    const roundPubkey = prompt("Enter round public key:");
    if (!tokenMint || !roundPubkey) return;
    
    const nomination = web3.Keypair.generate();
    const snapshotAmount = prompt("Enter snapshot amount (default: 1000):") || "1000";
    
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

  // ✅ Example 5: Cast Vote
  const handleVote = async () => {
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

  // ✅ Example 6: Claim Rewards (Nominee)
  const handleNomineeClaim = async () => {
    const round = prompt("Enter round public key:");
    const nomination = prompt("Enter nomination public key:");
    const rewardAmount = prompt("Enter reward amount:");
    if (!round || !nomination || !rewardAmount) return;
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .liveTokenNomineeClaim(new BN(rewardAmount))
          .accounts({
            rounds: new PublicKey(round),
            nomination: new PublicKey(nomination),
            config: new PublicKey("CONFIG_ACCOUNT_PUBKEY"), // Replace with actual
            signer: wallet.publicKey!,
            userTokenAccount: new PublicKey("USER_TOKEN_ACCOUNT"), // Replace with actual
            degenWalletTokenAccount: new PublicKey("DEGEN_WALLET_TOKEN_ACCOUNT"), // Replace with actual
            tokenMint: new PublicKey("TOKEN_MINT"), // Replace with actual
            tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // SPL Token Program
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc();
      },
      "Claim Nominee Rewards"
    );
  };

  // ✅ Example 7: Claim Rewards (Voter)
  const handleVoterClaim = async () => {
    const round = prompt("Enter round public key:");
    const nomination = prompt("Enter nomination public key:");
    const rewardAmount = prompt("Enter reward amount:");
    if (!round || !nomination || !rewardAmount) return;
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .liveTokenVoterClaim(new BN(rewardAmount))
          .accounts({
            nomination: new PublicKey(nomination),
            rounds: new PublicKey(round),
            voteTracker: new PublicKey("VOTE_TRACKER_PUBKEY"), // Replace with actual
            config: new PublicKey("CONFIG_ACCOUNT_PUBKEY"), // Replace with actual
            signer: wallet.publicKey!,
            userTokenAccount: new PublicKey("USER_TOKEN_ACCOUNT"), // Replace with actual
            degenWalletTokenAccount: new PublicKey("DEGEN_WALLET_TOKEN_ACCOUNT"), // Replace with actual
            tokenMint: new PublicKey("TOKEN_MINT"), // Replace with actual
            tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // SPL Token Program
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc();
      },
      "Claim Voter Rewards"
    );
  };

  // ✅ Example 8: Declare Winner
  const handleDeclareWinner = async () => {
    const nominationAddress = prompt("Enter nomination address:");
    if (!nominationAddress) return;
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .declareWinner(new PublicKey(nominationAddress))
          .accounts({
            config: new PublicKey("CONFIG_ACCOUNT_PUBKEY"), // Replace with actual
            nomination: new PublicKey(nominationAddress),
            rounds: new PublicKey("ROUNDS_PUBKEY"), // Replace with actual
            owner: wallet.publicKey!,
          })
          .rpc();
      },
      "Declare Winner"
    );
  };

  if (!wallet.connected) {
    return (
      <div className="cosmic-card p-6 text-center">
        <p className="text-foreground/60">Please connect your wallet to use the IDL integration demo.</p>
      </div>
    );
  }

  return (
    <div className="cosmic-card p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">IDL Integration Demo</h2>
      
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

      {/* Function Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleInitialize}
          disabled={loading !== null}
          className="btn-primary"
        >
          🚀 Initialize Config
        </button>

        <button
          onClick={handleAddWhitelist}
          disabled={loading !== null}
          className="btn-primary"
        >
          📝 Add User to Whitelist
        </button>

        <button
          onClick={handleStartRound}
          disabled={loading !== null}
          className="btn-primary"
        >
          🎯 Start Round
        </button>

        <button
          onClick={handleNominate}
          disabled={loading !== null}
          className="btn-primary"
        >
          🏆 Create Nomination
        </button>

        <button
          onClick={handleVote}
          disabled={loading !== null}
          className="btn-primary"
        >
          🗳️ Cast Vote
        </button>

        <button
          onClick={handleNomineeClaim}
          disabled={loading !== null}
          className="btn-primary"
        >
          💰 Claim Nominee Rewards
        </button>

        <button
          onClick={handleVoterClaim}
          disabled={loading !== null}
          className="btn-primary"
        >
          🎁 Claim Voter Rewards
        </button>

        <button
          onClick={handleDeclareWinner}
          disabled={loading !== null}
          className="btn-primary"
        >
          🏅 Declare Winner
        </button>
      </div>

      {/* Program Info */}
      <div className="mt-6 p-4 bg-background/50 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-2">Program Information</h3>
        <p className="text-sm text-foreground/60">
          <strong>Program ID:</strong> {programId.toString()}
        </p>
        <p className="text-sm text-foreground/60">
          <strong>Wallet:</strong> {wallet.publicKey?.toString()}
        </p>
        <p className="text-sm text-foreground/60">
          <strong>Connection:</strong> {connection.rpcEndpoint}
        </p>
      </div>

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-300 space-y-1">
          <li>• Replace placeholder addresses with actual account public keys</li>
          <li>• Ensure you have sufficient SOL for transaction fees</li>
          <li>• Test on devnet first before mainnet</li>
          <li>• Some functions require specific permissions (owner/admin)</li>
        </ul>
      </div>
    </div>
  );
}
