// R-RUSTPORT-P4-28-RASTER-SHAPES-Q1 — reference generator for tests/raster_scenes.rs
// and tests/raster_color.rs.
//
// 1. Transcribes the SHAPE part (no text, no SVG/JPG decoding) of every web
//    Canvas-2D producer T1–T15 (+ H1) from pin edb8fb56 into scenes. The scene
//    functions below are copies of the web code with `ctx` replaced by a
//    recording context; every scene names its source as `file:line` in pin
//    edb8fb56 (paths relative to gra/src). Images that the web loads
//    asynchronously (portraits JPG, SVG sigils/icons) are replaced by
//    synthetic source canvases (`src_*` scenes): decoding is RR-T8c.
// 2. Writes scenes.tsv (the single op list both sides execute).
// 3. Replays every scene on a REAL CanvasRenderingContext2D in Chromium
//    (Playwright, headless, --disable-gpu, willReadFrequently: true → software
//    Skia raster) and stores getImageData() as ref/<scene>.rgba (straight RGBA8).
// 4. Probes CSS colour parsing in Chromium → colors.tsv.
// 5. Writes MANIFEST.sha256.
//
// Run (from rust-port/renderer/tests/fixtures/raster):
//   NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen.mjs
// Measured with: node v22.22.0, playwright 1.56.1, chromium-1194 (version printed to versions.txt).

import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

// ---------------------------------------------------------------------------
// Recording context (same member names as CanvasRenderingContext2D)
// ---------------------------------------------------------------------------
let gradSeq = 0;
class Grad {
  constructor(rec, id) { this.rec = rec; this.id = id; }
  addColorStop(o, c) { this.rec.ops.push(['stop', this.id, o, c]); }
}
class Rec {
  constructor() { this.ops = []; }
  set fillStyle(v) { this.ops.push(v instanceof Grad ? ['fillGrad', v.id] : ['fillStyle', v]); }
  set strokeStyle(v) { if (v instanceof Grad) throw new Error('strokeStyle = gradient: not used by the web pin (RR-T8a scope)'); this.ops.push(['strokeStyle', v]); }
  set lineWidth(v) { this.ops.push(['lineWidth', v]); }
  set lineJoin(v) { this.ops.push(['lineJoin', v]); }
  set shadowColor(v) { this.ops.push(['shadowColor', v]); }
  set shadowBlur(v) { this.ops.push(['shadowBlur', v]); }
  set shadowOffsetY(v) { this.ops.push(['shadowOffsetY', v]); }
  createLinearGradient(x0, y0, x1, y1) {
    const id = ++gradSeq;
    this.ops.push(['grad', id, x0, y0, x1, y1]);
    return new Grad(this, id);
  }
  save() { this.ops.push(['save']); }
  restore() { this.ops.push(['restore']); }
  translate(x, y) { this.ops.push(['translate', x, y]); }
  rotate(a) { this.ops.push(['rotate', a]); }
  setTransform(a, b, c, d, e, f) { this.ops.push(['setTransform', a, b, c, d, e, f]); }
  beginPath() { this.ops.push(['beginPath']); }
  moveTo(x, y) { this.ops.push(['moveTo', x, y]); }
  lineTo(x, y) { this.ops.push(['lineTo', x, y]); }
  quadraticCurveTo(a, b, c, d) { this.ops.push(['quadraticCurveTo', a, b, c, d]); }
  arc(x, y, r, s, e, ccw) { this.ops.push(['arc', x, y, r, s, e, ccw === true]); }
  arcTo(a, b, c, d, r) { this.ops.push(['arcTo', a, b, c, d, r]); }
  roundRect(x, y, w, h, r) { this.ops.push(['roundRect', x, y, w, h, r]); }
  closePath() { this.ops.push(['closePath']); }
  fill() { this.ops.push(['fill']); }
  stroke() { this.ops.push(['stroke']); }
  clip() { this.ops.push(['clip']); }
  fillRect(x, y, w, h) { this.ops.push(['fillRect', x, y, w, h]); }
  strokeRect(x, y, w, h) { this.ops.push(['strokeRect', x, y, w, h]); }
  clearRect(x, y, w, h) { this.ops.push(['clearRect', x, y, w, h]); }
  /** `img` = name of an earlier scene (its canvas is the source image). */
  drawImage(img, x, y, w, h) { this.ops.push(['drawImage', img.scene, img.width, img.height, x, y, w, h]); }
}
const IMG = (scene, width, height) => ({ scene, width, height });

const scenes = [];
function scene(name, w, h, src, fn) {
  const ctx = new Rec();
  fn(ctx);
  scenes.push({ name, w, h, src, ops: ctx.ops });
}

// ---------------------------------------------------------------------------
// Web constants (copied with their formulas; pin edb8fb56)
// ---------------------------------------------------------------------------
const HEX_R = 1.0; // render/hexutil.ts:24
// render/unitStatPlate.ts:92-138, :306-312
const PLATE_BAR_W = 0.55 * HEX_R;
const PLATE_BAR_H = 0.056 * HEX_R;
const PLATE_BAR_GAP = 0.042 * HEX_R;
const PLATE_HP_BAR_Y = 0.820 * HEX_R;
const PLATE_MOVE_BAR_Y = PLATE_HP_BAR_Y + PLATE_BAR_H + PLATE_BAR_GAP;
const PLATE_PAD = 0.020 * HEX_R;
const PLATE_BG_W = PLATE_BAR_W + 2 * PLATE_PAD;
const PLATE_BG_H = 2 * PLATE_BAR_H + PLATE_BAR_GAP + 2 * PLATE_PAD;
const PLATE_BG_Y = (PLATE_HP_BAR_Y + PLATE_MOVE_BAR_Y) / 2;
const PLATE_BORDER_CSS = 'rgba(212,175,90,0.70)';
const PLATE_FILL_CSS = 'rgba(9,13,20,0.88)';
const VITALS_TROUGH_CSS = 'rgba(0,0,0,0.62)'; // render/unitVitalsPalette.ts:89
const BG_CANVAS_W = 512;
const BG_CANVAS_H = Math.round((BG_CANVAS_W * PLATE_BG_H) / PLATE_BG_W);
// render/unitStatPlate.ts:219-220, :537-538
const PLATE_POWER_BOX_W = 0.24 * HEX_R;
const PLATE_POWER_BOX_H = 0.20 * HEX_R;
const POWER_FRAME_CANVAS_W = 256;
const POWER_FRAME_CANVAS_H = Math.round((POWER_FRAME_CANVAS_W * PLATE_POWER_BOX_H) / PLATE_POWER_BOX_W);
// render/unitOwnerEmblem.ts:173-205
const EMBLEM_CANVAS_PX = 128;
const RING_COLOR = { civ: '#e8d88a', cityState: '#b9c8d8', barbarian: '#c84040' };
const DISC_FILL = 'rgba(12,17,26,0.92)';
const DISC_R = 54;
const DISC_RING_W = 14;
const DISC_PORTRAIT_R = 48;
const DISC_SIGIL_SIDE = 76;
// render/unitUpgradeBadges.ts:115-124, :197, :206, :268
const PATH_BADGE_COLOR = { 1: 0xb9762e, 2: 0xd6e2ee, 3: 0xf2a81c };
const badgeColorCss = (level) => '#' + PATH_BADGE_COLOR[level].toString(16).padStart(6, '0');
const BADGE_CANVAS_PX = 128;
const ICON_DRAW_PX = 92;
const PLATE_FILL = 'rgba(10,14,22,0.90)';
// render/workerFieldOverlay.ts:22-43
const WORKER_OWNER_COLORS = [0xffd54a, 0xe53935, 0x43a047, 0x1e88e5, 0xfb8c00, 0x8e24aa];
const workerOwnerColor = (id) => WORKER_OWNER_COLORS[id % WORKER_OWNER_COLORS.length];
const hexToRgba = (hex, alpha) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${alpha})`;
const workerOwnerColorRgba = (id, a) => hexToRgba(workerOwnerColor(id), a);
// render/cityOkolicaOverlay.ts:104-110
const WORKER_BADGE_R = 9;
const WORKER_BADGE_CY = 16;
const WORKER_BADGE_RING_DR = 4;
const WORKER_BADGE_RING_LW = 3.5;
const WORKER_BADGE_RIM_DR = 5.5;
// render/cityMapStatChip.ts:80-88, :95, :189-206
const DEFENSE_COLORS = { 1: { fill: '#9a9aa8', stroke: '#c8c8d4' }, 2: { fill: '#e8d88a', stroke: '#fff4c8' } };
const CIV_SIGIL_STROKE = '#e8d88a';
const CIV_MEDALLION_R = 16;
const CIV_SLOT_W = 38;
const PROD_SLOT_W = 20;
const HOVER_ROW_H = 22;
const PILL_RING_LINE_W = 2;
const CAPITAL_RING_LINE_W = 3.5;
const CAPITAL_RING_COLOR = 'rgba(255, 233, 168, 0.98)';
const CAPITAL_INNER_RING_INSET = 6;
const CAPITAL_INNER_RING_LINE_W = 1.2;
const CAPITAL_INNER_RING_COLOR = 'rgba(232, 216, 138, 0.42)';
const CAPITAL_CROWN_SLOT_W = 19;
const CAPITAL_CROWN_W = 17;
const CAPITAL_CROWN_H = 13;

// ---------------------------------------------------------------------------
// Web helper functions (verbatim bodies)
// ---------------------------------------------------------------------------
// render/unitStatPlate.ts:314-326
function plateRoundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
// render/unitUpgradeBadges.ts:270-278
function badgeRoundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
// render/cityMapStatChip.ts:405-424
function chipRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
// render/cityMapStatChip.ts:427-457
function drawDefenseShield(ctx, cx, cy, tier) {
  const pal = DEFENSE_COLORS[tier];
  const w = 14;
  const h = 16;
  const x = cx - w * 0.5;
  const y = cy - h * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(x + w, y + h * 0.22);
  ctx.lineTo(x + w, y + h * 0.62);
  ctx.quadraticCurveTo(cx, y + h + 2, x, y + h * 0.62);
  ctx.lineTo(x, y + h * 0.22);
  ctx.closePath();
  ctx.fillStyle = pal.fill;
  ctx.fill();
  ctx.strokeStyle = pal.stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (tier === 2) {
    ctx.beginPath();
    ctx.moveTo(cx, y + 3);
    ctx.lineTo(cx, y + h - 4);
    ctx.strokeStyle = 'rgba(42, 34, 8, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
// render/cityMapStatChip.ts:466-517
function drawCapitalCrown(ctx, cx, cy, w = CAPITAL_CROWN_W, h = CAPITAL_CROWN_H) {
  const x = cx - w * 0.5;
  const y = cy - h * 0.5;
  const bandH = h * 0.26;
  const bandY = y + h - bandH;
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#fff6d2');
  grad.addColorStop(0.55, '#f2df9a');
  grad.addColorStop(1, '#d8c069');
  ctx.beginPath();
  ctx.moveTo(x, bandY + 0.5);
  ctx.lineTo(x, y + h * 0.16);
  ctx.lineTo(x + w * 0.26, y + h * 0.62);
  ctx.lineTo(cx, y);
  ctx.lineTo(x + w * 0.74, y + h * 0.62);
  ctx.lineTo(x + w, y + h * 0.16);
  ctx.lineTo(x + w, bandY + 0.5);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  chipRoundedRect(ctx, x, bandY, w, bandH, bandH * 0.4);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 244, 200, 0.85)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = 'rgba(42, 34, 8, 0.55)';
  for (const [gx, gy] of [[x + w * 0.10, y + h * 0.28], [cx, y + h * 0.16], [x + w * 0.90, y + h * 0.28]]) {
    ctx.beginPath();
    ctx.arc(gx, gy, 0.95, 0, Math.PI * 2);
    ctx.fill();
  }
}
// render/cityMapStatChip.ts:519-537
function drawCivMedallionDisc(ctx, cx, cy, ownerColor) {
  const r = CIV_MEDALLION_R;
  const col = ownerColor ?? 0xffd54a;
  const rr = (col >> 16) & 0xff;
  const gg = (col >> 8) & 0xff;
  const bb = col & 0xff;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${Math.round(rr * 0.55)}, ${Math.round(gg * 0.55)}, ${Math.round(bb * 0.55)})`;
  ctx.fill();
  ctx.strokeStyle = '#e8d88a';
  ctx.lineWidth = 2;
  ctx.stroke();
}
// render/cityMapStatChip.ts:546-575 (image branch; the '◆' text fallback is RR-T8b)
function drawCivMedallion(ctx, cx, cy, ownerColor, content) {
  drawCivMedallionDisc(ctx, cx, cy, ownerColor);
  const r = CIV_MEDALLION_R;
  const usePortrait = !content?.isCityState && content?.portraitImg;
  const img = usePortrait ? content.portraitImg : content?.sigilImg;
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
    ctx.clip();
    if (usePortrait) {
      const side = (r - 1.5) * 2;
      const scale = Math.max(side / img.width, side / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, cx - w / 2, cy - (r - 1.5), w, h);
    } else {
      const side = r * 1.55;
      ctx.drawImage(img, cx - side / 2, cy - side / 2, side, side);
    }
    ctx.restore();
  }
}
// render/cityMapStatChip.ts:658-667
function drawProdIcon(ctx, cx, cy, img) {
  const side = 16;
  if (!img) return;
  ctx.drawImage(img, cx - side * 0.5, cy - side * 0.5, side, side);
}
// render/cityMapStatChip.ts:670-682 (the '!' glyph is RR-T8b)
function drawResourceWarningIcon(ctx, cx, cy) {
  const r = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#8a4a10';
  ctx.fill();
  ctx.strokeStyle = '#e8a040';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}
// render/unitOwnerEmblem.ts:242-254
function drawDisc(ctx, variant) {
  const c = EMBLEM_CANVAS_PX / 2;
  ctx.clearRect(0, 0, EMBLEM_CANVAS_PX, EMBLEM_CANVAS_PX);
  ctx.fillStyle = DISC_FILL;
  ctx.beginPath();
  ctx.arc(c, c, DISC_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = RING_COLOR[variant];
  ctx.lineWidth = DISC_RING_W;
  ctx.beginPath();
  ctx.arc(c, c, DISC_R, 0, Math.PI * 2);
  ctx.stroke();
}
// render/unitOwnerEmblem.ts:266-280
function drawPortrait(ctx, img) {
  const c = EMBLEM_CANVAS_PX / 2;
  const r = DISC_PORTRAIT_R;
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();
  const side = r * 2;
  const scale = Math.max(side / img.width, side / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, c - w / 2, c - r, w, h);
  ctx.restore();
}
// render/unitOwnerEmblem.ts:284-288
function drawSigil(ctx, img) {
  const c = EMBLEM_CANVAS_PX / 2;
  const side = DISC_SIGIL_SIDE;
  ctx.drawImage(img, c - side / 2, c - side / 2, side, side);
}
// render/unitUpgradeBadges.ts:285-298
function drawPlate(ctx, level) {
  ctx.clearRect(0, 0, BADGE_CANVAS_PX, BADGE_CANVAS_PX);
  badgeRoundedRectPath(ctx, 7, 7, BADGE_CANVAS_PX - 14, BADGE_CANVAS_PX - 14, 24);
  ctx.fillStyle = PLATE_FILL;
  ctx.fill();
  ctx.strokeStyle = badgeColorCss(level);
  ctx.lineWidth = 9;
  ctx.stroke();
}
function drawIcon(ctx, img) {
  const off = (BADGE_CANVAS_PX - ICON_DRAW_PX) / 2;
  ctx.drawImage(img, off, off, ICON_DRAW_PX, ICON_DRAW_PX);
}
// render/workerFieldOverlay.ts:63-97 (the 👤 glyph is RR-T8b/c)
function workerIcon(ctx, ownerId, playerOwnerId) {
  const color = workerOwnerColor(ownerId);
  const isPlayer = ownerId === playerOwnerId;
  ctx.clearRect(0, 0, 64, 64);
  const cx = 32;
  const cy = 32;
  const badgeR = isPlayer ? 11 : 12;
  if (isPlayer) {
    ctx.strokeStyle = hexToRgba(color, 1);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR + 5.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = hexToRgba(color, isPlayer ? 0.72 : 0.62);
  ctx.beginPath();
  ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
  ctx.fill();
}
// render/cityOkolicaOverlay.ts:119-137 (the 👤 glyph is RR-T8b/c)
function drawWorkerBadge(ctx, cx, ownerId) {
  const cy = WORKER_BADGE_CY;
  ctx.strokeStyle = workerOwnerColorRgba(ownerId, 1);
  ctx.lineWidth = WORKER_BADGE_RING_LW;
  ctx.beginPath();
  ctx.arc(cx, cy, WORKER_BADGE_R + WORKER_BADGE_RING_DR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, WORKER_BADGE_R + WORKER_BADGE_RIM_DR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = workerOwnerColorRgba(ownerId, 0.72);
  ctx.beginPath();
  ctx.arc(cx, cy, WORKER_BADGE_R, 0, Math.PI * 2);
  ctx.fill();
}
// render/cityMapStatChip.ts:782-935 — paintCityMapBadgeOntoCanvas, shapes only.
// Text widths (name, WZROST%) come from measureText in the web; here they are
// fixed inputs (nameW, growthW) — measuring is RR-T8b.
function cityPill(ctx, o) {
  const padX = 10;
  const padY = 8;
  const circleD = 30;
  const gap = 8;
  const hasDefense = o.defenseTier !== 0;
  const defenseW = hasDefense ? 22 : 0;
  const civW = CIV_SLOT_W;
  const prodW = o.prodActive ? PROD_SLOT_W : 0;
  const isCapital = o.isCapital === true;
  const crownW = isCapital ? CAPITAL_CROWN_SLOT_W : 0;
  const growthW = o.growthW;
  const nameW = o.nameW;
  const leftIconsW = (hasDefense ? defenseW + gap : 0) + civW + gap + (crownW ? crownW + gap : 0);
  const midExtraW = (growthW ? gap + growthW : 0) + (prodW ? gap + prodW : 0);
  const W = Math.ceil(padX + leftIconsW + nameW + midExtraW + gap + circleD + padX);
  const baseH = Math.max(48, circleD + padY * 2);
  const H = baseH + (o.hover ? HOVER_ROW_H : 0);
  const dpr = o.dpr;
  const cw = Math.round(W * dpr);
  const ch = Math.round(H * dpr);
  return {
    cw, ch, paint: (ctx) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const pillR = Math.min(H * 0.45, baseH * 0.45);
      chipRoundedRect(ctx, 2, 2, W - 4, H - 4, pillR);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(16, 22, 34, 0.96)');
      grad.addColorStop(1, 'rgba(8, 10, 16, 0.94)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = isCapital ? CAPITAL_RING_COLOR : 'rgba(232, 216, 138, 0.72)';
      ctx.lineWidth = isCapital ? CAPITAL_RING_LINE_W : PILL_RING_LINE_W;
      ctx.stroke();
      if (isCapital) {
        const innerR = Math.max(2, pillR - CAPITAL_INNER_RING_INSET + 2);
        chipRoundedRect(ctx, CAPITAL_INNER_RING_INSET, CAPITAL_INNER_RING_INSET,
          W - CAPITAL_INNER_RING_INSET * 2, H - CAPITAL_INNER_RING_INSET * 2, innerR);
        ctx.strokeStyle = CAPITAL_INNER_RING_COLOR;
        ctx.lineWidth = CAPITAL_INNER_RING_LINE_W;
        ctx.stroke();
      }
      const cy = baseH * 0.5;
      const civCx = padX + (hasDefense ? defenseW + gap : 0) + civW * 0.5;
      if (hasDefense) drawDefenseShield(ctx, padX + defenseW * 0.5, cy, o.defenseTier);
      drawCivMedallion(ctx, civCx, cy, o.ownerColor, o.medallion);
      if (crownW) {
        const crownCx = padX + (hasDefense ? defenseW + gap : 0) + civW + gap + crownW * 0.5;
        drawCapitalCrown(ctx, crownCx, cy);
      }
      const nameX = padX + leftIconsW;
      let afterNameX = nameX + nameW;
      if (growthW) afterNameX += gap + growthW;
      if (o.prodActive) {
        drawProdIcon(ctx, afterNameX + gap + prodW * 0.5, cy, o.prodIcon);
        afterNameX += gap + prodW;
      }
      const cx = W - padX - circleD * 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, circleD * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e8d88a';
      ctx.fill();
      if (o.hover) {
        const sepY = baseH - 1;
        ctx.beginPath();
        ctx.moveTo(padX, sepY);
        ctx.lineTo(W - padX, sepY);
        ctx.strokeStyle = 'rgba(232, 216, 138, 0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();
        if (o.warn) {
          // drawHoverProdRow :698-721 → icon at x + maxTextW + warnW·0.5
          const x = padX;
          const w = W - padX * 2;
          const warnW = 20;
          const maxTextW = w - x - warnW - 6;
          drawResourceWarningIcon(ctx, x + maxTextW + warnW * 0.5, baseH + HOVER_ROW_H * 0.5);
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Synthetic source images (stand-ins for JPG portraits and SVG icons, RR-T8c)
// ---------------------------------------------------------------------------
scene('src_portrait', 256, 256, 'synthetic stand-in for a 256x256 JPG portrait (unitOwnerEmblem.ts:274-279, cityMapStatChip.ts:556-561)', (ctx) => {
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#3a5f8a');
  g.addColorStop(1, '#c08a50');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#f0d0a0';
  ctx.beginPath();
  ctx.arc(128, 100, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#202830';
  ctx.fillRect(40, 180, 176, 76);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 216, 216);
});
scene('src_icon', 48, 48, 'synthetic stand-in for an SVG line icon with alpha (unitUpgradeBadges.ts:295-298, cityMapStatChip.ts:567-569)', (ctx) => {
  ctx.strokeStyle = '#f2a81c';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(8, 40);
  ctx.lineTo(24, 8);
  ctx.lineTo(40, 40);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = 'rgba(242,168,28,0.5)';
  ctx.beginPath();
  ctx.arc(24, 30, 6, 0, Math.PI * 2);
  ctx.fill();
});
const PORTRAIT = IMG('src_portrait', 256, 256);
const ICON = IMG('src_icon', 48, 48);

// ---------------------------------------------------------------------------
// Producer scenes T1–T15 (+ H1)
// ---------------------------------------------------------------------------
scene('t4_gold_deficit', 128, 128, 'render/units.ts:6319-6354', (ctx) => {
  ctx.clearRect(0, 0, 128, 128);
  const cx = 64;
  const cy = 64;
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(12,18,32,0.92)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 43, 0, Math.PI * 2);
  ctx.fillStyle = '#e8c84a';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 31, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(120,86,16,0.85)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = '#c0281e';
  ctx.fillRect(-52, -9, 104, 18);
  ctx.restore();
});
scene('t5_stack_badge_disc', 64, 64, 'render/units.ts:6374-6380 (text ×N: RR-T8b)', (ctx) => {
  ctx.fillStyle = 'rgba(12,18,32,0.92)';
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8d88a';
  ctx.lineWidth = 3;
  ctx.stroke();
});
scene('t6_turn_label_plate', 128, 48, 'render/units.ts:6585-6592 (text: RR-T8b)', (ctx) => {
  ctx.fillStyle = 'rgba(8,12,22,0.88)';
  ctx.strokeStyle = '#e0b24a';
  ctx.lineWidth = 2;
  const pad = 4;
  ctx.beginPath();
  ctx.roundRect(pad, pad, 128 - pad * 2, 48 - pad * 2, 6);
  ctx.fill();
  ctx.stroke();
});
scene('t7_plate_bg', BG_CANVAS_W, BG_CANVAS_H, 'render/unitStatPlate.ts:403-433 + :314-326', (ctx) => {
  const pxPerUnit = BG_CANVAS_W / PLATE_BG_W;
  const border = 5;
  ctx.clearRect(0, 0, BG_CANVAS_W, BG_CANVAS_H);
  plateRoundedRectPath(ctx, border / 2, border / 2, BG_CANVAS_W - border, BG_CANVAS_H - border, 16);
  ctx.fillStyle = PLATE_FILL_CSS;
  ctx.fill();
  ctx.strokeStyle = PLATE_BORDER_CSS;
  ctx.lineWidth = border;
  ctx.stroke();
  const barWpx = PLATE_BAR_W * pxPerUnit;
  const barHpx = PLATE_BAR_H * pxPerUnit;
  const xpx = PLATE_PAD * pxPerUnit;
  ctx.fillStyle = VITALS_TROUGH_CSS;
  for (const barY of [PLATE_MOVE_BAR_Y, PLATE_HP_BAR_Y]) {
    const topWorld = PLATE_BG_Y + PLATE_BG_H / 2 - (barY + PLATE_BAR_H / 2);
    plateRoundedRectPath(ctx, xpx, topWorld * pxPerUnit, barWpx, barHpx, barHpx * 0.32);
    ctx.fill();
  }
});
scene('t8_power_frame', POWER_FRAME_CANVAS_W, POWER_FRAME_CANVAS_H, 'render/unitStatPlate.ts:558-573', (ctx) => {
  const b = 12;
  ctx.clearRect(0, 0, POWER_FRAME_CANVAS_W, POWER_FRAME_CANVAS_H);
  plateRoundedRectPath(ctx, b / 2, b / 2, POWER_FRAME_CANVAS_W - b, POWER_FRAME_CANVAS_H - b, 20);
  ctx.fillStyle = 'rgba(6,9,14,0.90)';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = b;
  ctx.stroke();
});
for (const v of ['civ', 'cityState', 'barbarian']) {
  scene(`t10_disc_${v}`, 128, 128, 'render/unitOwnerEmblem.ts:242-254 (fallback glyph: RR-T8b)', (ctx) => drawDisc(ctx, v));
}
scene('t10_portrait', 128, 128, 'render/unitOwnerEmblem.ts:388-399 (drawDisc + drawPortrait :266-280 + ring re-stroke)', (ctx) => {
  drawDisc(ctx, 'civ');
  drawPortrait(ctx, PORTRAIT);
  const c = EMBLEM_CANVAS_PX / 2;
  ctx.strokeStyle = RING_COLOR.civ;
  ctx.lineWidth = DISC_RING_W;
  ctx.beginPath();
  ctx.arc(c, c, DISC_R, 0, Math.PI * 2);
  ctx.stroke();
});
scene('t10_sigil_city_state', 128, 128, 'render/unitOwnerEmblem.ts:378-381 (drawDisc + drawSigil :284-288)', (ctx) => {
  drawDisc(ctx, 'cityState');
  drawSigil(ctx, ICON);
});
for (const lvl of [1, 2, 3]) {
  scene(`t11_badge_l${lvl}`, 128, 128, 'render/unitUpgradeBadges.ts:285-292 + :270-278', (ctx) => drawPlate(ctx, lvl));
}
scene('t11_badge_l3_icon', 128, 128, 'render/unitUpgradeBadges.ts:285-298 (drawPlate + drawIcon 92 px)', (ctx) => {
  drawPlate(ctx, 3);
  drawIcon(ctx, ICON);
});
scene('t12_worker_player', 64, 64, 'render/workerFieldOverlay.ts:63-97 (owner 0 = player)', (ctx) => workerIcon(ctx, 0, 0));
scene('t12_worker_other', 64, 64, 'render/workerFieldOverlay.ts:63-97 (owner 3, not player)', (ctx) => workerIcon(ctx, 3, 0));
scene('t12_worker_player_owner4', 64, 64, 'render/workerFieldOverlay.ts:63-97 (owner 4 = player 4: orange ring)', (ctx) => workerIcon(ctx, 4, 4));
scene('t13_worker_badge_owner0', 128, 46, 'render/cityOkolicaOverlay.ts:119-137 (cx = 40, owner 0 gold)', (ctx) => drawWorkerBadge(ctx, 40, 0));
scene('t13_worker_badge', 128, 46, 'render/cityOkolicaOverlay.ts:119-137 (cx = 64, owner 2)', (ctx) => drawWorkerBadge(ctx, 64, 2));
{
  const p = cityPill(null, { defenseTier: 0, prodActive: false, isCapital: false, growthW: 0, nameW: 120, hover: false, dpr: 1 });
  scene('t14_pill_plain_x1', p.cw, p.ch, 'render/cityMapStatChip.ts:847-866, :915-919 (shapes; nameW = 120 fixed)', p.paint);
}
{
  const p = cityPill(null, { defenseTier: 2, prodActive: false, isCapital: true, growthW: 45, nameW: 150, hover: false, dpr: 2, ownerColor: 0x1e88e5 });
  scene('t14_pill_capital_x2', p.cw, p.ch, 'render/cityMapStatChip.ts:847-924 (capital ring :863-879, crown :466-517, shield tier 2 :427-457)', p.paint);
}
{
  const p = cityPill(null, { defenseTier: 1, prodActive: true, isCapital: false, growthW: 38, nameW: 96.5, hover: true, warn: true, dpr: 3, ownerColor: 0xe53935, prodIcon: ICON });
  scene('t14_pill_hover_x3', p.cw, p.ch, 'render/cityMapStatChip.ts:847-935 (hover row separator :926-934, warning icon :670-682, prod icon :658-667)', p.paint);
}
{
  const p = cityPill(null, { defenseTier: 0, prodActive: false, isCapital: false, growthW: 0, nameW: 80, hover: false, dpr: 2, ownerColor: 0x43a047, medallion: { portraitImg: PORTRAIT } });
  scene('t14_pill_portrait_x2', p.cw, p.ch, 'render/cityMapStatChip.ts:546-566 (medallion portrait: clip + drawImage cover-fit)', p.paint);
}
{
  const p = cityPill(null, { defenseTier: 0, prodActive: false, isCapital: false, growthW: 0, nameW: 60, hover: false, dpr: 1.5, ownerColor: 0x8e24aa, medallion: { sigilImg: ICON, isCityState: true } });
  scene('t14_pill_sigil_x1_5', p.cw, p.ch, 'render/cityMapStatChip.ts:546-569 (medallion sigil: clip + drawImage r·1.55)', p.paint);
}
{
  const p = cityPill(null, { defenseTier: 2, prodActive: true, isCapital: true, growthW: 45, nameW: 213.877, hover: true, warn: true, dpr: 4, ownerColor: 0xfb8c00, prodIcon: ICON, medallion: { portraitImg: PORTRAIT } });
  scene('t14_pill_full_x4', p.cw, p.ch, 'render/cityMapStatChip.ts:782-935 (all shape elements, max scale 4 = BADGE_MAX_TOTAL_SCALE :173)', p.paint);
}
scene('t14_shield_t1_x3', 48, 48, 'render/cityMapStatChip.ts:427-457 (tier 1, scale 3)', (ctx) => {
  ctx.setTransform(3, 0, 0, 3, 0, 0);
  drawDefenseShield(ctx, 8, 8, 1);
});
scene('t14_crown_x4', 80, 64, 'render/cityMapStatChip.ts:466-517 (scale 4: vertical gradient, hairline 0.8 px stroke, 0.95 px jewels)', (ctx) => {
  ctx.setTransform(4, 0, 0, 4, 0, 0);
  drawCapitalCrown(ctx, 10, 8);
});
scene('t14_shield_t2_x2', 32, 32, 'render/cityMapStatChip.ts:427-457 (tier 2 with inner line :450-456, scale 2)', (ctx) => {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  drawDefenseShield(ctx, 8, 8, 2);
});
scene('t14_medallion_disc_x2', 80, 80, 'render/cityMapStatChip.ts:519-537 (ownerColor 0x8e24aa, scale 2)', (ctx) => {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  drawCivMedallionDisc(ctx, 20, 20, 0x8e24aa);
});
scene('t14_medallion_disc_x1', 40, 40, 'render/cityMapStatChip.ts:519-537 (ownerColor undefined → 0xffd54a)', (ctx) => drawCivMedallionDisc(ctx, 20, 20, undefined));
scene('t15_group_frame', 28, 28, 'battle/battleScene.ts:18646-18656 (digit: RR-T8b)', (ctx) => {
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(2, 2, 24, 24);
  ctx.strokeStyle = '#1a1408';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 24, 24);
});
scene('h1_battle_minimap', 180, 120, 'battle/battleMinimap.ts:51-93 (synthetic 12x8 map; H1 stays DOM per Z-1, shapes only as coverage)', (ctx) => {
  const w = 180, h = 120, cols = 12, rows = 8;
  const colors = ['#2a3a2a', '#1a4a28', '#6a5a40', '#1a3878', '#2a5098', '#505050', '#888888', '#a07030'];
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(12,18,35,0.92)';
  ctx.fillRect(0, 0, w, h);
  const cellW = w / cols;
  const cellH = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = colors[(r * 5 + c * 3) % 8];
      ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
    }
  }
  for (const u of [{ q: 2, r: 3, color: '#e53935' }, { q: 7, r: 1, color: '#1e88e5' }, { q: 11, r: 7, color: '#ffd54a' }]) {
    ctx.fillStyle = u.color;
    const cx = (u.q + 0.5) * cellW;
    const cy = (u.r + 0.5) * cellH;
    const rad = Math.max(1.2, Math.min(cellW, cellH) * 0.32);
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  const vx0 = 2 * cellW, vy0 = 1 * cellH, vx1 = 9 * cellW, vy1 = 6 * cellH;
  ctx.strokeStyle = 'rgba(255,255,255,0.88)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(vx0 + 0.5, vy0 + 0.5, vx1 - vx0 - 1, vy1 - vy0 - 1);
  ctx.strokeStyle = 'rgba(232,216,138,0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
});

// ---------------------------------------------------------------------------
// Semantic edge scenes (same members, parameters the web does not hit today)
// ---------------------------------------------------------------------------
scene('x_shadow_worked', 96, 48, 'shadow params of cityOkolicaOverlay.ts:174-180 (worked: rgba(0,0,0,0.75), blur 3, offsetY 1) applied to shapes', (ctx) => {
  ctx.fillStyle = '#ffd54a';
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillRect(10, 10, 30, 20);
  ctx.beginPath();
  ctx.arc(66, 22, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
});
scene('x_shadow_idle', 96, 48, 'shadow params of cityOkolicaOverlay.ts:174-180 (idle: rgba(0,0,0,0.45), blur 2, offsetY 1)', (ctx) => {
  ctx.fillStyle = '#f4f0e8';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  ctx.beginPath();
  ctx.moveTo(10, 38);
  ctx.lineTo(30, 8);
  ctx.lineTo(50, 38);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8d88a';
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 10, 26, 26);
});
scene('x_clear_rotated', 64, 64, 'clearRect under rotate (T4 uses rotate+fillRect, :6349-6354; clearRect :6324)', (ctx) => {
  ctx.fillStyle = '#336699';
  ctx.fillRect(0, 0, 64, 64);
  ctx.translate(32, 32);
  ctx.rotate(Math.PI / 6);
  ctx.clearRect(-12, -20, 24, 40);
});
scene('x_arcto_edges', 96, 64, 'arcTo semantics: radius clamp of plateRoundedRectPath (unitStatPlate.ts:318), collinear, r=0', (ctx) => {
  ctx.fillStyle = '#d6e2ee';
  plateRoundedRectPath(ctx, 4, 4, 40, 20, 50);
  ctx.fill();
  ctx.strokeStyle = '#b9762e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 10);
  ctx.arcTo(70, 10, 90, 10, 8);
  ctx.arcTo(90, 40, 60, 60, 0);
  ctx.arcTo(60, 60, 50, 40, 10);
  ctx.stroke();
});
scene('x_arc_partial', 64, 64, 'arc semantics outside the web subset (partial + anticlockwise + negative start)', (ctx) => {
  ctx.strokeStyle = '#e53935';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(32, 32, 20, -Math.PI / 3, Math.PI * 0.8, false);
  ctx.stroke();
  ctx.fillStyle = 'rgba(30,136,229,0.6)';
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.arc(32, 32, 26, 0.25, 5.5, true);
  ctx.closePath();
  ctx.fill();
});
scene('x_gradient_pad', 64, 64, 'linear gradient with inner stops (pad outside), diagonal; cityMapStatChip.ts:479-482 uses 3 stops', (ctx) => {
  const g = ctx.createLinearGradient(10, 10, 54, 40);
  g.addColorStop(0.3, '#fff6d2');
  g.addColorStop(0.55, 'rgba(242,223,154,0.5)');
  g.addColorStop(0.7, '#d8c069');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
});
scene('x_hairlines', 64, 32, 'thin strokes 0.8 px (cityMapStatChip.ts:503) and 1 px on half-pixel', (ctx) => {
  ctx.strokeStyle = 'rgba(255, 244, 200, 0.85)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(4, 4.3);
  ctx.lineTo(60, 9.7);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, 20.5);
  ctx.lineTo(60, 20.5);
  ctx.stroke();
});
scene('x_round_join', 64, 64, "lineJoin 'round' (unitStatPlate.ts:612) on a polyline", (ctx) => {
  ctx.lineJoin = 'round';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#05070b';
  ctx.beginPath();
  ctx.moveTo(8, 56);
  ctx.lineTo(24, 10);
  ctx.lineTo(40, 50);
  ctx.lineTo(56, 12);
  ctx.stroke();
});
scene('x_miter_join', 64, 64, 'default miter join, miter limit 10 (sharp angle falls back to bevel)', (ctx) => {
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#43a047';
  ctx.beginPath();
  ctx.moveTo(6, 40);
  ctx.lineTo(30, 12);
  ctx.lineTo(54, 40);
  ctx.moveTo(6, 60);
  ctx.lineTo(58, 50);
  ctx.lineTo(6, 52);
  ctx.stroke();
});
scene('x_image_downscale', 64, 64, 'drawImage 256→29 px (medallion portrait downscale, cityMapStatChip.ts:556-561)', (ctx) => {
  ctx.drawImage(PORTRAIT, 4, 4, 29, 29);
  ctx.drawImage(PORTRAIT, 36.5, 10.25, 24, 48);
});
scene('x_path_keeps_old_ctm', 64, 64, 'path points use the CTM at call time; setTransform before fill does not move them', (ctx) => {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.beginPath();
  ctx.moveTo(4, 4);
  ctx.lineTo(20, 4);
  ctx.lineTo(12, 20);
  ctx.closePath();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#ff0000');
  g.addColorStop(1, '#0000ff');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.setTransform(1, 0, 0, 3, 0, 0);
  ctx.stroke();
});
scene('x_clip_nested_restore', 64, 64, 'clip ∩ clip, then restore (save/restore of the clip region)', (ctx) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(26, 32, 20, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(38, 32, 20, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#c84040';
  ctx.fillRect(0, 0, 64, 64);
  ctx.restore();
  ctx.fillStyle = 'rgba(185,200,216,0.5)';
  ctx.fillRect(0, 54, 64, 10);
});

// ---------------------------------------------------------------------------
// scenes.tsv
// ---------------------------------------------------------------------------
const OUT = new URL('./', import.meta.url).pathname;
mkdirSync(OUT + 'ref', { recursive: true });
const fmt = (v) => (typeof v === 'number' ? String(v) : String(v));
let tsv = '# R-RUSTPORT-P4-28 raster scenes — generated by gen.mjs; do not edit by hand.\n';
tsv += '# scene<TAB>name<TAB>w<TAB>h<TAB>source ; op lines: op<TAB>args… ; end\n';
for (const s of scenes) {
  tsv += ['scene', s.name, s.w, s.h, s.src].join('\t') + '\n';
  for (const op of s.ops) {
    for (const a of op) if (typeof a === 'string' && /[\t\n]/.test(a)) throw new Error('tab in arg');
    tsv += op.map(fmt).join('\t') + '\n';
  }
  tsv += 'end\n';
}
writeFileSync(OUT + 'scenes.tsv', tsv);

// ---------------------------------------------------------------------------
// Chromium replay
// ---------------------------------------------------------------------------
const COLOR_PROBES = [
  ...new Set(scenes.flatMap((s) => s.ops.filter((o) => ['fillStyle', 'strokeStyle', 'shadowColor', 'stop'].includes(o[0])).map((o) => o[o.length - 1]))),
  '#ABC', '#abcd', '#aabbccdd', '#AbCdEf', 'rgb(10%, 20%, 30%)', 'rgb(255 0 0 / 50%)', 'rgba(0,0,0,.5)',
  ' RGBA( 1 , 2 , 3 , 0.5 ) ', 'rgb(300,-5,0)', 'rgba(0,0,0,1.5)', 'rgb(1.5, 2.5, 3.5)', 'rgb(1e1, 0, 0)',
  'hsl(120, 50%, 50%)', 'hsla(200, 60%, 40%, 0.3)', 'hsl(0.5turn 100% 25%)', 'hsl(120deg, 100%, 50%)',
  'hsl(1rad,50%,50%)', 'hsl(-30, 80%, 60%)', 'red', 'Grey', 'teal', 'orange', 'rebeccapurple',
  'rgb(1,2,3,)', 'rgb(1,2)', 'rgb(1, 2%, 3)', '#12345', '#ggg', 'nope', '', 'rgba(1,2,3,4,5)', 'hsl(1,2,3)',
  'rgb(1 2,3)', 'rgba(255,255,255,0.92)', 'rgba(255,255,255,0.95)', 'rgba(0,0,0,0.35)',
];

const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb'] });
const version = browser.version();
const page = await browser.newPage();
const result = await page.evaluate(({ scenes, probes }) => {
  const canvases = {};
  const b64 = (u8) => {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const out = {};
  for (const sc of scenes) {
    const c = document.createElement('canvas');
    c.width = sc.w;
    c.height = sc.h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const grads = {};
    for (const op of sc.ops) {
      const [name, ...a] = op;
      switch (name) {
        case 'fillStyle': ctx.fillStyle = a[0]; break;
        case 'strokeStyle': ctx.strokeStyle = a[0]; break;
        case 'fillGrad': ctx.fillStyle = grads[a[0]]; break;
        case 'lineWidth': ctx.lineWidth = a[0]; break;
        case 'lineJoin': ctx.lineJoin = a[0]; break;
        case 'shadowColor': ctx.shadowColor = a[0]; break;
        case 'shadowBlur': ctx.shadowBlur = a[0]; break;
        case 'shadowOffsetY': ctx.shadowOffsetY = a[0]; break;
        case 'grad': grads[a[0]] = ctx.createLinearGradient(a[1], a[2], a[3], a[4]); break;
        case 'stop': grads[a[0]].addColorStop(a[1], a[2]); break;
        case 'drawImage': ctx.drawImage(canvases[a[0]], a[3], a[4], a[5], a[6]); break;
        case 'arc': ctx.arc(a[0], a[1], a[2], a[3], a[4], a[5]); break;
        default: ctx[name](...a);
      }
    }
    canvases[sc.name] = c;
    out[sc.name] = b64(ctx.getImageData(0, 0, sc.w, sc.h).data);
  }
  // Colour probes.
  const colors = [];
  const c = document.createElement('canvas');
  c.width = 1;
  c.height = 1;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  for (const s of probes) {
    ctx.fillStyle = '#010203';
    ctx.fillStyle = s;
    const r1 = ctx.fillStyle;
    ctx.fillStyle = '#040506';
    ctx.fillStyle = s;
    const r2 = ctx.fillStyle;
    const accepted = r1 === r2;
    ctx.clearRect(0, 0, 1, 1);
    if (accepted) {
      ctx.fillStyle = s;
      ctx.fillRect(0, 0, 1, 1);
    }
    colors.push([s, accepted ? 1 : 0, r1, Array.from(ctx.getImageData(0, 0, 1, 1).data).join(',')]);
  }
  return { out, colors, ua: navigator.userAgent };
}, { scenes, probes: COLOR_PROBES });
await browser.close();

for (const [name, data] of Object.entries(result.out)) {
  writeFileSync(OUT + `ref/${name}.rgba`, Buffer.from(data, 'base64'));
}
let ctsv = '# input<TAB>accepted(1/0)<TAB>chromium fillStyle serialisation<TAB>getImageData r,g,b,a of a 1x1 fillRect\n';
for (const row of result.colors) ctsv += row.join('\t') + '\n';
writeFileSync(OUT + 'colors.tsv', ctsv);
writeFileSync(OUT + 'versions.txt', `node ${process.version}\nplaywright ${require('playwright/package.json').version}\nchromium ${version}\nuserAgent ${result.ua}\n`);

// MANIFEST.sha256 (gen.mjs itself included).
const files = ['gen.mjs', 'scenes.tsv', 'colors.tsv', 'versions.txt', ...readdirSync(OUT + 'ref').sort().map((f) => 'ref/' + f)];
let man = '';
for (const f of files) man += createHash('sha256').update(readFileSync(OUT + f)).digest('hex') + '  ' + f + '\n';
writeFileSync(OUT + 'MANIFEST.sha256', man);
console.log(`scenes=${scenes.length} colors=${result.colors.length} chromium=${version}`);
