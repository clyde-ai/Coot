const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { clearSnakes } = require('./createSnake');
const { createEmbed } = require('../src/utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-snakes')
        .setDescription('Removes all snakes from the board'),
    async execute(interaction) {
        // Check for admin role or admin permissions
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
        // Reply with Access Denied due to no admin role or permissions
        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'clear-snakes',
                title: ':x: Access Denied :x:',
                description: 'You do not have permission to use this command.',
                color: '#ff0000'
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        // Clear snakes and reply
        try {
            await clearSnakes();

            const { embed } = await createEmbed({
                command: 'clear-snakes',
                title: ':snake: Snakes Cleared :snake:',
                description: '**All snakes have been removed from the board!** :snake:',
                color: '#00ff00'
            });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error clearing snakes: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'clear-snakes',
                title: ':x: Error :x:',
                description: 'There was an error clearing the snakes. Please ping Clyde.',
                color: '#ff0000'
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
