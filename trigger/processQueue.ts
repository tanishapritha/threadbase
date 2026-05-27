import { triggerClient } from '@/lib/trigger';
import { db } from '@/lib/db';
import { eq, lt, and } from 'drizzle-orm';
import { posts } from '@/lib/db/schema';
import { schedulePost } from './schedulePost';

/**
 * Process Queue Task – runs periodically (e.g., every 15 minutes)
 * to find posts that should be scheduled now.
 */
export const processQueue = triggerClient.defineJob({
  id: 'process-queue',
  name: 'Process Scheduled Posts Queue',
  version: '0.1',
  trigger: triggerClient.schedule('run-every-15-mins', {
    cron: '*/15 * * * *',
  }),
  async run() {
    const now = new Date();

    // Find all scheduled posts whose scheduledAt time has passed
    const pendingPosts = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.status, 'scheduled'),
          lt(posts.scheduledAt, now)
        )
      );

    if (pendingPosts.length === 0) {
      console.log('No pending posts to process.');
      return;
    }

    console.log(`Processing ${pendingPosts.length} pending posts...`);

    // Enqueue a schedule-post task for each one
    for (const post of pendingPosts) {
      try {
        await schedulePost.invoke({
          postId: post.id,
          scheduledAt: post.scheduledAt!.toISOString(),
        });
        console.log(`Enqueued post ${post.id}`);
      } catch (error) {
        console.error(`Failed to enqueue post ${post.id}:`, error);
      }
    }
  },
});
