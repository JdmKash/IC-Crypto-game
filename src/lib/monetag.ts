// Monetag integration for ad monetization

export interface AdStatus {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

export const adRewards = {
  'bonusCoins': {
    type: 'coins',
    amount: 100
  },
  'doubleCoins': {
    type: 'multiplier',
    amount: 2,
    duration: 300 // 5 minutes in seconds
  },
  'miningBooster': {
    type: 'multiplier',
    amount: 3,
    duration: 180 // 3 minutes in seconds
  }
};

// Initialize Monetag with publisher data
export const initMonetag = async (publisherId: string): Promise<boolean> => {
  try {
    // Create script element for Monetag SDK
    const script = document.createElement('script');
    script.src = '//whephiwums.com/sdk.js';
    script.setAttribute('data-zone', '8923854');
    script.setAttribute('data-sdk', 'show_8923854');
    
    // Append to document head
    document.head.appendChild(script);
    
    // Wait for script to load
    return new Promise((resolve) => {
      script.onload = () => {
        console.log('Monetag SDK loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Monetag SDK');
        resolve(false);
      };
      
      // Fallback if onload/onerror doesn't trigger
      setTimeout(() => resolve(true), 3000);
    });
  } catch (error) {
    console.error('Error initializing Monetag:', error);
    return false;
  }
};

// Load a rewarded ad
export const loadRewardedAd = async (): Promise<AdStatus> => {
  // For Monetag, we don't need to explicitly load ads in advance
  // The show_8923854 function handles loading and showing
  return {
    isLoading: false,
    isReady: true, // Always ready since Monetag handles loading internally
    error: null
  };
};

// Show a rewarded ad and return the reward if completed
export const showRewardedAd = async (reward: any): Promise<{
  completed: boolean;
  reward: any | null;
}> => {
  try {
    // Using your exact Monetag code
    await (window as any).show_8923854('pop');
    
    // If we reach here, the ad was shown successfully
    console.log('Ad completed, providing reward:', reward);
    return {
      completed: true,
      reward: reward
    };
  } catch (error) {
    console.error('Error showing rewarded ad:', error);
    return {
      completed: false,
      reward: null
    };
  }
};
