// Battle Pass - 100 Tiers with Free and Premium rewards
export const battlePassTiers = [];

// Generate all 100 tiers
for (let tier = 1; tier <= 100; tier++) {
    const tierData = {
        tier,
        xpRequired: tier * 100, // Each level requires tier * 100 XP
        freeRewards: [],
        premiumRewards: []
    };
    
    // Every tier has seashells
    if (tier % 5 === 0) {
        tierData.freeRewards.push({ type: 'seashells', amount: tier * 10, emoji: '🐚' });
        tierData.premiumRewards.push({ type: 'seashells', amount: tier * 20, emoji: '🐚' });
    }
    
    // Free rewards pattern
    if (tier === 1) {
        tierData.freeRewards.push({ type: 'badge', name: 'Summer Starter', emoji: '🏖️' });
    }
    if (tier === 5) {
        tierData.freeRewards.push({ type: 'xpBoost', duration: '1 hour', multiplier: 1.5, emoji: '⚡' });
    }
    if (tier === 10) {
        tierData.freeRewards.push({ type: 'fishingRod', level: 2, emoji: '🎣' });
        tierData.freeRewards.push({ type: 'sunTokens', amount: 50, emoji: '🌟' });
    }
    if (tier === 15) {
        tierData.freeRewards.push({ type: 'collectible', rarity: 'rare', emoji: '🎁' });
    }
    if (tier === 20) {
        tierData.freeRewards.push({ type: 'badge', name: 'Beach Explorer', emoji: '🏝️' });
        tierData.freeRewards.push({ type: 'seashells', amount: 500, emoji: '🐚' });
    }
    if (tier === 25) {
        tierData.freeRewards.push({ type: 'beachUnlock', beach: 'hidden-lagoon', emoji: '🗺️' });
    }
    if (tier === 30) {
        tierData.freeRewards.push({ type: 'fishingRod', level: 3, emoji: '🎣' });
        tierData.freeRewards.push({ type: 'sunTokens', amount: 100, emoji: '🌟' });
    }
    if (tier === 40) {
        tierData.freeRewards.push({ type: 'badge', name: 'Wave Rider', emoji: '🌊' });
    }
    if (tier === 50) {
        tierData.freeRewards.push({ type: 'fishingRod', level: 4, emoji: '🎣' });
        tierData.freeRewards.push({ type: 'collectible', rarity: 'epic', emoji: '🎁' });
        tierData.freeRewards.push({ type: 'sunTokens', amount: 200, emoji: '🌟' });
    }
    if (tier === 75) {
        tierData.freeRewards.push({ type: 'badge', name: 'Summer Legend', emoji: '👑' });
    }
    if (tier === 100) {
        tierData.freeRewards.push({ type: 'badge', name: 'Summer Elite', emoji: '💎' });
        tierData.freeRewards.push({ type: 'fishingRod', level: 5, emoji: '🎣' });
        tierData.freeRewards.push({ type: 'sunTokens', amount: 1000, emoji: '🌟' });
        tierData.freeRewards.push({ type: 'profileFrame', name: 'Golden Summer', emoji: '🖼️' });
    }
    
    // Premium rewards (better rewards on same tiers)
    if (tier === 1) {
        tierData.premiumRewards.push({ type: 'badge', name: 'Premium Member', emoji: '⭐' });
        tierData.premiumRewards.push({ type: 'xpBoost', duration: 'permanent', multiplier: 1.2, emoji: '⚡' });
    }
    if (tier === 5) {
        tierData.premiumRewards.push({ type: 'collectible', rarity: 'rare', emoji: '🎁' });
        tierData.premiumRewards.push({ type: 'sunTokens', amount: 100, emoji: '🌟' });
    }
    if (tier === 10) {
        tierData.premiumRewards.push({ type: 'emote', name: 'Summer Vibes Pack', emoji: '😎' });
    }
    if (tier === 15) {
        tierData.premiumRewards.push({ type: 'collectible', rarity: 'epic', emoji: '🎁' });
        tierData.premiumRewards.push({ type: 'sunTokens', amount: 150, emoji: '🌟' });
    }
    if (tier === 20) {
        tierData.premiumRewards.push({ type: 'badge', name: 'VIP Beachgoer', emoji: '🏖️' });
        tierData.premiumRewards.push({ type: 'profileBanner', name: 'Sunset Paradise', emoji: '🌅' });
    }
    if (tier === 25) {
        tierData.premiumRewards.push({ type: 'pet', name: 'Baby Sea Turtle', emoji: '🐢' });
    }
    if (tier === 30) {
        tierData.premiumRewards.push({ type: 'collectible', rarity: 'legendary', emoji: '🎁' });
        tierData.premiumRewards.push({ type: 'sunTokens', amount: 250, emoji: '🌟' });
    }
    if (tier === 35) {
        tierData.premiumRewards.push({ type: 'emote', name: 'Beach Party Pack', emoji: '🎉' });
    }
    if (tier === 40) {
        tierData.premiumRewards.push({ type: 'badge', name: 'Premium Wave Rider', emoji: '🌊' });
        tierData.premiumRewards.push({ type: 'profileBanner', name: 'Crystal Waters', emoji: '💎' });
    }
    if (tier === 50) {
        tierData.premiumRewards.push({ type: 'pet', name: 'Tropical Parrot', emoji: '🦜' });
        tierData.premiumRewards.push({ type: 'sunTokens', amount: 500, emoji: '🌟' });
        tierData.premiumRewards.push({ type: 'beachUnlock', beach: 'diamond-beach', emoji: '🗺️' });
    }
    if (tier === 60) {
        tierData.premiumRewards.push({ type: 'emote', name: 'Ocean Legends Pack', emoji: '🌊' });
    }
    if (tier === 75) {
        tierData.premiumRewards.push({ type: 'badge', name: 'Elite Summer Legend', emoji: '👑' });
        tierData.premiumRewards.push({ type: 'collectible', rarity: 'legendary', emoji: '🎁' });
        tierData.premiumRewards.push({ type: 'sunTokens', amount: 750, emoji: '🌟' });
    }
    if (tier === 90) {
        tierData.premiumRewards.push({ type: 'profileFrame', name: 'Diamond Summer', emoji: '💎' });
    }
    if (tier === 100) {
        tierData.premiumRewards.push({ type: 'badge', name: 'Summer Elite VIP', emoji: '👑' });
        tierData.premiumRewards.push({ type: 'pet', name: 'Diamond Crab', emoji: '💎' });
        tierData.premiumRewards.push({ type: 'profileFrame', name: 'Rainbow Paradise', emoji: '🌈' });
        tierData.premiumRewards.push({ type: 'sunTokens', amount: 2000, emoji: '🌟' });
        tierData.premiumRewards.push({ type: 'title', name: 'Summer Champion 2026', emoji: '🏆' });
    }
    
    // Add milestone rewards every 10 tiers
    if (tier % 10 === 0 && tier !== 100) {
        tierData.freeRewards.push({ type: 'mysteryBox', rarity: 'common', emoji: '📦' });
        tierData.premiumRewards.push({ type: 'mysteryBox', rarity: 'rare', emoji: '🎁' });
    }
    
    battlePassTiers.push(tierData);
}

// Helper function to get tier data
export function getTier(tierNumber) {
    if (tierNumber > 100) {
        // Return infinite level reward structure
        return getInfiniteLevelReward();
    }
    return battlePassTiers.find(t => t.tier === tierNumber);
}

// Helper function to calculate total XP needed for a tier
export function getTotalXPForTier(tierNumber) {
    if (tierNumber === 0) return 0;
    
    if (tierNumber <= 100) {
        // Sum of XP needed: tier 1 = 100, tier 2 = 100+200=300, tier 3 = 300+300=600, etc.
        // Formula: sum from i=1 to N of (i * 100) = 100 * sum(i) = 100 * N*(N+1)/2
        return 50 * tierNumber * (tierNumber + 1);
    } else {
        // For infinite levels beyond 100
        const baseTier100XP = 505000; // 50 * 100 * 101 = 505,000
        const levelsAbove100 = tierNumber - 100;
        return baseTier100XP + (levelsAbove100 * 10000);
    }
}

// Helper function to get current tier from XP
export function getTierFromXP(xp) {
    // Tier 1 needs 100 XP, Tier 2 needs 200 more (300 total), Tier 3 needs 300 more (600 total), etc.
    // Formula: Total XP for tier N = N * (N + 1) * 50
    
    if (xp === 0) return 0;
    
    let cumulativeXP = 0;
    for (let tier = 1; tier <= 100; tier++) {
        cumulativeXP += tier * 100;
        if (xp < cumulativeXP) {
            return tier - 1;
        }
        if (xp === cumulativeXP) {
            return tier;
        }
    }
    
    // If over tier 100, calculate infinite levels
    // Each level after 100 requires 10,000 XP
    const baseTier100XP = 505000; // Precomputed sum of 1-100 tiers
    if (xp >= baseTier100XP) {
        const xpAfter100 = xp - baseTier100XP;
        const infiniteLevels = Math.floor(xpAfter100 / 10000);
        return 100 + infiniteLevels;
    }
    
    return 100;
}

// Helper function to get XP needed for next tier
export function getXPForNextTier(currentTier) {
    if (currentTier < 100) {
        return (currentTier + 1) * 100;
    } else {
        // Infinite levels always need 10,000 XP
        return 10000;
    }
}

// Helper function to check if tier is infinite level
export function isInfiniteLevel(tier) {
    return tier > 100;
}

// Helper function to get infinite level rewards
export function getInfiniteLevelReward() {
    return {
        tier: 'infinite',
        xpRequired: 10000,
        freeRewards: [
            { type: 'seashells', amount: 200, emoji: '🐚' }
        ],
        premiumRewards: [
            { type: 'seashells', amount: 200, emoji: '🐚' }
        ]
    };
}

// XP sources and amounts
export const xpSources = {
    fishing: { min: 10, max: 50 },
    exploring: 25,
    dailyLogin: 50,
    challengeDaily: 100,
    challengeWeekly: 500,
    serverChallenge: 200,
    collectible: { common: 10, uncommon: 20, rare: 50, epic: 100, legendary: 250 }
};
