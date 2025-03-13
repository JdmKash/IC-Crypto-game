'use client';

// Solana crypto reward mechanism for Telegram Mini App
// This file provides utilities for integrating with Solana blockchain

import { PublicKey } from '@solana/web3.js';

// Reward transaction status
export interface RewardTransactionStatus {
  status: 'pending' | 'success' | 'failed';
  txId?: string;
  error?: string;
}

// User wallet information
export interface UserWallet {
  address: string;
  balance?: number;
}

// Initialize Solana Web3 connection
export const initSolanaConnection = (rpcUrl: string = 'https://api.mainnet-beta.solana.com') => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Create script element for Solana Web3.js
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js';
  script.async = true;
  document.head.appendChild(script);

  return new Promise<boolean>((resolve) => {
    script.onload = () => {
      if (window.solanaWeb3) {
        window.solanaConnection = new window.solanaWeb3.Connection(rpcUrl);
        resolve(true);
      } else {
        console.error('Failed to load Solana Web3.js');
        resolve(false);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Solana Web3.js');
      resolve(false);
    };
  });
};

// Validate Solana wallet address
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

// Get token balance for a specific SPL token
export const getTokenBalance = async (
  walletAddress: string,
  tokenMintAddress: string
): Promise<number | null> => {
  if (typeof window === 'undefined' || !window.solanaConnection) {
    return null;
  }

  try {
    const walletPublicKey = new window.solanaWeb3.PublicKey(walletAddress);
    const tokenMintPublicKey = new window.solanaWeb3.PublicKey(tokenMintAddress);
    
    // Find token account
    const tokenAccounts = await window.solanaConnection.getTokenAccountsByOwner(
      walletPublicKey,
      { mint: tokenMintPublicKey }
    );
    
    if (tokenAccounts.value.length === 0) {
      return 0;
    }
    
    const tokenAccountInfo = await window.solanaConnection.getParsedAccountInfo(
      tokenAccounts.value[0].pubkey
    );
    
    // @ts-ignore - accessing parsed data
    const balance = tokenAccountInfo.value?.data.parsed.info.tokenAmount.uiAmount || 0;
    return balance;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return null;
  }
};

// Record reward to backend for later processing
// This is a placeholder for the actual implementation that would connect to a backend service
export const recordRewardForProcessing = async (
  walletAddress: string,
  amount: number,
  telegramUserId: string
): Promise<RewardTransactionStatus> => {
  // In a real implementation, this would make an API call to your backend
  // The backend would then process the reward and send the tokens
  
  // For now, we'll simulate a successful recording
  console.log(`Recording reward of ${amount} tokens for wallet ${walletAddress} (Telegram user: ${telegramUserId})`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    status: 'pending',
    txId: `simulated-tx-${Date.now()}`
  };
};

// Get estimated reward amount based on game progress
export const calculateRewardAmount = (
  gameBalance: number,
  miningRate: number,
  playTimeMinutes: number
): number => {
  // This is a simple example formula - adjust based on your tokenomics
  const baseReward = gameBalance * 0.01; // 1% of game balance
  const miningBonus = miningRate * playTimeMinutes * 0.1; // Mining rate bonus
  
  // Ensure minimum reward
  const minReward = 1;
  return Math.max(baseReward + miningBonus, minReward);
};

// Add type definition for Solana Web3
declare global {
  interface Window {
    solanaWeb3?: any;
    solanaConnection?: any;
  }
}
