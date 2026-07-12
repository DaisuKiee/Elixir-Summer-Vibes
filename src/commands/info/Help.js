import Command from "../../structures/Command.js";
import { StringSelectMenuBuilder, ActionRowBuilder } from "discord.js";

export default class Help extends Command {
    constructor(client) {
        super(client, {
            name: 'help',
            description: {
                content: 'Display all commands available to you.',
                usage: '[command]',
                examples: ['help', 'help ping'],
            },
            aliases: ['h', 'commands'],
            category: 'info',
            cooldown: 3,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "command",
                    description: "Get info on a specific command",
                    type: 3,
                    required: false,
                },
            ]
        });
    }

    async run(ctx, args) {
        if (args[0]) {
            const command = this.client.commands.get(args[0].toLowerCase()) || 
                           this.client.commands.get(this.client.aliases.get(args[0].toLowerCase()));
            
            if (!command) {
                const container = this.client.container()
                    .setAccentColor(parseInt(this.client.color.error.replace('#', ''), 16));
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('> ### **❌ Command Not Found**\n> _Command_ `' + args[0] + '` _does not exist._')
                );
                
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent('_💡 Tip: Use_ `' + this.client.config.prefix + 'help` _to see all available commands._')
                );
                
                return ctx.sendMessage({ components: [container] });
            }
            
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
            
            // Command header with attractive formatting
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ## **📖 Command Information**\n> ### `' + command.name.toUpperCase() + '`')
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            // Description
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **📄 Description:**\n> _' + (command.description.content || 'No description available.') + '_')
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(false));
            
            // Usage details with attractive formatting
            const detailsText = '> **📝 Usage:**\n' +
                '> `' + this.client.config.prefix + command.name + ' ' + (command.description.usage || '') + '`\n\n' +
                '> **🏷️ Aliases:**\n' +
                '> ' + (command.aliases.length ? command.aliases.map(a => '`' + a + '`').join(' **•** ') : '_None_') + '\n\n' +
                '> **📂 Category:**\n' +
                '> `' + (command.category ? command.category.charAt(0).toUpperCase() + command.category.slice(1) : 'None') + '`\n\n' +
                '> **⏱️ Cooldown:**\n' +
                '> `' + (command.cooldown || 3) + ' seconds`';
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(detailsText));
                
            // Examples section if available
            if (command.description.examples && command.description.examples.length) {
                container.addSeparatorComponents((separator) => separator.setDivider(true));
                
                const examplesText = '> **💡 Examples:**\n' + 
                    command.description.examples.map((ex, i) => '> `' + (i + 1) + '.` `' + this.client.config.prefix + ex + '`').join('\n');
                
                container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(examplesText));
            }
            
            // Footer tip
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('_✨ Requested by_ **' + ctx.author.tag + '** _✨_')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Main help menu
        const categories = {};
        const categoryEmojis = {
            'info': '📊',
            'config': '⚙️',
            'dev': '🔧',
            'moderation': '🛡️',
            'fun': '🎮',
            'music': '🎵',
            'utility': '🔨'
        };
        
        this.client.commands.forEach(cmd => {
            // Skip dev category commands
            if (cmd.category === 'dev') return;
            
            if (!categories[cmd.category]) categories[cmd.category] = [];
            categories[cmd.category].push(cmd.name);
        });
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Attractive header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **📚 ' + this.client.user.username + ' Help Menu**\n> _Your complete command reference guide_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Usage instruction
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> **💬 How to use:**\n' +
                '> **•** Type `' + this.client.config.prefix + 'help [command]` _for detailed info_\n' +
                '> **•** _Example:_ `' + this.client.config.prefix + 'help ping`\n' +
                '> **•** _Or use the dropdown menu below to browse categories_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Categories with enhanced formatting
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ### **📂 Command Categories**')
        );
        
        for (const [category, commands] of Object.entries(categories)) {
            const emoji = categoryEmojis[category.toLowerCase()] || '📌';
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            const categoryText = '> **' + emoji + ' ' + categoryName + '** _[' + commands.length + ']_\n' +
                '> ' + commands.map(c => '`' + c + '`').join(' **•** ');
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(categoryText)
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(false));
        }
        
        // Stats footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> **📊 Statistics**\n' +
                '> _Total Commands:_ `' + this.client.commands.size + '` **•** _Prefix:_ `' + this.client.config.prefix + '`')
        );
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_✨ Requested by_ **' + ctx.author.tag + '** _✨_')
        );
        
        // Create dropdown menu for category selection
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('📂 Select a category to view commands')
            .setMinValues(1)
            .setMaxValues(1);
        
        // Add options for each category
        for (const [category, commands] of Object.entries(categories)) {
            const emoji = categoryEmojis[category.toLowerCase()] || '📌';
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            selectMenu.addOptions({
                label: `${categoryName} Commands`,
                description: `View ${commands.length} command(s) in ${categoryName}`,
                value: category,
                emoji: emoji,
            });
        }
        
        // Add "View All" option
        selectMenu.addOptions({
            label: 'View All Commands',
            description: `See all ${this.client.commands.size} commands at once`,
            value: 'all',
            emoji: '📚',
        });
        
        const actionRow = new ActionRowBuilder().addComponents(selectMenu);
        
        return ctx.sendMessage({ 
            components: [container, actionRow]
        });
    }
}
