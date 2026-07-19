import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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
            return ctx.sendMessage(`${emojis.general.error} You don't have a summer profile! Use \`${this.client.config.prefix}fish\` to start.`);
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
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `## ${emojis.currency.seashell} **Energy Item Shop**\n` +
                `**Welcome, ${ctx.author.username}!**`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Balance, info, and items all in one component
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `${emojis.currency.treasure} **Your Balance**\n` +
                `${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells\n` +
                `\n` +
                `**💡 How to get seashells:**\n` +
                `• Catch fish with \`${this.client.config.prefix}fish\`\n` +
                `• Sell fish with \`${this.client.config.prefix}sell\`\n` +
                `• Complete daily challenges\n` 
            )
        );

                container.addSeparatorComponents((separator) => separator.setDivider(true));

                 container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `**🛒 Available Items**\n` +
                `\n` +
                `🍪 **Small Snack** - ${emojis.currency.seashell} 400\n` +
                `_Restores +10 energy • Quick boost_\n` +
                `\n` +
                `🥤 **Energy Drink** - ${emojis.currency.seashell} 900\n` +
                `_Restores +20 energy • One more action_\n` +
                `\n` +
                `🍱 **Meal** - ${emojis.currency.seashell} 1,800\n` +
                `_Restores +35 energy • Extended session_\n` +
                `\n` +
                `🍗 **Feast** - ${emojis.currency.seashell} 4,500\n` +
                `_Restores +60 energy • Long play session_\n` +
                `\n` +
                `✨ **Full Restore** - ${emojis.currency.seashell} 12,000\n` +
                `_Restores +100 energy • FULL!_`
            )
        );
        
        // Show current inventory if player has items
        const items = profile.energyItems || {};
        const hasItems = Object.values(items).some(count => count > 0);
        
        if (hasItems) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            let inventoryText = '**🎒 Your Energy Items**\n';
            const itemEmojis = {
                smallSnack: '🍪',
                meal: '🍱',
                feast: '🍗',
                energyDrink: '🥤',
                fullRestore: '✨'
            };
            
            const itemNames = {
                smallSnack: 'Small Snack',
                meal: 'Meal',
                feast: 'Feast',
                energyDrink: 'Energy Drink',
                fullRestore: 'Full Restore'
            };

            let itemList = [];
            Object.entries(items).forEach(([item, count]) => {
                if (count > 0) {
                    itemList.push(`${itemEmojis[item]} ${itemNames[item]} x${count}`);
                }
            });
            
            inventoryText += itemList.join(' • ');
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(inventoryText)
            );
        }
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Footer
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `_💡 Click buttons below to purchase items!_\n` +
                `_⚡ Use items with \`${this.client.config.prefix}energy restore <item>\`_`
            )
        );

        // Create purchase buttons
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('buy_smallSnack')
                .setLabel('Small Snack (400)')
                .setEmoji('🍪')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('buy_energyDrink')
                .setLabel('Energy Drink (900)')
                .setEmoji('🥤')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('buy_meal')
                .setLabel('Meal (1.8k)')
                .setEmoji('🍱')
                .setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('buy_feast')
                .setLabel('Feast (4.5k)')
                .setEmoji('🍗')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('buy_fullRestore')
                .setLabel('Full Restore (12k)')
                .setEmoji('✨')
                .setStyle(ButtonStyle.Success)
        );

        const reply = await ctx.sendMessage({ components: [container, row1, row2] });

        // Handle button interactions
        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 120000 // 2 minutes
        });

        collector.on('collect', async interaction => {
            const itemPrices = {
                smallSnack: 400,
                energyDrink: 900,
                meal: 1800,
                feast: 4500,
                fullRestore: 12000
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
                    `💡 Use with \`${this.client.config.prefix}energy restore ${item}\``,
                ephemeral: true
            });

            // Update the container to show new balance
            const updatedContainer = this.client.container()
                .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
            
            // Header
            updatedContainer.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `## ${emojis.currency.seashell} **Energy Item Shop**\n` +
                    `**Welcome, ${ctx.author.username}!**`
                )
            );
            
            updatedContainer.addSeparatorComponents((separator) => separator.setDivider(true));
            
            // Balance, info, and items all in one component
            updatedContainer.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `${emojis.currency.treasure} **Your Balance**\n` +
                    `${emojis.currency.seashell} **${updatedProfile.seashells.toLocaleString()}** seashells\n` +
                    `\n` +
                    `**💡 How to get seashells:**\n` +
                    `• Catch fish with \`${this.client.config.prefix}fish\`\n` +
                    `• Sell fish with \`${this.client.config.prefix}sell\`\n` +
                    `• Complete daily challenges\n` +
                    `\n` +
                    `**🛒 Available Items**\n` +
                    `\n` +
                    `🍪 **Small Snack** - ${emojis.currency.seashell} 400\n` +
                    `_Restores +10 energy • Quick boost_\n` +
                    `\n` +
                    `🥤 **Energy Drink** - ${emojis.currency.seashell} 900\n` +
                    `_Restores +20 energy • One more action_\n` +
                    `\n` +
                    `🍱 **Meal** - ${emojis.currency.seashell} 1,800\n` +
                    `_Restores +35 energy • Extended session_\n` +
                    `\n` +
                    `🍗 **Feast** - ${emojis.currency.seashell} 4,500\n` +
                    `_Restores +60 energy • Long play session_\n` +
                    `\n` +
                    `✨ **Full Restore** - ${emojis.currency.seashell} 12,000\n` +
                    `_Restores +100 energy • FULL!_`
                )
            );
            
            updatedContainer.addSeparatorComponents((separator) => separator.setDivider(true));
            
            // Update inventory display
            let inventoryText = '**🎒 Your Energy Items**\n';
            let itemList = [];
            Object.entries(updatedProfile.energyItems).forEach(([itemKey, count]) => {
                if (count > 0) {
                    const emoji = itemEmojis[itemKey];
                    const name = itemNames[itemKey];
                    itemList.push(`${emoji} ${name} x${count}`);
                }
            });
            
            if (itemList.length > 0) {
                updatedContainer.addSeparatorComponents((separator) => separator.setDivider(true));
                inventoryText += itemList.join(' • ');
                updatedContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(inventoryText)
                );
            }
            
            updatedContainer.addSeparatorComponents((separator) => separator.setDivider(true));
            
            // Footer
            updatedContainer.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `_💡 Click buttons below to purchase items!_\n` +
                    `_⚡ Use items with \`${this.client.config.prefix}energy restore <item>\`_`
                )
            );

            await reply.edit({ components: [updatedContainer, row1, row2] }).catch(() => {});
        });

        collector.on('end', () => {
            reply.edit({ components: [] }).catch(() => {});
        });
    }
}
