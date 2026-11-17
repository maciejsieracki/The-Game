// P4-1Q6-2 BUILD-HIGHLIGHT-PARITY (R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1): generator wektorow
// jednej warstwy podswietlenia mapy (`unitRenderer.setHighlight` / `clearHighlight`) i warstwy kopalni
// (`refreshMineEligibleOverlay`) przy zaznaczonej jednostce gracza i trybach budowy.
// Uruchomienie: node rust-port/engine/tests/p4_1q6_2_gen.mjs (Node >= 22.13, `stripTypeScriptTypes`).
// Wynik -> p4_1q6_2_vectors/vectors.json. Konsument: p4_1q6_2_build_highlight.rs.
//
// WYKONYWANY TEKST PINU 07d2fbd72 (bez wstawek w logice; straznik SHA-256 fragmentow):
//   `syncPlayerUnitSelectionOnMap` (gra/src/main.ts:7115-7135),
//   `clearMineEligibleOverlay` + `refreshMineEligibleOverlay` (gra/src/main.ts:15541-15564),
//   `refreshBuildHighlight` (gra/src/main.ts:16351-16396),
//   `filterBuildHighlightHexes` (gra/src/render/buildHighlight.ts:22-28),
//   `MINE_IMPROVEMENT_KEYS` + `isMineImprovementKey` (gra/src/map/improvement-build.ts:719-729).
// STUBY (stan UI i renderer, nie logika gry):
//   `unitRenderer.setHighlight(hexes, opacity)` = `render/units.ts:6524-6556`: `clearHighlight()`, pusty zbior ->
//     brak warstwy, inaczej warstwa = heksy w kolejnosci `Set` (+ krycie); `clearHighlight()` = `:6559-6568`;
//   `buildRangeOverlayGroup(map, keys, style)` -> zapis kluczy warstwy kopalni; `scene.add/remove` -> no-op;
//   `canFoundPlayerCityAt`, `isInStartReveal`, `qualifyingWonderHexesForPlayer`, `buildApi.getQualifyingHexes`,
//   `pendingImprovementsTurn.getUndoKeySet()` -> dane wektora; `reachableWithMergeTargets(u)` -> zasieg wektora
//   (zasieg sam w sobie testuje P4-1F5); `stackCanMove`/`isAwaitingFirstPlayerCity`/`isSiegeMapPanelOpen` ->
//   true/false/false (galaz `:7123-7125`).
// SEKWENCJA (decyzja Q6-2 adaptera, renderer/src/view/units.rs naglowek): jednostka zaznaczona -> `syncPlayer
//   UnitSelectionOnMap()`; jesli tryb budowy aktywny, potem `refreshBuildHighlight()` (wejscie w tryb budowy jest
//   pozniejszym, modalnym stanem; `refreshBuildHighlight` biegnie przy kazdej zmianie trybu, main.ts:26718-26793).
//   Bez trybu budowy (zwykly tryb ruchu) `refreshBuildHighlight` nie jest wolane po zaznaczeniu.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here }).toString().trim();

function pinFile(path) {
  return execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, maxBuffer: 1 << 28 }).toString();
}
function lines(text, from, to) {
  return text.split('\n').slice(from - 1, to).join('\n');
}

const main = pinFile('gra/src/main.ts');
const FRAG = {
  sync: lines(main, 7115, 7135),
  mine: lines(main, 15541, 15564),
  refresh: lines(main, 16351, 16396),
  filter: lines(pinFile('gra/src/render/buildHighlight.ts'), 22, 28),
  mineKeys: lines(pinFile('gra/src/map/improvement-build.ts'), 719, 729),
};
const startsWith = {
  sync: 'function syncPlayerUnitSelectionOnMap(): void {',
  mine: 'function clearMineEligibleOverlay(): void {',
  refresh: 'function refreshBuildHighlight(): void {',
  filter: 'export function filterBuildHighlightHexes(',
  mineKeys: 'export const MINE_IMPROVEMENT_KEYS',
};
for (const [k, s] of Object.entries(startsWith)) {
  if (!FRAG[k].trimStart().startsWith(s)) throw new Error(`fragment ${k} nie zaczyna sie od ${s}`);
}
const FRAG_SHA256 = createHash('sha256')
  .update(Object.keys(startsWith).map(k => FRAG[k]).join('\n\u0000\n'))
  .digest('hex');

const js = stripTypeScriptTypes(
  [
    'type ImprovementKey = string;',
    FRAG.mineKeys.replace(/export /g, ''),
    FRAG.filter.replace(/export /g, ''),
    FRAG.mine,
    FRAG.sync,
    FRAG.refresh,
  ].join('\n'),
);

// Kontekst wykonania: zmienne domkniecia `main.ts` jako parametry fabryki.
const factory = new Function(
  'env',
  `
  let { selectedId, units, foundCityMode, activeWonderId, buildModeOpen, activeImprovementKey, buildApi, map,
        mineEligibleGroup, reachable } = env.vars;
  const { unitRenderer, scene, keyOf, isMe, isSiegeMapPanelOpen, stackCanMove, isAwaitingFirstPlayerCity,
          reachableWithMergeTargets, plannedMarches, refreshPlannedMarchPreview, focusCameraOnUnit, refreshD1bHud,
          isInStartReveal, canFoundPlayerCityAt, qualifyingWonderHexesForPlayer, pendingImprovementsTurn,
          disposeRangeOverlayGroup, buildRangeOverlayGroup, MINE_ELIGIBLE_STYLE, MINE_BUILD_HIGHLIGHT_OPACITY,
          IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY } = env;
  ${js}
  return {
    syncPlayerUnitSelectionOnMap,
    refreshBuildHighlight,
    mineLayer: () => mineEligibleGroup,
  };
`,
);

function runCase(c) {
  const layer = { hexes: null, opacity: null };
  const unitRenderer = {
    setSelectionHex() {},
    clearHighlight() {
      layer.hexes = null;
      layer.opacity = null;
    },
    setHighlight(hexes, opacity = 'HIGHLIGHT_OPACITY') {
      this.clearHighlight();
      if (hexes.size === 0) return;
      layer.hexes = [...hexes];
      layer.opacity = opacity;
    },
  };
  const keyOf = (q, r) => `${q},${r}`;
  const set = arr => new Set(arr.map(([q, r]) => keyOf(q, r)));
  const canFound = set(c.canFound);
  const reveal = set(c.startReveal);
  const env = {
    vars: {
      selectedId: 900,
      units: [{ id: 900, q: 0, r: 0, ownerId: 1 }],
      foundCityMode: c.ui.foundCityMode,
      activeWonderId: c.ui.wonderActive ? 'piramidy' : null,
      buildModeOpen: c.ui.buildModeOpen,
      activeImprovementKey: c.ui.activeImprovementKey,
      buildApi: { getQualifyingHexes: () => c.qualifying.map(([q, r]) => ({ q, r })) },
      map: { hexes: Object.fromEntries(c.mapHexes.map(([q, r]) => [keyOf(q, r), { coords: { q, r } }])) },
      mineEligibleGroup: null,
      reachable: new Set(),
    },
    unitRenderer,
    scene: { add() {}, remove() {} },
    keyOf,
    isMe: owner => owner === 1,
    isSiegeMapPanelOpen: () => false,
    stackCanMove: () => true,
    isAwaitingFirstPlayerCity: () => false,
    reachableWithMergeTargets: () => set(c.reachable),
    plannedMarches: new Map(),
    refreshPlannedMarchPreview() {},
    focusCameraOnUnit() {},
    refreshD1bHud() {},
    isInStartReveal: (q, r) => reveal.has(keyOf(q, r)),
    canFoundPlayerCityAt: (q, r) => ({ ok: canFound.has(keyOf(q, r)) }),
    qualifyingWonderHexesForPlayer: () => c.wonderHexes.map(([q, r]) => ({ q, r })),
    pendingImprovementsTurn: { getUndoKeySet: () => new Set(c.undoKeys) },
    disposeRangeOverlayGroup() {},
    buildRangeOverlayGroup: (_map, keys) => ({ keys: [...keys] }),
    MINE_ELIGIBLE_STYLE: {},
    MINE_BUILD_HIGHLIGHT_OPACITY: 'MINE_BUILD_HIGHLIGHT_OPACITY',
    IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY: 'IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY',
  };
  const api = factory(env);
  api.syncPlayerUnitSelectionOnMap();
  if (c.buildModeActive) api.refreshBuildHighlight();
  const mine = api.mineLayer();
  const parse = k => k.split(',').map(Number);
  return {
    highlight: layer.hexes === null ? null : { hexes: layer.hexes.map(parse), opacity: layer.opacity },
    mineEligible: mine === null ? null : mine.keys.map(parse),
  };
}

const MAP = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
];
const REACH = [
  [1, 0],
  [2, 0],
  [3, 0],
];
const base = {
  mapHexes: MAP,
  startReveal: MAP,
  canFound: [],
  wonderHexes: [],
  qualifying: [],
  undoKeys: [],
  reachable: REACH,
};
const NO = { foundCityMode: false, wonderActive: false, buildModeOpen: false, activeImprovementKey: null };
const cases = [
  { name: 'ruch_bez_trybu_budowy', ui: NO, buildModeActive: false },
  { name: 'zalozenie_miasta_pusty', ui: { ...NO, foundCityMode: true }, buildModeActive: true },
  {
    name: 'zalozenie_miasta_poza_odkryciem',
    ui: { ...NO, foundCityMode: true },
    buildModeActive: true,
    canFound: [[2, 0]],
    startReveal: [[0, 0]],
  },
  {
    name: 'zalozenie_miasta_niepusty',
    ui: { ...NO, foundCityMode: true, buildModeOpen: true },
    buildModeActive: true,
    canFound: [
      [2, 0],
      [0, 0],
    ],
  },
  { name: 'cud_pusty', ui: { ...NO, wonderActive: true }, buildModeActive: true },
  {
    name: 'cud_niepusty',
    ui: { ...NO, wonderActive: true, buildModeOpen: true },
    buildModeActive: true,
    wonderHexes: [
      [3, 0],
      [3, 0],
      [1, 0],
    ],
  },
  {
    name: 'kopalnia_pusta',
    ui: { ...NO, buildModeOpen: true, activeImprovementKey: 'kopalnia_miedzi' },
    buildModeActive: true,
  },
  {
    name: 'kopalnia_niepusta',
    ui: { ...NO, buildModeOpen: true, activeImprovementKey: 'kopalnia_zelaza' },
    buildModeActive: true,
    qualifying: [
      [2, 0],
      [1, 0],
    ],
  },
  {
    name: 'kopalnia_cofniete_w_turze',
    ui: { ...NO, buildModeOpen: true, activeImprovementKey: 'kopalnia_zlota' },
    buildModeActive: true,
    qualifying: [[2, 0]],
    undoKeys: ['2,0:kopalnia_zlota'],
  },
  {
    name: 'ulepszenie_puste',
    ui: { ...NO, buildModeOpen: true, activeImprovementKey: 'farma' },
    buildModeActive: true,
  },
  {
    name: 'ulepszenie_cofniete_w_turze',
    ui: { ...NO, buildModeOpen: true, activeImprovementKey: 'farma' },
    buildModeActive: true,
    qualifying: [[1, 0]],
    undoKeys: ['1,0:farma', '2,0:kopalnia_zlota'],
  },
  {
    name: 'ulepszenie_niepuste',
    ui: { ...NO, buildModeOpen: true, activeImprovementKey: 'farma' },
    buildModeActive: true,
    qualifying: [
      [3, 0],
      [1, 0],
    ],
    undoKeys: ['1,0:kamieniolom'],
  },
].map(c => ({ ...base, ...c }));

const out = {
  pin: PIN,
  fragmentsSha256: FRAG_SHA256,
  vectors: cases.map(c => ({
    name: c.name,
    ui: c.ui,
    mapHexes: c.mapHexes,
    startReveal: c.startReveal,
    canFound: c.canFound,
    wonderHexes: c.wonderHexes,
    qualifying: c.qualifying,
    undoKeys: c.undoKeys,
    reachable: c.reachable,
    expected: runCase(c),
  })),
};
const outDir = join(here, 'p4_1q6_2_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`p4_1q6_2: ${out.vectors.length} wektorow, fragmenty SHA-256 ${FRAG_SHA256}`);
