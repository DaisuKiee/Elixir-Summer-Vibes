import Command from "../../structures/Command.js";

export default class Dev extends Command {
    constructor(client) {
        super(client, {
            name: 'dev',
            description: {
                content: 'Display all developer commands.',
                usage: '',
                examples: ['dev'],
            },
            aliases: ['developer', 'devhelp'],
            category: 'dev',
            cooldown: 3,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
        });
    }

    async run(ctx, args) {
        const devCommands = [];
        
        this.client.commands.forEach(cmd => {
            if (cmd.category === 'dev') {
                devCommands.push(cmd);
            }
        });
        
        if (devCommands.length === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ### **❌ No Developer Commands Found**')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **🔧 Developer Commands**\n> _' + devCommands.length + ' command(s) available for developers_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Warning notice
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> **⚠️ Warning:**\n> _These commands are restricted to bot developers only._\n> _Use with caution as they can affect bot operations._')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // List each dev command with details
        devCommands.forEach((cmd, index) => {
            const cmdText = '> **`' + (index + 1) + '.` `' + cmd.name + '`**\n' +
                '> _' + (cmd.description.content || 'No description') + '_\n' +
                '> **•** Usage: `' + this.client.config.prefix + cmd.name + ' ' + (cmd.description.usage || '') + '`\n' +
                '> **•** Aliases: ' + (cmd.aliases.length ? cmd.aliases.map(a => '`' + a + '`').join(', ') : '_None_');
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(cmdText));
            
            if (index < devCommands.length - 1) {
                container.addSeparatorComponents((separator) => separator.setDivider(false));
            }
        });
        
        // Footer tip
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_💡 Tip: Use_ `' + this.client.config.prefix + 'help <command>` _for detailed info_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_✨ Requested by_ **' + ctx.author.tag + '** _✨_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
