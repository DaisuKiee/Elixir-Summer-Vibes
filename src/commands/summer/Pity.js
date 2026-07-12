import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { getPityProgress, formatPityProgressBar, pityThresholds } from '../../data/pitySystem.js';
import { emojis } from '../../config/emojis.js';

export default class Pity extends Command {
    constructor(client) {
        super(client, {
            name: 'pity',
            description: {
                content: 'View your pity counter progress for guaranteed rare fish',
                usage: '',
                examples: ['pity'],
            },
            aliases: ['guarantee', 'luck', 'pitycounter'],
            category: 'summer',
            cooldown: 3,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: []
        });
    }
    
    async run(ctx) {
        // Get or create profile
        let profile = await SummerProfile.findById(ctx.author.id);
        
        if (!profile) {
            profile = new SummerProfile({
                _id: ctx.author.id,
                username: ctx.author.tag
            });
            await profile.save();
        }
        
        // Initialize pity counters if needed
        if (!profile.pityCounters) {
            profile.pityCounters = { epic: 0, legendary: 0, mythical: 0 };
            await profile.save();
        }
        
        // Get pity progress
        const progress = getPityProgress(profile);
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent('> ## **🎰 Pity Counter Progress**\n> _Guaranteed rare fish after X catches without one_')
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Epic Progress
        const epicBar = formatPityProgressBar(progress, 'epic');
        const epicStatus = progress.epic.remaining === 0 ? '**GUARANTEED NEXT CATCH!**' : `${progress.epic.remaining} catches remaining`;
        const epicColor = progress.epic.percentage >= 75 ? emojis.rarity.epic : progress.epic.percentage >= 50 ? emojis.general.warning : emojis.rarity.common;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ### ${emojis.rarity.epic} **Epic Fish**\n> ${epicBar}\n> ${epicStatus}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(false));
        
        // Legendary Progress
        const legendaryBar = formatPityProgressBar(progress, 'legendary');
        const legendaryStatus = progress.legendary.remaining === 0 ? '**GUARANTEED NEXT CATCH!**' : `${progress.legendary.remaining} catches remaining`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ### ${emojis.rarity.legendary} **Legendary Fish**\n> ${legendaryBar}\n> ${legendaryStatus}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(false));
        
        // Mythical Progress
        const mythicalBar = formatPityProgressBar(progress, 'mythical');
        const mythicalStatus = progress.mythical.remaining === 0 ? '**GUARANTEED NEXT CATCH!**' : `${progress.mythical.remaining} catches remaining`;
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> ### ${emojis.rarity.mythical} **Mythical Creature**\n> ${mythicalBar}\n> ${mythicalStatus}`)
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Information Box
        let infoText = '> **💡 How Pity Works:**\n';
        infoText += '> **•** Counters increase when you DON\'T catch rare fish\n';
        infoText += '> **•** Catching a rarity resets that counter (and below)\n';
        infoText += '> **•** Guaranteed fish activates automatically\n';
        infoText += '> **•** Prevents extreme bad luck!';
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(infoText)
        );
        
        // Show warnings if close to pity
        const warnings = [];
        if (progress.epic.percentage >= 90) {
            warnings.push(`${emojis.rarity.epic} **Epic guaranteed in ${progress.epic.remaining} catches!**`);
        }
        if (progress.legendary.percentage >= 90) {
            warnings.push(`${emojis.rarity.legendary} **Legendary guaranteed in ${progress.legendary.remaining} catches!**`);
        }
        if (progress.mythical.percentage >= 90) {
            warnings.push(`${emojis.rarity.mythical} **Mythical guaranteed in ${progress.mythical.remaining} catches!**`);
        }
        
        if (warnings.length > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent('> ## **⚠️ Close to Guarantee!**\n> ' + warnings.join('\n> '))
            );
        }
        
        // Total catches statistic
        const totalCatches = profile.fishCaught || 0;
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(`> **📊 Total Catches:** \`${totalCatches.toLocaleString()}\` fish\n> _Keep fishing to trigger pity guarantees!_`)
        );
        
        return ctx.sendMessage({ components: [container] });
    }
}
