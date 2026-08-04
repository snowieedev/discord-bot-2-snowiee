# Discord Community Bot - Post System

Welcome to the Discord Community Bot! This repository contains the first module: a robust and modular **Post System** capable of generating beautiful Discord embeds using slash commands.

This bot is built with **Node.js 22+**, **TypeScript**, **Discord.js v14**, **PostgreSQL**, and **Drizzle ORM**.

---

## 1. Discord Developer Portal

To run this bot, you first need to create a Discord Application and get a Bot Token.

### Creating a Discord Application
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click the **New Application** button in the top right.
3. Give your bot a name and click **Create**.

### Setting Up the Bot
1. In the left sidebar, click on **Bot**.
2. Click **Reset Token** to generate a new Bot Token. **Copy this token and save it somewhere safe; you will need it later.**
3. Scroll down to the **Privileged Gateway Intents** section.
4. Enable the following intents (while only Guilds are used now, others might be needed for future modules):
   - **Presence Intent**
   - **Server Members Intent**
   - **Message Content Intent**
5. Click **Save Changes**.

### Inviting the Bot to Your Server
1. In the left sidebar, click on **OAuth2** -> **URL Generator**.
2. Under **Scopes**, check the `bot` and `applications.commands` boxes.
3. Under **Bot Permissions**, check **Administrator** (or just the permissions you want to give, but Administrator is easiest for community management bots).
4. Copy the generated URL at the bottom and open it in a new tab to invite the bot to your server.

---

## 2. Local Development

### Prerequisites
- Install **Node.js** (v22 or newer recommended) from [nodejs.org](https://nodejs.org/).
- Install **Git** from [git-scm.com](https://git-scm.com/).

### Installation
1. Clone this repository or download the source code.
2. Open a terminal in the project directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
5. Open `.env` and fill in your details:
   - `DISCORD_TOKEN`: The token you copied from the Developer Portal.
   - `DATABASE_URL`: Your PostgreSQL database URL (see section 3).
   - `DEV_GUILD_ID`: (Optional) The ID of your testing server. This makes slash commands register instantly during development.

### Running the Bot
To start the bot in development mode (which automatically restarts when you save a file):
```bash
npm run dev
```

To build the bot for production:
```bash
npm run build
npm run start
```

---

## 3. PostgreSQL Database

This bot uses PostgreSQL to store posts, templates, and projects.

### Local Setup
1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/).
2. Create a new database for your bot using a tool like pgAdmin or the command line.
3. Update your `.env` file with the connection URL. A standard local URL looks like this:
   `postgresql://postgres:yourpassword@localhost:5432/your_database_name`

### Database Migrations
Database migrations are automatically run by the bot when it starts up. You do not need to run manual migration commands.

---

## 4. Railway Deployment

Railway is a great platform for hosting Node.js apps and databases.

### Initial Setup
1. Create a [Railway](https://railway.app/) account and link your GitHub.
2. Push your bot's code to a GitHub repository.

### Adding the Database
1. In the Railway dashboard, click **New Project**.
2. Select **Provision PostgreSQL**.
3. Wait for the database to be created. Click on it, go to the **Connect** tab, and copy the **Postgres Connection URL**.

### Deploying the Bot
1. In the same Railway project, click **New** (or the `+` icon) and select **GitHub Repo**.
2. Select your bot's repository.
3. Railway will start deploying, but it will fail because environment variables are missing.
4. Click on your deployed bot service, go to the **Variables** tab, and add:
   - `DISCORD_TOKEN` = (Your Bot Token)
   - `DATABASE_URL` = (Paste the Postgres Connection URL from the step above)
5. Wait for the bot to redeploy. The bot will automatically run database migrations and create the tables on startup.

### Viewing Logs
To see if your bot is running or to debug errors, click on your bot service in Railway and go to the **Deployments** tab. Click **View Logs** on the latest deployment.

---

## 5. Discord Updates & Customization

### Updating Slash Commands
Commands are automatically registered when the bot starts. If you add a new command or change options, just restart the bot, and it will update Discord automatically.

### Customizing the Brand
To change the bot's default color, logo, footer text, or projects, open `src/config/index.ts` and modify the `BotConfig` object.

### Adding New Templates
The templates are listed in `src/commands/post.ts`. If you want to add a new one:
1. Add its name to the `templates` array in `src/commands/post.ts`.
2. The bot will automatically handle the new template and apply the base embed styling.
3. (Optional) If you want specific custom logic for a template, modify the `createBaseEmbed` function in `src/embeds/index.ts`.

---

## 6. Suggestions & Bug Reports Modules

The bot includes robust systems for handling Suggestions and Bug Reports, designed to feel comparable to GitHub Issues.

### How Suggestions Work
1. **Creation**: Users run `/suggestion`, select a project and type, and fill out a modal (Title, Description, Image URL).
2. **Duplicate Detection**: The system checks existing suggestions for the same project. If similar ones exist (based on a similarity threshold), it warns the user before posting.
3. **Voting**: Users can Upvote or Downvote suggestions using interactive buttons. Members cannot cast multiple votes.
4. **Discussion**: A "💬 Discussion" button automatically creates a dedicated thread for the suggestion.
5. **Staff Management**: Staff can update the status (Pending, Reviewing, Planned, In Progress, etc.) via a dropdown on the suggestion message.
6. **Search**: Use the `/suggestions` command to filter and sort suggestions by Project, Status, Author, or Top Upvoted.

### How Bug Reports Work
1. **Creation**: Users run `/bug`, select the project, version, platform, and severity. Then they fill out a modal with Title, Description, Steps to Reproduce, and Expected/Actual behavior.
2. **Duplicate Detection**: Similar to suggestions, it warns the user if similar bugs have been reported.
3. **Discussion**: A dedicated button creates a thread for the bug report.
4. **Severity Colors**: Embeds are color-coded based on severity (Critical = Red, High = Orange, Medium = Yellow, Low = Blue).
5. **Staff Management**: Staff can update bug statuses (Open, Investigating, Confirmed, Fixed, etc.) via a dropdown.
6. **Search**: Use the `/bugs` command to filter by Project, Status, Severity, and Reporter.

### Database Schema
The database (managed via Drizzle ORM) includes tables for these modules:
- `suggestions`: Stores all suggestion data, status, and linked message/thread IDs.
- `suggestion_votes`: Tracks individual user votes (Upvote/Downvote) to prevent duplicates.
- `suggestion_history`: Keeps an audit trail of status changes.
- `bug_reports`: Stores bug report data including steps to reproduce, expected/actual behaviors.
- `bug_history`: Keeps an audit trail of bug status changes.
- `threads`: Stores metadata for created threads.

### Configuration
Everything is fully configurable in `src/config/index.ts` and `.env`:
- **Channels**: Set `SUGGESTIONS_CHANNEL_ID` and `BUGS_CHANNEL_ID` in your `.env`.
- **Permissions**: Add staff roles to `STAFF_ROLE_IDS` in `.env` (comma-separated).
- **Projects**: Edit `BotConfig.projects` in `src/config/index.ts` to add or remove projects. These projects appear in the slash command dropdowns.
- **Colors & Statuses**: Customize colors for different statuses and severities in `BotConfig.modules`.
- **Duplicate Detection**: Adjust `duplicateThreshold` (default `0.6`) in `BotConfig.modules` to make duplicate detection more or less sensitive.
- **Thread Creation**: Toggle `autoCreateThread` in the config if you want threads created automatically upon submission.

### Permissions
- **Everyone** can create suggestions, bug reports, vote, and search.
- **Staff** (defined by `STAFF_ROLE_IDS` or Administrator permission) can change statuses via the interactive dropdowns on the embeds. Status changes are audited in the database history tables.
