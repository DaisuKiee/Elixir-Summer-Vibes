// Dynamic Exploration Events - Random encounters during island exploration
// Each event has multiple choices with different outcomes

export const explorationEvents = [
    // Treasure & Discovery Events
    {
        id: 'abandoned_ship',
        type: 'treasure',
        title: '🚢 Abandoned Pirate Ship',
        description: 'You discovered an old pirate ship run aground on the beach.',
        emoji: '🏴‍☠️',
        choices: [
            {
                id: 'board',
                label: '⚔️ Board Ship',
                description: 'Carefully climb aboard the abandoned vessel',
                outcomes: [
                    { chance: 0.6, reward: { seashells: 150, xp: 50 }, message: 'You found a hidden stash of treasure!' },
                    { chance: 0.3, reward: { collectible: 'rare' }, message: 'You discovered a rare pirate artifact!' },
                    { chance: 0.1, reward: { seashells: -50 }, message: 'The deck gave way! You fell through and lost some items.' }
                ]
            },
            {
                id: 'search',
                label: '🔍 Search Deck',
                description: 'Search the deck from the shore',
                outcomes: [
                    { chance: 0.7, reward: { seashells: 80, xp: 30 }, message: 'You found some old coins scattered on the deck!' },
                    { chance: 0.3, reward: { xp: 40 }, message: 'You found interesting ship logs and gained knowledge!' }
                ]
            },
            {
                id: 'leave',
                label: '🚪 Leave',
                description: 'Play it safe and continue exploring',
                outcomes: [
                    { chance: 1.0, reward: { xp: 10 }, message: 'You decided to play it safe and moved on.' }
                ]
            }
        ]
    },
    
    {
        id: 'coconut_grove',
        type: 'resource',
        title: '🌴 Coconut Grove',
        description: 'You found a grove of tall coconut trees swaying in the breeze.',
        emoji: '🥥',
        choices: [
            {
                id: 'climb',
                label: '🥥 Climb Tree',
                description: 'Climb up and harvest coconuts',
                outcomes: [
                    { chance: 0.5, reward: { seashells: 100, xp: 40 }, message: 'You harvested fresh coconuts and sold them!' },
                    { chance: 0.3, reward: { collectible: 'common' }, message: 'You found a bird\'s nest with a collectible!' },
                    { chance: 0.2, reward: { xp: 20 }, message: 'You climbed up but the coconuts weren\'t ripe yet.' }
                ]
            },
            {
                id: 'shake',
                label: '🌴 Shake Tree',
                description: 'Shake the tree to drop coconuts',
                outcomes: [
                    { chance: 0.6, reward: { seashells: 60, xp: 25 }, message: 'Several coconuts fell down!' },
                    { chance: 0.4, reward: { xp: 15 }, message: 'The tree was too sturdy to shake effectively.' }
                ]
            },
            {
                id: 'ignore',
                label: '🚶 Continue Walking',
                description: 'Leave the grove and keep exploring',
                outcomes: [
                    { chance: 1.0, reward: { xp: 10 }, message: 'You continued your journey.' }
                ]
            }
        ]
    },
    
    {
        id: 'treasure_chest',
        type: 'treasure',
        title: '💰 Mysterious Treasure Chest',
        description: 'You stumbled upon a locked treasure chest half-buried in the sand.',
        emoji: '🎁',
        choices: [
            {
                id: 'open',
                label: '🔓 Open Chest',
                description: 'Try to pry it open',
                outcomes: [
                    { chance: 0.4, reward: { seashells: 200, sunTokens: 10, xp: 60 }, message: 'Jackpot! The chest was full of valuable treasures!' },
                    { chance: 0.3, reward: { collectible: 'epic' }, message: 'You found an epic collectible inside!' },
                    { chance: 0.2, reward: { seashells: 80, xp: 30 }, message: 'The chest had some coins and trinkets.' },
                    { chance: 0.1, reward: { xp: 15 }, message: 'The chest was empty... someone got here first!' }
                ]
            },
            {
                id: 'inspect',
                label: '🔍 Inspect Chest',
                description: 'Carefully examine before opening',
                outcomes: [
                    { chance: 0.5, reward: { seashells: 120, xp: 45 }, message: 'You found a hidden compartment with extra loot!' },
                    { chance: 0.5, reward: { xp: 35 }, message: 'You found clues about the chest\'s origin!' }
                ]
            },
            {
                id: 'leave',
                label: '🚪 Leave It',
                description: 'Too risky, better leave it alone',
                outcomes: [
                    { chance: 1.0, reward: { xp: 10 }, message: 'You decided not to risk it.' }
                ]
            }
        ]
    },
    
    // Wildlife Encounters
    {
        id: 'dolphins',
        type: 'wildlife',
        title: '🐬 Dolphin Pod',
        description: 'A pod of playful dolphins swims alongside your boat.',
        emoji: '🐬',
        choices: [
            {
                id: 'feed',
                label: '❤️ Feed Dolphins',
                description: 'Share some fish with them',
                outcomes: [
                    { chance: 0.7, reward: { xp: 50, seashells: 80 }, message: 'The dolphins performed tricks and led you to a fishing spot!' },
                    { chance: 0.3, reward: { collectible: 'uncommon' }, message: 'One dolphin brought you a shiny pearl!' }
                ]
            },
            {
                id: 'photo',
                label: '📸 Take Photo',
                description: 'Capture this beautiful moment',
                outcomes: [
                    { chance: 0.8, reward: { xp: 40, seashells: 50 }, message: 'You got amazing photos and sold them to tourists!' },
                    { chance: 0.2, reward: { xp: 30 }, message: 'You captured some good memories!' }
                ]
            },
            {
                id: 'wave',
                label: '👋 Wave',
                description: 'Just enjoy watching them',
                outcomes: [
                    { chance: 1.0, reward: { xp: 25 }, message: 'You enjoyed the beautiful moment.' }
                ]
            }
        ]
    },
    
    {
        id: 'sea_turtle',
        type: 'wildlife',
        title: '🐢 Sea Turtle Nest',
        description: 'You discovered a sea turtle nest with eggs about to hatch!',
        emoji: '🥚',
        choices: [
            {
                id: 'protect',
                label: '🛡️ Protect Nest',
                description: 'Guard the nest from predators',
                outcomes: [
                    { chance: 0.8, reward: { xp: 80, seashells: 100, sunTokens: 5 }, message: 'The baby turtles hatched safely! The mother turtle rewarded you!' },
                    { chance: 0.2, reward: { xp: 50 }, message: 'You protected the nest, but they haven\'t hatched yet.' }
                ]
            },
            {
                id: 'watch',
                label: '👀 Watch Quietly',
                description: 'Observe from a distance',
                outcomes: [
                    { chance: 1.0, reward: { xp: 40 }, message: 'You witnessed a beautiful natural moment!' }
                ]
            },
            {
                id: 'report',
                label: '📢 Report to Authorities',
                description: 'Get professional help',
                outcomes: [
                    { chance: 1.0, reward: { xp: 60, seashells: 70 }, message: 'Wildlife rangers thanked you with a reward!' }
                ]
            }
        ]
    },
    
    // Danger Events
    {
        id: 'pirates',
        type: 'danger',
        title: '🏴‍☠️ Pirates Spotted!',
        description: 'A small pirate crew has noticed you nearby!',
        emoji: '⚔️',
        choices: [
            {
                id: 'fight',
                label: '⚔️ Fight',
                description: 'Stand your ground and fight',
                outcomes: [
                    { chance: 0.4, reward: { seashells: 250, xp: 100, sunTokens: 15 }, message: 'You defeated the pirates and claimed their loot!' },
                    { chance: 0.4, reward: { seashells: 100, xp: 50 }, message: 'You fought them off but they escaped with most of their treasure.' },
                    { chance: 0.2, reward: { seashells: -100, xp: 20 }, message: 'You were overwhelmed and had to give up some items!' }
                ]
            },
            {
                id: 'hide',
                label: '🙈 Hide',
                description: 'Stay hidden until they pass',
                outcomes: [
                    { chance: 0.7, reward: { xp: 30 }, message: 'You hid successfully and they passed by.' },
                    { chance: 0.3, reward: { seashells: -50 }, message: 'They found you and took some items!' }
                ]
            },
            {
                id: 'run',
                label: '🏃 Escape',
                description: 'Make a run for it',
                outcomes: [
                    { chance: 0.8, reward: { xp: 25 }, message: 'You escaped safely!' },
                    { chance: 0.2, reward: { xp: 15 }, message: 'You got away but lost your path.' }
                ]
            }
        ]
    },
    
    {
        id: 'storm',
        type: 'danger',
        title: '🌩️ Sudden Storm',
        description: 'Dark clouds gather quickly - a tropical storm is coming!',
        emoji: '⛈️',
        choices: [
            {
                id: 'shelter',
                label: '🏚️ Find Shelter',
                description: 'Look for a cave or shelter',
                outcomes: [
                    { chance: 0.6, reward: { xp: 40 }, message: 'You found a cave and waited out the storm safely!' },
                    { chance: 0.3, reward: { collectible: 'uncommon', xp: 50 }, message: 'You found an ancient cave with a hidden collectible!' },
                    { chance: 0.1, reward: { xp: 20 }, message: 'The shelter was cramped but you stayed dry.' }
                ]
            },
            {
                id: 'continue',
                label: '⚡ Push Through',
                description: 'Brave the storm and keep going',
                outcomes: [
                    { chance: 0.3, reward: { seashells: 120, xp: 80 }, message: 'You pushed through and discovered a washed-up treasure!' },
                    { chance: 0.5, reward: { xp: 40 }, message: 'You made it through the storm, tougher for it!' },
                    { chance: 0.2, reward: { seashells: -30, xp: 20 }, message: 'The storm was harsh and you lost some items.' }
                ]
            },
            {
                id: 'return',
                label: '🔙 Head Back',
                description: 'Return to safety',
                outcomes: [
                    { chance: 1.0, reward: { xp: 15 }, message: 'You returned safely but didn\'t explore much.' }
                ]
            }
        ]
    },
    
    // Mystery & Cultural Events
    {
        id: 'local_fisherman',
        type: 'social',
        title: '🎣 Local Fisherman',
        description: 'An old fisherman offers to share his fishing secrets.',
        emoji: '👴',
        choices: [
            {
                id: 'learn',
                label: '📖 Learn Techniques',
                description: 'Listen to his wisdom',
                outcomes: [
                    { chance: 0.7, reward: { xp: 70 }, message: 'You learned valuable fishing techniques! (Next fishing +20% XP)' },
                    { chance: 0.3, reward: { seashells: 100, xp: 50 }, message: 'He gave you his old fishing gear to sell!' }
                ]
            },
            {
                id: 'help',
                label: '🤝 Help Him Fish',
                description: 'Offer to help with his work',
                outcomes: [
                    { chance: 0.8, reward: { seashells: 150, xp: 60 }, message: 'You caught fish together and he shared the profit!' },
                    { chance: 0.2, reward: { collectible: 'rare' }, message: 'You caught something rare and he let you keep it!' }
                ]
            },
            {
                id: 'decline',
                label: '👋 Politely Decline',
                description: 'Thank him and continue exploring',
                outcomes: [
                    { chance: 1.0, reward: { xp: 10 }, message: 'You thanked him and went on your way.' }
                ]
            }
        ]
    },
    
    {
        id: 'ancient_shrine',
        type: 'mystery',
        title: '⛩️ Ancient Shrine',
        description: 'You discovered an old shrine covered in moss and vines.',
        emoji: '🕯️',
        choices: [
            {
                id: 'pray',
                label: '🙏 Pray',
                description: 'Show respect and offer a prayer',
                outcomes: [
                    { chance: 0.5, reward: { sunTokens: 10, xp: 50 }, message: 'The shrine glowed softly. You feel blessed!' },
                    { chance: 0.3, reward: { collectible: 'rare', xp: 60 }, message: 'A mysterious gift appeared before the shrine!' },
                    { chance: 0.2, reward: { xp: 40 }, message: 'You felt a sense of peace and clarity.' }
                ]
            },
            {
                id: 'investigate',
                label: '🔍 Investigate',
                description: 'Study the shrine\'s inscriptions',
                outcomes: [
                    { chance: 0.6, reward: { xp: 70 }, message: 'You learned about the island\'s ancient history!' },
                    { chance: 0.4, reward: { collectible: 'uncommon', xp: 50 }, message: 'You found an offering left behind!' }
                ]
            },
            {
                id: 'leave',
                label: '🚶 Leave Respectfully',
                description: 'Don\'t disturb the sacred site',
                outcomes: [
                    { chance: 1.0, reward: { xp: 20 }, message: 'You left the shrine undisturbed.' }
                ]
            }
        ]
    },
    
    {
        id: 'message_bottle',
        type: 'mystery',
        title: '💌 Message in a Bottle',
        description: 'You found a glass bottle with a rolled-up message inside!',
        emoji: '🍾',
        choices: [
            {
                id: 'read',
                label: '📜 Read Message',
                description: 'Open the bottle and read it',
                outcomes: [
                    { chance: 0.4, reward: { seashells: 180, xp: 80 }, message: 'It\'s a treasure map! You found the buried treasure!' },
                    { chance: 0.3, reward: { collectible: 'rare', xp: 60 }, message: 'The message led you to a hidden collectible!' },
                    { chance: 0.3, reward: { xp: 50 }, message: 'It was a heartfelt letter from years ago. Beautiful!' }
                ]
            },
            {
                id: 'keep',
                label: '💎 Keep Sealed',
                description: 'Keep it as a collectible',
                outcomes: [
                    { chance: 0.7, reward: { collectible: 'uncommon', xp: 40 }, message: 'You kept the sealed bottle as a rare find!' },
                    { chance: 0.3, reward: { seashells: 100, xp: 35 }, message: 'Collectors paid good money for the sealed bottle!' }
                ]
            },
            {
                id: 'toss',
                label: '🌊 Toss Back',
                description: 'Let it continue its journey',
                outcomes: [
                    { chance: 1.0, reward: { xp: 25 }, message: 'You sent the message back to sea. Someone else will find it!' }
                ]
            }
        ]
    }
];

// Helper function to get random event
export function getRandomEvent() {
    return explorationEvents[Math.floor(Math.random() * explorationEvents.length)];
}

// Helper function to get event by type
export function getEventsByType(type) {
    return explorationEvents.filter(event => event.type === type);
}

// Helper function to process event choice
export function processEventOutcome(choice) {
    if (!choice.outcomes || choice.outcomes.length === 0) {
        return null;
    }
    
    // Random roll to determine outcome
    const roll = Math.random();
    let cumulative = 0;
    
    for (const outcome of choice.outcomes) {
        cumulative += outcome.chance;
        if (roll <= cumulative) {
            return outcome;
        }
    }
    
    // Fallback to last outcome
    return choice.outcomes[choice.outcomes.length - 1];
}
