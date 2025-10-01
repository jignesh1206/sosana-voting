"use client";

import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN, Idl } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as web3 from "@solana/web3.js";
import idl from "../../contracts/idl.json";
import { toast } from "react-toastify";

interface WhitelistManagementPanelProps {
  className?: string;
}

interface WhitelistEntry {
  address: string;
  addedAt: string;
  addedBy: string;
}

export default function WhitelistManagementPanel({ className = '' }: WhitelistManagementPanelProps) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configAccount, setConfigAccount] = useState("");
  const [sosanaPda, setSosanaPda] = useState<PublicKey | null>(null);
  const [whitelistEntries, setWhitelistEntries] = useState<WhitelistEntry[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize provider and program
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
  const program = new Program(idl as Idl, programId, provider);

  // Auto-derive the config PDA
  useEffect(() => {
    const deriveConfigPDA = async () => {
      try {
        const [pda, bump] = await PublicKey.findProgramAddressSync(
          [Buffer.from("sosana-vesting-pda")],
          programId
        );
        setSosanaPda(pda);
        setConfigAccount(pda.toString());
      } catch (err) {
        console.error("Error deriving config PDA:", err);
      }
    };

    if (programId) {
      deriveConfigPDA();
    }
  }, [programId]);

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

  // ✅ Add User to Whitelist
  const handleAddUserWhitelist = async () => {
    if (!sosanaPda) {
      toast.error("Config PDA not available");
      return;
    }

    if (!newAddress) {
      toast.error("Please enter a wallet address");
      return;
    }

    // Validate Solana address
    try {
      new PublicKey(newAddress);
    } catch (err) {
      toast.error("Invalid Solana wallet address");
      return;
    }
    
    await handleAsyncOperation(
      async () => {
        // Derive PDA for the whitelist user account
        const [userPda, userBump] = await PublicKey.findProgramAddressSync(
          [Buffer.from("sosana_user_whitelist"), new PublicKey(newAddress).toBuffer()],
          programId
        );

        await program.methods
          .addUserWhiteList(new PublicKey(newAddress), new BN(15000))
          .accounts({
            whiteList: userPda,
            config: sosanaPda,
            owner: wallet.publicKey!,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([])
          .rpc();
        
        // Add to local state
        const newEntry: WhitelistEntry = {
          address: newAddress,
          addedAt: new Date().toISOString(),
          addedBy: wallet.publicKey?.toString() || "",
        };
        setWhitelistEntries(prev => [...prev, newEntry]);
        setNewAddress("");
      },
      "Add User to Whitelist"
    );
  };

  // ✅ Remove User from Whitelist
  const handleRemoveUserWhitelist = async (address: string) => {
    if (!sosanaPda) {
      toast.error("Config PDA not available");
      return;
    }
    
    await handleAsyncOperation(
      async () => {
        await program.methods
          .removeUserWhiteList(new PublicKey(address))
          .accounts({
            config: sosanaPda,
            owner: wallet.publicKey!,
          })
          .rpc();
        
        // Remove from local state
        setWhitelistEntries(prev => prev.filter(entry => entry.address !== address));
      },
      "Remove User from Whitelist"
    );
  };

  // ✅ Bulk Add Users to Whitelist
  const handleBulkAddWhitelist = async () => {
    if (!sosanaPda) {
      toast.error("Config PDA not available");
      return;
    }

    const addresses = prompt("Enter wallet addresses separated by commas:");
    if (!addresses) return;

    const addressList = addresses.split(',').map(addr => addr.trim()).filter(addr => addr);
    
    if (addressList.length === 0) {
      toast.error("No valid addresses provided");
      return;
    }

    // Validate all addresses
    for (const addr of addressList) {
      try {
        new PublicKey(addr);
      } catch (err) {
        toast.error(`Invalid address: ${addr}`);
        return;
      }
    }

    await handleAsyncOperation(
      async () => {
        for (const address of addressList) {
          // Derive PDA for each whitelist user account
          const [userPda, userBump] = await PublicKey.findProgramAddressSync(
            [Buffer.from("sosana_user_whitelist"), new PublicKey(address).toBuffer()],
            programId
          );

          await program.methods
            .addUserWhiteList(new PublicKey(address), new BN(15000))
            .accounts({
              whiteList: userPda,
              config: sosanaPda,
              owner: wallet.publicKey!,
              systemProgram: web3.SystemProgram.programId,
            })
            .signers([])
            .rpc();
          
          // Add to local state
          const newEntry: WhitelistEntry = {
            address,
            addedAt: new Date().toISOString(),
            addedBy: wallet.publicKey?.toString() || "",
          };
          setWhitelistEntries(prev => [...prev, newEntry]);
        }
      },
      `Bulk Add ${addressList.length} Users to Whitelist`
    );
  };

  // ✅ Bulk Remove Users from Whitelist
  const handleBulkRemoveWhitelist = async () => {
    if (!sosanaPda) {
      toast.error("Config PDA not available");
      return;
    }

    const addresses = prompt("Enter wallet addresses to remove, separated by commas:");
    if (!addresses) return;

    const addressList = addresses.split(',').map(addr => addr.trim()).filter(addr => addr);
    
    if (addressList.length === 0) {
      toast.error("No valid addresses provided");
      return;
    }

    await handleAsyncOperation(
      async () => {
        for (const address of addressList) {
          await program.methods
            .removeUserWhiteList(new PublicKey(address))
            .accounts({
              config: sosanaPda,
              owner: wallet.publicKey!,
            })
            .rpc();
          
          // Remove from local state
          setWhitelistEntries(prev => prev.filter(entry => entry.address !== address));
        }
      },
      `Bulk Remove ${addressList.length} Users from Whitelist`
    );
  };

  // Filter whitelist entries based on search term
  const filteredEntries = whitelistEntries.filter(entry =>
    entry.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!wallet.connected) {
    return (
      <div className={`cosmic-card p-6 text-center ${className}`}>
        <p className="text-foreground/60">Please connect your wallet to manage whitelist.</p>
      </div>
    );
  }

  return (
    <div className={`cosmic-card p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-foreground mb-6">📝 Whitelist Management</h2>
      
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

      {/* Configuration */}
      <div className="mb-6 p-4 bg-background/50 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">🔧 Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Config Account Address (Auto-derived)
            </label>
            <input
              type="text"
              value={configAccount}
              readOnly
              placeholder="Config PDA will be auto-derived"
              className="w-full p-2 border border-card-border rounded-lg bg-background/30 text-foreground/80 cursor-not-allowed"
            />
            <p className="text-xs text-foreground/60 mt-1">
              Derived from: "sosana-vesting-pda" + program ID
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Program ID
            </label>
            <input
              type="text"
              value={programId.toString()}
              readOnly
              className="w-full p-2 border border-card-border rounded-lg bg-background/30 text-foreground/80 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Add Single User */}
      <div className="mb-6 p-4 bg-background/50 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">➕ Add Single User</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="flex-1 p-2 border border-card-border rounded-lg bg-background text-foreground"
          />
          <button
            onClick={handleAddUserWhitelist}
            disabled={loading !== null || !sosanaPda || !newAddress}
            className="btn-primary px-6"
          >
            Add to Whitelist
          </button>
        </div>
      </div>

      {/* Bulk Operations */}
      <div className="mb-6 p-4 bg-background/50 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">📦 Bulk Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleBulkAddWhitelist}
            disabled={loading !== null || !sosanaPda}
            className="btn-primary"
          >
            📥 Bulk Add Users
          </button>
          <button
            onClick={handleBulkRemoveWhitelist}
            disabled={loading !== null || !sosanaPda}
            className="btn-primary"
          >
            📤 Bulk Remove Users
          </button>
        </div>
      </div>

      {/* Whitelist Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            📋 Whitelist ({whitelistEntries.length} users)
          </h3>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search addresses..."
            className="p-2 border border-card-border rounded-lg bg-background text-foreground"
          />
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Whitelist Entries</h3>
            <p className="text-foreground/60">
              {searchTerm ? "No entries match your search." : "No users have been whitelisted yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEntries.map((entry, index) => (
              <div
                key={entry.address}
                className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-card-border"
              >
                <div className="flex-1">
                  <p className="font-mono text-sm text-foreground">
                    {entry.address}
                  </p>
                  <p className="text-xs text-foreground/60">
                    Added: {new Date(entry.addedAt).toLocaleDateString()} by {entry.addedBy.slice(0, 8)}...{entry.addedBy.slice(-8)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveUserWhitelist(entry.address)}
                  disabled={loading !== null}
                  className="ml-4 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Whitelist Information */}
      <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">ℹ️ Whitelist Information</h3>
        <div className="text-sm text-blue-300 space-y-2">
          <p><strong>Purpose:</strong> Control access to nomination and voting features</p>
          <p><strong>Token Allocation:</strong> Each user gets 15,000 SOSANA tokens (fixed amount)</p>
          <p><strong>Single Add:</strong> Add one user at a time with validation</p>
          <p><strong>Bulk Add:</strong> Add multiple users at once (comma-separated)</p>
          <p><strong>Bulk Remove:</strong> Remove multiple users at once (comma-separated)</p>
          <p><strong>Search:</strong> Filter through whitelisted addresses</p>
          <p><strong>Validation:</strong> All addresses are validated as Solana public keys</p>
          <p><strong>PDA Derivation:</strong> Config and user accounts are auto-derived</p>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
        <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-red-300 space-y-1">
          <li>• Only whitelisted users can nominate tokens and vote</li>
          <li>• Admin functions require owner permissions</li>
          <li>• All addresses are validated as Solana public keys</li>
          <li>• Bulk operations are processed sequentially</li>
          <li>• Changes are permanent and require careful consideration</li>
          <li>• Test on devnet first before mainnet deployment</li>
        </ul>
      </div>
    </div>
  );
}

