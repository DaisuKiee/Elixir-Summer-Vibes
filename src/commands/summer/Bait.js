import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getLevelFromXP } from '../../data/levelSystem.js';
import { 
    getAvailableBaits, 
    getBaitById, 
    purchaseBait, 
    activateBait, 
    getBaitInventory, 
    getActiveBaitInfo,
    formatBaitEffects 
} from '../../data/baitSystem.js';
import { emojis } from '../../config/emojis.js';

export default class Bait extends Command {
    constructor(client) {
        super(client, {
            name: 'bait',
            description: {
                content: 'Buy and use fishing bait to boost rare fish catches',
                usage: '[shop|buy|use|inventory|info] [bait name] [quantity]',
                examples: ['bait shop', 'bait buy worm', 'bait use mythic', 'bait inventory'],
            },
            aliases: ['baits', 'lure', 'lures'],
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
                    description: 'What to do with bait',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Shop - View available baits', value: 'shop' },
                        { name: 'Buy - Purchase bait', value: 'buy' },
                        { name: 'Use - Activate bait', value: 'use' },
                        { name: 'Inventory - View owned baits', value: 'inventory' },
                        { name: 'Info - Bait details', value: 'info' }
                    ]
                },
                {
                    name: 'bait',
                    description: 'Bait name (for buy/use/info)',
                    type: 3,
                    required: false
                },
                {
                    name: 'quantity',
                    description: 'Amount to buy (for buy action)',
                    type: 4,
                    required: false,
                    min_value: 1,
                    max_value: 99
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
        let action = 'shop'; // Default
        if (ctx.isInteraction) {
            action = ctx.interaction.options.getString('action') || 'shop';
        } else if (args.length > 0) {
            action = args[0].toLowerCase();
        }
        
        // Route to appropriate handler
        switch (action) {
            case 'shop':
            case 's':
                return this.showShop(ctx, profile);
                
            case 'buy':
            case 'purchase':
            case 'b':
                return this.buyBait(ctx, profile, args);
                
            case 'use':
            case 'activate':
            case 'u':
                return this.useBait(ctx, profile, args);
                
            case 'inventory':
            case 'inv':
            case 'i':
                return this.showInventory(ctx, profile);
                
            case 'info':
            case 'details':
                return this.showBaitInfo(ctx, profile, args);
                
            default:
                return this.showShop(ctx, profile);
        }
    }
    
    async showShop(ctx, profile) {
        const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
        const currentLevel = getLevelFromXP(totalXP);
        const availableBaits = getAvailableBaits(currentLevel);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **🏪 Bait Shop**\n> _Boost your fishing with strategic baits!_\n> **Balance:** \`${profile.seashells.toLocaleString()}\` ${emojis.currency.seashell}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // List available baits
        availableBaits.forEach((bait, index) => {
            const effects = formatBaitEffects(bait);
            
            let baitText = `> ### ${bait.emoji} **${bait.name}**\n`;
            baitText += `> ${bait.description}\n`;
            baitText += `> \n`;
            baitText += `> **Cost:** \`${bait.cost}\` ${emojis.currency.seashell}\n`;
            baitText += `> **Duration:** \`${bait.duration} catches\`\n`;
            baitText += `> **Effects:**\n> ${effects.split('\n').join('\n> ')}`;
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(baitText)
            );
            
            if (index < availableBaits.length - 1) {
                container.addSeparatorComponents((separator) => separator.setDivider(false));
            }
        });
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Purchase instructions
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> **💡 How to Use:**\n> `++bait buy <bait> [quantity]` - Purchase bait\n> `++bait use <bait>` - Activate bait\n> `++bait inventory` - View owned baits')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async buyBait(ctx, profile, args) {
        // Parse bait name
        let baitName, quantity = 1;
        
        if (ctx.isInteraction) {
            baitName = ctx.interaction.options.getString('bait');
            quantity = ctx.interaction.options.getInteger('quantity') || 1;
        } else {
            if (args.length < 2) {
                const container = this.client.container()
                    .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Missing Bait Name**\n> _Usage: \`++bait buy <bait name> [quantity]\`_\n> _Example: \`++bait buy mythic 3\`_`)
                );
                return ctx.sendMessage({ components: [container] });
            }
            
            baitName = args.slice(1, args.length - 1).join('_').toLowerCase();
            // Check if last arg is a number
            const lastArg = args[args.length - 1];
            if (!isNaN(lastArg)) {
                quantity = parseInt(lastArg);
                baitName = args.slice(1, args.length - 1).join('_').toLowerCase();
            } else {
                baitName = args.slice(1).join('_').toLowerCase();
            }
        }
        
        // Find bait (fuzzy match)
        const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
        const allBaits = getAvailableBaits(getLevelFromXP(totalXP));
        const bait = allBaits.find(b => 
            b.id.includes(baitName) || 
            b.name.toLowerCase().includes(baitName)
        );
        
        if (!bait) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Bait Not Found**\n> _Could not find bait: "${baitName}"_\n> _Use \`++bait shop\` to see available baits._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Purchase
        const result = purchaseBait(profile, bait.id, quantity);
        await profile.save();
        
        const container = this.client.container()
            .setAccentColor(parseInt((result.success ? this.client.color.success : this.client.color.error).replace('#', ''), 16));
        
        if (result.success) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.success} Purchase Complete!**\n> ${bait.emoji} **${bait.name}** x${quantity}\n> \n> **Cost:** \`${bait.cost * quantity}\` ${emojis.currency.seashell}\n> **Remaining Balance:** \`${profile.seashells.toLocaleString()}\` ${emojis.currency.seashell}`)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> _Use \`++bait use ${bait.name.split(' ')[0].toLowerCase()}\` to activate!_`)
            );
        } else {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Purchase Failed**\n> ${result.message}`)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async useBait(ctx, profile, args) {
        // Parse bait name
        let baitName;
        
        if (ctx.isInteraction) {
            baitName = ctx.interaction.options.getString('bait');
        } else {
            if (args.length < 2) {
                const container = this.client.container()
                    .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Missing Bait Name**\n> _Usage: \`++bait use <bait name>\`_\n> _Example: \`++bait use mythic\`_`)
                );
                return ctx.sendMessage({ components: [container] });
            }
            
            baitName = args.slice(1).join('_').toLowerCase();
        }
        
        // Find bait (fuzzy match from inventory)
        const inventory = getBaitInventory(profile);
        const bait = inventory.find(b => 
            b.id.includes(baitName) || 
            b.name.toLowerCase().includes(baitName)
        );
        
        if (!bait) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Bait Not Found in Inventory**\n> _You don't own any bait matching: "${baitName}"_\n> _Use \`++bait inventory\` to see owned baits._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Activate
        const result = activateBait(profile, bait.id);
        await profile.save();
        
        const container = this.client.container()
            .setAccentColor(parseInt((result.success ? this.client.color.success : this.client.color.warn).replace('#', ''), 16));
        
        if (result.success) {
            const effects = formatBaitEffects(bait);
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.success} Bait Activated!**\n> ${bait.emoji} **${bait.name}**`)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **Duration:** \`${bait.duration} catches\`\n> \n> **Effects:**\n> ${effects.split('\n').join('\n> ')}`)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ${emojis.energy.lightbulb} _Start fishing with \`++fish\` to use your bait!_`)
            );
        } else {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.warning} Cannot Activate**\n> ${result.message}`)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showInventory(ctx, profile) {
        const inventory = getBaitInventory(profile);
        const activeBait = getActiveBaitInfo(profile);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **🎒 Bait Inventory**\n> _Your fishing supplies_`)
        );
        
        // Active bait
        if (activeBait) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **⚡ Currently Active:**\n> ${activeBait.emoji} **${activeBait.name}** (\`${activeBait.remainingUses} uses left\`)`)
            );
        }
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // List inventory
        if (inventory.length === 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.info} No Bait in Inventory**\n> _Purchase bait from the shop with \`++bait shop\`_`)
            );
        } else {
            inventory.forEach((bait, index) => {
                let baitText = `> ${bait.emoji} **${bait.name}** - \`${bait.ownedQuantity}x\`\n`;
                baitText += `> Duration: \`${bait.duration} catches\` • Cost: \`${bait.cost}\` ${emojis.currency.seashell}`;
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(baitText)
                );
                
                if (index < inventory.length - 1) {
                    container.addSeparatorComponents((separator) => separator.setDivider(false));
                }
            });
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showBaitInfo(ctx, profile, args) {
        // Parse bait name
        let baitName;
        
        if (ctx.isInteraction) {
            baitName = ctx.interaction.options.getString('bait');
        } else {
            if (args.length < 2) {
                return this.showShop(ctx, profile); // Default to shop
            }
            baitName = args.slice(1).join('_').toLowerCase();
        }
        
        // Find bait
        const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
        const allBaits = getAvailableBaits(getLevelFromXP(totalXP));
        const bait = allBaits.find(b => 
            b.id.includes(baitName) || 
            b.name.toLowerCase().includes(baitName)
        );
        
        if (!bait) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Bait Not Found**\n> _Use \`++bait shop\` to see available baits._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        const effects = formatBaitEffects(bait);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## ${bait.emoji} **${bait.name}**\n> ${bait.description}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **Cost:** \`${bait.cost}\` ${emojis.currency.seashell}\n> **Duration:** \`${bait.duration} catches\`\n> **Unlock:** \`Level ${bait.unlockTier}\``)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **Effects:**\n> ${effects.split('\n').join('\n> ')}`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
