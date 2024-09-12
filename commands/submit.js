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
const { getEventTime, isEventActive } = require('./setEventTime');

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
        // Check if the event is active
        const { eventStartTime, eventEndTime } = await getEventTime();
        if (!isEventActive()) {
            const { embed } = await createEmbed({
                command: 'roll',
                title: ':x: Event Not Active :x:',
                description: '**The event has not started yet or has already ended. Please wait for the event to start.**',
                color: '#ff0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            const reply = await interaction.reply({ embeds: [embed], ephemeral: true, fetchReply: true });
            const messageId = reply.id;
            
            return;
        }
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
            const reply = await interaction.editReply({ embeds: [embed], fetchReply: true });
            const messageId = reply.id;

            return;
        }

        const [teamName, team] = teamEntry;

        // Fetch the current tile from the Teams sheet
        let existingTeams;
        try {
            existingTeams = await googleSheets.readSheet('Teams!A:E');
            const teamRow = existingTeams.slice(1).find(row => row[0] === teamName);
            if (teamRow) {
                team.currentTile = parseInt(teamRow[4], 10);
            } else {
                throw new Error('Team not found in Google Sheets');
            }
        } catch (error) {
            console.error(`Error reading from Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'submit',
                title: ':x: Google Sheets Error :x:',
                description: ':rage: There was an error reading the Google Sheet. Please ping Clyde or an admin.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            const reply = await interaction.editReply({ embeds: [embed], fetchReply: true });
            const messageId = reply.id;

            return;
        }

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
            const tile = tiles.find(t => t.tileNumber === tileNumber);
            const dropMessage = tile ? tile.dropMessage : '';

            // event password or drop message not found
            if (!text.includes(eventPassword) || (!text.includes(dropMessage) && dropMessage !== '')) {
                console.log(`Google Vision API - Did not detect BOTH password and drop message.\n Password?: ${text.includes(eventPassword)}\n DropMessage?: ${text.includes(dropMessage)}`);
                console.log(`Google Vision Text Detections: ${text}`);
                const userId = interaction.user.id;
                const attempts = failedAttempts.get(userId) || 0;

                if (attempts >= 0) { // Set to 1 if you want the invalid proof response, default route without this
                    // Accept the image but flag for manual review
                    if (!team.proofs[tileNumber]) {
                        team.proofs[tileNumber] = [];
                    }
                    team.proofs[tileNumber].push(proofAttachment.url);

                    const imagesNeeded = tile ? tile.imagesNeeded : 1;
                    const imagesSubmitted = team.proofs[tileNumber].length;

                    if (imagesSubmitted >= imagesNeeded) {
                        console.log(`${teamName} can now roll.`);
                        team.canRoll = true;
                    }

                    const userMention = `<@${interaction.user.id}>`;
                    const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);
                    const memberName = interaction.member.displayName;

                    const { embed } = await createEmbed({
                        command: 'submit',
                        title: ':warning: Manual Review Needed :warning:',
                        description: `Proof for tile ${tileNumber} submitted by ${userMention} from team ${teamRoleMention} has been flagged for manual review.\n This is due to being unable to find the event password and/or drop phrase in your submission.\n ${imagesSubmitted >= imagesNeeded ? ':tada: **All required proofs have been submitted!** :tada:\n Any member of the team can now use the */roll* command!' : `\n${imagesNeeded - imagesSubmitted} more proof(s) needed.`}`,
                        color: '#FFA500',
                        channelId: interaction.channelId,
                        messageId: interaction.id,
                        client: interaction.client
                    });
                    const reply = await interaction.editReply({ embeds: [embed], files: [proofAttachment], fetchReply: true });
                    const messageId = reply.id;
                    
                    // Write to the Submissions sheet
                    const submissionStatus = `${imagesSubmitted}/${imagesNeeded}`;
                    const submissionData = [teamName, memberName, tileNumber, submissionStatus, proofAttachment.url, new Date().toISOString(), 'Manual Review Needed', `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${messageId}`];
                    await googleSheets.writeToSheet('Submissions', submissionData);

                    failedAttempts.delete(userId);
                } else {
                    failedAttempts.set(userId, attempts + 1);
                    const { embed } = await createEmbed({
                        command: 'submit',
                        title: ':x: Invalid Proof :x:',
                        description: 'The submitted image does not contain the event password and/or drop message.\n Please upload a clear and valid image.\n Make sure your event password or drop message is visible!\n i.e. bright green text placed in an open area, **not** on top of any objects, overlays, etc.',
                        color: '#FF0000',
                        channelId: interaction.channelId,
                        messageId: interaction.id,
                        client: interaction.client
                    });
                    const reply = await interaction.editReply({ embeds: [embed], fetchReply: true });
                    const messageId = reply.id;
                }
            } else {
                console.log(`Google Vision Found EventPassword and DropMessage!`);
                // Reset failed attempts on successful submission
                failedAttempts.delete(interaction.user.id);

                if (!team.proofs[tileNumber]) {
                    team.proofs[tileNumber] = [];
                }
                team.proofs[tileNumber].push(proofAttachment.url);

                const imagesNeeded = tile ? tile.imagesNeeded : 1;
                const imagesSubmitted = team.proofs[tileNumber].length;

                const userMention = `<@${interaction.user.id}>`;
                const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);
                const memberName = interaction.member.displayName;

                const { embed } = await createEmbed({
                    command: 'submit',
                    title: ':white_check_mark: Proof Submitted :white_check_mark:',
                    description: `Proof for tile ${tileNumber} submitted by ${userMention} from team ${teamRoleMention} has been successfully submitted.\n ${imagesSubmitted >= imagesNeeded ? ':tada: **All required proofs have been submitted!** :tada:\n Any member of the team can now use the */roll* command!' : `\n${imagesNeeded - imagesSubmitted} more proof(s) needed.`}`,
                    color: '#00FF00',
                    channelId: interaction.channelId,
                    messageId: interaction.id,
                    client: interaction.client
                });
                const reply = await interaction.editReply({ embeds: [embed], files: [proofAttachment], fetchReply: true });
                const messageId = reply.id;

                // Write to the Submissions sheet
                const submissionStatus = `${imagesSubmitted}/${imagesNeeded}`;
                const submissionData = [teamName, memberName, tileNumber, submissionStatus, proofAttachment.url, new Date().toISOString(), '', `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${messageId}`];
                await googleSheets.writeToSheet('Submissions', submissionData);
            }
        } catch (error) {
            console.error(`Error processing submission: ${error.message}`);
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
