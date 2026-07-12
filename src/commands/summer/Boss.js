import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import BossSchema from '../../schemas/boss.js';
import { getTierFromXP } from '../../data/battlepass.js';
import { updateEnergy, consumeEnergy, formatEnergyDisplay } from '../../data/energySystem.js';
import {
    calculateBossDamage,
    attackBoss,
    canAttackBoss,
    calculateRewards,
    distributeRewards,
    formatBossHP,
    getTimeRemaining,
    hasClaimedRewards,
    markRewardsClaimed,
    getTopParticipants,
    bossStatus
} from '../../data/bossSystem.js';
import {
    getBossById,
    rollBossSpawn,
    bossDifficulty,
    getDifficultyEmoji,
    getDifficultyColor
} from '../../data/bossRoster.js';
import { emojis } from '../../config/emojis.js';
import { v4 as uuidv4 } from 'uuid';

export default class Boss extends Command {
    constructor(client) {
        super(client, {
            name: 'boss',
            description: {
                content: 'Fight server-wide boss battles for epic rewards!',
                usage: '[attack|info|leaderboard|rewards|spawn]',
                examples: [
                    'boss',
                    'boss attack',
                    'boss info',
                    'boss leaderboard',
                    'boss rewards',
                    'boss spawn' // Admin only
                ],
            },
            aliases: ['raid', 'worldboss'],
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
                    description: 'Boss action',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Attack - Deal damage to boss', value: 'attack' },
                        { name: 'Info - View boss details', value: 'info' },
                        { name: 'Leaderboard - Top participants', value: 'leaderboard' },
                        { name: 'Rewards - Claim your rewards', value: 'rewards' }
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
        
        // Update energy
        updateEnergy(profile);
        
        // Parse action
        let action = 'info'; // Default
        if (ctx.isInteraction) {
            action = ctx.interaction.options.getString('action') || 'info';
        } else if (args.length > 0) {
            const firstArg = args[0].toLowerCase();
            if (['attack', 'fight', 'hit'].includes(firstArg)) {
                action = 'attack';
            } else if (['info', 'status', 'view'].includes(firstArg)) {
                action = 'info';
            } else if (['leaderboard', 'top', 'ranks'].includes(firstArg)) {
                action = 'leaderboard';
            } else if (['rewards', 'claim', 'loot'].includes(firstArg)) {
                action = 'rewards';
            } else if (['spawn', 'summon'].includes(firstArg)) {
                action = 'spawn';
            }
        }
        
        // Get active boss for this server
        const guildId = ctx.guild?.id || 'dm';
        let activeBoss = await BossSchema.getActiveBoss(guildId);
        
        // Check for expired boss
        if (activeBoss && activeBoss.checkExpiry()) {
            await activeBoss.save();
            activeBoss = null; // Treat as no active boss
        }
        
        // Route to appropriate handler
        switch (action) {
            case 'attack':
                if (!activeBoss) {
                    return this.noBossActive(ctx);
                }
                return this.attackBoss(ctx, profile, activeBoss);
                
            case 'leaderboard':
                if (!activeBoss) {
                    return this.noBossActive(ctx);
                }
                return this.showLeaderboard(ctx, activeBoss);
                
            case 'rewards':
                return this.claimRewards(ctx, profile, guildId);
                
            case 'spawn':
                return this.spawnBoss(ctx, profile, guildId);
                
            case 'info':
            default:
                if (!activeBoss) {
                    return this.noBossActive(ctx);
                }
                return this.showBossInfo(ctx, profile, activeBoss);
        }
    }
    
    noBossActive(ctx) {
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.info} No Active Boss**\n> _There is no boss battle currently active in this server._`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **🦈 Boss System**\n> Server-wide cooperative battles against legendary creatures from Philippine mythology!\n> \n> **Features:**\n> **•** Fight together with your server\n> **•** Deal damage to earn rewards\n> **•** Top contributors get epic prizes\n> **•** Limited time encounters (48-144 hours)`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💡 Coming Soon:**\n> Bosses will spawn automatically based on server activity!\n> _For now, admins can use \`++boss spawn\` to test the system._`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async attackBoss(ctx, profile, activeBoss) {
        // Check tier requirement
        const currentTier = getTierFromXP(profile.battlePassXP);
        const boss = getBossById(activeBoss.bossId);
        
        if (currentTier < boss.unlockTier) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.locked} Boss Locked**\n> _Reach tier ${boss.unlockTier} to fight this boss._\n> _Your tier: ${currentTier}_`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Check energy
        const energyCheck = canAttackBoss(profile);
        if (!energyCheck.canAttack) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.energy.energy} Not Enough Energy**\n> ${energyCheck.reason}\n> \n> **Required:** \`${energyCheck.energyCost}\` energy\n> **Current:** \`${energyCheck.currentEnergy}\` energy`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Calculate damage
        const damageResult = calculateBossDamage(profile, boss);
        
        // Apply damage to boss
        const attackResult = attackBoss(activeBoss, profile, damageResult.damage);
        
        if (!attackResult.success) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Attack Failed**\n> ${attackResult.message}`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Consume energy
        consumeEnergy(profile, 'bossAttack', 25);
        await profile.save();
        await activeBoss.save();
        
        // Build response
        const color = damageResult.isCritical ? '#FFD700' : getDifficultyColor(boss.difficulty);
        const container = this.client.container()
            .setAccentColor(parseInt(color.replace('#', ''), 16));
        
        const criticalText = damageResult.isCritical ? ' **CRITICAL HIT!** 💥' : '';
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **⚔️ Attack Successful!${criticalText}**\n> ${boss.emoji} **${boss.name}**`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Damage dealt
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💪 Damage Dealt:** \`${attackResult.damage.toLocaleString()}\`${criticalText}\n> **Your Total:** \`${attackResult.participation.totalDamage.toLocaleString()}\` (${attackResult.participation.attacks} attacks)`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Boss HP
        const hpBar = formatBossHP(attackResult.currentHP, attackResult.maxHP);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **❤️ Boss HP:** \`${hpBar.percent}%\`\n> \`${hpBar.bar}\`\n> \`${attackResult.currentHP.toLocaleString()}/${attackResult.maxHP.toLocaleString()}\``)
        );
        
        // Check if defeated
        if (attackResult.isDefeated) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> # **🎉 BOSS DEFEATED! 🎉**\n> \n> ${boss.emoji} **${boss.name}** has been vanquished!\n> \n> Use \`++boss rewards\` to claim your loot!`)
            );
        } else {
            // Time remaining
            const timeLeft = getTimeRemaining(activeBoss.expiresAt);
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **⏰ Time Remaining:** \`${timeLeft}\`\n> **⚡ Energy Used:** \`-25\` (${profile.energy} remaining)`)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showBossInfo(ctx, profile, activeBoss) {
        const boss = getBossById(activeBoss.bossId);
        const hpBar = formatBossHP(activeBoss.currentHP, activeBoss.maxHP);
        const timeLeft = getTimeRemaining(activeBoss.expiresAt);
        const diffEmoji = getDifficultyEmoji(boss.difficulty);
        
        const container = this.client.container()
            .setAccentColor(parseInt(getDifficultyColor(boss.difficulty).replace('#', ''), 16));
        
        // Boss header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## ${boss.emoji} **${boss.name}**\n> _${boss.title}_\n> \n> ${diffEmoji} **${boss.difficulty.toUpperCase()}** Boss`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Description
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ${boss.description}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // HP and stats
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **❤️ HP:** \`${hpBar.percent}%\` Remaining\n> \`${hpBar.bar}\`\n> \`${activeBoss.currentHP.toLocaleString()}/${activeBoss.maxHP.toLocaleString()}\``)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Participation stats
        const topParticipants = activeBoss.getTopParticipants(3);
        let participantText = `> **👥 Participants:** \`${activeBoss.participants.length}\`\n> **Total Attacks:** \`${activeBoss.totalAttacks || activeBoss.participants.reduce((sum, p) => sum + p.attacks, 0)}\`\n> \n> **🏆 Top Contributors:**\n`;
        
        topParticipants.forEach((p, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            participantText += `> ${medal} **${p.username}** - \`${p.totalDamage.toLocaleString()}\` damage\n`;
        });
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(participantText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Time and commands
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **⏰ Time Remaining:** \`${timeLeft}\`\n> **⚡ Energy Cost:** \`25 per attack\`\n> \n> **Commands:**\n> \`++boss attack\` - Deal damage\n> \`++boss leaderboard\` - Full rankings`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showLeaderboard(ctx, activeBoss) {
        const boss = getBossById(activeBoss.bossId);
        const topParticipants = activeBoss.getTopParticipants(15);
        
        const container = this.client.container()
            .setAccentColor(parseInt(getDifficultyColor(boss.difficulty).replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **🏆 Boss Leaderboard**\n> ${boss.emoji} **${boss.name}**`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        let leaderboardText = '';
        topParticipants.forEach((p, index) => {
            const rank = index + 1;
            let rankEmoji;
            if (rank === 1) rankEmoji = '🥇';
            else if (rank === 2) rankEmoji = '🥈';
            else if (rank === 3) rankEmoji = '🥉';
            else if (rank <= 10) rankEmoji = '⭐';
            else rankEmoji = '▫️';
            
            const damagePercent = ((p.totalDamage / boss.stats.maxHP) * 100).toFixed(2);
            leaderboardText += `> ${rankEmoji} **#${rank}** ${p.username}\n> \`${p.totalDamage.toLocaleString()}\` damage (${damagePercent}%) • ${p.attacks} attacks\n> \n`;
        });
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(leaderboardText || '> _No participants yet_')
        );
        
        if (activeBoss.participants.length > 15) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> _Showing top 15 of ${activeBoss.participants.length} participants_`)
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async claimRewards(ctx, profile, guildId) {
        // Find recent defeated bosses
        const defeatedBosses = await BossSchema.find({
            guildId: guildId,
            status: bossStatus.DEFEATED,
            'participants.userId': ctx.author.id
        }).sort({ defeatedAt: -1 }).limit(5);
        
        if (defeatedBosses.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.info} No Rewards Available**\n> _You haven't participated in any defeated bosses yet._\n> \n> Use \`++boss attack\` to join the fight!`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Find unclaimed rewards
        const unclaimedBosses = defeatedBosses.filter(b => !hasClaimedRewards(profile, b.bossInstanceId));
        
        if (unclaimedBosses.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.success} All Rewards Claimed**\n> _You've claimed all available boss rewards!_`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Claim rewards from all unclaimed bosses
        let totalRewards = {
            xp: 0,
            seashells: 0,
            sunTokens: 0,
            prestigePoints: 0,
            collectibles: [],
            badges: []
        };
        
        for (const bossInstance of unclaimedBosses) {
            const boss = getBossById(bossInstance.bossId);
            const rewards = calculateRewards(bossInstance, boss, ctx.author.id);
            
            if (rewards) {
                distributeRewards(profile, rewards);
                markRewardsClaimed(profile, bossInstance.bossInstanceId);
                
                // Accumulate totals
                totalRewards.xp += rewards.rewards.xp || 0;
                totalRewards.seashells += rewards.rewards.seashells || 0;
                totalRewards.sunTokens += rewards.rewards.sunTokens || 0;
                totalRewards.prestigePoints += rewards.rewards.prestigePoints || 0;
                if (rewards.rewards.collectible) totalRewards.collectibles.push(rewards.rewards.collectible);
                if (rewards.rewards.badge) totalRewards.badges.push(rewards.rewards.badge);
            }
        }
        
        await profile.save();
        
        // Show rewards
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **${emojis.general.gift} Boss Rewards Claimed!**\n> _Claimed rewards from ${unclaimedBosses.length} defeated boss${unclaimedBosses.length > 1 ? 'es' : ''}!_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        let rewardsText = `> **💰 Total Rewards:**\n`;
        if (totalRewards.xp > 0) rewardsText += `> **•** XP: \`+${totalRewards.xp.toLocaleString()}\` 📈\n`;
        if (totalRewards.seashells > 0) rewardsText += `> **•** Seashells: \`+${totalRewards.seashells.toLocaleString()}\` ${emojis.currency.seashell}\n`;
        if (totalRewards.sunTokens > 0) rewardsText += `> **•** Sun Tokens: \`+${totalRewards.sunTokens}\` ${emojis.currency.sunToken}\n`;
        if (totalRewards.prestigePoints > 0) rewardsText += `> **•** Prestige Points: \`+${totalRewards.prestigePoints}\` ⭐\n`;
        if (totalRewards.collectibles.length > 0) rewardsText += `> **•** Collectibles: \`${totalRewards.collectibles.length}\` new items\n`;
        if (totalRewards.badges.length > 0) rewardsText += `> **•** Badges: \`${totalRewards.badges.length}\` earned\n`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(rewardsText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **🎉 Great work, warrior!**\n> _Your contributions helped defeat these legendary creatures._`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async spawnBoss(ctx, profile, guildId) {
        // Check if user is admin (placeholder - implement proper permission check)
        const isAdmin = ctx.member?.permissions?.has('Administrator') || ctx.author.id === ctx.guild?.ownerId;
        
        if (!isAdmin) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} Permission Denied**\n> _Only server administrators can spawn bosses._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Check if boss already active
        const existingBoss = await BossSchema.getActiveBoss(guildId);
        if (existingBoss && !existingBoss.checkExpiry()) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.warning} Boss Already Active**\n> _A boss is already active in this server._\n> _Use \`++boss info\` to view it._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Roll for boss spawn (normal difficulty for testing)
        const currentTier = getTierFromXP(profile.battlePassXP);
        const boss = rollBossSpawn(bossDifficulty.NORMAL, currentTier);
        
        if (!boss) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.error} No Available Bosses**\n> _No bosses available for your server's tier level._`)
            );
            return ctx.sendMessage({ components: [container] });
        }
        
        // Create boss instance
        const bossInstance = new BossSchema({
            bossInstanceId: uuidv4(),
            bossId: boss.id,
            bossName: boss.name,
            difficulty: boss.difficulty,
            guildId: guildId,
            channelId: ctx.channel?.id,
            maxHP: boss.stats.maxHP,
            currentHP: boss.stats.maxHP,
            defense: boss.stats.defense,
            expiresAt: new Date(Date.now() + boss.duration),
            participants: []
        });
        
        await bossInstance.save();
        
        // Announcement
        const container = this.client.container()
            .setAccentColor(parseInt(getDifficultyColor(boss.difficulty).replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> # **🚨 BOSS SPAWNED! 🚨**\n> \n> ${boss.emoji} **${boss.name}**\n> _${boss.title}_`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ${getDifficultyEmoji(boss.difficulty)} **${boss.difficulty.toUpperCase()}** Difficulty\n> \n> ${boss.description}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const timeLeft = getTimeRemaining(bossInstance.expiresAt);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **❤️ HP:** \`${boss.stats.maxHP.toLocaleString()}\`\n> **⏰ Duration:** \`${timeLeft}\`\n> **⚡ Energy Cost:** \`25 per attack\`\n> **🎯 Required Tier:** \`${boss.unlockTier}\``)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **🎁 Rewards:**\n> **•** XP, Seashells, Sun Tokens\n> **•** Exclusive collectibles\n> **•** Top contributors get legendary prizes!\n> \n> **Join the fight:** \`++boss attack\``)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
