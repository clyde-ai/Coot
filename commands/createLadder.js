const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const ladders = [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-ladder')
        .setDescription('Create a ladder with a bottom and top tile number')
        .addIntegerOption(option => 
            option.setName('bottom')
                .setDescription('The bottom tile number of the ladder')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('top')
                .setDescription('The top tile number of the ladder')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply(':face_with_raised_eyebrow: You do not have permission to use this command.');
        }

        const bottomTile = interaction.options.getInteger('bottom');
        const topTile = interaction.options.getInteger('top');

        if (isNaN(bottomTile) || isNaN(topTile)) {
            return interaction.reply(':face_with_raised_eyebrow: Both parameters must be valid tile numbers.');
        }

        if (bottomTile >= topTile) {
            return interaction.reply(':face_with_raised_eyebrow: The bottom tile number must be lower than the top tile number.');
        }

        // Store the ladder in memory
        ladders.push({ bottom: bottomTile, top: topTile });

        await interaction.reply(`:ladder: Ladder created: from tile ${bottomTile} to tile ${topTile}.`);
    },
    getLadders() {
        return ladders;
    },
    clearLadders() {
        ladders.length = 0;
    }
};
