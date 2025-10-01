# Team Vesting Setup Guide

## Issue: Team Vesting Start Time Not Showing

The team vesting start time countdown is not displaying because the team vesting system requires proper initialization and environment configuration.

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Team Vesting Configuration
NEXT_PUBLIC_TEAM_ACCOUNT=your_team_account_public_key_here
NEXT_PUBLIC_VESTING_PROGRAM_ID=your_vesting_program_id_here
NEXT_PUBLIC_TOKEN_2022_PROGRAM_ID=your_token_2022_program_id_here
NEXT_PUBLIC_TOKEN_MINT=your_token_mint_here
```

## Steps to Fix

### 1. Initialize Team Vesting (Admin Required)

The team vesting must be initialized by an admin through the admin panel:

1. Go to `/admin/vesting`
2. Click "Initialize" on the Team Vesting card
3. Set the total tokens and start time
4. Complete the transaction

### 2. Set Environment Variables

After initialization, you'll get a team account public key. Add it to your environment:

```bash
NEXT_PUBLIC_TEAM_ACCOUNT=ABC123...XYZ789
```

### 3. Restart Development Server

```bash
npm run dev
# or
yarn dev
```

## What the Fix Does

The updated code now:

1. **Shows clear error messages** when team vesting is not properly configured
2. **Displays debug information** in development mode
3. **Provides helpful setup instructions** for missing environment variables
4. **Shows vesting schedule info** when team data is not available
5. **Handles all edge cases** gracefully

## Debug Information

In development mode, you'll see a debug panel showing:
- Team Account Environment Variable status
- Team Data loading status
- Vesting start time
- Current timestamp

## Expected Behavior

Once properly configured, you should see:

- **Before vesting starts**: Countdown timer showing time until vesting begins
- **After vesting starts**: "Vesting Active" status with start date
- **Whitelisted users**: Claim button and vesting status information
- **Non-whitelisted users**: "Not Eligible for Airdrop" message with eligibility criteria
- **Error states**: Clear error messages with setup instructions

## Whitelist Requirements

Users must be whitelisted to participate in team vesting airdrops:

1. **Admin adds user to whitelist** via admin panel
2. **User must hold minimum $50 worth of SOSANA** at snapshot time
3. **Complete required community tasks** (voting, referrals, etc.)
4. **Follow official announcements** for specific eligibility criteria

### For Non-Whitelisted Users

The system will show:
- ❌ "Not Eligible for Airdrop" message
- 📋 Eligibility requirements checklist
- 🚫 Disabled claim button
- ℹ️ Information about how to become eligible

## Troubleshooting

### "NEXT_PUBLIC_TEAM_ACCOUNT environment variable not set"
- Add the environment variable to `.env.local`
- Restart the development server

### "Team vesting account not found or not initialized"
- Team vesting needs to be initialized by admin
- Check admin panel at `/admin/vesting`

### Still not working?
- Check browser console for detailed error logs
- Verify all environment variables are set correctly
- Ensure the team account was properly initialized on-chain
