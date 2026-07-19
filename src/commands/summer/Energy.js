import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { calculateCurrentEnergy, formatEnergyDisplay, getTimeUntilFull, getEnergyRecommendations, energyConfig, restoreEnergy, updateEnergy } from '../../data/energySystem.js';
import emojis from '../../config/emojis.js';

export default class Energy extends Command {
    constructor(client) {
        super(client, {
            name: 'energy',
            description: 'Check your energy level, restore energy, or view energy items',
            usage: 'energy [restore <item>|shop]',
            examples: ['energy', 'energy restore meal', 'energy shop'],
            aliases: ['stamina', 'power', 'status'],
            category: 'summer',
            cooldown: 3,
        });
    }
    
    async run(ctx, args) {
        // Get profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: ctx.author.id,
                username: ctx.author.username
            });
            await profile.save();
        }
        
        // Initialize energy if needed
        if (!profile.energy) {
            profile.energy = energyConfig.maxEnergy;
            profile.lastEnergyUpdate = new Date();
            await profile.save();
        }

        // Initialize energy items inventory if needed
        if (!profile.energyItems) {
            profile.energyItems = {
                smallSnack: 0,
                meal: 0,
                feast: 0,
                energyDrink: 0,
                fullRestore: 0
            };
        }

        // Handle subcommands
        const subcommand = args[0]?.toLowerCase();
        
        if (subcommand === 'restore' || subcommand === 'use') {
            return this.restoreEnergy(ctx, profile, args[1]);
        }
        
        if (subcommand === 'shop' || subcommand === 'buy') {
            return ctx.sendMessage(`${emojis.general.info} Use \`!shop\` to buy energy items with seashells!`);
        }
        
        // Default: show energy status
        return this.showEnergyStatus(ctx, profile);
    }

    async showEnergyStatus(ctx, profile) {
        // Calculate current energy
        const currentEnergy = calculateCurrentEnergy(profile);
        const energyDisplay = formatEnergyDisplay(profile);
        const timeInfo = getTimeUntilFull(profile);

        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `## ⚡ **Energy Status**\n` +
                `**${ctx.author.username}**`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Energy bar and status
        const energyPercent = Math.floor((currentEnergy / energyConfig.maxEnergy) * 100);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `${energyDisplay.bar}\n` +
                `${energyDisplay.text}\n` +
                `\n` +
                `**Regeneration:** +1 energy per hour\n` +
                `**Last update:** <t:${Math.floor(new Date(profile.lastEnergyUpdate).getTime() / 1000)}:R>`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));

        // Time until full and available actions
        let statusText = '';
        if (!timeInfo.isFull) {
            statusText += `**🔄 Time Until Full**\n\`${timeInfo.hours}h ${timeInfo.minutes}m\`\n\n`;
        } else {
            statusText += `**✅ Status:** Energy is full!\n\n`;
        }

        const fishingCount = Math.floor(currentEnergy / energyConfig.costs.fishing);
        const exploringCount = Math.floor(currentEnergy / energyConfig.costs.exploring);
        
        statusText += `**🎮 Available Actions**\n`;
        statusText += `🎣 Fish **${fishingCount}** times (${energyConfig.costs.fishing} energy each)\n`;
        statusText += `🏝️ Explore **${exploringCount}** times (${energyConfig.costs.exploring} energy each)`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(statusText)
        );

        // Energy items inventory
        const items = profile.energyItems || {};
        const hasItems = Object.values(items).some(count => count > 0);
        
        if (hasItems) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            let itemsList = '**🎒 Energy Items**\n';
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

            Object.entries(items).forEach(([item, count]) => {
                if (count > 0) {
                    const emoji = itemEmojis[item] || '📦';
                    const restoreAmount = energyConfig.restoration[item].energy;
                    itemsList += `${emoji} **${itemNames[item]}** x${count} (+${restoreAmount} energy)\n`;
                }
            });

            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(itemsList)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`_💡 Use \`${this.client.config.prefix}energy restore <item>\` to restore energy_`)
            );
        } else {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`_💡 Use \`${this.client.config.prefix}shop\` to buy energy items with seashells_`)
            );
        }

        return ctx.sendMessage({ components: [container] });
    }

    async restoreEnergy(ctx, profile, itemName) {
        if (!itemName) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `**${emojis.general.error} Missing Item**\n` +
                    `\n` +
                    `**Usage:** \`${this.client.config.prefix}energy restore <item>\`\n` +
                    `\n` +
                    `**Available items:**\n` +
                    `🍪 \`snack\` - Small Snack (+10 energy)\n` +
                    `🥤 \`drink\` - Energy Drink (+20 energy)\n` +
                    `🍱 \`meal\` - Meal (+35 energy)\n` +
                    `🍗 \`feast\` - Feast (+60 energy)\n` +
                    `✨ \`full\` - Full Restore (+100 energy)`
                )
            );
            return ctx.sendMessage({ components: [container] });
        }

        // Normalize item name
        itemName = itemName.toLowerCase().replace(/\s+/g, '');
        
        // Map common names
        const itemMap = {
            'snack': 'smallSnack',
            'smallsnack': 'smallSnack',
            'meal': 'meal',
            'feast': 'feast',
            'drink': 'energyDrink',
            'energydrink': 'energyDrink',
            'full': 'fullRestore',
            'fullrestore': 'fullRestore',
            'restore': 'fullRestore'
        };

        const actualItem = itemMap[itemName];
        
        if (!actualItem || !energyConfig.restoration[actualItem]) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `**${emojis.general.error} Invalid Item**\n` +
                    `\n` +
                    `**Available items:**\n` +
                    `🍪 \`snack\` - Small Snack (+10 energy)\n` +
                    `🥤 \`drink\` - Energy Drink (+20 energy)\n` +
                    `🍱 \`meal\` - Meal (+35 energy)\n` +
                    `🍗 \`feast\` - Feast (+60 energy)\n` +
                    `✨ \`full\` - Full Restore (+100 energy)`
                )
            );
            return ctx.sendMessage({ components: [container] });
        }

        // Check if user has the item
        if (!profile.energyItems) profile.energyItems = {};
        if (!profile.energyItems[actualItem] || profile.energyItems[actualItem] <= 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `**${emojis.general.error} No Items**\n` +
                    `_You don't have any **${actualItem}**!_\n` +
                    `\n` +
                    `Use \`${this.client.config.prefix}shop\` to buy energy items with seashells.`
                )
            );
            return ctx.sendMessage({ components: [container] });
        }

        // Check if energy is already full
        updateEnergy(profile);
        const maxEnergy = profile.maxEnergy || energyConfig.maxEnergy;
        if (profile.energy >= maxEnergy) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `**⚡ Energy Full**\n` +
                    `_Your energy is already at maximum (\`${profile.energy}/${maxEnergy}\`)!_\n` +
                    `\n` +
                    `You don't need to restore energy right now.`
                )
            );
            return ctx.sendMessage({ components: [container] });
        }

        // Use the item
        const restoreAmount = energyConfig.restoration[actualItem].energy;
        const beforeEnergy = profile.energy;
        
        restoreEnergy(profile, restoreAmount);
        profile.energyItems[actualItem]--;
        await profile.save();

        const afterEnergy = profile.energy;
        const actualRestored = afterEnergy - beforeEnergy;

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

        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `## **${emojis.general.success} Energy Restored!**\n` +
                `_You used ${itemEmojis[actualItem]} **${itemNames[actualItem]}**_`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const energyBar = this.createEnergyBar(afterEnergy, maxEnergy);
        const energyPercent = Math.floor((afterEnergy / maxEnergy) * 100);
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `**Energy Change:**\n` +
                `\`${beforeEnergy}\` → \`${afterEnergy}\` (+${actualRestored} ⚡)\n` +
                `\n` +
                `${energyBar}\n` +
                `\`${afterEnergy}/${maxEnergy}\` (${energyPercent}%)`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `**Remaining Items:**\n` +
                `${itemEmojis[actualItem]} **${itemNames[actualItem]}** x${profile.energyItems[actualItem]}`
            )
        );

        return ctx.sendMessage({ components: [container] });
    }
    
    createEnergyBar(current, max) {
        const barLength = 20;
        const filled = Math.floor((current / max) * barLength);
        const empty = barLength - filled;
        return '▰'.repeat(filled) + '▱'.repeat(empty);
    }
}
