const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../src/utils/embeds');
const googleSheets = require('../src/utils/googleSheets');
let eventPassword = '';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-event-password')
        .setDescription('Set the event password for submissions')
        .addStringOption(option => 
            option.setName('password')
                .setDescription('The event password to set (e.g. your_event_password)')
                .setRequired(true)),
    async execute(interaction) {
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'set-event-password',
                title: ':x: Access Denied :x:',
                description: 'You do not have permission to use this command.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const password = interaction.options.getString('password');
        eventPassword = password;

        try {
            // Clear existing entries in the EventPassword sheet
            await googleSheets.clearSheet('EventPassword!A2:A');

            // Write the new password to the sheet
            await googleSheets.updateSheet('EventPassword', 'A2:A', [password]);

            const { embed } = await createEmbed({
                command: 'set-event-password',
                title: ':lock: Event Password Set :lock:',
                description: '**Event password has been set successfully!**',
                color: '#00FF00',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error updating Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'set-event-password',
                title: ':x: Google Sheets Error :x:',
                description: ':rage: There was an error updating the Google Sheet. Please ping Clyde or an admin.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
    async getEventPassword() {
        try {
            const rows = await googleSheets.readSheet('EventPassword!A2:A');
            if (rows.length > 0) {
                eventPassword = rows[0][0];
            } else {
                console.log('Event Password not found, returning empty string.');
                eventPassword = '';
            }
        } catch (error) {
            console.error(`ERROR reading Google Sheets: ${error.message}`);
            eventPassword = '';
        }
        return eventPassword;
    }
};
