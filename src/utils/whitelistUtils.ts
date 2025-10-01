import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";

// Types for whitelist data
export interface WhitelistUser {
  publicKey: string;
  account: {
    userAddress: string;
    total: string;
    claim: string;
    remain: string;
    lastWithdrawAt: string;
    lastWithdrawTreasuryAt: string;
  };
}

export interface WhitelistSummary {
  totalUsers: number;
  totalAllocated: BN;
  totalClaimed: BN;
  totalRemaining: BN;
  users: WhitelistUser[];
}

// Parse whitelist data from your provided format
export const parseWhitelistData = (whitelistData: WhitelistUser[]): WhitelistSummary => {
  let totalAllocated = new BN(0);
  let totalClaimed = new BN(0);
  let totalRemaining = new BN(0);

  whitelistData.forEach(user => {
    const allocated = new BN(user.account.total);
    const claimed = new BN(user.account.claim);
    const remaining = new BN(user.account.remain);

    totalAllocated = totalAllocated.add(allocated);
    totalClaimed = totalClaimed.add(claimed);
    totalRemaining = totalRemaining.add(remaining);
  });

  return {
    totalUsers: whitelistData.length,
    totalAllocated,
    totalClaimed,
    totalRemaining,
    users: whitelistData
  };
};

// Check if a user is in the whitelist
export const isUserWhitelisted = (userAddress: string, whitelistData: WhitelistUser[]): boolean => {
  return whitelistData.some(user => 
    user.account.userAddress === userAddress
  );
};

// Get user's whitelist data
export const getUserWhitelistData = (userAddress: string, whitelistData: WhitelistUser[]): WhitelistUser | null => {
  return whitelistData.find(user => 
    user.account.userAddress === userAddress
  ) || null;
};

// Format token amounts for display
export const formatWhitelistTokenAmount = (amount: string | BN, decimals: number = 6): string => {
  const bnAmount = typeof amount === 'string' ? new BN(amount) : amount;
  const divisor = new BN(10).pow(new BN(decimals));
  const humanReadable = bnAmount.div(divisor);
  const remainder = bnAmount.mod(divisor);
  
  if (remainder.isZero()) {
    return humanReadable.toString();
  } else {
    const remainderStr = remainder.toString().padStart(decimals, '0');
    return `${humanReadable.toString()}.${remainderStr}`;
  }
};

// Calculate daily drip amount for a user
export const calculateDailyDripAmount = (
  userTotal: BN,
  monthlyPercentage: number,
  daysInMonth: number,
  decimals: number = 6
): BN => {
  // Calculate monthly allocation
  const monthlyAllocation = userTotal.mul(new BN(monthlyPercentage)).div(new BN(100));
  
  // Calculate daily amount
  const dailyAmount = monthlyAllocation.div(new BN(daysInMonth));
  
  return dailyAmount;
};

// Generate vesting schedule for a specific user
export const generateUserVestingSchedule = (
  userTotal: BN,
  startDate: Date,
  monthlyPercentages: number[],
  decimals: number = 6
) => {
  const schedule = [];
  let currentDate = new Date(startDate);
  
  monthlyPercentages.forEach((percentage, index) => {
    const monthNumber = index + 1;
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    const monthlyAllocation = userTotal.mul(new BN(percentage)).div(new BN(100));
    const dailyAmount = calculateDailyDripAmount(userTotal, percentage, daysInMonth, decimals);
    
    schedule.push({
      month: monthNumber,
      percentage,
      monthlyAllocation,
      dailyAmount,
      daysInMonth,
      startDate: new Date(currentDate),
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    });
    
    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  });
  
  return schedule;
};

// Validate whitelist data
export const validateWhitelistData = (whitelistData: WhitelistUser[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  whitelistData.forEach((user, index) => {
    // Validate public key format
    try {
      new PublicKey(user.publicKey);
    } catch {
      errors.push(`User ${index + 1}: Invalid public key format`);
    }
    
    // Validate user address format
    try {
      new PublicKey(user.account.userAddress);
    } catch {
      errors.push(`User ${index + 1}: Invalid user address format`);
    }
    
    // Validate numeric fields
    const total = new BN(user.account.total);
    const claim = new BN(user.account.claim);
    const remain = new BN(user.account.remain);
    
    if (total.isZero()) {
      errors.push(`User ${index + 1}: Total allocation cannot be zero`);
    }
    
    if (claim.gt(total)) {
      errors.push(`User ${index + 1}: Claimed amount exceeds total allocation`);
    }
    
    if (!total.eq(claim.add(remain))) {
      errors.push(`User ${index + 1}: Total does not equal claimed + remaining`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export your sample whitelist data
export const sampleWhitelistData: WhitelistUser[] = [
  {
    "publicKey": "ACcBs3ayGMsZzQoNtM3sVdwAVkuYJotWhWXAc42d3FQZ",
    "account": {
      "userAddress": "7MPW5D3fv8RN9a95CdEHfym3x8MqWG9TfQQfsns2tiFj",
      "total": "15000",
      "claim": "0",
      "remain": "15000",
      "lastWithdrawAt": "0",
      "lastWithdrawTreasuryAt": "0"
    }
  },
  {
    "publicKey": "kwgYQ3Uxf4mCbYHf6c7ERd9S7Jfg6KKj4Np9WYZChpK",
    "account": {
      "userAddress": "7TvGfZfUUvMhZp1SNGvfReHFqmmc7E1wepvB76cZKk8s",
      "total": "15000",
      "claim": "0",
      "remain": "15000",
      "lastWithdrawAt": "0",
      "lastWithdrawTreasuryAt": "0"
    }
  }
];
