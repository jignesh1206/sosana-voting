'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { PreLaunchToken } from './interface';

interface PreLaunchNominationFormProps {
  onSuccess: (token: PreLaunchToken) => void;
  onCancel: () => void;
  userAddress: string;
}

export default function PreLaunchNominationForm({ onSuccess, onCancel, userAddress }: PreLaunchNominationFormProps) {
  const [formData, setFormData] = useState({
    // Basic Token Information
    tokenName: '',
    tokenSymbol: '',
    tokenLogo: '',
    tokenMintAddress: '',
    
    // Project Information
    projectDescription: '',
    goals: '',
    teamBackground: '',
    roadmap: '',
    
    // Launch Details
    expectedLaunchDate: '',
    targetBlockchain: 'Solana',
    tokenomics: '',
    
    // Social Links
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    
    // Additional Information
    uniqueValueProposition: '',
    marketPotential: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.tokenName.trim()) newErrors.tokenName = 'Token name is required';
    if (!formData.tokenSymbol.trim()) newErrors.tokenSymbol = 'Token symbol is required';
    if (!formData.tokenLogo.trim()) newErrors.tokenLogo = 'Token logo URL is required';
    if (!formData.projectDescription.trim()) newErrors.projectDescription = 'Project description is required';
    if (!formData.goals.trim()) newErrors.goals = 'Project goals are required';
    if (!formData.teamBackground.trim()) newErrors.teamBackground = 'Team background is required';
    if (!formData.roadmap.trim()) newErrors.roadmap = 'Roadmap is required';
    if (!formData.expectedLaunchDate) newErrors.expectedLaunchDate = 'Expected launch date is required';
    if (!formData.tokenomics.trim()) newErrors.tokenomics = 'Tokenomics is required';
    if (!formData.website.trim()) newErrors.website = 'Website is required';
    if (!formData.uniqueValueProposition.trim()) newErrors.uniqueValueProposition = 'Unique value proposition is required';
    if (!formData.marketPotential.trim()) newErrors.marketPotential = 'Market potential is required';

    // URL validation
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }
    if (formData.twitter && !isValidUrl(formData.twitter)) {
      newErrors.twitter = 'Please enter a valid Twitter URL';
    }
    if (formData.telegram && !isValidUrl(formData.telegram)) {
      newErrors.telegram = 'Please enter a valid Telegram URL';
    }
    if (formData.discord && !isValidUrl(formData.discord)) {
      newErrors.discord = 'Please enter a valid Discord URL';
    }

    // Date validation
    if (formData.expectedLaunchDate) {
      const launchDate = new Date(formData.expectedLaunchDate);
      const now = new Date();
      if (launchDate <= now) {
        newErrors.expectedLaunchDate = 'Expected launch date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/pre-launch/nominate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userAddress
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Pre-launch token nominated successfully!');
        onSuccess(data.token);
      } else {
        toast.error(data.error || 'Failed to nominate token');
      }
    } catch (error) {
      console.error('Error nominating token:', error);
      toast.error('Failed to nominate token');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="cosmic-card p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">🚀 Nominate Pre-launch Token</h2>
        <p className="text-foreground/60">
          Submit your upcoming token for community voting. Make sure to provide comprehensive information about your project.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Token Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-card-border pb-2">
            📋 Basic Token Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Token Name *
              </label>
              <input
                type="text"
                value={formData.tokenName}
                onChange={(e) => handleInputChange('tokenName', e.target.value)}
                className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                  errors.tokenName ? 'border-rose-500' : 'border-card-border focus:border-accent'
                }`}
                placeholder="e.g., My Awesome Token"
              />
              {errors.tokenName && <p className="text-rose-500 text-sm mt-1">{errors.tokenName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Token Symbol *
              </label>
              <input
                type="text"
                value={formData.tokenSymbol}
                onChange={(e) => handleInputChange('tokenSymbol', e.target.value.toUpperCase())}
                className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                  errors.tokenSymbol ? 'border-rose-500' : 'border-card-border focus:border-accent'
                }`}
                placeholder="e.g., MAT"
                maxLength={20}
              />
              {errors.tokenSymbol && <p className="text-rose-500 text-sm mt-1">{errors.tokenSymbol}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Token Logo URL *
              </label>
              <input
                type="url"
                value={formData.tokenLogo}
                onChange={(e) => handleInputChange('tokenLogo', e.target.value)}
                className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                  errors.tokenLogo ? 'border-rose-500' : 'border-card-border focus:border-accent'
                }`}
                placeholder="https://example.com/logo.png"
              />
              {errors.tokenLogo && <p className="text-rose-500 text-sm mt-1">{errors.tokenLogo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Token Mint Address (Optional)
              </label>
              <input
                type="text"
                value={formData.tokenMintAddress}
                onChange={(e) => handleInputChange('tokenMintAddress', e.target.value)}
                className="w-full bg-secondary/50 border border-card-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent transition-colors"
                placeholder="Future mint address"
              />
            </div>
          </div>
        </div>

        {/* Project Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-card-border pb-2">
            🎯 Project Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Project Description *
            </label>
            <textarea
              value={formData.projectDescription}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors h-24 resize-none ${
                errors.projectDescription ? 'border-rose-500' : 'border-card-border focus:border-accent'
              }`}
              placeholder="Describe your project in detail..."
              maxLength={2000}
            />
            {errors.projectDescription && <p className="text-rose-500 text-sm mt-1">{errors.projectDescription}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Project Goals *
            </label>
            <textarea
              value={formData.goals}
              onChange={(e) => handleInputChange('goals', e.target.value)}
              className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors h-24 resize-none ${
                errors.goals ? 'border-rose-500' : 'border-card-border focus:border-accent'
              }`}
              placeholder="What are the main goals of your project?"
              maxLength={1000}
            />
            {errors.goals && <p className="text-rose-500 text-sm mt-1">{errors.goals}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Team Background *
            </label>
            <textarea
              value={formData.teamBackground}
              onChange={(e) => handleInputChange('teamBackground', e.target.value)}
              className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors h-24 resize-none ${
                errors.teamBackground ? 'border-rose-500' : 'border-card-border focus:border-accent'
              }`}
              placeholder="Tell us about your team's experience and background..."
              maxLength={1000}
            />
            {errors.teamBackground && <p className="text-rose-500 text-sm mt-1">{errors.teamBackground}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Roadmap *
            </label>
            <textarea
              value={formData.roadmap}
              onChange={(e) => handleInputChange('roadmap', e.target.value)}
              className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors h-24 resize-none ${
                errors.roadmap ? 'border-rose-500' : 'border-card-border focus:border-accent'
              }`}
              placeholder="Describe your project roadmap and milestones..."
              maxLength={2000}
            />
            {errors.roadmap && <p className="text-rose-500 text-sm mt-1">{errors.roadmap}</p>}
          </div>
        </div>

        {/* Launch Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-card-border pb-2">
            🚀 Launch Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Expected Launch Date *
              </label>
              <input
                type="date"
                value={formData.expectedLaunchDate}
                onChange={(e) => handleInputChange('expectedLaunchDate', e.target.value)}
                className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                  errors.expectedLaunchDate ? 'border-rose-500' : 'border-card-border focus:border-accent'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.expectedLaunchDate && <p className="text-rose-500 text-sm mt-1">{errors.expectedLaunchDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Target Blockchain *
              </label>
              <select
                value={formData.targetBlockchain}
                onChange={(e) => handleInputChange('targetBlockchain', e.target.value)}
                className="w-full bg-secondary/50 border border-card-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent transition-colors"
              >
                <option value="Solana">Solana</option>
                <option value="Ethereum">Ethereum</option>
                <option value="Binance Smart Chain">Binance Smart Chain</option>
                <option value="Polygon">Polygon</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Tokenomics *
            </label>
            <textarea
              value={formData.tokenomics}
              onChange={(e) => handleInputChange('tokenomics', e.target.value)}
              className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors h-24 resize-none ${
                errors.tokenomics ? 'border-rose-500' : 'border-card-border focus:border-accent'
              }`}
              placeholder="Describe your tokenomics, distribution, and utility..."
              maxLength={1000}
            />
            {errors.tokenomics && <p className="text-rose-500 text-sm mt-1">{errors.tokenomics}</p>}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-card-border pb-2">
            🔗 Social Links
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Website *
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                  errors.website ? 'border-rose-500' : 'border-card-border focus:border-accent'
                }`}
                placeholder="https://yourproject.com"
              />
              {errors.website && <p className="text-rose-500 text-sm mt-1">{errors.website}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Twitter (Optional)
              </label>
              <input
                type="url"
                value={formData.twitter}
                onChange={(e) => handleInputChange('twitter', e.target.value)}
                className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                  errors.twitter ? 'border-rose-500' : 'border-card-border focus:border-accent'
                }`}
                placeholder="https://twitter.com/yourproject"
              />
              {errors.twitter && <p className="text-rose-500 text-sm mt-1">{errors.twitter}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Telegram (Optional)
              </label>
              <input
                type="url"
                value={formData.telegram}
                onChange={(e) => handleInputChange('telegram', e.target.value)}
                className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                  errors.telegram ? 'border-rose-500' : 'border-card-border focus:border-accent'
                }`}
                placeholder="https://t.me/yourproject"
              />
              {errors.telegram && <p className="text-rose-500 text-sm mt-1">{errors.telegram}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Discord (Optional)
              </label>
              <input
                type="url"
                value={formData.discord}
                onChange={(e) => handleInputChange('discord', e.target.value)}
                className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                  errors.discord ? 'border-rose-500' : 'border-card-border focus:border-accent'
                }`}
                placeholder="https://discord.gg/yourproject"
              />
              {errors.discord && <p className="text-rose-500 text-sm mt-1">{errors.discord}</p>}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-card-border pb-2">
            💡 Additional Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Unique Value Proposition *
            </label>
            <textarea
              value={formData.uniqueValueProposition}
              onChange={(e) => handleInputChange('uniqueValueProposition', e.target.value)}
              className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors h-20 resize-none ${
                errors.uniqueValueProposition ? 'border-rose-500' : 'border-card-border focus:border-accent'
              }`}
              placeholder="What makes your project unique? What problem does it solve?"
              maxLength={500}
            />
            {errors.uniqueValueProposition && <p className="text-rose-500 text-sm mt-1">{errors.uniqueValueProposition}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Market Potential *
            </label>
            <textarea
              value={formData.marketPotential}
              onChange={(e) => handleInputChange('marketPotential', e.target.value)}
              className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 focus:outline-none transition-colors h-20 resize-none ${
                errors.marketPotential ? 'border-rose-500' : 'border-card-border focus:border-accent'
              }`}
              placeholder="Describe the market opportunity and potential for growth..."
              maxLength={500}
            />
            {errors.marketPotential && <p className="text-rose-500 text-sm mt-1">{errors.marketPotential}</p>}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-card-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-card-border rounded-lg text-foreground hover:bg-secondary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Nomination'}
          </button>
        </div>
      </form>
    </div>
  );
} 