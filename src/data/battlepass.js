// DEPRECATED: This file is kept for backward compatibility
// Use levelSystem.js instead

// Export everything from levelSystem.js with legacy names
export {
    levelRewards as battlePassTiers,
    getLevel as getTier,
    getLevelFromXP as getTierFromXP,
    getTotalXPForLevel as getTotalXPForTier,
    getXPForNextLevel as getXPForNextTier,
    isInfiniteLevel,
    getInfiniteLevelReward,
    xpSources
} from './levelSystem.js';

console.warn('⚠️  battlepass.js is deprecated. Please use levelSystem.js instead.');
