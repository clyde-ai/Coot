const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
let eventPassword = '';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-event-password')
        .setDescription('Set the event password for submissions')
        .addStringOption(option => 
            option.setName('password')
                .setDescription('The event password to set')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply('You do not have permission to use this command.');
        }

        const password = interaction.options.getString('password');
        eventPassword = password;

        await interaction.reply(`Event password has been set successfully.`);
    },
    getEventPassword() {
        return eventPassword;
    }
};
