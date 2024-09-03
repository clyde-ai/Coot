const createTeam = require('./createTeam');

module.exports = {
    name: 'submit',
    description: 'Submit proof of tile completion',
    async execute(message, args) {
        if (args.length < 2) {
            return message.reply('Please provide a tile number and at least one image as proof.');
        }

        const tileNumber = parseInt(args[0]);
        const proofs = args.slice(1);

        if (isNaN(tileNumber)) {
            return message.reply('The first parameter must be a valid tile number.');
        }

        const teams = createTeam.getTeams();
        const team = Object.values(teams).find(t => t.members.includes(message.author.id));

        if (!team) {
            return message.reply('You are not part of any team.');
        }

        if (team.currentTile !== tileNumber) {
            return message.reply(`Your team is currently on tile ${team.currentTile}, not tile ${tileNumber}.`);
        }

        // Logic to handle proof submission
        team.proofs[tileNumber] = proofs;

        // Allow the team to use the /roll command
        team.canRoll = true;

        message.channel.send(`Proof for tile ${tileNumber} submitted successfully. Your team can now use the /roll command.`);
    },
};
