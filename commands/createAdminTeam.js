const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../src/utils/embeds');
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
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'create-admin-team',
                title: ':x: Access Denied :x:',
                description: 'You do not have permission to use this command.',
                color: '#ff0000'
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const membersArg = interaction.options.getString('members');
        const memberIds = membersArg.match(/<@!?(\d+)>/g)?.map(id => id.replace(/[<@!>]/g, ''));

        if (!memberIds || memberIds.length === 0) {
            const { embed } = await createEmbed({
                command: 'create-admin-team',
                title: ':x: Invalid Input :x:',
                description: 'Please provide at least one member to add to the admin team.',
                color: '#ff0000'
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const members = memberIds.map(id => {
            const member = interaction.guild.members.cache.get(id);
            if (member) {
                member.roles.add(adminRoleId);
                adminTeam.push(member.id);
                return member.user.username;
            }
            return null;
        }).filter(Boolean);

        if (members.length === 0) {
            const { embed } = await createEmbed({
                command: 'create-admin-team',
                title: ':x: No Valid Members :x:',
                description: 'No valid members provided.',
                color: '#ff0000'
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const { embed } = await createEmbed({
            command: 'create-admin-team',
            title: ':white_check_mark: Admin Team Created :white_check_mark:',
            description: `Admin team created with members: ${members.join(', ')}`,
            color: '#00ff00'
        });
        await interaction.reply({ embeds: [embed] });
    },
    getAdminTeam() {
        return adminTeam;
    }
};
