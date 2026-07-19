import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import { equipmentData } from '../../data/equipment.js';
import { updateEnergy } from '../../data/energySystem.js';
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

    async run(ctx) {
        const profile = await SummerProfile.findById(ctx.author.id);
        if (!profile) {
            return ctx.sendMessage(`${emojis.general.error} You don't have a summer profile! Use \`${this.client.config.prefix}fish\` to start fishing.`);
        }

        // Update energy to get real-time values
        updateEnergy(profile);

        // Initialize equipment if not exists
        if (!profile.equipment) {
            profile.equipment = {
                rod: { id: 'bamboo_rod', level: 1 },
                net: { id: 'basic_net', level: 1 },
                boat: { id: 'bamboo_raft', level: 1 },
                accessory: { id: 'none', level: 1 },
                energyBar: { id: 'basic_capacity', level: 1 }
            };
            await profile.save();
        }
        
        // Initialize energy bar if missing
        if (!profile.equipment.energyBar) {
            profile.equipment.energyBar = { id: 'basic_capacity', level: 1 };
            await profile.save();
        }

        return this.showEquipmentOverview(ctx, profile);
    }

    async showEquipmentOverview(ctx, profile) {
        const equipment = profile.equipment || {};
        
        // Create container
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `## ${emojis.activities.fishing} **${ctx.author.username}'s Equipment**\n` +
                `**Upgrade your fishing gear to catch better fish!**`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Balance
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `${emojis.currency.treasure} **Balance**\n` +
                `${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Equipment stats in sections
        const sections = [
            this.createRodSection(equipment),
            this.createNetSection(equipment),
            this.createBoatSection(equipment),
            this.createEnergySection(equipment, profile),
            this.createAccessorySection(equipment)
        ];
        
        sections.forEach((section, index) => {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(section)
            );
            if (index < sections.length - 1) {
                container.addSeparatorComponents((separator) => separator.setDivider(true));
            }
        });
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Total power
        const totalPower = this.calculateTotalPower(equipment);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `${emojis.general.fire} **Total Equipment Power**\n` +
                `**${totalPower.toLocaleString()}** points`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Footer
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `_💡 Select equipment below to view details and upgrade!_`
            )
        );
        
        // Add select menu inside container
        container.addActionRowComponents((row) => {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('equipment_select')
                .setPlaceholder('🎣 Select equipment to view and upgrade')
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions([
                    {
                        label: 'Fishing Rod',
                        description: `Level ${equipment.rod?.level || 1} - Increases catch rate & fish value`,
                        value: 'rod',
                        emoji: '🎣'
                    },
                    {
                        label: 'Fishing Net',
                        description: `Level ${equipment.net?.level || 1} - Increases rare fish chance & XP`,
                        value: 'net',
                        emoji: '🕸️'
                    },
                    {
                        label: 'Fishing Boat',
                        description: `Level ${equipment.boat?.level || 1} - Reduces energy cost & inventory`,
                        value: 'boat',
                        emoji: '⛵'
                    },
                    {
                        label: 'Energy Capacity',
                        description: `Level ${equipment.energyBar?.level || 1} - Increases max energy`,
                        value: 'energyBar',
                        emoji: '⚡'
                    },
                    {
                        label: 'Accessory',
                        description: `Level ${equipment.accessory?.level || 1} - Special bonuses`,
                        value: 'accessory',
                        emoji: '💍'
                    }
                ]);
            
            return row.addComponents(selectMenu);
        });
        
        const reply = await ctx.sendMessage({ components: [container] });
        
        // Handle interactions
        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 300000 // 5 minutes
        });
        
        collector.on('collect', async interaction => {
            // Always fetch fresh profile for each interaction
            const freshProfile = await SummerProfile.findById(ctx.author.id);
            updateEnergy(freshProfile);
            
            if (interaction.customId === 'equipment_select') {
                const selected = interaction.values[0];
                await this.showEquipmentDetail(interaction, freshProfile, selected, ctx);
            } else if (interaction.customId.startsWith('upgrade_')) {
                const equipmentType = interaction.customId.replace('upgrade_', '');
                await this.handleUpgrade(interaction, freshProfile, equipmentType, ctx);
            } else if (interaction.customId === 'back_to_overview') {
                const updatedContainer = this.createOverviewContainer(ctx, freshProfile);
                
                await interaction.update({ components: [updatedContainer] });
            }
        });
        
        collector.on('end', () => {
            reply.edit({ components: [] }).catch(() => {});
        });
    }
    
    createRodSection(equipment) {
        const rodLevel = equipment.rod?.level || 1;
        const rodData = equipmentData.rod[rodLevel];
        const isMaxLevel = rodLevel === 20;
        
        return (
            `🎣 **Fishing Rod - Level ${rodLevel}**\n` +
            `**${rodData.name}**\n` +
            `Catch Rate: **+${((rodData.catchRateBonus - 1) * 100).toFixed(0)}%**\n` +
            `Fish Value: **+${((rodData.valueBonus - 1) * 100).toFixed(0)}%**\n` +
            (isMaxLevel ? 
                `${emojis.general.star} **MAX LEVEL**` : 
                `_Next: ${emojis.currency.seashell} ${equipmentData.rod[rodLevel + 1].cost.toLocaleString()}_`
            )
        );
    }
    
    createNetSection(equipment) {
        const netLevel = equipment.net?.level || 1;
        const netData = equipmentData.net[netLevel];
        const isMaxLevel = netLevel === 10;
        
        return (
            `🕸️ **Fishing Net - Level ${netLevel}**\n` +
            `**${netData.name}**\n` +
            `Rare Chance: **+${((netData.rareFishBonus - 1) * 100).toFixed(0)}%**\n` +
            `XP Bonus: **+${((netData.xpBonus - 1) * 100).toFixed(0)}%**\n` +
            (isMaxLevel ? 
                `${emojis.general.star} **MAX LEVEL**` : 
                `_Next: ${emojis.currency.seashell} ${equipmentData.net[netLevel + 1].cost.toLocaleString()}_`
            )
        );
    }
    
    createBoatSection(equipment) {
        const boatLevel = equipment.boat?.level || 1;
        const boatData = equipmentData.boat[boatLevel];
        const isMaxLevel = boatLevel === 10;
        
        return (
            `⛵ **Fishing Boat - Level ${boatLevel}**\n` +
            `**${boatData.name}**\n` +
            `Energy Cost: **-${((1 - boatData.energyCostReduction) * 100).toFixed(0)}%**\n` +
            `Fish Capacity: **+${boatData.inventoryBonus}**\n` +
            (isMaxLevel ? 
                `${emojis.general.star} **MAX LEVEL**` : 
                `_Next: ${emojis.currency.seashell} ${equipmentData.boat[boatLevel + 1].cost.toLocaleString()}_`
            )
        );
    }
    
    createEnergySection(equipment, profile) {
        const energyLevel = equipment.energyBar?.level || 1;
        const energyData = equipmentData.energyBar[energyLevel];
        const isMaxLevel = energyLevel === 10;
        
        return (
            `⚡ **Energy Capacity - Level ${energyLevel}**\n` +
            `**${energyData.name}**\n` +
            `Max Energy: **${energyData.maxEnergy}**\n` +
            `Current: **${profile.energy}/${energyData.maxEnergy}**\n` +
            (isMaxLevel ? 
                `${emojis.general.star} **MAX LEVEL**` : 
                `_Next: ${emojis.currency.seashell} ${equipmentData.energyBar[energyLevel + 1].cost.toLocaleString()}_`
            )
        );
    }
    
    createAccessorySection(equipment) {
        const accLevel = equipment.accessory?.level || 1;
        const accData = equipmentData.accessory[accLevel];
        const isMaxLevel = accLevel === 10;
        
        return (
            `💍 **Accessory - Level ${accLevel}**\n` +
            `**${accData.name}**\n` +
            `${accData.effect}\n` +
            (isMaxLevel ? 
                `${emojis.general.star} **MAX LEVEL**` : 
                `_Next: ${emojis.currency.seashell} ${equipmentData.accessory[accLevel + 1].cost.toLocaleString()}_`
            )
        );
    }
    
    createOverviewContainer(ctx, profile) {
        const equipment = profile.equipment || {};
        
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `## ${emojis.activities.fishing} **${ctx.author.username}'s Equipment**\n` +
                `**Upgrade your fishing gear to catch better fish!**`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `${emojis.currency.treasure} **Balance**\n` +
                `${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const sections = [
            this.createRodSection(equipment),
            this.createNetSection(equipment),
            this.createBoatSection(equipment),
            this.createEnergySection(equipment, profile),
            this.createAccessorySection(equipment)
        ];
        
        sections.forEach((section, index) => {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(section)
            );
            if (index < sections.length - 1) {
                container.addSeparatorComponents((separator) => separator.setDivider(true));
            }
        });
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        const totalPower = this.calculateTotalPower(equipment);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `${emojis.general.fire} **Total Equipment Power**\n` +
                `**${totalPower.toLocaleString()}** points`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `_💡 Select equipment below to view details and upgrade!_`
            )
        );
        
        // Add select menu inside container
        container.addActionRowComponents((row) => {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('equipment_select')
                .setPlaceholder('🎣 Select equipment to view and upgrade')
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions([
                    {
                        label: 'Fishing Rod',
                        description: `Level ${equipment.rod?.level || 1} - Increases catch rate & fish value`,
                        value: 'rod',
                        emoji: '🎣'
                    },
                    {
                        label: 'Fishing Net',
                        description: `Level ${equipment.net?.level || 1} - Increases rare fish chance & XP`,
                        value: 'net',
                        emoji: '🕸️'
                    },
                    {
                        label: 'Fishing Boat',
                        description: `Level ${equipment.boat?.level || 1} - Reduces energy cost & inventory`,
                        value: 'boat',
                        emoji: '⛵'
                    },
                    {
                        label: 'Energy Capacity',
                        description: `Level ${equipment.energyBar?.level || 1} - Increases max energy`,
                        value: 'energyBar',
                        emoji: '⚡'
                    },
                    {
                        label: 'Accessory',
                        description: `Level ${equipment.accessory?.level || 1} - Special bonuses`,
                        value: 'accessory',
                        emoji: '💍'
                    }
                ]);
            
            return row.addComponents(selectMenu);
        });
        
        return container;
    }
    
    async showEquipmentDetail(interaction, profile, equipmentType, ctx) {
        const currentLevel = profile.equipment[equipmentType]?.level || 1;
        const currentData = equipmentData[equipmentType][currentLevel];
        const nextLevel = currentLevel + 1;
        const nextData = equipmentData[equipmentType][nextLevel];
        
        // Check max level based on equipment type
        const maxLevels = {
            rod: 20,
            net: 10,
            boat: 10,
            energyBar: 10,
            accessory: 10
        };
        const isMaxLevel = currentLevel === maxLevels[equipmentType];
        
        const icons = {
            rod: '🎣',
            net: '🕸️',
            boat: '⛵',
            accessory: '💍',
            energyBar: '⚡'
        };
        
        const titles = {
            rod: 'Fishing Rod',
            net: 'Fishing Net',
            boat: 'Fishing Boat',
            accessory: 'Accessory',
            energyBar: 'Energy Capacity'
        };
        
        // Create detail container
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `## ${icons[equipmentType]} **${titles[equipmentType]} - Level ${currentLevel}**\n` +
                `**${currentData.name}**`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Current stats
        const currentStats = this.getEquipmentStats(equipmentType, currentData, profile);
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                `${emojis.progression.stats} **Current Stats**\n${currentStats}`
            )
        );
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Next level or max level message
        if (!isMaxLevel) {
            const nextStats = this.getEquipmentStats(equipmentType, nextData, profile);
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `${emojis.progression.levelUp} **Next Level (${nextLevel})**\n` +
                    `**${nextData.name}**\n${nextStats}`
                )
            );
            
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            
            // Cost and balance
            const canAfford = profile.seashells >= nextData.cost;
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `${emojis.currency.seashell} **Upgrade Cost**\n` +
                    `**${nextData.cost.toLocaleString()}** seashells\n\n` +
                    `${emojis.currency.treasure} **Your Balance**\n` +
                    `${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells ${canAfford ? emojis.general.success : emojis.general.error}`
                )
            );
        } else {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `${emojis.general.star} **MAXIMUM LEVEL REACHED!**\n` +
                    `This equipment is fully upgraded.`
                )
            );
        }
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Footer
        container.addTextDisplayComponents(
            (textDisplay) => textDisplay.setContent(
                isMaxLevel ? 
                    `_${emojis.general.trophy} You have the best ${titles[equipmentType]}!_` :
                    `_💡 Click the upgrade button below to improve this equipment!_`
            )
        );
        
        // Create buttons
        const buttonRow = new ActionRowBuilder();
        
        if (!isMaxLevel) {
            const canAfford = profile.seashells >= nextData.cost;
            buttonRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`upgrade_${equipmentType}`)
                    .setLabel(`Upgrade (${nextData.cost.toLocaleString()})`)
                    .setEmoji(emojis.progression.levelUp)
                    .setStyle(canAfford ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(!canAfford)
            );
        }
        
        buttonRow.addComponents(
            new ButtonBuilder()
                .setCustomId('back_to_overview')
                .setLabel('Back to Overview')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
        );
        
        // Add button row to container
        container.addActionRowComponents((row) => row.addComponents(...buttonRow.components));
        
        await interaction.update({ components: [container] });
    }
    
    async handleUpgrade(interaction, profile, equipmentType, ctx) {
        const currentLevel = profile.equipment[equipmentType]?.level || 1;
        const nextLevel = currentLevel + 1;
        const nextData = equipmentData[equipmentType][nextLevel];
        
        if (!nextData) {
            return interaction.reply({ 
                content: `${emojis.general.error} This equipment is already at maximum level!`, 
                ephemeral: true 
            });
        }
        
        // Refresh profile to prevent race conditions
        const updatedProfile = await SummerProfile.findById(ctx.author.id);
        
        if (updatedProfile.seashells < nextData.cost) {
            return interaction.reply({ 
                content: 
                    `${emojis.general.error} **Not enough seashells!**\n\n` +
                    `${emojis.currency.seashell} Need: **${nextData.cost.toLocaleString()}**\n` +
                    `${emojis.currency.seashell} Have: **${updatedProfile.seashells.toLocaleString()}**\n` +
                    `${emojis.currency.seashell} Missing: **${(nextData.cost - updatedProfile.seashells).toLocaleString()}**`, 
                ephemeral: true 
            });
        }
        
        // Perform upgrade
        updatedProfile.seashells -= nextData.cost;
        updatedProfile.equipment[equipmentType].level = nextLevel;
        updatedProfile.equipment[equipmentType].id = nextData.id;
        
        // Update maxEnergy if upgrading energy bar
        if (equipmentType === 'energyBar') {
            updatedProfile.maxEnergy = nextData.maxEnergy;
        }
        
        await updatedProfile.save();
        
        const icons = {
            rod: '🎣',
            net: '🕸️',
            boat: '⛵',
            accessory: '💍',
            energyBar: '⚡'
        };
        
        const titles = {
            rod: 'Fishing Rod',
            net: 'Fishing Net',
            boat: 'Fishing Boat',
            accessory: 'Accessory',
            energyBar: 'Energy Capacity'
        };
        
        // Success message
        await interaction.reply({
            content: 
                `${emojis.general.success} **Upgrade Successful!**\n\n` +
                `${icons[equipmentType]} **${titles[equipmentType]}** upgraded to level **${nextLevel}**!\n` +
                `**${nextData.name}**\n\n` +
                `${this.getEquipmentStats(equipmentType, nextData, updatedProfile)}\n\n` +
                `${emojis.currency.treasure} **New Balance**\n` +
                `${emojis.currency.seashell} **${updatedProfile.seashells.toLocaleString()}** seashells\n\n` +
                `${equipmentType === 'energyBar' ? '⚡ Your energy capacity has increased!' : '🎣 Your fishing will be more rewarding!'}`,
            flags: 64 // Ephemeral flag
        });
        
        // Update energy with the already-updated profile
        updateEnergy(updatedProfile);
        
        // Fetch the original message and update it to show new stats
        const message = await interaction.message;
        if (message) {
            // Use the updated profile we already have instead of fetching again
            const updatedContainer = this.createOverviewContainer(ctx, updatedProfile);
            await message.edit({ components: [updatedContainer] }).catch(() => {});
        }
    }
    
    getEquipmentStats(type, data, profile) {
        let stats = '';
        
        switch(type) {
            case 'rod':
                stats = 
                    `Catch Rate: **+${((data.catchRateBonus - 1) * 100).toFixed(0)}%**\n` +
                    `Fish Value: **+${((data.valueBonus - 1) * 100).toFixed(0)}%**`;
                break;
            case 'net':
                stats = 
                    `Rare Chance: **+${((data.rareFishBonus - 1) * 100).toFixed(0)}%**\n` +
                    `XP Bonus: **+${((data.xpBonus - 1) * 100).toFixed(0)}%**`;
                break;
            case 'boat':
                stats = 
                    `Energy Cost: **-${((1 - data.energyCostReduction) * 100).toFixed(0)}%**\n` +
                    `Inventory: **+${data.inventoryBonus}** capacity`;
                break;
            case 'energyBar':
                stats = 
                    `Max Energy: **${data.maxEnergy}**\n` +
                    `Capacity: **${data.maxEnergy}** energy`;
                break;
            case 'accessory':
                stats = data.effect;
                break;
        }
        
        return stats;
    }
    
    calculateTotalPower(equipment) {
        let power = 0;
        
        const rodLevel = equipment.rod?.level || 1;
        const netLevel = equipment.net?.level || 1;
        const boatLevel = equipment.boat?.level || 1;
        const accLevel = equipment.accessory?.level || 1;
        const energyLevel = equipment.energyBar?.level || 1;
        
        power += rodLevel * 100;
        power += netLevel * 100;
        power += boatLevel * 100;
        power += accLevel * 150;
        power += energyLevel * 120;
        
        return power;
    }
}
