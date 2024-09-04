const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { clearLadders } = require('./createLadder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-ladders')
        .setDescription('Remove all ladders from the board')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply('You do not have permission to use this command.');
        }

        clearLadders();
        await interaction.reply('All ladders have been removed from the board.');
    }
};
