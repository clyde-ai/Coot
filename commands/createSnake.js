const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../src/utils/embeds');
const googleSheets = require('../src/utils/googleSheets');
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
            const { embed } = await createEmbed({
                command: 'create-snake',
                title: ':x: Permission Denied',
                description: 'You do not have permission to use this command.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed] });
        }

        const headTile = interaction.options.getInteger('head');
        const tailTile = interaction.options.getInteger('tail');

        if (isNaN(headTile) || isNaN(tailTile)) {
            const { embed } = await createEmbed({
                command: 'create-snake',
                title: ':x: Invalid Input',
                description: 'Both parameters must be valid tile numbers.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed] });
        }

        if (headTile <= tailTile) {
            const { embed } = await createEmbed({
                command: 'create-snake',
                title: ':x: Invalid Tile Numbers',
                description: 'The head tile number must be greater than the tail tile number.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed] });
        }

        // Store the snake in memory
        snakes.push({ head: headTile, tail: tailTile });

        try {
            // Append the snake to the Google Sheet
            const snakeData = [headTile, tailTile, interaction.user.displayName, new Date().toISOString()];
            await googleSheets.writeToSheet('Snakes', snakeData);

            const { embed } = await createEmbed({
                command: 'create-snake',
                title: ':snake: Snake Created',
                description: `Snake created: from tile **${headTile}** to tile **${tailTile}**.`,
                color: '#00FF00',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error writing to Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'create-snake',
                title: ':x: Error',
                description: 'There was an error updating the Google Sheet. Please try again later.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed] });
        }
    },
    getSnakes() {
        return snakes;
    },
    clearSnakes() {
        snakes.length = 0;
    }
};
