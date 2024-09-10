const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, userMention } = require('discord.js');
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
                    { name: 'Approve', value: 'approve' },
                    { name: 'Deny', value: 'deny' }
                )),
    async execute(interaction) {
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'review',
                title: ':x: Access Denied :x:',
                description: 'You do not have permission to use this command.',
                color: 0xFF0000, // Red color
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
            // Fetch the channel
            const channel = await interaction.client.channels.fetch(channelId);
            console.log(`channel: ${channel}, channelId: ${channelId}`);
            if (!channel) {
                console.log('found !channel');
                throw new Error('Channel not found');
            }

            // Fetch the message
            const message = await channel.messages.fetch(messageId);
            console.log(`messageId: ${messageId}, message: ${message}, message.id: ${message.id}`);
            if (!message) {
                console.log('found !message');
                throw new Error('Message not found');
            }

            // React to the message based on the action
            if (action === 'approve') {
                await message.react('✅');
            } else if (action === 'deny') {
                await message.react('❌');
            }

            // Defer the reply to the interaction
            await interaction.deferReply({ ephemeral: true });

            // Update the Google Sheets
            let submissions;
            let submissionRow;
            try {
                submissions = await googleSheets.readSheet('Submissions!A:H');
                submissionRow = submissions.slice(1).find(row => row[7] === link);
                if (submissionRow) {
                    const rowIndex = submissions.indexOf(submissionRow) + 1;
                    await googleSheets.updateCell(`Submissions!I${rowIndex}`, action === 'approve' ? 'Approved' : 'Denied');
                    await googleSheets.updateCell(`Submissions!J${rowIndex}`, reviewerName);
                } else {
                    throw new Error('Submission not found in Google Sheets');
                }
            } catch (error) {
                console.error(`Error updating Google Sheets: ${error.message}`);
                return interaction.editReply({ content: 'There was an error updating the Google Sheet. Please try again later.' });
            }

            // Read the member display name from Google Sheets
            let memberDisplayName;
            try {
                const rowIndex = submissions.indexOf(submissionRow) + 1;
                memberDisplayName = await googleSheets.readCell(`Submissions!B${rowIndex}`);
            } catch (error) {
                console.error(`Error reading member display name from Google Sheets: ${error.message}`);
                return interaction.editReply({ content: 'There was an error reading the member display name from Google Sheets. Please try again later.' });
            }

            // Fetch the guild and find the member
            const guild = interaction.guild;
            const member = guild.members.cache.find(member => member.displayName === memberDisplayName);

            let userMentionResponse;
            if (!member) {
                userMentionResponse = '';
            } else {
                userMentionResponse = userMention(member.id);
            }

            // Create conditional response
            let replyDescription;
            if (action === 'approve') {
                replyDescription = `${userMentionResponse} Your submission has been approved by ${reviewerName}.`;
            } else {
                replyDescription = `${userMentionResponse} Your submission has been denied by ${reviewerName}.\n Your team will need additional proof or resubmission for this tile!`;
            }

            // Send an embed message in reply to the submission message
            const { embed } = await createEmbed({
                command: 'review',
                title: action === 'approve' ? ':white_check_mark: Submission Approved :white_check_mark:' : ':x: Submission Denied :x:',
                description: `${userMentionResponse} Your submission has been ${action === 'approve' ? 'approved' : 'denied'} by ${reviewerName}.`,
                color: action === 'approve' ? 0x00FF00 : 0xFF0000, // Green or Red color
                channelId: channelId,
                messageId: messageId,
                client: interaction.client
            });
            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(`Error fetching or reacting to the message: ${error.message}`);
            return interaction.editReply({ content: 'There was an error fetching or reacting to the message. It may have been deleted or the bot lacks permissions.' });
        }
    },
};
