"use client";

import { useState, useEffect } from "react";

const PolicyModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the policy
    const hasAcceptedPolicy = localStorage.getItem("policyAccepted");

    if (!hasAcceptedPolicy) {
      setIsOpen(true);
    }
  }, []);

  const acceptPolicy = () => {
    localStorage.setItem("policyAccepted", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="cosmic-card max-w-3xl w-full p-6 shadow-xl animate-in fade-in zoom-in duration-300 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-400">
          SOSANA Voting &amp; Nomination Guidelines
        </h2>

        <div className="space-y-5 my-6">
          <p className="text-lg">Welcome to the SOSANA Voting System!</p>

          <p>
            We&apos;re here to bring structure to the madness of meme or utility
            token investing. This isn&apos;t just about chasing hype—we want our
            community to nominate and vote for real projects that have a shot at
            success. To make sure SOSANA stays strong, here are some key
            guidelines to follow when nominating and voting:
          </p>

          <div className="bg-purple-900/30 p-4 rounded-md border border-purple-500/30">
            <h3 className="font-bold text-lg mb-2">
              1. How to Spot a Quality Token
            </h3>
            <p>
              Not every Solana token is created equal. Here&apos;s what to look
              for before nominating or voting:
            </p>
            <ul className="list-none pl-5 space-y-2 mt-2">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✅</span>
                <span>
                  <strong>Engaged Community</strong> – Does the project have
                  real engagement? Are people talking about it organically, or
                  is it just bots?
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✅</span>
                <span>
                  <strong>Active &amp; Transparent Team</strong> – Are the
                  developers communicating with the community? Are they
                  anonymous or doxxed? Are they delivering on their roadmap?
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✅</span>
                <span>
                  <strong>Sustainable Tokenomics</strong> – Does the project
                  make sense long-term? Or is it just a quick pump waiting to
                  dump?
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✅</span>
                <span>
                  <strong>Use Case or Meme Strength</strong> – Is there
                  something unique about this project? Does it have strong meme
                  energy or an actual utility?
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✅</span>
                <span>
                  <strong> Liquidity &amp; Trading Volume </strong> – Is the
                  project liquid enough for trading, or is it a trap waiting to
                  happen?
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-900/30 p-4 rounded-md border border-purple-500/30">
            <h3 className="font-bold text-lg mb-2">
              2. Best Practices for Voting &amp; Holding
            </h3>
            <ul className="list-none pl-5 space-y-2">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">🔹</span>
                <span>
                  <strong>Nominate Responsibly</strong> – If you wouldn&apos;t
                  invest in it yourself, don&apos;t nominate it. Remember,
                  we&apos;re curating the best tokens, not just hyping random
                  ones.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">🔹</span>
                <span>
                  <strong>Avoid Blind Hype Voting</strong> – Just because a
                  token is trending doesn&apos;t mean it&apos;s legit. Look
                  deeper.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">🔹</span>
                <span>
                  <strong>Think Long-Term</strong> – A project that holds value
                  over time is better than one that just pumps for a day.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">🔹</span>
                <span>
                  <strong>Winning Tokens Need Support, Not Dumps</strong> – If
                  you win, selling some is fine—but dumping your entire bag
                  instantly kills momentum. Consider holding, staking, or
                  reinvesting instead.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">🔹</span>
                <span>
                  <strong>Strong Voting = Stronger SOSANA</strong> – The better
                  our picks, the more valuable SOSANA becomes as a
                  community-driven hub.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-900/30 p-4 rounded-md border border-purple-500/30">
            <h3 className="font-bold text-lg mb-2">
              3. Community Responsibility
            </h3>
            <ul className="list-none pl-5 space-y-2">
              <li className="flex items-start">
                <span className="text-amber-400 mr-2">🚀</span>
                <span>
                  We&apos;re here to build, not destroy. If we become the group
                  that discovers early gems, we strengthen both our own holdings
                  and SOSANA&apos;s reputation.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-400 mr-2">🔥</span>
                <span>
                  Stronger projects mean a stronger ecosystem. By backing legit
                  tokens, we make SOSANA the go-to place for serious degen
                  investors.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-400 mr-2">🤝</span>
                <span>
                  Play the long game. We&apos;re here to have fun, make money,
                  and elevate the Solana meme coin space—not just chase
                  pump-and-dumps.
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Final Thoughts</h3>
            <p>
              By following these guidelines, we ensure that SOSANA remains a
              powerful, community-driven force in the crypto space. Before you
              participate in nominations and voting, please review and agree to
              the terms. These include a commitment not to immediately sell or
              &apos;dump&apos; the winning token received as part of the Degen Voter
              Bonus, in order to help maintain project integrity and promote a
              sustainable community environment.
            </p>
            <p className="mt-2 font-semibold text-purple-300">
              Now, go forth, nominate wisely, and vote smart. 🚀
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={acceptPolicy}
            className="btn btn-primary px-8 py-3 text-lg font-bold"
          >
            I Agree &amp; I am ready
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
