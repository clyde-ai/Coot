const { SlashCommandBuilder } = require('@discordjs/builders');
const createTeamCommand = require('../commands/createTeam');
const googleSheets = require('../src/utils/googleSheets');
const { PermissionsBitField } = require('discord.js');

jest.mock('../src/utils/googleSheets');

const mockInteraction = {
    commandName: 'create-team',
    options: {
        getString: jest.fn(),
    },
    member: {
        permissions: {
            has: jest.fn().mockReturnValue(true),
        },
    },
    reply: jest.fn(),
    guild: {
        roles: {
            cache: {
                find: jest.fn(),
            },
            create: jest.fn(), // Ensure create is mocked
        },
        members: {
            cache: {
                get: jest.fn(),
            },
        },
    },
};

describe('/create-team command', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset the teams object before each test
        createTeamCommand.getTeams = jest.fn().mockReturnValue({});

        // Mock console.error
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console.error
        consoleErrorSpy.mockRestore();
    });

    test('should not allow creating a team if user lacks permissions', async () => {
        mockInteraction.member.permissions.has.mockReturnValue(false);

        await createTeamCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith('You do not have permission to use this command.');
    });

    test('should reply with error if no members are provided', async () => {
        mockInteraction.member.permissions.has.mockReturnValue(true); // Ensure permission check passes
        mockInteraction.options.getString.mockReturnValueOnce('Test Team').mockReturnValueOnce('');

        await createTeamCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith('Please provide at least one member.');
    });

    test('should reply with error if more than 10 members are provided', async () => {
        mockInteraction.member.permissions.has.mockReturnValue(true); // Ensure permission check passes
        const members = Array.from({ length: 11 }, (_, i) => `<@!${i}>`).join(' ');
        mockInteraction.options.getString.mockReturnValueOnce('Test Team').mockReturnValueOnce(members);

        await createTeamCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith('A team can have a maximum of 10 members.');
    });

    test('should create a new team and assign roles', async () => {
        mockInteraction.member.permissions.has.mockReturnValue(true); // Ensure permission check passes
        const members = '<@!1> <@!2>';
        mockInteraction.options.getString.mockReturnValueOnce('Test Team').mockReturnValueOnce(members);
        mockInteraction.guild.roles.create.mockResolvedValue({ id: 'role-id', name: 'Team Test Team' });
        mockInteraction.guild.members.cache.get
            .mockReturnValueOnce({ roles: { add: jest.fn() }, nickname: 'Member1', user: { username: 'User1' } })
            .mockReturnValueOnce({ roles: { add: jest.fn() }, nickname: 'Member2', user: { username: 'User2' } });

        // Ensure the teams object is empty before creating a new team
        createTeamCommand.getTeams = jest.fn().mockReturnValue({});

        await createTeamCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.stringContaining('Team Test Team created with members: Member1, Member2.'));
        expect(googleSheets.writeToSheet).toHaveBeenCalled();
    });

    test('should update an existing team and assign roles', async () => {
        mockInteraction.member.permissions.has.mockReturnValue(true); // Ensure permission check passes
        const members = '<@!1> <@!2>';
        mockInteraction.options.getString.mockReturnValueOnce('Test Team').mockReturnValueOnce(members);
        createTeamCommand.getTeams = jest.fn().mockReturnValue({
            'Test Team': { members: ['1', '3'], currentTile: 0, previousTile: 0, canRoll: false, proofs: {} }
        });
        mockInteraction.guild.roles.cache.find.mockReturnValue({ id: 'role-id', name: 'Team Test Team' });
        mockInteraction.guild.members.cache.get
            .mockReturnValueOnce({ roles: { remove: jest.fn(), add: jest.fn() }, nickname: 'Member1', user: { username: 'User1' } })
            .mockReturnValueOnce({ roles: { remove: jest.fn(), add: jest.fn() }, nickname: 'Member3', user: { username: 'User3' } })
            .mockReturnValueOnce({ roles: { add: jest.fn() }, nickname: 'Member2', user: { username: 'User2' } });

        await createTeamCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.stringContaining('Team Test Team updated with members: Member1, Member2.'));
        expect(googleSheets.updateSheet).toHaveBeenCalled();
    });

    test('should handle Google Sheets error', async () => {
        mockInteraction.member.permissions.has.mockReturnValue(true); // Ensure permission check passes
        const members = '<@!1> <@!2>';
        mockInteraction.options.getString.mockReturnValueOnce('Test Team').mockReturnValueOnce(members);
        mockInteraction.guild.roles.create.mockResolvedValue({ id: 'role-id', name: 'Team Test Team' });
        mockInteraction.guild.members.cache.get
            .mockReturnValueOnce({ roles: { add: jest.fn() }, nickname: 'Member1', user: { username: 'User1' } })
            .mockReturnValueOnce({ roles: { add: jest.fn() }, nickname: 'Member2', user: { username: 'User2' } });
        googleSheets.writeToSheet.mockImplementation(() => {
            throw new Error('Google Sheets error');
        });

        await createTeamCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith('There was an error updating the Google Sheet. Please try again later.');
    });
});
