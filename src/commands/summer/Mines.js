import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Command from '../../structures/Command.js';
import SummerProfile from '../../schemas/summerProfile.js';
import emojis from '../../config/emojis.js';

export default class Mines extends Command {
    constructor(client) {
        super(client, {
            name: 'mines',
            description: '💣 Play a minesweeper gambling game with seashells',
            usage: 'mines <bet> [mines]',
            examples: ['mines 100', 'mines 500 5'],
            aliases: ['minesweeper', 'mine'],
            category: 'summer',
            cooldown: 5,
        });
    }

    async run(ctx, args) {
        const profile = await SummerProfile.findById(ctx.author.id);
        if (!profile) {
            return ctx.sendMessage(`${emojis.general.error} You don't have a summer profile! Use \`!fish\` to start.`);
        }

        // Parse bet amount
        const betAmount = parseInt(args[0]);
        if (!betAmount || betAmount < 10) {
            return ctx.sendMessage(`${emojis.general.error} Please specify a bet amount! Minimum: **10 seashells**\n\nUsage: \`!mines <bet> [mines]\`\nExample: \`!mines 100 3\``);
        }

        if (betAmount > profile.seashells) {
            return ctx.sendMessage(`${emojis.general.error} You don't have enough seashells! You have ${emojis.currency.seashell} **${profile.seashells.toLocaleString()}** seashells.`);
        }

        // Parse number of mines (default: 3)
        let mineCount = parseInt(args[1]) || 3;
        if (mineCount < 1) mineCount = 1;
        if (mineCount > 8) mineCount = 8; // Max 8 mines in 9 tiles

        // Deduct bet
        profile.seashells -= betAmount;
        await profile.save();

        // Create game state
        const gameState = {
            bet: betAmount,
            mineCount: mineCount,
            revealedTiles: [],
            gameOver: false,
            won: false,
            board: this.generateBoard(mineCount),
            multiplier: 0,
            cashOut: 0
        };

        // Create initial message
        const message = await this.showGame(ctx, profile, gameState);
        
        // Set up collector for button interactions
        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            time: 120000 // 2 minutes
        });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'cashout') {
                // Cash out
                gameState.gameOver = true;
                gameState.won = true;
                
                // Update profile
                const updatedProfile = await SummerProfile.findById(ctx.author.id);
                updatedProfile.seashells += gameState.cashOut;
                await updatedProfile.save();
                
                await interaction.update({ components: [this.buildContainer(ctx, updatedProfile, gameState)] });
                collector.stop();
                return;
            }

            if (interaction.customId === 'playagain') {
                collector.stop();
                return this.run(ctx, args);
            }

            if (interaction.customId.startsWith('tile_')) {
                const index = parseInt(interaction.customId.split('_')[1]);
                const tile = gameState.board[index];
                
                if (tile === 'mine') {
                    // Hit a mine - game over
                    gameState.gameOver = true;
                    gameState.won = false;
                    gameState.revealedTiles.push(index);
                    
                    await interaction.update({ components: [this.buildContainer(ctx, profile, gameState)] });
                    collector.stop();
                    return;
                } else {
                    // Revealed a diamond
                    gameState.revealedTiles.push(index);
                    
                    // Check if all safe tiles are revealed
                    const safeTiles = 9 - gameState.mineCount;
                    if (gameState.revealedTiles.length === safeTiles) {
                        // Auto cash out - won!
                        gameState.gameOver = true;
                        gameState.won = true;
                        
                        const updatedProfile = await SummerProfile.findById(ctx.author.id);
                        const finalMultiplier = this.calculateMultiplier(gameState.revealedTiles.length, gameState.mineCount);
                        const finalCashOut = Math.floor(gameState.bet * finalMultiplier);
                        updatedProfile.seashells += finalCashOut;
                        await updatedProfile.save();
                        
                        await interaction.update({ components: [this.buildContainer(ctx, updatedProfile, gameState)] });
                        collector.stop();
                        return;
                    }
                    
                    await interaction.update({ components: [this.buildContainer(ctx, profile, gameState)] });
                    return;
                }
            }
        });

        collector.on('end', () => {
            if (!gameState.gameOver) {
                message.edit({ components: [] }).catch(() => {});
            }
        });
    }

    generateBoard(mineCount) {
        // Create 9 tiles (3x3 grid)
        const tiles = [];
        
        // Place mines
        for (let i = 0; i < mineCount; i++) {
            tiles.push('mine');
        }
        
        // Fill rest with diamonds
        for (let i = mineCount; i < 9; i++) {
            tiles.push('diamond');
        }
        
        // Shuffle
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }
        
        return tiles;
    }

    calculateMultiplier(revealed, totalMines) {
        // The more tiles revealed without hitting a mine, the higher the multiplier
        const safeTiles = 9 - totalMines;
        const progress = revealed / safeTiles;
        
        // Base multiplier increases with difficulty (more mines = higher multiplier)
        const baseMultipliers = {
            1: 1.10, // 1 mine = 1.10x per tile
            2: 1.15,
            3: 1.21, // 3 mines = 1.21x per tile
            4: 1.28,
            5: 1.36,
            6: 1.46,
            7: 1.60,
            8: 2.00  // 8 mines = 2x per tile (very risky!)
        };
        
        const baseMultiplier = baseMultipliers[totalMines] || 1.21;
        
        // Calculate current multiplier
        const multiplier = Math.pow(baseMultiplier, revealed);
        
        return multiplier;
    }

    buildContainer(ctx, profile, gameState) {
        const { bet, mineCount, revealedTiles, gameOver, won, board } = gameState;
        
        // Calculate current multiplier and cash out amount
        const multiplier = this.calculateMultiplier(revealedTiles.length, mineCount);
        const cashOutAmount = Math.floor(bet * multiplier);
        
        gameState.multiplier = multiplier;
        gameState.cashOut = cashOutAmount;
        
        // Create container for text display
        const container = this.client.container()
            .setAccentColor(parseInt(this.client.color.default.replace('#', ''), 16));
        
        // Header with game status
        if (gameOver) {
            if (won) {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> ## **💎 ${ctx.author.username} Cashed Out!**\n` +
                        `> ${emojis.general.success} **You won!**`
                    )
                );
            } else {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> ## **💥 ${ctx.author.username} Hit a Mine!**\n` +
                        `> ${emojis.general.error} **Game Over**`
                    )
                );
            }
        } else {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `> ## **💣 ${ctx.author.username}'s Mines Game**\n` +
                    `> Click tiles to reveal. Avoid the mines!`
                )
            );
        }
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Game info
        if (gameOver) {
            if (won) {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> **💰 Game Results**\n` +
                        `> **Bet:** ${emojis.currency.seashell} \`${bet.toLocaleString()}\` seashells\n` +
                        `> **Won:** ${emojis.currency.seashell} \`${cashOutAmount.toLocaleString()}\` seashells\n` +
                        `> **Profit:** ${emojis.currency.seashell} \`${(cashOutAmount - bet).toLocaleString()}\` seashells\n` +
                        `> **Multiplier:** \`${multiplier.toFixed(2)}x\`\n` +
                        `> **Tiles Revealed:** \`${revealedTiles.length}/${9 - mineCount}\``
                    )
                );
            } else {
                container.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        `> **💸 Game Results**\n` +
                        `> **Lost:** ${emojis.currency.seashell} \`${bet.toLocaleString()}\` seashells\n` +
                        `> **Tiles Revealed:** \`${revealedTiles.length}\` before hitting mine\n` +
                        `> **Better luck next time!**`
                    )
                );
            }
        } else {
            container.addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    `> **📊 Current Game**\n` +
                    `> **Bet:** ${emojis.currency.seashell} \`${bet.toLocaleString()}\` | **Mines:** 💣 \`${mineCount}\`\n` +
                    `> **Cash Out:** ${emojis.currency.seashell} \`${cashOutAmount.toLocaleString()}\` **(\`${multiplier.toFixed(2)}x\`)**\n` +
                    `> **Next:** ${emojis.currency.seashell} \`${Math.floor(bet * this.calculateMultiplier(revealedTiles.length + 1, mineCount)).toLocaleString()}\` **(\`${this.calculateMultiplier(revealedTiles.length + 1, mineCount).toFixed(2)}x\`)**`
                )
            );
        }
        
        container.addSeparatorComponents((separator) => separator.setDivider(true));
        
        // Create button grid (3x3) using container's addActionRowComponents
        for (let row = 0; row < 3; row++) {
            container.addActionRowComponents((actionRow) => {
                for (let col = 0; col < 3; col++) {
                    const index = row * 3 + col;
                    const isRevealed = revealedTiles.includes(index);
                    const tile = board[index];
                    
                    if (gameOver) {
                        // Reveal all tiles when game is over
                        actionRow.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`tile_${index}_disabled`)
                                .setEmoji(tile === 'mine' ? '💥' : '💎')
                                .setStyle(tile === 'mine' ? ButtonStyle.Danger : ButtonStyle.Success)
                                .setDisabled(true)
                        );
                    } else if (isRevealed) {
                        // Show revealed diamond
                        actionRow.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`tile_${index}_revealed`)
                                .setEmoji('💎')
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true)
                        );
                    } else {
                        // Hidden tile
                        actionRow.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`tile_${index}`)
                                .setEmoji('❓')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    }
                }
                return actionRow;
            });
        }

        // Add cash out button if game is active and at least 1 tile revealed
        if (!gameOver && revealedTiles.length > 0) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addActionRowComponents((actionRow) => {
                actionRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId('cashout')
                        .setLabel(`💰 Cash Out (${cashOutAmount.toLocaleString()})`)
                        .setStyle(ButtonStyle.Success)
                );
                return actionRow;
            });
        } else if (gameOver) {
            container.addSeparatorComponents((separator) => separator.setDivider(true));
            container.addActionRowComponents((actionRow) => {
                actionRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId('playagain')
                        .setLabel('🔄 Play Again')
                        .setStyle(ButtonStyle.Primary)
                );
                return actionRow;
            });
        }

        return container;
    }

    async showGame(ctx, profile, gameState) {
        const container = this.buildContainer(ctx, profile, gameState);
        return await ctx.sendMessage({ components: [container] });
    }
}
