import { task } from "@trigger.dev/sdk/v3";
import { resend } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * send-scheduled-post-email — Triggered at the scheduled time.
 * Sends the user an email with their post content and a link to publish.
 */
export const sendScheduledPostEmail = task({
  id: "send-scheduled-post-email",
  maxDuration: 300,
  run: async (payload: { postId: string }) => {
    // 1. Fetch post from Supabase (with workspace owner)
    const { data: post, error: postError } = await supabaseAdmin
      .from("posts")
      .select("*, workspaces!inner(owner_id)")
      .eq("id", payload.postId)
      .single();

    if (postError || !post) {
      throw new Error("Post not found: " + payload.postId);
    }

    // 2. Fetch user email from users table
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("email, name")
      .eq("id", post.workspaces.owner_id)
      .single();

    if (userError || !user) {
      throw new Error("User not found for post: " + payload.postId);
    }

    // 3. Build the preview URL
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const previewUrl = `${appUrl}/post/${post.id}`;

    // 4. Get display content (prefer Twitter-formatted, fall back to raw idea)
    const twitterContent =
      (post.formatted_content as { twitter?: string })?.twitter ??
      post.raw_idea ??
      "";

    // 5. Send email via Resend
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: user.email,
      subject: "Your Threadbase post is ready to go live",
      html: buildEmailHtml({
        userName: user.name?.split(" ")[0] ?? "there",
        postContent: twitterContent,
        previewUrl,
        scheduledAt: post.scheduled_at,
        appUrl,
      }),
    });

    // 6. Update post status to 'email_sent'
    const { error: updateError } = await supabaseAdmin
      .from("posts")
      .update({
        status: "email_sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    if (updateError) {
      console.error("[sendScheduledPostEmail] Failed to update status:", updateError);
    }

    return { success: true, emailSentTo: user.email };
  },
});

function buildEmailHtml({
  userName,
  postContent,
  previewUrl,
  scheduledAt,
  appUrl,
}: {
  userName: string;
  postContent: string;
  previewUrl: string;
  scheduledAt: string;
  appUrl: string;
}) {
  const formattedDate = new Date(scheduledAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #ededed; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .logo { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 32px; }
    .logo span { display: inline-block; width: 10px; height: 10px; background: #fff; border-radius: 50%; margin-right: 8px; vertical-align: middle; }
    .card { background: #181818; border: 1px solid #222; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .greeting { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 8px; }
    .subtext { font-size: 14px; color: #888; margin-bottom: 20px; }
    .content { background: #111; border: 1px solid #222; border-radius: 12px; padding: 16px; font-size: 15px; line-height: 1.6; color: #ccc; margin-bottom: 24px; white-space: pre-wrap; }
    .btn { display: inline-block; background: #2563eb; color: #fff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 8px; }
    .footer { font-size: 12px; color: #555; margin-top: 32px; }
    .footer a { color: #888; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"><span></span>Threadbase</div>
    <div class="card">
      <div class="greeting">Hi ${userName}, your post is ready.</div>
      <div class="subtext">
        You scheduled this for ${formattedDate}. Click below to review and post it.
      </div>
      <div class="content">${postContent}</div>
      <a href="${previewUrl}" class="btn">View post and publish →</a>
    </div>
    <div class="footer">
      You're receiving this because you scheduled a post on Threadbase.
      <br />
      <a href="${appUrl}/dashboard">Manage your posts</a>
    </div>
  </div>
</body>
</html>`;
}
