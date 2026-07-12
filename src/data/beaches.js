// 54 Philippine Islands organized by island groups
// Each island has unique characteristics, rewards, and unlock requirements

export const islandGroups = {
    luzon: { name: 'Luzon', emoji: '🟢', description: 'Northern Philippines - Mountains and Historic Sites' },
    visayas: { name: 'Visayas', emoji: '🟡', description: 'Central Philippines - Beaches and Festivals' },
    mindanao: { name: 'Mindanao', emoji: '🔴', description: 'Southern Philippines - Diverse Culture and Wildlife' }
};

export const beachesData = {
    // ============================================
    // 🟢 LUZON ISLAND GROUP (18 Islands)
    // ============================================
    
    'luzon': {
        id: 'luzon',
        name: 'Luzon',
        group: 'luzon',
        emoji: '🏝️',
        description: 'The largest island in the Philippines, home to Manila and diverse landscapes.',
        unlockRequirement: { 
            level: 0,
            previousIsland: null // Starting island
        },
        progressRequirements: {
            fish: 5,
            explorations: 3,
            collectibles: 2
        },
        rewards: {
            seashells: { min: 10, max: 30 },
            xp: 25,
            collectibleChance: 0.3
        },
        rarity: 'starter'
    },
    
    'mindoro': {
        id: 'mindoro',
        name: 'Mindoro',
        group: 'luzon',
        emoji: '🏞️',
        description: 'Known for pristine beaches and the indigenous Mangyan people.',
        unlockRequirement: { 
            level: 2,
            previousIsland: 'luzon'
        },
        progressRequirements: {
            fish: 8,
            explorations: 5,
            collectibles: 3
        },
        rewards: {
            seashells: { min: 15, max: 35 },
            xp: 30,
            collectibleChance: 0.32
        },
        rarity: 'common'
    },
    
    'palawan': {
        id: 'palawan',
        name: 'Palawan',
        group: 'luzon',
        emoji: '🌴',
        description: 'The last frontier - crystal waters, limestone cliffs, and underground rivers.',
        unlockRequirement: { 
            level: 5,
            previousIsland: 'mindoro'
        },
        progressRequirements: {
            fish: 12,
            explorations: 8,
            collectibles: 5
        },
        rewards: {
            seashells: { min: 25, max: 50 },
            xp: 45,
            collectibleChance: 0.4
        },
        rarity: 'common'
    },
    
    'masbate': {
        id: 'masbate',
        name: 'Masbate',
        group: 'luzon',
        emoji: '🐎',
        description: 'The cattle capital of the Philippines with rodeo festivals.',
        unlockRequirement: { level: 7 },
        rewards: {
            seashells: { min: 30, max: 55 },
            xp: 40,
            collectibleChance: 0.35
        },
        rarity: 'common'
    },
    
    'marinduque': {
        id: 'marinduque',
        name: 'Marinduque',
        group: 'luzon',
        emoji: '🎭',
        description: 'Heart of the Philippines, famous for the Moriones Festival.',
        unlockRequirement: { level: 9 },
        rewards: {
            seashells: { min: 35, max: 60 },
            xp: 42,
            collectibleChance: 0.37
        },
        rarity: 'common'
    },
    
    'catanduanes': {
        id: 'catanduanes',
        name: 'Catanduanes',
        group: 'luzon',
        emoji: '🌊',
        description: 'Land of the howling winds, a surfer\'s paradise with powerful waves.',
        unlockRequirement: { level: 12, fishCaught: 30 },
        rewards: {
            seashells: { min: 40, max: 75 },
            xp: 60,
            collectibleChance: 0.42
        },
        rarity: 'uncommon'
    },
    
    'romblon': {
        id: 'romblon',
        name: 'Romblon',
        group: 'luzon',
        emoji: '💎',
        description: 'The marble capital with pristine islands and crystal beaches.',
        unlockRequirement: { level: 14, collectibles: 15 },
        rewards: {
            seashells: { min: 45, max: 80 },
            xp: 65,
            collectibleChance: 0.45
        },
        rarity: 'uncommon'
    },
    
    'tablas': {
        id: 'tablas',
        name: 'Tablas',
        group: 'luzon',
        emoji: '🏖️',
        description: 'Largest island in Romblon with quiet beaches and marble quarries.',
        unlockRequirement: { level: 16 },
        rewards: {
            seashells: { min: 48, max: 85 },
            xp: 68,
            collectibleChance: 0.43
        },
        rarity: 'uncommon'
    },
    
    'sibuyan': {
        id: 'sibuyan',
        name: 'Sibuyan',
        group: 'luzon',
        emoji: '🌲',
        description: 'The Galapagos of Asia - biodiversity hotspot with rare species.',
        unlockRequirement: { level: 18, beachesExplored: 50 },
        rewards: {
            seashells: { min: 55, max: 95 },
            xp: 75,
            collectibleChance: 0.5
        },
        rarity: 'uncommon'
    },
    
    'polillo': {
        id: 'polillo',
        name: 'Polillo',
        group: 'luzon',
        emoji: '🦅',
        description: 'Remote island group with mangroves and the Philippine Eagle.',
        unlockRequirement: { level: 20, fishCaught: 80 },
        rewards: {
            seashells: { min: 60, max: 100 },
            xp: 80,
            collectibleChance: 0.48
        },
        rarity: 'rare'
    },
    
    'calayan': {
        id: 'calayan',
        name: 'Calayan',
        group: 'luzon',
        emoji: '🦌',
        description: 'Northernmost inhabited island with unique wildlife.',
        unlockRequirement: { level: 22, collectibles: 30 },
        rewards: {
            seashells: { min: 65, max: 110 },
            xp: 85,
            collectibleChance: 0.52
        },
        rarity: 'rare'
    },
    
    'babuyan': {
        id: 'babuyan',
        name: 'Babuyan',
        group: 'luzon',
        emoji: '🌋',
        description: 'Volcanic island with hot springs and rugged terrain.',
        unlockRequirement: { level: 24 },
        rewards: {
            seashells: { min: 70, max: 115 },
            xp: 88,
            collectibleChance: 0.50
        },
        rarity: 'rare'
    },
    
    'batan': {
        id: 'batan',
        name: 'Batan',
        group: 'luzon',
        emoji: '🏔️',
        description: 'Main island of Batanes with rolling hills and stone houses.',
        unlockRequirement: { level: 26, beachesExplored: 100 },
        rewards: {
            seashells: { min: 80, max: 130 },
            xp: 100,
            collectibleChance: 0.55
        },
        rarity: 'rare'
    },
    
    'itbayat': {
        id: 'itbayat',
        name: 'Itbayat',
        group: 'luzon',
        emoji: '⛰️',
        description: 'Northernmost town with dramatic cliffs and ancient stone structures.',
        unlockRequirement: { level: 28, explorationStreak: 10 },
        rewards: {
            seashells: { min: 85, max: 140 },
            xp: 105,
            collectibleChance: 0.57
        },
        rarity: 'rare'
    },
    
    'camiguin-norte': {
        id: 'camiguin-norte',
        name: 'Camiguin Norte',
        group: 'luzon',
        emoji: '🌴',
        description: 'Small volcanic island in the Babuyan Islands.',
        unlockRequirement: { level: 30, fishCaught: 150 },
        rewards: {
            seashells: { min: 90, max: 150 },
            xp: 110,
            collectibleChance: 0.58
        },
        rarity: 'epic'
    },
    
    'lubang': {
        id: 'lubang',
        name: 'Lubang',
        group: 'luzon',
        emoji: '🏝️',
        description: 'Isolated island with pristine beaches and Spanish-era ruins.',
        unlockRequirement: { level: 32, collectibles: 50 },
        rewards: {
            seashells: { min: 95, max: 160 },
            xp: 115,
            collectibleChance: 0.60
        },
        rarity: 'epic'
    },
    
    'corregidor': {
        id: 'corregidor',
        name: 'Corregidor',
        group: 'luzon',
        emoji: '🏛️',
        description: 'Historic island fortress from World War II with tunnels and ruins.',
        unlockRequirement: { level: 34, beachesExplored: 150 },
        rewards: {
            seashells: { min: 100, max: 170 },
            xp: 120,
            collectibleChance: 0.62
        },
        rarity: 'epic'
    },
    
    'alabat': {
        id: 'alabat',
        name: 'Alabat',
        group: 'luzon',
        emoji: '🥥',
        description: 'Large island known for coconut plantations and fishing villages.',
        unlockRequirement: { level: 36 },
        rewards: {
            seashells: { min: 105, max: 175 },
            xp: 125,
            collectibleChance: 0.59
        },
        rarity: 'epic'
    },
    
    // ============================================
    // 🟡 VISAYAS ISLAND GROUP (14 Islands)
    // ============================================
    
    'panay': {
        id: 'panay',
        name: 'Panay',
        group: 'visayas',
        emoji: '🎉',
        description: 'Home to world-famous Boracay and the Dinagyang Festival.',
        unlockRequirement: { level: 8 },
        rewards: {
            seashells: { min: 32, max: 58 },
            xp: 48,
            collectibleChance: 0.38
        },
        rarity: 'common'
    },
    
    'negros': {
        id: 'negros',
        name: 'Negros',
        group: 'visayas',
        emoji: '🍬',
        description: 'The sugar bowl of the Philippines with Spanish colonial architecture.',
        unlockRequirement: { level: 10 },
        rewards: {
            seashells: { min: 35, max: 65 },
            xp: 52,
            collectibleChance: 0.40
        },
        rarity: 'common'
    },
    
    'cebu': {
        id: 'cebu',
        name: 'Cebu',
        group: 'visayas',
        emoji: '🏙️',
        description: 'Queen City of the South - urban metropolis with historic sites.',
        unlockRequirement: { level: 12 },
        rewards: {
            seashells: { min: 40, max: 70 },
            xp: 58,
            collectibleChance: 0.42
        },
        rarity: 'uncommon'
    },
    
    'bohol': {
        id: 'bohol',
        name: 'Bohol',
        group: 'visayas',
        emoji: '🐒',
        description: 'Famous for Chocolate Hills, tarsiers, and pristine beaches.',
        unlockRequirement: { level: 15, fishCaught: 50 },
        rewards: {
            seashells: { min: 50, max: 90 },
            xp: 70,
            collectibleChance: 0.48
        },
        rarity: 'uncommon'
    },
    
    'leyte': {
        id: 'leyte',
        name: 'Leyte',
        group: 'visayas',
        emoji: '⚓',
        description: 'Site of MacArthur\'s landing and historic WWII battles.',
        unlockRequirement: { level: 17 },
        rewards: {
            seashells: { min: 52, max: 92 },
            xp: 72,
            collectibleChance: 0.45
        },
        rarity: 'uncommon'
    },
    
    'samar': {
        id: 'samar',
        name: 'Samar',
        group: 'visayas',
        emoji: '🕳️',
        description: 'Home to stunning caves, waterfalls, and rock formations.',
        unlockRequirement: { level: 19, beachesExplored: 60 },
        rewards: {
            seashells: { min: 58, max: 98 },
            xp: 78,
            collectibleChance: 0.47
        },
        rarity: 'uncommon'
    },
    
    'biliran': {
        id: 'biliran',
        name: 'Biliran',
        group: 'visayas',
        emoji: '💦',
        description: 'Island of waterfalls with natural hot and cold springs.',
        unlockRequirement: { level: 21, collectibles: 35 },
        rewards: {
            seashells: { min: 62, max: 105 },
            xp: 82,
            collectibleChance: 0.50
        },
        rarity: 'rare'
    },
    
    'guimaras': {
        id: 'guimaras',
        name: 'Guimaras',
        group: 'visayas',
        emoji: '🥭',
        description: 'The mango capital producing the sweetest mangoes in the world.',
        unlockRequirement: { level: 23 },
        rewards: {
            seashells: { min: 68, max: 112 },
            xp: 86,
            collectibleChance: 0.49
        },
        rarity: 'rare'
    },
    
    'siquijor': {
        id: 'siquijor',
        name: 'Siquijor',
        group: 'visayas',
        emoji: '🔮',
        description: 'Mystical island known for folklore, healers, and enchanting beaches.',
        unlockRequirement: { level: 25, fishCaught: 120 },
        rewards: {
            seashells: { min: 75, max: 125 },
            xp: 95,
            collectibleChance: 0.55
        },
        rarity: 'rare'
    },
    
    'bantayan': {
        id: 'bantayan',
        name: 'Bantayan',
        group: 'visayas',
        emoji: '🏖️',
        description: 'Paradise island with powdery white sand and turquoise waters.',
        unlockRequirement: { level: 27, explorationStreak: 12 },
        rewards: {
            seashells: { min: 82, max: 135 },
            xp: 102,
            collectibleChance: 0.57
        },
        rarity: 'rare'
    },
    
    'camotes': {
        id: 'camotes',
        name: 'Camotes',
        group: 'visayas',
        emoji: '🌊',
        description: 'Lost Horizon of the South with caves, lakes, and beaches.',
        unlockRequirement: { level: 29, collectibles: 45 },
        rewards: {
            seashells: { min: 88, max: 145 },
            xp: 108,
            collectibleChance: 0.58
        },
        rarity: 'epic'
    },
    
    'boracay': {
        id: 'boracay',
        name: 'Boracay',
        group: 'visayas',
        emoji: '🏝️',
        description: 'World-famous island with white beach, vibrant nightlife, and water sports.',
        unlockRequirement: { level: 35, beachesExplored: 180, fishCaught: 200 },
        rewards: {
            seashells: { min: 110, max: 200 },
            xp: 140,
            collectibleChance: 0.68
        },
        rarity: 'epic'
    },
    
    'malapascua': {
        id: 'malapascua',
        name: 'Malapascua',
        group: 'visayas',
        emoji: '🦈',
        description: 'Diver\'s paradise famous for thresher sharks and pristine reefs.',
        unlockRequirement: { level: 38, fishCaught: 250 },
        rewards: {
            seashells: { min: 115, max: 190 },
            xp: 135,
            collectibleChance: 0.65
        },
        rarity: 'epic'
    },
    
    'olango': {
        id: 'olango',
        name: 'Olango',
        group: 'visayas',
        emoji: '🦩',
        description: 'Wildlife sanctuary with migratory birds and marine reserves.',
        unlockRequirement: { level: 40, collectibles: 65 },
        rewards: {
            seashells: { min: 120, max: 195 },
            xp: 145,
            collectibleChance: 0.66
        },
        rarity: 'epic'
    },
    
    // ============================================
    // 🔴 MINDANAO ISLAND GROUP (12 Islands)
    // ============================================
    
    'mindanao': {
        id: 'mindanao',
        name: 'Mindanao',
        group: 'mindanao',
        emoji: '🌄',
        description: 'Second-largest island with diverse culture, Mount Apo, and durian.',
        unlockRequirement: { level: 11 },
        rewards: {
            seashells: { min: 38, max: 68 },
            xp: 55,
            collectibleChance: 0.41
        },
        rarity: 'common'
    },
    
    'basilan': {
        id: 'basilan',
        name: 'Basilan',
        group: 'mindanao',
        emoji: '🌺',
        description: 'Island province known for rubber plantations and Islamic culture.',
        unlockRequirement: { level: 13 },
        rewards: {
            seashells: { min: 42, max: 72 },
            xp: 62,
            collectibleChance: 0.43
        },
        rarity: 'uncommon'
    },
    
    'jolo': {
        id: 'jolo',
        name: 'Jolo',
        group: 'mindanao',
        emoji: '🕌',
        description: 'Capital of Sulu with rich Tausug heritage and pearl diving.',
        unlockRequirement: { level: 15 },
        rewards: {
            seashells: { min: 46, max: 78 },
            xp: 68,
            collectibleChance: 0.44
        },
        rarity: 'uncommon'
    },
    
    'tawi-tawi': {
        id: 'tawi-tawi',
        name: 'Tawi-Tawi',
        group: 'mindanao',
        emoji: '🏝️',
        description: 'Southernmost province with stunning islands and Bajau culture.',
        unlockRequirement: { level: 31, beachesExplored: 120 },
        rewards: {
            seashells: { min: 92, max: 155 },
            xp: 112,
            collectibleChance: 0.60
        },
        rarity: 'epic'
    },
    
    'dinagat': {
        id: 'dinagat',
        name: 'Dinagat',
        group: 'mindanao',
        emoji: '🏞️',
        description: 'Mystical island with lakes, waterfalls, and mineral-rich mountains.',
        unlockRequirement: { level: 20 },
        rewards: {
            seashells: { min: 60, max: 102 },
            xp: 80,
            collectibleChance: 0.46
        },
        rarity: 'rare'
    },
    
    'siargao': {
        id: 'siargao',
        name: 'Siargao',
        group: 'mindanao',
        emoji: '🏄',
        description: 'Surfing capital of the Philippines with Cloud 9 and island hopping.',
        unlockRequirement: { level: 33, fishCaught: 180 },
        rewards: {
            seashells: { min: 100, max: 180 },
            xp: 130,
            collectibleChance: 0.64
        },
        rarity: 'epic'
    },
    
    'camiguin': {
        id: 'camiguin',
        name: 'Camiguin',
        group: 'mindanao',
        emoji: '🌋',
        description: 'Island born of fire with volcanoes, hot springs, and waterfalls.',
        unlockRequirement: { level: 37, collectibles: 60 },
        rewards: {
            seashells: { min: 112, max: 185 },
            xp: 138,
            collectibleChance: 0.66
        },
        rarity: 'epic'
    },
    
    'samal': {
        id: 'samal',
        name: 'Samal',
        group: 'mindanao',
        emoji: '🏖️',
        description: 'Garden city of the Philippines with beach resorts and marine life.',
        unlockRequirement: { level: 24, beachesExplored: 90 },
        rewards: {
            seashells: { min: 72, max: 120 },
            xp: 90,
            collectibleChance: 0.52
        },
        rarity: 'rare'
    },
    
    'sibutu': {
        id: 'sibutu',
        name: 'Sibutu',
        group: 'mindanao',
        emoji: '🐚',
        description: 'Remote island near Borneo with pristine reefs and sea turtles.',
        unlockRequirement: { level: 42, explorationStreak: 20 },
        rewards: {
            seashells: { min: 125, max: 210 },
            xp: 150,
            collectibleChance: 0.70
        },
        rarity: 'legendary'
    },
    
    'balut': {
        id: 'balut',
        name: 'Balut',
        group: 'mindanao',
        emoji: '🌊',
        description: 'Volcanic island with hot springs and untouched natural beauty.',
        unlockRequirement: { level: 44, fishCaught: 300 },
        rewards: {
            seashells: { min: 130, max: 220 },
            xp: 155,
            collectibleChance: 0.72
        },
        rarity: 'legendary'
    },
    
    'bongao': {
        id: 'bongao',
        name: 'Bongao',
        group: 'mindanao',
        emoji: '⛰️',
        description: 'Capital of Tawi-Tawi with Bud Bongao sacred mountain.',
        unlockRequirement: { level: 46, collectibles: 80 },
        rewards: {
            seashells: { min: 140, max: 230 },
            xp: 165,
            collectibleChance: 0.74
        },
        rarity: 'legendary'
    },
    
    'sarangani': {
        id: 'sarangani',
        name: 'Sarangani',
        group: 'mindanao',
        emoji: '🎣',
        description: 'Southernmost tip with rich fishing grounds and Sarangani Bay.',
        unlockRequirement: { level: 50, beachesExplored: 300, fishCaught: 400, collectibles: 100 },
        rewards: {
            seashells: { min: 180, max: 300 },
            xp: 200,
            collectibleChance: 0.85
        },
        rarity: 'legendary'
    }
};

// Helper function to get island by ID
export function getBeachById(id) {
    return beachesData[id];
}

// Helper function to get island by name (fuzzy search)
export function getIslandByName(name) {
    const searchName = name.toLowerCase().trim();
    
    // Exact match first
    for (const islandId in beachesData) {
        if (islandId === searchName || beachesData[islandId].name.toLowerCase() === searchName) {
            return beachesData[islandId];
        }
    }
    
    // Partial match
    for (const islandId in beachesData) {
        const island = beachesData[islandId];
        if (island.name.toLowerCase().includes(searchName) || islandId.includes(searchName)) {
            return island;
        }
    }
    
    return null;
}

// Helper function to check if island is unlocked
export function isBeachUnlocked(beach, profile) {
    const req = beach.unlockRequirement;
    
    // Use battlePassXP to calculate level if battlePassLevel doesn't exist
    const playerLevel = profile.battlePassLevel || Math.floor(profile.battlePassXP / 100) || 0;
    
    if (playerLevel < req.level) return false;
    if (req.fishCaught && profile.fishCaught < req.fishCaught) return false;
    if (req.explorationStreak && profile.explorationStreak < req.explorationStreak) return false;
    if (req.beachesExplored && profile.beachesExplored < req.beachesExplored) return false;
    if (req.collectibles && profile.collectibles.length < req.collectibles) return false;
    
    return true;
}

// Get list of available islands for a profile
export function getAvailableBeaches(profile) {
    const available = [];
    
    for (const beachId in beachesData) {
        const beach = beachesData[beachId];
        if (isBeachUnlocked(beach, profile)) {
            available.push(beach);
        }
    }
    
    return available;
}

// Get islands by group
export function getIslandsByGroup(groupName) {
    const islands = [];
    
    for (const islandId in beachesData) {
        const island = beachesData[islandId];
        if (island.group === groupName) {
            islands.push(island);
        }
    }
    
    return islands;
}

// Get total island count
export function getTotalIslandCount() {
    return Object.keys(beachesData).length;
}

// Get explorer rank based on islands visited
export function getExplorerRank(visitedIslands) {
    const uniqueIslands = new Set(visitedIslands).size;
    
    if (uniqueIslands >= 54) return { rank: 'Philippine Explorer', emoji: '🏆', tier: 4 };
    if (uniqueIslands >= 30) return { rank: 'Archipelago Adventurer', emoji: '⭐', tier: 3 };
    if (uniqueIslands >= 15) return { rank: 'Island Hopper', emoji: '🏝️', tier: 2 };
    if (uniqueIslands >= 5) return { rank: 'Local Tourist', emoji: '🎒', tier: 1 };
    return { rank: 'Beginner', emoji: '🌱', tier: 0 };
}

// Check if island was visited
export function hasVisitedIsland(profile, islandId) {
    return profile.visitedIslands && profile.visitedIslands.includes(islandId);
}

// Get island group statistics
export function getIslandGroupStats(profile) {
    const stats = {
        luzon: { visited: 0, total: 0 },
        visayas: { visited: 0, total: 0 },
        mindanao: { visited: 0, total: 0 }
    };
    
    for (const islandId in beachesData) {
        const island = beachesData[islandId];
        stats[island.group].total++;
        
        if (hasVisitedIsland(profile, islandId)) {
            stats[island.group].visited++;
        }
    }
    
    return stats;
}

// Island Progress Tracking System
// Players must complete activities on an island before unlocking the next one

/**
 * Check if player has completed an island's requirements
 * @param {Object} island - Island data
 * @param {Object} progress - Player's progress on this island
 * @returns {Boolean}
 */
export function isIslandCompleted(island, progress) {
    if (!island.progressRequirements || !progress) return true;
    
    const req = island.progressRequirements;
    
    return (
        progress.fish >= req.fish &&
        progress.explorations >= req.explorations &&
        progress.collectibles >= req.collectibles
    );
}

/**
 * Get player's progress on an island
 * @param {Object} profile - Summer profile
 * @param {String} islandId - Island ID
 * @returns {Object} Progress object
 */
export function getIslandProgress(profile, islandId) {
    if (!profile.islandProgress) return { fish: 0, explorations: 0, collectibles: 0 };
    
    const progress = profile.islandProgress.find(p => p.islandId === islandId);
    return progress || { fish: 0, explorations: 0, collectibles: 0 };
}

/**
 * Update island progress
 * @param {Object} profile - Summer profile
 * @param {String} islandId - Island ID
 * @param {String} type - Type of progress ('fish', 'explorations', 'collectibles')
 * @param {Number} amount - Amount to add (default 1)
 */
export function updateIslandProgress(profile, islandId, type, amount = 1) {
    if (!profile.islandProgress) {
        profile.islandProgress = [];
    }
    
    let progress = profile.islandProgress.find(p => p.islandId === islandId);
    
    if (!progress) {
        progress = {
            islandId,
            fish: 0,
            explorations: 0,
            collectibles: 0
        };
        profile.islandProgress.push(progress);
    }
    
    progress[type] = (progress[type] || 0) + amount;
}

/**
 * Check if next island in sequence is unlocked
 * @param {Object} island - Current island
 * @param {Object} profile - Summer profile
 * @returns {Boolean}
 */
export function canProgressToNextIsland(island, profile) {
    // If no next island requirement, any unlocked island is accessible
    if (!island.unlockRequirement.previousIsland) return true;
    
    // Check if current island is completed
    if (!island.progressRequirements) return true;
    
    const progress = getIslandProgress(profile, island.id);
    return isIslandCompleted(island, progress);
}

/**
 * Get next island in progression
 * @param {String} currentIslandId - Current island ID
 * @returns {Object|null} Next island or null
 */
export function getNextIsland(currentIslandId) {
    // Find islands that require this island as previous
    for (const islandId in beachesData) {
        const island = beachesData[islandId];
        if (island.unlockRequirement.previousIsland === currentIslandId) {
            return island;
        }
    }
    
    return null;
}

/**
 * Get islands that are available to travel to
 * @param {Object} profile - Summer profile
 * @param {String} currentIslandId - Current island ID
 * @returns {Array} Array of available islands
 */
export function getAccessibleIslands(profile, currentIslandId) {
    const accessible = [];
    const currentIsland = beachesData[currentIslandId];
    
    // Check if current island is completed
    const currentProgress = getIslandProgress(profile, currentIslandId);
    const currentCompleted = !currentIsland.progressRequirements || 
                             isIslandCompleted(currentIsland, currentProgress);
    
    for (const islandId in beachesData) {
        const island = beachesData[islandId];
        
        // Check basic unlock requirements
        if (!isBeachUnlocked(island, profile)) continue;
        
        // If island requires previous island
        if (island.unlockRequirement.previousIsland) {
            const prevIsland = beachesData[island.unlockRequirement.previousIsland];
            const prevProgress = getIslandProgress(profile, island.unlockRequirement.previousIsland);
            
            // Previous island must be completed
            if (!isIslandCompleted(prevIsland, prevProgress)) continue;
        }
        
        accessible.push(island);
    }
    
    return accessible;
}

/**
 * Format island progress for display
 * @param {Object} island - Island data
 * @param {Object} progress - Progress object
 * @returns {String}
 */
export function formatIslandProgress(island, progress) {
    if (!island.progressRequirements) {
        return '✅ No requirements';
    }
    
    const req = island.progressRequirements;
    const completed = isIslandCompleted(island, progress);
    
    let text = completed ? '✅ **COMPLETED**\n' : '📊 **Progress:**\n';
    text += `> 🎣 Fish: \`${progress.fish}/${req.fish}\` ${progress.fish >= req.fish ? '✓' : ''}\n`;
    text += `> 🏝️ Explorations: \`${progress.explorations}/${req.explorations}\` ${progress.explorations >= req.explorations ? '✓' : ''}\n`;
    text += `> 🦀 Collectibles: \`${progress.collectibles}/${req.collectibles}\` ${progress.collectibles >= req.collectibles ? '✓' : ''}`;
    
    return text;
}
