import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getCosmeticsByCategory, rarityEmojis } from '../../data/cosmetics.js';
import { emojis } from '../../config/emojis.js';

export default class Inventory extends Command {
    constructor(client) {
        super(client, {
            name: 'inventory',
            description: {
                content: 'View your cosmetic inventory and equipped items',
                usage: '[category]',
                examples: ['inventory', 'inventory backgrounds', 'inventory pets'],
            },
            aliases: ['inv', 'cosmetics', 'items'],
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
                    description: 'View specific cosmetic category',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Backgrounds', value: 'backgrounds' },
                        { name: 'Frames', value: 'frames' },
                        { name: 'Badges', value: 'badges' },
                        { name: 'Pets', value: 'pets' },
                        { name: 'Titles', value: 'titles' },
                        { name: 'Banners', value: 'banners' },
                        { name: 'Emotes', value: 'emotes' }
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
        
        // Initialize cosmetics if needed
        if (!profile.ownedCosmetics) profile.ownedCosmetics = [];
        if (!profile.equippedCosmetics) profile.equippedCosmetics = {};
        
        // Check for category filter
        const category = ctx.isInteraction && ctx.interaction.options.getString('category')
            ? ctx.interaction.options.getString('category')
            : (args[0]?.toLowerCase() || null);
        
        if (category) {
            return this.showCategory(ctx, profile, category);
        }
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **🎒 Cosmetic Inventory**\n> **' + ctx.author.username + '**')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Currently equipped
        const equipped = profile.equippedCosmetics || {};
        let equippedText = '> **✨ Currently Equipped**\n';
        
        if (equipped.background) equippedText += '> **•** Background: `' + this.getCosmeticName(profile, equipped.background) + '`\n';
        if (equipped.frame) equippedText += '> **•** Frame: `' + this.getCosmeticName(profile, equipped.frame) + '`\n';
        if (equipped.badge) equippedText += '> **•** Badge: `' + this.getCosmeticName(profile, equipped.badge) + '`\n';
        if (equipped.pet) equippedText += '> **•** Pet: `' + this.getCosmeticName(profile, equipped.pet) + '`\n';
        if (equipped.title) equippedText += '> **•** Title: `' + this.getCosmeticName(profile, equipped.title) + '`\n';
        
        if (!equipped.background && !equipped.frame && !equipped.badge && !equipped.pet && !equipped.title) {
            equippedText += '> _No cosmetics equipped_';
        }
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(equippedText));
        
        // Inventory stats by category
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const categories = ['backgrounds', 'frames', 'badges', 'pets', 'titles', 'banners', 'emotes'];
        let statsText = '> **📊 Collection Progress**\n';
        
        categories.forEach(cat => {
            const owned = profile.ownedCosmetics.filter(c => c.type === cat).length;
            const total = getCosmeticsByCategory(cat).length;
            const percent = total > 0 ? Math.floor((owned / total) * 100) : 0;
            
            const catName = cat.charAt(0).toUpperCase() + cat.slice(0, -1);
            statsText += '> **•** ' + catName + ': `' + owned + '/' + total + '` (' + percent + '%)\n';
        });
        
        statsText += '>\n> **Total:** `' + profile.ownedCosmetics.length + '` items';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(statsText));
        
        // Recent unlocks
        if (profile.ownedCosmetics.length > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const recent = profile.ownedCosmetics
                .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
                .slice(0, 5);
            
            let recentText = '> **🕒 Recently Unlocked**\n';
            recent.forEach(item => {
                recentText += '> ' + rarityEmojis[item.rarity] + ' `' + item.name + '`\n';
            });
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(recentText));
        }
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_💡 Use `++inventory [category]` to view specific items! Unlock cosmetics by progressing the battle pass._')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async showCategory(ctx, profile, category) {
        const categoryItems = getCosmeticsByCategory(category);
        
        if (!categoryItems || categoryItems.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **❌ Invalid Category**\n> _Choose: backgrounds, frames, badges, pets, titles, banners, emotes_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        const catName = category.charAt(0).toUpperCase() + category.slice(0, -1);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **🎒 ' + catName + ' Collection**\n> **' + ctx.author.username + '**')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // List all items in category
        const owned = profile.ownedCosmetics.filter(c => c.type === category).map(c => c.id);
        const equipped = profile.equippedCosmetics[category.slice(0, -1)] || null;
        
        let itemsText = '';
        categoryItems.forEach((item, i) => {
            const hasItem = owned.includes(item.id);
            const isEquipped = equipped === item.id;
            const status = isEquipped ? emojis.ui.check : (hasItem ? emojis.ui.checkBox : emojis.general.locked);
            
            itemsText += `> ${status} ${rarityEmojis[item.rarity]} **${item.name}**`;
            if (!hasItem) {
                itemsText += ` _- Unlock at Tier ${item.unlockTier}_`;
            } else if (isEquipped) {
                itemsText += ' **EQUIPPED**';
            }
            itemsText += '\n';
            
            // Add separator every 8 items
            if ((i + 1) % 8 === 0 && i < categoryItems.length - 1) {
                container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(itemsText));
                itemsText = '';
            }
        });
        
        if (itemsText) {
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(itemsText));
        }
        
        // Progress
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        const percent = Math.floor((owned.length / categoryItems.length) * 100);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> **Progress:** `' + owned.length + '/' + categoryItems.length + '` (' + percent + '%)')
        );
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_💡 Equip items with `++equip [item name]` • View all categories with `++inventory`_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    getCosmeticName(profile, id) {
        const cosmetic = profile.ownedCosmetics.find(c => c.id === id);
        return cosmetic ? cosmetic.name : 'Unknown';
    }
}
