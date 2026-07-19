import { StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import SummerLeaderboard from '../../schemas/summerLeaderboard.js';
import { emojis } from '../../config/emojis.js';
import { getLevelFromXP } from '../../data/levelSystem.js';

export default class Leaderboard extends Command {
    constructor(client) {
        super(client, {
            name: 'leaderboard',
            description: {
                content: 'View global or server leaderboards for Summer Escape 2026',
                usage: '[category] [scope]',
                examples: ['leaderboard', 'leaderboard xp global', 'leaderboard fish server', 'leaderboard collector'],
            },
            aliases: ['lb', 'top', 'rankings'],
            category: 'summer',
            cooldown: 10,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'category',
                    description: 'Leaderboard category',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Battle Pass Level', value: 'xp' },
                        { name: 'Fish Caught', value: 'fish' },
                        { name: 'Islands Explored', value: 'explorer' },
                        { name: 'Collectibles', value: 'collector' },
                        { name: 'Seashells (Richest)', value: 'rich' },
                        { name: 'Sun Tokens', value: 'tokens' }
                    ]
                },
                {
                    name: 'scope',
                    description: 'Global or Server',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Global', value: 'global' },
                        { name: 'Server', value: 'server' }
                    ]
                }
            ]
        });
    }
    
    async run(ctx, args) {
        // Parse arguments
        let category = 'xp';
        let scope = 'global';
        let page = 1;
        
        if (ctx.isInteraction) {
            category = ctx.interaction.options.getString('category') || 'xp';
            scope = ctx.interaction.options.getString('scope') || 'global';
        } else {
            // Parse text arguments
            const argLower = args.map(a => a.toLowerCase());
            
            // Determine category
            if (argLower.includes('fish') || argLower.includes('fishing')) category = 'fish';
            else if (argLower.includes('explore') || argLower.includes('explorer') || argLower.includes('islands')) category = 'explorer';
            else if (argLower.includes('collect') || argLower.includes('collector') || argLower.includes('collectibles')) category = 'collector';
            else if (argLower.includes('rich') || argLower.includes('seashells') || argLower.includes('shells')) category = 'rich';
            else if (argLower.includes('token') || argLower.includes('tokens') || argLower.includes('sun')) category = 'tokens';
            else if (argLower.includes('xp') || argLower.includes('level') || argLower.includes('tier')) category = 'xp';
            
            // Determine scope
            if (argLower.includes('server') || argLower.includes('guild')) scope = 'server';
            else if (argLower.includes('global') || argLower.includes('world')) scope = 'global';
        }
        
        // Server scope requires guild context
        if (scope === 'server' && !ctx.guild) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(emojis.general.error + ' Server Leaderboard Unavailable\nServer leaderboards can only be viewed from a Discord server!')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Show leaderboard
        await this.showLeaderboard(ctx, category, scope, page);
    }
    
    async showLeaderboard(ctx, category, scope, page) {
        // Build query based on scope
        const query = scope === 'server' && ctx.guild
            ? { _id: { $in: await this.getServerMembers(ctx.guild) } }
            : {};
        
        // Get category configuration
        const categoryConfig = this.getCategoryConfig(category);
        
        // Fetch top players with pagination
        const perPage = 10;
        const skip = (page - 1) * perPage;
        
        const topPlayers = await SummerProfile.find(query)
            .sort(categoryConfig.sortField)
            .skip(skip)
            .limit(perPage)
            .lean();
        
        if (!topPlayers || topPlayers.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.warning.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(emojis.progression.chart + ' Leaderboard Empty\nNo data available yet. Start playing to see rankings!')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Get total count and user's rank
        const totalPlayers = await SummerProfile.countDocuments(query);
        const totalPages = Math.ceil(totalPlayers / perPage);
        
        const userProfile = await SummerProfile.findById(ctx.author.id);
        let userRank = null;
        let userValue = null;
        
        if (userProfile) {
            const allProfiles = await SummerProfile.find(query).sort(categoryConfig.sortField).lean();
            userRank = allProfiles.findIndex(p => p._id === ctx.author.id) + 1;
            userValue = this.getUserValue(userProfile, categoryConfig);
        }
        
        // Build container
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // === HEADER ===
        const scopeName = scope === 'server' ? ctx.guild.name : 'Global';
        const headerText = `${categoryConfig.emoji} ${categoryConfig.title}\n` +
            `${scopeName} Rankings • Page ${page}/${totalPages}`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(headerText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // === LEADERBOARD ENTRIES ===
        const startRank = skip + 1;
        const leaderboardText = this.buildLeaderboardEntries(
            topPlayers,
            startRank,
            categoryConfig,
            ctx.author.id
        );
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(leaderboardText)
        );
        
        // === USER'S RANK (if not in current page) ===
        if (userProfile && userRank) {
            const userOnCurrentPage = userRank >= startRank && userRank < startRank + perPage;
            
            if (!userOnCurrentPage) {
                container.addSeparatorComponents((separator) => separator.setDivider(true));
                
                const formattedValue = this.formatValue(userValue, categoryConfig);
                const yourRankText = `${emojis.activities.map} Your Rank\n` +
                    `#${userRank} • ${formattedValue}\n` +
                    `${this.getRankMessage(userRank, totalPlayers)}`;
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(yourRankText)
                );
            }
        }
        
        // === CONTROLS ===
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Category selector
        const categoryMenu = this.buildCategoryMenu(category);
        container.addActionRowComponents((row) => row.addComponents(categoryMenu));
        
        // Scope toggle and pagination buttons
        const buttons = this.buildControlButtons(scope, page, totalPages);
        container.addActionRowComponents((row) => row.addComponents(...buttons));
        
        // Send or edit message
        let message;
        if (ctx.message) {
            message = await ctx.sendMessage({ components: [container] });
        } else {
            return ctx.sendMessage({ components: [container] });
        }
        
        // Handle interactions
        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 300000 // 5 minutes
        });
        
        collector.on('collect', async interaction => {
            try {
                if (interaction.customId === 'lb_category') {
                    category = interaction.values[0];
                    page = 1; // Reset to first page on category change
                } else if (interaction.customId === 'lb_scope') {
                    scope = scope === 'global' ? 'server' : 'global';
                    page = 1;
                    
                    // Check if server scope is valid
                    if (scope === 'server' && !ctx.guild) {
                        scope = 'global';
                    }
                } else if (interaction.customId === 'lb_prev') {
                    page = Math.max(1, page - 1);
                } else if (interaction.customId === 'lb_next') {
                    page = Math.min(totalPages, page + 1);
                }
                
                // Rebuild the leaderboard container
                const query = scope === 'server' && ctx.guild
                    ? { _id: { $in: await this.getServerMembers(ctx.guild) } }
                    : {};
                
                const categoryConfig = this.getCategoryConfig(category);
                const perPage = 10;
                const skip = (page - 1) * perPage;
                
                const topPlayers = await SummerProfile.find(query)
                    .sort(categoryConfig.sortField)
                    .skip(skip)
                    .limit(perPage)
                    .lean();
                
                const totalPlayers = await SummerProfile.countDocuments(query);
                const totalPages = Math.ceil(totalPlayers / perPage);
                
                const userProfile = await SummerProfile.findById(ctx.author.id);
                let userRank = null;
                let userValue = null;
                
                if (userProfile) {
                    const allProfiles = await SummerProfile.find(query).sort(categoryConfig.sortField).lean();
                    userRank = allProfiles.findIndex(p => p._id === ctx.author.id) + 1;
                    userValue = this.getUserValue(userProfile, categoryConfig);
                }
                
                // Build new container
                const newContainer = this.client.container()
                    .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
                
                // Header
                const scopeName = scope === 'server' ? ctx.guild.name : 'Global';
                const headerText = `${categoryConfig.emoji} ${categoryConfig.title}\n` +
                    `${scopeName} Rankings • Page ${page}/${totalPages}`;
                
                newContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(headerText)
                );
                
                newContainer.addSeparatorComponents((separator) => separator.setDivider(true));
                
                // Leaderboard entries
                const startRank = skip + 1;
                const leaderboardText = this.buildLeaderboardEntries(
                    topPlayers,
                    startRank,
                    categoryConfig,
                    ctx.author.id
                );
                
                newContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(leaderboardText)
                );
                
                // User's rank
                if (userProfile && userRank) {
                    const userOnCurrentPage = userRank >= startRank && userRank < startRank + perPage;
                    
                    if (!userOnCurrentPage) {
                        newContainer.addSeparatorComponents((separator) => separator.setDivider(true));
                        
                        const formattedValue = this.formatValue(userValue, categoryConfig);
                        const yourRankText = `${emojis.activities.map} Your Rank\n` +
                            `#${userRank} • ${formattedValue}\n` +
                            `${this.getRankMessage(userRank, totalPlayers)}`;
                        
                        newContainer.addTextDisplayComponents(
                            (textDisplay) => textDisplay.setContent(yourRankText)
                        );
                    }
                }
                
                // Controls
                newContainer.addSeparatorComponents((separator) => separator.setDivider(true));
                
                const categoryMenu = this.buildCategoryMenu(category);
                newContainer.addActionRowComponents((row) => row.addComponents(categoryMenu));
                
                const buttons = this.buildControlButtons(scope, page, totalPages);
                newContainer.addActionRowComponents((row) => row.addComponents(...buttons));
                
                // Update the message
                await interaction.update({ components: [newContainer] });
                
            } catch (error) {
                console.error('Error updating leaderboard:', error);
            }
        });
        
        collector.on('end', () => {
            message.edit({ components: [] }).catch(() => {});
        });
    }
    
    buildLeaderboardEntries(players, startRank, categoryConfig, currentUserId) {
        let text = '';
        
        players.forEach((player, index) => {
            const rank = startRank + index;
            const isCurrentUser = player._id === currentUserId;
            const value = this.getUserValue(player, categoryConfig);
            const formattedValue = this.formatValue(value, categoryConfig);
            
            // Rank indicator
            let rankDisplay;
            if (rank === 1) rankDisplay = emojis.leaderboard.first;
            else if (rank === 2) rankDisplay = emojis.leaderboard.second;
            else if (rank === 3) rankDisplay = emojis.leaderboard.third;
            else rankDisplay = `\`#${rank}\``;
            
            // Username (bold if current user)
            const username = player.username || 'Unknown';
            const displayName = isCurrentUser ? `${username} ${emojis.general.star}` : username;
            
            // Build entry
            text += `${rankDisplay} ${displayName}\n`;
            text += `${formattedValue}`;
            
            if (index < players.length - 1) {
                text += '\n\n';
            }
        });
        
        return text;
    }
    
    buildCategoryMenu(currentCategory) {
        return new StringSelectMenuBuilder()
            .setCustomId('lb_category')
            .setPlaceholder('📊 Select Category')
            .addOptions([
                {
                    label: 'Battle Pass Level',
                    description: 'Top tiers and XP',
                    value: 'xp',
                    emoji: emojis.battlepass.ticket,
                    default: currentCategory === 'xp'
                },
                {
                    label: 'Fish Caught',
                    description: 'Most fish caught',
                    value: 'fish',
                    emoji: emojis.activities.fishing,
                    default: currentCategory === 'fish'
                },
                {
                    label: 'Islands Explored',
                    description: 'Most islands discovered',
                    value: 'explorer',
                    emoji: emojis.islands.island,
                    default: currentCategory === 'explorer'
                },
                {
                    label: 'Collectibles',
                    description: 'Most items collected',
                    value: 'collector',
                    emoji: emojis.collectibles.crab,
                    default: currentCategory === 'collector'
                },
                {
                    label: 'Richest Players',
                    description: 'Most seashells',
                    value: 'rich',
                    emoji: emojis.currency.seashell,
                    default: currentCategory === 'rich'
                },
                {
                    label: 'Sun Tokens',
                    description: 'Most premium currency',
                    value: 'tokens',
                    emoji: emojis.currency.sunToken,
                    default: currentCategory === 'tokens'
                }
            ]);
    }
    
    buildControlButtons(scope, currentPage, totalPages) {
        const buttons = [];
        
        // Scope toggle
        buttons.push(
            new ButtonBuilder()
                .setCustomId('lb_scope')
                .setLabel(scope === 'global' ? '🌍 Global' : '🏠 Server')
                .setStyle(scope === 'global' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
        
        // Previous page
        buttons.push(
            new ButtonBuilder()
                .setCustomId('lb_prev')
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 1)
        );
        
        // Next page
        buttons.push(
            new ButtonBuilder()
                .setCustomId('lb_next')
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === totalPages)
        );
        
        return buttons;
    }
    
    getCategoryConfig(category) {
        const configs = {
            fish: {
                sortField: { fishCaught: -1 },
                displayField: 'fishCaught',
                emoji: emojis.activities.fishing,
                title: 'Top Fishers',
                suffix: 'fish'
            },
            explorer: {
                sortField: { beachesExplored: -1 },
                displayField: 'beachesExplored',
                emoji: emojis.islands.island,
                title: 'Top Explorers',
                suffix: 'islands'
            },
            collector: {
                sortField: { 'collectibles': -1 },
                displayField: 'collectibles',
                emoji: emojis.collectibles.crab,
                title: 'Top Collectors',
                suffix: 'items'
            },
            rich: {
                sortField: { seashells: -1 },
                displayField: 'seashells',
                emoji: emojis.currency.seashell,
                title: 'Richest Players',
                suffix: emojis.currency.seashell
            },
            tokens: {
                sortField: { sunTokens: -1 },
                displayField: 'sunTokens',
                emoji: emojis.currency.sunToken,
                title: 'Most Sun Tokens',
                suffix: emojis.currency.sunToken
            },
            xp: {
                sortField: { totalXP: -1 },
                displayField: 'totalXP',
                emoji: emojis.progression.level,
                title: 'Player Level Leaders',
                suffix: 'XP'
            }
        };
        
        return configs[category] || configs.xp;
    }
    
    getUserValue(profile, categoryConfig) {
        if (categoryConfig.displayField === 'collectibles') {
            return profile.collectibles ? profile.collectibles.length : 0;
        }
        return profile[categoryConfig.displayField] || 0;
    }
    
    formatValue(value, categoryConfig) {
        if (categoryConfig.displayField === 'totalXP') {
            const level = getLevelFromXP(value);
            return `Level ${level} • ${value.toLocaleString()} XP`;
        }
        
        return `${value.toLocaleString()} ${categoryConfig.suffix}`;
    }
    
    getRankMessage(rank, total) {
        const percentage = ((rank / total) * 100).toFixed(1);
        
        if (rank <= 10) return `You're in the top 10! Amazing! 🎉`;
        if (rank <= 50) return `Top 50! Keep climbing! 🚀`;
        if (rank <= 100) return `Top 100! You're doing great! ⭐`;
        if (percentage <= 10) return `Top ${percentage}% of players! 💪`;
        return `Keep playing to climb the ranks! 🎯`;
    }
    
    async getServerMembers(guild) {
        try {
            const members = await guild.members.fetch();
            return Array.from(members.keys());
        } catch (error) {
            return [];
        }
    }
}
