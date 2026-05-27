import { triggerClient } from '@/lib/trigger';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { posts, postPlatforms, connectedAccounts } from '@/lib/db/schema';
import { json } from 'drizzle-orm/pg-core';

/**
 * Schedule‑post task – runs at the scheduled time.
 * Payload: { postId: string, scheduledAt: string }
 */
export const schedulePost = triggerClient.defineTask({
  id: 'schedule-post',
  name: 'Schedule Post',
  version: '0.1',
  trigger: triggerClient.schedule('run-at', {
    // The trigger time is supplied in the payload (ISO string)
    at: (payload) => new Date(payload.scheduledAt),
  }),
  async run(payload) {
    const { postId } = payload as { postId: string };
    // Fetch post with its workspace and formatted content
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!post) throw new Error(`Post ${postId} not found`);
    if (post.status !== 'scheduled') return; // nothing to do

    // Load connected accounts for the workspace
    const accounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.workspaceId, post.workspaceId));

    const platforms = post.formattedContent ?? {};
    const results: Record<string, boolean> = {};

    for (const platform of Object.keys(platforms) as Array<'twitter' | 'linkedin'>) {
      const account = accounts.find((a) => a.platform === platform);
      if (!account) {
        results[platform] = false;
        continue;
      }

      const content = platforms[platform];
      try {
        // Placeholder publish call – replace with real SDK / API later
        const resp = await fetch(`https://api.${platform}.com/v2/post`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        if (!resp.ok) throw new Error(`Publish failed: ${resp.status}`);
        const data = await resp.json();
        // Update post_platforms row
        await db
          .update(postPlatforms)
          .set({
            status: 'posted',
            postedAt: new Date(),
            externalId: data.id,
          })
          .where(eq(postPlatforms.postId, postId))
          .where(eq(postPlatforms.platform, platform));
        results[platform] = true;
      } catch (e) {
        console.error(`Error publishing to ${platform}:`, e);
        results[platform] = false;
      }
    }

    const allSuccess = Object.values(results).every(Boolean);
    // Update post status
    await db
      .update(posts)
      .set({
        status: allSuccess ? 'posted' : 'failed',
        postedAt: allSuccess ? new Date() : undefined,
      })
      .where(eq(posts.id, postId));
  },
  retries: {
    attempts: 3,
    delay: '5 minutes',
  },
});
