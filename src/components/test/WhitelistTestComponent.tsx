"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN, Idl } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import * as web3 from "@solana/web3.js";
import idl from "../../contracts/idl.json";
import { toast } from "react-toastify";

export default function WhitelistTestComponent() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [testAddress, setTestAddress] = useState("7TvGfZfUUvMhZp1SNGvfReHFqmmc7E1wepvB76cZKk8s");
  const [result, setResult] = useState<string>("");

  // Initialize provider and program
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
  const program = new Program(idl as Idl, programId, provider);

  const testAddUserWhitelist = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!testAddress) {
      toast.error("Please enter a test address");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      // Derive PDAs
      const [sosanaPda, sosanaBump] = await PublicKey.findProgramAddressSync(
        [Buffer.from("sosana-vesting-pda")],
        programId
      );

      const [userPda, userBump] = await PublicKey.findProgramAddressSync(
        [Buffer.from("sosana_user_whitelist"), new PublicKey(testAddress).toBuffer()],
        programId
      );

      console.log("Config PDA:", sosanaPda.toString());
      console.log("User PDA:", userPda.toString());

      // Send transaction
      const txHash = await program.methods
        .addUserWhiteList(new PublicKey(testAddress), new BN(15000))
        .accounts({
          whiteList: userPda,
          config: sosanaPda,
          owner: wallet.publicKey!,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([])
        .rpc();

      console.log(`Transaction hash: ${txHash}`);

      // Confirm transaction
      await connection.confirmTransaction(txHash);
      
      // Try to fetch the created account
      try {
        const whiteListUser = await program.account.whiteList.fetch(userPda);
        console.log("Whitelist user data:", whiteListUser);
        setResult(`✅ Success! Transaction: ${txHash}\nWhitelist user data: ${JSON.stringify(whiteListUser, null, 2)}`);
        toast.success("User added to whitelist successfully!");
      } catch (fetchErr) {
        setResult(`✅ Transaction successful: ${txHash}\nNote: Could not fetch whitelist account (may not exist yet)`);
        toast.success("Transaction completed!");
      }

    } catch (error: any) {
      console.error("Error:", error);
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="cosmic-card p-6 text-center">
        <p className="text-foreground/60">Please connect your wallet to test whitelist functionality.</p>
      </div>
    );
  }

  return (
    <div className="cosmic-card p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">🧪 Whitelist Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Test Address
          </label>
          <input
            type="text"
            value={testAddress}
            onChange={(e) => setTestAddress(e.target.value)}
            placeholder="Enter wallet address to test"
            className="w-full p-2 border border-card-border rounded-lg bg-background text-foreground"
          />
        </div>

        <button
          onClick={testAddUserWhitelist}
          disabled={loading || !testAddress}
          className="btn-primary px-6 py-2"
        >
          {loading ? "Testing..." : "Test Add User to Whitelist"}
        </button>

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
            <p><strong>Purpose:</strong> Test the addUserWhiteList function with the correct parameters</p>
            <p><strong>Token Amount:</strong> 15,000 SOSANA (fixed)</p>
            <p><strong>PDA Derivation:</strong> Uses "sosana-vesting-pda" for config and "sosana_user_whitelist" + user address for user account</p>
            <p><strong>Accounts:</strong> whiteList, config, owner, systemProgram</p>
          </div>
        </div>
      </div>
    </div>
  );
}