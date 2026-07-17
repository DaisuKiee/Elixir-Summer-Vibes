import { createCanvas, loadImage, registerFont } from 'canvas';
import { AttachmentBuilder } from 'discord.js';

/**
 * Generate a challenge card image
 * @param {Object} options - Card options
 * @param {string} options.type - 'daily' or 'weekly'
 * @param {string} options.username - User's username
 * @param {Array} options.challenges - Array of challenge objects
 * @returns {AttachmentBuilder} Discord attachment
 */
export async function generateChallengeCard(options) {
    const { type, username, challenges } = options;
    
    // Canvas dimensions - ONLY for the challenge cards
    const width = 700;
    const cardHeight = 120;
    const gap = 10;
    const totalHeight = (challenges.length * (cardHeight + gap)) - gap; // Remove last gap
    
    // Create canvas
    const canvas = createCanvas(width, totalHeight);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#2b2d31';
    ctx.fillRect(0, 0, width, totalHeight);
    
    // Draw each challenge card
    let yPos = 0;
    challenges.forEach((challenge, index) => {
        drawChallengeCard(ctx, challenge, 20, yPos, width - 40, cardHeight);
        yPos += cardHeight + gap;
    });
    
    // Convert to buffer and return
    const buffer = canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, { name: 'challenges.png' });
}

/**
 * Draw a single challenge card
 */
function drawChallengeCard(ctx, challenge, x, y, width, height) {
    const { icon, description, progress, goal, completed } = challenge;
    
    // Card background
    ctx.fillStyle = '#383a40';
    roundRect(ctx, x, y, width, height, 12);
    ctx.fill();
    
    // Icon (emoji) - left side
    ctx.font = '48px Arial';
    ctx.fillText(icon, x + 30, y + 70);
    
    // Description
    ctx.fillStyle = completed ? '#949ba4' : '#ffffff';
    ctx.font = completed ? 'bold 24px Arial' : 'bold 24px Arial';
    if (completed) {
        // Strike through if completed
        ctx.fillText(description, x + 100, y + 50);
        ctx.strokeStyle = '#949ba4';
        ctx.lineWidth = 2;
        const textWidth = ctx.measureText(description).width;
        ctx.beginPath();
        ctx.moveTo(x + 100, y + 45);
        ctx.lineTo(x + 100 + textWidth, y + 45);
        ctx.stroke();
    } else {
        ctx.fillText(description, x + 100, y + 50);
    }
    
    // Progress number
    const progressPercent = progress / goal;
    ctx.fillStyle = completed ? '#00d26a' : '#ffffff';
    ctx.font = 'bold 24px Arial';
    const progressText = `${progress}/${goal}`;
    const textWidth = ctx.measureText(progressText).width;
    ctx.fillText(progressText, x + width - textWidth - 30, y + 50);
    
    // Progress bar
    const barY = y + height - 35;
    const barWidth = width - 140;
    drawProgressBar(ctx, x + 100, barY, barWidth, 20, progressPercent, completed);
}

/**
 * Draw a progress bar
 */
function drawProgressBar(ctx, x, y, width, height, progress, completed = false) {
    // Background
    ctx.fillStyle = '#2b2d31';
    roundRect(ctx, x, y, width, height, height / 2);
    ctx.fill();
    
    // Filled portion
    if (progress > 0) {
        const filledWidth = Math.max(height, width * Math.min(progress, 1)); // At least show the rounded edge
        ctx.fillStyle = completed ? '#00d26a' : '#3ba55d';
        roundRect(ctx, x, y, filledWidth, height, height / 2);
        ctx.fill();
    }
}

/**
 * Draw claim button
 */
function drawClaimButton(ctx, x, y, width, height) {
    // Button background
    ctx.fillStyle = '#3ba55d';
    roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    
    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    const text = '🎁 Claim Weekly Reward';
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, x + (width - textWidth) / 2, y + height / 2 + 7);
}

/**
 * Helper function to draw rounded rectangles
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
