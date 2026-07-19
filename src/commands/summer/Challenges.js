import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import SummerLeaderboard from '../../schemas/summerLeaderboard.js';
import { isChallengeCompleted, isChallengeExpired } from '../../data/challenges.js';
import emojis from '../../config/emojis.js';
import { generateChallengeCard } from '../../utils/challengeCard.js';
import { MediaGalleryBuilder, MediaGalleryItemBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default class Challenges extends Command {
    constructor(client) {
        super(client, {
            name: 'challenges',
            description: {
                content: 'View your summer challenges and progress',
                usage: '[daily|weekly|server]',
                examples: ['challenges', 'challenges daily', 'challenges server'],
            },
            aliases: ['challenge', 'task', 'tasks', 'quests'],
            category: 'summer',
            cooldown: 10,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'type',
                    description: 'Challenge type to view',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Daily', value: 'daily' },
                        { name: 'Weekly', value: 'weekly' },
                        { name: 'Server', value: 'server' }
                    ]
                },
            ]
        });
    }
    
    async run(ctx, args) {
        // Get or create profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: ctx.author.id,
                username: ctx.author.username,
                dailyChallenges: []
            });
            await profile.save();
        }
        
        // Determine which challenges to show (default to weekly to match reference)
        const type = ctx.isInteraction && ctx.interaction.options.getString('type')
            ? ctx.interaction.options.getString('type')
            : (args[0]?.toLowerCase() || 'weekly');
        
        if (type === 'server') {
            return this.showServerChallenges(ctx);
        }
        
        // Generate the challenge image
        let imageBuffer = null;
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        if (type === 'daily') {
            imageBuffer = await this.generateDailyChallengeImage(profile, ctx);
        } else if (type === 'weekly') {
            imageBuffer = await this.generateWeeklyChallengeImage(profile, ctx);
        }
        
        // Add tab buttons at the top of container
        const dailyButton = new ButtonBuilder()
            .setCustomId(`challenges_daily_${ctx.author.id}`)
            .setLabel('Daily')
            .setEmoji('📋')
            .setStyle(type === 'daily' ? ButtonStyle.Primary : ButtonStyle.Secondary);
        
        const weeklyButton = new ButtonBuilder()
            .setCustomId(`challenges_weekly_${ctx.author.id}`)
            .setLabel('Weekly')
            .setEmoji('📆')
            .setStyle(type === 'weekly' ? ButtonStyle.Primary : ButtonStyle.Secondary);
        
        const questsButton = new ButtonBuilder()
            .setCustomId(`challenges_server_${ctx.author.id}`)
            .setLabel('Quests')
            .setEmoji('📜')
            .setStyle(type === 'server' ? ButtonStyle.Primary : ButtonStyle.Secondary);
        
        // Add buttons to container
        container.addActionRowComponents((row) => row.addComponents(dailyButton, weeklyButton, questsButton));
        
        // Add separator
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Add image to container if available
        if (imageBuffer) {
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL('attachment://challenges.png')
                )
            );
            
            // Add footer after image
            const completedCount = type === 'daily' 
                ? (profile.dailyChallenges?.filter(c => isChallengeCompleted(c)).length || 0)
                : (profile.weeklyChallenges?.filter(c => isChallengeCompleted(c)).length || 0);
            const totalCount = type === 'daily'
                ? (profile.dailyChallenges?.length || 0)
                : (profile.weeklyChallenges?.length || 0);
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const footerText = `🕐 ${type === 'daily' ? 'Daily' : 'Weekly'} checklist resets in ${type === 'daily' ? '12 hours' : '3 days'}`;
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(footerText)
            );
            
            // Add claim button if all completed
            if (completedCount === totalCount && completedCount > 0) {
                container.addSeparatorComponents((separator) => separator.setDivider(true));
                const claimButton = new ButtonBuilder()
                    .setCustomId(`claim_${type}_${ctx.author.id}`)
                    .setLabel(`Claim ${type === 'daily' ? 'Daily' : 'Weekly'} Rewards`)
                    .setEmoji('🎁')
                    .setStyle(ButtonStyle.Success);
                
                container.addActionRowComponents((row) => row.addComponents(claimButton));
            }
        } else {
            // No challenges available
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('No challenges available.\nUse `++daily` to get new challenges!')
            );
        }
        
        // Send message with container
        const messageOptions = { components: [container] };
        if (imageBuffer) {
            messageOptions.files = [{ attachment: imageBuffer, name: 'challenges.png' }];
        }
        
        const message = await ctx.sendMessage(messageOptions);
        
        // Handle button interactions
        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 300000 // 5 minutes
        });
        
        collector.on('collect', async interaction => {
            await interaction.deferUpdate();
            
            // Reload profile
            profile = await SummerProfile.findById(ctx.author.id);
            
            // Determine which tab was clicked
            let newType = 'weekly';
            if (interaction.customId.includes('daily')) {
                newType = 'daily';
            } else if (interaction.customId.includes('weekly')) {
                newType = 'weekly';
            } else if (interaction.customId.includes('server')) {
                // Show server challenges in a new message
                await this.showServerChallenges(ctx);
                return;
            }
            
            // Generate new image
            let newImageBuffer = null;
            if (newType === 'daily') {
                newImageBuffer = await this.generateDailyChallengeImage(profile, ctx);
            } else if (newType === 'weekly') {
                newImageBuffer = await this.generateWeeklyChallengeImage(profile, ctx);
            }
            
            // Update buttons
            dailyButton.setStyle(newType === 'daily' ? ButtonStyle.Primary : ButtonStyle.Secondary);
            weeklyButton.setStyle(newType === 'weekly' ? ButtonStyle.Primary : ButtonStyle.Secondary);
            questsButton.setStyle(newType === 'server' ? ButtonStyle.Primary : ButtonStyle.Secondary);
            
            // Update container
            const newContainer = this.client.container()
                .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
            
            // Add buttons to container
            newContainer.addActionRowComponents((row) => row.addComponents(dailyButton, weeklyButton, questsButton));
            
            // Add separator
            newContainer.addSeparatorComponents((separator) => separator.setDivider(true));
            
            if (newImageBuffer) {
                newContainer.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(
                        new MediaGalleryItemBuilder()
                            .setURL('attachment://challenges.png')
                    )
                );
            } else {
                newContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('No challenges available.\nUse `++daily` to get new challenges!')
                );
            }
            
            const updateOptions = { components: [newContainer] };
            if (newImageBuffer) {
                updateOptions.files = [{ attachment: newImageBuffer, name: 'challenges.png' }];
            }
            
            await interaction.editReply(updateOptions);
        });
        
        collector.on('end', () => {
            // Disable buttons after timeout
            dailyButton.setDisabled(true);
            weeklyButton.setDisabled(true);
            questsButton.setDisabled(true);
            
            const disabledContainer = this.client.container()
                .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
            
            disabledContainer.addActionRowComponents((row) => row.addComponents(dailyButton, weeklyButton, questsButton));
            disabledContainer.addSeparatorComponents((separator) => separator.setDivider(true));
            
            if (imageBuffer) {
                disabledContainer.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(
                        new MediaGalleryItemBuilder()
                            .setURL('attachment://challenges.png')
                    )
                );
            }
            
            const disabledOptions = { components: [disabledContainer] };
            if (imageBuffer) {
                disabledOptions.files = [{ attachment: imageBuffer, name: 'challenges.png' }];
            }
            
            message.edit(disabledOptions).catch(() => {});
        });
    }
    
    async generateDailyChallengeImage(profile, ctx) {
        if (!profile.dailyChallenges || profile.dailyChallenges.length === 0) {
            return null;
        }
        
        const validChallenges = profile.dailyChallenges.filter(c => !isChallengeExpired(c));
        
        if (validChallenges.length === 0) {
            return null;
        }
        
        // Format challenges for canvas
        const challenges = validChallenges.map(c => ({
            icon: this.getChallengeIcon(c.description),
            description: c.description,
            progress: c.progress || 0,
            goal: c.goal,
            completed: isChallengeCompleted(c)
        }));
        
        // Generate image
        const image = await generateChallengeCard({
            type: 'daily',
            username: ctx.author.username,
            challenges: challenges
        });
        
        return image.attachment;
    }
    
    async generateWeeklyChallengeImage(profile, ctx) {
        if (!profile.weeklyChallenges || profile.weeklyChallenges.length === 0) {
            return null;
        }
        
        const validWeeklies = profile.weeklyChallenges.filter(c => !isChallengeExpired(c));
        
        if (validWeeklies.length === 0) {
            return null;
        }
        
        // Format challenges for canvas
        const challenges = validWeeklies.map(c => ({
            icon: this.getChallengeIcon(c.description),
            description: c.description,
            progress: c.progress || 0,
            goal: c.goal,
            completed: isChallengeCompleted(c)
        }));
        
        // Generate image
        const image = await generateChallengeCard({
            type: 'weekly',
            username: ctx.author.username,
            challenges: challenges
        });
        
        return image.attachment;
    }
    
    async showDailyChallenges(container, profile, ctx) {
        if (!profile.dailyChallenges || profile.dailyChallenges.length === 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('No daily challenges available.\nUse `++daily` to get new challenges!')
            );
            return null;
        }
        
        const validChallenges = profile.dailyChallenges.filter(c => !isChallengeExpired(c));
        
        if (validChallenges.length === 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('All daily challenges have expired.\nUse `++daily` to get new challenges!')
            );
            return null;
        }
        
        // Format challenges for canvas
        const challenges = validChallenges.map(c => ({
            icon: this.getChallengeIcon(c.description),
            description: c.description,
            progress: c.progress || 0,
            goal: c.goal,
            completed: isChallengeCompleted(c)
        }));
        
        // Generate image
        const image = await generateChallengeCard({
            type: 'daily',
            username: ctx.author.username,
            challenges: challenges
        });
        
        return image;
    }
    
    async showWeeklyChallenges(container, profile, ctx) {
        if (!profile.weeklyChallenges || profile.weeklyChallenges.length === 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('No weekly challenges available.\nWeekly challenges are generated automatically!')
            );
            return null;
        }
        
        const validWeeklies = profile.weeklyChallenges.filter(c => !isChallengeExpired(c));
        
        if (validWeeklies.length === 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('All weekly challenges have expired.\nNew challenges will be generated soon!')
            );
            return null;
        }
        
        // Format challenges for canvas
        const challenges = validWeeklies.map(c => ({
            icon: this.getChallengeIcon(c.description),
            description: c.description,
            progress: c.progress || 0,
            goal: c.goal,
            completed: isChallengeCompleted(c)
        }));
        
        // Generate image
        const image = await generateChallengeCard({
            type: 'weekly',
            username: ctx.author.username,
            challenges: challenges
        });
        
        return image;
    }
    
    getChallengeIcon(description) {
        // Map challenge descriptions to emojis
        const desc = description.toLowerCase();
        if (desc.includes('fish') || desc.includes('catch')) return '🎣';
        if (desc.includes('battle') || desc.includes('boss')) return '⚔️';
        if (desc.includes('vote')) return '📮';
        if (desc.includes('cookie')) return '🍪';
        if (desc.includes('ticket')) return '🎫';
        if (desc.includes('explore')) return '🗺️';
        if (desc.includes('sell')) return '💰';
        if (desc.includes('hunt')) return '🌱';
        if (desc.includes('collect')) return '📦';
        if (desc.includes('claim')) return '🎁';
        return '🎯';
    }
    
    async showServerChallenges(ctx) {
        // Get server leaderboard data
        let leaderboard = await SummerLeaderboard.findOne({ season: '2026' });
        
        if (!leaderboard || !leaderboard.serverChallenges || leaderboard.serverChallenges.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ## **🌍 Server Challenges**\n> _No active server challenges at the moment._\n\n> _Check back soon for community events!_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **🌍 Server-Wide Challenges**\n> _Work together to complete these challenges!_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Show each server challenge
        leaderboard.serverChallenges.forEach((challenge, i) => {
            const progress = challenge.currentProgress || 0;
            const percent = Math.floor((progress / challenge.goal) * 100);
            const completed = challenge.isCompleted || progress >= challenge.goal;
            
            // Progress bar
            const barLength = 15;
            const filled = Math.floor((progress / challenge.goal) * barLength);
            const bar = emojis.battlepass.bar.repeat(filled) + emojis.battlepass.empty.repeat(barLength - filled);
            
            let challengeText = `> **${completed ? emojis.ui.check : emojis.progression.target} ${challenge.title}**\n`;
            challengeText += `> _${challenge.description}_\n>\n`;
            challengeText += `> ${bar}\n`;
            challengeText += `> **Progress:** \`${progress.toLocaleString()}/${challenge.goal.toLocaleString()}\` (${percent}%)\n`;
            challengeText += `> **Reward:** ${challenge.reward}\n`;
            
            if (!completed && challenge.expiresAt) {
                const expiresAt = Math.floor(new Date(challenge.expiresAt).getTime() / 1000);
                challengeText += '> **Expires:** <t:' + expiresAt + ':R>';
            } else if (completed) {
                challengeText += '> **Status:** 🎉 _COMPLETED!_';
            }
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(challengeText));
            
            if (i < leaderboard.serverChallenges.length - 1) {
                container.addSeparatorComponents((separator) => separator.setDivider(false));
            }
        });
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_💡 Everyone\'s progress counts! Keep fishing, exploring, and collecting to help complete server challenges!_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
