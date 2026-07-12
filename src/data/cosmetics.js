// Cosmetic items that can be unlocked through battle pass, achievements, and events
// All cosmetics are purely visual - no pay-to-win mechanics

export const cosmeticsData = {
    backgrounds: [
        { id: 'bg_sunset', name: 'Sunset Paradise', rarity: 'common', unlockTier: 5 },
        { id: 'bg_ocean', name: 'Ocean Profile Theme', rarity: 'uncommon', unlockTier: 20 },
        { id: 'bg_tropical', name: 'Tropical Background', rarity: 'uncommon', unlockTier: 30 },
        { id: 'bg_volcano', name: 'Volcano Background', rarity: 'rare', unlockTier: 80 },
        { id: 'bg_crystal', name: 'Crystal Waters', rarity: 'rare', unlockTier: 40 },
        { id: 'bg_animated', name: 'Exclusive Animated Profile', rarity: 'legendary', unlockTier: 100 }
    ],
    
    frames: [
        { id: 'frame_palm', name: 'Palm Tree Profile Frame', rarity: 'uncommon', unlockTier: 40 },
        { id: 'frame_flower', name: 'Flower Avatar Frame', rarity: 'uncommon', unlockTier: 30 },
        { id: 'frame_golden', name: 'Golden Island Frame', rarity: 'epic', unlockTier: 90 },
        { id: 'frame_diamond', name: 'Diamond Summer', rarity: 'epic', unlockTier: 90 },
        { id: 'frame_rainbow', name: 'Rainbow Paradise', rarity: 'legendary', unlockTier: 100 }
    ],
    
    badges: [
        { id: 'badge_starter', name: 'Beach Explorer', rarity: 'common', unlockTier: 1 },
        { id: 'badge_nameplate', name: 'Beach Nameplate', rarity: 'common', unlockTier: 4 },
        { id: 'badge_surfboard', name: 'Surfboard Profile Badge', rarity: 'uncommon', unlockTier: 15 },
        { id: 'badge_wave', name: 'Wave Rider', rarity: 'uncommon', unlockTier: 40 },
        { id: 'badge_legend', name: 'Summer Legend', rarity: 'rare', unlockTier: 75 },
        { id: 'badge_elite', name: 'Summer Elite', rarity: 'legendary', unlockTier: 100 }
    ],
    
    pets: [
        { id: 'pet_turtle', name: 'Turtle Companion', rarity: 'common', unlockTier: 10 },
        { id: 'pet_crab', name: 'Crab Companion Sticker', rarity: 'common', unlockTier: 8 },
        { id: 'pet_baby_turtle', name: 'Baby Sea Turtle', rarity: 'uncommon', unlockTier: 25 },
        { id: 'pet_parrot', name: 'Tropical Parrot Pet', rarity: 'rare', unlockTier: 75 },
        { id: 'pet_diamond_crab', name: 'Diamond Crab', rarity: 'legendary', unlockTier: 100 }
    ],
    
    titles: [
        { id: 'title_explorer', name: 'Beach Explorer', rarity: 'common', unlockTier: 1 },
        { id: 'title_traveler', name: 'Island Traveler', rarity: 'uncommon', unlockTier: 50 },
        { id: 'title_legend', name: 'Summer Legend', rarity: 'rare', unlockTier: 100 },
        { id: 'title_champion', name: 'Summer Champion 2026', rarity: 'legendary', unlockTier: 100 }
    ],
    
    banners: [
        { id: 'banner_sunset', name: 'Sunset Paradise', rarity: 'uncommon', unlockTier: 20 },
        { id: 'banner_shark', name: 'Shark Banner', rarity: 'rare', unlockTier: 70 },
        { id: 'banner_beach', name: 'Beach Banner', rarity: 'common', unlockTier: 10 }
    ],
    
    emotes: [
        { id: 'emote_summer', name: 'Summer Vibes Pack', rarity: 'uncommon', unlockTier: 10 },
        { id: 'emote_tropical', name: 'Tropical Emote Pack', rarity: 'uncommon', unlockTier: 25 },
        { id: 'emote_beach', name: 'Beach Party Pack', rarity: 'rare', unlockTier: 35 },
        { id: 'emote_ocean', name: 'Ocean Legends Pack', rarity: 'epic', unlockTier: 60 }
    ],
    
    nameplates: [
        { id: 'nameplate_surfboard', name: 'Surfboard Nameplate', rarity: 'uncommon', unlockTier: 15 },
        { id: 'nameplate_beach', name: 'Beach Nameplate', rarity: 'common', unlockTier: 4 }
    ],
    
    // Mystery boxes and treasure chests
    mysteryBoxes: [
        { id: 'box_small', name: 'Small Treasure Chest', rarity: 'common', unlockTier: 3 },
        { id: 'box_rare', name: 'Rare Treasure Chest', rarity: 'rare', unlockTier: 60 }
    ],
    
    // Decorations
    decorations: [
        { id: 'deco_coral', name: 'Coral Decoration', rarity: 'common', unlockTier: 9 }
    ]
};

// Helper function to get all cosmetics
export function getAllCosmetics() {
    const all = [];
    for (const category in cosmeticsData) {
        all.push(...cosmeticsData[category].map(item => ({
            ...item,
            category
        })));
    }
    return all;
}

// Helper function to get cosmetic by ID
export function getCosmeticById(id) {
    const all = getAllCosmetics();
    return all.find(c => c.id === id);
}

// Helper function to get cosmetics by category
export function getCosmeticsByCategory(category) {
    return cosmeticsData[category] || [];
}

// Helper function to get cosmetics by tier
export function getCosmeticsByTier(tier) {
    const all = getAllCosmetics();
    return all.filter(c => c.unlockTier === tier);
}

// Helper function to get cosmetics by rarity
export function getCosmeticsByRarity(rarity) {
    const all = getAllCosmetics();
    return all.filter(c => c.rarity === rarity);
}

// Rarity colors
export const rarityColors = {
    common: '#95A5A6',
    uncommon: '#3498DB',
    rare: '#9B59B6',
    epic: '#E67E22',
    legendary: '#F1C40F'
};

// Rarity emojis
export const rarityEmojis = {
    common: '⚪',
    uncommon: '🔵',
    rare: '🟣',
    epic: '🟠',
    legendary: '🟡'
};
