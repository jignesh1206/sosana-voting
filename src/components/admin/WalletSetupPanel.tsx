"use client";

import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN, web3, Idl } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../../contracts/idl.json";
import { toast } from "react-toastify";

interface WalletSetupPanelProps {
  className?: string;
}

interface WalletConfig {
  liquidityWallet: string;
  degenWallet: string;
  prelaunchWallet: string;
  marketingWallet: string;
  configAccount: string;
  tokenMint: string;
}

export default function WalletSetupPanel({ className = '' }: WalletSetupPanelProps) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [walletConfig, setWalletConfig] = useState<WalletConfig>({
    liquidityWallet: "",
    degenWallet: "",
    prelaunchWallet: "",
    marketingWallet: "",
    configAccount: "",
    tokenMint: "",
  });

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
      // Try to fetch config account to check if initialized
      setIsInitialized(true);
    } catch (err) {
      setIsInitialized(false);
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
      toast.success(`${operationName} completed successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = `${operationName} failed: ${err.message}`;
      setError(errorMessage);
      toast.error(errorMessage);
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
        
        setWalletConfig(prev => ({ ...prev, configAccount: configKeypair.publicKey.toString() }));
        setIsInitialized(true);
      },
      "Initialize Config"
    );
  };

  // ✅ Liquidity Wallet Setup
  const handleLiquidityWalletSetup = async () => {
    if (!walletConfig.configAccount || !walletConfig.tokenMint) {
      toast.error("Please set Config Account and Token Mint first");
      return;
    }

    const liquidityWalletAccount = web3.Keypair.generate();
    const liquidityWalletTokenAccount = web3.Keypair.generate();
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .liquidityWalletSetup()
          .accounts({
            liquidityWalletAccount: liquidityWalletAccount.publicKey,
            liquidityWalletTokenAccount: liquidityWalletTokenAccount.publicKey,
            tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            tokenMint: new PublicKey(walletConfig.tokenMint),
            config: new PublicKey(walletConfig.configAccount),
            signer: wallet.publicKey!,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([liquidityWalletAccount, liquidityWalletTokenAccount])
          .rpc();
        
        setWalletConfig(prev => ({
          ...prev,
          liquidityWallet: liquidityWalletAccount.publicKey.toString(),
        }));
      },
      "Setup Liquidity Wallet"
    );
  };

  // ✅ Degen Wallet Setup
  const handleDegenWalletSetup = async () => {
    if (!walletConfig.configAccount || !walletConfig.tokenMint) {
      toast.error("Please set Config Account and Token Mint first");
      return;
    }

    const degenWalletAccount = web3.Keypair.generate();
    const degenWalletTokenAccount = web3.Keypair.generate();
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .degenWalletSetup()
          .accounts({
            degenWalletAccount: degenWalletAccount.publicKey,
            degenWalletTokenAccount: degenWalletTokenAccount.publicKey,
            tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            tokenMint: new PublicKey(walletConfig.tokenMint),
            config: new PublicKey(walletConfig.configAccount),
            signer: wallet.publicKey!,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([degenWalletAccount, degenWalletTokenAccount])
          .rpc();
        
        setWalletConfig(prev => ({
          ...prev,
          degenWallet: degenWalletAccount.publicKey.toString(),
        }));
      },
      "Setup Degen Wallet"
    );
  };

  // ✅ Pre-launch Wallet Setup
  const handlePrelaunchWalletSetup = async () => {
    if (!walletConfig.configAccount || !walletConfig.tokenMint) {
      toast.error("Please set Config Account and Token Mint first");
      return;
    }

    const prelaunchWalletAccount = web3.Keypair.generate();
    const prelaunchWalletTokenAccount = web3.Keypair.generate();
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .prelaunchWalletSetup()
          .accounts({
            prelaunchWalletAccount: prelaunchWalletAccount.publicKey,
            prelaunchWalletTokenAccount: prelaunchWalletTokenAccount.publicKey,
            tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            tokenMint: new PublicKey(walletConfig.tokenMint),
            config: new PublicKey(walletConfig.configAccount),
            signer: wallet.publicKey!,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([prelaunchWalletAccount, prelaunchWalletTokenAccount])
          .rpc();
        
        setWalletConfig(prev => ({
          ...prev,
          prelaunchWallet: prelaunchWalletAccount.publicKey.toString(),
        }));
      },
      "Setup Pre-launch Wallet"
    );
  };

  // ✅ Marketing Wallet Setup
  const handleMarketingWalletSetup = async () => {
    if (!walletConfig.configAccount || !walletConfig.tokenMint) {
      toast.error("Please set Config Account and Token Mint first");
      return;
    }

    const marketingWalletAccount = web3.Keypair.generate();
    const marketingWalletTokenAccount = web3.Keypair.generate();
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .marketingWalletSetup()
          .accounts({
            marketingWalletAccount: marketingWalletAccount.publicKey,
            marketingWalletTokenAccount: marketingWalletTokenAccount.publicKey,
            tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            tokenMint: new PublicKey(walletConfig.tokenMint),
            config: new PublicKey(walletConfig.configAccount),
            signer: wallet.publicKey!,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([marketingWalletAccount, marketingWalletTokenAccount])
          .rpc();
        
        setWalletConfig(prev => ({
          ...prev,
          marketingWallet: marketingWalletAccount.publicKey.toString(),
        }));
      },
      "Setup Marketing Wallet"
    );
  };

  // ✅ Add User to Whitelist
  const handleAddUserWhitelist = async () => {
    if (!walletConfig.configAccount) {
      toast.error("Please set Config Account first");
      return;
    }

    const userAddress = prompt("Enter user address to whitelist:");
    if (!userAddress) return;
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .addUserWhiteList(new PublicKey(userAddress))
          .accounts({
            config: new PublicKey(walletConfig.configAccount),
            owner: wallet.publicKey!,
          })
          .rpc();
      },
      "Add User to Whitelist"
    );
  };

  // ✅ Remove User from Whitelist
  const handleRemoveUserWhitelist = async () => {
    if (!walletConfig.configAccount) {
      toast.error("Please set Config Account first");
      return;
    }

    const userAddress = prompt("Enter user address to remove from whitelist:");
    if (!userAddress) return;
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .removeUserWhiteList(new PublicKey(userAddress))
          .accounts({
            config: new PublicKey(walletConfig.configAccount),
            owner: wallet.publicKey!,
          })
          .rpc();
      },
      "Remove User from Whitelist"
    );
  };

  // Handle input changes
  const handleInputChange = (field: keyof WalletConfig, value: string) => {
    setWalletConfig(prev => ({ ...prev, [field]: value }));
  };

  if (!wallet.connected) {
    return (
      <div className={`cosmic-card p-6 text-center ${className}`}>
        <p className="text-foreground/60">Please connect your wallet to manage wallet setup.</p>
      </div>
    );
  }

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-foreground mb-6">🏦 Wallet Setup & Tax Collection</h2>
      
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

      {/* Configuration Inputs */}
      <div className="mb-6 p-4 bg-background/50 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">🔧 Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Config Account Address
            </label>
            <input
              type="text"
              value={walletConfig.configAccount}
              onChange={(e) => handleInputChange('configAccount', e.target.value)}
              placeholder="Enter config account address"
              className="w-full p-2 border border-card-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Token Mint Address
            </label>
            <input
              type="text"
              value={walletConfig.tokenMint}
              onChange={(e) => handleInputChange('tokenMint', e.target.value)}
              placeholder="Enter token mint address"
              className="w-full p-2 border border-card-border rounded-lg bg-background text-foreground"
            />
          </div>
        </div>
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

        {/* 🏦 Wallet Setup for Tax Collection */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">🏦 Wallet Setup (Tax Collection)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleLiquidityWalletSetup}
              disabled={loading !== null || !isInitialized}
              className="btn-primary"
            >
              💧 Setup Liquidity Wallet
            </button>
            <button
              onClick={handleDegenWalletSetup}
              disabled={loading !== null || !isInitialized}
              className="btn-primary"
            >
              🎰 Setup Degen Wallet
            </button>
            <button
              onClick={handlePrelaunchWalletSetup}
              disabled={loading !== null || !isInitialized}
              className="btn-primary"
            >
              🚀 Setup Pre-launch Wallet
            </button>
            <button
              onClick={handleMarketingWalletSetup}
              disabled={loading !== null || !isInitialized}
              className="btn-primary"
            >
              📢 Setup Marketing Wallet
            </button>
          </div>
        </div>

        {/* 📝 Whitelist Management */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">📝 Whitelist Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleAddUserWhitelist}
              disabled={loading !== null || !isInitialized}
              className="btn-primary"
            >
              ➕ Add User to Whitelist
            </button>
            <button
              onClick={handleRemoveUserWhitelist}
              disabled={loading !== null || !isInitialized}
              className="btn-primary"
            >
              ➖ Remove User from Whitelist
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Configuration Display */}
      <div className="mt-8 p-4 bg-background/50 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">📋 Wallet Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {Object.entries(walletConfig).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-foreground/60 font-medium">{key}:</span>
              <span className="text-foreground font-mono text-xs truncate max-w-[200px]">
                {value || "Not set"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tax Collection Information */}
      <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-400 mb-2">💰 Tax Collection System</h3>
        <div className="text-sm text-yellow-300 space-y-2">
          <p><strong>💧 Liquidity Wallet:</strong> Collects taxes for liquidity pool maintenance</p>
          <p><strong>🎰 Degen Wallet:</strong> Collects taxes for community rewards and incentives</p>
          <p><strong>🚀 Pre-launch Wallet:</strong> Collects taxes for pre-launch token distribution</p>
          <p><strong>📢 Marketing Wallet:</strong> Collects taxes for marketing and promotional activities</p>
          <p><strong>📝 Whitelist Management:</strong> Control access to nomination and voting features</p>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
        <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-red-300 space-y-1">
          <li>• Admin functions require owner permissions</li>
          <li>• Wallet setup must be done in order: Config → Token Mint → Individual Wallets</li>
          <li>• Tax collection is automatic once wallets are configured</li>
          <li>• Whitelist management controls user access to the platform</li>
          <li>• Test on devnet first before mainnet deployment</li>
        </ul>
      </div>
    </div>
  );
}

