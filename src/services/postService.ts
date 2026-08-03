import { db } from '../database';
import { posts, templates, projects } from '../database/schema';
import { eq } from 'drizzle-orm';
import { PostData } from '../embeds';

export class PostService {
  static async createDraft(authorId: string, channelId: string, data: PostData, projectId?: string) {
    let templateId: number | null = null;
    let projId: number | null = null;

    // Optional: resolve template ID from DB (assuming they exist or just using names)
    // For now we'll just save the data. Let's make sure template exists or just save name in metadata if we change schema.
    // Wait, our schema uses templateId referencing templates table. 
    // We should either ensure templates are in DB or just use text for now.
    // Let's adjust schema.ts later if needed, but for now we'll insert a dummy template if not exists.
    
    let templateRecord = await db.select().from(templates).where(eq(templates.name, data.templateType)).limit(1).then(r => r[0]);
    if (!templateRecord) {
      const inserted = await db.insert(templates).values({ name: data.templateType }).returning();
      templateRecord = inserted[0];
    }
    templateId = templateRecord.id;

    if (projectId && projectId !== 'none') {
      const projRecord = await db.select().from(projects).where(eq(projects.projectKey, projectId)).limit(1).then(r => r[0]);
      if (projRecord) {
        projId = projRecord.id;
      }
    }

    const inserted = await db.insert(posts).values({
      authorId,
      channelId,
      templateId,
      projectId: projId,
      title: data.title,
      description: data.description,
      color: data.color,
      image: data.image,
      isPublished: false,
      buttonUrl: (data as any).buttonUrl, // Cast since we add it to PostData in a bit
    }).returning();

    return inserted[0];
  }

  static async getPost(id: number) {
    return db.select().from(posts).where(eq(posts.id, id)).limit(1).then(r => r[0]);
  }
  
  static async getTemplateById(id: number) {
    return db.select().from(templates).where(eq(templates.id, id)).limit(1).then(r => r[0]);
  }

  static async markPublished(id: number, messageId: string) {
    await db.update(posts).set({
      isPublished: true,
      messageId,
      updatedAt: new Date(),
    }).where(eq(posts.id, id));
  }
  
  static async updateDraft(id: number, data: Partial<PostData>) {
    await db.update(posts).set({
      title: data.title,
      description: data.description,
      color: data.color,
      image: data.image,
      buttonUrl: (data as any).buttonUrl,
      updatedAt: new Date(),
    }).where(eq(posts.id, id));
  }
}
