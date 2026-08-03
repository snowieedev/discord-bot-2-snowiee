import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';
import { BotConfig } from '../config';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL || '';

const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });

// Programmatic migrations
export async function runMigrations() {
  console.log('Running database migrations...');
  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
    console.log('Database migrations completed successfully!');
  } catch (error) {
    console.error('Failed to run database migrations:', error);
  }
}

// Seed Templates and Projects if needed (Normally this would be a separate script or migration)
export async function seedDatabase() {
  try {
    const existingProjects = await db.select().from(schema.projects);
    const existingProjectKeys = new Set(existingProjects.map(p => p.projectKey));
    
    for (const project of BotConfig.projects) {
      if (!existingProjectKeys.has(project.id)) {
        await db.insert(schema.projects).values({
          projectKey: project.id,
          name: project.name,
          description: project.description,
          url: project.url,
        });
        console.log(`Seeded project: ${project.name}`);
      }
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}
