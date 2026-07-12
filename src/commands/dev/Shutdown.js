import Command from '../../structures/Command.js';

export default class Shutdown extends Command {
    constructor(client) {
        super(client, {
            name: 'shutdown',
            description: {
                content: 'Safely shutdown the bot',
                usage: '',
                examples: ['shutdown'],
            },
            aliases: ['stop', 'kill'],
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
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **🔴 Shutting Down**\n> _Bot is shutting down safely..._')
        );
        
        await ctx.sendMessage({ components: [container] });
        
        this.client.logger.warn('Bot is shutting down by ' + ctx.author.tag);
        
        // Destroy client and exit process
        await this.client.destroy();
        process.exit(0);
    }
}
