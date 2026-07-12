import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getTier, getTierFromXP, getTotalXPForTier, getXPForNextTier, isInfiniteLevel } from '../../data/battlepass.js';
import emojis from '../../config/emojis.js';

export default class Battlepass extends Command {
    constructor(client) {
        super(client, {
            name: 'battlepass',
            description: '🎟️ View your Summer Battle Pass progress and rewards',
            usage: '[tier]',
            examples: ['battlepass', 'battlepass 25'],
            aliases: ['bp', 'pass', 'tiers'],
            category: 'summer',
            cooldown: 10,
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
        
        // Check if viewing specific tier
        const viewTier = args[0] ? parseInt(args[0]) : null;
        
        if (viewTier) {
            return this.showTierRewards(ctx, viewTier, profile);
        }
        
        // Calculate current tier
        const currentTier = getTierFromXP(profile.battlePassXP);
        const currentTierData = getTier(currentTier);
        const nextTierData = getTier(currentTier + 1);
        
        // Calculate XP for next tier
        const currentTierTotalXP = getTotalXPForTier(currentTier);
        const nextTierTotalXP = getTotalXPForTier(currentTier + 1);
        const xpInCurrentTier = profile.battlePassXP - currentTierTotalXP;
        const xpNeededForNext = nextTierTotalXP - currentTierTotalXP;
        const progressPercent = Math.floor((xpInCurrentTier / xpNeededForNext) * 100);
        
        // Create progress bar
        const progressBarLength = 15;
        const filledBars = Math.floor((xpInCurrentTier / xpNeededForNext) * progressBarLength);
        const progressBar = '▰'.repeat(filledBars) + '▱'.repeat(progressBarLength - filledBars);
        
        const embed = new EmbedBuilder()
            .setColor(profile.isPremiumPass ? '#ffd700' : (this.client.color?.battlepass || '#9b59b6'))
            .setAuthor({ name: `${ctx.author.username}'s Battle Pass`, iconURL: ctx.author.displayAvatarURL() })
            .setTitle(`${emojis.battlepass.pass} Summer Battle Pass ${profile.isPremiumPass ? '⭐ Premium' : ''}`)
            .setTimestamp();
        
        // Current tier progress
        let tierText;
        if (isInfiniteLevel(currentTier)) {
            tierText = 
                `**Level:** \`${currentTier}\` ♾️\n` +
                `**XP:** \`${xpInCurrentTier}/${xpNeededForNext}\` (${progressPercent}%)\n` +
                `${progressBar}\n` +
                `**Total XP:** \`${profile.battlePassXP.toLocaleString()}\`\n` +
                `_Each level earns 200 seashells!_`;
        } else {
            tierText = 
                `**Tier:** \`${currentTier}/100\`\n` +
                `**XP:** \`${xpInCurrentTier}/${xpNeededForNext}\` (${progressPercent}%)\n` +
                `${progressBar}\n` +
                `**Total XP:** \`${profile.battlePassXP.toLocaleString()}\``;
        }
        
        embed.addFields({
            name: `${emojis.progression.stats} Current Progress`,
            value: tierText,
            inline: false
        });
        
        // Current tier rewards
        if (currentTierData && currentTier > 0) {
            const freeRewards = this.formatRewards(currentTierData.freeRewards);
            const premiumRewards = this.formatRewards(currentTierData.premiumRewards);
            
            let rewardsText = '';
            
            if (freeRewards) {
                rewardsText += `**Free:** ${freeRewards}\n`;
            }
            
            if (profile.isPremiumPass && premiumRewards) {
                rewardsText += `**Premium:** ${premiumRewards}`;
            } else if (!profile.isPremiumPass && premiumRewards) {
                rewardsText += `**Premium:** _🔒 Locked_`;
            }
            
            if (rewardsText) {
                embed.addFields({
                    name: `${emojis.general.gift} Tier ${currentTier} Rewards`,
                    value: rewardsText,
                    inline: false
                });
            }
        }
        
        // Next tier preview
        if (nextTierData) {
            const nextFreeRewards = this.formatRewards(nextTierData.freeRewards);
            const nextPremiumRewards = this.formatRewards(nextTierData.premiumRewards);
            
            let nextText = '';
            
            if (nextFreeRewards) {
                nextText += `**Free:** ${nextFreeRewards}\n`;
            }
            
            if (profile.isPremiumPass && nextPremiumRewards) {
                nextText += `**Premium:** ${nextPremiumRewards}`;
            } else if (!profile.isPremiumPass && nextPremiumRewards) {
                nextText += `**Premium:** _Upgrade to unlock!_`;
            }
            
            if (nextText) {
                embed.addFields({
                    name: `${emojis.general.sparkles} Next Tier ${currentTier + 1} Rewards`,
                    value: nextText,
                    inline: false
                });
            }
        }
        
        // Milestones
        const milestones = [10, 25, 50, 75, 100];
        const nextMilestone = milestones.find(m => m > currentTier) || 100;
        
        const milestoneText = 
            `Tier **${nextMilestone}** - ${nextMilestone - currentTier} tiers away\n` +
            `_Special rewards at milestones!_`;
        
        embed.addFields({
            name: `${emojis.general.trophy} Next Milestone`,
            value: milestoneText,
            inline: false
        });
        
        // Footer tips
        const tips = [
            'Use !battlepass <tier> to view specific tier rewards',
            'Complete challenges to earn more XP!',
            'Premium Pass unlocks all rewards + XP boost',
            'Fishing and exploring award battle pass XP',
            'Reach tier 100 for the ultimate summer rewards!'
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        embed.setFooter({ text: `💡 ${randomTip}` });
        
        return ctx.sendMessage({ embeds: [embed] });
    }
    
    async showTierRewards(ctx, tierNumber, profile) {
        if (tierNumber < 1 || tierNumber > 100) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **❌ Invalid Tier**\n> _Tier must be between 1-100_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        const tierData = getTier(tierNumber);
        const currentTier = getTierFromXP(profile.battlePassXP);
        const isUnlocked = currentTier >= tierNumber;
        const totalXPNeeded = getTotalXPForTier(tierNumber);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        const status = isUnlocked ? `${emojis.ui.check} _Unlocked_` : `${emojis.general.locked} _Locked_`;
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **${emojis.battlepass.ticket} Battle Pass Tier ${tierNumber}**\n> ${status}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // XP Required
        const xpText = '> **📊 Requirements**\n' +
            '> **Total XP Needed:** `' + totalXPNeeded.toLocaleString() + '`\n' +
            '> **Your XP:** `' + profile.battlePassXP.toLocaleString() + '`\n' +
            '> **Remaining:** `' + Math.max(0, totalXPNeeded - profile.battlePassXP).toLocaleString() + '`';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(xpText));
        
        // Rewards
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const freeRewards = this.formatRewards(tierData.freeRewards);
        const premiumRewards = this.formatRewards(tierData.premiumRewards);
        
        let rewardsText = '> **🎁 Rewards**\n';
        
        if (freeRewards) {
            rewardsText += '> **Free Track:**\n> ' + freeRewards + '\n\n';
        } else {
            rewardsText += '> **Free Track:** _No rewards this tier_\n\n';
        }
        
        if (premiumRewards) {
            if (profile.isPremiumPass) {
                rewardsText += '> **Premium Track:** ⭐\n> ' + premiumRewards;
            } else {
                rewardsText += '> **Premium Track:** 🔒\n> _' + premiumRewards.replace(/>/g, '') + '_';
            }
        } else {
            rewardsText += '> **Premium Track:** _No rewards this tier_';
        }
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(rewardsText));
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_Use `++battlepass` to view your current progress_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    formatRewards(rewards) {
        if (!rewards || rewards.length === 0) return '';
        
        return rewards.map(reward => {
            let text = reward.emoji + ' ';
            
            if (reward.type === 'seashells') {
                text += reward.amount + ' Seashells';
            } else if (reward.type === 'sunTokens') {
                text += reward.amount + ' Sun Tokens';
            } else if (reward.type === 'badge') {
                text += reward.name + ' Badge';
            } else if (reward.type === 'fishingRod') {
                text += 'Fishing Rod Level ' + reward.level;
            } else if (reward.type === 'collectible') {
                text += reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1) + ' Collectible';
            } else if (reward.type === 'xpBoost') {
                text += 'XP Boost ×' + reward.multiplier + ' (' + reward.duration + ')';
            } else if (reward.type === 'beachUnlock') {
                text += 'Beach Unlock';
            } else if (reward.type === 'mysteryBox') {
                text += reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1) + ' Mystery Box';
            } else if (reward.type === 'pet') {
                text += reward.name + ' Pet';
            } else if (reward.type === 'profileFrame') {
                text += reward.name + ' Frame';
            } else if (reward.type === 'profileBanner') {
                text += reward.name + ' Banner';
            } else if (reward.type === 'emote') {
                text += reward.name;
            } else if (reward.type === 'title') {
                text += reward.name + ' Title';
            } else {
                text += reward.type;
            }
            
            return text;
        }).join(' **•** ');
    }
}
