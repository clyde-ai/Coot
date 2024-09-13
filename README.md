# Coot - Discord Bot

Welcome to **Coot**, a versatile Discord bot designed to enhance your server's gaming experience with fun and interactive commands. This README will guide you through the setup and usage of Coot's commands.

## Table of Contents
* Installation
* Commands
  * Admin Commands
    * /clear-ladders
    * /clear-snakes
    * /create-admin-team
    * /create-ladder
    * /create-snake
    * /create-team
    * /reroll
    * /review
    * /set-event-password
    * /set-event-time
  * User Commands
    * /roll
    * /submit
* Contributing
* License

## Installation
These instructions are for creating your own version of Coot.
To add Coot to your Discord server, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/clyde-ai/Coot.git
    ```
2. Navigate to the project directory:
    ```bash
    cd Coot
    ```
3. Install the required dependencies:
    ```bash
    npm install
    ```
4. Create the required resources:
    <pre><code> - Create a Google Cloud Project.
    - Create a Service Account with access to Google Cloud Vision API and Sheets API.
        - Editor permissions should be plenty.
        - Save the email address to this Service Account for later use.</code>
    - Create your *Discord Application: <a href="https://discord.com/developers/applications">discord/developers/applications</a>
        - Save off your Discord Token, Client and Secret for later use.
    - Create a Google Sheets document.
        - Create sheets for: Teams, Rolls, Submissions, Snakes, Ladders and EventPassword
        - Share the sheet with the email of your Google Service Account.
        - Copy down your Google Sheet ID for later use. Found in the URL of the sheet. 
    - Hosting (optional) - Currently I use Heroku, use any host you like.</code></pre>
5. Discord Bot Permissions:
    ```
    OAuth2 Scopes:
    - identify
    - messages.read
    - bot
    Bot Permissions:
      General
        - Manage Roles
        - View Channels
      Text Permissions
        - Send Messages
        - Embed Links
        - Attach Files
        - Read Message History
        - Mention Everyone
        - Add Reactions
        - Use Slash Commands
    Generated URL example:
    https://discord.com/oauth2/authorize?client_id={your-client-id}&permissions=2416168000&response_type=code&redirect_uri={your-base-url}%2Fcallback&integration_type=0&scope=identify+bot+messages.read
    ```
6. Create your .env file:
    ```
    DISCORD_TOKEN=discord-token-of-your-bot    - Token of your bot application.
    CLIENT_ID=client-id-of-your-bot    - Client Id from your bot application.
    GUILD_ID=discord-server-id    - ID of the server your bot will be using.
    ADMIN_ROLE_ID=admin-role-id    - ID of any role for using admin commands
    GOOGLE_SHEET_ID=google-sheet-id    - Sheet ID from URL of your Google Sheet.
    GOOGLE_CREDENTIALS_PATH=path-to-google-credentials    - Path to your credentials for local run.
    GOOGLE_CREDENTIALS=your-google-service-account-credentials   - JSON credentials
    BASE_URL=your-discord-bot-hosted-base-url   - ex: http://localhost:3000
    GIPHY_API_KEY=your-giphy-api-key    - used for random gifs, feel free to remove from bot.js
    WOM_URL=wise-old-man-comp-url    - url to your event competition in wise old man
    ```
6. Run the bot:
    ```bash
    npm start
    ```

## Commands
Overview of all the bot commands.  All /commands have their own files in the commands directory.

### Admin Commands
Requires Discord Server Administrator or self defined Admin Role from environment variables.

#### /clear-ladders
**Description:** Clears all ladders from the current game and Ladders Sheet.
**Parameters:** None

#### /clear-snakes
**Description:** Clears all snakes from the current game and Snakes Sheet.
**Parameters:** None

#### /clear-team
**Description:** Clears all snakes from the current game and Snakes Sheet.
**Parameters:** 
`teamName` (string) *required*: The name of the team or 'ALL' to clear all teams.

#### /create-admin-team
**Description:** Creates an admin team with specified members, assigning the designated Admin role to each member.
**Parameters:**
`members` (@user) *required*: The members to add to the admin team. Mention the members in the format <@user_id>.

#### /create-ladder
**Description:** Creates a ladder with a bottom and top tile number, writes to the Ladders Sheet.
**Parameters:**
`bottom` (int) *required*: The bottom tile number of the ladder. Must be lower than top.
`top` (int) *required*: The top tile number of the ladder. Must be higher than bottom.

#### /create-snake
**Description:** Creates a snake with a head and tail tile number, writes to the Snakes Sheet.
**Parameters:**
`head` (int) *required*: The head tile number of the snake. Must be higher than tail.
`tail` (int) *required*: The tail tile number of the snake. Must be lower than head.

#### /create-team
**Description:** Creates or edits an existing team with specified members, writes to the Teams Sheet. Also creates, assigns and removes custom team role. Role name format: {Team TeamName}
**Parameters:** 
`teamName` (string) *required*: The name of the team.
`members` (@user) *required*: The members to add to the team. @Mention the members in the format <@user_id>. 1-10 members can be assigned to a single team at once.

#### /reroll
**Description:** Rerolls a 6-sided dice for a specified team.
**Parameters:** 
`teamName` (string) *required*: The name of the team to reroll for.

#### /review
**Description:** Rerolls a 6-sided dice for a specified team.
**Parameters:** 
`teamName` (string) *required*: The name of the team to reroll for.

#### /set-event-password
**Description:** Sets the password that is used for submitting drops during the event.
**Parameters:** 
`eventPassword` (string) *required*: The name of the event password.

#### /set-event-time
**Description:** Sets the Event Start Time and End Time, writes to the EventPassword sheet.
**Parameters:** 
`starttime` (date) *required*: Set the Event Start Time format in your local time. Format: (YYYY-MM-DD HH:mm)
`endtime` (date) *required*: Set the Event End Time format in your local time. Format: (YYYY-MM-DD HH:mm)
`timezone` (string) *required*: Country/Region or city. *Ex: America/Chicago*
`channel` (#channel) *required*: The channel for the broadcast of the event starting. *Ex: #any-channel*

### User Commands
Requires a user to be on a team.

#### /roll
**Description:** Rolls a 6-sided dice for the current player/team, writes to the Rolls Sheet. This command checks the player’s team and updates the game state accordingly.
**Parameters:** None

#### /submit
**Description:** Submits proof of tile completion, writes to the Submissions Sheet. This command allows a team member to submit an image as proof that their team has completed the task associated with their current tile. This command scrubs proofs for the event password and any drop message details.
**Parameters:** 
`proof` (attachment) *required*: Proof of tile completion (image).

### Fun/Meme Commands
These don't actually do anything, they're just for fun.

#### !snake
**Description:** Bot replies with a random snake gif.

#### !ladder
**Description:** Bot replies with a random ladder fail gif.

#### !roll
**Description:** Bot rolls a 6 sided dice, for fun.

#### !promo
**Description:** Bot replies with a link to the event promotional video.

#### !event
**Description:** Bot replies with a description of the current event.

#### !board
**Description:** Bot replies with a link to the event board.

#### !wom
**Description:** Bot replies with a link to the event Wise Old Man competition page.

## Contributing
[Contributing](./CONTRIBUTING.md)

## Licensing
[MIT License](./LICENSE)