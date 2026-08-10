'use strict';
/**
 * chlopek-pole-warstwy-test.cjs — P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE.
 *
 * Ten sam obywatel (👤 na polu) jest rysowany przez DWIE niezależne warstwy:
 *   (1) mapa świata — `render/workerFieldOverlay.ts` (krążek w kolorze właściciela + obwódka),
 *   (2) nakładka okolicy przy otwartym panelu miasta — `render/cityOkolicaOverlay.ts`
 *       (odznaka nad etykietą plonów; wcześniej sztywna ciemna zieleń `rgba(30,80,30,0.88)`).
 * Do tego `openCityPanelForPlayer` w `main.ts` wołało `applyCityPanelWorldView(true, city)`
 * (a w niej `refreshWorkerFieldOverlay()`) PRZED `showCityPanel(...)`, więc bramka
 * `isCityPanelOpen()` widziała panel jako zamknięty i odbudowywała warstwę mapy świata tuż
 * przed otwarciem panelu — obie warstwy potrafiły być widoczne naraz.
 *
 * Test importuje RZECZYWISTE moduły renderu (esbuild, `three` jako external — jak
 * camera-zoom-block-test.cjs) i przechwytuje REALNE wywołania `arc`/`fill`/`stroke`/`fillText`
 * na atrapie kanwy (jak city-map-badge-test.cjs). Kolejność wywołań w `openCityPanelForPlayer`
 * sprawdzana jest na ŹRÓDLE `main.ts` — main.ts bootuje całą grę przy imporcie, więc nie da się
 * go załadować w node (ten sam powód, co w camera-zoom-block-test.cjs).
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.chlopek-pole-warstwy-entry.ts');
const BUNDLE = path.join(__dirname, '.chlopek-pole-warstwy-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  WORKER_OWNER_COLORS,
  workerOwnerColor,
  workerOwnerColorRgba,
  buildWorkerFieldOverlayGroup,
  disposeWorkerFieldSpriteCache,
} from '../src/render/workerFieldOverlay';
export { buildCityOkolicaOverlayGroup } from '../src/render/cityOkolicaOverlay';
export { TerenBazowy } from '../src/types/hex';
import * as THREE_NS from 'three';
export const THREE = THREE_NS;`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts' },
  external: ['three'],
  logLevel: 'silent',
});

// ── Atrapa kanwy: zapisuje realne wywołania rysujące W KOLEJNOŚCI, z wartościami stylu
// obowiązującymi W MOMENCIE wywołania (fillStyle/strokeStyle/lineWidth/font są mutowalne). ──
const canvases = [];
function makeStubCtx(canvas) {
  const st = { fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '' };
  let pendingArc = null;
  const ctx = {
    clearRect() {}, save() {}, restore() {}, beginPath() { pendingArc = null; },
    moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, clip() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    measureText: (s) => ({ width: String(s).length * 7 }),
    drawImage() {},
    arc(cx, cy, r) {
      pendingArc = { cx, cy, r };
      canvas.ops.push({ op: 'arc', cx, cy, r });
    },
    fill() {
      canvas.ops.push({ op: 'fill', fillStyle: st.fillStyle, arc: pendingArc });
    },
    stroke() {
      canvas.ops.push({ op: 'stroke', strokeStyle: st.strokeStyle, lineWidth: st.lineWidth, arc: pendingArc });
    },
    fillText(text, x, y) {
      canvas.ops.push({ op: 'fillText', text: String(text), x, y, font: st.font, fillStyle: st.fillStyle });
    },
  };
  for (const k of Object.keys(st)) {
    Object.defineProperty(ctx, k, { get: () => st[k], set: (v) => { st[k] = v; } });
  }
  return ctx;
}
function makeStubCanvas() {
  const c = { width: 300, height: 150, ops: [], _ctx: null, nodeName: 'CANVAS' };
  c.getContext = () => (c._ctx || (c._ctx = makeStubCtx(c)));
  canvases.push(c);
  return c;
}
global.document = { createElement: (tag) => (tag === 'canvas' ? makeStubCanvas() : {}) };
global.window = { devicePixelRatio: 1 };
global.self = global;

const M = require(BUNDLE);
const { TerenBazowy } = M;

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass++; console.log('PASS:', label); return; }
  fail++;
  console.error('FAIL:', label);
}

console.log('chlopek-pole-warstwy-test (P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE)\n');

// ── Mini-mapa 3×3 heksów łąki wokół (0,0) ──────────────────────────────────────────────
function makeMap() {
  const hexes = {};
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: TerenBazowy.Laka };
    }
  }
  return { szerokoscQ: 5, wysokoscR: 5, hexes, seed: 1, riverPaths: [] };
}
const map = makeMap();

// Pomocnicze: z listy operacji wyciągnij odznakę 👤 (glif + krążek pod nim).
function badgeFromOps(ops) {
  const glyph = ops.find((o) => o.op === 'fillText' && o.text === '👤');
  if (!glyph) return null;
  const fills = ops.filter((o) => o.op === 'fill' && o.arc);
  const disc = fills[fills.length - 1] || null; // krążek rysowany bezpośrednio przed glifem
  const strokes = ops.filter((o) => o.op === 'stroke' && o.arc);
  const fontPx = Number((/(\d+(?:\.\d+)?)px/.exec(glyph.font) || [])[1]);
  return { glyph, disc, strokes, fontPx };
}

// ── (A) Wzorzec: ikona 👤 na MAPIE ŚWIATA (znana jako czytelna — złoty krążek + obwódka) ──
const worldGroup = M.buildWorkerFieldOverlayGroup(map, new Map([['0,0', 0]]), 0);
ok('mapa świata: zbudowana grupa z jedną ikoną 👤', worldGroup.children.length === 1);
const worldBadge = badgeFromOps(canvases[canvases.length - 1].ops);
ok('mapa świata: odznaka narysowana (glif + krążek)', !!worldBadge && !!worldBadge.disc);
const WORLD_RATIO = worldBadge.fontPx / (worldBadge.disc.arc.r * 2);
ok(
  `mapa świata: stosunek glif/średnica = ${WORLD_RATIO.toFixed(3)} (wzorzec czytelności ≈ 0,73)`,
  WORLD_RATIO > 0.7 && WORLD_RATIO < 0.76,
);
const WORLD_PLAYER_RING = worldBadge.strokes.find((s) => s.strokeStyle === M.workerOwnerColorRgba(0, 1));
ok('mapa świata: obwódka gracza w kolorze właściciela', !!WORLD_PLAYER_RING);

// ── (B) Odznaka 👤 w NAKŁADCE OKOLICY — ten sam obywatel, ma być ten sam system koloru ──
function buildOkolica(ownerId) {
  const before = canvases.length;
  M.buildCityOkolicaOverlayGroup(map, {
    cityQ: 0,
    cityR: 0,
    range: 1,
    workedKeys: new Set(['1,0']),
    yieldOf: () => ({ zywnosc: 2, praca: 1 }),
    showYields: true,
    ownerId,
  });
  const made = canvases.slice(before);
  const withBadge = made.filter((c) => c.ops.some((o) => o.op === 'fillText' && o.text === '👤'));
  return { canvases: made, badgeCanvas: withBadge[0] || null, badgeCount: withBadge.length };
}

const okolicaP = buildOkolica(0);
ok('okolica: dokładnie jedna etykieta z odznaką 👤 (pole z obywatelem)', okolicaP.badgeCount === 1);
const badgeP = okolicaP.badgeCanvas ? badgeFromOps(okolicaP.badgeCanvas.ops) : null;
ok('okolica: odznaka narysowana (glif + krążek)', !!badgeP && !!badgeP.disc);

const GREEN_HARDCODED = 'rgba(30,80,30,0.88)';
ok(
  'okolica: krążek NIE jest już sztywną ciemną zielenią rgba(30,80,30,0.88)',
  !!badgeP && badgeP.disc.fillStyle !== GREEN_HARDCODED,
);
ok(
  `okolica: krążek w kolorze właściciela 0 z palety WORKER_OWNER_COLORS (${M.workerOwnerColorRgba(0, 0.72)})`,
  !!badgeP && badgeP.disc.fillStyle === M.workerOwnerColorRgba(0, 0.72),
);
ok(
  'okolica: obwódka gracza w kolorze właściciela (jak na mapie świata)',
  !!badgeP && badgeP.strokes.some(
    (s) => s.strokeStyle === M.workerOwnerColorRgba(0, 1) && Math.abs(s.lineWidth - 3.5) < 1e-9,
  ),
);
ok(
  'okolica: cieńszy ciemny rant na zewnątrz obwódki (kontrast na jasnym terenie)',
  !!badgeP && badgeP.strokes.some(
    (s) => s.strokeStyle === 'rgba(0,0,0,0.35)' && s.lineWidth === 1 &&
      s.arc.r > badgeP.disc.arc.r + 4,
  ),
);
ok(
  'okolica: obwódka rysowana NA ZEWNĄTRZ krążka (promień większy niż krążek)',
  // `strokes.length >= 2` jest tu konieczne: samo `every(...)` przechodzi PUSTO na kodzie
  // bez obwódki (brak stroke'ów = warunek spełniony), więc nic by nie chroniło.
  !!badgeP && badgeP.strokes.length >= 2 && badgeP.strokes.every((s) => s.arc.r > badgeP.disc.arc.r),
);

// Paleta realnie przewodzi ownerId — a nie jest zaszytą stałą „złoto".
const okolicaAi = buildOkolica(1);
const badgeAi = okolicaAi.badgeCanvas ? badgeFromOps(okolicaAi.badgeCanvas.ops) : null;
ok(
  `okolica: ownerId=1 daje kolor czerwony z palety (${M.workerOwnerColorRgba(1, 0.72)}), nie złoto`,
  !!badgeAi && badgeAi.disc.fillStyle === M.workerOwnerColorRgba(1, 0.72) &&
    badgeAi.disc.fillStyle !== badgeP.disc.fillStyle,
);
ok(
  'okolica: obwódka też idzie za ownerId (nie tylko wypełnienie)',
  !!badgeAi && badgeAi.strokes.some((s) => s.strokeStyle === M.workerOwnerColorRgba(1, 1)),
);
ok(
  'paleta: WORKER_OWNER_COLORS[0] = złoto gracza 0xffd54a, zawijanie modulo działa',
  M.WORKER_OWNER_COLORS[0] === 0xffd54a &&
    M.workerOwnerColor(8) === M.workerOwnerColor(0) &&
    M.WORKER_OWNER_COLORS.length === 8,
);

// ── (C) Nota Evaluatora #2 — asercja na KONKRETNY stosunek glif/średnica ────────────────
// Stara asercja („glif mieści się w krążku") była niedyskryminująca: spełniał ją i stary,
// i nowy kod. Tu przypinamy geometrię do PROPORCJI wzorca z mapy świata (≈0,73): stara
// odznaka okolicy miała 17 px glifu na krążku ø26 px = 0,654, więc wypada poza pasmo.
const OKOLICA_RATIO = badgeP ? badgeP.fontPx / (badgeP.disc.arc.r * 2) : NaN;
ok(
  `okolica: stosunek glif/średnica = ${OKOLICA_RATIO.toFixed(3)} mieści się w ±0,05 od wzorca mapy świata (${WORLD_RATIO.toFixed(3)})`,
  Math.abs(OKOLICA_RATIO - WORLD_RATIO) <= 0.05,
);
ok(
  'okolica: krążek nie jest mikroskopijny ani większy niż na mapie świata (parytet px→świat)',
  !!badgeP && badgeP.disc.arc.r >= worldBadge.disc.arc.r * 0.7 &&
    badgeP.disc.arc.r <= worldBadge.disc.arc.r,
);

// ── (D) Nota Evaluatora #1 — odznaka NIE MOŻE rozpychać etykiety plonów ────────────────
// Przed naprawą etykieta pola z 👤 (2 wiersze plonów) miała worldH ≈ 0,856. Większy krążek
// z obwódką potrafi przesunąć layout i urosnąć całą etykietę (~+11,5% w pierwszym podejściu).
const okolicaSprites = [];
{
  const group = M.buildCityOkolicaOverlayGroup(map, {
    cityQ: 0, cityR: 0, range: 1,
    workedKeys: new Set(['1,0']),
    yieldOf: () => ({ zywnosc: 2, praca: 1 }),
    showYields: true,
    ownerId: 0,
  });
  group.traverse((o) => {
    if (o.userData && typeof o.userData.labelWorldHeight === 'number') {
      okolicaSprites.push(o.userData.labelWorldHeight);
    }
  });
}
const workerLabelH = Math.max(...okolicaSprites);
ok(
  `etykieta plonów z 👤 zachowuje dotychczasową wysokość w świecie (worldH = ${workerLabelH.toFixed(4)}, wzorzec 0,8556)`,
  Math.abs(workerLabelH - 0.8556) < 0.002,
);

// ── (E) Kolejność wywołań w openCityPanelForPlayer (analiza źródła main.ts) ─────────────
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const fnStart = mainSrc.indexOf('function openCityPanelForPlayer(');
ok('main.ts: znaleziona funkcja openCityPanelForPlayer', fnStart >= 0);
const fnEnd = mainSrc.indexOf('\n    }', fnStart);
const fnBody = mainSrc.slice(fnStart, fnEnd);
const iShow = fnBody.indexOf('showCityPanel(city, map,');
const iApply = fnBody.indexOf('applyCityPanelWorldView(true, city)');
ok('main.ts: openCityPanelForPlayer woła showCityPanel i applyCityPanelWorldView(true, city)', iShow >= 0 && iApply >= 0);
ok(
  'main.ts: applyCityPanelWorldView(true, city) — a z nią refreshWorkerFieldOverlay() — idzie PO showCityPanel(...)',
  iShow >= 0 && iApply > iShow,
);
ok(
  'main.ts: applyCityPanelWorldView faktycznie odświeża warstwę 👤 mapy świata (bramka isCityPanelOpen)',
  /function applyCityPanelWorldView[\s\S]{0,2000}?refreshWorkerFieldOverlay\(\);/.test(mainSrc),
);
ok(
  'main.ts: refreshWorkerFieldOverlay wychodzi wcześniej przy otwartym panelu miasta',
  /function refreshWorkerFieldOverlay\(\): void \{[\s\S]{0,300}?isCityPanelOpen\(\)\) return;/.test(mainSrc),
);
ok(
  'main.ts: syncOkolicaOverlay przekazuje ownerId miasta (nie sztywne 0)',
  /syncCityOkolicaOverlay\([\s\S]{0,900}?ownerId: city\.ownerId/.test(mainSrc),
);

try { fs.unlinkSync(ENTRY); } catch (_e) { /* nieistotne */ }
try { fs.unlinkSync(BUNDLE); } catch (_e) { /* nieistotne */ }

console.log(`\nchlopek-pole-warstwy-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
