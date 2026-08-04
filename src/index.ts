import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import { CustomClient } from './types';
import { postCommand } from './commands/post';
import { suggestionCommand } from './commands/suggestion';
import { suggestionsCommand } from './commands/suggestions';
import { bugCommand } from './commands/bug';
import { bugsCommand } from './commands/bugs';
import { interactionCreateEvent } from './events/interactionCreate';
import { readyEvent } from './events/ready';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
}) as CustomClient;

client.commands = new Collection();
client.commands.set(postCommand.data.name, postCommand);
client.commands.set(suggestionCommand.data.name, suggestionCommand);
client.commands.set(suggestionsCommand.data.name, suggestionsCommand);
client.commands.set(bugCommand.data.name, bugCommand);
client.commands.set(bugsCommand.data.name, bugsCommand);

client.once(readyEvent.name as any, (arg: any) => readyEvent.execute(arg));
client.on(interactionCreateEvent.name as any, (arg: any) => interactionCreateEvent.execute(arg, client));

async function main() {
  const token = process.env.DISCORD_TOKEN;
  const devGuildId = process.env.DEV_GUILD_ID;
  
  if (!token || token === 'your_bot_token_here') {
    console.warn('Warning: DISCORD_TOKEN is not properly set in .env');
  }

  // Register Slash Commands
  if (token && token !== 'your_bot_token_here') {
    try {
      const rest = new REST({ version: '10' }).setToken(token);
      
      // Get Bot ID
      const auth = await rest.get(Routes.user()) as any;
      const clientId = auth.id;

      const commandsData = Array.from(client.commands.values()).map(c => c.data.toJSON());
      
      console.log('Started refreshing application (/) commands.');

      if (devGuildId && devGuildId !== 'your_guild_id_here') {
        await rest.put(
          Routes.applicationGuildCommands(clientId, devGuildId),
          { body: commandsData },
        );
        console.log(`Successfully reloaded guild commands for guild ${devGuildId}.`);
      } else {
        await rest.put(
          Routes.applicationCommands(clientId),
          { body: commandsData },
        );
        console.log('Successfully reloaded global commands.');
      }
    } catch (error) {
      console.error('Error refreshing commands:', error);
    }
  }

  await client.login(token);
}

main().catch(console.error);
