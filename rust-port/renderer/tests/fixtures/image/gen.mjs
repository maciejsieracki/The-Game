// R-RUSTPORT-P4-30-IMAGES-Q1 — reference generator for tests/image_*.rs (RR-T8c).
//
// Reference = REAL Chromium Canvas 2D (owner decision D-TXT-5 = A) with the SAME bundled fonts
// (assets/fonts/* of RR-T8b + assets/emoji/NotoColorEmoji-civ-subset.ttf) loaded as FontFace
// objects under private names, and the SAME image bytes the web loads (pin edb8fb56):
//   - JPG portraits: gra/src/assets/portrety/*.jpg, drawn from data: URIs;
//   - SVG icons: gra/src/ui/icons/brand/**, resolved like ui/icons/brandAssets.ts and turned into
//     data: URIs with the web's OWN prepareSvgForCanvas / svgToDataUri (render/unitOwnerEmblem.ts),
//     whose TypeScript source is taken from the pin and only type-stripped (node:module).
// Web font stacks are translated by mapFamily() — mirror of raster::image::emoji::source_chain:
// RR-T8b mapping + "Noto Color Emoji" → CivNotoEmoji, then CivDejaVuSans, then CivNotoEmoji.
//
// Outputs (all in this directory):
//   input/*.jpg, input/*.svg  the image inputs (JPG bytes as in the pin; SVG after normalizeSvg)
//   prepare.tsv               file<TAB>strokeColor<TAB>boost<TAB>web prepareSvgForCanvas() output
//   widths.tsv                font<TAB>text<TAB>measureText(text).width
//   baselines.tsv             font<TAB>textBaseline<TAB>measureText('🔥').alphabeticBaseline
//   scenes.tsv + ref/<scene>.rgba  op lists replayed in Chromium → getImageData (straight RGBA8)
//   versions.txt, MANIFEST.sha256 (sha256 of every file above, gen.mjs included, and of the fonts)
//
// Every web scene names its source as file:line in pin edb8fb56 (paths relative to gra/src).
//
// Run (from rust-port/renderer/tests/fixtures/image; needs git with the pin edb8fb56):
//   NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen.mjs
// Chromium flags: --disable-gpu --force-color-profile=srgb --font-render-hinting=none (as RR-T8b).

import { createRequire, stripTypeScriptTypes } from 'node:module';
import { writeFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const OUT = new URL('./', import.meta.url).pathname;
const ASSETS = OUT + '../../../assets/';
const PIN = 'edb8fb56';

const gitShowBuf = (p) => execSync(`git show ${PIN}:${p}`, { maxBuffer: 64 << 20 });
const gitShow = (p) => gitShowBuf(p).toString('utf8');

// ---------------------------------------------------------------------------
// Fonts and family mapping (mirror of raster::image::emoji::source_chain)
// ---------------------------------------------------------------------------
const FACE_FILES = [
  ['CivLiberationSans', '400', 'fonts/LiberationSans-Regular.ttf'],
  ['CivLiberationSans', '700', 'fonts/LiberationSans-Bold.ttf'],
  ['CivLiberationSerif', '400', 'fonts/LiberationSerif-Regular.ttf'],
  ['CivLiberationSerif', '700', 'fonts/LiberationSerif-Bold.ttf'],
  ['CivDejaVuSans', '400', 'fonts/DejaVuSans.ttf'],
  ['CivDejaVuSans', '700', 'fonts/DejaVuSans-Bold.ttf'],
  ['CivNotoEmoji', '400', 'emoji/NotoColorEmoji-civ-subset.ttf'],
];
function mapFamily(f) {
  const generic = !/^["']/.test(f);
  const name = f.replace(/^["']|["']$/g, '').trim();
  const l = name.toLowerCase();
  if (generic && l === 'sans-serif') return 'CivLiberationSans';
  if (generic && l === 'serif') return 'CivLiberationSerif';
  if (['arial', 'helvetica', 'liberation sans', 'arimo'].includes(l)) return 'CivLiberationSans';
  if (['times new roman', 'times', 'liberation serif', 'tinos'].includes(l)) return 'CivLiberationSerif';
  if (l === 'dejavu sans') return 'CivDejaVuSans';
  if (l === 'noto color emoji') return 'CivNotoEmoji';
  return null;
}
function mapFont(css) {
  const m = /^(.*?\d+(?:\.\d+)?px(?:\/\S+)?)\s+(.+)$/.exec(css);
  if (!m) throw new Error('mapFont: unsupported ' + css);
  const fams = [];
  for (const f of m[2].split(',').map((s) => s.trim())) {
    const g = mapFamily(f);
    if (g && !fams.includes(g)) fams.push(g);
  }
  for (const last of ['CivDejaVuSans', 'CivNotoEmoji']) if (!fams.includes(last)) fams.push(last);
  return m[1] + ' ' + fams.join(', ');
}

// ---------------------------------------------------------------------------
// The web's own SVG preparation (verbatim source from the pin, types stripped)
// ---------------------------------------------------------------------------
function extractFunction(file, name) {
  const src = gitShow(file);
  const start = src.indexOf(`export function ${name}(`);
  if (start < 0) throw new Error(`${name} not found in ${file}`);
  const end = src.indexOf('\n}\n', start);
  const lineNo = src.slice(0, start).split('\n').length;
  const text = src.slice(start, end + 2).replace(/^export /, '');
  return { js: stripTypeScriptTypes(text), where: `${file.replace('gra/src/', '')}:${lineNo}` };
}
const PREPARE = extractFunction('gra/src/render/unitOwnerEmblem.ts', 'prepareSvgForCanvas');
const TO_URI = extractFunction('gra/src/render/unitOwnerEmblem.ts', 'svgToDataUri');
// eslint-disable-next-line no-new-func
const prepareSvgForCanvas = new Function(PREPARE.js + '\nreturn prepareSvgForCanvas;')();

// ui/icons/brandAssets.ts (pin): normalizeSvg :50-61 (verbatim), brandIconSvg :71-84,
// civIconSvg :196-203, buildingIconSvg :170-173 — resolution re-implemented over the pin tree.
const NORMALIZE = (() => {
  const src = gitShow('gra/src/ui/icons/brandAssets.ts');
  const start = src.indexOf('function normalizeSvg(');
  const end = src.indexOf('\n}\n', start);
  // eslint-disable-next-line no-new-func
  return new Function(stripTypeScriptTypes(src.slice(start, end + 2)) + '\nreturn normalizeSvg;')();
})();
const BRAND_DIR = 'gra/src/ui/icons/brand/';
const brandFiles = execSync(`git ls-tree -r --name-only --full-tree ${PIN} ${BRAND_DIR}`).toString().trim().split('\n')
  .filter((p) => p.endsWith('.svg')).sort();
function findSvgRaw(suffix) {
  const hits = brandFiles.filter((p) => p.endsWith(suffix));
  if (hits.length > 1) throw new Error(`ambiguous ${suffix}: ${hits}`); // glob order would matter
  return hits.length ? gitShow(hits[0]) : '';
}
const manifest = JSON.parse(gitShow(BRAND_DIR + 'icons-manifest.json'));
const civMap = JSON.parse(gitShow(BRAND_DIR + 'civ-icon-map.json'));
function brandIconSvg(id, size) {
  const e = manifest.icons[id];
  const rel = e ? (size === 40 ? e['40'] : e['24']) : '';
  if (rel) { const s = NORMALIZE(findSvgRaw(rel.replace(/^eksport\/icons\//, '')), size); if (s) return s; }
  const flat = NORMALIZE(findSvgRaw(`${id}.svg`), size);
  if (flat) return flat;
  throw new Error('brandIconSvg: no ' + id);
}
function civIconSvg(id, size) {
  const raw = civMap.map[id] ?? civMap.map._default;
  const rel = raw.replace(/^eksport\/icons\//, '').replace(/^icons\//, '');
  return NORMALIZE(findSvgRaw(rel), size) || NORMALIZE(findSvgRaw('civilizations/civ-default.svg'), size);
}
const buildingIconSvg = (bld) => NORMALIZE(findSvgRaw(`buildings/${bld}.svg`), 24);

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
rmSync(OUT + 'input', { recursive: true, force: true });
rmSync(OUT + 'ref', { recursive: true, force: true });
mkdirSync(OUT + 'input', { recursive: true });
mkdirSync(OUT + 'ref', { recursive: true });
const IMAGES = {}; // id → { kind, file, w, h, bytes|svg }
function jpgSize(buf) {
  for (let i = 2; i < buf.length;) {
    const m = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc2) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  throw new Error('no SOF');
}
for (const name of ['portrait-grecy-braz', 'portrait-zulusi-zelazo', 'portrait-egipt-kamien']) {
  const bytes = gitShowBuf(`gra/src/assets/portrety/${name}.jpg`);
  writeFileSync(OUT + `input/${name}.jpg`, bytes);
  const [w, h] = jpgSize(bytes);
  IMAGES[name] = { kind: 'jpg', file: `input/${name}.jpg`, w, h, b64: bytes.toString('base64') };
}
const SVGS = {
  'chip-death-40': brandIconSvg('chip-death', 40), // main.ts:8529 barbarianSigilSvg
  'civ-grecy-40': civIconSvg('grecy', 40), // main.ts:8528 civSigilSvg / :8531
  'civ-zulusi-40': civIconSvg('zulusi', 40),
  'civ-default-40': civIconSvg('nieznana', 40), // unknown civ → civ-default
  'bld-koszary-40': brandIconSvg('bld-koszary', 40), // main.ts:8540 barracksSvg
  'bld-kuznia-40': brandIconSvg('bld-kuznia', 40), // main.ts:8541 forgeSvg
  'bld-spichlerz-24': buildingIconSvg('bld-spichlerz'), // main.ts:8533-8535 prod icon (budynek)
};
for (const [id, svg] of Object.entries(SVGS)) {
  if (!svg) throw new Error('empty svg ' + id);
  writeFileSync(OUT + `input/${id}.svg`, svg);
}
const svgSize = (svg) => [Number(/\swidth="([^"]*)"/.exec(svg)[1]), Number(/\sheight="([^"]*)"/.exec(svg)[1])];
/** A prepared SVG image as the web makes it: prepareSvgForCanvas(raw, color, boost). */
function svgImage(base, color, boost) {
  const id = `${base}|${color}|${boost}`;
  if (!IMAGES[id]) {
    const prepared = boost === undefined ? prepareSvgForCanvas(SVGS[base], color) : prepareSvgForCanvas(SVGS[base], color, boost);
    const [w, h] = svgSize(prepared);
    IMAGES[id] = { kind: 'svg', file: `input/${base}.svg`, color, boost: boost ?? 1.6, w, h, svg: prepared };
  }
  return { id, width: IMAGES[id].w, height: IMAGES[id].h };
}
const jpgImage = (name) => ({ id: name, width: IMAGES[name].w, height: IMAGES[name].h });

// prepare.tsv: web prepareSvgForCanvas over every input × colours × boosts + edge cases.
let prep = '# file<TAB>strokeColor<TAB>boost<TAB>prepareSvgForCanvas(svg, color, boost) (web, render/' + PREPARE.where.replace('render/', '') + ')\n';
const EDGE = {
  'edge-1': '<svg stroke="currentColor" stroke-width="1.125"><path stroke-width=".5"/><path stroke-width="5."/><path stroke-width="1.5.2"/><path stroke-width="."/><path stroke-width="x"/></svg>',
  'edge-2': '<svg stroke-width="0.3125" stroke="currentColor" fill="currentColor"><g stroke-width="2.5"/></svg>',
};
const noTab = (s) => { if (/[\t\n]/.test(String(s))) throw new Error('tab/newline in field: ' + JSON.stringify(s)); return String(s); };
const oneLine = (s) => s.replace(/\n/g, '\\n');
for (const [id, svg] of [...Object.entries(SVGS), ...Object.entries(EDGE)]) {
  for (const color of ['#e8d88a', '#b9c8d8', '#c84040', '#b9762e', '#d6e2ee', '#f2a81c']) {
    for (const boost of [1.6, 1.2, 1, 1.125, 0.5]) {
      prep += [id, color, boost, oneLine(prepareSvgForCanvas(oneLine(svg), color, boost))].map(noTab).join('\t') + '\n';
    }
  }
}
writeFileSync(OUT + 'prepare.tsv', prep);
writeFileSync(OUT + 'edge-svgs.tsv', Object.entries(EDGE).map(([k, v]) => `${k}\t${v}`).join('\n') + '\n');

// ---------------------------------------------------------------------------
// Scenes: recorded op lists (the web code below calls a recording ctx)
// ---------------------------------------------------------------------------
const scenes = [];
function scene(name, w, h, src, fn) {
  const ops = [];
  const rec = new Proxy({}, {
    get(_t, prop) {
      return (...args) => {
        if (prop === 'drawImage') ops.push(['drawImage', args[0].id, ...args.slice(1)]);
        else ops.push([prop, ...args]);
      };
    },
    set(_t, prop, v) { ops.push([prop, v]); return true; },
  });
  fn(rec);
  scenes.push({ name, w, h, src, ops });
}
const TAU = Math.PI * 2;

// --- T10 render/unitOwnerEmblem.ts:173-297 (CANVAS_PX 128, DISC_R 54, ring 14, portrait r 48, sigil 76)
const RING = { civ: '#e8d88a', cityState: '#b9c8d8', barbarian: '#c84040' }; // :176-183
function drawDisc(ctx, v) { // :240-253
  const c = 64;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(12,17,26,0.92)';
  ctx.beginPath(); ctx.arc(c, c, 54, 0, TAU, false); ctx.fill();
  ctx.strokeStyle = RING[v]; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.arc(c, c, 54, 0, TAU, false); ctx.stroke();
}
function drawPortrait(ctx, img) { // :265-281
  const c = 64; const r = 48;
  ctx.save(); ctx.beginPath(); ctx.arc(c, c, r, 0, TAU, false); ctx.clip();
  const side = r * 2; const scale = Math.max(side / img.width, side / img.height);
  const w = img.width * scale; const h = img.height * scale;
  ctx.drawImage(img, c - w / 2, c - r, w, h);
  ctx.restore();
}
function drawSigil(ctx, img) { ctx.drawImage(img, 64 - 38, 64 - 38, 76, 76); } // :284-288
function ringOnTop(ctx) { // :391-397
  ctx.strokeStyle = RING.civ; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(64, 64, 54, 0, TAU, false); ctx.stroke();
}
for (const civ of ['grecy-braz', 'zulusi-zelazo']) {
  scene(`t10_civ_portrait_${civ}`, 128, 128, 'render/unitOwnerEmblem.ts:385-399 (drawDisc + drawPortrait + ring)', (ctx) => {
    drawDisc(ctx, 'civ'); drawPortrait(ctx, jpgImage(`portrait-${civ}`)); ringOnTop(ctx);
  });
}
scene('t10_citystate_sigil_grecy', 128, 128, 'render/unitOwnerEmblem.ts:376-384', (ctx) => {
  drawDisc(ctx, 'cityState'); drawSigil(ctx, svgImage('civ-grecy-40', RING.cityState));
});
scene('t10_barbarian_sigil', 128, 128, 'render/unitOwnerEmblem.ts:366-374', (ctx) => {
  drawDisc(ctx, 'barbarian'); drawSigil(ctx, svgImage('chip-death-40', RING.barbarian));
});
scene('t10_civ_sigil_default', 128, 128, 'render/unitOwnerEmblem.ts:403-410 (no portrait → civ sigil)', (ctx) => {
  drawDisc(ctx, 'civ'); drawSigil(ctx, svgImage('civ-default-40', RING.civ));
});
for (const [v, g] of [['barbarian', '☠'], ['civ', '◆']]) {
  scene(`t10_fallback_glyph_${v}`, 128, 128, 'render/unitOwnerEmblem.ts:256-263 (drawDisc + fallback glyph)', (ctx) => {
    drawDisc(ctx, v);
    ctx.fillStyle = RING[v]; ctx.font = 'bold 58px "Segoe UI Symbol", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(g, 64, 67);
  });
}

// --- T11 render/unitUpgradeBadges.ts:115-124, :197-206, :266-298
const BADGE = { 1: '#b9762e', 2: '#d6e2ee', 3: '#f2a81c' };
function roundedRectPath(ctx, x, y, w, h, r) { // :266-274
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
for (const [path, icon] of [['soft', 'bld-koszary-40'], ['armor', 'bld-kuznia-40']]) {
  for (const level of [1, 2, 3]) {
    scene(`t11_badge_${path}_l${level}`, 128, 128, 'render/unitUpgradeBadges.ts:281-298 + :334-339', (ctx) => {
      ctx.clearRect(0, 0, 128, 128);
      roundedRectPath(ctx, 7, 7, 114, 114, 24);
      ctx.fillStyle = 'rgba(10,14,22,0.90)'; ctx.fill();
      ctx.strokeStyle = BADGE[level]; ctx.lineWidth = 9; ctx.stroke();
      ctx.drawImage(svgImage(icon, BADGE[level], 1.6), 18, 18, 92, 92);
    });
  }
}

// --- T14 medallion render/cityMapStatChip.ts:85-86, :522-581, :658-667 (scale = setTransform :846-851)
function medallionDisc(ctx, cx, cy, owner) { // :518-536
  const r = 16; const rr = (owner >> 16) & 0xff; const gg = (owner >> 8) & 0xff; const bb = owner & 0xff;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU, false);
  ctx.fillStyle = `rgb(${Math.round(rr * 0.55)}, ${Math.round(gg * 0.55)}, ${Math.round(bb * 0.55)})`;
  ctx.fill(); ctx.strokeStyle = '#e8d88a'; ctx.lineWidth = 2; ctx.stroke();
}
function medallion(ctx, cx, cy, owner, img, usePortrait) { // :546-575
  medallionDisc(ctx, cx, cy, owner);
  const r = 16;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r - 1.5, 0, TAU, false); ctx.clip();
  if (usePortrait) {
    const side = (r - 1.5) * 2; const scale = Math.max(side / img.width, side / img.height);
    const w = img.width * scale; const h = img.height * scale;
    ctx.drawImage(img, cx - w / 2, cy - (r - 1.5), w, h);
  } else {
    const side = r * 1.55; ctx.drawImage(img, cx - side / 2, cy - side / 2, side, side);
  }
  ctx.restore();
}
for (const s of [1, 2, 3, 4]) {
  scene(`t14_medallion_portrait_x${s}`, 40 * s, 40 * s, 'render/cityMapStatChip.ts:546-572 (portrait, setTransform :846-851)', (ctx) => {
    ctx.setTransform(s, 0, 0, s, 0, 0); medallion(ctx, 20, 20, 0x1e88e5, jpgImage('portrait-egipt-kamien'), true);
  });
}
for (const s of [1, 3]) {
  scene(`t14_medallion_sigil_x${s}`, 40 * s, 40 * s, 'render/cityMapStatChip.ts:546-572 (city-state sigil :617-622)', (ctx) => {
    ctx.setTransform(s, 0, 0, s, 0, 0); medallion(ctx, 20, 20, 0xb9c8d8, svgImage('civ-zulusi-40', '#e8d88a'), false);
  });
}
for (const s of [1, 2, 3]) {
  scene(`t14_prod_icon_x${s}`, 24 * s, 24 * s, 'render/cityMapStatChip.ts:658-667 (drawProdIcon 16 px, boost 1.2 :648)', (ctx) => {
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.drawImage(svgImage('bld-spichlerz-24', '#e8d88a', 1.2), 12 - 8, 12 - 8, 16, 16);
  });
}

// --- emoji / symbol producers
scene('t1_revolt_fire', 64, 64, 'render/cities.ts:708-716', (ctx) => {
  ctx.font = '48px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('\u{1F525}', 32, 36);
});
scene('t2_siege_swords', 128, 128, 'render/siegeMarker.ts:35-44', (ctx) => {
  ctx.clearRect(0, 0, 128, 128); ctx.font = 'bold 96px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⚔', 64, 70);
});
scene('t3_starving_skull', 128, 128, 'render/units.ts:6287-6298', (ctx) => {
  ctx.clearRect(0, 0, 128, 128); ctx.fillStyle = '#e01e1e';
  ctx.font = 'bold 104px "Segoe UI Symbol", "Segoe UI Emoji", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☠', 64, 70);
});
// T12 render/workerFieldOverlay.ts:22-26 (colours), :38-43 (hexToRgba), :63-102
const WORKER = [0xffd54a, 0xe53935, 0x43a047, 0x1e88e5];
const rgba = (hex, a) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;
for (const [owner, isPlayer] of [[0, true], [1, false], [3, false]]) {
  scene(`t12_worker_owner${owner}`, 64, 64, 'render/workerFieldOverlay.ts:63-102', (ctx) => {
    const color = WORKER[owner]; const cx = 32; const cy = 32; const badgeR = isPlayer ? 11 : 12;
    ctx.clearRect(0, 0, 64, 64);
    if (isPlayer) {
      ctx.strokeStyle = rgba(color, 1); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(cx, cy, badgeR + 4, 0, TAU, false); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, badgeR + 5.5, 0, TAU, false); ctx.stroke();
    }
    ctx.fillStyle = rgba(color, isPlayer ? 0.72 : 0.62); ctx.beginPath(); ctx.arc(cx, cy, badgeR, 0, TAU, false); ctx.fill();
    ctx.font = 'bold 16px Segoe UI, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillText('👤', cx, cy + 1);
  });
}
// T13 render/cityOkolicaOverlay.ts:79-110 (constants), :119-228. The emoji widths are measured IN the
// recorder with the same mapping, so the x positions depend on Chromium's measureText — they are
// computed in the browser: the scene stores a 'yieldLine' macro expanded on both sides identically.
const S13 = 1.22;
function okolica(ctx, lines, worker, ownerId) {
  const s = S13; const fontPx = Math.round(13 * s); const lineH = Math.round(14.5 * s);
  const lineHWorked = Math.round(16.5 * s); const padBottom = Math.round(7 * s);
  const startY = worker ? Math.round(24 * s) : Math.round(7 * s);
  const h = Math.max(Math.round((worker ? 56 : 38) * s), startY + lines.length * (worker ? lineHWorked : lineH) + padBottom);
  ctx.clearRect(0, 0, 128, h);
  if (worker) { // drawWorkerBadge :119-143
    const cx = 64; const cy = 16; const col = WORKER[ownerId % WORKER.length];
    ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(cx, cy, 9 + 4, 0, TAU, false); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, 9 + 5.5, 0, TAU, false); ctx.stroke();
    ctx.fillStyle = rgba(col, 0.72); ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU, false); ctx.fill();
    ctx.font = 'bold 13px Segoe UI, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillText('👤', cx, cy + 1);
  }
  ctx.font = `bold ${fontPx}px Arial, Helvetica, sans-serif`;
  let rowY = startY;
  for (const [emoji, value] of lines) {
    ctx.yieldLine(64, rowY, emoji, value, fontPx, worker ? 'true' : 'false');
    rowY += worker ? lineHWorked : lineH;
  }
  return h;
}
const H13 = (lines, worker) => {
  const s = S13; const startY = worker ? Math.round(24 * s) : Math.round(7 * s);
  return Math.max(Math.round((worker ? 56 : 38) * s), startY + lines.length * Math.round((worker ? 16.5 : 14.5) * s) + Math.round(7 * s));
};
const L13 = [['🍞', 3], ['🔨', 2], ['💰', 1]];
scene('t13_okolica_idle', 128, H13(L13, false), 'render/cityOkolicaOverlay.ts:145-228 (3 lines, no worker)', (ctx) => okolica(ctx, L13, false, 0));
scene('t13_okolica_worked', 128, H13(L13, true), 'render/cityOkolicaOverlay.ts:119-228 (worker badge, worked lines)', (ctx) => okolica(ctx, L13, true, 0));
scene('t13_okolica_one_line', 128, H13([['🍞', 12]], false), 'render/cityOkolicaOverlay.ts:145-228 (1 line)', (ctx) => okolica(ctx, [['🍞', 12]], false, 0));

// --- semantic scenes
scene('x_emoji_alpha_and_colour', 192, 64, 'Z-7: fillStyle alpha multiplies a colour glyph, its RGB is ignored', (ctx) => {
  ctx.font = '48px "Noto Color Emoji"'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff'; ctx.fillText('🔥', 2, 52);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('🔥', 66, 52);
  ctx.fillStyle = 'rgba(0,0,255,0.25)'; ctx.fillText('🔥', 130, 52);
});
scene('x_emoji_subpixel', 260, 40, 'origin quantisation: x in 1/4 px, y whole px', (ctx) => {
  ctx.font = '24px "Noto Color Emoji"'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  [0, 0.25, 0.5, 0.75, 0.125, 0.375].forEach((d, i) => ctx.fillText('💰', 4 + i * 42 + d, 20 + d));
});
scene('x_emoji_sizes', 400, 120, 'sizes 13 16 18 20 48 104', (ctx) => {
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  let x = 2;
  for (const px of [13, 16, 18, 20, 48, 104]) { ctx.font = `${px}px "Noto Color Emoji"`; ctx.fillText('🏰', x, 108); x += px * 1.3 + 4; }
});
scene('x_emoji_r4_icons', 420, 40, 'P4-25 §3.3: the 16 R4 icons (DOM chip, 16 px span) on canvas', (ctx) => {
  ctx.font = '16px Arial, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText('⛏🌾🎣🏔🏛🏰🏹🏺🐑💧🔨🛡🛤🧂🪓🪚🪨', 4, 20);
});
scene('x_emoji_mixed_text', 300, 60, 'per-character fallback inside one fillText (text + emoji + symbol)', (ctx) => {
  ctx.font = 'bold 20px Arial, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillStyle = '#203040'; ctx.fillText('A🔥7 ⚔ x🍞!', 150, 30);
});
scene('x_emoji_scaled_ctm', 120, 60, 'setTransform(2) + emoji (T13-like 16 px)', (ctx) => {
  ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.font = '16px "Noto Color Emoji", sans-serif';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillText('🍞🔨💰', 3.3, 4.6);
});
scene('x_emoji_clip_shadow', 80, 80, 'clip + shadow apply to a colour glyph', (ctx) => {
  ctx.beginPath(); ctx.arc(40, 40, 24, 0, TAU, false); ctx.clip();
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 2;
  ctx.font = '56px "Noto Color Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐑', 40, 40);
});
scene('x_jpeg_portrait_1to1', 256, 256, 'JPG decode (zune-jpeg vs libjpeg-turbo), drawImage 1:1', (ctx) => {
  ctx.drawImage(jpgImage('portrait-grecy-braz'), 0, 0, 256, 256);
});
scene('x_jpeg_downscale', 100, 100, 'JPG drawImage 256 → 96 (T10 scale), no clip', (ctx) => {
  ctx.drawImage(jpgImage('portrait-zulusi-zelazo'), 2, 2, 96, 96);
});
scene('x_svg_intrinsic', 48, 48, 'SVG drawn at its intrinsic 40×40', (ctx) => {
  ctx.drawImage(svgImage('civ-grecy-40', '#204060'), 4, 4, 40, 40);
});
scene('x_svg_scaled_x3', 72, 72, 'SVG under setTransform(3): vector at device resolution', (ctx) => {
  ctx.setTransform(3, 0, 0, 3, 0, 0); ctx.drawImage(svgImage('bld-kuznia-40', '#d6e2ee', 1.6), 2.5, 2.5, 19, 19);
});
scene('x_svg_rotated_clipped', 100, 100, 'SVG under rotate + clip', (ctx) => {
  ctx.beginPath(); ctx.arc(50, 50, 40, 0, TAU, false); ctx.clip();
  ctx.translate(50, 50); ctx.rotate(0.4); ctx.drawImage(svgImage('chip-death-40', '#c84040'), -40, -40, 80, 80);
});

// ---------------------------------------------------------------------------
// Widths / baselines (measureText with emoji)
// ---------------------------------------------------------------------------
const EMOJI23 = [...'⚔☠👤🔥🍞🔨💰⛏🌾🎣🏔🏛🏰🏹🏺🐑💧🛡🛤🧂🪓🪚🪨'];
const widthRows = [];
const SIZES = [];
for (let px = 6; px <= 128; px++) SIZES.push(px);
SIZES.push(15.86, 17.08, 20.3, 19.5, 33.25);
for (const px of SIZES) widthRows.push([`${px}px "Noto Color Emoji"`, '🔥']);
for (const c of EMOJI23) widthRows.push(['16px "Noto Color Emoji"', c]);
const STACKS = [
  'bold 16px Segoe UI, Arial', // workerFieldOverlay.ts:98
  'bold 13px Segoe UI, Arial', // cityOkolicaOverlay.ts:139
  '16px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif', // :85-86 (13·1.22)
  '17px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif', // worked: round(16·1.1)
  '48px serif', // cities.ts:714
  'bold 96px Arial', // siegeMarker.ts:42
  'bold 104px "Segoe UI Symbol", "Segoe UI Emoji", "Segoe UI", Arial, sans-serif', // units.ts:6294
  '12px Arial,sans-serif', // main.ts:12856 (R4)
];
for (const f of STACKS) for (const t of ['👤', '🔥', '🍞', '🔨', '💰', '⚔', '☠', '◆', '🔥🔥🔥', 'A🔥7', '🍞 3', '⚔ OBLĘŻENIE', '⛏🌾🎣🏔🏛🏰🏹🏺🐑💧🛡🛤🧂🪓🪚🪨']) widthRows.push([f, t]);
const BASELINE_FONTS = [];
for (const px of [13, 16, 17, 20, 48, 104]) {
  BASELINE_FONTS.push(`${px}px "Noto Color Emoji"`);
  BASELINE_FONTS.push(`${px}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`);
}

// ---------------------------------------------------------------------------
// Tables written without the browser
// ---------------------------------------------------------------------------
let tsv = '# R-RUSTPORT-P4-30 image scenes — generated by gen.mjs; do not edit by hand.\n';
tsv += '# image<TAB>id<TAB>jpg|svg<TAB>input file<TAB>[strokeColor<TAB>boost]  (svg: prepareSvgForCanvas(file, color, boost))\n';
tsv += '# scene<TAB>name<TAB>w<TAB>h<TAB>source ; op lines: op<TAB>args… ; end\n';
for (const [id, im] of Object.entries(IMAGES)) {
  tsv += (im.kind === 'jpg' ? ['image', id, 'jpg', im.file] : ['image', id, 'svg', im.file, im.color, im.boost]).map(noTab).join('\t') + '\n';
}
for (const s of scenes) {
  tsv += ['scene', s.name, s.w, s.h, s.src].map(noTab).join('\t') + '\n';
  for (const op of s.ops) tsv += op.map(noTab).join('\t') + '\n';
  tsv += 'end\n';
}
writeFileSync(OUT + 'scenes.tsv', tsv);

// ---------------------------------------------------------------------------
// Chromium
// ---------------------------------------------------------------------------
const faces = FACE_FILES.map(([fam, w, file]) => [fam, w, readFileSync(ASSETS + file).toString('base64')]);
const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const version = browser.version();
const page = await browser.newPage();
const imgsForPage = Object.fromEntries(Object.entries(IMAGES).map(([id, im]) => [id, im.kind === 'jpg' ? { kind: 'jpg', b64: im.b64 } : { kind: 'svg', svg: im.svg }]));
const result = await page.evaluate(async ({ faces, scenes, imgs, widthRows, BASELINE_FONTS, mapFontSrc, mapFamilySrc, toUriSrc }) => {
  for (const [fam, w, b64] of faces) {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const f = new FontFace(fam, bin, { weight: w });
    await f.load();
    document.fonts.add(f);
  }
  // eslint-disable-next-line no-new-func
  const mapFamily = new Function('return ' + mapFamilySrc)();
  const mapFont = new Function('mapFamily', 'return ' + mapFontSrc)(mapFamily);
  const svgToDataUri = new Function(toUriSrc + '\nreturn svgToDataUri;')();
  const loaded = {};
  for (const [id, im] of Object.entries(imgs)) {
    const img = new Image();
    img.decoding = 'sync';
    img.src = im.kind === 'jpg' ? 'data:image/jpeg;base64,' + im.b64 : svgToDataUri(im.svg);
    await img.decode();
    loaded[id] = img;
  }
  const b64 = (u8) => {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const m = document.createElement('canvas').getContext('2d');
  const widths = widthRows.map(([font, text]) => { m.font = mapFont(font); return m.measureText(text).width; });
  const baselines = [];
  for (const f of BASELINE_FONTS) {
    for (const bl of ['alphabetic', 'top', 'hanging', 'middle', 'ideographic', 'bottom']) {
      m.font = mapFont(f); m.textBaseline = bl;
      baselines.push([f, bl, m.measureText('🔥').alphabeticBaseline]);
    }
  }
  m.textBaseline = 'alphabetic';
  const imgDims = Object.fromEntries(Object.entries(loaded).map(([id, im]) => [id, [im.width, im.height]]));
  const out = {};
  for (const sc of scenes) {
    const c = document.createElement('canvas');
    c.width = sc.w; c.height = sc.h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    for (const op of sc.ops) {
      const [name, ...a] = op;
      switch (name) {
        case 'fillStyle': ctx.fillStyle = a[0]; break;
        case 'strokeStyle': ctx.strokeStyle = a[0]; break;
        case 'lineWidth': ctx.lineWidth = a[0]; break;
        case 'shadowColor': ctx.shadowColor = a[0]; break;
        case 'shadowBlur': ctx.shadowBlur = a[0]; break;
        case 'shadowOffsetY': ctx.shadowOffsetY = a[0]; break;
        case 'font': ctx.font = mapFont(a[0]); break;
        case 'textAlign': ctx.textAlign = a[0]; break;
        case 'textBaseline': ctx.textBaseline = a[0]; break;
        case 'drawImage': ctx.drawImage(loaded[a[0]], a[1], a[2], a[3], a[4]); break;
        case 'yieldLine': { // render/cityOkolicaOverlay.ts:145-179 drawYieldLine, verbatim body
          const [cx, y, emoji, value, fontPx, workedS] = a;
          const worked = workedS === 'true';
          const numStr = String(value);
          const emojiPx = worked ? Math.round(fontPx * 1.1) : fontPx;
          const digitPx = worked ? Math.round(fontPx * 1.28) : fontPx;
          const EF = (px) => mapFont(`${px}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`);
          const DF = (px) => mapFont(`bold ${px}px Arial, Helvetica, sans-serif`);
          ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
          ctx.font = EF(emojiPx); const emojiW = ctx.measureText(emoji).width;
          ctx.font = DF(digitPx); const numW = ctx.measureText(numStr).width;
          let x = cx - (emojiW + numW) / 2;
          ctx.font = EF(emojiPx); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillText(emoji, x, y);
          x += emojiW;
          ctx.font = DF(digitPx); ctx.fillStyle = worked ? '#e0b24a' : '#fffef8';
          ctx.shadowColor = worked ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)'; ctx.shadowBlur = worked ? 3 : 2; ctx.shadowOffsetY = 1;
          ctx.fillText(numStr, x, y - (worked ? 2 : 0));
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
          break;
        }
        default: ctx[name](...a);
      }
    }
    out[sc.name] = b64(ctx.getImageData(0, 0, sc.w, sc.h).data);
  }
  return { widths, baselines, out, imgDims, ua: navigator.userAgent };
}, {
  faces, scenes, imgs: imgsForPage, widthRows, BASELINE_FONTS,
  mapFontSrc: mapFont.toString(), mapFamilySrc: mapFamily.toString(), toUriSrc: TO_URI.js,
});
await browser.close();
for (const [id, [w, h]] of Object.entries(result.imgDims)) {
  if (w !== IMAGES[id].w || h !== IMAGES[id].h) throw new Error(`image ${id}: browser ${w}x${h} vs recorded ${IMAGES[id].w}x${IMAGES[id].h}`);
}

const num = (v) => String(v);
let w = '# font (web value)<TAB>text<TAB>Chromium measureText(text).width (font mapped to the bundled faces)\n';
widthRows.forEach(([f, t], i) => { w += [f, t, num(result.widths[i])].map(noTab).join('\t') + '\n'; });
writeFileSync(OUT + 'widths.tsv', w);
let b = '# font<TAB>textBaseline<TAB>measureText("🔥").alphabeticBaseline\n';
for (const r of result.baselines) b += r.map((x) => noTab(num(x))).join('\t') + '\n';
writeFileSync(OUT + 'baselines.tsv', b);
for (const [name, data] of Object.entries(result.out)) writeFileSync(OUT + `ref/${name}.rgba`, Buffer.from(data, 'base64'));
writeFileSync(OUT + 'versions.txt', `node ${process.version}\nplaywright ${require('playwright/package.json').version}\nchromium ${version}\nfont-render-hinting none\nprepareSvgForCanvas ${PREPARE.where}\nsvgToDataUri ${TO_URI.where}\nuserAgent ${result.ua}\n`);

const files = ['gen.mjs', 'scenes.tsv', 'prepare.tsv', 'edge-svgs.tsv', 'widths.tsv', 'baselines.tsv', 'versions.txt',
  ...readdirSync(OUT + 'input').sort().map((f) => 'input/' + f),
  ...readdirSync(OUT + 'ref').sort().map((f) => 'ref/' + f)];
let man = '';
for (const f of files) man += createHash('sha256').update(readFileSync(OUT + f)).digest('hex') + '  ' + f + '\n';
for (const [, , file] of FACE_FILES) man += createHash('sha256').update(readFileSync(ASSETS + file)).digest('hex') + '  ../../../assets/' + file + '\n';
writeFileSync(OUT + 'MANIFEST.sha256', man);
console.log(`scenes=${scenes.length} images=${Object.keys(IMAGES).length} widths=${widthRows.length} baselines=${result.baselines.length} chromium=${version}`);
