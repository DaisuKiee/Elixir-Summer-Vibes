import { ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { emojis } from '../../config/emojis.js';

// Store active trade sessions in memory
export const activeTradeSessions = new Map();

// Trade states
export const TradeState = {
    WAITING_FOR_PARTNER: 'waiting_for_partner',
    CONFIGURING_OFFERS: 'configuring_offers',
    WAITING_FOR_APPROVAL: 'waiting_for_approval',
    COUNTDOWN: 'countdown',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

export default class Trade extends Command {
    constructor(client) {
        super(client, {
            name: 'trade',
            description: {
                content: 'Trade fish, collectibles, and seashells with other players',
                usage: '[@user]',
                examples: ['trade @user'],
            },
            aliases: ['swap', 'exchange'],
            category: 'summer',
            cooldown: 5,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: false,
        });
    }
    
    async run(ctx, args) {
        // Get or create profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: ctx.author.id,
                username: ctx.author.username
            });
            await profile.save();
        }

        // Check if user has anything to trade
        if (profile.fishInventory.length === 0 && profile.collectibles.length === 0 && profile.seashells < 100) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Nothing to Trade**\n> _You need at least 1 fish, 1 collectible, or 100 seashells to trade._`)
            );
            return ctx.sendMessage({ components: [container] });
        }

        // Get target user from mention
        const mentionedUser = ctx.message?.mentions?.users?.first();
        
        if (!mentionedUser) {
            return this.showTradeInfo(ctx, profile);
        }

        return this.initiateTrade(ctx, profile, mentionedUser);
    }
    
    async showTradeInfo(ctx, profile) {
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **🤝 Interactive Trading System**\n> _Trade fish, collectibles, and seashells with other players_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **How to Trade:**\n> \n> **1.** Mention a player: \`${this.client.config.prefix}trade @username\`\n> **2.** They accept or decline\n> **3.** Both configure your offers\n> **4.** Both approve the trade\n> **5.** 5-second countdown\n> **6.** Trade completes!`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **📦 Your Tradeable Items:**\n> **•** Fish: \`${profile.fishInventory.length}\`\n> **•** Collectibles: \`${profile.collectibles.length}\`\n> **•** Seashells: \`${profile.seashells.toLocaleString()}\` ${emojis.currency.seashell}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **📋 Trade Rules:**\n> **•** Both players configure their offers\n> **•** Both players must approve\n> **•** 5-second countdown before execution\n> **•** 5-minute timeout\n> **•** Cannot trade with yourself or bots\n> **•** Max 10 fish per trade\n> **•** Max 10 collectibles per trade\n> **•** Max 25,000 seashells per trade`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async initiateTrade(ctx, initiatorProfile, targetUser) {
        // Validation
        if (targetUser.id === ctx.author.id) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Cannot Trade with Yourself**`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        if (targetUser.bot) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Cannot Trade with Bots**`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Get target profile
        let targetProfile = await SummerProfile.findById(targetUser.id);
        if (!targetProfile) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Player Not Found**\n> _${targetUser.username} hasn't started playing yet._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Check if either is in a trade
        if (activeTradeSessions.has(ctx.author.id) || activeTradeSessions.has(targetUser.id)) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Already Trading**\n> _One of you is already in an active trade._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Create trade session
        const tradeId = `${ctx.author.id}-${targetUser.id}-${Date.now()}`;
        const tradeSession = {
            id: tradeId,
            state: TradeState.WAITING_FOR_PARTNER,
            initiator: {
                user: ctx.author,
                userId: ctx.author.id,
                profile: initiatorProfile,
                offer: { fish: [], collectibles: [], seashells: 0 },
                approved: false,
                configured: false
            },
            target: {
                user: targetUser,
                userId: targetUser.id,
                profile: targetProfile,
                offer: { fish: [], collectibles: [], seashells: 0 },
                approved: false,
                configured: false
            },
            createdAt: Date.now(),
            expiresAt: Date.now() + (5 * 60 * 1000),
            channelId: ctx.channel.id,
            messageId: null
        };
        
        activeTradeSessions.set(ctx.author.id, tradeSession);
        activeTradeSessions.set(targetUser.id, tradeSession);
        
        // Show trade request
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **🤝 Trade Request**\n> **${tradeSession.initiator.user.username}** wants to trade with **${tradeSession.target.user.username}**!`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **${tradeSession.target.user.username}**, do you accept this trade request?\n> \n> ${emojis.ui.check} **Accept** - Start configuring the trade\n> ${emojis.ui.cross} **Decline** - Reject the trade request`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **⏱️ Expires:** <t:${Math.floor(tradeSession.expiresAt / 1000)}:R>`)
        );
        
        container.addActionRowComponents((row) =>
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`trade_accept_${tradeSession.id}`)
                    .setLabel('Accept')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
            ).addComponents(
                new ButtonBuilder()
                    .setCustomId(`trade_decline_${tradeSession.id}`)
                    .setLabel('Decline')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            )
        );
        
        const message = await ctx.sendMessage({ components: [container] });
        if (message && message.id) {
            tradeSession.messageId = message.id;
        }
        
        // Auto-expire after 5 minutes
        setTimeout(async () => {
            if (activeTradeSessions.has(ctx.author.id)) {
                const session = activeTradeSessions.get(ctx.author.id);
                if (session.id === tradeId && session.state !== TradeState.COMPLETED) {
                    // Clean up sessions
                    activeTradeSessions.delete(ctx.author.id);
                    activeTradeSessions.delete(targetUser.id);
                    
                    // Update message to show expired
                    try {
                        const expiredContainer = this.client.container()
                            .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
                        
                        expiredContainer.addTextDisplayComponents(
                            (textDisplay) => textDisplay.setContent(`> ## **⏰ Trade Expired**\n> _This trade request has expired._`)
                        );
                        
                        expiredContainer.addSeparatorComponents((separator) => separator.setDivider(true));
                        
                        expiredContainer.addTextDisplayComponents(
                            (textDisplay) => textDisplay.setContent(`> **${session.initiator.user.username}** wanted to trade with **${session.target.user.username}**\n> \n> _Trade timed out after 5 minutes of inactivity._`)
                        );
                        
                        expiredContainer.addSeparatorComponents((separator) => separator.setDivider(true));
                        
                        expiredContainer.addTextDisplayComponents(
                            (textDisplay) => textDisplay.setContent(`> 💡 Start a new trade with \`${this.client.config.prefix}trade @user\``)
                        );
                        
                        if (message && message.edit) {
                            await message.edit({ components: [expiredContainer] });
                        }
                    } catch (error) {
                        console.error('Error updating expired trade message:', error);
                    }
                }
            }
        }, 5 * 60 * 1000);
        
        return message;
    }
}
