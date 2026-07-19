import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { beachesData, getExplorerRank, getIslandGroupStats, getIslandsByGroup, hasVisitedIsland, islandGroups, getIslandProgress, formatIslandProgress, canProgressToNextIsland, getAccessibleIslands } from '../../data/beaches.js';
import { emojis } from '../../config/emojis.js';

export default class Islands extends Command {
    constructor(client) {
        super(client, {
            name: 'islands',
            description: {
                content: 'View discovered Philippine islands and your explorer rank',
                usage: '[luzon|visayas|mindanao]',
                examples: ['islands', 'islands luzon', 'islands visayas'],
            },
            aliases: ['island', 'map', 'discovered'],
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
                    name: 'group',
                    description: 'View specific island group',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Luzon', value: 'luzon' },
                        { name: 'Visayas', value: 'visayas' },
                        { name: 'Mindanao', value: 'mindanao' }
                    ]
                },
            ]
        });
    }
    
    async run(ctx, args) {
        // Get or create profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: ctx.author.id,
                username: ctx.author.tag,
                visitedIslands: [],
                islandDiscoveries: []
            });
            await profile.save();
        }
        
        // Initialize if needed
        if (!profile.visitedIslands) profile.visitedIslands = [];
        if (!profile.islandDiscoveries) profile.islandDiscoveries = [];
        
        // Check if viewing specific group
        const viewGroup = ctx.isInteraction && ctx.interaction.options.getString('group')
            ? ctx.interaction.options.getString('group')
            : (args[0]?.toLowerCase() || null);
        
        if (viewGroup && ['luzon', 'visayas', 'mindanao'].includes(viewGroup)) {
            return this.showIslandGroup(ctx, profile, viewGroup);
        }
        
        // Get explorer rank
        const explorerRank = getExplorerRank(profile.visitedIslands);
        const groupStats = getIslandGroupStats(profile);
        
        const uniqueIslands = profile.visitedIslands.length;
        const totalIslands = 54;
        const progressPercent = Math.floor((uniqueIslands / totalIslands) * 100);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **${emojis.activities.map} Philippine Islands**\n> **Explorer: ${ctx.author.tag}**`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Explorer rank
        const rankText = `> **${explorerRank.emoji} Explorer Rank**\n` +
            `> # **${explorerRank.rank}**\n` +
            `> _Tier ${explorerRank.tier}/4_`;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(rankText));
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Progress
        const progressBarLength = 20;
        const filledBars = Math.floor((uniqueIslands / totalIslands) * progressBarLength);
        const progressBar = emojis.battlepass.bar.repeat(filledBars) + emojis.battlepass.empty.repeat(progressBarLength - filledBars);
        
        const progressText = `> **${emojis.progression.stats} Discovery Progress**\n` +
            `> ${progressBar}\n` +
            `> **Islands Discovered:** \`${uniqueIslands}/${totalIslands}\` (${progressPercent}%)\n` +
            `> **Total Explorations:** \`${profile.beachesExplored}\`\n` +
            `> **Current Location:** \`${profile.currentBeach}\``;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(progressText));
        
        // Island groups breakdown
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const luzonPercent = Math.floor((groupStats.luzon.visited / groupStats.luzon.total) * 100);
        const visayasPercent = Math.floor((groupStats.visayas.visited / groupStats.visayas.total) * 100);
        const mindanaoPercent = Math.floor((groupStats.mindanao.visited / groupStats.mindanao.total) * 100);
        
        const groupText = `> **${emojis.islands.island} Island Groups**\n` +
            `> ${emojis.islandGroups.luzon} **Luzon** - \`${groupStats.luzon.visited}/${groupStats.luzon.total}\` (${luzonPercent}%)\n` +
            `> ${emojis.islandGroups.visayas} **Visayas** - \`${groupStats.visayas.visited}/${groupStats.visayas.total}\` (${visayasPercent}%)\n` +
            `> ${emojis.islandGroups.mindanao} **Mindanao** - \`${groupStats.mindanao.visited}/${groupStats.mindanao.total}\` (${mindanaoPercent}%)\n` +
            `>\n` +
            `> _Use \`${this.client.config.prefix}islands [group]\` to view specific islands_`;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(groupText));
        
        // Rank milestones
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        let nextMilestone = '';
        if (explorerRank.tier === 0) {
            nextMilestone = 'Discover `5 islands` to become a **Local Tourist**';
        } else if (explorerRank.tier === 1) {
            nextMilestone = 'Discover `15 islands` to become an **Island Hopper**';
        } else if (explorerRank.tier === 2) {
            nextMilestone = 'Discover `30 islands` to become an **Archipelago Adventurer**';
        } else if (explorerRank.tier === 3) {
            nextMilestone = 'Discover `54 islands` to become a **Philippine Explorer**';
        } else {
            nextMilestone = `**You've discovered all islands!** ${emojis.general.party}`;
        }
        
        const milestoneText = `> **${emojis.progression.target} Next Milestone**\n` +
            `> ${nextMilestone}`;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(milestoneText));
        
        // Recently discovered
        if (profile.islandDiscoveries.length > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const recentIslands = profile.islandDiscoveries
                .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt))
                .slice(0, 5)
                .map(d => {
                    const island = beachesData[d.islandId];
                    return island ? `${island.emoji} \`${island.name}\` - <t:${Math.floor(new Date(d.discoveredAt).getTime() / 1000)}:R>` : null;
                })
                .filter(Boolean)
                .join('\n> ');
            
            if (recentIslands) {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(`> **${emojis.time.clock} Recently Discovered**\n> ${recentIslands}`)
                );
            }
        }
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`_${emojis.energy.lightbulb} Use \`${this.client.config.prefix}explore [island]\` to visit islands! Explore all 54 Philippine islands to become a legendary explorer!_`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showIslandGroup(ctx, profile, groupName) {
        const islands = getIslandsByGroup(groupName);
        const groupInfo = islandGroups[groupName];
        
        if (!islands || islands.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.ui.cross} Invalid Island Group**\n> _Choose: luzon, visayas, or mindanao_`)
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## ${groupInfo.emoji} **${groupInfo.name} Islands**\n> _${groupInfo.description}_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Count discovered islands in this group
        const discoveredInGroup = islands.filter(island => hasVisitedIsland(profile, island.id)).length;
        const groupPercent = Math.floor((discoveredInGroup / islands.length) * 100);
        
        const statsText = `> **${emojis.progression.stats} Progress**\n` +
            `> **Discovered:** \`${discoveredInGroup}/${islands.length}\` (${groupPercent}%)`;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(statsText));
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // List all islands in group
        const islandList = islands.map(island => {
            const discovered = hasVisitedIsland(profile, island.id);
            const status = discovered ? emojis.ui.check : emojis.general.locked;
            const discovery = profile.islandDiscoveries.find(d => d.islandId === island.id);
            const visits = discovery ? ` _(${discovery.timesVisited} visits)_` : '';
            
            return `> ${status} ${island.emoji} **${island.name}**${visits}`;
        }).join('\n');
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **${emojis.islands.island} Islands**\n${islandList}`)
        );
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`_Use \`${this.client.config.prefix}explore [island name]\` to visit any unlocked island!_`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
