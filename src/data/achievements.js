// Achievement System - Track player accomplishments
// Provides completionist goals and rewards

import { getLevelFromXP } from './levelSystem.js';
import { awardXP } from '../utils/xpRewards.js';

export const achievementCategories = {
    FISHING: 'fishing',
    EXPLORATION: 'exploration',
    COLLECTION: 'collection',
    COMBAT: 'combat',
    SOCIAL: 'social',
    PRESTIGE: 'prestige',
    MASTERY: 'mastery'
};

export const achievementTiers = {
    BRONZE: 'bronze',
    SILVER: 'silver',
    GOLD: 'gold',
    PLATINUM: 'platinum',
    DIAMOND: 'diamond'
};

export const achievements = {
    // === FISHING ACHIEVEMENTS ===
    first_catch: {
        id: 'first_catch',
        name: 'First Catch',
        description: 'Catch your first fish',
        category: achievementCategories.FISHING,
        tier: achievementTiers.BRONZE,
        icon: '🎣',
        requirement: { fishCaught: 1 },
        rewards: { xp: 100, seashells: 500 },
        hidden: false
    },
    
    novice_fisher: {
        id: 'novice_fisher',
        name: 'Novice Fisher',
        description: 'Catch 10 fish',
        category: achievementCategories.FISHING,
        tier: achievementTiers.BRONZE,
        icon: '🎣',
        requirement: { fishCaught: 10 },
        rewards: { xp: 250, seashells: 1000 },
        hidden: false
    },
    
    skilled_angler: {
        id: 'skilled_angler',
        name: 'Skilled Angler',
        description: 'Catch 50 fish',
        category: achievementCategories.FISHING,
        tier: achievementTiers.SILVER,
        icon: '🎣',
        requirement: { fishCaught: 50 },
        rewards: { xp: 500, seashells: 2500 },
        hidden: false
    },
    
    expert_fisher: {
        id: 'expert_fisher',
        name: 'Expert Fisher',
        description: 'Catch 100 fish',
        category: achievementCategories.FISHING,
        tier: achievementTiers.GOLD,
        icon: '🎣',
        requirement: { fishCaught: 100 },
        rewards: { xp: 1000, seashells: 5000, sunTokens: 5 },
        hidden: false
    },
    
    master_angler: {
        id: 'master_angler',
        name: 'Master Angler',
        description: 'Catch 500 fish',
        category: achievementCategories.FISHING,
        tier: achievementTiers.PLATINUM,
        icon: '🎣',
        requirement: { fishCaught: 500 },
        rewards: { xp: 5000, seashells: 25000, sunTokens: 25 },
        hidden: false
    },
    
    legendary_fisher: {
        id: 'legendary_fisher',
        name: 'Legendary Fisher',
        description: 'Catch 1000 fish',
        category: achievementCategories.FISHING,
        tier: achievementTiers.DIAMOND,
        icon: '🎣',
        requirement: { fishCaught: 1000 },
        rewards: { xp: 10000, seashells: 100000, sunTokens: 100, prestigePoints: 1 },
        hidden: false
    },
    
    // === RARITY ACHIEVEMENTS ===
    mythical_catch: {
        id: 'mythical_catch',
        name: 'Myth Hunter',
        description: 'Catch a mythical fish',
        category: achievementCategories.FISHING,
        tier: achievementTiers.GOLD,
        icon: '🐉',
        requirement: { mythicalFish: 1 },
        rewards: { xp: 2000, seashells: 10000, sunTokens: 10 },
        hidden: false
    },
    
    variant_collector: {
        id: 'variant_collector',
        name: 'Variant Collector',
        description: 'Catch 10 variant fish',
        category: achievementCategories.COLLECTION,
        tier: achievementTiers.GOLD,
        icon: '✨',
        requirement: { variantFish: 10 },
        rewards: { xp: 3000, seashells: 15000, sunTokens: 15 },
        hidden: false
    },
    
    rainbow_master: {
        id: 'rainbow_master',
        name: 'Rainbow Master',
        description: 'Catch a rainbow variant fish',
        category: achievementCategories.COLLECTION,
        tier: achievementTiers.DIAMOND,
        icon: '🌈',
        requirement: { rainbowVariant: 1 },
        rewards: { xp: 10000, seashells: 50000, sunTokens: 50, prestigePoints: 2 },
        hidden: false
    },
    
    // === EXPLORATION ACHIEVEMENTS ===
    first_island: {
        id: 'first_island',
        name: 'Island Hopper',
        description: 'Discover your first island',
        category: achievementCategories.EXPLORATION,
        tier: achievementTiers.BRONZE,
        icon: '🏝️',
        requirement: { islandsDiscovered: 1 },
        rewards: { xp: 200, seashells: 1000 },
        hidden: false
    },
    
    luzon_explorer: {
        id: 'luzon_explorer',
        name: 'Luzon Explorer',
        description: 'Discover all 18 Luzon islands',
        category: achievementCategories.EXPLORATION,
        tier: achievementTiers.SILVER,
        icon: '🟢',
        requirement: { luzonIslands: 18 },
        rewards: { xp: 1500, seashells: 7500, sunTokens: 5 },
        hidden: false
    },
    
    visayas_explorer: {
        id: 'visayas_explorer',
        name: 'Visayas Explorer',
        description: 'Discover all 18 Visayas islands',
        category: achievementCategories.EXPLORATION,
        tier: achievementTiers.SILVER,
        icon: '🟡',
        requirement: { visayasIslands: 18 },
        rewards: { xp: 1500, seashells: 7500, sunTokens: 5 },
        hidden: false
    },
    
    mindanao_explorer: {
        id: 'mindanao_explorer',
        name: 'Mindanao Explorer',
        description: 'Discover all 18 Mindanao islands',
        category: achievementCategories.EXPLORATION,
        tier: achievementTiers.SILVER,
        icon: '🔴',
        requirement: { mindanaoIslands: 18 },
        rewards: { xp: 1500, seashells: 7500, sunTokens: 5 },
        hidden: false
    },
    
    archipelago_master: {
        id: 'archipelago_master',
        name: 'Archipelago Master',
        description: 'Discover all 54 Philippine islands',
        category: achievementCategories.EXPLORATION,
        tier: achievementTiers.DIAMOND,
        icon: '🇵🇭',
        requirement: { islandsDiscovered: 54 },
        rewards: { xp: 10000, seashells: 50000, sunTokens: 100, prestigePoints: 3 },
        hidden: false
    },
    
    // === COLLECTION ACHIEVEMENTS ===
    collector_start: {
        id: 'collector_start',
        name: 'Treasure Hunter',
        description: 'Find 10 collectibles',
        category: achievementCategories.COLLECTION,
        tier: achievementTiers.BRONZE,
        icon: '🐚',
        requirement: { collectibles: 10 },
        rewards: { xp: 300, seashells: 1500 },
        hidden: false
    },
    
    dedicated_collector: {
        id: 'dedicated_collector',
        name: 'Dedicated Collector',
        description: 'Find 50 collectibles',
        category: achievementCategories.COLLECTION,
        tier: achievementTiers.GOLD,
        icon: '🐚',
        requirement: { collectibles: 50 },
        rewards: { xp: 2000, seashells: 10000, sunTokens: 10 },
        hidden: false
    },
    
    completionist: {
        id: 'completionist',
        name: 'Completionist',
        description: 'Find all 100 collectibles',
        category: achievementCategories.COLLECTION,
        tier: achievementTiers.DIAMOND,
        icon: '💎',
        requirement: { collectibles: 100 },
        rewards: { xp: 15000, seashells: 100000, sunTokens: 150, prestigePoints: 5 },
        hidden: false
    },
    
    // === COMBAT/BOSS ACHIEVEMENTS ===
    first_boss: {
        id: 'first_boss',
        name: 'Boss Hunter',
        description: 'Participate in your first boss battle',
        category: achievementCategories.COMBAT,
        tier: achievementTiers.BRONZE,
        icon: '⚔️',
        requirement: { bossParticipation: 1 },
        rewards: { xp: 500, seashells: 2500 },
        hidden: false
    },
    
    boss_slayer: {
        id: 'boss_slayer',
        name: 'Boss Slayer',
        description: 'Defeat 5 bosses',
        category: achievementCategories.COMBAT,
        tier: achievementTiers.SILVER,
        icon: '⚔️',
        requirement: { bossesDefeated: 5 },
        rewards: { xp: 2500, seashells: 12500, sunTokens: 10 },
        hidden: false
    },
    
    top_damage_dealer: {
        id: 'top_damage_dealer',
        name: 'Top Damage Dealer',
        description: 'Rank #1 in damage on any boss',
        category: achievementCategories.COMBAT,
        tier: achievementTiers.GOLD,
        icon: '💪',
        requirement: { topDamageRank: 1 },
        rewards: { xp: 5000, seashells: 25000, sunTokens: 25 },
        hidden: false
    },
    
    mythical_slayer: {
        id: 'mythical_slayer',
        name: 'Mythical Slayer',
        description: 'Defeat a mythical difficulty boss',
        category: achievementCategories.COMBAT,
        tier: achievementTiers.PLATINUM,
        icon: '🐉',
        requirement: { mythicalBoss: 1 },
        rewards: { xp: 10000, seashells: 50000, sunTokens: 50, prestigePoints: 2 },
        hidden: false
    },
    
    // === SOCIAL ACHIEVEMENTS ===
    first_trade: {
        id: 'first_trade',
        name: 'Trader',
        description: 'Complete your first trade',
        category: achievementCategories.SOCIAL,
        tier: achievementTiers.BRONZE,
        icon: '🤝',
        requirement: { tradesCompleted: 1 },
        rewards: { xp: 300, seashells: 1500 },
        hidden: false
    },
    
    active_trader: {
        id: 'active_trader',
        name: 'Active Trader',
        description: 'Complete 25 trades',
        category: achievementCategories.SOCIAL,
        tier: achievementTiers.SILVER,
        icon: '🤝',
        requirement: { tradesCompleted: 25 },
        rewards: { xp: 2000, seashells: 10000, sunTokens: 10 },
        hidden: false
    },
    
    merchant: {
        id: 'merchant',
        name: 'Merchant',
        description: 'Complete 100 trades',
        category: achievementCategories.SOCIAL,
        tier: achievementTiers.GOLD,
        icon: '💰',
        requirement: { tradesCompleted: 100 },
        rewards: { xp: 5000, seashells: 25000, sunTokens: 25, prestigePoints: 1 },
        hidden: false
    },
    
    // === BREEDING ACHIEVEMENTS ===
    first_breed: {
        id: 'first_breed',
        name: 'Breeder',
        description: 'Successfully breed your first fish',
        category: achievementCategories.MASTERY,
        tier: achievementTiers.BRONZE,
        icon: '🐟',
        requirement: { successfulBreeds: 1 },
        rewards: { xp: 500, seashells: 2500 },
        hidden: false
    },
    
    expert_breeder: {
        id: 'expert_breeder',
        name: 'Expert Breeder',
        description: 'Successfully breed 25 fish',
        category: achievementCategories.MASTERY,
        tier: achievementTiers.GOLD,
        icon: '🐟',
        requirement: { successfulBreeds: 25 },
        rewards: { xp: 5000, seashells: 25000, sunTokens: 25 },
        hidden: false
    },
    
    // === PRESTIGE ACHIEVEMENTS ===
    first_prestige: {
        id: 'first_prestige',
        name: 'Ascended',
        description: 'Reach prestige level 1',
        category: achievementCategories.PRESTIGE,
        tier: achievementTiers.GOLD,
        icon: '⭐',
        requirement: { prestigeLevel: 1 },
        rewards: { xp: 5000, seashells: 25000, sunTokens: 50 },
        hidden: false
    },
    
    prestige_veteran: {
        id: 'prestige_veteran',
        name: 'Prestige Veteran',
        description: 'Reach prestige level 5',
        category: achievementCategories.PRESTIGE,
        tier: achievementTiers.PLATINUM,
        icon: '⭐',
        requirement: { prestigeLevel: 5 },
        rewards: { xp: 10000, seashells: 50000, sunTokens: 100, prestigePoints: 5 },
        hidden: false
    },
    
    prestige_legend: {
        id: 'prestige_legend',
        name: 'Prestige Legend',
        description: 'Reach prestige level 10',
        category: achievementCategories.PRESTIGE,
        tier: achievementTiers.DIAMOND,
        icon: '✦',
        requirement: { prestigeLevel: 10 },
        rewards: { xp: 25000, seashells: 150000, sunTokens: 250, prestigePoints: 10 },
        hidden: false
    },
    
    // === MASTERY ACHIEVEMENTS ===
    tier_100: {
        id: 'tier_100',
        name: 'Century Club',
        description: 'Reach tier 100',
        category: achievementCategories.MASTERY,
        tier: achievementTiers.PLATINUM,
        icon: '💯',
        requirement: { tier: 100 },
        rewards: { xp: 10000, seashells: 50000, sunTokens: 100 },
        hidden: false
    },
    
    millionaire: {
        id: 'millionaire',
        name: 'Millionaire',
        description: 'Accumulate 1,000,000 total seashells earned',
        category: achievementCategories.MASTERY,
        tier: achievementTiers.PLATINUM,
        icon: '💰',
        requirement: { totalSeashellsEarned: 1000000 },
        rewards: { xp: 10000, sunTokens: 100, prestigePoints: 3 },
        hidden: false
    },
    
    // === HIDDEN ACHIEVEMENTS ===
    speed_demon: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Reach tier 50 in under 7 days',
        category: achievementCategories.MASTERY,
        tier: achievementTiers.PLATINUM,
        icon: '⚡',
        requirement: { tier50InDays: 7 },
        rewards: { xp: 5000, seashells: 25000, sunTokens: 50 },
        hidden: true
    }
};

/**
 * Get achievement by ID
 * @param {String} achievementId - Achievement ID
 * @returns {Object|null} Achievement object or null
 */
export function getAchievementById(achievementId) {
    return achievements[achievementId] || null;
}

/**
 * Get all achievements
 * @returns {Array} Array of achievement objects
 */
export function getAllAchievements() {
    return Object.values(achievements);
}

/**
 * Get achievements by category
 * @param {String} category - Achievement category
 * @returns {Array} Array of achievements
 */
export function getAchievementsByCategory(category) {
    return getAllAchievements().filter(a => a.category === category);
}

/**
 * Get achievements by tier
 * @param {String} tier - Achievement tier
 * @returns {Array} Array of achievements
 */
export function getAchievementsByTier(tier) {
    return getAllAchievements().filter(a => a.tier === tier);
}

/**
 * Check if player meets achievement requirement
 * @param {Object} profile - Player profile
 * @param {Object} achievement - Achievement object
 * @returns {Object} Check result with progress
 */
export function checkAchievementProgress(profile, achievement) {
    const requirement = achievement.requirement;
    const requirementKey = Object.keys(requirement)[0];
    const requirementValue = requirement[requirementKey];
    
    let currentValue = 0;
    
    // Map requirement keys to profile values
    switch (requirementKey) {
        case 'fishCaught':
            currentValue = profile.fishCaught || 0;
            break;
        case 'mythicalFish':
            currentValue = (profile.fishInventory || []).filter(f => f.rarity === 'mythical').length;
            break;
        case 'variantFish':
            currentValue = (profile.variantFish || []).length;
            break;
        case 'rainbowVariant':
            currentValue = (profile.variantFish || []).filter(v => v.variant === 'rainbow').length;
            break;
        case 'islandsDiscovered':
            currentValue = (profile.visitedIslands || []).length;
            break;
        case 'luzonIslands':
        case 'visayasIslands':
        case 'mindanaoIslands':
            // Would need island group tracking
            currentValue = 0; // Placeholder
            break;
        case 'collectibles':
            currentValue = (profile.collectibles || []).length;
            break;
        case 'bossParticipation':
            currentValue = profile.bossStats?.totalDamage > 0 ? 1 : 0;
            break;
        case 'bossesDefeated':
            currentValue = profile.bossStats?.bossesDefeated || 0;
            break;
        case 'topDamageRank':
            currentValue = 0; // Would need boss rank tracking
            break;
        case 'mythicalBoss':
            currentValue = 0; // Would need mythical boss defeat tracking
            break;
        case 'tradesCompleted':
            currentValue = profile.tradeCount || 0;
            break;
        case 'successfulBreeds':
            currentValue = (profile.breedingPairs || []).filter(b => b.success).length;
            break;
        case 'prestigeLevel':
            currentValue = profile.prestigeLevel || 0;
            break;
        case 'tier':
            const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
            currentValue = getLevelFromXP(totalXP);
            break;
        case 'totalSeashellsEarned':
            currentValue = profile.totalSeashellsEarned || 0;
            break;
        default:
            currentValue = 0;
    }
    
    const isComplete = currentValue >= requirementValue;
    const progress = Math.min(100, (currentValue / requirementValue) * 100);
    
    return {
        isComplete: isComplete,
        currentValue: currentValue,
        requiredValue: requirementValue,
        progress: progress,
        progressPercent: progress.toFixed(1)
    };
}

/**
 * Award achievement to player
 * @param {Object} profile - Player profile
 * @param {String} achievementId - Achievement ID
 * @returns {Object} Award result
 */
export async function awardAchievement(profile, achievementId) {
    const achievement = getAchievementById(achievementId);
    if (!achievement) {
        return { success: false, message: 'Achievement not found' };
    }
    
    // Check if already unlocked
    const hasAchievement = (profile.achievements || []).some(a => a.achievementId === achievementId);
    if (hasAchievement) {
        return { success: false, message: 'Achievement already unlocked' };
    }
    
    // Check if requirements met
    const progress = checkAchievementProgress(profile, achievement);
    if (!progress.isComplete) {
        return { success: false, message: 'Requirements not met', progress: progress };
    }
    
    // Award achievement
    if (!profile.achievements) {
        profile.achievements = [];
    }
    
    profile.achievements.push({
        achievementId: achievementId,
        unlockedAt: new Date(),
        progress: 100
    });
    
    // Award rewards
    if (achievement.rewards.xp) {
        // Use awardXP helper for proper level tracking
        await awardXP(profile, achievement.rewards.xp);
    }
    if (achievement.rewards.seashells) {
        profile.seashells += achievement.rewards.seashells;
    }
    if (achievement.rewards.sunTokens) {
        profile.sunTokens += achievement.rewards.sunTokens;
    }
    if (achievement.rewards.prestigePoints && profile.prestigeLevel > 0) {
        profile.prestigePoints += achievement.rewards.prestigePoints;
    }
    
    return {
        success: true,
        achievement: achievement,
        rewards: achievement.rewards
    };
}

/**
 * Check and award all eligible achievements
 * @param {Object} profile - Player profile
 * @returns {Array} Array of newly awarded achievements
 */
export function checkAndAwardAchievements(profile) {
    const newAchievements = [];
    
    for (const achievement of getAllAchievements()) {
        const result = awardAchievement(profile, achievement.id);
        if (result.success) {
            newAchievements.push(result);
        }
    }
    
    return newAchievements;
}

/**
 * Get tier color
 * @param {String} tier - Achievement tier
 * @returns {String} Hex color
 */
export function getTierColor(tier) {
    const colors = {
        [achievementTiers.BRONZE]: '#CD7F32',
        [achievementTiers.SILVER]: '#C0C0C0',
        [achievementTiers.GOLD]: '#FFD700',
        [achievementTiers.PLATINUM]: '#E5E4E2',
        [achievementTiers.DIAMOND]: '#B9F2FF'
    };
    return colors[tier] || '#FFFFFF';
}

/**
 * Get tier emoji
 * @param {String} tier - Achievement tier
 * @returns {String} Emoji
 */
export function getTierEmoji(tier) {
    const emojis = {
        [achievementTiers.BRONZE]: '🥉',
        [achievementTiers.SILVER]: '🥈',
        [achievementTiers.GOLD]: '🥇',
        [achievementTiers.PLATINUM]: '💍',
        [achievementTiers.DIAMOND]: '💎'
    };
    return emojis[tier] || '🏆';
}

export default {
    achievementCategories,
    achievementTiers,
    achievements,
    getAchievementById,
    getAllAchievements,
    getAchievementsByCategory,
    getAchievementsByTier,
    checkAchievementProgress,
    awardAchievement,
    checkAndAwardAchievements,
    getTierColor,
    getTierEmoji
};
