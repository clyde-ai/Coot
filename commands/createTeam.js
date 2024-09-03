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

        if (teams[teamName]) {
            return interaction.reply('A team with this name already exists.');
        }

        const memberNicknames = memberIds.map(id => {
            const member = interaction.guild.members.cache.get(id);
            return member ? member.displayName : null;
        }).filter(Boolean);

        teams[teamName] = {
            members: memberIds,
            currentTile: 0, // Set initial tile to 0
            canRoll: false,
            proofs: {}
        };

        await interaction.reply(`Team ${teamName} created with members: ${memberNicknames.join(', ')}`);
    },
    getTeams() {
        return teams;
    }
};
