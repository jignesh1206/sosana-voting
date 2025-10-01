// Example usage of the custom getOrCreateAssociatedTokenAccount functions

import { Connection, PublicKey } from "@solana/web3.js";
import { 
  getOrCreateAssociatedTokenAccountCustom, 
  getOrCreateFeeVaultTokenAccount,
  getOrCreateAssociatedTokenAccountEnhanced,
  getOrCreateUserATA,
  getOrCreateUserATACustom,
  getOrCreateUserATATokenClass,
  getOrCreateUserATATokenClassEnhanced,
  TokenAccountUtils 
} from "../utils/vestingUtils";

// Example 1: Basic usage with your original pattern
export const example1_BasicUsage = async (
  connection: Connection,
  feeVault: { publicKey: PublicKey },
  withdrawWithheldAuthority: any,
  tokenMint: PublicKey
) => {
  try {
    const tokenAccount = await getOrCreateFeeVaultTokenAccount(
      connection,
      feeVault,
      withdrawWithheldAuthority,
      tokenMint
    );
    
    console.log('Fee vault token account:', tokenAccount.toString());
    return tokenAccount;
  } catch (error) {
    console.error('Error creating fee vault token account:', error);
    throw error;
  }
};

// Example 2: Using the generic custom function
export const example2_GenericUsage = async (
  connection: Connection,
  owner: { publicKey: PublicKey },
  payer: any,
  tokenMint: PublicKey
) => {
  try {
    const tokenAccount = await getOrCreateAssociatedTokenAccountCustom(
      connection,
      owner,
      payer,
      tokenMint
    );
    
    console.log('Token account:', tokenAccount.toString());
    return tokenAccount;
  } catch (error) {
    console.error('Error creating token account:', error);
    throw error;
  }
};

// Example 3: Using the enhanced version with options
export const example3_EnhancedUsage = async (
  connection: Connection,
  owner: { publicKey: PublicKey },
  payer: any,
  tokenMint: PublicKey
) => {
  try {
    const result = await getOrCreateAssociatedTokenAccountEnhanced(
      connection,
      owner,
      payer,
      tokenMint,
      {
        skipPreflight: true,
        preflightCommitment: 'confirmed'
      }
    );
    
    console.log('Token account:', result.address.toString());
    console.log('Was newly created:', result.isNew);
    return result;
  } catch (error) {
    console.error('Error creating enhanced token account:', error);
    throw error;
  }
};

// Example 4: Using the utility object
export const example4_UtilityUsage = async (
  connection: Connection,
  owner: { publicKey: PublicKey },
  payer: any,
  tokenMint: PublicKey
) => {
  try {
    // Using the basic utility
    const basicAccount = await TokenAccountUtils.getOrCreate(
      connection,
      owner,
      payer,
      tokenMint
    );
    
    // Using the enhanced utility
    const enhancedResult = await TokenAccountUtils.getOrCreateEnhanced(
      connection,
      owner,
      payer,
      tokenMint,
      { skipPreflight: false }
    );
    
    console.log('Basic account:', basicAccount.toString());
    console.log('Enhanced account:', enhancedResult.address.toString());
    console.log('Was newly created:', enhancedResult.isNew);
    
    return { basicAccount, enhancedResult };
  } catch (error) {
    console.error('Error using utility functions:', error);
    throw error;
  }
};

// Example 5: Complete workflow with error handling
export const example5_CompleteWorkflow = async (
  connection: Connection,
  feeVault: { publicKey: PublicKey },
  withdrawWithheldAuthority: any,
  tokenMint: PublicKey
) => {
  console.log('Starting token account creation workflow...');
  
  try {
    // Check if account exists first
    const existingAccounts = await connection.getTokenAccountsByOwner(
      feeVault.publicKey,
      { programId: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'), mint: tokenMint }
    );
    
    if (existingAccounts.value.length > 0) {
      console.log('Found existing token account');
      const existingAccount = new PublicKey(existingAccounts.value[0].pubkey);
      console.log('Existing account:', existingAccount.toString());
      return existingAccount;
    }
    
    // Create new account if none exists
    console.log('No existing account found, creating new one...');
    const newAccount = await getOrCreateFeeVaultTokenAccount(
      connection,
      feeVault,
      withdrawWithheldAuthority,
      tokenMint
    );
    
    console.log('Successfully created token account:', newAccount.toString());
    return newAccount;
    
  } catch (error) {
    console.error('Workflow failed:', error);
    throw new Error(`Token account workflow failed: ${error.message}`);
  }
};

// Example 6: User ATA creation (standard method)
export const example6_UserATAStandard = async (
  connection: Connection,
  wallet: any,
  mintAddress: string
) => {
  try {
    const tokenAccountAddress = await getOrCreateUserATA(
      connection,
      wallet,
      mintAddress
    );
    
    console.log('User ATA address:', tokenAccountAddress);
    return tokenAccountAddress;
  } catch (error) {
    console.error('Error creating user ATA:', error);
    throw error;
  }
};

// Example 7: User ATA creation with custom pattern
export const example7_UserATACustom = async (
  connection: Connection,
  wallet: any,
  mintAddress: string
) => {
  try {
    const tokenAccountAddress = await getOrCreateUserATACustom(
      connection,
      wallet,
      mintAddress
    );
    
    console.log('User ATA address (custom):', tokenAccountAddress);
    return tokenAccountAddress;
  } catch (error) {
    console.error('Error creating user ATA (custom):', error);
    throw error;
  }
};

// Example 8: Using utility object for user ATA
export const example8_UserATAUtility = async (
  connection: Connection,
  wallet: any,
  mintAddress: string
) => {
  try {
    // Standard method
    const standardATA = await TokenAccountUtils.getUserATA(
      connection,
      wallet,
      mintAddress
    );
    
    // Custom method
    const customATA = await TokenAccountUtils.getUserATACustom(
      connection,
      wallet,
      mintAddress
    );
    
    console.log('Standard ATA:', standardATA);
    console.log('Custom ATA:', customATA);
    
    return { standardATA, customATA };
  } catch (error) {
    console.error('Error using utility for user ATA:', error);
    throw error;
  }
};

// Example 9: Complete user workflow
export const example9_CompleteUserWorkflow = async (
  connection: Connection,
  wallet: any,
  mintAddress: string
) => {
  console.log('Starting user ATA creation workflow...');
  
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Check if user already has a token account
    const mintPubkey = new PublicKey(mintAddress);
    const existingAccounts = await connection.getTokenAccountsByOwner(
      wallet.publicKey,
      { 
        programId: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'), 
        mint: mintPubkey 
      }
    );
    
    if (existingAccounts.value.length > 0) {
      console.log('User already has a token account for this mint');
      const existingAccount = new PublicKey(existingAccounts.value[0].pubkey);
      console.log('Existing account:', existingAccount.toString());
      return existingAccount.toString();
    }
    
    // Create new ATA if none exists
    console.log('Creating new user ATA...');
    const newATA = await getOrCreateUserATACustom(
      connection,
      wallet,
      mintAddress
    );
    
    console.log('Successfully created user ATA:', newATA);
    return newATA;
    
  } catch (error) {
    console.error('User ATA workflow failed:', error);
    throw new Error(`User ATA workflow failed: ${error.message}`);
  }
};

// Example 10: Token class approach (legacy method)
export const example10_TokenClassApproach = async (
  connection: Connection,
  wallet: any,
  mintAddress: string,
  useToken2022: boolean = false
) => {
  try {
    const tokenAccountAddress = await getOrCreateUserATATokenClass(
      connection,
      wallet,
      mintAddress,
      useToken2022
    );
    
    console.log('Token class - Account address:', tokenAccountAddress);
    return tokenAccountAddress;
  } catch (error) {
    console.error('Error with Token class approach:', error);
    throw error;
  }
};

// Example 11: Enhanced Token class approach
export const example11_TokenClassEnhanced = async (
  connection: Connection,
  wallet: any,
  mintAddress: string
) => {
  try {
    const result = await getOrCreateUserATATokenClassEnhanced(
      connection,
      wallet,
      mintAddress,
      {
        useToken2022: true,
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      }
    );
    
    console.log('Enhanced Token class - Address:', result.address);
    console.log('Enhanced Token class - Account info:', result.accountInfo);
    return result;
  } catch (error) {
    console.error('Error with enhanced Token class approach:', error);
    throw error;
  }
};

// Example 12: Using utility object for Token class methods
export const example12_TokenClassUtility = async (
  connection: Connection,
  wallet: any,
  mintAddress: string
) => {
  try {
    // Standard Token class method
    const standardResult = await TokenAccountUtils.getUserATATokenClass(
      connection,
      wallet,
      mintAddress,
      false // useToken2022 = false
    );
    
    // Enhanced Token class method
    const enhancedResult = await TokenAccountUtils.getUserATATokenClassEnhanced(
      connection,
      wallet,
      mintAddress,
      {
        useToken2022: true,
        skipPreflight: true
      }
    );
    
    console.log('Standard Token class:', standardResult);
    console.log('Enhanced Token class:', enhancedResult.address);
    
    return { standardResult, enhancedResult };
  } catch (error) {
    console.error('Error using Token class utility functions:', error);
    throw error;
  }
};

// Example 13: Complete comparison of all methods
export const example13_AllMethodsComparison = async (
  connection: Connection,
  wallet: any,
  mintAddress: string
) => {
  console.log('Testing all token account creation methods...');
  
  const results = {};
  
  try {
    // Method 1: Standard @solana/spl-token
    try {
      results.standard = await getOrCreateUserATA(connection, wallet, mintAddress);
      console.log('✅ Standard method succeeded');
    } catch (error) {
      results.standard = `Failed: ${error.message}`;
      console.log('❌ Standard method failed:', error.message);
    }
    
    // Method 2: Custom with account checking
    try {
      results.custom = await getOrCreateUserATACustom(connection, wallet, mintAddress);
      console.log('✅ Custom method succeeded');
    } catch (error) {
      results.custom = `Failed: ${error.message}`;
      console.log('❌ Custom method failed:', error.message);
    }
    
    // Method 3: Token class (legacy)
    try {
      results.tokenClass = await getOrCreateUserATATokenClass(connection, wallet, mintAddress, false);
      console.log('✅ Token class method succeeded');
    } catch (error) {
      results.tokenClass = `Failed: ${error.message}`;
      console.log('❌ Token class method failed:', error.message);
    }
    
    // Method 4: Enhanced Token class
    try {
      const enhancedResult = await getOrCreateUserATATokenClassEnhanced(connection, wallet, mintAddress);
      results.enhancedTokenClass = enhancedResult.address;
      console.log('✅ Enhanced Token class method succeeded');
    } catch (error) {
      results.enhancedTokenClass = `Failed: ${error.message}`;
      console.log('❌ Enhanced Token class method failed:', error.message);
    }
    
    console.log('All methods comparison results:', results);
    return results;
    
  } catch (error) {
    console.error('Error in comparison:', error);
    throw error;
  }
};
