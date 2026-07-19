// Helper functions for awarding XP and automatically unlocking cosmetics
import { getLevelFromXP } from '../data/levelSystem.js';
import { awardLevelRewards, formatRewardsDisplay } from './levelRewards.js';

/**
 * Award XP to a profile and check for level ups + cosmetic unlocks
 * @param {Object} profile - Summer profile document
 * @param {Number} xpAmount - Amount of XP to award
 * @param {Object} options - Optional settings
 * @returns {Object} - Object with level info and unlocked rewards
 */
export async function awardXP(profile, xpAmount, options = {}) {
    // Support legacy field names during migration
    const currentTotalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
    const oldLevel = getLevelFromXP(currentTotalXP);
    
    // Apply prestige XP multiplier if available
    let finalXP = xpAmount;
    if (profile.prestigeLevel && profile.prestigeLevel > 0) {
        const { getPrestigeBonuses } = await import('../data/prestigeSystem.js');
        const bonuses = getPrestigeBonuses(profile);
        finalXP = Math.floor(xpAmount * bonuses.xpMultiplier);
    }
    
    // Add XP to new fields
    profile.xp = (profile.xp || 0) + finalXP;
    profile.totalXP = (profile.totalXP || 0) + finalXP;
    
    // Keep legacy fields in sync during migration period
    if (profile.battlePassXP !== undefined) {
        profile.battlePassXP += finalXP;
    }
    
    const newLevel = getLevelFromXP(profile.totalXP);
    
    const result = {
        xpGained: finalXP,
        baseXP: xpAmount,
        oldLevel,
        newLevel,
        levelsGained: newLevel - oldLevel,
        rewards: [],
        rewardsText: ''
    };
    
    // Check if player leveled up
    if (newLevel > oldLevel) {
        // Update level field
        profile.level = newLevel;
        if (profile.battlePassLevel !== undefined) {
            profile.battlePassLevel = newLevel;
        }
        
        // Award rewards for each level gained
        for (let level = oldLevel + 1; level <= newLevel; level++) {
            const levelRewards = await awardLevelRewards(profile, level);
            result.rewards.push({
                level,
                rewards: levelRewards
            });
        }
        
        // Format all rewards for display
        result.rewardsText = formatLevelUpMessage(oldLevel, newLevel, result.rewards);
    }
    
    return result;
}

/**
 * Format level up message with all rewards
 * @param {Number} oldLevel - Previous level
 * @param {Number} newLevel - New level
 * @param {Array} rewardsList - Array of level rewards
 * @returns {String} - Formatted message
 */
function formatLevelUpMessage(oldLevel, newLevel, rewardsList) {
    if (!rewardsList || rewardsList.length === 0) return '';
    
    let message = '> **🎉 LEVEL UP!**\n';
    message += '> **Level ' + oldLevel + ' → ' + newLevel + '**\n>\n';
    
    // Combine all rewards
    const totalSeashells = rewardsList.reduce((sum, r) => sum + (r.rewards.seashells || 0), 0);
    const totalSunTokens = rewardsList.reduce((sum, r) => sum + (r.rewards.sunTokens || 0), 0);
    const allCosmetics = rewardsList.flatMap(r => r.rewards.cosmetics || []);
    const allOther = rewardsList.flatMap(r => r.rewards.other || []);
    
    message += '> **🎁 Rewards Unlocked:**\n';
    
    if (totalSeashells > 0) {
        message += '> **•** 🐚 ' + totalSeashells + ' Seashells\n';
    }
    
    if (totalSunTokens > 0) {
        message += '> **•** 🌟 ' + totalSunTokens + ' Sun Tokens\n';
    }
    
    if (allCosmetics.length > 0) {
        allCosmetics.forEach(cosmetic => {
            message += '> **•** ✨ **' + cosmetic.name + '** (NEW!)\n';
        });
    }
    
    if (allOther.length > 0) {
        allOther.forEach(item => {
            if (item.type === 'fishingRod') {
                message += '> **•** ' + item.emoji + ' Fishing Rod Level ' + item.level + '\n';
            } else if (item.name) {
                message += '> **•** ' + item.emoji + ' ' + item.name + '\n';
            }
        });
    }
    
    return message;
}

/**
 * Create a Components V2 container for tier up notification
 * @param {Object} client - Discord client
 * @param {Object} tierUpInfo - Tier up information from awardXP
 * @returns {Object} - Components container
 */
export function createTierUpContainer(client, tierUpInfo) {
    if (!tierUpInfo.tiersGained || tierUpInfo.tiersGained === 0) return null;
    
    const container = client.container()
        .setAccentColor(parseInt(client.color.success.replace('#', ''), 16));
    
    container.addTextDisplayComponents(
        (textDisplay) => textDisplay.setContent(tierUpInfo.rewardsText)
    );
    
    return container;
}

/**
 * Update challenge progress for various activities
 * @param {Object} profile - Summer profile document
 * @param {String} activityType - Type of activity ('fishing', 'exploring', 'collecting', etc.)
 * @param {Number} amount - Amount to progress (default 1)
 * @returns {Array} - Array of completed challenges
 */
export async function updateChallengeProgress(profile, activityType, amount = 1) {
    const completedChallenges = [];
    
    // Update daily challenges
    if (profile.dailyChallenges && profile.dailyChallenges.length > 0) {
        profile.dailyChallenges.forEach(challenge => {
            if (challenge.type === activityType && challenge.progress < challenge.goal) {
                challenge.progress += amount;
                
                if (challenge.progress >= challenge.goal && !profile.completedChallenges.includes(challenge.id)) {
                    completedChallenges.push({ ...challenge, frequency: 'daily' });
                    profile.completedChallenges.push(challenge.id);
                }
            }
        });
    }
    
    // Update weekly challenges
    if (profile.weeklyChallenges && profile.weeklyChallenges.length > 0) {
        profile.weeklyChallenges.forEach(challenge => {
            if (challenge.type === activityType && challenge.progress < challenge.goal) {
                challenge.progress += amount;
                
                if (challenge.progress >= challenge.goal && !profile.completedChallenges.includes(challenge.id)) {
                    completedChallenges.push({ ...challenge, frequency: 'weekly' });
                    profile.completedChallenges.push(challenge.id);
                }
            }
        });
    }
    
    return completedChallenges;
}

/**
 * Format completed challenges notification
 * @param {Array} completedChallenges - Array of completed challenges
 * @returns {String} - Formatted message
 */
export function formatCompletedChallenges(completedChallenges) {
    if (!completedChallenges || completedChallenges.length === 0) return '';
    
    let message = '> **✅ CHALLENGE COMPLETED!**\n';
    
    completedChallenges.forEach(challenge => {
        message += '> **' + challenge.description + '**\n';
        message += '> **Reward:** +' + challenge.reward + ' XP 📈\n';
    });
    
    return message;
}
