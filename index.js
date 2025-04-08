// Import necessary modules
const { Client, GatewayIntentBits, Events, Partials } = require('discord.js');
require('dotenv').config(); // Load environment variables from .env file

// Define the intents your bot needs
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,          // Required for basic guild operations
        GatewayIntentBits.GuildMessages,   // Required to receive messages in guilds
        GatewayIntentBits.MessageContent,  // Required to read message content (MUST BE ENABLED IN DEV PORTAL)
        GatewayIntentBits.GuildPresences   // Required for presence in members list
    ]
});

// Regular expressions to detect Twitter/X and Reddit links
// Twitter/X: Handles http/https, optional www, twitter.com or x.com, username, /status/, tweet ID, and ignores query params
const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/g;
// Reddit: Handles http/https, optional www, reddit.com, /r/subreddit/comments/post_id
const redditRegex = /https?:\/\/(?:www\.|old\.)?reddit\.com(\/r\/[a-zA-Z0-9_]+\/comments\/[a-zA-Z0-9_]+)/g;

// Event listener for when the bot is ready
client.once(Events.ClientReady, c => {
    console.log(`✅ Ready!`);
});

// Event listener for when a message is created
client.on(Events.MessageCreate, async message => {
    // Ignore messages from itself or without HTTP links
    if (message.author.bot) return;
    if (!message.content.includes('http')) return;

    // Use let for variables that will be reassigned
    let messageContentToPost = ''; // Store the final link to post
    let linkFound = false;
    let service = '';
    let originalPoster = message.author; // Store the original author

    // --- Check for Twitter/X links ---
    twitterRegex.lastIndex = 0; // Reset regex state before use
    const twitterMatch = twitterRegex.exec(message.content); // Use exec to easily get parts if needed later
    if (twitterMatch) {
        const originalUrl = twitterMatch[0]; // Full matched URL
        // Construct the new URL
        const newUrl = originalUrl.replace(/(?:twitter|x)\.com/, 'vxtwitter.com');
        messageContentToPost = newUrl;
        linkFound = true;
        service = 'Twitter';
    }

    // --- Check for Reddit links (only if Twitter wasn't found) ---
    if (!linkFound) {
        redditRegex.lastIndex = 0; // Reset regex state before use
        const redditMatch = redditRegex.exec(message.content); // Use exec to get capture groups
        if (redditMatch) {
            const originalUrl = redditMatch[0]; // Full matched URL (e.g., https://old.reddit.com/r/...)
            const redditPath = redditMatch[1]; // The captured group (e.g., /r/subreddit/comments/post_id)

            // --- Construct the new URL using www.vxreddit.com as requested ---
            const newUrl = `https://www.vxreddit.com${redditPath}`;

            messageContentToPost = newUrl;
            linkFound = true;
            service = 'Reddit';
        }
    }

    // --- If a replaceable link was found ---
    if (linkFound) {
        try {
            // Delete the original message
            await message.delete();

            // Send the new message with attribution
            const attribution = `Original ${service} post by <@${originalPoster.id}>:`;
            await message.channel.send(`${attribution}\n${messageContentToPost}`);

        } catch (error) {
            console.error(`[ERROR] Failed to process ${service} link for ${originalPoster.tag}:`, error);
            // Handle specific errors if needed (e.g., permissions)
            if (error.code === 50013) { // Missing Permissions
                 console.warn(`[WARN] PERMISSION ERROR: Bot lacks 'Manage Messages' or 'Send Messages' permission in channel #${message.channel.name} (ID: ${message.channel.id}).`);
                 // Optional: Send a message indicating the permission issue if it's safe to do so
                 // try { await message.channel.send(`I need the 'Manage Messages' permission to fix links!`); } catch {}
            } else if (error.code === 10008) { // Unknown Message (likely already deleted)
                 console.warn(`[WARN] MESSAGE DELETION FAILED: Original message ID ${message.id} not found.`);
            }

            // Message the original poster if the link couldn't be fixed
            try {
                await message.channel.send(`Sorry <@${originalPoster.id}>, I couldn't fix your ${service} link. Error code: ${error.code || 'Unknown'}`);
            } catch {}
        }
    }
});

// Log in to Discord with your client's token from the .env file
client.login(process.env.DISCORD_BOT_TOKEN)
    .catch(error => {
        console.error("Failed to login: ", error);
        process.exit(1); // Exit if login fails
    });