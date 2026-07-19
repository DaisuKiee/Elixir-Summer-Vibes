import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getLevel, getLevelFromXP, getTotalXPForLevel, isInfiniteLevel, getRankTitle } from '../../data/levelSystem.js';
import emojis from '../../config/emojis.js';

export default class Level extends Command {
    constructor(client) {
        super(client, {
            name: 'level',
            description: '⭐ View your player level progress and rewards',
            usage: '[level]',
            examples: ['level', 'level 25'],
            aliases: ['lvl', 'rank', 'battlepass', 'bp'],
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
        
        // Migrate old battle pass data if needed
        if (!profile.totalXP && profile.battlePassXP) {
            profile.totalXP = profile.battlePassXP;
            profile.level = profile.battlePassLevel || 1;
            profile.xp = profile.battlePassXP;
        }
        
        // Check if viewing specific level
        const viewLevel = args[0] ? parseInt(args[0]) : null;
        
        if (viewLevel) {
            return this.showLevelRewards(ctx, viewLevel, profile);
        }
        
        // Calculate current level
        const currentLevel = getLevelFromXP(profile.totalXP || profile.xp || 0);
        const rankTitle = getRankTitle(currentLevel);
        const currentLevelData = getLevel(currentLevel);
        const nextLevelData = getLevel(currentLevel + 1);
        
        // Calculate XP for next level
        const currentLevelTotalXP = getTotalXPForLevel(currentLevel);
        const nextLevelTotalXP = getTotalXPForLevel(currentLevel + 1);
        const xpInCurrentLevel = (profile.totalXP || profile.xp || 0) - currentLevelTotalXP;
        const xpNeededForNext = nextLevelTotalXP - currentLevelTotalXP;
        const progressPercent = Math.floor((xpInCurrentLevel / xpNeededForNext) * 100);
        
        // Create progress bar (20 characters for better visual)
        const progressBarLength = 20;
        const filledBars = Math.floor((xpInCurrentLevel / xpNeededForNext) * progressBarLength);
        const progressBar = '█'.repeat(filledBars) + '░'.repeat(progressBarLength - filledBars);
        
        // Create container
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header with username and level
        const headerText = `> # ${emojis.progression.rank} **${ctx.author.username}'s Level**\n` +
            `> ${isInfiniteLevel(currentLevel) ? '♾️' : '⭐'} **Level ${currentLevel}** ${isInfiniteLevel(currentLevel) ? '' : `/ 100`} **•** ${getRankEmoji(currentLevel)} **${rankTitle}**`;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(headerText));
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // XP Progress Section
        const progressText = '> ## 📊 Experience Progress\n' +
            '> \n' +
            `> \`${progressBar}\` **${progressPercent}%**\n` +
            '> \n' +
            `> **Current XP:** \`${xpInCurrentLevel.toLocaleString()}\` / \`${xpNeededForNext.toLocaleString()}\`\n` +
            `> **Total XP:** \`${(profile.totalXP || profile.xp || 0).toLocaleString()}\`\n` +
            `> **XP Needed:** \`${(xpNeededForNext - xpInCurrentLevel).toLocaleString()}\` to Level ${currentLevel + 1}`;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(progressText));
        
        // Current Level Rewards (if any)
        if (currentLevelData && currentLevelData.rewards && currentLevelData.rewards.length > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const rewardsText = `> ## ${emojis.general.gift} Level ${currentLevel} Rewards\n` +
                '> \n' +
                this.formatRewardsContainer(currentLevelData.rewards);
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(rewardsText));
        }
        
        // Next Level Preview
        if (nextLevelData) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            let nextText = `> ## ${emojis.general.sparkles} Next: Level ${currentLevel + 1}\n> \n`;
            
            if (nextLevelData.rewards && nextLevelData.rewards.length > 0) {
                nextText += this.formatRewardsContainer(nextLevelData.rewards);
            } else {
                nextText += '> _No special rewards at this level_';
            }
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(nextText));
        }
        
        // Milestones Section
        const milestones = [10, 25, 40, 50, 75, 100];
        const nextMilestone = milestones.find(m => m > currentLevel);
        
        if (nextMilestone) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const levelsAway = nextMilestone - currentLevel;
            const milestoneRank = getRankTitle(nextMilestone);
            
            const milestoneText = `> ## ${emojis.general.trophy} Next Milestone\n` +
                '> \n' +
                `> **Level ${nextMilestone}** - ${getRankEmoji(nextMilestone)} **${milestoneRank}**\n` +
                `> \`${levelsAway}\` level${levelsAway === 1 ? '' : 's'} away\n` +
                '> \n' +
                '> _Major rewards and new rank title!_';
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(milestoneText));
        }
        
        // Footer tip
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const tips = [
            'Use `++level <number>` to preview rewards',
            'Fish, explore, and hunt to earn XP!',
            'Complete daily challenges for bonus XP',
            'Your level is permanent - never resets!',
            'Reach level 100 to become a Grandmaster!'
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`_💡 ${randomTip}_`));
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showLevelRewards(ctx, levelNumber, profile) {
        if (levelNumber < 1 || levelNumber > 100) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ## ❌ Invalid Level\n> \n> _Level must be between **1-100**_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        const levelData = getLevel(levelNumber);
        const currentLevel = getLevelFromXP(profile.totalXP || profile.xp || 0);
        const isUnlocked = currentLevel >= levelNumber;
        const totalXPNeeded = getTotalXPForLevel(levelNumber);
        const rankTitle = getRankTitle(levelNumber);
        const userXP = profile.totalXP || profile.xp || 0;
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        const statusEmoji = isUnlocked ? emojis.ui.check : emojis.general.locked;
        const statusText = isUnlocked ? '_Unlocked_' : '_Locked_';
        
        const headerText = `> # ⭐ Level ${levelNumber}\n` +
            `> ${getRankEmoji(levelNumber)} **${rankTitle}** ${statusEmoji} ${statusText}`;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(headerText));
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // XP Requirements
        const remaining = Math.max(0, totalXPNeeded - userXP);
        const progress = userXP >= totalXPNeeded ? 100 : Math.floor((userXP / totalXPNeeded) * 100);
        
        const requirementsText = '> ## 📊 Requirements\n' +
            '> \n' +
            `> **Total XP Needed:** \`${totalXPNeeded.toLocaleString()}\`\n` +
            `> **Your XP:** \`${userXP.toLocaleString()}\` (**${progress}%**)\n` +
            `> **Remaining:** \`${remaining.toLocaleString()}\``;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(requirementsText));
        
        // Rewards Section
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        let rewardsText = '> ## 🎁 Level Rewards\n> \n';
        
        if (levelData.rewards && levelData.rewards.length > 0) {
            rewardsText += this.formatRewardsContainer(levelData.rewards);
        } else {
            rewardsText += '> _No special rewards at this level_\n> _Keep leveling for milestone rewards!_';
        }
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(rewardsText));
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_Use `++level` to view your current progress_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    formatRewardsContainer(rewards) {
        if (!rewards || rewards.length === 0) return '';
        
        const formattedRewards = rewards.map(reward => {
            let text = `> **•** ${reward.emoji} `;
            
            if (reward.type === 'seashells') {
                text += `**${reward.amount.toLocaleString()}** Seashells`;
            } else if (reward.type === 'sunTokens') {
                text += `**${reward.amount.toLocaleString()}** Sun Tokens`;
            } else if (reward.type === 'badge') {
                text += `**${reward.name}** Badge`;
            } else if (reward.type === 'fishingRod') {
                text += `Fishing Rod **Level ${reward.level}**`;
            } else if (reward.type === 'collectible') {
                const rarityUpper = reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1);
                text += `**${rarityUpper}** Collectible`;
            } else if (reward.type === 'xpBoost') {
                text += `XP Boost **×${reward.multiplier}** (${reward.duration})`;
            } else if (reward.type === 'beachUnlock') {
                text += `**New Beach** Unlocked`;
            } else if (reward.type === 'mysteryBox') {
                const rarityUpper = reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1);
                text += `**${rarityUpper}** Mystery Box`;
            } else if (reward.type === 'pet') {
                text += `**${reward.name}** Pet`;
            } else if (reward.type === 'profileFrame') {
                text += `**${reward.name}** Frame`;
            } else if (reward.type === 'profileBanner') {
                text += `**${reward.name}** Banner`;
            } else if (reward.type === 'emote') {
                text += `**${reward.name}**`;
            } else if (reward.type === 'title') {
                text += `**${reward.name}** Title`;
            } else {
                text += `**${reward.type}**`;
            }
            
            return text;
        });
        
        return formattedRewards.join('\n');
    }
}

// Helper function to get emoji for rank
function getRankEmoji(level) {
    if (level >= 100) return '💎';
    if (level >= 75) return '👑';
    if (level >= 50) return '⭐';
    if (level >= 25) return '🌟';
    if (level >= 10) return '✨';
    return '🔰';
}
