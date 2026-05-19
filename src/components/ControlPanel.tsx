"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { driftAlgorithms, type FluxSettings } from "./FluxCanvas";

type Props = {
  settings: FluxSettings;
  onChange: (settings: Partial<FluxSettings>) => void;
  onReset: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

// Keys of FluxSettings whose value is a number — i.e. everything a slider
// can drive (excludes `algorithm`).
type NumericSettingKey = {
  [K in keyof FluxSettings]: FluxSettings[K] extends number ? K : never;
}[keyof FluxSettings];

type SliderConfig = {
  key: NumericSettingKey;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
};

const sliders: SliderConfig[] = [
  {
    key: "particleDensity",
    label: "Particles",
    min: 0.35,
    max: 2.5,
    step: 0.05,
    format: (value) => `${Math.round(value * 100)}%`,
  },
  {
    key: "flowSpeed",
    label: "Speed",
    min: 0.25,
    max: 2.5,
    step: 0.05,
    format: (value) => `${value.toFixed(2)}x`,
  },
  {
    key: "fieldScale",
    label: "Turbulence",
    min: 0.35,
    max: 2.25,
    step: 0.05,
    format: (value) => `${value.toFixed(2)}x`,
  },
  {
    key: "timeScale",
    label: "Drift",
    min: 0,
    max: 2.5,
    step: 0.05,
    format: (value) => `${value.toFixed(2)}x`,
  },
  {
    key: "streakSteps",
    label: "Steps",
    min: 1,
    max: 7,
    step: 1,
    format: (value) => `${value}`,
  },
  {
    key: "streakLength",
    label: "Streak",
    min: 0.25,
    max: 3,
    step: 0.05,
    format: (value) => `${value.toFixed(2)}x`,
  },
  {
    // Lower bound raised: very low fade = very long trails, which let the
    // additive glow accumulate into a grey haze instead of staying black.
    key: "trailFade",
    label: "Trail",
    min: 0.6,
    max: 2.25,
    step: 0.05,
    format: (value) => `${value.toFixed(2)}x`,
  },
  {
    key: "lineWidth",
    label: "Line",
    min: 0.45,
    max: 2.4,
    step: 0.05,
    format: (value) => `${value.toFixed(2)}x`,
  },
  {
    key: "particleSize",
    label: "Size",
    min: 0.4,
    max: 3,
    step: 0.05,
    format: (value) => `${value.toFixed(2)}x`,
  },
  {
    key: "glow",
    label: "Glow",
    min: 0.25,
    max: 1.75,
    step: 0.05,
    format: (value) => `${value.toFixed(2)}x`,
  },
];

const MARGIN = 16; // keep the panel this far from the viewport edges
const MOBILE_QUERY = "(max-width: 639px)";

const subscribeMobile = (callback: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
};
const getMobileSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;
const getMobileServerSnapshot = () => false;

type ControlsBodyProps = {
  settings: FluxSettings;
  onChange: (settings: Partial<FluxSettings>) => void;
  onReset: () => void;
  maxHeightClass: string;
};

function randomizeSettings(
  onChange: (settings: Partial<FluxSettings>) => void
) {
  const next: Partial<FluxSettings> = {};
  for (const slider of sliders) {
    const steps = Math.round((slider.max - slider.min) / slider.step);
    const value = slider.min + Math.round(Math.random() * steps) * slider.step;
    next[slider.key] = Number(value.toFixed(4));
  }
  next.algorithm =
    driftAlgorithms[Math.floor(Math.random() * driftAlgorithms.length)].id;
  onChange(next);
}

function ControlsBody({
  settings,
  onChange,
  onReset,
  maxHeightClass,
}: ControlsBodyProps) {
  return (
    <>
      <div className="flex gap-2 px-4 pt-3">
        <button
          type="button"
          onClick={() => randomizeSettings(onChange)}
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

      <div className={`space-y-3 overflow-y-auto px-4 py-4 ${maxHeightClass}`}>
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
    </>
  );
}

type DesktopPanelProps = {
  settings: FluxSettings;
  onChange: (settings: Partial<FluxSettings>) => void;
  onReset: () => void;
};

function DesktopPanel({ settings, onChange, onReset }: DesktopPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const clamp = useCallback((x: number, y: number) => {
    const el = panelRef.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    const maxX = Math.max(MARGIN, window.innerWidth - w - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - h - MARGIN);
    return {
      x: Math.min(Math.max(x, MARGIN), maxX),
      y: Math.min(Math.max(y, MARGIN), maxY),
    };
  }, []);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const x = window.innerWidth - el.offsetWidth - MARGIN;
    const y = (window.innerHeight - el.offsetHeight) / 2;
    setPos(clamp(x, y));
    setReady(true);
  }, [clamp]);

  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  const onHeaderPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const rect = panelRef.current!.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHeaderPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOffset.current) return;
    setPos(
      clamp(
        event.clientX - dragOffset.current.x,
        event.clientY - dragOffset.current.y
      )
    );
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragOffset.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section
      ref={panelRef}
      aria-label="nlux control panel"
      style={{ left: pos.x, top: pos.y }}
      className={[
        "pointer-events-auto fixed z-10 w-[min(21rem,calc(100vw-2rem))]",
        "overflow-hidden rounded-2xl border border-white/10 bg-black/45 text-white",
        "shadow-2xl shadow-black/35 backdrop-blur-xl",
        ready ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={[
          "flex touch-none select-none items-center justify-between gap-2 px-4 py-3",
          dragging ? "cursor-grabbing" : "cursor-grab",
        ].join(" ")}
      >
        <div>
          <h2 className="text-sm font-semibold tracking-wide">Control panel</h2>
          <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.24em] text-white/45">
            Flow field
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand control panel" : "Collapse control panel"}
          className="rounded-full border border-white/10 p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="border-t border-white/10">
          <ControlsBody
            settings={settings}
            onChange={onChange}
            onReset={onReset}
            maxHeightClass="max-h-[min(68dvh,31rem)]"
          />
        </div>
      )}
    </section>
  );
}

type MobileModalProps = {
  settings: FluxSettings;
  onChange: (settings: Partial<FluxSettings>) => void;
  onReset: () => void;
  onClose: () => void;
};

function MobileModal({ settings, onChange, onReset, onClose }: MobileModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
          <ControlsBody
            settings={settings}
            onChange={onChange}
            onReset={onReset}
            maxHeightClass="max-h-[calc(88dvh-4.5rem)]"
          />
        </div>
      </section>
    </div>
  );
}

export default function ControlPanel({
  settings,
  onChange,
  onReset,
  mobileOpen,
  onMobileClose,
}: Props) {
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getMobileServerSnapshot
  );

  if (isMobile) {
    if (!mobileOpen) return null;
    return (
      <MobileModal
        settings={settings}
        onChange={onChange}
        onReset={onReset}
        onClose={onMobileClose}
      />
    );
  }

  return (
    <DesktopPanel settings={settings} onChange={onChange} onReset={onReset} />
  );
}
