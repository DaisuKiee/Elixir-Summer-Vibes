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
            return ctx.sendMessage(`${emojis.general.error} You don't have a summer profile! Use \`${this.client.config.prefix}fish\` to start fishing.`);
        }

        if (profile.fishInventory.length === 0) {
            return ctx.sendMessage(`${emojis.general.error} You don't have any fish to sell! Use \`${this.client.config.prefix}fish\` to catch some.`);
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
                return ctx.sendMessage(`${emojis.general.error} Invalid range format! Use: \`${this.client.config.prefix}sell 1-5\``);
            }
            return this.sellRange(ctx, profile, start, end);
        }

        // Sell by index
        const index = parseInt(input);
        if (isNaN(index)) {
            return ctx.sendMessage(`${emojis.general.error} Invalid input! Use: \`${this.client.config.prefix}sell <index|all|rarity>\``);
        }

        return this.sellByIndex(ctx, profile, index);
    }

    async showSellMenu(ctx, profile) {
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **${emojis.currency.seashell} Fish Selling Menu**\n> _You have **${profile.fishInventory.length}** fish in your inventory._\n> _Current balance: ${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `> **How to sell:**\n` +
                `> \`${this.client.config.prefix}sell <index>\` - Sell specific fish (e.g., \`${this.client.config.prefix}sell 1\`)\n` +
                `> \`${this.client.config.prefix}sell <range>\` - Sell range (e.g., \`${this.client.config.prefix}sell 1-5\`)\n` +
                `> \`${this.client.config.prefix}sell all\` - Sell all fish\n` +
                `> \`${this.client.config.prefix}sell <rarity>\` - Sell by rarity (e.g., \`${this.client.config.prefix}sell common\`)`
            )
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
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        let breakdown = `> **${emojis.fish.fishGeneral} Inventory Breakdown**\n`;
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
        rarities.forEach(rarity => {
            if (rarityCount[rarity]) {
                const emoji = emojis.rarity[rarity] || '⚪';
                breakdown += `> ${emoji} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**: ${rarityCount[rarity]} fish (${emojis.currency.seashell} ${rarityValue[rarity].toLocaleString()})\n`;
            }
        });
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(breakdown)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **${emojis.currency.treasure} Total Inventory Value**\n> ${emojis.currency.seashell} **${totalValue.toLocaleString()}** seashells`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💡 Tip:** Upgrade your equipment for better catches!`)
        );
        
        // Create components using Discord.js builders
        const components = [];
        
        // Add fish select menu (max 25 options)
        if (profile.fishInventory.length > 0) {
            const fishOptions = profile.fishInventory.slice(0, 25).map((fish, index) => {
                const fishInfo = this.getFishInfo(fish.name, fish.rarity);
                const value = this.calculateFishValue(fish, fishInfo, profile);
                const rarityEmoji = emojis.rarity[fish.rarity] || '⚪';
                
                return {
                    label: `${fish.name} (${fish.rarity})`.substring(0, 100), // Discord limit
                    description: `${fish.weight.toFixed(2)}kg - ${value.toLocaleString()} seashells`.substring(0, 100),
                    value: `fish_${index}`,
                    emoji: rarityEmoji
                };
            });
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`sell_fish_select_${ctx.author.id}`)
                .setPlaceholder('Select fish to sell...')
                .setMinValues(1)
                .setMaxValues(Math.min(fishOptions.length, 25))
                .addOptions(fishOptions);
            
            const selectRow = new ActionRowBuilder().addComponents(selectMenu);
            components.push(selectRow);
        }
        
        // Quick sell buttons
        const sellCommonButton = new ButtonBuilder()
            .setCustomId(`sell_all_common_${ctx.author.id}`)
            .setLabel('Sell All Common')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(emojis.rarity.common || '🟢');
        
        const sellAllButton = new ButtonBuilder()
            .setCustomId(`sell_all_${ctx.author.id}`)
            .setLabel('Sell All')
            .setStyle(ButtonStyle.Danger)
            .setEmoji(emojis.currency.seashell || '🐚');
        
        const buttonRow = new ActionRowBuilder().addComponents(sellCommonButton, sellAllButton);
        components.push(buttonRow);
        
        const reply = await ctx.sendMessage({ components: [container, ...components] });
        
        // Handle button interactions
        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id && (i.customId.includes('sell_')),
            time: 300000 // 5 minutes
        });
        
        collector.on('collect', async interaction => {
            await interaction.deferReply().catch(() => {});
            
            // Reload profile
            const updatedProfile = await SummerProfile.findById(ctx.author.id);
            
            if (interaction.customId === `sell_all_common_${ctx.author.id}`) {
                await this.sellByRarity(ctx, updatedProfile, 'common', interaction);
            } else if (interaction.customId === `sell_all_${ctx.author.id}`) {
                await this.sellAll(ctx, updatedProfile, interaction);
            } else if (interaction.customId === `sell_fish_select_${ctx.author.id}`) {
                // Handle fish selection
                const selectedIndices = interaction.values.map(v => parseInt(v.replace('fish_', '')));
                
                let totalValue = 0;
                const soldFish = {};
                let removedFromAquarium = 0;
                
                // Sort in reverse to avoid index shifting
                selectedIndices.sort((a, b) => b - a);
                
                for (const index of selectedIndices) {
                    if (index >= 0 && index < updatedProfile.fishInventory.length) {
                        const fish = updatedProfile.fishInventory[index];
                        const fishInfo = this.getFishInfo(fish.name, fish.rarity);
                        const value = this.calculateFishValue(fish, fishInfo, updatedProfile);
                        totalValue += value;
                        
                        if (!soldFish[fish.rarity]) soldFish[fish.rarity] = 0;
                        soldFish[fish.rarity]++;
                        
                        // Check if fish is in aquarium
                        const aquarium = updatedProfile.aquarium || [];
                        const aquariumIndex = aquarium.findIndex(af => 
                            af.fishName === fish.name && 
                            af.weight === fish.weight && 
                            new Date(af.caughtAt).getTime() === new Date(fish.caughtAt).getTime()
                        );
                        
                        if (aquariumIndex !== -1) {
                            updatedProfile.aquarium.splice(aquariumIndex, 1);
                            removedFromAquarium++;
                        }
                        
                        updatedProfile.fishInventory.splice(index, 1);
                    }
                }
                
                updatedProfile.seashells += totalValue;
                await updatedProfile.save();
                
                let breakdown = '';
                Object.keys(soldFish).forEach(rarity => {
                    const emoji = emojis.rarity[rarity] || '⚪';
                    breakdown += `${emoji} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**: ${soldFish[rarity]} fish\n`;
                });
                
                const { EmbedBuilder } = await import('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle(`${emojis.general.success} Fish Sold!`)
                    .setDescription(
                        `You sold **${selectedIndices.length}** fish!` +
                        (removedFromAquarium > 0 ? `\n🌊 _${removedFromAquarium} fish removed from aquarium_` : '')
                    )
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
                            value: `**${updatedProfile.seashells.toLocaleString()}** seashells`,
                            inline: true
                        }
                    )
                    .setFooter({ text: `Fish remaining: ${updatedProfile.fishInventory.length}` })
                    .setTimestamp();
                
                await interaction.followUp({ embeds: [embed] });
            }
        });
        
        collector.on('end', () => {
            reply.edit({ components: [container] }).catch(() => {});
        });
        
        return reply;
    }

    async sellByIndex(ctx, profile, index) {
        if (index < 1 || index > profile.fishInventory.length) {
            return ctx.sendMessage(`${emojis.general.error} Invalid index! You have ${profile.fishInventory.length} fish. Use \`!inventory\` to see your fish.`);
        }

        const fish = profile.fishInventory[index - 1];
        const fishInfo = this.getFishInfo(fish.name, fish.rarity);
        const value = this.calculateFishValue(fish, fishInfo, profile);

        // Check if fish is in aquarium
        const aquarium = profile.aquarium || [];
        const aquariumIndex = aquarium.findIndex(af => 
            af.fishName === fish.name && 
            af.weight === fish.weight && 
            new Date(af.caughtAt).getTime() === new Date(fish.caughtAt).getTime()
        );
        
        // Remove from aquarium if present
        if (aquariumIndex !== -1) {
            profile.aquarium.splice(aquariumIndex, 1);
        }

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
                `Earned: ${emojis.currency.seashell} **${value.toLocaleString()}** seashells` +
                (aquariumIndex !== -1 ? '\n🌊 _Removed from aquarium_' : '')
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
        let removedFromAquarium = 0;

        fishToSell.forEach(fish => {
            const fishInfo = this.getFishInfo(fish.name, fish.rarity);
            const value = this.calculateFishValue(fish, fishInfo, profile);
            totalValue += value;

            if (!soldFish[fish.rarity]) soldFish[fish.rarity] = 0;
            soldFish[fish.rarity]++;
            
            // Check if fish is in aquarium and remove it
            const aquarium = profile.aquarium || [];
            const aquariumIndex = aquarium.findIndex(af => 
                af.fishName === fish.name && 
                af.weight === fish.weight && 
                new Date(af.caughtAt).getTime() === new Date(fish.caughtAt).getTime()
            );
            
            if (aquariumIndex !== -1) {
                profile.aquarium.splice(aquariumIndex, 1);
                removedFromAquarium++;
            }
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
            .setDescription(
                `You sold **${fishToSell.length}** fish from slots ${start} to ${end}!` +
                (removedFromAquarium > 0 ? `\n🌊 _${removedFromAquarium} fish removed from aquarium_` : '')
            )
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
        let removedFromAquarium = 0;
        
        fishToSell.forEach(fish => {
            const fishInfo = this.getFishInfo(fish.name, fish.rarity);
            totalValue += this.calculateFishValue(fish, fishInfo, profile);
            
            // Check if fish is in aquarium and remove it
            const aquarium = profile.aquarium || [];
            const aquariumIndex = aquarium.findIndex(af => 
                af.fishName === fish.name && 
                af.weight === fish.weight && 
                new Date(af.caughtAt).getTime() === new Date(fish.caughtAt).getTime()
            );
            
            if (aquariumIndex !== -1) {
                profile.aquarium.splice(aquariumIndex, 1);
                removedFromAquarium++;
            }
        });

        // Remove fish and add seashells
        profile.fishInventory = profile.fishInventory.filter(f => f.rarity !== rarity);
        profile.seashells += totalValue;
        await profile.save();

        const rarityEmoji = emojis.rarity[rarity] || '⚪';
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`${emojis.general.success} Fish Sold!`)
            .setDescription(
                `You sold all **${rarity}** fish! ${rarityEmoji}` +
                (removedFromAquarium > 0 ? `\n🌊 _${removedFromAquarium} fish removed from aquarium_` : '')
            )
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
        let removedFromAquarium = 0;

        profile.fishInventory.forEach(fish => {
            const fishInfo = this.getFishInfo(fish.name, fish.rarity);
            const value = this.calculateFishValue(fish, fishInfo, profile);
            totalValue += value;

            if (!soldFish[fish.rarity]) soldFish[fish.rarity] = 0;
            soldFish[fish.rarity]++;
            
            // Check if fish is in aquarium and remove it
            const aquarium = profile.aquarium || [];
            const aquariumIndex = aquarium.findIndex(af => 
                af.fishName === fish.name && 
                af.weight === fish.weight && 
                new Date(af.caughtAt).getTime() === new Date(fish.caughtAt).getTime()
            );
            
            if (aquariumIndex !== -1) {
                profile.aquarium.splice(aquariumIndex, 1);
                removedFromAquarium++;
            }
        });

        const totalFish = profile.fishInventory.length;

        // Clear inventory and add seashells
        profile.fishInventory = [];
        profile.aquarium = []; // Clear aquarium since all fish are sold
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
            .setDescription(
                `You sold **${totalFish}** fish!` +
                (removedFromAquarium > 0 ? `\n🌊 _Aquarium cleared (${removedFromAquarium} fish)_` : '')
            )
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

        // First, check if this fish itself has mutations (from inventory)
        if (fish.currentValue && fish.totalMutations > 0) {
            return fish.currentValue;
        }

        // Check if fish is in aquarium and has mutated value
        const aquarium = profile.aquarium || [];
        const aquariumFish = aquarium.find(af => 
            af.fishName === fish.name && 
            af.weight === fish.weight && 
            new Date(af.caughtAt).getTime() === new Date(fish.caughtAt).getTime()
        );
        
        // If fish is in aquarium with mutations, use the mutated value
        if (aquariumFish && aquariumFish.currentValue && aquariumFish.totalMutations > 0) {
            return aquariumFish.currentValue;
        }

        // Otherwise calculate normal value
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
