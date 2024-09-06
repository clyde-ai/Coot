const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');
const googleSheets = require('../src/utils/googleSheets');
const fetch = require('node-fetch');
const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const { getEventPassword } = require('./setEventPassword');
const tiles = require('../src/tiles');
const path = require('path');
const { createEmbed } = require('../src/utils/embeds');

let client;

if (process.env.GOOGLE_CREDENTIALS_PATH) {
    console.log('GOOGLE_CREDENTIALS_PATH found, proceeding with local function.');
    const credentialsPath = path.resolve(process.env.GOOGLE_CREDENTIALS_PATH);
    client = new vision.ImageAnnotatorClient({
        keyFilename: credentialsPath
    });
} else if (process.env.GOOGLE_CREDENTIALS) {
    console.log('GOOGLE_CREDENTIALS_PATH not found, proceeding with hosted function.');
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    client = new vision.ImageAnnotatorClient({
        credentials: credentials
    });
} else {
    throw new Error('No Google Cloud credentials found. Please set either GOOGLE_CREDENTIALS_PATH or GOOGLE_CREDENTIALS environment variable.');
}

const failedAttempts = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('submit')
        .setDescription('Submit proof of tile completion')
        .addAttachmentOption(option => 
            option.setName('proof')
                .setDescription('Proof of tile completion (image)')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const proofAttachment = interaction.options.getAttachment('proof');

        const teams = createTeam.getTeams();
        const teamEntry = Object.entries(teams).find(([_, t]) => t.members.includes(interaction.user.id));

        if (!teamEntry) {
            const { embed } = await createEmbed({
                command: 'submit',
                title: ':x: Player Not In A Team :x:',
                description: 'You are not part of any team. Ping an event admin for assistance.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const [teamName, team] = teamEntry;
        const tileNumber = team.currentTile;

        try {
            // Download the image with increased timeout
            const response = await fetch(proofAttachment.url, { timeout: 20000 });
            const imageBuffer = await response.buffer();

            // Preprocess the image
            const processedImageBuffer = await sharp(imageBuffer)
                .grayscale()
                .threshold(128)
                .toBuffer();

            // Perform OCR on the image using Google Cloud Vision API
            const [result] = await client.textDetection(processedImageBuffer);
            const detections = result.textAnnotations;
            const text = detections.length ? detections[0].description : '';

            const eventPassword = getEventPassword();

            if (!text.includes(eventPassword)) {
                const userId = interaction.user.id;
                const attempts = failedAttempts.get(userId) || 0;

                if (attempts >= 0) { // Set to 1 if you want the invalid proof response
                    // Accept the image but flag for manual review
                    team.proofs[tileNumber] = proofAttachment.url;

                    const tile = tiles.find(t => t.tileNumber === tileNumber);
                    const imagesNeeded = tile ? tile.imagesNeeded : 1;
                    const imagesSubmitted = team.proofs[tileNumber].length;

                    if (imagesSubmitted >= imagesNeeded) {
                        team.canRoll = true;
                    }

                    const userMention = `<@${interaction.user.id}>`;
                    const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);
                    const memberName = interaction.member.displayName;

                    // Write to the Submissions sheet with a flag for manual review
                    const submissionData = [teamName, memberName, tileNumber, '1/1', proofAttachment.url, new Date().toISOString(), 'Manual Review Needed'];
                    await googleSheets.writeToSheet('Submissions', submissionData);

                    const { embed } = await createEmbed({
                        command: 'submit',
                        title: ':warning: Manual Review Needed :warning:',
                        description: `Proof for tile ${tileNumber} submitted by ${userMention} from team ${teamRoleMention} has been flagged for manual review.\n ${imagesSubmitted >= imagesNeeded ? ':tada: **All required proofs have been submitted!** :tada:\n Any member of team can now use the */roll* command!' : `\n${imagesNeeded - imagesSubmitted} more proof(s) needed.`}`,
                        color: '#FFA500',
                        channelId: interaction.channelId,
                        messageId: interaction.id,
                        client: interaction.client
                    });
                    await interaction.editReply({ embeds: [embed], files: [proofAttachment] });

                    failedAttempts.delete(userId);
                } else {
                    failedAttempts.set(userId, attempts + 1);
                    const { embed } = await createEmbed({
                        command: 'submit',
                        title: ':x: Invalid Proof :x:',
                        description: 'The submitted image does not contain the event password.\n Please upload a clear and valid image.\n Make sure your event password is visible!\n i.e. bright green text placed in an open area, **not** on top of any objects, overlays, etc.',
                        color: '#FF0000',
                        channelId: interaction.channelId,
                        messageId: interaction.id,
                        client: interaction.client
                    });
                    await interaction.editReply({ embeds: [embed] });
                }
            } else {
                // Reset failed attempts on successful submission
                failedAttempts.delete(interaction.user.id);

                if (!team.proofs[tileNumber]) {
                    team.proofs[tileNumber] = [];
                }
                team.proofs[tileNumber].push(proofAttachment.url);

                const tile = tiles.find(t => t.tileNumber === tileNumber);
                const imagesNeeded = tile ? tile.imagesNeeded : 1;
                const imagesSubmitted = team.proofs[tileNumber].length;

                const userMention = `<@${interaction.user.id}>`;
                const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);
                const memberName = interaction.member.displayName;

                // Write to the Submissions sheet
                const submissionStatus = `${imagesSubmitted}/${imagesNeeded}`;
                const submissionData = [teamName, memberName, tileNumber, submissionStatus, proofAttachment.url, new Date().toISOString()];
                await googleSheets.writeToSheet('Submissions', submissionData);

                await googleSheets.sortSheet('Submissions', 'A', 'asc'); // Sort by Team Name

                if (imagesSubmitted >= imagesNeeded) {
                    team.canRoll = true;
                    const { embed } = await createEmbed({
                        command: 'submit',
                        title: ':white_check_mark: Proof Submitted :white_check_mark:',
                        description: `Proof for tile **${tileNumber}** submitted successfully by ${userMention} from team ${teamRoleMention}.\n :tada: **All required proofs have been submitted!** :tada:\n Any member of team ${teamRoleMention} can now use the */roll* command!`,
                        color: '#00FF00',
                        channelId: interaction.channelId,
                        messageId: interaction.id,
                        client: interaction.client
                    });
                    await interaction.editReply({ embeds: [embed], files: [proofAttachment] });
                } else {
                    const { embed } = await createEmbed({
                        command: 'submit',
                        title: ':ballot_box_with_check: Proof Submitted :ballot_box_with_check:',
                        description: `Proof for tile ${tileNumber} submitted successfully by ${userMention} from team ${teamRoleMention}.\n **${imagesNeeded - imagesSubmitted}** more proof(s) needed.`,
                        color: '#004cff',
                        channelId: interaction.channelId,
                        messageId: interaction.id,
                        client: interaction.client
                    });
                    await interaction.editReply({ embeds: [embed], files: [proofAttachment] });
                }
            }
        } catch (error) {
            console.error(`Error processing the image: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'submit',
                title: ':x: Error :x:',
                description: 'There was an error processing the image. Please ping an event admin.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
