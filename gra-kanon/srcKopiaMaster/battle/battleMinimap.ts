/**
 * battleMinimap.ts — Q2 minimap data contract + canvas renderer (D5=B).
 * ASCII-only source. No THREE.js dependency.
 */

/** One unit dot on the battle minimap. q=col, r=row (square grid). */
export interface BattleMinimapUnit {
  q: number;
  r: number;
  color: string;
}

/** Visible camera footprint on the battle field (tile indices, inclusive). */
export interface BattleMinimapViewport {
  colMin: number;
  rowMin: number;
  colMax: number;
  rowMax: number;
}

/** Full minimap payload — same contract as UI handoff Q2. */
export interface BattleMinimapData {
  cols: number;
  rows: number;
  terrain: number[];
  units: BattleMinimapUnit[];
  viewport: BattleMinimapViewport;
}

export const MINIMAP_W = 180;
export const MINIMAP_H = 120;

/** Simplified terrain tint for the minimap canvas. */
export function terrainMinimapColor(t: number): string {
  switch (t) {
    case 1: return '#1a4a28'; // forest
    case 2: return '#6a5a40'; // hills
    case 3: return '#1a3878'; // river
    case 4: return '#2a5098'; // ford
    case 5: return '#505050'; // rocks
    case 6: return '#888888'; // wall
    case 7: return '#a07030'; // gate
    default: return '#2a3a2a'; // plains
  }
}

/** Paint the minimap canvas from BattleMinimapData. */
export function drawBattleMinimap(
  ctx: CanvasRenderingContext2D,
  data: BattleMinimapData,
  w = MINIMAP_W,
  h = MINIMAP_H,
): void {
  const { cols, rows, terrain, units, viewport } = data;
  if (cols <= 0 || rows <= 0) return;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(12,18,35,0.92)';
  ctx.fillRect(0, 0, w, h);

  const cellW = w / cols;
  const cellH = h / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = terrain[r * cols + c] ?? 0;
      ctx.fillStyle = terrainMinimapColor(t);
      ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
    }
  }

  for (const u of units) {
    if (u.q < 0 || u.r < 0 || u.q >= cols || u.r >= rows) continue;
    ctx.fillStyle = u.color;
    const cx = (u.q + 0.5) * cellW;
    const cy = (u.r + 0.5) * cellH;
    const rad = Math.max(1.2, Math.min(cellW, cellH) * 0.32);
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const vx0 = Math.max(0, viewport.colMin) * cellW;
  const vy0 = Math.max(0, viewport.rowMin) * cellH;
  const vx1 = Math.min(cols, viewport.colMax + 1) * cellW;
  const vy1 = Math.min(rows, viewport.rowMax + 1) * cellH;
  ctx.strokeStyle = 'rgba(255,255,255,0.88)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(vx0 + 0.5, vy0 + 0.5, vx1 - vx0 - 1, vy1 - vy0 - 1);

  ctx.strokeStyle = 'rgba(232,216,138,0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

/** Map canvas pixel to field tile (col, row). Returns null if outside grid. */
export function minimapPixelToTile(
  px: number,
  py: number,
  data: BattleMinimapData,
  w = MINIMAP_W,
  h = MINIMAP_H,
): { col: number; row: number } | null {
  const { cols, rows } = data;
  if (cols <= 0 || rows <= 0) return null;
  const col = Math.floor((px / w) * cols);
  const row = Math.floor((py / h) * rows);
  if (col < 0 || row < 0 || col >= cols || row >= rows) return null;
  return { col, row };
}
