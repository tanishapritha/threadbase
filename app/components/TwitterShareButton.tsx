// app/components/TwitterShareButton.tsx
import Link from "next/link";

/**
 * Simple X (Twitter) share button that opens the intent URL in a new tab.
 * Props:
 *   - title: tweet text
 *   - url:   URL to share (absolute)
 *   - hashtags?: optional list of hashtags without '#'
 */
export const TwitterShareButton = ({
  title,
  url,
  hashtags,
}: {
  title: string;
  url: string;
  hashtags?: string[];
}) => {
  const base = "https://twitter.com/intent/tweet";
  const params = new URLSearchParams({
    text: title,
    url,
    ...(hashtags?.length && { hashtags: hashtags.join(",") }),
    // replace with your actual X handle if desired
    via: "yourhandle",
  });
  const href = `${base}?${params.toString()}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-[#1DA1F2] px-4 py-2 text-white hover:bg-[#1991da] transition-colors"
    >
      {/* X (Twitter) icon */}
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.954 4.569c-.885.392-1.83.656-2.825.775 1.014-.607 1.794-1.568 2.163-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-2.72 0-4.928 2.208-4.928 4.928 0 .386.044.762.128 1.124-4.094-.205-7.725-2.166-10.152-5.144-.424.726-.666 1.566-.666 2.465 0 1.702.866 3.2 2.182 4.078-.804-.026-1.562-.247-2.228-.616v.062c0 2.376 1.693 4.358 3.946 4.808-.413.112-.85.171-1.298.171-.317 0-.626-.031-.928-.088.627 1.956 2.445 3.376 4.6 3.416-1.68 1.318-3.809 2.105-6.115 2.105-.398 0-.79-.023-1.176-.069 2.179 1.397 4.768 2.213 7.557 2.213 9.054 0 14-7.496 14-13.986 0-.21-.005-.423-.014-.634.962-.695 1.8-1.562 2.46-2.549z" />
      </svg>
      Post on X
    </Link>
  );
};
