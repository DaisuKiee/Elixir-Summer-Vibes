import Command from '../../structures/Command.js';

export default class Emit extends Command {
    constructor(client) {
        super(client, {
            name: 'emit',
            description: {
                content: 'Emit a Discord event for testing',
                usage: '<event>',
                examples: ['emit guildMemberAdd', 'emit ready'],
            },
            aliases: ['trigger'],
            category: 'dev',
            cooldown: 3,
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: false,
        });
    }
    
    async run(ctx, args) {
        const event = args[0]?.toLowerCase();
        
        const validEvents = ['ready', 'guildMemberAdd', 'guildMemberRemove', 'messageCreate'];
        
        if (!validEvents.includes(event)) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **❌ Invalid Event**\n> Valid events: `' + validEvents.join('`, `') + '`')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        try {
            switch(event) {
                case 'ready':
                    this.client.emit('ready');
                    break;
                    
                case 'guildMemberAdd':
                    this.client.emit('guildMemberAdd', ctx.member);
                    break;
                    
                case 'guildMemberRemove':
                    this.client.emit('guildMemberRemove', ctx.member);
                    break;
                    
                case 'messageCreate':
                    this.client.emit('messageCreate', ctx.message);
                    break;
            }
            
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **✅ Event Emitted**\n> Successfully emitted `' + event + '` event')
            );
            
            return ctx.sendMessage({ components: [container] });
            
        } catch (error) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **❌ Emit Error**\n> ```\n' + error.message + '\n```')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
    }
}
