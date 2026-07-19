import Event from '../../structures/Event.js';
import WeatherManager from '../../utils/weatherManager.js';

export default class ClientReady extends Event {
    constructor(...args) {
        super(...args, {
            name: 'clientReady',
            once: true
        });
    }
    async run() {
        this.client.logger.ready(`Logged in as ${this.client.user.tag}`);
        this.client.logger.ready(`Serving ${this.client.guilds.cache.size} guilds with ${this.client.users.cache.size} users`);
        
        this.client.user.setPresence({
            activities: [
                {
                    name: `${this.client.config.prefix}help`,
                    type: 3, // Watching
                }
            ],
            status: 'online',
        });
        
        // Initialize Weather Manager
        this.client.weatherManager = new WeatherManager(this.client);
        await this.client.weatherManager.initialize();
        this.client.logger.ready('Mutation Weather System initialized');
    }
}