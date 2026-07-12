import Command from '../../structures/Command.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default class Exec extends Command {
    constructor(client) {
        super(client, {
            name: 'exec',
            description: {
                content: 'Execute shell commands',
                usage: '<command>',
                examples: ['exec npm --version', 'exec git status'],
            },
            aliases: ['execute', 'shell'],
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
        const command = args.join(' ');
        
        if (!command) {
            return ctx.sendMessage({ content: 'Please provide a command to execute!' });
        }
        
        const msg = await ctx.sendMessage({ content: '⏳ Executing command...' });
        
        try {
            const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
            
            let output = '';
            if (stdout) output += '**Stdout:**\n```\n' + stdout.substring(0, 1800) + '\n```\n';
            if (stderr) output += '**Stderr:**\n```\n' + stderr.substring(0, 1800) + '\n```';
            
            if (!output) output = '```\nCommand executed successfully with no output.\n```';
            
            if (output.length > 1990) {
                output = output.substring(0, 1990) + '...';
            }
            
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ## **✅ Exec Success**\n> **Command:** `' + command + '`')
            );
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(output)
            );
            
            return await ctx.editMessage({ content: '', components: [container] });
            
        } catch (error) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ## **❌ Exec Error**\n> **Command:** `' + command + '`')
            );
            
            const errorMsg = '```\n' + (error.message || error.toString()).substring(0, 1900) + '\n```';
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(errorMsg)
            );
            
            return await ctx.editMessage({ content: '', components: [container] });
        }
    }
}
