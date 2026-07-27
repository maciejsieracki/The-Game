'use strict';
/**
 * Buduje binarną maskę lądu Ziemi z earth-mask-source.png (mockup Macieja, decyzja A).
 * Uruchom: node tools/build-earth-mask.cjs
 * Wynik: src/map/earth-land-mask.generated.ts
 */
const fs = require('fs');
const path = require('path');
const { decode } = require('jpeg-js');

const SRC = path.resolve(__dirname, '../data/earth-mask-source.png');
const OUT = path.resolve(__dirname, '../src/map/earth-land-mask.generated.ts');

/** Wyższa rozdzielczość → mniej „schodków” na dużych mapach. */
const OUT_W = 720;
const OUT_H = 400;

function isLandColor(r, g, b) {
  if (r > 220 && g > 200 && b < 120) return true;
  if (r > 90 && r < 200 && g < 70 && b > 90 && b < 210) return true;
  if (g > 150 && r < 100 && b < 120) return true;
  if (r > 220 && g > 70 && g < 140 && b < 40) return true;
  if (r > 100 && g < 40 && b < 40) return true;
  if (r > 230 && g > 140 && g < 210 && b > 140 && b < 210) return true;
  if (r > 190 && g > 210 && b > 230) return true;
  return false;
}

/** Owal mapy w mockupie — bez pasków legendy u góry/dół. */
function isInOval(nx, ny) {
  if (ny < 0.06 || ny > 0.91) return false;
  const dx = (nx - 0.5) * 1.02;
  const dy = (ny - 0.47) * 1.22;
  return dx * dx + dy * dy <= 0.46;
}

/** C-MAP-Q3c: Antarktyda wyłączona — ląd redystrybuowany przez dilatację. */
function isAntarctica(nx, ny) {
  if (ny < 0.72) return false;
  const dx = (nx - 0.52) * 2.2;
  const dy = (ny - 0.855) * 4.5;
  return dx * dx + dy * dy <= 1;
}

function dilateLandGrid(grid, w, h, iterations) {
  let cur = grid.map((row) => row.split(''));
  for (let iter = 0; iter < iterations; iter++) {
    const next = cur.map((row) => row.slice());
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (cur[y][x] === '1') continue;
        const nx = x / (w - 1);
        const ny = y / (h - 1);
        if (isAntarctica(nx, ny)) continue;
        let adj = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (cur[y + dy][x + dx] === '1') adj++;
          }
        }
        if (adj >= 4) next[y][x] = '1';
      }
    }
    cur = next;
  }
  return cur.map((row) => row.join(''));
}

function sampleLand(src, sw, sh, nx, ny) {
  if (!isInOval(nx, ny)) return 0;
  const sx = Math.min(sw - 1, Math.max(0, Math.floor(nx * (sw - 1))));
  const sy = Math.min(sh - 1, Math.max(0, Math.floor(ny * (sh - 1))));
  const i = (sy * sw + sx) * 4;
  const r = src[i];
  const g = src[i + 1];
  const b = src[i + 2];
  const a = src[i + 3];
  if (a < 32) return 0;
  return isLandColor(r, g, b) ? 1 : 0;
}

function main() {
  const buf = fs.readFileSync(SRC);
  const { width: sw, height: sh, data } = decode(buf, { useTArray: true });

  const grid = [];
  let landCount = 0;
  let minX = OUT_W;
  let minY = OUT_H;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < OUT_H; y++) {
    let row = '';
    for (let x = 0; x < OUT_W; x++) {
      const nx = x / (OUT_W - 1);
      const ny = y / (OUT_H - 1);
      const landRaw = sampleLand(data, sw, sh, nx, ny);
      const land = landRaw && !isAntarctica(nx, ny) ? 1 : 0;
      landCount += land;
      row += land ? '1' : '0';
      if (land) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    grid.push(row);
  }

  const dilated = dilateLandGrid(grid, OUT_W, OUT_H, 3);
  grid.length = 0;
  grid.push(...dilated);
  landCount = 0;
  for (const row of grid) {
    for (const ch of row) landCount += ch === '1' ? 1 : 0;
  }
  minX = OUT_W;
  minY = OUT_H;
  maxX = 0;
  maxY = 0;
  for (let y = 0; y < OUT_H; y++) {
    for (let x = 0; x < OUT_W; x++) {
      if (grid[y][x] === '1') {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(OUT_W - 1, maxX + pad);
  maxY = Math.min(OUT_H - 1, maxY + pad);

  const bbox = {
    minX: minX / (OUT_W - 1),
    minY: minY / (OUT_H - 1),
    maxX: maxX / (OUT_W - 1),
    maxY: maxY / (OUT_H - 1),
  };

  const landFrac = (landCount / (OUT_W * OUT_H)).toFixed(3);
  const ts = `/**
 * AUTO-GENERATED — nie edytuj ręcznie.
 * Źródło: data/earth-mask-source.png (mockup Macieja, decyzja A 2026-07-04).
 * C-MAP-Q3c: Antarktyda wyłączona, ląd redystrybuowany (dilatacja ×3).
 * Regeneracja: node tools/build-earth-mask.cjs
 */
export const EARTH_MASK_W = ${OUT_W};
export const EARTH_MASK_H = ${OUT_H};
/** ~${landFrac} lądu w siatce maski (reszta morze). */
export const EARTH_MASK_BBOX = {
  minX: ${bbox.minX.toFixed(4)},
  minY: ${bbox.minY.toFixed(4)},
  maxX: ${bbox.maxX.toFixed(4)},
  maxY: ${bbox.maxY.toFixed(4)},
} as const;
export const EARTH_MASK_ROWS: readonly string[] = [
${grid.map((r) => `  '${r}',`).join('\n')}
];
`;

  fs.writeFileSync(OUT, ts, 'utf8');
  console.log(`earth mask: ${OUT_W}x${OUT_H}, land ~${(100 * landCount / (OUT_W * OUT_H)).toFixed(1)}%, bbox y=${bbox.minY.toFixed(2)}..${bbox.maxY.toFixed(2)} → ${OUT}`);
}

main();
