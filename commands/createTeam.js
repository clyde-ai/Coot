const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const teams = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-team')
        .setDescription('Create a new team with specified members')
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

        if (teams[teamName]) {
            return interaction.reply('A team with this name already exists.');
        }

        // Create a new role for the team with "Team" appended before the team name
        const role = await interaction.guild.roles.create({
            name: `Team ${teamName}`,
            mentionable: true,
            reason: `Role created for team ${teamName}`
        });

        const memberMentions = memberIds.map(id => {
            const member = interaction.guild.members.cache.get(id);
            if (member) {
                member.roles.add(role); // Assign the new role to the member
                return `<@${member.id}>`;
            }
            return null;
        }).filter(Boolean);

        teams[teamName] = {
            members: memberIds,
            currentTile: 0, // Set initial tile to 0
            canRoll: false,
            proofs: {}
        };

        await interaction.reply(`Team ${teamName} created with members: ${memberMentions.join(', ')}. Role <@&${role.id}> has been assigned to the team members.`);
    },
    getTeams() {
        return teams;
    }
};
