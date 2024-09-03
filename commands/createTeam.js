const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const googleSheets = require('../utils/googleSheets');
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

            // Remove existing members from the role
            const existingMembers = teams[teamName].members;
            existingMembers.forEach(id => {
                const member = interaction.guild.members.cache.get(id);
                if (member) {
                    member.roles.remove(role);
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
                canRoll: false,
                proofs: {}
            };
        }

        // Assign the new role to the members
        const memberMentions = memberIds.map(id => {
            const member = interaction.guild.members.cache.get(id);
            if (member) {
                member.roles.add(role);
                return `<@${member.id}>`;
            }
            return null;
        }).filter(Boolean);

        try {
            // Write to Google Sheets
            const teamData = [teamName, memberIds.join(','), new Date().toISOString()];
            if (teams[teamName]) {
                // Update existing team
                await googleSheets.updateSheet('Teams', `A${Object.keys(teams).indexOf(teamName) + 2}:C`, [teamData]);
            } else {
                // Write new team
                await googleSheets.writeToSheet('Teams', teamData);
            }

            await interaction.reply(`Team ${teamName} ${teams[teamName] ? 'updated' : 'created'} with members: ${memberMentions.join(', ')}. Role <@&${role.id}> has been assigned to the team members.`);
        } catch (error) {
            await interaction.reply(error.message);
        }
    },
    getTeams() {
        return teams;
    }
};
