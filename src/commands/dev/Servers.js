import Command from '../../structures/Command.js';

export default class Servers extends Command {
    constructor(client) {
        super(client, {
            name: 'servers',
            description: {
                content: 'List all servers the bot is in',
                usage: '',
                examples: ['servers'],
            },
            aliases: ['guilds', 'serverlist'],
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
        const guilds = this.client.guilds.cache;
        
        if (guilds.size === 0) {
            const container = this.client.container()
                .setAccentColor(parseInt(this.client.color.warn.replace('#', ''), 16));
            
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> **⚠️ No Servers**\n> Bot is not in any servers')
            );
            
            return ctx.sendMessage({ components: [container] });
        }
        
        // Sort guilds by member count
        const sortedGuilds = guilds.sort((a, b) => b.memberCount - a.memberCount);
        
        // Calculate total members
        const totalMembers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **🏰 Server List**\n> **Total Servers:** `' + guilds.size + '`\n> **Total Members:** `' + totalMembers.toLocaleString() + '`')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Display servers (limit to 10 to avoid message limit)
        const displayGuilds = sortedGuilds.first(10);
        
        displayGuilds.forEach((guild, index) => {
            const owner = guild.ownerId;
            const serverText = '> **`' + (index + 1) + '.` ' + guild.name + '**\n' +
                '> **•** ID: `' + guild.id + '`\n' +
                '> **•** Members: `' + guild.memberCount.toLocaleString() + '`\n' +
                '> **•** Owner: <@' + owner + '>\n' +
                '> **•** Created: <t:' + Math.floor(guild.createdTimestamp / 1000) + ':R>';
            
            container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(serverText));
            
            if (index < displayGuilds.length - 1) {
                container.addSeparatorComponents((separator) => separator.setDivider(false));
            }
        });
        
        if (guilds.size > 10) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('_... and `' + (guilds.size - 10) + '` more servers_')
            );
        }
        
        return ctx.sendMessage({ components: [container] });
    }
}
