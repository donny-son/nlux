import { driftAlgorithms, type FluxSettings } from "../components/FluxCanvas";

type NumericSettingKey = {
  [K in keyof FluxSettings]: FluxSettings[K] extends number ? K : never;
}[keyof FluxSettings];

export type SliderConfig = {
  key: NumericSettingKey;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
};

export const sliders: SliderConfig[] = [
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

export function randomFluxSettings(): Partial<FluxSettings> {
  const next: Partial<FluxSettings> = {};
  for (const slider of sliders) {
    const steps = Math.round((slider.max - slider.min) / slider.step);
    const value = slider.min + Math.round(Math.random() * steps) * slider.step;
    next[slider.key] = Number(value.toFixed(4));
  }
  next.algorithm =
    driftAlgorithms[Math.floor(Math.random() * driftAlgorithms.length)].id;
  return next;
}
