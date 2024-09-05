const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const snakes = [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-snake')
        .setDescription('Create a snake with a head and tail tile number')
        .addIntegerOption(option => 
            option.setName('head')
                .setDescription('The head tile number of the snake')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('tail')
                .setDescription('The tail tile number of the snake')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply(':face_with_raised_eyebrow: You do not have permission to use this command.');
        }

        const headTile = interaction.options.getInteger('head');
        const tailTile = interaction.options.getInteger('tail');

        if (isNaN(headTile) || isNaN(tailTile)) {
            return interaction.reply(':face_with_raised_eyebrow: Both parameters must be valid tile numbers.');
        }

        if (headTile <= tailTile) {
            return interaction.reply(':face_with_raised_eyebrow: The head tile number must be greater than the tail tile number.');
        }

        // Store the snake in memory
        snakes.push({ head: headTile, tail: tailTile });

        await interaction.reply(`:snake: Snake created: from tile ${headTile} to tile ${tailTile}.`);
    },
    getSnakes() {
        return snakes;
    },
    clearSnakes() {
        snakes.length = 0;
    }
};
