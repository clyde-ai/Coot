const teams = {};

module.exports = {
    name: 'create-team',
    description: 'Create a new team with specified members',
    execute(message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('You do not have permission to use this command.');
        }

        if (args.length < 2) {
            return message.reply('Please provide a team name and at least one member.');
        }

        const teamName = args.shift();
        const members = args.map(arg => arg.replace(/[<@!>]/g, ''));

        if (teams[teamName]) {
            return message.reply('A team with this name already exists.');
        }

        teams[teamName] = {
            members: members,
            currentTile: 1, // Assuming teams start at tile 1
            canRoll: false,
            proofs: {}
        };

        message.channel.send(`Team ${teamName} created with members: ${members.join(', ')}`);
    },
    getTeams() {
        return teams;
    }
};
