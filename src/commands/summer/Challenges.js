import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import SummerLeaderboard from '../../schemas/summerLeaderboard.js';
import { isChallengeCompleted, isChallengeExpired, generateWeeklyChallenges } from '../../data/challenges.js';
import emojis from '../../config/emojis.js';

export default class Challenges extends Command {
    constructor(client) {
        super(client, {
            name: 'challenges',
            description: {
                content: 'View your summer challenges and progress',
                usage: '[daily|weekly|server]',
                examples: ['challenges', 'challenges daily', 'challenges server'],
            },
            aliases: ['challenge', 'tasks', 'quests'],
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
        
        // Fix corrupted challenges (if they're strings instead of objects)
        let needsSave = false;
        
        if (profile.dailyChallenges && typeof profile.dailyChallenges === 'string') {
            console.log('[FIX] Detected corrupted daily challenges (string), clearing...');
            profile.dailyChallenges = [];
            needsSave = true;
        }
        if (profile.weeklyChallenges && typeof profile.weeklyChallenges === 'string') {
            console.log('[FIX] Detected corrupted weekly challenges (string), clearing...');
            profile.weeklyChallenges = [];
            needsSave = true;
        }
        
        // Also check if first element is a string
        if (Array.isArray(profile.dailyChallenges) && profile.dailyChallenges.length > 0 && typeof profile.dailyChallenges[0] === 'string') {
            console.log('[FIX] Detected corrupted daily challenges (string elements), clearing...');
            profile.dailyChallenges = [];
            needsSave = true;
        }
        if (Array.isArray(profile.weeklyChallenges) && profile.weeklyChallenges.length > 0 && typeof profile.weeklyChallenges[0] === 'string') {
            console.log('[FIX] Detected corrupted weekly challenges (string elements), clearing...');
            profile.weeklyChallenges = [];
            needsSave = true;
        }
        
        if (needsSave) {
            await profile.save();
            return ctx.sendMessage(
                `${emojis.general.info} **Challenges Reset**\n\n` +
                `Your challenges had corrupted data and have been cleared.\n` +
                `Please run \`!daily\` to generate fresh challenges!`
            );
        }
        
        // Determine which challenges to show
        const type = ctx.isInteraction && ctx.interaction.options.getString('type')
            ? ctx.interaction.options.getString('type')
            : (args[0]?.toLowerCase() || 'all');
        
        if (type === 'server') {
            return this.showServerChallenges(ctx);
        }
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **🎯 Summer Challenges**\n> _Complete challenges to earn rewards!_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Show daily challenges
        if (type === 'all' || type === 'daily') {
            if (profile.dailyChallenges && profile.dailyChallenges.length > 0) {
                const validChallenges = profile.dailyChallenges.filter(c => !isChallengeExpired(c));
                
                if (validChallenges.length > 0) {
                    let dailyText = '> **📅 Daily Challenges**\n';
                    
                    validChallenges.forEach((challenge, i) => {
                        const progress = challenge.progress || 0;
                        const percent = Math.floor((progress / challenge.goal) * 100);
                        const completed = isChallengeCompleted(challenge);
                        const status = completed ? emojis.ui.check : emojis.general.loading;
                        
                        // Progress bar
                        const barLength = 10;
                        const filled = Math.floor((progress / challenge.goal) * barLength);
                        const bar = emojis.battlepass.bar.repeat(filled) + emojis.battlepass.empty.repeat(barLength - filled);
                        
                        dailyText += '> ' + status + ' **' + (i + 1) + '.** ' + challenge.description + '\n';
                        dailyText += '> ' + bar + ' `' + progress + '/' + challenge.goal + '` (' + percent + '%)\n';
                        dailyText += '> **Reward:** `' + challenge.reward + ' XP` 📈\n';
                        
                        if (!completed) {
                            const expiresAt = Math.floor(new Date(challenge.expiresAt).getTime() / 1000);
                            dailyText += '> **Expires:** <t:' + expiresAt + ':R>\n';
                        }
                        
                        if (i < validChallenges.length - 1) dailyText += '>\n';
                    });
                    
                    const completedCount = validChallenges.filter(c => isChallengeCompleted(c)).length;
                    dailyText += '>\n> **Progress:** `' + completedCount + '/' + validChallenges.length + '` completed';
                    
                    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(dailyText));
                    
                    if (type === 'all') {
                        container.addSeparatorComponents((separator) => separator.setDivider(false));
                    }
                } else {
                    container.addTextDisplayComponents(
                        (textDisplay) => textDisplay.setContent('> **📅 Daily Challenges**\n> _Use `++daily` to get new challenges!_')
                    );
                    
                    if (type === 'all') {
                        container.addSeparatorComponents((separator) => separator.setDivider(false));
                    }
                }
            } else {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> **📅 Daily Challenges**\n> _Use `++daily` to get new challenges!_')
                );
                
                if (type === 'all') {
                    container.addSeparatorComponents((separator) => separator.setDivider(false));
                }
            }
        }
        
        // Weekly challenges
        if (type === 'all' || type === 'weekly') {
            // Don't generate here - let Daily command handle it
            if (profile.weeklyChallenges && profile.weeklyChallenges.length > 0) {
                const validWeeklies = profile.weeklyChallenges.filter(c => !isChallengeExpired(c));
                
                if (validWeeklies.length > 0) {
                    let weeklyText = '> **📆 Weekly Challenges**\n';
                    
                    validWeeklies.forEach((challenge, i) => {
                        const progress = challenge.progress || 0;
                        const percent = Math.floor((progress / challenge.goal) * 100);
                        const completed = isChallengeCompleted(challenge);
                        const status = completed ? emojis.ui.check : emojis.general.loading;
                        
                        // Progress bar
                        const barLength = 10;
                        const filled = Math.floor((progress / challenge.goal) * barLength);
                        const bar = emojis.battlepass.bar.repeat(filled) + emojis.battlepass.empty.repeat(barLength - filled);
                        
                        weeklyText += '> ' + status + ' **' + (i + 1) + '.** ' + challenge.description + '\n';
                        weeklyText += '> ' + bar + ' `' + progress + '/' + challenge.goal + '` (' + percent + '%)\n';
                        weeklyText += '> **Reward:** `' + challenge.reward + ' XP` 📈\n';
                        
                        if (!completed) {
                            const expiresAt = Math.floor(new Date(challenge.expiresAt).getTime() / 1000);
                            weeklyText += '> **Expires:** <t:' + expiresAt + ':R>\n';
                        }
                        
                        if (i < validWeeklies.length - 1) weeklyText += '>\n';
                    });
                    
                    const completedCount = validWeeklies.filter(c => isChallengeCompleted(c)).length;
                    weeklyText += '>\n> **Progress:** `' + completedCount + '/' + validWeeklies.length + '` completed';
                    
                    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(weeklyText));
                } else {
                    container.addTextDisplayComponents(
                        (textDisplay) => textDisplay.setContent('> **📆 Weekly Challenges**\n> _No active weekly challenges._')
                    );
                }
            } else {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> **📆 Weekly Challenges**\n> _No weekly challenges yet. Use !daily to generate._')
                );
            }
            
            if (type === 'all') {
                container.addSeparatorComponents((separator) => separator.setDivider(false));
            }
        }
        
        // Challenge stats
        if (type === 'all') {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const statsText = '> **📊 Your Challenge Stats**\n' +
                '> **•** Total Completed: `' + profile.completedChallenges.length + '`\n' +
                '> **•** XP from Challenges: `' + (profile.completedChallenges.length * 150) + '+`\n' +
                '> **•** Active Challenges: `' + (profile.dailyChallenges?.length || 0) + '`';
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(statsText));
        }
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_💡 Challenges refresh daily! Complete them before they expire._')
        );
        
        return ctx.sendMessage({ components: [container] });
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
