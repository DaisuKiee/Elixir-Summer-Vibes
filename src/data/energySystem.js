// Energy System - Strategic Resource Management
// Players have limited energy that regenerates daily

export const energyConfig = {
    maxEnergy: 100,
    regenRate: 1, // 1 energy per hour
    regenInterval: 60 * 60 * 1000, // 1 hour in milliseconds
    
    // Activity costs
    costs: {
        fishing: 15,
        exploring: 20,
        traveling: 10,
        deepSeaFishing: 30,
        dangerousExploration: 35,
        craftingBasic: 5,
        craftingAdvanced: 15,
        trading: 5,
        research: 10
    },
    
    // Energy restoration items
    restoration: {
        smallSnack: 10,
        meal: 25,
        feast: 50,
        energyDrink: 15,
        fullRestore: 100
    }
};

/**
 * Calculate current energy based on last update time
 * @param {Object} profile - Summer profile
 * @returns {Number} Current energy
 */
export function calculateCurrentEnergy(profile) {
    // Get max energy (base + prestige bonus)
    const maxEnergy = profile.maxEnergy || energyConfig.maxEnergy;
    
    if (!profile.energy) profile.energy = maxEnergy;
    if (!profile.lastEnergyUpdate) {
        profile.lastEnergyUpdate = new Date();
        return profile.energy;
    }
    
    const now = new Date();
    const lastUpdate = new Date(profile.lastEnergyUpdate);
    
    // Apply prestige energy regen bonus if available
    const prestigeRegenBonus = (profile.prestigeUnlocks?.energyRegenBonus || 0);
    const totalRegenRate = energyConfig.regenRate + prestigeRegenBonus;
    
    const hoursPassed = (now - lastUpdate) / energyConfig.regenInterval;
    
    // Regenerate energy
    const regenAmount = Math.floor(hoursPassed * totalRegenRate);
    const currentEnergy = Math.min(profile.energy + regenAmount, maxEnergy);
    
    return currentEnergy;
}

/**
 * Update profile with current energy
 * @param {Object} profile - Summer profile
 */
export function updateEnergy(profile) {
    const currentEnergy = calculateCurrentEnergy(profile);
    profile.energy = currentEnergy;
    profile.lastEnergyUpdate = new Date();
}

/**
 * Check if player has enough energy for an action
 * @param {Object} profile - Summer profile
 * @param {String} action - Action type
 * @returns {Boolean}
 */
export function hasEnoughEnergy(profile, action) {
    const currentEnergy = calculateCurrentEnergy(profile);
    const cost = energyConfig.costs[action] || 0;
    return currentEnergy >= cost;
}

/**
 * Consume energy for an action
 * @param {Object} profile - Summer profile
 * @param {String} action - Action type
 * @returns {Object} - { success: Boolean, remaining: Number, cost: Number }
 */
export function consumeEnergy(profile, action) {
    updateEnergy(profile);
    
    const cost = energyConfig.costs[action] || 0;
    
    if (profile.energy < cost) {
        return {
            success: false,
            remaining: profile.energy,
            cost: cost,
            needed: cost - profile.energy
        };
    }
    
    profile.energy -= cost;
    profile.lastEnergyUpdate = new Date();
    
    return {
        success: true,
        remaining: profile.energy,
        cost: cost
    };
}

/**
 * Restore energy (from items or effects)
 * @param {Object} profile - Summer profile
 * @param {Number} amount - Amount to restore
 */
export function restoreEnergy(profile, amount) {
    updateEnergy(profile);
    profile.energy = Math.min(profile.energy + amount, energyConfig.maxEnergy);
    profile.lastEnergyUpdate = new Date();
}

/**
 * Get time until energy is full
 * @param {Object} profile - Summer profile
 * @returns {Object} - { hours: Number, minutes: Number, isFull: Boolean }
 */
export function getTimeUntilFull(profile) {
    const currentEnergy = calculateCurrentEnergy(profile);
    
    if (currentEnergy >= energyConfig.maxEnergy) {
        return { hours: 0, minutes: 0, isFull: true };
    }
    
    const energyNeeded = energyConfig.maxEnergy - currentEnergy;
    const hoursNeeded = energyNeeded / energyConfig.regenRate;
    const hours = Math.floor(hoursNeeded);
    const minutes = Math.floor((hoursNeeded - hours) * 60);
    
    return { hours, minutes, isFull: false };
}

/**
 * Format energy display
 * @param {Object} profile - Summer profile
 * @returns {String}
 */
export function formatEnergyDisplay(profile) {
    const currentEnergy = calculateCurrentEnergy(profile);
    const percent = Math.floor((currentEnergy / energyConfig.maxEnergy) * 100);
    
    // Energy bar (20 characters)
    const barLength = 20;
    const filled = Math.floor((currentEnergy / energyConfig.maxEnergy) * barLength);
    const bar = '▰'.repeat(filled) + '▱'.repeat(barLength - filled);
    
    let status = '🟢';
    if (percent < 30) status = '🔴';
    else if (percent < 60) status = '🟡';
    
    return {
        bar: bar,
        text: `${status} **Energy:** \`${currentEnergy}/${energyConfig.maxEnergy}\` (${percent}%)`,
        current: currentEnergy,
        max: energyConfig.maxEnergy,
        percent: percent
    };
}

/**
 * Get energy cost for an action
 * @param {String} action - Action type
 * @returns {Number}
 */
export function getEnergyCost(action) {
    return energyConfig.costs[action] || 0;
}

/**
 * Check if action is available based on energy
 * @param {Object} profile - Summer profile
 * @param {String} action - Action type
 * @returns {Object} - { available: Boolean, cost: Number, current: Number, message: String }
 */
export function checkEnergyRequirement(profile, action) {
    const currentEnergy = calculateCurrentEnergy(profile);
    const cost = calculateActualCost(profile, action); // Use equipment bonuses
    const available = currentEnergy >= cost;
    
    let message = '';
    if (!available) {
        const needed = cost - currentEnergy;
        const timeInfo = getTimeUntilFull(profile);
        message = `Not enough energy! Need ${needed} more (full in ${timeInfo.hours}h ${timeInfo.minutes}m)`;
    }
    
    return {
        available,
        cost,
        current: currentEnergy,
        message
    };
}

/**
 * Get strategic energy recommendations
 * @param {Object} profile - Summer profile
 * @returns {Array} - Array of recommendations
 */
export function getEnergyRecommendations(profile) {
    const currentEnergy = calculateCurrentEnergy(profile);
    const recommendations = [];
    
    if (currentEnergy >= energyConfig.costs.deepSeaFishing) {
        recommendations.push({
            action: 'Deep Sea Fishing',
            cost: energyConfig.costs.deepSeaFishing,
            benefit: 'High risk, high reward',
            priority: 'high'
        });
    }
    
    if (currentEnergy >= energyConfig.costs.exploring) {
        recommendations.push({
            action: 'Island Exploration',
            cost: energyConfig.costs.exploring,
            benefit: 'Discover new islands',
            priority: 'medium'
        });
    }
    
    if (currentEnergy >= energyConfig.costs.fishing) {
        recommendations.push({
            action: 'Fishing',
            cost: energyConfig.costs.fishing,
            benefit: 'Safe and consistent',
            priority: 'low'
        });
    }
    
    if (currentEnergy < 30) {
        recommendations.push({
            action: 'Rest & Restore',
            cost: 0,
            benefit: 'Wait for energy to regenerate',
            priority: 'recommended'
        });
    }
    
    return recommendations;
}

/**
 * Energy boost system (temporary bonuses)
 */
export function applyEnergyBoost(profile, boostType, duration) {
    if (!profile.energyBoosts) {
        profile.energyBoosts = [];
    }
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + duration);
    
    profile.energyBoosts.push({
        type: boostType,
        multiplier: 1.5, // Actions cost 33% less energy
        expiresAt: expiresAt
    });
}

/**
 * Check for active energy boosts
 * @param {Object} profile - Summer profile
 * @returns {Number} - Multiplier (1.0 = normal, 0.5 = 50% cost)
 */
export function getEnergyMultiplier(profile) {
    if (!profile.energyBoosts || profile.energyBoosts.length === 0) {
        return 1.0;
    }
    
    const now = new Date();
    const activeBoosts = profile.energyBoosts.filter(boost => 
        new Date(boost.expiresAt) > now
    );
    
    // Remove expired boosts
    profile.energyBoosts = activeBoosts;
    
    if (activeBoosts.length === 0) {
        return 1.0;
    }
    
    // Apply best multiplier
    const bestMultiplier = Math.min(...activeBoosts.map(b => b.multiplier || 1.0));
    return bestMultiplier;
}

/**
 * Calculate energy cost with multipliers and equipment bonuses
 * @param {Object} profile - Summer profile
 * @param {String} action - Action type
 * @returns {Number} - Actual cost after multipliers and equipment
 */
export function calculateActualCost(profile, action) {
    const baseCost = getEnergyCost(action);
    const multiplier = getEnergyMultiplier(profile);
    
    // Apply equipment bonus if available (boat reduces energy cost)
    let finalCost = Math.ceil(baseCost * multiplier);
    
    // Import equipment bonuses dynamically to avoid circular dependency
    if (profile.equipment && profile.equipment.boat) {
        const boatLevel = profile.equipment.boat.level || 1;
        
        // Energy cost reduction based on boat level
        const reductionRates = {
            1: 1.0,    // 0% reduction
            2: 0.95,   // 5% reduction
            3: 0.90,   // 10% reduction
            4: 0.85,   // 15% reduction
            5: 0.80,   // 20% reduction
            6: 0.75,   // 25% reduction
            7: 0.70,   // 30% reduction
            8: 0.65,   // 35% reduction
            9: 0.55,   // 45% reduction
            10: 0.40   // 60% reduction
        };
        
        const boatReduction = reductionRates[boatLevel] || 1.0;
        finalCost = Math.ceil(finalCost * boatReduction);
        
        // Additional reduction from Poseidon's Blessing (accessory level 10)
        if (profile.equipment.accessory && profile.equipment.accessory.level === 10) {
            finalCost = Math.ceil(finalCost * 0.5); // Additional 50% reduction
        }
    }
    
    return Math.max(1, finalCost); // Minimum 1 energy
}
