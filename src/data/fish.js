// 50 Philippine Fish species with rarities, weights, and island-specific spawns
export const fishData = {
    common: [
        { name: 'Tilapia', minWeight: 0.5, maxWeight: 2.0, xp: 10, value: 8, islands: ['all'] },
        { name: 'Bangus', minWeight: 0.8, maxWeight: 2.5, xp: 12, value: 10, islands: ['all'] },
        { name: 'Galunggong', minWeight: 0.2, maxWeight: 0.5, xp: 10, value: 6, islands: ['all'] },
        { name: 'Tamban', minWeight: 0.1, maxWeight: 0.3, xp: 10, value: 5, islands: ['all'] },
        { name: 'Hasa-Hasa', minWeight: 0.3, maxWeight: 0.8, xp: 10, value: 7, islands: ['all'] },
        { name: 'Danggit', minWeight: 0.1, maxWeight: 0.4, xp: 10, value: 6, islands: ['visayas', 'cebu'] },
        { name: 'Bisugo', minWeight: 0.4, maxWeight: 1.0, xp: 12, value: 9, islands: ['all'] },
        { name: 'Dilis', minWeight: 0.05, maxWeight: 0.15, xp: 10, value: 4, islands: ['all'] },
        { name: 'Hito', minWeight: 1.0, maxWeight: 3.0, xp: 15, value: 12, islands: ['luzon', 'mindanao'] },
        { name: 'Dalag', minWeight: 1.5, maxWeight: 4.0, xp: 15, value: 14, islands: ['luzon', 'mindanao'] },
    ],
    uncommon: [
        { name: 'Apahap', minWeight: 3.0, maxWeight: 8.0, xp: 25, value: 35, islands: ['all'] },
        { name: 'Lapu-Lapu', minWeight: 4.0, maxWeight: 10.0, xp: 30, value: 40, islands: ['palawan', 'boracay', 'visayas'] },
        { name: 'Maya-Maya', minWeight: 2.0, maxWeight: 6.0, xp: 25, value: 30, islands: ['visayas', 'palawan'] },
        { name: 'Yellowfin Tuna', minWeight: 15.0, maxWeight: 40.0, xp: 35, value: 50, islands: ['mindanao', 'tawi-tawi', 'siargao'] },
        { name: 'Skipjack Tuna', minWeight: 8.0, maxWeight: 20.0, xp: 30, value: 38, islands: ['mindanao', 'siargao'] },
        { name: 'Tanigue', minWeight: 10.0, maxWeight: 30.0, xp: 32, value: 45, islands: ['all'] },
        { name: 'Talakitok', minWeight: 3.0, maxWeight: 8.0, xp: 28, value: 35, islands: ['all'] },
        { name: 'Emperor Fish', minWeight: 2.5, maxWeight: 7.0, xp: 27, value: 33, islands: ['palawan', 'bohol'] },
        { name: 'Saramulyete', minWeight: 2.0, maxWeight: 5.0, xp: 25, value: 30, islands: ['visayas', 'mindanao'] },
        { name: 'Barracuda', minWeight: 5.0, maxWeight: 15.0, xp: 35, value: 48, islands: ['siargao', 'palawan', 'tawi-tawi'] },
        { name: 'Flying Fish', minWeight: 0.5, maxWeight: 1.5, xp: 22, value: 25, islands: ['all'] },
        { name: 'Needlefish', minWeight: 0.8, maxWeight: 2.0, xp: 23, value: 26, islands: ['all'] },
        { name: 'Moonfish', minWeight: 1.5, maxWeight: 4.0, xp: 26, value: 32, islands: ['palawan', 'boracay'] },
        { name: 'Pompano', minWeight: 2.0, maxWeight: 5.0, xp: 27, value: 34, islands: ['visayas', 'cebu'] },
        { name: 'Sweetlips', minWeight: 2.5, maxWeight: 6.0, xp: 28, value: 36, islands: ['palawan', 'bohol'] },
    ],
    rare: [
        { name: 'Napoleon Wrasse', minWeight: 10.0, maxWeight: 25.0, xp: 60, value: 100, islands: ['palawan', 'bohol'], weather: ['sunny'] },
        { name: 'Giant Trevally', minWeight: 15.0, maxWeight: 40.0, xp: 70, value: 120, islands: ['siargao', 'palawan', 'tawi-tawi'] },
        { name: 'Mahi-Mahi', minWeight: 10.0, maxWeight: 30.0, xp: 65, value: 110, islands: ['mindanao', 'siargao'] },
        { name: 'Sailfish', minWeight: 30.0, maxWeight: 70.0, xp: 80, value: 150, islands: ['siargao', 'palawan'] },
        { name: 'Dogtooth Tuna', minWeight: 20.0, maxWeight: 50.0, xp: 75, value: 140, islands: ['mindanao', 'tawi-tawi', 'siargao'] },
        { name: 'Coral Trout', minWeight: 5.0, maxWeight: 15.0, xp: 60, value: 95, islands: ['palawan', 'bohol', 'boracay'] },
        { name: 'Giant Grouper', minWeight: 25.0, maxWeight: 60.0, xp: 85, value: 160, islands: ['palawan', 'bohol'] },
        { name: 'Wahoo', minWeight: 15.0, maxWeight: 45.0, xp: 70, value: 130, islands: ['siargao', 'camiguin'] },
        { name: 'Giant Barracuda', minWeight: 20.0, maxWeight: 50.0, xp: 75, value: 135, islands: ['siargao', 'palawan', 'tawi-tawi'] },
        { name: 'Giant Catfish', minWeight: 30.0, maxWeight: 80.0, xp: 90, value: 170, islands: ['luzon', 'mindanao'], weather: ['rain', 'storm'] },
    ],
    epic: [
        { name: 'Blue Marlin', minWeight: 80.0, maxWeight: 200.0, xp: 180, value: 450, islands: ['siargao', 'palawan', 'tawi-tawi'] },
        { name: 'Black Marlin', minWeight: 100.0, maxWeight: 250.0, xp: 200, value: 500, islands: ['siargao', 'palawan', 'camiguin'] },
        { name: 'Swordfish', minWeight: 60.0, maxWeight: 150.0, xp: 170, value: 420, islands: ['siargao', 'palawan', 'tawi-tawi'] },
        { name: 'Giant Yellowfin Tuna', minWeight: 80.0, maxWeight: 180.0, xp: 190, value: 480, islands: ['mindanao', 'tawi-tawi', 'siargao'] },
        { name: 'Bluefin Trevally', minWeight: 30.0, maxWeight: 80.0, xp: 150, value: 380, islands: ['palawan', 'siargao'] },
        { name: 'Oceanic Whitetip Shark', minWeight: 50.0, maxWeight: 120.0, xp: 160, value: 400, islands: ['palawan', 'tawi-tawi'] },
        { name: 'Thresher Shark', minWeight: 80.0, maxWeight: 200.0, xp: 180, value: 450, islands: ['malapascua', 'cebu'], weather: ['sunny', 'cloudy'] },
        { name: 'Whale Shark', minWeight: 500.0, maxWeight: 1500.0, xp: 250, value: 600, islands: ['bohol', 'cebu', 'siargao'], weather: ['sunny'] },
        { name: 'Reef Manta Ray', minWeight: 100.0, maxWeight: 300.0, xp: 200, value: 500, islands: ['palawan', 'bohol', 'malapascua'] },
        { name: 'Giant Freshwater Stingray', minWeight: 150.0, maxWeight: 400.0, xp: 220, value: 550, islands: ['mindanao', 'luzon'], weather: ['rain', 'storm'] },
    ],
    legendary: [
        { name: 'Coelacanth', minWeight: 80.0, maxWeight: 180.0, xp: 500, value: 2000, islands: ['palawan', 'tawi-tawi'], weather: ['night', 'storm'], description: 'Ancient living fossil' },
        { name: 'Oarfish', minWeight: 100.0, maxWeight: 250.0, xp: 520, value: 2100, islands: ['tawi-tawi', 'siargao'], weather: ['storm'], description: 'Deep sea serpent of legend' },
        { name: 'Goblin Shark', minWeight: 120.0, maxWeight: 300.0, xp: 550, value: 2200, islands: ['palawan', 'tawi-tawi'], weather: ['night'], description: 'Living relic from the deep' },
        { name: 'Megamouth Shark', minWeight: 200.0, maxWeight: 500.0, xp: 600, value: 2500, islands: ['siargao', 'palawan'], weather: ['night'], description: 'Rare filter-feeding giant' },
        { name: 'Ocean Sunfish', minWeight: 300.0, maxWeight: 1000.0, xp: 650, value: 2800, islands: ['palawan', 'bohol', 'siargao'], weather: ['sunny'], description: 'Massive floating enigma' },
    ],
    mythical: [
        { name: 'Bakunawa', minWeight: 1000.0, maxWeight: 3000.0, xp: 1500, value: 10000, islands: ['luzon', 'mindanao'], weather: ['night'], description: 'Legendary serpent that devours the moon' },
        { name: 'Siyokoy Guardian', minWeight: 200.0, maxWeight: 500.0, xp: 1200, value: 8000, islands: ['visayas', 'palawan'], weather: ['storm'], description: 'Mythical sea creature from Filipino folklore' },
        { name: 'Magindara', minWeight: 80.0, maxWeight: 200.0, xp: 1300, value: 8500, islands: ['palawan', 'siargao'], weather: ['night', 'sunny'], description: 'Beautiful siren of Philippine seas' },
        { name: 'Berberoka', minWeight: 300.0, maxWeight: 800.0, xp: 1400, value: 9000, islands: ['mindanao', 'tawi-tawi'], weather: ['rain', 'storm'], description: 'Water spirit that controls floods' },
        { name: 'Kataw King', minWeight: 150.0, maxWeight: 400.0, xp: 1350, value: 8800, islands: ['all'], weather: ['night'], description: 'King of the merfolk' },
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
    const hour = new Date().getHours();
    
    // Night time (8 PM to 6 AM)
    if (hour >= 20 || hour < 6) {
        return 'night';
    }
    
    // Daytime weather (random)
    const roll = Math.random() * 100;
    if (roll < 60) return 'sunny';
    if (roll < 80) return 'cloudy';
    if (roll < 95) return 'rain';
    return 'storm';
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
