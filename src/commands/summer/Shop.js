import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import emojis from '../../config/emojis.js';
import { energyConfig } from '../../data/energySystem.js';

export default class Shop extends Command {
    constructor(client) {
        super(client, {
            name: 'shop',
            description: '🛒 Buy energy items and other goods with seashells',
            usage: 'shop [category]',
            examples: ['shop', 'shop energy'],
            aliases: ['store', 'market', 'buy'],
            category: 'summer',
            cooldown: 3,
        });
    }

    async run(ctx, args) {
        const profile = await SummerProfile.findById(ctx.author.id);
        if (!profile) {
            return ctx.sendMessage(`${emojis.general.error} You don't have a summer profile! Use \`!fish\` to start.`);
        }

        // Initialize energy items if needed
        if (!profile.energyItems) {
            profile.energyItems = {
                smallSnack: 0,
                meal: 0,
                feast: 0,
                energyDrink: 0,
                fullRestore: 0
            };
            await profile.save();
        }

        const category = args[0]?.toLowerCase();

        // For now, we only have energy items
        // Can expand later with cosmetics, bait, etc.
        return this.showEnergyShop(ctx, profile);
    }

    async showEnergyShop(ctx, profile) {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setAuthor({ 
                name: `${ctx.author.username}'s Shop`, 
                iconURL: ctx.author.displayAvatarURL() 
            })
            .setTitle(`${emojis.currency.seashell} Energy Item Shop`)
            .setDescription(
                `**Welcome to the shop!** Purchase energy restoration items with seashells.\n\n` +
                `${emojis.currency.treasure} **Your Balance:** ${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells\n\n` +
                `💡 **How to get seashells:**\n` +
                `• Catch fish with \`!fish\`\n` +
                `• Sell fish with \`!sell\`\n` +
                `• Complete daily challenges\n\n` +
                `⚡ **Need energy now?** Use items with \`!energy restore <item>\``
            )
            .addFields(
                {
                    name: '🍪 Small Snack',
                    value: 
                        `**Restores:** +10 energy\n` +
                        `**Price:** ${emojis.currency.seashell} 500 seashells\n` +
                        `**Best for:** Quick energy boost`,
                    inline: true
                },
                {
                    name: '🥤 Energy Drink',
                    value: 
                        `**Restores:** +15 energy\n` +
                        `**Price:** ${emojis.currency.seashell} 1,000 seashells\n` +
                        `**Best for:** One more action`,
                    inline: true
                },
                {
                    name: '🍱 Meal',
                    value: 
                        `**Restores:** +25 energy\n` +
                        `**Price:** ${emojis.currency.seashell} 2,000 seashells\n` +
                        `**Best for:** Extended session`,
                    inline: true
                },
                {
                    name: '🍗 Feast',
                    value: 
                        `**Restores:** +50 energy\n` +
                        `**Price:** ${emojis.currency.seashell} 5,000 seashells\n` +
                        `**Best for:** Long play session`,
                    inline: true
                },
                {
                    name: '✨ Full Restore',
                    value: 
                        `**Restores:** +100 energy (FULL!)\n` +
                        `**Price:** ${emojis.currency.seashell} 15,000 seashells\n` +
                        `**Best for:** Emergency`,
                    inline: true
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true
                }
            );

        // Show current inventory
        const items = profile.energyItems || {};
        const hasItems = Object.values(items).some(count => count > 0);
        
        if (hasItems) {
            let inventoryText = '';
            const itemEmojis = {
                smallSnack: '🍪',
                meal: '🍱',
                feast: '🍗',
                energyDrink: '🥤',
                fullRestore: '✨'
            };

            Object.entries(items).forEach(([item, count]) => {
                if (count > 0) {
                    const emoji = itemEmojis[item];
                    inventoryText += `${emoji} x${count}  `;
                }
            });

            if (inventoryText) {
                embed.addFields({
                    name: '🎒 Your Energy Items',
                    value: inventoryText.trim() || 'None',
                    inline: false
                });
            }
        }

        embed.setFooter({ text: '💡 Click buttons below to purchase items!' })
            .setTimestamp();

        // Create purchase buttons
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('buy_smallSnack')
                .setLabel('Small Snack (500)')
                .setEmoji('🍪')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('buy_energyDrink')
                .setLabel('Energy Drink (1k)')
                .setEmoji('🥤')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('buy_meal')
                .setLabel('Meal (2k)')
                .setEmoji('🍱')
                .setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('buy_feast')
                .setLabel('Feast (5k)')
                .setEmoji('🍗')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('buy_fullRestore')
                .setLabel('Full Restore (15k)')
                .setEmoji('✨')
                .setStyle(ButtonStyle.Success)
        );

        const reply = await ctx.sendMessage({ embeds: [embed], components: [row1, row2] });

        // Handle button interactions
        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 120000 // 2 minutes
        });

        collector.on('collect', async interaction => {
            const itemPrices = {
                smallSnack: 500,
                energyDrink: 1000,
                meal: 2000,
                feast: 5000,
                fullRestore: 15000
            };

            const itemNames = {
                smallSnack: 'Small Snack',
                meal: 'Meal',
                feast: 'Feast',
                energyDrink: 'Energy Drink',
                fullRestore: 'Full Restore'
            };

            const itemEmojis = {
                smallSnack: '🍪',
                meal: '🍱',
                feast: '🍗',
                energyDrink: '🥤',
                fullRestore: '✨'
            };

            const item = interaction.customId.replace('buy_', '');
            const price = itemPrices[item];

            // Refresh profile
            const updatedProfile = await SummerProfile.findById(ctx.author.id);
            
            if (!updatedProfile.energyItems) {
                updatedProfile.energyItems = {
                    smallSnack: 0,
                    meal: 0,
                    feast: 0,
                    energyDrink: 0,
                    fullRestore: 0
                };
            }

            // Check if user can afford
            if (updatedProfile.seashells < price) {
                const needed = price - updatedProfile.seashells;
                await interaction.reply({
                    content: 
                        `${emojis.general.error} **Not enough seashells!**\n\n` +
                        `${emojis.currency.seashell} You need **${price.toLocaleString()}** seashells\n` +
                        `${emojis.currency.seashell} You have **${updatedProfile.seashells.toLocaleString()}** seashells\n` +
                        `${emojis.currency.seashell} You need **${needed.toLocaleString()}** more!\n\n` +
                        `💡 Catch and sell fish to earn seashells!`,
                    ephemeral: true
                });
                return;
            }

            // Purchase item
            updatedProfile.seashells -= price;
            if (!updatedProfile.energyItems[item]) updatedProfile.energyItems[item] = 0;
            updatedProfile.energyItems[item]++;
            await updatedProfile.save();

            const restoreAmount = energyConfig.restoration[item];

            await interaction.reply({
                content: 
                    `${emojis.general.success} **Purchase Successful!**\n\n` +
                    `${itemEmojis[item]} Bought **${itemNames[item]}** (+${restoreAmount} energy)\n` +
                    `${emojis.currency.seashell} Paid **${price.toLocaleString()}** seashells\n` +
                    `${emojis.currency.treasure} Balance: **${updatedProfile.seashells.toLocaleString()}** seashells\n` +
                    `📦 **${itemNames[item]}** owned: **${updatedProfile.energyItems[item]}**\n\n` +
                    `💡 Use with \`!energy restore ${item}\``,
                ephemeral: true
            });

            // Update the embed to show new balance
            const updatedEmbed = EmbedBuilder.from(embed)
                .setDescription(
                    `**Welcome to the shop!** Purchase energy restoration items with seashells.\n\n` +
                    `${emojis.currency.treasure} **Your Balance:** ${emojis.currency.seashell} **${updatedProfile.seashells.toLocaleString()}** seashells\n\n` +
                    `💡 **How to get seashells:**\n` +
                    `• Catch fish with \`!fish\`\n` +
                    `• Sell fish with \`!sell\`\n` +
                    `• Complete daily challenges\n\n` +
                    `⚡ **Need energy now?** Use items with \`!energy restore <item>\``
                );

            // Update inventory display
            let inventoryText = '';
            Object.entries(updatedProfile.energyItems).forEach(([itemKey, count]) => {
                if (count > 0) {
                    const emoji = itemEmojis[itemKey];
                    inventoryText += `${emoji} x${count}  `;
                }
            });

            if (inventoryText) {
                const fields = updatedEmbed.data.fields;
                const inventoryFieldIndex = fields.findIndex(f => f.name === '🎒 Your Energy Items');
                
                if (inventoryFieldIndex >= 0) {
                    fields[inventoryFieldIndex].value = inventoryText.trim();
                } else {
                    updatedEmbed.addFields({
                        name: '🎒 Your Energy Items',
                        value: inventoryText.trim(),
                        inline: false
                    });
                }
            }

            await reply.edit({ embeds: [updatedEmbed] }).catch(() => {});
        });

        collector.on('end', () => {
            reply.edit({ components: [] }).catch(() => {});
        });
    }
}
