"use client";

import { useEffect } from "react";
import { driftAlgorithms, type FluxSettings } from "./FluxCanvas";
import { randomFluxSettings, sliders } from "../lib/fluxRandom";

type Props = {
  settings: FluxSettings;
  onChange: (settings: Partial<FluxSettings>) => void;
  onReset: () => void;
  open: boolean;
  onClose: () => void;
};

export default function ControlPanel({
  settings,
  onChange,
  onReset,
  open,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const randomize = () => onChange(randomFluxSettings());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="nlux control panel"
      className="pointer-events-auto fixed inset-0 z-20 flex items-end justify-center bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        onClick={(e) => e.stopPropagation()}
        className={[
          "w-full max-w-[26rem] max-h-[88dvh]",
          "flex flex-col overflow-hidden rounded-t-2xl border border-b-0 border-white/10",
          "bg-black/85 text-white shadow-2xl shadow-black/50 backdrop-blur-xl",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide">Control panel</h2>
            <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.24em] text-white/45">
              Flow field
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close control panel"
            className="rounded-full border border-white/10 p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden border-t border-white/10">
          <div className="flex gap-2 px-4 pt-3">
            <button
              type="button"
              onClick={randomize}
              className="flex-1 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20"
            >
              Randomize
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Reset
            </button>
          </div>

          <div className="px-4 pt-3">
            <span className="mb-1.5 block text-xs font-medium text-white/78">
              Algorithm
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {driftAlgorithms.map((algo) => {
                const active = settings.algorithm === algo.id;
                return (
                  <button
                    key={algo.id}
                    type="button"
                    onClick={() => onChange({ algorithm: algo.id })}
                    aria-pressed={active}
                    className={[
                      "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-white/20 bg-white/15 text-white"
                        : "border-white/10 text-white/65 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    {algo.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[calc(88dvh-9rem)] space-y-3 overflow-y-auto px-4 py-4">
            {sliders.map((slider) => {
              const value = settings[slider.key];
              return (
                <label key={slider.key} className="block">
                  <span className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-xs font-medium text-white/78">
                      {slider.label}
                    </span>
                    <span className="font-mono text-[0.68rem] text-white/48">
                      {slider.format(value)}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={value}
                    onChange={(event) =>
                      onChange({
                        [slider.key]: Number(event.currentTarget.value),
                      })
                    }
                    className="h-2 w-full cursor-pointer accent-white"
                  />
                </label>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
