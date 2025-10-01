# Token Configuration

## Current Token Address
The vesting system is now configured to use the token address:
```
ENq17x3cvYuh58Xy6wtjQCt9Vv3z6RAPwoNTnCeCvEku
```

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```bash
# Token Configuration
NEXT_PUBLIC_TOKEN_MINT=ENq17x3cvYuh58Xy6wtjQCt9Vv3z6RAPwoNTnCeCvEku

# Program IDs
NEXT_PUBLIC_VESTING_PROGRAM_ID=your_vesting_program_id_here
NEXT_PUBLIC_TOKEN_2022_PROGRAM_ID=your_token_2022_program_id_here

# Team Account
NEXT_PUBLIC_TEAM_ACCOUNT=your_team_account_public_key_here

# Other Program IDs (if needed)
NEXT_PUBLIC_PROGRAM_ID=your_main_program_id_here
```

## Fallback Configuration

If the `NEXT_PUBLIC_TOKEN_MINT` environment variable is not set, the system will automatically use the hardcoded token address `ENq17x3cvYuh58Xy6wtjQCt9Vv3z6RAPwoNTnCeCvEku` as a fallback.

## Updated Files

The following files have been updated to use the new token address:

1. `src/utils/vestingUtils.ts` - Added `DEFAULT_TOKEN_MINT` and `getTokenMintAddress()` function
2. `src/components/admin/VestingTokenManagement.tsx` - Updated to use the new token mint function

## Testing

The vesting system will now use the specified token address for all operations including:
- Token account creation
- Vesting initialization
- Token withdrawals
- User claims

Make sure to restart your development server after setting the environment variables.
