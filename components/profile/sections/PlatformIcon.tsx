/**
 * Inline-SVG brand icons used across SocialLinksRender variants.
 * Kept in `currentColor` so each variant can colorize via CSS without
 * touching this file. Unknown platforms get a generic chain-link glyph
 * to avoid layout collapse.
 *
 * Originally lived inside SocialLinksRender.icon-list; lifted out so
 * the glow-buttons (Electric Fire Techno) variant can reuse it
 * without a private cross-import.
 */

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg {...ICON_PROPS}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...ICON_PROPS}>
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'soundcloud':
      return (
        <svg {...ICON_PROPS}>
          <path d="M3 14v4M6 12v6M9 10v8M12 8v10M15 10v8c2 0 4-1 4-4s-2-4-4-4" />
        </svg>
      );
    case 'spotify':
      return (
        <svg {...ICON_PROPS}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7 9.5c3-1 7-1 10 0.5M7.5 13c2.5-0.7 5.5-0.5 8 0.7M8 16c2-0.5 4-0.4 6 0.4" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...ICON_PROPS}>
          <path d="M14 4v10a4 4 0 1 1-4-4" />
          <path d="M14 4c1 2 3 3 5 3" />
        </svg>
      );
    case 'twitter':
      return (
        <svg {...ICON_PROPS}>
          <path d="M4 4l7 9-7 7h2l6-6 5 6h4l-8-10 7-6h-2l-6 5-4-5z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg {...ICON_PROPS}>
          <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z" />
          <path d="M8.5 9c0 4 3 6.5 6.5 6.5l1.5-1.5-2-1.5-1 1c-1-0.5-2-1.5-2.5-2.5l1-1-1.5-2L9 8z" />
        </svg>
      );
    case 'email':
      return (
        <svg {...ICON_PROPS}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
    default:
      return (
        <svg {...ICON_PROPS}>
          <path d="M10 14a3 3 0 0 0 4 0l3-3a3 3 0 0 0-4-4l-1 1" />
          <path d="M14 10a3 3 0 0 0-4 0l-3 3a3 3 0 0 0 4 4l1-1" />
        </svg>
      );
  }
}
