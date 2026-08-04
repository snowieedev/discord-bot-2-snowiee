import { db } from '../database';
import { bugReports, bugHistory } from '../database/schema';
import { eq, and, desc, asc, ilike } from 'drizzle-orm';
import { SimilarityService } from './similarityService';
import { BotConfig } from '../config';

export class BugService {
  static async createBug(data: {
    projectKey: string;
    version: string;
    platform: string;
    severity: string;
    title: string;
    description: string;
    steps: string;
    expected: string;
    actual: string;
    attachmentUrl?: string;
    authorId: string;
  }) {
    const result = await db.insert(bugReports).values(data).returning();
    return result[0];
  }

  static async getBugById(id: number) {
    const result = await db.select().from(bugReports).where(eq(bugReports.id, id));
    return result[0];
  }

  static async updateBug(id: number, data: Partial<typeof bugReports.$inferInsert>) {
    const result = await db.update(bugReports).set({ ...data, updatedAt: new Date() }).where(eq(bugReports.id, id)).returning();
    return result[0];
  }

  static async updateBugStatus(id: number, newStatus: string, changedBy: string) {
    const bug = await this.getBugById(id);
    if (!bug) return null;

    if (bug.status !== newStatus) {
      await db.insert(bugHistory).values({
        bugId: id,
        changedBy,
        oldStatus: bug.status,
        newStatus,
      });
      return await this.updateBug(id, { status: newStatus });
    }
    return bug;
  }

  static async getSimilarBugs(title: string, description: string, projectKey: string) {
    const allBugs = await db.select().from(bugReports).where(eq(bugReports.projectKey, projectKey));
    const threshold = BotConfig.modules.bugs.duplicateThreshold;
    
    return allBugs
      .map(b => {
        const titleScore = SimilarityService.getSimilarityScore(title, b.title);
        const descScore = SimilarityService.getSimilarityScore(description, b.description);
        // Average or max score for similarity
        const score = Math.max(titleScore, descScore);
        return { bug: b, score };
      })
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map(item => item.bug);
  }

  static async getBugs(filters: { projectKey?: string; status?: string; severity?: string; authorId?: string; sort?: 'newest' | 'oldest' }) {
    let query = db.select().from(bugReports).$dynamic();
    
    const conditions = [];
    if (filters.projectKey) conditions.push(eq(bugReports.projectKey, filters.projectKey));
    if (filters.status) conditions.push(ilike(bugReports.status, filters.status));
    if (filters.severity) conditions.push(ilike(bugReports.severity, filters.severity));
    if (filters.authorId) conditions.push(eq(bugReports.authorId, filters.authorId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (filters.sort === 'newest') {
      query = query.orderBy(desc(bugReports.createdAt));
    } else if (filters.sort === 'oldest') {
      query = query.orderBy(asc(bugReports.createdAt));
    } else {
      query = query.orderBy(desc(bugReports.createdAt));
    }

    return await query;
  }
}
