const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeam = require('./createTeam');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('submit')
        .setDescription('Submit proof of tile completion')
        .addIntegerOption(option => 
            option.setName('tile')
                .setDescription('The tile number')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('proofs')
                .setDescription('Proof of tile completion (URLs or descriptions)')
                .setRequired(true)),
    async execute(interaction) {
        const tileNumber = interaction.options.getInteger('tile');
        const proofs = interaction.options.getString('proofs').split(',');

        if (isNaN(tileNumber)) {
            return interaction.reply('The first parameter must be a valid tile number.');
        }

        const teams = createTeam.getTeams();
        const team = Object.values(teams).find(t => t.members.includes(interaction.user.id));

        if (!team) {
            return interaction.reply('You are not part of any team.');
        }

        if (team.currentTile !== tileNumber) {
            return interaction.reply(`Your team is currently on tile ${team.currentTile}, not tile ${tileNumber}.`);
        }

        // Logic to handle proof submission
        team.proofs[tileNumber] = proofs;

        // Allow the team to use the /roll command
        team.canRoll = true;

        await interaction.reply(`Proof for tile ${tileNumber} submitted successfully. Your team can now use the /roll command.`);
    },
};
