// Import necessary modules
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');
require('dotenv').config();

// Client setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

// URL regular expressions
const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+\/status\/[0-9]+/g;
const redditRegex = /https?:\/\/(?:www\.|old\.)?reddit\.com\/r\/[a-zA-Z0-9_]+\/comments\/[a-zA-Z0-9_]+(?:(?:\/[^\s\/]+)?\/?(?:\?[^\s]*)?)?/g;

// When the bot is ready
client.once(Events.ClientReady, c => {
    console.log(`✅ Ready! Logged in as ${c.user.tag}`);
    console.log(`➡️  Bot is in ${c.guilds.cache.size} server(s)`);
});

// When the bot detects a new message
client.on(Events.MessageCreate, async message => {
    // Ignore if message is from a bot
    if (message.author.bot) return;

    // Ignore if message doesn't contain any relevant links
    const originalContent = message.content;
    if (!originalContent.includes('reddit.com') && 
        !originalContent.includes('twitter.com') && 
        !originalContent.includes('x.com')) {
        return;
    }

    let linkExists = false; // Track if any relevant links were found
    const vxLinks = []; // Store VX links to send later

    // Find and process Twitter/X links
    for (const match of originalContent.matchAll(twitterRegex)) {
        // Get an original link
        const originalLink = match[0];
        linkExists = true;

        // Convert original link to VX link
        const vxLink = originalLink.replace(/:\/\/(?:www\.)?(?:twitter|x)\.com/, '://vxtwitter.com');
        const markdownLink = `[.](${vxLink})`;

        // Add to string of VX links
        vxLinks.push(markdownLink);
    }

    // Find and process Reddit links
    for (const match of originalContent.matchAll(redditRegex)) {
        // Get an original link
        const originalLink = match[0];
        linkExists = true;

        // Convert original link to VX link
        const vxLink = originalLink.replace(/:\/\/(?:www\.|old\.)?reddit\.com/, '://www.vxreddit.com');
        const markdownLink = `[.](${vxLink})`;

        // Add to string of VX links
        vxLinks.push(markdownLink);
    }


    // Post modified message
    if (linkExists) {
        try {
            // Delete user's original message
            await message.delete();

            // Create embed message with original content
            const contentEmbed = new EmbedBuilder()
                .setDescription(originalContent)
                .setColor('#4C4C54')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })

            // Send embed message with original content
            await message.channel.send({
                embeds: [contentEmbed]
            });

            // Send follow-up message with VX links
            const linksContent = '-# ' + vxLinks.join(' ');
            await message.channel.send({
                content: linksContent
            });

        } catch (error) {
            // Log error if posting message fails
            console.error(`🚫 Failed during message processing sequence for ${message.author.tag}:`, error);

            // Give specific error handling based on error code
            if (error.code === 50013) { // Missing Permissions
                console.warn(`⚠️ PERMISSION ERROR: Bot lacks 'Manage Messages' permission (needed to delete ID: ${message.id}) or 'Send Messages' permission in channel #${message.channel?.name || 'Unknown Channel'} (ID: ${message.channelId}). Cannot process.`);
            } else if (error.code === 10008) { // Unknown Message (Deletion Failed)
                console.warn(`⚠️ MESSAGE DELETION FAILED: Original message ID ${message.id} not found. It might have been deleted manually.`);
            }
        }
    }
});

// Retrieve Discord bot token
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
    console.error("[FATAL] DISCORD_BOT_TOKEN not found...");
    process.exit(1);
}

// Login to Discord
client.login(token)
 .catch(error => {
        console.error("[FATAL] Failed to login:", error);
        process.exit(1);
    });