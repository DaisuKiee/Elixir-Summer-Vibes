import Command from "../../structures/Command.js";
import { ThumbnailBuilder } from "discord.js"; 

export default class Ping extends Command {
    constructor(client) {
        super(client, {
            name: 'ping',
            description: {
                content: 'Check the bot\'s latency and response time.',
                usage: 'ping',
                examples: ['ping'],
            },
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
        const msg = await ctx.sendDeferMessage('Pinging...');

        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.success.replace('#', ''), 16));
        
        // Header section with icon
        const headerSection = this.client.section()
            .addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('## 🏓 Pong!')
            )
            .setThumbnailAccessory(
                (thumbnail) => thumbnail
                    .setURL(this.client.user.displayAvatarURL())
                    .setDescription('Bot avatar')
            );
        
        container.addSectionComponents(headerSection);
        
        // Bot Latency
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`**Bot Latency**\n\`\`\`ini\n[ ${msg.createdTimestamp - ctx.createdTimestamp}ms ]\n\`\`\``)
        );
        
        // API Latency
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`**API Latency**\n\`\`\`ini\n[ ${Math.round(ctx.client.ws.ping)}ms ]\n\`\`\``)
        );
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`*Requested by ${ctx.author.tag}*`)
        );
        
        return await ctx.editMessage({ content: '', components: [container] });
    }
}
