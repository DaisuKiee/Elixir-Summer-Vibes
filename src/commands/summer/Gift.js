import { ButtonBuilder, ButtonStyle } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import emojis from '../../config/emojis.js';

export default class Gift extends Command {
    constructor(client) {
        super(client, {
            name: 'gift',
            description: '🎁 Gift seashells to another user',
            usage: 'gift <@user> <amount>',
            examples: ['gift @friend 100', 'gift @user 500'],
            aliases: ['give', 'send', 'transfer'],
            category: 'summer',
            cooldown: 10,
        });
    }

    async run(ctx, args) {
        // Get sender's profile
        const senderProfile = await SummerProfile.findById(ctx.author.id);
        if (!senderProfile) {
            return ctx.sendMessage(`${emojis.general.error} You don't have a summer profile! Use \`!fish\` to start fishing.`);
        }

        // Parse recipient
        const recipientMention = args[0];
        if (!recipientMention) {
            return ctx.sendMessage(
                `${emojis.general.error} Please mention a user to gift seashells to!\n\n` +
                `**Usage:** \`!gift <@user> <amount>\`\n` +
                `**Example:** \`!gift @friend 100\``
            );
        }

        // Extract user ID from mention or direct ID
        let recipientId = recipientMention.replace(/[<@!>]/g, '');
        
        // Validate recipient
        if (recipientId === ctx.author.id) {
            return ctx.sendMessage(`${emojis.general.error} You can't gift seashells to yourself!`);
        }

        // Try to fetch the recipient user
        let recipientUser;
        try {
            recipientUser = await this.client.users.fetch(recipientId);
        } catch (error) {
            return ctx.sendMessage(`${emojis.general.error} Invalid user! Please mention a valid user.`);
        }

        // Check if recipient is a bot
        if (recipientUser.bot) {
            return ctx.sendMessage(`${emojis.general.error} You can't gift seashells to bots!`);
        }

        // Get recipient's profile
        let recipientProfile = await SummerProfile.findById(recipientId);
        if (!recipientProfile) {
            return ctx.sendMessage(
                `${emojis.general.error} **${recipientUser.username}** doesn't have a summer profile yet!\n` +
                `They need to use \`!fish\` to start fishing first.`
            );
        }

        // Parse amount
        const amount = parseInt(args[1]);
        if (!amount || amount < 1) {
            return ctx.sendMessage(
                `${emojis.general.error} Please specify a valid amount!\n\n` +
                `**Usage:** \`!gift <@user> <amount>\`\n` +
                `**Example:** \`!gift @friend 100\``
            );
        }

        // Check if sender has enough seashells
        if (senderProfile.seashells < amount) {
            return ctx.sendMessage(
                `${emojis.general.error} You don't have enough seashells!\n\n` +
                `${emojis.currency.seashell} **Your balance:** \`${senderProfile.seashells.toLocaleString()}\` seashells\n` +
                `${emojis.general.info} **Trying to gift:** \`${amount.toLocaleString()}\` seashells`
            );
        }

        // Set a maximum gift limit to prevent abuse (optional)
        const MAX_GIFT = 1000000; // 1 million seashells max per gift
        if (amount > MAX_GIFT) {
            return ctx.sendMessage(
                `${emojis.general.error} You can't gift more than ${emojis.currency.seashell} \`${MAX_GIFT.toLocaleString()}\` seashells at once!`
            );
        }

        // Show confirmation prompt
        const confirmContainer = this.client.container()
            .setAccentColor(parseInt(this.client.color.default?.replace('#', '') || '5865F2', 16));

        confirmContainer.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `> ## ${emojis.general.gift} **Confirm Gift**\n` +
                `> ${emojis.general.warning} Please confirm this transaction`
            )
        );

        confirmContainer.addSeparatorComponents((separator) => separator.setDivider(true));

        confirmContainer.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `> **💸 Transaction Details**\n` +
                `> **From:** ${ctx.author.username}\n` +
                `> **To:** ${recipientUser.username}\n` +
                `> **Amount:** ${emojis.currency.seashell} \`${amount.toLocaleString()}\` seashells`
            )
        );

        confirmContainer.addSeparatorComponents((separator) => separator.setDivider(true));

        confirmContainer.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `> **📊 Your Current Balance**\n` +
                `> ${emojis.currency.seashell} \`${senderProfile.seashells.toLocaleString()}\` seashells\n\n` +
                `> **After Gift**\n` +
                `> ${emojis.currency.seashell} \`${(senderProfile.seashells - amount).toLocaleString()}\` seashells`
            )
        );

        confirmContainer.addSeparatorComponents((separator) => separator.setDivider(true));

        // Add confirmation buttons
        confirmContainer.addActionRowComponents((actionRow) => {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_gift')
                    .setLabel('✅ Confirm Gift')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel_gift')
                    .setLabel('❌ Cancel')
                    .setStyle(ButtonStyle.Danger)
            );
            return actionRow;
        });

        const confirmMessage = await ctx.sendMessage({ components: [confirmContainer] });

        // Set up collector for button interactions
        const collector = confirmMessage.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 30000 // 30 seconds
        });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'confirm_gift') {
                // Perform the transfer
                senderProfile.seashells -= amount;
                recipientProfile.seashells += amount;

                await senderProfile.save();
                await recipientProfile.save();

                // Create success message
                const successContainer = this.client.container()
                    .setAccentColor(parseInt(this.client.color.success?.replace('#', '') || '57F287', 16));

                successContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> ## ${emojis.general.gift} **Gift Sent!**\n` +
                        `> ${emojis.general.success} Successfully gifted seashells!`
                    )
                );

                successContainer.addSeparatorComponents((separator) => separator.setDivider(true));

                successContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> **💸 Transaction Details**\n` +
                        `> **From:** ${ctx.author.username}\n` +
                        `> **To:** ${recipientUser.username}\n` +
                        `> **Amount:** ${emojis.currency.seashell} \`${amount.toLocaleString()}\` seashells`
                    )
                );

                successContainer.addSeparatorComponents((separator) => separator.setDivider(true));

                successContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> **📊 Updated Balances**\n` +
                        `> **${ctx.author.username}:** ${emojis.currency.seashell} \`${senderProfile.seashells.toLocaleString()}\` seashells\n` +
                        `> **${recipientUser.username}:** ${emojis.currency.seashell} \`${recipientProfile.seashells.toLocaleString()}\` seashells`
                    )
                );

                successContainer.addSeparatorComponents((separator) => separator.setDivider(true));

                successContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> ${emojis.general.sparkles} _"What a generous gift!"_`
                    )
                );

                await interaction.update({ components: [successContainer] });
                collector.stop();
            } else if (interaction.customId === 'cancel_gift') {
                // Create cancelled message
                const cancelContainer = this.client.container()
                    .setAccentColor(parseInt(this.client.color.error?.replace('#', '') || 'ED4245', 16));

                cancelContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> ## ${emojis.general.error} **Gift Cancelled**\n` +
                        `> ${emojis.general.info} The transaction has been cancelled.`
                    )
                );

                cancelContainer.addSeparatorComponents((separator) => separator.setDivider(true));

                cancelContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> **No seashells were transferred.**\n` +
                        `> Your balance remains: ${emojis.currency.seashell} \`${senderProfile.seashells.toLocaleString()}\` seashells`
                    )
                );

                await interaction.update({ components: [cancelContainer] });
                collector.stop();
            }
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) {
                // Timeout - no interaction
                const timeoutContainer = this.client.container()
                    .setAccentColor(parseInt(this.client.color.error?.replace('#', '') || 'ED4245', 16));

                timeoutContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> ## ${emojis.general.error} **Gift Expired**\n` +
                        `> ${emojis.general.warning} The confirmation timed out.`
                    )
                );

                timeoutContainer.addSeparatorComponents((separator) => separator.setDivider(true));

                timeoutContainer.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> **No seashells were transferred.**\n` +
                        `> Please try again with \`!gift @${recipientUser.username} ${amount}\``
                    )
                );

                confirmMessage.edit({ components: [timeoutContainer] }).catch(() => {});
            }
        });
    }
}
