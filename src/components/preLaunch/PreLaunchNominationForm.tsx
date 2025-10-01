'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useStaticContext } from '@/context/StaticContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PreLaunchNominationFormProps {
  className?: string;
  onSuccess?: () => void;
  roundId?: string;
}

interface FormData {
  tokenName: string;
  tokenSymbol: string;
  projectDescription: string;
  goals: string;
  teamBackground: string;
  roadmap: string;
  expectedLaunchDate: string;
  targetBlockchain: string;
  tokenomics: string;
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
  uniqueValueProposition: string;
  marketPotential: string;
}

export default function PreLaunchNominationForm({ 
  className = '',
  onSuccess,
  roundId
}: PreLaunchNominationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    tokenName: '',
    tokenSymbol: '',
    projectDescription: '',
    goals: '',
    teamBackground: '',
    roadmap: '',
    expectedLaunchDate: '',
    targetBlockchain: 'Solana',
    tokenomics: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    uniqueValueProposition: '',
    marketPotential: ''
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publicKey } = useWallet();
  const { nominateToken } = useStaticContext();

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.tokenName.trim()) {
      newErrors.tokenName = 'Token name is required';
    }

    if (!formData.tokenSymbol.trim()) {
      newErrors.tokenSymbol = 'Token symbol is required';
    }

    if (!formData.projectDescription.trim()) {
      newErrors.projectDescription = 'Project description is required';
    }

    if (!formData.goals.trim()) {
      newErrors.goals = 'Goals are required';
    }

    if (!formData.teamBackground.trim()) {
      newErrors.teamBackground = 'Team background is required';
    }

    if (!formData.roadmap.trim()) {
      newErrors.roadmap = 'Roadmap is required';
    }

    if (!formData.expectedLaunchDate) {
      newErrors.expectedLaunchDate = 'Expected launch date is required';
    }

    if (!formData.tokenomics.trim()) {
      newErrors.tokenomics = 'Tokenomics are required';
    }

    if (!formData.website.trim()) {
      newErrors.website = 'Website is required';
    }

    if (!formData.uniqueValueProposition.trim()) {
      newErrors.uniqueValueProposition = 'Unique value proposition is required';
    }

    if (!formData.marketPotential.trim()) {
      newErrors.marketPotential = 'Market potential is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      console.error('Please connect your wallet to nominate');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call with form data
      await nominateToken(formData.tokenName, 'pre-launch');
      
      // Reset form
      setFormData({
        tokenName: '',
        tokenSymbol: '',
        projectDescription: '',
        goals: '',
        teamBackground: '',
        roadmap: '',
        expectedLaunchDate: '',
        targetBlockchain: 'Solana',
        tokenomics: '',
        website: '',
        twitter: '',
        telegram: '',
        discord: '',
        uniqueValueProposition: '',
        marketPotential: ''
      });
      setErrors({});
      
      onSuccess?.();
      console.log('Pre-launch token nominated successfully!');
    } catch (error) {
      console.error('Failed to nominate pre-launch token:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          🚀 Submit Pre-Launch Project
        </h3>
        <p className="text-foreground/60 mb-6">
          Submit your pre-launch token project for community voting. Provide detailed information about your project.
        </p>
      </div>

      {/* Basic Token Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tokenName" className="block text-sm font-medium text-foreground mb-2">
            Token Name *
          </label>
          <input
            type="text"
            id="tokenName"
            value={formData.tokenName}
            onChange={(e) => handleInputChange('tokenName', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="e.g., My Awesome Token"
          />
          {errors.tokenName && (
            <p className="text-red-400 text-sm mt-1">{errors.tokenName}</p>
          )}
        </div>

        <div>
          <label htmlFor="tokenSymbol" className="block text-sm font-medium text-foreground mb-2">
            Token Symbol *
          </label>
          <input
            type="text"
            id="tokenSymbol"
            value={formData.tokenSymbol}
            onChange={(e) => handleInputChange('tokenSymbol', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="e.g., MAT"
          />
          {errors.tokenSymbol && (
            <p className="text-red-400 text-sm mt-1">{errors.tokenSymbol}</p>
          )}
        </div>
      </div>

      {/* Project Description */}
      <div>
        <label htmlFor="projectDescription" className="block text-sm font-medium text-foreground mb-2">
          Project Description *
        </label>
        <textarea
          id="projectDescription"
          value={formData.projectDescription}
          onChange={(e) => handleInputChange('projectDescription', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="Describe your project and what it aims to achieve..."
        />
        {errors.projectDescription && (
          <p className="text-red-400 text-sm mt-1">{errors.projectDescription}</p>
        )}
      </div>

      {/* Goals */}
      <div>
        <label htmlFor="goals" className="block text-sm font-medium text-foreground mb-2">
          Project Goals *
        </label>
        <textarea
          id="goals"
          value={formData.goals}
          onChange={(e) => handleInputChange('goals', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="What are the main goals of your project?"
        />
        {errors.goals && (
          <p className="text-red-400 text-sm mt-1">{errors.goals}</p>
        )}
      </div>

      {/* Team Background */}
      <div>
        <label htmlFor="teamBackground" className="block text-sm font-medium text-foreground mb-2">
          Team Background *
        </label>
        <textarea
          id="teamBackground"
          value={formData.teamBackground}
          onChange={(e) => handleInputChange('teamBackground', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="Tell us about your team's experience and background..."
        />
        {errors.teamBackground && (
          <p className="text-red-400 text-sm mt-1">{errors.teamBackground}</p>
        )}
      </div>

      {/* Roadmap */}
      <div>
        <label htmlFor="roadmap" className="block text-sm font-medium text-foreground mb-2">
          Roadmap *
        </label>
        <textarea
          id="roadmap"
          value={formData.roadmap}
          onChange={(e) => handleInputChange('roadmap', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="Describe your project roadmap and milestones..."
        />
        {errors.roadmap && (
          <p className="text-red-400 text-sm mt-1">{errors.roadmap}</p>
        )}
      </div>

      {/* Expected Launch Date and Blockchain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="expectedLaunchDate" className="block text-sm font-medium text-foreground mb-2">
            Expected Launch Date *
          </label>
          <input
            type="date"
            id="expectedLaunchDate"
            value={formData.expectedLaunchDate}
            onChange={(e) => handleInputChange('expectedLaunchDate', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          {errors.expectedLaunchDate && (
            <p className="text-red-400 text-sm mt-1">{errors.expectedLaunchDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="targetBlockchain" className="block text-sm font-medium text-foreground mb-2">
            Target Blockchain
          </label>
          <select
            id="targetBlockchain"
            value={formData.targetBlockchain}
            onChange={(e) => handleInputChange('targetBlockchain', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="Solana">Solana</option>
            <option value="Ethereum">Ethereum</option>
            <option value="Polygon">Polygon</option>
            <option value="Binance Smart Chain">Binance Smart Chain</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Tokenomics */}
      <div>
        <label htmlFor="tokenomics" className="block text-sm font-medium text-foreground mb-2">
          Tokenomics *
        </label>
        <textarea
          id="tokenomics"
          value={formData.tokenomics}
          onChange={(e) => handleInputChange('tokenomics', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="Describe your tokenomics, supply, distribution, etc..."
        />
        {errors.tokenomics && (
          <p className="text-red-400 text-sm mt-1">{errors.tokenomics}</p>
        )}
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-foreground mb-2">
          Website *
        </label>
        <input
          type="url"
          id="website"
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="https://yourproject.com"
        />
        {errors.website && (
          <p className="text-red-400 text-sm mt-1">{errors.website}</p>
        )}
      </div>

      {/* Social Media Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="twitter" className="block text-sm font-medium text-foreground mb-2">
            Twitter
          </label>
          <input
            type="text"
            id="twitter"
            value={formData.twitter}
            onChange={(e) => handleInputChange('twitter', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="@yourproject"
          />
        </div>

        <div>
          <label htmlFor="telegram" className="block text-sm font-medium text-foreground mb-2">
            Telegram
          </label>
          <input
            type="text"
            id="telegram"
            value={formData.telegram}
            onChange={(e) => handleInputChange('telegram', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="@yourproject"
          />
        </div>

        <div>
          <label htmlFor="discord" className="block text-sm font-medium text-foreground mb-2">
            Discord
          </label>
          <input
            type="text"
            id="discord"
            value={formData.discord}
            onChange={(e) => handleInputChange('discord', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="discord.gg/yourproject"
          />
        </div>
      </div>

      {/* Unique Value Proposition */}
      <div>
        <label htmlFor="uniqueValueProposition" className="block text-sm font-medium text-foreground mb-2">
          Unique Value Proposition *
        </label>
        <textarea
          id="uniqueValueProposition"
          value={formData.uniqueValueProposition}
          onChange={(e) => handleInputChange('uniqueValueProposition', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="What makes your project unique? What problem does it solve?"
        />
        {errors.uniqueValueProposition && (
          <p className="text-red-400 text-sm mt-1">{errors.uniqueValueProposition}</p>
        )}
      </div>

      {/* Market Potential */}
      <div>
        <label htmlFor="marketPotential" className="block text-sm font-medium text-foreground mb-2">
          Market Potential *
        </label>
        <textarea
          id="marketPotential"
          value={formData.marketPotential}
          onChange={(e) => handleInputChange('marketPotential', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 rounded-lg border border-card-border bg-secondary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="Describe the market opportunity and potential for your project..."
        />
        {errors.marketPotential && (
          <p className="text-red-400 text-sm mt-1">{errors.marketPotential}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !publicKey}
        className="w-full px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <span>🚀</span>
            <span>Submit Pre-Launch Project</span>
          </>
        )}
      </button>

      {!publicKey && (
        <p className="text-sm text-red-400 text-center">
          Please connect your wallet to submit a pre-launch project
        </p>
      )}
    </form>
  );
} 