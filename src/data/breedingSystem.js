// Fish Breeding System Logic
// Combine two fish to create new species or variants

import {
    getBreedingPair,
    getBreedingTime,
    getBreedingSuccessRate,
    getBreedingCost,
    getBreedingRequirement,
    breedingRarity,
    genericBreedingRules
} from './breedingPairs.js';
import { rollForVariant, trackVariantCatch } from './variantSystem.js';

/**
 * Check if player can breed
 * @param {Object} profile - Player profile
 * @param {String} targetRarity - Rarity of offspring
 * @returns {Object} Check result
 */
export function canBreed(profile, targetRarity = breedingRarity.COMMON) {
    const currentTier = Math.floor(profile.battlePassXP / 100);
    const requiredTier = getBreedingRequirement(targetRarity);
    
    if (currentTier < requiredTier) {
        return {
            canBreed: false,
            reason: `Reach tier ${requiredTier} to breed ${targetRarity} fish`,
            requiredTier: requiredTier,
            currentTier: currentTier
        };
    }
    
    // Check if already breeding
    if (profile.activeBreeding && profile.activeBreeding.parent1) {
        return {
            canBreed: false,
            reason: 'Already have an active breeding session',
            activeBreeding: profile.activeBreeding
        };
    }
    
    // Check seashell cost
    const cost = getBreedingCost(targetRarity);
    if (profile.seashells < cost) {
        return {
            canBreed: false,
            reason: `Need ${cost} seashells (have ${profile.seashells})`,
            cost: cost,
            current: profile.seashells
        };
    }
    
    return {
        canBreed: true,
        cost: cost
    };
}

/**
 * Start breeding process
 * @param {Object} profile - Player profile
 * @param {Number} parent1Index - Index of first parent in fishInventory
 * @param {Number} parent2Index - Index of second parent in fishInventory
 * @returns {Object} Breeding start result
 */
export function startBreeding(profile, parent1Index, parent2Index) {
    // Validate indices
    if (!profile.fishInventory[parent1Index] || !profile.fishInventory[parent2Index]) {
        return {
            success: false,
            message: 'One or both parent fish not found in inventory'
        };
    }
    
    // Can't breed same fish with itself
    if (parent1Index === parent2Index) {
        return {
            success: false,
            message: 'Cannot breed a fish with itself'
        };
    }
    
    const parent1 = profile.fishInventory[parent1Index];
    const parent2 = profile.fishInventory[parent2Index];
    
    // Determine breeding pair and outcome
    const breedingPair = getBreedingPair(
        parent1.name.toLowerCase().replace(/\s+/g, '_'),
        parent2.name.toLowerCase().replace(/\s+/g, '_')
    );
    
    let targetRarity, offspringId, offspringName, successRate, variantBonus = 0;
    
    if (breedingPair) {
        // Specific breeding pair found
        targetRarity = breedingPair.rarity;
        offspringId = breedingPair.offspring;
        offspringName = breedingPair.offspringName;
        successRate = breedingPair.successRate;
        variantBonus = breedingPair.variantBonus || 0;
    } else {
        // Use generic rules based on parent rarities
        const rule = determineGenericRule(parent1.rarity, parent2.rarity);
        targetRarity = getHigherRarity(parent1.rarity, parent2.rarity);
        offspringId = 'random';
        offspringName = 'Random Offspring';
        successRate = rule.successRate;
        variantBonus = rule.variantBonus;
    }
    
    // Check if player can breed this rarity
    const breedCheck = canBreed(profile, targetRarity);
    if (!breedCheck.canBreed) {
        return {
            success: false,
            message: breedCheck.reason
        };
    }
    
    // Deduct cost
    const cost = getBreedingCost(targetRarity);
    profile.seashells -= cost;
    
    // Remove parent fish from inventory
    const removedParents = [];
    if (parent1Index > parent2Index) {
        removedParents.push(profile.fishInventory.splice(parent1Index, 1)[0]);
        removedParents.push(profile.fishInventory.splice(parent2Index, 1)[0]);
    } else {
        removedParents.push(profile.fishInventory.splice(parent2Index, 1)[0]);
        removedParents.push(profile.fishInventory.splice(parent1Index, 1)[0]);
    }
    
    // Calculate breeding time
    const breedingTime = getBreedingTime(targetRarity);
    const finishTime = new Date(Date.now() + breedingTime);
    
    // Adjust success rate with prestige
    const finalSuccessRate = getBreedingSuccessRate(targetRarity, profile.prestigeLevel || 0);
    
    // Set active breeding
    profile.activeBreeding = {
        parent1: removedParents[0].name,
        parent2: removedParents[1].name,
        parent1Rarity: removedParents[0].rarity,
        parent2Rarity: removedParents[1].rarity,
        offspringId: offspringId,
        offspringName: offspringName,
        offspringRarity: targetRarity,
        successRate: finalSuccessRate,
        variantBonus: variantBonus,
        startedAt: new Date(),
        finishesAt: finishTime,
        cost: cost
    };
    
    return {
        success: true,
        breeding: profile.activeBreeding,
        parents: removedParents,
        cost: cost,
        breedingTime: breedingTime,
        finishTime: finishTime
    };
}

/**
 * Check if breeding is complete
 * @param {Object} profile - Player profile
 * @returns {Object} Completion check result
 */
export function checkBreedingComplete(profile) {
    if (!profile.activeBreeding || !profile.activeBreeding.parent1) {
        return {
            isComplete: false,
            hasActive: false,
            message: 'No active breeding'
        };
    }
    
    const finishTime = new Date(profile.activeBreeding.finishesAt);
    const now = new Date();
    
    if (now >= finishTime) {
        return {
            isComplete: true,
            hasActive: true,
            breeding: profile.activeBreeding
        };
    }
    
    const timeRemaining = finishTime - now;
    return {
        isComplete: false,
        hasActive: true,
        timeRemaining: timeRemaining,
        breeding: profile.activeBreeding
    };
}

/**
 * Claim breeding offspring
 * @param {Object} profile - Player profile
 * @returns {Object} Claim result
 */
export function claimOffspring(profile) {
    const check = checkBreedingComplete(profile);
    
    if (!check.hasActive) {
        return {
            success: false,
            message: 'No active breeding to claim'
        };
    }
    
    if (!check.isComplete) {
        return {
            success: false,
            message: 'Breeding not complete yet',
            timeRemaining: check.timeRemaining
        };
    }
    
    const breeding = profile.activeBreeding;
    
    // Roll for success
    const successRoll = Math.random();
    const isSuccess = successRoll < breeding.successRate;
    
    let offspring = null;
    let variant = null;
    
    if (isSuccess) {
        // Breeding successful - create offspring
        
        // Roll for variant (with breeding bonus)
        const prestigeLevel = profile.prestigeLevel || 0;
        const prestigeVariantBonus = (profile.prestigeUnlocks?.variantBonus || 0);
        const totalVariantBonus = prestigeVariantBonus + (breeding.variantBonus || 0);
        
        variant = rollForVariant(prestigeLevel, totalVariantBonus);
        
        offspring = {
            name: breeding.offspringName,
            rarity: breeding.offspringRarity,
            weight: generateWeight(breeding.offspringRarity),
            caughtAt: new Date(),
            bred: true, // Mark as bred (not caught)
            parents: [breeding.parent1, breeding.parent2]
        };
        
        // Add to inventory
        profile.fishInventory.unshift(offspring);
        if (profile.fishInventory.length > 50) {
            profile.fishInventory = profile.fishInventory.slice(0, 50);
        }
        
        // Track breeding success
        if (!profile.breedingPairs) {
            profile.breedingPairs = [];
        }
        
        profile.breedingPairs.unshift({
            parent1: breeding.parent1,
            parent2: breeding.parent2,
            offspring: offspring.name,
            breededAt: new Date(),
            success: true
        });
        
        if (profile.breedingPairs.length > 50) {
            profile.breedingPairs = profile.breedingPairs.slice(0, 50);
        }
        
        // Track variant if applicable
        if (variant && variant !== 'normal') {
            trackVariantCatch(profile, offspring.name.toLowerCase().replace(/\s+/g, '_'), variant);
        }
        
    } else {
        // Breeding failed
        profile.breedingPairs = profile.breedingPairs || [];
        profile.breedingPairs.unshift({
            parent1: breeding.parent1,
            parent2: breeding.parent2,
            offspring: null,
            breededAt: new Date(),
            success: false
        });
        
        if (profile.breedingPairs.length > 50) {
            profile.breedingPairs = profile.breedingPairs.slice(0, 50);
        }
    }
    
    // Clear active breeding
    profile.activeBreeding = {
        parent1: null,
        parent2: null,
        startedAt: null,
        finishesAt: null
    };
    
    return {
        success: isSuccess,
        offspring: offspring,
        variant: variant,
        successRate: breeding.successRate,
        parents: [breeding.parent1, breeding.parent2],
        message: isSuccess ? 'Breeding successful!' : 'Breeding failed - parents were incompatible'
    };
}

/**
 * Determine generic breeding rule
 * @param {String} rarity1 - First parent rarity
 * @param {String} rarity2 - Second parent rarity
 * @returns {Object} Breeding rule
 */
function determineGenericRule(rarity1, rarity2) {
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
    const index1 = rarityOrder.indexOf(rarity1.toLowerCase());
    const index2 = rarityOrder.indexOf(rarity2.toLowerCase());
    
    const difference = Math.abs(index1 - index2);
    
    if (difference === 0) {
        return genericBreedingRules.same_rarity;
    } else if (difference === 1) {
        return genericBreedingRules.adjacent_rarity;
    } else {
        return genericBreedingRules.different_rarity;
    }
}

/**
 * Get higher rarity of two
 * @param {String} rarity1 - First rarity
 * @param {String} rarity2 - Second rarity
 * @returns {String} Higher rarity
 */
function getHigherRarity(rarity1, rarity2) {
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
    const index1 = rarityOrder.indexOf(rarity1.toLowerCase());
    const index2 = rarityOrder.indexOf(rarity2.toLowerCase());
    
    return index1 > index2 ? rarity1 : rarity2;
}

/**
 * Generate weight for fish
 * @param {String} rarity - Fish rarity
 * @returns {Number} Weight in kg
 */
function generateWeight(rarity) {
    const ranges = {
        common: [0.5, 2.0],
        uncommon: [1.5, 4.0],
        rare: [3.0, 8.0],
        epic: [7.0, 15.0],
        legendary: [12.0, 30.0],
        mythical: [25.0, 100.0]
    };
    
    const range = ranges[rarity.toLowerCase()] || [1.0, 5.0];
    return (Math.random() * (range[1] - range[0]) + range[0]).toFixed(2);
}

/**
 * Get time remaining for active breeding
 * @param {Object} profile - Player profile
 * @returns {String} Time remaining formatted
 */
export function getBreedingTimeRemaining(profile) {
    const check = checkBreedingComplete(profile);
    
    if (!check.hasActive) {
        return 'No active breeding';
    }
    
    if (check.isComplete) {
        return 'Ready to claim!';
    }
    
    const remaining = check.timeRemaining;
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

/**
 * Cancel active breeding (refund 50% cost)
 * @param {Object} profile - Player profile
 * @returns {Object} Cancel result
 */
export function cancelBreeding(profile) {
    if (!profile.activeBreeding || !profile.activeBreeding.parent1) {
        return {
            success: false,
            message: 'No active breeding to cancel'
        };
    }
    
    // Refund 50% of cost
    const refund = Math.floor((profile.activeBreeding.cost || 0) * 0.5);
    profile.seashells += refund;
    
    // Clear breeding
    const cancelled = { ...profile.activeBreeding };
    profile.activeBreeding = {
        parent1: null,
        parent2: null,
        startedAt: null,
        finishesAt: null
    };
    
    return {
        success: true,
        refund: refund,
        cancelled: cancelled,
        message: `Breeding cancelled. Refunded ${refund} seashells (50%)`
    };
}

/**
 * Speed up breeding with sun tokens
 * @param {Object} profile - Player profile
 * @param {Number} hours - Hours to skip
 * @returns {Object} Speed up result
 */
export function speedUpBreeding(profile, hours = 1) {
    const check = checkBreedingComplete(profile);
    
    if (!check.hasActive) {
        return {
            success: false,
            message: 'No active breeding'
        };
    }
    
    if (check.isComplete) {
        return {
            success: false,
            message: 'Breeding already complete!'
        };
    }
    
    // Cost: 5 sun tokens per hour
    const cost = hours * 5;
    
    if (profile.sunTokens < cost) {
        return {
            success: false,
            message: `Need ${cost} sun tokens (have ${profile.sunTokens})`,
            cost: cost,
            current: profile.sunTokens
        };
    }
    
    // Deduct sun tokens
    profile.sunTokens -= cost;
    
    // Reduce finish time
    const reduction = hours * 60 * 60 * 1000; // Convert hours to ms
    const currentFinish = new Date(profile.activeBreeding.finishesAt);
    const newFinish = new Date(currentFinish.getTime() - reduction);
    
    // Can't go below current time
    if (newFinish < new Date()) {
        profile.activeBreeding.finishesAt = new Date();
    } else {
        profile.activeBreeding.finishesAt = newFinish;
    }
    
    return {
        success: true,
        cost: cost,
        hoursSkipped: hours,
        newFinishTime: profile.activeBreeding.finishesAt,
        message: `Breeding sped up by ${hours} hour${hours > 1 ? 's' : ''}!`
    };
}

export default {
    canBreed,
    startBreeding,
    checkBreedingComplete,
    claimOffspring,
    getBreedingTimeRemaining,
    cancelBreeding,
    speedUpBreeding
};
