const { SlashCommandBuilder } = require('@discordjs/builders');
const googleSheets = require('../src/utils/googleSheets');
const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../src/utils/embeds');
const { getTeams, loadTeamsFromSheet } = require('./createTeam');

let teams = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-team')
        .setDescription('Delete a specified team or all teams')
        .addStringOption(option => 
            option.setName('teamname')
                .setDescription('The name of the team to delete or "ALL" to delete all teams')
                .setRequired(true)),
    async execute(interaction) {
        // Check for admin role or admin permissions
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
        // Reply with Access Denied due to no admin role or permissions
        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'clear-team',
                title: ':x: Access Denied :x:',
                description: 'You do not have permission to use this command.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        // Assign value from interation for team name
        const teamName = interaction.options.getString('teamname');

        // Load current teams from Teams Google Sheet
        await loadTeamsFromSheet();
        teams = await getTeams();
        // Delete all teams
        if (teamName.toUpperCase() === 'ALL') {
            for (const team in teams) {
                const role = interaction.guild.roles.cache.get(teams[team].roleId);
                if (role) {
                    for (const id of teams[team].members) {
                        const member = interaction.guild.members.cache.get(id);
                        if (member) {
                            await member.roles.remove(role).catch(console.error);
                        }
                    }
                    await role.delete('All teams deleted by command').catch(console.error);
                }
                delete teams[team];
            }
            // Clear the Google Sheet
            try {
                await googleSheets.clearSheet('Teams!A2:G');
                const { embed } = await createEmbed({
                    command: 'clear-team',
                    title: ':white_check_mark: All Teams Deleted :white_check_mark:',
                    description: 'All teams have been successfully deleted.',
                    color: '#00FF00',
                    channelId: interaction.channelId,
                    messageId: interaction.id,
                    client: interaction.client
                });
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                // Reply if Google Sheets update error
                console.error(`Error updating Google Sheets: ${error.message}`);
                const { embed } = await createEmbed({
                    command: 'clear-team',
                    title: ':x: Google Sheets Error :x:',
                    description: 'There was an error updating the Google Sheet. Please try again later.',
                    color: '#FF0000',
                    channelId: interaction.channelId,
                    messageId: interaction.id,
                    client: interaction.client
                });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } else {
            // Delete a specific team
            const team = teams[teamName];
            // Reply if team does not exist
            if (!team) {
                const { embed } = await createEmbed({
                    command: 'clear-team',
                    title: ':x: Team Not Found :x:',
                    description: `Team ${teamName} does not exist.`,
                    color: '#FF0000',
                    channelId: interaction.channelId,
                    messageId: interaction.id,
                    client: interaction.client
                });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            // Reply if team role is not found
            const role = interaction.guild.roles.cache.get(team.roleId);
            if (!role) {
                const { embed } = await createEmbed({
                    command: 'clear-team',
                    title: ':x: Role Not Found :x:',
                    description: 'The role for this team does not exist.',
                    color: '#FF0000',
                    channelId: interaction.channelId,
                    messageId: interaction.id,
                    client: interaction.client
                });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Remove the role from all team members
            for (const id of team.members) {
                const member = interaction.guild.members.cache.get(id);
                if (member) {
                    await member.roles.remove(role).catch(console.error);
                }
            }

            // Delete the role
            await role.delete('Team deleted by command').catch(console.error);

            // Update the Google Sheet
            let existingTeams;
            try {
                existingTeams = await googleSheets.readSheet('Teams!A:G');
                const teamIndex = existingTeams.slice(1).findIndex(row => row[0] === teamName) + 1;

                if (teamIndex !== 0) {
                    await googleSheets.deleteRow('Teams', teamIndex + 1);
                }

                const { embed } = await createEmbed({
                    command: 'clear-team',
                    title: `:white_check_mark: Team ${teamName} Deleted :white_check_mark:`,
                    description: `Team ${teamName} has been successfully deleted.`,
                    color: '#00FF00',
                    channelId: interaction.channelId,
                    messageId: interaction.id,
                    client: interaction.client
                });
                // Remove the team from the teams object
                delete teams[teamName];

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                // Reply if Google Sheets update error
                console.error(`Error updating Google Sheets: ${error.message}`);
                const { embed } = await createEmbed({
                    command: 'clear-team',
                    title: ':x: Google Sheets Error :x:',
                    description: 'There was an error updating the Google Sheet. Please try again later.',
                    color: '#FF0000',
                    channelId: interaction.channelId,
                    messageId: interaction.id,
                    client: interaction.client
                });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};
