# Admin Whitelist Management

This module provides comprehensive whitelist management functionality for the Sosana vesting system.

## Features

### Core Functions
- **Add User to Whitelist**: Add individual users with specified token amounts
- **Remove User from Whitelist**: Remove users from the whitelist
- **Batch Operations**: Add or remove multiple users at once
- **View Whitelisted Users**: Display all whitelisted users with their details
- **Check User Status**: Verify if a user is whitelisted

### Components

#### AdminDashboard
Main admin interface with tabbed navigation for different admin functions.

#### WhitelistManagement
Comprehensive whitelist management interface with:
- Single user add/remove forms
- Batch operations support
- User list with selection capabilities
- Real-time status updates

### Hooks

#### useWhitelistManagement
Custom React hook that provides:
- State management for whitelist operations
- Error and success message handling
- Loading states
- All CRUD operations for whitelist management

### Utilities

#### vestingUtils.ts
Extended with admin functions:
- `addUserToWhitelist()` - Add single user
- `removeUserFromWhitelist()` - Remove single user
- `fetchAllWhitelistedUsers()` - Get all whitelisted users
- `isUserWhitelisted()` - Check user status
- `batchAddUsersToWhitelist()` - Batch add users
- `batchRemoveUsersFromWhitelist()` - Batch remove users

#### adminWhitelistUtils.ts
Standalone admin utilities with the same functionality as above.

## Usage

### Basic Setup
```tsx
import { AdminDashboard } from './components/admin';

function App() {
  return <AdminDashboard />;
}
```

### Using the Hook
```tsx
import { useWhitelistManagement } from './hooks/useWhitelistManagement';

function MyComponent({ program }) {
  const {
    whitelistedUsers,
    loading,
    error,
    success,
    addUser,
    removeUser,
    fetchUsers
  } = useWhitelistManagement(program);

  // Use the hook functions...
}
```

### Direct Function Usage
```tsx
import { addUserToWhitelist, removeUserFromWhitelist } from './utils/vestingUtils';

// Add user
await addUserToWhitelist(program, userAddress, totalTokens);

// Remove user
await removeUserFromWhitelist(program, userAddress);
```

## Security Considerations

- All admin functions require proper wallet connection
- Only authorized administrators should have access
- All transactions are signed by the connected wallet
- Error handling prevents unauthorized operations

## Error Handling

The system includes comprehensive error handling for:
- Invalid user addresses
- Insufficient permissions
- Network errors
- Transaction failures
- Invalid token amounts

## UI Features

- Responsive design
- Real-time updates
- Batch selection
- Transaction confirmations
- Error and success messages
- Loading states
- User-friendly token amount formatting

## Integration

The whitelist management system integrates seamlessly with:
- Solana wallet adapters
- Anchor framework
- Existing vesting utilities
- React state management
