"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export default function Docs() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-12 glow-text">How Voting & Nominating Works</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Nomination & Voting Timeline */}
          <div className="cosmic-card p-6">
            <h2 className="text-2xl font-bold mb-4 text-accent">Nomination & Voting Timeline</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span>Nominations Open: Start of every 2-week round (Monday 7 PM EST).</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span>Nominations Close: Sunday at 7 PM EST (24 hours before voting ends).</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span>Voting Opens: Sunday at 7 PM EST (right after nominations close).</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span>Voting Ends & Locks: Monday at 7 PM EST.</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span>
                  Winner Announcement (Verified Voters): Monday at 7 PM EST (votes are finalized and immediately visible
                  to verified members).
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span>Public Reveal: Monday at 8 PM EST (the results go public to the entire community).</span>
              </li>
            </ul>
          </div>

          {/* Voting Runs on a 2-Week Cycle */}
          <div className="cosmic-card p-6">
            <h2 className="text-2xl font-bold mb-4 text-accent">Voting Runs on a 2-Week Cycle</h2>
            <ul className="space-y-4 mb-4">
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span>A new voting round starts every other Sunday at 7 PM EST (right after nominations close).</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span>The community votes for 24 hours on which token deserves the next nomination.</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span>Voting ends Monday at 7 PM EST.</span>
              </li>
            </ul>
            <div className="flex justify-center mt-6">
              <Image
                src="/cup.png"
                alt="Trophy"
                width={250}
                height={250}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* In Case of a Tie */}
        <div className="cosmic-card p-6 mb-12">
          <h2 className="text-2xl font-bold mb-4 text-accent">In Case of a Tie</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <span className="text-accent mr-2">◆</span>
              <span>
                If two or more tokens receive the same highest number of votes, winnings will be split evenly among
                them.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-accent mr-2">◆</span>
              <span>
                The Degen Voter Bonus (1x multipliers) is distributed equally among voters who supported any of the tied
                tokens.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-accent mr-2">◆</span>
              <span>The $500 Nomination Reward is split between the nominators of the tied tokens.</span>
            </li>
          </ul>
        </div>

        {/* Want to Nominate a Token? */}
        <div className="relative cosmic-card-highlight p-8 shadow-lg overflow-hidden">
          <div className="absolute right-0 bottom-0 w-1/3 h-full">
            <Image
              src="/nominate.png"
              alt="Nominate Character"
              width={300}
              height={300}
              className="object-contain absolute bottom-0 right-4"
            />
          </div>

          <div className="w-2/3">
            <h2 className="text-3xl font-bold mb-6 text-white glow-text">Want to Nominate a Token?</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span className="text-white">Hold at least $500 in SOSANA to submit a token for voting.</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span className="text-white">Your token automatically enters the Degen Polls.</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span className="text-white">If your token wins the round, you get a $500 SOSANA reward!</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span className="text-white">Nominations open every 2 weeks on Monday at 7 PM EST.</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">◆</span>
                <span className="text-white">Nominations close the following Sunday at 7 PM EST.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

