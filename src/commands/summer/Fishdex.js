import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { fishData } from '../../data/fish.js';
import emojis from '../../config/emojis.js';

export default class Fishdex extends Command {
    constructor(client) {
        super(client, {
            name: 'fishdex',
            description: '📖 View your fish collection and see which fish you\'ve caught',
            aliases: ['fishcollection', 'dex', 'pokedex', 'collection'],
            category: 'summer',
            cooldown: 3,
        });
    }

    async run(ctx, args) {
        const profile = await SummerProfile.findById(ctx.author.id);
        if (!profile) {
            return ctx.sendMessage(`${emojis.general.error} You don't have a summer profile! Use \`!fish\` to start fishing.`);
        }

        // Get all caught fish names (including variants)
        const caughtFishNames = new Set(profile.fishInventory.map(f => f.name));
        
        // Add variant fish to caught list
        if (profile.variantFish && profile.variantFish.length > 0) {
            profile.variantFish.forEach(vf => {
                if (vf.fishId) caughtFishNames.add(vf.fishId);
            });
        }

        // Calculate statistics
        const totalFishSpecies = Object.values(fishData).flat().length;
        const caughtSpecies = caughtFishNames.size;
        const completionRate = ((caughtSpecies / totalFishSpecies) * 100).toFixed(1);

        // Show overview first
        const overviewEmbed = this.createOverviewEmbed(ctx.author, profile, caughtSpecies, totalFishSpecies, completionRate);
        
        // Create category selection menu
        const categoryMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('fishdex_category')
                .setPlaceholder('🗂️ Select a rarity category')
                .addOptions([
                    {
                        label: 'Overview',
                        description: 'View collection statistics',
                        value: 'overview',
                        emoji: '📊'
                    },
                    {
                        label: 'Common Fish',
                        description: `${this.getCaughtCount(fishData.common, caughtFishNames)}/${fishData.common.length} caught`,
                        value: 'common',
                        emoji: emojis.rarity.common
                    },
                    {
                        label: 'Uncommon Fish',
                        description: `${this.getCaughtCount(fishData.uncommon, caughtFishNames)}/${fishData.uncommon.length} caught`,
                        value: 'uncommon',
                        emoji: emojis.rarity.uncommon
                    },
                    {
                        label: 'Rare Fish',
                        description: `${this.getCaughtCount(fishData.rare, caughtFishNames)}/${fishData.rare.length} caught`,
                        value: 'rare',
                        emoji: emojis.rarity.rare
                    },
                    {
                        label: 'Epic Fish',
                        description: `${this.getCaughtCount(fishData.epic, caughtFishNames)}/${fishData.epic.length} caught`,
                        value: 'epic',
                        emoji: emojis.rarity.epic
                    },
                    {
                        label: 'Legendary Fish',
                        description: `${this.getCaughtCount(fishData.legendary, caughtFishNames)}/${fishData.legendary.length} caught`,
                        value: 'legendary',
                        emoji: emojis.rarity.legendary
                    },
                    {
                        label: 'Mythical Fish',
                        description: `${this.getCaughtCount(fishData.mythical || [], caughtFishNames)}/${(fishData.mythical || []).length} caught`,
                        value: 'mythical',
                        emoji: emojis.rarity.mythical
                    }
                ])
        );

        const reply = await ctx.sendMessage({
            embeds: [overviewEmbed],
            components: [categoryMenu]
        });

        // Handle interactions
        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'fishdex_category') {
                const category = interaction.values[0];
                
                if (category === 'overview') {
                    await interaction.update({
                        embeds: [overviewEmbed],
                        components: [categoryMenu]
                    });
                } else {
                    const categoryEmbed = this.createCategoryEmbed(
                        ctx.author,
                        category,
                        fishData[category] || [],
                        caughtFishNames
                    );
                    
                    await interaction.update({
                        embeds: [categoryEmbed],
                        components: [categoryMenu]
                    });
                }
            }
        });

        collector.on('end', () => {
            reply.edit({ components: [] }).catch(() => {});
        });
    }

    createOverviewEmbed(author, profile, caughtSpecies, totalFishSpecies, completionRate) {
        const embed = new EmbedBuilder()
            .setColor(this.client.color?.fishdex || '#3498db')
            .setAuthor({ name: `${author.username}'s Fish Collection`, iconURL: author.displayAvatarURL() })
            .setTitle(`${emojis.fish.fishGeneral} Fishdex Overview`)
            .setDescription(`Your comprehensive fish collection tracker!`)
            .addFields(
                {
                    name: `${emojis.progression.stats} Collection Progress`,
                    value: `\`\`\`\n${this.createProgressBar(completionRate)}${completionRate}%\n\`\`\``,
                    inline: false
                },
                {
                    name: `${emojis.fish.tropicalFish} Species Caught`,
                    value: `**${caughtSpecies}** / **${totalFishSpecies}**`,
                    inline: true
                },
                {
                    name: `${emojis.activities.fishing} Total Fish`,
                    value: `**${profile.fishCaught.toLocaleString()}**`,
                    inline: true
                },
                {
                    name: `${emojis.currency.seashell} Inventory`,
                    value: `**${profile.fishInventory.length}** fish`,
                    inline: true
                }
            );

        // Add rarity breakdown
        const caughtFishNames = new Set(profile.fishInventory.map(f => f.name));
        if (profile.variantFish && profile.variantFish.length > 0) {
            profile.variantFish.forEach(vf => {
                if (vf.fishId) caughtFishNames.add(vf.fishId);
            });
        }

        const rarityBreakdown = [
            { name: 'Common', emoji: emojis.rarity.common, data: fishData.common },
            { name: 'Uncommon', emoji: emojis.rarity.uncommon, data: fishData.uncommon },
            { name: 'Rare', emoji: emojis.rarity.rare, data: fishData.rare },
            { name: 'Epic', emoji: emojis.rarity.epic, data: fishData.epic },
            { name: 'Legendary', emoji: emojis.rarity.legendary, data: fishData.legendary },
            { name: 'Mythical', emoji: emojis.rarity.mythical, data: fishData.mythical || [] }
        ];

        let breakdown = '';
        rarityBreakdown.forEach(rarity => {
            const caught = this.getCaughtCount(rarity.data, caughtFishNames);
            const total = rarity.data.length;
            const percent = total > 0 ? Math.round((caught / total) * 100) : 0;
            breakdown += `${rarity.emoji} **${rarity.name}**: ${caught}/${total} (${percent}%)\n`;
        });

        embed.addFields({
            name: `${emojis.general.sparkles} Rarity Breakdown`,
            value: breakdown,
            inline: false
        });

        embed.setFooter({ text: '🗂️ Use the menu below to view specific rarities' });
        embed.setTimestamp();

        return embed;
    }

    createCategoryEmbed(author, category, fishList, caughtFishNames) {
        const rarityEmojis = {
            common: emojis.rarity.common,
            uncommon: emojis.rarity.uncommon,
            rare: emojis.rarity.rare,
            epic: emojis.rarity.epic,
            legendary: emojis.rarity.legendary,
            mythical: emojis.rarity.mythical
        };

        const rarityColors = {
            common: '#95a5a6',
            uncommon: '#3498db',
            rare: '#9b59b6',
            epic: '#e67e22',
            legendary: '#f1c40f',
            mythical: '#e91e63'
        };

        const caught = this.getCaughtCount(fishList, caughtFishNames);
        const total = fishList.length;
        const completion = ((caught / total) * 100).toFixed(1);

        const embed = new EmbedBuilder()
            .setColor(rarityColors[category] || '#3498db')
            .setAuthor({ name: `${author.username}'s Fish Collection`, iconURL: author.displayAvatarURL() })
            .setTitle(`${rarityEmojis[category]} ${category.charAt(0).toUpperCase() + category.slice(1)} Fish`)
            .setDescription(
                `${emojis.fish.fishGeneral} **Progress**: ${caught}/${total} (${completion}%)\n` +
                `\`\`\`\n${this.createProgressBar(completion)}${completion}%\n\`\`\``
            );

        // Group fish into chunks of 15 for better readability
        let fishDisplay = '';
        fishList.forEach((fish, index) => {
            const isCaught = caughtFishNames.has(fish.name);
            const icon = isCaught ? emojis.ui.check : emojis.ui.cross;
            const fishName = isCaught ? fish.name : '???';
            const weightRange = isCaught ? ` (${fish.minWeight}-${fish.maxWeight}kg)` : '';
            
            fishDisplay += `${icon} **${index + 1}.** ${fishName}${weightRange}\n`;
        });

        embed.addFields({
            name: `${emojis.activities.fishing} Species List`,
            value: fishDisplay || 'No fish in this category.',
            inline: false
        });

        // Add special notes for legendary/mythical
        if (category === 'legendary' || category === 'mythical') {
            let specialNotes = '';
            fishList.forEach(fish => {
                if (caughtFishNames.has(fish.name) && fish.description) {
                    specialNotes += `${emojis.general.info} **${fish.name}**: ${fish.description}\n`;
                }
            });
            
            if (specialNotes) {
                embed.addFields({
                    name: `${emojis.general.sparkles} Special Notes`,
                    value: specialNotes,
                    inline: false
                });
            }
        }

        embed.setFooter({ text: '🎣 Keep fishing to complete your collection!' });
        embed.setTimestamp();

        return embed;
    }

    getCaughtCount(fishList, caughtFishNames) {
        return fishList.filter(fish => caughtFishNames.has(fish.name)).length;
    }

    createProgressBar(percentage) {
        const totalBars = 20;
        const filledBars = Math.round((percentage / 100) * totalBars);
        const emptyBars = totalBars - filledBars;
        
        return '█'.repeat(filledBars) + '░'.repeat(emptyBars) + ' ';
    }
}
