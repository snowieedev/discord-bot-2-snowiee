import { db } from '../database';
import { suggestions, suggestionVotes, suggestionHistory } from '../database/schema';
import { eq, and, desc, asc, ilike } from 'drizzle-orm';
import { SimilarityService } from './similarityService';
import { BotConfig } from '../config';

export class SuggestionService {
  static async createSuggestion(data: {
    projectKey: string;
    type: string;
    title: string;
    description: string;
    imageUrl?: string;
    authorId: string;
  }) {
    const result = await db.insert(suggestions).values(data).returning();
    return result[0];
  }

  static async getSuggestionById(id: number) {
    const result = await db.select().from(suggestions).where(eq(suggestions.id, id));
    return result[0];
  }

  static async updateSuggestion(id: number, data: Partial<typeof suggestions.$inferInsert>) {
    const result = await db.update(suggestions).set({ ...data, updatedAt: new Date() }).where(eq(suggestions.id, id)).returning();
    return result[0];
  }

  static async updateSuggestionStatus(id: number, newStatus: string, changedBy: string) {
    const suggestion = await this.getSuggestionById(id);
    if (!suggestion) return null;

    if (suggestion.status !== newStatus) {
      await db.insert(suggestionHistory).values({
        suggestionId: id,
        changedBy,
        oldStatus: suggestion.status,
        newStatus,
      });
      return await this.updateSuggestion(id, { status: newStatus });
    }
    return suggestion;
  }

  static async getSimilarSuggestions(title: string, projectKey: string) {
    const allSuggestions = await db.select().from(suggestions).where(eq(suggestions.projectKey, projectKey));
    const threshold = BotConfig.modules.suggestions.duplicateThreshold;
    
    return allSuggestions
      .map(s => ({ suggestion: s, score: SimilarityService.getSimilarityScore(title, s.title) }))
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map(item => item.suggestion);
  }

  static async getSuggestions(filters: { projectKey?: string; status?: string; authorId?: string; sort?: 'newest' | 'upvoted' }) {
    let query = db.select().from(suggestions).$dynamic();
    
    // Conditions
    const conditions = [];
    if (filters.projectKey) conditions.push(eq(suggestions.projectKey, filters.projectKey));
    if (filters.status) conditions.push(ilike(suggestions.status, filters.status));
    if (filters.authorId) conditions.push(eq(suggestions.authorId, filters.authorId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (filters.sort === 'newest') {
      query = query.orderBy(desc(suggestions.createdAt));
    }

    const results = await query;

    // Add upvotes info if needed
    // In a real scenario we'd do a join to sort by upvotes, for now we will get votes manually or join
    // Let's attach vote counts manually for simplicity or if the set is small
    const withVotes = await Promise.all(results.map(async s => {
      const votes = await db.select().from(suggestionVotes).where(eq(suggestionVotes.suggestionId, s.id));
      const upvotes = votes.filter(v => v.isUpvote).length;
      const downvotes = votes.filter(v => !v.isUpvote).length;
      return { ...s, upvotes, downvotes };
    }));

    if (filters.sort === 'upvoted') {
      withVotes.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    }

    return withVotes;
  }

  static async toggleVote(suggestionId: number, userId: string, isUpvote: boolean) {
    const existingVote = await db.select().from(suggestionVotes).where(
      and(eq(suggestionVotes.suggestionId, suggestionId), eq(suggestionVotes.userId, userId))
    );

    if (existingVote.length > 0) {
      if (existingVote[0].isUpvote === isUpvote) {
        // Remove vote if clicking the same one again
        await db.delete(suggestionVotes).where(
          and(eq(suggestionVotes.suggestionId, suggestionId), eq(suggestionVotes.userId, userId))
        );
        return 'removed';
      } else {
        // Change vote
        await db.update(suggestionVotes).set({ isUpvote }).where(
          and(eq(suggestionVotes.suggestionId, suggestionId), eq(suggestionVotes.userId, userId))
        );
        return 'changed';
      }
    } else {
      // Add vote
      await db.insert(suggestionVotes).values({
        suggestionId,
        userId,
        isUpvote,
      });
      return 'added';
    }
  }

  static async getVoteCounts(suggestionId: number) {
    const votes = await db.select().from(suggestionVotes).where(eq(suggestionVotes.suggestionId, suggestionId));
    const upvotes = votes.filter(v => v.isUpvote).length;
    const downvotes = votes.filter(v => !v.isUpvote).length;
    return { upvotes, downvotes };
  }
}
