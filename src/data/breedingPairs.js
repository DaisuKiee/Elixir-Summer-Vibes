// Fish Breeding Pairs - Combinations that produce new fish
// Inspired by Pokemon breeding mechanics adapted for Philippine fish

export const breedingRarity = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary',
    MYTHICAL: 'mythical'
};

export const breedingTime = {
    COMMON: 2 * 60 * 60 * 1000, // 2 hours
    UNCOMMON: 4 * 60 * 60 * 1000, // 4 hours
    RARE: 8 * 60 * 60 * 1000, // 8 hours
    EPIC: 12 * 60 * 60 * 1000, // 12 hours
    LEGENDARY: 24 * 60 * 60 * 1000, // 24 hours
    MYTHICAL: 48 * 60 * 60 * 1000 // 48 hours
};

// Success rates based on rarity
export const breedingSuccessRates = {
    [breedingRarity.COMMON]: 0.95, // 95%
    [breedingRarity.UNCOMMON]: 0.85, // 85%
    [breedingRarity.RARE]: 0.70, // 70%
    [breedingRarity.EPIC]: 0.50, // 50%
    [breedingRarity.LEGENDARY]: 0.30, // 30%
    [breedingRarity.MYTHICAL]: 0.10 // 10%
};

// Breeding pairs - specific combinations produce specific offspring
export const breedingPairs = {
    // === COMMON → UNCOMMON ===
    bangus_tilapia: {
        id: 'bangus_tilapia',
        parents: ['bangus', 'tilapia'],
        offspring: 'hybrid_bangus',
        offspringName: 'Hybrid Bangus',
        rarity: breedingRarity.UNCOMMON,
        successRate: 0.85,
        description: 'A crossbreed with enhanced flavor and size',
        emoji: '🐟'
    },
    
    // === UNCOMMON → RARE ===
    parrotfish_surgeonfish: {
        id: 'parrotfish_surgeonfish',
        parents: ['parrotfish', 'blue_tang'],
        offspring: 'rainbow_surgeon',
        offspringName: 'Rainbow Surgeon',
        rarity: breedingRarity.RARE,
        successRate: 0.70,
        description: 'Brilliant colors of both parents combined',
        emoji: '🐠'
    },
    
    clownfish_angelfish: {
        id: 'clownfish_angelfish',
        parents: ['clownfish', 'angelfish'],
        offspring: 'celestial_clown',
        offspringName: 'Celestial Clown',
        rarity: breedingRarity.RARE,
        successRate: 0.70,
        description: 'Playful personality with angelic beauty',
        emoji: '🐠'
    },
    
    // === RARE → EPIC ===
    tuna_marlin: {
        id: 'tuna_marlin',
        parents: ['tuna', 'marlin'],
        offspring: 'speedster_tuna',
        offspringName: 'Speedster Tuna',
        rarity: breedingRarity.EPIC,
        successRate: 0.50,
        description: 'Lightning-fast predator of the deep',
        emoji: '🐡'
    },
    
    lionfish_pufferfish: {
        id: 'lionfish_pufferfish',
        parents: ['lionfish', 'pufferfish'],
        offspring: 'venomous_puffer',
        offspringName: 'Venomous Puffer',
        rarity: breedingRarity.EPIC,
        successRate: 0.50,
        description: 'Deadly spines meet toxic defense',
        emoji: '🐡'
    },
    
    // === EPIC → LEGENDARY ===
    manta_shark: {
        id: 'manta_shark',
        parents: ['manta_ray', 'hammerhead'],
        offspring: 'phantom_ray',
        offspringName: 'Phantom Ray',
        rarity: breedingRarity.LEGENDARY,
        successRate: 0.30,
        description: 'Graceful gliding hunter of the depths',
        emoji: '🦈'
    },
    
    whale_shark_dolphin: {
        id: 'whale_shark_dolphin',
        parents: ['whale_shark', 'dolphin'],
        offspring: 'leviathan',
        offspringName: 'Leviathan',
        rarity: breedingRarity.LEGENDARY,
        successRate: 0.30,
        description: 'Gentle giant with incredible intelligence',
        emoji: '🐋'
    },
    
    // === LEGENDARY → MYTHICAL ===
    bakunawa_siyokoy: {
        id: 'bakunawa_siyokoy',
        parents: ['bakunawa', 'siyokoy_fish'],
        offspring: 'sea_serpent_king',
        offspringName: 'Sea Serpent King',
        rarity: breedingRarity.MYTHICAL,
        successRate: 0.10,
        description: 'Legendary fusion of dragon and demon',
        emoji: '🐉'
    },
    
    // === SAME RARITY BREEDING (Variant Chance) ===
    rare_rare: {
        id: 'rare_rare',
        parents: ['any_rare', 'any_rare'], // Same rarity
        offspring: 'variant_chance',
        offspringName: 'Variant Offspring',
        rarity: breedingRarity.RARE,
        successRate: 0.80,
        variantBonus: 0.15, // +15% variant chance
        description: 'Breeding same rarity increases variant chance',
        emoji: '✨'
    },
    
    epic_epic: {
        id: 'epic_epic',
        parents: ['any_epic', 'any_epic'],
        offspring: 'variant_chance',
        offspringName: 'Variant Offspring',
        rarity: breedingRarity.EPIC,
        successRate: 0.70,
        variantBonus: 0.20, // +20% variant chance
        description: 'High chance of variant offspring',
        emoji: '✨'
    },
    
    legendary_legendary: {
        id: 'legendary_legendary',
        parents: ['any_legendary', 'any_legendary'],
        offspring: 'variant_chance',
        offspringName: 'Variant Offspring',
        rarity: breedingRarity.LEGENDARY,
        successRate: 0.50,
        variantBonus: 0.30, // +30% variant chance
        description: 'Very high chance of variant offspring',
        emoji: '✨'
    }
};

// Generic breeding rules when no specific pair exists
export const genericBreedingRules = {
    same_rarity: {
        description: 'Breeding two fish of the same rarity',
        successRate: 0.80,
        outcome: 'random_same_rarity', // Returns random fish of same rarity
        variantBonus: 0.10 // +10% variant chance
    },
    
    adjacent_rarity: {
        description: 'Breeding fish one rarity apart',
        successRate: 0.60,
        outcome: 'random_lower_rarity', // Returns random fish of lower parent rarity
        variantBonus: 0.05 // +5% variant chance
    },
    
    different_rarity: {
        description: 'Breeding fish more than one rarity apart',
        successRate: 0.40,
        outcome: 'random_lowest_rarity', // Returns random fish of lowest parent rarity
        variantBonus: 0.02 // +2% variant chance
    }
};

/**
 * Get breeding pair by parent IDs
 * @param {String} parent1Id - First parent fish ID
 * @param {String} parent2Id - Second parent fish ID
 * @returns {Object|null} Breeding pair data or null
 */
export function getBreedingPair(parent1Id, parent2Id) {
    // Normalize IDs (order doesn't matter)
    const ids = [parent1Id, parent2Id].sort();
    
    // Check all breeding pairs
    for (const pair of Object.values(breedingPairs)) {
        if (!pair.parents || pair.parents.length !== 2) continue;
        
        const pairIds = [...pair.parents].sort();
        
        // Check if parent IDs match (allowing wildcards like 'any_rare')
        const match1 = pairIds[0] === ids[0] || pairIds[0].startsWith('any_');
        const match2 = pairIds[1] === ids[1] || pairIds[1].startsWith('any_');
        
        if (match1 && match2) {
            return pair;
        }
    }
    
    return null;
}

/**
 * Get breeding time based on rarity
 * @param {String} rarity - Offspring rarity
 * @returns {Number} Breeding time in milliseconds
 */
export function getBreedingTime(rarity) {
    return breedingTime[rarity.toUpperCase()] || breedingTime.COMMON;
}

/**
 * Get success rate for breeding
 * @param {String} rarity - Offspring rarity
 * @param {Number} prestigeLevel - Player's prestige level (bonus)
 * @returns {Number} Success rate (0-1)
 */
export function getBreedingSuccessRate(rarity, prestigeLevel = 0) {
    const baseRate = breedingSuccessRates[rarity] || 0.50;
    const prestigeBonus = prestigeLevel * 0.02; // +2% per prestige level
    return Math.min(0.95, baseRate + prestigeBonus); // Cap at 95%
}

/**
 * Calculate breeding cost
 * @param {String} rarity - Offspring rarity
 * @returns {Number} Cost in seashells
 */
export function getBreedingCost(rarity) {
    const costs = {
        [breedingRarity.COMMON]: 500,
        [breedingRarity.UNCOMMON]: 1000,
        [breedingRarity.RARE]: 2500,
        [breedingRarity.EPIC]: 5000,
        [breedingRarity.LEGENDARY]: 15000,
        [breedingRarity.MYTHICAL]: 50000
    };
    return costs[rarity] || 1000;
}

/**
 * Get all possible breeding pairs for a fish
 * @param {String} fishId - Fish ID
 * @returns {Array} Array of possible pairs
 */
export function getPossiblePairs(fishId) {
    const possible = [];
    
    for (const pair of Object.values(breedingPairs)) {
        if (pair.parents && pair.parents.includes(fishId)) {
            possible.push(pair);
        }
    }
    
    return possible;
}

/**
 * Get breeding requirement level
 * @param {String} rarity - Fish rarity
 * @returns {Number} Required tier
 */
export function getBreedingRequirement(rarity) {
    const requirements = {
        [breedingRarity.COMMON]: 15,
        [breedingRarity.UNCOMMON]: 20,
        [breedingRarity.RARE]: 30,
        [breedingRarity.EPIC]: 45,
        [breedingRarity.LEGENDARY]: 60,
        [breedingRarity.MYTHICAL]: 80
    };
    return requirements[rarity] || 15;
}

/**
 * Format breeding time for display
 * @param {Number} milliseconds - Time in milliseconds
 * @returns {String} Formatted time string
 */
export function formatBreedingTime(milliseconds) {
    const hours = Math.floor(milliseconds / (60 * 60 * 1000));
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

export default {
    breedingRarity,
    breedingTime,
    breedingSuccessRates,
    breedingPairs,
    genericBreedingRules,
    getBreedingPair,
    getBreedingTime,
    getBreedingSuccessRate,
    getBreedingCost,
    getPossiblePairs,
    getBreedingRequirement,
    formatBreedingTime
};
