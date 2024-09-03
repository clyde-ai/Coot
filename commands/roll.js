const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');
const createLadder = require('./createLadder');
const createSnake = require('./createSnake');
const googleSheets = require('../src/utils/googleSheets');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll a 6-sided dice'),
    async execute(interaction) {
        const teams = createTeam.getTeams();
        const teamEntry = Object.entries(teams).find(([_, t]) => t.members.includes(interaction.user.id));

        if (!teamEntry) {
            return interaction.reply('You are not part of any team.');
        }

        const [teamName, team] = teamEntry;

        if (team.currentTile !== 0 && !team.canRoll) {
            return interaction.reply('Your team has not submitted proof for the current tile.');
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        let newTile = team.currentTile + roll;

        const userMention = `<@${interaction.user.id}>`;
        const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);

        // Check for ladders and snakes
        const ladders = createLadder.getLadders();
        const ladder = ladders.find(l => l.bottom === newTile);
        if (ladder) {
            newTile = ladder.top;
        } else {
            const snakes = createSnake.getSnakes();
            const snake = snakes.find(s => s.head === newTile);
            if (snake) {
                newTile = snake.tail;
            }
        }

        // Update the team's current tile
        team.currentTile = newTile;
        team.canRoll = false; // Reset the roll permission until the next proof is submitted

        try {
            // Write to the Rolls sheet
            const rollData = [teamName, 'Roll', roll, newTile, new Date().toISOString()];
            await googleSheets.writeToSheet('Rolls', rollData);

            await interaction.reply(`${userMention} rolled ${roll}. ${teamRoleMention} moves to tile ${newTile}.`);
        } catch (error) {
            console.error(`Error writing to Google Sheets: ${error.message}`);
            await interaction.reply('There was an error updating the Google Sheet. Please try again later.');
        }
    },
};
