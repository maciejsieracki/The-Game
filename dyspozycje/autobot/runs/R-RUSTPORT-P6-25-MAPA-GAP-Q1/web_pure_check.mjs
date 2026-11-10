// Weryfikacja czystych funkcji weba (gra/src/map/gen-helpers.ts @ edb8fb56, linie 57-118, 193-231)
// wzgledem stalych "golden" wpisanych w rust-port/engine/src/domain/map_generator.rs (testy :1348-:1540).
// Kod funkcji skopiowany werbatim (bez zmian logiki) - bez uruchamiania calej aplikacji.
function mulberry32(seed) { let s = seed >>> 0; return () => { s += 0x6d2b79f5; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function buildPermTable(rand) { const p = new Uint8Array(256); for (let i = 0; i < 256; i++) p[i] = i; for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const tmp = p[i]; p[i] = p[j]; p[j] = tmp; } return p; }
function cosLerp(a, b, t) { const f = (1 - Math.cos(t * Math.PI)) * 0.5; return a * (1 - f) + b * f; }
function valueNoise2D(p, x, y) { const xi = Math.floor(x) & 255; const yi = Math.floor(y) & 255; const xf = x - Math.floor(x); const yf = y - Math.floor(y); const hash = (ix, iy) => ((p[(p[ix & 255] + iy) & 255]) / 255); const v00 = hash(xi, yi), v10 = hash(xi + 1, yi), v01 = hash(xi, yi + 1), v11 = hash(xi + 1, yi + 1); const top = cosLerp(v00, v10, xf); const bottom = cosLerp(v01, v11, xf); return cosLerp(top, bottom, yf); }
function fbm(p, x, y, octaves = 4) { let value = 0, amplitude = 0.5, frequency = 1, maxValue = 0; for (let i = 0; i < octaves; i++) { value += valueNoise2D(p, x * frequency, y * frequency) * amplitude; maxValue += amplitude; amplitude *= 0.5; frequency *= 2.0; } return value / maxValue; }
const CLIMATE_POLAR_FRAC = 0.05, CLIMATE_DESERT_HALF_ROWS = 3.5, CLIMATE_PLAINS_HALF_FRAC = 0.075, BUF = 0.05;
function latBuf(height) { return Math.max(2, Math.round(height * BUF)); }
function climateBandAt(_q, r, height) { const buf = latBuf(height); const innerH = Math.max(1, height - 2 * buf); const relR = (r - buf) / Math.max(1, innerH - 1); if (relR < 0 || relR > 1) return r < height / 2 ? 'polar_north' : 'polar_south'; const dh = CLIMATE_DESERT_HALF_ROWS / innerH; const lo = 0.5 - dh, hi = 0.5 + dh; const pn = lo - CLIMATE_PLAINS_HALF_FRAC, ps = hi + CLIMATE_PLAINS_HALF_FRAC; if (relR < CLIMATE_POLAR_FRAC) return 'polar_north'; if (relR < pn) return 'temperate_north'; if (relR < lo) return 'plains_north'; if (relR < hi) return 'desert'; if (relR < ps) return 'plains_south'; if (relR < 1 - CLIMATE_POLAR_FRAC) return 'temperate_south'; return 'polar_south'; }

// terrainCellBias / hashInt3 (gen-helpers.ts:899-915, cellSize=4 z terenCoverageCellSize():889)
function hashInt3(a, b, c) { let h = (a * 374761393) ^ (b * 668265263) ^ (c * 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); h = (h ^ (h >>> 16)) >>> 0; return h / 4294967296; }
function terrainCellBias(q, r, seed, cell = 4) { return (hashInt3(Math.floor(q / cell), Math.floor(r / cell), seed) - 0.5) * 2; }
console.log('terrainCellBias (0,0,42),(4,0,42),(0,4,42),(9,7,12345) =', [[0, 0, 42], [4, 0, 42], [0, 4, 42], [9, 7, 12345]].map((a) => terrainCellBias(...a)).join(','), '| Rust: 0.23437289893627167,-0.6459841071628034,-0.14093960728496313,-0.0966324950568378');

const r = mulberry32(42);
const u = [0, 1, 2].map(() => Math.round(r() * 4294967296));
console.log('mulberry32(42) u32[0..3] =', u.join(','), '| Rust test: 2581720956,1925393290,3661312704');
const p = buildPermTable(mulberry32(42));
console.log('perm[0..16] =', Array.from(p.slice(0, 16)).join(','), '| Rust test: 79,208,113,244,223,165,38,9,182,5,2,108,57,25,210,177');
console.log('valueNoise2D(.25,.75) =', valueNoise2D(p, 0.25, 0.75), '| Rust: 0.7830546360319002');
console.log('valueNoise2D(4.5,3.25) =', valueNoise2D(p, 4.5, 3.25), '| Rust: 0.43968444970519815');
console.log('fbm(.25,.75,4) =', fbm(p, 0.25, 0.75, 4), '| Rust: 0.6691324071908695');
console.log('fbm(4.5,3.25,3) =', fbm(p, 4.5, 3.25, 3), '| Rust: 0.3772986771424662');
console.log('climateBandAt h=28 r=0,4,8,9,12,17,20,25 =', [0, 4, 8, 9, 12, 17, 20, 25].map((rr) => climateBandAt(0, rr, 28)).join(','), '| Rust: polar_north,temperate_north,temperate_north,plains_north,desert,plains_south,temperate_south,polar_south');
