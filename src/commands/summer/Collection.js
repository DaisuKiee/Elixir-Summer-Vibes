import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { collectiblesData } from '../../data/collectibles.js';
import { emojis } from '../../config/emojis.js';

export default class Collection extends Command {
    constructor(client) {
        super(client, {
            name: 'collection',
            description: {
                content: 'View your complete collection book organized by category',
                usage: '[category]',
                examples: ['collection', 'collection shells', 'collection crabs', 'collection legendary'],
            },
            aliases: ['collect', 'book', 'collectionbook'],
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
                    name: 'filter',
                    description: 'Filter by category or rarity',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Shells', value: 'shells' },
                        { name: 'Crabs', value: 'crabs' },
                        { name: 'Drinks', value: 'drinks' },
                        { name: 'Items', value: 'items' },
                        { name: 'Common', value: 'common' },
                        { name: 'Rare', value: 'rare' },
                        { name: 'Epic', value: 'epic' },
                        { name: 'Legendary', value: 'legendary' }
                    ]
                }
            ]
        });
    }
    
    async run(ctx, args) {
        // Get profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **❌ No Profile Found**\n> _Use `++daily` to create your summer profile!_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Initialize collectibles if needed
        if (!profile.collectibles) profile.collectibles = [];
        
        // Parse filter
        const filter = ctx.isInteraction && ctx.interaction.options.getString('filter')
            ? ctx.interaction.options.getString('filter')
            : (args[0]?.toLowerCase() || null);
        
        if (filter) {
            return this.showFilteredCollection(ctx, profile, filter);
        }
        
        return this.showOverview(ctx, profile);
    }
    
    async showOverview(ctx, profile) {
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `> ## **${emojis.collectibles?.box || '📖'} Summer Collection Book**\n` +
                `> **${ctx.author.username}**'s treasure collection`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Overall stats
        const totalCollectibles = this.getAllCollectibles().length;
        const owned = profile.collectibles.length;
        const percent = totalCollectibles > 0 ? Math.floor((owned / totalCollectibles) * 100) : 0;
        
        // Progress bar
        const barLength = 15;
        const filled = Math.floor((owned / totalCollectibles) * barLength);
        const progressBar = '▰'.repeat(filled) + '▱'.repeat(barLength - filled);
        
        const overviewText = 
            `> **${emojis.progression?.stats || '📊'} Overall Progress**\n` +
            `> ${progressBar}\n` +
            `> **Collected:** \`${owned}/${totalCollectibles}\` **(${percent}%)**\n` +
            `> **Missing:** \`${totalCollectibles - owned}\` items\n` +
            `> \n` +
            `> ${this.getProgressMessage(percent)}`;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(overviewText));
        
        // Category breakdown
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const categories = ['shells', 'crabs', 'drinks', 'items', 'flowers'];
        let categoryText = `> **${emojis.collectibles?.box || '📚'} By Category**\n> \n`;
        
        categories.forEach(cat => {
            const catItems = collectiblesData[cat] || [];
            const catOwned = profile.collectibles.filter(c => c.category === cat).length;
            const catPercent = catItems.length > 0 ? Math.floor((catOwned / catItems.length) * 100) : 0;
            
            const emoji = this.getCategoryEmoji(cat);
            const name = cat.charAt(0).toUpperCase() + cat.slice(1);
            
            // Progress bar for each category
            const catBarLength = 10;
            const catFilled = Math.floor((catOwned / catItems.length) * catBarLength);
            const catBar = '▰'.repeat(catFilled) + '▱'.repeat(catBarLength - catFilled);
            
            categoryText += `> ${emoji} **${name}**\n`;
            categoryText += `> ${catBar} \`${catOwned}/${catItems.length}\` **(${catPercent}%)**\n`;
        });
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(categoryText));
        
        // Rarity breakdown
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        let rarityText = `> **${emojis.general?.sparkles || '✨'} By Rarity**\n> \n`;
        
        rarities.forEach(rarity => {
            const allRarity = this.getAllCollectibles().filter(c => c.rarity === rarity).length;
            const ownedRarity = profile.collectibles.filter(c => c.rarity === rarity).length;
            const percent = allRarity > 0 ? Math.floor((ownedRarity / allRarity) * 100) : 0;
            
            const emoji = this.getRarityEmoji(rarity);
            const name = rarity.charAt(0).toUpperCase() + rarity.slice(1);
            
            rarityText += `> ${emoji} **${name}:** \`${ownedRarity}/${allRarity}\` **(${percent}%)**\n`;
        });
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(rarityText));
        
        // Recent finds
        if (profile.collectibles.length > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const recent = profile.collectibles
                .sort((a, b) => new Date(b.obtainedAt) - new Date(a.obtainedAt))
                .slice(0, 5);
            
            let recentText = `> **${emojis.time?.clock || '🕒'} Recently Found**\n> \n`;
            recent.forEach((item, index) => {
                const emoji = this.getRarityEmoji(item.rarity);
                const timeAgo = this.getTimeAgo(item.obtainedAt);
                recentText += `> ${emoji} **${item.name}** - _${timeAgo}_\n`;
            });
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(recentText));
        }
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `> **${emojis.energy?.lightbulb || '💡'} Tip**\n` +
                `> Use \`++collection [category]\` to view specific collections!\n` +
                `> \n` +
                `> **Available filters:**\n` +
                `> ${emojis.collectibles?.shell || '🐚'} shells • ${emojis.collectibles?.crab || '🦀'} crabs • ${emojis.collectibles?.cup || '🥤'} drinks\n` +
                `> ${emojis.general?.gift || '🎁'} items • ${emojis.summer?.hibiscus || '🌺'} flowers\n` +
                `> \n` +
                `> Or filter by rarity: common, uncommon, rare, epic, legendary`
            )
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    getProgressMessage(percent) {
        if (percent === 100) return `${emojis.general?.trophy || '🏆'} **Complete!** Amazing collection!`;
        if (percent >= 80) return `${emojis.general?.fire || '🔥'} Almost there! Keep going!`;
        if (percent >= 60) return `${emojis.general?.star || '⭐'} Great progress! More than halfway!`;
        if (percent >= 40) return `${emojis.general?.sparkles || '✨'} Good work! Keep collecting!`;
        if (percent >= 20) return `${emojis.activities?.search || '🔍'} Getting started! Keep hunting!`;
        return `${emojis.general?.new || '🆕'} Just beginning your collection!`;
    }
    
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return `${Math.floor(seconds / 604800)}w ago`;
    }
    
    async showFilteredCollection(ctx, profile, filter) {
        const filterLower = filter.toLowerCase();
        
        // Check if filter is a category or rarity
        const categories = ['shells', 'crabs', 'drinks', 'items', 'flowers'];
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        
        let items = [];
        let title = '';
        
        if (categories.includes(filterLower)) {
            items = collectiblesData[filterLower] || [];
            title = filterLower.charAt(0).toUpperCase() + filterLower.slice(1);
        } else if (rarities.includes(filterLower)) {
            items = this.getAllCollectibles().filter(c => c.rarity === filterLower);
            title = filterLower.charAt(0).toUpperCase() + filterLower.slice(1) + ' Items';
        } else {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `> **${emojis.general?.error || '❌'} Invalid Filter**\n` +
                    `> \n` +
                    `> Valid filters:\n` +
                    `> **Categories:** shells, crabs, drinks, items, flowers\n` +
                    `> **Rarities:** common, uncommon, rare, epic, legendary`
                )
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        if (items.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **⚠️ No Items Found**\n> _This collection is empty._')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        const emoji = categories.includes(filterLower) ? this.getCategoryEmoji(filterLower) : this.getRarityEmoji(filterLower);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `> ## **${emoji} ${title} Collection**\n` +
                `> **${ctx.author.username}**'s collection`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Progress
        const owned = profile.collectibles.filter(c => {
            if (categories.includes(filterLower)) {
                return c.category === filterLower;
            } else {
                return c.rarity === filterLower;
            }
        }).length;
        
        const percent = Math.floor((owned / items.length) * 100);
        const barLength = 15;
        const filled = Math.floor((owned / items.length) * barLength);
        const progressBar = '▰'.repeat(filled) + '▱'.repeat(barLength - filled);
        
        const progressText = 
            `> **${emojis.progression?.chart || '📊'} Progress**\n` +
            `> ${progressBar}\n` +
            `> **Collected:** \`${owned}/${items.length}\` **(${percent}%)**\n` +
            `> **Missing:** \`${items.length - owned}\` items`;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(progressText));
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // List all items
        let itemsText = '';
        items.forEach((item, i) => {
            const hasItem = profile.collectibles.find(c => c.id === item.id);
            const status = hasItem ? emojis.ui?.checkBox || '☑️' : '☐';
            const rarityEmoji = this.getRarityEmoji(item.rarity);
            
            itemsText += `> ${status} ${rarityEmoji} **${item.name}**`;
            if (!hasItem) {
                itemsText += ` ${emojis.general?.locked || '🔒'}`;
            }
            itemsText += '\n';
            
            // Add separator every 10 items for better readability
            if ((i + 1) % 10 === 0 && i < items.length - 1) {
                container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(itemsText));
                itemsText = '';
            }
        });
        
        if (itemsText) {
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(itemsText));
        }
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `> **${emojis.energy?.lightbulb || '💡'} Tip**\n` +
                `> Find collectibles by using \`++beachhunt\` or \`++explore\`!\n` +
                `> Use \`++collection\` to view all categories.`
            )
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    getAllCollectibles() {
        const all = [];
        for (const category in collectiblesData) {
            all.push(...collectiblesData[category]);
        }
        return all;
    }
    
    getCategoryEmoji(category) {
        const emojiMap = {
            shells: emojis.collectibles?.shell || '🐚',
            crabs: emojis.collectibles?.crab || '🦀',
            drinks: emojis.collectibles?.cup || '🥤',
            items: emojis.general?.gift || '🎁',
            flowers: emojis.summer?.hibiscus || '🌺'
        };
        return emojiMap[category] || emojis.collectibles?.box || '📦';
    }
    
    getRarityEmoji(rarity) {
        const emojiMap = {
            common: emojis.rarity?.common || '⚪',
            uncommon: emojis.rarity?.uncommon || '🟢',
            rare: emojis.rarity?.rare || '🔵',
            epic: emojis.rarity?.epic || '🟣',
            legendary: emojis.rarity?.legendary || '🟡'
        };
        return emojiMap[rarity] || emojis.collectibles?.whiteCircle || '⚪';
    }
}
