const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { clearLadders } = require('./createLadder');
const { createEmbed } = require('../src/utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-ladders')
        .setDescription('Remove all ladders from the board'),
    async execute(interaction) {
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'clear-ladders',
                title: ':x: Access Denied :x:',
                description: 'You do not have permission to use this command.',
                color: '#ff0000'
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            await clearLadders();

            const { embed } = await createEmbed({
                command: 'clear-ladders',
                title: ':ladder: Ladders Cleared :ladder:',
                description: '**All ladders have been removed from the board!**',
                color: '#00ff00'
            });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error clearing ladders: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'clear-ladders',
                title: ':x: Error :x:',
                description: 'There was an error clearing the ladders. Please ping Clyde.',
                color: '#ff0000'
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
