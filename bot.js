require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const googleSheets = require('./src/utils/googleSheets');
const { loadTeamsFromSheet } = require('./commands/createTeam');
const { getSnakes } = require('./commands/createSnake');
const { getLadders } = require('./commands/createLadder');
const { getEventPassword } = require('./commands/setEventPassword');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

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
        const teamHeaders = ['Team Name', 'Members', 'Date Created', 'Role ID', 'Current Tile', 'Previous Tile'];
        const rollHeaders = ['Team Name', 'User Name', 'Action', 'Roll', 'Previous Tile', 'New Tile', 'Timestamp'];
        const submissionHeaders = ['Team Name', 'User Name', 'Tile Number', 'Submission Status', 'Proof URL', 'Timestamp', 'Manual Review Flag'];
        const snakesHeaders = ['Head Tile', 'Tail Tile', 'Created By', 'Timestamp'];
        const laddersHeaders = ['Bottom Tile', 'Top Tile', 'Created By', 'Timestamp'];
        const eventPasswordHeaders = ['Password'];

        await setHeadersIfNotExist('Teams', teamHeaders);
        await setHeadersIfNotExist('Rolls', rollHeaders);
        await setHeadersIfNotExist('Submissions', submissionHeaders);
        await setHeadersIfNotExist('Snakes', snakesHeaders);
        await setHeadersIfNotExist('Ladders', laddersHeaders);
        await setHeadersIfNotExist('Event Password', eventPasswordHeaders);

        console.log('Headers set successfully.');

        // Populate data from Google Sheets
        await populateData();

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

// Respond to meme messages
client.on('messageCreate', message => {
    if (message.content === '!roll') {
        const roll = Math.floor(Math.random() * 6) + 1;
        message.reply(`You rolled a ${roll}`);
    } else if (message.content === '!snake') {
        const gifPath = path.join(__dirname, 'src/images/memes/snake.gif');
        message.reply({ files: [gifPath] });
    } else if (message.content === '!ladder') {
        const gifPath = path.join(__dirname, 'src/images/memes/ladder.gif');
        message.reply({ files: [gifPath] });
    }
});

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
