import Command from '../../structures/Command.js';

export default class Blacklist extends Command {
    constructor(client) {
        super(client, {
            name: 'blacklist',
            description: {
                content: 'Add or remove users from bot blacklist',
                usage: '<add|remove|list> [user id]',
                examples: ['blacklist list', 'blacklist add 123456789', 'blacklist remove 123456789'],
            },
            aliases: ['bl'],
            category: 'dev',
            cooldown: 3,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: false,
        });
    }
    
    async run(ctx, args) {
        // Initialize blacklist if it doesn't exist
        if (!this.client.blacklist) {
            this.client.blacklist = new Set();
        }
        
        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **❌ Invalid Action**\n> Use: `add`, `remove`, or `list`')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        if (action === 'list') {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
            
            if (this.client.blacklist.size === 0) {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> ## **📋 Blacklist**\n> _No users in blacklist_')
                );
            } else {
                const blacklistedUsers = Array.from(this.client.blacklist).map((id, i) => '`' + (i + 1) + '.` <@' + id + '>').join('\n');
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> ## **📋 Blacklist**\n> **Total:** `' + this.client.blacklist.size + '`')
                );
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(blacklistedUsers)
                );
            }
            
            return ctx.sendMessage({ components: [container] });
        }
        
        const userId = args[1];
        
        if (!userId || !/^\d{17,19}$/.test(userId)) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **❌ Invalid User ID**\n> Provide a valid Discord user ID')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        if (action === 'add') {
            if (this.client.blacklist.has(userId)) {
                const container = this.client.container()
                    .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> **⚠️ Already Blacklisted**\n> User `' + userId + '` is already in blacklist')
                );
                
                return ctx.sendMessage({ components: [container] });
            }
            
            this.client.blacklist.add(userId);
            
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **✅ User Blacklisted**\n> <@' + userId + '> has been added to blacklist\n> _They can no longer use bot commands_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        if (action === 'remove') {
            if (!this.client.blacklist.has(userId)) {
                const container = this.client.container()
                    .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> **⚠️ Not Blacklisted**\n> User `' + userId + '` is not in blacklist')
                );
                
                return ctx.sendMessage({ components: [container] });
            }
            
            this.client.blacklist.delete(userId);
            
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **✅ User Removed**\n> <@' + userId + '> has been removed from blacklist\n> _They can now use bot commands_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
    }
}
