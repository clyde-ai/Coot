require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const googleSheets = require('./src/utils/googleSheets'); // Import the googleSheets module

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
    require('./deploy-commands'); // Run the deployment script

    // Initialize Google Sheets with headers
    try {
        const teamHeaders = ['Team Name', 'Members', 'Date Created'];
        const rollHeaders = ['Team Name', 'Action', 'Roll', 'New Tile', 'Timestamp'];
        const submissionHeaders = ['Team Name', 'Action', 'Tile Number', 'Proof URL', 'Timestamp'];

        await googleSheets.setHeaders('Teams', teamHeaders);
        await googleSheets.setHeaders('Rolls', rollHeaders);
        await googleSheets.setHeaders('Submissions', submissionHeaders);

        console.log('Headers set successfully.');
    } catch (error) {
        console.error('Error setting headers:', error);
    }
});

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

client.login(process.env.DISCORD_TOKEN);
