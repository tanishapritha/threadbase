import { tasks, schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { eq, lt, and } from "drizzle-orm";
import { posts } from "@/lib/db/schema";

/**
 * Process Queue Task – runs every 15 minutes
 * to find posts that should be scheduled now.
 */
export const processQueue = schedules.task({
  id: "process-queue",
  cron: "*/15 * * * *",
  maxDuration: 300,
  run: async () => {
    const now = new Date();

    // Find all scheduled posts whose scheduledAt time has passed
    const pendingPosts = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.status, "scheduled"),
          lt(posts.scheduledAt, now)
        )
      );

    if (pendingPosts.length === 0) {
      console.log("No pending posts to process.");
      return;
    }

    console.log(`Processing ${pendingPosts.length} pending posts...`);

    // Trigger a schedule-post task for each one
    for (const post of pendingPosts) {
      try {
        await tasks.trigger("schedule-post", {
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
