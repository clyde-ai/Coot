const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const googleSheets = require('../src/utils/googleSheets');
const { createEmbed } = require('../src/utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('review')
        .setDescription('Review a submission')
        .addStringOption(option => 
            option.setName('submission_link')
                .setDescription('Link to the submission message')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('status')
                .setDescription('Review status: approve or deny')
                .setRequired(true)
                .addChoice('approve', 'approve')
                .addChoice('deny', 'deny')),
    async execute(interaction) {
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'review',
                title: ':x: Access Denied :x:',
                description: 'You do not have permission to use this command.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const submissionLink = interaction.options.getString('submission_link');
        const status = interaction.options.getString('status');
        const reviewerName = interaction.member.displayName;

        // Extract message ID from the submission link
        const linkParts = submissionLink.split('/');
        const messageId = linkParts[linkParts.length - 1];
        const channelId = linkParts[linkParts.length - 2];

        // Fetch the message
        const channel = await interaction.client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);

        // React to the message
        if (status === 'approve') {
            await message.react('✅');
        } else if (status === 'deny') {
            await message.react('❌');
        }

        // Update Google Sheets
        try {
            const submissions = await googleSheets.readSheet('Submissions!A:H');
            const submissionRow = submissions.slice(1).find(row => row[7] === submissionLink);
            if (submissionRow) {
                const rowIndex = submissions.indexOf(submissionRow) + 1;
                await googleSheets.updateSheet(`Submissions!I${rowIndex}`, status === 'approve' ? 'Approved' : 'Denied');
                await googleSheets.updateSheet(`Submissions!J${rowIndex}`, reviewerName);
            } else {
                throw new Error('Submission not found in Google Sheets');
            }
        } catch (error) {
            console.error(`Error updating Google Sheets: ${error.message}`);
            return interaction.reply({ content: 'There was an error updating the Google Sheet. Please ping Clyde.', ephemeral: true });
        }

        // Send an embed message with the review details
        const submitterId = submissionRow[1]; // Assuming the submitter's ID is in the second column
        const embed = new MessageEmbed()
            .setTitle(':scales: Submission Review :scales:')
            .setDescription(`Your submission has been reviewed by ${reviewerName}.`)
            .addField('Status', status === 'approve' ? 'Approved ✅' : 'Denied ❌')
            .setColor(status === 'approve' ? '#00FF00' : '#FF0000')
            .setTimestamp();

        await message.reply({ content: `<@${submitterId}>`, embeds: [embed] });

        return interaction.reply({ content: 'Review submitted successfully.', ephemeral: true });
    },
};
