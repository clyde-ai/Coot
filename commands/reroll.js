const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');
const createLadder = require('./createLadder');
const createSnake = require('./createSnake');
const tiles = require('../src/tiles'); // Import the tiles module
const googleSheets = require('../src/utils/googleSheets');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reroll')
        .setDescription('Reroll a 6-sided dice for a specified team')
        .addStringOption(option => 
            option.setName('teamname')
                .setDescription('The name of the team')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply('You do not have permission to use this command.');
        }

        const teamName = interaction.options.getString('teamname');
        const teams = createTeam.getTeams();
        const team = teams[teamName];

        if (!team) {
            return interaction.reply(`Team ${teamName} does not exist.`);
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        let newTile = team.previousTile + roll;

        const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);

        // Check for ladders and snakes
        const ladders = createLadder.getLadders();
        const ladder = ladders.find(l => l.bottom === newTile);
        let landedOnLadder = false;
        let landedOnSnake = false;
        if (ladder) {
            newTile = ladder.top;
            landedOnLadder = true;
        } else {
            const snakes = createSnake.getSnakes();
            const snake = snakes.find(s => s.head === newTile);
            if (snake) {
                newTile = snake.tail;
                landedOnSnake = true;
            }
        }

        // Update the team's current tile
        const previousTile = team.previousTile;
        createTeam.updateTeamTile(teamName, newTile);
        createTeam.resetCanRoll(teamName); // Reset the roll permission until the next proof is submitted

        // Get tile description and image
        const tile = tiles.find(t => t.tileNumber === newTile);
        const tileDescription = tile ? tile.description : 'No description available';
        const tileImage = tile ? tile.image : null;

        try {
            // Write to the Rolls sheet
            const rollData = [teamName, 'Reroll', roll, previousTile, newTile, new Date().toISOString()];
            await googleSheets.writeToSheet('Rolls', rollData);

            let replyContent = `Reroll for ${teamRoleMention}: rolled ${roll}. Moves to tile ${newTile}. ${tileDescription}`;
            if (landedOnLadder) {
                replyContent = `Reroll for ${teamRoleMention}: rolled ${roll} and landed on a ladder! After climbing up, moves to tile ${newTile}. ${tileDescription}`;
            } else if (landedOnSnake) {
                replyContent = `Reroll for ${teamRoleMention}: rolled ${roll} and landed on the head of a snake! Sliding back down, moves to tile ${newTile}. ${tileDescription}`;
            }
            const replyOptions = tileImage ? { content: replyContent, files: [tileImage] } : { content: replyContent };

            await interaction.reply(replyOptions);
        } catch (error) {
            console.error(`Error writing to Google Sheets: ${error.message}`);
            await interaction.reply('There was an error updating the Google Sheet. Please try again later.');
        }
    },
};
