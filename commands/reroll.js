const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');
const createLadder = require('./createLadder');
const createSnake = require('./createSnake');
const tiles = require('../src/tiles');
const googleSheets = require('../src/utils/googleSheets');
const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../src/utils/embeds');
const fs = require('fs');
const path = require('path');

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
            return interaction.reply(':x: You do not have permission to use this command.');
        }

        const teamName = interaction.options.getString('teamname');
        const teams = createTeam.getTeams();
        const team = teams[teamName];

        if (!team) {
            return interaction.reply(`:x: Team ${teamName} does not exist.`);
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
        createTeam.resetCanRoll(teamName);

        // Get tile description and image
        const tile = tiles.find(t => t.tileNumber === newTile);
        const tileDescription = tile ? tile.description : 'No description available';
        const tileImage = tile ? tile.image : null;

        const memberName = interaction.member.displayName;

        try {
            // Write to the Rolls sheet
            const rollData = [teamName, memberName, 'Reroll', roll, previousTile, newTile, new Date().toISOString()];
            await googleSheets.writeToSheet('Rolls', rollData);

            await googleSheets.sortSheet('Rolls', 'A', 'asc'); // Sort by Team Name

            let description = `Reroll for ${teamRoleMention}: rolled **${roll}**. Moves to tile **${newTile}**.\n **${tileDescription}**`;
            if (landedOnLadder) {
                description = `Reroll for ${teamRoleMention}: rolled **${roll}** and landed on a ladder! :ladder: After climbing up, moves to tile **${newTile}**.\n **${tileDescription}**`;
            } else if (landedOnSnake) {
                description = `Reroll for ${teamRoleMention}: rolled **${roll}** and landed on the head of a snake! :snake: Sliding back down, moves to tile **${newTile}**.\n **${tileDescription}**`;
            }

            const { embed, attachment } = await createEmbed({
                command: 'reroll',
                title: ':game_die: Dice Reroll',
                description,
                imageUrl: tileImage ? path.join(__dirname, '..', tileImage) : null,
                color: '#8000ff',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });

            const replyOptions = { embeds: [embed] };
            if (attachment) {
                replyOptions.files = [attachment];
            }

            await interaction.reply(replyOptions);
        } catch (error) {
            console.error(`Error writing to Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'reroll',
                title: ':x: Google Sheets Error',
                description: ':rage: There was an error updating the Google Sheet. Please ping Clyde or an admin.',
                color: '#ff0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed] });
        }
    },
};
