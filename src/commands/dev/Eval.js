import Command from '../../structures/Command.js';
import { inspect } from 'util';

export default class Eval extends Command {
    constructor(client) {
        super(client, {
            name: 'eval',
            description: {
                content: 'Evaluates JavaScript code',
                usage: '<code>',
                examples: ['client.commands.size', 'client.guilds.cache.size'],
            },
            aliases: ['e'],
            category: 'dev',
            cooldown: 3,
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
        });
    }
    async run(ctx, args) {
        const code = args.join(' ');
        if (!code) {
            return ctx.sendMessage({ content: 'Please provide code to evaluate!' });
        }
        try {
            let evaled = await eval(code);
            if (typeof evaled !== 'string') {
                evaled = inspect(evaled, { depth: 0 });
            }
            
            // Censor sensitive information
            if (evaled.includes(this.client.token)) {
                evaled = evaled.replace(new RegExp(this.client.token, 'g'), '[TOKEN CENSORED]');
            }
            if (this.client.config.mongourl && evaled.includes(this.client.config.mongourl)) {
                evaled = evaled.replace(new RegExp(this.client.config.mongourl, 'g'), '[MONGO_URL CENSORED]');
            }
            
            // Truncate if too long
            if (evaled.length > 1990) {
                evaled = evaled.substring(0, 1990) + '...';
            }
            
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('## ✅ Eval Success')
            );
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`\`\`\`js\n${evaled}\n\`\`\``)
            );
                
            return ctx.sendMessage({ components: [container] });
        } catch (e) {
            console.error(e);
            
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('## ❌ Eval Error')
            );
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(`\`\`\`js\n${e.message}\n\`\`\``)
            );
                
            return ctx.sendMessage({ components: [container] });
        }
    }
}