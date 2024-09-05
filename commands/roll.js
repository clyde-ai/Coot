const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');
const createLadder = require('./createLadder');
const createSnake = require('./createSnake');
const tiles = require('../src/tiles');
const googleSheets = require('../src/utils/googleSheets');
const fs = require('fs');
const path = require('path');

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

        const previousTile = team.currentTile;
        createTeam.updateTeamTile(teamName, newTile);
        createTeam.resetCanRoll(teamName);

        // Get tile description and image
        const tile = tiles.find(t => t.tileNumber === newTile);
        const tileDescription = tile ? tile.description : 'No description available';
        const tileImage = tile ? tile.image : null;

        const memberName = interaction.member.displayName;

        try {
            // Write to the Rolls sheet
            const rollData = [teamName, memberName, 'Roll', roll, previousTile, newTile, new Date().toISOString()];
            await googleSheets.writeToSheet('Rolls', rollData);

            await googleSheets.sortSheet('Rolls', 'A', 'asc'); // Sort by Team Name

            let replyContent = `${userMention} rolled ${roll}. ${teamRoleMention} moves to tile ${newTile}. ${tileDescription}`;
            if (landedOnLadder) {
                replyContent = `${userMention} rolled ${roll} and landed on a ladder! After climbing up, ${teamRoleMention} moves to tile ${newTile}. ${tileDescription}`;
            } else if (landedOnSnake) {
                replyContent = `${userMention} rolled ${roll} and landed on the head of a snake! Sliding back down, ${teamRoleMention} moves to tile ${newTile}. ${tileDescription}`;
            }

            const replyOptions = { content: replyContent };
            if (tileImage) {
                const imagePath = path.join(__dirname, '..', tileImage);
                if (fs.existsSync(imagePath)) {
                    replyOptions.files = [imagePath];
                } else {
                    console.warn(`Image file not found: ${imagePath}`);
                }
            }

            await interaction.reply(replyOptions);
        } catch (error) {
            console.error(`Error writing to Google Sheets: ${error.message}`);
            await interaction.reply('There was an error updating the Google Sheet. Please try again later.');
        }
    },
};
