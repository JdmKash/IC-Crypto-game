'use client';

import { useEffect, useState } from 'react';
import { initTelegramWebApp, isTelegramWebApp, getTelegramTheme, showAlert, sendDataToBot } from '../lib/telegram';
import { 
  GameState, 
  initialGameState, 
  calculateUpgradeCost, 
  purchaseUpgrade, 
  Upgrade
} from '../lib/game';
import {
  initMonetag,
  loadRewardedAd,
  showRewardedAd,
  AdStatus,
  adRewards
} from '../lib/monetag';
import {
  authenticateWithTelegram,
  getUserId,
  saveGameState,
  loadGameState,
  updateUserProfile,
  getUserProfile,
  getGlobalLeaderboard,
  getUserLeaderboardRank,
  recordClick,
  updatePlayTime,
  recordCryptoReward,
  getRewardHistory,
  processReferralCode,
  getUserReferrals,
  unlockAchievement,
  recordUserActivity,
  LeaderboardEntry,
  UserProfile
} from '../lib/firebase';

// Define the extended UserProfile interface with walletAddress property
interface ExtendedUserProfile extends UserProfile {
  walletAddress?: string;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [theme, setTheme] = useState({
    bgColor: '#1e1e1e',
    textColor: '#ffffff',
    buttonColor: '#50a8eb',
    buttonTextColor: '#ffffff',
  });
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [adStatus, setAdStatus] = useState<AdStatus>({
    isLoading: false,
    isReady: false,
    error: null
  });
  const [activeBooster, setActiveBooster] = useState<{
    type: string;
    multiplier: number;
    endTime: number;
  } | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletValid, setIsWalletValid] = useState(false);
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [isProcessingReward, setIsProcessingReward] = useState(false);
  const [playStartTime, setPlayStartTime] = useState(Date.now());
  const [cryptoRewards, setCryptoRewards] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<ExtendedUserProfile | null>(null);
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [userReferrals, setUserReferrals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  // Initialize Telegram WebApp, Firebase, load saved game state, init Monetag
  useEffect(() => {
    initTelegramWebApp(async () => {
      setIsInitialized(true);
      setTheme(getTelegramTheme());
      
      // Authenticate with Firebase using Telegram
      await authenticateWithTelegram();
      
      // Load user profile with type assertion
      const profile = await getUserProfile() as ExtendedUserProfile;
      if (profile) {
        setUserProfile(profile);
        setWalletAddress(profile.walletAddress || '');
        setIsWalletValid(!!profile.walletAddress);
      }
      
      // Load saved game state
      const savedState = await loadGameState();
      if (savedState) {
        setGameState(savedState);
      }

      // Initialize Monetag
      initMonetag('8923854').then(success => {
        if (success) {
          // Pre-load an ad
          loadRewardedAd().then(status => {
            setAdStatus(status);
          });
        }
      });

      // Load leaderboard
      loadLeaderboard();
      
      // Get user's referrals
      loadUserReferrals();
      
      // Set play start time for reward calculation
      setPlayStartTime(Date.now());
      
      // Record user activity
      recordUserActivity('game_session_started');
    });
    
    return () => {
      // Record session end on unmount
      const sessionDuration = Math.floor((Date.now() - playStartTime) / 1000);
      updatePlayTime(sessionDuration);
      recordUserActivity('game_session_ended', { durationSeconds: sessionDuration });
    };
  }, []);

  // Load leaderboard data
  const loadLeaderboard = async () => {
    const leaderboardData = await getGlobalLeaderboard(10);
    setLeaderboard(leaderboardData);
    
    const rank = await getUserLeaderboardRank();
    setUserRank(rank);
  };
  
  // Load user's referrals
  const loadUserReferrals = async () => {
    const referrals = await getUserReferrals();
    setUserReferrals(referrals);
  };
} // Add this closing brace
