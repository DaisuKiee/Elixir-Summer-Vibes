import Event from "../../structures/Event.js";
import Context from "../../structures/Context.js";
import { InteractionType, Collection, PermissionFlagsBits, CommandInteraction, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default class InteractionCreate extends Event {
    constructor(...args) {
        super(...args, {
            name: 'interactionCreate'
        });
    }
    /**
     * 
     * @param {CommandInteraction} interaction
     */
    async run(interaction) {
        // Handle String Select Menu interactions
        if (interaction.type === InteractionType.MessageComponent && interaction.isStringSelectMenu()) {
            if (interaction.customId === 'help_category_select') {
                await interaction.deferUpdate(); // Acknowledge the interaction immediately
                
                const selectedValue = interaction.values[0];
                
                const categoryEmojis = {
                    'info': '📊',
                    'config': '⚙️',
                    'dev': '🔧',
                    'moderation': '🛡️',
                    'fun': '🎮',
                    'music': '🎵',
                    'utility': '🔨'
                };
                
                if (selectedValue === 'all') {
                    // Show all commands
                    const categories = {};
                    this.client.commands.forEach(cmd => {
                        // Skip dev category commands
                        if (cmd.category === 'dev') return;
                        
                        if (!categories[cmd.category]) categories[cmd.category] = [];
                        categories[cmd.category].push(cmd.name);
                    });
                    
                    const container = this.client.container()
                        .setAccentColor(parseInt(this.client.config.color.default.replace('#', ''), 16));
                    
                    container.addTextDisplayComponents(
                        (textDisplay) => textDisplay.setContent('> ## **📚 All Commands**\n> _Complete command list_')
                    );
                    
                    container.addSeparatorComponents((separator) => separator.setDivider(true));
                    
                    for (const [category, commands] of Object.entries(categories)) {
                        const emoji = categoryEmojis[category.toLowerCase()] || '📌';
                        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                        
                        const categoryText = '> **' + emoji + ' ' + categoryName + '** _[' + commands.length + ']_\n' +
                            '> ' + commands.map(c => '`' + c + '`').join(' **•** ');
                        
                        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(categoryText));
                        container.addSeparatorComponents((separator) => separator.setDivider(false));
                    }
                    
                    container.addSeparatorComponents((separator) => separator.setDivider(true));
                    container.addTextDisplayComponents(
                        (textDisplay) => textDisplay.setContent('_✨ Viewed by_ **' + interaction.user.tag + '** _✨_')
                    );
                    
                    // Recreate the dropdown menu
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('help_category_select')
                        .setPlaceholder('📂 Select a category to view commands')
                        .setMinValues(1)
                        .setMaxValues(1);
                    
                    for (const [category, commands] of Object.entries(categories)) {
                        const emoji = categoryEmojis[category.toLowerCase()] || '📌';
                        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                        
                        selectMenu.addOptions({
                            label: categoryName + ' Commands',
                            description: 'View ' + commands.length + ' command(s) in ' + categoryName,
                            value: category,
                            emoji: emoji,
                        });
                    }
                    
                    selectMenu.addOptions({
                        label: 'View All Commands',
                        description: 'See all ' + this.client.commands.size + ' commands at once',
                        value: 'all',
                        emoji: '📚',
                    });
                    
                    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
                    
                    return await interaction.editReply({ components: [container, actionRow] });
                    
                } else {
                    // Show specific category with pagination for large categories
                    const category = selectedValue;
                    const commands = [];
                    
                    this.client.commands.forEach(cmd => {
                        if (cmd.category === category) {
                            commands.push(cmd);
                        }
                    });
                    
                    if (commands.length === 0) {
                        return await interaction.followUp({ 
                            content: 'No commands found in this category.', 
                            ephemeral: true 
                        });
                    }
                    
                    const emoji = categoryEmojis[category.toLowerCase()] || '📌';
                    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                    
                    // Pagination: Show 8 commands per page
                    const commandsPerPage = 8;
                    const totalPages = Math.ceil(commands.length / commandsPerPage);
                    const currentPage = 0; // Start at page 0
                    
                    const startIdx = currentPage * commandsPerPage;
                    const endIdx = Math.min(startIdx + commandsPerPage, commands.length);
                    const pageCommands = commands.slice(startIdx, endIdx);
                    
                    const container = this.client.container()
                        .setAccentColor(parseInt(this.client.config.color.default.replace('#', ''), 16));
                    
                    container.addTextDisplayComponents(
                        (textDisplay) => textDisplay.setContent('> ## **' + emoji + ' ' + categoryName + ' Commands**\n> _Page ' + (currentPage + 1) + ' of ' + totalPages + ' • ' + commands.length + ' total commands_')
                    );
                    
                    container.addSeparatorComponents((separator) => separator.setDivider(true));
                    
                    // List commands for current page
                    pageCommands.forEach((cmd, index) => {
                        const globalIndex = startIdx + index + 1;
                        const cmdText = '> **`' + globalIndex + '.` `' + cmd.name + '`**\n' +
                            '> _' + (cmd.description.content || 'No description') + '_\n' +
                            '> **•** Usage: `' + this.client.config.prefix + cmd.name + ' ' + (cmd.description.usage || '') + '`\n' +
                            '> **•** Aliases: ' + (cmd.aliases.length ? cmd.aliases.map(a => '`' + a + '`').join(', ') : '_None_');
                        
                        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(cmdText));
                        
                        if (index < pageCommands.length - 1) {
                            container.addSeparatorComponents((separator) => separator.setDivider(false));
                        }
                    });
                    
                    container.addSeparatorComponents((separator) => separator.setDivider(true));
                    container.addTextDisplayComponents(
                        (textDisplay) => textDisplay.setContent('_💡 Tip: Use_ `' + this.client.config.prefix + 'help <command>` _for detailed info_')
                    );
                    
                    container.addSeparatorComponents((separator) => separator.setDivider(true));
                    container.addTextDisplayComponents(
                        (textDisplay) => textDisplay.setContent('_✨ Viewed by_ **' + interaction.user.tag + '** _✨_')
                    );
                    
                    // Add pagination buttons if more than one page
                    const components = [];
                    
                    if (totalPages > 1) {
                        const buttonRow = new ActionRowBuilder();
                        
                        // Previous button
                        buttonRow.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`help_page_${category}_${currentPage - 1}`)
                                .setLabel('◀️ Previous')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === 0)
                        );
                        
                        // Page indicator
                        buttonRow.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`help_page_indicator`)
                                .setLabel(`Page ${currentPage + 1}/${totalPages}`)
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true)
                        );
                        
                        // Next button
                        buttonRow.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`help_page_${category}_${currentPage + 1}`)
                                .setLabel('Next ▶️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage >= totalPages - 1)
                        );
                        
                        components.push(buttonRow);
                    }
                    
                    // Recreate the category dropdown
                    const categories = {};
                    this.client.commands.forEach(cmd => {
                        if (cmd.category === 'dev') return;
                        if (!categories[cmd.category]) categories[cmd.category] = [];
                        categories[cmd.category].push(cmd.name);
                    });
                    
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('help_category_select')
                        .setPlaceholder('📂 Select a category to view commands')
                        .setMinValues(1)
                        .setMaxValues(1);
                    
                    for (const [cat, cmds] of Object.entries(categories)) {
                        const catEmoji = categoryEmojis[cat.toLowerCase()] || '📌';
                        const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
                        
                        selectMenu.addOptions({
                            label: catName + ' Commands',
                            description: 'View ' + cmds.length + ' command(s) in ' + catName,
                            value: cat,
                            emoji: catEmoji,
                        });
                    }
                    
                    selectMenu.addOptions({
                        label: 'View All Commands',
                        description: 'See all ' + this.client.commands.size + ' commands at once',
                        value: 'all',
                        emoji: '📚',
                    });
                    
                    const dropdownRow = new ActionRowBuilder().addComponents(selectMenu);
                    components.push(dropdownRow);
                    
                    return await interaction.editReply({ components: [container, ...components] });
                }
            }
        }
        
        if (interaction.type === InteractionType.ApplicationCommand) {
            const { commandName } = interaction;
            if (!commandName) return await interaction.reply({ content: 'Unknown interaction!' }).catch(() => { });
            
            const cmd = this.client.commands.get(interaction.commandName);
            if (!cmd || !cmd.slashCommand) return;
            
            const command = cmd.name.toLowerCase();
            const ctx = new Context(interaction, interaction.options.data);
            
            this.client.logger.cmd('%s used by %s from %s', command, ctx.author.id, ctx.guild?.id || 'DM');
            
            if (!interaction.inGuild() || !interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel)) {
                return await interaction.reply({ content: 'I cannot see this channel!', ephemeral: true }).catch(() => { });
            }

            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.SendMessages)) {
                return await interaction.author.send({ content: `I don't have **\`SEND_MESSAGES\`** permission in \`${interaction.guild.name}\`\nchannel: <#${interaction.channelId}>` }).catch(() => { });
            }

            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.EmbedLinks)) {
                return await interaction.reply({ content: 'I don\'t have **`EMBED_LINKS`** permission.', ephemeral: true }).catch(() => { });
            }

            // Check permissions
            if (cmd.permissions) {
                if (cmd.permissions.client) {
                    if (!interaction.guild.members.me.permissions.has(cmd.permissions.client)) {
                        return await interaction.reply({ content: 'I don\'t have enough permissions to execute this command.', ephemeral: true }).catch(() => { });
                    }
                }

                if (cmd.permissions.user) {
                    if (!interaction.member.permissions.has(cmd.permissions.user)) {
                        return await interaction.reply({ content: 'You don\'t have enough permissions to execute this command.', ephemeral: true }).catch(() => { });
                    }
                }
                
                if (cmd.permissions.dev) {
                    if (this.client.config.ownerID) {
                        const findDev = this.client.config.ownerID.find((x) => x === interaction.user.id);
                        if (!findDev) {
                            return await interaction.reply({ content: 'This command is only for developers.', ephemeral: true }).catch(() => { });
                        }
                    }
                }
            }

            // Cooldown handling
            if (!this.client.cooldowns.has(commandName)) {
                this.client.cooldowns.set(commandName, new Collection());
            }
            
            const now = Date.now();
            const timestamps = this.client.cooldowns.get(commandName);
            const cooldownAmount = Math.floor(cmd.cooldown || 5) * 1000;
            
            if (!timestamps.has(interaction.user.id)) {
                timestamps.set(interaction.user.id, now);
                setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
            } else {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                const timeLeft = (expirationTime - now) / 1000;
                if (now < expirationTime && timeLeft > 0.9) {
                    return interaction.reply({ 
                        content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${commandName}\` command.`,
                        ephemeral: true
                    });
                }
                timestamps.set(interaction.user.id, now);
                setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
            }
            
            try {
                return await cmd.run(ctx, ctx.args);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    ephemeral: true,
                    content: 'An unexpected error occurred, the developers have been notified.',
                }).catch(() => { });
            }
        }
    }
}