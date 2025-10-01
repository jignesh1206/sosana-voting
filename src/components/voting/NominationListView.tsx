'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, BN, web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'react-toastify';
import { Metaplex } from '@metaplex-foundation/js';
import idl from '@/contracts/idl.json';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Nomination {
  publicKey: PublicKey;
  account: any;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  logo?: string;
}

interface NominationListViewProps {
  className?: string;
}

export default function NominationListView({ 
  className = '' 
}: NominationListViewProps) {
  const wallet = useWallet();
  const { connection } = useConnection();
  
  const [isLoading, setIsLoading] = useState(true);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [tokenMetadata, setTokenMetadata] = useState<Map<string, TokenMetadata>>(new Map());
  const [program, setProgram] = useState<Program | null>(null);
  const [metaplex, setMetaplex] = useState<Metaplex | null>(null);

  // Initialize Solana program
  const getSolanaProgram = () => {
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
    });
    
    const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");
    return new Program(idl as any, programId, provider);
  };

  // Initialize Metaplex
  const getMetaplex = () => {
    return Metaplex.make(connection);
  };

  // Initialize program and Metaplex when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      try {
        const programInstance = getSolanaProgram();
        const metaplexInstance = getMetaplex();
        setProgram(programInstance);
        setMetaplex(metaplexInstance);
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    }
  }, [wallet.connected, connection]);

  // Fetch all nominations
  const fetchNominations = async () => {
    if (!program) return;

    try {
      setIsLoading(true);
      const allNominations = await program.account.nomination.all();
      setNominations(allNominations);
      console.log('All nominations:', allNominations);
    } catch (error) {
      console.error('Error fetching nominations:', error);
      toast.error('Failed to fetch nominations');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch token metadata for a mint
  const fetchTokenMetadata = async (mintAddress: string) => {
    if (!metaplex) return null;

    try {
      const mint = new PublicKey(mintAddress);
      
      try {
        // Try to get NFT metadata first
        const metadata = await metaplex.nfts().findByMint({ mintAddress: mint });
        
        return {
          name: metadata.name,
          symbol: metadata.symbol,
          logo: metadata.json?.image || undefined
        };
      } catch (nftError) {
        // If NFT metadata fails, try to get token metadata
        try {
          const tokenMetadata = await metaplex.tokens().getToken({ mintAddress: mint });
          return {
            name: tokenMetadata.name || 'Unknown Token',
            symbol: tokenMetadata.symbol || 'UNKNOWN',
            logo: undefined
          };
        } catch (tokenError) {
          console.error(`Error fetching token metadata for ${mintAddress}:`, tokenError);
          return {
            name: 'Unknown Token',
            symbol: 'UNKNOWN',
            logo: undefined
          };
        }
      }
    } catch (error) {
      console.error(`Error fetching metadata for ${mintAddress}:`, error);
      return {
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        logo: undefined
      };
    }
  };

  // Fetch metadata for all nominations
  const fetchAllTokenMetadata = async () => {
    if (!metaplex || nominations.length === 0) return;

    const metadataMap = new Map<string, TokenMetadata>();
    
    for (const nomination of nominations) {
      const mintAddress = (nomination.account as any).tokenMint?.toString();
      if (mintAddress) {
        const metadata = await fetchTokenMetadata(mintAddress);
        if (metadata) {
          metadataMap.set(mintAddress, metadata);
        }
      }
    }
    
    setTokenMetadata(metadataMap);
  };

  // Cast vote for a nomination
  const handleCastVote = async (nomination: Nomination) => {
    if (!program || !wallet.publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const voteTracker = web3.Keypair.generate();
      const roundPubkey = (nomination.account as any).roundAddress;
      
      await program.methods
        .castVote(roundPubkey)
        .accounts({
          nomination: nomination.publicKey,
          rounds: roundPubkey,
          voteTracker: voteTracker.publicKey,
          signer: wallet.publicKey!,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([voteTracker])
        .rpc();

      toast.success('Vote cast successfully!');
      
      // Refresh nominations to update vote counts
      await fetchNominations();
    } catch (error: any) {
      console.error('Error casting vote:', error);
      toast.error(`Failed to cast vote: ${error.message}`);
    }
  };

  // Load data when program is ready
  useEffect(() => {
    if (program) {
      fetchNominations();
    }
  }, [program]);

  // Fetch metadata when nominations change
  useEffect(() => {
    if (metaplex && nominations.length > 0) {
      fetchAllTokenMetadata();
    }
  }, [metaplex, nominations]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <LoadingSpinner size="lg" text="Loading nominations..." />
      </div>
    );
  }

  if (nominations.length === 0) {
    return (
      <div className={`cosmic-card p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">No Nominations Found</h3>
          <p className="text-foreground/60 mb-4">
            There are currently no nominations available.
          </p>
          <button
            onClick={fetchNominations}
            className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Refresh Nominations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">All Nominations</h2>
        <button
          onClick={fetchNominations}
          className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Nominations Table */}
      <div className="cosmic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                  Logo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                  Nominator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                  Votes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {nominations.map((nomination) => {
                const mintAddress = (nomination.account as any).tokenMint?.toString();
                const metadata = mintAddress ? tokenMetadata.get(mintAddress) : null;
                const voteCount = (nomination.account as any).voteCount?.toNumber?.() || 0;
                const nominator = (nomination.account as any).nominator?.toString();

                return (
                  <tr key={nomination.publicKey.toString()} className="hover:bg-secondary/10">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {metadata?.logo ? (
                          <img
                            src={metadata.logo}
                            alt={metadata.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center">
                            <span className="text-xs text-foreground/60">?</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {metadata?.name || 'Unknown Token'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground/60">
                        {metadata?.symbol || 'UNKNOWN'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground/60 font-mono">
                        {mintAddress ? `${mintAddress.slice(0, 8)}...${mintAddress.slice(-8)}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground/60 font-mono">
                        {nominator ? `${nominator.slice(0, 8)}...${nominator.slice(-8)}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {voteCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleCastVote(nomination)}
                        className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Vote
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="cosmic-card p-4 bg-secondary/20">
        <p className="text-sm text-foreground/60">
          Total Nominations: {nominations.length} | 
          Total Votes: {nominations.reduce((sum, nom) => sum + ((nom.account as any).voteCount?.toNumber?.() || 0), 0)}
        </p>
      </div>
    </div>
  );
}
