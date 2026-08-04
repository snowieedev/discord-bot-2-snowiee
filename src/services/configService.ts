import { db } from '../database';
import { guildConfigs } from '../database/schema';
import { eq } from 'drizzle-orm';

export class ConfigService {
  static async getConfig(guildId: string) {
    const result = await db.select().from(guildConfigs).where(eq(guildConfigs.guildId, guildId));
    return result[0];
  }

  static async updateConfig(guildId: string, data: Partial<typeof guildConfigs.$inferInsert>) {
    const existing = await this.getConfig(guildId);
    if (existing) {
      const result = await db.update(guildConfigs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(guildConfigs.guildId, guildId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(guildConfigs)
        .values({ guildId, ...data })
        .returning();
      return result[0];
    }
  }

  static async getStaffRoles(guildId: string): Promise<string[]> {
    const config = await this.getConfig(guildId);
    if (!config || !config.staffRoleIds) return [];
    return config.staffRoleIds.split(',').map(r => r.trim()).filter(r => r.length > 0);
  }
}
