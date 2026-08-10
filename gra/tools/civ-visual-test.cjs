'use strict';
/** node tools/civ-visual-test.cjs — kolorHex cywilizacji (B-decyzja 2026-07-07) */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.civ-visual-entry.ts');
const bundle = path.join(__dirname, '.civ-visual-bundle.cjs');

fs.writeFileSync(
  entry,
  `export {
  OWNER_COLORS_FALLBACK,
  parseHexColor,
  civColorHex,
  civColorForIkonaId,
  civColorForOwner,
  civColorCssForOwner,
} from '../src/game/civ-visual';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const civs = require('../data/civs.json');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('civ-visual-test (kolorHex cywilizacji)\n');

assert(M.parseHexColor('#1E5AA8') === 0x1e5aa8, 'parseHexColor #1E5AA8');
assert(M.parseHexColor('C41E3A') === 0xc41e3a, 'parseHexColor bez #');
assert(M.parseHexColor('#ABC') === 0xaabbcc, 'parseHexColor skrót 3-znakowy');
assert(M.parseHexColor('not-a-hex') === M.OWNER_COLORS_FALLBACK[0], 'parseHexColor fallback przy złym hex');

const list = civs.cywilizacje;
assert(list.length === 15, `15 cywilizacji (jest ${list.length})`);

const hexSet = new Set();
for (const c of list) {
  const id = c.ikonaId;
  const hex = c.kolorHex;
  assert(typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex),
    `${id}: kolorHex wymagany #RRGGBB (dostał: ${hex})`);
  if (hex) hexSet.add(hex.toUpperCase());
  const resolved = M.civColorHex(civs, id);
  assert(resolved.toUpperCase() === hex.toUpperCase(), `${id}: civColorHex zgodny z JSON`);
  assert(M.civColorForIkonaId(civs, id) === M.parseHexColor(hex), `${id}: civColorForIkonaId`);
}

assert(hexSet.size >= 12, `kolory rozpoznawalne: min 12 unikalnych (jest ${hexSet.size})`);

const civTypeForOwner = (oid) => (oid === 0 ? 'grecy' : 'rzymianie');
assert(M.civColorForOwner(civs, 0, civTypeForOwner) === 0x1e5aa8, 'civColorForOwner gracz Grecy');
assert(M.civColorForOwner(civs, 3, civTypeForOwner) === 0x8b1a1a, 'civColorForOwner AI Rzymianie');
assert(M.civColorCssForOwner(civs, 0, civTypeForOwner) === '#1E5AA8', 'civColorCssForOwner CSS hex');

/*
 * R-GRANICE-ZULUSI-KOLOR-NIEWIDOCZNY (Maciej 2026-08-09, playtest):
 * obrys granicy terytorium (rangeOverlay.buildTerritoryBorderGroup) rysuje pas w kolorze
 * kolorHex cywilizacji, MeshBasicMaterial transparent, opacity = TERRITORY_BORDER_OPACITY = 0,7.
 * Zulusi mieli #2E7D32 (ciemna zieleń) — po zmieszaniu z zielenią terenu obrys znikał
 * (najgorszy przypadek: dE76 = 4,6 wobec zbocza wzgórza #3A8E42, czyli różnica niewidoczna).
 * Ta asercja pilnuje, żeby kolor Zulusów nie wrócił w okolice zieleni terenu.
 *
 * Metryka: CIE76 dE w przestrzeni Lab między KOLOREM MIESZANKI (kolorHex nałożony na teren
 * z alfa 0,7) a samym terenem. Próg 20 dE — dobrany tak, by odrzucić stan sprzed poprawki
 * (min 4,6) i zostawić zapas pod dzisiejszy #C8E838 (min 23,5). Tła: paleta terenu stylu
 * aktywnego w grze (GAME_MAP_RENDER_STYLE = 'roblox', TERRAIN_ROBLOX + HILL_VARIANTS_ROBLOX
 * + liście lasu w gra/src/render/mapRenderStyle.ts). Sprawdzamy WYŁĄCZNIE Zulusów — pozostałe
 * cywilizacje nie są objęte tym zgłoszeniem (Celtowie #3D6B35 mają dziś min dE = 6,4,
 * czyli ten sam problem, ale to osobna decyzja właściciela).
 */
const BORDER_ALPHA = 0.7;
const TERRAIN_GREENS = [
  '#94bf78', '#b0ca7e', '#7ea872', // TERRAIN_ROBLOX: Łąka / Równina / Wzgórza
  '#3d6b45', '#4a7a52', '#8fbf7a', '#a8d4a0', // liście lasu (leaf1/leaf2/warianty jasne)
  '#7ab848', '#8ec862', '#55d858', '#6ee872', // HILL_VARIANTS_ROBLOX: grassA/grassB
  '#6a8a48', '#7a9a58', '#3a8e42', '#4a9e52', '#3a7040', '#4a8050',
];

function hexToRgb(h) {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
function rgbToLab(rgb) {
  const [r, g, b] = rgb.map(srgbToLinear);
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const Y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function deltaE76(a, b) {
  const la = rgbToLab(a);
  const lb = rgbToLab(b);
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}
function blendOver(fg, bg, alpha) {
  return fg.map((v, i) => Math.round(alpha * v + (1 - alpha) * bg[i]));
}

const zulu = list.find((c) => c.ikonaId === 'zulusi');
assert(!!zulu, 'zulusi: wpis istnieje w civs.json');
if (zulu) {
  const fg = hexToRgb(zulu.kolorHex);
  let minDe = Infinity;
  let worstBg = '';
  for (const bgHex of TERRAIN_GREENS) {
    const bg = hexToRgb(bgHex);
    const de = deltaE76(blendOver(fg, bg, BORDER_ALPHA), bg);
    if (de < minDe) { minDe = de; worstBg = bgHex; }
  }
  assert(
    minDe >= 20,
    `zulusi: obrys granicy odróżnialny od zieleni terenu — min dE76 (alfa ${BORDER_ALPHA}) ` +
    `= ${minDe.toFixed(1)} przy progu 20 (najgorsze tło ${worstBg}, kolor ${zulu.kolorHex})`,
  );
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
