// Player Leveling System - 100 Levels with Unified Rewards
export const levelRewards = [];

// Rank titles by level milestone
export const rankTitles = {
    1: "Novice Angler",
    10: "Skilled Fisher",
    25: "Expert Fisher",
    40: "Veteran Angler",
    50: "Master Angler",
    75: "Legendary Fisher",
    100: "Grandmaster of the Seas"
};

// Generate all 100 levels (unified reward track - no premium distinction)
for (let level = 1; level <= 100; level++) {
    const levelData = {
        level,
        xpRequired: level * 100, // Each level requires level * 100 XP
        rewards: []
    };
    
    // Every 5 levels: seashells
    if (level % 5 === 0) {
        levelData.rewards.push({ type: 'seashells', amount: level * 15, emoji: '🐚' });
    }
    
    // Level 1: Welcome badge
    if (level === 1) {
        levelData.rewards.push({ type: 'badge', name: 'Summer Starter', emoji: '🏖️' });
    }
    
    // Level 5: First XP boost
    if (level === 5) {
        levelData.rewards.push({ type: 'xpBoost', duration: '1 hour', multiplier: 1.5, emoji: '⚡' });
    }
    
    // Level 10: Rank milestone
    if (level === 10) {
        levelData.rewards.push({ type: 'badge', name: 'Skilled Fisher', emoji: '🎣' });
        levelData.rewards.push({ type: 'sunTokens', amount: 100, emoji: '🌟' });
        levelData.rewards.push({ type: 'collectible', rarity: 'rare', emoji: '🎁' });
    }
    
    // Level 15: Collectible reward
    if (level === 15) {
        levelData.rewards.push({ type: 'collectible', rarity: 'rare', emoji: '🎁' });
        levelData.rewards.push({ type: 'seashells', amount: 500, emoji: '🐚' });
    }
    
    // Level 20: Beach unlock
    if (level === 20) {
        levelData.rewards.push({ type: 'badge', name: 'Beach Explorer', emoji: '🏝️' });
        levelData.rewards.push({ type: 'beachUnlock', beach: 'hidden-lagoon', emoji: '🗺️' });
    }
    
    // Level 25: Rank milestone
    if (level === 25) {
        levelData.rewards.push({ type: 'badge', name: 'Expert Fisher', emoji: '⭐' });
        levelData.rewards.push({ type: 'sunTokens', amount: 150, emoji: '🌟' });
        levelData.rewards.push({ type: 'collectible', rarity: 'epic', emoji: '🎁' });
        levelData.rewards.push({ type: 'pet', name: 'Baby Sea Turtle', emoji: '🐢' });
    }
    
    // Level 30: Major milestone
    if (level === 30) {
        levelData.rewards.push({ type: 'sunTokens', amount: 200, emoji: '🌟' });
        levelData.rewards.push({ type: 'emote', name: 'Summer Vibes Pack', emoji: '😎' });
    }
    
    // Level 35: Cosmetic reward
    if (level === 35) {
        levelData.rewards.push({ type: 'profileBanner', name: 'Sunset Paradise', emoji: '🌅' });
    }
    
    // Level 40: Rank milestone
    if (level === 40) {
        levelData.rewards.push({ type: 'badge', name: 'Veteran Angler', emoji: '🌊' });
        levelData.rewards.push({ type: 'sunTokens', amount: 250, emoji: '🌟' });
        levelData.rewards.push({ type: 'collectible', rarity: 'epic', emoji: '🎁' });
    }
    
    // Level 45: Beach unlock
    if (level === 45) {
        levelData.rewards.push({ type: 'beachUnlock', beach: 'crystal-cove', emoji: '🗺️' });
    }
    
    // Level 50: Major rank milestone
    if (level === 50) {
        levelData.rewards.push({ type: 'badge', name: 'Master Angler', emoji: '👑' });
        levelData.rewards.push({ type: 'sunTokens', amount: 500, emoji: '🌟' });
        levelData.rewards.push({ type: 'collectible', rarity: 'legendary', emoji: '🎁' });
        levelData.rewards.push({ type: 'pet', name: 'Tropical Parrot', emoji: '🦜' });
        levelData.rewards.push({ type: 'profileFrame', name: 'Golden Summer', emoji: '🖼️' });
        levelData.rewards.push({ type: 'beachUnlock', beach: 'diamond-beach', emoji: '🗺️' });
    }
    
    // Level 60: Cosmetic milestone
    if (level === 60) {
        levelData.rewards.push({ type: 'emote', name: 'Beach Party Pack', emoji: '🎉' });
        levelData.rewards.push({ type: 'sunTokens', amount: 300, emoji: '🌟' });
    }
    
    // Level 70: Major reward
    if (level === 70) {
        levelData.rewards.push({ type: 'profileBanner', name: 'Crystal Waters', emoji: '💎' });
        levelData.rewards.push({ type: 'sunTokens', amount: 400, emoji: '🌟' });
    }
    
    // Level 75: Rank milestone
    if (level === 75) {
        levelData.rewards.push({ type: 'badge', name: 'Legendary Fisher', emoji: '⭐' });
        levelData.rewards.push({ type: 'sunTokens', amount: 750, emoji: '🌟' });
        levelData.rewards.push({ type: 'collectible', rarity: 'legendary', emoji: '🎁' });
        levelData.rewards.push({ type: 'emote', name: 'Ocean Legends Pack', emoji: '🌊' });
    }
    
    // Level 80: Cosmetic reward
    if (level === 80) {
        levelData.rewards.push({ type: 'profileFrame', name: 'Diamond Summer', emoji: '💎' });
    }
    
    // Level 90: Near-max rewards
    if (level === 90) {
        levelData.rewards.push({ type: 'sunTokens', amount: 900, emoji: '🌟' });
        levelData.rewards.push({ type: 'collectible', rarity: 'legendary', emoji: '🎁' });
    }
    
    // Level 100: ULTIMATE MILESTONE
    if (level === 100) {
        levelData.rewards.push({ type: 'badge', name: 'Grandmaster of the Seas', emoji: '👑' });
        levelData.rewards.push({ type: 'sunTokens', amount: 2000, emoji: '🌟' });
        levelData.rewards.push({ type: 'pet', name: 'Diamond Crab', emoji: '💎' });
        levelData.rewards.push({ type: 'profileFrame', name: 'Rainbow Paradise', emoji: '🌈' });
        levelData.rewards.push({ type: 'title', name: 'Summer Champion 2026', emoji: '🏆' });
        levelData.rewards.push({ type: 'collectible', rarity: 'legendary', emoji: '🎁' });
    }
    
    // Add mystery boxes every 10 levels
    if (level % 10 === 0 && level !== 100) {
        levelData.rewards.push({ type: 'mysteryBox', rarity: 'rare', emoji: '🎁' });
    }
    
    levelRewards.push(levelData);
}

// Helper function to get level data
export function getLevel(levelNumber) {
    if (levelNumber > 100) {
        // Return infinite level reward structure
        return getInfiniteLevelReward();
    }
    return levelRewards.find(l => l.level === levelNumber);
}

// Helper function to calculate total XP needed for a level
export function getTotalXPForLevel(levelNumber) {
    if (levelNumber === 0) return 0;
    
    if (levelNumber <= 100) {
        // Sum of XP needed: level 1 = 100, level 2 = 100+200=300, level 3 = 300+300=600, etc.
        // Formula: sum from i=1 to N of (i * 100) = 100 * sum(i) = 100 * N*(N+1)/2
        return 50 * levelNumber * (levelNumber + 1);
    } else {
        // For infinite levels beyond 100
        const baseLevel100XP = 505000; // 50 * 100 * 101 = 505,000
        const levelsAbove100 = levelNumber - 100;
        return baseLevel100XP + (levelsAbove100 * 10000);
    }
}

// Helper function to get current level from total XP
export function getLevelFromXP(totalXP) {
    // Level 1 needs 100 XP, Level 2 needs 200 more (300 total), Level 3 needs 300 more (600 total), etc.
    // Formula: Total XP for level N = N * (N + 1) * 50
    
    if (totalXP === 0) return 0;
    
    let cumulativeXP = 0;
    for (let level = 1; level <= 100; level++) {
        cumulativeXP += level * 100;
        if (totalXP < cumulativeXP) {
            return level - 1;
        }
        if (totalXP === cumulativeXP) {
            return level;
        }
    }
    
    // If over level 100, calculate infinite levels
    // Each level after 100 requires 10,000 XP
    const baseLevel100XP = 505000; // Precomputed sum of 1-100 levels
    if (totalXP >= baseLevel100XP) {
        const xpAfter100 = totalXP - baseLevel100XP;
        const infiniteLevels = Math.floor(xpAfter100 / 10000);
        return 100 + infiniteLevels;
    }
    
    return 100;
}

// Helper function to get XP needed for next level
export function getXPForNextLevel(currentLevel) {
    if (currentLevel < 100) {
        return (currentLevel + 1) * 100;
    } else {
        // Infinite levels always need 10,000 XP
        return 10000;
    }
}

// Helper function to check if level is infinite level
export function isInfiniteLevel(level) {
    return level > 100;
}

// Helper function to get infinite level rewards
export function getInfiniteLevelReward() {
    return {
        level: 'infinite',
        xpRequired: 10000,
        rewards: [
            { type: 'seashells', amount: 200, emoji: '🐚' }
        ]
    };
}

// Get rank title for a level
export function getRankTitle(level) {
    // Find the highest rank milestone achieved
    const milestones = Object.keys(rankTitles).map(Number).sort((a, b) => b - a);
    for (const milestone of milestones) {
        if (level >= milestone) {
            return rankTitles[milestone];
        }
    }
    return rankTitles[1]; // Default to Novice Angler
}

// XP sources and amounts (unchanged from battle pass)
export const xpSources = {
    fishing: { min: 10, max: 50 },
    exploring: 25,
    dailyLogin: 50,
    challengeDaily: 100,
    challengeWeekly: 500,
    serverChallenge: 200,
    collectible: { common: 10, uncommon: 20, rare: 50, epic: 100, legendary: 250 },
    beachHunt: 20
};

// Calculate XP progress toward next level
export function getXPProgress(profile) {
    const currentLevel = getLevelFromXP(profile.totalXP || profile.xp || 0);
    const currentLevelTotalXP = getTotalXPForLevel(currentLevel);
    const nextLevelTotalXP = getTotalXPForLevel(currentLevel + 1);
    const xpInCurrentLevel = (profile.totalXP || profile.xp || 0) - currentLevelTotalXP;
    const xpNeededForNext = nextLevelTotalXP - currentLevelTotalXP;
    const progressPercent = Math.floor((xpInCurrentLevel / xpNeededForNext) * 100);
    
    return {
        currentLevel,
        xpInCurrentLevel,
        xpNeededForNext,
        progressPercent,
        totalXP: profile.totalXP || profile.xp || 0
    };
}

// Check if player leveled up and return gained levels
export function checkLevelUp(profile, xpGained) {
    const oldLevel = getLevelFromXP(profile.totalXP - xpGained);
    const newLevel = getLevelFromXP(profile.totalXP);
    
    if (newLevel > oldLevel) {
        return {
            leveled: true,
            oldLevel,
            newLevel,
            levelsGained: newLevel - oldLevel
        };
    }
    
    return {
        leveled: false,
        oldLevel,
        newLevel,
        levelsGained: 0
    };
}

// DEPRECATED: Legacy Battle Pass functions (for backward compatibility during migration)
export const battlePassTiers = levelRewards; // Alias for migration
export const getTier = getLevel; // Alias
export const getTierFromXP = getLevelFromXP; // Alias
export const getTotalXPForTier = getTotalXPForLevel; // Alias
export const getXPForNextTier = getXPForNextLevel; // Alias
