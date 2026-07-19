import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getCosmeticById, getAllCosmetics } from '../../data/cosmetics.js';
import { emojis } from '../../config/emojis.js';

export default class Equip extends Command {
    constructor(client) {
        super(client, {
            name: 'equip',
            description: {
                content: 'Equip or unequip cosmetic items to customize your profile',
                usage: '<item name | unequip> [category]',
                examples: ['equip Sunset Paradise', 'equip Turtle Companion', 'equip unequip pet'],
            },
            aliases: ['wear', 'use', 'unequip'],
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
                    description: 'Equip or unequip',
                    type: 3,
                    required: true,
                    choices: [
                        { name: 'Equip Item', value: 'equip' },
                        { name: 'Unequip Item', value: 'unequip' }
                    ]
                },
                {
                    name: 'item',
                    description: 'Item name or category to equip/unequip',
                    type: 3,
                    required: true
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
                (textDisplay) => textDisplay.setContent('> **' + emojis.general.error + ' No Profile Found**\n> _Use `++daily` to create your summer profile!_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Initialize if needed
        if (!profile.ownedCosmetics) profile.ownedCosmetics = [];
        if (!profile.equippedCosmetics) profile.equippedCosmetics = {};
        
        // Parse arguments
        let action, itemName;
        
        if (ctx.isInteraction) {
            action = ctx.interaction.options.getString('action');
            itemName = ctx.interaction.options.getString('item');
        } else {
            // Check if command alias is "unequip"
            if (ctx.commandName === 'unequip') {
                action = 'unequip';
                itemName = args.join(' ');
            } else {
                // Check if first arg is "unequip"
                if (args[0]?.toLowerCase() === 'unequip') {
                    action = 'unequip';
                    itemName = args.slice(1).join(' ');
                } else {
                    action = 'equip';
                    itemName = args.join(' ');
                }
            }
        }
        
        if (!itemName || itemName.trim() === '') {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **' + emojis.general.error + ' Missing Item Name**\n> _Usage: `++equip <item name>`_\n> _Or: `++unequip <category>`_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        if (action === 'unequip') {
            return this.unequipItem(ctx, profile, itemName);
        } else {
            return this.equipItem(ctx, profile, itemName);
        }
    }
    
    async equipItem(ctx, profile, itemName) {
        // Search for cosmetic by name (case insensitive, fuzzy)
        const searchName = itemName.toLowerCase();
        const allCosmetics = getAllCosmetics();
        
        // First try exact match
        let cosmetic = allCosmetics.find(c => c.name.toLowerCase() === searchName);
        
        // Then try partial match
        if (!cosmetic) {
            cosmetic = allCosmetics.find(c => c.name.toLowerCase().includes(searchName));
        }
        
        if (!cosmetic) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **' + emojis.general.error + ' Cosmetic Not Found**\n> _Could not find: "' + itemName + '"_\n\n> _Use `++inventory` to see your available cosmetics._')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Check if player owns this cosmetic
        const owned = profile.ownedCosmetics.find(c => c.id === cosmetic.id);
        
        if (!owned) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **' + emojis.general.locked + ' Cosmetic Locked**\n> You don\'t own **' + cosmetic.name + '**\n\n> _Unlock at Level ' + cosmetic.unlockTier + '_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Determine cosmetic slot (remove 's' from category)
        const slot = cosmetic.category.slice(0, -1);
        
        // Check if already equipped
        if (profile.equippedCosmetics[slot] === cosmetic.id) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **' + emojis.general.warning + ' Already Equipped**\n> **' + cosmetic.name + '** is already equipped!')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Equip the cosmetic
        profile.equippedCosmetics[slot] = cosmetic.id;
        await profile.save();
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **' + emojis.general.success + ' Cosmetic Equipped!**\n> **' + cosmetic.name + '**')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const slotName = slot.charAt(0).toUpperCase() + slot.slice(1);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> **Slot:** ' + slotName + '\n> **Rarity:** ' + cosmetic.rarity.charAt(0).toUpperCase() + cosmetic.rarity.slice(1) + '\n\n> _View your profile with `++profile` to see your new look!_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
    
    async unequipItem(ctx, profile, category) {
        // Normalize category name
        const categoryLower = category.toLowerCase();
        
        // Map common names to slots
        const slotMap = {
            'background': 'background',
            'backgrounds': 'background',
            'bg': 'background',
            'frame': 'frame',
            'frames': 'frame',
            'border': 'frame',
            'badge': 'badge',
            'badges': 'badge',
            'pet': 'pet',
            'pets': 'pet',
            'companion': 'pet',
            'title': 'title',
            'titles': 'title',
            'banner': 'banner',
            'banners': 'banner',
            'nameplate': 'nameplate',
            'nameplates': 'nameplate'
        };
        
        const slot = slotMap[categoryLower];
        
        if (!slot) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **' + emojis.general.error + ' Invalid Category**\n> _Valid categories: background, frame, badge, pet, title, banner, nameplate_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Check if anything is equipped in that slot
        if (!profile.equippedCosmetics[slot]) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
            
            const slotName = slot.charAt(0).toUpperCase() + slot.slice(1);
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **' + emojis.general.warning + ' Nothing Equipped**\n> No ' + slotName + ' is currently equipped.')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Get cosmetic name before unequipping
        const cosmeticId = profile.equippedCosmetics[slot];
        const cosmetic = profile.ownedCosmetics.find(c => c.id === cosmeticId);
        const cosmeticName = cosmetic ? cosmetic.name : 'Item';
        
        // Unequip
        profile.equippedCosmetics[slot] = null;
        await profile.save();
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
        
        const slotName = slot.charAt(0).toUpperCase() + slot.slice(1);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **' + emojis.general.success + ' Cosmetic Unequipped**\n> **' + cosmeticName + '** removed from ' + slotName + ' slot')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
