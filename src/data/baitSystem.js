// Bait/Lure System for Strategic Fishing
// Consumable items that boost specific fish rarity chances

export const baitTypes = {
    worm_bait: {
        id: 'worm_bait',
        name: 'Worm Bait',
        emoji: '🪱',
        description: 'Basic bait that slightly increases common fish catches',
        cost: 50,
        duration: 10, // Number of catches
        effects: {
            common: 0.10,      // +10% common chance
            uncommon: 0.05     // +5% uncommon chance
        },
        unlockTier: 1
    },
    shrimp_bait: {
        id: 'shrimp_bait',
        name: 'Shrimp Bait',
        emoji: '🦐',
        description: 'Quality bait that boosts rare fish encounters',
        cost: 200,
        duration: 10,
        effects: {
            rare: 0.15,        // +15% rare chance
            uncommon: 0.10     // +10% uncommon chance
        },
        unlockTier: 10
    },
    squid_bait: {
        id: 'squid_bait',
        name: 'Squid Bait',
        emoji: '🦑',
        description: 'Premium bait for epic fish hunting',
        cost: 1000,
        duration: 8,
        effects: {
            epic: 0.20,        // +20% epic chance
            rare: 0.10         // +10% rare chance
        },
        unlockTier: 25
    },
    mythic_lure: {
        id: 'mythic_lure',
        name: 'Mythic Lure',
        emoji: '✨',
        description: 'Legendary lure that attracts the rarest fish',
        cost: 5000,
        duration: 5,
        effects: {
            legendary: 0.15,   // +15% legendary chance
            mythical: 0.05,    // +5% mythical chance
            epic: 0.10         // +10% epic chance
        },
        unlockTier: 50
    },
    master_bait: {
        id: 'master_bait',
        name: 'Master Bait',
        emoji: '🌟',
        description: 'The ultimate bait crafted by master anglers',
        cost: 10000,
        duration: 3,
        effects: {
            mythical: 0.10,    // +10% mythical chance
            legendary: 0.20,   // +20% legendary chance
            epic: 0.15         // +15% epic chance
        },
        unlockTier: 75
    },
    golden_lure: {
        id: 'golden_lure',
        name: 'Golden Lure',
        emoji: '💫',
        description: 'Attracts variant fish with increased chance',
        cost: 7500,
        duration: 5,
        effects: {
            variantBonus: 0.02  // +2% variant chance (stacks with normal)
        },
        unlockTier: 60
    }
};

/**
 * Get all bait types available to player
 * @param {Number} battlePassTier - Player's current tier
 * @returns {Array} - Available bait types
 */
export function getAvailableBaits(battlePassTier) {
    return Object.values(baitTypes).filter(bait => bait.unlockTier <= battlePassTier);
}

/**
 * Get bait by ID
 * @param {String} baitId - Bait ID
 * @returns {Object|null} - Bait data or null
 */
export function getBaitById(baitId) {
    return baitTypes[baitId] || null;
}

/**
 * Purchase bait for player
 * @param {Object} profile - Player profile
 * @param {String} baitId - Bait ID to purchase
 * @param {Number} quantity - Amount to purchase
 * @returns {Object} - Result with success status and message
 */
export function purchaseBait(profile, baitId, quantity = 1) {
    const bait = getBaitById(baitId);
    
    if (!bait) {
        return { success: false, message: 'Bait not found!' };
    }
    
    const totalCost = bait.cost * quantity;
    
    if (profile.seashells < totalCost) {
        return { 
            success: false, 
            message: `Not enough seashells! Need ${totalCost}, have ${profile.seashells}`
        };
    }
    
    // Deduct cost
    profile.seashells -= totalCost;
    
    // Add to inventory
    if (!profile.baitInventory) {
        profile.baitInventory = [];
    }
    
    const existingBait = profile.baitInventory.find(b => b.baitId === baitId);
    if (existingBait) {
        existingBait.quantity += quantity;
    } else {
        profile.baitInventory.push({
            baitId: baitId,
            quantity: quantity
        });
    }
    
    return {
        success: true,
        message: `Purchased ${quantity}x ${bait.name} for ${totalCost} seashells!`,
        bait: bait,
        quantity: quantity
    };
}

/**
 * Activate bait for fishing
 * @param {Object} profile - Player profile
 * @param {String} baitId - Bait ID to activate
 * @returns {Object} - Result with success status and message
 */
export function activateBait(profile, baitId) {
    const bait = getBaitById(baitId);
    
    if (!bait) {
        return { success: false, message: 'Bait not found!' };
    }
    
    // Check if player has bait
    if (!profile.baitInventory) {
        profile.baitInventory = [];
    }
    
    const playerBait = profile.baitInventory.find(b => b.baitId === baitId);
    if (!playerBait || playerBait.quantity <= 0) {
        return { success: false, message: `You don't have any ${bait.name}!` };
    }
    
    // Check if bait already active
    if (profile.activeBait && profile.activeBait.remainingUses > 0) {
        const activeBaitData = getBaitById(profile.activeBait.baitId);
        return { 
            success: false, 
            message: `${activeBaitData.name} is already active! (${profile.activeBait.remainingUses} uses left)`
        };
    }
    
    // Consume one bait from inventory
    playerBait.quantity -= 1;
    
    // Activate bait
    profile.activeBait = {
        baitId: baitId,
        remainingUses: bait.duration,
        activatedAt: new Date()
    };
    
    return {
        success: true,
        message: `${bait.emoji} **${bait.name}** activated! (${bait.duration} catches)`,
        bait: bait
    };
}

/**
 * Apply bait effects to catch rates
 * @param {Object} profile - Player profile
 * @param {Object} baseRates - Base catch rates by rarity
 * @returns {Object} - Modified catch rates
 */
export function applyBaitEffects(profile, baseRates) {
    if (!profile.activeBait || profile.activeBait.remainingUses <= 0) {
        return baseRates;
    }
    
    const bait = getBaitById(profile.activeBait.baitId);
    if (!bait) return baseRates;
    
    const modifiedRates = { ...baseRates };
    
    // Apply bait effects
    Object.keys(bait.effects).forEach(rarity => {
        if (rarity === 'variantBonus') return; // Skip variant bonus here
        
        if (modifiedRates[rarity] !== undefined) {
            modifiedRates[rarity] += bait.effects[rarity];
        }
    });
    
    return modifiedRates;
}

/**
 * Consume one use of active bait
 * @param {Object} profile - Player profile
 * @returns {Object} - Info about bait consumption
 */
export function consumeBaitUse(profile) {
    if (!profile.activeBait || profile.activeBait.remainingUses <= 0) {
        return { consumed: false, depleted: false };
    }
    
    profile.activeBait.remainingUses -= 1;
    
    const depleted = profile.activeBait.remainingUses <= 0;
    const bait = getBaitById(profile.activeBait.baitId);
    
    return {
        consumed: true,
        depleted: depleted,
        remainingUses: profile.activeBait.remainingUses,
        baitName: bait ? bait.name : 'Unknown'
    };
}

/**
 * Get variant bonus from bait (if applicable)
 * @param {Object} profile - Player profile
 * @returns {Number} - Bonus to variant chance (0 if no bonus)
 */
export function getVariantBonus(profile) {
    if (!profile.activeBait || profile.activeBait.remainingUses <= 0) {
        return 0;
    }
    
    const bait = getBaitById(profile.activeBait.baitId);
    if (!bait || !bait.effects.variantBonus) {
        return 0;
    }
    
    return bait.effects.variantBonus;
}

/**
 * Get player's bait inventory
 * @param {Object} profile - Player profile
 * @returns {Array} - Bait inventory with full data
 */
export function getBaitInventory(profile) {
    if (!profile.baitInventory) {
        return [];
    }
    
    return profile.baitInventory
        .filter(b => b.quantity > 0)
        .map(b => {
            const baitData = getBaitById(b.baitId);
            return {
                ...baitData,
                ownedQuantity: b.quantity
            };
        });
}

/**
 * Get active bait info
 * @param {Object} profile - Player profile
 * @returns {Object|null} - Active bait info or null
 */
export function getActiveBaitInfo(profile) {
    if (!profile.activeBait || profile.activeBait.remainingUses <= 0) {
        return null;
    }
    
    const bait = getBaitById(profile.activeBait.baitId);
    if (!bait) return null;
    
    return {
        ...bait,
        remainingUses: profile.activeBait.remainingUses,
        activatedAt: profile.activeBait.activatedAt
    };
}

/**
 * Format bait effects for display
 * @param {Object} bait - Bait data
 * @returns {String} - Formatted effects text
 */
export function formatBaitEffects(bait) {
    const effects = [];
    
    Object.keys(bait.effects).forEach(key => {
        const value = bait.effects[key];
        const percentage = (value * 100).toFixed(0);
        
        if (key === 'variantBonus') {
            effects.push(`+${percentage}% Variant Chance`);
        } else {
            const rarityName = key.charAt(0).toUpperCase() + key.slice(1);
            effects.push(`+${percentage}% ${rarityName}`);
        }
    });
    
    return effects.join('\n');
}

export default {
    baitTypes,
    getAvailableBaits,
    getBaitById,
    purchaseBait,
    activateBait,
    applyBaitEffects,
    consumeBaitUse,
    getVariantBonus,
    getBaitInventory,
    getActiveBaitInfo,
    formatBaitEffects
};
