import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setAuthor({ name: `${ctx.author.username}'s Energy`, iconURL: ctx.author.displayAvatarURL() })
            .setTitle(`⚡ Energy Status`)
            .setDescription(
                `${energyDisplay.bar}\n` +
                `${energyDisplay.text}\n\n` +
                `**Regeneration:** +1 energy per hour\n` +
                `**Last update:** <t:${Math.floor(new Date(profile.lastEnergyUpdate).getTime() / 1000)}:R>`
            );

        // Time until full
        if (!timeInfo.isFull) {
            embed.addFields({
                name: '🔄 Time Until Full',
                value: `\`${timeInfo.hours}h ${timeInfo.minutes}m\``,
                inline: true
            });
        } else {
            embed.addFields({
                name: '✅ Status',
                value: 'Energy is full!',
                inline: true
            });
        }

        // What you can do
        const fishingCount = Math.floor(currentEnergy / energyConfig.costs.fishing);
        const exploringCount = Math.floor(currentEnergy / energyConfig.costs.exploring);
        
        embed.addFields({
            name: '🎮 Available Actions',
            value: 
                `🎣 Fish **${fishingCount}** times (-15 energy)\n` +
                `🏝️ Explore **${exploringCount}** times (-20 energy)`,
            inline: true
        });

        // Energy items inventory
        const items = profile.energyItems || {};
        const hasItems = Object.values(items).some(count => count > 0);
        
        if (hasItems) {
            let itemsList = '';
            const itemEmojis = {
                smallSnack: '🍪',
                meal: '🍱',
                feast: '🍗',
                energyDrink: '🥤',
                fullRestore: '✨'
            };

            Object.entries(items).forEach(([item, count]) => {
                if (count > 0) {
                    const emoji = itemEmojis[item] || '📦';
                    const restoreAmount = energyConfig.restoration[item];
                    const itemName = item.replace(/([A-Z])/g, ' $1').trim();
                    itemsList += `${emoji} **${itemName.charAt(0).toUpperCase() + itemName.slice(1)}** x${count} (+${restoreAmount} energy)\n`;
                }
            });

            embed.addFields({
                name: '🎒 Energy Items',
                value: itemsList || 'No items',
                inline: false
            });

            embed.setFooter({ text: '💡 Use "!energy restore <item>" to restore energy' });
        } else {
            embed.setFooter({ text: '💡 Use "!shop" to buy energy items with seashells' });
        }

        embed.setTimestamp();
        return ctx.sendMessage({ embeds: [embed] });
    }

    async restoreEnergy(ctx, profile, itemName) {
        if (!itemName) {
            return ctx.sendMessage(`${emojis.general.error} Please specify an item to use! Example: \`!energy restore meal\``);
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
            return ctx.sendMessage(
                `${emojis.general.error} Invalid item! Available items:\n` +
                `🍪 \`smallSnack\` (+10 energy)\n` +
                `🍱 \`meal\` (+25 energy)\n` +
                `🍗 \`feast\` (+50 energy)\n` +
                `🥤 \`energyDrink\` (+15 energy)\n` +
                `✨ \`fullRestore\` (+100 energy)`
            );
        }

        // Check if user has the item
        if (!profile.energyItems) profile.energyItems = {};
        if (!profile.energyItems[actualItem] || profile.energyItems[actualItem] <= 0) {
            return ctx.sendMessage(`${emojis.general.error} You don't have any **${actualItem}**! Use \`!energy shop\` to buy items.`);
        }

        // Check if energy is already full
        updateEnergy(profile);
        const maxEnergy = profile.maxEnergy || energyConfig.maxEnergy;
        if (profile.energy >= maxEnergy) {
            return ctx.sendMessage(`${emojis.general.error} Your energy is already full! (${profile.energy}/${maxEnergy})`);
        }

        // Use the item
        const restoreAmount = energyConfig.restoration[actualItem];
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

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`${emojis.general.success} Energy Restored!`)
            .setDescription(
                `You used ${itemEmojis[actualItem]} **${actualItem}**\n\n` +
                `⚡ **${beforeEnergy}** → **${afterEnergy}** (+${actualRestored} energy)\n` +
                `📦 **${actualItem}** remaining: ${profile.energyItems[actualItem]}`
            )
            .setFooter({ text: `Energy: ${afterEnergy}/${maxEnergy}` })
            .setTimestamp();

        return ctx.sendMessage({ embeds: [embed] });
    }
}
