const snakes = [];

module.exports = {
    name: 'create-snake',
    description: 'Create a snake with a head and tail tile number',
    execute(message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('You do not have permission to use this command.');
        }

        if (args.length !== 2) {
            return message.reply('Please provide exactly two tile numbers: the head and tail of the snake.');
        }

        const headTile = parseInt(args[0]);
        const tailTile = parseInt(args[1]);

        if (isNaN(headTile) || isNaN(tailTile)) {
            return message.reply('Both parameters must be valid tile numbers.');
        }

        // Store the snake in memory
        snakes.push({ head: headTile, tail: tailTile });

        message.channel.send(`Snake created: from tile ${headTile} to tile ${tailTile}.`);
    },
    getSnakes() {
        return snakes;
    }
};
