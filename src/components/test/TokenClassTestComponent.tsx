"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { 
  getOrCreateUserATATokenClass,
  getOrCreateUserATATokenClassEnhanced,
  TokenAccountUtils 
} from "@/utils/vestingUtils";
import { toast } from "react-toastify";

export default function TokenClassTestComponent() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState<string | null>(null);
  const [mintAddress, setMintAddress] = useState("So11111111111111111111111111111111111111112");
  const [useToken2022, setUseToken2022] = useState(false);
  const [result, setResult] = useState<string>("");

  const testTokenClass = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setLoading("Token Class");
    setResult("");

    try {
      const tokenAccountAddress = await getOrCreateUserATATokenClass(
        connection,
        wallet,
        mintAddress,
        useToken2022
      );
      
      setResult(`✅ Token Class method succeeded!\nAccount: ${tokenAccountAddress}\nProgram: ${useToken2022 ? 'TOKEN_2022' : 'TOKEN'}`);
      toast.success("Token Class method succeeded!");
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const testEnhancedTokenClass = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setLoading("Enhanced Token Class");
    setResult("");

    try {
      const result = await getOrCreateUserATATokenClassEnhanced(
        connection,
        wallet,
        mintAddress,
        {
          useToken2022,
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        }
      );
      
      setResult(`✅ Enhanced Token Class method succeeded!\nAccount: ${result.address}\nProgram: ${useToken2022 ? 'TOKEN_2022' : 'TOKEN'}\nAccount Info: ${JSON.stringify(result.accountInfo, null, 2)}`);
      toast.success("Enhanced Token Class method succeeded!");
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const testUtilityTokenClass = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setLoading("Utility Token Class");
    setResult("");

    try {
      const result = await TokenAccountUtils.getUserATATokenClass(
        connection,
        wallet,
        mintAddress,
        useToken2022
      );
      
      setResult(`✅ Utility Token Class method succeeded!\nAccount: ${result}\nProgram: ${useToken2022 ? 'TOKEN_2022' : 'TOKEN'}`);
      toast.success("Utility Token Class method succeeded!");
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const testAllMethods = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setLoading("All Methods");
    setResult("");

    try {
      const results = {};
      
      // Test standard Token class
      try {
        results.standardTokenClass = await getOrCreateUserATATokenClass(connection, wallet, mintAddress, useToken2022);
      } catch (error) {
        results.standardTokenClass = `Failed: ${error.message}`;
      }
      
      // Test enhanced Token class
      try {
        const enhancedResult = await getOrCreateUserATATokenClassEnhanced(connection, wallet, mintAddress, { useToken2022 });
        results.enhancedTokenClass = enhancedResult.address;
      } catch (error) {
        results.enhancedTokenClass = `Failed: ${error.message}`;
      }
      
      // Test utility Token class
      try {
        results.utilityTokenClass = await TokenAccountUtils.getUserATATokenClass(connection, wallet, mintAddress, useToken2022);
      } catch (error) {
        results.utilityTokenClass = `Failed: ${error.message}`;
      }
      
      setResult(`✅ All methods tested!\nResults:\n${JSON.stringify(results, null, 2)}`);
      toast.success("All methods tested!");
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
        <p className="text-foreground/60">Please connect your wallet to test Token class methods.</p>
      </div>
    );
  }

  return (
    <div className="cosmic-card p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">🏛️ Token Class Test</h2>
      
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

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useToken2022}
              onChange={(e) => setUseToken2022(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-foreground">Use Token-2022 Program</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={testTokenClass}
            disabled={loading !== null || !mintAddress}
            className="btn-primary px-4 py-2"
          >
            {loading === "Token Class" ? "Testing..." : "Token Class"}
          </button>

          <button
            onClick={testEnhancedTokenClass}
            disabled={loading !== null || !mintAddress}
            className="btn-primary px-4 py-2"
          >
            {loading === "Enhanced Token Class" ? "Testing..." : "Enhanced Token Class"}
          </button>

          <button
            onClick={testUtilityTokenClass}
            disabled={loading !== null || !mintAddress}
            className="btn-primary px-4 py-2"
          >
            {loading === "Utility Token Class" ? "Testing..." : "Utility Token Class"}
          </button>

          <button
            onClick={testAllMethods}
            disabled={loading !== null || !mintAddress}
            className="btn-primary px-4 py-2"
          >
            {loading === "All Methods" ? "Testing..." : "Test All Methods"}
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
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Token Class Approach</h3>
          <div className="text-sm text-blue-300 space-y-2">
            <p><strong>Method:</strong> Uses splToken.Token class with getOrCreateAssociatedAccountInfo()</p>
            <p><strong>Legacy:</strong> Older but still supported approach</p>
            <p><strong>Programs:</strong> Supports both TOKEN and TOKEN_2022 programs</p>
            <p><strong>Wallet:</strong> {wallet.publicKey?.toString()}</p>
            <p><strong>Current Program:</strong> {useToken2022 ? 'TOKEN_2022' : 'TOKEN'}</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Code Example</h3>
          <pre className="text-sm text-green-300 font-mono">
{`var myToken = new splToken.Token(
  connection,
  myMint,
  splToken.TOKEN_PROGRAM_ID,
  fromWallet
);

var fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
  fromWallet.publicKey
);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
