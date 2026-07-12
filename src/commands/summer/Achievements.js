import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getTierFromXP } from '../../data/battlepass.js';
import {
    achievementCategories,
    achievementTiers,
    getAllAchievements,
    getAchievementsByCategory,
    getAchievementsByTier,
    checkAchievementProgress,
    checkAndAwardAchievements,
    getTierColor,
    getTierEmoji
} from '../../data/achievements.js';
import { emojis } from '../../config/emojis.js';

export default class Achievements extends Command {
    constructor(client) {
        super(client, {
            name: 'achievements',
            description: {
                content: 'View your achievements and track completion progress',
                usage: '[all|category|progress|claim]',
                examples: [
                    'achievements',
                    'achievements all',
                    'achievements fishing',
                    'achievements progress',
                    'achievements claim'
                ],
            },
            aliases: ['achieve', 'ach'],
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
                    description: 'Achievement action',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'All - View all achievements', value: 'all' },
                        { name: 'Progress - View progress on incomplete', value: 'progress' },
                        { name: 'Claim - Claim pending achievements', value: 'claim' },
                        { name: 'Fishing - View fishing achievements', value: 'fishing' },
                        { name: 'Exploration - View exploration achievements', value: 'exploration' },
                        { name: 'Collection - View collection achievements', value: 'collection' },
                        { name: 'Combat - View combat achievements', value: 'combat' },
                        { name: 'Social - View social achievements', value: 'social' },
                        { name: 'Prestige - View prestige achievements', value: 'prestige' },
                        { name: 'Mastery - View mastery achievements', value: 'mastery' }
                    ]
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
        
        // Ensure achievements array exists
        if (!profile.achievements) {
            profile.achievements = [];
        }
        
        // Parse action
        let action = 'summary'; // Default
        if (ctx.isInteraction) {
            action = ctx.interaction.options.getString('action') || 'summary';
        } else if (args.length > 0) {
            const firstArg = args[0].toLowerCase();
            if (['all', 'list', 'view'].includes(firstArg)) {
                action = 'all';
            } else if (['progress', 'incomplete', 'todo'].includes(firstArg)) {
                action = 'progress';
            } else if (['claim', 'unlock', 'collect'].includes(firstArg)) {
                action = 'claim';
            } else if (Object.values(achievementCategories).includes(firstArg)) {
                action = firstArg; // Category name
            }
        }
        
        // Route to handler
        if (action === 'all') {
            return this.showAllAchievements(ctx, profile);
        } else if (action === 'progress') {
            return this.showProgress(ctx, profile);
        } else if (action === 'claim') {
            return this.claimAchievements(ctx, profile);
        } else if (Object.values(achievementCategories).includes(action)) {
            return this.showCategoryAchievements(ctx, profile, action);
        } else {
            return this.showSummary(ctx, profile);
        }
    }
    
    async showSummary(ctx, profile) {
        const allAchievements = getAllAchievements();
        const unlockedCount = profile.achievements.length;
        const totalCount = allAchievements.length;
        const percentComplete = ((unlockedCount / totalCount) * 100).toFixed(1);
        
        // Count by tier
        const tierCounts = {};
        Object.values(achievementTiers).forEach(tier => {
            tierCounts[tier] = {
                total: allAchievements.filter(a => a.tier === tier).length,
                unlocked: profile.achievements.filter(a => {
                    const achievement = allAchievements.find(ach => ach.id === a.achievementId);
                    return achievement && achievement.tier === tier;
                }).length
            };
        });
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **🏆 Achievement Summary**\n> _${ctx.author.tag}_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Overall progress
        const progressBar = this.createProgressBar(unlockedCount, totalCount);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **📊 Overall Progress:**\n> \`${progressBar}\`\n> \`${unlockedCount}/${totalCount}\` achievements (${percentComplete}%)`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Tier breakdown
        let tierText = '> **🎖️ By Tier:**\n';
        Object.values(achievementTiers).forEach(tier => {
            const emoji = getTierEmoji(tier);
            const count = tierCounts[tier];
            tierText += `> ${emoji} **${tier.charAt(0).toUpperCase() + tier.slice(1)}:** \`${count.unlocked}/${count.total}\`\n`;
        });
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(tierText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Category breakdown
        let categoryText = '> **📂 By Category:**\n';
        Object.values(achievementCategories).forEach(category => {
            const categoryAchievements = getAchievementsByCategory(category);
            const unlockedInCategory = profile.achievements.filter(a => {
                const achievement = categoryAchievements.find(ach => ach.id === a.achievementId);
                return achievement !== undefined;
            }).length;
            
            const icon = this.getCategoryIcon(category);
            categoryText += `> ${icon} **${category.charAt(0).toUpperCase() + category.slice(1)}:** \`${unlockedInCategory}/${categoryAchievements.length}\`\n`;
        });
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(categoryText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Commands
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💡 Commands:**\n> \`++achievements all\` - View all achievements\n> \`++achievements progress\` - View incomplete achievements\n> \`++achievements claim\` - Claim completed achievements\n> \`++achievements <category>\` - View by category`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showAllAchievements(ctx, profile) {
        const allAchievements = getAllAchievements();
        
        // Sort by tier and category
        const sortedAchievements = allAchievements.sort((a, b) => {
            const tierOrder = Object.values(achievementTiers);
            const tierDiff = tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
            if (tierDiff !== 0) return tierDiff;
            return a.category.localeCompare(b.category);
        });
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **🏆 All Achievements**\n> _${sortedAchievements.length} total achievements_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Show achievements in chunks (10 per container to avoid hitting message limits)
        let achievementText = '';
        let count = 0;
        
        sortedAchievements.forEach((achievement, index) => {
            if (achievement.hidden && !profile.achievements.some(a => a.achievementId === achievement.id)) {
                return; // Don't show hidden achievements unless unlocked
            }
            
            const isUnlocked = profile.achievements.some(a => a.achievementId === achievement.id);
            const tierEmoji = getTierEmoji(achievement.tier);
            const icon = isUnlocked ? '✅' : '🔒';
            
            achievementText += `> ${icon} ${tierEmoji} **${achievement.name}**\n`;
            achievementText += `> ${achievement.description}\n`;
            
            if (isUnlocked) {
                const unlockData = profile.achievements.find(a => a.achievementId === achievement.id);
                achievementText += `> _Unlocked <t:${Math.floor(unlockData.unlockedAt.getTime() / 1000)}:R>_\n`;
            } else {
                const progress = checkAchievementProgress(profile, achievement);
                if (progress.progress > 0) {
                    achievementText += `> _Progress: ${progress.currentValue}/${progress.requiredValue} (${progress.progressPercent}%)_\n`;
                }
            }
            achievementText += '> \n';
            
            count++;
            
            // Add to container every 8 achievements
            if (count % 8 === 0 || index === sortedAchievements.length - 1) {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(achievementText)
                );
                achievementText = '';
                
                if (index < sortedAchievements.length - 1) {
                    container.addSeparatorComponents((separator) => separator.setDivider(true));
                }
            }
        });
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showCategoryAchievements(ctx, profile, category) {
        const categoryAchievements = getAchievementsByCategory(category);
        const unlockedCount = profile.achievements.filter(a => {
            return categoryAchievements.some(ach => ach.id === a.achievementId);
        }).length;
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        const categoryIcon = this.getCategoryIcon(category);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## ${categoryIcon} **${category.charAt(0).toUpperCase() + category.slice(1)} Achievements**\n> _${unlockedCount}/${categoryAchievements.length} unlocked_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        let achievementText = '';
        categoryAchievements.forEach(achievement => {
            if (achievement.hidden && !profile.achievements.some(a => a.achievementId === achievement.id)) {
                return;
            }
            
            const isUnlocked = profile.achievements.some(a => a.achievementId === achievement.id);
            const tierEmoji = getTierEmoji(achievement.tier);
            const icon = isUnlocked ? '✅' : '🔒';
            
            achievementText += `> ${icon} ${tierEmoji} ${achievement.icon} **${achievement.name}**\n`;
            achievementText += `> ${achievement.description}\n`;
            
            if (isUnlocked) {
                const rewards = this.formatRewards(achievement.rewards);
                achievementText += `> _Rewards: ${rewards}_\n`;
            } else {
                const progress = checkAchievementProgress(profile, achievement);
                if (progress.progress > 0) {
                    const progressBar = this.createProgressBar(progress.currentValue, progress.requiredValue);
                    achievementText += `> \`${progressBar}\` ${progress.progressPercent}%\n`;
                } else {
                    const rewards = this.formatRewards(achievement.rewards);
                    achievementText += `> _Rewards: ${rewards}_\n`;
                }
            }
            achievementText += '> \n';
        });
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(achievementText || '> _No achievements in this category_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showProgress(ctx, profile) {
        const allAchievements = getAllAchievements();
        
        // Filter incomplete achievements with progress
        const incompleteAchievements = allAchievements.filter(achievement => {
            if (achievement.hidden && !profile.achievements.some(a => a.achievementId === achievement.id)) {
                return false;
            }
            const isUnlocked = profile.achievements.some(a => a.achievementId === achievement.id);
            if (isUnlocked) return false;
            
            const progress = checkAchievementProgress(profile, achievement);
            return progress.progress > 0;
        });
        
        // Sort by progress percentage (closest to completion first)
        incompleteAchievements.sort((a, b) => {
            const progressA = checkAchievementProgress(profile, a);
            const progressB = checkAchievementProgress(profile, b);
            return progressB.progress - progressA.progress;
        });
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **📈 Achievement Progress**\n> _${incompleteAchievements.length} in progress_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        if (incompleteAchievements.length === 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.info} No achievements in progress**\n> _Start playing to make progress on achievements!_\n> \n> Use \`++achievements all\` to see all available achievements.`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        let progressText = '';
        const showCount = Math.min(15, incompleteAchievements.length);
        
        for (let i = 0; i < showCount; i++) {
            const achievement = incompleteAchievements[i];
            const progress = checkAchievementProgress(profile, achievement);
            const tierEmoji = getTierEmoji(achievement.tier);
            const progressBar = this.createProgressBar(progress.currentValue, progress.requiredValue);
            
            progressText += `> ${tierEmoji} **${achievement.name}**\n`;
            progressText += `> \`${progressBar}\` ${progress.progressPercent}%\n`;
            progressText += `> _${progress.currentValue}/${progress.requiredValue} ${achievement.description}_\n`;
            progressText += '> \n';
        }
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(progressText)
        );
        
        if (incompleteAchievements.length > showCount) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> _Showing ${showCount} of ${incompleteAchievements.length} achievements in progress_`)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async claimAchievements(ctx, profile) {
        // Check for newly completed achievements
        const newAchievements = checkAndAwardAchievements(profile);
        
        if (newAchievements.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.info} No Achievements to Claim**\n> _Keep playing to unlock more achievements!_\n> \n> Use \`++achievements progress\` to see your progress.`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        await profile.save();
        
        // Show claimed achievements
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.celebrate} Achievements Unlocked!**\n> _Claimed ${newAchievements.length} achievement${newAchievements.length > 1 ? 's' : ''}!_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Show each achievement
        newAchievements.forEach(result => {
            const achievement = result.achievement;
            const tierEmoji = getTierEmoji(achievement.tier);
            const rewards = this.formatRewards(result.rewards);
            
            let achievementText = `> ${tierEmoji} ${achievement.icon} **${achievement.name}**\n`;
            achievementText += `> ${achievement.description}\n`;
            achievementText += `> **Rewards:** ${rewards}`;
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(achievementText)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(false));
        });
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Total rewards summary
        const totalRewards = newAchievements.reduce((acc, result) => {
            acc.xp += result.rewards.xp || 0;
            acc.seashells += result.rewards.seashells || 0;
            acc.sunTokens += result.rewards.sunTokens || 0;
            acc.prestigePoints += result.rewards.prestigePoints || 0;
            return acc;
        }, { xp: 0, seashells: 0, sunTokens: 0, prestigePoints: 0 });
        
        let totalText = '> **📦 Total Rewards:**\n';
        if (totalRewards.xp > 0) totalText += `> **•** XP: \`+${totalRewards.xp.toLocaleString()}\` 📈\n`;
        if (totalRewards.seashells > 0) totalText += `> **•** Seashells: \`+${totalRewards.seashells.toLocaleString()}\` ${emojis.currency.seashell}\n`;
        if (totalRewards.sunTokens > 0) totalText += `> **•** Sun Tokens: \`+${totalRewards.sunTokens}\` ${emojis.currency.sunToken}\n`;
        if (totalRewards.prestigePoints > 0) totalText += `> **•** Prestige Points: \`+${totalRewards.prestigePoints}\` ⭐\n`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(totalText)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    // Helper methods
    createProgressBar(current, total, length = 10) {
        const filled = Math.floor((current / total) * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
    
    formatRewards(rewards) {
        const parts = [];
        if (rewards.xp) parts.push(`${rewards.xp} XP`);
        if (rewards.seashells) parts.push(`${rewards.seashells} ${emojis.currency.seashell}`);
        if (rewards.sunTokens) parts.push(`${rewards.sunTokens} ${emojis.currency.sunToken}`);
        if (rewards.prestigePoints) parts.push(`${rewards.prestigePoints} Prestige Points`);
        return parts.join(', ') || 'None';
    }
    
    getCategoryIcon(category) {
        const icons = {
            [achievementCategories.FISHING]: '🎣',
            [achievementCategories.EXPLORATION]: '🗺️',
            [achievementCategories.COLLECTION]: '🐚',
            [achievementCategories.COMBAT]: '⚔️',
            [achievementCategories.SOCIAL]: '🤝',
            [achievementCategories.PRESTIGE]: '⭐',
            [achievementCategories.MASTERY]: '🏅'
        };
        return icons[category] || '🏆';
    }
}
