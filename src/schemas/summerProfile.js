import mongoose from 'mongoose';

// Define challenge subdocument schema explicitly
const challengeSchema = new mongoose.Schema({
    id: String,
    description: String,
    progress: { type: Number, default: 0 },
    goal: Number,
    reward: Number,
    type: String,
    expiresAt: Date
}, { _id: false }); // Disable automatic _id for subdocuments

const summerProfileSchema = new mongoose.Schema({
    _id: String, // User ID
    username: String,
    
    // Player Leveling System (formerly Battle Pass)
    level: { type: Number, default: 1 },        // Current player level
    xp: { type: Number, default: 0 },           // Current XP toward next level
    totalXP: { type: Number, default: 0 },      // Lifetime XP earned
    
    // DEPRECATED: Battle Pass fields (kept for migration safety - remove after 6 months)
    battlePassLevel: { type: Number, default: 1 },
    battlePassXP: { type: Number, default: 0 },
    isPremiumPass: { type: Boolean, default: false },
    
    // Currency
    seashells: { type: Number, default: 0 }, // Main currency
    sunTokens: { type: Number, default: 0 }, // Premium currency
    
    // Fishing
    fishCaught: { type: Number, default: 0 },
    fishInventory: [{
        name: String,
        rarity: String,
        weight: Number,
        caughtAt: Date,
        mutations: [{
            weatherType: String,
            mutatedAt: Date,
            multiplier: Number
        }],
        totalMutations: { type: Number, default: 0 },
        currentValue: { type: Number, default: 0 }
    }],
    fishCollection: [String], // Permanent list of unique fish names ever caught (for fishdex)
    fishingRodLevel: { type: Number, default: 1 },
    
    // Beach Exploration
    beachesExplored: { type: Number, default: 0 },
    currentBeach: { type: String, default: 'Luzon' },
    explorationStreak: { type: Number, default: 0 },
    lastExploration: Date,
    visitedIslands: [String], // Array of island IDs visited
    islandDiscoveries: [{
        islandId: String,
        islandName: String,
        discoveredAt: Date,
        timesVisited: { type: Number, default: 1 }
    }],
    islandProgress: [{
        islandId: String,
        fish: { type: Number, default: 0 },
        explorations: { type: Number, default: 0 },
        collectibles: { type: Number, default: 0 }
    }],
    
    // Collectibles
    collectibles: [{
        id: String,
        name: String,
        category: String, // 'shells', 'crabs', 'drinks', 'items'
        rarity: String, // 'common', 'rare', 'epic', 'legendary'
        obtainedAt: Date
    }],
    
    // Achievements & Challenges
    completedChallenges: [String],
    dailyChallenges: [challengeSchema],
    weeklyChallenges: [challengeSchema],
    
    // Stats
    daysActive: { type: Number, default: 0 },
    lastDaily: Date,
    createdAt: { type: Date, default: Date.now },
    
    // Energy System (Strategic Resource)
    energy: { type: Number, default: 100 },
    maxEnergy: { type: Number, default: 100 },
    lastEnergyUpdate: { type: Date, default: Date.now },
    energyBoosts: [{
        type: { type: String },
        multiplier: Number,
        expiresAt: Date
    }],
    energyItems: {
        smallSnack: { type: Number, default: 0 },
        meal: { type: Number, default: 0 },
        feast: { type: Number, default: 0 },
        energyDrink: { type: Number, default: 0 },
        fullRestore: { type: Number, default: 0 }
    },
    
    // Cosmetics Inventory
    ownedCosmetics: [{
        type: { type: String }, // 'background', 'frame', 'badge', 'pet', 'title', 'banner', 'emote', 'nameplate'
        id: String,
        name: String,
        rarity: String,
        unlockedAt: Date
    }],
    equippedCosmetics: {
        background: String, // Cosmetic ID
        frame: String,
        badge: String,
        pet: String,
        title: String,
        banner: String,
        nameplate: String
    },
    
    // Seasonal Rewards Claimed
    rewardsClaimed: [Number], // Battle pass tier numbers
    
    // ===== NEW GAME FEATURES =====
    
    // Feature #5: Pity/Guarantee System
    pityCounters: {
        epic: { type: Number, default: 0 },
        legendary: { type: Number, default: 0 },
        mythical: { type: Number, default: 0 }
    },
    
    // Feature #7: Shiny/Variant System
    variantFish: [{
        fishId: String,
        variant: String, // 'golden', 'crystal', 'shadow', 'rainbow'
        caughtAt: Date
    }],
    
    // Feature #8: Bait/Lure System
    baitInventory: [{
        baitId: String,
        quantity: { type: Number, default: 0 }
    }],
    activeBait: {
        baitId: String,
        remainingUses: { type: Number, default: 0 },
        activatedAt: Date
    },
    
    // Feature #1: Prestige/Rebirth System
    prestigeLevel: { type: Number, default: 0 },
    prestigePoints: { type: Number, default: 0 },
    totalPrestigePoints: { type: Number, default: 0 }, // Lifetime earned
    prestigeUnlocks: {
        xpMultiplier: { type: Number, default: 1.0 },
        energyBonus: { type: Number, default: 0 },
        rareFishBonus: { type: Number, default: 0 },
        dailyBonusMultiplier: { type: Number, default: 1.0 }
    },
    lastPrestigeDate: Date,
    
    // Feature #2: Fish Breeding/Fusion System
    breedingPairs: [{
        parent1: String,
        parent2: String,
        offspring: String,
        breededAt: Date,
        success: Boolean
    }],
    activeBreeding: {
        parent1: String,
        parent2: String,
        startedAt: Date,
        finishesAt: Date
    },
    
    // Feature #3: Player Trading System
    tradeCount: { type: Number, default: 0 },
    lastTradeAt: Date,
    tradeHistory: [{
        tradeId: String,
        partner: String,
        items: Object,
        completedAt: Date
    }],
    
    // Feature #4: Boss/Raid System
    bossStats: {
        totalDamage: { type: Number, default: 0 },
        bossesDefeated: { type: Number, default: 0 },
        topDamage: { type: Number, default: 0 },
        lastBossAttack: Date
    },
    
    // Feature #6: Auto-Catch/Idle Fishing
    idleFishing: {
        enabled: { type: Boolean, default: false },
        lastChecked: Date,
        storedFish: [{
            fishId: String,
            variant: String,
            caughtAt: Date
        }]
    },
    
    // Feature #9: Fishing Tournaments/Events
    tournamentStats: {
        wins: { type: Number, default: 0 },
        participations: { type: Number, default: 0 },
        currentTournamentScore: { type: Number, default: 0 },
        currentTournamentId: String
    },
    
    // Feature #10: Guild/Crew System
    guildId: String,
    guildRole: String, // 'leader', 'officer', 'member'
    guildJoinedAt: Date,
    guildContribution: { type: Number, default: 0 },
    
    // Feature #11: Equipment/Gear System
    equipment: {
        rod: { id: String, level: { type: Number, default: 1 } },
        net: { id: String, level: { type: Number, default: 1 } },
        boat: { id: String, level: { type: Number, default: 1 } },
        accessory: { id: String, level: { type: Number, default: 1 } },
        energyBar: { id: String, level: { type: Number, default: 1 } }
    },
    
    // Feature #12: Crafting System
    craftingRecipes: [String], // Unlocked recipe IDs
    craftedItems: [{
        itemId: String,
        craftedAt: Date
    }],
    
    // Feature #13: Achievement System
    achievements: [{
        achievementId: String,
        unlockedAt: Date,
        progress: { type: Number, default: 0 }
    }],
    
    // Feature #14: Pet/Companion System
    activePet: {
        petId: String,
        level: { type: Number, default: 1 },
        xp: { type: Number, default: 0 },
        bondLevel: { type: Number, default: 0 }
    },
    pets: [{
        petId: String,
        acquiredAt: Date,
        level: { type: Number, default: 1 }
    }],
    
    // Feature #15: Seasonal Events
    seasonalData: {
        currentEventId: String,
        eventCurrency: { type: Number, default: 0 },
        eventProgress: Number,
        eventRewards: [String] // Claimed reward IDs
    },
    
    // Aquarium System - Display rare fish
    aquarium: [{
        fishName: String,
        rarity: String,
        weight: Number,
        caughtAt: Date,
        displayedAt: { type: Date, default: Date.now },
        mutations: [{
            weatherType: String, // 'bloodmoon', 'lightning', etc.
            mutatedAt: Date,
            multiplier: Number
        }],
        totalMutations: { type: Number, default: 0 },
        currentValue: { type: Number, default: 0 } // Calculated value after mutations
    }],
    aquariumSlots: { type: Number, default: 1 }, // Purchased aquarium slots (starts at 1)
    
    // Mutation Items (Crystals/Orbs that guarantee specific mutations)
    mutationItems: {
        bloodmoonOrb: { type: Number, default: 0 },
        lightningCrystal: { type: Number, default: 0 },
        auroraEssence: { type: Number, default: 0 },
        frozenShard: { type: Number, default: 0 },
        stardustVial: { type: Number, default: 0 },
        goldenEssence: { type: Number, default: 0 },
        crystalShard: { type: Number, default: 0 },
        shadowEssence: { type: Number, default: 0 },
        rainbowPrism: { type: Number, default: 0 }
    },
    
    // Global Mutation Weather
    currentMutationWeather: {
        weatherType: String,
        startedAt: Date,
        endsAt: Date
    }
});

export default mongoose.model('SummerProfile', summerProfileSchema);
