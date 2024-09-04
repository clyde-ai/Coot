const { Client, Collection } = require('discord.js');

const mockClient = {
    commands: new Collection(),
    on: jest.fn(),
    login: jest.fn(),
    user: {
        tag: 'TestBot#0001',
    },
};

const mockInteraction = {
    isCommand: jest.fn().mockReturnValue(true),
    commandName: '',
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
};

module.exports = {
    Client: jest.fn(() => mockClient),
    Collection,
    mockClient,
    mockInteraction,
};
