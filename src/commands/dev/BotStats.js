import Command from '../../structures/Command.js';
import os from 'os';

export default class BotStats extends Command {
    constructor(client) {
        super(client, {
            name: 'botstats',
            description: {
                content: 'Display detailed bot statistics and system information',
                usage: '',
                examples: ['botstats'],
            },
            aliases: ['bs', 'botinfo', 'systeminfo'],
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
        // Uptime calculation
        const totalSeconds = Math.floor(this.client.uptime / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor(totalSeconds / 3600) % 24;
        const minutes = Math.floor(totalSeconds / 60) % 60;
        const seconds = totalSeconds % 60;
        const uptime = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
        
        // Memory usage
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        
        // CPU info
        const cpuUsage = process.cpuUsage();
        const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);
        
        // Discord stats
        const guilds = this.client.guilds.cache.size;
        const users = this.client.users.cache.size;
        const channels = this.client.channels.cache.size;
        const commands = this.client.commands.size;
        
        // Platform info
        const platform = os.platform();
        const arch = os.arch();
        const nodeVersion = process.version;
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **📊 Bot Statistics**\n> _Detailed system and bot information_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Discord Stats
        const discordStats = '> **🤖 Discord Statistics**\n' +
            '> **•** Guilds: `' + guilds + '`\n' +
            '> **•** Users: `' + users + '`\n' +
            '> **•** Channels: `' + channels + '`\n' +
            '> **•** Commands: `' + commands + '`\n' +
            '> **•** Ping: `' + Math.round(this.client.ws.ping) + 'ms`';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(discordStats));
        container.addSeparatorComponents((separator) => separator.setDivider(false));
        
        // System Stats
        const systemStats = '> **💻 System Statistics**\n' +
            '> **•** Platform: `' + platform + ' ' + arch + '`\n' +
            '> **•** Node.js: `' + nodeVersion + '`\n' +
            '> **•** CPU Cores: `' + os.cpus().length + '`\n' +
            '> **•** CPU Usage: `' + cpuPercent + ' seconds`\n' +
            '> **•** Uptime: `' + uptime + '`';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(systemStats));
        container.addSeparatorComponents((separator) => separator.setDivider(false));
        
        // Memory Stats
        const memoryStats = '> **💾 Memory Statistics**\n' +
            '> **•** Bot Memory: `' + memoryUsage + ' MB`\n' +
            '> **•** Free Memory: `' + freeMemory + ' GB`\n' +
            '> **•** Total Memory: `' + totalMemory + ' GB`\n' +
            '> **•** Memory Usage: `' + ((1 - freeMemory / totalMemory) * 100).toFixed(2) + '%`';
        
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(memoryStats));
        
        // Footer
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('_✨ Requested by_ **' + ctx.author.tag + '** _✨_')
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
