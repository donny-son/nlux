"use client";

import { useEffect, useRef } from "react";
import { createNoise3D, fbm, type Noise3D } from "../lib/noise";
import {
  sampleScheme,
  type ColorScheme,
  type RGB,
} from "../lib/colorSchemes";

type Particle = {
  x: number;
  y: number;
  px: number;
  py: number;
  age: number;
  life: number;
};

type Props = {
  scheme: ColorScheme;
  settings: FluxSettings;
};

const PARTICLE_DENSITY = 1 / 1800; // particles per CSS pixel
const MIN_PARTICLES = 800;
const MAX_PARTICLES = 6000;

const FIELD_SCALE = 0.0018; // spatial frequency of the noise field
const TIME_SCALE = 0.00012; // how fast the field evolves
const FLOW_SPEED = 1.4; // base particle speed (CSS px / frame at 60fps)
const CURL_EPSILON = 1; // px offset for the curl finite-difference
const STREAK_STEPS = 3; // sub-steps per frame — gives streaks length
const FADE_ALPHA = 0.06; // per-frame trail fade

// Trails always fade toward true black — never the scheme's tinted
// background — so untouched pixels stay pitch black on OLED screens.
const OLED_BLACK: RGB = [0, 0, 0];

// The field algorithm that decides where particles drift each step.
export type DriftAlgorithm = "curl" | "flow" | "orbit" | "waves" | "life";

export const driftAlgorithms: { id: DriftAlgorithm; name: string }[] = [
  { id: "curl", name: "Curl" },
  { id: "flow", name: "Flow" },
  { id: "orbit", name: "Orbit" },
  { id: "waves", name: "Waves" },
  { id: "life", name: "Life" },
];

export type FluxSettings = {
  algorithm: DriftAlgorithm;
  particleDensity: number;
  flowSpeed: number;
  fieldScale: number;
  timeScale: number;
  streakSteps: number;
  streakLength: number;
  trailFade: number;
  lineWidth: number;
  particleSize: number;
  glow: number;
};

export const defaultFluxSettings: FluxSettings = {
  algorithm: "curl",
  particleDensity: 1,
  flowSpeed: 1,
  fieldScale: 1,
  timeScale: 1,
  streakSteps: STREAK_STEPS,
  streakLength: 1,
  trailFade: 1,
  lineWidth: 1,
  particleSize: 1,
  glow: 1,
};

function rgbString(rgb: RGB, alpha: number) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function spawnParticle(p: Particle, w: number, h: number) {
  p.x = Math.random() * w;
  p.y = Math.random() * h;
  p.px = p.x;
  p.py = p.y;
  p.age = 0;
  p.life = 120 + Math.random() * 220;
}

function buildParticles(w: number, h: number, density: number): Particle[] {
  const target = Math.max(
    MIN_PARTICLES,
    Math.min(MAX_PARTICLES, Math.round(w * h * PARTICLE_DENSITY * density))
  );
  const out: Particle[] = new Array(target);
  for (let i = 0; i < target; i++) {
    const p: Particle = { x: 0, y: 0, px: 0, py: 0, age: 0, life: 0 };
    spawnParticle(p, w, h);
    p.age = Math.random() * p.life;
    out[i] = p;
  }
  return out;
}

// --- Conway's Game of Life --------------------------------------------
// A cellular automaton evolved on a coarse grid. The "life" algorithm
// turns its live structures into a flow field so particles swirl around
// clusters and trail behind gliders.
const LIFE_CELL = 22; // px per Game-of-Life cell
const LIFE_TICK_MS = 115; // base ms between generations
const LIFE_SEED_DENSITY = 0.3; // fraction of cells alive on a fresh seed

class GameOfLife {
  private cols = 0;
  private rows = 0;
  private grid = new Uint8Array(0);
  private next = new Uint8Array(0);
  private field = new Float32Array(0); // 3x3-blurred density, [0, 1]
  private acc = 0; // ms accumulated toward the next generation
  private generation = 0;

  resize(w: number, h: number) {
    const cols = Math.max(8, Math.ceil(w / LIFE_CELL));
    const rows = Math.max(8, Math.ceil(h / LIFE_CELL));
    if (cols === this.cols && rows === this.rows) return;
    this.cols = cols;
    this.rows = rows;
    this.grid = new Uint8Array(cols * rows);
    this.next = new Uint8Array(cols * rows);
    this.field = new Float32Array(cols * rows);
    this.seed();
  }

  private seed() {
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i] = Math.random() < LIFE_SEED_DENSITY ? 1 : 0;
    }
    this.acc = 0;
    this.generation = 0;
    this.computeField();
  }

  private tick() {
    const { cols, rows, grid, next } = this;
    let alive = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = (x + dx + cols) % cols; // toroidal wrap
            const ny = (y + dy + rows) % rows;
            n += grid[ny * cols + nx];
          }
        }
        const i = y * cols + x;
        const live = n === 3 || (grid[i] === 1 && n === 2) ? 1 : 0;
        next[i] = live;
        alive += live;
      }
    }
    grid.set(next);
    this.generation++;
    // Re-seed once life nearly dies out or the run gets long enough to
    // stagnate, so the field never goes permanently still. Resetting the
    // accumulator prevents a newly seeded board from being fast-forwarded
    // through queued ticks in the same animation frame.
    if (alive < grid.length * 0.02 || this.generation > 600) {
      this.seed();
      return;
    }
    this.computeField();
  }

  private computeField() {
    const { cols, rows, grid, field } = this;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = (x + dx + cols) % cols;
            const ny = (y + dy + rows) % rows;
            sum += grid[ny * cols + nx];
          }
        }
        field[y * cols + x] = sum / 9;
      }
    }
  }

  update(dtMs: number, timeScale: number) {
    if (this.cols === 0 || timeScale <= 0) return;
    this.acc += dtMs * timeScale;
    let ticks = 0;
    while (this.acc >= LIFE_TICK_MS && ticks < 4) {
      this.acc -= LIFE_TICK_MS;
      this.tick();
      ticks++;
    }
  }

  // Bilinear sample of the blurred density field at fractional cell
  // coordinates, wrapping toroidally to match the simulation.
  sample(cx: number, cy: number): number {
    const { cols, rows, field } = this;
    if (cols === 0) return 0;
    let fx = cx % cols;
    if (fx < 0) fx += cols;
    let fy = cy % rows;
    if (fy < 0) fy += rows;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = (x0 + 1) % cols;
    const y1 = (y0 + 1) % rows;
    const tx = fx - x0;
    const ty = fy - y0;
    const a = field[y0 * cols + x0];
    const b = field[y0 * cols + x1];
    const c = field[y1 * cols + x0];
    const d = field[y1 * cols + x1];
    return (
      a * (1 - tx) * (1 - ty) +
      b * tx * (1 - ty) +
      c * (1 - tx) * ty +
      d * tx * ty
    );
  }

  draw(ctx: CanvasRenderingContext2D, scheme: ColorScheme, w: number, h: number, glow: number) {
    const { cols, rows, grid, field } = this;
    if (cols === 0) return;

    const cellW = w / cols;
    const cellH = h / rows;
    const inset = Math.max(1, Math.min(cellW, cellH) * 0.12);
    const liveW = Math.max(1, cellW - inset * 2);
    const liveH = Math.max(1, cellH - inset * 2);

    ctx.save();
    ctx.lineWidth = 1;

    // Faint density halo around active neighborhoods makes Life clusters
    // readable without hiding the trails.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const density = field[y * cols + x];
        if (density <= 0) continue;
        const rgb = sampleScheme(scheme, (x / cols + y / rows) * 0.5);
        ctx.fillStyle = rgbString(rgb, density * 0.055 * glow);
        ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
      }
    }

    // Crisp live cells: this is the actual cellular automaton state.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y * cols + x] === 0) continue;
        const rgb = sampleScheme(
          scheme,
          (x / cols + this.generation * 0.013) % 1
        );
        const px = x * cellW + inset;
        const py = y * cellH + inset;
        ctx.fillStyle = rgbString(rgb, 0.32 * glow);
        ctx.fillRect(px, py, liveW, liveH);
        ctx.strokeStyle = rgbString(rgb, 0.42 * glow);
        ctx.strokeRect(px + 0.5, py + 0.5, Math.max(1, liveW - 1), Math.max(1, liveH - 1));
      }
    }

    ctx.restore();
  }
}

// Reused scratch vector so the per-particle hot loop allocates nothing.
const vel = { x: 0, y: 0 };

// Computes the (normalized) drift direction at a point for the chosen
// algorithm and writes it into `vel`.
function fieldVelocity(
  algo: DriftAlgorithm,
  noise: Noise3D,
  x: number,
  y: number,
  fieldScale: number,
  tScaled: number,
  eps: number,
  w: number,
  h: number,
  life: GameOfLife
) {
  const sx = x * fieldScale;
  const sy = y * fieldScale;

  switch (algo) {
    case "flow": {
      // Direct noise → heading angle. Compressible — particles funnel onto
      // convergence lines, the screensaver-style streamline look.
      const angle = fbm(noise, sx, sy, tScaled) * Math.PI * 2.2;
      vel.x = Math.cos(angle);
      vel.y = Math.sin(angle);
      break;
    }
    case "orbit": {
      // Rotate around the screen centre with a noise-driven radial wobble,
      // so particles spiral in galaxy-like arms.
      let dx = x - w * 0.5;
      let dy = y - h * 0.5;
      const r = Math.hypot(dx, dy) || 1;
      dx /= r;
      dy /= r;
      const radial = fbm(noise, sx, sy, tScaled) * 0.5;
      vel.x = -dy + dx * radial;
      vel.y = dx + dy * radial;
      break;
    }
    case "waves": {
      // Steady horizontal drift, displaced vertically by travelling sines.
      const n = fbm(noise, sx, sy, tScaled);
      vel.x = 1;
      vel.y = Math.sin(y * 0.012 + tScaled * 40 + n * 3) * 1.1;
      break;
    }
    case "life": {
      // Curl of a running Game of Life's density field — particles swirl
      // around live structures and trail behind gliders. Falls back to
      // curl noise in dead space so they keep drifting until captured.
      const e = 0.7;
      const cx = x / LIFE_CELL;
      const cy = y / LIFE_CELL;
      const gx = life.sample(cx, cy + e) - life.sample(cx, cy - e);
      const gy = -(life.sample(cx + e, cy) - life.sample(cx - e, cy));
      const lifeWeight = Math.min(1, Math.hypot(gx, gy) * 16);
      if (lifeWeight >= 1) {
        vel.x = gx;
        vel.y = gy;
      } else {
        const dPsiDy =
          fbm(noise, sx, sy + eps, tScaled) - fbm(noise, sx, sy - eps, tScaled);
        const dPsiDx =
          fbm(noise, sx + eps, sy, tScaled) - fbm(noise, sx - eps, sy, tScaled);
        vel.x = gx * lifeWeight + dPsiDy * (1 - lifeWeight);
        vel.y = gy * lifeWeight - dPsiDx * (1 - lifeWeight);
      }
      break;
    }
    case "curl":
    default: {
      // Curl of an fbm stream function — divergence-free swirling eddies.
      const dPsiDy =
        fbm(noise, sx, sy + eps, tScaled) - fbm(noise, sx, sy - eps, tScaled);
      const dPsiDx =
        fbm(noise, sx + eps, sy, tScaled) - fbm(noise, sx - eps, sy, tScaled);
      vel.x = dPsiDy;
      vel.y = -dPsiDx;
      break;
    }
  }

  const mag = Math.hypot(vel.x, vel.y) || 1;
  vel.x /= mag;
  vel.y /= mag;
}

function step(
  particles: Particle[],
  noise: Noise3D,
  life: GameOfLife,
  ctx: CanvasRenderingContext2D,
  scheme: ColorScheme,
  settings: FluxSettings,
  w: number,
  h: number,
  t: number
) {
  ctx.lineCap = "round";
  ctx.lineWidth = 1.1 * settings.lineWidth * settings.particleSize;
  const streakLength = settings.streakLength;
  const streakSteps = Math.max(1, Math.round(settings.streakSteps));
  const fieldScale = FIELD_SCALE * settings.fieldScale;
  const timeScale = TIME_SCALE * settings.timeScale;
  const flowSpeed = FLOW_SPEED * settings.flowSpeed;
  const tScaled = t * timeScale;
  const eps = CURL_EPSILON * fieldScale; // finite-difference step in noise space
  const algo = settings.algorithm;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    for (let s = 0; s < streakSteps; s++) {
      fieldVelocity(algo, noise, p.x, p.y, fieldScale, tScaled, eps, w, h, life);
      const vx = vel.x;
      const vy = vel.y;

      const speed = flowSpeed * (0.7 + 0.3 * Math.sin(p.age * 0.04));

      p.px = p.x;
      p.py = p.y;
      p.x += vx * speed;
      p.y += vy * speed;
      p.age += 1 / streakSteps;

      // Wrap around edges so the field stays full.
      const wrapped =
        p.x < -2 || p.x > w + 2 || p.y < -2 || p.y > h + 2;

      if (!wrapped) {
        const colorT = (Math.atan2(vy, vx) / Math.PI + 1) * 0.5;
        const rgb = sampleScheme(scheme, colorT);
        const lifeFade =
          Math.sin((p.age / p.life) * Math.PI) * 0.85 + 0.05;

        ctx.strokeStyle = rgbString(rgb, lifeFade * settings.glow);
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        // Draw the streak scaled along the direction of travel — longer
        // than the actual step when streakLength > 1, shorter when < 1.
        ctx.lineTo(
          p.px + (p.x - p.px) * streakLength,
          p.py + (p.y - p.py) * streakLength
        );
        ctx.stroke();
      } else {
        spawnParticle(p, w, h);
      }

      if (p.age >= p.life) spawnParticle(p, w, h);
    }
  }
}

export default function FluxCanvas({ scheme, settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const schemeRef = useRef(scheme);
  const settingsRef = useRef(settings);

  // Keep a ref to the latest scheme so the animation loop reads it without
  // restarting on every prop change.
  useEffect(() => {
    schemeRef.current = scheme;
  }, [scheme]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const noise = createNoise3D(0xc0ffee);
    const life = new GameOfLife();

    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let particles: Particle[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      cssW = canvas.clientWidth || window.innerWidth;
      cssH = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = rgbString(OLED_BLACK, 1);
      ctx.fillRect(0, 0, cssW, cssH);
      particles = buildParticles(cssW, cssH, settingsRef.current.particleDensity);
      life.resize(cssW, cssH);
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let running = true;
    let t0 = performance.now();
    let lastNow = t0;

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        t0 = performance.now();
        lastNow = t0;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const loop = (now: number) => {
      const t = now - t0;
      const dt = Math.min(now - lastNow, 100); // clamp tab-refocus jumps
      lastNow = now;
      const currentScheme = schemeRef.current;
      const currentSettings = settingsRef.current;

      // Advance the Game of Life only while the "life" algorithm is active.
      if (currentSettings.algorithm === "life") {
        life.update(dt, currentSettings.timeScale);
      }

      // Trail fade — paints translucent true black over the previous frame
      // so trails decay all the way to pitch black instead of a grey haze.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = rgbString(
        OLED_BLACK,
        FADE_ALPHA * currentSettings.trailFade
      );
      ctx.fillRect(0, 0, cssW, cssH);

      // Particles draw additively for that glowy Flux look. When Life is
      // active, draw the automaton grid itself first so the algorithm reads
      // as cells instead of only as a curl-like flow field.
      ctx.globalCompositeOperation = "lighter";
      if (currentSettings.algorithm === "life") {
        life.draw(ctx, currentScheme, cssW, cssH, currentSettings.glow);
      }
      step(
        particles,
        noise,
        life,
        ctx,
        currentScheme,
        currentSettings,
        cssW,
        cssH,
        t
      );

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [settings.particleDensity]);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full"
      aria-label="nlux animation"
    />
  );
}
