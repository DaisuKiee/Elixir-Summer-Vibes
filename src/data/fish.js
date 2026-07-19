// 50 Philippine Fish species with rarities, weights, and island-specific spawns
export const fishData = {
    common: [
        { name: 'Tilapia', minWeight: 0.5, maxWeight: 2.0, xp: 5, value: 50, islands: ['all'] },
        { name: 'Bangus', minWeight: 0.8, maxWeight: 2.5, xp: 5, value: 60, islands: ['all'] },
        { name: 'Galunggong', minWeight: 0.2, maxWeight: 0.5, xp: 3, value: 25, islands: ['all'] },
        { name: 'Tamban', minWeight: 0.1, maxWeight: 0.3, xp: 2, value: 15, islands: ['all'] },
        { name: 'Hasa-Hasa', minWeight: 0.3, maxWeight: 0.8, xp: 4, value: 35, islands: ['all'] },
        { name: 'Danggit', minWeight: 0.1, maxWeight: 0.4, xp: 3, value: 30, islands: ['visayas', 'cebu'] },
        { name: 'Bisugo', minWeight: 0.4, maxWeight: 1.0, xp: 4, value: 40, islands: ['all'] },
        { name: 'Dilis', minWeight: 0.05, maxWeight: 0.15, xp: 2, value: 10, islands: ['all'] },
        { name: 'Hito', minWeight: 1.0, maxWeight: 3.0, xp: 6, value: 70, islands: ['luzon', 'mindanao'] },
        { name: 'Dalag', minWeight: 1.5, maxWeight: 4.0, xp: 7, value: 80, islands: ['luzon', 'mindanao'] },
    ],
    uncommon: [
        { name: 'Apahap', minWeight: 3.0, maxWeight: 8.0, xp: 10, value: 120, islands: ['all'] },
        { name: 'Lapu-Lapu', minWeight: 4.0, maxWeight: 10.0, xp: 12, value: 150, islands: ['palawan', 'boracay', 'visayas'] },
        { name: 'Maya-Maya', minWeight: 2.0, maxWeight: 6.0, xp: 10, value: 110, islands: ['visayas', 'palawan'] },
        { name: 'Yellowfin Tuna', minWeight: 15.0, maxWeight: 40.0, xp: 15, value: 180, islands: ['mindanao', 'tawi-tawi', 'siargao'] },
        { name: 'Skipjack Tuna', minWeight: 8.0, maxWeight: 20.0, xp: 12, value: 140, islands: ['mindanao', 'siargao'] },
        { name: 'Tanigue', minWeight: 10.0, maxWeight: 30.0, xp: 14, value: 165, islands: ['all'] },
        { name: 'Talakitok', minWeight: 3.0, maxWeight: 8.0, xp: 11, value: 125, islands: ['all'] },
        { name: 'Emperor Fish', minWeight: 2.5, maxWeight: 7.0, xp: 11, value: 115, islands: ['palawan', 'bohol'] },
        { name: 'Saramulyete', minWeight: 2.0, maxWeight: 5.0, xp: 10, value: 105, islands: ['visayas', 'mindanao'] },
        { name: 'Barracuda', minWeight: 5.0, maxWeight: 15.0, xp: 15, value: 175, islands: ['siargao', 'palawan', 'tawi-tawi'] },
        { name: 'Flying Fish', minWeight: 0.5, maxWeight: 1.5, xp: 9, value: 100, islands: ['all'] },
        { name: 'Needlefish', minWeight: 0.8, maxWeight: 2.0, xp: 9, value: 102, islands: ['all'] },
        { name: 'Moonfish', minWeight: 1.5, maxWeight: 4.0, xp: 10, value: 130, islands: ['palawan', 'boracay'] },
        { name: 'Pompano', minWeight: 2.0, maxWeight: 5.0, xp: 11, value: 135, islands: ['visayas', 'cebu'] },
        { name: 'Sweetlips', minWeight: 2.5, maxWeight: 6.0, xp: 12, value: 145, islands: ['palawan', 'bohol'] },
    ],
    rare: [
        { name: 'Napoleon Wrasse', minWeight: 10.0, maxWeight: 25.0, xp: 20, value: 210, islands: ['palawan', 'bohol'], weather: ['sunny'] },
        { name: 'Giant Trevally', minWeight: 15.0, maxWeight: 40.0, xp: 25, value: 260, islands: ['siargao', 'palawan', 'tawi-tawi'] },
        { name: 'Mahi-Mahi', minWeight: 10.0, maxWeight: 30.0, xp: 22, value: 230, islands: ['mindanao', 'siargao'] },
        { name: 'Sailfish', minWeight: 30.0, maxWeight: 70.0, xp: 28, value: 290, islands: ['siargao', 'palawan'] },
        { name: 'Dogtooth Tuna', minWeight: 20.0, maxWeight: 50.0, xp: 26, value: 270, islands: ['mindanao', 'tawi-tawi', 'siargao'] },
        { name: 'Coral Trout', minWeight: 5.0, maxWeight: 15.0, xp: 20, value: 205, islands: ['palawan', 'bohol', 'boracay'] },
        { name: 'Giant Grouper', minWeight: 25.0, maxWeight: 60.0, xp: 30, value: 300, islands: ['palawan', 'bohol'] },
        { name: 'Wahoo', minWeight: 15.0, maxWeight: 45.0, xp: 24, value: 250, islands: ['siargao', 'camiguin'] },
        { name: 'Giant Barracuda', minWeight: 20.0, maxWeight: 50.0, xp: 26, value: 265, islands: ['siargao', 'palawan', 'tawi-tawi'] },
        { name: 'Giant Catfish', minWeight: 30.0, maxWeight: 80.0, xp: 32, value: 295, islands: ['luzon', 'mindanao'], weather: ['rain', 'storm'] },
    ],
    epic: [
        { name: 'Blue Marlin', minWeight: 80.0, maxWeight: 200.0, xp: 50, value: 360, islands: ['siargao', 'palawan', 'tawi-tawi'] },
        { name: 'Black Marlin', minWeight: 100.0, maxWeight: 250.0, xp: 55, value: 390, islands: ['siargao', 'palawan', 'camiguin'] },
        { name: 'Swordfish', minWeight: 60.0, maxWeight: 150.0, xp: 48, value: 350, islands: ['siargao', 'palawan', 'tawi-tawi'] },
        { name: 'Giant Yellowfin Tuna', minWeight: 80.0, maxWeight: 180.0, xp: 52, value: 380, islands: ['mindanao', 'tawi-tawi', 'siargao'] },
        { name: 'Bluefin Trevally', minWeight: 30.0, maxWeight: 80.0, xp: 45, value: 320, islands: ['palawan', 'siargao'] },
        { name: 'Oceanic Whitetip Shark', minWeight: 50.0, maxWeight: 120.0, xp: 46, value: 330, islands: ['palawan', 'tawi-tawi'] },
        { name: 'Thresher Shark', minWeight: 80.0, maxWeight: 200.0, xp: 50, value: 360, islands: ['malapascua', 'cebu'], weather: ['sunny', 'cloudy'] },
        { name: 'Whale Shark', minWeight: 500.0, maxWeight: 1500.0, xp: 60, value: 400, islands: ['bohol', 'cebu', 'siargao'], weather: ['sunny'] },
        { name: 'Reef Manta Ray', minWeight: 100.0, maxWeight: 300.0, xp: 55, value: 390, islands: ['palawan', 'bohol', 'malapascua'] },
        { name: 'Giant Freshwater Stingray', minWeight: 150.0, maxWeight: 400.0, xp: 58, value: 395, islands: ['mindanao', 'luzon'], weather: ['rain', 'storm'] },
    ],
    legendary: [
        { name: 'Coelacanth', minWeight: 80.0, maxWeight: 180.0, xp: 100, value: 650, islands: ['palawan', 'tawi-tawi'], weather: ['night', 'storm'], description: 'Ancient living fossil' },
        { name: 'Oarfish', minWeight: 100.0, maxWeight: 250.0, xp: 110, value: 720, islands: ['tawi-tawi', 'siargao'], weather: ['storm'], description: 'Deep sea serpent of legend' },
        { name: 'Goblin Shark', minWeight: 120.0, maxWeight: 300.0, xp: 120, value: 800, islands: ['palawan', 'tawi-tawi'], weather: ['night'], description: 'Living relic from the deep' },
        { name: 'Megamouth Shark', minWeight: 200.0, maxWeight: 500.0, xp: 130, value: 900, islands: ['siargao', 'palawan'], weather: ['night'], description: 'Rare filter-feeding giant' },
        { name: 'Ocean Sunfish', minWeight: 300.0, maxWeight: 1000.0, xp: 140, value: 1000, islands: ['palawan', 'bohol', 'siargao'], weather: ['sunny'], description: 'Massive floating enigma' },
        { name: 'Frilled Shark', minWeight: 150.0, maxWeight: 350.0, xp: 125, value: 850, islands: ['tawi-tawi', 'palawan'], weather: ['night', 'storm'], description: 'Prehistoric deep-sea predator' },
        { name: 'Giant Isopod', minWeight: 50.0, maxWeight: 120.0, xp: 115, value: 780, islands: ['palawan', 'tawi-tawi'], weather: ['night'], description: 'Colossal armored scavenger of the abyss' },
        { name: 'Abyssal Anglerfish', minWeight: 30.0, maxWeight: 80.0, xp: 135, value: 920, islands: ['tawi-tawi', 'siargao'], weather: ['night', 'storm'], description: 'Bioluminescent deep-sea hunter' },
        { name: 'Giant Squid', minWeight: 400.0, maxWeight: 1200.0, xp: 150, value: 1050, islands: ['palawan', 'tawi-tawi', 'siargao'], weather: ['storm', 'night'], description: 'Legendary tentacled behemoth' },
        { name: 'Colossal Manta', minWeight: 500.0, maxWeight: 1500.0, xp: 145, value: 1020, islands: ['palawan', 'bohol', 'siargao'], weather: ['sunny', 'cloudy'], description: 'Titanic graceful giant of the open ocean' },
    ],
    mythical: [
        { name: 'Bakunawa', minWeight: 1000.0, maxWeight: 3000.0, xp: 250, value: 1450, islands: ['luzon', 'mindanao'], weather: ['night'], description: 'Legendary serpent that devours the moon' },
        { name: 'Siyokoy Guardian', minWeight: 200.0, maxWeight: 500.0, xp: 200, value: 1100, islands: ['visayas', 'palawan'], weather: ['storm'], description: 'Mythical sea creature from Filipino folklore' },
        { name: 'Magindara', minWeight: 80.0, maxWeight: 200.0, xp: 220, value: 1200, islands: ['palawan', 'siargao'], weather: ['night', 'sunny'], description: 'Beautiful siren of Philippine seas' },
        { name: 'Berberoka', minWeight: 300.0, maxWeight: 800.0, xp: 230, value: 1300, islands: ['mindanao', 'tawi-tawi'], weather: ['rain', 'storm'], description: 'Water spirit that controls floods' },
        { name: 'Kataw King', minWeight: 150.0, maxWeight: 400.0, xp: 225, value: 1250, islands: ['all'], weather: ['night'], description: 'King of the merfolk' },
        { name: 'Liwliwa Leviathan', minWeight: 2000.0, maxWeight: 5000.0, xp: 260, value: 1550, islands: ['palawan', 'siargao'], weather: ['storm'], description: 'Colossal sea beast of ancient tales' },
        { name: 'Golden Bakasi', minWeight: 100.0, maxWeight: 250.0, xp: 240, value: 1350, islands: ['luzon', 'visayas'], weather: ['sunny'], description: 'Radiant golden eel of prosperity' },
        { name: 'Moonscale Serpent', minWeight: 500.0, maxWeight: 1200.0, xp: 255, value: 1500, islands: ['palawan', 'tawi-tawi'], weather: ['night'], description: 'Silver-scaled dragon of the midnight depths' },
        { name: 'Diwata Koi', minWeight: 50.0, maxWeight: 150.0, xp: 235, value: 1320, islands: ['luzon', 'bohol'], weather: ['sunny', 'cloudy'], description: 'Enchanted fish blessed by forest spirits' },
        { name: 'Tidal Emperor', minWeight: 800.0, maxWeight: 2500.0, xp: 270, value: 1600, islands: ['all'], weather: ['storm', 'rain'], description: 'Supreme ruler of all ocean currents' },
    ]
};

// Rarity chances
export const rarityChances = {
    common: 55,
    uncommon: 25,
    rare: 12,
    epic: 6,
    legendary: 1.9,
    mythical: 0.1
};

// Weather types and effects
export const weatherTypes = {
    sunny: { name: 'Sunny', emoji: '☀️', multiplier: 1.0 },
    rain: { name: 'Rainy', emoji: '🌧️', multiplier: 1.1 },
    storm: { name: 'Stormy', emoji: '⛈️', multiplier: 1.3 },
    night: { name: 'Night', emoji: '🌙', multiplier: 1.2 },
    cloudy: { name: 'Cloudy', emoji: '☁️', multiplier: 1.0 }
};

// Get current weather (random or time-based)
export function getCurrentWeather() {
    // Fully randomized weather
    const roll = Math.random() * 100;
    
    if (roll < 40) return 'sunny';      // 40% chance
    if (roll < 60) return 'cloudy';     // 20% chance
    if (roll < 75) return 'rain';       // 15% chance
    if (roll < 85) return 'storm';      // 10% chance
    return 'night';                     // 15% chance
}

// Filter fish by island and weather
export function getAvailableFish(islandId, weather, rarity) {
    const fishPool = fishData[rarity] || [];
    
    return fishPool.filter(fish => {
        // Check island availability
        const islandMatch = fish.islands.includes('all') || fish.islands.includes(islandId);
        
        // Check weather requirement (if specified)
        const weatherMatch = !fish.weather || fish.weather.includes(weather);
        
        return islandMatch && weatherMatch;
    });
}

// Fishing rod upgrades
export const fishingRods = {
    1: { name: 'Bamboo Rod', bonus: 1.0, cost: 0 },
    2: { name: 'Wooden Rod', bonus: 1.1, cost: 500 },
    3: { name: 'Fiberglass Rod', bonus: 1.25, cost: 2000 },
    4: { name: 'Carbon Rod', bonus: 1.5, cost: 5000 },
    5: { name: 'Golden Rod', bonus: 2.0, cost: 15000 }
};
