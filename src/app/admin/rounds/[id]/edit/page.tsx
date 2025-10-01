'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetRoundByIdQuery, useUpdateRoundMutation } from '@/store/api/adminApi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Round {
  _id: string;
  round: number;
  roundName?: string;
  status: string;
  nominationStartDate: string;
  nominationEndDate: string;
  votingStartDate: string;
  votingEndDate: string;
  nominationFee: number;
  votingFee: number;
  description?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringFrequency?: number;
  recurringDayOfWeek?: number;
  recurringDayOfMonth?: number;
  recurringTime?: string;
  resultDeclarationType?: 'manual' | 'automatic';
  automaticDeclarationDelay?: number;
  completionDelay?: number;
}

export default function EditRoundPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.id as string;
  
  const [updateRound, { isLoading: isUpdating }] = useUpdateRoundMutation();
  const { data: roundResponse, isLoading: isLoadingRound, error: roundError } = useGetRoundByIdQuery(roundId, {
    // COMPLETELY DISABLE ALL AUTOMATIC BEHAVIOR
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnArg: false,
    // Add polling interval set to 0 to completely disable any polling
    pollingInterval: 0,
  });
  
  const [formData, setFormData] = useState({
    roundName: '',
    description: '',
    // Nomination period
    nominationStartDate: '',
    nominationStartTime: '',
    nominationEndDate: '',
    nominationEndTime: '',
    // Voting period
    votingStartDate: '',
    votingStartTime: '',
    votingEndDate: '',
    votingEndTime: '',
    nominationFee: '500',
    votingFee: '50',
    isRecurring: false,
    recurringPattern: 'monthly',
    recurringFrequency: '1',
    recurringDayOfWeek: '1',
    recurringDayOfMonth: '1',
    recurringTime: '19:00',
    resultDeclarationType: 'manual' as 'manual' | 'automatic',
    automaticDeclarationDelay: '30',
    completionDelay: '120'
  });

  useEffect(() => {
    if (roundResponse?.round) {
      const foundRound = roundResponse.round;
      
      // Parse dates and times for form (timezone-safe)
      const nominationStart = new Date(foundRound.nominationStartDate);
      const nominationEnd = new Date(foundRound.nominationEndDate);
      const votingStart = new Date(foundRound.votingStartDate);
      const votingEnd = new Date(foundRound.votingEndDate);
      
      // Get date in local timezone without timezone conversion
      const getLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Get time in local timezone
      const getLocalTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      
      setFormData({
        roundName: foundRound.roundName || '',
        description: foundRound.description || '',
        nominationStartDate: getLocalDate(nominationStart),
        nominationStartTime: getLocalTime(nominationStart),
        nominationEndDate: getLocalDate(nominationEnd),
        nominationEndTime: getLocalTime(nominationEnd),
        votingStartDate: getLocalDate(votingStart),
        votingStartTime: getLocalTime(votingStart),
        votingEndDate: getLocalDate(votingEnd),
        votingEndTime: getLocalTime(votingEnd),
        nominationFee: foundRound.nominationFee.toString(),
        votingFee: foundRound.votingFee.toString(),
        isRecurring: foundRound.isRecurring || false,
        recurringPattern: foundRound.recurringPattern || 'monthly',
        recurringFrequency: (foundRound.recurringFrequency || 1).toString(),
        recurringDayOfWeek: (foundRound.recurringDayOfWeek || 1).toString(),
        recurringDayOfMonth: (foundRound.recurringDayOfMonth || 1).toString(),
        recurringTime: foundRound.recurringTime || '19:00',
        resultDeclarationType: foundRound.resultDeclarationType || 'manual',
        automaticDeclarationDelay: (foundRound.automaticDeclarationDelay || 30).toString(),
        completionDelay: (foundRound.completionDelay || 120).toString()
      });
    }
  }, [roundResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundResponse?.round) return;

    try {
      console.log('🚀 Starting round update...');
      console.log('📋 Form data:', formData);
      console.log('🆔 Round ID:', roundId);

      // Validate required fields
      if (!formData.nominationStartDate || !formData.nominationStartTime || 
          !formData.nominationEndDate || !formData.nominationEndTime ||
          !formData.votingStartDate || !formData.votingStartTime ||
          !formData.votingEndDate || !formData.votingEndTime) {
        toast.error('Please fill in all required date and time fields');
        return;
      }

      // Combine nomination dates and times
      const nominationStartDateTime = new Date(`${formData.nominationStartDate}T${formData.nominationStartTime}`);
      const nominationEndDateTime = new Date(`${formData.nominationEndDate}T${formData.nominationEndTime}`);
      
      // Combine voting dates and times
      const votingStartDateTime = new Date(`${formData.votingStartDate}T${formData.votingStartTime}`);
      const votingEndDateTime = new Date(`${formData.votingEndDate}T${formData.votingEndTime}`);

      // Validate dates
      if (isNaN(nominationStartDateTime.getTime()) || isNaN(nominationEndDateTime.getTime()) ||
          isNaN(votingStartDateTime.getTime()) || isNaN(votingEndDateTime.getTime())) {
        toast.error('Invalid date/time format. Please check your inputs.');
        return;
      }

      const updateData = {
        roundName: formData.roundName || `Round ${roundResponse.round.round}`,
        nominationStartDate: nominationStartDateTime.toISOString(),
        nominationEndDate: nominationEndDateTime.toISOString(),
        votingStartDate: votingStartDateTime.toISOString(),
        votingEndDate: votingEndDateTime.toISOString(),
        nominationFee: parseFloat(formData.nominationFee) || 500,
        votingFee: parseFloat(formData.votingFee) || 50,
        description: formData.description || '',
        isRecurring: formData.isRecurring || false,
        recurringPattern: (formData.recurringPattern === 'biweekly' ? 'weekly' : formData.recurringPattern) as 'daily' | 'weekly' | 'monthly' | 'yearly',
        recurringFrequency: parseInt(formData.recurringFrequency) || 1,
        recurringDayOfWeek: parseInt(formData.recurringDayOfWeek) || 1,
        recurringDayOfMonth: parseInt(formData.recurringDayOfMonth) || 1,
        recurringTime: formData.recurringTime || '19:00',
        resultDeclarationType: formData.resultDeclarationType,
        automaticDeclarationDelay: parseInt(formData.automaticDeclarationDelay) || 30,
        completionDelay: parseInt(formData.completionDelay) || 120
      };

      console.log('📦 Update data to send:', updateData);

      // Use RTK Query mutation instead of manual fetch
      console.log('🔄 Calling updateRound mutation...');
      const result = await updateRound({ id: roundId, data: updateData }).unwrap();
      
      console.log('✅ Round updated successfully:', result);
      toast.success(result.message || 'Round updated successfully!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Add delay to ensure toast is visible before redirect
      setTimeout(() => {
        router.push('/admin/rounds');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error updating round:', error);
      console.error('❌ Error details:', {
        status: error?.status,
        data: error?.data,
        message: error?.message,
        stack: error?.stack
      });
      const errorMessage = error?.data?.error || error?.message || 'Failed to update round';
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (isLoadingRound) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground">Loading round details...</div>
      </div>
    );
  }

  if (roundError || !roundResponse?.round) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-foreground text-xl mb-4">Round Not Found</div>
          <p className="text-foreground/60 mb-4">
            The round you're looking for doesn't exist or you don't have permission to edit it.
          </p>
          <Link
            href="/admin/rounds"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            ← Back to Rounds
          </Link>
        </div>
      </div>
    );
  }

  const round = roundResponse.round;

  if (['nominating', 'voting', 'results_pending', 'results_declared', 'completed'].includes(round.status)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-foreground text-xl mb-4">Cannot Edit Active Round</div>
          <p className="text-foreground/60 mb-4">
            This round is currently {round.status} and cannot be edited.
          </p>
          <Link
            href="/admin/rounds"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            ← Back to Rounds
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      <div className="cosmic-card p-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/rounds"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            ← Back to Rounds
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Edit Round {round.round}
          </h1>
        </div>
      </div>

      <div className="cosmic-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Round Information</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Round Name
                </label>
                <input
                  type="text"
                  name="roundName"
                  value={formData.roundName}
                  onChange={handleInputChange}
                  placeholder="e.g., Round 1 - August Launch"
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add a description for this round..."
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Nomination Period */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">🏆 Nomination Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Nomination Start Date
                </label>
                <input
                  type="date"
                  name="nominationStartDate"
                  value={formData.nominationStartDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Nomination Start Time
                </label>
                <input
                  type="time"
                  name="nominationStartTime"
                  value={formData.nominationStartTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Nomination End Date
                </label>
                <input
                  type="date"
                  name="nominationEndDate"
                  value={formData.nominationEndDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Nomination End Time
                </label>
                <input
                  type="time"
                  name="nominationEndTime"
                  value={formData.nominationEndTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Voting Period */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">🗳️ Voting Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Voting Start Date
                </label>
                <input
                  type="date"
                  name="votingStartDate"
                  value={formData.votingStartDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Voting Start Time
                </label>
                <input
                  type="time"
                  name="votingStartTime"
                  value={formData.votingStartTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Voting End Date
                </label>
                <input
                  type="date"
                  name="votingEndDate"
                  value={formData.votingEndDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Voting End Time
                </label>
                <input
                  type="time"
                  name="votingEndTime"
                  value={formData.votingEndTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Fees */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">Fees (USD)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Nomination Fee
                </label>
                <input
                  type="number"
                  name="nominationFee"
                  value={formData.nominationFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Voting Fee
                </label>
                <input
                  type="number"
                  name="votingFee"
                  value={formData.votingFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Recurring Settings */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">🔄 Recurring Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-accent focus:ring-accent border-card-border rounded bg-secondary"
                />
                <label className="ml-2 block text-sm text-foreground">
                  Make this a recurring round
                </label>
              </div>
              {formData.isRecurring && (
                <div className="space-y-4 p-4 cosmic-card border border-card-border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-2">
                        Recurring Pattern
                      </label>
                      <select
                        name="recurringPattern"
                        value={formData.recurringPattern}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-2">
                        Frequency per Period
                      </label>
                      <select
                        name="recurringFrequency"
                        value={formData.recurringFrequency}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                      >
                        <option value="1">1 time</option>
                        <option value="2">2 times</option>
                        <option value="3">3 times</option>
                        <option value="4">4 times</option>
                      </select>
                    </div>
                  </div>
                  
                  {formData.recurringPattern === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-2">
                        Day of Week
                      </label>
                      <select
                        name="recurringDayOfWeek"
                        value={formData.recurringDayOfWeek}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                      >
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                        <option value="7">Sunday</option>
                      </select>
                    </div>
                  )}
                  
                  {formData.recurringPattern === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-2">
                        Day of Month
                      </label>
                      <select
                        name="recurringDayOfMonth"
                        value={formData.recurringDayOfMonth}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                      >
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      Recurring Time
                    </label>
                    <input
                      type="time"
                      name="recurringTime"
                      value={formData.recurringTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Result Declaration Settings */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">🏆 Result Declaration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Declaration Type
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="resultDeclarationType"
                      value="manual"
                      checked={formData.resultDeclarationType === 'manual'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-accent focus:ring-accent border-card-border bg-secondary"
                    />
                    <label className="ml-2 block text-sm text-foreground">
                      Manual Declaration (Admin declares results manually)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="resultDeclarationType"
                      value="automatic"
                      checked={formData.resultDeclarationType === 'automatic'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-accent focus:ring-accent border-card-border bg-secondary"
                    />
                    <label className="ml-2 block text-sm text-foreground">
                      Automatic Declaration (Results declared automatically after delay)
                    </label>
                  </div>
                </div>
              </div>
              
              {formData.resultDeclarationType === 'automatic' && (
                <div className="p-4 cosmic-card border border-card-border rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      Declaration Delay (minutes after voting ends)
                    </label>
                    <input
                      type="number"
                      name="automaticDeclarationDelay"
                      value={formData.automaticDeclarationDelay}
                      onChange={handleInputChange}
                      min="1"
                      max="1440"
                      className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                    />
                    <p className="text-xs text-foreground/60 mt-1">
                      Results will be automatically declared {formData.automaticDeclarationDelay} minutes after voting ends
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      Completion Delay (minutes after results declared)
                    </label>
                    <input
                      type="number"
                      name="completionDelay"
                      value={formData.completionDelay}
                      onChange={handleInputChange}
                      min="1"
                      max="1440"
                      className="w-full px-3 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-secondary text-foreground"
                    />
                    <p className="text-xs text-foreground/60 mt-1">
                      Round will be marked as completed {formData.completionDelay} minutes after results are declared
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-card-border">
            <Link
              href="/admin/rounds"
              className="px-4 py-2 text-foreground/80 bg-secondary rounded-md hover:bg-card-highlight transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors glow-button"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 