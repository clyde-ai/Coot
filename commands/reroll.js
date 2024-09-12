const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');
const googleSheets = require('../src/utils/googleSheets');
const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../src/utils/embeds');
const path = require('path');
const tiles = require('../src/tiles');

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
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'reroll',
                title: ':x: Permission Denied',
                description: 'You do not have permission to use this command.\n If you need a reroll ping an event admin.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const teamName = interaction.options.getString('teamname');
        const teams = createTeam.getTeams();
        const team = teams[teamName];

        if (!team) {
            const { embed } = await createEmbed({
                command: 'reroll',
                title: ':x: Team Not Found :x:',
                description: `Team ${teamName} does not exist.`,
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Fetch the current tile from the Teams sheet
        let existingTeams;
        try {
            existingTeams = await googleSheets.readSheet('Teams!A:F');
            const teamRow = existingTeams.slice(1).find(row => row[0] === teamName);
            if (teamRow) {
                team.currentTile = parseInt(teamRow[4], 10);
                team.previousTile = parseInt(teamRow[5], 10);
            } else {
                throw new Error('Team not found in Google Sheets');
            }
        } catch (error) {
            console.error(`Error reading from Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'reroll',
                title: ':x: Google Sheets Error :x:',
                description: ':rage: There was an error reading the Google Sheet. Please ping Clyde or an admin.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        let newTile = team.previousTile + roll;

        // Check if roll is the last tile, if exceeds then set to last tile.
        const lastTile = Math.max(...tiles.map(t => t.tileNumber));
        if (newTile >= lastTile) {
            newTile = lastTile;
        }

        const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);

        // Fetch ladders and snakes from Google Sheets
        let ladders = [];
        let snakes = [];
        try {
            const laddersData = await googleSheets.readSheet('Ladders!A:B'); // Assuming ladders data is in columns A and B
            ladders = laddersData.slice(1).map(row => ({ bottom: parseInt(row[0], 10), top: parseInt(row[1], 10) }));

            const snakesData = await googleSheets.readSheet('Snakes!A:B'); // Assuming snakes data is in columns A and B
            snakes = snakesData.slice(1).map(row => ({ head: parseInt(row[0], 10), tail: parseInt(row[1], 10) }));
        } catch (error) {
            console.error(`Error reading ladders or snakes from Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'reroll',
                title: ':x: Google Sheets Error :x:',
                description: ':rage: There was an error reading the Ladders or Snakes sheet. Please ping Clyde or an admin.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check for ladders and snakes
        const ladder = ladders.find(l => l.bottom === newTile);
        let landedOnLadder = false;
        let landedOnSnake = false;
        if (ladder) {
            newTile = ladder.top;
            landedOnLadder = true;
        } else {
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

            // Update the Teams sheet with the new tile position and previous tile
            const teamIndex = existingTeams.slice(1).findIndex(row => row[0] === teamName) + 1; // Skip header row

            if (teamIndex !== 0) {
                await googleSheets.updateSheet('Teams', `E${teamIndex + 1}`, [newTile]); // Update currentTile in the fifth column
                await googleSheets.updateSheet('Teams', `F${teamIndex + 1}`, [previousTile]); // Update previousTile in the sixth column
            }

            let description = `${userMention} rolled **${roll}**. ${teamRoleMention} moves to tile **${newTile}**.\n **${tileDescription}**`;
            if (landedOnLadder) {
                description = `${userMention} rolled **${roll}** and landed on a ladder! :ladder: After climbing up, ${teamRoleMention} moves to tile **${newTile}**.\n **${tileDescription}**`;
            } else if (landedOnSnake) {
                description = `${userMention} rolled **${roll}** and landed on the head of a snake! :snake: Sliding back down, ${teamRoleMention} moves to tile **${newTile}**.\n **${tileDescription}**`;
            } else if (newTile === lastTile) {
                description = `${userMention} rolled the last roll! ${teamRoleMention} moves to the final tile **${newTile}**.\n **${tileDescription}**`;
            }

            const { embed, attachment } = await createEmbed({
                command: 'reroll',
                title: ':game_die: Dice Reroll :game_die:',
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
                title: ':x: Google Sheets Error :x:',
                description: ':rage: There was an error updating the Google Sheet. Please ping Clyde or an admin.',
                color: '#ff0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
