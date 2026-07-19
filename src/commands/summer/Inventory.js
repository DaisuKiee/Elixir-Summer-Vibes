import { StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { equipmentData } from '../../data/equipment.js';
import { fishData } from '../../data/fish.js';
import { emojis } from '../../config/emojis.js';

export default class Inventory extends Command {
    constructor(client) {
        super(client, {
            name: 'inventory',
            description: {
                content: 'View your complete inventory: fish, equipment, collectibles, and items',
                usage: '[category]',
                examples: ['inventory', 'inventory fish', 'inventory equipment', 'inventory collectibles'],
            },
            aliases: ['inv', 'items', 'bag'],
            category: 'summer',
            cooldown: 5,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'category',
                    description: 'View specific inventory category',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Overview', value: 'overview' },
                        { name: 'Fish', value: 'fish' },
                        { name: 'Equipment', value: 'equipment' },
                        { name: 'Collectibles', value: 'collectibles' },
                        { name: 'Energy Items', value: 'energy' },
                        { name: 'Bait & Lures', value: 'bait' }
                    ]
                },
            ]
        });
    }
    
    async run(ctx, args) {
        // Get profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: ctx.author.id,
                username: ctx.author.tag
            });
            await profile.save();
        }
        
        // Check for category filter from args
        const categoryArg = ctx.isInteraction && ctx.interaction.options.getString('category')
            ? ctx.interaction.options.getString('category')
            : (args[0]?.toLowerCase() || null);
        
        // Show interactive inventory
        await this.showInventory(ctx, profile, categoryArg || 'overview', 1);
    }
    
    async showInventory(ctx, profile, category, page) {
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        const headerText = `${emojis.general.gift} Inventory\n${ctx.author.username}`;
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(headerText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Show category content
        if (category === 'overview') {
            await this.buildOverview(container, profile);
        } else if (category === 'fish') {
            await this.buildFishView(container, profile, page);
        } else if (category === 'equipment') {
            await this.buildEquipmentView(container, profile);
        } else if (category === 'collectibles') {
            await this.buildCollectiblesView(container, profile, page);
        } else if (category === 'energy') {
            await this.buildEnergyView(container, profile);
        } else if (category === 'bait') {
            await this.buildBaitView(container, profile);
        }
        
        // Controls
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        const categoryMenu = this.buildCategoryMenu(category);
        container.addActionRowComponents((row) => row.addComponents(categoryMenu));
        
        // Pagination for fish and collectibles
        if (category === 'fish' || category === 'collectibles') {
            const items = category === 'fish' ? (profile.fishInventory || []) : (profile.collectibles || []);
            const totalPages = Math.ceil(items.length / 10);
            if (totalPages > 1) {
                const buttons = this.buildPaginationButtons(page, totalPages);
                container.addActionRowComponents((row) => row.addComponents(...buttons));
            }
        }
        
        // Send message
        let message;
        if (ctx.message) {
            message = await ctx.sendMessage({ components: [container] });
        } else {
            return ctx.sendMessage({ components: [container] });
        }
        
        // Handle interactions
        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 300000
        });
        
        collector.on('collect', async interaction => {
            try {
                if (interaction.customId === 'inv_category') {
                    category = interaction.values[0];
                    page = 1;
                } else if (interaction.customId === 'inv_prev') {
                    page = Math.max(1, page - 1);
                } else if (interaction.customId === 'inv_next') {
                    const items = category === 'fish' ? (profile.fishInventory || []) : (profile.collectibles || []);
                    const totalPages = Math.ceil(items.length / 10);
                    page = Math.min(totalPages, page + 1);
                }
                
                // Rebuild container
                const newContainer = this.client.container()
                    .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
                
                const headerText = `${emojis.general.gift} Inventory\n${ctx.author.username}`;
                newContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(headerText)
                );
                newContainer.addSeparatorComponents((separator) => separator.setDivider(true));
                
                if (category === 'overview') {
                    await this.buildOverview(newContainer, profile);
                } else if (category === 'fish') {
                    await this.buildFishView(newContainer, profile, page);
                } else if (category === 'equipment') {
                    await this.buildEquipmentView(newContainer, profile);
                } else if (category === 'collectibles') {
                    await this.buildCollectiblesView(newContainer, profile, page);
                } else if (category === 'energy') {
                    await this.buildEnergyView(newContainer, profile);
                } else if (category === 'bait') {
                    await this.buildBaitView(newContainer, profile);
                }
                
                newContainer.addSeparatorComponents((separator) => separator.setDivider(true));
                const categoryMenu = this.buildCategoryMenu(category);
                newContainer.addActionRowComponents((row) => row.addComponents(categoryMenu));
                
                if (category === 'fish' || category === 'collectibles') {
                    const items = category === 'fish' ? (profile.fishInventory || []) : (profile.collectibles || []);
                    const totalPages = Math.ceil(items.length / 10);
                    if (totalPages > 1) {
                        const buttons = this.buildPaginationButtons(page, totalPages);
                        newContainer.addActionRowComponents((row) => row.addComponents(...buttons));
                    }
                }
                
                await interaction.update({ components: [newContainer] });
            } catch (error) {
                console.error('Error updating inventory:', error);
            }
        });
        
        collector.on('end', () => {
            message.edit({ components: [] }).catch(() => {});
        });
    }
    
    async buildOverview(container, profile) {
        // Quick stats overview
        const fishCount = profile.fishInventory?.length || 0;
        const uniqueFish = profile.fishCollection?.length || 0;
        const collectiblesCount = profile.collectibles?.length || 0;
        const energyItems = Object.values(profile.energyItems || {}).reduce((sum, count) => sum + count, 0);
        const baitCount = profile.baitInventory?.reduce((sum, bait) => sum + bait.quantity, 0) || 0;
        
        const statsText = `${emojis.general.gift} Inventory Overview\n` +
            `${emojis.currency.seashell} Seashells: ${(profile.seashells || 0).toLocaleString()}\n` +
            `${emojis.currency.sunToken} Sun Tokens: ${profile.sunTokens || 0}\n\n` +
            `${emojis.activities.fishing} Fish: ${fishCount}/50 (${uniqueFish} unique)\n` +
            `${emojis.collectibles.crab} Collectibles: ${collectiblesCount}\n` +
            `${emojis.energy.food} Energy Items: ${energyItems}\n` +
            `${emojis.activities.fishing} Bait & Lures: ${baitCount}`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(statsText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Equipment overview
        const rod = profile.equipment?.rod || { level: 1 };
        const net = profile.equipment?.net || { level: 1 };
        const boat = profile.equipment?.boat || { level: 1 };
        const accessory = profile.equipment?.accessory || { level: 1 };
        
        const rodData = equipmentData.rod[rod.level];
        const netData = equipmentData.net[net.level];
        const boatData = equipmentData.boat[boat.level];
        const accessoryData = equipmentData.accessory[accessory.level];
        
        const equipmentText = `${emojis.developer.tools} Equipment\n` +
            `${emojis.activities.fishing} ${rodData.name} (Lv.${rod.level})\n` +
            `${emojis.ocean.anchor} ${netData.name} (Lv.${net.level})\n` +
            `${emojis.ocean.boat} ${boatData.name} (Lv.${boat.level})\n` +
            `${emojis.general.gem} ${accessoryData.name} (Lv.${accessory.level})`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(equipmentText)
        );
        
        // Recent fish (last 5)
        if (fishCount > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const recentFish = profile.fishInventory.slice(-5).reverse();
            let recentText = `${emojis.time.clock} Recent Catches\n`;
            recentText += recentFish.map(fish => 
                `${this.getFishEmoji(fish.name)} ${fish.name} (${fish.weight}kg)`
            ).join('\n');
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(recentText)
            );
        }
    }
    
    async buildFishView(container, profile, page) {
        const fishInventory = profile.fishInventory || [];
        
        if (fishInventory.length === 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`${emojis.general.error} No fish in inventory\nGo fishing to catch some fish!`)
            );
            return;
        }
        
        // Sort fish by rarity (mythical > legendary > epic > rare > uncommon > common)
        const rarityOrder = { mythical: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        const sortedFish = [...fishInventory].sort((a, b) => {
            const rarityDiff = (rarityOrder[b.rarity?.toLowerCase()] || 0) - (rarityOrder[a.rarity?.toLowerCase()] || 0);
            if (rarityDiff !== 0) return rarityDiff;
            // If same rarity, sort by weight (heaviest first)
            return (b.weight || 0) - (a.weight || 0);
        });
        
        // Pagination
        const perPage = 10;
        const totalPages = Math.ceil(sortedFish.length / perPage);
        page = Math.max(1, Math.min(page, totalPages));
        const startIndex = (page - 1) * perPage;
        const pageFish = sortedFish.slice(startIndex, startIndex + perPage);
        
        const headerText = `${emojis.activities.fishing} Fish Inventory\n` +
            `${sortedFish.length}/50 Fish • Page ${page}/${totalPages}\n` +
            `${profile.fishCollection?.length || 0} Unique Species Caught`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(headerText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // List fish with emoji by name
        let fishText = '';
        pageFish.forEach((fish, index) => {
            const num = startIndex + index + 1;
            const fishEmoji = this.getFishEmoji(fish.name);
            const rarityEmoji = this.getRarityEmoji(fish.rarity);
            
            fishText += `${num}. ${fishEmoji} ${rarityEmoji} ${fish.name}\n`;
            fishText += `   ${fish.weight}kg • ${this.formatDate(fish.caughtAt)}\n`;
            if (index < pageFish.length - 1) fishText += '\n';
        });
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(fishText)
        );
    }
    
    async buildEquipmentView(container, profile) {
        const rod = profile.equipment?.rod || { level: 1 };
        const net = profile.equipment?.net || { level: 1 };
        const boat = profile.equipment?.boat || { level: 1 };
        const accessory = profile.equipment?.accessory || { level: 1 };
        
        const rodData = equipmentData.rod[rod.level];
        const netData = equipmentData.net[net.level];
        const boatData = equipmentData.boat[boat.level];
        const accessoryData = equipmentData.accessory[accessory.level];
        
        const equipmentText = `${emojis.developer.tools} Equipment\n\n` +
            `${emojis.activities.fishing} Fishing Rod\n` +
            `${rodData.name} (Level ${rod.level}/10)\n` +
            `Catch Rate: +${((rodData.catchRateBonus - 1) * 100).toFixed(0)}%\n` +
            `Value Bonus: +${((rodData.valueBonus - 1) * 100).toFixed(0)}%\n\n` +
            `${emojis.ocean.anchor} Net\n` +
            `${netData.name} (Level ${net.level}/10)\n` +
            `Rare Fish: +${((netData.rareFishBonus - 1) * 100).toFixed(0)}%\n` +
            `XP Bonus: +${((netData.xpBonus - 1) * 100).toFixed(0)}%\n\n` +
            `${emojis.ocean.boat} Boat\n` +
            `${boatData.name} (Level ${boat.level}/10)\n` +
            `Energy Cost: -${((1 - boatData.energyCostReduction) * 100).toFixed(0)}%\n` +
            `Inventory: +${boatData.inventoryBonus} slots\n\n` +
            `${emojis.general.gem} Accessory\n` +
            `${accessoryData.name} (Level ${accessory.level}/10)\n` +
            `Effect: ${accessoryData.effect || 'No effect'}`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(equipmentText)
        );
    }
    
    async buildCollectiblesView(container, profile, page) {
        const collectibles = profile.collectibles || [];
        
        if (collectibles.length === 0) {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`${emojis.general.error} No collectibles found\nExplore islands to find collectibles!`)
            );
            return;
        }
        
        // Pagination
        const perPage = 10;
        const totalPages = Math.ceil(collectibles.length / perPage);
        page = Math.max(1, Math.min(page, totalPages));
        const startIndex = (page - 1) * perPage;
        const pageItems = collectibles.slice(startIndex, startIndex + perPage);
        
        const headerText = `${emojis.collectibles.crab} Collectibles\n` +
            `${collectibles.length} Items • Page ${page}/${totalPages}`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(headerText)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // List collectibles
        let collectText = '';
        pageItems.forEach((item, index) => {
            const num = startIndex + index + 1;
            collectText += `${num}. ${this.getRarityEmoji(item.rarity)} ${item.name}\n`;
            collectText += `   ${this.getCategoryEmoji(item.category)} ${item.category}\n`;
            if (index < pageItems.length - 1) collectText += '\n';
        });
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(collectText)
        );
    }
    
    async buildEnergyView(container, profile) {
        const energyItems = profile.energyItems || {};
        
        const energyText = `${emojis.energy.energy} Energy Items\n` +
            `Current Energy: ${profile.energy || 0}/${profile.maxEnergy || 100}\n\n` +
            `${emojis.energy.snack} Small Snack (+10): ${energyItems.smallSnack || 0}\n` +
            `${emojis.energy.meal} Meal (+25): ${energyItems.meal || 0}\n` +
            `${emojis.energy.feast} Feast (+50): ${energyItems.feast || 0}\n` +
            `${emojis.energy.drink} Energy Drink (+75): ${energyItems.energyDrink || 0}\n` +
            `${emojis.energy.lightbulb} Full Restore (100%): ${energyItems.fullRestore || 0}`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(energyText)
        );
    }
    
    async buildBaitView(container, profile) {
        const baitInventory = profile.baitInventory || [];
        const activeBait = profile.activeBait;
        
        let baitText = `${emojis.activities.fishing} Bait & Lures\n`;
        
        if (activeBait && activeBait.remainingUses > 0) {
            baitText += `Active: ${activeBait.baitId} (${activeBait.remainingUses} uses left)\n\n`;
        } else {
            baitText += `No active bait\n\n`;
        }
        
        if (baitInventory.length === 0) {
            baitText += 'No bait in inventory\nBuy bait from the shop!';
        } else {
            baitText += baitInventory.map(bait => 
                `${bait.baitId}: ${bait.quantity}`
            ).join('\n');
        }
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(baitText)
        );
    }
    
    buildCategoryMenu(currentCategory) {
        return new StringSelectMenuBuilder()
            .setCustomId('inv_category')
            .setPlaceholder('📂 Select Category')
            .addOptions([
                {
                    label: 'Overview',
                    description: 'View inventory summary',
                    value: 'overview',
                    emoji: '📊',
                    default: currentCategory === 'overview'
                },
                {
                    label: 'Fish',
                    description: 'View caught fish',
                    value: 'fish',
                    emoji: '🎣',
                    default: currentCategory === 'fish'
                },
                {
                    label: 'Equipment',
                    description: 'View your gear',
                    value: 'equipment',
                    emoji: '🛠️',
                    default: currentCategory === 'equipment'
                },
                {
                    label: 'Collectibles',
                    description: 'View collectibles',
                    value: 'collectibles',
                    emoji: '🦀',
                    default: currentCategory === 'collectibles'
                },
                {
                    label: 'Energy Items',
                    description: 'View energy consumables',
                    value: 'energy',
                    emoji: '🍱',
                    default: currentCategory === 'energy'
                },
                {
                    label: 'Bait & Lures',
                    description: 'View fishing bait',
                    value: 'bait',
                    emoji: '🎣',
                    default: currentCategory === 'bait'
                }
            ]);
    }
    
    buildPaginationButtons(currentPage, totalPages) {
        const buttons = [];
        
        buttons.push(
            new ButtonBuilder()
                .setCustomId('inv_prev')
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 1)
        );
        
        buttons.push(
            new ButtonBuilder()
                .setCustomId('inv_next')
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === totalPages)
        );
        
        return buttons;
    }
    
    getRarityEmoji(rarity) {
        if (!rarity) return emojis.rarity.common || '⚪';
        
        const rarityLower = rarity.toLowerCase();
        
        // Get rarity emoji from config
        if (emojis.rarity && emojis.rarity[rarityLower]) {
            return emojis.rarity[rarityLower];
        }
        
        // Fallback to colored circles if config emoji not found
        const fallbackEmojis = {
            common: '⚪',
            uncommon: '🟢',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡',
            mythical: '🔴'
        };
        return fallbackEmojis[rarityLower] || '⚪';
    }
    
    getFishEmoji(fishName) {
        if (!fishName) return '🐟';
        
        // Convert fish name to emoji key format (same as Fishdex)
        // e.g., "Yellowfin Tuna" -> "yellowfinTuna"
        // e.g., "Hasa-Hasa" -> "hasahasa"
        // e.g., "Lapu-Lapu" -> "lapulapu"
        const emojiKey = fishName
            .replace(/\s+/g, '')           // Remove all spaces
            .replace(/^./, str => str.toLowerCase())  // Lowercase first character
            .replace(/-/g, '');            // Remove hyphens
        
        // Try to get emoji from fish emojis config
        if (emojis.fish && emojis.fish[emojiKey]) {
            return emojis.fish[emojiKey];
        }
        
        // Fallback to generic fish emojis
        return emojis.fish.fishGeneral || '🐟';
    }
    
    getCategoryEmoji(category) {
        const categoryEmojis = {
            shells: '🐚',
            crabs: '🦀',
            drinks: '🥤',
            items: '📦',
            treasures: '💎',
            fossils: '🦴',
            plants: '🌿'
        };
        return categoryEmojis[category?.toLowerCase()] || '📦';
    }
    
    formatDate(date) {
        if (!date) return 'Unknown';
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return new Date(date).toLocaleDateString();
    }
}
