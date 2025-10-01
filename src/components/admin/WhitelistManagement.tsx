"use client";

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import vestingIdl from '../../contracts/vesting.json';
import {
  addUserToWhitelist,
  removeUserFromWhitelist,
  fetchAllWhitelistedUsers,
  isUserWhitelisted,
  batchAddUsersToWhitelist,
  batchRemoveUsersFromWhitelist,
  WhiteList
} from '../../utils/vestingUtils';

interface WhitelistUser {
  publicKey: string;
  address: string;
  total: number;
  claim: number;
  remain: number;
  lastWithdrawAt: number;
  lastWithdrawTreasuryAt: number;
}

type WhitelistManagementProps = { program?: Program | null };

const WhitelistManagement: React.FC<WhitelistManagementProps> = ({ program: programProp }) => {
  const { connection } = useConnection();
  const { wallet, publicKey } = useWallet();
  const [program, setProgram] = useState<Program | null>(programProp ?? null);
  const [whitelistedUsers, setWhitelistedUsers] = useState<WhitelistUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add user form state
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserTotalTokens, setNewUserTotalTokens] = useState('');
  const [removeUserAddress, setRemoveUserAddress] = useState('');

  // Batch operations state
  const [batchUsers, setBatchUsers] = useState<Array<{ address: string; totalTokens: string }>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'add' | 'view'>('add');
  const [activeUser, setActiveUser] = useState<WhitelistUser | null>(null);

  // Initialize program if not provided
  useEffect(() => {
    if (programProp) {
      setProgram(programProp);
      return;
    }
    if (wallet && connection) {
      const provider = new AnchorProvider(connection, wallet as any, {});
      const programId = new PublicKey(process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID || "");
      const programInstance = new Program(vestingIdl as any, programId, provider);
      setProgram(programInstance);
    }
  }, [wallet, connection, programProp]);

  // Fetch whitelisted users
  const fetchUsers = async () => {
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
    } catch (err) {
      setError('Failed to fetch whitelisted users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add user to whitelist
  const handleAddUser = async () => {
    if (!program || !newUserAddress || !newUserTotalTokens) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const totalTokens = parseFloat(newUserTotalTokens);
      if (isNaN(totalTokens) || totalTokens <= 0) {
        throw new Error('Invalid token amount');
      }

      const signature = await addUserToWhitelist(program, newUserAddress, totalTokens, publicKey);
      setSuccess(`User added successfully! Transaction: ${signature}`);
      setNewUserAddress('');
      setNewUserTotalTokens('');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Remove user from whitelist
  const handleRemoveUser = async () => {
    if (!program || !removeUserAddress) {
      setError('Please enter user address');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const signature = await removeUserFromWhitelist(program, removeUserAddress);
      setSuccess(`User removed successfully! Transaction: ${signature}`);
      setRemoveUserAddress('');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to remove user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Batch add users
  const handleBatchAdd = async () => {
    if (!program || batchUsers.length === 0) {
      setError('Please add users to batch');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const users = batchUsers.map(user => ({
        userAddress: user.address,
        totalTokens: parseFloat(user.totalTokens)
      }));

      const signatures = await batchAddUsersToWhitelist(program, users);
      setSuccess(`Batch add completed! ${signatures.length} transactions processed`);
      setBatchUsers([]);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to batch add users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Batch remove users
  const handleBatchRemove = async () => {
    if (!program || selectedUsers.length === 0) {
      setError('Please select users to remove');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get user addresses from selected publicKeys
      const userAddresses = selectedUsers.map(publicKey => {
        const user = whitelistedUsers.find(u => u.publicKey === publicKey);
        return user?.address || '';
      }).filter(addr => addr !== '');

      const signatures = await batchRemoveUsersFromWhitelist(program, userAddresses);
      setSuccess(`Batch remove completed! ${signatures.length} transactions processed`);
      setSelectedUsers([]);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to batch remove users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add user to batch
  const addToBatch = () => {
    if (newUserAddress && newUserTotalTokens) {
      setBatchUsers([...batchUsers, { address: newUserAddress, totalTokens: newUserTotalTokens }]);
      setNewUserAddress('');
      setNewUserTotalTokens('');
    }
  };

  // Remove user from batch
  const removeFromBatch = (index: number) => {
    setBatchUsers(batchUsers.filter((_, i) => i !== index));
  };

  // Toggle user selection
  const toggleUserSelection = (publicKey: string) => {
    setSelectedUsers(prev => 
      prev.includes(publicKey) 
        ? prev.filter(key => key !== publicKey)
        : [...prev, publicKey]
    );
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Format token amount
  const formatTokenAmount = (amount: number) => {
    return (amount / 1e9).toFixed(2);
  };

  if (!publicKey) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Please connect your wallet to access admin functions</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Whitelist Management</h2>
        <div className="space-x-2">
          <button
            onClick={() => { setSidebarMode('add'); setIsSidebarOpen(true); setActiveUser(null); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Add User
          </button>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* Add Single User */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Add User to Whitelist</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Address
            </label>
            <input
              type="text"
              value={newUserAddress}
              onChange={(e) => setNewUserAddress(e.target.value)}
              placeholder="Enter Solana address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Tokens
            </label>
            <input
              type="number"
              value={newUserTotalTokens}
              onChange={(e) => setNewUserTotalTokens(e.target.value)}
              placeholder="Enter token amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={handleAddUser}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
            <button
              onClick={addToBatch}
              disabled={!newUserAddress || !newUserTotalTokens}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Add to Batch
            </button>
          </div>
        </div>
      </div>

      {/* Batch Operations */}
      {batchUsers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Batch Add Users ({batchUsers.length})</h3>
          <div className="space-y-2 mb-4">
            {batchUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">
                  {user.address} - {user.totalTokens} tokens
                </span>
                <button
                  onClick={() => removeFromBatch(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleBatchAdd}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Batch Add Users'}
          </button>
        </div>
      )}

      {/* Remove User */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Remove User from Whitelist</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            value={removeUserAddress}
            onChange={(e) => setRemoveUserAddress(e.target.value)}
            placeholder="Enter user address to remove"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleRemoveUser}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Removing...' : 'Remove User'}
          </button>
        </div>
      </div>

      {/* Whitelisted Users List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Whitelisted Users ({whitelistedUsers.length})</h3>
          <div className="space-x-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            {selectedUsers.length > 0 && (
              <button
                onClick={handleBatchRemove}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Remove Selected ({selectedUsers.length})
              </button>
            )}
          </div>
        </div>

        {whitelistedUsers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No whitelisted users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === whitelistedUsers.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(whitelistedUsers.map(user => user.publicKey));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claimed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Withdraw
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {whitelistedUsers.map((user) => (
                  <tr
                    key={user.publicKey}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => { setActiveUser(user); setSidebarMode('view'); setIsSidebarOpen(true); }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.publicKey)}
                        onChange={() => toggleUserSelection(user.publicKey)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {user.publicKey.slice(0, 8)}...{user.publicKey.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {user.address.slice(0, 8)}...{user.address.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTokenAmount(user.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTokenAmount(user.claim)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTokenAmount(user.remain)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(user.lastWithdrawAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Sidebar Panel */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/30"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="w-full sm:w-[420px] bg-white border-l shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {sidebarMode === 'add' ? 'Add Whitelist User' : 'User Details'}
              </h3>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {sidebarMode === 'add' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User Address</label>
                  <input
                    type="text"
                    value={newUserAddress}
                    onChange={(e) => setNewUserAddress(e.target.value)}
                    placeholder="Enter Solana address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Tokens</label>
                  <input
                    type="number"
                    value={newUserTotalTokens}
                    onChange={(e) => setNewUserTotalTokens(e.target.value)}
                    placeholder="Enter token amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddUser}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add User'}
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeUser && (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Account Key</div>
                      <div className="font-mono break-all">{activeUser.publicKey}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">User Address</div>
                      <div className="font-mono break-all">{activeUser.address}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-sm text-gray-500">Total</div>
                        <div className="font-semibold">{formatTokenAmount(activeUser.total)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Claimed</div>
                        <div className="font-semibold">{formatTokenAmount(activeUser.claim)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Remaining</div>
                        <div className="font-semibold">{formatTokenAmount(activeUser.remain)}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Last Withdraw</div>
                      <div className="font-semibold">{formatTimestamp(activeUser.lastWithdrawAt)}</div>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => { setRemoveUserAddress(activeUser.address); handleRemoveUser(); }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Remove User
                      </button>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhitelistManagement;
