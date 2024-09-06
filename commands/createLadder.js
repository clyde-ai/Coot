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
                .setDescription('The bottom tile number of the ladder')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('top')
                .setDescription('The top tile number of the ladder')
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

        // Store the ladder in memory
        ladders.push({ bottom: bottomTile, top: topTile });

        try {
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
    getLadders() {
        return ladders;
    },
    clearLadders() {
        ladders.length = 0;
    }
};
