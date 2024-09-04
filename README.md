# Coot - Discord Bot

Welcome to **Coot**, a versatile Discord bot designed to enhance your server's gaming experience with fun and interactive commands. This README will guide you through the setup and usage of Coot's commands.

## Table of Contents
- Installation
- Commands
  - /clear-ladders
  - /clear-snakes
  - /create-admin-team
  - /create-ladder
  - /create-snake
  - /create-team
  - /reroll
  - /roll
  - /submit
- Contributing
- License

## Installation

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
4. Run the bot:
    ```bash
    npm start
    ```

## Commands

### /clear-ladders
**Description:** Clears all ladders from the current game.

**Parameters:** None

**Usage:**
```plaintext
User: /clear-ladders
Bot: All ladders have been cleared from the game.
```

### /clear-snakes
**Description:** Clears all snakes from the current game.

**Parameters:** None

**Usage**
```plaintext
User: /clear-snakes
Bot: All snakes have been cleared from the game.
```

### /create-admin-team
**Description:** Creates an admin team with specified members. This command can only be used by administrators.

**Parameters:**
* `members` (string): The members to add to the admin team. Mention the members in the format <@user_id>. This parameter is required.

**Detailed Functionality:**
* Permission Check: The command checks if the user has administrator permissions. If not, it replies with a permission error message.
* Parameter Extraction: It extracts the members parameter from the command.
* Member Validation: It validates the provided member mentions and ensures there is at least one valid member.
* Role Assignment: It assigns the admin role to the specified members and retrieves their usernames.
* Response: It replies with a confirmation message indicating the creation of the admin team and lists the members.

**Usage**
```plaintext
User: /create-admin-team members:<@12345> <@67890>
Bot: Admin team created with members: User1, User2.
```

### /create-ladder
**Description:** Creates a ladder with a bottom and top tile number. This command can only be used by administrators.

**Parameters:**
* `bottom` (integer): The bottom tile number of the ladder. This parameter is required.
* `top` (integer): The top tile number of the ladder. This parameter is required.

**Detailed Functionality:**
* Permission Check: The command checks if the user has administrator permissions. If not, it replies with a permission error message.
* Parameter Extraction: It extracts the bottom and top parameters from the command.
* Validation: It validates the provided tile numbers to ensure they are valid integers.
* Ladder Creation: It stores the ladder in memory with the specified bottom and top tile numbers.
* Response: It replies with a confirmation message indicating the creation of the ladder.

**Usage**
```plaintext
User: /create-ladder bottom:5 top:15
Bot: Ladder created: from tile 5 to tile 15.
```

### /create-snake
**Description:** Creates a snake with a head and tail tile number. This command can only be used by administrators.

**Parameters:**
* `head` (integer): The head tile number of the snake. This parameter is required.
* `tail` (integer): The tail tile number of the snake. This parameter is required.

**Detailed Functionality:**
* Permission Check: The command checks if the user has administrator permissions. If not, it replies with a permission error message.
* Parameter Extraction: It extracts the head and tail parameters from the command.
* Validation: It validates the provided tile numbers to ensure they are valid integers.
* Snake Creation: It stores the snake in memory with the specified head and tail tile numbers.
* Response: It replies with a confirmation message indicating the creation of the snake.

**Usage**
```plaintext
User: /create-snake head:20 tail:5
Bot: Snake created: from tile 20 to tile 5.
```

### /create-team
**Description:** Creates or edits a team with specified members. This command can only be used by administrators.

**Parameters:** 
* `teamname` (string): The name of the team. This parameter is required.
* `members` (string): The members to add to the team. Mention the members in the format <@user_id>. This parameter is required.

**Detailed Functionality:**
* Permission Check: The command checks if the user has administrator permissions. If not, it replies with a permission error message.
* Parameter Extraction: It extracts the teamname and members parameters from the command.
* Member Validation: It validates the provided member mentions and ensures there is at least one member and no more than 10 members.
* Team Creation/Editing:
    * If the team already exists, it updates the team by:
        * Finding the existing role associated with the team.
        * Removing members who are no longer in the team.
        * Updating the team members.
    * If the team does not exist, it creates a new team by:
        * Creating a new role for the team.
        * Initializing the team data with members, current tile, previous tile, and other properties.
* Role Assignment: It assigns the new role to the specified members and retrieves their nicknames or usernames.
* Google Sheets Integration: It writes or updates the team data in a Google Sheet.
* Response: It replies with a confirmation message indicating whether the team was created or updated, along with the assigned role.

**Usage**
```plaintext
User: /create-team teamname:Warriors members:<@12345> <@67890>
Bot: Team Warriors created with members: User1, User2. Role <@&role_id> has been assigned to the team members.
```

### /reroll
**Description:** Rerolls a 6-sided dice for a specified team. This command can only be used by administrators.

**Parameters:** 
* `teamname` (string): The name of the team. This parameter is required.

**Detailed Functionality:**
* Permission Check: The command checks if the user has administrator permissions. If not, it replies with a permission error message.
* Parameter Extraction: It extracts the teamname parameter from the command.
* Team Validation: It checks if the specified team exists. If not, it replies with an error message.
* Dice Roll: It rolls a 6-sided dice and calculates the new tile position based on the team’s previous tile.
* Ladder and Snake Check: It checks if the new tile position has a ladder or snake and updates the position accordingly.
* Team Tile Update: It updates the team’s current tile and resets the roll permission.
* Google Sheets Integration: It writes the reroll data to a Google Sheet.
* Response: It replies with a confirmation message indicating the dice roll result and the new tile position. If the tile has a description or image, it includes them in the response.

**Usage**
```plaintext
User: /reroll teamname:Warriors
Bot: Reroll for <@&role_id>: rolled 4. Moves to tile 10. No description available.
```

### /roll
**Description:** Rolls a 6-sided dice for the current player. This command checks the player’s team and updates the game state accordingly.

**Parameters:** None

**Detailed Functionality:**
* Team Check: The command checks if the user is part of any team. If not, it replies with an error message.
* Roll Permission Check: It checks if the team has permission to roll. If not, it replies with an error message.
* Dice Roll: It rolls a 6-sided dice and calculates the new tile position.
* Ladder and Snake Check: It checks if the new tile position has a ladder or snake and updates the position

**Usage**
```plaintext
User: /roll
Bot: <@user_id> rolled 4. Team Warriors moves to tile 10. No description available.
```

### /submit
**Description:** Submits proof of tile completion. This command allows a team member to submit an image as proof that their team has completed the task associated with a specific tile.

**Parameters:** 
* `tile` (integer): The tile number. This parameter is required.
* `proof` (attachment): Proof of tile completion (image). This parameter is required.

**Detailed Functionality:**
* Parameter Extraction: The command extracts the tile and proof parameters from the command.
* Validation: It validates the provided tile number to ensure it is a valid integer.
* Team Check: It checks if the user is part of any team. If not, it replies with an error message.
* Tile Check: It checks if the team is currently on the specified tile. If not, it replies with an error message.
* Proof Submission: It stores the proof URL in the team’s data and allows the team to roll again.
* Google Sheets Integration: It writes the submission data to a Google Sheet.
* Response: It replies with a confirmation message indicating the successful submission of proof and allows the team to roll again.

**Usage**
```plaintext
User: /submit tile:10 proof:<attachment>
Bot: Proof for tile 10 submitted successfully by <@user_id> from team <@&role_id>. Any member of team <@&role_id> can now use the /roll command!
```

## Contributing
[Contributing](./CONTRIBUTING.md)

## Licensing
[MIT License](./LICENSE)