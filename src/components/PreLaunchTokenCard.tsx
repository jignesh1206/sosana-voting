'use client';

import { useState } from 'react';
import { PreLaunchToken } from './interface';
import { toast } from 'react-toastify';

interface PreLaunchTokenCardProps {
  token: PreLaunchToken;
  onVote?: (tokenId: string) => void;
  showVoteButton?: boolean;
  showResultsStatus?: boolean;
  isVoting?: boolean;
}

export default function PreLaunchTokenCard({ 
  token, 
  onVote, 
  showVoteButton = false, 
  showResultsStatus = false,
  isVoting = false 
}: PreLaunchTokenCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleVote = () => {
    if (onVote) {
      onVote(token._id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '✅ Approved';
      case 'pending': return '⏳ Pending Review';
      case 'rejected': return '❌ Rejected';
      default: return 'Unknown';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="cosmic-card p-6 hover:bg-card-highlight transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img
            src={token.tokenLogo || '/placeholder.svg'}
            alt={token.tokenName}
            className="w-12 h-12 rounded-full border-2 border-card-border"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <div>
            <h3 className="text-xl font-bold text-foreground">{token.tokenName}</h3>
            <p className="text-accent font-mono">{token.tokenSymbol}</p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(token.status)}`}>
          {getStatusText(token.status)}
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <p className="text-sm text-foreground/60">Votes</p>
          <p className="text-lg font-bold text-accent">{token.voteCount}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-foreground/60">Launch Date</p>
          <p className="text-sm font-semibold text-foreground">{formatDate(token.expectedLaunchDate)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-foreground/60">Blockchain</p>
          <p className="text-sm font-semibold text-foreground">{token.targetBlockchain}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-foreground/60">Nominated</p>
          <p className="text-sm font-semibold text-foreground">{formatDate(token.nominationDate)}</p>
        </div>
      </div>

      {/* Project Description */}
      <div className="mb-4">
        <p className="text-foreground/80 line-clamp-3">
          {token.projectDescription}
        </p>
      </div>

      {/* Social Links */}
      <div className="flex items-center space-x-3 mb-4">
        {token.website && (
          <a
            href={token.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            🌐 Website
          </a>
        )}
        {token.twitter && (
          <a
            href={token.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            🐦 Twitter
          </a>
        )}
        {token.telegram && (
          <a
            href={token.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            📱 Telegram
          </a>
        )}
        {token.discord && (
          <a
            href={token.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            💬 Discord
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-accent hover:text-accent/80 transition-colors text-sm font-medium"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {showVoteButton && token.status === 'approved' && (
          <button
            onClick={handleVote}
            disabled={isVoting || token.isUserNomination}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              token.isUserNomination
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent/80'
            }`}
          >
            {token.isUserNomination ? 'Your Nomination' : isVoting ? 'Voting...' : 'Vote'}
          </button>
        )}
        
        {showResultsStatus && (
          <div className="px-4 py-2 rounded-lg bg-purple-400/10 border border-purple-400/30">
            <span className="text-purple-400 font-medium text-sm">
              🏆 Results Phase
            </span>
          </div>
        )}
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-card-border space-y-4">
          {/* Goals */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/80 mb-2">🎯 Project Goals</h4>
            <p className="text-sm text-foreground/70">{token.goals}</p>
          </div>

          {/* Team Background */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/80 mb-2">👥 Team Background</h4>
            <p className="text-sm text-foreground/70">{token.teamBackground}</p>
          </div>

          {/* Roadmap */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/80 mb-2">🗺️ Roadmap</h4>
            <p className="text-sm text-foreground/70">{token.roadmap}</p>
          </div>

          {/* Tokenomics */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/80 mb-2">💰 Tokenomics</h4>
            <p className="text-sm text-foreground/70">{token.tokenomics}</p>
          </div>

          {/* Unique Value Proposition */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/80 mb-2">💡 Unique Value Proposition</h4>
            <p className="text-sm text-foreground/70">{token.uniqueValueProposition}</p>
          </div>

          {/* Market Potential */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/80 mb-2">📈 Market Potential</h4>
            <p className="text-sm text-foreground/70">{token.marketPotential}</p>
          </div>

          {/* Nominator Info */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/80 mb-2">👤 Nominated By</h4>
            <p className="text-sm font-mono text-foreground/70">
              {token.nominatorAddress.slice(0, 8)}...{token.nominatorAddress.slice(-8)}
            </p>
          </div>

          {/* Admin Notes (if rejected) */}
          {token.status === 'rejected' && token.adminNotes && (
            <div>
              <h4 className="text-sm font-semibold text-red-400 mb-2">❌ Admin Notes</h4>
              <p className="text-sm text-red-400/80">{token.adminNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 