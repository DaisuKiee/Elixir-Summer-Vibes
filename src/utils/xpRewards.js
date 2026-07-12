// Helper functions for awarding XP and automatically unlocking cosmetics
import { getTierFromXP } from '../data/battlepass.js';
import { awardBattlePassRewards, formatRewardsDisplay } from './battlepassRewards.js';

/**
 * Award XP to a profile and check for tier ups + cosmetic unlocks
 * @param {Object} profile - Summer profile document
 * @param {Number} xpAmount - Amount of XP to award
 * @returns {Object} - Object with tier info and unlocked rewards
 */
export async function awardXP(profile, xpAmount) {
    const oldTier = getTierFromXP(profile.battlePassXP);
    
    // Add XP
    profile.battlePassXP += xpAmount;
    profile.totalXPEarned += xpAmount;
    
    const newTier = getTierFromXP(profile.battlePassXP);
    
    const result = {
        xpGained: xpAmount,
        oldTier,
        newTier,
        tiersGained: newTier - oldTier,
        rewards: [],
        rewardsText: ''
    };
    
    // Check if player leveled up
    if (newTier > oldTier) {
        // Award rewards for each tier gained
        for (let tier = oldTier + 1; tier <= newTier; tier++) {
            const tierRewards = await awardBattlePassRewards(profile, tier, profile.isPremiumPass);
            result.rewards.push({
                tier,
                rewards: tierRewards
            });
        }
        
        // Format all rewards for display
        result.rewardsText = formatTierUpMessage(oldTier, newTier, result.rewards);
    }
    
    return result;
}

/**
 * Format tier up message with all rewards
 * @param {Number} oldTier - Previous tier
 * @param {Number} newTier - New tier
 * @param {Array} rewardsList - Array of tier rewards
 * @returns {String} - Formatted message
 */
function formatTierUpMessage(oldTier, newTier, rewardsList) {
    if (!rewardsList || rewardsList.length === 0) return '';
    
    let message = '> **🎉 BATTLE PASS TIER UP!**\n';
    message += '> **Tier ' + oldTier + ' → ' + newTier + '**\n>\n';
    
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
