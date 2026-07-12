import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import SummerLeaderboard from '../../schemas/summerLeaderboard.js';
import { emojis } from '../../config/emojis.js';

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
                (textDisplay) => textDisplay.setContent('> **' + emojis.general.error + ' Server Leaderboard Unavailable**\n> _Server leaderboards can only be viewed from a Discord server!_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Build query based on scope
        const query = scope === 'server' && ctx.guild
            ? { _id: { $in: await this.getServerMembers(ctx.guild) } }
            : {};
        
        // Build sort and field based on category
        let sortField, displayField, emoji, title;
        
        switch (category) {
            case 'fish':
                sortField = { fishCaught: -1 };
                displayField = 'fishCaught';
                emoji = emojis.activities.fishing;
                title = 'Top Fishers';
                break;
                
            case 'explorer':
                sortField = { beachesExplored: -1 };
                displayField = 'beachesExplored';
                emoji = emojis.islands.island;
                title = 'Top Explorers';
                break;
                
            case 'collector':
                sortField = { 'collectibles': -1 };
                displayField = 'collectibles';
                emoji = emojis.collectibles.crab;
                title = 'Top Collectors';
                break;
                
            case 'rich':
                sortField = { seashells: -1 };
                displayField = 'seashells';
                emoji = emojis.currency.seashell;
                title = 'Richest Players';
                break;
                
            case 'tokens':
                sortField = { sunTokens: -1 };
                displayField = 'sunTokens';
                emoji = emojis.general.star;
                title = 'Most Sun Tokens';
                break;
                
            case 'xp':
            default:
                sortField = { battlePassXP: -1 };
                displayField = 'battlePassXP';
                emoji = emojis.general.star;
                title = 'Battle Pass Leaders';
                break;
        }
        
        // Fetch top players
        const topPlayers = await SummerProfile.find(query)
            .sort(sortField)
            .limit(10)
            .lean();
        
        if (!topPlayers || topPlayers.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **' + emojis.progression.chart + ' Leaderboard Empty**\n> _No data available yet. Start playing to see rankings!_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Get user's rank
        const userProfile = await SummerProfile.findById(ctx.author.id);
        let userRank = null;
        
        if (userProfile) {
            const allProfiles = await SummerProfile.find(query).sort(sortField).lean();
            userRank = allProfiles.findIndex(p => p._id === ctx.author.id) + 1;
        }
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        const scopeName = scope === 'server' ? ctx.guild.name : 'Global';
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **' + emoji + ' ' + title + '**\n> _' + scopeName + ' Rankings_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Build leaderboard
        let leaderboardText = '';
        
        for (let i = 0; i < topPlayers.length; i++) {
            const player = topPlayers[i];
            const rank = i + 1;
            const medal = rank === 1 ? emojis.leaderboard.first : rank === 2 ? emojis.leaderboard.second : rank === 3 ? emojis.leaderboard.third : `**${rank}.**`;
            
            // Get display value
            let value;
            if (displayField === 'collectibles') {
                value = player.collectibles ? player.collectibles.length : 0;
            } else {
                value = player[displayField] || 0;
            }
            
            // Format value
            let formattedValue = value.toLocaleString();
            if (category === 'xp') {
                formattedValue = `Tier ${Math.floor(value / 100)} (${value.toLocaleString()} XP)`;
            } else if (category === 'explorer') {
                formattedValue = `${value} islands`;
            } else if (category === 'fish') {
                formattedValue = `${value} fish`;
            } else if (category === 'collector') {
                formattedValue = `${value} items`;
            }
            
            const username = player.username || 'Unknown';
            leaderboardText += `> ${medal} **${username}**\n> ${formattedValue}\n`;
            
            if (i < topPlayers.length - 1) {
                leaderboardText += '>\n';
            }
        }
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(leaderboardText));
        
        // Show user's rank if not in top 10
        if (userProfile && userRank && userRank > 10) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            let userValue;
            if (displayField === 'collectibles') {
                userValue = userProfile.collectibles ? userProfile.collectibles.length : 0;
            } else {
                userValue = userProfile[displayField] || 0;
            }
            
            let formattedUserValue = userValue.toLocaleString();
            if (category === 'xp') {
                formattedUserValue = `Tier ${Math.floor(userValue / 100)} (${userValue.toLocaleString()} XP)`;
            } else if (category === 'explorer') {
                formattedUserValue = `${userValue} islands`;
            } else if (category === 'fish') {
                formattedUserValue = `${userValue} fish`;
            } else if (category === 'collector') {
                formattedUserValue = `${userValue} items`;
            }
            
            const yourRankText = '> **' + emojis.activities.map + ' Your Rank**\n' +
                '> **#' + userRank + '** - ' + formattedUserValue;
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(yourRankText));
        } else if (userProfile && userRank && userRank <= 10) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **' + emojis.general.party + ' You\'re in the Top 10!**\n> Keep up the great work!')
            );
        }
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_' + emojis.energy.lightbulb + ' Use `++leaderboard [category] [global/server]` to view different rankings!_')
        );
        
        return ctx.sendMessage({ components: [container] });
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
