import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { equipmentData } from '../../data/equipment.js';
import emojis from '../../config/emojis.js';

export default class Equipment extends Command {
    constructor(client) {
        super(client, {
            name: 'equipment',
            description: '🎣 View and upgrade your fishing equipment',
            aliases: ['eq', 'gear', 'upgrades'],
            category: 'summer',
            cooldown: 3,
        });
    }

    async run(ctx, args) {
        const profile = await SummerProfile.findById(ctx.author.id);
        if (!profile) {
            return ctx.sendMessage(`${emojis.general.error} You don't have a summer profile! Use \`!fish\` to start fishing.`);
        }

        // Initialize equipment if not exists
        if (!profile.equipment) {
            profile.equipment = {
                rod: { id: 'bamboo_rod', level: 1 },
                net: { id: 'basic_net', level: 1 },
                boat: { id: 'bamboo_raft', level: 1 },
                accessory: { id: 'none', level: 1 }
            };
            await profile.save();
        }

        const overviewEmbed = this.createOverviewEmbed(ctx.author, profile);
        
        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('equipment_select')
                .setPlaceholder('🎣 Select equipment to upgrade')
                .addOptions([
                    {
                        label: 'Overview',
                        description: 'View all equipment stats',
                        value: 'overview',
                        emoji: '📊'
                    },
                    {
                        label: 'Fishing Rod',
                        description: `Level ${profile.equipment.rod?.level || 1} - Increases catch rate`,
                        value: 'rod',
                        emoji: '🎣'
                    },
                    {
                        label: 'Fishing Net',
                        description: `Level ${profile.equipment.net?.level || 1} - Increases rare fish chance`,
                        value: 'net',
                        emoji: '🕸️'
                    },
                    {
                        label: 'Fishing Boat',
                        description: `Level ${profile.equipment.boat?.level || 1} - Reduces energy cost`,
                        value: 'boat',
                        emoji: '⛵'
                    },
                    {
                        label: 'Accessory',
                        description: `Level ${profile.equipment.accessory?.level || 1} - Special bonuses`,
                        value: 'accessory',
                        emoji: '💍'
                    }
                ])
        );

        const reply = await ctx.sendMessage({
            embeds: [overviewEmbed],
            components: [selectMenu]
        });

        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'equipment_select') {
                const selected = interaction.values[0];

                if (selected === 'overview') {
                    await interaction.update({
                        embeds: [this.createOverviewEmbed(ctx.author, profile)],
                        components: [selectMenu]
                    });
                } else {
                    const detailEmbed = this.createDetailEmbed(ctx.author, profile, selected);
                    const upgradeButton = this.createUpgradeButton(profile, selected);
                    
                    await interaction.update({
                        embeds: [detailEmbed],
                        components: [selectMenu, upgradeButton]
                    });
                }
            } else if (interaction.customId.startsWith('upgrade_')) {
                const equipmentType = interaction.customId.replace('upgrade_', '');
                await this.handleUpgrade(interaction, profile, equipmentType, selectMenu);
            }
        });

        collector.on('end', () => {
            reply.edit({ components: [] }).catch(() => {});
        });
    }

    createOverviewEmbed(author, profile) {
        const equipment = profile.equipment || {};
        
        const embed = new EmbedBuilder()
            .setColor(this.client.color?.equipment || '#3498db')
            .setAuthor({ name: `${author.username}'s Equipment`, iconURL: author.displayAvatarURL() })
            .setTitle(`${emojis.activities.fishing} Fishing Equipment Overview`)
            .setDescription(
                `Upgrade your equipment to improve fishing results!\n` +
                `Balance: ${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells`
            );

        // Fishing Rod
        const rodLevel = equipment.rod?.level || 1;
        const rodData = equipmentData.rod[rodLevel];
        embed.addFields({
            name: `🎣 Fishing Rod - Level ${rodLevel}`,
            value: 
                `**${rodData.name}**\n` +
                `Catch Rate: **+${((rodData.catchRateBonus - 1) * 100).toFixed(0)}%**\n` +
                `Fish Value: **+${((rodData.valueBonus - 1) * 100).toFixed(0)}%**` +
                (rodLevel < 10 ? `\n_Next upgrade: ${emojis.currency.seashell} ${equipmentData.rod[rodLevel + 1].cost.toLocaleString()}_` : `\n${emojis.general.star} **MAX LEVEL**`),
            inline: true
        });

        // Fishing Net
        const netLevel = equipment.net?.level || 1;
        const netData = equipmentData.net[netLevel];
        embed.addFields({
            name: `🕸️ Fishing Net - Level ${netLevel}`,
            value:
                `**${netData.name}**\n` +
                `Rare Chance: **+${((netData.rareFishBonus - 1) * 100).toFixed(0)}%**\n` +
                `XP Bonus: **+${((netData.xpBonus - 1) * 100).toFixed(0)}%**` +
                (netLevel < 10 ? `\n_Next upgrade: ${emojis.currency.seashell} ${equipmentData.net[netLevel + 1].cost.toLocaleString()}_` : `\n${emojis.general.star} **MAX LEVEL**`),
            inline: true
        });

        // Fishing Boat
        const boatLevel = equipment.boat?.level || 1;
        const boatData = equipmentData.boat[boatLevel];
        embed.addFields({
            name: `⛵ Fishing Boat - Level ${boatLevel}`,
            value:
                `**${boatData.name}**\n` +
                `Energy Cost: **-${((1 - boatData.energyCostReduction) * 100).toFixed(0)}%**\n` +
                `Fish Capacity: **+${boatData.inventoryBonus}**` +
                (boatLevel < 10 ? `\n_Next upgrade: ${emojis.currency.seashell} ${equipmentData.boat[boatLevel + 1].cost.toLocaleString()}_` : `\n${emojis.general.star} **MAX LEVEL**`),
            inline: true
        });

        // Accessory
        const accLevel = equipment.accessory?.level || 1;
        const accData = equipmentData.accessory[accLevel];
        embed.addFields({
            name: `💍 Accessory - Level ${accLevel}`,
            value:
                `**${accData.name}**\n` +
                `${accData.effect}` +
                (accLevel < 10 ? `\n_Next upgrade: ${emojis.currency.seashell} ${equipmentData.accessory[accLevel + 1].cost.toLocaleString()}_` : `\n${emojis.general.star} **MAX LEVEL**`),
            inline: true
        });

        // Calculate total power
        const totalPower = this.calculateTotalPower(equipment);
        embed.addFields({
            name: `${emojis.general.fire} Total Equipment Power`,
            value: `**${totalPower.toLocaleString()}** points`,
            inline: false
        });

        embed.setFooter({ text: '💡 Select equipment below to upgrade' });
        embed.setTimestamp();

        return embed;
    }

    createDetailEmbed(author, profile, equipmentType) {
        const equipment = profile.equipment || {};
        const currentLevel = equipment[equipmentType]?.level || 1;
        const currentData = equipmentData[equipmentType][currentLevel];
        const nextLevel = currentLevel + 1;
        const nextData = equipmentData[equipmentType][nextLevel];

        const icons = {
            rod: '🎣',
            net: '🕸️',
            boat: '⛵',
            accessory: '💍'
        };

        const embed = new EmbedBuilder()
            .setColor(this.client.color?.equipment || '#3498db')
            .setAuthor({ name: `${author.username}'s Equipment`, iconURL: author.displayAvatarURL() })
            .setTitle(`${icons[equipmentType]} ${equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)} - Level ${currentLevel}`)
            .setDescription(`**${currentData.name}**\n${currentData.description || ''}`);

        // Current stats
        let currentStats = this.getEquipmentStats(equipmentType, currentData);
        embed.addFields({
            name: `${emojis.progression.stats} Current Stats`,
            value: currentStats,
            inline: true
        });

        // Next level stats
        if (nextData) {
            let nextStats = this.getEquipmentStats(equipmentType, nextData);
            embed.addFields({
                name: `${emojis.progression.levelUp} Next Level Stats`,
                value: nextStats,
                inline: true
            });

            embed.addFields({
                name: `${emojis.currency.seashell} Upgrade Cost`,
                value: `**${nextData.cost.toLocaleString()}** seashells`,
                inline: false
            });

            const canAfford = profile.seashells >= nextData.cost;
            embed.addFields({
                name: `${emojis.currency.treasure} Your Balance`,
                value: `${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells ${canAfford ? emojis.general.success : emojis.general.error}`,
                inline: false
            });
        } else {
            embed.addFields({
                name: `${emojis.general.star} Maximum Level`,
                value: `This equipment is at maximum level!`,
                inline: false
            });
        }

        embed.setFooter({ text: '💡 Click upgrade button below to improve this equipment' });
        embed.setTimestamp();

        return embed;
    }

    getEquipmentStats(type, data) {
        let stats = '';
        
        switch(type) {
            case 'rod':
                stats = `Catch Rate: **+${((data.catchRateBonus - 1) * 100).toFixed(0)}%**\nFish Value: **+${((data.valueBonus - 1) * 100).toFixed(0)}%**`;
                break;
            case 'net':
                stats = `Rare Chance: **+${((data.rareFishBonus - 1) * 100).toFixed(0)}%**\nXP Bonus: **+${((data.xpBonus - 1) * 100).toFixed(0)}%**`;
                break;
            case 'boat':
                stats = `Energy Cost: **-${((1 - data.energyCostReduction) * 100).toFixed(0)}%**\nInventory: **+${data.inventoryBonus}**`;
                break;
            case 'accessory':
                stats = data.effect;
                break;
        }
        
        return stats;
    }

    createUpgradeButton(profile, equipmentType) {
        const currentLevel = profile.equipment[equipmentType]?.level || 1;
        const nextData = equipmentData[equipmentType][currentLevel + 1];

        const row = new ActionRowBuilder();

        if (nextData) {
            const canAfford = profile.seashells >= nextData.cost;
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`upgrade_${equipmentType}`)
                    .setLabel(`Upgrade (${nextData.cost.toLocaleString()} seashells)`)
                    .setEmoji(emojis.progression.levelUp)
                    .setStyle(canAfford ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(!canAfford)
            );
        } else {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('max_level')
                    .setLabel('MAX LEVEL')
                    .setEmoji(emojis.general.star)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        }

        return row;
    }

    async handleUpgrade(interaction, profile, equipmentType, selectMenu) {
        const currentLevel = profile.equipment[equipmentType]?.level || 1;
        const nextLevel = currentLevel + 1;
        const nextData = equipmentData[equipmentType][nextLevel];

        if (!nextData) {
            return interaction.reply({ content: `${emojis.general.error} This equipment is already at maximum level!`, ephemeral: true });
        }

        if (profile.seashells < nextData.cost) {
            return interaction.reply({ 
                content: `${emojis.general.error} Not enough seashells! You need ${emojis.currency.seashell} **${nextData.cost.toLocaleString()}** but only have **${profile.seashells.toLocaleString()}**.`, 
                ephemeral: true 
            });
        }

        // Perform upgrade
        profile.seashells -= nextData.cost;
        profile.equipment[equipmentType].level = nextLevel;
        profile.equipment[equipmentType].id = nextData.id;
        await profile.save();

        const icons = {
            rod: '🎣',
            net: '🕸️',
            boat: '⛵',
            accessory: '💍'
        };

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`${emojis.general.success} Upgrade Successful!`)
            .setDescription(
                `${icons[equipmentType]} **${equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)}** upgraded to level **${nextLevel}**!\n\n` +
                `**${nextData.name}**\n` +
                `${this.getEquipmentStats(equipmentType, nextData)}`
            )
            .addFields({
                name: `${emojis.currency.treasure} New Balance`,
                value: `${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells`,
                inline: false
            })
            .setFooter({ text: '🎣 Your next fishing trips will be more rewarding!' })
            .setTimestamp();

        // Update the message with new stats
        const detailEmbed = this.createDetailEmbed(interaction.user, profile, equipmentType);
        const upgradeButton = this.createUpgradeButton(profile, equipmentType);

        await interaction.update({
            embeds: [detailEmbed],
            components: [selectMenu, upgradeButton]
        });

        await interaction.followUp({ embeds: [embed] });
    }

    calculateTotalPower(equipment) {
        let power = 0;
        
        const rodLevel = equipment.rod?.level || 1;
        const netLevel = equipment.net?.level || 1;
        const boatLevel = equipment.boat?.level || 1;
        const accLevel = equipment.accessory?.level || 1;
        
        power += rodLevel * 100;
        power += netLevel * 100;
        power += boatLevel * 100;
        power += accLevel * 150;
        
        return power;
    }
}
