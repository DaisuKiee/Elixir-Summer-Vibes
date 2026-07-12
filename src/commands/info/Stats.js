import Command from "../../structures/Command.js";
import { version, ThumbnailBuilder } from 'discord.js';
import os from 'os';

export default class Stats extends Command {
    constructor(client) {
        super(client, {
            name: 'stats',
            description: {
                content: 'Display bot statistics.',
                usage: 'stats',
                examples: ['stats'],
            },
            aliases: ['statistics', 'botstat'],
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
        const totalSeconds = Math.floor(this.client.uptime / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor(totalSeconds / 3600) % 24;
        const minutes = Math.floor(totalSeconds / 60) % 60;
        const seconds = totalSeconds % 60;
        
        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header section with thumbnail
        const headerSection = this.client.section()
            .addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('## 📊 Bot Statistics')
            )
            .setThumbnailAccessory(
                (thumbnail) => thumbnail
                    .setURL(this.client.user.displayAvatarURL())
                    .setDescription('Bot avatar')
            );
        
        container.addSectionComponents(headerSection);
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Bot Information
        const botInfo = `**🤖 Bot Information**
\`\`\`yml
Servers: ${this.client.guilds.cache.size}
Users: ${this.client.users.cache.size}
Channels: ${this.client.channels.cache.size}
Commands: ${this.client.commands.size}
\`\`\``;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(botInfo));
        
        // Uptime and Ping
        const uptimePing = `**⏰ Uptime**
\`\`\`yml
${uptime}
\`\`\`

**🏓 Ping**
\`\`\`yml
WS: ${Math.round(this.client.ws.ping)}ms
\`\`\``;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(uptimePing));
        
        // Memory
        const memory = `**💾 Memory**
\`\`\`yml
Used: ${memoryUsage} MB
Free: ${freeMemory} GB
Total: ${totalMemory} GB
\`\`\``;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(memory));
        
        // System
        const system = `**🖥️ System**
\`\`\`yml
Platform: ${os.platform()}
CPU Cores: ${os.cpus().length}
Node.js: ${process.version}
Discord.js: v${version}
\`\`\``;
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(system));
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`*Requested by ${ctx.author.tag}*`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
