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
        const rollHeaders = ['Team Name', 'Action', 'Roll', 'Previous Tile', 'New Tile', 'Timestamp'];
        const submissionHeaders = ['Team Name', 'User Name', 'Tile Number', 'Proof URL', 'Timestamp'];

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

/* meme stuff
// Respond to mentions of users with the nickname 'Clyde Cooter' or user ID '285252032959348736'
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const mentionedMembers = message.mentions.members;
    if (mentionedMembers.some(member => member.nickname === 'Clyde Cooter')) {
        await message.reply('Still no shadow, dumb iron <:custom_emoji:1066592195538333717>');
    } else if (mentionedMembers.some(member => member.id === '285252032959348736')) {
        await message.reply('Nice clue scrolls, Uri <:clown:1077588545818071161>');
    }
});
*/

client.login(process.env.DISCORD_TOKEN);
