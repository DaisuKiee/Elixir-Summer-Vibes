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
            (textDisplay) => textDisplay.setContent('> ## **📖 Summer Collection Book**\n> **' + ctx.author.username + '**')
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
        
        const overviewText = '> **📊 Overall Progress**\n' +
            '> ' + progressBar + '\n' +
            '> **Collected:** `' + owned + '/' + totalCollectibles + '` (' + percent + '%)\n' +
            '> **Missing:** `' + (totalCollectibles - owned) + '` items';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(overviewText));
        
        // Category breakdown
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const categories = ['shells', 'crabs', 'drinks', 'items'];
        let categoryText = '> **📚 By Category**\n';
        
        categories.forEach(cat => {
            const catItems = collectiblesData[cat] || [];
            const catOwned = profile.collectibles.filter(c => c.category === cat).length;
            const catPercent = catItems.length > 0 ? Math.floor((catOwned / catItems.length) * 100) : 0;
            
            const emoji = this.getCategoryEmoji(cat);
            const name = cat.charAt(0).toUpperCase() + cat.slice(1);
            
            categoryText += '> ' + emoji + ' **' + name + ':** `' + catOwned + '/' + catItems.length + '` (' + catPercent + '%)\n';
        });
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(categoryText));
        
        // Rarity breakdown
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const rarities = ['common', 'rare', 'epic', 'legendary'];
        let rarityText = '> **✨ By Rarity**\n';
        
        rarities.forEach(rarity => {
            const allRarity = this.getAllCollectibles().filter(c => c.rarity === rarity).length;
            const ownedRarity = profile.collectibles.filter(c => c.rarity === rarity).length;
            const percent = allRarity > 0 ? Math.floor((ownedRarity / allRarity) * 100) : 0;
            
            const emoji = this.getRarityEmoji(rarity);
            const name = rarity.charAt(0).toUpperCase() + rarity.slice(1);
            
            rarityText += '> ' + emoji + ' **' + name + ':** `' + ownedRarity + '/' + allRarity + '` (' + percent + '%)\n';
        });
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(rarityText));
        
        // Recent finds
        if (profile.collectibles.length > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const recent = profile.collectibles
                .sort((a, b) => new Date(b.obtainedAt) - new Date(a.obtainedAt))
                .slice(0, 5);
            
            let recentText = '> **🕒 Recently Found**\n';
            recent.forEach(item => {
                const emoji = this.getRarityEmoji(item.rarity);
                recentText += '> ' + emoji + ' `' + item.name + '`\n';
            });
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(recentText));
        }
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_💡 Use `++collection [category]` to view specific collections! Categories: shells, crabs, drinks, items_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showFilteredCollection(ctx, profile, filter) {
        const filterLower = filter.toLowerCase();
        
        // Check if filter is a category or rarity
        const categories = ['shells', 'crabs', 'drinks', 'items'];
        const rarities = ['common', 'rare', 'epic', 'legendary'];
        
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
                (textDisplay) => textDisplay.setContent('> **❌ Invalid Filter**\n> _Valid filters: shells, crabs, drinks, items, common, rare, epic, legendary_')
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
            (textDisplay) => textDisplay.setContent('> ## **' + emoji + ' ' + title + ' Collection**\n> **' + ctx.author.username + '**')
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
        
        const progressText = '> ' + progressBar + '\n' +
            '> **Collected:** `' + owned + '/' + items.length + '` (' + percent + '%)';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(progressText));
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // List all items
        let itemsText = '';
        items.forEach((item, i) => {
            const hasItem = profile.collectibles.find(c => c.id === item.id);
            const status = hasItem ? '☑️' : '☐';
            const rarityEmoji = this.getRarityEmoji(item.rarity);
            
            itemsText += '> ' + status + ' ' + rarityEmoji + ' **' + item.name + '**';
            if (!hasItem) {
                itemsText += ' _- Not yet found_';
            }
            itemsText += '\n';
            
            // Add separator every 12 items
            if ((i + 1) % 12 === 0 && i < items.length - 1) {
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
            (textDisplay) => textDisplay.setContent('_💡 Find collectibles by fishing and exploring! Use `++collection` to view all categories._')
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
            shells: emojis.collectibles.shell,
            crabs: emojis.collectibles.crab,
            drinks: emojis.collectibles.cup,
            items: emojis.general.gift
        };
        return emojiMap[category] || emojis.collectibles.box;
    }
    
    getRarityEmoji(rarity) {
        const emojiMap = {
            common: emojis.collectibles.whiteCircle,
            rare: emojis.collectibles.blueCircle,
            epic: emojis.collectibles.purpleCircle,
            legendary: emojis.collectibles.yellowCircle
        };
        return emojiMap[rarity] || emojis.collectibles.whiteCircle;
    }
}
