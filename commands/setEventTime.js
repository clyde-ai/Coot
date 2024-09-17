const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../src/utils/embeds');
const googleSheets = require('../src/utils/googleSheets');
const moment = require('moment-timezone');
const path = require('path');

let eventStartTime = null;
let eventEndTime = null;
let broadcastChannelId = null;

async function getEventTime() {
    try {
        const rows = await googleSheets.readSheet('EventPassword!B2:D2');
        if (rows.length > 0) {
            return {
                eventStartTime: rows[0][0],
                eventEndTime: rows[0][1],
                broadcastChannelId: rows[0][2]
            };
        } else {
            return {
                eventStartTime: null,
                eventEndTime: null,
                broadcastChannelId: null
            };
        }
    } catch (error) {
        console.error(`Error reading Google Sheets: ${error.message}`);
        return {
            eventStartTime: null,
            eventEndTime: null,
            broadcastChannelId: null
        };
    }
}

async function isEventActive() {
    [global.eventStartTime, global.eventEndTime] = await getEventTime();
    const now = moment.utc().toISOString(); // Ensure current time is in UTC
    return global.eventStartTime && global.eventEndTime && now >= global.eventStartTime && now <= global.eventEndTime;
}

async function scheduleEventStartBroadcast(client) {
    try {
        // Get event times from Google Sheets
        const eventTimes = await getEventTime();
        if (!eventTimes.eventStartTime) {
            console.error('No start time found in the Google Sheet.');
            return;
        }

        const startTime = moment.utc(eventTimes.eventStartTime); // Use moment.utc for Zulu time
        const now = moment.utc(); // Use moment.utc to get the current time in UTC

        console.log('Start Time:', startTime.format());
        console.log('Current Time:', now.format());

        const delay = startTime.diff(now, 'milliseconds'); // Calculate delay in milliseconds
        console.log('Delay until Broadcast start: ', delay, ' milliseconds');
        if (delay > 0) {
            setTimeout(() => broadcastEventStart(client), delay);
        } else {
            console.log('Event start time is in the past. No broadcast scheduled.');
        }
    } catch (error) {
        console.error('Error reading start time from Google Sheets:', error);
    }
}

// Function to broadcast the event start
async function broadcastEventStart(client) {
    try {
        console.log('Creating Broadcast Embed');
        const rows = await googleSheets.readSheet('EventPassword!A2:D2');
        const eventPassword = rows[0][0];
        const broadcastChannelId = rows[0][3];

        console.log('Broadcast Channel ID:', broadcastChannelId);

        const embed = {
            title: ':tada: EVENT STARTED! :tada:',
            description: `The event has started!\n Use the password: **${eventPassword}** to submit your entries.`,
            color: parseInt('00FF00', 16),
        };

        const channel = client.channels.cache.get(broadcastChannelId);
        if (channel) {
            await channel.send({ embeds: [embed] });
        } else {
            console.error('Broadcast channel not found.');
            // Attempt to fetch the channel if it's not in the cache
            try {
                const fetchedChannel = await client.channels.fetch(broadcastChannelId);
                if (fetchedChannel) {
                    await fetchedChannel.send({ embeds: [embed] });
                } else {
                    console.error('Broadcast channel still not found after fetching.');
                }
            } catch (fetchError) {
                console.error('Error fetching the broadcast channel:', fetchError);
            }
        }
    } catch (error) {
        console.error('Error broadcasting event start:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-event-time')
        .setDescription('Set the event start and end times')
        .addStringOption(option => 
            option.setName('starttime')
                .setDescription('The event start time (YYYY-MM-DD HH:mm) in your local time zone')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('endtime')
                .setDescription('The event end time (YYYY-MM-DD HH:mm) in your local time zone')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('timezone')
                .setDescription('The time zone of the provided times (e.g., America/New_York)')
                .setRequired(true))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to broadcast the event start in (e.g., #channel-name)')
                .setRequired(true)),
    async execute(interaction) {
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        const hasAdminPermission = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasAdminRole && !hasAdminPermission) {
            const { embed } = await createEmbed({
                command: 'set-event-time',
                title: ':x: Access Denied :x:',
                description: 'You do not have permission to use this command.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const startTime = interaction.options.getString('starttime');
        const endTime = interaction.options.getString('endtime');
        const timeZone = interaction.options.getString('timezone');
        const channel = interaction.options.getChannel('channel');

        // Validate the date format
        if (!moment(startTime, 'YYYY-MM-DD HH:mm', true).isValid() || !moment(endTime, 'YYYY-MM-DD HH:mm', true).isValid()) {
            const { embed } = await createEmbed({
                command: 'set-event-time',
                title: ':x: Invalid Date Format :x:',
                description: 'Please provide the date and time in the format YYYY-MM-DD HH:mm.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Convert to Zulu time (UTC)
        eventStartTime = moment.tz(startTime, 'YYYY-MM-DD HH:mm', timeZone).utc().toISOString();
        eventEndTime = moment.tz(endTime, 'YYYY-MM-DD HH:mm', timeZone).utc().toISOString();

        console.log('Event Start Time (UTC):', eventStartTime);
        console.log('Event End Time (UTC):', eventEndTime);

        // Check if the start time is in the future
        if (moment(eventStartTime).isBefore(moment.utc())) {
            const { embed } = await createEmbed({
                command: 'set-event-time',
                title: ':x: Invalid Start Time :x:',
                description: 'The event start time must be in the future.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if the end time is after the start time
        if (moment(eventEndTime).isBefore(moment(eventStartTime))) {
            const { embed } = await createEmbed({
                command: 'set-event-time',
                title: ':x: Invalid End Time :x:',
                description: 'The event end time must be after the start time.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        broadcastChannelId = channel.id;

        try {
            // Read the existing password from the EventPassword sheet
            const rows = await googleSheets.readSheet('EventPassword!A2:A2');
            const existingPassword = rows.length > 0 ? rows[0][0] : '';

            // Write the new start and end times and broadcast channel ID to the sheet without overwriting the password
            await googleSheets.updateSheet('EventPassword', 'B2:D2', [eventStartTime, eventEndTime, broadcastChannelId]);

            const eventTimes = await getEventTime();
            if (!eventTimes.eventStartTime) {
                console.error('No start time found in the Google Sheet.');
            return;
            }

            const startTime = moment.utc(eventTimes.eventStartTime); // Use moment.utc for Zulu time
            const now = moment.utc(); // Use moment.utc to get the current time in UTC

            const delay = startTime.diff(now, 'milliseconds');

            const { embed } = await createEmbed({
                command: 'set-event-time',
                title: ':clock1: Event Time Set :clock1:',
                description: `**Event start and end times have been set successfully!**\n Broadcast of event start is scheduled in ${delay}ms.`,
                color: '#00FF00',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed] });

            // Schedule the event start broadcast
            scheduleEventStartBroadcast(interaction.client);
        } catch (error) {
            console.error(`Error updating Google Sheets: ${error.message}`);
            const { embed } = await createEmbed({
                command: 'set-event-time',
                title: ':x: Google Sheets Error :x:',
                description: ':rage: There was an error updating the Google Sheet. Please ping Clyde or an admin.',
                color: '#FF0000',
                channelId: interaction.channelId,
                messageId: interaction.id,
                client: interaction.client
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
    getEventTime,
    isEventActive,
    scheduleEventStartBroadcast
};
