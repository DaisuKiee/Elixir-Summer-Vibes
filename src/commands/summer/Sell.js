import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { fishData } from '../../data/fish.js';
import emojis from '../../config/emojis.js';

export default class Sell extends Command {
    constructor(client) {
        super(client, {
            name: 'sell',
            description: '💰 Sell your fish for seashells',
            usage: 'sell <index|all|rarity>',
            examples: ['sell 1', 'sell all', 'sell common', 'sell 1-5'],
            aliases: ['selfish', 'market'],
            category: 'summer',
            cooldown: 3,
        });
    }

    async run(ctx, args) {
        const profile = await SummerProfile.findById(ctx.author.id);
        if (!profile) {
            return ctx.sendMessage(`${emojis.general.error} You don't have a summer profile! Use \`!fish\` to start fishing.`);
        }

        if (profile.fishInventory.length === 0) {
            return ctx.sendMessage(`${emojis.general.error} You don't have any fish to sell! Use \`!fish\` to catch some.`);
        }

        // No args - show interactive menu
        if (!args[0]) {
            return this.showSellMenu(ctx, profile);
        }

        const input = args.join(' ').toLowerCase();

        // Sell all fish
        if (input === 'all') {
            return this.sellAll(ctx, profile);
        }

        // Sell by rarity
        const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
        if (validRarities.includes(input)) {
            return this.sellByRarity(ctx, profile, input);
        }

        // Sell by range (e.g., 1-5)
        if (input.includes('-')) {
            const [start, end] = input.split('-').map(n => parseInt(n));
            if (isNaN(start) || isNaN(end)) {
                return ctx.sendMessage(`${emojis.general.error} Invalid range format! Use: \`!sell 1-5\``);
            }
            return this.sellRange(ctx, profile, start, end);
        }

        // Sell by index
        const index = parseInt(input);
        if (isNaN(index)) {
            return ctx.sendMessage(`${emojis.general.error} Invalid input! Use: \`!sell <index|all|rarity>\``);
        }

        return this.sellByIndex(ctx, profile, index);
    }

    async showSellMenu(ctx, profile) {
        const embed = new EmbedBuilder()
            .setColor(this.client.color?.sell || '#f39c12')
            .setAuthor({ name: `${ctx.author.username}'s Fish Market`, iconURL: ctx.author.displayAvatarURL() })
            .setTitle(`${emojis.currency.seashell} Fish Selling Menu`)
            .setDescription(
                `You have **${profile.fishInventory.length}** fish in your inventory.\n` +
                `Current balance: ${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells\n\n` +
                `**How to sell:**\n` +
                `\`!sell <index>\` - Sell specific fish (e.g., \`!sell 1\`)\n` +
                `\`!sell <range>\` - Sell range (e.g., \`!sell 1-5\`)\n` +
                `\`!sell all\` - Sell all fish\n` +
                `\`!sell <rarity>\` - Sell by rarity (e.g., \`!sell common\`)`
            );

        // Calculate total value
        let totalValue = 0;
        const rarityCount = {};
        const rarityValue = {};

        profile.fishInventory.forEach(fish => {
            const fishInfo = this.getFishInfo(fish.name, fish.rarity);
            const value = this.calculateFishValue(fish, fishInfo, profile);
            totalValue += value;

            if (!rarityCount[fish.rarity]) {
                rarityCount[fish.rarity] = 0;
                rarityValue[fish.rarity] = 0;
            }
            rarityCount[fish.rarity]++;
            rarityValue[fish.rarity] += value;
        });

        // Show rarity breakdown
        let breakdown = '';
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
        rarities.forEach(rarity => {
            if (rarityCount[rarity]) {
                const emoji = emojis.rarity[rarity] || '⚪';
                breakdown += `${emoji} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**: ${rarityCount[rarity]} fish (${emojis.currency.seashell} ${rarityValue[rarity].toLocaleString()})\n`;
            }
        });

        if (breakdown) {
            embed.addFields({
                name: `${emojis.fish.fishGeneral} Inventory Breakdown`,
                value: breakdown,
                inline: false
            });
        }

        embed.addFields({
            name: `${emojis.currency.treasure} Total Inventory Value`,
            value: `${emojis.currency.seashell} **${totalValue.toLocaleString()}** seashells`,
            inline: false
        });

        // Quick sell buttons
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('sell_all_common')
                .setLabel('Sell All Common')
                .setEmoji(emojis.rarity.common)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('sell_all')
                .setLabel('Sell All')
                .setEmoji(emojis.currency.seashell)
                .setStyle(ButtonStyle.Danger)
        );

        embed.setFooter({ text: '💡 Tip: Upgrade your equipment for better catches!' });
        embed.setTimestamp();

        const reply = await ctx.sendMessage({ embeds: [embed], components: [buttons] });

        // Handle button interactions
        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 60000
        });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'sell_all_common') {
                await interaction.deferUpdate();
                await this.sellByRarity(ctx, profile, 'common', interaction);
            } else if (interaction.customId === 'sell_all') {
                await interaction.deferUpdate();
                await this.sellAll(ctx, profile, interaction);
            }
        });

        collector.on('end', () => {
            reply.edit({ components: [] }).catch(() => {});
        });
    }

    async sellByIndex(ctx, profile, index) {
        if (index < 1 || index > profile.fishInventory.length) {
            return ctx.sendMessage(`${emojis.general.error} Invalid index! You have ${profile.fishInventory.length} fish. Use \`!inventory\` to see your fish.`);
        }

        const fish = profile.fishInventory[index - 1];
        const fishInfo = this.getFishInfo(fish.name, fish.rarity);
        const value = this.calculateFishValue(fish, fishInfo, profile);

        // Remove fish and add seashells
        profile.fishInventory.splice(index - 1, 1);
        profile.seashells += value;
        await profile.save();

        const rarityEmoji = emojis.rarity[fish.rarity] || '⚪';
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`${emojis.general.success} Fish Sold!`)
            .setDescription(
                `You sold **${fish.name}** ${rarityEmoji}\n` +
                `Weight: **${fish.weight.toFixed(2)}kg**\n` +
                `Earned: ${emojis.currency.seashell} **${value.toLocaleString()}** seashells`
            )
            .addFields({
                name: `${emojis.currency.treasure} New Balance`,
                value: `${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells`,
                inline: false
            })
            .setFooter({ text: `Fish remaining: ${profile.fishInventory.length}` })
            .setTimestamp();

        return ctx.sendMessage({ embeds: [embed] });
    }

    async sellRange(ctx, profile, start, end) {
        if (start < 1 || end > profile.fishInventory.length || start > end) {
            return ctx.sendMessage(`${emojis.general.error} Invalid range! You have ${profile.fishInventory.length} fish.`);
        }

        const fishToSell = profile.fishInventory.slice(start - 1, end);
        let totalValue = 0;
        const soldFish = {};

        fishToSell.forEach(fish => {
            const fishInfo = this.getFishInfo(fish.name, fish.rarity);
            const value = this.calculateFishValue(fish, fishInfo, profile);
            totalValue += value;

            if (!soldFish[fish.rarity]) soldFish[fish.rarity] = 0;
            soldFish[fish.rarity]++;
        });

        // Remove fish and add seashells
        profile.fishInventory.splice(start - 1, end - start + 1);
        profile.seashells += totalValue;
        await profile.save();

        let breakdown = '';
        Object.keys(soldFish).forEach(rarity => {
            const emoji = emojis.rarity[rarity] || '⚪';
            breakdown += `${emoji} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**: ${soldFish[rarity]} fish\n`;
        });

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`${emojis.general.success} Fish Sold!`)
            .setDescription(`You sold **${fishToSell.length}** fish from slots ${start} to ${end}!`)
            .addFields(
                {
                    name: `${emojis.fish.fishGeneral} Fish Sold`,
                    value: breakdown,
                    inline: false
                },
                {
                    name: `${emojis.currency.seashell} Earned`,
                    value: `**${totalValue.toLocaleString()}** seashells`,
                    inline: true
                },
                {
                    name: `${emojis.currency.treasure} New Balance`,
                    value: `**${profile.seashells.toLocaleString()}** seashells`,
                    inline: true
                }
            )
            .setFooter({ text: `Fish remaining: ${profile.fishInventory.length}` })
            .setTimestamp();

        return ctx.sendMessage({ embeds: [embed] });
    }

    async sellByRarity(ctx, profile, rarity, interaction = null) {
        const fishToSell = profile.fishInventory.filter(f => f.rarity === rarity);
        
        if (fishToSell.length === 0) {
            const msg = `${emojis.general.error} You don't have any **${rarity}** fish to sell!`;
            return interaction ? interaction.followUp({ content: msg, ephemeral: true }) : ctx.sendMessage(msg);
        }

        let totalValue = 0;
        fishToSell.forEach(fish => {
            const fishInfo = this.getFishInfo(fish.name, fish.rarity);
            totalValue += this.calculateFishValue(fish, fishInfo, profile);
        });

        // Remove fish and add seashells
        profile.fishInventory = profile.fishInventory.filter(f => f.rarity !== rarity);
        profile.seashells += totalValue;
        await profile.save();

        const rarityEmoji = emojis.rarity[rarity] || '⚪';
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`${emojis.general.success} Fish Sold!`)
            .setDescription(`You sold all **${rarity}** fish! ${rarityEmoji}`)
            .addFields(
                {
                    name: `${emojis.fish.fishGeneral} Fish Sold`,
                    value: `**${fishToSell.length}** ${rarity} fish`,
                    inline: true
                },
                {
                    name: `${emojis.currency.seashell} Earned`,
                    value: `**${totalValue.toLocaleString()}** seashells`,
                    inline: true
                },
                {
                    name: `${emojis.currency.treasure} New Balance`,
                    value: `**${profile.seashells.toLocaleString()}** seashells`,
                    inline: false
                }
            )
            .setFooter({ text: `Fish remaining: ${profile.fishInventory.length}` })
            .setTimestamp();

        return interaction ? interaction.followUp({ embeds: [embed] }) : ctx.sendMessage({ embeds: [embed] });
    }

    async sellAll(ctx, profile, interaction = null) {
        let totalValue = 0;
        const soldFish = {};

        profile.fishInventory.forEach(fish => {
            const fishInfo = this.getFishInfo(fish.name, fish.rarity);
            const value = this.calculateFishValue(fish, fishInfo, profile);
            totalValue += value;

            if (!soldFish[fish.rarity]) soldFish[fish.rarity] = 0;
            soldFish[fish.rarity]++;
        });

        const totalFish = profile.fishInventory.length;

        // Clear inventory and add seashells
        profile.fishInventory = [];
        profile.seashells += totalValue;
        await profile.save();

        let breakdown = '';
        Object.keys(soldFish).forEach(rarity => {
            const emoji = emojis.rarity[rarity] || '⚪';
            breakdown += `${emoji} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**: ${soldFish[rarity]} fish\n`;
        });

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`${emojis.general.success} All Fish Sold!`)
            .setDescription(`You sold **${totalFish}** fish!`)
            .addFields(
                {
                    name: `${emojis.fish.fishGeneral} Fish Sold`,
                    value: breakdown,
                    inline: false
                },
                {
                    name: `${emojis.currency.seashell} Total Earned`,
                    value: `**${totalValue.toLocaleString()}** seashells`,
                    inline: true
                },
                {
                    name: `${emojis.currency.treasure} New Balance`,
                    value: `**${profile.seashells.toLocaleString()}** seashells`,
                    inline: true
                }
            )
            .setFooter({ text: '💡 Use !equipment to upgrade your gear!' })
            .setTimestamp();

        return interaction ? interaction.followUp({ embeds: [embed] }) : ctx.sendMessage({ embeds: [embed] });
    }

    getFishInfo(fishName, rarity) {
        const rarityPool = fishData[rarity];
        if (!rarityPool) return null;
        return rarityPool.find(f => f.name === fishName);
    }

    calculateFishValue(fish, fishInfo, profile) {
        if (!fishInfo) return 50; // Default value

        let baseValue = fishInfo.value || 50;

        // Weight bonus (heavier fish worth more)
        const weightPercent = (fish.weight - fishInfo.minWeight) / (fishInfo.maxWeight - fishInfo.minWeight);
        const weightBonus = 1 + (weightPercent * 0.3); // Up to 30% bonus

        // Equipment bonus from fishing rod
        const equipment = profile.equipment || {};
        const rodLevel = equipment.rod?.level || 1;
        const rodBonus = 1 + ((rodLevel - 1) * 0.05); // 5% per level

        const finalValue = Math.floor(baseValue * weightBonus * rodBonus);
        return finalValue;
    }
}
