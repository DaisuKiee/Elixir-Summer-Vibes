import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getTierFromXP } from '../../data/battlepass.js';
import {
    canBreed,
    startBreeding,
    checkBreedingComplete,
    claimOffspring,
    getBreedingTimeRemaining,
    cancelBreeding,
    speedUpBreeding
} from '../../data/breedingSystem.js';
import {
    getBreedingCost,
    getBreedingRequirement,
    formatBreedingTime,
    breedingPairs
} from '../../data/breedingPairs.js';
import { getVariantDisplay } from '../../data/variantSystem.js';
import { emojis } from '../../config/emojis.js';

export default class Breed extends Command {
    constructor(client) {
        super(client, {
            name: 'breed',
            description: {
                content: 'Breed two fish together to create new species or variants',
                usage: '[start|claim|cancel|info|pairs] [fish1 index] [fish2 index]',
                examples: [
                    'breed',
                    'breed start 1 2',
                    'breed claim',
                    'breed cancel',
                    'breed info',
                    'breed pairs'
                ],
            },
            aliases: ['fusion', 'combine'],
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
                    description: 'Breeding action',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Start - Begin breeding', value: 'start' },
                        { name: 'Claim - Claim offspring', value: 'claim' },
                        { name: 'Cancel - Cancel breeding', value: 'cancel' },
                        { name: 'Info - View status', value: 'info' },
                        { name: 'Pairs - View breeding guide', value: 'pairs' }
                    ]
                },
                {
                    name: 'fish1',
                    description: 'First parent fish (inventory index)',
                    type: 4,
                    required: false,
                    min_value: 1
                },
                {
                    name: 'fish2',
                    description: 'Second parent fish (inventory index)',
                    type: 4,
                    required: false,
                    min_value: 1
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
        let action = 'info'; // Default
        if (ctx.isInteraction) {
            action = ctx.interaction.options.getString('action') || 'info';
        } else if (args.length > 0) {
            const firstArg = args[0].toLowerCase();
            if (['start', 'begin', 'breed'].includes(firstArg)) {
                action = 'start';
            } else if (['claim', 'collect', 'get'].includes(firstArg)) {
                action = 'claim';
            } else if (['cancel', 'stop', 'abort'].includes(firstArg)) {
                action = 'cancel';
            } else if (['info', 'status', 'check'].includes(firstArg)) {
                action = 'info';
            } else if (['pairs', 'guide', 'list'].includes(firstArg)) {
                action = 'pairs';
            }
        }
        
        // Route to handler
        switch (action) {
            case 'start':
                return this.startBreeding(ctx, profile, args);
            case 'claim':
                return this.claimOffspring(ctx, profile);
            case 'cancel':
                return this.cancelBreeding(ctx, profile);
            case 'pairs':
                return this.showBreedingPairs(ctx, profile);
            case 'info':
            default:
                return this.showBreedingInfo(ctx, profile);
        }
    }
    
    async showBreedingInfo(ctx, profile) {
        const check = checkBreedingComplete(profile);
        const currentTier = getTierFromXP(profile.battlePassXP);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **🐟 Fish Breeding System**\n> _Combine two fish to create new species!_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        if (check.hasActive) {
            // Show active breeding
            const breeding = check.breeding;
            const timeRemaining = getBreedingTimeRemaining(profile);
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **🥚 Active Breeding:**\n> **Parents:** ${breeding.parent1} × ${breeding.parent2}\n> **Offspring:** ${breeding.offspringName} (${breeding.offspringRarity})\n> **Success Rate:** \`${(breeding.successRate * 100).toFixed(0)}%\``)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            if (check.isComplete) {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(`> ${emojis.general.success} **Ready to Claim!**\n> Use \`++breed claim\` to receive your offspring!`)
                );
            } else {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(`> **⏰ Time Remaining:** \`${timeRemaining}\`\n> \n> _Come back when breeding is complete!_\n> Or use \`++breed speedup\` with sun tokens`)
                );
            }
        } else {
            // No active breeding
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.info} No Active Breeding**\n> \n> **How Breeding Works:**\n> **1.** Select two parent fish from your inventory\n> **2.** Pay seashell cost and wait for breeding time\n> **3.** Claim your offspring when ready!\n> \n> **Benefits:**\n> **•** Create rare hybrid species\n> **•** Increased variant chances\n> **•** Unique combinations`)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            // Show requirements
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **📋 Requirements:**\n> **•** Tier 15+ (Your tier: ${currentTier})\n> **•** Two fish in inventory\n> **•** Seashells for breeding cost\n> \n> **Commands:**\n> \`++breed start <fish1> <fish2>\`\n> \`++breed pairs\` - View possible combinations`)
            );
        }
        
        // Breeding history
        if (profile.breedingPairs && profile.breedingPairs.length > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const recent = profile.breedingPairs.slice(0, 3);
            let historyText = `> **📜 Recent Breeding:**\n`;
            recent.forEach(pair => {
                const result = pair.success ? `✅ ${pair.offspring}` : '❌ Failed';
                historyText += `> ${pair.parent1} × ${pair.parent2} → ${result}\n`;
            });
            historyText += `> \n> _Total Attempts: ${profile.breedingPairs.length}_`;
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(historyText)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async startBreeding(ctx, profile, args) {
        // Get fish indices
        let fish1Index, fish2Index;
        
        if (ctx.isInteraction) {
            fish1Index = ctx.interaction.options.getInteger('fish1');
            fish2Index = ctx.interaction.options.getInteger('fish2');
            
            if (fish1Index) fish1Index--; // Convert to 0-indexed
            if (fish2Index) fish2Index--;
        } else {
            if (args.length < 3) {
                const container = this.client.container()
                    .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Missing Fish Indices**\n> _Usage: \`++breed start <fish1 index> <fish2 index>\`_\n> _Example: \`++breed start 1 2\`_\n> \n> Use \`++fish\` to see your inventory indices`)
                );
                return ctx.sendMessage({ components: [container] });
            }
            
            fish1Index = parseInt(args[1]) - 1; // Convert to 0-indexed
            fish2Index = parseInt(args[2]) - 1;
        }
        
        if (fish1Index === undefined || fish2Index === undefined || isNaN(fish1Index) || isNaN(fish2Index)) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Invalid Fish Indices**\n> _Provide two fish inventory indices._\n> _Example: \`++breed start 1 2\`_`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Start breeding
        const result = startBreeding(profile, fish1Index, fish2Index);
        
        if (!result.success) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Breeding Failed**\n> ${result.message}`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        await profile.save();
        
        // Success
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
        
        const breeding = result.breeding;
        const timeFormatted = formatBreedingTime(result.breedingTime);
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.success} Breeding Started!**\n> ${emojis.fish.fishGeneral} ${breeding.parent1} × ${emojis.fish.fishGeneral} ${breeding.parent2}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **🥚 Expected Offspring:**\n> **Name:** ${breeding.offspringName}\n> **Rarity:** \`${breeding.offspringRarity}\`\n> **Success Rate:** \`${(breeding.successRate * 100).toFixed(0)}%\``)
        );
        
        if (breeding.variantBonus > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(false));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **✨ Variant Bonus:** \`+${(breeding.variantBonus * 100).toFixed(0)}%\` chance!`)
            );
        }
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **⏰ Breeding Time:** \`${timeFormatted}\`\n> **💰 Cost:** \`${result.cost}\` ${emojis.currency.seashell}\n> **Finishes:** <t:${Math.floor(result.finishTime.getTime() / 1000)}:R>`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💡 Next Steps:**\n> **•** Wait for breeding to complete\n> **•** Use \`++breed claim\` when ready\n> **•** Or \`++breed cancel\` for 50% refund`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async claimOffspring(ctx, profile) {
        const result = claimOffspring(profile);
        
        if (!result.success && result.message === 'No active breeding to claim') {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} No Breeding to Claim**\n> _You don't have any completed breeding._\n> \n> Use \`++breed start\` to begin breeding!`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        if (!result.success && result.timeRemaining) {
            const timeRemaining = getBreedingTimeRemaining(profile);
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.warning} Breeding Not Complete**\n> **Time Remaining:** \`${timeRemaining}\`\n> \n> _Wait for breeding to finish or use sun tokens to speed up!_`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        await profile.save();
        
        // Show result
        const container = this.client.container();
        
        if (result.success) {
            // Breeding successful!
            container.setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
            
            const variantDisplay = result.variant ? getVariantDisplay(result.offspring.name, result.variant) : null;
            const displayName = variantDisplay?.name || result.offspring.name;
            const variantEmoji = variantDisplay?.emoji || '';
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.celebrate} Breeding Successful!**\n> ${result.parents[0]} × ${result.parents[1]}`)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            if (result.variant && result.variant !== 'normal') {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(variantDisplay.announcement)
                );
                container.addSeparatorComponents((separator) => separator.setDivider(true));
            }
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ### ${variantEmoji} **${displayName}**\n> **Rarity:** \`${result.offspring.rarity}\`\n> **Weight:** \`${result.offspring.weight} kg\`\n> **Success Rate:** \`${(result.successRate * 100).toFixed(0)}%\``)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **🎉 New fish added to your inventory!**\n> _This fish was created through breeding._`)
            );
            
        } else {
            // Breeding failed
            container.setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.error} Breeding Failed**\n> ${result.parents[0]} × ${result.parents[1]}`)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ${result.message}\n> \n> **Success Rate:** \`${(result.successRate * 100).toFixed(0)}%\`\n> \n> _Better luck next time! Try breeding fish of the same rarity for higher success rates._`)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async cancelBreeding(ctx, profile) {
        const result = cancelBreeding(profile);
        
        if (!result.success) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Cannot Cancel**\n> ${result.message}`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        await profile.save();
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **${emojis.general.warning} Breeding Cancelled**\n> ${result.cancelled.parent1} × ${result.cancelled.parent2}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💰 Refund:** \`${result.refund}\` ${emojis.currency.seashell} (50%)\n> \n> _Parent fish were lost in the process._`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showBreedingPairs(ctx, profile) {
        const currentTier = getTierFromXP(profile.battlePassXP);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **📖 Breeding Guide**\n> _Known breeding combinations_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Show some example pairs
        const examplePairs = Object.values(breedingPairs).slice(0, 6);
        
        examplePairs.forEach(pair => {
            const requirement = getBreedingRequirement(pair.rarity);
            const cost = getBreedingCost(pair.rarity);
            const locked = currentTier < requirement;
            
            let pairText = `> ${locked ? emojis.general.locked : pair.emoji} **${pair.offspringName}**\n`;
            pairText += `> ${pair.parents[0]} × ${pair.parents[1]}\n`;
            pairText += `> **Rarity:** \`${pair.rarity}\` • **Rate:** \`${(pair.successRate * 100).toFixed(0)}%\`\n`;
            pairText += `> **Cost:** \`${cost}\` ${emojis.currency.seashell} • **Tier:** \`${requirement}\``;
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(pairText)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(false));
        });
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💡 Breeding Tips:**\n> **•** Same rarity = Higher success rate\n> **•** Same rarity = Better variant chances\n> **•** Prestige levels increase success rates\n> **•** Experiment to discover new combinations!\n> \n> _More pairs available - keep breeding to discover them!_`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
