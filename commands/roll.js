const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');
const createLadder = require('./createLadder');
const createSnake = require('./createSnake');
const tiles = require('../src/tiles');

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

        // Allow rolling if it's the first tile
        if (team.currentTile !== 0 && !team.canRoll) {
            return interaction.reply('Your team has not submitted proof for the current tile.');
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        let newTile = team.currentTile + roll;

        const userMention = `<@${interaction.user.id}>`;
        const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);

        // Check if the new tile is a ladder bottom
        const ladders = createLadder.getLadders();
        const ladder = ladders.find(l => l.bottom === newTile);

        if (ladder) {
            newTile = ladder.top;
            await interaction.reply(`${userMention} rolled ${roll}. ${teamRoleMention} landed on a ladder! Climbing from tile ${team.currentTile} to tile ${newTile}. ${getTileDetails(newTile)}`);
        } else {
            // Check if the new tile is a snake head
            const snakes = createSnake.getSnakes();
            const snake = snakes.find(s => s.head === newTile);

            if (snake) {
                newTile = snake.tail;
                await interaction.reply(`${userMention} rolled ${roll}. ${teamRoleMention} landed on a snake! Moving from tile ${team.currentTile} to tile ${newTile}. ${getTileDetails(newTile)}`);
            } else {
                await interaction.reply(`${userMention} rolled ${roll}. ${teamRoleMention} moves from tile ${team.currentTile} to tile ${newTile}. ${getTileDetails(newTile)}`);
            }
        }

        // Update the team's current tile
        team.currentTile = newTile;
        team.canRoll = false; // Reset the roll permission until the next proof is submitted
    },
};

function getTileDetails(tileNumber) {
    const tile = tiles.find(t => t.tileNumber === tileNumber);
    if (!tile) return 'Tile details not found.';
    return `Description: ${tile.description}\nImage: ${tile.image}`;
}
