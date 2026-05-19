// Tiny seeded 3D value noise — fast and good enough for a flow field.
// Returns values in roughly [-1, 1].

const PERM_SIZE = 256;
const MASK = PERM_SIZE - 1;

function buildPermutation(seed: number): Uint8Array {
  const perm = new Uint8Array(PERM_SIZE * 2);
  for (let i = 0; i < PERM_SIZE; i++) perm[i] = i;

  let state = seed >>> 0 || 1;
  const rand = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };

  for (let i = PERM_SIZE - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  for (let i = 0; i < PERM_SIZE; i++) perm[i + PERM_SIZE] = perm[i];
  return perm;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function createNoise3D(seed = 1337) {
  const perm = buildPermutation(seed);

  const hash = (x: number, y: number, z: number) =>
    perm[(perm[(perm[x & MASK] + y) & MASK] + z) & MASK] / 255;

  return (x: number, y: number, z: number): number => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const xf = x - xi;
    const yf = y - yi;
    const zf = z - zi;

    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);

    const c000 = hash(xi, yi, zi);
    const c100 = hash(xi + 1, yi, zi);
    const c010 = hash(xi, yi + 1, zi);
    const c110 = hash(xi + 1, yi + 1, zi);
    const c001 = hash(xi, yi, zi + 1);
    const c101 = hash(xi + 1, yi, zi + 1);
    const c011 = hash(xi, yi + 1, zi + 1);
    const c111 = hash(xi + 1, yi + 1, zi + 1);

    const x00 = lerp(c000, c100, u);
    const x10 = lerp(c010, c110, u);
    const x01 = lerp(c001, c101, u);
    const x11 = lerp(c011, c111, u);

    const xy0 = lerp(x00, x10, v);
    const xy1 = lerp(x01, x11, v);

    return lerp(xy0, xy1, w) * 2 - 1;
  };
}

export type Noise3D = ReturnType<typeof createNoise3D>;

// Two-octave fbm — adds a bit of detail to the field without much cost.
export function fbm(noise: Noise3D, x: number, y: number, z: number): number {
  return noise(x, y, z) * 0.65 + noise(x * 2.13, y * 2.13, z * 1.7) * 0.35;
}
