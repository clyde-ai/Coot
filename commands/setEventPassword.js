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
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const { embed } = await createEmbed({
                command: 'set-event-password',
                title: ':face_with_raised_eyebrow: Permission Denied',
                description: 'You do not have permission to use this command.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed] });
        }

        const password = interaction.options.getString('password');
        eventPassword = password;

        const { embed } = await createEmbed({
            command: 'set-event-password',
            title: ':lock: Event Password Set',
            description: ':white_check_mark: Event password has been set successfully.',
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
