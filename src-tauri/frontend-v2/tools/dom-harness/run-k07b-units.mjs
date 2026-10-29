#!/usr/bin/env node
/**
 * run-k07b-units.mjs — harness DOM: jednostki K07B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1, runda 3).
 *
 * Trzy sekcje:
 *   A. Równość zachowania (pin vs port): 23 bloki pinu (15 jednostek DOM + 8 bloków pomocniczych) — ciała z pinu
 *      `gra/src/ui/cityPanel.ts` (surowo, z `export`) kontra port `src/ui/cityPanel/k07b-p1.ts` / `k07b-p2.ts`.
 *      Zależności `dep(…)` po obu stronach = ten sam fixture (`makeFixture`), stałe pinu z `gra/src/game/*` (po stronie pinu).
 *      Porównanie: wynik, wyjątek, innerHTML punktu montażu, dziennik wywołań delegatów, stan przycisków po kliknięciu.
 *   B. Wiring kontrolera (`controller/k07bWiring.ts`): adapter CityRefDto→CityK07, wiernik `buildChipDeltaStockHtml`
 *      (porównanie z PRAWDZIWĄ funkcją pinu `gra/src/game/empire-hud-totals.ts`), mapper `K07aDeps`, pokrycie delegatów.
 *   C. Pokrycie delegatów: zbiór `dep('…')` w kodzie portu == `K07B_FN_NAMES` (statycznie, z plików).
 *
 * Wyjątki zamierzone (NIE są różnicami): `CityPanelUxMounts` to interfejs (brak runtime); K07B-Z3 stałe — po stronie pinu
 * importowane z `gra/src/game/cities.ts` i `population-growth-v85.ts`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k07b-units.mjs --pin-dir <PIN_DIR> [--v2-dir <katalog src/ui/cityPanel>]
 *   <PIN_DIR> = katalog poza repo z `git archive edb8fb56 gra/src gra/data`.
 * EXIT 0 <=> 0 różnic i wszystkie sekcje zielone; 1 <=> >=1 różnica/błąd asercji; 2 <=> błąd harnessu.
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { JSDOM } from 'jsdom';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k07b-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56> [--v2-dir <dir>]');
  process.exit(2);
}
const PIN = resolve(PIN_DIR);
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const V2_DIR = resolve(argOf('--v2-dir') ?? join(V2_ROOT, 'src/ui/cityPanel'));
const CTRL_DIR = resolve(V2_DIR, '../../controller');
const PIN_CITY_PANEL = join(PIN, 'gra/src/ui/cityPanel.ts');
const pinLines = readFileSync(PIN_CITY_PANEL, 'utf8').split('\n');

// ─── Bloki K07B (z markerów w kodzie portu: `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B` … `// pin-end`) ───────────

const BLOCKS = [];
for (const f of ['k07b-p1.ts', 'k07b-p2.ts']) {
  const lines = readFileSync(join(V2_DIR, f), 'utf8').split(/\r?\n/);
  for (let k = 0; k < lines.length; k++) {
    const m = /^\/\/ pin edb8fb56 gra\/src\/ui\/cityPanel\.ts:(\d+)-(\d+)$/.exec(lines[k]);
    if (!m) continue;
    const decl = lines.slice(k + 1).find((l) => /^export (function|const|interface) /.test(l));
    const name = /^export (?:function|const|interface) (\w+)/.exec(decl ?? '')?.[1];
    if (!name) throw new Error(`${f}:${k + 1}: brak deklaracji po markerze`);
    BLOCKS.push({ file: f, name, a: Number(m[1]), b: Number(m[2]), kind: /interface/.test(decl) ? 'interface' : 'runtime' });
  }
}
const UNIT_NAMES = [
  'renderSpoleczenstwo', 'renderZdrowie', 'renderKultura', 'renderProd', 'renderBuildSplitPanel', 'renderOkolica',
  'CityPanelUxMounts', 'renderCityHeaderCompact', 'appendOkolicaToolbarProfiles', 'appendBudowaToolbarProfiles',
  'appendBudowaListaBar', 'renderTopStatsBar', 'appendPanel', 'resolveDetailSideHint', 'appendSectionTitleWithDetails',
];
const HELPER_NAMES = ['okolicaProfileIconHtml', 'setOkolicaProfileButtonContent', 'setOkolicaProfileButtonIconOnly'];
const blockOf = (n) => {
  const b = BLOCKS.find((x) => x.name === n);
  if (!b) throw new Error(`brak bloku ${n}`);
  return b;
};
for (const n of [...UNIT_NAMES, ...HELPER_NAMES]) blockOf(n);

/** Tekst bloku pinu (surowy, z `export` przed pierwszą linią deklaracji). */
const pinText = (b) =>
  pinLines.slice(b.a - 1, b.b).join('\n').replace(/^(export )?(async )?(function|const|interface) /m, (_m, _e, as, kw) => `export ${as ?? ''}${kw} `);

// ─── Importy pomocnicze po stronie pinu: ten sam zestaw nazw co nagłówek portu (bez delegatów K07B i bloków) ─────────

/** Nagłówki importów portu (poza `./k07b-*`) → te same moduły po stronie pinu (czyste helpery v2 bez zmian). */
function portImports() {
  const out = [];
  for (const f of ['k07b-p1.ts', 'k07b-p2.ts']) {
    const src = readFileSync(join(V2_DIR, f), 'utf8');
    const re = /import\s+(?!type\b)\{([^}]*)\}\s+from\s+'(\.\/[^']+|\.\.\/[^']+)';/g;
    let m;
    while ((m = re.exec(src))) {
      const mod = m[2];
      if (mod.startsWith('./k07b-')) continue;
      const names = m[1].split(',').map((s) => s.trim()).filter((s) => s && !/^type\s/.test(s));
      if (names.length) out.push({ names, path: join(V2_DIR, mod) });
    }
  }
  return out;
}

// ─── Atrapa zależności (wspólna dla pinu i portu) ─────────────────────────────────────────────────────────────────────

const DEFAULT_ORDER = {
  porPct: 72, bandLabel: undefined, szPct: 55, szLines: [{ label: 'Świątynia', value: 2 }], szczescie: 9.4, szMax: 20,
  citizenUpkeep: { total: 1 }, prawPct: 40, prawLines: [{ label: 'Prawo', value: 1 }], porzadek: 9.4, prawMax: 25,
  szWkladPct: 30, prawWkladPct: 20, revoltWarning: false, revoltGraceRemaining: null, rebelState: null,
  postCaptureLawTurnsRemaining: null,
};

/** Dziennik + atrapy. `variant` steruje wartościami zwracanymi przez atrapy (brzegi dziedzin). */
function makeFixture(variant) {
  const log = [];
  const state = { activeMap: variant.activeMap ?? null };
  const canon = (x, d = 0) => {
    if (typeof x === 'function') return '<fn>';
    if (x && typeof x === 'object' && x.nodeType === 1) return `<el:${x.outerHTML}>`;
    if (typeof x === 'number' && !Number.isFinite(x)) return `#${String(x)}`;
    if (d > 4) return '<deep>';
    if (Array.isArray(x)) return x.map((v) => canon(v, d + 1));
    if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map((k) => [k, canon(x[k], d + 1)]));
    return x;
  };
  const el = (tag, cls, text) => {
    const e = globalThis.document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const order = variant.order ?? {};
  const specific = {
    el,
    tury: (n) => `tur${n}`,
    rangeName: (R) => `R${R}`,
    szLinesDoWyswietlenia: (lines) => lines,
    orderBandEffectShort: () => 'efekt',
    orderTierUi: (s) => (s.porPct >= 70 ? 0 : 1),
    resourceTextClass: (k) => `rc-${k}`,
    cityPanelChipIconWrap: (id, px) => `<chip ${id} ${px}>`,
    isCityUxFrameOpen: () => variant.frameOpen ?? false,
    resolveOrderState: () => ({ fromEngine: variant.fromEngine ?? true, state: { ...DEFAULT_ORDER, ...order } }),
    porPctBand: (p) => (p >= 70 ? 'high' : 'low'),
    postCaptureLawBannerLabel: () => variant.lawLabel,
    resolveCityHealth: () => variant.health ?? { total: 1, lines: [{ label: 'a', value: 3 }, { label: 'b', value: -2 }], fromEngine: true },
    loadOrderParams: () => ({ wagaSzczescie: 0.6, wagaPrawo: 0.4 }),
    cityLudnoscAbsolutna: (pop, epoch) => pop * 100 + epoch,
    growthGainPerTurnSlots: () => 2,
    resolveEmpireSnap: () => variant.empire ?? { civRate: 4, civStock: 90, kultura: 3 },
    cityPracaSplit: () => ({ total: 6, doBudynkow: 4, doPuli: 2, pctBudynki: 66 }),
    buildableProduction: () => variant.buildable ?? [],
    getProd: () => variant.prod ?? { kolejka: [], rekrutacja: [] },
    gameData: () => variant.data === undefined ? { buildings: [{ id: 'farma', nazwa: 'Farma', typ: 'budynek' }], units: [], societyParams: {} } : variant.data,
    activeMap: () => state.activeMap,
    formatWyzwienieLabel: (x) => `wyz${x}`,
    formatManpower: (x) => `mp${x}`,
    turnsUntilNextCitizen: () => 3,
    etaTurns: () => 4,
    rushCost: () => 12,
    productionCtxForCity: () => ({ ctx: 1 }),
    isMeCity: (o) => o === 1,
    dedupeBudowaLista: (l) => [...new Set(l)],
    defaultBudowaListaNazwa: () => 'Domyślna',
    sanitizeBudowaPriorytetTypow: (l) => l,
    frontItem: (c) => ({ kind: 'building', id: c?.id ?? 'x' }),
    renderSurowce: () => undefined,
    cancelQueueItem: () => undefined,
    attachInteractiveDetail: () => undefined,
    cityPanelTitle: (c) => `T:${c.name}`,
  };
  const fns = {};
  for (const n of K07B_FN_NAMES) {
    fns[n] = (...a) => {
      log.push([n, a.map((x) => canon(x))]);
      if (specific[n] !== undefined) return specific[n](...a);
      return undefined;
    };
  }
  const cfgMethods = {
    difficulty: variant.difficulty ?? 'normal',
    getCultureState: (id) => { log.push(['cfg.getCultureState', [id]]); return variant.culture; },
    getEmpireFoodTick: (o) => { log.push(['cfg.getEmpireFoodTick', [o]]); return variant.foodTick; },
    getMaxSafePoziomRacji: (id) => { log.push(['cfg.getMaxSafePoziomRacji', [id]]); return variant.maxRacja; },
    getBudowaState: (id) => { log.push(['cfg.getBudowaState', [id]]); return variant.budowa; },
    getCityWorkedRange: (id) => { log.push(['cfg.getCityWorkedRange', [id]]); return 2; },
    getEpoch: (o) => { log.push(['cfg.getEpoch', [o]]); return variant.epoch ?? 3; },
    getOkolicaState: (id) => { log.push(['cfg.getOkolicaState', [id]]); return variant.okolica; },
    getOrderState: (id) => { log.push(['cfg.getOrderState', [id]]); return undefined; },
    getTreasury: (o) => { log.push(['cfg.getTreasury', [o]]); return variant.treasury ?? 17; },
    getUnitsAt: (q, r) => { log.push(['cfg.getUnitsAt', [q, r]]); return variant.units ?? []; },
    getUnlockedTechs: () => { log.push(['cfg.getUnlockedTechs', []]); return []; },
    getWorkedTiles: (id) => { log.push(['cfg.getWorkedTiles', [id]]); return []; },
    onBudowaEnterManual: (...a) => { log.push(['cfg.onBudowaEnterManual', a.map((x) => canon(x))]); },
    onBudowaPriorytetChange: (...a) => { log.push(['cfg.onBudowaPriorytetChange', a.map((x) => canon(x))]); },
    onBudowaListaChange: (...a) => { log.push(['cfg.onBudowaListaChange', a.map((x) => canon(x))]); },
    onOkolicaFocusChange: (...a) => { log.push(['cfg.onOkolicaFocusChange', a.map((x) => canon(x))]); },
    onOkolicaEnterManual: (...a) => { log.push(['cfg.onOkolicaEnterManual', a.map((x) => canon(x))]); },
    onOkolicaRestoreAuto: (...a) => { log.push(['cfg.onOkolicaRestoreAuto', a.map((x) => canon(x))]); },
    onOkolicaTileAdjust: (...a) => { log.push(['cfg.onOkolicaTileAdjust', a.map((x) => canon(x))]); },
    onRushBuy: (...a) => { log.push(['cfg.onRushBuy', a.map((x) => canon(x))]); },
  };
  const values = {
    cfg: cfgMethods,
    POR_BAND_LABELS: { high: 'Wysoki', low: 'Niski' },
  };
  return { log, state, canon, fns, values, el };
}

// ─── Przypadki: argumenty budowane osobno dla pinu i portu (własne węzły DOM) ────────────────────────────────────────

const CITY = { id: 'c1', ownerId: 1, name: 'Alfa', population: 3, q: 0, r: 0, oblegane: false, produkcja: {}, budowa: [] };
const CITY0 = { id: 'c2', ownerId: 0, name: 'Beta', population: 12, q: 2, r: -1, oblegane: true };
const VIEW = {
  id: 'c1', zywnosc: 3, praca: 2, handel: 1, kultura: 2, kolejka: [], ludnosc: 3, tury: 2, przyrost: 1,
  poziomRacji: 2, zywnoscBrutto: 9.4, kosztRacji: 4, bilansLokalny: 5, wzrostUlamkowy: 0.4, atPopCap: false,
  growthBreakdown: { total: 12, racje: 3, bazowy: 9 },
};
const DATA = { buildings: { farma: { id: 'farma', nazwa: 'Farma' } }, units: [], societyParams: { ok: 1 } };

/** Przypadek: `make(side)` zwraca argumenty dla danej strony (świeży DOM), `variant` = atrapy. */
function buildCases() {
  const D = globalThis.document;
  const cases = [];
  const add = (unit, label, make, variant = {}, opts = {}) => cases.push({ unit, label, make, variant, opts });
  const mount = () => D.createElement('div');
  const btn = () => D.createElement('button');
  const shell = (...ids) => {
    const root = D.createElement('div');
    for (const id of ids) {
      const c = D.createElement('div');
      c.id = id;
      root.appendChild(c);
    }
    return root;
  };

  add('renderSpoleczenstwo', 'domyslny', () => [mount(), CITY, DATA], {}, { click: true });
  add('renderSpoleczenstwo', 'granica-porzadku-70', () => [mount(), CITY, DATA], { order: { porPct: 70 } });
  add('renderSpoleczenstwo', 'granica-garnizonu-3', () => [mount(), CITY, DATA], { units: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });
  add('renderSpoleczenstwo', 'bunt', () => [mount(), CITY, DATA], { order: { revoltWarning: true, revoltGraceRemaining: 2, porPct: 40 } });
  add('renderSpoleczenstwo', 'prawo-po-podboju', () => [mount(), CITY0, DATA], { order: { postCaptureLawTurnsRemaining: 3, rebelState: null }, lawLabel: 'Prawo: podbój', units: [{ id: 'u' }] });
  add('renderSpoleczenstwo', 'rebelia-bez-szczescia', () => [mount(), CITY, DATA], { fromEngine: false, order: { rebelState: { x: 1 }, szMax: null, prawMax: null, szWkladPct: undefined, bandLabel: 'Ostrzeżenie' } });

  add('renderZdrowie', 'silnik', () => [mount(), CITY, DATA, DATA], {});
  add('renderZdrowie', 'brak-linii-pustych', () => [mount(), CITY, DATA, DATA], { health: { total: 0, lines: [], fromEngine: false } });
  add('renderZdrowie', 'granica-zdrowia-5', () => [mount(), CITY, DATA, DATA], { health: { total: 5, lines: [{ label: 'x', value: 5 }], fromEngine: true } });
  add('renderZdrowie', 'dodatnie-ujemne', () => [mount(), CITY0, DATA, DATA], { health: { total: -4, lines: [{ label: 'x', value: -4 }, { label: 'y', value: 0 }], fromEngine: true } });

  const culture = { thresholds: [10, 20, 30], kulturaMix: [{ label: 'A', pct: 100, isOwner: true }, { label: 'B', pct: 40, isOwner: false }], zrodla: [{ nazwa: 'Świątynia', wartosc: 2 }], kulturaSuma: 12, przyrost: 3, borderRadius: 2 };
  add('renderKultura', 'stan-kultury-z-widokiem', () => [mount(), CITY, VIEW], { culture, empire: { civRate: 1, civStock: 5 } }, { click: true });
  add('renderKultura', 'bez-widoku-i-stanu', () => [mount(), CITY, null], { culture: undefined });
  add('renderKultura', 'widok-bez-stanu-kultura-0', () => [mount(), CITY, { ...VIEW, kultura: 0 }], { culture: undefined });
  add('renderKultura', 'widok-bez-stanu-kultura-5', () => [mount(), CITY0, { ...VIEW, kultura: 5 }], { culture: undefined });
  add('renderKultura', 'ponad-ostatni-prog', () => [mount(), CITY, null], { culture: { ...culture, kulturaSuma: 35, przyrost: 0, kulturaMix: [] } });
  add('renderKultura', 'przyrost-zero-z-progiem', () => [mount(), CITY, null], { culture: { ...culture, przyrost: 0, kulturaSuma: 12 } });
  add('renderKultura', 'brzeg-prog-rowny', () => [mount(), CITY, VIEW], { culture: { ...culture, kulturaSuma: 20, przyrost: 5, zrodla: undefined } });

  add('renderProd', 'pusta-kolejka', () => [mount(), CITY, VIEW], {});
  add('renderProd', 'z-kolejka', () => [mount(), CITY, null], { prod: { kolejka: [{ kind: 'building', id: 'farma', koszt: 10, postep: 4 }], rekrutacja: [] }, buildable: [{ kind: 'building', id: 'farma', koszt: 10 }] });

  add('renderBuildSplitPanel', 'z-danymi', () => [mount(), CITY, DATA, VIEW], {});
  add('renderBuildSplitPanel', 'bez-danych', () => [mount(), CITY, null, null], { data: null });

  add('renderOkolica', 'pusty-korzen', () => [shell('cs-okstats', 'cs-okolica'), CITY, { hexes: {} }], {});
  add('renderOkolica', 'bez-kontenerow', () => [D.createElement('div'), CITY, { hexes: {} }], {});

  add('renderCityHeaderCompact', 'z-widokiem', () => [mount(), CITY, VIEW], {});
  add('renderCityHeaderCompact', 'limit-populacji', () => [mount(), CITY, { ...VIEW, atPopCap: true }], {});
  add('renderCityHeaderCompact', 'wyzywienie-6-domyslny-max', () => [mount(), CITY, { ...VIEW, poziomRacji: 6 }], {});
  add('renderCityHeaderCompact', 'wyzywienie-ponad-max-bezpieczny', () => [mount(), CITY, { ...VIEW, poziomRacji: 3 }], { maxRacja: 1 });
  add('renderCityHeaderCompact', 'bez-widoku-epoka-1', () => [mount(), CITY0, null], { epoch: 1 });

  const okFocus = ['zywnosc', 'produkcja'];
  add('appendOkolicaToolbarProfiles', 'auto-zywnosc', () => [mount(), CITY, 'zywnosc', 'auto'], {}, { click: true });
  add('appendOkolicaToolbarProfiles', 'reczny-produkcja', () => [mount(), CITY, 'produkcja', 'reczny'], {}, { click: true });
  void okFocus;
  add('appendBudowaToolbarProfiles', 'tryb-auto', () => [mount(), CITY, ['wzrost', 'produkcja'], 'auto', ['A']], {}, { click: true });
  add('appendBudowaToolbarProfiles', 'tryb-reczny-pusta-lista', () => [mount(), CITY, [], 'reczny', []], {}, { click: true });
  add('appendBudowaListaBar', 'z-biblioteka', () => [mount(), CITY, ['A', 'B'], [{ nazwa: 'A', typy: [] }]], {}, { click: true });
  add('appendBudowaListaBar', 'bez-biblioteki', () => [mount(), CITY0, [], undefined], {}, { click: true });
  add('renderTopStatsBar', 'z-widokiem', () => [mount(), CITY, VIEW], { treasury: 17 });
  add('renderTopStatsBar', 'bez-widoku', () => [mount(), CITY0, null], { treasury: 0 });
  add('appendPanel', 'z-id', () => [mount(), 'panel-x'], {});
  add('appendPanel', 'bez-id', () => [mount(), undefined], {});
  add('resolveDetailSideHint', 'lewa-kolumna', () => { const r = D.createElement('div'); r.className = 'civ-ux-left'; const c = D.createElement('div'); r.appendChild(c); return [c]; }, {});
  add('resolveDetailSideHint', 'prawa-kolumna', () => { const r = D.createElement('div'); r.className = 'civ-ux-right'; const c = D.createElement('div'); r.appendChild(c); return [c]; }, {});
  add('resolveDetailSideHint', 'brak-kolumny', () => [mount()], {});
  add('appendSectionTitleWithDetails', 'tytul-z-karta', () => [mount(), '<span>Tytuł</span>', () => D.createElement('section')], {});

  add('okolicaProfileIconHtml', 'domyslny-rozmiar', () => ['zywnosc'], {});
  add('setOkolicaProfileButtonContent', 'z-etykieta', () => [btn(), 'produkcja', 'Produkcja'], {});
  add('setOkolicaProfileButtonIconOnly', 'domyslny-rozmiar', () => [btn(), 'podatki'], {});
  return cases;
}

// ─── Pin: bundle (bloki surowe + atrapy + stałe z gra/src/game) ───────────────────────────────────────────────────────

let K07B_FN_NAMES = [];
let K07B_VALUE_NAMES = [];

function pinPrelude(importsFromPort) {
  // activeMap = zmienna modułu pinu (let), nie forwarder (K07B-Z4).
  const fnNames = K07B_FN_NAMES.filter((n) => n !== 'activeMap' && !importsFromPort.has(n));
  const fwd = fnNames.map((n) => `const ${n} = (...a) => globalThis.__K07B_FIX.fns[${JSON.stringify(n)}](...a);`).join('\n');
  return `
const __F = () => globalThis.__K07B_FIX;
let activeMap = null;
const cfg = new Proxy({}, { get: (_t, k) => __F().values.cfg[k] });
const POR_BAND_LABELS = new Proxy({}, { get: (_t, k) => __F().values.POR_BAND_LABELS[k] });
const WYZYWIENIE_MAX_PIN = WYZYWIENIE_MAX;
${fwd}
export const __setActive = (m) => { activeMap = m; };
`;
}

/** Stub portu reguł K01B (deterministyczny; nie jest regułą gry — harness porównuje wiring, nie formuły). */
function makeRulesFixture() {
  return {
    etaTurns: (k, p, pr) => Math.ceil((k - p) / Math.max(1, pr)),
    buildingEffectAtLevel: (b, p, l) => b + p * l,
    stockResourceLabel: (k) => `L:${k}`,
    buildingUpkeep: (_d, l) => 1 + l,
    buildingResourceUpkeep: () => ({}),
    addResourceCosts: (t, a) => { for (const k of Object.keys(a)) t[k] = (t[k] ?? 0) + a[k]; },
    mnoznikRoleForBuildingId: () => null,
    cumulativeMnoznikForBuildingId: () => 1,
    buildingStructuralDefenseBonusPercent: () => null,
    rationGrowthPercent: (l) => 10 * (l ?? 0),
    rationFoodCostPerPop: (l) => 2 + (l ?? 0),
    growthGainPerTurnSlots: () => 2,
    turnsUntilNextCitizen: () => 3,
  };
}

// ─── Port: wiring delegatów (`setK07bDeps`) z tej samej atrapy ───────────────────────────────────────────────────────

function wirePort(V, F) {
  const deps = {};
  for (const n of K07B_FN_NAMES) deps[n] = F.fns[n];
  for (const n of K07B_VALUE_NAMES) deps[n] = F.values[n];
  // K07B-Z4: `activeMap` to funkcja zwracająca mapę (port wywołuje `activeMapK07()`).
  deps.activeMap = () => F.state.activeMap;
  V.setK07bDeps(deps);
}

// ─── Uruchomienie ────────────────────────────────────────────────────────────────────────────────────────────────────

const tmp = mkdtempSync(join(tmpdir(), 'p58k07b-harness-'));

/** Katalog statyczny (uiParams z pinu gra/data/ui-params.json) — instalowany PRZED importem modułów v2 (P5.2-Z1). */
const PIN_UI_PARAMS = JSON.parse(readFileSync(join(PIN, 'gra/data/ui-params.json'), 'utf8'));
function preText() {
  return `import { installStaticCatalog } from ${JSON.stringify(join(CTRL_DIR, 'staticCatalog.ts'))};\ninstallStaticCatalog({ uiParams: ${JSON.stringify(PIN_UI_PARAMS)} } as any);\n`;
}
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
let exitCode = 0;
let comparisons = 0;
let diffs = 0;
let wiringFails = 0;
let errCases = 0;
const errList = [];
let logEntries = 0;
let htmlCases = 0;
const report = [];
const notes = [];

/** Wtyczka esbuild: importy `*.svg?raw` (ikony v2) jako tekst — tak jak w buildzie Vite. */
const rawPlugin = {
  name: 'raw-text',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (a) => ({ path: resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw-text' }));
    build.onLoad({ filter: /.*/, namespace: 'raw-text' }, (a) => ({ contents: readFileSync(a.path, 'utf8'), loader: 'text' }));
  },
};

/** Atrapa `icons/brandAssets` (import.meta.glob = konstrukcja Vite); identyczna po obu stronach (jak w run-k07a-units). */
const brandStub = {
  name: 'brand-stub',
  setup(b) {
    b.onResolve({ filter: /icons\/brandAssets$/ }, (a) => ({ path: a.path, namespace: 'bstub' }));
    b.onLoad({ filter: /.*/, namespace: 'bstub' }, () => ({
      contents: [
        `export function brandIconSvg(id, size) { return '<svg data-brand="' + id + '" data-size="' + size + '"></svg>'; }`,
        `export function mapResourceIconSvg(key, size) { return '<svg data-map="' + key + '" data-size="' + size + '"></svg>'; }`,
        `export function buildingIconSvg(def, id) { return '<svg data-building="' + id + '"></svg>'; }`,
        `export function unitIconSvg(u, id) { return '<svg data-unit="' + id + '"></svg>'; }`,
        '',
      ].join('\n'),
      loader: 'js',
    }));
  },
};

const bundle = async (entryText, name) => {
  const file = join(tmp, `${name}.ts`);
  writeFileSync(file, entryText);
  const out = join(tmp, `${name}.mjs`);
  await esbuild.build({ entryPoints: [file], outfile: out, bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error', plugins: [rawPlugin, brandStub] });
  return out;
};

try {
  // Port (ładowany najpierw, żeby znać listy nazw).
  const v2Pre = join(tmp, 'v2-pre.ts');
  writeFileSync(v2Pre, preText());
  const v2Entry = join(tmp, 'v2-entry.ts');
  writeFileSync(
    v2Entry,
    [
      `import ${JSON.stringify(v2Pre)};`,
      `export * from ${JSON.stringify(join(V2_DIR, 'k07b-p1.ts'))};`,
      `export * from ${JSON.stringify(join(V2_DIR, 'k07b-p2.ts'))};`,
      `export * from ${JSON.stringify(join(V2_DIR, 'k07b-deps.ts'))};`,
      `export * from ${JSON.stringify(join(CTRL_DIR, 'k07bWiring.ts'))};`,
      `export { tury as __tury } from ${JSON.stringify(join(V2_DIR, 'k01a-fundament.ts'))};\nexport { ustawRegulyKontrolera } from ${JSON.stringify(join(V2_DIR, 'k01b-reguly.ts'))};`,
      `export * from ${JSON.stringify(join(V2_DIR, 'k07a-fundament.ts'))};`,
      '',
    ].join('\n'),
  );
  const v2Bundle = await bundle(readFileSync(v2Entry, 'utf8'), 'v2');
  const V = await import(pathToFileURL(v2Bundle).href);
  K07B_FN_NAMES = [...V.K07B_FN_NAMES];
  K07B_VALUE_NAMES = [...V.K07B_VALUE_NAMES];
  // Port reguł K01B (wstrzykiwany przez kontroler, K01B-Z3) — identyczny stub po obu stronach (w obu bundlach).
  const RULES = makeRulesFixture();
  V.ustawRegulyKontrolera(RULES);

  // Importy pomocnicze (te same moduły co port) — po stronie pinu.
  const imports = portImports();
  const importedNames = new Set(imports.flatMap((i) => i.names));
  const importLines = imports.map((i) => `import { ${i.names.join(', ')} } from ${JSON.stringify(i.path)};`).join('\n');
  const pinBlocks = BLOCKS.filter((b) => b.kind === 'runtime' || b.kind === 'interface').map((b) => pinText(b)).join('\n\n');
  const pinEntry = [
    `import ${JSON.stringify(v2Pre)};`,
    importLines,
    `import { BUDOWA_TYP_FOCUS, DEFAULT_BUDOWA_PRIORYTET_TYPOW } from ${JSON.stringify(join(PIN, 'gra/src/game/cities.ts'))};`,
    `import { WYZYWIENIE_MAX } from ${JSON.stringify(join(PIN, 'gra/src/game/population-growth-v85.ts'))};`,
    `import { ustawRegulyKontrolera as __pinRules } from ${JSON.stringify(join(V2_DIR, 'k01b-reguly.ts'))};\nexport const __installRules = (p) => __pinRules(p);`,
    pinPrelude(importedNames),
    pinBlocks,
    '',
  ].join('\n');
  const pinBundle = await bundle(pinEntry, 'pin');
  const P = await import(pathToFileURL(pinBundle).href);
  P.__installRules(RULES);

  // Prawdziwe buildChipDeltaStockHtml (pin, DOM-free).
  const hudBundle = await bundle(`export { buildChipDeltaStockHtml } from ${JSON.stringify(join(PIN, 'gra/src/game/empire-hud-totals.ts'))};\n`, 'hud');
  const HUD = await import(pathToFileURL(hudBundle).href);

  // ── A. Równość zachowania ──────────────────────────────────────────────────────────────────────────────────────────
  const unitSummary = new Map();
  for (const c of buildCases()) {
    const results = {};
    for (const side of ['pin', 'v2']) {
      const F = makeFixture(c.variant);
      globalThis.__K07B_FIX = F;
      const mod = side === 'pin' ? P : V;
      if (side === 'pin') {
        mod.__setActive(F.state.activeMap);
      } else {
        wirePort(V, F);
      }
      const argv = c.make();
      let ret;
      let err = null;
      try {
        ret = mod[c.unit](...argv);
      } catch (e) {
        err = String(e && e.message ? e.message : e);
      }
      if (c.opts.click) {
        // Klik we wszystkie przyciski punktu montażu (atrapy cfg.onX logują się do dziennika).
        const host = argv.find((x) => x && x.nodeType === 1 && x.tagName !== 'BUTTON') ?? argv[0];
        if (host && host.querySelectorAll) for (const b of [...host.querySelectorAll('button')]) b.click();
      }
      results[side] = {
        ret: F.canon(ret),
        err,
        html: argv.find((x) => x && x.nodeType === 1)?.outerHTML ?? null,
        log: F.log.map((e) => [e[0], e[1]]),
      };
    }
    comparisons++;
    if (results.pin.err || results.v2.err) { errCases++; errList.push(`${c.unit} [${c.label}]: ${results.pin.err ?? results.v2.err}`.slice(0, 200)); }
    logEntries += results.pin.log.length;
    if (results.pin.html) htmlCases++;
    const key = c.unit;
    const row = unitSummary.get(key) ?? { cases: 0, diffs: 0 };
    row.cases++;
    if (JSON.stringify(results.pin) !== JSON.stringify(results.v2)) {
      diffs++;
      row.diffs++;
      report.push({ unit: c.unit, label: c.label, pin: results.pin, v2: results.v2 });
    }
    unitSummary.set(key, row);
  }

  // Typ (interfejs): brak runtime — tylko odnotowanie.
  notes.push('CityPanelUxMounts: interfejs (brak runtime) — sprawdzany przez tsc');

  // ── B. Wiring kontrolera ───────────────────────────────────────────────────────────────────────────────────────────
  const check = (name, ok, extra = '') => {
    comparisons++;
    if (!ok) {
      wiringFails++;
      report.push({ unit: `wiring:${name}`, extra });
    }
  };
  // B1. Adapter DTO → CityK07 (wartości z DTO, literał oczekiwany — nie wynik kodu).
  const dto = { id: 7, owner: 2, q: 1, r: -1, name: 'Gamma', mapLabel: 'G', population: 4, isCapital: true, isMine: false };
  const mapped = V.mapCityK07(dto);
  check('mapCityK07', JSON.stringify(mapped) === JSON.stringify({ id: '7', ownerId: 2, name: 'Gamma', population: 4 }), JSON.stringify(mapped));
  // B2. Wiernik buildChipDeltaStockHtml vs prawdziwa funkcja pinu (siatka wartości brzegowych).
  const grid = [undefined, 0, 1, -1, 0.4, -0.4, 0.5, -0.5, 2.5, -2.5, 1e9, -0, NaN, Infinity, -Infinity];
  let chipBad = 0;
  for (const r of grid) for (const s of grid) {
    const a = HUD.buildChipDeltaStockHtml(r, s);
    const b = V.chipDeltaStockHtmlK07(r, s);
    comparisons++;
    if (a !== b) {
      chipBad++;
      report.push({ unit: 'wiring:chipDeltaStockHtml', extra: `r=${r} s=${s} pin=${a} v2=${b}` });
    }
  }
  check('chipDeltaStockHtml-siatka', chipBad === 0, `niezgodnych=${chipBad}`);
  // B3. Mapper K07aDeps: fallback isMe (pin `?? ownerId===0`), capital null, miasta z DTO.
  const k07a = V.mapK07aDeps({
    getCities: () => [dto],
    getCapitalCityId: () => undefined,
    canSetCapital: true,
    cfg: {},
    gameData: () => null,
    activeMap: () => null,
  });
  check('mapK07aDeps-isMe-fallback', k07a.isMe(0) === true && k07a.isMe(1) === false);
  check('mapK07aDeps-capital-null', k07a.getCapitalCityId(3) === null);
  check('mapK07aDeps-cities', JSON.stringify(k07a.getCities()) === JSON.stringify([{ id: '7', ownerId: 2, name: 'Gamma', population: 4 }]));
  check('mapK07aDeps-chip', k07a.chipDeltaStockHtml(2, 3) === HUD.buildChipDeltaStockHtml(2, 3));
  check('mapK07aDeps-canSetCapital', k07a.canSetCapital === true && V.mapK07aDeps({ getCities: () => [], getCapitalCityId: () => null, canSetCapital: false, cfg: {}, gameData: () => null, activeMap: () => null }).canSetCapital === false);
  // B4. Pokrycie delegatów: installK07bWiring z atrapami nie zostawia brakujących nazw.
  const inst = V.installK07bWiring({
    getCities: () => [],
    getCapitalCityId: () => null,
    canSetCapital: false,
    cfg: {},
    gameData: () => null,
    activeMap: () => null,
  });
  check('installK07bWiring-missing', inst.missing.length === 0, inst.missing.join(','));
  // B5. Wartości z kontrolera trafiają do portu (cfg + POR_BAND_LABELS), bez wyjątku dep().
  const probe = V.installK07bWiring({
    getCities: () => [],
    getCapitalCityId: () => null,
    canSetCapital: false,
    cfg: { getEpoch: () => 9 },
    gameData: () => ({ buildings: {} }),
    activeMap: () => ({ tag: 'M' }),
    porBandLabels: { high: 'X' },
  });
  check('installK07bWiring-probe', probe.missing.length === 0);
  // B5b. Przepływ wartości z kontrolera (cfg, POR_BAND_LABELS, gameData, activeMap) — bez przeliczeń po drodze.
  const cfgProxy = V.valueProxy('cfg');
  check('wiring-cfg-getEpoch', cfgProxy.getEpoch(1) === 9);
  check('wiring-cfg-mock-fallback', typeof cfgProxy.getTreasury === 'function' && cfgProxy.getTreasury(1) === 0);
  check('wiring-por-labels', V.valueProxy('POR_BAND_LABELS').high === 'X');
  check('wiring-gameData', JSON.stringify(V.dep('gameData')()) === JSON.stringify({ buildings: {} }));
  check('wiring-activeMap', JSON.stringify(V.dep('activeMap')()) === JSON.stringify({ tag: 'M' }));
  // B6. Precedencja: usługi wstrzyknięte nadpisują realne implementacje v2; bez usług — realna implementacja.
  const base = { getCities: () => [], getCapitalCityId: () => null, canSetCapital: false, cfg: {}, gameData: () => null, activeMap: () => null };
  V.installK07bWiring(base, { tury: () => 'SRV' });
  check('installK07bWiring-services-first', V.dep('tury')(1) === 'SRV');
  V.installK07bWiring(base);
  check('installK07bWiring-v2-real-tury', V.dep('tury')(1) === V.__tury(1));
  check('installK07bWiring-v2-real-el', V.dep('el')('span', 'x').tagName === 'SPAN');

  // ── D. Smoke produkcyjnego wiringu: każda jednostka po installK07bWiring z DOMYŚLNYMI atrapami (bez usług) ──────────
  // Cel: wywołanie jednostki na atrapach nie rzuca (brak `TypeError` z wartości `undefined` atrapy). Argumenty = te same
  // przypadki co w sekcji A; delegaty = wyłącznie `installK07bWiring(base)` (bez `wirePort`).
  {
    V.installK07bWiring({ getCities: () => [], getCapitalCityId: () => null, canSetCapital: false, cfg: {}, gameData: () => null, activeMap: () => null });
    const smokeErr = [];
    for (const c of buildCases()) {
      const F = makeFixture(c.variant);
      globalThis.__K07B_FIX = F;
      let err = null;
      try {
        V[c.unit](...c.make());
      } catch (e) {
        err = String(e && e.message ? e.message : e);
      }
      comparisons++;
      if (err) smokeErr.push(`${c.unit} [${c.label}]: ${err}`.slice(0, 200));
    }
    check('smoke-defaults-bez-wyjatku', smokeErr.length === 0, smokeErr.slice(0, 8).join(' | '));
    notes.push(`smoke-defaults: przypadków=${buildCases().length}, z wyjątkiem=${smokeErr.length}`);
  }

  // ── C. Pokrycie delegatów: statyczne `dep('…')` w kodzie portu == K07B_FN_NAMES ─────────────────────────────────────
  const depUsed = new Set();
  const valueUsed = new Set();
  for (const f of ['k07b-p1.ts', 'k07b-p2.ts']) {
    const src = readFileSync(join(V2_DIR, f), 'utf8');
    for (const m of src.matchAll(/dep\('([A-Za-z0-9_]+)'\)/g)) depUsed.add(m[1]);
    for (const m of src.matchAll(/valueProxy\('([A-Za-z0-9_]+)'\)/g)) valueUsed.add(m[1]);
  }
  const listed = new Set(K07B_FN_NAMES);
  const extraDep = [...depUsed].filter((n) => !listed.has(n));
  const unusedListed = [...listed].filter((n) => !depUsed.has(n));
  check('pokrycie-dep', extraDep.length === 0 && unusedListed.length === 0, `brak_w_liscie=${extraDep} nieuzywane=${unusedListed}`);
  check('pokrycie-value', [...valueUsed].sort().join() === [...K07B_VALUE_NAMES].sort().join(), [...valueUsed].join());

  // ── Wynik ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  console.log(JSON.stringify({
    comparisons,
    diffs,
    wiringFails,
    przypadkiZBledem: errCases,
    bledy: errList,
    wpisyDziennika: logEntries,
    przypadkiZHtml: htmlCases,
    units: UNIT_NAMES.length,
    blocks: BLOCKS.length,
    pinFile: 'gra/src/ui/cityPanel.ts (edb8fb56)',
    portDir: 'src/ui/cityPanel',
    perUnit: Object.fromEntries([...unitSummary.entries()].map(([k, v]) => [k, `${v.cases} przyp., ${v.diffs} różn.`])),
    notes,
  }, null, 1));
  for (const r of report) {
    if (r.pin === undefined) {
      console.log(`FAIL ${r.unit}: ${r.extra ?? ''}`);
      continue;
    }
    const fields = ['ret', 'err', 'html', 'log'].filter((f) => JSON.stringify(r.pin[f]) !== JSON.stringify(r.v2[f]));
    const pl = r.pin.log;
    const vl = r.v2.log;
    let at = 0;
    while (at < Math.max(pl.length, vl.length) && JSON.stringify(pl[at]) === JSON.stringify(vl[at])) at++;
    console.log(`DIFF ${r.unit} [${r.label}]: pola=${fields.join(',')} errPin=${r.pin.err} errV2=${r.v2.err}`);
    console.log(`  log@${at} pin=${JSON.stringify(pl[at] ?? null).slice(0, 220)}`);
    console.log(`  log@${at} v2 =${JSON.stringify(vl[at] ?? null).slice(0, 220)}`);
  }
  exitCode = diffs === 0 && wiringFails === 0 ? 0 : 1;
} catch (err) {
  console.error('BLAD HARNESSU:', err && err.stack ? err.stack : err);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
