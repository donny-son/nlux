"use client";

import { colorSchemes, type ColorScheme } from "../lib/colorSchemes";

type Props = {
  value: ColorScheme;
  onChange: (scheme: ColorScheme) => void;
};

export default function SchemePicker({ value, onChange }: Props) {
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
    </div>
  );
}
