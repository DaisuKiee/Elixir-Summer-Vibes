import mongoose from 'mongoose';

const bossSchema = new mongoose.Schema({
    bossInstanceId: { type: String, required: true, unique: true },
    
    // Boss identity
    bossId: { type: String, required: true }, // References bossRoster
    bossName: { type: String, required: true },
    difficulty: {
        type: String,
        enum: ['normal', 'hard', 'legendary', 'mythical'],
        required: true
    },
    
    // Server/Guild context
    guildId: { type: String, required: true }, // Discord server ID
    channelId: String, // Announcement channel
    
    // Boss stats
    maxHP: { type: Number, required: true },
    currentHP: { type: Number, required: true },
    defense: { type: Number, default: 0 },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'defeated', 'expired'],
        default: 'active'
    },
    
    // Participants and damage tracking
    participants: [{
        userId: { type: String, required: true },
        username: String,
        totalDamage: { type: Number, default: 0 },
        attacks: { type: Number, default: 0 },
        lastAttack: Date
    }],
    
    // Statistics
    totalDamageDealt: { type: Number, default: 0 },
    totalAttacks: { type: Number, default: 0 },
    
    // Timestamps
    spawnedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    defeatedAt: Date,
    
    // Rewards claimed tracking
    rewardsClaimed: [String] // Array of user IDs who claimed rewards
}, {
    timestamps: true
});

// Indexes for efficient queries
bossSchema.index({ guildId: 1, status: 1 });
bossSchema.index({ status: 1, expiresAt: 1 });
bossSchema.index({ 'participants.userId': 1 });

// Method to check if boss expired
bossSchema.methods.checkExpiry = function() {
    if (this.status === 'active' && new Date() > this.expiresAt) {
        this.status = 'expired';
        return true;
    }
    return false;
};

// Method to get top participants
bossSchema.methods.getTopParticipants = function(count = 10) {
    return [...this.participants]
        .sort((a, b) => b.totalDamage - a.totalDamage)
        .slice(0, count);
};

// Method to get player rank
bossSchema.methods.getPlayerRank = function(userId) {
    const sorted = [...this.participants].sort((a, b) => b.totalDamage - a.totalDamage);
    const index = sorted.findIndex(p => p.userId === userId);
    return index === -1 ? null : index + 1;
};

// Static method to get active boss for guild
bossSchema.statics.getActiveBoss = function(guildId) {
    return this.findOne({
        guildId: guildId,
        status: 'active'
    }).sort({ spawnedAt: -1 });
};

// Static method to get recent bosses for guild
bossSchema.statics.getRecentBosses = function(guildId, limit = 5) {
    return this.find({
        guildId: guildId
    })
    .sort({ spawnedAt: -1 })
    .limit(limit);
};

export default mongoose.model('Boss', bossSchema);
