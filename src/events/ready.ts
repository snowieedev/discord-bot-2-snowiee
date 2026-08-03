import { Events } from 'discord.js';
import { CustomClient } from '../types';
import { runMigrations, seedDatabase } from '../database';

export const readyEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client: CustomClient) {
    console.log(`Ready! Logged in as ${client.user?.tag}`);
    await runMigrations();
    await seedDatabase();
  },
};
