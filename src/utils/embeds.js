const { EmbedBuilder } = require('discord.js');

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
 * @returns {EmbedBuilder} - The configured embed.
 */
function createEmbed({
    command,
    title,
    description,
    imageUrl,
    thumbnailUrl,
    fields = [],
    footer,
    color = '#0099ff',
    imageOptions = {}
}) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);

    if (imageUrl) {
        embed.setImage(imageUrl, imageOptions);
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

    return embed;
}

module.exports = {
    createEmbed
};
