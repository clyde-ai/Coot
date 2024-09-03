const ladders = [];

module.exports = {
    name: 'create-ladder',
    description: 'Create a ladder with a bottom and top tile number',
    execute(message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('You do not have permission to use this command.');
        }

        if (args.length !== 2) {
            return message.reply('Please provide exactly two tile numbers: the bottom and top of the ladder.');
        }

        const bottomTile = parseInt(args[0]);
        const topTile = parseInt(args[1]);

        if (isNaN(bottomTile) || isNaN(topTile)) {
            return message.reply('Both parameters must be valid tile numbers.');
        }

        // Store the ladder in memory
        ladders.push({ bottom: bottomTile, top: topTile });

        message.channel.send(`Ladder created: from tile ${bottomTile} to tile ${topTile}.`);
    },
    getLadders() {
        return ladders;
    }
};
