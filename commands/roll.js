const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');
const createLadder = require('./createLadder');
const createSnake = require('./createSnake');
const tiles = require('../src/tiles');
const googleSheets = require('../src/utils/googleSheets');
const { createEmbed } = require('../src/utils/embeds');
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
            const { embed } = await createEmbed({
                command: 'roll',
                title: ':x: User is not on a team',
                description: ':x: You are not part of any team, ping an event admin for assistance.',
                color: '#ff0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed] });
        }

        const [teamName, team] = teamEntry;
        const teamRole = interaction.guild.roles.cache.get(team.roleId);
        const teamRoleMention = `<@&${team.roleId}>`;

        if (team.currentTile !== 0 && !team.canRoll) {
            const { embed } = await createEmbed({
                command: 'roll',
                title: `:x: ${teamRole.name} Cannot Roll`,
                description: `:x: Your team has not submitted proof for the current assigned tile: ${team.currentTile}`,
                color: '#ff0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed] });
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        let newTile = team.currentTile + roll;

        const userMention = `<@${interaction.user.id}>`;

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

            let description = `${userMention} rolled **${roll}**. ${teamRoleMention} moves to tile **${newTile}**.\n **${tileDescription}**`;
            if (landedOnLadder) {
                description = `${userMention} rolled **${roll}** and landed on a ladder! :ladder: After climbing up, ${teamRoleMention} moves to tile **${newTile}**.\n **${tileDescription}**`;
            } else if (landedOnSnake) {
                description = `${userMention} rolled **${roll}** and landed on the head of a snake! :snake: Sliding back down, ${teamRoleMention} moves to tile **${newTile}**.\n **${tileDescription}**`;
            }

            const { embed, attachment } = await createEmbed({
                command: 'roll',
                title: ':game_die: Dice Roll',
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
                command: 'roll',
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
