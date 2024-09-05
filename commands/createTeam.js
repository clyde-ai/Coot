const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const googleSheets = require('../src/utils/googleSheets');
const teams = {};

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
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply('You do not have permission to use this command.');
        }

        const teamName = interaction.options.getString('teamname');
        const membersArg = interaction.options.getString('members');
        const memberIds = membersArg.match(/<@!?(\d+)>/g)?.map(id => id.replace(/[<@!>]/g, ''));

        if (!memberIds || memberIds.length === 0) {
            return interaction.reply('Please provide at least one member.');
        }

        if (memberIds.length > 10) {
            return interaction.reply('A team can have a maximum of 10 members.');
        }

        let role;
        if (teams[teamName]) {
            // Edit existing team
            role = interaction.guild.roles.cache.find(r => r.name === `Team ${teamName}`);
            if (!role) {
                return interaction.reply('The role for this team does not exist.');
            }

            // Remove members who are no longer in the team
            const existingMembers = teams[teamName].members;
            existingMembers.forEach(id => {
                if (!memberIds.includes(id)) {
                    const member = interaction.guild.members.cache.get(id);
                    if (member) {
                        member.roles.remove(role);
                    }
                }
            });

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
                currentTile: 0, // Set initial tile to 0
                previousTile: 0, // Set initial previous tile to 0
                canRoll: false,
                proofs: {}
            };
        }

        // Assign the new role to the members and get their display names and IDs
        const memberDisplayNames = memberIds.map(id => {
            const member = interaction.guild.members.cache.get(id);
            if (member) {
                member.roles.add(role);
                return `${member.displayName}:${id}`; // Use display name and Discord ID
            }
            return null;
        }).filter(Boolean);

        try {
            // Read the existing teams from the Google Sheet
            const existingTeams = await googleSheets.readSheet('Teams!A:C');
            const teamIndex = existingTeams.slice(1).findIndex(row => row[0] === teamName) + 1; // Skip header row

            const teamData = [teamName, memberDisplayNames.join(', '), new Date().toISOString()];

            if (teamIndex !== 0) {
                // Update existing team
                await googleSheets.updateSheet('Teams', `A${teamIndex + 1}:C${teamIndex + 1}`, teamData);
            } else {
                // Append new team
                await googleSheets.writeToSheet('Teams', teamData);
            }

            await interaction.reply(`Team ${teamName} ${teamIndex !== 0 ? 'updated' : 'created'} with members: ${memberDisplayNames.map(nameId => nameId.split(':')[0]).join(', ')}. Role <@&${role.id}> has been assigned to the team members.`);
        } catch (error) {
            console.error(`Error writing to Google Sheets: ${error.message}`);
            await interaction.reply('There was an error updating the Google Sheet. Please try again later.');
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
    }
};
