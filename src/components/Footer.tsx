const links = [
  { label: "son.do", href: "https://son.do" },
  { label: "GitHub", href: "https://github.com/donny-son/nlux" },
  {
    label: "MIT",
    href: "https://github.com/donny-son/nlux/blob/main/LICENSE",
  },
];

export default function Footer() {
  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-5 sm:justify-end sm:pr-6">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-white/70 backdrop-blur-md">
        {links.map((link, i) => (
          <span key={link.href} className="flex items-center gap-2">
            {i > 0 && (
              <span className="h-3 w-px bg-white/15" aria-hidden />
            )}
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
