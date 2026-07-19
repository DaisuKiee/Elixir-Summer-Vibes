import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { generateDailyChallenges, generateWeeklyChallenges } from '../../data/challenges.js';
import { awardXP } from '../../utils/xpRewards.js';
import { emojis } from '../../config/emojis.js';

export default class Daily extends Command {
    constructor(client) {
        super(client, {
            name: 'daily',
            description: {
                content: 'Claim your daily summer rewards!',
                usage: '',
                examples: ['daily'],
            },
            aliases: ['dailyreward', 'claim'],
            category: 'summer',
            cooldown: 5,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
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
        }

        // Check if daily already claimed
        const now = new Date();
        const lastDaily = profile.lastDaily ? new Date(profile.lastDaily) : null;
        
        if (lastDaily) {
            const timeSinceLastDaily = now - lastDaily;
            const hoursRemaining = 24 - Math.floor(timeSinceLastDaily / (1000 * 60 * 60));
            
            if (hoursRemaining > 0) {
                const container = this.client.container()
                    .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
                
                const minutesRemaining = Math.floor((hoursRemaining * 60) - Math.floor(timeSinceLastDaily / (1000 * 60)) % 60);
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> ## **⏰ Daily Already Claimed**\n> Come back in `' + hoursRemaining + 'h ' + minutesRemaining + 'm`')
                );
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> **⏳ Next Daily:** <t:' + Math.floor((lastDaily.getTime() + 24 * 60 * 60 * 1000) / 1000) + ':R>')
                );
                
                return ctx.sendMessage({ components: [container] });
            }
        }
        
        // Calculate streak bonus
        let streakDays = 1;
        if (lastDaily) {
            const daysSinceLastDaily = Math.floor((now - lastDaily) / (1000 * 60 * 60 * 24));
            if (daysSinceLastDaily === 1) {
                // Consecutive day
                streakDays = (profile.daysActive || 0) + 1;
            }
        }
        
        // Calculate rewards (increases with streak)
        const baseXP = 50;
        const baseSeashells = 100;
        const baseSunTokens = 5;
        
        const streakMultiplier = Math.min(1 + (streakDays * 0.1), 3); // Max 3x at 20 day streak
        
        const xpEarned = Math.floor(baseXP * streakMultiplier);
        const seashellsEarned = Math.floor(baseSeashells * streakMultiplier);
        const sunTokensEarned = streakDays % 7 === 0 ? baseSunTokens * 2 : baseSunTokens; // Bonus on day 7, 14, 21, etc.
        
        // Daily energy items (always receive at least 1)
        const energyItemRewards = {
            smallSnack: 2, // Always get 2 small snacks
            meal: streakDays >= 3 ? 1 : 0, // Get 1 meal after 3 day streak
            energyDrink: streakDays >= 7 ? 1 : 0, // Get 1 energy drink after 7 day streak
            feast: streakDays % 7 === 0 ? 1 : 0, // Get 1 feast on weekly milestones
        };
        
        // Generate new daily challenges if needed
        const needsNewChallenges = !profile.dailyChallenges || 
                                   profile.dailyChallenges.length === 0 || 
                                   this.areChallengesExpired(profile.dailyChallenges);
        
        if (needsNewChallenges) {
            profile.dailyChallenges = generateDailyChallenges();
        }
        
        // Generate new weekly challenges if needed (resets every Monday or if expired)
        const needsNewWeeklyChallenges = !profile.weeklyChallenges || 
                                         profile.weeklyChallenges.length === 0 || 
                                         this.areChallengesExpired(profile.weeklyChallenges);
        
        if (needsNewWeeklyChallenges) {
            profile.weeklyChallenges = generateWeeklyChallenges();
        }
        
        // Update profile
        profile.lastDaily = now;
        profile.daysActive = streakDays;
        
        // Award XP using new system
        await awardXP(profile, xpEarned);
        
        profile.seashells += seashellsEarned;
        profile.sunTokens += sunTokensEarned;
        
        // Initialize energy items if needed
        if (!profile.energyItems) {
            profile.energyItems = {
                smallSnack: 0,
                meal: 0,
                feast: 0,
                energyDrink: 0,
                fullRestore: 0
            };
        }
        
        // Add energy item rewards
        profile.energyItems.smallSnack += energyItemRewards.smallSnack;
        profile.energyItems.meal += energyItemRewards.meal;
        profile.energyItems.energyDrink += energyItemRewards.energyDrink;
        profile.energyItems.feast += energyItemRewards.feast;
        
        // Save with retry logic to handle version conflicts
        let saveSuccess = false;
        let retries = 3;
        
        while (!saveSuccess && retries > 0) {
            try {
                await profile.save();
                saveSuccess = true;
            } catch (error) {
                if (error.name === 'VersionError' && retries > 1) {
                    retries--;
                    // Reload the profile and reapply changes
                    profile = await SummerProfile.findById(ctx.author.id);
                    
                    // Reapply all changes
                    profile.lastDaily = now;
                    profile.daysActive = streakDays;
                    
                    // Update challenges
                    if (profile.dailyChallenges) {
                        const challenge = profile.dailyChallenges.find(c => c.challengeId === 'daily_login');
                        if (challenge) {
                            challenge.progress = streakDays;
                            challenge.isCompleted = streakDays >= challenge.requirement;
                            if (challenge.isCompleted && !challenge.rewardClaimed) {
                                challenge.rewardClaimed = true;
                            }
                        }
                    }
                    
                    // Reapply rewards
                    profile.xp = (profile.xp || 0) + xpEarned;
                    profile.totalXP = (profile.totalXP || profile.xp || 0) + xpEarned;
                    profile.battlePassXP = (profile.battlePassXP || 0) + xpEarned;
                    profile.seashells += seashellsEarned;
                    profile.sunTokens += sunTokensEarned;
                    
                    if (!profile.energyItems) {
                        profile.energyItems = {
                            smallSnack: 0,
                            meal: 0,
                            feast: 0,
                            energyDrink: 0,
                            fullRestore: 0
                        };
                    }
                    
                    profile.energyItems.smallSnack += energyItemRewards.smallSnack;
                    profile.energyItems.meal += energyItemRewards.meal;
                    profile.energyItems.energyDrink += energyItemRewards.energyDrink;
                    profile.energyItems.feast += energyItemRewards.feast;
                    
                    console.log(`[Daily] Retrying save for ${ctx.author.id}, attempts left: ${retries}`);
                } else {
                    throw error; // Re-throw if not a version error or out of retries
                }
            }
        }
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **☀️ Daily Rewards Claimed!**\n> _Day ' + streakDays + ' Streak!_ 🔥')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Rewards
        let rewardsText = '> **🎁 Rewards Earned**\n' +
            '> **•** XP: `+' + xpEarned + '` 📈 (×' + streakMultiplier.toFixed(1) + ')\n' +
            '> **•** Seashells: `+' + seashellsEarned + '` 🐚 (×' + streakMultiplier.toFixed(1) + ')\n' +
            '> **•** Sun Tokens: `+' + sunTokensEarned + '` 🌟' + (sunTokensEarned > baseSunTokens ? ' **BONUS!**' : '') + '\n';
        
        // Add energy items to rewards text
        if (energyItemRewards.smallSnack > 0) {
            rewardsText += '> **•** Small Snacks: `+' + energyItemRewards.smallSnack + '` 🍪\n';
        }
        if (energyItemRewards.meal > 0) {
            rewardsText += '> **•** Meal: `+' + energyItemRewards.meal + '` 🍱\n';
        }
        if (energyItemRewards.energyDrink > 0) {
            rewardsText += '> **•** Energy Drink: `+' + energyItemRewards.energyDrink + '` 🥤\n';
        }
        if (energyItemRewards.feast > 0) {
            rewardsText += '> **•** Feast: `+' + energyItemRewards.feast + '` 🍗 **WEEKLY BONUS!**\n';
        }
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(rewardsText));
        
        // Streak info
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const streakText = '> **🔥 Daily Streak**\n' +
            '> **Current Streak:** `' + streakDays + ' days`\n' +
            '> **Streak Bonus:** `×' + streakMultiplier.toFixed(1) + '` multiplier\n' +
            '> _Claim daily to increase your streak bonus!_';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(streakText));
        
        // Daily challenges preview
        if (profile.dailyChallenges && profile.dailyChallenges.length > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const challengesText = `> **${emojis.progression.target} Today's Challenges**\n` +
                profile.dailyChallenges.map((c, i) => {
                    const progress = c.progress || 0;
                    const percent = Math.floor((progress / c.goal) * 100);
                    const status = progress >= c.goal ? emojis.ui.check : emojis.general.loading;
                    return `> ${status} \`${i + 1}.\` ${c.description} (${progress}/${c.goal})`;
                }).join('\n');
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(challengesText));
        }
        
        // Weekly challenges preview
        if (profile.weeklyChallenges && profile.weeklyChallenges.length > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const weeklyText = `> **📆 Weekly Challenges**\n` +
                profile.weeklyChallenges.slice(0, 3).map((c, i) => {
                    const progress = c.progress || 0;
                    const status = progress >= c.goal ? emojis.ui.check : emojis.general.loading;
                    return `> ${status} \`${i + 1}.\` ${c.description} (${progress}/${c.goal})`;
                }).join('\n') +
                (profile.weeklyChallenges.length > 3 ? `\n> _+${profile.weeklyChallenges.length - 3} more weekly challenges_` : '');
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(weeklyText));
        }
        
        // Milestone rewards
        if (streakDays % 7 === 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **🎉 MILESTONE REACHED!**\n> **Week ' + (streakDays / 7) + ' Completed!**\n> _Bonus Sun Tokens awarded!_ 🌟')
            );
        }
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const nextDailyTime = Math.floor((now.getTime() + 24 * 60 * 60 * 1000) / 1000);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> **⏰ Next Daily:** <t:' + nextDailyTime + ':R>\n> _Use `' + this.client.config.prefix + 'challenges` to view daily challenges!_\n> _Use `' + this.client.config.prefix + 'energy` to manage your energy!_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    areChallengesExpired(challenges) {
        if (!challenges || challenges.length === 0) return true;
        
        const now = new Date();
        return challenges.some(c => new Date(c.expiresAt) < now);
    }
}
