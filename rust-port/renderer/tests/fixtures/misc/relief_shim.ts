// Test-harness shim for `render/mapRenderStyle.ts` as seen by
// `render/rangeOverlay.ts` only (R-RUSTPORT-P4-22-MOD13-MISC-Q1, build.mjs).
//
// Everything is the REAL web module; only `reliefSurfaceSampler` is wrapped:
// - mode "real" (default): calls the real web function unchanged;
// - mode "analytic": a closed-form height field for Gory / Wzgorza (null for
//   every other terrain, exactly like the real function), re-implemented in
//   `tests/misc_web_parity.rs` (`analytic_relief`).
export * from '../websrc/gra/src/render/mapRenderStyle';
import { reliefSurfaceSampler as realReliefSurfaceSampler } from '../websrc/gra/src/render/mapRenderStyle';
import { TerenBazowy } from '../websrc/gra/src/types/hex';

export function reliefSurfaceSampler(
  teren: TerenBazowy,
  q: number,
  r: number,
  seed: number,
  R = 1,
): ((x: number, z: number) => number) | null {
  const mode = (globalThis as { __MISC_RELIEF?: string }).__MISC_RELIEF ?? 'real';
  if (mode !== 'analytic') return realReliefSurfaceSampler(teren, q, r, seed, R);
  const amp = teren === TerenBazowy.Gory ? 1.1 : teren === TerenBazowy.Wzgorza ? 0.39 : 0;
  if (amp === 0) return null;
  const ph = ((q * 31 + r * 17 + seed) % 7) * 0.37;
  return (x: number, z: number) =>
    amp * Math.max(0, 1 - Math.hypot(x / R, z / R))
      * (0.8 + 0.2 * Math.cos(3 * x / R + ph) * Math.sin(2 * z / R - ph)) * R;
}
