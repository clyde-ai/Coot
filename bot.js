require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const googleSheets = require('./src/utils/googleSheets');

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
        const teamHeaders = ['Team Name', 'Members', 'Date Created'];
        const rollHeaders = ['Team Name', 'User Name', 'Action', 'Roll', 'Previous Tile', 'New Tile', 'Timestamp'];
        const submissionHeaders = ['Team Name', 'User Name', 'Tile Number', 'Submission Status', 'Proof URL', 'Timestamp', 'Manual Review Flag'];
        const snakesHeaders = ['Head Tile', 'Tail Tile', 'Created By', 'Timestamp'];
        const laddersHeaders = ['Bottom Tile', 'Top Tile', 'Created By', 'Timestamp'];

        await setHeadersIfNotExist('Teams', teamHeaders);
        await setHeadersIfNotExist('Rolls', rollHeaders);
        await setHeadersIfNotExist('Submissions', submissionHeaders);
        await setHeadersIfNotExist('Snakes', snakesHeaders);
        await setHeadersIfNotExist('Ladders', laddersHeaders);

        console.log('Headers set successfully.');
    } catch (error) {
        console.error('Error setting headers:', error);
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

        const { access_token } = response.data;
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

app.listen(port, () => {
    console.log(`OAuth2 app listening at http://localhost:${port}`);
});

client.login(process.env.DISCORD_TOKEN);
