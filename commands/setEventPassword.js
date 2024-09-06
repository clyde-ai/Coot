const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../src/utils/embeds');
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
    },
    getEventPassword() {
        return eventPassword;
    }
};
