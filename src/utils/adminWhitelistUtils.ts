import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN, web3 } from "@project-serum/anchor";
import { PublicKey, Connection, Transaction } from "@solana/web3.js";
import vestingIdl from "../contracts/vesting.json";

// Whitelist management interface
export interface WhitelistUser {
  address: string;
  total: number;
  claim: number;
  remain: number;
  lastWithdrawAt: number;
  lastWithdrawTreasuryAt: number;
}

export interface AddUserToWhitelistParams {
  userAddress: string;
  totalTokens: number;
}

export interface RemoveUserFromWhitelistParams {
  userAddress: string;
}

// Generate whitelist PDA for a user
export const getWhiteListPDA = (userAddress: PublicKey) => {
  const [whitelistPda, whitelistBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("sosana_user_whitelist"), userAddress.toBuffer()],
    new PublicKey(vestingIdl.metadata?.address || "")
  );
  return { whitelistPda, whitelistBump };
};

// Generate config PDA
export const getConfigPDA = () => {
  const [configPda, configBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("sosana_config")],
    new PublicKey(vestingIdl.metadata?.address || "")
  );
  return { configPda, configBump };
};

/**
 * Add a user to the whitelist
 * @param program - Anchor program instance
 * @param userAddress - User's public key as string
 * @param totalTokens - Total tokens to allocate to user
 * @returns Promise<string> - Transaction signature
 */
export const addUserToWhitelist = async (
  program: Program,
  userAddress: string,
  totalTokens: number
): Promise<string> => {
  try {
    const userPubkey = new PublicKey(userAddress);
    const { whitelistPda } = getWhiteListPDA(userPubkey);
    const { configPda } = getConfigPDA();

    console.log('Adding user to whitelist:', {
      userAddress,
      totalTokens,
      whitelistPda: whitelistPda.toString(),
      configPda: configPda.toString()
    });

    const tx = await program.methods
      .addUserWhiteList(
        userPubkey,
        new BN(totalTokens)
      )
      .accounts({
        whiteList: whitelistPda,
        config: configPda,
        owner: program.provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    console.log('User added to whitelist successfully:', tx);
    return tx;
  } catch (error) {
    console.error('Error adding user to whitelist:', error);
    throw error;
  }
};

/**
 * Remove a user from the whitelist
 * @param program - Anchor program instance
 * @param userAddress - User's public key as string
 * @returns Promise<string> - Transaction signature
 */
export const removeUserFromWhitelist = async (
  program: Program,
  userAddress: string
): Promise<string> => {
  try {
    const userPubkey = new PublicKey(userAddress);
    const { whitelistPda } = getWhiteListPDA(userPubkey);
    const { configPda } = getConfigPDA();

    console.log('Removing user from whitelist:', {
      userAddress,
      whitelistPda: whitelistPda.toString(),
      configPda: configPda.toString()
    });

    const tx = await program.methods
      .removeUserWhiteList()
      .accounts({
        whiteList: whitelistPda,
        config: configPda,
        owner: program.provider.wallet.publicKey
      })
      .rpc();

    console.log('User removed from whitelist successfully:', tx);
    return tx;
  } catch (error) {
    console.error('Error removing user from whitelist:', error);
    throw error;
  }
};

/**
 * Fetch all whitelisted users (requires admin access)
 * @param program - Anchor program instance
 * @returns Promise<WhitelistUser[]> - Array of whitelisted users
 */
export const fetchAllWhitelistedUsers = async (
  program: Program
): Promise<WhitelistUser[]> => {
  try {
    const whitelistAccounts = await program.account.whiteList.all();
    
    const users: WhitelistUser[] = whitelistAccounts.map(account => ({
      address: account.account.userAddress.toString(),
      total: account.account.total.toNumber(),
      claim: account.account.claim.toNumber(),
      remain: account.account.remain.toNumber(),
      lastWithdrawAt: account.account.lastWithdrawAt.toNumber(),
      lastWithdrawTreasuryAt: account.account.lastWithdrawTreasuryAt.toNumber()
    }));

    console.log('Fetched whitelisted users:', users);
    return users;
  } catch (error) {
    console.error('Error fetching whitelisted users:', error);
    throw error;
  }
};

/**
 * Check if a user is whitelisted
 * @param program - Anchor program instance
 * @param userAddress - User's public key as string
 * @returns Promise<boolean> - Whether user is whitelisted
 */
export const isUserWhitelisted = async (
  program: Program,
  userAddress: string
): Promise<boolean> => {
  try {
    const userPubkey = new PublicKey(userAddress);
    const { whitelistPda } = getWhiteListPDA(userPubkey);
    
    const whitelistAccount = await program.account.whiteList.fetch(whitelistPda);
    return whitelistAccount !== null;
  } catch (error) {
    console.log('User not whitelisted or account not found:', error);
    return false;
  }
};

/**
 * Get whitelist user data
 * @param program - Anchor program instance
 * @param userAddress - User's public key as string
 * @returns Promise<WhitelistUser | null> - User's whitelist data or null if not found
 */
export const getWhitelistUserData = async (
  program: Program,
  userAddress: string
): Promise<WhitelistUser | null> => {
  try {
    const userPubkey = new PublicKey(userAddress);
    const { whitelistPda } = getWhiteListPDA(userPubkey);
    
    const whitelistAccount = await program.account.whiteList.fetch(whitelistPda);
    
    return {
      address: whitelistAccount.userAddress.toString(),
      total: whitelistAccount.total.toNumber(),
      claim: whitelistAccount.claim.toNumber(),
      remain: whitelistAccount.remain.toNumber(),
      lastWithdrawAt: whitelistAccount.lastWithdrawAt.toNumber(),
      lastWithdrawTreasuryAt: whitelistAccount.lastWithdrawTreasuryAt.toNumber()
    };
  } catch (error) {
    console.log('User not whitelisted or account not found:', error);
    return null;
  }
};

/**
 * Batch add multiple users to whitelist
 * @param program - Anchor program instance
 * @param users - Array of users to add
 * @returns Promise<string[]> - Array of transaction signatures
 */
export const batchAddUsersToWhitelist = async (
  program: Program,
  users: AddUserToWhitelistParams[]
): Promise<string[]> => {
  const signatures: string[] = [];
  
  for (const user of users) {
    try {
      const signature = await addUserToWhitelist(
        program,
        user.userAddress,
        user.totalTokens
      );
      signatures.push(signature);
      console.log(`Added user ${user.userAddress} with signature: ${signature}`);
    } catch (error) {
      console.error(`Failed to add user ${user.userAddress}:`, error);
      throw error;
    }
  }
  
  return signatures;
};

/**
 * Batch remove multiple users from whitelist
 * @param program - Anchor program instance
 * @param userAddresses - Array of user addresses to remove
 * @returns Promise<string[]> - Array of transaction signatures
 */
export const batchRemoveUsersFromWhitelist = async (
  program: Program,
  userAddresses: string[]
): Promise<string[]> => {
  const signatures: string[] = [];
  
  for (const userAddress of userAddresses) {
    try {
      const signature = await removeUserFromWhitelist(program, userAddress);
      signatures.push(signature);
      console.log(`Removed user ${userAddress} with signature: ${signature}`);
    } catch (error) {
      console.error(`Failed to remove user ${userAddress}:`, error);
      throw error;
    }
  }
  
  return signatures;
};

// Export all functions as a module
export const AdminWhitelistUtils = {
  addUserToWhitelist,
  removeUserFromWhitelist,
  fetchAllWhitelistedUsers,
  isUserWhitelisted,
  getWhitelistUserData,
  batchAddUsersToWhitelist,
  batchRemoveUsersFromWhitelist,
  getWhiteListPDA,
  getConfigPDA
};
