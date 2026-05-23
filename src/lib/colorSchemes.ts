// Color schemes inspired by Flux's presets. Each is a list of stops along
// [0, 1] that get sampled by the particle's flow angle.

export type RGB = readonly [number, number, number];
export type ColorStop = { t: number; rgb: RGB };

export type ColorScheme = {
  id: string;
  name: string;
  background: RGB;
  stops: ColorStop[];
};

const hex = (h: string): RGB => {
  const v = h.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ] as const;
};

export const colorSchemes: ColorScheme[] = [
  {
    id: "original",
    name: "Original",
    background: hex("#0a0a14"),
    stops: [
      { t: 0.0, rgb: hex("#3a1f8b") },
      { t: 0.25, rgb: hex("#a13ea1") },
      { t: 0.5, rgb: hex("#ff5577") },
      { t: 0.75, rgb: hex("#ff9a3c") },
      { t: 1.0, rgb: hex("#ffe066") },
    ],
  },
  {
    id: "plasma",
    name: "Plasma",
    background: hex("#06030f"),
    stops: [
      { t: 0.0, rgb: hex("#1d1158") },
      { t: 0.3, rgb: hex("#7a2bd1") },
      { t: 0.55, rgb: hex("#e23ca5") },
      { t: 0.8, rgb: hex("#ffb1d8") },
      { t: 1.0, rgb: hex("#7ec8ff") },
    ],
  },
  {
    id: "poolside",
    name: "Poolside",
    background: hex("#03101a"),
    stops: [
      { t: 0.0, rgb: hex("#0c2a4d") },
      { t: 0.3, rgb: hex("#127a8b") },
      { t: 0.6, rgb: hex("#34d2c8") },
      { t: 0.85, rgb: hex("#a8f3e9") },
      { t: 1.0, rgb: hex("#dffafa") },
    ],
  },
  {
    id: "freedom",
    name: "Freedom",
    background: hex("#070712"),
    stops: [
      { t: 0.0, rgb: hex("#15306b") },
      { t: 0.35, rgb: hex("#5a8bff") },
      { t: 0.5, rgb: hex("#f5f5ff") },
      { t: 0.65, rgb: hex("#ff7a7a") },
      { t: 1.0, rgb: hex("#a82130") },
    ],
  },
];

export function sampleScheme(scheme: ColorScheme, t: number): RGB {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  const stops = scheme.stops;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    if (x <= b.t) {
      const span = b.t - a.t || 1;
      const k = (x - a.t) / span;
      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * k),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * k),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * k),
      ] as const;
    }
  }
  return stops[stops.length - 1].rgb;
}

export const defaultSchemeId = "original";

export function randomScheme(exclude?: ColorScheme): ColorScheme {
  const pool = exclude
    ? colorSchemes.filter((s) => s.id !== exclude.id)
    : colorSchemes;
  const list = pool.length > 0 ? pool : colorSchemes;
  return list[Math.floor(Math.random() * list.length)];
}
