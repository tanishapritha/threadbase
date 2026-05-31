/**
 * Builds a Twitter intent URL for sharing/posting content.
 *
 * Opens twitter.com/compose/tweet with pre-filled text.
 * No API keys or OAuth required — the user posts as themselves on Twitter.
 * Works on mobile (opens Twitter app if installed).
 *
 * @param content - The tweet text (max 280 chars; trimmed with ellipsis if over)
 * @returns Full twitter.com/intent/tweet URL
 */
export function buildTwitterIntentUrl(content: string): string {
  const trimmed =
    content.length > 280
      ? content.slice(0, 277) + "..."
      : content;
  const encoded = encodeURIComponent(trimmed);
  return `https://twitter.com/intent/tweet?text=${encoded}`;
}
