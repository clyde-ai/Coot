require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const moment = require('moment');
const { getEventTime, isEventActive, scheduleEventStartBroadcast } = require('./commands/setEventTime');
const googleSheets = require('./src/utils/googleSheets');
const { loadTeamsFromSheet } = require('./commands/createTeam');
const { getSnakes } = require('./commands/createSnake');
const { getLadders } = require('./commands/createLadder');
const { getEventPassword } = require('./commands/setEventPassword');
const { createEmbed } = require('./src/utils/embeds');

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions // Ensure this intent is included
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
for (const key in config) {
    if (config[key].startsWith('${') && config[key].endsWith('}')) {
        const envVar = config[key].slice(2, -1);
        config[key] = process.env[envVar];
    }
}

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    require('./deploy-commands');

    // Initialize Google Sheets with headers if they are not already set
    try {
        const teamHeaders = ['Team Name', 'Members', 'Date Created', 'Role ID', 'Current Tile', 'Previous Tile', 'Can Roll'];
        const rollHeaders = ['Team Name', 'User Name', 'Action', 'Roll', 'Previous Tile', 'New Tile', 'Timestamp'];
        const submissionHeaders = ['Team Name', 'User Name', 'Tile Number', 'Submission Status', 'Proof URL', 'Timestamp', 'Manual Review Flag', 'Submission Link', 'Review Status', 'Reviewer Name'];
        const snakesHeaders = ['Head Tile', 'Tail Tile', 'Created By', 'Timestamp'];
        const laddersHeaders = ['Bottom Tile', 'Top Tile', 'Created By', 'Timestamp'];
        const eventPasswordHeaders = ['Password', 'Start Time', 'End Time', 'Broadcast Channel ID'];

        await setHeadersIfNotExist('Teams', teamHeaders);
        await setHeadersIfNotExist('Rolls', rollHeaders);
        await setHeadersIfNotExist('Submissions', submissionHeaders);
        await setHeadersIfNotExist('Snakes', snakesHeaders);
        await setHeadersIfNotExist('Ladders', laddersHeaders);
        await setHeadersIfNotExist('EventPassword', eventPasswordHeaders);

        console.log('------Headers set successfully------');

        // Populate data from Google Sheets
        await populateData();

        // Schedule the event start broadcast if the event start time is in the future
        const eventTime = await getEventTime();
        if (eventTime.eventStartTime && moment().isBefore(eventTime.eventStartTime)) {
            scheduleEventStartBroadcast(client, eventTime.eventStartTime, eventTime.broadcastChannelId);
        }

        // Set an interval to ensure the token is valid
        setInterval(ensureValidToken, 15 * 60 * 1000); // Check every 15 minutes
    } catch (error) {
        console.error('Error setting headers or populating data:', error);
    }
});

async function setHeadersIfNotExist(sheetName, headers) {
    try {
        const existingHeaders = await googleSheets.readSheet(`${sheetName}!A1:Z1`);
        if (!existingHeaders || existingHeaders.length === 0 || existingHeaders[0].length < headers.length) {
            await googleSheets.setHeaders(sheetName, headers);
        }
        await googleSheets.freezeHeaders(sheetName);
    } catch (error) {
        console.error(`Error reading from sheet ${sheetName}!A1:Z1:`, error);
        throw new Error('Failed to read from Google Sheets. Please try again later.');
    }
}

async function populateData() {
    try {
        console.log('------Starting Data Load from Google Sheets------');

        // Load teams from Google Sheets
        await loadTeamsFromSheet();
        console.log('- Loaded data from: Teams sheet');

        // Populate snakes
        const snakes = await getSnakes();
        global.snakes = snakes;
        console.log('- Loaded data from: Snakes sheet');

        // Populate ladders
        const ladders = await getLadders();
        global.ladders = ladders;
        console.log('- Loaded data from: Ladders sheet');

        // Populate Event Password
        const eventPassword = await getEventPassword();
        global.eventPassword = eventPassword;
        console.log('- Loaded data from: Event Password sheet\n -- Event Password is: ', global.eventPassword);

        const eventTime = await getEventTime();
        if (!eventTime.eventStartTime || !eventTime.eventEndTime) {
            // Set default values if they are not set
            const defaultStartTime = moment().add(2, 'minutes').toISOString(); // Default to 2 minutes from now
            const defaultEndTime = moment().add(10, 'minutes').toISOString(); // Default to 10 minutes from now

            global.eventStartTime = eventTime.eventStartTime || defaultStartTime;
            global.eventEndTime = eventTime.eventEndTime || defaultEndTime;

            // Update the Google Sheet with the default values
            await googleSheets.updateSheet('EventPassword', 'B2:C2', [global.eventStartTime, global.eventEndTime]);

            console.log('Event times were not set. Default values have been initialized.');
        } else {
            global.eventStartTime = eventTime.eventStartTime;
            global.eventEndTime = eventTime.eventEndTime;
        }

        global.broadcastChannelId = eventTime.broadcastChannelId;
        console.log('- Loaded additional data from: Event Password sheet:');
        console.log('- Loaded Event Start Time: ', global.eventStartTime);
        console.log('- Loaded Event End Time: ', global.eventEndTime);
        console.log('- Loaded Broadcast Channel ID: ', global.broadcastChannelId);

        console.log('------All Data Populated Successfully------');
    } catch (error) {
        console.error('ERROR: populating data from Google Sheets:', error);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Respond to other messages
client.on('messageCreate', async message => {
    if (message.content === '!roll') {
        const roll = Math.floor(Math.random() * 6) + 1;
        switch (roll) {
            case 1:
                message.reply(`:game_die: You rolled a **${roll}**... That's terrible. :skull:`);
                break;
            case 2:
                message.reply(`:game_die: You rolled a **${roll}**, not great but could be worse! :unamused:`);
                break;
            case 3:
                message.reply(`:game_die: You rolled a **${roll}**, average. :neutral_face:`);
                break;
            case 4:
                message.reply(`:game_die: You rolled a **${roll}**, not bad! :thinking:`);
                break;
            case 5:
                message.reply(`:game_die: You rolled a **${roll}**, now that's what I'm talking about! :saluting_face:`);
                break;
            case 6:
                message.reply(`:game_die: You rolled a **${roll}**! What are you, an *Ironman*?! :rage:`);
                break;
        }
    } else if (message.content === '!snake') {
        const gifUrl = await fetchRandomGif('snake');
        message.reply({ content: gifUrl });
    } else if (message.content === '!ladder') {
        const gifUrl = await fetchRandomGif('ladder fail');
        message.reply({ content: gifUrl });
    } else if (message.content === '!promo') {
        const promoURL = 'https://youtube.com/shorts/d_3e2-UDduU?si=VBCkZs8TQ_krQecs';
        message.reply(`:index_pointing_at_the_viewer: Sign Up for the event! :movie_camera:\n ${promoURL}`);
    } else if (message.content === '!event') {
        if (!global.eventStartTime || !global.eventEndTime) {
            return message.channel.send('Event times are not set yet.');
        }

        try {
            const eventStartTimestamp = `<t:${Math.floor(moment(global.eventStartTime).unix())}:F>`;
            const eventEndTimestamp = `<t:${Math.floor(moment(global.eventEndTime).unix())}:F>`;

            const imagePath = path.join(__dirname, 'src/images/other/eventLogo.png');

            const { embed, attachment } = await createEmbed({
                command: 'event',
                title: 'Snakes and Ladders',
                description: 'Snakes and Ladders is a classic board game where players navigate a game board with numbered squares. The objective is to reach the last square by moving according to the roll of a dice, while encountering snakes that send you back and ladders that move you forward.',
                fields: [
                    { name: 'Event Start Time', value: eventStartTimestamp, inline: true },
                    { name: 'Event End Time', value: eventEndTimestamp, inline: true }
                ],
                imageUrl: imagePath,
                color: '#00FF00',
                channelId: message.channel.id,
                messageId: message.id,
                client: client
            });

            const replyOptions = { embeds: [embed] };
            if (attachment) {
                replyOptions.files = [attachment];
            }

            message.channel.send(replyOptions);
        } catch (error) {
            console.error('Error creating embed:', error);
            message.channel.send('There was an error creating the event embed.');
        }
    } else if (message.content === '!board') {
        try {
            const imageUrl = 'https://imgur.com/a/0FpCe46';
    
            const { embed } = await createEmbed({
                command: 'board',
                title: 'Snakes and Ladders Board',
                description: 'Here is the current Snakes and Ladders board for the event.',
                imageUrl: imageUrl,
                color: '#00FF00',
                channelId: message.channel.id,
                messageId: message.id,
                client: client
            });
    
            message.channel.send({ embeds: [embed] });

            message.channel.send(replyOptions);
        } catch (error) {
            console.error('Error creating embed:', error);
            message.channel.send('There was an error creating the event embed.');
        }
    } else if (message.content === '!wom') {
        const womUrl = process.env.WOM_URL;
        if (womUrl) {
            message.reply(`Check out the Wise Old Man Competition here: ${womUrl}`);
        } else {
            message.reply('Wise Old Man Competition TBD');
        }
    }
});

async function fetchRandomGif(tag) {
    const apiKey = process.env.GIPHY_API_KEY;
    const url = `https://api.giphy.com/v1/gifs/random?api_key=${apiKey}&tag=${tag}&rating=G`;
    try {
        const response = await axios.get(url);
        return response.data.data.images.original.url;
    } catch (error) {
        console.error('Error fetching GIF:', error);
        return 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif'; // Fallback GIF
    }
}

// OAuth2 setup
const app = express();
const port = process.env.PORT || 3000;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = `${process.env.BASE_URL}/callback`;

app.get('/login', (req, res) => {
    const authorizeUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=bot`;
    res.redirect(authorizeUrl);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token, expires_in } = response.data;
        process.env.ACCESS_TOKEN = access_token;
        process.env.REFRESH_TOKEN = refresh_token;
        process.env.TOKEN_EXPIRY = Date.now() + expires_in * 1000;

        const userInfo = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        res.json(userInfo.data);
    } catch (error) {
        console.error('Error during OAuth2 flow:', error);
        res.status(500).send('An error occurred during the OAuth2 flow.');
    }
});

async function refreshToken() {
    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: process.env.REFRESH_TOKEN
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token, expires_in } = response.data;
        process.env.ACCESS_TOKEN = access_token;
        process.env.REFRESH_TOKEN = refresh_token;
        process.env.TOKEN_EXPIRY = Date.now() + expires_in * 1000;
    } catch (error) {
        console.error('Error refreshing token:', error);
    }
}

async function ensureValidToken() {
    if (Date.now() >= process.env.TOKEN_EXPIRY) {
        await refreshToken();
    }
}

app.listen(port, () => {
    console.log(`OAuth2 app listening at http://localhost:${port}`);
});

client.login(process.env.DISCORD_TOKEN);