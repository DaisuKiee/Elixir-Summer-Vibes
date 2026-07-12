// Equipment upgrade system with 10 levels each
export const equipmentData = {
    rod: {
        1: {
            id: 'bamboo_rod',
            name: 'Bamboo Rod',
            description: 'A simple bamboo fishing rod',
            catchRateBonus: 1.0,
            valueBonus: 1.0,
            cost: 0
        },
        2: {
            id: 'wooden_rod',
            name: 'Wooden Rod',
            description: 'A basic wooden fishing rod',
            catchRateBonus: 1.10,
            valueBonus: 1.05,
            cost: 500
        },
        3: {
            id: 'reinforced_rod',
            name: 'Reinforced Rod',
            description: 'A reinforced wooden rod',
            catchRateBonus: 1.20,
            valueBonus: 1.10,
            cost: 1500
        },
        4: {
            id: 'fiberglass_rod',
            name: 'Fiberglass Rod',
            description: 'Modern fiberglass construction',
            catchRateBonus: 1.35,
            valueBonus: 1.15,
            cost: 3500
        },
        5: {
            id: 'carbon_rod',
            name: 'Carbon Fiber Rod',
            description: 'Lightweight and strong',
            catchRateBonus: 1.50,
            valueBonus: 1.25,
            cost: 7000
        },
        6: {
            id: 'titanium_rod',
            name: 'Titanium Rod',
            description: 'Professional grade equipment',
            catchRateBonus: 1.70,
            valueBonus: 1.35,
            cost: 12000
        },
        7: {
            id: 'enchanted_rod',
            name: 'Enchanted Rod',
            description: 'Blessed by sea spirits',
            catchRateBonus: 1.90,
            valueBonus: 1.50,
            cost: 20000
        },
        8: {
            id: 'mythril_rod',
            name: 'Mythril Rod',
            description: 'Crafted from legendary ore',
            catchRateBonus: 2.15,
            valueBonus: 1.70,
            cost: 35000
        },
        9: {
            id: 'diamond_rod',
            name: 'Diamond Rod',
            description: 'Gleaming with precious gems',
            catchRateBonus: 2.40,
            valueBonus: 2.0,
            cost: 60000
        },
        10: {
            id: 'divine_rod',
            name: 'Divine Rod of the Ocean',
            description: 'The ultimate fishing rod',
            catchRateBonus: 3.0,
            valueBonus: 2.5,
            cost: 100000
        }
    },
    
    net: {
        1: {
            id: 'basic_net',
            name: 'Basic Net',
            description: 'A simple fishing net',
            rareFishBonus: 1.0,
            xpBonus: 1.0,
            cost: 0
        },
        2: {
            id: 'woven_net',
            name: 'Woven Net',
            description: 'Tightly woven fibers',
            rareFishBonus: 1.08,
            xpBonus: 1.05,
            cost: 600
        },
        3: {
            id: 'silk_net',
            name: 'Silk Net',
            description: 'Made from fine silk threads',
            rareFishBonus: 1.15,
            xpBonus: 1.10,
            cost: 1800
        },
        4: {
            id: 'enchanted_net',
            name: 'Enchanted Net',
            description: 'Magical threads attract rare fish',
            rareFishBonus: 1.25,
            xpBonus: 1.15,
            cost: 4000
        },
        5: {
            id: 'crystal_net',
            name: 'Crystal Net',
            description: 'Shimmers with magical energy',
            rareFishBonus: 1.35,
            xpBonus: 1.25,
            cost: 8000
        },
        6: {
            id: 'golden_net',
            name: 'Golden Net',
            description: 'Attracts legendary catches',
            rareFishBonus: 1.50,
            xpBonus: 1.35,
            cost: 14000
        },
        7: {
            id: 'mermaid_net',
            name: 'Mermaid\'s Net',
            description: 'Blessed by merfolk',
            rareFishBonus: 1.65,
            xpBonus: 1.50,
            cost: 25000
        },
        8: {
            id: 'dragon_net',
            name: 'Dragon Scale Net',
            description: 'Woven from dragon scales',
            rareFishBonus: 1.85,
            xpBonus: 1.70,
            cost: 40000
        },
        9: {
            id: 'celestial_net',
            name: 'Celestial Net',
            description: 'Touched by the stars',
            rareFishBonus: 2.10,
            xpBonus: 2.0,
            cost: 70000
        },
        10: {
            id: 'poseidon_net',
            name: 'Poseidon\'s Net',
            description: 'The god of sea\'s own net',
            rareFishBonus: 2.50,
            xpBonus: 2.5,
            cost: 120000
        }
    },
    
    boat: {
        1: {
            id: 'bamboo_raft',
            name: 'Bamboo Raft',
            description: 'A simple raft to get started',
            energyCostReduction: 1.0,
            inventoryBonus: 0,
            cost: 0
        },
        2: {
            id: 'wooden_boat',
            name: 'Wooden Boat',
            description: 'Small but reliable',
            energyCostReduction: 0.95,
            inventoryBonus: 5,
            cost: 800
        },
        3: {
            id: 'fishing_boat',
            name: 'Fishing Boat',
            description: 'Built for fishing',
            energyCostReduction: 0.90,
            inventoryBonus: 10,
            cost: 2000
        },
        4: {
            id: 'sailboat',
            name: 'Sailboat',
            description: 'Harness the wind',
            energyCostReduction: 0.85,
            inventoryBonus: 15,
            cost: 5000
        },
        5: {
            id: 'fishing_trawler',
            name: 'Fishing Trawler',
            description: 'Commercial grade vessel',
            energyCostReduction: 0.80,
            inventoryBonus: 25,
            cost: 10000
        },
        6: {
            id: 'motor_yacht',
            name: 'Motor Yacht',
            description: 'Fast and efficient',
            energyCostReduction: 0.75,
            inventoryBonus: 35,
            cost: 18000
        },
        7: {
            id: 'luxury_yacht',
            name: 'Luxury Yacht',
            description: 'Fish in style',
            energyCostReduction: 0.70,
            inventoryBonus: 50,
            cost: 30000
        },
        8: {
            id: 'enchanted_ship',
            name: 'Enchanted Ship',
            description: 'Sails on its own',
            energyCostReduction: 0.65,
            inventoryBonus: 70,
            cost: 50000
        },
        9: {
            id: 'flying_ship',
            name: 'Flying Ship',
            description: 'Defies the laws of physics',
            energyCostReduction: 0.55,
            inventoryBonus: 100,
            cost: 80000
        },
        10: {
            id: 'legendary_galleon',
            name: 'Legendary Galleon',
            description: 'The finest vessel ever built',
            energyCostReduction: 0.40,
            inventoryBonus: 150,
            cost: 150000
        }
    },
    
    accessory: {
        1: {
            id: 'none',
            name: 'No Accessory',
            description: 'No special bonus',
            effect: 'No special effects',
            cost: 0
        },
        2: {
            id: 'lucky_charm',
            name: 'Lucky Charm',
            description: 'Brings good fortune',
            effect: '+5% all bonuses',
            cost: 1000
        },
        3: {
            id: 'fisherman_hat',
            name: 'Fisherman\'s Hat',
            description: 'Traditional fishing hat',
            effect: '+10% XP gain',
            cost: 2500
        },
        4: {
            id: 'pearl_necklace',
            name: 'Pearl Necklace',
            description: 'Beautiful ocean pearls',
            effect: '+15% fish value',
            cost: 6000
        },
        5: {
            id: 'sea_compass',
            name: 'Sea Compass',
            description: 'Never get lost at sea',
            effect: '+20% rare fish chance',
            cost: 12000
        },
        6: {
            id: 'coral_ring',
            name: 'Coral Ring',
            description: 'Living coral enhances fishing',
            effect: '+25% catch rate',
            cost: 22000
        },
        7: {
            id: 'siren_locket',
            name: 'Siren\'s Locket',
            description: 'Attracts mythical fish',
            effect: '+30% legendary chance',
            cost: 40000
        },
        8: {
            id: 'trident_amulet',
            name: 'Trident Amulet',
            description: 'Symbol of sea power',
            effect: '+40% all bonuses',
            cost: 65000
        },
        9: {
            id: 'ocean_crown',
            name: 'Ocean Crown',
            description: 'Rule the seas',
            effect: '+50% all bonuses',
            cost: 100000
        },
        10: {
            id: 'poseidon_blessing',
            name: 'Poseidon\'s Blessing',
            description: 'Blessed by the god of the sea',
            effect: '+100% all bonuses\n-50% energy costs\nDouble XP',
            cost: 200000
        }
    }
};

// Helper function to get equipment bonus multipliers
export function getEquipmentBonuses(profile) {
    const equipment = profile.equipment || {};
    
    const rod = equipmentData.rod[equipment.rod?.level || 1];
    const net = equipmentData.net[equipment.net?.level || 1];
    const boat = equipmentData.boat[equipment.boat?.level || 1];
    const accessory = equipmentData.accessory[equipment.accessory?.level || 1];
    
    return {
        catchRate: rod.catchRateBonus,
        valueBonus: rod.valueBonus,
        rareFishBonus: net.rareFishBonus,
        xpBonus: net.xpBonus,
        energyCostReduction: boat.energyCostReduction,
        inventoryBonus: boat.inventoryBonus,
        accessoryLevel: equipment.accessory?.level || 1
    };
}

// Calculate final energy cost with equipment bonus
export function calculateEnergyCost(baseCost, profile) {
    const bonuses = getEquipmentBonuses(profile);
    let finalCost = Math.floor(baseCost * bonuses.energyCostReduction);
    
    // Poseidon's Blessing additional reduction
    if (bonuses.accessoryLevel === 10) {
        finalCost = Math.floor(finalCost * 0.5);
    }
    
    return Math.max(1, finalCost); // Minimum 1 energy
}

// Calculate XP with equipment bonus
export function calculateXPWithBonus(baseXP, profile) {
    const bonuses = getEquipmentBonuses(profile);
    let finalXP = Math.floor(baseXP * bonuses.xpBonus);
    
    // Poseidon's Blessing double XP
    if (bonuses.accessoryLevel === 10) {
        finalXP *= 2;
    }
    
    return finalXP;
}

export default equipmentData;
