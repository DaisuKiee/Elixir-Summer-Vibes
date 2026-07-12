import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import TradeSchema from '../../schemas/trade.js';
import { getTierFromXP } from '../../data/battlepass.js';
import {
    createTradeOffer,
    canInitiateTrade,
    validateTradeOffer,
    acceptTrade,
    cancelTrade,
    executeTrade,
    getTradeSummary,
    formatTradeOffer,
    analyzeTradeFairness,
    isTradeExpired,
    tradeStatus
} from '../../data/tradingSystem.js';
import { emojis } from '../../config/emojis.js';

export default class Trade extends Command {
    constructor(client) {
        super(client, {
            name: 'trade',
            description: {
                content: 'Trade fish, collectibles, and items with other players',
                usage: '[offer|accept|cancel|history] [@user] [details]',
                examples: [
                    'trade @user',
                    'trade offer @user',
                    'trade accept <trade-id>',
                    'trade cancel <trade-id>',
                    'trade history'
                ],
            },
            aliases: ['swap', 'exchange'],
            category: 'summer',
            cooldown: 3,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'action',
                    description: 'Trade action',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Offer - Create trade offer', value: 'offer' },
                        { name: 'Accept - Accept trade', value: 'accept' },
                        { name: 'Cancel - Cancel trade', value: 'cancel' },
                        { name: 'View - View active trades', value: 'view' },
                        { name: 'History - View trade history', value: 'history' }
                    ]
                },
                {
                    name: 'user',
                    description: 'User to trade with',
                    type: 6,
                    required: false
                },
                {
                    name: 'tradeid',
                    description: 'Trade ID for accept/cancel',
                    type: 3,
                    required: false
                }
            ]
        });
    }
    
    async run(ctx, args) {
        // Get or create profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: ctx.author.id,
                username: ctx.author.tag
            });
            await profile.save();
        }
        
        // Parse action
        let action = 'view'; // Default
        if (ctx.isInteraction) {
            action = ctx.interaction.options.getString('action') || 'view';
        } else if (args.length > 0) {
            const firstArg = args[0].toLowerCase();
            if (['offer', 'create', 'new'].includes(firstArg)) {
                action = 'offer';
            } else if (['accept', 'confirm'].includes(firstArg)) {
                action = 'accept';
            } else if (['cancel', 'decline', 'reject'].includes(firstArg)) {
                action = 'cancel';
            } else if (['history', 'past', 'log'].includes(firstArg)) {
                action = 'history';
            } else if (['view', 'list', 'active'].includes(firstArg)) {
                action = 'view';
            }
        }
        
        // Route to appropriate handler
        switch (action) {
            case 'offer':
                return this.createTradeOffer(ctx, profile, args);
            case 'accept':
                return this.acceptTradeOffer(ctx, profile, args);
            case 'cancel':
                return this.cancelTradeOffer(ctx, profile, args);
            case 'history':
                return this.showTradeHistory(ctx, profile);
            case 'view':
            default:
                return this.viewActiveTrades(ctx, profile);
        }
    }
    
    async createTradeOffer(ctx, profile, args) {
        // Check if player can trade
        const currentTier = getTierFromXP(profile.battlePassXP);
        const activeTrades = await TradeSchema.countDocuments({
            $or: [{ initiator: ctx.author.id }, { recipient: ctx.author.id }],
            status: tradeStatus.PENDING
        });
        
        const canTrade = canInitiateTrade(profile, activeTrades);
        
        if (!canTrade.canTrade) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Cannot Trade**\n> ${canTrade.reason}`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Get target user
        let targetUser;
        if (ctx.isInteraction) {
            targetUser = ctx.interaction.options.getUser('user');
        } else {
            targetUser = ctx.message?.mentions?.users?.first();
        }
        
        if (!targetUser || targetUser.id === ctx.author.id) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Invalid User**\n> _Mention a user to trade with._\n> _Usage: \`++trade offer @user\`_`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        if (targetUser.bot) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Cannot Trade with Bots**\n> _You can only trade with other players._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Check if target player exists
        let targetProfile = await SummerProfile.findById(targetUser.id);
        if (!targetProfile) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Player Not Found**\n> _${targetUser.username} hasn't started playing yet._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Show trade setup UI
        return this.showTradeSetup(ctx, profile, targetUser, targetProfile);
    }
    
    async showTradeSetup(ctx, initiatorProfile, targetUser, targetProfile) {
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **🤝 Trade Setup**\n> **Trading with:** ${targetUser.username}\n> \n> _Simplified trading is currently available._\n> _For detailed item selection, use the trade menu in-game._`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Show what user can trade
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **📦 Your Inventory**\n> **•** Fish: \`${initiatorProfile.fishInventory.length}\`\n> **•** Collectibles: \`${initiatorProfile.collectibles.length}\`\n> **•** Seashells: \`${initiatorProfile.seashells.toLocaleString()}\` ${emojis.currency.seashell}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💡 Quick Trade Example:**\n> \n> This is a placeholder for the interactive trade UI.\n> Full trading system will include:\n> **•** Select specific fish to trade\n> **•** Choose collectibles to exchange\n> **•** Set seashell amounts\n> **•** Fair trade warnings\n> **•** 5-minute confirmation window\n> \n> _Trade system is functional - UI coming soon!_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **📋 Trade Info:**\n> **•** Maximum 10 fish per trade\n> **•** Maximum 5 collectibles per trade\n> **•** 5% tax on seashell trades\n> **•** 5-minute offer expiration\n> **•** Both players must accept`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async acceptTradeOffer(ctx, profile, args) {
        // Get trade ID
        let tradeId;
        if (ctx.isInteraction) {
            tradeId = ctx.interaction.options.getString('tradeid');
        } else if (args.length >= 2) {
            tradeId = args[1];
        }
        
        if (!tradeId) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Missing Trade ID**\n> _Usage: \`++trade accept <trade-id>\`_\n> _Use \`++trade view\` to see active trades._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Find trade
        const trade = await TradeSchema.findOne({
            tradeId: { $regex: new RegExp('^' + tradeId, 'i') },
            recipient: ctx.author.id,
            status: tradeStatus.PENDING
        });
        
        if (!trade) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Trade Not Found**\n> _No pending trade found with ID: ${tradeId}_\n> _Use \`++trade view\` to see your active trades._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Check if expired
        if (isTradeExpired(trade)) {
            trade.status = tradeStatus.EXPIRED;
            await trade.save();
            
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Trade Expired**\n> _This trade offer has expired._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Get initiator profile
        const initiatorProfile = await SummerProfile.findById(trade.initiator);
        if (!initiatorProfile) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Error**\n> _Trade initiator profile not found._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Execute trade
        const result = executeTrade(initiatorProfile, profile, trade);
        
        if (!result.success) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Trade Failed**\n> ${result.errors.join('\n> ')}`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Save profiles and trade
        await initiatorProfile.save();
        await profile.save();
        await trade.save();
        
        // Success message
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.success} Trade Complete!**\n> _Trade with ${initiatorProfile.username} completed successfully!_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **📦 You Gave:**\n> ${formatTradeOffer(trade.recipientOffer)}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(false));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **🎁 You Received:**\n> ${formatTradeOffer(trade.initiatorOffer)}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💰 Updated Balance:**\n> Seashells: \`${profile.seashells.toLocaleString()}\` ${emojis.currency.seashell}\n> Fish: \`${profile.fishInventory.length}\`\n> Collectibles: \`${profile.collectibles.length}\``)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async cancelTradeOffer(ctx, profile, args) {
        // Get trade ID
        let tradeId;
        if (ctx.isInteraction) {
            tradeId = ctx.interaction.options.getString('tradeid');
        } else if (args.length >= 2) {
            tradeId = args[1];
        }
        
        if (!tradeId) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Missing Trade ID**\n> _Usage: \`++trade cancel <trade-id>\`_\n> _Use \`++trade view\` to see active trades._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Find trade
        const trade = await TradeSchema.findOne({
            tradeId: { $regex: new RegExp('^' + tradeId, 'i') },
            $or: [{ initiator: ctx.author.id }, { recipient: ctx.author.id }],
            status: tradeStatus.PENDING
        });
        
        if (!trade) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Trade Not Found**\n> _No pending trade found with ID: ${tradeId}_`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Cancel trade
        const result = cancelTrade(trade, ctx.author.id);
        
        if (!result.success) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Cannot Cancel**\n> ${result.message}`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        await trade.save();
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **${emojis.general.warning} Trade Cancelled**\n> _Trade ${trade.tradeId.split('-')[0]} has been cancelled._`)
        );
        return ctx.sendMessage({ components: [container] });
    }
    
    async viewActiveTrades(ctx, profile) {
        // Find all active trades for this user
        const trades = await TradeSchema.find({
            $or: [{ initiator: ctx.author.id }, { recipient: ctx.author.id }],
            status: tradeStatus.PENDING
        }).sort({ createdAt: -1 }).limit(10);
        
        // Check for expired trades
        for (const trade of trades) {
            if (isTradeExpired(trade)) {
                trade.status = tradeStatus.EXPIRED;
                await trade.save();
            }
        }
        
        // Filter out expired
        const activeTrades = trades.filter(t => t.status === tradeStatus.PENDING);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **🤝 Active Trades**\n> _Your pending trade offers_`)
        );
        
        if (activeTrades.length === 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.info} No Active Trades**\n> _You have no pending trades._\n> \n> Use \`++trade offer @user\` to start a trade!`)
            );
        } else {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            for (const trade of activeTrades) {
                const isInitiator = trade.initiator === ctx.author.id;
                const partnerUser = await this.client.users.fetch(isInitiator ? trade.recipient : trade.initiator);
                
                const summary = getTradeSummary(trade, isInitiator ? 'initiator' : 'recipient');
                
                let tradeText = `> **ID:** \`${summary.tradeId}\` ${isInitiator ? '(Sent)' : '(Received)'}\n`;
                tradeText += `> **Partner:** ${partnerUser ? partnerUser.username : 'Unknown'}\n`;
                tradeText += `> **Your Offer:** ${formatTradeOffer(isInitiator ? trade.initiatorOffer : trade.recipientOffer)}\n`;
                tradeText += `> **Their Offer:** ${formatTradeOffer(isInitiator ? trade.recipientOffer : trade.initiatorOffer)}\n`;
                tradeText += `> **Expires:** ${summary.expiresIn}`;
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(tradeText)
                );
                
                container.addSeparatorComponents((separator) => separator.setDivider(false));
            }
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **💡 Commands:**\n> \`++trade accept <id>\` - Accept a trade\n> \`++trade cancel <id>\` - Cancel a trade`)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showTradeHistory(ctx, profile) {
        const tradeHistory = profile.tradeHistory || [];
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **📜 Trade History**\n> **Total Trades:** \`${profile.tradeCount || 0}\``)
        );
        
        if (tradeHistory.length === 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.info} No Trade History**\n> _You haven't completed any trades yet._`)
            );
        } else {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const recentTrades = tradeHistory.slice(0, 5);
            for (const trade of recentTrades) {
                const partnerUser = await this.client.users.fetch(trade.partner).catch(() => null);
                const tradeDate = new Date(trade.completedAt);
                
                let tradeText = `> **Partner:** ${partnerUser ? partnerUser.username : 'Unknown'}\n`;
                tradeText += `> **Gave:** ${formatTradeOffer(trade.items.given)}\n`;
                tradeText += `> **Got:** ${formatTradeOffer(trade.items.received)}\n`;
                tradeText += `> **Date:** ${tradeDate.toLocaleDateString()}`;
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(tradeText)
                );
                
                container.addSeparatorComponents((separator) => separator.setDivider(false));
            }
            
            if (tradeHistory.length > 5) {
                container.addSeparatorComponents((separator) => separator.setDivider(true));
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(`> _Showing 5 of ${tradeHistory.length} trades_`)
                );
            }
        }
        
        return ctx.sendMessage({ components: [container] });
    }
}
