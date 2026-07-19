import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getLevelFromXP } from '../../data/levelSystem.js';
import { 
    checkPrestigeRequirements, 
    performPrestige, 
    formatPrestigeLevel,
    getPrestigeBonuses
} from '../../data/prestigeSystem.js';
import { emojis } from '../../config/emojis.js';

export default class Prestige extends Command {
    constructor(client) {
        super(client, {
            name: 'prestige',
            description: {
                content: 'Reset your progress for permanent bonuses and prestige levels',
                usage: '[confirm]',
                examples: ['prestige', 'prestige confirm'],
            },
            aliases: ['rebirth', 'ascend'],
            category: 'summer',
            cooldown: 5,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'confirm',
                    description: 'Confirm prestige reset',
                    type: 5, // Boolean
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
        
        // Check if confirm argument provided
        let confirmPrestige = false;
        
        if (ctx.isInteraction) {
            confirmPrestige = ctx.interaction.options.getBoolean('confirm') || false;
        } else {
            confirmPrestige = args.some(arg => ['confirm', 'yes', 'y'].includes(arg.toLowerCase()));
        }
        
        // Check eligibility
        const eligibility = checkPrestigeRequirements(profile);
        
        if (!confirmPrestige) {
            // Show prestige requirements and info
            return this.showPrestigeInfo(ctx, profile, eligibility);
        } else {
            // Perform prestige
            return this.doPrestige(ctx, profile, eligibility);
        }
    }
    
    async showPrestigeInfo(ctx, profile, eligibility) {
        const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
        const currentLevel = getLevelFromXP(totalXP);
        const bonuses = getPrestigeBonuses(profile);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        const currentPrestigeDisplay = formatPrestigeLevel(profile.prestigeLevel || 0);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **✨ Prestige System**\n> _Reset your progress for permanent power!_\n> \n> **Current Prestige:** \`${currentPrestigeDisplay}\`\n> **Prestige Points:** \`${profile.prestigePoints || 0}\``)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Requirements
        const requiredLevel = eligibility.current.requiredLevel;
        const requiredIslands = eligibility.current.requiredIslands;
        const requiredFish = eligibility.current.requiredFish;
        const requiredCollectibles = eligibility.current.requiredCollectibles;
        
        let requirementsText = `> ### **📋 Requirements**\n`;
        requirementsText += `> ${eligibility.current.tier >= requiredLevel ? emojis.general.success : emojis.general.error} **Level ${requiredLevel}** - Current: \`${eligibility.current.tier}\`\n`;
        requirementsText += `> ${eligibility.current.islands >= requiredIslands ? emojis.general.success : emojis.general.error} **${requiredIslands} Islands** - Discovered: \`${eligibility.current.islands}\`\n`;
        requirementsText += `> ${eligibility.current.fish >= requiredFish ? emojis.general.success : emojis.general.error} **${requiredFish} Fish** - Caught: \`${eligibility.current.fish}\`\n`;
        requirementsText += `> ${eligibility.current.collectibles >= requiredCollectibles ? emojis.general.success : emojis.general.error} **${requiredCollectibles} Collectibles** - Found: \`${eligibility.current.collectibles}\``;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(requirementsText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // What you'll get
        const currentPrestigeLevel = profile.prestigeLevel || 0;
        const nextPrestigeLevel = currentPrestigeLevel + 1;
        const nextRequiredLevel = 15 + (nextPrestigeLevel * 10);
        const nextXpMultiplier = 1.0 + (nextPrestigeLevel * 0.5);
        const nextFishMultiplier = 1.0 + (nextPrestigeLevel * 0.5);
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ### **🎁 Rewards Upon Prestige**\n> **•** Prestige Level \`+1\` ⭐ (${nextPrestigeLevel}/50)\n> **•** \`10 Prestige Points\` to spend in shop\n> **•** \`${nextXpMultiplier}x XP Gain\` from all sources (automatic)\n> **•** \`${nextFishMultiplier}x Rare Fish Chance\` (automatic)\n> **•** Next prestige at Level ${nextRequiredLevel < 515 ? nextRequiredLevel : 'MAX'}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // What you'll lose
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ### **⚠️ What Gets Reset**\n> **•** Battle Pass XP and Level → \`0\`\n> **•** Fish Count (not inventory) → \`0\`\n> **•** Islands Discovered → \`0\`\n> **•** Collectibles → \`0\`\n> **•** Exploration Progress → \`0\``)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // What you keep
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ### **✅ What You Keep**\n> **•** Prestige Level & Points\n> **•** Prestige Upgrades (permanent)\n> **•** Variant Fish Collection\n> **•** Fish Inventory ${emojis.fish.fishGeneral}\n> **•** Seashells ${emojis.currency.seashell}\n> **•** Achievements\n> **•** Sun Tokens ${emojis.currency.sunToken}\n> **•** Cosmetics & Premium Pass\n> **•** Energy (refilled to max)`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Current bonuses (if any)
        if (profile.prestigeLevel > 0) {
            const currentPrestigeLevel = profile.prestigeLevel || 0;
            const autoXpMult = 1.0 + (currentPrestigeLevel * 0.5);
            const autoFishMult = 1.0 + (currentPrestigeLevel * 0.5);
            
            let bonusText = `> ### **💪 Current Prestige Bonuses**\n`;
            bonusText += `> **Automatic Bonuses (Rebirth ${currentPrestigeLevel}):**\n`;
            bonusText += `> **•** XP Gain: \`${autoXpMult}x\` (from rebirths)\n`;
            bonusText += `> **•** Rare Fish Chance: \`${autoFishMult}x\` (from rebirths)\n`;
            
            // Add purchased upgrade bonuses
            const hasPurchasedUpgrades = bonuses.purchasedXpMultiplier > 1.0 || 
                                         bonuses.energyBonus > 0 || 
                                         bonuses.rareFishBonus > 0 || 
                                         bonuses.variantBonus > 0 || 
                                         bonuses.dailyBonusMultiplier > 1.0 || 
                                         bonuses.pityReduction > 0;
            
            if (hasPurchasedUpgrades) {
                bonusText += `> \n> **Purchased Upgrades:**\n`;
                if (bonuses.purchasedXpMultiplier > 1.0) {
                    const percent = ((bonuses.purchasedXpMultiplier - 1.0) * 100).toFixed(0);
                    const totalMult = (bonuses.xpMultiplier).toFixed(1);
                    bonusText += `> **•** XP Boost: \`+${percent}%\` (Total: ${totalMult}x)\n`;
                }
                if (bonuses.energyBonus > 0) {
                    bonusText += `> **•** Max Energy: \`+${bonuses.energyBonus}\`\n`;
                }
                if (bonuses.rareFishBonus > 0) {
                    const percent = (bonuses.rareFishBonus * 100).toFixed(1);
                    bonusText += `> **•** Rare Fish Bonus: \`+${percent}%\`\n`;
                }
                if (bonuses.variantBonus > 0) {
                    const percent = (bonuses.variantBonus * 100).toFixed(1);
                    bonusText += `> **•** Variant Chance: \`+${percent}%\`\n`;
                }
                if (bonuses.dailyBonusMultiplier > 1.0) {
                    const percent = ((bonuses.dailyBonusMultiplier - 1.0) * 100).toFixed(0);
                    bonusText += `> **•** Daily Rewards: \`+${percent}%\`\n`;
                }
                if (bonuses.pityReduction > 0) {
                    const percent = (bonuses.pityReduction * 100).toFixed(0);
                    bonusText += `> **•** Pity Reduction: \`-${percent}%\`\n`;
                }
            }
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(bonusText)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
        }
        
        // Call to action
        if (eligibility.eligible) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ${emojis.general.success} **You meet all requirements!**\n> \n> **Ready to prestige?**\n> Use \`${this.client.config.prefix}prestige confirm\` to reset and gain permanent power!\n> \n> _This action cannot be undone!_`)
            );
        } else {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ${emojis.general.locked} **Requirements not met:**\n> ${eligibility.missing.map(m => `**•** ${m}`).join('\n> ')}\n> \n> _Keep playing to reach prestige!_`)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async doPrestige(ctx, profile, eligibility) {
        // Perform prestige
        const result = performPrestige(profile);
        
        if (!result.success) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.error} Prestige Failed**\n> ${result.message}\n> \n> **Missing Requirements:**\n> ${result.missing.map(m => `**•** ${m}`).join('\n> ')}`)
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Success! Save profile
        await profile.save();
        
        const container = this.client.container()
            .setAccentColor(parseInt('#FFD700', 16)); // Gold color
        
        // Epic prestige announcement
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> # **✨ PRESTIGE ACHIEVED! ✨**\n> \n> ${ctx.author.username} has ascended to\n> **${formatPrestigeLevel(result.prestigeLevel)}**`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Stats summary
        let statsText = `> ### **📊 Final Statistics**\n`;
        statsText += `> **•** Tier: \`${result.prePrestigeStats.tier}\`\n`;
        statsText += `> **•** Islands: \`${result.prePrestigeStats.islands}/54\`\n`;
        statsText += `> **•** Fish: \`${result.prePrestigeStats.fish}\`\n`;
        statsText += `> **•** Collectibles: \`${result.prePrestigeStats.collectibles}\`\n`;
        statsText += `> **•** Seashells: \`${result.prePrestigeStats.seashells.toLocaleString()}\``;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(statsText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Rewards
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ### **🎁 Prestige Rewards**\n> **•** Prestige Level: \`${result.prestigeLevel}\` ⭐\n> **•** Prestige Points Earned: \`+${result.pointsEarned}\`\n> **•** Total Points: \`${result.totalPoints}\`\n> **•** Energy: \`Fully Restored!\` ⚡`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // What's next
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ### **🛒 Next Steps**\n> ${emojis.energy.lightbulb} Visit the **Prestige Shop** to spend your points!\n> \`++prestigeshop\` - Browse permanent upgrades\n> \n> **Available Upgrades:**\n> **•** XP Boost - Earn XP faster\n> **•** Energy Capacity - Increase max energy\n> **•** Rare Fish Luck - Better rare catch rates\n> **•** Variant Hunter - More shiny fish\n> **•** And more permanent bonuses!`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Footer
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ${result.message}\n> _Your journey begins anew, stronger than before._\n> \n> **✨ Prestige bonuses apply to all future catches! ✨**`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
