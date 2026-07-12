// Shiny/Variant System for Fish
// Rare color variants of existing fish with bonus rewards

export const variantTypes = {
    golden: {
        name: 'Golden',
        emoji: '✨',
        color: '#FFD700',
        chance: 0.01,      // 1%
        multipliers: {
            xp: 2.0,
            seashells: 2.0,
            prestigePoints: 2.0
        },
        description: 'A rare golden variant that shimmers like sunlight!'
    },
    crystal: {
        name: 'Crystal',
        emoji: '💎',
        color: '#00FFFF',
        chance: 0.005,     // 0.5%
        multipliers: {
            xp: 3.0,
            seashells: 3.0,
            prestigePoints: 3.0
        },
        description: 'A crystalline beauty with translucent scales!'
    },
    shadow: {
        name: 'Shadow',
        emoji: '🌑',
        color: '#4B0082',
        chance: 0.003,     // 0.3%
        multipliers: {
            xp: 4.0,
            seashells: 4.0,
            prestigePoints: 4.0
        },
        description: 'A mysterious shadow variant from the deep abyss!'
    },
    rainbow: {
        name: 'Rainbow',
        emoji: '🌈',
        color: '#FF1493',
        chance: 0.001,     // 0.1%
        multipliers: {
            xp: 5.0,
            seashells: 5.0,
            prestigePoints: 5.0
        },
        description: 'The legendary rainbow variant - the rarest of all!'
    }
};

/**
 * Roll for a variant when catching a fish
 * @param {Number} prestigeLevel - Player's prestige level (increases odds)
 * @param {Number} prestigeVariantBonus - Bonus from prestige upgrades (from prestigeUnlocks.variantBonus)
 * @returns {String|null} - Variant type or null for normal
 */
export function rollForVariant(prestigeLevel = 0, prestigeVariantBonus = 0) {
    const roll = Math.random();
    
    // Prestige bonus: +0.1% per prestige level + purchased upgrades
    const prestigeBonus = (prestigeLevel * 0.001) + prestigeVariantBonus;
    
    // Check from rarest to most common
    if (roll < (variantTypes.rainbow.chance + prestigeBonus)) {
        return 'rainbow';
    } else if (roll < (variantTypes.shadow.chance + prestigeBonus)) {
        return 'shadow';
    } else if (roll < (variantTypes.crystal.chance + prestigeBonus)) {
        return 'crystal';
    } else if (roll < (variantTypes.golden.chance + prestigeBonus)) {
        return 'golden';
    }
    
    return null; // Normal variant
}

/**
 * Get display info for a variant fish
 * @param {String} fishName - Name of the fish
 * @param {String} variant - Variant type
 * @returns {Object} - Display information
 */
export function getVariantDisplay(fishName, variant) {
    if (!variant || variant === 'normal') {
        return {
            name: fishName,
            prefix: '',
            emoji: '',
            announcement: null
        };
    }
    
    const variantData = variantTypes[variant];
    if (!variantData) {
        return {
            name: fishName,
            prefix: '',
            emoji: '',
            announcement: null
        };
    }
    
    return {
        name: `${variantData.name} ${fishName}`,
        prefix: variantData.name,
        emoji: variantData.emoji,
        announcement: `${variantData.emoji} **${variantData.name.toUpperCase()}!** ${variantData.description}`
    };
}

/**
 * Calculate bonus rewards for variant catch
 * @param {Number} baseXP - Base XP reward
 * @param {Number} baseSeashells - Base seashell reward
 * @param {String} variant - Variant type
 * @returns {Object} - Multiplied rewards
 */
export function calculateVariantRewards(baseXP, baseSeashells, variant) {
    const variantData = variantTypes[variant];
    
    if (!variantData) {
        return {
            xp: baseXP,
            seashells: baseSeashells,
            multiplier: 1.0
        };
    }
    
    return {
        xp: Math.floor(baseXP * variantData.multipliers.xp),
        seashells: Math.floor(baseSeashells * variantData.multipliers.seashells),
        multiplier: variantData.multipliers.xp
    };
}

/**
 * Track variant catch in player profile
 * @param {Object} profile - Player profile
 * @param {String} fishId - Fish ID
 * @param {String} variant - Variant type
 */
export function trackVariantCatch(profile, fishId, variant) {
    if (!profile.variantFish) {
        profile.variantFish = [];
    }
    
    profile.variantFish.push({
        fishId: fishId,
        variant: variant,
        caughtAt: new Date()
    });
}

/**
 * Get variant collection stats
 * @param {Object} profile - Player profile
 * @returns {Object} - Collection statistics
 */
export function getVariantStats(profile) {
    if (!profile.variantFish || profile.variantFish.length === 0) {
        return {
            total: 0,
            golden: 0,
            crystal: 0,
            shadow: 0,
            rainbow: 0
        };
    }
    
    const stats = {
        total: profile.variantFish.length,
        golden: 0,
        crystal: 0,
        shadow: 0,
        rainbow: 0
    };
    
    profile.variantFish.forEach(fish => {
        if (stats.hasOwnProperty(fish.variant)) {
            stats[fish.variant]++;
        }
    });
    
    return stats;
}

/**
 * Check if player has caught variant of specific fish
 * @param {Object} profile - Player profile
 * @param {String} fishId - Fish ID
 * @param {String} variant - Variant type
 * @returns {Boolean} - True if caught
 */
export function hasVariant(profile, fishId, variant) {
    if (!profile.variantFish) return false;
    
    return profile.variantFish.some(fish => 
        fish.fishId === fishId && fish.variant === variant
    );
}

/**
 * Get rarest variant caught by player
 * @param {Object} profile - Player profile
 * @returns {String|null} - Rarest variant type or null
 */
export function getRarestVariant(profile) {
    if (!profile.variantFish || profile.variantFish.length === 0) {
        return null;
    }
    
    const rarityOrder = ['rainbow', 'shadow', 'crystal', 'golden'];
    
    for (const variant of rarityOrder) {
        if (profile.variantFish.some(fish => fish.variant === variant)) {
            return variant;
        }
    }
    
    return null;
}

/**
 * Format variant badge for display
 * @param {String} variant - Variant type
 * @returns {String} - Formatted badge
 */
export function getVariantBadge(variant) {
    const variantData = variantTypes[variant];
    if (!variantData) return '';
    
    return `${variantData.emoji} **${variantData.name.toUpperCase()}**`;
}

/**
 * Get variant multiplier display
 * @param {String} variant - Variant type
 * @returns {String} - Formatted multiplier text
 */
export function getVariantMultiplierText(variant) {
    const variantData = variantTypes[variant];
    if (!variantData) return '';
    
    return `${variantData.multipliers.xp}x rewards`;
}

/**
 * Get total variant catch chances with bonuses
 * @param {Number} prestigeLevel - Player's prestige level
 * @returns {Object} - All variant chances
 */
export function getVariantChances(prestigeLevel = 0) {
    const prestigeBonus = prestigeLevel * 0.001;
    
    return {
        golden: {
            base: variantTypes.golden.chance,
            bonus: prestigeBonus,
            total: variantTypes.golden.chance + prestigeBonus,
            percentage: ((variantTypes.golden.chance + prestigeBonus) * 100).toFixed(2) + '%'
        },
        crystal: {
            base: variantTypes.crystal.chance,
            bonus: prestigeBonus,
            total: variantTypes.crystal.chance + prestigeBonus,
            percentage: ((variantTypes.crystal.chance + prestigeBonus) * 100).toFixed(2) + '%'
        },
        shadow: {
            base: variantTypes.shadow.chance,
            bonus: prestigeBonus,
            total: variantTypes.shadow.chance + prestigeBonus,
            percentage: ((variantTypes.shadow.chance + prestigeBonus) * 100).toFixed(2) + '%'
        },
        rainbow: {
            base: variantTypes.rainbow.chance,
            bonus: prestigeBonus,
            total: variantTypes.rainbow.chance + prestigeBonus,
            percentage: ((variantTypes.rainbow.chance + prestigeBonus) * 100).toFixed(2) + '%'
        }
    };
}

export default {
    variantTypes,
    rollForVariant,
    getVariantDisplay,
    calculateVariantRewards,
    trackVariantCatch,
    getVariantStats,
    hasVariant,
    getRarestVariant,
    getVariantBadge,
    getVariantMultiplierText,
    getVariantChances
};
