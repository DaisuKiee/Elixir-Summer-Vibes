import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
    tradeId: { type: String, required: true, unique: true },
    
    // Trade participants
    initiator: { type: String, required: true }, // User ID
    recipient: { type: String, required: true }, // User ID
    
    // What initiator is offering
    initiatorOffer: {
        fish: [{
            index: Number, // Index in fishInventory
            name: String,
            rarity: String,
            weight: Number
        }],
        collectibles: [{
            id: String,
            name: String,
            rarity: String
        }],
        seashells: { type: Number, default: 0 },
        items: [String] // Item IDs
    },
    
    // What recipient is offering
    recipientOffer: {
        fish: [{
            index: Number,
            name: String,
            rarity: String,
            weight: Number
        }],
        collectibles: [{
            id: String,
            name: String,
            rarity: String
        }],
        seashells: { type: Number, default: 0 },
        items: [String]
    },
    
    // Trade status
    status: {
        type: String,
        enum: ['pending', 'accepted', 'cancelled', 'expired', 'completed'],
        default: 'pending'
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    acceptedAt: Date,
    completedAt: Date,
    
    // Additional info
    cancelledBy: String, // User ID who cancelled
    notes: String // Optional trade notes
}, {
    timestamps: true
});

// Index for efficient queries
tradeSchema.index({ initiator: 1, status: 1 });
tradeSchema.index({ recipient: 1, status: 1 });
tradeSchema.index({ status: 1, expiresAt: 1 });
// Note: tradeId index is already created by unique: true in schema definition

// Auto-expire trades
tradeSchema.methods.checkExpiry = function() {
    if (this.status === 'pending' && new Date() > this.expiresAt) {
        this.status = 'expired';
        return true;
    }
    return false;
};

export default mongoose.model('Trade', tradeSchema);
