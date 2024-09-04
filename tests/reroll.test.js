const { SlashCommandBuilder } = require('@discordjs/builders');
const rerollCommand = require('../commands/reroll');
const createTeam = require('../commands/createTeam');
const createLadder = require('../commands/createLadder');
const createSnake = require('../commands/createSnake');
const tiles = require('../src/tiles');
const googleSheets = require('../src/utils/googleSheets');
const { PermissionsBitField } = require('discord.js');

jest.mock('../commands/createTeam');
jest.mock('../commands/createLadder');
jest.mock('../commands/createSnake');
jest.mock('../src/tiles');
jest.mock('../src/utils/googleSheets');

const mockInteraction = {
    commandName: 'reroll',
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
        },
    },
};

describe('/reroll command', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock the getTeams method
        createTeam.getTeams = jest.fn().mockReturnValue({
            'Test Team': {
                previousTile: 0,
                canRoll: true,
            },
        });

        // Mock the find method of tiles
        tiles.find = jest.fn();

        // Mock the getLadders method
        createLadder.getLadders = jest.fn().mockReturnValue([]);

        // Mock the getSnakes method
        createSnake.getSnakes = jest.fn().mockReturnValue([]);

        // Mock the writeToSheet method
        googleSheets.writeToSheet = jest.fn();

        // Mock console.error
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console.error
        consoleErrorSpy.mockRestore();
    });

    test('should not allow reroll if user lacks permissions', async () => {
        mockInteraction.member.permissions.has.mockReturnValue(false);

        await rerollCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith('You do not have permission to use this command.');
    });

    test('should reply with error if team does not exist', async () => {
        mockInteraction.member.permissions.has.mockReturnValue(true); // Ensure permission check passes
        mockInteraction.options.getString.mockReturnValue('NonExistentTeam');
        createTeam.getTeams.mockReturnValue({});

        await rerollCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith('Team NonExistentTeam does not exist.');
    });

    test('should reroll and update the team tile', async () => {
        mockInteraction.options.getString.mockReturnValue('Test Team');
        createTeam.getTeams.mockReturnValue({
            'Test Team': {
                previousTile: 0,
                canRoll: true,
            },
        });
        mockInteraction.guild.roles.cache.find.mockReturnValue({ toString: () => '@Team Test Team' });
        tiles.find.mockReturnValue({ tileNumber: 1, description: 'Test Tile', image: 'test.png' });

        await rerollCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('Reroll for @Team Test Team: rolled'),
        }));
        expect(googleSheets.writeToSheet).toHaveBeenCalled();
    });

    test('should handle landing on a ladder', async () => {
        mockInteraction.options.getString.mockReturnValue('Test Team');
        createTeam.getTeams.mockReturnValue({
            'Test Team': {
                previousTile: 0,
                canRoll: true,
            },
        });
        mockInteraction.guild.roles.cache.find.mockReturnValue({ toString: () => '@Team Test Team' });
        createLadder.getLadders.mockReturnValue([{ bottom: 3, top: 5 }]); // Ensure ladder's bottom is at tile 3
        tiles.find.mockReturnValue({ tileNumber: 5, description: 'Ladder Tile', image: 'ladder.png' });

        // Mock the random roll to ensure it lands on the ladder's bottom
        jest.spyOn(global.Math, 'random').mockReturnValue(2 / 6); // This will make the roll 3

        await rerollCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('landed on a ladder! After climbing up, moves to tile 5.'),
        }));

        // Restore the original Math.random
        global.Math.random.mockRestore();
    });

    test('should handle landing on a snake', async () => {
        mockInteraction.options.getString.mockReturnValue('Test Team');
        createTeam.getTeams.mockReturnValue({
            'Test Team': {
                previousTile: 0,
                canRoll: true,
            },
        });
        mockInteraction.guild.roles.cache.find.mockReturnValue({ toString: () => '@Team Test Team' });
        createSnake.getSnakes.mockReturnValue([{ head: 6, tail: 0 }]); // Ensure snake's head is at tile 6
        tiles.find.mockReturnValue({ tileNumber: 0, description: 'Snake Tile', image: 'snake.png' });

        // Mock the random roll to ensure it lands on the snake's head
        jest.spyOn(global.Math, 'random').mockReturnValue(5 / 6); // This will make the roll 6

        await rerollCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('landed on the head of a snake! Sliding back down, moves to tile 0.'),
        }));

        // Restore the original Math.random
        global.Math.random.mockRestore();
    });

    test('should handle Google Sheets error', async () => {
        mockInteraction.options.getString.mockReturnValue('Test Team');
        createTeam.getTeams.mockReturnValue({
            'Test Team': {
                previousTile: 0,
                canRoll: true,
            },
        });
        mockInteraction.guild.roles.cache.find.mockReturnValue({ toString: () => '@Team Test Team' });
        tiles.find.mockReturnValue({ tileNumber: 1, description: 'Test Tile', image: 'test.png' });
        googleSheets.writeToSheet.mockImplementation(() => {
            throw new Error('Google Sheets error');
        });

        await rerollCommand.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith('There was an error updating the Google Sheet. Please try again later.');
    });
});
