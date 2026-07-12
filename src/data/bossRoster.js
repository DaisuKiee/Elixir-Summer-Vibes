// Boss/Raid Roster - Legendary Creatures from Philippine Mythology
// Server-wide cooperative battles with Filipino folklore creatures

export const bossDifficulty = {
    NORMAL: 'normal',
    HARD: 'hard',
    LEGENDARY: 'legendary',
    MYTHICAL: 'mythical'
};

export const bossRoster = {
    // === NORMAL BOSSES (Weekly) ===
    giant_tamaraw: {
        id: 'giant_tamaraw',
        name: 'Giant Tamaraw',
        title: 'Wild Bull of Mindoro',
        difficulty: bossDifficulty.NORMAL,
        emoji: '🐃',
        
        description: 'A massive wild water buffalo that roams the mountains of Mindoro. Its horns can pierce through solid rock.',
        
        stats: {
            maxHP: 50000,
            defense: 100,
            minDamagePerHit: 50,
            maxDamagePerHit: 150
        },
        
        duration: 48 * 60 * 60 * 1000, // 48 hours
        
        rewards: {
            participation: {
                xp: 500,
                seashells: 1000,
                collectible: 'tamaraw_horn'
            },
            topDamage: {
                xp: 2000,
                seashells: 5000,
                sunTokens: 10,
                collectible: 'golden_tamaraw_horn',
                fish: 'legendary_random'
            },
            top10: {
                xp: 1000,
                seashells: 2500,
                sunTokens: 5,
                fish: 'epic_random'
            }
        },
        
        unlockTier: 15,
        spawnChance: 0.3 // 30% weekly
    },
    
    tikbalang: {
        id: 'tikbalang',
        name: 'Tikbalang',
        title: 'Horse-Headed Trickster',
        difficulty: bossDifficulty.NORMAL,
        emoji: '🐴',
        
        description: 'A mischievous creature with the head of a horse and body of a man. Known for leading travelers astray in forests.',
        
        stats: {
            maxHP: 60000,
            defense: 120,
            minDamagePerHit: 60,
            maxDamagePerHit: 180
        },
        
        duration: 48 * 60 * 60 * 1000,
        
        rewards: {
            participation: {
                xp: 600,
                seashells: 1200,
                collectible: 'tikbalang_mane'
            },
            topDamage: {
                xp: 2500,
                seashells: 6000,
                sunTokens: 15,
                collectible: 'golden_horseshoe',
                fish: 'legendary_random'
            },
            top10: {
                xp: 1200,
                seashells: 3000,
                sunTokens: 7,
                fish: 'epic_random'
            }
        },
        
        unlockTier: 20,
        spawnChance: 0.3
    },
    
    // === HARD BOSSES (Bi-weekly) ===
    siyokoy: {
        id: 'siyokoy',
        name: 'Siyokoy',
        title: 'Sea Demon of the Deep',
        difficulty: bossDifficulty.HARD,
        emoji: '🧜‍♂️',
        
        description: 'A malevolent sea creature with green scales and webbed limbs. Guards the treasures of drowned ships.',
        
        stats: {
            maxHP: 100000,
            defense: 200,
            minDamagePerHit: 80,
            maxDamagePerHit: 250
        },
        
        duration: 72 * 60 * 60 * 1000, // 72 hours
        
        rewards: {
            participation: {
                xp: 1000,
                seashells: 2500,
                collectible: 'siyokoy_scale'
            },
            topDamage: {
                xp: 5000,
                seashells: 15000,
                sunTokens: 25,
                collectible: 'trident_of_the_deep',
                fish: 'mythical_random',
                cosmetic: 'ocean_guardian_frame'
            },
            top10: {
                xp: 2500,
                seashells: 7500,
                sunTokens: 15,
                fish: 'legendary_random'
            },
            top50: {
                xp: 1500,
                seashells: 4000,
                sunTokens: 10,
                fish: 'epic_random'
            }
        },
        
        unlockTier: 35,
        spawnChance: 0.2
    },
    
    manananggal: {
        id: 'manananggal',
        name: 'Manananggal',
        title: 'Night Vampire Witch',
        difficulty: bossDifficulty.HARD,
        emoji: '🦇',
        
        description: 'A vampiric creature that splits its torso from its legs at night to fly and feed on victims.',
        
        stats: {
            maxHP: 120000,
            defense: 180,
            minDamagePerHit: 100,
            maxDamagePerHit: 300
        },
        
        duration: 72 * 60 * 60 * 1000,
        
        rewards: {
            participation: {
                xp: 1200,
                seashells: 3000,
                collectible: 'bat_wing'
            },
            topDamage: {
                xp: 6000,
                seashells: 18000,
                sunTokens: 30,
                collectible: 'vampire_fang',
                fish: 'mythical_random',
                cosmetic: 'night_hunter_badge'
            },
            top10: {
                xp: 3000,
                seashells: 9000,
                sunTokens: 18,
                fish: 'legendary_random'
            },
            top50: {
                xp: 1800,
                seashells: 4500,
                sunTokens: 12,
                fish: 'epic_random'
            }
        },
        
        unlockTier: 40,
        spawnChance: 0.2
    },
    
    // === LEGENDARY BOSSES (Monthly) ===
    kapre: {
        id: 'kapre',
        name: 'Kapre',
        title: 'Giant Tree Demon',
        difficulty: bossDifficulty.LEGENDARY,
        emoji: '🌳',
        
        description: 'A towering giant that lives in ancient trees, smoking a massive tobacco pipe. Territorial and incredibly strong.',
        
        stats: {
            maxHP: 250000,
            defense: 300,
            minDamagePerHit: 150,
            maxDamagePerHit: 500
        },
        
        duration: 96 * 60 * 60 * 1000, // 96 hours (4 days)
        
        rewards: {
            participation: {
                xp: 2000,
                seashells: 5000,
                sunTokens: 5,
                collectible: 'ancient_tobacco_leaf'
            },
            topDamage: {
                xp: 15000,
                seashells: 50000,
                sunTokens: 100,
                collectible: 'kapre_cigar',
                fish: 'mythical_variant',
                cosmetic: 'forest_king_title',
                badge: 'giant_slayer'
            },
            top10: {
                xp: 8000,
                seashells: 25000,
                sunTokens: 50,
                fish: 'mythical_random',
                cosmetic: 'tree_spirit_frame'
            },
            top50: {
                xp: 4000,
                seashells: 12000,
                sunTokens: 25,
                fish: 'legendary_random'
            },
            top100: {
                xp: 2500,
                seashells: 7000,
                sunTokens: 15,
                fish: 'epic_random'
            }
        },
        
        unlockTier: 50,
        spawnChance: 0.1
    },
    
    // === MYTHICAL BOSSES (Special Events) ===
    bakunawa: {
        id: 'bakunawa',
        name: 'Bakunawa',
        title: 'Moon-Eating Dragon',
        difficulty: bossDifficulty.MYTHICAL,
        emoji: '🐉',
        
        description: 'The legendary sea serpent that swallows moons. When it appears, the sky darkens and the seas rage.',
        
        stats: {
            maxHP: 500000,
            defense: 500,
            minDamagePerHit: 200,
            maxDamagePerHit: 800
        },
        
        duration: 120 * 60 * 60 * 1000, // 120 hours (5 days)
        
        rewards: {
            participation: {
                xp: 5000,
                seashells: 10000,
                sunTokens: 10,
                collectible: 'dragon_scale',
                badge: 'moon_defender'
            },
            topDamage: {
                xp: 50000,
                seashells: 200000,
                sunTokens: 500,
                collectible: 'bakunawa_heart',
                fish: 'rainbow_variant_mythical',
                cosmetic: 'dragon_slayer_title',
                badge: 'legend_of_bakunawa',
                prestigePoints: 5
            },
            top10: {
                xp: 25000,
                seashells: 100000,
                sunTokens: 250,
                fish: 'golden_variant_mythical',
                cosmetic: 'moon_guardian_frame',
                badge: 'dragon_hunter',
                prestigePoints: 3
            },
            top50: {
                xp: 12000,
                seashells: 50000,
                sunTokens: 125,
                fish: 'mythical_variant',
                cosmetic: 'serpent_slayer_badge',
                prestigePoints: 2
            },
            top100: {
                xp: 7500,
                seashells: 25000,
                sunTokens: 75,
                fish: 'mythical_random',
                prestigePoints: 1
            }
        },
        
        unlockTier: 75,
        spawnChance: 0.05, // Rare special event
        isSpecialEvent: true
    },
    
    manila_bay_kraken: {
        id: 'manila_bay_kraken',
        name: 'Kraken of Manila Bay',
        title: 'Terror of the Seven Seas',
        difficulty: bossDifficulty.MYTHICAL,
        emoji: '🐙',
        
        description: 'A colossal octopus that emerges from the depths of Manila Bay. Its tentacles can sink entire fleets.',
        
        stats: {
            maxHP: 750000,
            defense: 600,
            minDamagePerHit: 250,
            maxDamagePerHit: 1000
        },
        
        duration: 144 * 60 * 60 * 1000, // 144 hours (6 days)
        
        rewards: {
            participation: {
                xp: 7500,
                seashells: 15000,
                sunTokens: 15,
                collectible: 'kraken_tentacle',
                badge: 'bay_defender'
            },
            topDamage: {
                xp: 100000,
                seashells: 500000,
                sunTokens: 1000,
                collectible: 'kraken_eye',
                fish: 'rainbow_variant_mythical',
                cosmetic: 'ocean_conqueror_title',
                badge: 'kraken_slayer',
                prestigePoints: 10
            },
            top10: {
                xp: 50000,
                seashells: 250000,
                sunTokens: 500,
                fish: 'crystal_variant_mythical',
                cosmetic: 'deep_sea_lord_frame',
                badge: 'legendary_fisher',
                prestigePoints: 7
            },
            top50: {
                xp: 25000,
                seashells: 125000,
                sunTokens: 250,
                fish: 'shadow_variant_mythical',
                cosmetic: 'tentacle_warrior_badge',
                prestigePoints: 5
            },
            top100: {
                xp: 15000,
                seashells: 75000,
                sunTokens: 150,
                fish: 'golden_variant_mythical',
                prestigePoints: 3
            }
        },
        
        unlockTier: 90,
        spawnChance: 0.03, // Very rare
        isSpecialEvent: true
    }
};

/**
 * Get all bosses
 * @returns {Array} Array of boss objects
 */
export function getAllBosses() {
    return Object.values(bossRoster);
}

/**
 * Get boss by ID
 * @param {String} bossId - Boss identifier
 * @returns {Object|null} Boss object or null
 */
export function getBossById(bossId) {
    return bossRoster[bossId] || null;
}

/**
 * Get bosses by difficulty
 * @param {String} difficulty - Boss difficulty
 * @returns {Array} Array of boss objects
 */
export function getBossesByDifficulty(difficulty) {
    return getAllBosses().filter(boss => boss.difficulty === difficulty);
}

/**
 * Get bosses player can fight (based on tier)
 * @param {Number} playerTier - Player's current tier
 * @returns {Array} Array of available boss objects
 */
export function getAvailableBosses(playerTier) {
    return getAllBosses().filter(boss => playerTier >= boss.unlockTier);
}

/**
 * Get special event bosses only
 * @returns {Array} Array of special event bosses
 */
export function getSpecialEventBosses() {
    return getAllBosses().filter(boss => boss.isSpecialEvent);
}

/**
 * Roll for boss spawn
 * @param {String} difficulty - Target difficulty
 * @param {Number} playerTier - Player's tier (for unlock check)
 * @returns {Object|null} Spawned boss or null
 */
export function rollBossSpawn(difficulty, playerTier) {
    const eligibleBosses = getBossesByDifficulty(difficulty)
        .filter(boss => playerTier >= boss.unlockTier);
    
    if (eligibleBosses.length === 0) return null;
    
    // Weighted random selection based on spawn chance
    const totalWeight = eligibleBosses.reduce((sum, boss) => sum + boss.spawnChance, 0);
    let random = Math.random() * totalWeight;
    
    for (const boss of eligibleBosses) {
        random -= boss.spawnChance;
        if (random <= 0) {
            return boss;
        }
    }
    
    return eligibleBosses[0]; // Fallback
}

/**
 * Get difficulty emoji
 * @param {String} difficulty - Boss difficulty
 * @returns {String} Difficulty emoji
 */
export function getDifficultyEmoji(difficulty) {
    const emojis = {
        [bossDifficulty.NORMAL]: '⚔️',
        [bossDifficulty.HARD]: '🔥',
        [bossDifficulty.LEGENDARY]: '💀',
        [bossDifficulty.MYTHICAL]: '✨'
    };
    return emojis[difficulty] || '⚔️';
}

/**
 * Get difficulty color
 * @param {String} difficulty - Boss difficulty
 * @returns {String} Hex color
 */
export function getDifficultyColor(difficulty) {
    const colors = {
        [bossDifficulty.NORMAL]: '#57F287', // Green
        [bossDifficulty.HARD]: '#FF6B35', // Orange
        [bossDifficulty.LEGENDARY]: '#9B59B6', // Purple
        [bossDifficulty.MYTHICAL]: '#FFD700' // Gold
    };
    return colors[difficulty] || '#57F287';
}

export default {
    bossDifficulty,
    bossRoster,
    getAllBosses,
    getBossById,
    getBossesByDifficulty,
    getAvailableBosses,
    getSpecialEventBosses,
    rollBossSpawn,
    getDifficultyEmoji,
    getDifficultyColor
};
