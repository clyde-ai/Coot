const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const adminTeam = [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-admin-team')
        .setDescription('Create an admin team with specified members')
        .addStringOption(option => 
            option.setName('members')
                .setDescription('The members to add to the admin team (mention them)')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply('You do not have permission to use this command.');
        }

        const membersArg = interaction.options.getString('members');
        const memberIds = membersArg.match(/<@!?(\d+)>/g)?.map(id => id.replace(/[<@!>]/g, ''));

        if (!memberIds || memberIds.length === 0) {
            return interaction.reply('Please provide at least one member to add to the admin team.');
        }

        const members = memberIds.map(id => {
            const member = interaction.guild.members.cache.get(id);
            if (member) {
                member.roles.add(process.env.ADMIN_ROLE_ID); // Replace with your admin role ID
                adminTeam.push(member.id);
                return member.user.username;
            }
            return null;
        }).filter(Boolean);

        if (members.length === 0) {
            return interaction.reply('No valid members provided.');
        }

        await interaction.reply(`Admin team created with members: ${members.join(', ')}`);
    },
    getAdminTeam() {
        return adminTeam;
    }
};
