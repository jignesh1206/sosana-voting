'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, web3, Idl } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "@/contracts/idl.json";
import { toast } from "react-toastify";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface WalletSetupData {
  liquidityWallet: string;
  degenWallet: string;
  prelaunchWallet: string;
  marketingWallet: string;
}

interface ConfigAccount {
  owner: string;
  currentRound: number;
  liquidityWallet: string;
  degenWallet: string;
  prelaunchWallet: string;
  marketingWallet: string;
  whitelistuser: string[];
  whitelisttoken: string[];
}

export default function WalletSetupPage() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [walletAddresses, setWalletAddresses] = useState<WalletSetupData>({
    liquidityWallet: "",
    degenWallet: "",
    prelaunchWallet: "",
    marketingWallet: "",
  });
  const [configAccount, setConfigAccount] = useState<ConfigAccount | null>(null);
  const [tokenMintAddress, setTokenMintAddress] = useState("");

  // Initialize provider and program
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
  const program = new Program(idl as Idl, programId, provider);

  // Derive config account address using PDA
  const [sosanaPda, sosanaBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("sosana-pda")],
    programId
  );

  // Fetch config account data on component mount
  useEffect(() => {
    if (wallet.connected) {
      fetchConfigAccount();
    }
  }, [wallet.connected]);

  const fetchConfigAccount = async () => {
    try {
      setConfigLoading(true);
      const configData = await program.account.config.fetch(sosanaPda);
      
      setConfigAccount({
        owner: configData.owner.toString(),
        currentRound: configData.currentRound.toNumber(),
        liquidityWallet: configData.liquidityWallet.toString(),
        degenWallet: configData.degenWallet.toString(),
        prelaunchWallet: configData.prelaunchWallet.toString(),
        marketingWallet: configData.marketingWallet.toString(),
        whitelistuser: configData.whitelistuser.map(pk => pk.toString()),
        whitelisttoken: configData.whitelisttoken.map(pk => pk.toString()),
      });

      // Update form with existing wallet addresses
      setWalletAddresses({
        liquidityWallet: configData.liquidityWallet.toString(),
        degenWallet: configData.degenWallet.toString(),
        prelaunchWallet: configData.prelaunchWallet.toString(),
        marketingWallet: configData.marketingWallet.toString(),
      });
    } catch (error) {
      console.error("Error fetching config account:", error);
      toast.error("Failed to fetch config account data");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleInputChange = (field: keyof WalletSetupData, value: string) => {
    setWalletAddresses(prev => ({ ...prev, [field]: value }));
  };

  const validatePublicKey = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleWalletSetup = async (walletType: keyof WalletSetupData) => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!tokenMintAddress) {
      toast.error("Please enter the Token Mint address");
      return;
    }

    const walletAddress = walletAddresses[walletType];
    if (!walletAddress) {
      toast.error(`Please enter the ${walletType} wallet address`);
      return;
    }

    if (!validatePublicKey(walletAddress)) {
      toast.error(`Invalid ${walletType} wallet address`);
      return;
    }

    setLoading(walletType);

    try {
      const walletPubkey = new PublicKey(walletAddress);
      const tokenMintPubkey = new PublicKey(tokenMintAddress);

      // Generate new wallet account and token account
      const walletAccount = web3.Keypair.generate();
      const walletTokenAccount = web3.Keypair.generate();

      let methodName: string;
      let accounts: any;

             switch (walletType) {
         case 'liquidityWallet':
           methodName = 'liquidityWalletSetup';
           accounts = {
             liquidityWalletAccount: walletAccount.publicKey,
             liquidityWalletTokenAccount: walletTokenAccount.publicKey,
             tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
             tokenMint: tokenMintPubkey,
             config: sosanaPda,
             signer: wallet.publicKey!,
             systemProgram: web3.SystemProgram.programId,
           };
           break;
         case 'degenWallet':
           methodName = 'degenWalletSetup';
           accounts = {
             degenWalletAccount: walletAccount.publicKey,
             degenWalletTokenAccount: walletTokenAccount.publicKey,
             tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
             tokenMint: tokenMintPubkey,
             config: sosanaPda,
             signer: wallet.publicKey!,
             systemProgram: web3.SystemProgram.programId,
           };
           break;
         case 'prelaunchWallet':
           methodName = 'prelaunchWalletSetup';
           accounts = {
             prelaunchWalletAccount: walletAccount.publicKey,
             prelaunchWalletTokenAccount: walletTokenAccount.publicKey,
             tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
             tokenMint: tokenMintPubkey,
             config: sosanaPda,
             signer: wallet.publicKey!,
             systemProgram: web3.SystemProgram.programId,
           };
           break;
         case 'marketingWallet':
           methodName = 'marketingWalletSetup';
           accounts = {
             marketingWalletAccount: walletAccount.publicKey,
             marketingWalletTokenAccount: walletTokenAccount.publicKey,
             tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
             tokenMint: tokenMintPubkey,
             config: sosanaPda,
             signer: wallet.publicKey!,
             systemProgram: web3.SystemProgram.programId,
           };
           break;
        default:
          throw new Error("Invalid wallet type");
      }

      await program.methods[methodName]()
        .accounts(accounts)
        .signers([walletAccount, walletTokenAccount])
        .rpc();

      toast.success(`${walletType} wallet setup completed successfully!`);
      
      // Refresh config account data
      await fetchConfigAccount();
      
    } catch (error: any) {
      console.error(`Error setting up ${walletType} wallet:`, error);
      toast.error(`${walletType} wallet setup failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'liquidityWallet':
        return '💧';
      case 'degenWallet':
        return '🎰';
      case 'prelaunchWallet':
        return '🚀';
      case 'marketingWallet':
        return '📢';
      default:
        return '💼';
    }
  };

  const getWalletName = (type: string) => {
    switch (type) {
      case 'liquidityWallet':
        return 'Liquidity Wallet';
      case 'degenWallet':
        return 'Degen Wallet';
      case 'prelaunchWallet':
        return 'Prelaunch Wallet';
      case 'marketingWallet':
        return 'Marketing Wallet';
      default:
        return type;
    }
  };

  if (!wallet.connected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wallet Setup</h1>
            <p className="text-foreground/60">Configure wallet addresses for tax collection</p>
          </div>
        </div>
        
        <div className="cosmic-card p-6 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-bold text-foreground mb-2">Wallet Not Connected</h3>
          <p className="text-foreground/60">
            Please connect your wallet to access the wallet setup page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
             {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-foreground">Wallet Setup</h1>
           <p className="text-foreground/60">Configure wallet addresses for tax collection</p>
         </div>
         <a
           href="/admin/wallets"
           className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
         >
           ← Back to Wallets
         </a>
       </div>

             {/* Configuration Inputs */}
       <div className="cosmic-card p-6">
         <h2 className="text-xl font-bold text-foreground mb-4">🔧 Configuration</h2>
         <div className="grid grid-cols-1 gap-4 mb-4">
           <div>
             <label className="block text-sm font-medium text-foreground mb-2">
               Token Mint Address
             </label>
             <input
               type="text"
               value={tokenMintAddress}
               onChange={(e) => setTokenMintAddress(e.target.value)}
               placeholder="Enter token mint address"
               className="w-full p-3 border border-card-border rounded-lg bg-background text-foreground"
             />
           </div>
         </div>
         
         <button
           onClick={fetchConfigAccount}
           disabled={configLoading}
           className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
         >
           {configLoading ? <LoadingSpinner size="sm" /> : '🔍 Fetch Config Data'}
         </button>
         
         <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
           <p className="text-sm text-blue-300">
             <strong>Config Account:</strong> Automatically derived using PDA (sosana-pda)
           </p>
         </div>
       </div>

      {/* Wallet Setup Form */}
      <div className="cosmic-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">🏦 Wallet Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(walletAddresses).map(([key, value]) => (
            <div key={key} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {getWalletIcon(key)} {getWalletName(key)}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleInputChange(key as keyof WalletSetupData, e.target.value)}
                  placeholder={`Enter ${getWalletName(key).toLowerCase()} address`}
                  className="w-full p-3 border border-card-border rounded-lg bg-background text-foreground"
                />
              </div>
                             <button
                 onClick={() => handleWalletSetup(key as keyof WalletSetupData)}
                 disabled={loading !== null || !value || !tokenMintAddress}
                 className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                {loading === key ? <LoadingSpinner size="sm" /> : `Setup ${getWalletName(key)}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Current Wallet Configuration */}
      {configAccount && (
        <div className="cosmic-card p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">📋 Current Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries({
              liquidityWallet: configAccount.liquidityWallet,
              degenWallet: configAccount.degenWallet,
              prelaunchWallet: configAccount.prelaunchWallet,
              marketingWallet: configAccount.marketingWallet,
            }).map(([key, address]) => (
              <div key={key} className="p-4 bg-background/50 rounded-lg border border-card-border">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{getWalletIcon(key)}</span>
                  <h3 className="font-semibold text-foreground">{getWalletName(key)}</h3>
                </div>
                <p className="text-sm text-foreground/60 font-mono break-all">
                  {address || "Not configured"}
                </p>
                {address && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Configured
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <h4 className="font-semibold text-blue-400 mb-2">Config Account Details</h4>
            <div className="text-sm text-blue-300 space-y-1">
              <p><strong>Owner:</strong> {configAccount.owner}</p>
              <p><strong>Current Round:</strong> {configAccount.currentRound}</p>
              <p><strong>Whitelisted Users:</strong> {configAccount.whitelistuser.length}</p>
              <p><strong>Whitelisted Tokens:</strong> {configAccount.whitelisttoken.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="cosmic-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">ℹ️ Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Tax Collection Wallets</h3>
            <div className="text-sm text-foreground/70 space-y-2">
              <p><strong>💧 Liquidity Wallet:</strong> Collects taxes for liquidity pool maintenance</p>
              <p><strong>🎰 Degen Wallet:</strong> Collects taxes for community rewards and incentives</p>
              <p><strong>🚀 Prelaunch Wallet:</strong> Collects taxes for pre-launch token distribution</p>
              <p><strong>📢 Marketing Wallet:</strong> Collects taxes for marketing and promotional activities</p>
            </div>
          </div>
          
                     <div className="space-y-3">
             <h3 className="font-semibold text-foreground">Setup Process</h3>
             <div className="text-sm text-foreground/70 space-y-2">
               <p>1. Enter the Token Mint address</p>
               <p>2. Click "Fetch Config Data" to load current configuration</p>
               <p>3. Enter wallet addresses for each tax collection type</p>
               <p>4. Click "Setup" for each wallet to configure</p>
               <p>5. Verify the configuration in the Current Configuration section</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
