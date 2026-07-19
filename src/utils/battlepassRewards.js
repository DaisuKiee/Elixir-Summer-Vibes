// Helper functions for awarding battle pass rewards including cosmetics
// DEPRECATED: Use levelRewards.js instead
import { getCosmeticsByTier } from '../data/cosmetics.js';
import { getLevel } from '../data/levelSystem.js';

/**
 * Award cosmetics for reaching a specific tier
 * @param {Object} profile - Summer profile document
 * @param {Number} tier - The tier that was just reached
 * @returns {Array} - Array of cosmetic items that were unlocked
 */
export async function awardCosmeticsForTier(profile, tier) {
    const cosmetics = getCosmeticsByTier(tier);
    const unlocked = [];
    
    if (!profile.ownedCosmetics) {
        profile.ownedCosmetics = [];
    }
    
    for (const cosmetic of cosmetics) {
        // Check if already owned
        const alreadyOwned = profile.ownedCosmetics.find(c => c.id === cosmetic.id);
        
        if (!alreadyOwned) {
            // Add to owned cosmetics
            profile.ownedCosmetics.push({
                type: cosmetic.category,
                id: cosmetic.id,
                name: cosmetic.name,
                rarity: cosmetic.rarity,
                unlockedAt: new Date()
            });
            
            unlocked.push(cosmetic);
        }
    }
    
    return unlocked;
}

/**
 * Award all battle pass rewards for a tier (currency, XP, items, cosmetics)
 * @param {Object} profile - Summer profile document
 * @param {Number} tier - The tier that was just reached
 * @param {Boolean} isPremium - Whether player has premium pass
 * @returns {Object} - Object containing arrays of awarded items
 */
export async function awardBattlePassRewards(profile, tier, isPremium = false) {
    const tierData = getTier(tier);
    const rewards = {
        seashells: 0,
        sunTokens: 0,
        cosmetics: [],
        other: []
    };
    
    if (!tierData) return rewards;
    
    // Process free rewards
    if (tierData.freeRewards) {
        processRewards(tierData.freeRewards, profile, rewards);
    }
    
    // Process premium rewards if applicable
    if (isPremium && tierData.premiumRewards) {
        processRewards(tierData.premiumRewards, profile, rewards);
    }
    
    // Award cosmetics for this tier
    const unlockedCosmetics = await awardCosmeticsForTier(profile, tier);
    rewards.cosmetics.push(...unlockedCosmetics);
    
    // Mark tier as claimed
    if (!profile.rewardsClaimed) {
        profile.rewardsClaimed = [];
    }
    
    if (!profile.rewardsClaimed.includes(tier)) {
        profile.rewardsClaimed.push(tier);
    }
    
    return rewards;
}

/**
 * Process individual rewards from tier data
 * @param {Array} rewardsList - Array of reward objects
 * @param {Object} profile - Summer profile document
 * @param {Object} rewards - Rewards accumulator object
 */
function processRewards(rewardsList, profile, rewards) {
    for (const reward of rewardsList) {
        switch (reward.type) {
            case 'seashells':
                profile.seashells = (profile.seashells || 0) + reward.amount;
                rewards.seashells += reward.amount;
                break;
                
            case 'sunTokens':
                profile.sunTokens = (profile.sunTokens || 0) + reward.amount;
                rewards.sunTokens += reward.amount;
                break;
                
            case 'fishingRod':
                const currentRodLevel = profile.equipment?.rod?.level || profile.fishingRodLevel || 1;
                if (reward.level > currentRodLevel) {
                    // Update new equipment system
                    if (!profile.equipment) profile.equipment = {};
                    if (!profile.equipment.rod) profile.equipment.rod = { level: 1 };
                    profile.equipment.rod.level = reward.level;
                    
                    // Also update old field for backward compatibility
                    profile.fishingRodLevel = reward.level;
                    
                    rewards.other.push({
                        type: 'fishingRod',
                        level: reward.level,
                        emoji: reward.emoji
                    });
                }
                break;
                
            case 'badge':
            case 'collectible':
            case 'mysteryBox':
            case 'xpBoost':
            case 'beachUnlock':
                rewards.other.push({
                    type: reward.type,
                    name: reward.name || reward.rarity,
                    emoji: reward.emoji
                });
                break;
        }
    }
}

/**
 * Check if player has unclaimed rewards between their current claimed tiers and actual tier
 * @param {Object} profile - Summer profile document
 * @returns {Array} - Array of tier numbers with unclaimed rewards
 */
export function getUnclaimedTiers(profile) {
    const currentTier = profile.battlePassLevel || 1;
    const claimedTiers = profile.rewardsClaimed || [];
    const unclaimed = [];
    
    for (let tier = 1; tier <= currentTier; tier++) {
        if (!claimedTiers.includes(tier)) {
            unclaimed.push(tier);
        }
    }
    
    return unclaimed;
}

/**
 * Format rewards for display in chat
 * @param {Object} rewards - Rewards object from awardBattlePassRewards
 * @returns {String} - Formatted string for display
 */
export function formatRewardsDisplay(rewards) {
    const parts = [];
    
    if (rewards.seashells > 0) {
        parts.push(`🐚 **${rewards.seashells}** Seashells`);
    }
    
    if (rewards.sunTokens > 0) {
        parts.push(`🌟 **${rewards.sunTokens}** Sun Tokens`);
    }
    
    if (rewards.cosmetics.length > 0) {
        rewards.cosmetics.forEach(cosmetic => {
            parts.push(`✨ **${cosmetic.name}** (${cosmetic.category})`);
        });
    }
    
    if (rewards.other.length > 0) {
        rewards.other.forEach(item => {
            if (item.type === 'fishingRod') {
                parts.push(`${item.emoji} **Fishing Rod Level ${item.level}**`);
            } else {
                parts.push(`${item.emoji} **${item.name}**`);
            }
        });
    }
    
    return parts.join('\n');
}
