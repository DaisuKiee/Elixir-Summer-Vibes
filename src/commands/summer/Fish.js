import { AttachmentBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { fishData, rarityChances, fishingRods, getCurrentWeather, weatherTypes, getAvailableFish } from '../../data/fish.js';
import { getLevelFromXP, xpSources } from '../../data/levelSystem.js';
import { updateIslandProgress } from '../../data/beaches.js';
import { checkEnergyRequirement, consumeEnergy, updateEnergy, formatEnergyDisplay, getTimeUntilFull } from '../../data/energySystem.js';
import { awardXP } from '../../utils/xpRewards.js';
import { emojis } from '../../config/emojis.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// NEW: Phase 1 Systems
import { 
    isPityTriggered, 
    resetPityCounter, 
    incrementPityCounters,
    getPityGuaranteedRarity,
    getPityNotification
} from '../../data/pitySystem.js';

// Retry helper for handling version conflicts during concurrent saves
async function saveWithRetry(profile, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await profile.save();
            return; // Success
        } catch (error) {
            if (error.name === 'VersionError' && attempt < maxRetries) {
                console.log(`[Fish] Version conflict on attempt ${attempt}/${maxRetries}, reloading and retrying...`);
                
                // Reload fresh profile and re-apply our changes
                const freshProfile = await SummerProfile.findById(profile._id);
                if (!freshProfile) {
                    throw new Error('Profile not found during retry');
                }
                
                // Get the fields we modified
                const modifiedPaths = error.modifiedPaths || [];
                const changes = {};
                
                // Save our changes
                modifiedPaths.forEach(path => {
                    const value = path.split('.').reduce((obj, key) => obj?.[key], profile);
                    changes[path] = value;
                });
                
                // Apply changes to fresh profile
                Object.keys(changes).forEach(path => {
                    const keys = path.split('.');
                    let target = freshProfile;
                    
                    for (let i = 0; i < keys.length - 1; i++) {
                        target = target[keys[i]];
                    }
                    
                    target[keys[keys.length - 1]] = changes[path];
                });
                
                // Update the profile reference
                profile = freshProfile;
                
                // Exponential backoff with jitter
                const delay = (100 * Math.pow(2, attempt - 1)) + Math.random() * 100;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Log final failure
                if (error.name === 'VersionError') {
                    console.error(`[Fish] Failed to save after ${maxRetries} attempts due to version conflicts`);
                }
                throw error; // Re-throw if not a version error or out of retries
            }
        }
    }
}
import { 
    rollForVariant, 
    getVariantDisplay, 
    calculateVariantRewards,
    trackVariantCatch
} from '../../data/variantSystem.js';

import { 
    getActiveBaitInfo, 
    applyBaitEffects,
    consumeBaitUse 
} from '../../data/baitSystem.js';

import { 
    getPrestigeBonuses 
} from '../../data/prestigeSystem.js';

import { 
    checkAndAwardAchievements 
} from '../../data/achievements.js';

import { 
    getEquipmentBonuses,
    calculateEnergyCost,
    calculateXPWithBonus
} from '../../data/equipment.js';

import {
    isChallengeCompleted,
    isChallengeExpired
} from '../../data/challenges.js';

export default class Fish extends Command {
    constructor(client) {
        super(client, {
            name: 'fish',
            description: {
                content: 'Go fishing and catch tropical fish!',
                usage: '',
                examples: ['fish'],
            },
            aliases: ['cast', 'fishing'],
            category: 'summer',
            cooldown: 10, // 10 second cooldown
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
        
        // Update energy to reflect real-time values with equipment bonuses
        updateEnergy(profile);
        
        // Check if user is developer (unlimited energy)
        const isDeveloper = process.env.OWNER_ID?.split(',').includes(ctx.author.id);
        
        // Check energy requirement (skip for developers)
        if (!isDeveloper) {
            const energyCheck = checkEnergyRequirement(profile, 'fishing');
            
            if (!energyCheck.available) {
                return this.showNoEnergy(ctx, profile, energyCheck);
            }
        }
        
        // Show interactive fishing prompt with button
        return this.showFishingPrompt(ctx, profile, isDeveloper);
    }
    
    async showNoEnergy(ctx, profile, energyCheck) {
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            const energyDisplay = formatEnergyDisplay(profile);
            const timeInfo = getTimeUntilFull(profile);
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ## **' + emojis.energy.energy + ' Not Enough Energy!**\n> _You need ' + energyCheck.cost + ' energy to go fishing._')
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ' + energyDisplay.text + '\n> \n> **Cost:** `' + energyCheck.cost + ' energy` ' + emojis.activities.fishing + '\n> **Needed:** `' + (energyCheck.cost - energyCheck.current) + ' more energy`')
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            let regenText = '> **' + emojis.time.clock + ' Energy Regeneration**\n';
            if (timeInfo.isFull) {
                regenText += '> _Your energy is already full!_';
            } else {
                regenText += '> **Full in:** `' + timeInfo.hours + 'h ' + timeInfo.minutes + 'm`\n';
                regenText += '> **Rate:** `+1 energy per hour`';
            }
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(regenText)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **' + emojis.energy.lightbulb + ' Options:**\n> **•** Wait for energy to regenerate\n> **•** Use an energy restoration item (coming soon)\n> **•** Try a lower-cost activity\n> **•** Check `++energy` for more options')
            );
            
            return ctx.sendMessage({ components: [container] });
    }
    
    async showFishingPrompt(ctx, profile, isDeveloper = false) {
        // Show catching animation first
        await this.showCatchingAnimation(ctx, profile, isDeveloper);
    }
    
    async showCatchingAnimation(ctx, profile, isDeveloper = false) {
        // Get current weather
        const currentWeather = getCurrentWeather();
        const weather = weatherTypes[currentWeather];
        
        // Map weather to folder names
        const weatherFolderMap = {
            'sunny': 'day',
            'cloudy': 'cloudy',
            'rain': 'rainy',
            'storm': 'stormy',
            'night': 'night'
        };
        
        const weatherFolder = weatherFolderMap[currentWeather] || 'day';
        const weatherPath = join(process.cwd(), 'images', 'weather', weatherFolder);
        
        // Animation stages with weather-specific images
        const stages = [
            {
                emoji: emojis.activities.fishing,
                title: 'Ready to Fish...',
                message: '_You prepare your fishing rod..._',
                duration: 1000,
                imageName: 'ready.png'
            },
            {
                emoji: '🎣',
                title: 'Casting Line...',
                message: `_You cast your line into the ${weather.name.toLowerCase()} waters..._`,
                duration: 1200,
                imageName: 'casting.png'
            },
            {
                emoji: '💦',
                title: 'Waiting...',
                message: '_Your line sits in the water... Something bites!_',
                duration: 1500,
                imageName: 'waiting.png'
            }
        ];
        
        let message;
        
        // Show each animation stage
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`> ## **${stage.emoji} ${stage.title}**\n> ${stage.message}`)
            );
            
            // Try to add weather-specific image
            const files = [];
            const imagePath = join(weatherPath, stage.imageName);
            
            if (existsSync(imagePath)) {
                const imageAttachment = new AttachmentBuilder(imagePath, { name: stage.imageName });
                files.push(imageAttachment);
                
                // Add media gallery to display the animation image
                container.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(
                        new MediaGalleryItemBuilder()
                            .setURL(`attachment://${stage.imageName}`)
                    )
                );
            }
            
            if (i === 0) {
                // First stage - send message
                message = await ctx.sendMessage({ components: [container], files });
            } else {
                // Subsequent stages - edit message
                await message.edit({ components: [container], files }).catch(() => {});
            }
            
            // Wait before next stage
            await new Promise(resolve => setTimeout(resolve, stage.duration));
        }
        
        // Now perform the actual fishing and update the message with results
        await this.performFishing(ctx, message, profile, isDeveloper);
    }
    
    async performFishing(ctx, message, profile, isDeveloper = false) {
        // Get current weather
        const currentWeather = getCurrentWeather();
        const weather = weatherTypes[currentWeather];
        
        // Get current island (use last explored island or default to Luzon)
        const currentIsland = profile.currentBeach ? profile.currentBeach.toLowerCase().replace(/\s+/g, '-') : 'luzon';
        
        // ===== NEW: PHASE 1 INTEGRATION =====
        
        // 1. Check for active bait
        const activeBait = getActiveBaitInfo(profile);
        let baitMessage = null;
        
        // 2. Check pity counters for guaranteed catch
        const guaranteedRarity = getPityGuaranteedRarity(profile);
        let pityTriggered = false;
        let pityMessage = null;
        
        if (guaranteedRarity) {
            pityTriggered = true;
            pityMessage = getPityNotification(guaranteedRarity);
        }
        
        // 3. Determine rarity (with pity override or bait bonuses)
        let rarity;
        if (pityTriggered) {
            // Force guaranteed rarity from pity
            rarity = guaranteedRarity;
        } else {
            // Normal catch with weather and bait multipliers
            let modifiedChances = { ...rarityChances };
            
            // Apply bait effects if active
            if (activeBait) {
                modifiedChances = applyBaitEffects(profile, modifiedChances);
                baitMessage = `${activeBait.emoji} **${activeBait.name}** is active! (${activeBait.remainingUses} uses left)`;
            }
            
            // Get equipment bonuses (includes prestige multiplier)
            const equipmentBonuses = getEquipmentBonuses(profile);
            
            // Apply equipment + prestige rare fish bonus
            // Multiplier > 1.0 means better rare fish chances
            if (equipmentBonuses.rareFishBonus > 1.0) {
                const bonus = (equipmentBonuses.rareFishBonus - 1.0) * 15; // Scale the effect
                modifiedChances.common = Math.max(5, modifiedChances.common - bonus); // Reduce common
                modifiedChances.uncommon = (modifiedChances.uncommon || 0) + bonus * 0.3;
                modifiedChances.rare = (modifiedChances.rare || 0) + bonus * 0.25;
                modifiedChances.epic = (modifiedChances.epic || 0) + bonus * 0.2;
                modifiedChances.legendary = (modifiedChances.legendary || 0) + bonus * 0.15;
                modifiedChances.mythical = (modifiedChances.mythical || 0) + bonus * 0.1;
            }
            
            rarity = this.determineRarity(weather.multiplier, modifiedChances);
        }
        
        // Get available fish for current island and weather
        const availableFish = getAvailableFish(currentIsland, currentWeather, rarity);
        
        // If no fish available for this island/weather combo, use general pool
        let fish;
        if (availableFish.length > 0) {
            fish = availableFish[Math.floor(Math.random() * availableFish.length)];
        } else {
            const generalPool = fishData[rarity];
            fish = generalPool[Math.floor(Math.random() * generalPool.length)];
        }
        
        // Get prestige bonuses (needed for variant calculation)
        const prestigeBonuses = getPrestigeBonuses(profile);
        
        // 4. Roll for variant (with prestige bonus and bait bonus)
        const prestigeLevel = profile.prestigeLevel || 0;
        const prestigeVariantBonus = prestigeBonuses.variantBonus || 0;
        const variant = rollForVariant(prestigeLevel, prestigeVariantBonus);
        const variantDisplay = getVariantDisplay(fish.name, variant);
        
        // Calculate weight
        const weight = (Math.random() * (fish.maxWeight - fish.minWeight) + fish.minWeight).toFixed(2);
        
        // Apply fishing rod bonus - use equipment system if available, fallback to old system
        const rodLevel = profile.equipment?.rod?.level || profile.fishingRodLevel || 1;
        let rodBonus = 1.0;
        
        if (profile.equipment?.rod?.level) {
            // Use equipment system bonus
            const equipmentBonuses = getEquipmentBonuses(profile);
            rodBonus = equipmentBonuses.valueBonus || 1.0;
        } else if (fishingRods[rodLevel]) {
            // Fallback to old fishing rods system
            rodBonus = fishingRods[rodLevel].bonus;
        }
        
        // Apply weather multiplier
        const weatherBonus = weather.multiplier;
        
        // Calculate base rewards
        let xpEarned = Math.floor(fish.xp * rodBonus * weatherBonus * prestigeBonuses.xpMultiplier);
        let seashellsEarned = Math.floor(fish.value * rodBonus * weatherBonus);
        
        // 5. Apply variant multipliers if variant caught
        if (variant && variant !== 'normal') {
            const variantRewards = calculateVariantRewards(xpEarned, seashellsEarned, variant);
            xpEarned = variantRewards.xp;
            seashellsEarned = variantRewards.seashells;
            
            // Track variant catch
            trackVariantCatch(profile, fish.id || fish.name.toLowerCase().replace(/\s+/g, '_'), variant);
        }
        
        // Mythical fish award sun tokens
        let sunTokensEarned = 0;
        if (rarity === 'mythical') {
            sunTokensEarned = 50;
            if (variant && variant !== 'normal') {
                sunTokensEarned = Math.floor(sunTokensEarned * 2); // Double sun tokens for variant mythical
            }
        }
        
        // 6. Update pity counters
        incrementPityCounters(profile, rarity);
        
        // 7. Consume bait use if active
        let baitDepleted = false;
        if (activeBait) {
            const baitResult = consumeBaitUse(profile);
            baitDepleted = baitResult.depleted;
        }
        
        // Consume energy for fishing (skip for developers)
        let energyResult;
        if (isDeveloper) {
            // Developer mode - no energy cost
            energyResult = { cost: 0, remaining: profile.energy };
        } else {
            energyResult = consumeEnergy(profile, 'fishing');
        }
        
        // Update profile
        profile.fishCaught += 1;
        
        // Award XP using the new system
        const xpResult = await awardXP(profile, xpEarned);
        
        profile.seashells += seashellsEarned;
        if (sunTokensEarned > 0) {
            profile.sunTokens += sunTokensEarned;
        }
        
        // Update challenge progress - IMPROVED LOGIC WITH DEBUG
        // Daily challenges
        if (profile.dailyChallenges && profile.dailyChallenges.length > 0) {
            console.log('[DEBUG] Processing daily challenges, count:', profile.dailyChallenges.length);
            for (let challenge of profile.dailyChallenges) {
                console.log('[DEBUG] Challenge:', challenge.id, 'Type:', challenge.type, 'Progress:', challenge.progress);
                
                // Skip if completed or expired
                if (isChallengeCompleted(challenge)) {
                    console.log('[DEBUG] Challenge completed, skipping');
                    continue;
                }
                if (isChallengeExpired(challenge)) {
                    console.log('[DEBUG] Challenge expired, skipping');
                    continue;
                }
                
                // Initialize progress if undefined
                if (typeof challenge.progress === 'undefined') {
                    console.log('[DEBUG] Initializing progress to 0');
                    challenge.progress = 0;
                }
                
                // Check challenge type and update accordingly
                if (challenge.type === 'fishing') {
                    console.log('[DEBUG] Fishing challenge detected');
                    // "Catch X fish" challenges (daily_fish_5, daily_fish_10)
                    if (challenge.id === 'daily_fish_5' || challenge.id === 'daily_fish_10') {
                        challenge.progress += 1;
                        console.log('[DEBUG] Updated catch fish challenge, new progress:', challenge.progress);
                    }
                    // "Catch rare or better fish" challenge
                    else if (challenge.id === 'daily_rare_fish' && ['rare', 'epic', 'legendary', 'mythical'].includes(rarity)) {
                        challenge.progress += 1;
                        console.log('[DEBUG] Updated rare fish challenge, new progress:', challenge.progress);
                    }
                }
            }
        } else {
            console.log('[DEBUG] No daily challenges found');
        }
        
        // Weekly challenges
        if (profile.weeklyChallenges && profile.weeklyChallenges.length > 0) {
            console.log('[DEBUG] Processing weekly challenges, count:', profile.weeklyChallenges.length);
            for (let challenge of profile.weeklyChallenges) {
                // Skip if completed or expired
                if (isChallengeCompleted(challenge) || isChallengeExpired(challenge)) continue;
                
                // Initialize progress if undefined
                if (typeof challenge.progress === 'undefined') challenge.progress = 0;
                
                // Check challenge type and update accordingly
                if (challenge.type === 'fishing') {
                    // "Catch X fish" challenges (weekly_fish_50, weekly_fish_100)
                    if (challenge.id === 'weekly_fish_50' || challenge.id === 'weekly_fish_100') {
                        challenge.progress += 1;
                        console.log('[DEBUG] Updated weekly catch fish challenge, new progress:', challenge.progress);
                    }
                    // "Catch legendary fish" challenge
                    else if (challenge.id === 'weekly_legendary' && rarity === 'legendary') {
                        challenge.progress += 1;
                        console.log('[DEBUG] Updated weekly legendary challenge, new progress:', challenge.progress);
                    }
                }
            }
        }
        
        // Update island progress (track fish caught on current island)
        const currentIslandId = profile.currentBeach ? profile.currentBeach.toLowerCase().replace(/\s+/g, '-') : 'luzon';
        updateIslandProgress(profile, currentIslandId, 'fish', 1);
        
        // Add to inventory (keep last 50 fish)
        profile.fishInventory.unshift({
            name: fish.name,
            rarity: rarity,
            weight: parseFloat(weight),
            caughtAt: new Date()
        });
        if (profile.fishInventory.length > 50) {
            profile.fishInventory = profile.fishInventory.slice(0, 50);
        }
        
        // Add to permanent collection (for fishdex) if not already caught
        if (!profile.fishCollection) {
            profile.fishCollection = [];
        }
        if (!profile.fishCollection.includes(fish.name)) {
            profile.fishCollection.push(fish.name);
        }
        
        await saveWithRetry(profile);
        
        // Get rarity emoji and color
        const rarityInfo = this.getRarityInfo(rarity, fish.name);
        
        const container = this.client.container()
            .setAccentColor(parseInt(rarityInfo.color.replace('#', ''), 16));
        
        // ===== PITY NOTIFICATION (if triggered) =====
        if (pityTriggered && pityMessage) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ' + pityMessage)
            );
            container.addSeparatorComponents((separator) => separator.setDivider(true));
        }
        
        // ===== BAIT STATUS (if active) =====
        if (baitMessage) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ' + baitMessage)
            );
            container.addSeparatorComponents((separator) => separator.setDivider(true));
        }
        
        // Fishing animation header with weather
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **' + emojis.activities.fishing + ' Fishing Success!**\n> _Weather: ' + weather.emoji + ' ' + weather.name + '_\n> _You cast your line and caught..._')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // ===== VARIANT ANNOUNCEMENT (if variant) =====
        if (variant && variant !== 'normal' && variantDisplay.announcement) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ' + variantDisplay.announcement)
            );
            container.addSeparatorComponents((separator) => separator.setDivider(true));
        }
        
        // Fish caught display (with variant name if applicable)
        const displayName = variantDisplay.name || fish.name;
        const variantPrefix = variant && variant !== 'normal' ? variantDisplay.emoji + ' ' : '';
        
        // Get rod name from equipment system or fallback to old system
        let rodName = 'Bamboo Rod';
        if (profile.equipment?.rod?.level) {
            const equipmentData = await import('../../data/equipment.js');
            const rodData = equipmentData.equipmentData.rod[profile.equipment.rod.level];
            rodName = rodData?.name || 'Bamboo Rod';
        } else if (fishingRods[rodLevel]) {
            rodName = fishingRods[rodLevel].name;
        }
        
        let fishText = '> # **' + variantPrefix + rarityInfo.emoji + ' ' + displayName + '**\n' +
            '> **Rarity:** ' + rarityInfo.badge + '\n' +
            '> **Weight:** `' + weight + ' kg`\n' +
            '> **Location:** `' + profile.currentBeach + '`\n' +
            '> **Fishing Rod:** `' + rodName + '` (×' + rodBonus.toFixed(2) + ')';
        
        if (weatherBonus > 1.0) {
            fishText += '\n> **Weather Bonus:** `×' + weatherBonus + '`';
        }
        
        // Show prestige bonus if active
        if (prestigeBonuses.xpMultiplier > 1.0) {
            const prestigePercent = ((prestigeBonuses.xpMultiplier - 1.0) * 100).toFixed(0);
            fishText += '\n> **Prestige XP Bonus:** `+' + prestigePercent + '%` ' + emojis.general.sparkles;
        }
        
        // Add mythical description
        if (rarity === 'mythical' && fish.description) {
            fishText += '\n>\n> _' + fish.description + '_';
        }
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(fishText));
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Rewards (with variant multiplier indicator)
        let rewardsText = '> **' + emojis.currency.coin + ' Rewards**\n' +
            '> **•** XP: `+' + xpEarned + '` ' + emojis.progression.xp;
        
        if (variant && variant !== 'normal') {
            rewardsText += ' ' + variantDisplay.emoji;
        }
        
        rewardsText += '\n> **•** Seashells: `+' + seashellsEarned + '` ' + emojis.currency.seashell;
        
        if (variant && variant !== 'normal') {
            rewardsText += ' ' + variantDisplay.emoji;
        }
        
        if (sunTokensEarned > 0) {
            rewardsText += '\n> **•** Sun Tokens: `+' + sunTokensEarned + '` ' + emojis.currency.sunToken + ' **MYTHICAL!**';
        }
        
        rewardsText += '\n> **•** Total Fish Caught: `' + profile.fishCaught + '`';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(rewardsText));
        
        // ===== BAIT DEPLETED NOTIFICATION =====
        if (baitDepleted && activeBait) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ⚠️ **Bait Depleted!**\n> _' + activeBait.name + ' has been used up. Buy more with `++bait shop`_')
            );
        }
        
        // Energy status
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const energyDisplay = formatEnergyDisplay(profile);
        let energyText;
        
        if (isDeveloper) {
            // Developer mode - show unlimited energy
            energyText = '> **' + emojis.energy.energy + ' Energy**\n' +
                '> **Used:** `0 energy` ' + emojis.activities.fishing + ' **[DEV MODE]**\n' +
                '> **Remaining:** `∞ UNLIMITED` ' + emojis.general.star + '\n' +
                '> \n> ' + emojis.currency.diamond + ' **Developer Mode Active** - Unlimited energy!';
        } else {
            energyText = '> **' + emojis.energy.energy + ' Energy**\n' +
                '> **Used:** `-' + energyResult.cost + ' energy` ' + emojis.activities.fishing + '\n' +
                '> **Remaining:** `' + energyResult.remaining + '/' + energyDisplay.max + '` (' + energyDisplay.percent + '%)\n';
            
            // Energy warnings
            if (energyResult.remaining < 15) {
                energyText += '> \n> ' + emojis.rarity.legendary + ' **Low Energy!** Not enough for another fish.';
                const timeInfo = getTimeUntilFull(profile);
                energyText += '\n> _Full in ' + timeInfo.hours + 'h ' + timeInfo.minutes + 'm_';
            } else if (energyResult.remaining < 30) {
                energyText += '> \n> ' + emojis.islandGroups.visayas + ' **Energy running low!** Plan your next activities wisely.';
            } else {
                const fishesLeft = Math.floor(energyResult.remaining / 15);
                energyText += '> \n> ' + emojis.rarity.common + ' **You can fish ' + fishesLeft + ' more times.**';
            }
        }
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(energyText));
        
        // Check for achievements
        const newAchievements = checkAndAwardAchievements(profile);
        if (newAchievements.length > 0) {
            await profile.save(); // Save again to store achievement data
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            let achievementText = '> **🏆 Achievement Unlocked!**\n';
            newAchievements.forEach(result => {
                achievementText += `> ${result.achievement.icon} **${result.achievement.name}**\n`;
            });
            achievementText += '> _Use `++achievements claim` for rewards!_';
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(achievementText)
            );
        }
        
        // Footer with fun fact
        const funFacts = [
            'Try fishing at night for rare species!',
            'Stormy weather increases your catch quality!',
            'Some legendary fish only appear in specific weather!',
            'Island-specific fish can only be found in certain locations!',
            'Mythical fish from Filipino folklore are the rarest catches!',
            'Upgrade your fishing rod for better catches!',
            'Complete fishing challenges for bonus rewards!',
            'Energy regenerates at +1 per hour - plan your activities!',
            'Use ++energy to check your energy status and recommendations!',
            'Deep sea fishing costs more energy but has better rewards!',
            'Pity system guarantees rare fish after enough catches!',
            'Shiny variants are rare and grant 2x-5x rewards!',
            'Use ++pity to check your progress toward guaranteed catches!',
            'Buy bait from ++bait shop to boost specific rarities!',
            'Golden Lure increases variant catch chances!',
            'Prestige level increases your variant catch rates!',
            'Rainbow variants are the rarest - only 0.1% chance!',
            'Use ++variants to see your shiny collection!'
        ];
        const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_' + emojis.energy.lightbulb + ' ' + randomFact + '_')
        );
        
        // Add fish image for Epic, Legendary, and Mythical fish
        const files = [];
        if (['epic', 'legendary', 'mythical'].includes(rarity)) {
            // Convert fish name to match filename format (e.g., "Giant Yellowfin Tuna" -> "Giant-Yellowfin-Tuna.png")
            const fishFileName = fish.name.replace(/\s+/g, '-') + '.png';
            // Look for fish images in images/fish/ folder
            const fishImagePath = join(process.cwd(), 'images', 'fish', fishFileName);
            
            if (existsSync(fishImagePath)) {
                const fishImage = new AttachmentBuilder(fishImagePath, { name: fishFileName });
                files.push(fishImage);
                
                // Add media gallery to display the image
                container.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(
                        new MediaGalleryItemBuilder()
                            .setURL('attachment://' + fishFileName)
                    )
                );
            }
        }
        
        return message.edit({ components: [container], files });
    }
    
    determineRarity(weatherMultiplier = 1.0, baseChances = rarityChances) {
        const roll = Math.random() * 100;
        let cumulative = 0;
        
        // Start with provided base chances (could be bait-modified)
        const adjustedChances = { ...baseChances };
        
        // Apply weather multiplier to rare fish chances
        if (weatherMultiplier > 1.0) {
            // Increase rare fish chances during special weather
            const bonus = (weatherMultiplier - 1.0) * 5;
            adjustedChances.common = Math.max(0, adjustedChances.common - bonus);
            adjustedChances.legendary = (adjustedChances.legendary || 0) + bonus * 0.3;
            adjustedChances.mythical = (adjustedChances.mythical || 0) + bonus * 0.1;
        }
        
        for (const [rarity, chance] of Object.entries(adjustedChances)) {
            cumulative += chance;
            if (roll <= cumulative) {
                return rarity;
            }
        }
        
        return 'common';
    }
    
    getRarityInfo(rarity, fishName = null) {
        // Get fish-specific emoji if available
        let fishEmoji = null;
        if (fishName) {
            // Convert fish name to emoji key format (e.g., "Yellowfin Tuna" -> "yellowfinTuna")
            const emojiKey = fishName.replace(/\s+/g, '')
                .replace(/^./, str => str.toLowerCase())
                .replace(/-/g, '');
            
            // Try to get the specific fish emoji
            if (emojis.fish[emojiKey]) {
                fishEmoji = emojis.fish[emojiKey];
            }
        }
        
        const rarityData = {
            common: { emoji: fishEmoji || emojis.fish.fishGeneral, badge: `${emojis.rarity.common} \`Common\``, color: '#57F287' },
            uncommon: { emoji: fishEmoji || emojis.fish.tropicalFish, badge: `${emojis.rarity.uncommon} \`Uncommon\``, color: '#00B4D8' },
            rare: { emoji: fishEmoji || emojis.fish.blowfish, badge: `${emojis.rarity.rare} \`Rare\``, color: '#9B59B6' },
            epic: { emoji: fishEmoji || emojis.fish.shark, badge: `${emojis.rarity.epic} \`Epic\``, color: '#FF6B35' },
            legendary: { emoji: fishEmoji || emojis.fish.whale, badge: `${emojis.rarity.legendary} \`Legendary\``, color: '#FFD700' },
            mythical: { emoji: fishEmoji || emojis.fish.dragon, badge: `${emojis.rarity.mythical} \`Mythical\``, color: '#FF00FF' }
        };
        
        return rarityData[rarity] || rarityData.common;
    }
}
