// Pity/Guarantee System for Fish Catches
// Prevents extreme bad luck by guaranteeing rare fish after X attempts

export const pityThresholds = {
    epic: 100,         // Guaranteed epic fish after 100 catches without one
    legendary: 500,    // Guaranteed legendary fish after 500 catches without one
    mythical: 2000     // Guaranteed mythical fish after 2000 catches without one
};

/**
 * Check if player has hit pity threshold for a rarity
 * @param {Object} profile - Player profile with pityCounters
 * @param {String} rarity - Rarity to check ('epic', 'legendary', 'mythical')
 * @returns {Boolean} - True if pity threshold reached
 */
export function isPityTriggered(profile, rarity) {
    if (!profile.pityCounters) {
        return false;
    }
    
    const counter = profile.pityCounters[rarity] || 0;
    const threshold = pityThresholds[rarity] || Infinity;
    
    return counter >= threshold;
}

/**
 * Reset pity counter for a specific rarity
 * @param {Object} profile - Player profile
 * @param {String} rarity - Rarity to reset
 */
export function resetPityCounter(profile, rarity) {
    if (!profile.pityCounters) {
        profile.pityCounters = { epic: 0, legendary: 0, mythical: 0 };
    }
    
    profile.pityCounters[rarity] = 0;
}

/**
 * Increment pity counters for rarities higher than caught
 * @param {Object} profile - Player profile
 * @param {String} caughtRarity - Rarity of fish just caught
 */
export function incrementPityCounters(profile, caughtRarity) {
    if (!profile.pityCounters) {
        profile.pityCounters = { epic: 0, legendary: 0, mythical: 0 };
    }
    
    const rarityHierarchy = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
    const caughtIndex = rarityHierarchy.indexOf(caughtRarity.toLowerCase());
    
    // Increment counters for rarities higher than what was caught
    if (caughtIndex < 3) profile.pityCounters.epic++;
    if (caughtIndex < 4) profile.pityCounters.legendary++;
    if (caughtIndex < 5) profile.pityCounters.mythical++;
    
    // Reset counter for the rarity that was just caught (and below)
    if (caughtRarity.toLowerCase() === 'epic') {
        profile.pityCounters.epic = 0;
    } else if (caughtRarity.toLowerCase() === 'legendary') {
        profile.pityCounters.epic = 0;
        profile.pityCounters.legendary = 0;
    } else if (caughtRarity.toLowerCase() === 'mythical') {
        profile.pityCounters.epic = 0;
        profile.pityCounters.legendary = 0;
        profile.pityCounters.mythical = 0;
    }
}

/**
 * Get progress towards next pity guarantees
 * @param {Object} profile - Player profile
 * @returns {Object} - Progress for each rarity
 */
export function getPityProgress(profile) {
    if (!profile.pityCounters) {
        profile.pityCounters = { epic: 0, legendary: 0, mythical: 0 };
    }
    
    return {
        epic: {
            current: profile.pityCounters.epic,
            threshold: pityThresholds.epic,
            percentage: Math.floor((profile.pityCounters.epic / pityThresholds.epic) * 100),
            remaining: Math.max(0, pityThresholds.epic - profile.pityCounters.epic)
        },
        legendary: {
            current: profile.pityCounters.legendary,
            threshold: pityThresholds.legendary,
            percentage: Math.floor((profile.pityCounters.legendary / pityThresholds.legendary) * 100),
            remaining: Math.max(0, pityThresholds.legendary - profile.pityCounters.legendary)
        },
        mythical: {
            current: profile.pityCounters.mythical,
            threshold: pityThresholds.mythical,
            percentage: Math.floor((profile.pityCounters.mythical / pityThresholds.mythical) * 100),
            remaining: Math.max(0, pityThresholds.mythical - profile.pityCounters.mythical)
        }
    };
}

/**
 * Force a guaranteed fish based on pity
 * @param {Object} profile - Player profile
 * @returns {String|null} - Rarity to guarantee, or null if no pity triggered
 */
export function getPityGuaranteedRarity(profile) {
    // Check in order of rarity (mythical first since it's rarest)
    if (isPityTriggered(profile, 'mythical')) {
        return 'mythical';
    }
    if (isPityTriggered(profile, 'legendary')) {
        return 'legendary';
    }
    if (isPityTriggered(profile, 'epic')) {
        return 'epic';
    }
    
    return null;
}

/**
 * Get notification message for pity trigger
 * @param {String} rarity - Rarity that triggered pity
 * @returns {String} - Formatted message
 */
export function getPityNotification(rarity) {
    const messages = {
        epic: '🎊 **PITY TRIGGERED!** You\'re guaranteed an **EPIC** fish this catch!',
        legendary: '✨ **PITY ACTIVATED!** You\'re guaranteed a **LEGENDARY** fish this catch!',
        mythical: '🌟 **MYTHICAL PITY!** You\'re guaranteed a **MYTHICAL** creature this catch!'
    };
    
    return messages[rarity] || '';
}

/**
 * Format pity progress for display
 * @param {Object} progress - Progress object from getPityProgress
 * @param {String} rarity - Rarity to format
 * @returns {String} - Formatted progress bar
 */
export function formatPityProgressBar(progress, rarity) {
    const data = progress[rarity];
    if (!data) return '';
    
    const barLength = 20;
    const filled = Math.floor((data.current / data.threshold) * barLength);
    const empty = barLength - filled;
    
    const bar = '▰'.repeat(filled) + '▱'.repeat(empty);
    
    return `${bar} ${data.percentage}% (${data.current}/${data.threshold})`;
}

export default {
    pityThresholds,
    isPityTriggered,
    resetPityCounter,
    incrementPityCounters,
    getPityProgress,
    getPityGuaranteedRarity,
    getPityNotification,
    formatPityProgressBar
};
