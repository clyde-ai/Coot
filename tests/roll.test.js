const { Client, Collection } = require('discord.js');
const rollCommand = require('../commands/roll');
const createTeam = require('../commands/createTeam');

jest.mock('../commands/createTeam');

const mockInteraction = {
    commandName: 'roll',
    options: {
        getString: jest.fn(),
        getInteger: jest.fn(),
    },
    member: {
        permissions: {
            has: jest.fn().mockReturnValue(true),
        },
    },
    reply: jest.fn(),
    user: { id: '1234567890' },
    guild: {
        roles: {
            cache: {
                find: jest.fn().mockReturnValue({ name: 'Team Test Team' }),
            },
        },
    },
};

describe('/roll command', () => {
    let consoleWarnSpy;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock the getTeams method
        createTeam.getTeams = jest.fn().mockReturnValue({
            'Test Team': {
                members: ['1234567890'],
                currentTile: 0,
                canRoll: true,
            },
        });

        // Mock console.warn
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console.warn
        consoleWarnSpy.mockRestore();
    });

    test('should roll a dice and update the team tile', async () => {
        await rollCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('rolled'),
        }));
    });

    test('should not allow rolling if the team cannot roll', async () => {
        createTeam.getTeams.mockReturnValue({
            'Test Team': {
                members: ['1234567890'],
                currentTile: 1,
                canRoll: false,
            },
        });

        await rollCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith('Your team has not submitted proof for the current tile.');
    });
});
