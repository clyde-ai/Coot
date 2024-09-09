const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const googleSheets = require('../src/utils/googleSheets');
const { createEmbed } = require('../src/utils/embeds');
const path = require('path');
const tiles = require('../src/tiles');

async function loadTeamsFromSheet() {
    try {
        const rows = await googleSheets.readSheet('Teams!A:F'); // Updated to include previousTile
        rows.slice(1).forEach(row => {
            const [teamName, members, dateCreated, roleId, currentTile, previousTile] = row;
            const memberIds = members.split(', ').map(member => member.split(':')[1]);
            teams[teamName] = {
                members: memberIds,
                roleId: roleId,
                currentTile: parseInt(currentTile, 10) || 0,
                previousTile: parseInt(previousTile, 10) || 0,
                canRoll: false,
                proofs: {}
            };
        });
    } catch (error) {
        console.error('Error loading teams from Google Sheets:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-team')
        .setDescription('Create or edit a team with specified members')
        .addStringOption(option => 
            option.setName('teamname')
                .setDescription('The name of the team')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('members')
                .setDescription('The members to add to the team (mention them)')
                .setRequired(true)),
    async execute(interaction) {
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'create-team',
                title: ':x: Access Denied :x:',
                description: 'You do not have permission to use this command.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const teamName = interaction.options.getString('teamname');
        const membersArg = interaction.options.getString('members');
        const memberIds = membersArg.match(/<@!?(\d+)>/g)?.map(id => id.replace(/[<@!>]/g, ''));

        if (!memberIds || memberIds.length === 0) {
            const { embed } = await createEmbed({
                command: 'create-team',
                title: ':x: Invalid Input :x:',
                description: 'Please provide at least one member.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (memberIds.length > 10) {
            const { embed } = await createEmbed({
                command: 'create-team',
                title: ':x: Team Size Exceeded :x:',
                description: 'A team can have a maximum of 10 members.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let role;
        if (teams[teamName]) {
            // Edit existing team
            role = interaction.guild.roles.cache.find(r => r.name === `Team ${teamName}`);
            if (!role) {
                const { embed } = await createEmbed({
                    command: 'create-team',
                    title: ':x: Role Not Found :x:',
                    description: 'The role for this team does not exist.',
                    color: '#FF0000',
                    channelId: interaction.channelId,
                    messageId: interaction.id,
                    client: interaction.client
                });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Remove the role from all existing members
            const existingMembers = teams[teamName].members;
            for (const id of existingMembers) {
                const member = interaction.guild.members.cache.get(id);
                if (member) {
                    await member.roles.remove(role).catch(console.error);
                }
            }

            // Update team members
            teams[teamName].members = memberIds;
        } else {
            // Create a new team
            role = await interaction.guild.roles.create({
                name: `Team ${teamName}`,
                mentionable: true,
                reason: `Role created for team ${teamName}`
            });

            teams[teamName] = {
                members: memberIds,
                roleId: role.id, // Store the role ID
                currentTile: 0, // Set initial tile to 0
                previousTile: 0, // Set initial previous tile to 0
                canRoll: false, // Set initial to false
                proofs: {}
            };
        }

        // Assign the new role to the members and get their display names and IDs
        const memberDisplayNames = [];
        for (const id of memberIds) {
            const member = interaction.guild.members.cache.get(id);
            if (member) {
                await member.roles.add(role).catch(console.error);
                memberDisplayNames.push(`${member.displayName}:${id}`);
            }
        }

        let existingTeams;
        try {
            // Read the existing teams from the Google Sheet
            existingTeams = await googleSheets.readSheet('Teams!A:F');
            const teamIndex = existingTeams.slice(1).findIndex(row => row[0] === teamName) + 1;

            const currentTile = teams[teamName] ? teams[teamName].currentTile : 0;
            const previousTile = teams[teamName] ? teams[teamName].previousTile : 0;
            const teamData = [teamName, memberDisplayNames.join(', '), new Date().toISOString(), role.id, currentTile, previousTile];

            if (teamIndex !== 0) {
                // Update existing team
                await googleSheets.updateSheet('Teams', `A${teamIndex + 1}:F${teamIndex + 1}`, teamData);
            } else {
                // Append new team
                await googleSheets.writeToSheet('Teams', teamData);
            }

            const { embed, attachment } = await createEmbed({
                command: 'create-team',
                title: `:white_check_mark: Team ${teamName} ${teamIndex !== 0 ? 'Updated' : 'Created'} :white_check_mark:`,
                description: `:busts_in_silhouette: **Members:** ${memberDisplayNames.map(nameId => nameId.split(':')[0]).join(', ')}`,
                fields: [{ name: 'Role', value: `<@&${role.id}>`, inline: true }],
                color: '#00FF00',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });

            await interaction.reply({ embeds: [embed], files: attachment ? [attachment] : [] });
        } catch (error) {
            console.error(`Error writing to Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'create-team',
                title: ':x: Error :x:',
                description: 'There was an error updating the Google Sheet. Please ping Clyde.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
    getTeams() {
        return teams;
    },
    updateTeamTile(teamName, newTile) {
        if (teams[teamName]) {
            teams[teamName].previousTile = teams[teamName].currentTile;
            teams[teamName].currentTile = newTile;
        }
    },
    resetCanRoll(teamName) {
        if (teams[teamName]) {
            teams[teamName].canRoll = false;
        }
    },
    allowRoll(teamName) {
        if (teams[teamName]) {
            teams[teamName].canRoll = true;
        }
    },
    loadTeamsFromSheet
};

// Load teams from Google Sheets on startup
loadTeamsFromSheet();
