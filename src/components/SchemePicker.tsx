"use client";

import { colorSchemes, type ColorScheme } from "../lib/colorSchemes";

type Props = {
  value: ColorScheme;
  onChange: (scheme: ColorScheme) => void;
};

export default function SchemePicker({ value, onChange }: Props) {
  const randomize = () => {
    const pool = colorSchemes.filter((s) => s.id !== value.id);
    const next =
      pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
    onChange(next);
  };

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/85 backdrop-blur-md">
      <span className="px-1 font-mono uppercase tracking-widest text-white/60">
        nlux
      </span>
      <span className="h-3 w-px bg-white/15" aria-hidden />
      {colorSchemes.map((s) => {
        const active = s.id === value.id;
        const last = s.stops[s.stops.length - 1].rgb;
        const first = s.stops[0].rgb;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={active}
            className={[
              "group inline-flex items-center gap-2 rounded-full px-3 py-1 transition-colors",
              active
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            <span
              aria-hidden
              className="h-3 w-6 rounded-full ring-1 ring-white/15"
              style={{
                background: `linear-gradient(90deg, rgb(${first.join(",")}), rgb(${last.join(",")}))`,
              }}
            />
            {s.name}
          </button>
        );
      })}
      <span className="h-3 w-px bg-white/15" aria-hidden />
      <button
        type="button"
        onClick={randomize}
        aria-label="Random color scheme"
        title="Random color scheme"
        className="inline-flex items-center justify-center rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path
            d="M1.5 4h2.2c.9 0 1.7.4 2.3 1.1l3.4 4.3c.6.7 1.4 1.1 2.3 1.1H14M11.5 2.5L14 4l-2.5 1.5M11.5 8.5L14 10l-2.5 1.5M1.5 10h2.2c.9 0 1.7-.4 2.3-1.1l.6-.7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
