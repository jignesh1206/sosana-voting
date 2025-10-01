# Smart Contract Integration for Admin Nominations

## Overview

The admin nominations page has been updated to use dynamic nomination API from the smart contract IDL instead of REST API calls. This provides direct blockchain data access and real-time nomination information.

## Key Changes

### 1. Smart Contract Utilities (`src/utils/smartContractUtils.ts`)

Created a comprehensive utility file that handles all smart contract interactions:

- **Program Initialization**: `getSolanaProgram()` - Initializes the Anchor program with wallet and connection
- **Data Fetching**: Functions to fetch rounds, nominations, and config accounts from blockchain
- **Data Formatting**: Helper functions to convert blockchain data to display format
- **Token Metadata**: Integration with Metaplex to fetch token information

### 2. Updated Admin Nominations Page (`src/app/admin/nominations/page.tsx`)

The page now:
- Connects directly to the Solana blockchain
- Fetches nominations from smart contract accounts
- Displays real-time blockchain data
- Shows token metadata from Metaplex
- Provides better error handling and user feedback

## Smart Contract Data Structure

Based on the IDL, the following data structures are used:

### Nomination Account
```typescript
interface BlockchainNomination {
  publicKey: PublicKey;
  tokenMint: PublicKey;
  nominator: PublicKey;
  snapshotAmount: BN;
  voteCount: BN;
  voters: PublicKey[];
  isWinner: boolean;
  isClaim: boolean;
  roundAddress: PublicKey;
}
```

### Round Account
```typescript
interface BlockchainRound {
  publicKey: PublicKey;
  roundNo: BN;
  nominators: PublicKey[];
  roundStartTime: BN;
  votingStartTime: BN;
  roundEndTime: BN;
  tokenMints: PublicKey[];
  created: BN;
  winnersAddress: PublicKey[];
  isClaim: boolean;
  isPreLaunch: boolean;
}
```

## Features

### ✅ Implemented
- **Real-time Blockchain Data**: Direct access to nomination data from smart contract
- **Token Metadata**: Automatic fetching of token names and symbols from Metaplex
- **Round Filtering**: Filter nominations by specific rounds
- **Vote Tracking**: Display vote counts and winner status
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Proper loading indicators during blockchain operations

### ⚠️ Partially Implemented
- **Remove Nomination**: UI exists but requires smart contract instruction implementation

### 🔄 Future Enhancements
- **Remove Nomination**: Add smart contract instruction for admin nomination removal
- **Real-time Updates**: WebSocket connection for live updates
- **Batch Operations**: Bulk nomination management
- **Advanced Filtering**: Filter by token type, date range, etc.

## Usage

### Prerequisites
1. **Wallet Connection**: User must have a Solana wallet connected
2. **Program ID**: Environment variable `NEXT_PUBLIC_PROGRAM_ID` must be set
3. **Network Access**: Connection to Solana RPC endpoint

### How to Use
1. Navigate to `/admin/nominations`
2. Connect your Solana wallet
3. View nominations from the blockchain
4. Filter by rounds using the dropdown
5. Refresh data using the refresh button

## Technical Implementation

### Program Initialization
```typescript
const program = getSolanaProgram(wallet, connection);
```

### Fetching Nominations
```typescript
// All nominations
const nominations = await fetchBlockchainNominations(program);

// By round
const roundNominations = await fetchNominationsByRound(program, roundAddress);
```

### Token Metadata
```typescript
const metadata = await getTokenMetadata(connection, tokenMint);
```

## Error Handling

The system handles various error scenarios:
- **Wallet Not Connected**: Shows connection prompt
- **Smart Contract Errors**: Displays error messages with retry options
- **Network Issues**: Graceful degradation with user feedback
- **Metadata Failures**: Falls back to default values

## Environment Variables

Required environment variables:
```env
NEXT_PUBLIC_PROGRAM_ID=your_program_id_here
```

## Dependencies

The integration uses these key dependencies:
- `@project-serum/anchor`: Solana program interaction
- `@solana/web3.js`: Solana blockchain utilities
- `@metaplex-foundation/js`: Token metadata fetching
- `react-toastify`: User notifications

## Security Considerations

- **Wallet Authentication**: All operations require wallet connection
- **Admin Verification**: Smart contract enforces admin permissions
- **Data Validation**: All blockchain data is validated before display
- **Error Boundaries**: Prevents application crashes from blockchain errors

## Performance Optimizations

- **Lazy Loading**: Token metadata fetched on-demand
- **Caching**: Program instance reused across operations
- **Batch Operations**: Multiple nominations processed efficiently
- **Error Recovery**: Graceful handling of failed operations

## Troubleshooting

### Common Issues

1. **"Wallet Not Connected"**
   - Ensure wallet is connected and authorized
   - Check wallet adapter configuration

2. **"Failed to connect to smart contract"**
   - Verify `NEXT_PUBLIC_PROGRAM_ID` is set correctly
   - Check network connection to Solana RPC

3. **"No nominations found"**
   - Verify smart contract has nomination data
   - Check if rounds exist on blockchain

4. **Token metadata not loading**
   - Network issues with Metaplex
   - Token may not have metadata account

### Debug Information

Enable debug logging by checking browser console for detailed error messages and blockchain interaction logs.

## Future Roadmap

1. **Smart Contract Enhancements**
   - Add remove nomination instruction
   - Implement batch operations
   - Add nomination validation rules

2. **UI/UX Improvements**
   - Real-time updates via WebSocket
   - Advanced filtering and search
   - Export functionality

3. **Performance Optimizations**
   - Implement data caching
   - Optimize metadata fetching
   - Add pagination for large datasets

