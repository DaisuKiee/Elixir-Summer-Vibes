// Boss/Raid System Logic
// Server-wide cooperative boss battles

import { getBossById } from './bossRoster.js';
import { getLevelFromXP } from './levelSystem.js';

export const bossStatus = {
    ACTIVE: 'active',
    DEFEATED: 'defeated',
    EXPIRED: 'expired'
};

/**
 * Calculate damage dealt to boss
 * @param {Object} profile - Player profile
 * @param {Object} boss - Boss object
 * @returns {Number} Damage dealt
 */
export function calculateBossDamage(profile, boss) {
    // Base damage from player level
    const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
    const playerLevel = getLevelFromXP(totalXP);
    const baseDamage = boss.stats.minDamagePerHit + 
        Math.random() * (boss.stats.maxDamagePerHit - boss.stats.minDamagePerHit);
    
    // Level scaling (higher level = more damage)
    const levelBonus = 1 + (playerLevel * 0.01); // +1% per level
    
    // Prestige bonus
    const prestigeBonus = 1 + ((profile.prestigeLevel || 0) * 0.05); // +5% per prestige
    
    // Fishing rod bonus (better equipment = more damage)
    const rodLevel = profile.equipment?.rod?.level || profile.fishingRodLevel || 1;
    const equipmentBonus = 1 + (rodLevel * 0.1); // +10% per rod level
    
    // Random critical hit chance (10%)
    const isCritical = Math.random() < 0.1;
    const criticalMultiplier = isCritical ? 2.0 : 1.0;
    
    const totalDamage = Math.floor(
        baseDamage * levelBonus * prestigeBonus * equipmentBonus * criticalMultiplier
    );
    
    return {
        damage: totalDamage,
        isCritical: isCritical
    };
}

/**
 * Attack boss and update damage
 * @param {Object} bossInstance - Active boss instance
 * @param {Object} profile - Player profile
 * @param {Number} damage - Damage to deal
 * @returns {Object} Attack result
 */
export function attackBoss(bossInstance, profile, damage) {
    // Check if boss is active
    if (bossInstance.status !== bossStatus.ACTIVE) {
        return {
            success: false,
            message: `Boss is ${bossInstance.status}`
        };
    }
    
    // Check if boss expired
    if (new Date() > new Date(bossInstance.expiresAt)) {
        bossInstance.status = bossStatus.EXPIRED;
        return {
            success: false,
            message: 'Boss encounter has expired'
        };
    }
    
    // Find or create player participation record
    let participation = bossInstance.participants.find(p => p.userId === profile._id);
    if (!participation) {
        participation = {
            userId: profile._id,
            username: profile.username,
            totalDamage: 0,
            attacks: 0,
            lastAttack: null
        };
        bossInstance.participants.push(participation);
    }
    
    // Apply damage
    const actualDamage = Math.min(damage, bossInstance.currentHP);
    bossInstance.currentHP -= actualDamage;
    
    // Update participation - IMPORTANT: Update the object in the array
    participation.totalDamage += actualDamage;
    participation.attacks += 1;
    participation.lastAttack = new Date();
    
    // Mark the participants array as modified so Mongoose saves it
    bossInstance.markModified('participants');
    
    // Check if boss defeated
    if (bossInstance.currentHP <= 0) {
        bossInstance.status = bossStatus.DEFEATED;
        bossInstance.defeatedAt = new Date();
    }
    
    // Update boss stats
    bossInstance.totalDamageDealt = (bossInstance.totalDamageDealt || 0) + actualDamage;
    
    return {
        success: true,
        damage: actualDamage,
        currentHP: bossInstance.currentHP,
        maxHP: bossInstance.maxHP,
        isDefeated: bossInstance.status === bossStatus.DEFEATED,
        participation: {
            totalDamage: participation.totalDamage,
            attacks: participation.attacks
        }
    };
}

/**
 * Check if player can attack boss (energy cost)
 * @param {Object} profile - Player profile
 * @returns {Object} Check result
 */
export function canAttackBoss(profile) {
    const energyCost = 25; // Boss attacks cost 25 energy
    
    if (profile.energy < energyCost) {
        return {
            canAttack: false,
            reason: `Need ${energyCost} energy to attack boss`,
            energyCost: energyCost,
            currentEnergy: profile.energy
        };
    }
    
    return {
        canAttack: true,
        energyCost: energyCost
    };
}

/**
 * Get player's rank in boss fight
 * @param {Object} bossInstance - Boss instance
 * @param {String} userId - Player user ID
 * @returns {Number} Player's rank (1-indexed)
 */
export function getPlayerRank(bossInstance, userId) {
    const sorted = [...bossInstance.participants].sort((a, b) => b.totalDamage - a.totalDamage);
    const index = sorted.findIndex(p => p.userId === userId);
    return index === -1 ? null : index + 1;
}

/**
 * Get top participants
 * @param {Object} bossInstance - Boss instance
 * @param {Number} count - Number of top participants
 * @returns {Array} Top participants
 */
export function getTopParticipants(bossInstance, count = 10) {
    return [...bossInstance.participants]
        .sort((a, b) => b.totalDamage - a.totalDamage)
        .slice(0, count);
}

/**
 * Calculate rewards for player
 * @param {Object} bossInstance - Boss instance
 * @param {Object} boss - Boss data from roster
 * @param {String} userId - Player user ID
 * @returns {Object} Rewards object
 */
export function calculateRewards(bossInstance, boss, userId) {
    if (bossInstance.status !== bossStatus.DEFEATED) {
        return null;
    }
    
    const participation = bossInstance.participants.find(p => p.userId === userId);
    if (!participation) {
        return null;
    }
    
    const rank = getPlayerRank(bossInstance, userId);
    let rewardTier = 'participation';
    
    // Determine reward tier based on rank
    if (rank === 1) {
        rewardTier = 'topDamage';
    } else if (rank <= 10) {
        rewardTier = 'top10';
    } else if (rank <= 50 && boss.rewards.top50) {
        rewardTier = 'top50';
    } else if (rank <= 100 && boss.rewards.top100) {
        rewardTier = 'top100';
    }
    
    const rewards = boss.rewards[rewardTier];
    
    return {
        tier: rewardTier,
        rank: rank,
        totalDamage: participation.totalDamage,
        damagePercent: ((participation.totalDamage / boss.stats.maxHP) * 100).toFixed(2),
        rewards: rewards,
        attacks: participation.attacks
    };
}

/**
 * Distribute rewards to player profile
 * @param {Object} profile - Player profile
 * @param {Object} rewards - Rewards object
 */
export function distributeRewards(profile, rewards) {
    if (!rewards || !rewards.rewards) return;
    
    const rewardData = rewards.rewards;
    
    // XP
    if (rewardData.xp) {
        profile.battlePassXP += rewardData.xp;
        profile.totalXPEarned += rewardData.xp;
    }
    
    // Seashells
    if (rewardData.seashells) {
        profile.seashells += rewardData.seashells;
    }
    
    // Sun Tokens
    if (rewardData.sunTokens) {
        profile.sunTokens += rewardData.sunTokens;
    }
    
    // Prestige Points (for mythical bosses)
    if (rewardData.prestigePoints && profile.prestigeLevel > 0) {
        profile.prestigePoints += rewardData.prestigePoints;
    }
    
    // Collectible
    if (rewardData.collectible) {
        const hasCollectible = profile.collectibles.some(c => c.id === rewardData.collectible);
        if (!hasCollectible) {
            profile.collectibles.push({
                id: rewardData.collectible,
                name: rewardData.collectible.replace(/_/g, ' '),
                category: 'boss_drops',
                rarity: rewards.tier === 'topDamage' ? 'legendary' : 'epic',
                obtainedAt: new Date()
            });
        }
    }
    
    // Badge
    if (rewardData.badge) {
        // TODO: Implement badge system
        // For now, add to achievements
        const hasBadge = (profile.achievements || []).some(a => a.achievementId === rewardData.badge);
        if (!hasBadge) {
            profile.achievements = profile.achievements || [];
            profile.achievements.push({
                achievementId: rewardData.badge,
                unlockedAt: new Date(),
                progress: 100
            });
        }
    }
    
    // Update boss stats
    if (!profile.bossStats) {
        profile.bossStats = {
            totalDamage: 0,
            bossesDefeated: 0,
            topDamage: 0,
            lastBossAttack: new Date()
        };
    }
    
    profile.bossStats.totalDamage += rewards.totalDamage;
    profile.bossStats.bossesDefeated += 1;
    if (rewards.totalDamage > profile.bossStats.topDamage) {
        profile.bossStats.topDamage = rewards.totalDamage;
    }
    profile.bossStats.lastBossAttack = new Date();
}

/**
 * Format boss HP bar
 * @param {Number} current - Current HP
 * @param {Number} max - Max HP
 * @returns {String} HP bar string
 */
export function formatBossHP(current, max) {
    const percent = (current / max) * 100;
    const barLength = 20;
    const filled = Math.floor((percent / 100) * barLength);
    const empty = barLength - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    return {
        bar: bar,
        percent: percent.toFixed(1),
        current: current,
        max: max
    };
}

/**
 * Get time remaining for boss
 * @param {Date} expiresAt - Expiration date
 * @returns {String} Time remaining formatted
 */
export function getTimeRemaining(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const remaining = expiry - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

/**
 * Check if player has already claimed rewards
 * @param {Object} profile - Player profile
 * @param {String} bossInstanceId - Boss instance ID
 * @returns {Boolean} True if already claimed
 */
export function hasClaimedRewards(profile, bossInstanceId) {
    if (!profile.bossStats || !profile.bossStats.claimedRewards) {
        return false;
    }
    return profile.bossStats.claimedRewards.includes(bossInstanceId);
}

/**
 * Mark rewards as claimed
 * @param {Object} profile - Player profile
 * @param {String} bossInstanceId - Boss instance ID
 */
export function markRewardsClaimed(profile, bossInstanceId) {
    if (!profile.bossStats) {
        profile.bossStats = {
            totalDamage: 0,
            bossesDefeated: 0,
            topDamage: 0,
            claimedRewards: []
        };
    }
    
    if (!profile.bossStats.claimedRewards) {
        profile.bossStats.claimedRewards = [];
    }
    
    if (!profile.bossStats.claimedRewards.includes(bossInstanceId)) {
        profile.bossStats.claimedRewards.push(bossInstanceId);
    }
}

export default {
    bossStatus,
    calculateBossDamage,
    attackBoss,
    canAttackBoss,
    getPlayerRank,
    getTopParticipants,
    calculateRewards,
    distributeRewards,
    formatBossHP,
    getTimeRemaining,
    hasClaimedRewards,
    markRewardsClaimed
};
