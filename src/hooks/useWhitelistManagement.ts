import { useState, useCallback } from 'react';
import { Program } from '@project-serum/anchor';
import {
  addUserToWhitelist,
  removeUserFromWhitelist,
  fetchAllWhitelistedUsers,
  isUserWhitelisted,
  batchAddUsersToWhitelist,
  batchRemoveUsersFromWhitelist,
  WhiteList
} from '../utils/vestingUtils';

interface WhitelistUser {
  publicKey: string;
  address: string;
  total: number;
  claim: number;
  remain: number;
  lastWithdrawAt: number;
  lastWithdrawTreasuryAt: number;
}

interface UseWhitelistManagementReturn {
  whitelistedUsers: WhitelistUser[];
  loading: boolean;
  error: string | null;
  success: string | null;
  addUser: (userAddress: string, totalTokens: number) => Promise<void>;
  removeUser: (userAddress: string) => Promise<void>;
  batchAddUsers: (users: Array<{ userAddress: string; totalTokens: number }>) => Promise<void>;
  batchRemoveUsers: (userAddresses: string[]) => Promise<void>;
  fetchUsers: () => Promise<void>;
  checkUserWhitelisted: (userAddress: string) => Promise<boolean>;
  clearMessages: () => void;
}

export const useWhitelistManagement = (program: Program | null): UseWhitelistManagementReturn => {
  const [whitelistedUsers, setWhitelistedUsers] = useState<WhitelistUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!program) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const users = await fetchAllWhitelistedUsers(program);
      const formattedUsers: WhitelistUser[] = users.map(user => ({
        publicKey: user.publicKey,
        address: user.account.userAddress.toString(),
        total: user.account.total.toNumber(),
        claim: user.account.claim.toNumber(),
        remain: user.account.remain.toNumber(),
        lastWithdrawAt: user.account.lastWithdrawAt.toNumber(),
        lastWithdrawTreasuryAt: user.account.lastWithdrawTreasuryAt.toNumber()
      }));
      setWhitelistedUsers(formattedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch whitelisted users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [program]);

  const addUser = useCallback(async (userAddress: string, totalTokens: number) => {
    if (!program) {
      setError('Program not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const signature = await addUserToWhitelist(program, userAddress, totalTokens);
      setSuccess(`User added successfully! Transaction: ${signature}`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [program, fetchUsers]);

  const removeUser = useCallback(async (userAddress: string) => {
    if (!program) {
      setError('Program not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const signature = await removeUserFromWhitelist(program, userAddress);
      setSuccess(`User removed successfully! Transaction: ${signature}`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to remove user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [program, fetchUsers]);

  const batchAddUsers = useCallback(async (users: Array<{ userAddress: string; totalTokens: number }>) => {
    if (!program) {
      setError('Program not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const signatures = await batchAddUsersToWhitelist(program, users);
      setSuccess(`Batch add completed! ${signatures.length} transactions processed`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to batch add users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [program, fetchUsers]);

  const batchRemoveUsers = useCallback(async (userAddresses: string[]) => {
    if (!program) {
      setError('Program not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const signatures = await batchRemoveUsersFromWhitelist(program, userAddresses);
      setSuccess(`Batch remove completed! ${signatures.length} transactions processed`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to batch remove users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [program, fetchUsers]);

  const checkUserWhitelisted = useCallback(async (userAddress: string): Promise<boolean> => {
    if (!program) return false;

    try {
      return await isUserWhitelisted(program, userAddress);
    } catch (err) {
      console.error('Error checking user whitelist status:', err);
      return false;
    }
  }, [program]);

  return {
    whitelistedUsers,
    loading,
    error,
    success,
    addUser,
    removeUser,
    batchAddUsers,
    batchRemoveUsers,
    fetchUsers,
    checkUserWhitelisted,
    clearMessages
  };
};
