const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../src/utils/embeds'); // Adjust the path as necessary
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
            const { embed } = await createEmbed({
                command: 'create-ladder',
                title: ':face_with_raised_eyebrow: Permission Denied',
                description: 'You do not have permission to use this command.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed] });
        }

        const bottomTile = interaction.options.getInteger('bottom');
        const topTile = interaction.options.getInteger('top');

        if (isNaN(bottomTile) || isNaN(topTile)) {
            const { embed } = await createEmbed({
                command: 'create-ladder',
                title: ':x: Invalid Input',
                description: 'Both parameters must be valid tile numbers.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed] });
        }

        if (bottomTile >= topTile) {
            const { embed } = await createEmbed({
                command: 'create-ladder',
                title: ':x: Invalid Tile Numbers',
                description: 'The bottom tile number must be lower than the top tile number.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed] });
        }

        // Store the ladder in memory
        ladders.push({ bottom: bottomTile, top: topTile });

        const { embed } = await createEmbed({
            command: 'create-ladder',
            title: ':ladder: Ladder Created',
            description: `Ladder created: from tile **${bottomTile}** to tile **${topTile}**.`,
            color: '#00FF00',
            channelId: interaction.channelId,
            messageId: interaction.id,
            client: interaction.client
        });
        await interaction.reply({ embeds: [embed] });
    },
    getLadders() {
        return ladders;
    },
    clearLadders() {
        ladders.length = 0;
    }
};
