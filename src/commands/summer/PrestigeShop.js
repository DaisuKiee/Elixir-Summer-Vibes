import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { 
    getPrestigeShop, 
    purchasePrestigeUpgrade,
    getPrestigeUpgrade,
    formatPrestigeLevel
} from '../../data/prestigeSystem.js';
import { emojis } from '../../config/emojis.js';

export default class PrestigeShop extends Command {
    constructor(client) {
        super(client, {
            name: 'prestigeshop',
            description: {
                content: 'Browse and purchase permanent prestige upgrades',
                usage: '[buy] [upgrade name]',
                examples: ['prestigeshop', 'prestigeshop buy xp boost', 'prestigeshop buy energy'],
            },
            aliases: ['pshop', 'prestshop', 'pupgrades'],
            category: 'summer',
            cooldown: 3,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'action',
                    description: 'Shop action',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Browse - View all upgrades', value: 'browse' },
                        { name: 'Buy - Purchase an upgrade', value: 'buy' }
                    ]
                },
                {
                    name: 'upgrade',
                    description: 'Upgrade to purchase (for buy action)',
                    type: 3,
                    required: false
                }
            ]
        });
    }
    
    async run(ctx, args) {
        // Get or create profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: ctx.author.id,
                username: ctx.author.tag
            });
            await profile.save();
        }
        
        // Parse action
        let action = 'browse';
        if (ctx.isInteraction) {
            action = ctx.interaction.options.getString('action') || 'browse';
        } else if (args.length > 0 && ['buy', 'purchase', 'b'].includes(args[0].toLowerCase())) {
            action = 'buy';
        }
        
        // Route to handler
        if (action === 'buy') {
            return this.buyUpgrade(ctx, profile, args);
        } else {
            return this.showShop(ctx, profile);
        }
    }
    
    async showShop(ctx, profile) {
        const shop = getPrestigeShop(profile);
        const prestigeDisplay = formatPrestigeLevel(profile.prestigeLevel || 0);
        
        const container = this.client.container()
            .setAccentColor(parseInt('FFD700', 16)); // Gold (without #)
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **✨ Prestige Shop**\n> _Permanent power upgrades_\n> \n> **Prestige:** \`${prestigeDisplay}\`\n> **Points Available:** \`${profile.prestigePoints || 0}\` ⭐`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Group upgrades by category
        const xpUpgrades = shop.filter(u => u.id.includes('xp_boost'));
        const energyUpgrades = shop.filter(u => u.id.includes('energy'));
        const luckUpgrades = shop.filter(u => u.id.includes('rare_fish') || u.id.includes('variant'));
        const miscUpgrades = shop.filter(u => !u.id.includes('xp_boost') && !u.id.includes('energy') && !u.id.includes('rare_fish') && !u.id.includes('variant'));
        
        // XP Category
        if (xpUpgrades.length > 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ### **📈 XP & Progression**`)
            );
            
            xpUpgrades.forEach(upgrade => {
                this.addUpgradeDisplay(container, upgrade, profile);
            });
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
        }
        
        // Energy Category
        if (energyUpgrades.length > 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ### **⚡ Energy & Efficiency**`)
            );
            
            energyUpgrades.forEach(upgrade => {
                this.addUpgradeDisplay(container, upgrade, profile);
            });
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
        }
        
        // Luck Category
        if (luckUpgrades.length > 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ### **🎣 Fishing & Luck**`)
            );
            
            luckUpgrades.forEach(upgrade => {
                this.addUpgradeDisplay(container, upgrade, profile);
            });
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
        }
        
        // Misc Category
        if (miscUpgrades.length > 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ### **💰 Economy & Rewards**`)
            );
            
            miscUpgrades.forEach(upgrade => {
                this.addUpgradeDisplay(container, upgrade, profile);
            });
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
        }
        
        // Purchase instructions
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💡 How to Purchase:**\n> \`${this.client.config.prefix}prestigeshop buy <upgrade name>\`\n> \n> **Examples:**\n> \`${this.client.config.prefix}prestigeshop buy xp boost\`\n> \`${this.client.config.prefix}prestigeshop buy energy capacity\`\n> \`${this.client.config.prefix}prestigeshop buy variant hunter\``)
        );
        
        // Earn more points info
        if (profile.prestigePoints === 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ${emojis.general.info} **No Points Available**\n> _Earn prestige points by using \`${this.client.config.prefix}prestige\`_\n> _Each prestige grants 10 points!_`)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    addUpgradeDisplay(container, upgrade, profile) {
        let statusIcon;
        if (upgrade.isMaxed) {
            statusIcon = emojis.general.success;
        } else if (upgrade.canPurchase) {
            statusIcon = emojis.general.unlocked;
        } else {
            statusIcon = emojis.general.locked;
        }
        
        let upgradeText = `> ${statusIcon} ${upgrade.emoji} **${upgrade.name}** \`[${upgrade.currentLevel}/${upgrade.maxLevel}]\`\n`;
        upgradeText += `> ${upgrade.description}\n`;
        upgradeText += `> **Cost:** \`${upgrade.cost}\` ⭐`;
        
        if (upgrade.isMaxed) {
            upgradeText += ` • **MAXED** ${emojis.general.trophy}`;
        } else if (!upgrade.canPurchase && upgrade.reason) {
            upgradeText += ` • ${upgrade.reason}`;
        }
        
        // Show effect calculation
        const effectKey = Object.keys(upgrade.effect)[0];
        const effectValue = upgrade.effect[effectKey];
        let effectDisplay = '';
        
        if (effectKey === 'xpMultiplier' || effectKey === 'dailyBonusMultiplier') {
            effectDisplay = `+${(effectValue * 100).toFixed(0)}% per level`;
        } else if (effectKey === 'rareFishBonus' || effectKey === 'variantBonus') {
            effectDisplay = `+${(effectValue * 100).toFixed(1)}% per level`;
        } else if (effectKey === 'pityReduction') {
            effectDisplay = `-${(effectValue * 100).toFixed(0)}% per level`;
        } else {
            effectDisplay = `+${effectValue} per level`;
        }
        
        upgradeText += `\n> _${effectDisplay}_`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(upgradeText)
        );
    }
    
    async buyUpgrade(ctx, profile, args) {
        // Check if player has prestiged
        if (!profile.prestigeLevel || profile.prestigeLevel === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt((this.client.color?.error || '#ED4245').replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.locked} Not Prestiged Yet**\n> _You must reach prestige level 1 to access the shop._\n> \n> Use \`${this.client.config.prefix}prestige\` to learn more about prestiging!`)
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Parse upgrade name
        let upgradeName;
        
        if (ctx.isInteraction) {
            upgradeName = ctx.interaction.options.getString('upgrade');
            if (!upgradeName) {
                const container = this.client.container()
                    .setAccentColor(parseInt((this.client.color?.error || '#ED4245').replace('#', ''), 16));
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Missing Upgrade Name**\n> _Usage: \`${this.client.config.prefix}prestigeshop buy <upgrade name>\`_`)
                );
                return ctx.sendMessage({ components: [container] });
            }
        } else {
            if (args.length < 2) {
                const container = this.client.container()
                    .setAccentColor(parseInt((this.client.color?.error || '#ED4245').replace('#', ''), 16));
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Missing Upgrade Name**\n> _Usage: \`${this.client.config.prefix}prestigeshop buy <upgrade name>\`_\n> _Example: \`${this.client.config.prefix}prestigeshop buy xp boost\`_`)
                );
                return ctx.sendMessage({ components: [container] });
            }
            
            upgradeName = args.slice(1).join('_').toLowerCase();
        }
        
        // Find upgrade (fuzzy match)
        const shop = getPrestigeShop(profile);
        const upgrade = shop.find(u => 
            u.id.includes(upgradeName) || 
            u.name.toLowerCase().includes(upgradeName) ||
            u.id.replace(/_/g, ' ').includes(upgradeName)
        );
        
        if (!upgrade) {
            const container = this.client.container()
                .setAccentColor(parseInt((this.client.color?.error || '#ED4245').replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Upgrade Not Found**\n> _Could not find upgrade: "${upgradeName}"_\n> _Use \`${this.client.config.prefix}prestigeshop\` to see all upgrades._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Attempt purchase
        const result = purchasePrestigeUpgrade(profile, upgrade.id);
        
        if (!result.success) {
            const container = this.client.container()
                .setAccentColor(parseInt((this.client.color?.error || '#ED4245').replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Purchase Failed**\n> ${result.message}\n> \n> **Points Available:** \`${profile.prestigePoints || 0}\` ⭐\n> **Cost:** \`${upgrade.cost}\` ⭐`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Success! Save profile
        await profile.save();
        
        const container = this.client.container()
            .setAccentColor(parseInt((this.client.color?.success || '#06FFA5').replace('#', ''), 16));
        
        // Success message
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.success} Upgrade Purchased!**\n> ${upgrade.emoji} **${upgrade.name}**\n> \n> ${result.message}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Effect info
        const effectKey = Object.keys(upgrade.effect)[0];
        const effectValue = upgrade.effect[effectKey];
        let currentBonus = '';
        
        if (effectKey === 'xpMultiplier') {
            const totalBonus = ((profile.prestigeUnlocks.xpMultiplier - 1.0) * 100).toFixed(0);
            currentBonus = `**Total XP Boost:** \`+${totalBonus}%\``;
        } else if (effectKey === 'energyBonus') {
            currentBonus = `**Total Energy Bonus:** \`+${profile.prestigeUnlocks.energyBonus}\` (Max: ${100 + profile.prestigeUnlocks.energyBonus})`;
        } else if (effectKey === 'rareFishBonus') {
            const totalBonus = (profile.prestigeUnlocks.rareFishBonus * 100).toFixed(1);
            currentBonus = `**Total Rare Fish Bonus:** \`+${totalBonus}%\``;
        } else if (effectKey === 'variantBonus') {
            const totalBonus = (profile.prestigeUnlocks.variantBonus * 100).toFixed(1);
            currentBonus = `**Total Variant Bonus:** \`+${totalBonus}%\``;
        } else if (effectKey === 'dailyBonusMultiplier') {
            const totalBonus = ((profile.prestigeUnlocks.dailyBonusMultiplier - 1.0) * 100).toFixed(0);
            currentBonus = `**Total Daily Bonus:** \`+${totalBonus}%\``;
        } else if (effectKey === 'pityReduction') {
            const totalBonus = (profile.prestigeUnlocks.pityReduction * 100).toFixed(0);
            currentBonus = `**Total Pity Reduction:** \`-${totalBonus}%\``;
        } else {
            currentBonus = `**Current Value:** \`${profile.prestigeUnlocks[effectKey] || 0}\``;
        }
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **📊 Upgrade Effect**\n> ${upgrade.description}\n> \n> ${currentBonus}\n> **Level:** \`${result.newLevel}/${upgrade.maxLevel}\``)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Points remaining
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💰 Points**\n> **Spent:** \`${upgrade.cost}\` ⭐\n> **Remaining:** \`${result.remainingPoints}\` ⭐`)
        );
        
        // Maxed notification
        if (result.newLevel >= upgrade.maxLevel) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ${emojis.general.trophy} **Upgrade Maxed!**\n> _This upgrade is now at maximum level._`)
            );
        }
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Footer
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ${emojis.energy.lightbulb} _This bonus is permanent and applies immediately!_\n> Use \`${this.client.config.prefix}prestigeshop\` to view more upgrades.`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
