const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');
const googleSheets = require('../src/utils/googleSheets');
const { createEmbed } = require('../src/utils/embeds');
const path = require('path');
const tiles = require('../src/tiles');
const { getEventTime, isEventActive } = require('./setEventTime');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll a 6-sided dice'),
    async execute(interaction) {
        // Defer the reply to give more time for processing
        await interaction.deferReply();

        // Check if the event is active
        const { eventStartTime, eventEndTime } = await getEventTime();
        if (!isEventActive()) {
            const { embed } = await createEmbed({
                command: 'roll',
                title: ':x: Event Not Active :x:',
                description: '**The event has not started yet or has already ended. Please wait for the event to start.**',
                color: '#ff0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        console.log(`isEventActive?: ${isEventActive()}`);

        await createTeam.loadTeamsFromSheet();
        const teams = createTeam.getTeams();
        console.log(`teams: ${JSON.stringify(teams)}`);
        const teamEntry = Object.entries(teams).find(([_, t]) => t.members.includes(interaction.user.id));
        console.log(`teamEntry: ${teamEntry}`);

        if (!teamEntry) {
            const { embed } = await createEmbed({
                command: 'roll',
                title: ':x: Player Not In A Team :x:',
                description: '**You are not part of any team, ping an event admin for assistance.**',
                color: '#ff0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        const [teamName, team] = teamEntry;
        const teamRole = interaction.guild.roles.cache.get(team.roleId);
        const teamRoleMention = `<@&${team.roleId}>`;

        // Fetch the current tile and canRoll status from the Teams sheet
        let existingTeams;
        try {
            existingTeams = await googleSheets.readSheet('Teams!A:G');
        } catch (error) {
            console.error(`Error reading from Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'roll',
                title: ':x: Google Sheets Error :x:',
                description: ':rage: There was an error reading the Google Sheet. Please ping Clyde or an admin.',
                color: '#ff0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        console.log(`existingTeams: ${existingTeams}`);
        const teamRow = existingTeams.slice(1).find(row => row[0] === teamName);
        console.log(`teamRow: ${teamRow}`);
        if (teamRow) {
            team.currentTile = parseInt(teamRow[4], 10);
            team.canRoll = teamRow[6] === 'TRUE';
        }
        if (team.currentTile !== 0 && !team.canRoll) {
            team.currentTile = parseInt(teamRow[4], 10);
            let tile = tiles.find(t => t.tileNumber === team.currentTile);
            let tileDescription = tile ? tile.description : 'No description available';
            console.log(`team.canRoll: ${team.canRoll}`);
            const { embed } = await createEmbed({
                command: 'roll',
                title: `:x: ${teamRole.name} Cannot Roll :x:`,
                description: `**Your team has not submitted all required proof for tile: ${team.currentTile}**\n **${tileDescription}**`,
                color: '#ff0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        let newTile = team.currentTile + roll;

        // Check if roll is the last tile, if exceeds then set to last tile.
        const lastTile = Math.max(...tiles.map(t => t.tileNumber));
        if (newTile >= lastTile) {
            newTile = lastTile;
        }

        const userMention = `<@${interaction.user.id}>`;

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
                command: 'roll',
                title: ':x: Google Sheets Error :x:',
                description: ':rage: There was an error reading the Ladders or Snakes sheet. Please ping Clyde or an admin.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.editReply({ embeds: [embed], ephemeral: true });
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

        const previousTile = team.currentTile;
        await createTeam.updateTeamTile(teamName, newTile);
        await createTeam.resetCanRoll(teamName);

        // Get tile description and image
        let tile = tiles.find(t => t.tileNumber === newTile);
        let tileDescription = tile ? tile.description : 'No description available';
        const tileImage = tile ? tile.image : null;

        const memberName = interaction.member.displayName;

        try {
            // Write to the Rolls sheet
            const rollData = [teamName, memberName, 'Roll', roll, previousTile, newTile, new Date().toISOString()];
            console.log(`rollData: ${rollData}`);
            await googleSheets.writeToSheet('Rolls', rollData);

            await googleSheets.sortSheet('Rolls', 'A', 'asc'); // Sort by Team Name

            // Update the Teams sheet with the new tile position and previous tile
            const teamIndex = existingTeams.slice(1).findIndex(row => row[0] === teamName) + 1; // Skip header row

            if (teamIndex !== 0) {
                await googleSheets.updateSheet('Teams', `E${teamIndex + 1}`, [newTile]); // Update currentTile in the fifth column
                await googleSheets.updateSheet('Teams', `F${teamIndex + 1}`, [previousTile]); // Update previousTile in the sixth column
            }

            const ladderPhrases = [
                "Sam and Shordi are on your team",
                "Got a Renatus Discount Boost",
                "Auto-Leviathan prayers activated",
                "@ angry iron man"
            ];

            const snakePhrases = [
                "Legacy Crabs",
                "100 purples to get a Shadow",
                "No 99 No Gz",
            ];

            const legacyEmoji = "<:Legacy:957020131924525066>";

            let description = `${userMention} rolled **${roll}**.\n ${teamRoleMention} moves to tile **${newTile}**.\n **${tileDescription}**`;

            if (landedOnLadder) {
                const randomPhrase = ladderPhrases[Math.floor(Math.random() * ladderPhrases.length)];
                description = `${userMention} rolled **${roll}**.\n ${legacyEmoji}**${randomPhrase}**${legacyEmoji}\n :ladder: You moved to a ladder! :ladder:\n After climbing up, ${teamRoleMention} moves to tile **${newTile}**.\n **${tileDescription}**`;
            } else if (landedOnSnake) {
                const randomPhrase = ladderPhrases[Math.floor(Math.random() * snakePhrases.length)];
                description = `${userMention} rolled **${roll}**.\n ${legacyEmoji}**${randomPhrase}**${legacyEmoji}\n :snake: You landed on the head of a snake! :snake:\n Sliding back down, ${teamRoleMention} moves to tile **${newTile}**.\n **${tileDescription}**`;
            } else if (newTile === lastTile) {
                description = `${userMention} rolled the last roll!\n ${legacyEmoji}${teamRoleMention} moves to the final tile **${newTile}**.${legacyEmoji}\n **${tileDescription}**`;
            }

            const { embed, attachment } = await createEmbed({
                command: 'roll',
                title: ':game_die: Dice Roll :game_die:',
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

            interaction.editReply(replyOptions);
        } catch (error) {
            console.error(`Error writing to Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'roll',
                title: ':x: Google Sheets Error :x:',
                description: ':rage: There was an error updating the Google Sheet. Please ping Clyde or an admin.',
                color: '#ff0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
