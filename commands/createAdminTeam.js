const adminTeam = [];

module.exports = {
    name: 'create-admin-team',
    description: 'Create an admin team with specified members',
    execute(message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('You do not have permission to use this command.');
        }

        if (args.length === 0) {
            return message.reply('Please provide at least one member to add to the admin team.');
        }

        const members = args.map(arg => {
            const member = message.guild.members.cache.get(arg.replace(/[<@!>]/g, ''));
            if (member) {
                member.roles.add('ADMIN_ROLE_ID'); // Replace with your admin role ID
                adminTeam.push(member.id);
                return member.user.username;
            }
            return null;
        }).filter(Boolean);

        if (members.length === 0) {
            return message.reply('No valid members provided.');
        }

        message.channel.send(`Admin team created with members: ${members.join(', ')}`);
    },
    getAdminTeam() {
        return adminTeam;
    }
};
