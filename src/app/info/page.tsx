"use client"

import { useState, useEffect, useMemo } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { AnchorProvider, Program, Idl } from "@project-serum/anchor"
import { PublicKey } from "@solana/web3.js"
import idl from "@/contracts/idl.json"

// Backend-related code removed

export default function Info() {
  const wallet = useWallet()
  const { connection } = useConnection()

  const [tokenTrackers, setTokenTrackers] = useState<any[]>([])
  const topMintFrequencies = useMemo(() => {
    const counter = new Map<string, number>()
    for (const item of tokenTrackers) {
      const acct = item?.account
      if (!acct) continue
      const mintStr = acct.mint?.toBase58 ? acct.mint.toBase58() : String(acct.mint)
      if (!mintStr) continue
      counter.set(mintStr, (counter.get(mintStr) || 0) + 1)
    }
    const arr = Array.from(counter.entries()).map(([mint, count]) => ({ mint, count }))
    arr.sort((a, b) => b.count - a.count)
    return arr.slice(0, 10)
  }, [tokenTrackers])
  const mintTopDisplay = useMemo(() => {
    const nominatedByMint = new Map<string, any>()
    const firstByMint = new Map<string, any>()
    for (const item of tokenTrackers) {
      const acct = item?.account
      if (!acct) continue
      const mintStr = acct.mint?.toBase58 ? acct.mint.toBase58() : String(acct.mint)
      if (!mintStr) continue
      if (!firstByMint.has(mintStr)) firstByMint.set(mintStr, item)
      if (acct.isNominated && !nominatedByMint.has(mintStr)) {
        nominatedByMint.set(mintStr, item)
      }
    }
    return topMintFrequencies.map(({ mint, count }) => {
      const item = nominatedByMint.get(mint) || firstByMint.get(mint)
      const nom = item?.account?.isNominated ? item?.account?.nominator : undefined
      const nomStr = nom?.toBase58 ? nom.toBase58() : (nom ? String(nom) : "")
      return { mint, count, nominator: nomStr }
    })
  }, [tokenTrackers, topMintFrequencies])

  // Removed TokenTracker unique list view

  const getProgram = () => {
    if (!process.env.NEXT_PUBLIC_PROGRAM_ID) {
      throw new Error("NEXT_PUBLIC_PROGRAM_ID is not set")
    }
    const provider = new AnchorProvider(connection, wallet as any, {})
    const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID)
    return new Program(idl as Idl, programId, provider)
  }

  const fetchTokenTrackers = async () => {
    try {
      const program = getProgram()
      // equivalent to: const tokenTracker = await pg.program.account.tokenTracker.all();
      const trackers = await program.account.tokenTracker.all()
      setTokenTrackers(trackers)
      console.log("tokenTracker", trackers)
    } catch (error) {
      console.error("Error fetching token trackers:", error)
    }
  }

  useEffect(() => {
    // Load on-chain accounts when connection/wallet changes
    if (connection) {
      fetchTokenTrackers()
    }
  }, [connection, wallet.publicKey])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* On-chain sections only */}

        {/* On-chain TokenTrackers section removed */}

        {/* Top 10 Tokens */}
        <div className="cosmic-card-highlight p-6">
          <h1 className="text-3xl font-bold mb-6 text-center glow-text">Top 10 Tokens</h1>
          {mintTopDisplay.length === 0 ? (
            <div className="text-center py-6 text-foreground/60">No mint activity found</div>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-card-border">
                    <th className="p-2">Rank</th>
                      <th className="p-2">Logo</th>
                      <th className="p-2">Name / Symbol</th>
                    <th className="p-2">Token Address</th>
                      <th className="p-2">Nominator</th>
                    <th className="p-2">Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                  {mintTopDisplay.map((row, idx) => {
                    const shortNom = row.nominator
                      ? `${row.nominator.slice(0, 4)}...${row.nominator.slice(-4)}`
                      : 'N/A'
                    return (
                      <tr
                        key={row.mint}
                        className={`border-b border-card-border/50 hover:bg-card-highlight/30 transition-colors ${
                          idx === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : idx === 1 ? 'bg-gray-500/10 border-gray-500/30' : ''
                        }`}
                      >
                        <td className="p-2 font-semibold">{idx + 1}</td>
                        <td className="p-2">
                          <img src={'/placeholder.svg'} alt={row.mint} className="w-6 h-6 rounded-full" />
                        </td>
                        <td className="p-2 text-xs">
                          Unknown / <span className="text-foreground/60">{row.mint.slice(0, 6)}...{row.mint.slice(-6)}</span>
                        </td>
                        <td className="p-2 text-xs break-all">{row.mint}</td>
                        <td className="p-2 text-xs">{shortNom}</td>
                        <td className="p-2 font-bold">{row.count}</td>
                      </tr>
                    )
                  })}
                  </tbody>
                </table>
              </div>
          )}
        </div>
      </div>
    </div>
  )
}

