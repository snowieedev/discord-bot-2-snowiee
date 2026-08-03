import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  SlashCommandBuilder,
} from 'discord.js';

export interface Command {
  data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | any; // 'any' used here to bypass complex Discord.js builder type issues during simple setup
  execute: (interaction: ChatInputCommandInteraction) => Promise<void> | Promise<any>;
}

export interface CustomClient extends Client {
  commands: Collection<string, Command>;
}
