// Types for game state
export interface GameState {
  balance: number;
  miningRate: number;
  accumulatedCoins: number;
  rank: string;
  upgrades: Upgrade[];
  lastClaimTime: number;
}

// Upgrade interface
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  currentLevel: number;
  maxLevel: number;
  baseEffect: number;
  owned: boolean;
}

// Initial game state
export const initialGameState: GameState = {
  balance: 0,
  miningRate: 0.1,
  accumulatedCoins: 0,
  rank: 'Bronze',
  upgrades: [
    {
      id: 'basic_miner',
      name: 'Basic Miner',
      description: 'Increases mining rate by 0.2 ₿/s',
      baseCost: 50,
      currentLevel: 0,
      maxLevel: 10,
      baseEffect: 0.2,
      owned: false
    },
    {
      id: 'advanced_miner',
      name: 'Advanced Miner',
      description: 'Increases mining rate by 0.5 ₿/s',
      baseCost: 200,
      currentLevel: 0,
      maxLevel: 10,
      baseEffect: 0.5,
      owned: false
    },
    {
      id: 'mining_rig',
      name: 'Mining Rig',
      description: 'Increases mining rate by 1.0 ₿/s',
      baseCost: 500,
      currentLevel: 0,
      maxLevel: 5,
      baseEffect: 1.0,
      owned: false
    },
    {
      id: 'mining_farm',
      name: 'Mining Farm',
      description: 'Increases mining rate by 5.0 ₿/s',
      baseCost: 2000,
      currentLevel: 0,
      maxLevel: 3,
      baseEffect: 5.0,
      owned: false
    }
  ],
  lastClaimTime: Date.now()
};

// Calculate cost of next upgrade level
export const calculateUpgradeCost = (upgrade: Upgrade): number => {
  return Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.currentLevel));
};

// Calculate effect of upgrade at current level
export const calculateUpgradeEffect = (upgrade: Upgrade): number => {
  return upgrade.baseEffect * upgrade.currentLevel;
};

// Calculate total mining rate from all upgrades
export const calculateTotalMiningRate = (baseRate: number, upgrades: Upgrade[]): number => {
  const upgradeBonus = upgrades.reduce((total, upgrade) => {
    return total + calculateUpgradeEffect(upgrade);
  }, 0);
  
  return baseRate + upgradeBonus;
};

// Determine rank based on balance
export const determineRank = (balance: number): string => {
  if (balance >= 10000) {
    return 'Diamond';
  } else if (balance >= 5000) {
    return 'Platinum';
  } else if (balance >= 1000) {
    return 'Gold';
  } else if (balance >= 500) {
    return 'Silver';
  } else {
    return 'Bronze';
  }
};

// Purchase upgrade
export const purchaseUpgrade = (
  gameState: GameState, 
  upgradeId: string
): { success: boolean; newState: GameState; message: string } => {
  const upgradeCopy = [...gameState.upgrades];
  const upgradeIndex = upgradeCopy.findIndex(u => u.id === upgradeId);
  
  if (upgradeIndex === -1) {
    return { 
      success: false, 
      newState: gameState, 
      message: 'Upgrade not found' 
    };
  }
  
  const upgrade = upgradeCopy[upgradeIndex];
  
  if (upgrade.currentLevel >= upgrade.maxLevel) {
    return { 
      success: false, 
      newState: gameState, 
      message: 'Upgrade already at max level' 
    };
  }
  
  const cost = calculateUpgradeCost(upgrade);
  
  if (gameState.balance < cost) {
    return { 
      success: false, 
      newState: gameState, 
      message: 'Not enough coins' 
    };
  }
  
  // Update upgrade
  upgradeCopy[upgradeIndex] = {
    ...upgrade,
    currentLevel: upgrade.currentLevel + 1,
    owned: true
  };
  
  // Calculate new mining rate
  const newMiningRate = calculateTotalMiningRate(0.1, upgradeCopy);
  
  // Update game state
  const newState = {
    ...gameState,
    balance: gameState.balance - cost,
    miningRate: newMiningRate,
    upgrades: upgradeCopy
  };
  
  return { 
    success: true, 
    newState, 
    message: `Successfully upgraded ${upgrade.name} to level ${upgrade.currentLevel + 1}` 
  };
};

// Save game state to local storage
export const saveGameState = (gameState: GameState): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cryptoGameState', JSON.stringify(gameState));
  }
};

// Load game state from local storage
export const loadGameState = (): GameState | null => {
  if (typeof window !== 'undefined') {
    const savedState = localStorage.getItem('cryptoGameState');
    if (savedState) {
      return JSON.parse(savedState);
    }
  }
  return null;
};
