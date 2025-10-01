"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RoundResult {
  _id: string
  round: number
  roundName: string
  votingEndDate: string
  results: {
    declaredAt: string
    totalTokens: number
    totalVotes: number
    winners: Array<{
      tokenId: string
      tokenAddress: string
      symbol: string
      name: string
      voteCount: number
    }>
    allResults: Array<{
      tokenId: string
      tokenAddress: string
      symbol: string
      name: string
      logoUrl: string
      nominator: string
      voteCount: number
      nominationValue: number
    }>
  }
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export default function AdminResults() {
  const [results, setResults] = useState<RoundResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${backendUrl}/api/results`)
      const data = await response.json()
      
      if (data.success) {
        console.log('🔍 Results data received:', data.results);
        setResults(data.results)
      } else {
        setError(data.error || 'Failed to fetch results')
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      setError('Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cosmic-card p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchResults}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Round Results</h1>
          <p className="text-foreground/60 mt-2">View results from all completed voting rounds</p>
        </div>
        <button
          onClick={fetchResults}
          className="btn btn-secondary"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <div className="cosmic-card p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No Results Yet</h2>
          <p className="text-foreground/60">No rounds have been completed and results declared yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((roundResult) => (
            <div key={roundResult.round} className="cosmic-card p-6">
              {/* Round Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Round {roundResult.round}
                    {roundResult.roundName && (
                      <span className="text-lg font-normal text-foreground/60 ml-2">
                        - {roundResult.roundName}
                      </span>
                    )}
                  </h2>
                  <p className="text-foreground/60 mt-1">
                    Completed on {new Date(roundResult.votingEndDate).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/admin/rounds/${roundResult._id || roundResult.round}`}
                  className="btn btn-secondary"
                  onClick={() => {
                    console.log('🔍 Clicking View Round Details for:', {
                      _id: roundResult._id,
                      round: roundResult.round,
                      href: `/admin/rounds/${roundResult._id || roundResult.round}`
                    });
                  }}
                >
                  View Round Details
                </Link>
              </div>

              {/* Results Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                  <h3 className="text-sm font-medium text-foreground/60 mb-1">Total Tokens</h3>
                  <p className="text-2xl font-bold text-accent">{roundResult.results.totalTokens}</p>
                </div>
                <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                  <h3 className="text-sm font-medium text-foreground/60 mb-1">Total Votes</h3>
                  <p className="text-2xl font-bold text-accent">{roundResult.results.totalVotes}</p>
                </div>
                <div className="p-4 rounded-lg border border-card-border bg-secondary/20">
                  <h3 className="text-sm font-medium text-foreground/60 mb-1">Winners</h3>
                  <p className="text-2xl font-bold text-accent">{roundResult.results.winners.length}</p>
                </div>
              </div>

              {/* Winners Section */}
              {roundResult.results.winners && roundResult.results.winners.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    🏆 Winners
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roundResult.results.winners.map((winner, index) => (
                      <div key={winner.tokenId} className="p-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">🥇</span>
                            <div>
                              <h4 className="text-lg font-bold text-yellow-400">{winner.symbol}</h4>
                              <p className="text-sm text-foreground/60">{winner.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-yellow-400">{winner.voteCount}</p>
                            <p className="text-sm text-foreground/60">votes</p>
                          </div>
                        </div>
                        <p className="text-xs text-foreground/60 break-all">
                          {winner.tokenAddress}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Results Table */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">📊 All Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-card-border">
                        <th className="text-left p-3 text-sm font-medium text-foreground/60">Rank</th>
                        <th className="text-left p-3 text-sm font-medium text-foreground/60">Token</th>
                        <th className="text-left p-3 text-sm font-medium text-foreground/60">Nominator</th>
                        <th className="text-right p-3 text-sm font-medium text-foreground/60">Votes</th>
                        <th className="text-right p-3 text-sm font-medium text-foreground/60">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roundResult.results.allResults.map((result, index) => (
                        <tr key={result.tokenId} className="border-b border-card-border/50 hover:bg-card-highlight/30">
                          <td className="p-3 text-sm font-medium text-foreground">
                            #{index + 1}
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-foreground">{result.symbol}</p>
                              <p className="text-sm text-foreground/60">{result.name}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="text-sm text-foreground/80 font-mono">
                              {result.nominator ? `${result.nominator.slice(0, 8)}...${result.nominator.slice(-8)}` : 'N/A'}
                            </p>
                          </td>
                          <td className="p-3 text-right">
                            <p className="font-medium text-foreground">{result.voteCount}</p>
                          </td>
                          <td className="p-3 text-right">
                            {roundResult.results.winners.some(w => w.tokenId === result.tokenId) ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-400">
                                🏆 Winner
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-foreground/10 text-foreground/60">
                                Runner-up
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Declaration Info */}
              <div className="mt-6 pt-4 border-t border-card-border">
                <p className="text-sm text-foreground/60">
                  Results declared on {new Date(roundResult.results.declaredAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 