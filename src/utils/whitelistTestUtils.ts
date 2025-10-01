import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";

// Test utility to work with your whitelist data
export interface WhitelistTestData {
  userAddress: string;
  total: string;
  claim: string;
  remain: string;
  lastWithdrawAt: string;
  lastWithdrawTreasuryAt: string;
}

// Convert your whitelist data to the expected format
export const convertWhitelistData = (data: WhitelistTestData) => {
  return {
    userAddress: new PublicKey(data.userAddress),
    total: new BN(data.total),
    claim: new BN(data.claim),
    remain: new BN(data.remain),
    lastWithdrawAt: new BN(data.lastWithdrawAt),
    lastWithdrawTreasuryAt: new BN(data.lastWithdrawTreasuryAt)
  };
};

// Test data from your fetch result
export const testWhitelistData: WhitelistTestData = {
  "userAddress": "7MPW5D3fv8RN9a95CdEHfym3x8MqWG9TfQQfsns2tiFj",
  "total": "15000",
  "claim": "0",
  "remain": "15000",
  "lastWithdrawAt": "0",
  "lastWithdrawTreasuryAt": "0"
};

// Calculate daily claimable amount for this user
export const calculateTestUserClaimable = (
  scheduleEntry: { monthIndex: number; percentBps: number },
  mintDecimals: number = 6
) => {
  const userTotal = new BN(testWhitelistData.total);
  
  // Calculate monthly amount using percent-based approach
  const monthlyAmount = userTotal.mul(new BN(scheduleEntry.percentBps)).div(new BN(10000));
  
  // Calculate daily amount (30 days per month)
  const perDay = monthlyAmount.div(new BN(30));
  
  // For daily claims, claim 1 day's worth
  const claimAmount = perDay.mul(new BN(1));
  
  return {
    userTotal: userTotal.toString(),
    monthlyAmount: monthlyAmount.toString(),
    perDay: perDay.toString(),
    claimAmount: claimAmount.toString(),
    claimAmountRaw: claimAmount.mul(new BN(10).pow(new BN(mintDecimals))).toString()
  };
};

// Example calculations for different months
export const getTestUserCalculations = () => {
  const calculations = [];
  
  // Month 1: 10% (1000 bps)
  calculations.push({
    month: 1,
    percentage: 10,
    ...calculateTestUserClaimable({ monthIndex: 1, percentBps: 1000 })
  });
  
  // Month 2: 8% (800 bps)
  calculations.push({
    month: 2,
    percentage: 8,
    ...calculateTestUserClaimable({ monthIndex: 2, percentBps: 800 })
  });
  
  // Month 3: 8% (800 bps)
  calculations.push({
    month: 3,
    percentage: 8,
    ...calculateTestUserClaimable({ monthIndex: 3, percentBps: 800 })
  });
  
  return calculations;
};

// Display the calculations in a readable format
export const displayTestCalculations = () => {
  const calculations = getTestUserCalculations();
  
  console.log("=== Whitelist User Claim Calculations ===");
  console.log(`User: ${testWhitelistData.userAddress}`);
  console.log(`Total Allocation: ${testWhitelistData.total} SOSANA`);
  console.log(`Already Claimed: ${testWhitelistData.claim} SOSANA`);
  console.log(`Remaining: ${testWhitelistData.remain} SOSANA`);
  console.log(`Last Withdraw: ${testWhitelistData.lastWithdrawAt === "0" ? "Never" : new Date(parseInt(testWhitelistData.lastWithdrawAt) * 1000).toLocaleString()}`);
  console.log("");
  
  calculations.forEach(calc => {
    console.log(`Month ${calc.month} (${calc.percentage}%):`);
    console.log(`  Monthly Amount: ${calc.monthlyAmount} SOSANA`);
    console.log(`  Daily Amount: ${calc.perDay} SOSANA`);
    console.log(`  Claim Amount: ${calc.claimAmount} SOSANA`);
    console.log(`  Raw Amount (6 decimals): ${calc.claimAmountRaw}`);
    console.log("");
  });
  
  return calculations;
};

