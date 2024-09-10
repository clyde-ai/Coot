const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Creates a well-formatted embed for bot responses.
 * @param {Object} options - Options for configuring the embed.
 * @param {string} options.command - The command that triggered the response.
 * @param {string} options.title - The title of the embed.
 * @param {string} options.description - The description of the embed.
 * @param {string} [options.imageUrl] - The URL of the image to include in the embed.
 * @param {string} [options.thumbnailUrl] - The URL of the thumbnail to include in the embed.
 * @param {Object} [options.fields] - Additional fields to include in the embed.
 * @param {string} [options.footer] - The footer text of the embed.
 * @param {string} [options.color] - The color of the embed.
 * @param {Object} [options.imageOptions] - Options for configuring the image size.
 * @param {string} options.channelId - The ID of the channel where the command was used.
 * @param {string} options.messageId - The ID of the message containing the attachment.
 * @param {Object} options.client - The Discord client instance.
 * @returns {Object} - The configured embed and attachment.
 */
async function createEmbed({
    command,
    title,
    description,
    imageUrl,
    thumbnailUrl,
    fields = [],
    footer,
    color = '#0099ff',
    imageOptions = {},
    channelId,
    messageId,
    client
}) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);

    let attachment;
    if (imageUrl) {
        try {
            console.log('Image URL:', imageUrl);
            if (fs.existsSync(imageUrl)) {
                if (command === 'roll' || command === 'reroll') {
                    const resizedImageBuffer = await resizeImage(imageUrl, 256, 256);
                    console.log('Resized Image Buffer:', resizedImageBuffer);
                    attachment = new AttachmentBuilder(resizedImageBuffer, { name: path.basename(imageUrl) });
                    console.log('Attachment:', attachment);
                    embed.setImage(`attachment://${path.basename(imageUrl)}`);
                } else if (command === 'submit' || command === 'event') {
                    const resizedImageBuffer = await resizeImage(imageUrl, 512, 512);
                    console.log('Resized Image Buffer:', resizedImageBuffer);
                    attachment = new AttachmentBuilder(resizedImageBuffer, { name: path.basename(imageUrl) });
                    console.log('Attachment:', attachment);
                    embed.setImage(`attachment://${path.basename(imageUrl)}`);
                } else if (command === 'board') {
                    const resizedImageBuffer = await resizeImage(imageUrl, 2800, 3850);
                    console.log('Resized Image Buffer:', resizedImageBuffer);
                    attachment = new AttachmentBuilder(resizedImageBuffer, { name: path.basename(imageUrl) });
                    console.log('Attachment:', attachment);
                    embed.setImage(`attachment://${path.basename(imageUrl)}`);
                } else {
                    embed.setImage(`attachment://${path.basename(imageUrl)}`);
                }
            } else {
                console.warn(`Image file not found: ${imageUrl}`);
            }
        } catch (error) {
            console.error('Error resizing image:', error);
        }
    }

    if (thumbnailUrl) {
        embed.setThumbnail(thumbnailUrl);
    }

    if (fields.length > 0) {
        embed.addFields(fields);
    }

    if (footer) {
        embed.setFooter({ text: footer });
    }

    return { embed, attachment };
}

async function resizeImage(filePath, width, height) {
    try {
        const buffer = fs.readFileSync(filePath);
        console.log('Original Image Buffer:', buffer);
        const resizedBuffer = await sharp(buffer)
            .resize(width, height)
            .toBuffer();
        console.log('Resized Image Buffer:', resizedBuffer);
        return resizedBuffer;
    } catch (error) {
        console.error('Error resizing image:', error);
        throw error;
    }
}

module.exports = {
    createEmbed
};
