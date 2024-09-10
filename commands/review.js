const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const googleSheets = require('../src/utils/googleSheets');
const { createEmbed } = require('../src/utils/embeds');

const adminRoleId = process.env.ADMIN_ROLE_ID;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('review')
        .setDescription('Review a submission')
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Link to the submission message')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('action')
                .setDescription('Approve or Deny the submission')
                .setRequired(true)
                .addChoices(
                    { name: 'approve', value: 'approve' },
                    { name: 'deny', value: 'deny' }
                )),
    async execute(interaction) {
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

        const link = interaction.options.getString('link');
        const action = interaction.options.getString('action');
        const reviewerName = interaction.member.displayName;

        // Extract message ID from the link
        const regex = /\/(\d+)\/(\d+)\/(\d+)$/;
        const match = link.match(regex);
        if (!match) {
            return interaction.reply({ content: 'Invalid link format. Please provide a valid message link.', ephemeral: true });
        }
        const [guildId, channelId, messageId] = match.slice(1);

        try {
            // Fetch the message
            const channel = await interaction.client.channels.fetch(channelId);
            const message = await channel.messages.fetch(messageId);

            // React to the message based on the action
            if (action === 'approve') {
                await message.react('✅');
            } else if (action === 'deny') {
                await message.react('❌');
            }

            // Update the Google Sheets
            let submissions;
            try {
                submissions = await googleSheets.readSheet('Submissions!A:H');
                const submissionRow = submissions.slice(1).find(row => row[7] === link);
                if (submissionRow) {
                    const rowIndex = submissions.indexOf(submissionRow) + 1;
                    await googleSheets.updateCell(`Submissions!I${rowIndex}`, action === 'approve' ? 'Approved' : 'Denied');
                    await googleSheets.updateCell(`Submissions!J${rowIndex}`, reviewerName);
                } else {
                    throw new Error('Submission not found in Google Sheets');
                }
            } catch (error) {
                console.error(`Error updating Google Sheets: ${error.message}`);
                return interaction.reply({ content: 'There was an error updating the Google Sheet. Please try again later.', ephemeral: true });
            }

            // Send an embed message in reply to the submission message
            const userMention = `<@${submissionRow[1]}>`;
            const { embed } = await createEmbed({
                command: 'review',
                title: action === 'approve' ? ':white_check_mark: Submission Approved :white_check_mark:' : ':x: Submission Denied :x:',
                description: `Your submission has been ${action === 'approve' ? 'approved' : 'denied'} by ${reviewerName}.`,
                color: action === 'approve' ? '#00FF00' : '#FF0000',
                channelId: channelId,
                messageId: messageId,
                client: interaction.client
            });
            await message.reply({ embeds: [embed] });

            await interaction.reply({ content: `Submission has been ${action === 'approve' ? 'approved' : 'denied'} and updated in the Google Sheet.`, ephemeral: true });
        } catch (error) {
            console.error(`Error fetching or reacting to the message: ${error.message}`);
            return interaction.reply({ content: 'There was an error fetching or reacting to the message. It may have been deleted.', ephemeral: true });
        }
    },
};
