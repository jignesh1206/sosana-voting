# Vesting Token Management

This document describes the vesting token management functionality implemented in the admin panel.

## Overview

The vesting system allows the admin to manage token vesting schedules for four different categories:
- **Team Vesting**: For team member token allocations
- **Marketing Vesting**: For marketing and promotional token allocations
- **Liquidity Vesting**: For liquidity pool token allocations
- **Reserve Treasury Vesting**: For treasury and reserve token allocations

## Features

### 1. Vesting Initialization
- Initialize vesting schedules with total tokens and decimals
- Supports all four vesting types
- Uses the following Solana program functions:
  - `initializeTeamVesting(totalTokens, decimals)`
  - `initializeMarketingVesting(totalTokens, decimals)`
  - `initializeLiquidityVesting(totalTokens, decimals)`
  - `initializeReserveTreasuryVesting(totalTokens, decimals)`

### 2. Token Withdrawal
- Withdraw tokens according to vesting rules
- Only available after 6-month cliff period
- Monthly vesting schedule enforcement
- Uses the following Solana program functions:
  - `ownerWithdrawToken(amount)` (Team vesting)
  - `ownerMarketingWithdrawToken(amount)` (Marketing vesting)
  - `ownerLiquidityWithdrawToken(amount)` (Liquidity vesting)
  - `ownerReserveTreasuryWithdrawToken(amount)` (Reserve Treasury vesting)

### 3. Vesting Rules
- **6-month cliff period**: No tokens can be withdrawn during the first 6 months
- **Linear vesting**: Tokens are released linearly over 24 months after the cliff
- **Monthly releases**: Tokens are released monthly after the cliff period
- **Owner-only withdrawals**: Only the contract owner can withdraw tokens

### 4. Account Details Display
Each vesting account shows:
- Total tokens allocated
- Remaining tokens
- Start time (when vesting began)
- Last release month
- Available amount for withdrawal (if eligible)

## UI Components

### VestingTokenManagement
Main component that orchestrates the vesting management interface.

### VestingCard
Individual card component for each vesting type showing:
- Account status (Not Initialized / Cliff Period Active / Available for Withdrawal)
- Account details in a clean card layout
- Action buttons for initialization or withdrawal

### VestingInitForm
Modal form for initializing vesting schedules with:
- Total tokens input
- Token decimals input
- Vesting schedule information
- Validation and error handling

### VestingWithdrawForm
Modal form for withdrawing tokens with:
- Available amount display
- Withdrawal amount input with MAX button
- Vesting rules information
- Validation and error handling

## API Integration

The system integrates with the backend through the following API endpoints:

### GET /api/admin/vesting/accounts
Fetches all vesting account data.

### POST /api/admin/vesting/team/init
Initializes team vesting.

### POST /api/admin/vesting/marketing/init
Initializes marketing vesting.

### POST /api/admin/vesting/liquidity/init
Initializes liquidity vesting.

### POST /api/admin/vesting/reserve-treasury/init
Initializes reserve treasury vesting.

### POST /api/admin/vesting/team/withdraw
Withdraws tokens from team vesting.

### POST /api/admin/vesting/marketing/withdraw
Withdraws tokens from marketing vesting.

### POST /api/admin/vesting/liquidity/withdraw
Withdraws tokens from liquidity vesting.

### POST /api/admin/vesting/reserve-treasury/withdraw
Withdraws tokens from reserve treasury vesting.

## Usage

1. Navigate to the admin panel
2. Click on "Vesting" in the sidebar
3. View the current status of all vesting accounts
4. For uninitialized accounts:
   - Click "Initialize Vesting"
   - Enter total tokens and decimals
   - Confirm initialization
5. For initialized accounts:
   - If cliff period is active, wait for 6 months
   - If eligible for withdrawal, click "Withdraw Tokens"
   - Enter withdrawal amount (or use MAX)
   - Confirm withdrawal

## Security Considerations

- Only contract owners can initialize and withdraw from vesting
- Vesting rules are enforced at the smart contract level
- Withdrawal amounts are validated against available tokens
- All transactions require wallet signature

## Error Handling

The system handles various error scenarios:
- Network connectivity issues
- Insufficient token balances
- Invalid withdrawal amounts
- Cliff period violations
- Smart contract errors

## Future Enhancements

Potential improvements could include:
- Vesting schedule customization
- Multiple beneficiary support
- Vesting schedule visualization
- Historical transaction tracking
- Automated vesting notifications
