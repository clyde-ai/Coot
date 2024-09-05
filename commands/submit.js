const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');
const googleSheets = require('../src/utils/googleSheets');
const fetch = require('node-fetch');
const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const { getEventPassword } = require('./setEventPassword');
const path = require('path');

const credentialsPath = path.resolve(process.env.GOOGLE_CREDENTIALS_PATH);

const client = new vision.ImageAnnotatorClient({
    keyFilename: credentialsPath
});

const failedAttempts = new Map(); // Track failed attempts

module.exports = {
    data: new SlashCommandBuilder()
        .setName('submit')
        .setDescription('Submit proof of tile completion')
        .addAttachmentOption(option => 
            option.setName('proof')
                .setDescription('Proof of tile completion (image)')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply(); // Public response

        const proofAttachment = interaction.options.getAttachment('proof');

        const teams = createTeam.getTeams();
        const teamEntry = Object.entries(teams).find(([_, t]) => t.members.includes(interaction.user.id));

        if (!teamEntry) {
            return interaction.editReply('You are not part of any team.');
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

            const eventPassword = getEventPassword(); // Get the event password

            if (!text.includes(eventPassword)) {
                const userId = interaction.user.id;
                const attempts = failedAttempts.get(userId) || 0;

                if (attempts >= 1) {
                    // Accept the image but flag for manual review
                    team.proofs[tileNumber] = proofAttachment.url;
                    team.canRoll = true;

                    const userMention = `<@${interaction.user.id}>`;
                    const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);
                    const memberName = interaction.member.nickname || interaction.user.username; // Use nickname if available, otherwise username

                    // Write to the Submissions sheet with a flag for manual review
                    const submissionData = [teamName, memberName, tileNumber, proofAttachment.url, new Date().toISOString(), 'Manual Review Needed'];
                    await googleSheets.writeToSheet('Submissions', submissionData);

                    await interaction.editReply({
                        content: `Proof for tile ${tileNumber} submitted by ${userMention} from team ${teamRoleMention} has been flagged for manual review. Any member of team ${teamRoleMention} can now use the /roll command!`,
                        files: [proofAttachment]
                    });

                    // Reset failed attempts
                    failedAttempts.delete(userId);
                } else {
                    // Increment failed attempts
                    failedAttempts.set(userId, attempts + 1);
                    return interaction.editReply('The submitted image does not contain the event password. Please upload a valid image.');
                }
            } else {
                // Reset failed attempts on successful submission
                failedAttempts.delete(interaction.user.id);

                // Logic to handle proof submission
                team.proofs[tileNumber] = proofAttachment.url;
                team.canRoll = true;

                const userMention = `<@${interaction.user.id}>`;
                const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);
                const memberName = interaction.member.nickname || interaction.user.username; // Use nickname if available, otherwise username

                // Write to the Submissions sheet
                const submissionData = [teamName, memberName, tileNumber, proofAttachment.url, new Date().toISOString()];
                await googleSheets.writeToSheet('Submissions', submissionData);

                // Sort the Submissions sheet by Team Name
                await googleSheets.sortSheet('Submissions', 'A', 'asc');

                await interaction.editReply({
                    content: `Proof for tile ${tileNumber} submitted successfully by ${userMention} from team ${teamRoleMention}. Any member of team ${teamRoleMention} can now use the /roll command!`,
                    files: [proofAttachment]
                });
            }
        } catch (error) {
            console.error(`Error processing the image: ${error.message}`);
            await interaction.editReply('There was an error processing the image. Please try again later.');
        }
    },
};
