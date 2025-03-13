// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, where, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { isTelegramWebApp } from './telegram';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBuWYnT6y19wCcTsY-rW4xHukUQh1tPmgQ",
  authDomain: "ic-crypto-app.firebaseapp.com",
  projectId: "ic-crypto-app",
  storageBucket: "ic-crypto-app.firebasestorage.app",
  messagingSenderId: "13895584736",
  appId: "1:13895584736:web:900ca75971c4a76fa6f985",
  measurementId: "G-3D4VFKS28V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

// User authentication with Telegram
export const authenticateWithTelegram = async (): Promise<boolean> => {
  try {
    if (!isTelegramWebApp()) {
      console.error('Not running in Telegram WebApp');
      return false;
    }

    // Get Telegram init data
    const initData = window.Telegram.WebApp.initData;
    if (!initData) {
      console.error('No Telegram init data available');
      return false;
    }

    // Call Firebase function to verify Telegram data and get auth token
    const getTelegramToken = httpsCallable(functions, 'getTelegramAuthToken');
    const result = await getTelegramToken({ initData });
    
    // Sign in with the custom token
    const customToken = result.data as string;
    await signInWithCustomToken(auth, customToken);
    
    console.log('Successfully authenticated with Telegram');
    return true;
  } catch (error) {
    console.error('Error authenticating with Telegram:', error);
    return false;
  }
};

// Get current user ID (Telegram user ID or anonymous ID)
export const getUserId = (): string => {
  // If authenticated with Firebase
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  
  // If in Telegram WebApp
  if (isTelegramWebApp() && window.Telegram.WebApp.initDataUnsafe?.user?.id) {
    return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
  }
  
  // Fallback to stored anonymous ID or create new one
  let anonymousId = localStorage.getItem('anonymousUserId');
  if (!anonymousId) {
    anonymousId = 'anon_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('anonymousUserId', anonymousId);
  }
  
  return anonymousId;
};

// User profile management
export interface UserProfile {
  userId: string;
  username: string;
  photoUrl?: string;
  createdAt: any; // Timestamp
  lastActive: any; // Timestamp
  totalCoinsEarned: number;
  totalClicks: number;
  totalTimePlayedSeconds: number;
  highestRank: string;
  referralCode: string;
  referredBy?: string;
  achievements: string[];
}

// Create or update user profile
export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<boolean> => {
  try {
    const userId = getUserId();
    const userRef = doc(db, 'users', userId);
    
    // Get existing profile or create new one
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      // Update existing profile
      await updateDoc(userRef, {
        ...profileData,
        lastActive: Timestamp.now()
      });
    } else {
      // Create new profile
      let username = 'Anonymous';
      let photoUrl = '';
      
      // Get Telegram user data if available
      if (isTelegramWebApp() && window.Telegram.WebApp.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        username = user.username || `${user.first_name} ${user.last_name || ''}`.trim();
        photoUrl = user.photo_url || '';
      }
      
      // Generate referral code
      const referralCode = userId.substring(0, 6) + Math.random().toString(36).substring(2, 5);
      
      await setDoc(userRef, {
        userId,
        username,
        photoUrl,
        createdAt: Timestamp.now(),
        lastActive: Timestamp.now(),
        totalCoinsEarned: 0,
        totalClicks: 0,
        totalTimePlayedSeconds: 0,
        highestRank: 'Novice',
        referralCode,
        achievements: [],
        ...profileData
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// Get user profile
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const userId = getUserId();
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      // Create default profile if it doesn't exist
      await updateUserProfile({});
      const newDocSnap = await getDoc(userRef);
      return newDocSnap.data() as UserProfile;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Leaderboard functionality
export interface LeaderboardEntry {
  userId: string;
  username: string;
  photoUrl?: string;
  score: number;
  rank: string;
}

// Get global leaderboard
export const getGlobalLeaderboard = async (limit_count: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef, orderBy('score', 'desc'), limit(limit_count));
    const querySnapshot = await getDocs(q);
    
    const leaderboard: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      leaderboard.push(doc.data() as LeaderboardEntry);
    });
    
    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
};

// Update user's leaderboard entry
export const updateLeaderboardEntry = async (score: number, rank: string): Promise<boolean> => {
  try {
    const userId = getUserId();
    const leaderboardRef = doc(db, 'leaderboard', userId);
    
    // Get user profile for username and photo
    const userProfile = await getUserProfile();
    if (!userProfile) {
      return false;
    }
    
    await setDoc(leaderboardRef, {
      userId,
      username: userProfile.username,
      photoUrl: userProfile.photoUrl,
      score,
      rank
    });
    
    return true;
  } catch (error) {
    console.error('Error updating leaderboard entry:', error);
    return false;
  }
};

// Get user's rank in leaderboard
export const getUserLeaderboardRank = async (): Promise<number> => {
  try {
    const userId = getUserId();
    const userScore = await getUserScore();
    
    if (userScore === null) {
      return -1;
    }
    
    // Count users with higher scores
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef, where('score', '>', userScore));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.size + 1; // Add 1 because ranks start at 1
  } catch (error) {
    console.error('Error getting user leaderboard rank:', error);
    return -1;
  }
};

// Get user's score
export const getUserScore = async (): Promise<number | null> => {
  try {
    const userId = getUserId();
    const leaderboardRef = doc(db, 'leaderboard', userId);
    const docSnap = await getDoc(leaderboardRef);
    
    if (docSnap.exists()) {
      return docSnap.data().score;
    } else {
      return 0;
    }
  } catch (error) {
    console.error('Error getting user score:', error);
    return null;
  }
};

// Game state management
import { GameState } from './game';

// Save game state to Firebase
export const saveGameState = async (state: GameState): Promise<boolean> => {
  try {
    const userId = getUserId();
    const gameStateRef = doc(db, 'gameStates', userId);
    
    await setDoc(gameStateRef, {
      ...state,
      lastUpdated: Timestamp.now()
    });
    
    // Also update user profile stats
    await updateUserProfile({
      totalCoinsEarned: state.balance,
      highestRank: state.rank
    });
    
    // Update leaderboard
    await updateLeaderboardEntry(state.balance, state.rank);
    
    // Also save to localStorage as backup
    localStorage.setItem('gameState', JSON.stringify(state));
    
    return true;
  } catch (error) {
    console.error('Error saving game state:', error);
    // Fallback to localStorage if Firebase fails
    localStorage.setItem('gameState', JSON.stringify(state));
    return false;
  }
};

// Load game state from Firebase
export const loadGameState = async (): Promise<GameState | null> => {
  try {
    const userId = getUserId();
    const gameStateRef = doc(db, 'gameStates', userId);
    const docSnap = await getDoc(gameStateRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Remove Firestore timestamp objects before returning
      const { lastUpdated, ...gameState } = data;
      return gameState as GameState;
    } else {
      // Try localStorage as fallback
      const savedState = localStorage.getItem('gameState');
      if (savedState) {
        return JSON.parse(savedState);
      }
      return null;
    }
  } catch (error) {
    console.error('Error loading game state:', error);
    // Fallback to localStorage if Firebase fails
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      return JSON.parse(savedState);
    }
    return null;
  }
};

// Record user activity
export const recordUserActivity = async (activity: string, metadata: any = {}): Promise<void> => {
  try {
    const userId = getUserId();
    const activitiesRef = collection(db, 'users', userId, 'activities');
    
    await setDoc(doc(activitiesRef), {
      userId,
      activity,
      timestamp: Timestamp.now(),
      metadata
    });
  } catch (error) {
    console.error('Error recording user activity:', error);
  }
};

// Record click for statistics
export const recordClick = async (): Promise<void> => {
  try {
    const userId = getUserId();
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      totalClicks: increment(1)
    });
  } catch (error) {
    console.error('Error recording click:', error);
  }
};

// Update play time
export const updatePlayTime = async (seconds: number): Promise<void> => {
  try {
    const userId = getUserId();
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      totalTimePlayedSeconds: increment(seconds)
    });
  } catch (error) {
    console.error('Error updating play time:', error);
  }
};

// Crypto reward processing
export interface CryptoReward {
  userId: string;
  walletAddress: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: any; // Timestamp
  processedAt?: any; // Timestamp
  transactionId?: string;
  error?: string;
}

// Record crypto reward for processing
export const recordCryptoReward = async (walletAddress: string, amount: number): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txId?: string;
  error?: string;
}> => {
  try {
    const userId = getUserId();
    
    // Call Firebase function to record reward
    const processReward = httpsCallable(functions, 'processCryptoReward');
    const result = await processReward({ 
      userId, 
      walletAddress, 
      amount 
    });
    
    const data = result.data as {
      status: 'pending' | 'processing' | 'completed' | 'failed';
      txId?: string;
      error?: string;
    };
    
    // Record activity
    await recordUserActivity('crypto_reward_claimed', {
      amount,
      walletAddress,
      status: data.status,
      txId: data.txId
    });
    
    return data;
  } catch (error) {
    console.error('Error recording crypto reward:', error);
    return {
      status: 'failed',
      error: 'Failed to process reward'
    };
  }
};

// Get user's reward history
export const getRewardHistory = async (): Promise<CryptoReward[]> => {
  try {
    const userId = getUserId();
    const rewardsRef = collection(db, 'rewards');
    const q = query(rewardsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const rewards: CryptoReward[] = [];
    querySnapshot.forEach((doc) => {
      rewards.push(doc.data() as CryptoReward);
    });
    
    return rewards;
  } catch (error) {
    console.error('Error getting reward history:', error);
    return [];
  }
};

// Referral system
export const processReferralCode = async (referralCode: string): Promise<boolean> => {
  try {
    const userId = getUserId();
    
    // Check if user already has a referrer
    const userProfile = await getUserProfile();
    if (userProfile?.referredBy) {
      console.log('User already has a referrer');
      return false;
    }
    
    // Find user with this referral code
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('referralCode', '==', referralCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('Invalid referral code');
      return false;
    }
    
    const referrerDoc = querySnapshot.docs[0];
    const referrerId = referrerDoc.id;
    
    // Make sure user is not referring themselves
    if (referrerId === userId) {
      console.error('Cannot refer yourself');
      return false;
    }
    
    // Update user profile with referrer
    await updateUserProfile({
      referredBy: referrerId
    });
    
    // Call Firebase function to process referral reward
    const processReferral = httpsCallable(functions, 'processReferralReward');
    await processReferral({ 
      userId, 
      referrerId 
    });
    
    // Record activity
    await recordUserActivity('referral_used', {
      referralCode,
      referrerId
    });
    
    return true;
  } catch (error) {
    console.error('Error processing referral code:', error);
    return false;
  }
};

// Get user's referrals
export const getUserReferrals = async (): Promise<UserProfile[]> => {
  try {
    const userId = getUserId();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('referredBy', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const referrals: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      referrals.push(doc.data() as UserProfile);
    });
    
    return referrals;
  } catch (error) {
    console.error('Error getting user referrals:', error);
    return [];
  }
};

// Achievement system
export const unlockAchievement = async (achievementId: string): Promise<boolean> => {
  try {
    const userId = getUserId();
    const userRef = doc(db, 'users', userId);
    
    // Get current achievements
    const userProfile = await getUserProfile();
    if (!userProfile) {
      return false;
    }
    
    // Check if achievement already unlocked
    if (userProfile.achievements.includes(achievementId)) {
      return true;
    }
    
    // Add achievement
    const newAchievements = [...userProfile.achievements, achievementId];
    await updateDoc(userRef, {
      achievements: newAchievements
    });
    
    // Record activity
    await recordUserActivity('achievement_unlocked', {
      achievementId
    });
    
    return true;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return false;
  }
};

export { app, db, auth, functions };
