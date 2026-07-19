// Player Trading System
// Secure peer-to-peer trading for fish, collectibles, and items

import { v4 as uuidv4 } from 'uuid';
import { getLevelFromXP } from './levelSystem.js';

export const tradeConfig = {
    offerDuration: 5 * 60 * 1000, // 5 minutes
    maxOffersPerPlayer: 3, // Active offers limit
    minLevel: 10, // Minimum level to trade
    tradeCooldown: 60 * 1000, // 1 minute between trades
    taxRate: 0.05, // 5% tax on seashell trades
    
    // Trade limits
    limits: {
        fish: 10,
        collectibles: 5,
        seashells: 100000,
        items: 5
    }
};

export const tradeStatus = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    COMPLETED: 'completed'
};

/**
 * Create a new trade offer
 * @param {String} initiatorId - User ID of trade initiator
 * @param {String} recipientId - User ID of trade recipient
 * @param {Object} initiatorOffer - Items offered by initiator
 * @param {Object} recipientOffer - Items requested from recipient
 * @returns {Object} Trade offer object
 */
export function createTradeOffer(initiatorId, recipientId, initiatorOffer, recipientOffer) {
    const tradeId = uuidv4();
    const now = new Date();
    
    return {
        tradeId: tradeId,
        initiator: initiatorId,
        recipient: recipientId,
        initiatorOffer: {
            fish: initiatorOffer.fish || [],
            collectibles: initiatorOffer.collectibles || [],
            seashells: initiatorOffer.seashells || 0,
            items: initiatorOffer.items || []
        },
        recipientOffer: {
            fish: recipientOffer.fish || [],
            collectibles: recipientOffer.collectibles || [],
            seashells: recipientOffer.seashells || 0,
            items: recipientOffer.items || []
        },
        status: tradeStatus.PENDING,
        createdAt: now,
        expiresAt: new Date(now.getTime() + tradeConfig.offerDuration),
        acceptedAt: null,
        completedAt: null,
        cancelledBy: null
    };
}

/**
 * Validate if player can initiate trade
 * @param {Object} profile - Player profile
 * @param {Number} activeTradeCount - Current active trades
 * @returns {Object} Validation result
 */
export function canInitiateTrade(profile, activeTradeCount = 0) {
    const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
    const currentLevel = getLevelFromXP(totalXP);
    
    if (currentLevel < tradeConfig.minLevel) {
        return {
            canTrade: false,
            reason: `Must reach tier ${tradeConfig.minLevel} to trade`
        };
    }
    
    if (activeTradeCount >= tradeConfig.maxOffersPerPlayer) {
        return {
            canTrade: false,
            reason: `Maximum ${tradeConfig.maxOffersPerPlayer} active trades`
        };
    }
    
    // Check cooldown
    if (profile.lastTradeAt) {
        const timeSinceLastTrade = Date.now() - new Date(profile.lastTradeAt).getTime();
        if (timeSinceLastTrade < tradeConfig.tradeCooldown) {
            const remainingSeconds = Math.ceil((tradeConfig.tradeCooldown - timeSinceLastTrade) / 1000);
            return {
                canTrade: false,
                reason: `Trade cooldown: ${remainingSeconds}s remaining`
            };
        }
    }
    
    return { canTrade: true };
}

/**
 * Validate trade offer items
 * @param {Object} profile - Player profile
 * @param {Object} offer - Trade offer items
 * @returns {Object} Validation result
 */
export function validateTradeOffer(profile, offer) {
    const errors = [];
    
    // Validate fish
    if (offer.fish && offer.fish.length > 0) {
        if (offer.fish.length > tradeConfig.limits.fish) {
            errors.push(`Cannot trade more than ${tradeConfig.limits.fish} fish`);
        }
        
        // Check if player owns all fish
        offer.fish.forEach(fishIndex => {
            if (!profile.fishInventory[fishIndex]) {
                errors.push(`Fish at index ${fishIndex} not found in inventory`);
            }
        });
    }
    
    // Validate collectibles
    if (offer.collectibles && offer.collectibles.length > 0) {
        if (offer.collectibles.length > tradeConfig.limits.collectibles) {
            errors.push(`Cannot trade more than ${tradeConfig.limits.collectibles} collectibles`);
        }
        
        // Check if player owns all collectibles
        offer.collectibles.forEach(collectibleId => {
            const hasCollectible = profile.collectibles.some(c => c.id === collectibleId);
            if (!hasCollectible) {
                errors.push(`Collectible ${collectibleId} not found in collection`);
            }
        });
    }
    
    // Validate seashells
    if (offer.seashells) {
        if (offer.seashells > tradeConfig.limits.seashells) {
            errors.push(`Cannot trade more than ${tradeConfig.limits.seashells.toLocaleString()} seashells`);
        }
        
        if (offer.seashells > profile.seashells) {
            errors.push(`Insufficient seashells (have: ${profile.seashells}, need: ${offer.seashells})`);
        }
    }
    
    // Validate items
    if (offer.items && offer.items.length > 0) {
        if (offer.items.length > tradeConfig.limits.items) {
            errors.push(`Cannot trade more than ${tradeConfig.limits.items} items`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Check if trade has expired
 * @param {Object} trade - Trade object
 * @returns {Boolean} True if expired
 */
export function isTradeExpired(trade) {
    if (trade.status !== tradeStatus.PENDING) {
        return false;
    }
    
    return new Date() > new Date(trade.expiresAt);
}

/**
 * Accept a trade offer
 * @param {Object} trade - Trade object
 * @param {String} acceptingUserId - User accepting the trade
 * @returns {Object} Accept result
 */
export function acceptTrade(trade, acceptingUserId) {
    if (trade.status !== tradeStatus.PENDING) {
        return {
            success: false,
            message: `Trade is ${trade.status}, cannot accept`
        };
    }
    
    if (trade.recipient !== acceptingUserId) {
        return {
            success: false,
            message: 'Only the recipient can accept this trade'
        };
    }
    
    if (isTradeExpired(trade)) {
        return {
            success: false,
            message: 'Trade offer has expired'
        };
    }
    
    trade.status = tradeStatus.ACCEPTED;
    trade.acceptedAt = new Date();
    
    return {
        success: true,
        message: 'Trade accepted! Processing...'
    };
}

/**
 * Cancel a trade offer
 * @param {Object} trade - Trade object
 * @param {String} cancellingUserId - User cancelling the trade
 * @returns {Object} Cancel result
 */
export function cancelTrade(trade, cancellingUserId) {
    if (trade.status !== tradeStatus.PENDING) {
        return {
            success: false,
            message: `Trade is ${trade.status}, cannot cancel`
        };
    }
    
    if (trade.initiator !== cancellingUserId && trade.recipient !== cancellingUserId) {
        return {
            success: false,
            message: 'You are not part of this trade'
        };
    }
    
    trade.status = tradeStatus.CANCELLED;
    trade.cancelledBy = cancellingUserId;
    trade.completedAt = new Date();
    
    return {
        success: true,
        message: 'Trade cancelled'
    };
}

/**
 * Execute trade - transfer items between players
 * @param {Object} initiatorProfile - Initiator's profile
 * @param {Object} recipientProfile - Recipient's profile
 * @param {Object} trade - Trade object
 * @returns {Object} Execution result
 */
export function executeTrade(initiatorProfile, recipientProfile, trade) {
    const errors = [];
    
    // Validate both players still have items
    const initiatorValidation = validateTradeOffer(initiatorProfile, trade.initiatorOffer);
    if (!initiatorValidation.valid) {
        return {
            success: false,
            errors: ['Initiator validation failed:', ...initiatorValidation.errors]
        };
    }
    
    const recipientValidation = validateTradeOffer(recipientProfile, trade.recipientOffer);
    if (!recipientValidation.valid) {
        return {
            success: false,
            errors: ['Recipient validation failed:', ...recipientValidation.errors]
        };
    }
    
    // Transfer items from initiator to recipient
    transferItems(initiatorProfile, recipientProfile, trade.initiatorOffer);
    
    // Transfer items from recipient to initiator
    transferItems(recipientProfile, initiatorProfile, trade.recipientOffer);
    
    // Update trade history
    const tradeRecord = {
        tradeId: trade.tradeId,
        partner: recipientProfile._id,
        items: {
            given: trade.initiatorOffer,
            received: trade.recipientOffer
        },
        completedAt: new Date()
    };
    
    initiatorProfile.tradeHistory = initiatorProfile.tradeHistory || [];
    initiatorProfile.tradeHistory.unshift(tradeRecord);
    if (initiatorProfile.tradeHistory.length > 50) {
        initiatorProfile.tradeHistory = initiatorProfile.tradeHistory.slice(0, 50);
    }
    
    recipientProfile.tradeHistory = recipientProfile.tradeHistory || [];
    recipientProfile.tradeHistory.unshift({
        ...tradeRecord,
        partner: initiatorProfile._id,
        items: {
            given: trade.recipientOffer,
            received: trade.initiatorOffer
        }
    });
    if (recipientProfile.tradeHistory.length > 50) {
        recipientProfile.tradeHistory = recipientProfile.tradeHistory.slice(0, 50);
    }
    
    // Update trade counts
    initiatorProfile.tradeCount = (initiatorProfile.tradeCount || 0) + 1;
    initiatorProfile.lastTradeAt = new Date();
    
    recipientProfile.tradeCount = (recipientProfile.tradeCount || 0) + 1;
    recipientProfile.lastTradeAt = new Date();
    
    // Mark trade as completed
    trade.status = tradeStatus.COMPLETED;
    trade.completedAt = new Date();
    
    return {
        success: true,
        message: 'Trade completed successfully!'
    };
}

/**
 * Transfer items from one player to another
 * @param {Object} fromProfile - Source profile
 * @param {Object} toProfile - Destination profile
 * @param {Object} items - Items to transfer
 */
function transferItems(fromProfile, toProfile, items) {
    // Transfer fish
    if (items.fish && items.fish.length > 0) {
        items.fish.sort((a, b) => b - a); // Sort descending to remove from end first
        items.fish.forEach(fishIndex => {
            const fish = fromProfile.fishInventory.splice(fishIndex, 1)[0];
            if (fish) {
                toProfile.fishInventory.unshift(fish);
                // Keep inventory at max 50
                if (toProfile.fishInventory.length > 50) {
                    toProfile.fishInventory = toProfile.fishInventory.slice(0, 50);
                }
            }
        });
    }
    
    // Transfer collectibles
    if (items.collectibles && items.collectibles.length > 0) {
        items.collectibles.forEach(collectibleId => {
            const collectibleIndex = fromProfile.collectibles.findIndex(c => c.id === collectibleId);
            if (collectibleIndex !== -1) {
                const collectible = fromProfile.collectibles.splice(collectibleIndex, 1)[0];
                // Only add if recipient doesn't already have it
                const hasCollectible = toProfile.collectibles.some(c => c.id === collectibleId);
                if (!hasCollectible) {
                    toProfile.collectibles.push(collectible);
                }
            }
        });
    }
    
    // Transfer seashells (with tax if applicable)
    if (items.seashells && items.seashells > 0) {
        const tax = Math.floor(items.seashells * tradeConfig.taxRate);
        const amountAfterTax = items.seashells - tax;
        
        fromProfile.seashells -= items.seashells;
        toProfile.seashells += amountAfterTax;
    }
    
    // Transfer items (bait, etc.) - placeholder for future implementation
    if (items.items && items.items.length > 0) {
        // TODO: Implement item transfer when item system is ready
    }
}

/**
 * Get trade summary for display
 * @param {Object} trade - Trade object
 * @param {String} perspective - 'initiator' or 'recipient'
 * @returns {Object} Trade summary
 */
export function getTradeSummary(trade, perspective = 'initiator') {
    const isInitiator = perspective === 'initiator';
    const myOffer = isInitiator ? trade.initiatorOffer : trade.recipientOffer;
    const theirOffer = isInitiator ? trade.recipientOffer : trade.initiatorOffer;
    
    return {
        tradeId: trade.tradeId.split('-')[0], // Short ID
        status: trade.status,
        myOffer: {
            fish: myOffer.fish.length,
            collectibles: myOffer.collectibles.length,
            seashells: myOffer.seashells,
            items: myOffer.items.length
        },
        theirOffer: {
            fish: theirOffer.fish.length,
            collectibles: theirOffer.collectibles.length,
            seashells: theirOffer.seashells,
            items: theirOffer.items.length
        },
        expiresIn: getTimeRemaining(trade.expiresAt),
        createdAt: trade.createdAt
    };
}

/**
 * Get time remaining until expiry
 * @param {Date} expiryDate - Expiry date
 * @returns {String} Time remaining formatted
 */
function getTimeRemaining(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const remaining = expiry - now;
    
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
}

/**
 * Format trade offer for display
 * @param {Object} offer - Trade offer
 * @returns {String} Formatted offer text
 */
export function formatTradeOffer(offer) {
    const parts = [];
    
    if (offer.fish && offer.fish.length > 0) {
        parts.push(`${offer.fish.length} fish`);
    }
    
    if (offer.collectibles && offer.collectibles.length > 0) {
        parts.push(`${offer.collectibles.length} collectible${offer.collectibles.length > 1 ? 's' : ''}`);
    }
    
    if (offer.seashells > 0) {
        parts.push(`${offer.seashells.toLocaleString()} seashells`);
    }
    
    if (offer.items && offer.items.length > 0) {
        parts.push(`${offer.items.length} item${offer.items.length > 1 ? 's' : ''}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Nothing';
}

/**
 * Calculate trade value (approximate)
 * @param {Object} offer - Trade offer
 * @returns {Number} Approximate value in seashells
 */
export function calculateTradeValue(offer) {
    let value = 0;
    
    // Fish value (rough estimate)
    value += (offer.fish?.length || 0) * 100;
    
    // Collectibles value
    value += (offer.collectibles?.length || 0) * 500;
    
    // Seashells
    value += offer.seashells || 0;
    
    // Items
    value += (offer.items?.length || 0) * 200;
    
    return value;
}

/**
 * Detect potentially unfair trades
 * @param {Object} trade - Trade object
 * @returns {Object} Fairness analysis
 */
export function analyzeTradeFairness(trade) {
    const initiatorValue = calculateTradeValue(trade.initiatorOffer);
    const recipientValue = calculateTradeValue(trade.recipientOffer);
    
    const ratio = initiatorValue > 0 ? recipientValue / initiatorValue : 0;
    
    let warning = null;
    if (ratio > 5 || ratio < 0.2) {
        warning = '⚠️ This trade appears very unbalanced!';
    } else if (ratio > 3 || ratio < 0.33) {
        warning = '⚠️ This trade may be unfair.';
    }
    
    return {
        initiatorValue: initiatorValue,
        recipientValue: recipientValue,
        ratio: ratio.toFixed(2),
        warning: warning,
        fairness: ratio >= 0.5 && ratio <= 2 ? 'fair' : ratio >= 0.33 && ratio <= 3 ? 'questionable' : 'unfair'
    };
}

export default {
    tradeConfig,
    tradeStatus,
    createTradeOffer,
    canInitiateTrade,
    validateTradeOffer,
    isTradeExpired,
    acceptTrade,
    cancelTrade,
    executeTrade,
    getTradeSummary,
    formatTradeOffer,
    calculateTradeValue,
    analyzeTradeFairness
};
