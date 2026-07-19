// Prestige/Rebirth System
// Reset progress for permanent bonuses and exclusive rewards

import { getLevelFromXP } from './levelSystem.js';

export const prestigeRequirements = {
    getRequiredLevel: (currentPrestigeLevel) => {
        // First rebirth at level 15, then +10 each time
        // Level 15, 25, 35, 45, 55, 65, etc.
        return 15 + (currentPrestigeLevel * 10);
    },
    getRequiredIslands: (currentPrestigeLevel) => {
        // Estimate: At level 15, player can explore ~6 islands
        // Scale with prestige level to keep it achievable
        // Rebirth 0: 6 islands, Rebirth 1: 12 islands, etc.
        return 6 + (currentPrestigeLevel * 6);
    },
    getRequiredFish: (currentPrestigeLevel) => {
        // Rebirth 0: 100 fish, Rebirth 1: 200 fish, Rebirth 2: 300 fish
        return 100 + (currentPrestigeLevel * 100);
    },
    getRequiredCollectibles: (currentPrestigeLevel) => {
        // Rebirth 0: 15 collectibles, Rebirth 1: 25, Rebirth 2: 35
        return 15 + (currentPrestigeLevel * 10);
    },
    maxPrestigeLevel: 50        // Maximum 50 rebirths
};

export const prestigePointsPerLevel = 10; // Points earned per prestige

// Permanent upgrades available in prestige shop
export const prestigeUpgrades = {
    xp_boost_1: {
        id: 'xp_boost_1',
        name: 'XP Boost I',
        description: '+10% XP gain from all sources',
        cost: 5,
        maxLevel: 5,
        effect: { xpMultiplier: 0.1 },
        emoji: '📈'
    },
    xp_boost_2: {
        id: 'xp_boost_2',
        name: 'XP Boost II',
        description: '+20% XP gain (requires XP Boost I maxed)',
        cost: 10,
        maxLevel: 3,
        requires: { upgrade: 'xp_boost_1', level: 5 },
        effect: { xpMultiplier: 0.2 },
        emoji: '📈'
    },
    energy_capacity_1: {
        id: 'energy_capacity_1',
        name: 'Energy Capacity I',
        description: '+5 max energy per level',
        cost: 10,
        maxLevel: 5,
        effect: { energyBonus: 5 },
        emoji: '⚡'
    },
    energy_capacity_2: {
        id: 'energy_capacity_2',
        name: 'Energy Capacity II',
        description: '+10 max energy per level',
        cost: 20,
        maxLevel: 3,
        requires: { upgrade: 'energy_capacity_1', level: 5 },
        effect: { energyBonus: 10 },
        emoji: '⚡'
    },
    rare_fish_luck: {
        id: 'rare_fish_luck',
        name: 'Rare Fish Luck',
        description: '+0.5% chance for rare fish per level',
        cost: 15,
        maxLevel: 5,
        effect: { rareFishBonus: 0.005 },
        emoji: '🎣'
    },
    daily_bonus: {
        id: 'daily_bonus',
        name: 'Daily Reward Boost',
        description: '+20% daily rewards per level',
        cost: 8,
        maxLevel: 5,
        effect: { dailyBonusMultiplier: 0.2 },
        emoji: '🎁'
    },
    variant_hunter: {
        id: 'variant_hunter',
        name: 'Variant Hunter',
        description: '+0.2% variant chance per level',
        cost: 25,
        maxLevel: 3,
        effect: { variantBonus: 0.002 },
        emoji: '✨'
    },
    energy_regen: {
        id: 'energy_regen',
        name: 'Faster Recovery',
        description: '+1 energy regen per hour per level',
        cost: 30,
        maxLevel: 2,
        effect: { energyRegenBonus: 1 },
        emoji: '🔋'
    },
    starting_currency: {
        id: 'starting_currency',
        name: 'Wealthy Start',
        description: 'Start with 1000 extra seashells per level',
        cost: 12,
        maxLevel: 5,
        effect: { startingSeashells: 1000 },
        emoji: '💰'
    },
    pity_reduction: {
        id: 'pity_reduction',
        name: 'Lucky Charm',
        description: '-10% pity threshold per level (reach guaranteed faster)',
        cost: 35,
        maxLevel: 3,
        effect: { pityReduction: 0.1 },
        emoji: '🍀'
    }
};

/**
 * Check if player meets prestige requirements
 * @param {Object} profile - Player profile
 * @returns {Object} - Check result with missing requirements
 */
export function checkPrestigeRequirements(profile) {
    const currentPrestigeLevel = profile.prestigeLevel || 0;
    const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
    const currentLevel = getLevelFromXP(totalXP);
    const requiredLevel = prestigeRequirements.getRequiredLevel(currentPrestigeLevel);
    const requiredIslands = prestigeRequirements.getRequiredIslands(currentPrestigeLevel);
    const requiredFish = prestigeRequirements.getRequiredFish(currentPrestigeLevel);
    const requiredCollectibles = prestigeRequirements.getRequiredCollectibles(currentPrestigeLevel);
    
    const uniqueIslands = (profile.visitedIslands || []).length;
    const fishCaught = profile.fishCaught || 0;
    const collectibles = (profile.collectibles || []).length;
    
    const missing = [];
    
    // Check if max prestige reached
    if (currentPrestigeLevel >= prestigeRequirements.maxPrestigeLevel) {
        return {
            eligible: false,
            missing: ['Maximum prestige level reached'],
            maxReached: true,
            current: {
                level: currentLevel,
                requiredLevel: requiredLevel,
                islands: uniqueIslands,
                requiredIslands: requiredIslands,
                fish: fishCaught,
                requiredFish: requiredFish,
                collectibles: collectibles,
                requiredCollectibles: requiredCollectibles
            }
        };
    }
    
    if (currentLevel < requiredLevel) {
        missing.push(`Level ${currentLevel}/${requiredLevel}`);
    }
    if (uniqueIslands < requiredIslands) {
        missing.push(`Islands ${uniqueIslands}/${requiredIslands}`);
    }
    if (fishCaught < requiredFish) {
        missing.push(`Fish ${fishCaught}/${requiredFish}`);
    }
    if (collectibles < requiredCollectibles) {
        missing.push(`Collectibles ${collectibles}/${requiredCollectibles}`);
    }
    
    return {
        eligible: missing.length === 0,
        missing: missing,
        maxReached: false,
        current: {
            level: currentLevel,
            requiredLevel: requiredLevel,
            islands: uniqueIslands,
            requiredIslands: requiredIslands,
            fish: fishCaught,
            requiredFish: requiredFish,
            collectibles: collectibles,
            requiredCollectibles: requiredCollectibles
        }
    };
}

/**
 * Perform prestige reset
 * @param {Object} profile - Player profile
 * @returns {Object} - Prestige result with stats
 */
export function performPrestige(profile) {
    // Check eligibility
    const check = checkPrestigeRequirements(profile);
    if (!check.eligible) {
        return {
            success: false,
            message: 'Requirements not met',
            missing: check.missing
        };
    }
    
    // Store pre-prestige stats for summary
    const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
    const prePrestigeStats = {
        level: getLevelFromXP(totalXP),
        islands: (profile.visitedIslands || []).length,
        fish: profile.fishCaught || 0,
        collectibles: (profile.collectibles || []).length,
        seashells: profile.seashells || 0
    };
    
    // Award prestige points
    const pointsEarned = prestigePointsPerLevel;
    profile.prestigeLevel = (profile.prestigeLevel || 0) + 1;
    profile.prestigePoints = (profile.prestigePoints || 0) + pointsEarned;
    profile.totalPrestigePoints = (profile.totalPrestigePoints || 0) + pointsEarned;
    profile.lastPrestigeDate = new Date();
    
    // Reset progress
    profile.xp = 0;
    profile.totalXP = 0;
    profile.level = 1;
    
    // Keep legacy fields in sync during migration
    if (profile.battlePassXP !== undefined) {
        profile.battlePassXP = 0;
        profile.battlePassLevel = 1;
    }
    
    // Seashells are NOT reset - players keep their currency
    // profile.seashells = 0; // REMOVED - keep seashells
    profile.fishCaught = 0;
    // Fish inventory is NOT reset - players keep their collection
    // profile.fishInventory = []; // REMOVED - keep fish inventory
    profile.beachesExplored = 0;
    profile.visitedIslands = [];
    profile.islandDiscoveries = [];
    profile.islandProgress = [];
    profile.collectibles = [];
    profile.currentBeach = 'Luzon';
    profile.explorationStreak = 0;
    
    // Keep these (permanent)
    // - prestigeLevel, prestigePoints, totalPrestigePoints
    // - prestigeUnlocks
    // - achievements
    // - variantFish (variant collection)
    // - sunTokens (premium currency)
    // - isPremiumPass
    // - ownedCosmetics, equippedCosmetics
    // - energy (refill to max on prestige)
    
    // Refill energy to new max
    const newMaxEnergy = 100 + (profile.prestigeUnlocks?.energyBonus || 0);
    profile.energy = newMaxEnergy;
    profile.maxEnergy = newMaxEnergy;
    
    return {
        success: true,
        prestigeLevel: profile.prestigeLevel,
        pointsEarned: pointsEarned,
        totalPoints: profile.prestigePoints,
        prePrestigeStats: prePrestigeStats,
        message: 'Prestige successful! You are reborn as a veteran explorer.'
    };
}

/**
 * Get prestige upgrade by ID
 * @param {String} upgradeId - Upgrade ID
 * @returns {Object|null} - Upgrade data or null
 */
export function getPrestigeUpgrade(upgradeId) {
    return prestigeUpgrades[upgradeId] || null;
}

/**
 * Check if player can purchase upgrade
 * @param {Object} profile - Player profile
 * @param {String} upgradeId - Upgrade ID
 * @returns {Object} - Purchase eligibility result
 */
export function canPurchaseUpgrade(profile, upgradeId) {
    const upgrade = getPrestigeUpgrade(upgradeId);
    if (!upgrade) {
        return { canPurchase: false, reason: 'Upgrade not found' };
    }
    
    // Initialize prestige data if needed
    if (!profile.prestigeUnlocks) {
        profile.prestigeUnlocks = {
            xpMultiplier: 1.0,
            energyBonus: 0,
            rareFishBonus: 0,
            dailyBonusMultiplier: 1.0
        };
    }
    
    // Check current level of this upgrade
    const currentLevel = profile.prestigeUnlocks[upgradeId + '_level'] || 0;
    
    if (currentLevel >= upgrade.maxLevel) {
        return { canPurchase: false, reason: 'Already maxed' };
    }
    
    // Check requirements
    if (upgrade.requires) {
        const reqLevel = profile.prestigeUnlocks[upgrade.requires.upgrade + '_level'] || 0;
        if (reqLevel < upgrade.requires.level) {
            return { 
                canPurchase: false, 
                reason: `Requires ${upgrade.requires.upgrade} level ${upgrade.requires.level}` 
            };
        }
    }
    
    // Check points
    if ((profile.prestigePoints || 0) < upgrade.cost) {
        return { 
            canPurchase: false, 
            reason: `Need ${upgrade.cost} points, have ${profile.prestigePoints || 0}` 
        };
    }
    
    return { canPurchase: true };
}

/**
 * Purchase prestige upgrade
 * @param {Object} profile - Player profile
 * @param {String} upgradeId - Upgrade ID
 * @returns {Object} - Purchase result
 */
export function purchasePrestigeUpgrade(profile, upgradeId) {
    const eligibility = canPurchaseUpgrade(profile, upgradeId);
    if (!eligibility.canPurchase) {
        return { success: false, message: eligibility.reason };
    }
    
    const upgrade = getPrestigeUpgrade(upgradeId);
    
    // Deduct points
    profile.prestigePoints -= upgrade.cost;
    
    // Apply upgrade effect
    const currentLevel = profile.prestigeUnlocks[upgradeId + '_level'] || 0;
    profile.prestigeUnlocks[upgradeId + '_level'] = currentLevel + 1;
    
    // Apply stat bonuses
    Object.keys(upgrade.effect).forEach(stat => {
        if (stat === 'xpMultiplier' || stat === 'dailyBonusMultiplier') {
            profile.prestigeUnlocks[stat] = (profile.prestigeUnlocks[stat] || 1.0) + upgrade.effect[stat];
        } else {
            profile.prestigeUnlocks[stat] = (profile.prestigeUnlocks[stat] || 0) + upgrade.effect[stat];
        }
    });
    
    return {
        success: true,
        upgrade: upgrade,
        newLevel: currentLevel + 1,
        remainingPoints: profile.prestigePoints,
        message: `Purchased ${upgrade.name} (Level ${currentLevel + 1}/${upgrade.maxLevel})`
    };
}

/**
 * Get all prestige upgrades with current levels
 * @param {Object} profile - Player profile
 * @returns {Array} - Upgrades with purchase info
 */
export function getPrestigeShop(profile) {
    if (!profile.prestigeUnlocks) {
        profile.prestigeUnlocks = {
            xpMultiplier: 1.0,
            energyBonus: 0,
            rareFishBonus: 0,
            dailyBonusMultiplier: 1.0
        };
    }
    
    return Object.values(prestigeUpgrades).map(upgrade => {
        const currentLevel = profile.prestigeUnlocks[upgrade.id + '_level'] || 0;
        const eligibility = canPurchaseUpgrade(profile, upgrade.id);
        
        return {
            ...upgrade,
            currentLevel: currentLevel,
            canPurchase: eligibility.canPurchase,
            reason: eligibility.reason || null,
            isMaxed: currentLevel >= upgrade.maxLevel
        };
    });
}

/**
 * Calculate total bonuses from prestige
 * @param {Object} profile - Player profile
 * @returns {Object} - Summary of all bonuses
 */
export function getPrestigeBonuses(profile) {
    const prestigeLevel = profile.prestigeLevel || 0;
    
    if (!profile.prestigeUnlocks) {
        profile.prestigeUnlocks = {
            xpMultiplier: 1.0,
            energyBonus: 0,
            rareFishBonus: 0,
            dailyBonusMultiplier: 1.0,
            variantBonus: 0,
            energyRegenBonus: 0,
            startingSeashells: 0,
            pityReduction: 0
        };
    }
    
    // Calculate automatic rebirth bonuses
    // Each rebirth grants: 1.5x at first, then +0.5x per additional rebirth
    // Rebirth 1: 1.5x, Rebirth 2: 2.0x, Rebirth 3: 2.5x, etc.
    const autoXpMultiplier = prestigeLevel > 0 ? 1.0 + (prestigeLevel * 0.5) : 1.0;
    const autoRareFishMultiplier = prestigeLevel > 0 ? 1.0 + (prestigeLevel * 0.5) : 1.0;
    
    // Combine automatic bonuses with purchased upgrades
    const purchasedXpBonus = (profile.prestigeUnlocks.xpMultiplier || 1.0);
    const purchasedRareFishBonus = (profile.prestigeUnlocks.rareFishBonus || 0);
    
    return {
        // XP multiplier: automatic rebirth bonus * purchased upgrades
        xpMultiplier: autoXpMultiplier * purchasedXpBonus,
        autoXpMultiplier: autoXpMultiplier, // Track separately for display
        purchasedXpMultiplier: purchasedXpBonus,
        
        // Rare fish: automatic rebirth multiplier + purchased bonus percentage
        rareFishMultiplier: autoRareFishMultiplier,
        rareFishBonus: purchasedRareFishBonus,
        
        // Other bonuses from purchased upgrades
        energyBonus: profile.prestigeUnlocks.energyBonus || 0,
        dailyBonusMultiplier: profile.prestigeUnlocks.dailyBonusMultiplier || 1.0,
        variantBonus: profile.prestigeUnlocks.variantBonus || 0,
        energyRegenBonus: profile.prestigeUnlocks.energyRegenBonus || 0,
        startingSeashells: profile.prestigeUnlocks.startingSeashells || 0,
        pityReduction: profile.prestigeUnlocks.pityReduction || 0
    };
}

/**
 * Get prestige badge/star display
 * @param {Number} prestigeLevel - Prestige level
 * @returns {String} - Badge emoji
 */
export function getPrestigeBadge(prestigeLevel) {
    if (prestigeLevel === 0) return '';
    if (prestigeLevel === 1) return '★';
    if (prestigeLevel === 2) return '★★';
    if (prestigeLevel === 3) return '★★★';
    if (prestigeLevel === 4) return '★★★★';
    if (prestigeLevel === 5) return '★★★★★';
    if (prestigeLevel >= 10) return '✦'.repeat(Math.min(prestigeLevel - 5, 5));
    return '★'.repeat(Math.min(prestigeLevel, 5));
}

/**
 * Format prestige level for display
 * @param {Number} prestigeLevel - Prestige level
 * @returns {String} - Formatted prestige
 */
export function formatPrestigeLevel(prestigeLevel) {
    if (prestigeLevel === 0) return 'No Prestige';
    return `Prestige ${prestigeLevel} ${getPrestigeBadge(prestigeLevel)}`;
}

export default {
    prestigeRequirements,
    prestigePointsPerLevel,
    prestigeUpgrades,
    checkPrestigeRequirements,
    performPrestige,
    getPrestigeUpgrade,
    canPurchaseUpgrade,
    purchasePrestigeUpgrade,
    getPrestigeShop,
    getPrestigeBonuses,
    getPrestigeBadge,
    formatPrestigeLevel
};
