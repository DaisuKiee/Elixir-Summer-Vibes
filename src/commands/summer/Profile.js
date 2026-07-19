import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getLevelFromXP, getRankTitle } from '../../data/levelSystem.js';
import { getExplorerRank } from '../../data/beaches.js';
import { createCanvas, loadImage } from 'canvas';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { getCosmeticById } from '../../data/cosmetics.js';
import { emojis } from '../../config/emojis.js';
import { formatPrestigeLevel, getPrestigeBadge } from '../../data/prestigeSystem.js';

export default class Profile extends Command {
    constructor(client) {
        super(client, {
            name: 'profile',
            description: {
                content: 'View your Summer Escape 2026 profile',
                usage: '[user]',
                examples: ['profile', 'profile @user'],
            },
            aliases: ['me', 'stats', 'summer'],
            category: 'summer',
            cooldown: 5,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'AttachFiles'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'user',
                    description: 'View another user\'s profile',
                    type: 6,
                    required: false,
                },
            ]
        });
    }
    
    async run(ctx, args) {
        // Show typing indicator immediately for better UX
        if (ctx.channel && ctx.channel.sendTyping) {
            await ctx.channel.sendTyping().catch(() => {});
        }
        
        const targetUser = ctx.isInteraction && ctx.interaction.options.getUser('user') 
            ? ctx.interaction.options.getUser('user')
            : (ctx.message?.mentions?.users?.first() || ctx.author);
        
        // Get or create profile
        let profile = await SummerProfile.findById(targetUser.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: targetUser.id,
                username: targetUser.tag
            });
            await profile.save();
        }
        
        // Calculate stats
        const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
        const currentLevel = getLevelFromXP(totalXP);
        const rankTitle = getRankTitle(currentLevel);
        const explorerRank = getExplorerRank(profile.visitedIslands || []);
        
        // Create canvas
        const canvas = await this.createProfileCanvas(targetUser, profile, currentLevel, rankTitle, explorerRank);
        
        // Convert to attachment
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { 
            name: 'profile.png' 
        });
        
        // Create embed with the image
        const prestigeBadge = profile.prestigeLevel > 0 ? ' ' + getPrestigeBadge(profile.prestigeLevel) : '';
        
        // Build description with prestige progress if applicable
        let description = '**' + explorerRank.emoji + ' ' + targetUser.username + prestigeBadge + '** - ' + explorerRank.rank + '\n';
        description += '**Level:** `' + currentLevel + (currentLevel > 100 ? ' ♾️' : '/100') + '` **|** **Rank:** `' + rankTitle + '` **|** **Islands:** `' + (profile.visitedIslands || []).length + '/54`';
        
        // Add prestige progress if they have prestiged or are close to prestiging
        const currentPrestigeLevel = profile.prestigeLevel || 0;
        if (currentPrestigeLevel < 50) {
            const nextRequiredLevel = 15 + (currentPrestigeLevel * 10);
            description += '\n**Next Prestige:** `Level ' + nextRequiredLevel + '` **|** **Rebirth:** `' + currentPrestigeLevel + '/50`';
        } else {
            description += '\n**Prestige:** `MAX (50/50)` ' + emojis.general.star;
        }
        
        const embed = new EmbedBuilder()
            .setColor(this.client.color.default)
            .setImage('attachment://profile.png')
            .setDescription(description)
            .setFooter({ text: emojis.summer.beach + ' Elixir: Summer Escape 2026 - Philippine Islands Adventure' });
        
        return ctx.sendMessage({ embeds: [embed], files: [attachment] });
    }
    
    async createProfileCanvas(user, profile, currentLevel, rankTitle, explorerRank) {
        // Canvas dimensions matching the background
        const width = 1024;
        const height = 768;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Load and draw the background image
        try {
            const background = await loadImage('./background.png');
            ctx.drawImage(background, 0, 0, width, height);
        } catch (error) {
            console.error('Failed to load background.png:', error);
            // Fallback gradient if background fails
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#FF6B35');
            gradient.addColorStop(0.5, '#FFD60A');
            gradient.addColorStop(1, '#00B4D8');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
        
        // Content area (the parchment/paper area in the middle)
        const contentX = 140;
        const contentY = 170;
        const contentWidth = 744;
        const contentHeight = 430;
        
        // Avatar circle (top center of content area)
        const avatarSize = 120;
        const avatarX = contentX + contentWidth / 2;
        const avatarY = contentY + 70;
        
        try {
            const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
            const avatar = await loadImage(avatarURL);
            
            // Avatar shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 5;
            
            // Avatar border with equipped frame color
            let frameColor = '#8B4513'; // Default brown
            if (profile.equippedCosmetics && profile.equippedCosmetics.frame) {
                const frameCosmetic = getCosmeticById(profile.equippedCosmetics.frame);
                if (frameCosmetic) {
                    frameColor = this.getFrameColor(frameCosmetic.rarity);
                }
            }
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            
            // Clip and draw avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 - 4, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            ctx.restore();
        } catch (error) {
            // Fallback circle
            ctx.fillStyle = '#DEB887';
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Username with equipped badge (below avatar)
        ctx.fillStyle = '#2C1810';
        ctx.font = 'bold 38px Arial';
        ctx.textAlign = 'center';
        let usernameText = user.username;
        if (profile.equippedCosmetics && profile.equippedCosmetics.badge) {
            usernameText += ' ' + emojis.general.medal;
        }
        ctx.fillText(usernameText, avatarX, contentY + 158);
        
        // Equipped title or explorer rank (below username)
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 20px Arial';
        let rankText = emojis.summer.flower + ' ' + explorerRank.rank;
        if (profile.equippedCosmetics && profile.equippedCosmetics.title) {
            const titleCosmetic = getCosmeticById(profile.equippedCosmetics.title);
            if (titleCosmetic) {
                rankText = emojis.general.star + ' ' + titleCosmetic.name;
                ctx.fillStyle = this.getTitleColor(titleCosmetic.rarity);
            }
        }
        ctx.fillText(rankText, avatarX, contentY + 185);
        
        // Equipped pet (floating near avatar)
        if (profile.equippedCosmetics && profile.equippedCosmetics.pet) {
            const petCosmetic = getCosmeticById(profile.equippedCosmetics.pet);
            if (petCosmetic) {
                ctx.font = '42px Arial';
                const petEmoji = this.getPetEmoji(petCosmetic.id);
                ctx.fillText(petEmoji, avatarX + 80, avatarY + 50);
            }
        }
        
        // Premium badge (if applicable)
        if (profile.isPremiumPass) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(emojis.general.star + ' PREMIUM', avatarX, contentY + 210);
        }
        
        // Stats area (two columns)
        ctx.textAlign = 'left';
        const statsStartY = profile.isPremiumPass ? contentY + 235 : contentY + 215;
        const leftColX = contentX + 120;  // Moved left column more to the right
        const rightColX = contentX + contentWidth / 2 + 95;
        const iconSize = 18;
        
        // Left column stats
        let currentY = statsStartY;
        
        // Player Level
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('⭐ Player Level', leftColX, currentY);
        ctx.fillStyle = '#2C1810';
        ctx.font = '16px Arial';
        ctx.fillText('Lv. ' + currentLevel + (currentLevel > 100 ? ' ♾️' : '/100') + ' - ' + rankTitle, leftColX + 5, currentY + 22);
        currentY += 52;
        
        // Fishing
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(emojis.activities.fishing + ' Fishing', leftColX, currentY);
        ctx.fillStyle = '#2C1810';
        ctx.font = '16px Arial';
        const rodLevel = profile.equipment?.rod?.level || profile.fishingRodLevel || 1;
        ctx.fillText(profile.fishCaught + ' caught • Rod Lv.' + rodLevel, leftColX + 5, currentY + 22);
        currentY += 52;
        
        // Islands
        const uniqueIslands = (profile.visitedIslands || []).length;
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(emojis.islands.island + ' Islands', leftColX, currentY);
        ctx.fillStyle = '#2C1810';
        ctx.font = '16px Arial';
        ctx.fillText(uniqueIslands + '/54 discovered', leftColX + 5, currentY + 22);
        
        // Right column stats
        currentY = statsStartY;
        
        // Currency
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(emojis.currency.coin + ' Currency', rightColX, currentY);
        ctx.fillStyle = '#2C1810';
        ctx.font = '16px Arial';
        // Use Unicode seashell for canvas (custom emojis don't render in canvas)
        const seashellIcon = '🐚';
        ctx.fillText(seashellIcon + ' ' + profile.seashells.toLocaleString() + ' • ' + emojis.currency.sunToken + ' ' + profile.sunTokens, rightColX + 5, currentY + 22);
        currentY += 52;
        
        // Collectibles
        const collectibleCount = profile.collectibles.length;
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(emojis.collectibles.crab + ' Collectibles', rightColX, currentY);
        ctx.fillStyle = '#2C1810';
        ctx.font = '16px Arial';
        ctx.fillText(collectibleCount + ' items collected', rightColX + 5, currentY + 22);
        currentY += 52;
        
        // Activity
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(emojis.progression.stats + ' Activity', rightColX, currentY);
        ctx.fillStyle = '#2C1810';
        ctx.font = '16px Arial';
        ctx.fillText(profile.daysActive + ' days • ' + profile.explorationStreak + ' streak ' + emojis.general.fire, rightColX + 5, currentY + 22);
        
        // XP Progress bar at bottom
        const progressBarWidth = contentWidth - 100;
        const progressBarHeight = 28;
        const progressBarX = contentX + 50;
        const progressBarY = contentY + contentHeight - 48;
        
        // Calculate XP progress
        const totalXP = profile.totalXP || profile.xp || profile.battlePassXP || 0;
        const { getTotalXPForLevel } = await import('../../data/levelSystem.js');
        const currentLevelTotalXP = getTotalXPForLevel(currentLevel);
        const nextLevelTotalXP = getTotalXPForLevel(currentLevel + 1);
        const xpInCurrentLevel = totalXP - currentLevelTotalXP;
        const xpNeededForNext = nextLevelTotalXP - currentLevelTotalXP;
        const progress = Math.min(xpInCurrentLevel / xpNeededForNext, 1);
        
        // Progress bar background (wood texture style)
        ctx.fillStyle = 'rgba(101, 67, 33, 0.6)';
        this.roundRect(ctx, progressBarX, progressBarY, progressBarWidth, progressBarHeight, 14);
        
        // Progress bar fill (gradient orange to red)
        const progressGradient = ctx.createLinearGradient(progressBarX, 0, progressBarX + progressBarWidth * progress, 0);
        progressGradient.addColorStop(0, '#FF6B35');
        progressGradient.addColorStop(1, '#E63946');
        ctx.fillStyle = progressGradient;
        this.roundRect(ctx, progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight, 14);
        
        // Progress text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        const progressText = xpInCurrentLevel.toLocaleString() + ' / ' + xpNeededForNext.toLocaleString() + ' XP';
        ctx.fillText(progressText, progressBarX + progressBarWidth / 2, progressBarY + 19);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        return canvas;
    }
    
    roundRect(ctx, x, y, width, height, radius, fillOnly = false) {
        this.roundRectPath(ctx, x, y, width, height, radius);
        ctx.fill();
        if (!fillOnly) {
            ctx.stroke();
        }
    }
    
    roundRectPath(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    getTotalXPForTier(tierNumber) {
        if (tierNumber <= 100) {
            let total = 0;
            for (let i = 1; i <= tierNumber; i++) {
                total += i * 100;
            }
            return total;
        } else {
            const baseTier100XP = 505000;
            const levelsAbove100 = tierNumber - 100;
            return baseTier100XP + (levelsAbove100 * 10000);
        }
    }
    
    getFrameColor(rarity) {
        const colors = {
            common: '#95A5A6',
            uncommon: '#3498DB',
            rare: '#9B59B6',
            epic: '#E67E22',
            legendary: '#F1C40F'
        };
        return colors[rarity] || '#8B4513';
    }
    
    getTitleColor(rarity) {
        const colors = {
            common: '#7F8C8D',
            uncommon: '#3498DB',
            rare: '#9B59B6',
            epic: '#E67E22',
            legendary: '#F1C40F'
        };
        return colors[rarity] || '#8B4513';
    }
    
    getPetEmoji(petId) {
        const pets = {
            'pet_turtle': emojis.fish.turtle,
            'pet_crab': emojis.fish.crab,
            'pet_baby_turtle': emojis.fish.turtle,
            'pet_parrot': emojis.animals.parrot,
            'pet_diamond_crab': emojis.currency.diamond
        };
        return pets[petId] || emojis.animals.bird;
    }
}
