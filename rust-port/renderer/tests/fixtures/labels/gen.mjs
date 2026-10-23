// R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 — reference generator for tests/labels_*.rs (RR-T8e,
// "kotwice DOM → Rust": labels R4, R5, R15a, R15b of P4-25 §2.3).
//
// Reference = the web's REAL DOM/CSS of these labels laid out and painted by headless Chromium 141
// (D-TXT-5 = A: the same bundled font files, loaded as FontFace under private names). Nothing of the
// label markup is re-typed here: every cssText array, style object, innerHTML expression, icon table,
// literal text, animation constant and the per-frame code (_tickFloatLabels, worldToScreen,
// worldToClientPx, updateSiegeHtmlLabels) is EXTRACTED from pin edb8fb56 (`git show`) and evaluated
// (TypeScript types stripped with node:module stripTypeScriptTypes). The only edits to the web's CSS:
//   1. font-family lists are mapped to the bundled faces (mapFamily(), mirror of raster::text +
//      raster::image::emoji: Arial/sans-serif → CivLiberationSans, then CivDejaVuSans, CivNotoEmoji);
//   2. for the PIXEL references only, the element is moved to (M, M) of the page with
//      `transform: none` (the label texture is drawn without the anchor translate; the translate and
//      the screen position are compared as numbers, `anchors.tsv`).
// The page is the pin's gra/index.html <style> (standards mode, `* {margin:0;padding:0;
// box-sizing:border-box}`) with a transparent body (labels sit over the WebGL canvas; texture alpha).
//
// Outputs (this directory):
//   scenes.tsv           scene<TAB>name<TAB>group<TAB>params…; W, H, margin M, dsf, opacity
//   layout.tsv           Chromium layout: border box and every text fragment (getClientRects)
//   ref/<scene>.rgba     page screenshot of the label (straight RGBA8, decoded from Chromium's PNG)
//   anchors.tsv          worldToClientPx / updateSiegeHtmlLabels / worldToScreen + translate(-50%…)
//                        evaluated with three@0.169.0 on two cameras, and Chromium's rect of the
//                        positioned element (with the web's transform)
//   float.tsv            _tickFloatLabels (verbatim) frame by frame: left, top, opacity, removed
//   consts.tsv           web constants as extracted (riseRate, duration, colours, texts, icons)
//   versions.txt, MANIFEST.sha256 (sha256 of every file above, gen.mjs included, and of the fonts)
//
// Run (from rust-port/renderer/tests/fixtures/labels; needs git with the pin edb8fb56 and
// three@0.169.0 installed in a scratch directory OUTSIDE the repo, passed as THREE_DIR):
//   NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
//     THREE_DIR=<scratch>/node_modules/three node gen.mjs
// Chromium flags: --disable-gpu --force-color-profile=srgb --font-render-hinting=none (as RR-T8a–c).

import { createRequire, stripTypeScriptTypes } from 'node:module';
import { writeFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { inflateSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const THREE_DIR = process.env.THREE_DIR;
if (!THREE_DIR) throw new Error('set THREE_DIR to node_modules/three (three@0.169.0, outside the repo)');
const THREE = await import(THREE_DIR + '/build/three.module.js');
const THREE_VERSION = JSON.parse(readFileSync(THREE_DIR + '/package.json', 'utf8')).version;
if (THREE_VERSION !== '0.169.0') throw new Error('three ' + THREE_VERSION);

const OUT = new URL('./', import.meta.url).pathname;
const ASSETS = OUT + '../../../assets/';
const PIN = 'edb8fb56';
const gitShow = (p) => execSync(`git show ${PIN}:${p}`, { maxBuffer: 64 << 20 }).toString('utf8');

// ---------------------------------------------------------------------------
// Extraction from the pin
// ---------------------------------------------------------------------------
const SRC = {
  'main.ts': gitShow('gra/src/main.ts'),
  'battle/battleScene.ts': gitShow('gra/src/battle/battleScene.ts'),
  'input/picker.ts': gitShow('gra/src/input/picker.ts'),
  'index.html': gitShow('gra/index.html'),
};
const consts = []; // [key, value, file:line]
/** First match of `re` in `file`; returns the capture groups and the line of the match. */
function grab(file, re, key) {
  const src = SRC[file];
  const m = re.exec(src);
  if (!m) throw new Error(`${key}: pattern not found in ${file}`);
  const line = src.slice(0, m.index).split('\n').length;
  return { g: m.slice(1), where: `${file}:${line}` };
}
const js = (ts) => stripTypeScriptTypes(ts);
/** A statement body (may `return`) with types stripped, as the body of a function that forwards `this`. */
const jsBody = (ts) => 'return ' + stripTypeScriptTypes('(function () {' + ts + '\n})') + '.call(this);';
// eslint-disable-next-line no-new-func
const evalExpr = (expr) => new Function('return ' + js('(' + expr + ')') + ';')();

// index.html <style> (verbatim) — page base styles.
const INDEX_STYLE = grab('index.html', /<style>([\s\S]*?)<\/style>/, 'index style');

// R4 build ghost chip (main.ts:12851-12968).
const R4_CSS = grab('main.ts', /ghostChip\.style\.cssText = (\[[\s\S]*?\])\.join\(';'\);/, 'R4 cssText');
const R4_ICONS = grab('main.ts', /const IMPROVEMENT_CHIP: [^=]+= (\{[\s\S]*?\});/, 'R4 IMPROVEMENT_CHIP');
const R4_SYNC = grab('main.ts', /(ghostChip\.style\.flexDirection = [\s\S]*?ghostChip\.style\.borderColor = [^;]+;)/, 'R4 sync body');
const R4_PLACE = grab('main.ts', /(ghostChip\.style\.left = [^;]+;\s*ghostChip\.style\.top = [^;]+;)/, 'R4 placement');
const R4_HEX = grab('main.ts', /function hexCenterClientPx\(q: number, r: number, liftY = ([\d.]+)\)/, 'R4 liftY');
const R4_REASON = grab('main.ts', /\? '(Droga musi[^']*)'/, 'R4 reason');
const R4_CITY = grab('main.ts', /setBuildGhostChip\(hit\.q, hit\.r, '([^']+)', canFoundPlayerCityAt/, 'R4 city icon');
const R4_FALLBACK = grab('main.ts', /IMPROVEMENT_CHIP\[activeImprovementKey\] \?\? '([^']+)'/, 'R4 fallback icon');
const PICKER_W2C = grab('input/picker.ts', /(export function worldToClientPx\([\s\S]*?\n\})\n/, 'worldToClientPx');
// R5 siege labels (main.ts:14560-14603).
const R5_HTML = grab('main.ts', /el\.innerHTML = ('<span style="font-size:18px">[^\n]*);\n/, 'R5 innerHTML');
const R5_CSS = grab('main.ts', /el\.className = 'civ-siege-html-label';[\s\S]*?el\.style\.cssText = (\[[\s\S]*?\])\.join\(';'\);/, 'R5 cssText');
const R5_UPDATE = grab('main.ts', /function updateSiegeHtmlLabels\(\): void \{([\s\S]*?)\n    \}\n/, 'R5 update');
const R5_LIFT = grab('main.ts', /siegeHtmlLabelAnchors\.push\(\{ x: pos\.x, y: topY \+ ([\d.]+), z: pos\.z/, 'R5 lift');
// R15a damage numbers (battleScene.ts:9091-9115) and R15b wall labels (:7477-7493).
const R15A_STYLE = grab('battle/battleScene.ts', /private _spawnDamageLabel\(ru: RuntimeBattleUnit, dmg: number\): void \{[\s\S]*?Object\.assign\(el\.style, (\{[\s\S]*?\})\);/, 'R15a style');
const R15A_TEXT = grab('battle/battleScene.ts', /private _spawnDamageLabel[\s\S]*?el\.textContent = ([^;]+);/, 'R15a text');
const R15A_PUSH = grab('battle/battleScene.ts', /private _spawnDamageLabel[\s\S]*?duration:\s*(\d+),[\s\S]*?riseRate:\s*([\d.]+),/, 'R15a anim');
const R15B_STYLE = grab('battle/battleScene.ts', /private _spawnWallLabel\([^)]*\): void \{[\s\S]*?Object\.assign\(el\.style, (\{[\s\S]*?\})\);/, 'R15b style');
const R15B_PUSH = grab('battle/battleScene.ts', /private _spawnWallLabel[\s\S]*?duration: (\d+),[\s\S]*?worldPos: new THREE\.Vector3\(x, ([\d.]+), z\),\s*riseRate: ([\d.]+),/, 'R15b anim');
const R15B_DMG = grab('battle/battleScene.ts', /this\._spawnWallLabel\(this\.siegeWallCol, wallRow, ('-' \+ dmg \+ ' \(mur\)'), '(#[0-9a-fA-F]+)'\);/, 'R15b dmg');
const R15B_BREACH = grab('battle/battleScene.ts', /this\._spawnWallLabel\(wallCol, wallRow, '([^']+)', '(#[0-9a-fA-F]+)'\);/, 'R15b breach');
const TICK = grab('battle/battleScene.ts', /private _tickFloatLabels\(t: number\): void \{([\s\S]*?)\n  \}\n/, '_tickFloatLabels');
const W2S = grab('battle/battleScene.ts', /(function worldToScreen\([\s\S]*?\n\})\n/, 'worldToScreen');

const r4Css = evalExpr(R4_CSS.g[0]).join(';');
const r4Icons = evalExpr(R4_ICONS.g[0]);
// eslint-disable-next-line no-new-func
const r4Sync = new Function('ghostChip', 'ghostChipValid', 'ghostChipReason', 'ghostChipLabel', jsBody(R4_SYNC.g[0]));
// eslint-disable-next-line no-new-func
const r4Place = new Function('ghostChip', 'pos', jsBody(R4_PLACE.g[0]));
// eslint-disable-next-line no-new-func
const worldToClientPx = new Function('THREE', js(PICKER_W2C.g[0]).replace(/^export /, '') + '\nreturn worldToClientPx;')(THREE);
// eslint-disable-next-line no-new-func
const r5Html = new Function('city', 'return ' + js(R5_HTML.g[0]) + ';');
const r5Css = evalExpr(R5_CSS.g[0]).join(';');
// eslint-disable-next-line no-new-func
const r5Update = new Function('siegeHtmlLabels', 'siegeHtmlLabelAnchors', 'canvas', 'window', 'THREE', 'camera', jsBody(R5_UPDATE.g[0]));
const r15aStyle = evalExpr(R15A_STYLE.g[0]);
// eslint-disable-next-line no-new-func
const r15aText = new Function('dmg', 'return ' + R15A_TEXT.g[0] + ';');
// eslint-disable-next-line no-new-func
const r15bStyle = new Function('color', 'return (' + js('(' + R15B_STYLE.g[0] + ')') + ');');
// eslint-disable-next-line no-new-func
const r15bDmgText = new Function('dmg', 'return ' + R15B_DMG.g[0] + ';');
// eslint-disable-next-line no-new-func
const worldToScreen = new Function('THREE', js(W2S.g[0]) + '\nreturn worldToScreen;')(THREE);
// eslint-disable-next-line no-new-func
const tickFloatLabels = new Function('worldToScreen', 't', jsBody(TICK.g[0]));

consts.push(['index_style', INDEX_STYLE.g[0].replace(/\s+/g, ' ').trim(), INDEX_STYLE.where]);
consts.push(['r4_css', r4Css, R4_CSS.where]);
for (const [k, v] of Object.entries(r4Icons)) consts.push(['r4_icon', `${k}=${v}`, R4_ICONS.where]);
consts.push(['r4_icon_city', R4_CITY.g[0], R4_CITY.where]);
consts.push(['r4_icon_fallback', R4_FALLBACK.g[0], R4_FALLBACK.where]);
consts.push(['r4_reason_droga', R4_REASON.g[0], R4_REASON.where]);
consts.push(['r4_lift_y', R4_HEX.g[0], R4_HEX.where]);
consts.push(['r5_css', r5Css, R5_CSS.where]);
consts.push(['r5_lift_y', R5_LIFT.g[0], R5_LIFT.where]);
consts.push(['r15a_style', JSON.stringify(r15aStyle), R15A_STYLE.where]);
consts.push(['r15a_duration', R15A_PUSH.g[0], R15A_PUSH.where]);
consts.push(['r15a_rise_rate', R15A_PUSH.g[1], R15A_PUSH.where]);
consts.push(['r15b_style', JSON.stringify(r15bStyle('COLOR')), R15B_STYLE.where]);
consts.push(['r15b_duration', R15B_PUSH.g[0], R15B_PUSH.where]);
consts.push(['r15b_world_y', R15B_PUSH.g[1], R15B_PUSH.where]);
consts.push(['r15b_rise_rate', R15B_PUSH.g[2], R15B_PUSH.where]);
consts.push(['r15b_dmg_color', R15B_DMG.g[1], R15B_DMG.where]);
consts.push(['r15b_breach_text', R15B_BREACH.g[0], R15B_BREACH.where]);
consts.push(['r15b_breach_color', R15B_BREACH.g[1], R15B_BREACH.where]);

// ---------------------------------------------------------------------------
// Fonts and family mapping (mirror of raster::text map_family + raster::image::emoji chain)
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
function mapFamilyList(list) {
  const fams = [];
  for (const f of list.split(',').map((s) => s.trim()).filter(Boolean)) {
    const g = mapFamily(f);
    if (g && !fams.includes(g)) fams.push(g);
  }
  for (const last of ['CivDejaVuSans', 'CivNotoEmoji']) if (!fams.includes(last)) fams.push(last);
  return fams.join(', ');
}

// ---------------------------------------------------------------------------
// Scenes (label instances). Each names its web source.
// ---------------------------------------------------------------------------
const noTab = (s) => { if (/[\t\n]/.test(String(s))) throw new Error('tab/newline in field: ' + JSON.stringify(s)); return String(s); };
/** A TSV cell; an empty value is written as `-` (no trailing whitespace in the fixtures). */
const cell = (s) => { const v = noTab(s); return v === '' ? '-' : v; };
const pools = JSON.parse(gitShow('gra/data/city-names-pools.json'));
const allNames = [...new Set(Object.values(pools).flatMap((p) => Object.values(p).filter(Array.isArray).flat()).filter((s) => typeof s === 'string'))].sort();
const nonAscii = allNames.filter((s) => /[^\x00-\x7f]/.test(s));
const byLen = [...allNames].sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
const R5_NAMES = [byLen[0], 'Ateny', nonAscii[0], nonAscii[Math.floor(nonAscii.length / 2)], nonAscii[nonAscii.length - 1], byLen[byLen.length - 1]];
for (const n of R5_NAMES) if (!allNames.includes(n)) throw new Error('not a pool name: ' + n);

// Margin M around the border box: ceil(1.5·blur + |offset|) + 1 of the label's largest shadow
// (Gaussian σ = blur/2 reaches ~3σ) — the same rule is in labels::style.
const M = { R4: 26, R5: 19, R15: 10 };
const scenes = [];
const r4 = (name, icon, valid, reason, dsf = 1) => scenes.push({ name, group: 'R4', params: [icon, String(valid), reason], dsf, opacity: '' });
const iconList = [...new Set([...Object.values(r4Icons), R4_CITY.g[0], R4_FALLBACK.g[0]])];
iconList.forEach((ic, i) => r4(`r4_valid_${i.toString().padStart(2, '0')}`, ic, true, ''));
r4('r4_invalid_farm', r4Icons.farma, false, '');
r4('r4_invalid_city', R4_CITY.g[0], false, '');
r4('r4_invalid_fallback', R4_FALLBACK.g[0], false, '');
r4('r4_invalid_road_reason', r4Icons.droga, false, R4_REASON.g[0]);
r4('r4_valid_road_reason_ignored', r4Icons.droga, true, R4_REASON.g[0]); // reason shown only when invalid (:12951)
r4('r4_dsf2_valid', r4Icons.kopalnia_zelaza, true, '', 2);
r4('r4_dsf2_reason', r4Icons.droga, false, R4_REASON.g[0], 2);
R5_NAMES.forEach((n, i) => scenes.push({ name: `r5_${i}`, group: 'R5', params: [n], dsf: 1, opacity: '' }));
scenes.push({ name: 'r5_dsf2', group: 'R5', params: [R5_NAMES[1]], dsf: 2, opacity: '' });
for (const d of [1, 7, 23, 105]) scenes.push({ name: `r15a_${d}`, group: 'R15a', params: [String(d)], dsf: 1, opacity: '' });
scenes.push({ name: 'r15b_dmg_12', group: 'R15b', params: [r15bDmgText(12), R15B_DMG.g[1]], dsf: 1, opacity: '' });
scenes.push({ name: 'r15b_dmg_3', group: 'R15b', params: [r15bDmgText(3), R15B_DMG.g[1]], dsf: 1, opacity: '' });
scenes.push({ name: 'r15b_breach', group: 'R15b', params: [R15B_BREACH.g[0], R15B_BREACH.g[1]], dsf: 1, opacity: '' });
scenes.push({ name: 'r15a_dsf2', group: 'R15a', params: ['23'], dsf: 2, opacity: '' });

// ---------------------------------------------------------------------------
// Float labels: the web's _tickFloatLabels, verbatim, frame by frame (node; no DOM needed)
// ---------------------------------------------------------------------------
function camMap(tx, tz, dist, w, h, far) {
  // render/camera.ts:130-144 _syncCamera (elevation 52°, yaw 0) + scene.ts:3079-3085 (fov 50,
  // near 0.5) — the same construction as pick::camera::PickCamera (bit-exact, tests/pick_golden.rs).
  const cam = new THREE.PerspectiveCamera(50, w / h, 0.5, far);
  const el = 52 * THREE.MathUtils.DEG2RAD;
  const az = 0;
  cam.position.set(tx + dist * Math.cos(el) * Math.sin(az), 0 + dist * Math.sin(el), tz + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(tx, 0, tz);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
}
function camFree(w, h) {
  // an arbitrary second perspective camera (projection is generic over the matrices)
  const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
  cam.position.set(10.25, 31.5, 40.75);
  cam.lookAt(5, 0, 3);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
}
const CAMS = [
  { id: 'map', w: 1280, h: 720, cam: camMap(12.5, 9.75, 30, 1280, 720, 1200), params: [12.5, 9.75, 30, 1200] },
  { id: 'free', w: 1024, h: 768, cam: camFree(1024, 768), params: [] },
];
const matStr = (m) => m.elements.map(String).join(',');
const WORLD_PTS = [[12.5, 1.5, 9.75], [3.25, 0.8, -4.5], [20.125, 3.2, 15.5], [-7, 2.1, 30], [12.5, 120, 9.75], [12.5, 2, 60]];

let anchors = '# rows: cam<TAB>id<TAB>w<TAB>h<TAB>matrixWorld(16, column-major)<TAB>projectionMatrix(16)<TAB>params\n'
  + '# w2c<TAB>cam<TAB>x<TAB>y<TAB>z<TAB>rect(l,t,w,h)<TAB>result x<TAB>result y | null   (input/picker.ts worldToClientPx)\n'
  + '# siege<TAB>cam<TAB>x<TAB>y<TAB>z<TAB>display<TAB>left<TAB>top   (main.ts updateSiegeHtmlLabels, verbatim)\n'
  + '# w2s<TAB>cam<TAB>x<TAB>y<TAB>z<TAB>result x<TAB>result y | null   (battleScene.ts worldToScreen)\n'
  + '# r4place<TAB>pos.x<TAB>pos.y<TAB>left<TAB>top   (main.ts syncBuildGhostChipDom placement, verbatim)\n';
for (const c of CAMS) anchors += ['cam', c.id, c.w, c.h, matStr(c.cam.matrixWorld), matStr(c.cam.projectionMatrix), c.params.join(',')].map(cell).join('\t') + '\n';
const RECTS = [[0, 0, 1280, 720], [17, 33.5, 1280, 720]];
for (const c of CAMS) {
  for (const [x, y, z] of WORLD_PTS) {
    for (const rc of RECTS) {
      const canvas = { getBoundingClientRect: () => ({ left: rc[0], top: rc[1], width: c.w, height: c.h }) };
      const p = worldToClientPx(x, y, z, c.cam, canvas);
      anchors += ['w2c', c.id, x, y, z, [rc[0], rc[1], c.w, c.h].join(','), p ? p.x : 'null', p ? p.y : 'null'].map(cell).join('\t') + '\n';
      if (p) {
        const chip = { style: {} };
        r4Place(chip, p);
        anchors += ['r4place', p.x, p.y, chip.style.left, chip.style.top].map(cell).join('\t') + '\n';
      }
    }
    const lbl = { style: {} };
    r5Update([lbl], [{ x, y, z, name: 'X' }], { clientWidth: c.w, clientHeight: c.h }, { innerWidth: 0, innerHeight: 0 }, THREE, c.cam);
    anchors += ['siege', c.id, x, y, z, lbl.style.display, lbl.style.left ?? '', lbl.style.top ?? ''].map(cell).join('\t') + '\n';
    const s = worldToScreen(new THREE.Vector3(x, y, z), c.cam, { clientWidth: c.w, clientHeight: c.h });
    anchors += ['w2s', c.id, x, y, z, s ? s.x : 'null', s ? s.y : 'null'].map(cell).join('\t') + '\n';
  }
}

let float = '# frame<TAB>cam<TAB>label<TAB>world x,y,z<TAB>startTime<TAB>duration<TAB>riseRate<TAB>t<TAB>removed<TAB>left<TAB>top<TAB>opacity\n';
const FLOAT_T = [0, 1, 250, 499.5, 500, 1000, 1234.5, 1500, 1999, 1999.999, 2000, 2500];
const FLOAT_LABELS = [
  { id: 'r15a', world: [12.5, 1.95, 9.75], start: 1000, duration: Number(R15A_PUSH.g[0]), rise: Number(R15A_PUSH.g[1]) },
  { id: 'r15b', world: [20.125, Number(R15B_PUSH.g[1]), 15.5], start: 333.25, duration: Number(R15B_PUSH.g[0]), rise: Number(R15B_PUSH.g[2]) },
];
for (const c of CAMS) {
  for (const fl of FLOAT_LABELS) {
    for (const dt of FLOAT_T) {
      const t = fl.start + dt;
      const parent = { removed: false, removeChild() { this.removed = true; } };
      const elem = { style: {}, parentNode: parent };
      const self = { floatLabels: [{ elem, startTime: fl.start, duration: fl.duration, worldPos: new THREE.Vector3(...fl.world), riseRate: fl.rise }], camera: c.cam, canvas: { clientWidth: c.w, clientHeight: c.h } };
      tickFloatLabels.call(self, worldToScreen, t);
      const removed = self.floatLabels.length === 0;
      if (removed !== parent.removed) throw new Error('removal mismatch');
      float += ['frame', c.id, fl.id, fl.world.join(','), fl.start, fl.duration, fl.rise, t, String(removed), elem.style.left ?? '', elem.style.top ?? '', elem.style.opacity ?? ''].map(cell).join('\t') + '\n';
    }
  }
}
// Pixel frames of the fade (opacity exactly as _tickFloatLabels writes it at p = 0, 0.25, 0.5; at p = 1 the
// element is removed — asserted in float.tsv).
const opacityAt = (p) => String(1 - p * p); // battleScene.ts :8638 (checked against float.tsv rows below)
for (const [p, tag] of [[0, '000'], [0.25, '025'], [0.5, '050']]) {
  scenes.push({ name: `float_r15a_p${tag}`, group: 'R15a', params: ['23'], dsf: 1, opacity: opacityAt(p) });
  scenes.push({ name: `float_r15b_p${tag}`, group: 'R15b', params: [R15B_BREACH.g[0], R15B_BREACH.g[1]], dsf: 1, opacity: opacityAt(p) });
}
for (const r of float.split('\n')) {
  const f = r.split('\t');
  if (f[0] !== 'frame' || f[8] === 'true') continue;
  const p = Math.min(1, (Number(f[7]) - Number(f[4])) / Number(f[5]));
  if (f[11] !== opacityAt(p)) throw new Error('opacity formula drift: ' + r);
}

// ---------------------------------------------------------------------------
// Chromium
// ---------------------------------------------------------------------------
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not png');
  let i = 8; let w = 0; let h = 0; const idat = [];
  while (i < buf.length) {
    const len = buf.readUInt32BE(i); const type = buf.toString('ascii', i + 4, i + 8);
    const data = buf.subarray(i + 8, i + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error('png: need 8-bit RGBA non-interlaced');
    } else if (type === 'IDAT') idat.push(data);
    i += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(w * h * 4); const bpp = 4; const stride = w * 4;
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) { const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, data: out };
}

const faces = FACE_FILES.map(([fam, w, file]) => [fam, w, readFileSync(ASSETS + file).toString('base64')]);
const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const version = browser.version();
const pages = {};
for (const dsf of [1, 2]) {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: dsf });
  await page.setContent(`<!DOCTYPE html><html lang="pl"><head><style>${INDEX_STYLE.g[0]}</style><style>html, body { background: transparent !important; }</style></head><body></body></html>`);
  await page.evaluate(async ({ faces }) => {
    for (const [fam, w, b64] of faces) {
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const f = new FontFace(fam, bin, { weight: w });
      await f.load();
      document.fonts.add(f);
    }
  }, { faces });
  pages[dsf] = page;
}
/** Builds the label element in the page exactly as the web does (extracted code), maps families. */
const BUILD = `(${function build(sc, src) {
  /* eslint-disable no-new-func */
  const mapFamilyList = new Function('mapFamily', 'return ' + src.mapFamilyList)(new Function('return ' + src.mapFamily)());
  document.body.replaceChildren();
  document.getElementById('civ-build-ghost-chip')?.remove();
  let el;
  if (sc.group === 'R4') {
    el = document.createElement('div');
    el.id = 'civ-build-ghost-chip';
    el.style.cssText = src.r4Css;
    document.documentElement.appendChild(el);
    const [label, validS, reason] = sc.params;
    new Function('ghostChip', 'ghostChipValid', 'ghostChipReason', 'ghostChipLabel', src.r4Sync)(el, validS === 'true', reason, label);
    el.style.display = 'flex';
  } else if (sc.group === 'R5') {
    el = document.createElement('div');
    el.className = 'civ-siege-html-label';
    el.innerHTML = new Function('city', 'return ' + src.r5Html + ';')({ name: sc.params[0] });
    el.style.cssText = src.r5Css;
    document.body.appendChild(el);
  } else {
    // R15a / R15b — the battle overlay (battleScene.ts:2710-2720) is the parent: fixed, flex column.
    const ov = document.createElement('div');
    Object.assign(ov.style, src.overlayStyle);
    ov.style.background = 'transparent'; // the overlay backdrop is not part of the label
    document.body.appendChild(ov);
    el = document.createElement('div');
    if (sc.group === 'R15a') {
      el.textContent = new Function('dmg', 'return ' + src.r15aText + ';')(Number(sc.params[0]));
      Object.assign(el.style, src.r15aStyle);
    } else {
      el.textContent = sc.params[0];
      Object.assign(el.style, new Function('color', 'return (' + src.r15bStyle + ');')(sc.params[1]));
    }
    ov.appendChild(el);
  }
  el.style.fontFamily = mapFamilyList(getComputedStyle(el).fontFamily);
  return el;
}})`;
const OVERLAY = grab('battle/battleScene.ts', /this\.overlay = document\.createElement\('div'\);\s*Object\.assign\(this\.overlay\.style, (\{[\s\S]*?\})\);/, 'battle overlay');
consts.push(['battle_overlay_style', JSON.stringify(evalExpr(OVERLAY.g[0])), OVERLAY.where]);
const pageSrc = {
  mapFamilyList: mapFamilyList.toString(), mapFamily: mapFamily.toString(),
  r4Css, r4Sync: jsBody(R4_SYNC.g[0]), r5Html: js(R5_HTML.g[0]), r5Css,
  r15aText: R15A_TEXT.g[0], r15aStyle, r15bStyle: js('(' + R15B_STYLE.g[0] + ')'), overlayStyle: evalExpr(OVERLAY.g[0]),
};

rmSync(OUT + 'ref', { recursive: true, force: true });
mkdirSync(OUT + 'ref', { recursive: true });
let scenesTsv = '# scene<TAB>name<TAB>group<TAB>W<TAB>H<TAB>margin<TAB>dsf<TAB>opacity<TAB>params… (R4: icon, valid, reason; R5: city name; R15a: dmg; R15b: text, colour)\n';
let layoutTsv = '# box<TAB>scene<TAB>x<TAB>y<TAB>w<TAB>h  (border box, CSS px, relative to the margin origin)\n# text<TAB>scene<TAB>text<TAB>x<TAB>y<TAB>w<TAB>h  (one row per getClientRects() fragment)\n';
for (const sc of scenes) {
  const page = pages[sc.dsf];
  const margin = M[sc.group.startsWith('R15') ? 'R15' : sc.group];
  const lay = await page.evaluate(({ sc, src, margin, BUILD }) => {
    // eslint-disable-next-line no-eval
    const el = (0, eval)(BUILD)(sc, src);
    el.style.position = el.style.position || 'fixed';
    el.style.left = margin + 'px';
    el.style.top = margin + 'px';
    el.style.transform = 'none';
    if (sc.opacity !== '') el.style.opacity = sc.opacity;
    const r = el.getBoundingClientRect();
    const texts = [];
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) {
          const rg = document.createRange();
          rg.selectNodeContents(c);
          for (const q of rg.getClientRects()) texts.push([c.textContent, q.x - margin, q.y - margin, q.width, q.height]);
        } else walk(c);
      }
    };
    walk(el);
    return { box: [r.x - margin, r.y - margin, r.width, r.height], texts };
  }, { sc, src: pageSrc, margin, BUILD });
  const W = Math.ceil(lay.box[2]) + 2 * margin;
  const H = Math.ceil(lay.box[3]) + 2 * margin;
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H }, omitBackground: true });
  const img = decodePng(png);
  if (img.w !== W * sc.dsf || img.h !== H * sc.dsf) throw new Error(`screenshot size ${img.w}x${img.h} for ${sc.name}`);
  writeFileSync(OUT + `ref/${sc.name}.rgba`, img.data);
  scenesTsv += ['scene', sc.name, sc.group, W, H, margin, sc.dsf, sc.opacity, ...sc.params].map(cell).join('\t') + '\n';
  layoutTsv += ['box', sc.name, ...lay.box].map(cell).join('\t') + '\n';
  for (const t of lay.texts) layoutTsv += ['text', sc.name, ...t].map(cell).join('\t') + '\n';
}

// Layout-only sweep (no pixels): every city name of the pool in R5, R15a damage 0–300, R15b wall
// damage 0–120, R4 every icon × valid/invalid (+ reason).
const sweep = [];
for (const n of allNames) sweep.push({ group: 'R5', params: [n] });
for (let d = 0; d <= 300; d++) sweep.push({ group: 'R15a', params: [String(d)] });
for (let d = 0; d <= 120; d++) sweep.push({ group: 'R15b', params: [r15bDmgText(d), R15B_DMG.g[1]] });
for (const ic of iconList) for (const v of ['true', 'false']) sweep.push({ group: 'R4', params: [ic, v, v === 'false' && ic === r4Icons.droga ? R4_REASON.g[0] : ''] });
const sweepRows = await pages[1].evaluate(({ sweep, src, BUILD }) => sweep.map((sc) => {
  // eslint-disable-next-line no-eval
  const el = (0, eval)(BUILD)(sc, src);
  el.style.left = '0px'; el.style.top = '0px'; el.style.transform = 'none';
  const r = el.getBoundingClientRect();
  const texts = [];
  const walk = (n) => {
    for (const c of n.childNodes) {
      if (c.nodeType === 3) {
        const rg = document.createRange();
        rg.selectNodeContents(c);
        for (const q of rg.getClientRects()) texts.push([q.x, q.y, q.width, q.height]);
      } else walk(c);
    }
  };
  walk(el);
  return [r.width, r.height, texts];
}), { sweep, src: pageSrc, BUILD });
let sweepTsv = '# group<TAB>params (|-joined)<TAB>box w<TAB>box h<TAB>fragments x,y,w,h;…  (border box at 0,0)\n';
sweep.forEach((sc, i) => {
  const [w, h, t] = sweepRows[i];
  sweepTsv += [sc.group, sc.params.join('|'), w, h, t.map((q) => q.join(',')).join(';')].map(cell).join('\t') + '\n';
});
writeFileSync(OUT + 'sweep.tsv', sweepTsv);

// Chromium rect of each label positioned the web's way (left/top + the web's transform).
anchors += '# rect<TAB>group<TAB>param<TAB>left<TAB>top<TAB>x<TAB>y<TAB>w<TAB>h   (getBoundingClientRect with the web transform)\n';
const POS = [[100, 200], [333.25, 87.5], [640.0078125, 360.3333]];
for (const [group, params] of [['R4', [r4Icons.farma, 'true', '']], ['R4', [r4Icons.droga, 'false', R4_REASON.g[0]]], ['R5', ['Ateny']], ['R5', [R5_NAMES[5]]], ['R15a', ['23']], ['R15a', ['7']], ['R15b', [R15B_BREACH.g[0], R15B_BREACH.g[1]]]]) {
  for (const [lx, ty] of POS) {
    const sc = { group, params };
    const rect = await pages[1].evaluate(({ sc, src, BUILD, lx, ty, r4Place }) => {
      // eslint-disable-next-line no-eval
      const el = (0, eval)(BUILD)(sc, src);
      if (sc.group === 'R4') new Function('ghostChip', 'pos', r4Place)(el, { x: lx, y: ty });
      else if (sc.group === 'R5') { el.style.left = Math.round(lx) + 'px'; el.style.top = Math.round(ty) + 'px'; } // main.ts:14598-14599
      else { el.style.left = lx + 'px'; el.style.top = ty + 'px'; } // battleScene.ts:8636-8637
      const r = el.getBoundingClientRect();
      return [el.style.left, el.style.top, r.x, r.y, r.width, r.height];
    }, { sc, src: pageSrc, BUILD, lx, ty, r4Place: jsBody(R4_PLACE.g[0]) });
    anchors += ['rect', group, params[0], lx, ty, ...rect].map(cell).join('\t') + '\n';
  }
}
const ua = await pages[1].evaluate(() => navigator.userAgent);
await browser.close();

writeFileSync(OUT + 'scenes.tsv', scenesTsv);
writeFileSync(OUT + 'layout.tsv', layoutTsv);
writeFileSync(OUT + 'anchors.tsv', anchors);
writeFileSync(OUT + 'float.tsv', float);
writeFileSync(OUT + 'consts.tsv', '# key<TAB>value<TAB>web source (pin edb8fb56)\n' + consts.map((r) => r.map(cell).join('\t')).join('\n') + '\n');
writeFileSync(OUT + 'versions.txt', `node ${process.version}\nplaywright ${require('playwright/package.json').version}\nchromium ${version}\nthree ${THREE_VERSION}\nfont-render-hinting none\nuserAgent ${ua}\n`);

const files = ['gen.mjs', 'scenes.tsv', 'layout.tsv', 'sweep.tsv', 'anchors.tsv', 'float.tsv', 'consts.tsv', 'versions.txt',
  ...readdirSync(OUT + 'ref').sort().map((f) => 'ref/' + f)];
let man = '';
for (const f of files) man += createHash('sha256').update(readFileSync(OUT + f)).digest('hex') + '  ' + f + '\n';
for (const [, , file] of FACE_FILES) man += createHash('sha256').update(readFileSync(ASSETS + file)).digest('hex') + '  ../../../assets/' + file + '\n';
writeFileSync(OUT + 'MANIFEST.sha256', man);
console.log(`scenes=${scenes.length} chromium=${version} three=${THREE_VERSION}`);
