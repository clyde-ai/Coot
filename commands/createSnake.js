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
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasAdminRole || !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'create-snake',
                title: ':x: Access Denied :x:',
                description: 'You do not have permission to use this command.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const headTile = interaction.options.getInteger('head');
        const tailTile = interaction.options.getInteger('tail');

        if (isNaN(headTile) || isNaN(tailTile)) {
            const { embed } = await createEmbed({
                command: 'create-snake',
                title: ':x: Invalid Input :x:',
                description: 'Both parameters must be valid tile numbers.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (headTile <= tailTile) {
            const { embed } = await createEmbed({
                command: 'create-snake',
                title: ':x: Invalid Tile Numbers :x:',
                description: 'The head tile number must be greater than the tail tile number.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            // Read existing snakes from the Google Sheet
            const existingSnakes = await googleSheets.readSheet('Snakes!A:B');
            const snakeExists = existingSnakes.some(row => 
                parseInt(row[0], 10) === headTile || 
                parseInt(row[1], 10) === tailTile || 
                parseInt(row[0], 10) === tailTile || 
                parseInt(row[1], 10) === headTile
            );

            if (snakeExists) {
                const { embed } = await createEmbed({
                    command: 'create-snake',
                    title: ':x: Snake Exists :x:',
                    description: 'A snake with the same head or tail tile numbers already exists.',
                    color: '#FF0000',
                    channelId: interaction.channelId,
                    messageId: interaction.id,
                    client: interaction.client
                });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Store the snake in memory
            snakes.push({ head: headTile, tail: tailTile });

            // Append the snake to the Google Sheet
            const snakeData = [headTile, tailTile, interaction.user.displayName, new Date().toISOString()];
            await googleSheets.writeToSheet('Snakes', snakeData);

            const { embed } = await createEmbed({
                command: 'create-snake',
                title: ':snake: Snake Created :snake:',
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
                title: ':x: Error :x:',
                description: 'There was an error updating the Google Sheet. Please ping Clyde.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
    getSnakes: async function() {
        try {
            const snakesData = await googleSheets.readSheet('Snakes!A:B'); // Assuming snakes data is in columns A and B
            return snakesData.slice(1).map(row => ({ head: parseInt(row[0], 10), tail: parseInt(row[1], 10) }));
        } catch (error) {
            console.error(`Error reading snakes from Google Sheets: ${error.message}`);
            return [];
        }
    },
    clearSnakes: async function() {
        try {
            // Clear all data except headers in the Snakes sheet
            await googleSheets.clearSheet('Snakes!A2:B'); // Assuming headers are in the first row

            // Clear the in-memory snakes array
            snakes.length = 0;

            console.log('Snakes sheet cleared successfully.');
        } catch (error) {
            console.error(`Error clearing Snakes sheet: ${error.message}`);
        }
    }
};
