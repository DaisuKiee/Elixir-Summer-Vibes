import { ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import BossSchema from '../../schemas/boss.js';
import { getLevelFromXP } from '../../data/levelSystem.js';
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
        // Check level requirement
        const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
        const currentLevel = getLevelFromXP(totalXP);
        const boss = getBossById(activeBoss.bossId);
        
        if (currentLevel < boss.unlockTier) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.locked} Boss Locked**\n> _Reach level ${boss.unlockTier} to fight this boss._\n> _Your level: ${currentLevel}_`)
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
        
        // Award XP for attacking (base 50 XP + bonus for damage dealt)
        const baseXP = 50;
        const damageBonus = Math.floor(attackResult.damage / 10); // 1 XP per 10 damage
        const totalXPGained = baseXP + damageBonus;
        
        profile.totalXP = (profile.totalXP || profile.xp || 0) + totalXPGained;
        profile.xp = profile.totalXP;
        
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
        
        // Damage dealt and XP gained
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💪 Damage Dealt:** \`${attackResult.damage.toLocaleString()}\`${criticalText}\n> **Your Total:** \`${attackResult.participation.totalDamage.toLocaleString()}\` (${attackResult.participation.attacks} attacks)\n> \n> **📈 XP Gained:** \`+${totalXPGained.toLocaleString()}\` XP`)
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
        
        // Time and energy cost
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **⏰ Time Remaining:** \`${timeLeft}\`\n> **⚡ Energy Cost:** \`25 per attack\``)
        );
        
        // Add Attack and Leaderboard buttons
        container.addActionRowComponents((row) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`boss_attack_${activeBoss._id}`)
                    .setLabel('Attack Boss')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId(`boss_leaderboard_${activeBoss._id}`)
                    .setLabel('Leaderboard')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🏆')
            );
            return row;
        });
        
        const reply = await ctx.sendMessage({ components: [container] });
        
        // Handle button interactions
        const collector = reply.createMessageComponentCollector({
            filter: i => i.customId.startsWith('boss_'),
            time: 300000 // 5 minutes
        });
        
        collector.on('collect', async interaction => {
            try {
                // Get fresh profile and boss data
                const userProfile = await SummerProfile.findById(interaction.user.id);
                const currentBoss = await BossSchema.findById(activeBoss._id);
                
                if (!userProfile || !currentBoss) {
                    return interaction.reply({ content: 'Error: Could not find profile or boss data.', ephemeral: true });
                }
                
                if (interaction.customId === `boss_attack_${activeBoss._id}`) {
                    // Handle attack with loading animation - edit the original message
                    await interaction.deferUpdate(); // Acknowledge silently
                    
                    // Show attacking animation by editing the original message
                    await this.showAttackingAnimation(interaction, interaction.message, userProfile, currentBoss);
                    
                } else if (interaction.customId.startsWith('boss_attack_again_')) {
                    // Handle re-attack with cooldown check
                    await interaction.deferUpdate();
                    
                    // Check if enough time has passed (5 seconds)
                    const lastAttackTime = userProfile.lastBossAttack || 0;
                    const now = Date.now();
                    const cooldownMs = 5000; // 5 seconds
                    const timeSinceLastAttack = now - lastAttackTime;
                    
                    if (timeSinceLastAttack < cooldownMs) {
                        const remaining = Math.ceil((cooldownMs - timeSinceLastAttack) / 1000);
                        return interaction.followUp({ 
                            content: `⏳ Please wait ${remaining} more second${remaining > 1 ? 's' : ''} before attacking again!`, 
                            ephemeral: true 
                        });
                    }
                    
                    // Update last attack time
                    userProfile.lastBossAttack = now;
                    await userProfile.save();
                    
                    // Show attacking animation by editing the same message
                    await this.showAttackingAnimation(interaction, interaction.message, userProfile, currentBoss);
                    
                } else if (interaction.customId === `boss_back_${activeBoss._id}`) {
                    // Go back to boss info - edit the message
                    await interaction.deferUpdate();
                    
                    // Reload fresh boss data
                    const freshBoss = await BossSchema.findById(activeBoss._id);
                    const freshProfile = await SummerProfile.findById(interaction.user.id);
                    
                    // Update energy
                    updateEnergy(freshProfile);
                    
                    // Build boss info container
                    await this.updateBossInfoMessage(interaction.message, freshBoss, freshProfile);
                    
                } else if (interaction.customId === `boss_leaderboard_${activeBoss._id}`) {
                    await interaction.deferUpdate();
                    
                    // Show leaderboard by editing the message
                    await this.updateLeaderboardMessage(interaction.message, currentBoss);
                }
            } catch (error) {
                console.error('Boss button interaction error:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
                }
            }
        });
        
        collector.on('end', () => {
            // Optionally disable buttons after timeout
        });
        
        return reply;
    }
    
    async showAttackingAnimation(interaction, message, profile, activeBoss) {
        const boss = getBossById(activeBoss.bossId);
        
        // Animation stages
        const stages = [
            {
                emoji: '⚔️',
                title: 'Preparing Attack...',
                message: `_You ready your weapon against ${boss.emoji} **${boss.name}**..._`,
                duration: 800
            },
            {
                emoji: '💥',
                title: 'Attacking!',
                message: `_You strike with all your might!_`,
                duration: 1000
            },
            {
                emoji: '📊',
                title: 'Calculating Damage...',
                message: `_Your attack connects!_`,
                duration: 700
            }
        ];
        
        // Show each animation stage by editing the message
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ## **${stage.emoji} ${stage.title}**\n> ${stage.message}`)
            );
            
            const messageData = { components: [container], flags: MessageFlags.IsComponentsV2 };
            
            // Edit the existing message
            await message.edit(messageData).catch(() => {});
            
            // Wait before next stage
            await new Promise(resolve => setTimeout(resolve, stage.duration));
        }
        
        // Now perform the actual attack and update message with results
        await this.performAttackWithButtons(message, profile, activeBoss, boss);
    }
    
    async performAttackWithButtons(message, profile, activeBoss, boss) {
        const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
        const currentLevel = getLevelFromXP(totalXP);
        
        // Check level requirement
        if (currentLevel < boss.unlockTier) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.general.locked} Boss Locked**\n> _Reach level ${boss.unlockTier} to fight this boss._\n> _Your level: ${currentLevel}_`)
            );
            return message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }
        
        // Check energy
        const energyCheck = canAttackBoss(profile);
        if (!energyCheck.canAttack) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> **${emojis.energy.energy} Not Enough Energy**\n> ${energyCheck.reason}\n> \n> **Required:** \`${energyCheck.energyCost}\` energy\n> **Current:** \`${energyCheck.currentEnergy}\` energy`)
            );
            return message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
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
            return message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }
        
        // Award XP for attacking
        const baseXP = 50;
        const damageBonus = Math.floor(attackResult.damage / 10);
        const totalXPGained = baseXP + damageBonus;
        
        profile.totalXP = (profile.totalXP || profile.xp || 0) + totalXPGained;
        profile.xp = profile.totalXP;
        
        // Consume energy
        consumeEnergy(profile, 'bossAttack', 25);
        await profile.save();
        await activeBoss.save();
        
        // Build response with buttons
        const color = damageResult.isCritical ? '#FFD700' : getDifficultyColor(boss.difficulty);
        const container = this.client.container()
            .setAccentColor(parseInt(color.replace('#', ''), 16));
        
        const criticalText = damageResult.isCritical ? ' **CRITICAL HIT!** 💥' : '';
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ## **⚔️ Attack Successful!${criticalText}**\n> ${boss.emoji} **${boss.name}**`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Damage dealt and XP gained
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **💪 Damage Dealt:** \`${attackResult.damage.toLocaleString()}\`${criticalText}\n> **Your Total:** \`${attackResult.participation.totalDamage.toLocaleString()}\` (${attackResult.participation.attacks} attacks)\n> \n> **📈 XP Gained:** \`+${totalXPGained.toLocaleString()}\` XP`)
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
        
        // Add action buttons: Attack Again (5s cooldown) and Back to Boss Info
        container.addActionRowComponents((row) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`boss_attack_again_${activeBoss._id}`)
                    .setLabel('⚔️ Attack Again')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(attackResult.isDefeated), // Disable if boss defeated
                new ButtonBuilder()
                    .setCustomId(`boss_back_${activeBoss._id}`)
                    .setLabel('◀️ Back to Boss Info')
                    .setStyle(ButtonStyle.Secondary)
            );
            return row;
        });
        
        return message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
    
    async updateBossInfoMessage(message, activeBoss, profile) {
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
        
        // Time and energy cost
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **⏰ Time Remaining:** \`${timeLeft}\`\n> **⚡ Energy Cost:** \`25 per attack\``)
        );
        
        // Add Attack and Leaderboard buttons
        container.addActionRowComponents((row) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`boss_attack_${activeBoss._id}`)
                    .setLabel('Attack Boss')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId(`boss_leaderboard_${activeBoss._id}`)
                    .setLabel('Leaderboard')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🏆')
            );
            return row;
        });
        
        return message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
    
    async updateLeaderboardMessage(message, activeBoss) {
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
                (textDisplay) => textDisplay.setContent(`> _...and ${activeBoss.participants.length - 15} more fighters!_`)
            );
        }
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Add Back button
        container.addActionRowComponents((row) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`boss_back_${activeBoss._id}`)
                    .setLabel('◀️ Back to Boss Info')
                    .setStyle(ButtonStyle.Secondary)
            );
            return row;
        });
        
        return message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
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
        const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
        const currentLevel = getLevelFromXP(totalXP);
        const boss = rollBossSpawn(bossDifficulty.NORMAL, currentLevel);
        
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
            (textDisplay) => textDisplay.setContent(`> **❤️ HP:** \`${boss.stats.maxHP.toLocaleString()}\`\n> **⏰ Duration:** \`${timeLeft}\`\n> **⚡ Energy Cost:** \`25 per attack\`\n> **🎯 Required Level:** \`${boss.unlockTier}\``)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **🎁 Rewards:**\n> **•** XP, Seashells, Sun Tokens\n> **•** Exclusive collectibles\n> **•** Top contributors get legendary prizes!\n> \n> **Join the fight:** \`++boss attack\``)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
