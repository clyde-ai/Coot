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
        .addAttachmentOption(option => 
            option.setName('proof')
                .setDescription('Proof of tile completion (image)')
                .setRequired(true)),
    async execute(interaction) {
        const tileNumber = interaction.options.getInteger('tile');
        const proofAttachment = interaction.options.getAttachment('proof');

        if (isNaN(tileNumber)) {
            return interaction.reply('The first parameter must be a valid tile number.');
        }

        const teams = createTeam.getTeams();
        const teamEntry = Object.entries(teams).find(([_, t]) => t.members.includes(interaction.user.id));

        if (!teamEntry) {
            return interaction.reply('You are not part of any team.');
        }

        const [teamName, team] = teamEntry;

        if (team.currentTile !== tileNumber) {
            return interaction.reply(`Your team is currently on tile ${team.currentTile}, not tile ${tileNumber}.`);
        }

        // Logic to handle proof submission
        team.proofs[tileNumber] = proofAttachment.url;

        // Allow the team to use the /roll command
        team.canRoll = true;

        const userMention = `<@${interaction.user.id}>`;
        const teamRoleMention = interaction.guild.roles.cache.find(role => role.name === `Team ${teamName}`);

        await interaction.reply({
            content: `Proof for tile ${tileNumber} submitted successfully by ${userMention} from ${teamRoleMention}. Any member of ${teamRoleMention} can now use the /roll command!`,
            files: [proofAttachment]
        });
    },
};
