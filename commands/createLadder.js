const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../src/utils/embeds');
const googleSheets = require('../src/utils/googleSheets');
const ladders = [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-ladder')
        .setDescription('Create a ladder with a bottom and top tile number')
        .addIntegerOption(option => 
            option.setName('bottom')
                .setDescription('The bottom tile number of the ladder (e.g. 10)')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('top')
                .setDescription('The top tile number of the ladder (e.g. 15)')
                .setRequired(true)),
    async execute(interaction) {
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'create-ladder',
                title: ':x: Permission Denied :x:',
                description: 'You do not have permission to use this command.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const bottomTile = interaction.options.getInteger('bottom');
        const topTile = interaction.options.getInteger('top');

        if (isNaN(bottomTile) || isNaN(topTile)) {
            const { embed } = await createEmbed({
                command: 'create-ladder',
                title: ':x: Invalid Input :x:',
                description: 'Both parameters must be valid tile numbers.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (bottomTile >= topTile) {
            const { embed } = await createEmbed({
                command: 'create-ladder',
                title: ':x: Invalid Tile Numbers :x:',
                description: 'The bottom tile number must be lower than the top tile number.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            // Read existing ladders from the Google Sheet
            const existingLadders = await googleSheets.readSheet('Ladders!A:B');
            const ladderExists = existingLadders.some(row => 
                parseInt(row[0], 10) === bottomTile || 
                parseInt(row[1], 10) === topTile || 
                parseInt(row[0], 10) === topTile || 
                parseInt(row[1], 10) === bottomTile
            );

            if (ladderExists) {
                const { embed } = await createEmbed({
                    command: 'create-ladder',
                    title: ':x: Ladder Exists :x:',
                    description: 'A ladder with the same bottom or top tile numbers already exists.',
                    color: '#FF0000',
                    channelId: interaction.channelId,
                    messageId: interaction.id,
                    client: interaction.client
                });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Store the ladder in memory
            ladders.push({ bottom: bottomTile, top: topTile });

            // Append the ladder to the Google Sheet
            const ladderData = [bottomTile, topTile, interaction.user.displayName, new Date().toISOString()];
            await googleSheets.writeToSheet('Ladders', ladderData);

            const { embed } = await createEmbed({
                command: 'create-ladder',
                title: ':ladder: Ladder Created :ladder:',
                description: `Ladder created: from tile **${bottomTile}** to tile **${topTile}**.`,
                color: '#00FF00',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error writing to Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'create-ladder',
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
    getLadders: async function() {
        try {
            const laddersData = await googleSheets.readSheet('Ladders!A:B'); // Assuming ladders data is in columns A and B
            return laddersData.slice(1).map(row => ({ bottom: parseInt(row[0], 10), top: parseInt(row[1], 10) }));
        } catch (error) {
            console.error(`Error reading ladders from Google Sheets: ${error.message}`);
            return [];
        }
    },
    clearLadders: async function() {
        try {
            // Clear all data except headers in the Ladders sheet
            await googleSheets.clearSheet('Ladders!A2:B'); // Assuming headers are in the first row

            // Clear the in-memory ladders array
            ladders.length = 0;

            console.log('Ladders sheet cleared successfully.');
        } catch (error) {
            console.error(`Error clearing Ladders sheet: ${error.message}`);
        }
    }
};
