type Props = {
  onOpenPanel: () => void;
};

const links = [
  { label: "son.do", href: "https://son.do" },
  { label: "GitHub", href: "https://github.com/donny-son/nlux" },
  {
    label: "MIT",
    href: "https://github.com/donny-son/nlux/blob/main/LICENSE",
  },
];

export default function Footer({ onOpenPanel }: Props) {
  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-5 sm:justify-end sm:pr-6">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-white/70 backdrop-blur-md">
        <button
          type="button"
          onClick={onOpenPanel}
          aria-label="Open control panel"
          title="Open control panel"
          className="inline-flex items-center gap-1 rounded-full px-1 transition-colors hover:text-white"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <circle cx="4.25" cy="4" r="1.25" fill="currentColor" />
            <path
              d="M7 4h6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="11.25" cy="8" r="1.25" fill="currentColor" />
            <path
              d="M3 8h5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="5.25" cy="12" r="1.25" fill="currentColor" />
            <path
              d="M8 12h5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Controls
        </button>
        <span className="h-3 w-px bg-white/15" aria-hidden />
        {links.map((link, i) => (
          <span key={link.href} className="flex items-center gap-2">
            {i > 0 && <span className="h-3 w-px bg-white/15" aria-hidden />}
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full px-1 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          </span>
        ))}
        <span className="h-3 w-px bg-white/15" aria-hidden />
        <span className="px-1 font-mono uppercase tracking-widest text-white/50">
          nlux
        </span>
      </div>
    </footer>
  );
}
