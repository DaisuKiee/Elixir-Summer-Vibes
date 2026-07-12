import Command from "../../structures/Command.js"; 
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ThumbnailBuilder } from "discord.js";

export default class About extends Command {
    constructor(client) {
        super(client, {
            name: 'about',
            description: {
                content: 'See information about this bot.',
                usage: 'about',
                examples: ['about'],
            },
            aliases: ["info", "botinfo"],
            category: 'info',
            cooldown: 3,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
        });
    }

    async run(ctx, args) {
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header section with thumbnail
        const headerSection = this.client.section()
            .addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('## Bot Information')
            )
            .setThumbnailAccessory(
                (thumbnail) => thumbnail
                    .setURL(this.client.user.displayAvatarURL())
                    .setDescription('Bot avatar')
            );
        
        container.addSectionComponents(headerSection);
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Bot details
        const infoText = `
**👤 Bot Name:** ${this.client.user.tag}
**📊 Servers:** ${this.client.guilds.cache.size}
**👥 Users:** ${this.client.users.cache.size}
**📝 Commands:** ${this.client.commands.size}
**🏓 Ping:** ${Math.round(this.client.ws.ping)}ms
**⏱️ Uptime:** <t:${Math.floor((Date.now() - this.client.uptime) / 1000)}:R>
**💻 Node.js:** ${process.version}
**📚 Discord.js:** v14.26.4
**🔧 Prefix:** ${this.client.config.prefix}
        `.trim();
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(infoText)
        );
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`*Requested by ${ctx.author.tag}*`)
        );
            
        return await ctx.sendMessage({ components: [container] });
    }
}
