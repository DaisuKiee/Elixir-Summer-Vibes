// Daily and Weekly Challenges
export const dailyChallengesPool = [
    { id: 'daily_fish_5', description: 'Catch 5 fish', goal: 5, reward: 100, type: 'fishing' },
    { id: 'daily_fish_10', description: 'Catch 10 fish', goal: 10, reward: 150, type: 'fishing' },
    { id: 'daily_explore_1', description: 'Explore a beach', goal: 1, reward: 100, type: 'exploring' },
    { id: 'daily_explore_3', description: 'Explore 3 different beaches', goal: 3, reward: 200, type: 'exploring' },
    { id: 'daily_collect_3', description: 'Find 3 collectibles', goal: 3, reward: 120, type: 'collecting' },
    { id: 'daily_collect_5', description: 'Find 5 collectibles', goal: 5, reward: 180, type: 'collecting' },
    { id: 'daily_xp_100', description: 'Earn 100 XP', goal: 100, reward: 150, type: 'xp' },
    { id: 'daily_xp_200', description: 'Earn 200 XP', goal: 200, reward: 250, type: 'xp' },
    { id: 'daily_rare_fish', description: 'Catch a rare or better fish', goal: 1, reward: 200, type: 'fishing' },
    { id: 'daily_streak_3', description: 'Maintain a 3-day exploration streak', goal: 3, reward: 180, type: 'streak' },
    { id: 'daily_shells_100', description: 'Earn 100 seashells', goal: 100, reward: 150, type: 'currency' },
    { id: 'daily_help_1', description: 'Help another player', goal: 1, reward: 100, type: 'social' },
];

export const weeklyChallengesPool = [
    { id: 'weekly_fish_50', description: 'Catch 50 fish', goal: 50, reward: 1000, type: 'fishing' },
    { id: 'weekly_fish_100', description: 'Catch 100 fish', goal: 100, reward: 1800, type: 'fishing' },
    { id: 'weekly_legendary', description: 'Catch a legendary fish', goal: 1, reward: 2000, type: 'fishing' },
    { id: 'weekly_explore_10', description: 'Explore beaches 10 times', goal: 10, reward: 1200, type: 'exploring' },
    { id: 'weekly_collect_20', description: 'Find 20 collectibles', goal: 20, reward: 1500, type: 'collecting' },
    { id: 'weekly_dailies_5', description: 'Complete 5 daily challenges', goal: 5, reward: 1000, type: 'challenge' },
    { id: 'weekly_dailies_10', description: 'Complete 10 daily challenges', goal: 10, reward: 1800, type: 'challenge' },
    { id: 'weekly_bp_tier_5', description: 'Reach battle pass tier X', goal: 5, reward: 1500, type: 'battlepass' },
    { id: 'weekly_rare_collect_5', description: 'Find 5 rare or better collectibles', goal: 5, reward: 1600, type: 'collecting' },
    { id: 'weekly_streak_7', description: 'Maintain a 7-day exploration streak', goal: 7, reward: 2000, type: 'streak' },
    { id: 'weekly_shells_500', description: 'Earn 500 seashells', goal: 500, reward: 1200, type: 'currency' },
    { id: 'weekly_xp_1000', description: 'Earn 1000 XP', goal: 1000, reward: 1500, type: 'xp' },
    { id: 'weekly_upgrade_rod', description: 'Upgrade your fishing rod', goal: 1, reward: 1000, type: 'upgrade' },
];

export const serverChallengesPool = [
    {
        id: 'server_fish_10000',
        title: 'Community Fishing Tournament',
        description: 'Catch 10,000 fish as a server',
        goal: 10000,
        reward: '2x XP for all players for 24 hours',
        duration: 7 // days
    },
    {
        id: 'server_collect_5000',
        title: 'Treasure Hunt Event',
        description: 'Find 5,000 collectibles as a server',
        goal: 5000,
        reward: 'Exclusive server badge + 500 Sun Tokens each',
        duration: 7
    },
    {
        id: 'server_explore_5000',
        title: 'Beach Exploration Marathon',
        description: 'Complete 5,000 beach explorations as a server',
        goal: 5000,
        reward: 'Unlock secret beach + 1000 Seashells each',
        duration: 7
    },
    {
        id: 'server_legendary_50',
        title: 'Legendary Hunt',
        description: 'Catch 50 legendary fish as a server',
        goal: 50,
        reward: 'Golden Fishing Rod for all + 1000 Sun Tokens each',
        duration: 14
    },
];

// Function to generate random daily challenges (3 per day)
export function generateDailyChallenges() {
    const shuffled = [...dailyChallengesPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    // Add expiry time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    return selected.map(challenge => ({
        ...challenge,
        progress: 0,
        expiresAt
    }));
}

// Function to generate random weekly challenges (5 per week)
export function generateWeeklyChallenges() {
    const shuffled = [...weeklyChallengesPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    // Add expiry time (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    return selected.map(challenge => ({
        ...challenge,
        progress: 0,
        expiresAt
    }));
}

// Achievement system
export const achievements = {
    fishing: [
        { id: 'first_catch', name: 'First Catch', description: 'Catch your first fish', reward: 50, icon: '🎣' },
        { id: 'fish_10', name: 'Novice Fisher', description: 'Catch 10 fish', reward: 100, icon: '🎣' },
        { id: 'fish_50', name: 'Skilled Fisher', description: 'Catch 50 fish', reward: 250, icon: '🎣' },
        { id: 'fish_100', name: 'Expert Fisher', description: 'Catch 100 fish', reward: 500, icon: '🎣' },
        { id: 'fish_500', name: 'Master Angler', description: 'Catch 500 fish', reward: 1500, icon: '🎣' },
        { id: 'legendary_catch', name: 'Legendary Fisher', description: 'Catch a legendary fish', reward: 1000, icon: '🐟' },
        { id: 'max_rod', name: 'Ultimate Rod', description: 'Upgrade to max fishing rod', reward: 2000, icon: '🎣' },
    ],
    exploring: [
        { id: 'first_explore', name: 'First Steps', description: 'Explore your first beach', reward: 50, icon: '🏝️' },
        { id: 'explore_5', name: 'Beach Explorer', description: 'Visit 5 different beaches', reward: 200, icon: '🏝️' },
        { id: 'explore_all', name: 'Island Hopper', description: 'Visit all beaches', reward: 1000, icon: '🏝️' },
        { id: 'streak_7', name: 'Week Warrior', description: 'Maintain 7-day exploration streak', reward: 500, icon: '🔥' },
        { id: 'streak_30', name: 'Month Master', description: 'Maintain 30-day exploration streak', reward: 3000, icon: '🔥' },
    ],
    collecting: [
        { id: 'first_collectible', name: 'First Find', description: 'Find your first collectible', reward: 50, icon: '🎁' },
        { id: 'collect_10', name: 'Beginner Collector', description: 'Find 10 collectibles', reward: 150, icon: '🎁' },
        { id: 'collect_50', name: 'Avid Collector', description: 'Find 50 collectibles', reward: 500, icon: '🎁' },
        { id: 'collect_100', name: 'Master Collector', description: 'Find 100 collectibles', reward: 1500, icon: '🎁' },
        { id: 'rare_collector', name: 'Rare Hunter', description: 'Find 10 rare items', reward: 400, icon: '🔮' },
        { id: 'legendary_finder', name: 'Legend Seeker', description: 'Find a legendary item', reward: 1000, icon: '👑' },
        { id: 'completionist', name: 'Completionist', description: 'Collect everything', reward: 5000, icon: '💎' },
    ],
    battlepass: [
        { id: 'bp_tier_10', name: 'Rising Star', description: 'Reach battle pass tier 10', reward: 200, icon: '⭐' },
        { id: 'bp_tier_25', name: 'Dedicated Player', description: 'Reach battle pass tier 25', reward: 500, icon: '⭐' },
        { id: 'bp_tier_50', name: 'Halfway Hero', description: 'Reach battle pass tier 50', reward: 1000, icon: '⭐' },
        { id: 'bp_tier_75', name: 'Almost There', description: 'Reach battle pass tier 75', reward: 2000, icon: '⭐' },
        { id: 'bp_tier_100', name: 'Summer Elite', description: 'Reach battle pass tier 100', reward: 5000, icon: '👑' },
    ]
};

// Helper function to check if challenge is completed
export function isChallengeCompleted(challenge) {
    return challenge.progress >= challenge.goal;
}

// Helper function to check if challenge is expired
export function isChallengeExpired(challenge) {
    return new Date() > new Date(challenge.expiresAt);
}
