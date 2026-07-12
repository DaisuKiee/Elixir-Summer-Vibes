import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getVariantStats, getRarestVariant, variantTypes, getVariantChances } from '../../data/variantSystem.js';
import { emojis } from '../../config/emojis.js';

export default class Variants extends Command {
    constructor(client) {
        super(client, {
            name: 'variants',
            description: {
                content: 'View your shiny/variant fish collection and catch rates',
                usage: '',
                examples: ['variants', 'shiny', 'shinies'],
            },
            aliases: ['shiny', 'shinies', 'variant', 'variantfish'],
            category: 'summer',
            cooldown: 3,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: []
        });
    }
    
    async run(ctx) {
        // Get or create profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: ctx.author.id,
                username: ctx.author.tag
            });
            await profile.save();
        }
        
        // Get variant statistics
        const stats = getVariantStats(profile);
        const rarestVariant = getRarestVariant(profile);
        const prestigeLevel = profile.prestigeLevel || 0;
        const chances = getVariantChances(prestigeLevel);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **✨ Shiny/Variant Collection**\n> _Rare color variants of fish with bonus rewards_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Overall stats
        let overallText = `> **📊 Collection Stats**\n`;
        overallText += `> **Total Variants:** \`${stats.total}\`\n`;
        
        if (rarestVariant) {
            const variantData = variantTypes[rarestVariant];
            overallText += `> **Rarest Caught:** ${variantData.emoji} **${variantData.name}** (${(variantData.chance * 100).toFixed(2)}%)`;
        } else {
            overallText += `> **Rarest Caught:** _None yet - keep fishing!_`;
        }
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(overallText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Variant breakdown
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **🌈 Variants by Type**')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(false));
        
        // Golden
        const goldenData = variantTypes.golden;
        const goldenText = `> ${goldenData.emoji} **${goldenData.name}** (${chances.golden.percentage})\n` +
            `> **Caught:** \`${stats.golden}\` • **Multiplier:** \`${goldenData.multipliers.xp}x\`\n` +
            `> ${goldenData.description}`;
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(goldenText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(false));
        
        // Crystal
        const crystalData = variantTypes.crystal;
        const crystalText = `> ${crystalData.emoji} **${crystalData.name}** (${chances.crystal.percentage})\n` +
            `> **Caught:** \`${stats.crystal}\` • **Multiplier:** \`${crystalData.multipliers.xp}x\`\n` +
            `> ${crystalData.description}`;
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(crystalText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(false));
        
        // Shadow
        const shadowData = variantTypes.shadow;
        const shadowText = `> ${shadowData.emoji} **${shadowData.name}** (${chances.shadow.percentage})\n` +
            `> **Caught:** \`${stats.shadow}\` • **Multiplier:** \`${shadowData.multipliers.xp}x\`\n` +
            `> ${shadowData.description}`;
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(shadowText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(false));
        
        // Rainbow
        const rainbowData = variantTypes.rainbow;
        const rainbowText = `> ${rainbowData.emoji} **${rainbowData.name}** (${chances.rainbow.percentage})\n` +
            `> **Caught:** \`${stats.rainbow}\` • **Multiplier:** \`${rainbowData.multipliers.xp}x\`\n` +
            `> ${rainbowData.description}`;
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(rainbowText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Prestige bonus info
        if (prestigeLevel > 0) {
            const bonusText = `> **⭐ Prestige Bonus**\n` +
                `> **Level ${prestigeLevel}:** +${(prestigeLevel * 0.1).toFixed(1)}% variant chance\n` +
                `> _Prestige increases all variant catch rates!_`;
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(bonusText)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
        }
        
        // Information box
        let infoText = `> **💡 About Variants:**\n`;
        infoText += `> **•** Variants are rare color versions of fish\n`;
        infoText += `> **•** Same fish species, different appearance\n`;
        infoText += `> **•** Grant 2x-5x rewards (XP & Seashells)\n`;
        infoText += `> **•** Prestige levels increase variant chances\n`;
        infoText += `> **•** Golden Lure bait boosts variant chance +2%`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(infoText)
        );
        
        // Motivational message
        if (stats.total === 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **🎣 Keep Fishing!**\n> _You haven't caught any variants yet. Keep casting to find your first shiny!_`)
            );
        } else if (stats.rainbow > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **🌈 Rainbow Hunter!**\n> _You've caught the rarest variant! Amazing luck!_`)
            );
        } else if (stats.total >= 10) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **✨ Variant Collector!**\n> _${stats.total} variants caught! Keep hunting for rarer ones!_`)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
}
