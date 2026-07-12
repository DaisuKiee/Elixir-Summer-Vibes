import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { beachesData, getAvailableBeaches, getIslandByName, getExplorerRank, hasVisitedIsland, getIslandGroupStats, islandGroups, updateIslandProgress, getIslandProgress, formatIslandProgress, canProgressToNextIsland, getAccessibleIslands } from '../../data/beaches.js';
import { getAllCollectibles, collectibleRarityChances } from '../../data/collectibles.js';
import { getRandomEvent, processEventOutcome } from '../../data/explorationEvents.js';
import { checkEnergyRequirement, consumeEnergy, updateEnergy, formatEnergyDisplay, getTimeUntilFull } from '../../data/energySystem.js';
import { isChallengeCompleted, isChallengeExpired } from '../../data/challenges.js';

export default class Explore extends Command {
    constructor(client) {
        super(client, {
            name: 'explore',
            description: {
                content: 'Travel and explore Philippine islands to discover treasures!',
                usage: '[island name]',
                examples: ['explore', 'explore palawan', 'explore boracay', 'explore siargao'],
            },
            aliases: ['beach', 'visit', 'travel', 'island'],
            category: 'summer',
            cooldown: 60, // 1 minute cooldown
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'island',
                    description: 'Specific Philippine island to explore',
                    type: 3,
                    required: false,
                },
            ]
        });
    }
    
    // Helper methods for challenges
    isChallengeCompleted(challenge) {
        return isChallengeCompleted(challenge);
    }
    
    isChallengeExpired(challenge) {
        return isChallengeExpired(challenge);
    }
    
    async run(ctx, args) {
        // Get or create profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: ctx.author.id,
                username: ctx.author.tag,
                currentBeach: 'Luzon',
                visitedIslands: [],
                islandDiscoveries: []
            });
        }
        
        // Initialize visitedIslands if it doesn't exist
        if (!profile.visitedIslands) {
            profile.visitedIslands = [];
        }
        if (!profile.islandDiscoveries) {
            profile.islandDiscoveries = [];
        }
        
        // Get available islands
        const availableIslands = getAvailableBeaches(profile);
        
        if (availableIslands.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **❌ No Islands Available**\n> _Level up your battle pass to unlock Philippine islands!_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Determine which island to explore
        let island;
        const islandArg = ctx.isInteraction && ctx.interaction.options.getString('island')
            ? ctx.interaction.options.getString('island')
            : args.join(' ');
        
        if (islandArg) {
            // Find island by name (fuzzy search)
            island = getIslandByName(islandArg);
            
            if (!island) {
                const container = this.client.container()
                    .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> **❌ Island Not Found**\n> _Island "' + islandArg + '" doesn\'t exist or isn\'t unlocked yet._\n\n> _Try: palawan, boracay, siargao, cebu, bohol_')
                );
                
                return ctx.sendMessage({ components: [container] });
            }
            
            // Check if unlocked
            if (!availableIslands.find(i => i.id === island.id)) {
                const container = this.client.container()
                    .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
                
                const req = island.unlockRequirement;
                let requirements = [];
                if (req.level) requirements.push('Level ' + req.level);
                if (req.fishCaught) requirements.push(req.fishCaught + ' fish caught');
                if (req.explorationStreak) requirements.push(req.explorationStreak + '-day streak');
                if (req.beachesExplored) requirements.push(req.beachesExplored + ' explorations');
                if (req.collectibles) requirements.push(req.collectibles + ' collectibles');
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> **🔒 ' + island.emoji + ' ' + island.name + ' - Locked**\n> _' + island.description + '_\n\n> **Requirements:**\n> ' + requirements.join(' **•** '))
                );
                
                return ctx.sendMessage({ components: [container] });
            }
        } else {
            // Random available island
            island = availableIslands[Math.floor(Math.random() * availableIslands.length)];
        }
        
        // Check if user is developer (unlimited energy)
        const isDeveloper = process.env.OWNER_ID?.split(',').includes(ctx.author.id);
        
        // Check energy requirement (skip for developers)
        if (!isDeveloper) {
            const energyCheck = checkEnergyRequirement(profile, 'exploring');
            
            if (!energyCheck.available) {
                const container = this.client.container()
                    .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
                
                const energyDisplay = formatEnergyDisplay(profile);
                const timeInfo = getTimeUntilFull(profile);
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> ## **⚡ Not Enough Energy!**\n> _You need ' + energyCheck.cost + ' energy to explore ' + island.emoji + ' ' + island.name + '._')
                );
                
                container.addSeparatorComponents((separator) => separator.setDivider(true));
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> ' + energyDisplay.text + '\n> \n> **Cost:** `' + energyCheck.cost + ' energy` 🗺️\n> **Needed:** `' + (energyCheck.cost - energyCheck.current) + ' more energy`')
                );
                
                container.addSeparatorComponents((separator) => separator.setDivider(true));
                
                let regenText = '> **⏰ Energy Regeneration**\n';
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
                    (textDisplay) => textDisplay.setContent('> **💡 Options:**\n> **•** Wait for energy to regenerate\n> **•** Try fishing instead (15 energy)\n> **•** Use an energy restoration item (coming soon)\n> **•** Check `++energy` for strategic recommendations')
                );
                
                return ctx.sendMessage({ components: [container] });
            }
        }
        
        // Check if first time visiting
        const isFirstVisit = !hasVisitedIsland(profile, island.id);
        
        // Calculate rewards
        const baseSeashells = Math.floor(
            Math.random() * (island.rewards.seashells.max - island.rewards.seashells.min) + 
            island.rewards.seashells.min
        );
        
        // First visit bonus
        const seashellsEarned = isFirstVisit ? Math.floor(baseSeashells * 1.5) : baseSeashells;
        const xpEarned = isFirstVisit ? Math.floor(island.rewards.xp * 1.5) : island.rewards.xp;
        
        // Check for random exploration event (30% chance)
        const hasEvent = Math.random() < 0.3;
        
        if (hasEvent) {
            // Show exploration event instead of immediate rewards
            return this.showExplorationEvent(ctx, profile, island, isFirstVisit, seashellsEarned, xpEarned, isDeveloper);
        }
        
        // Check for collectible drop
        let foundCollectible = null;
        const collectibleChance = isFirstVisit ? island.rewards.collectibleChance * 1.3 : island.rewards.collectibleChance;
        if (Math.random() < collectibleChance) {
            foundCollectible = this.findCollectible();
        }
        
        // Consume energy for exploring (skip for developers)
        let energyResult;
        if (isDeveloper) {
            energyResult = { cost: 0, remaining: profile.energy };
        } else {
            energyResult = consumeEnergy(profile, 'exploring');
        }
        
        // Update exploration streak
        const now = new Date();
        const lastExploration = profile.lastExploration ? new Date(profile.lastExploration) : null;
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        if (!lastExploration || lastExploration < oneDayAgo) {
            // Check if streak should continue or reset
            const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
            if (lastExploration && lastExploration > twoDaysAgo) {
                profile.explorationStreak += 1;
            } else {
                profile.explorationStreak = 1;
            }
        }
        
        // Update profile
        profile.beachesExplored += 1;
        profile.currentBeach = island.name;
        profile.lastExploration = now;
        profile.battlePassXP += xpEarned;
        profile.totalXPEarned += xpEarned;
        profile.seashells += seashellsEarned;
        
        // Update challenge progress - IMPROVED LOGIC
        // Daily challenges
        if (profile.dailyChallenges && profile.dailyChallenges.length > 0) {
            for (let challenge of profile.dailyChallenges) {
                // Skip if completed or expired
                if (isChallengeCompleted(challenge) || isChallengeExpired(challenge)) continue;
                
                // Initialize progress if undefined
                if (typeof challenge.progress === 'undefined') challenge.progress = 0;
                
                // Exploring challenges
                if (challenge.type === 'exploring') {
                    challenge.progress += 1;
                }
                
                // Collectible challenges
                if (foundCollectible && challenge.type === 'collecting') {
                    challenge.progress += 1;
                }
            }
        }
        
        // Weekly challenges
        if (profile.weeklyChallenges && profile.weeklyChallenges.length > 0) {
            for (let challenge of profile.weeklyChallenges) {
                // Skip if completed or expired
                if (isChallengeCompleted(challenge) || isChallengeExpired(challenge)) continue;
                
                // Initialize progress if undefined
                if (typeof challenge.progress === 'undefined') challenge.progress = 0;
                
                // Exploring challenges
                if (challenge.type === 'exploring') {
                    challenge.progress += 1;
                }
                
                // Collectible challenges
                if (foundCollectible && challenge.type === 'collecting') {
                    challenge.progress += 1;
                    
                    // Rare collectible tracking
                    if (challenge.id === 'weekly_rare_collect_5' && ['rare', 'epic', 'legendary'].includes(foundCollectible.rarity)) {
                        challenge.progress += 1;
                    }
                }
            }
        }
        
        // Update island progress (track explorations and collectibles found)
        updateIslandProgress(profile, island.id, 'explorations', 1);
        if (foundCollectible) {
            updateIslandProgress(profile, island.id, 'collectibles', 1);
        }
        
        // Track visited islands
        if (!profile.visitedIslands.includes(island.id)) {
            profile.visitedIslands.push(island.id);
        }
        
        // Track island discoveries
        const existingDiscovery = profile.islandDiscoveries.find(d => d.islandId === island.id);
        if (existingDiscovery) {
            existingDiscovery.timesVisited += 1;
        } else {
            profile.islandDiscoveries.push({
                islandId: island.id,
                islandName: island.name,
                discoveredAt: now,
                timesVisited: 1
            });
        }
        
        // Add collectible if found
        if (foundCollectible) {
            profile.collectibles.push({
                id: foundCollectible.id,
                name: foundCollectible.name,
                category: this.getCollectibleCategory(foundCollectible.id),
                rarity: foundCollectible.rarity,
                obtainedAt: now
            });
        }
        
        await profile.save();
        
        // Get explorer rank
        const explorerRank = getExplorerRank(profile.visitedIslands);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Island discovery header
        const groupInfo = islandGroups[island.group];
        const header = isFirstVisit 
            ? '> ## **🗺️ Island Discovered!**\n> # **' + island.emoji + ' ' + island.name + '**'
            : '> ## **' + island.emoji + ' ' + island.name + '**';
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(header + '\n> ' + groupInfo.emoji + ' _' + groupInfo.name + ' Island Group_\n> _' + island.description + '_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // First visit bonus notification
        if (isFirstVisit) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **✨ First Visit Bonus!**\n> _+50% rewards for discovering a new island!_')
            );
            container.addSeparatorComponents((separator) => separator.setDivider(false));
        }
        
        // Exploration results
        const resultsText = '> **🎁 Discovery Rewards**\n' +
            '> **•** Seashells: `+' + seashellsEarned + '` 🐚' + (isFirstVisit ? ' **BONUS**' : '') + '\n' +
            '> **•** XP: `+' + xpEarned + '` 📈' + (isFirstVisit ? ' **BONUS**' : '') + '\n' +
            '> **•** Total Explorations: `' + profile.beachesExplored + '`\n' +
            '> **•** Exploration Streak: `' + profile.explorationStreak + ' days` 🔥';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(resultsText));
        
        // Collectible found
        if (foundCollectible) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const rarityBadge = this.getRarityBadge(foundCollectible.rarity);
            const collectibleText = '> **✨ Collectible Found!**\n' +
                '> ' + foundCollectible.emoji + ' **' + foundCollectible.name + '**\n' +
                '> ' + rarityBadge + '\n' +
                '> _Added to your collection!_';
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(collectibleText));
        }
        
        // Energy status
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const energyDisplay = formatEnergyDisplay(profile);
        let energyText = '> **⚡ Energy**\n' +
            '> **Used:** `-' + energyResult.cost + ' energy` 🗺️\n' +
            '> **Remaining:** `' + energyResult.remaining + '/100` (' + energyDisplay.percent + '%)\n';
        
        // Energy warnings
        if (energyResult.remaining < 20) {
            energyText += '> \n> 🔴 **Low Energy!** Not enough for another exploration.';
            const timeInfo = getTimeUntilFull(profile);
            energyText += '\n> _Full in ' + timeInfo.hours + 'h ' + timeInfo.minutes + 'm_';
        } else if (energyResult.remaining < 40) {
            energyText += '> \n> 🟡 **Energy running low!** Consider fishing (15) or resting.';
        } else {
            const exploresLeft = Math.floor(energyResult.remaining / 20);
            const fishesLeft = Math.floor(energyResult.remaining / 15);
            energyText += '> \n> 🟢 **You can explore ' + exploresLeft + ' more times or fish ' + fishesLeft + ' times.**';
        }
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(energyText));
        
        // Explorer rank and progress
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const uniqueIslands = profile.visitedIslands.length;
        const totalIslands = 54;
        const progressPercent = Math.floor((uniqueIslands / totalIslands) * 100);
        
        const explorerText = '> **🗺️ Explorer Progress**\n' +
            '> **Rank:** ' + explorerRank.emoji + ' `' + explorerRank.rank + '`\n' +
            '> **Islands Visited:** `' + uniqueIslands + '/' + totalIslands + '` (' + progressPercent + '%)\n' +
            '> **Available:** `' + availableIslands.length + '` islands';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(explorerText));
        
        // Show island progress if it has requirements
        if (island.progressRequirements) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            const currentProgress = getIslandProgress(profile, island.id);
            const progressText = '> **🏝️ ' + island.name + ' Progress**\n' + formatIslandProgress(island, currentProgress);
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(progressText));
        }
        
        // Island group statistics
        const groupStats = getIslandGroupStats(profile);
        const groupStatsText = '> **🏝️ Island Groups**\n' +
            '> 🟢 **Luzon:** `' + groupStats.luzon.visited + '/' + groupStats.luzon.total + '`\n' +
            '> 🟡 **Visayas:** `' + groupStats.visayas.visited + '/' + groupStats.visayas.total + '`\n' +
            '> 🔴 **Mindanao:** `' + groupStats.mindanao.visited + '/' + groupStats.mindanao.total + '`';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(groupStatsText));
        
        // Check if current island is completed and show next island
        if (isFirstVisit && island.progressRequirements) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            const req = island.progressRequirements;
            const requirementsText = '> **📋 ' + island.name + ' Requirements**\n' +
                '> _Complete these to unlock the next island:_\n' +
                '> **•** Catch ' + req.fish + ' fish here\n' +
                '> **•** Explore ' + req.explorations + ' times\n' +
                '> **•** Find ' + req.collectibles + ' collectibles';
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(requirementsText));
        }
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_💡 Explore daily to maintain your streak! Energy regenerates +1 per hour. Use ++energy for strategic planning!_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    findCollectible() {
        const allCollectibles = getAllCollectibles();
        
        // Determine rarity
        const roll = Math.random() * 100;
        let cumulative = 0;
        let selectedRarity = 'common';
        
        for (const [rarity, chance] of Object.entries(collectibleRarityChances)) {
            cumulative += chance;
            if (roll <= cumulative) {
                selectedRarity = rarity;
                break;
            }
        }
        
        // Filter by rarity and pick random
        const rarityPool = allCollectibles.filter(c => c.rarity === selectedRarity);
        return rarityPool[Math.floor(Math.random() * rarityPool.length)];
    }
    
    getCollectibleCategory(id) {
        if (id.startsWith('shell_')) return 'shells';
        if (id.startsWith('crab_')) return 'crabs';
        if (id.startsWith('drink_')) return 'drinks';
        if (id.startsWith('item_')) return 'items';
        if (id.startsWith('flower_')) return 'flowers';
        return 'misc';
    }
    
    getRarityBadge(rarity) {
        const badges = {
            common: '`🟢 Common`',
            uncommon: '`🔵 Uncommon`',
            rare: '`🟣 Rare`',
            epic: '`🟠 Epic`',
            legendary: '`🔴 Legendary`'
        };
        return badges[rarity] || badges.common;
    }
    
    async showExplorationEvent(ctx, profile, island, isFirstVisit, baseSeashells, baseXP, isDeveloper = false) {
        const event = getRandomEvent();
        
        // Consume energy upfront for exploration (skip for developers)
        let energyResult;
        if (isDeveloper) {
            energyResult = { cost: 0, remaining: profile.energy };
        } else {
            energyResult = consumeEnergy(profile, 'exploring');
        }
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Event header
        const groupInfo = islandGroups[island.group];
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **' + island.emoji + ' ' + island.name + '**\n> ' + groupInfo.emoji + ' _' + groupInfo.name + ' Island Group_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Event description
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> # **' + event.emoji + ' ' + event.title + '**\n> _' + event.description + '_\n\n> **What will you do?**')
        );
        
        // Create action buttons using ActionRowBuilder and ButtonBuilder
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
        
        const buttons = event.choices.map((choice, index) => {
            return new ButtonBuilder()
                .setCustomId('explore_event_' + ctx.author.id + '_' + event.id + '_' + choice.id)
                .setLabel(choice.label)
                .setStyle(index === 0 ? ButtonStyle.Primary : (index === 1 ? ButtonStyle.Secondary : ButtonStyle.Success))
                .setEmoji(choice.label.split(' ')[0]); // Extract emoji from label
        });
        
        const buttonRows = [];
        for (let i = 0; i < buttons.length; i += 3) {
            const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 3));
            buttonRows.push(row);
        }
        
        // Show choices
        const choicesText = event.choices.map((choice, i) => 
            '> **' + (i + 1) + '.** ' + choice.label + '\n> _' + choice.description + '_'
        ).join('\n>\n');
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(choicesText)
        );
        
        // Store event data temporarily (we'll handle the interaction in InteractionCreate.js)
        // For now, send message with buttons
        const message = await ctx.sendMessage({ 
            components: [container, ...buttonRows]
        });
        
        // Create collector for button interaction
        const filter = (interaction) => {
            return interaction.customId.startsWith('explore_event_' + ctx.author.id) && interaction.user.id === ctx.author.id;
        };
        
        const collector = message.createMessageComponentCollector({ filter, time: 60000, max: 1 });
        
        collector.on('collect', async (interaction) => {
            await interaction.deferUpdate();
            
            // Extract choice ID from custom ID
            const parts = interaction.customId.split('_');
            const choiceId = parts[parts.length - 1];
            
            // Find the choice
            const choice = event.choices.find(c => c.id === choiceId);
            if (!choice) return;
            
            // Process outcome
            const outcome = processEventOutcome(choice);
            if (!outcome) return;
            
            // Calculate final rewards
            let finalSeashells = baseSeashells;
            let finalXP = baseXP;
            let sunTokens = 0;
            let foundCollectible = null;
            
            if (outcome.reward.seashells) {
                finalSeashells += outcome.reward.seashells;
            }
            if (outcome.reward.xp) {
                finalXP += outcome.reward.xp;
            }
            if (outcome.reward.sunTokens) {
                sunTokens = outcome.reward.sunTokens;
            }
            if (outcome.reward.collectible) {
                foundCollectible = this.findCollectibleByRarity(outcome.reward.collectible);
            }
            
            // Update exploration streak
            const now = new Date();
            const lastExploration = profile.lastExploration ? new Date(profile.lastExploration) : null;
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            
            if (!lastExploration || lastExploration < oneDayAgo) {
                const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
                if (lastExploration && lastExploration > twoDaysAgo) {
                    profile.explorationStreak += 1;
                } else {
                    profile.explorationStreak = 1;
                }
            }
            
            // Update profile
            profile.beachesExplored += 1;
            profile.currentBeach = island.name;
            profile.lastExploration = now;
            profile.battlePassXP += finalXP;
            profile.totalXPEarned += finalXP;
            profile.seashells = Math.max(0, profile.seashells + finalSeashells);
            if (sunTokens > 0) {
                profile.sunTokens += sunTokens;
            }
            
            // Track visited islands
            if (!profile.visitedIslands.includes(island.id)) {
                profile.visitedIslands.push(island.id);
            }
            
            const existingDiscovery = profile.islandDiscoveries.find(d => d.islandId === island.id);
            if (existingDiscovery) {
                existingDiscovery.timesVisited += 1;
            } else {
                profile.islandDiscoveries.push({
                    islandId: island.id,
                    islandName: island.name,
                    discoveredAt: now,
                    timesVisited: 1
                });
            }
            
            // Add collectible if found
            if (foundCollectible) {
                profile.collectibles.push({
                    id: foundCollectible.id,
                    name: foundCollectible.name,
                    category: this.getCollectibleCategory(foundCollectible.id),
                    rarity: foundCollectible.rarity,
                    obtainedAt: now
                });
            }
            
            await profile.save();
            
            // Show outcome
            const explorerRank = getExplorerRank(profile.visitedIslands);
            
            const resultContainer = this.client.container()
                .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
            
            // Outcome header
            resultContainer.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ## **' + event.emoji + ' ' + event.title + '**\n> _You chose: ' + choice.label + '_')
            );
            
            resultContainer.addSeparatorComponents((separator) => separator.setDivider(true));
            
            // Outcome message
            resultContainer.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **' + outcome.message + '**')
            );
            
            resultContainer.addSeparatorComponents((separator) => separator.setDivider(true));
            
            // Rewards
            let rewardsText = '> **🎁 Total Rewards**\n';
            if (finalSeashells > 0) {
                rewardsText += '> **•** Seashells: `+' + finalSeashells + '` 🐚\n';
            } else if (finalSeashells < 0) {
                rewardsText += '> **•** Seashells: `' + finalSeashells + '` 🐚 _(lost)_\n';
            }
            rewardsText += '> **•** XP: `+' + finalXP + '` 📈\n';
            if (sunTokens > 0) {
                rewardsText += '> **•** Sun Tokens: `+' + sunTokens + '` 🌟\n';
            }
            rewardsText += '> **•** Exploration Streak: `' + profile.explorationStreak + ' days` 🔥';
            
            resultContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(rewardsText));
            
            // Collectible found
            if (foundCollectible) {
                resultContainer.addSeparatorComponents((separator) => separator.setDivider(true));
                const rarityBadge = this.getRarityBadge(foundCollectible.rarity);
                resultContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> **✨ Collectible Found!**\n> ' + foundCollectible.emoji + ' **' + foundCollectible.name + '**\n> ' + rarityBadge)
                );
            }
            
            // Energy status
            resultContainer.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const energyDisplay = formatEnergyDisplay(profile);
            let energyText = '> **⚡ Energy**\n' +
                '> **Used:** `-' + energyResult.cost + ' energy` 🗺️\n' +
                '> **Remaining:** `' + energyResult.remaining + '/100` (' + energyDisplay.percent + '%)\n';
            
            if (energyResult.remaining < 20) {
                energyText += '> \n> 🔴 **Low Energy!** Rest recommended.';
            } else if (energyResult.remaining < 40) {
                energyText += '> \n> 🟡 **Energy running low!**';
            }
            
            resultContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(energyText));
            
            // Explorer rank
            resultContainer.addSeparatorComponents((separator) => separator.setDivider(true));
            const uniqueIslands = profile.visitedIslands.length;
            resultContainer.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **🗺️ Explorer Rank:** ' + explorerRank.emoji + ' `' + explorerRank.rank + '`\n> **Islands Visited:** `' + uniqueIslands + '/54`')
            );
            
            await interaction.editReply({ components: [resultContainer] });
        });
        
        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                // Timeout - apply default outcome (usually the safe choice)
                const safeChoice = event.choices[event.choices.length - 1];
                const outcome = processEventOutcome(safeChoice);
                
                const timeoutContainer = this.client.container()
                    .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
                
                timeoutContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> **⏰ Time\'s Up!**\n> _You took too long to decide and chose the safe option._\n\n> ' + outcome.message)
                );
                
                await message.edit({ components: [timeoutContainer] });
            }
        });
        
        return message;
    }
    
    findCollectibleByRarity(rarity) {
        const allCollectibles = getAllCollectibles();
        const rarityPool = allCollectibles.filter(c => c.rarity === rarity);
        return rarityPool[Math.floor(Math.random() * rarityPool.length)];
    }
}
