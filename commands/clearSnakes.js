const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { clearSnakes } = require('./createSnake');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-snakes')
        .setDescription('Remove all snakes from the board')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply('You do not have permission to use this command.');
        }

        clearSnakes();
        await interaction.reply('All snakes have been removed from the board.');
    }
};
