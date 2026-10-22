// R-RUSTPORT-P4-29-TEXT-FONTS-Q1 — reference generator for tests/text_*.rs (RR-T8b).
//
// Reference = REAL Chromium Canvas 2D with the SAME bundled font files
// (owner decision D-TXT-5 = A: "Chromium + te same pliki fontów"), loaded as
// FontFace objects under private names. Web font stacks are translated to
// those names by mapFamily() below — a second, independent implementation of
// `raster::text::map_family` (ZAŁOŻENIE Z-29-1) — and every stack ends with
// the last-resort family (Z-29-2), so Chromium never reaches system fonts.
//
// Outputs (all in this directory):
//   widths.tsv    font<TAB>text<TAB>measureText(text).width   (web stacks × texts)
//   truncate.tsv  kind<TAB>font<TAB>maxW<TAB>input<TAB>web result (truncateName / hover row)
//   baselines.tsv font<TAB>textBaseline<TAB>TextMetrics.alphabeticBaseline
//   fontparse.tsv input<TAB>accepted(1/0)<TAB>Chromium ctx.font serialisation
//   upper.tsv     code point<TAB>JS toUpperCase (code points, space separated) — only where it changes
//   city_names.txt every string value of gra/data/city-names-pools.json @ edb8fb56, one per line
//   scenes.tsv + ref/<scene>.rgba  op lists (web text producers T5, T6, T9, T15 + T10/T13/T14
//                 text parts + semantic scenes) replayed in Chromium → getImageData (straight RGBA8)
//   versions.txt, MANIFEST.sha256 (sha256 of every file above, gen.mjs included, and of the fonts)
//
// Every web scene names its source as file:line in pin edb8fb56 (paths relative to gra/src).
//
// Run (from rust-port/renderer/tests/fixtures/text; needs git with the pin edb8fb56):
//   NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen.mjs
// Chromium flags: --disable-gpu --force-color-profile=srgb --font-render-hinting=none
// (no hinting = P4-25 Z-4; the flag's effect is measured in P4-29 §5).

import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const OUT = new URL('./', import.meta.url).pathname;
const FONT_DIR = OUT + '../../../assets/fonts/';
const PIN = 'edb8fb56';
const HINTING = process.env.TEXT_HINTING || 'none';

// ---------------------------------------------------------------------------
// Family mapping (mirror of raster::text::map_family + FALLBACK_FAMILY)
// ---------------------------------------------------------------------------
const FACE_FILES = [
  ['CivLiberationSans', '400', 'LiberationSans-Regular.ttf'],
  ['CivLiberationSans', '700', 'LiberationSans-Bold.ttf'],
  ['CivLiberationSerif', '400', 'LiberationSerif-Regular.ttf'],
  ['CivLiberationSerif', '700', 'LiberationSerif-Bold.ttf'],
  ['CivDejaVuSans', '400', 'DejaVuSans.ttf'],
  ['CivDejaVuSans', '700', 'DejaVuSans-Bold.ttf'],
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
  return null;
}
/** Web `font` value → the same value over the bundled faces. */
function mapFont(css) {
  const m = /^(.*?\d+(?:\.\d+)?px(?:\/\S+)?)\s+(.+)$/.exec(css);
  if (!m) throw new Error('mapFont: unsupported ' + css);
  const fams = [];
  for (const f of m[2].split(',').map((s) => s.trim())) {
    const g = mapFamily(f);
    if (g && !fams.includes(g)) fams.push(g);
  }
  if (!fams.includes('CivDejaVuSans')) fams.push('CivDejaVuSans');
  return m[1] + ' ' + fams.join(', ');
}

// ---------------------------------------------------------------------------
// Web data from the pin
// ---------------------------------------------------------------------------
const gitShow = (p) => execSync(`git show ${PIN}:${p}`, { maxBuffer: 64 << 20 }).toString('utf8');
const cityPools = JSON.parse(gitShow('gra/data/city-names-pools.json'));
const cityNames = [];
(function walk(v) {
  if (typeof v === 'string') cityNames.push(v);
  else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
})(cityPools);
const uniqueCityNames = [...new Set(cityNames)];
const buildings = JSON.parse(gitShow('gra/data/buildings.json'));
const buildingNames = [];
(function walk(v) {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') {
    if (typeof v.nazwa === 'string') buildingNames.push(v.nazwa);
    Object.values(v).forEach(walk);
  }
})(buildings);
const units = JSON.parse(gitShow('gra/data/units.json'));
const unitNames = [];
(function walk(v) {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') {
    if (typeof v.Jednostka === 'string') unitNames.push(v.Jednostka);
    Object.values(v).forEach(walk);
  }
})(units);

// render/cityMapStatChip.ts:767-779 (truncateName) and :711-716 (hover row) — verbatim loops.
function truncateName(ctx, name, maxW, font) {
  ctx.font = font;
  if (ctx.measureText(name).width <= maxW) return name;
  let s = name;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) {
    s = s.slice(0, -1);
  }
  return s + '…';
}
// render/cityMapStatChip.ts:741-747 formatCityGrowthPercentLabel (verbatim).
function formatCityGrowthPercentLabel(pct, starving = false) {
  if (starving) return '—';
  const rounded = Math.round((Number.isFinite(pct) ? pct : 0) * 10) / 10;
  const abs = Math.abs(rounded);
  const digits = Number.isInteger(abs) ? String(abs) : abs.toFixed(1).replace('.', ',');
  return `${rounded < 0 ? '−' : ''}${digits}%`;
}

// Web font values (P4-25 §3.2, file:line in pin).
const F = {
  name: '700 22px Georgia, "Times New Roman", serif', // cityMapStatChip.ts:802
  pop: '700 16px Arial, Helvetica, sans-serif', // cityMapStatChip.ts:803
  growth: '700 13px Arial, Helvetica, sans-serif', // cityMapStatChip.ts:94
  hover: '600 11px Arial, Helvetica, sans-serif', // cityMapStatChip.ts:707
  warn: 'bold 11px Arial, Helvetica, sans-serif', // cityMapStatChip.ts:684
  medal: 'bold 20px "Segoe UI Symbol", "Segoe UI", Arial, sans-serif', // cityMapStatChip.ts:577
  stack: 'bold 26px Segoe UI, Arial, sans-serif', // units.ts:6382
  turn: 'bold 20px Segoe UI, Arial, sans-serif', // units.ts:6594
  skull: 'bold 104px "Segoe UI Symbol", "Segoe UI Emoji", "Segoe UI", Arial, sans-serif', // units.ts:6294
  digit: `900 ${Math.round(Math.round((72 * 0.126) / 0.072) * 0.94)}px "Segoe UI", Arial, sans-serif`, // unitStatPlate.ts:609
  emblem: 'bold 58px "Segoe UI Symbol", "Segoe UI", Arial, sans-serif', // unitOwnerEmblem.ts:260
  siege: 'bold 96px Arial', // siegeMarker.ts:42
  group: 'bold 16px sans-serif', // battle/battleScene.ts:18658
  yield16: 'bold 16px Arial, Helvetica, sans-serif', // cityOkolicaOverlay.ts:87-88 (px 16)
  yield20: 'bold 20px Arial, Helvetica, sans-serif', // cityOkolicaOverlay.ts:87-88 (px 16·1.28→20)
  serif48: '48px serif', // cities.ts:714
};

// ---------------------------------------------------------------------------
// Width table
// ---------------------------------------------------------------------------
const NON_ASCII_22 = 'ÖŁÜŃÓØŞĞÇĄŻÁÑÉŚĘÚŘÍÅÄŹ'; // P4-25 §3.3 / dowody/07
const LOWER_25 = 'ąćęłńóśźżßıáäåçéíñöøúüğřş'; // P4-25 §3.3 (hover / R5 sources)
const PUNCT = '×…−—·%,!→-+()[]:;.\'"/?0123456789 ';
const widthRows = [];
const addW = (font, text) => widthRows.push([font, text]);
for (const n of uniqueCityNames) addW(F.name, n.trim().toUpperCase()); // cityMapStatChip.ts:789
for (const n of uniqueCityNames) addW(F.name, n.trim().toUpperCase() + '…');
for (let p = -25; p <= 25; p += 0.25) addW(F.growth, formatCityGrowthPercentLabel(p));
addW(F.growth, formatCityGrowthPercentLabel(0, true));
for (let i = 1; i <= 60; i++) addW(F.pop, String(i));
for (let i = 2; i <= 99; i++) addW(F.stack, '×' + String(i)); // units.ts:6385
for (let i = 1; i <= 60; i++) addW(F.turn, String(i)); // units.ts:6597
for (let d = 0; d <= 9; d++) addW(F.digit, String(d)); // unitStatPlate.ts:615-617
for (let i = 1; i <= 12; i++) addW(F.group, String(i)); // battleScene.ts:18661
for (let i = 0; i <= 40; i++) { addW(F.yield16, String(i)); addW(F.yield20, String(i)); }
for (const b of buildingNames) addW(F.hover, `Budynek · ${b}`);
for (const u of unitNames) addW(F.hover, `Jednostka · ${u}`);
addW(F.hover, 'Produkcja wstrzymana');
addW(F.hover, 'Brak surowców w magazynie');
addW(F.hover, 'Rozbuduj Spichlerz → Magazyn');
addW(F.warn, '!');
for (const f of Object.values(F)) {
  for (const c of NON_ASCII_22 + LOWER_25 + PUNCT) addW(f, c);
  addW(f, NON_ASCII_22);
  addW(f, LOWER_25);
  addW(f, 'ZAŻÓŁĆ GĘŚLĄ JAŹŃ');
  addW(f, 'AV To LT Wa Yo Te P. F, VA «»'); // kerning pairs
}
for (const f of [F.medal, F.emblem, F.skull, F.siege, F.serif48, F.name]) {
  for (const c of ['☠', '◆', '⚔', 'A☠B', '◆1']) addW(f, c); // per-glyph fallback to DejaVu
}
// Obrona r1 (zarzut 2, E05): relative weights select the face — `bolder` → Bold, `lighter` → Regular.
for (const f of ['bolder 22px Arial, sans-serif', 'lighter 22px Arial, sans-serif', 'bolder 16px serif', 'lighter 16px serif']) {
  for (const t of ['GRECY', 'Jednostka · Wojownik', 'ZAŻÓŁĆ GĘŚLĄ JAŹŃ', '0123456789']) addW(f, t);
}

// ---------------------------------------------------------------------------
// Font shorthand parsing probes
// ---------------------------------------------------------------------------
const FONT_PROBES = [
  ...new Set(Object.values(F)),
  'italic small-caps bold condensed 12px/1.2 Arial', 'normal normal 12pt "A B"', 'lighter 10px x',
  '12px/normal x', '10px "sans-serif", serif', '', 'bold', '12px', 'Arial 12px', 'bold bold 12px x',
  '12em x', '12% x', '-1px x', '1001 12px x', "12px 'unterminated", '12px x,', '12px inherit',
  '12px x y, , z', '500 11px Arial', '1in serif', '10.5px Arial', 'oblique 12px x', 'semi-expanded 9px x',
  // Obrona r1 (zarzut 2, E05): relative weight keywords.
  'bolder 10px x', 'bolder 22px Arial, sans-serif', 'italic bolder 12px x', 'bolder lighter 12px x',
];

// ---------------------------------------------------------------------------
// Scenes (recording context; same member names as CanvasRenderingContext2D)
// ---------------------------------------------------------------------------
let gradSeq = 0;
class Grad {
  constructor(rec, id) { this.rec = rec; this.id = id; }
  addColorStop(o, c) { this.rec.ops.push(['stop', this.id, o, c]); }
}
class Rec {
  constructor() { this.ops = []; }
  set fillStyle(v) { this.ops.push(v instanceof Grad ? ['fillGrad', v.id] : ['fillStyle', v]); }
  set strokeStyle(v) { this.ops.push(['strokeStyle', v]); }
  set lineWidth(v) { this.ops.push(['lineWidth', v]); }
  set lineJoin(v) { this.ops.push(['lineJoin', v]); }
  set shadowColor(v) { this.ops.push(['shadowColor', v]); }
  set shadowBlur(v) { this.ops.push(['shadowBlur', v]); }
  set shadowOffsetY(v) { this.ops.push(['shadowOffsetY', v]); }
  set font(v) { this.ops.push(['font', v]); }
  set textAlign(v) { this.ops.push(['textAlign', v]); }
  set textBaseline(v) { this.ops.push(['textBaseline', v]); }
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
  arc(x, y, r, s, e, ccw) { this.ops.push(['arc', x, y, r, s, e, ccw === true]); }
  roundRect(x, y, w, h, r) { this.ops.push(['roundRect', x, y, w, h, r]); }
  closePath() { this.ops.push(['closePath']); }
  fill() { this.ops.push(['fill']); }
  stroke() { this.ops.push(['stroke']); }
  fillRect(x, y, w, h) { this.ops.push(['fillRect', x, y, w, h]); }
  strokeRect(x, y, w, h) { this.ops.push(['strokeRect', x, y, w, h]); }
  clearRect(x, y, w, h) { this.ops.push(['clearRect', x, y, w, h]); }
  fillText(t, x, y) { this.ops.push(['fillText', t, x, y]); }
  strokeText(t, x, y) { this.ops.push(['strokeText', t, x, y]); }
}
const scenes = [];
function scene(name, w, h, src, fn) {
  const ctx = new Rec();
  fn(ctx);
  scenes.push({ name, w, h, src, ops: ctx.ops });
}

// T5 — render/units.ts:6369-6392 _makeStackBadgeSprite (whole canvas).
for (const count of [2, 3, 12]) {
  scene(`t5_stack_badge_x${count}`, 64, 64, 'render/units.ts:6374-6385', (ctx) => {
    ctx.fillStyle = 'rgba(12,18,32,0.92)';
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8d88a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#e8d88a';
    ctx.font = 'bold 26px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×' + String(count), 32, 34);
  });
}
// T6 — render/units.ts:6580-6597 _makePathTurnLabelSprite (text = turn number, P4-25 Z-5).
for (const text of ['1', '7', '23']) {
  scene(`t6_turn_label_${text}`, 128, 48, 'render/units.ts:6580-6597', (ctx) => {
    const canvas = { width: 128, height: 48 };
    ctx.fillStyle = 'rgba(8,12,22,0.88)';
    ctx.strokeStyle = '#e0b24a';
    ctx.lineWidth = 2;
    const pad = 4;
    ctx.beginPath();
    ctx.roundRect(pad, pad, canvas.width - pad * 2, canvas.height - pad * 2, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f5e6b8';
    ctx.font = 'bold 20px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
  });
}
// T9 — render/unitStatPlate.ts:539-540, :602-617 getPowerDigitMaterial (all 10 digits).
{
  const POWER_DIGIT_CANVAS_W = 72;
  const POWER_DIGIT_CANVAS_H = Math.round((POWER_DIGIT_CANVAS_W * 0.126) / 0.072); // :524-526, HEX_R cancels
  for (let digit = 0; digit <= 9; digit++) {
    scene(`t9_power_digit_${digit}`, POWER_DIGIT_CANVAS_W, POWER_DIGIT_CANVAS_H, 'render/unitStatPlate.ts:608-617', (ctx) => {
      ctx.clearRect(0, 0, POWER_DIGIT_CANVAS_W, POWER_DIGIT_CANVAS_H);
      ctx.font = `900 ${Math.round(POWER_DIGIT_CANVAS_H * 0.94)}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.round(POWER_DIGIT_CANVAS_H * 0.22);
      ctx.strokeStyle = '#05070b';
      ctx.strokeText(String(digit), POWER_DIGIT_CANVAS_W / 2, POWER_DIGIT_CANVAS_H / 2 + 1);
      ctx.fillStyle = '#fdf6e3';
      ctx.fillText(String(digit), POWER_DIGIT_CANVAS_W / 2, POWER_DIGIT_CANVAS_H / 2 + 1);
    });
  }
}
// T15 — battle/battleScene.ts:18646-18661 _makeGroupNumberTexture.
for (const label of ['1', '2', '7', '10']) {
  scene(`t15_group_number_${label}`, 28, 28, 'battle/battleScene.ts:18652-18661', (ctx) => {
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(2, 2, 24, 24);
    ctx.strokeStyle = '#1a1408';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 24, 24);
    ctx.fillStyle = '#1a1408';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 14, 15);
  });
}
// T10 fallback glyph — render/unitOwnerEmblem.ts:260-263 (☠ / ◆; monochrome DejaVu, D-TXT-3 open).
for (const [v, g] of [['barbarian', '☠'], ['civ', '◆']]) {
  scene(`t10_glyph_${v}`, 128, 128, 'render/unitOwnerEmblem.ts:260-263 (glyph only)', (ctx) => {
    const c = 64;
    ctx.fillStyle = '#f4ead2';
    ctx.font = 'bold 58px "Segoe UI Symbol", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(v === 'barbarian' ? '☠' : '◆', c, c + 3);
  });
}
// T13 — render/cityOkolicaOverlay.ts:155-178 drawYieldLine, digits with shadow (emoji part: RR-T8c).
for (const worked of [false, true]) {
  scene(`t13_yield_digits_${worked ? 'worked' : 'idle'}`, 128, 40, 'render/cityOkolicaOverlay.ts:157-178 (digits)', (ctx) => {
    const fontPx = 16;
    const digitPx = worked ? Math.round(fontPx * 1.28) : fontPx;
    const y = 10;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.font = `bold ${digitPx}px Arial, Helvetica, sans-serif`;
    ctx.fillStyle = worked ? '#e0b24a' : '#fffef8';
    ctx.shadowColor = worked ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = worked ? 3 : 2;
    ctx.shadowOffsetY = 1;
    ctx.fillText(worked ? '12' : '3', 54, y - (worked ? 2 : 0));
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  });
}
// T14 text parts — render/cityMapStatChip.ts:851 (setTransform dpr), :898-902 name, :759-763 WZROST%,
// :921-925 population, :684-687 "!", :577-580 ◆ medallion fallback.
for (const [dpr, name, growth] of [[1, 'UMGUNGUNDLOVU', '−10,5%'], [2, 'ZAŻÓŁĆ GĘŚLĄ JAŹŃ', '5,5%'], [3, 'KRAKÓW', '0%'], [1.5, 'ŞANLIURFA', '—']]) {
  const W = 360, H = 48;
  scene(`t14_text_x${String(dpr).replace('.', '_')}`, Math.round(W * dpr), Math.round(H * dpr), 'render/cityMapStatChip.ts:851, :898-925, :759-763, :577-580, :684-687 (text only)', (ctx) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cy = 24;
    ctx.font = '700 22px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f4f0e8';
    ctx.fillText(name, 40, cy);
    ctx.font = '700 13px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#d4c48a';
    ctx.fillText(growth, 270, cy);
    ctx.font = '700 16px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8d88a';
    ctx.fillText('17', 335, cy + 1);
    ctx.font = 'bold 20px "Segoe UI Symbol", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c8b888';
    ctx.fillText('◆', 20, cy + 1);
    ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
    ctx.fillText('!', 315, cy + 0.5);
  });
}
// T14 hover row — render/cityMapStatChip.ts:707-717 (600 11px, already truncated line).
scene('t14_hover_row_x2', 720, 44, 'render/cityMapStatChip.ts:707-717', (ctx) => {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.font = '600 11px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#c8b888';
  ctx.fillText('Budynek · Spichlerz · wstrzymana', 10, 11);
});
// Semantic scenes.
scene('x_text_align', 240, 120, 'textAlign start/end/left/right/center', (ctx) => {
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#204060';
  ctx.textBaseline = 'alphabetic';
  const al = ['start', 'end', 'left', 'right', 'center'];
  al.forEach((a, i) => { ctx.textAlign = a; ctx.fillText('Ab' + i, 120, 22 + i * 22); });
});
scene('x_text_baselines', 360, 70, 'textBaseline ×6', (ctx) => {
  ctx.font = '22px Times New Roman';
  ctx.fillStyle = '#000000';
  const bl = ['top', 'hanging', 'middle', 'alphabetic', 'ideographic', 'bottom'];
  bl.forEach((b, i) => { ctx.textBaseline = b; ctx.fillText('Xg', 8 + i * 58, 35); });
});
scene('x_text_rotated_gradient', 200, 120, 'rotate + gradient fill + strokeText (round join)', (ctx) => {
  ctx.translate(100, 60);
  ctx.rotate(-0.3);
  const g = ctx.createLinearGradient(0, -20, 0, 20);
  g.addColorStop(0, '#ffcc00');
  g.addColorStop(1, '#aa2200');
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.strokeText('Wąż', 0, 0);
  ctx.fillStyle = g;
  ctx.fillText('Wąż', 0, 0);
});
scene('x_text_charset_sans', 420, 90, 'P4-25 §3.3: 22 upper + 25 lower + punctuation, Liberation Sans', (ctx) => {
  ctx.font = '600 15px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#101010';
  ctx.textBaseline = 'top';
  ctx.fillText(NON_ASCII_22, 4, 4);
  ctx.fillText(LOWER_25, 4, 30);
  ctx.fillText('×…−—·%,!→ 0123456789', 4, 56);
});
scene('x_text_charset_serif', 420, 60, 'P4-25 §3.3: 22 upper chars, Liberation Serif Bold (name font)', (ctx) => {
  ctx.font = '700 22px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#101010';
  ctx.textBaseline = 'middle';
  ctx.fillText(NON_ASCII_22, 4, 30);
});
scene('x_text_save_restore_font', 200, 50, 'font/textAlign/textBaseline saved and restored', (ctx) => {
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.save();
  ctx.font = '10px serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.restore();
  ctx.fillText('Restored', 4, 4);
  ctx.font = 'bogus';
  ctx.textAlign = 'bogus';
  ctx.fillText('Kept', 120, 4);
});
scene('x_text_path_untouched', 120, 60, 'fillText does not touch the current path', (ctx) => {
  ctx.fillStyle = '#3060a0';
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(110, 10);
  ctx.lineTo(60, 55);
  ctx.closePath();
  ctx.font = '20px Arial';
  ctx.fillText('ignored?', 10, 40);
  ctx.fillStyle = '#c04020';
  ctx.fill();
});

// ---------------------------------------------------------------------------
// Write tables known without the browser
// ---------------------------------------------------------------------------
mkdirSync(OUT + 'ref', { recursive: true });
const noTab = (s) => { if (/[\t\n]/.test(String(s))) throw new Error('tab/newline in field: ' + s); return String(s); };
writeFileSync(OUT + 'city_names.txt', cityNames.map(noTab).join('\n') + '\n');
let upper = '# code point (hex)<TAB>JS toUpperCase result (hex code points) — only code points that change; node ' + process.version + '\n';
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const s = String.fromCodePoint(cp);
  const u = s.toUpperCase();
  if (u !== s) upper += cp.toString(16) + '\t' + [...u].map((c) => c.codePointAt(0).toString(16)).join(' ') + '\n';
}
writeFileSync(OUT + 'upper.tsv', upper);
let tsv = '# R-RUSTPORT-P4-29 text scenes — generated by gen.mjs; do not edit by hand.\n';
tsv += '# scene<TAB>name<TAB>w<TAB>h<TAB>source ; op lines: op<TAB>args… ; end\n';
for (const s of scenes) {
  tsv += ['scene', s.name, s.w, s.h, s.src].map(noTab).join('\t') + '\n';
  for (const op of s.ops) tsv += op.map(noTab).join('\t') + '\n';
  tsv += 'end\n';
}
writeFileSync(OUT + 'scenes.tsv', tsv);

// ---------------------------------------------------------------------------
// Chromium
// ---------------------------------------------------------------------------
const faces = FACE_FILES.map(([fam, w, file]) => [fam, w, readFileSync(FONT_DIR + file).toString('base64')]);
const browser = await chromium.launch({
  args: ['--disable-gpu', '--force-color-profile=srgb', `--font-render-hinting=${HINTING}`],
});
const version = browser.version();
const page = await browser.newPage();
const BASELINE_FONTS = [];
for (const fam of ['Liberation Sans', 'Liberation Serif', 'DejaVu Sans'])
  for (const w of ['400', '700'])
    for (const px of [10, 11, 13, 16, 20, 22, 26, 48, 58, 96, 104, 118]) BASELINE_FONTS.push(`${w} ${px}px "${fam}"`);
const truncJobs = [];
for (const n of uniqueCityNames) for (const maxW of [305, 285, 266, 240, 213.8, 180, 120, 60]) truncJobs.push(['name', F.name, maxW, n.trim().toUpperCase()]);
for (const b of buildingNames) for (const maxW of [80, 140, 200]) truncJobs.push(['hover', F.hover, maxW, `Budynek · ${b} · wstrzymana`]);
for (const u of unitNames) for (const maxW of [80, 140]) truncJobs.push(['hover', F.hover, maxW, `Jednostka · ${u}`]);
// Obrona r1 (zarzuty 1–2, E03/E09): boundary cases. maxW given as ['w', text] is resolved IN Chromium
// to measureText(text).width (exact float), so `<=` / `>` comparisons are hit at equality.
for (const n of uniqueCityNames.slice(0, 40)) {
  const u = n.trim().toUpperCase();
  truncJobs.push(['name', F.name, ['w', u], u]); // fits exactly → name (cityMapStatChip.ts:773 `<=`)
  if (u.length > 3) truncJobs.push(['name', F.name, ['w', u.slice(0, -2) + '…'], u]); // loop stops at equality (:775 `>`)
}
for (const l of ['Budynek · Spichlerz · wstrzymana', 'Jednostka · Wojownik', 'Produkcja wstrzymana']) {
  truncJobs.push(['hover', F.hover, ['w', l], l]); // fits exactly → unchanged (:711 `>`)
  truncJobs.push(['hover', F.hover, ['w', l.slice(0, -3) + '…'], l]); // loop stops at equality (:713)
}
for (const l of ['AB', 'Ż·', 'WA', 'A', '·']) truncJobs.push(['hover', F.hover, 1, l]); // length 2 → cut, 1 → kept (:711 `length > 1`)
for (const l of ['AB', 'ŻÓ', 'A']) truncJobs.push(['name', F.name, 1, l]); // `s.length > 1` loop guard (:774)

const result = await page.evaluate(async ({ faces, scenes, widthRows, truncJobs, BASELINE_FONTS, FONT_PROBES, mapFontSrc, mapFamilySrc, truncateNameSrc }) => {
  for (const [fam, w, b64] of faces) {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const f = new FontFace(fam, bin, { weight: w });
    await f.load();
    document.fonts.add(f);
  }
  // eslint-disable-next-line no-new-func
  const mapFamily = new Function('return ' + mapFamilySrc)();
  const mapFont = new Function('mapFamily', 'return ' + mapFontSrc)(mapFamily);
  const truncateName = new Function('return ' + truncateNameSrc)();
  const b64 = (u8) => {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const m = document.createElement('canvas').getContext('2d');
  const widths = widthRows.map(([font, text]) => { m.font = mapFont(font); return m.measureText(text).width; });
  // Truncation: the web loop verbatim, on a context whose font setter maps the stack.
  const proxy = {
    set font(v) { m.font = mapFont(v); },
    measureText: (t) => m.measureText(t),
  };
  const truncMaxW = truncJobs.map(([, font, maxW]) => {
    if (!Array.isArray(maxW)) return maxW;
    m.font = mapFont(font);
    return m.measureText(maxW[1]).width;
  });
  const trunc = truncJobs.map(([kind, font, , input], i) => {
    const maxW = truncMaxW[i];
    if (kind === 'name') return truncateName(proxy, input, maxW, font);
    // render/cityMapStatChip.ts:711-715 (hover row), verbatim.
    proxy.font = font;
    let line = input;
    const maxTextW = maxW;
    if (m.measureText(line).width > maxTextW && line.length > 1) {
      let s = line;
      while (s.length > 1 && m.measureText(s + '…').width > maxTextW) s = s.slice(0, -1);
      line = s + '…';
    }
    return line;
  });
  const baselines = [];
  for (const f of BASELINE_FONTS) {
    const mf = mapFont(f);
    for (const bl of ['alphabetic', 'top', 'hanging', 'middle', 'ideographic', 'bottom']) {
      m.font = mf;
      m.textBaseline = bl;
      baselines.push([f, bl, m.measureText('Hg').alphabeticBaseline]);
    }
  }
  m.textBaseline = 'alphabetic';
  const fontparse = FONT_PROBES.map((s) => {
    m.font = '10px sentinel-a';
    m.font = s;
    const r1 = m.font;
    m.font = '11px sentinel-b';
    m.font = s;
    const r2 = m.font;
    return [s, r1 === r2 ? 1 : 0, r1];
  });
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
        case 'font': if (a[0] === 'bogus') ctx.font = a[0]; else ctx.font = mapFont(a[0]); break;
        case 'textAlign': ctx.textAlign = a[0]; break;
        case 'textBaseline': ctx.textBaseline = a[0]; break;
        case 'grad': grads[a[0]] = ctx.createLinearGradient(a[1], a[2], a[3], a[4]); break;
        case 'stop': grads[a[0]].addColorStop(a[1], a[2]); break;
        case 'arc': ctx.arc(a[0], a[1], a[2], a[3], a[4], a[5]); break;
        default: ctx[name](...a);
      }
    }
    out[sc.name] = b64(ctx.getImageData(0, 0, sc.w, sc.h).data);
  }
  return { widths, trunc, truncMaxW, baselines, fontparse, out, ua: navigator.userAgent };
}, {
  faces, scenes, widthRows, truncJobs, BASELINE_FONTS, FONT_PROBES,
  mapFontSrc: mapFont.toString(), mapFamilySrc: mapFamily.toString(), truncateNameSrc: truncateName.toString(),
});
await browser.close();

const num = (v) => String(v);
let w = '# font (web value)<TAB>text<TAB>Chromium measureText(text).width (font mapped to the bundled faces)\n';
widthRows.forEach(([f, t], i) => { w += [f, t, num(result.widths[i])].map(noTab).join('\t') + '\n'; });
writeFileSync(OUT + 'widths.tsv', w);
let t = '# kind<TAB>font<TAB>maxW<TAB>input<TAB>web result (cityMapStatChip.ts truncateName :767-779 / hover row :711-716)\n';
truncJobs.forEach((j, i) => { t += [j[0], j[1], result.truncMaxW[i], j[3]].map(num).concat(result.trunc[i]).map(noTab).join('\t') + '\n'; });
writeFileSync(OUT + 'truncate.tsv', t);
let b = '# font<TAB>textBaseline<TAB>measureText("Hg").alphabeticBaseline\n';
for (const r of result.baselines) b += r.map((x) => noTab(num(x))).join('\t') + '\n';
writeFileSync(OUT + 'baselines.tsv', b);
let fp = '# input<TAB>accepted(1/0)<TAB>Chromium ctx.font serialisation\n';
for (const r of result.fontparse) fp += r.map((x) => noTab(num(x))).join('\t') + '\n';
writeFileSync(OUT + 'fontparse.tsv', fp);
for (const [name, data] of Object.entries(result.out)) writeFileSync(OUT + `ref/${name}.rgba`, Buffer.from(data, 'base64'));
writeFileSync(OUT + 'versions.txt', `node ${process.version}\nplaywright ${require('playwright/package.json').version}\nchromium ${version}\nfont-render-hinting ${HINTING}\nuserAgent ${result.ua}\n`);

const files = ['gen.mjs', 'scenes.tsv', 'widths.tsv', 'truncate.tsv', 'baselines.tsv', 'fontparse.tsv', 'upper.tsv', 'city_names.txt', 'versions.txt',
  ...readdirSync(OUT + 'ref').sort().map((f) => 'ref/' + f)];
let man = '';
for (const f of files) man += createHash('sha256').update(readFileSync(OUT + f)).digest('hex') + '  ' + f + '\n';
for (const [, , file] of FACE_FILES) man += createHash('sha256').update(readFileSync(FONT_DIR + file)).digest('hex') + '  ../../../assets/fonts/' + file + '\n';
writeFileSync(OUT + 'MANIFEST.sha256', man);
console.log(`scenes=${scenes.length} widths=${widthRows.length} trunc=${truncJobs.length} names=${cityNames.length}/${uniqueCityNames.length} chromium=${version} hinting=${HINTING}`);
