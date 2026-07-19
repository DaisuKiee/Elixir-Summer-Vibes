import Command from "../../structures/Command.js";
import { AttachmentBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { join } from 'path';
import { existsSync } from 'fs';
import { emojis } from '../../config/emojis.js';

export default class Help extends Command {
    constructor(client) {
        super(client, {
            name: 'help',
            description: {
                content: 'Display all commands available to you.',
                usage: '[command]',
                examples: ['help', 'help fish'],
            },
            aliases: ['h', 'commands', 'cmds'],
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
        // Show typing indicator immediately for better UX
        if (ctx.channel && ctx.channel.sendTyping) {
            await ctx.channel.sendTyping().catch(() => {});
        }
        
        if (args[0]) {
            return this.showCommandDetails(ctx, args[0]);
        }
        
        return this.showMainHelp(ctx);
    }
    
    async showMainHelp(ctx) {
        const categories = {};
        const categoryEmojis = {
            'summer': emojis.summer.beach,
            'info': emojis.commands.info,
            'config': emojis.commands.settings,
            'dev': emojis.commands.dev,
            'moderation': emojis.commands.admin,
            'fun': emojis.general.party,
            'music': emojis.general.sparkles,
            'utility': emojis.commands.help
        };
        
        this.client.commands.forEach(cmd => {
            // Skip dev category commands
            if (cmd.category === 'dev') return;
            
            if (!categories[cmd.category]) categories[cmd.category] = [];
            categories[cmd.category].push(cmd.name);
        });
        
        // Parse color properly - ensure it's a valid hex color string
        const defaultColor = this.client.color?.default || '#5865F2';
        const colorInt = parseInt(defaultColor.replace('#', ''), 16);
        
        const container = this.client.container()
            .setAccentColor(colorInt);
        
        // Add header with title, username, and close button using Section
        container.addSectionComponents((section) => 
            section
                .addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        '❗ **Help**\n' +
                        '-# @' + ctx.author.username
                    )
                )
                .setButtonAccessory((button) =>
                    button
                        .setCustomId('help_close')
                        .setLabel('✕')
                        .setStyle(ButtonStyle.Danger)
                )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Add overview image using Container Components v2
        const files = [];
        const overviewPath = join(process.cwd(), 'images', 'overview.png');
        if (existsSync(overviewPath)) {
            const overviewImage = new AttachmentBuilder(overviewPath, { name: 'overview.png' });
            files.push(overviewImage);
            
            // Add image display inside container using MediaGallery
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL('attachment://overview.png')
                )
            );
            
       
        }
        
        // Link buttons - First row (3 buttons)
        container.addActionRowComponents((row) => {
            return row.addComponents(
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/Fn8juAT5gR'),
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.com/oauth2/authorize?client_id=732916004656513077')
            );
        });
        
        // Link buttons - Second row (2 buttons)
        container.addActionRowComponents((row) => {
            return row.addComponents(
                new ButtonBuilder()
                    .setLabel('Vote (top.gg)')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://top.gg/bot/732916004656513077/vote')
            );
        });
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Browse Categories header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(emojis.general.sparkles + ' **Browse Categories**')
        );
        
        // Add dropdown menu INSIDE the container using addSelectMenuComponents
        const selectMenuOptions = [];
        for (const [category, commands] of Object.entries(categories)) {
            const emoji = categoryEmojis[category.toLowerCase()] || emojis.commands.help;
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            // Parse emoji for select menu
            let emojiObj;
            if (typeof emoji === 'string' && emoji.startsWith('<:')) {
                const match = emoji.match(/<:(\w+):(\d+)>/);
                if (match) {
                    emojiObj = { name: match[1], id: match[2] };
                } else {
                    emojiObj = { name: emoji };
                }
            } else {
                emojiObj = { name: emoji };
            }
            
            selectMenuOptions.push({
                label: `${categoryName}`,
                description: `${commands.length} command(s) available`,
                value: category,
                emoji: emojiObj
            });
        }
        
        // Add select menu inside container using ActionRow
        container.addActionRowComponents((row) => {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_category_select')
                .setPlaceholder('Select Command Category')
                .setMinValues(1)
                .setMaxValues(1)
                .setOptions(selectMenuOptions);
            
            return row.addComponents(selectMenu);
        });
        
        const reply = await ctx.sendMessage({ 
            components: [container],
            files: files
        });
        
        // Create interaction collector - only the command user can interact
        const collector = reply.createMessageComponentCollector({
            filter: (i) => {
                if (i.user.id !== ctx.author.id) {
                    i.reply({ 
                        content: emojis.general.error + ' Only the command user can interact with this menu!', 
                        ephemeral: true 
                    }).catch(() => {});
                    return false;
                }
                return true;
            },
            time: 300000 // 5 minutes
        });
        
        collector.on('collect', async (interaction) => {
            try {
                // Defer the update first to acknowledge the interaction
                await interaction.deferUpdate();
                
                if (interaction.customId === 'help_category_select') {
                    const category = interaction.values[0];
                    await this.showCategoryCommands(interaction, category, categories, 0);
                } else if (interaction.customId === 'help_close') {
                    // Close/delete the help message
                    await interaction.message.delete().catch(() => {});
                } else if (interaction.customId === 'help_back') {
                    // Go back to main help menu
                    await this.updateToMainHelp(interaction, categories);
                } else if (interaction.customId.startsWith('help_back_to_')) {
                    // Go back to specific category
                    const category = interaction.customId.replace('help_back_to_', '');
                    await this.showCategoryCommands(interaction, category, categories, 0);
                } else if (interaction.customId.startsWith('cmd_info_')) {
                    // Show command details
                    const cmdName = interaction.customId.replace('cmd_info_', '');
                    await this.showCommandDetailsInteraction(interaction, cmdName, categories);
                } else if (interaction.customId.startsWith('help_page_')) {
                    // Handle pagination
                    const parts = interaction.customId.split('_');
                    const category = parts[2];
                    const page = parseInt(parts[3]);
                    await this.showCategoryCommands(interaction, category, categories, page);
                }
            } catch (error) {
                console.error('Error handling help interaction:', error);
            }
        });
        
        collector.on('end', () => {
            // Disable components after timeout
            reply.edit({ components: [] }).catch(() => {});
        });
        
        return reply;
    }
    
    async showCategoryCommands(interaction, category, categories, page = 0) {
        const commands = categories[category];
        
        if (!commands || commands.length === 0) {
            return interaction.reply({
                content: emojis.general.error + ' No commands found in this category.',
                ephemeral: true
            });
        }
        
        const categoryEmojis = {
            'summer': emojis.summer.beach,
            'info': emojis.commands.info,
            'config': emojis.commands.settings,
            'dev': emojis.commands.dev,
            'moderation': emojis.commands.admin,
            'fun': emojis.general.party,
            'music': emojis.general.sparkles,
            'utility': emojis.commands.help
        };
        
        const emoji = categoryEmojis[category.toLowerCase()] || emojis.commands.help;
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        
        // Pagination: 5 commands per page (each command is 1 Section component)
        // This keeps us well under the 40 component limit
        const commandsPerPage = 5;
        const totalPages = Math.ceil(commands.length / commandsPerPage);
        const currentPage = Math.max(0, Math.min(page, totalPages - 1));
        
        const startIdx = currentPage * commandsPerPage;
        const endIdx = Math.min(startIdx + commandsPerPage, commands.length);
        const pageCommands = commands.slice(startIdx, endIdx);
        
        // Parse default color properly
        const defaultColor = this.client.color?.default || '#5865F2';
        const colorInt = parseInt(defaultColor.replace('#', ''), 16);
        
        const container = this.client.container()
            .setAccentColor(colorInt);
        
        // Header with back button
        const emojiDisplay = typeof emoji === 'string' && !emoji.startsWith('<:') ? emoji : 
                            (typeof emoji === 'string' ? emoji : emojis.commands.help);
        
        container.addSectionComponents((section) =>
            section
                .addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        '❗ **Help**\n' +
                        '-# @' + interaction.user.username + ' | ' + categoryName +
                        (totalPages > 1 ? ' (Page ' + (currentPage + 1) + '/' + totalPages + ')' : '')
                    )
                )
                .setButtonAccessory((button) =>
                    button
                        .setCustomId('help_back')
                        .setLabel('↺')
                        .setStyle(ButtonStyle.Secondary)
                )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Add each command as a Section with info button
        pageCommands.forEach((cmdName) => {
            const cmd = this.client.commands.get(cmdName);
            if (cmd) {
                const desc = cmd.description?.content || 'No description';
                const shortDesc = desc.length > 80 ? desc.substring(0, 77) + '...' : desc;
                
                container.addSectionComponents((section) =>
                    section
                        .addTextDisplayComponents(
                            (textDisplay) => textDisplay.setContent(
                                '> **' + this.client.config.prefix + cmdName + '**\n' +
                                '> ' + shortDesc
                            )
                        )
                        .setButtonAccessory((button) =>
                            button
                                .setCustomId('cmd_info_' + cmdName)
                                .setLabel('›')
                                .setStyle(ButtonStyle.Secondary)
                        )
                );
            }
        });
        
        // Add pagination buttons if more than one page
        if (totalPages > 1) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            container.addActionRowComponents((row) => {
                const buttons = [];
                
                // Previous button
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId('help_page_' + category + '_' + (currentPage - 1))
                        .setLabel('◀ Previous')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 0)
                );
                
                // Page indicator
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId('help_page_indicator')
                        .setLabel('Page ' + (currentPage + 1) + '/' + totalPages)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );
                
                // Next button
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId('help_page_' + category + '_' + (currentPage + 1))
                        .setLabel('Next ▶')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage >= totalPages - 1)
                );
                
                return row.addComponents(...buttons);
            });
        }
        
        // Add category dropdown at the bottom
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Rebuild select menu options
        const selectMenuOptions = [];
        for (const [cat, commands] of Object.entries(categories)) {
            const catEmoji = categoryEmojis[cat.toLowerCase()] || emojis.commands.help;
            const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
            
            let emojiObj;
            if (typeof catEmoji === 'string' && catEmoji.startsWith('<:')) {
                const match = catEmoji.match(/<:(\w+):(\d+)>/);
                if (match) {
                    emojiObj = { name: match[1], id: match[2] };
                } else {
                    emojiObj = { name: catEmoji };
                }
            } else {
                emojiObj = { name: catEmoji };
            }
            
            selectMenuOptions.push({
                label: `${catName}`,
                description: `${commands.length} command(s) available`,
                value: cat,
                emoji: emojiObj
            });
        }
        
        container.addActionRowComponents((row) => {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_category_select')
                .setPlaceholder('Select Command Category')
                .setMinValues(1)
                .setMaxValues(1)
                .setOptions(selectMenuOptions);
            
            return row.addComponents(selectMenu);
        });
        
        await interaction.editReply({ components: [container] });
    }
    
    async updateToMainHelp(interaction, categories) {
        // Rebuild the main help menu (without files since it's an update)
        const categoryEmojis = {
            'summer': emojis.summer.beach,
            'info': emojis.commands.info,
            'config': emojis.commands.settings,
            'dev': emojis.commands.dev,
            'moderation': emojis.commands.admin,
            'fun': emojis.general.party,
            'music': emojis.general.sparkles,
            'utility': emojis.commands.help
        };
        
        const defaultColor = this.client.color?.default || '#5865F2';
        const colorInt = parseInt(defaultColor.replace('#', ''), 16);
        
        const container = this.client.container()
            .setAccentColor(colorInt);
        
        // Header with close button
        container.addSectionComponents((section) => 
            section
                .addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        '❗ **Help**\n' +
                        '-# @' + interaction.user.username
                    )
                )
                .setButtonAccessory((button) =>
                    button
                        .setCustomId('help_close')
                        .setLabel('✕')
                        .setStyle(ButtonStyle.Danger)
                )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));

        // Add overview image using Container Components v2
        const files = [];
        const overviewPath = join(process.cwd(), 'images', 'overview.png');
        if (existsSync(overviewPath)) {
            const overviewImage = new AttachmentBuilder(overviewPath, { name: 'overview.png' });
            files.push(overviewImage);
            
            // Add image display inside container using MediaGallery
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL('attachment://overview.png')
                )
            );
            
       
        }
        
        // Link buttons remain the same...
        container.addActionRowComponents((row) => {
            return row.addComponents(
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/Fn8juAT5gR'),
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.com/oauth2/authorize?client_id=732916004656513077')
            );
        });
        
        container.addActionRowComponents((row) => {
            return row.addComponents(
                
                new ButtonBuilder()
                    .setLabel('Vote (top.gg)')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://top.gg/bot/732916004656513077/vote')
            );
        });
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(emojis.general.sparkles + ' **Browse Categories**')
        );
        
        // Rebuild select menu options
        const selectMenuOptions = [];
        for (const [category, commands] of Object.entries(categories)) {
            const emoji = categoryEmojis[category.toLowerCase()] || emojis.commands.help;
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            let emojiObj;
            if (typeof emoji === 'string' && emoji.startsWith('<:')) {
                const match = emoji.match(/<:(\w+):(\d+)>/);
                if (match) {
                    emojiObj = { name: match[1], id: match[2] };
                } else {
                    emojiObj = { name: emoji };
                }
            } else {
                emojiObj = { name: emoji };
            }
            
            selectMenuOptions.push({
                label: `${categoryName}`,
                description: `${commands.length} command(s) available`,
                value: category,
                emoji: emojiObj
            });
        }
        
        container.addActionRowComponents((row) => {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_category_select')
                .setPlaceholder('Select Command Category')
                .setMinValues(1)
                .setMaxValues(1)
                .setOptions(selectMenuOptions);
            
            return row.addComponents(selectMenu);
        });
        
        await interaction.editReply({ components: [container] });
    }
    
    async showCommandDetailsInteraction(interaction, commandName, categories) {
        const command = this.client.commands.get(commandName.toLowerCase()) || 
                       this.client.commands.get(this.client.aliases.get(commandName.toLowerCase()));
        
        if (!command) {
            return interaction.reply({
                content: emojis.general.error + ' Command not found.',
                ephemeral: true
            });
        }
        
        const defaultColor = this.client.color?.default || '#5865F2';
        const colorInt = parseInt(defaultColor.replace('#', ''), 16);
        
        const container = this.client.container()
            .setAccentColor(colorInt);
        
        // Header with back button (goes back to category)
        container.addSectionComponents((section) =>
            section
                .addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        '> # ❗ **Help**\n' +
                        '> @' + interaction.user.username + ' | ' + command.category.charAt(0).toUpperCase() + command.category.slice(1) + ' » ' + command.name.charAt(0).toUpperCase() + command.name.slice(1)
                    )
                )
                .setButtonAccessory((button) =>
                    button
                        .setCustomId('help_back_to_' + command.category)
                        .setLabel('↺')
                        .setStyle(ButtonStyle.Secondary)
                )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Command description
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                '> ' + (command.description.content || 'No description available.')
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Usage section
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                '> **Usage**\n' +
                '> • `' + this.client.config.prefix + command.name + ' ' + (command.description.usage || '') + '`'
            )
        );
        
        // Examples section if available
        if (command.description.examples && command.description.examples.length) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const examplesText = '> **Examples**\n' + 
                command.description.examples.map((ex) => '> • `' + this.client.config.prefix + ex + '`').join('\n');
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(examplesText));
        }
        
        await interaction.editReply({ components: [container] });
    }
    
    async showCommandDetails(ctx, commandName) {
        const command = this.client.commands.get(commandName.toLowerCase()) || 
                       this.client.commands.get(this.client.aliases.get(commandName.toLowerCase()));
        
        if (!command) {
            // Parse error color properly
            const errorColor = this.client.color?.error || '#E74C3C';
            const errorColorInt = parseInt(errorColor.replace('#', ''), 16);
            
            const container = this.client.container()
                .setAccentColor(errorColorInt);
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    '> ## ' + emojis.general.error + ' **Command Not Found**\n' +
                    '> _Command_ `' + commandName + '` _does not exist._'
                )
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    '_' + emojis.energy.lightbulb + ' Tip: Use_ `' + this.client.config.prefix + 'help` _to see all available commands._'
                )
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Parse default color properly
        const defaultColor = this.client.color?.default || '#5865F2';
        const colorInt = parseInt(defaultColor.replace('#', ''), 16);
        
        const container = this.client.container()
            .setAccentColor(colorInt);
        
        // Command header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                '> ## ' + emojis.commands.help + ' **Command Information**\n' +
                '> ### `' + command.name.toUpperCase() + '`'
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Description
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                '> ' + emojis.commands.info + ' **Description:**\n' +
                '> _' + (command.description.content || 'No description available.') + '_'
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Usage details
        const detailsText = '> ' + emojis.commands.help + ' **Usage:**\n' +
            '> `' + this.client.config.prefix + command.name + ' ' + (command.description.usage || '') + '`\n\n' +
            '> ' + emojis.general.star + ' **Aliases:**\n' +
            '> ' + (command.aliases.length ? command.aliases.map(a => '`' + a + '`').join(' ' + emojis.ui.bullet + ' ') : '_None_') + '\n\n' +
            '> ' + emojis.activities.fishing + ' **Category:**\n' +
            '> `' + (command.category ? command.category.charAt(0).toUpperCase() + command.category.slice(1) : 'None') + '`\n\n' +
            '> ' + emojis.time.clock + ' **Cooldown:**\n' +
            '> `' + (command.cooldown || 3) + ' seconds`';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(detailsText));
            
        // Examples section if available
        if (command.description.examples && command.description.examples.length) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            const examplesText = '> ' + emojis.energy.lightbulb + ' **Examples:**\n' + 
                command.description.examples.map((ex, i) => '> `' + (i + 1) + '.` `' + this.client.config.prefix + ex + '`').join('\n');
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(examplesText));
        }
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_' + emojis.general.sparkles + ' Requested by_ **' + ctx.author.tag + '**')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
