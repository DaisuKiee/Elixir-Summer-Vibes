import mongoose from 'mongoose';

const summerLeaderboardSchema = new mongoose.Schema({
    season: { type: String, default: '2026' },
    
    // XP Leaderboard
    xpLeaderboard: [{
        userId: String,
        username: String,
        xp: Number,
        level: Number
    }],
    
    // Fishing Leaderboard
    fishingLeaderboard: [{
        userId: String,
        username: String,
        fishCaught: Number,
        biggestFish: {
            name: String,
            weight: Number
        }
    }],
    
    // Collectibles Leaderboard
    collectiblesLeaderboard: [{
        userId: String,
        username: String,
        totalCollectibles: Number,
        legendaryCount: Number
    }],
    
    // Server Challenges
    serverChallenges: [{
        id: String,
        title: String,
        description: String,
        goal: Number,
        currentProgress: Number,
        reward: String,
        expiresAt: Date,
        isCompleted: Boolean
    }],
    
    lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('SummerLeaderboard', summerLeaderboardSchema);
