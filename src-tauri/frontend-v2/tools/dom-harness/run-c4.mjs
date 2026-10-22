#!/usr/bin/env node
/**
 * run-c4.mjs — harness porównania DOM/wyników: 10 modułów CYKLU C4 (P5.4,
 * `R-RUSTPORT-P5-4-PORT-CYKL-C4-Q1`) w frontend-v2 vs ten sam moduł z pinu web `edb8fb56`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-c4.mjs --pin-dir <PIN_DIR> [--json <plik>]
 * EXIT 0 ⇔ 0 różnic (i wszystkie asercje v2 spełnione); 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 *
 * Metoda = `run.mjs`/`run-level1a.mjs` (P5.2/P5.3): oba drzewa pakowane `esbuild` z tą samą emulacją
 * Vite (`build.mjs`), wspólny jsdom, zamrożony `Date`, kanoniczna serializacja całego
 * `document.documentElement` albo JSON/HTML wartości. Strona v2 dostaje DTO zbudowane w harnessie
 * z DANYCH i FUNKCJI PINU (harness gra rolę „Rust”):
 *   - `StaticCatalogDto` = pliki `gra/data/*.json` + `categoryOf` + `terrainUnlockLabelsForTech`
 *     (`techTerrainUnlockLabels`) + `RESEARCH_QUEUE_MAX` (`constants.researchQueueMax`);
 *   - `BuildingCardRulesDto` = `buildingEffectAtLevel`, `itemCost`+`buildingWorkCost`, `buildingStockCost`,
 *     `stockResourceLabel`, `buildingUpkeep`, `buildingResourceUpkeep`, `mnoznikRoleForBuildingId`,
 *     `cumulativeMnoznikForBuildingId`, `buildingStructuralDefenseBonusLine` (te same wywołania co pin
 *     `buildingAdapter.ts:137,152,257-259,267,278-280,296-297`);
 *   - `ResearchViewDto` = `scaledResearchCost` (koszt), `hubEpochLabel(era, null, …)` (epoka drzewka —
 *     ta sama formuła co pin `sciencePicker.ts:521-526`), `buildHubTechEntries` (lista huba) — z
 *     `ui/scienceHubSnapshotLogic.ts` i `game/difficulty-cost.ts` pinu.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
const JSON_OUT = argOf('--json');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-c4.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_SRC = resolve(PIN_DIR, 'gra/src');
const PIN_DATA = resolve(PIN_DIR, 'gra/data');

const C4 = [
  'entityCards/registry.ts', 'techDiscoveryNotice.ts', 'entityCards/unitAdapter.ts', 'sciencePicker.ts',
  'entityCards/buildingAdapter.ts', 'scienceHubHud.ts', 'entityCards/improvementAdapter.ts',
  'entityCards/technologyAdapter.ts', 'entityCards/renderer.ts', 'entityCards/wonderAdapter.ts',
];
/** Moduły pinu używane przez harness jako „Rust”. */
const PIN_REF = [
  'units/setup.ts', 'game/production.ts', 'game/building-stock-cost.ts', 'game/economy-upkeep.ts',
  'game/unit-building-bonuses.ts', 'game/building-upgrades.ts', 'game/difficulty-cost.ts',
  'game/improvement-tech.ts', 'game/playerState.ts', 'ui/scienceHubSnapshotLogic.ts',
];
const V2_CTRL = ['controller/staticCatalog.ts', 'controller/entityCardRules.ts'];

// ─── jsdom ───────────────────────────────────────────────────────────────────
const jsdomErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => jsdomErrors.push(String(e?.message ?? e).split('\n')[0]));
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const W = dom.window;
const GLOBALS = [
  'window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLDivElement', 'HTMLCanvasElement', 'HTMLButtonElement',
  'HTMLParagraphElement', 'HTMLPreElement', 'HTMLInputElement', 'HTMLSpanElement', 'HTMLImageElement', 'Event',
  'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'PointerEvent', 'getComputedStyle', 'requestAnimationFrame',
  'cancelAnimationFrame', 'localStorage', 'sessionStorage', 'location', 'DOMParser', 'SVGElement',
];
for (const k of GLOBALS) {
  const v = k === 'window' ? W : W[k];
  if (v === undefined) continue;
  Object.defineProperty(globalThis, k, { value: typeof v === 'function' && k !== 'window' && /^[a-z]/.test(k) ? v.bind(W) : v, configurable: true, writable: true });
}
// jsdom nie implementuje przewijania — `sciencePicker.ts` woła `scrollIntoView` (pin :1467,1483); no-op po obu stronach.
W.Element.prototype.scrollIntoView = function scrollIntoView() {};
const FIXED = Date.UTC(2026, 9, 22, 10, 30, 15);
const RealDate = Date;
class FrozenDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); }
  static now() { return FIXED; }
}
globalThis.Date = FrozenDate;
W.Date = FrozenDate;
const origWarn = console.warn;
const origError = console.error;
console.warn = () => {};
const consoleErrors = [];
console.error = (...a) => { consoleErrors.push(a.map(String).join(' ').slice(0, 200)); };

const tmp = mkdtempSync(join(tmpdir(), 'p54-harness-'));
const pinOut = join(tmp, 'pin');
const v2Out = join(tmp, 'v2');
let exitCode = 0;
try {
  await bundle([...C4.map((m) => join(PIN_SRC, 'ui', m)), ...PIN_REF.map((m) => join(PIN_SRC, m))], pinOut);
  await bundle([...V2_CTRL.map((m) => join(V2_ROOT, 'src', m)), ...C4.map((m) => join(V2_ROOT, 'src/ui', m))], v2Out);
  const imp = (base, rel) => import(pathToFileURL(join(base, rel.replace(/\.ts$/, '.js'))).href);

  const pin = {};
  for (const m of PIN_REF) pin[m] = await imp(pinOut, m);
  for (const m of C4) pin['ui/' + m] = await imp(pinOut, 'ui/' + m);

  const json = (f) => JSON.parse(readFileSync(join(PIN_DATA, f), 'utf8'));
  const unitsJson = json('units.json');
  const buildingsJson = json('buildings.json');
  const techJson = json('tech.json');
  const terrainJson = json('terrain-improvements.json');
  const wondersJson = json('wonders.json');
  const countersJson = json('counters.json');
  const { categoryOf } = pin['units/setup.ts'];
  const TECHS = techJson.technologie;

  // „Rust”: StaticCatalogDto z danych i funkcji pinu.
  const unitCategory = {};
  const unitCategoryNameOnly = {};
  for (const u of unitsJson) {
    unitCategory[u.Jednostka] = categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    unitCategoryNameOnly[u.Jednostka] = categoryOf(u.Jednostka ?? '', '', false, undefined);
  }
  const techTerrainUnlockLabels = {};
  for (const t of TECHS) techTerrainUnlockLabels[t.Technologia] = pin['game/improvement-tech.ts'].terrainUnlockLabelsForTech(t.Technologia);
  const catalog = {
    contentHash: 'harness-pin-edb8fb56',
    buildings: buildingsJson, units: unitsJson, tech: techJson, terrainImprovements: terrainJson, wonders: wondersJson,
    counters: countersJson, civs: json('civs.json'), cityNamesPools: {}, powerParams: {}, uiParams: json('ui-params.json'), wiki: {},
    constants: { researchQueueMax: pin['game/playerState.ts'].RESEARCH_QUEUE_MAX },
    labels: {},
    unitCategory, unitCategoryNameOnly, techTerrainUnlockLabels,
  };
  const v2 = {};
  for (const m of V2_CTRL) v2[m] = await imp(v2Out, m);
  v2['controller/staticCatalog.ts'].installStaticCatalog(catalog);

  // „Rust”: BuildingCardRulesDto — te same wywołania co pin buildingAdapter.ts.
  const PR = pin['game/production.ts'];
  const SC = pin['game/building-stock-cost.ts'];
  const EU = pin['game/economy-upkeep.ts'];
  const UB = pin['game/unit-building-bonuses.ts'];
  const BU = pin['game/building-upgrades.ts'];
  const YK = ['praca', 'pieniadz', 'zywnosc', 'nauka', 'kultura', 'zadowolenie', 'obrona'];
  let rulesCalls = 0;
  v2['controller/entityCardRules.ts'].installBuildingCardRulesProvider((id, st) => {
    rulesCalls++;
    const def = buildingsJson.find((b) => b.id === id);
    const yieldAtDisplayLevel = {};
    const yieldScale = {};
    for (const k of YK) {
      const baza = def.baza[k] ?? 0;
      const inc = def.przyrost[k] ?? 0;
      yieldAtDisplayLevel[k] = PR.buildingEffectAtLevel(baza, inc, st.displayLevel);
      yieldScale[k] = Array.from({ length: Math.max(0, def.maksPoziom) }, (_, i) => PR.buildingEffectAtLevel(baza, inc, i + 1));
    }
    const baseWork = PR.itemCost('budynek', id, { buildings: buildingsJson, units: [] }, 1);
    const stockCost = SC.buildingStockCost(def);
    const upkeepResources = EU.buildingResourceUpkeep(def);
    const resourceLabels = {};
    for (const k of [...Object.keys(stockCost), ...Object.keys(upkeepResources)]) resourceLabels[k] = SC.stockResourceLabel(k);
    return {
      yieldAtDisplayLevel, yieldScale,
      mnoznikRole: UB.mnoznikRoleForBuildingId(id),
      cumulativeMnoznik: UB.cumulativeMnoznikForBuildingId(id, buildingsJson),
      structuralDefenseLine: BU.buildingStructuralDefenseBonusLine(id),
      workCost: PR.buildingWorkCost(baseWork, undefined, st.buildCostPace, st.ownerId, st.difficulty),
      stockCost, upkeepGold: EU.buildingUpkeep(def, 1), upkeepResources, resourceLabels,
    };
  });
  for (const m of C4) v2['ui/' + m] = await imp(v2Out, 'ui/' + m);

  // ─── porównanie ────────────────────────────────────────────────────────────
  const results = new Map();
  const R = (mod) => {
    if (!results.has(mod)) results.set(mod, { module: mod, cases: 0, diffs: 0, examples: [], notMeasured: [] });
    return results.get(mod);
  };
  function ser(node) {
    if (node.nodeType === 3) return JSON.stringify(node.data);
    if (node.nodeType === 8) return `<!--${node.data}-->`;
    if (node.nodeType !== 1) return '';
    const tag = node.tagName.toLowerCase();
    const attrs = [...node.attributes].map((a) => `${a.name}=${JSON.stringify(a.value)}`).sort().join(' ');
    const kids = tag === 'template' ? node.content.childNodes : node.childNodes;
    return `<${tag}${attrs ? ' ' + attrs : ''}>${[...kids].map(ser).join('')}</${tag}>`;
  }
  const htmlSer = (s) => {
    const t = document.createElement('template');
    t.innerHTML = s;
    return [...t.content.childNodes].map(ser).join('');
  };
  const canon = (v) => (typeof v === 'string' && /<[a-zA-Z!]/.test(v) ? 'HTML:' + htmlSer(v) : 'JSON:' + JSON.stringify(v));
  function record(mod, label, a, b) {
    const r = R(mod);
    r.cases++;
    if (a !== b) {
      r.diffs++;
      if (r.examples.length < 5) {
        let i = 0;
        while (i < a.length && a[i] === b[i]) i++;
        r.examples.push({ label, at: i, pin: a.slice(Math.max(0, i - 80), i + 140), v2: b.slice(Math.max(0, i - 80), i + 140) });
      }
    }
  }
  const cmpVal = (mod, label, a, b) => record(mod, label, canon(a), canon(b));
  function resetDoc() {
    for (const n of [...document.documentElement.childNodes]) {
      if (n !== document.head && n !== document.body) n.remove();
    }
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    for (const el of [document.documentElement, document.body]) for (const a of [...el.attributes]) el.removeAttribute(a.name);
  }
  const snapshot = () => ser(document.documentElement);
  let actionLog = [];
  const act = (name) => (...a) => { actionLog.push(name + '(' + a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(',') + ')'); };
  const dumpActions = () => {
    const pre = document.createElement('pre');
    pre.setAttribute('data-action-log', '');
    pre.textContent = actionLog.join('\n');
    document.body.appendChild(pre);
  };
  /**
   * `stash`: moduł trzyma swoje węzły w `body` między wywołaniami (np. `sciencePicker` tworzy nakładkę,
   * dymek i tło RAZ, potem tylko je ukrywa/odświeża) — po `resetDoc` wracają do `body` swojej strony.
   * `cleanup` (per strona): wołane PO zrzucie tej strony (np. zniszczenie huba, żeby słuchacze
   * `document` z jednej strony nie reagowały na kliknięcia drugiej).
   */
  const stashed = { pin: [], v2: [] };
  async function domCase(mod, label, runPin, runV2, { stash = false, cleanupPin, cleanupV2 } = {}) {
    const side = async (name, run, cleanup) => {
      resetDoc();
      localStorage.clear();
      actionLog = [];
      if (stash) for (const n of stashed[name]) document.body.appendChild(n);
      try { await run(); } catch (e) { actionLog.push('THROW:' + String(e?.message ?? e)); }
      dumpActions();
      const snap = snapshot();
      if (stash) stashed[name] = [...document.body.childNodes].filter((n) => !(n.nodeType === 1 && n.hasAttribute('data-action-log')));
      await cleanup?.();
      return snap;
    };
    const a = await side('pin', runPin, cleanupPin);
    const b = await side('v2', runV2, cleanupV2);
    resetDoc();
    record(mod, label, a, b);
    const r = R(mod);
    r.domCases = (r.domCases ?? 0) + 1;
    if (!/<body>(?:(?!<pre data-action-log)<[a-z])/.test(b.replace(/<body><\/body>/, '<body>'))) r.domEmpty = (r.domEmpty ?? 0) + 1;
    return b;
  }
  const notMeasured = (mod, why) => R(mod).notMeasured.push(why);
  const assertV2 = (mod, checks) => {
    const r = R(mod);
    r.v2Assertions = [...(r.v2Assertions ?? []), ...checks.map(([k, ok]) => ({ check: k, ok: !!ok }))];
    r.v2AssertionsFailed = r.v2Assertions.filter((c) => !c.ok).length;
  };
  const fire = (el, type, init = {}) => el?.dispatchEvent(new W.MouseEvent(type, { bubbles: true, cancelable: true, clientX: 120, clientY: 80, ...init }));
  const click = (sel, root = document) => fire(root.querySelector(sel), 'click');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  /** JSON z pominięciem funkcji (np. `medallion.mount`) — porównujemy dane, nie domknięcia. */
  const data = (v) => JSON.parse(JSON.stringify(v ?? null));
  /** Wyjątek w jednej ze stron = wynik `{throw}` (różnica), nie awaria harnessu. */
  const safe = (fn) => { try { return fn(); } catch (e) { return { throw: String(e?.message ?? e) }; } };

  // Identyfikatory encji (z danych pinu).
  const UNIT_SLUGS = unitsJson.map((u) => pin['ui/entityCards/registry.ts'].unitToSlug(u.Jednostka));
  const BUILDING_IDS = buildingsJson.map((b) => b.id);
  const TECH_SLUGS = TECHS.map((t) => pin['ui/entityCards/registry.ts'].technologyIdFromName(t.Technologia));
  const IMPROVEMENT_IDS = Object.keys(terrainJson);
  const WONDER_IDS = wondersJson.cuda.map((w) => w.id);
  const CITY_STATES = [
    undefined,
    { hasCity: true, displayLevel: 2, buildCostPace: 'normalny', difficulty: 'hard', ownerId: 0 },
    { hasCity: false, displayLevel: 1, buildCostPace: 'wysoki', difficulty: 'easy', ownerId: 1 },
    { hasCity: true, displayLevel: 3, buildCostPace: 'niski', difficulty: 'normal', ownerId: 0 },
    { hasCity: true, displayLevel: 1, buildCostPace: 'wysoki', difficulty: 'easy', ownerId: 0 },
  ];

  // 1. entityCards/registry.ts
  {
    const M = 'entityCards/registry.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    for (const id of [...BUILDING_IDS, 'brak', '']) cmpVal(M, `building(${id})`, P.resolveBuildingRow(id), V.resolveBuildingRow(id));
    for (const id of [...IMPROVEMENT_IDS, 'brak']) cmpVal(M, `improvement(${id})`, P.resolveImprovementRow(id), V.resolveImprovementRow(id));
    for (const id of [...TECH_SLUGS, 'brak', '']) cmpVal(M, `technology(${id})`, P.resolveTechnologyRow(id), V.resolveTechnologyRow(id));
    for (const id of [...UNIT_SLUGS, 'brak']) cmpVal(M, `unit(${id})`, P.resolveUnitRow(id), V.resolveUnitRow(id));
    for (const id of [...WONDER_IDS, 'brak', 'parkowane']) cmpVal(M, `wonder(${id})`, P.resolveWonderRow(id), V.resolveWonderRow(id));
    for (const n of [...TECHS.map((t) => t.Technologia), 'Nieznana technologia', ' Rolnictwo ', '']) {
      cmpVal(M, `technologyIdFromName(${n})`, P.technologyIdFromName(n), V.technologyIdFromName(n));
    }
    for (const n of [...unitsJson.map((u) => u.Jednostka), 'Łucznik konny', '']) cmpVal(M, `unitToSlug(${n})`, P.unitToSlug(n), V.unitToSlug(n));
  }

  // 2–7. adaptery (wynik = EntityCardData, porównanie JSON bez funkcji)
  {
    const RP = pin['ui/entityCards/registry.ts'];
    const RV = v2['ui/entityCards/registry.ts'];
    const adapters = [
      ['entityCards/unitAdapter.ts', 'unitAdapter', UNIT_SLUGS, 'resolveUnitRow', [undefined]],
      ['entityCards/buildingAdapter.ts', 'buildingAdapter', BUILDING_IDS, 'resolveBuildingRow', CITY_STATES],
      ['entityCards/improvementAdapter.ts', 'improvementAdapter', IMPROVEMENT_IDS.filter((k) => k !== '_meta'), 'resolveImprovementRow', [undefined]],
      ['entityCards/technologyAdapter.ts', 'technologyAdapter', TECH_SLUGS, 'resolveTechnologyRow', [undefined]],
      ['entityCards/wonderAdapter.ts', 'wonderAdapter', WONDER_IDS, 'resolveWonderRow', [undefined]],
    ];
    for (const [M, fn, ids, res, cities] of adapters) {
      const P = pin['ui/' + M][fn];
      const V = v2['ui/' + M][fn];
      for (const id of ids) {
        for (const [ci, city] of cities.entries()) {
          const ctx = city === undefined ? {} : { city };
          cmpVal(M, `${fn}(${id})#${ci}`, safe(() => data(P(RP[res](id), ctx))), safe(() => data(V(RV[res](id), ctx))));
        }
      }
    }
    // Wiersze syntetyczne: pola, których dziś nie ma w danych (historia/opis/top3, puste listy) — gałęzie adapterów.
    const synthUnit = { ...unitsJson[0], Jednostka: 'Syntetyk <x>', Tech: '—', Kultura: 'Rzym', Budynek: 'Koszary', Opis: 'Opis & więcej', Top3: ['A', { tytul: 'B', tekst: 'C' }, {}],
      Historia: ' Rys ', 'W zamian za': unitsJson[1].Jednostka, 'Próg dezercji (% health)': 0.255, 'Super-jednostka': 'TAK', Typ: '' };
    // „Rust” zna każdą jednostkę, którą wysyła — wiersz syntetyczny dostaje kategorię w katalogu (wywołanie jak pin `unitAdapter.ts:104-109`).
    const tx = (v) => (v == null ? '' : String(v).trim());
    catalog.unitCategory[synthUnit.Jednostka] = categoryOf(tx(synthUnit.Jednostka), tx(synthUnit['Rola (linia)']), synthUnit['Super-jednostka'] === 'TAK', synthUnit.Typ);
    cmpVal('entityCards/unitAdapter.ts', 'unitAdapter(syntetyk)', data(pin['ui/entityCards/unitAdapter.ts'].unitAdapter(synthUnit, {})), data(v2['ui/entityCards/unitAdapter.ts'].unitAdapter(synthUnit, {})));
    const synthTech = { ...TECHS[0], Technologia: 'Syntetyczna', 'Wymaga (prereq)': '—', 'Odblokowuje surowiec.': null, 'Odblokowuje ulepszenie terenu': '', Historia: 'Dawno', 'Dostęp do surowca.': 'Dostęp do drewna' };
    cmpVal('entityCards/technologyAdapter.ts', 'technologyAdapter(syntetyk)', data(pin['ui/entityCards/technologyAdapter.ts'].technologyAdapter(synthTech, {})), data(v2['ui/entityCards/technologyAdapter.ts'].technologyAdapter(synthTech, {})));
    const synthImp = { nazwa: 'Nieznane', bonus: { zywnosc: 2, praca: -1, x: 0 }, bonus_obrona_proc: 10, bonus_ruch: 1, bonus_ruch_uwaga: 'droga', wycinka: true, bonus_wymaga_obozowania: true,
      cywilizacje: ['Rzym'], upgradeFrom: 'farma', surowiec_ilosc_tura: 2, zasieg_terytorium: 1, zasieg_kontroli: 2, zasieg_pol: 3, historia: 'H', odblokowuje: 'X', epoka: 2, typ: 'specjalne' };
    cmpVal('entityCards/improvementAdapter.ts', 'improvementAdapter(syntetyk)', data(pin['ui/entityCards/improvementAdapter.ts'].improvementAdapter(synthImp, {})), data(v2['ui/entityCards/improvementAdapter.ts'].improvementAdapter(synthImp, {})));
    const synthWonder = { id: 'syn', nazwa: '', nazwaAlt: 'Alt', dostep: 'X', cywilizacje: [], techUnlock: ['Brak', '—', TECHS[3].Technologia], kosztBudowy: 100, utrzymanie: 2, maxNaSwiecie: 1,
      epokaWejscia: 2, bonusy: { miasto: { nauka: 2, zywnosc: 0 }, teren: [{ typTerenu: 'Las', drewno: 1, warunek: 'w zasięgu' }, { kamien: 0 }], specjalne: [{ opis: 'Specjalny <b>' }, {}] }, historia: 'H' };
    cmpVal('entityCards/wonderAdapter.ts', 'wonderAdapter(syntetyk)', data(pin['ui/entityCards/wonderAdapter.ts'].wonderAdapter(synthWonder, {})), data(v2['ui/entityCards/wonderAdapter.ts'].wonderAdapter(synthWonder, {})));
    const synthBuilding = { ...buildingsJson.find((b) => b.maksPoziom > 1), historia: 'Rys', opis: 'Opis', top3: ['x', { tytul: 't' }], upgradeFrom: 'nieistnieje', wymagania: '—', techUnlock: 'Nieznana' };
    for (const [ci, city] of CITY_STATES.entries()) {
      const ctx = city === undefined ? {} : { city };
      cmpVal('entityCards/buildingAdapter.ts', `buildingAdapter(syntetyk)#${ci}`, data(pin['ui/entityCards/buildingAdapter.ts'].buildingAdapter(synthBuilding, ctx)), data(v2['ui/entityCards/buildingAdapter.ts'].buildingAdapter(synthBuilding, ctx)));
    }
    assertV2('entityCards/buildingAdapter.ts', [['dostawca BuildingCardRulesDto wołany (karta budynku czyta reguły z DTO)', rulesCalls > 0]]);
  }

  // 8. entityCards/renderer.ts
  {
    const M = 'entityCards/renderer.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    cmpVal(M, 'ENTITY_CARD_CSS', P.ENTITY_CARD_CSS, V.ENTITY_CARD_CSS);
    const renderOk = [];
    const all = [
      ...UNIT_SLUGS.map((id) => ['unit', id]), ...BUILDING_IDS.map((id) => ['building', id]), ...TECH_SLUGS.map((id) => ['technology', id]),
      ...IMPROVEMENT_IDS.map((id) => ['improvement', id]), ...WONDER_IDS.map((id) => ['wonder', id]),
      ['unit', 'brak'], ['building', 'brak'], ['technology', 'brak'], ['improvement', '_meta'], ['wonder', 'brak'],
    ];
    for (const [kind, id] of all) {
      const ctxs = kind === 'building' ? CITY_STATES.map((c) => (c === undefined ? {} : { city: c })) : [{}];
      for (const [ci, ctx] of ctxs.entries()) {
        const a = safe(() => P.buildEntityCardData(kind, id, ctx));
        const b = safe(() => V.buildEntityCardData(kind, id, ctx));
        cmpVal(M, `data(${kind}/${id})#${ci}`, data(a), data(b));
        if (a && b && !a.throw && !b.throw && ci === 0) {
          const html = await domCase(M, `render(${kind}/${id})`, () => { document.body.appendChild(P.renderEntityCard(a)); }, () => { document.body.appendChild(V.renderEntityCard(b)); });
          renderOk.push(html.includes('class="entity-card') && html.includes(b.title.length > 0 ? JSON.stringify(b.title).slice(1, 6) : ''));
        }
      }
    }
    // Tryby otwarcia: dialog (+ link krzyżowy z karty, + klik w tło), inline, brak encji.
    const opens = [['technology', TECH_SLUGS[0]], ['building', BUILDING_IDS[3]], ['unit', UNIT_SLUGS[5]], ['improvement', 'farma'], ['wonder', WONDER_IDS[0]], ['technology', TECH_SLUGS[10]]];
    for (const [kind, id] of opens) {
      const run = (S) => {
        const dismiss = S.openEntityCard(kind, id, { mode: 'dialog' });
        actionLog.push('opened');
        const link = document.querySelector('.entity-card button[data-entity-kind][data-entity-id]');
        if (link) { fire(link, 'click'); actionLog.push('link'); }
        const row = document.querySelector('.entity-card .entity-card-row[data-row-entity-kind]');
        if (row) { fire(row, 'click'); actionLog.push('row'); }
        actionLog.push('cards=' + document.querySelectorAll('.entity-card').length);
        const backs = document.querySelectorAll('.entity-card-backdrop');
        if (backs.length) fire(backs[backs.length - 1], 'click');
        actionLog.push('po-tle=' + document.querySelectorAll('.entity-card').length);
        dismiss();
        actionLog.push('po-dismiss=' + document.querySelectorAll('.entity-card').length);
        S.openEntityCard(kind, id, { mode: 'dialog' });
      };
      await domCase(M, `dialog(${kind}/${id})`, () => run(P), () => run(V), {
        cleanupPin: () => document.querySelectorAll('.entity-card-backdrop').forEach((b) => fire(b, 'click')),
        cleanupV2: () => document.querySelectorAll('.entity-card-backdrop').forEach((b) => fire(b, 'click')),
      });
      const runInline = (S) => {
        const box = document.createElement('div');
        box.id = 'inline-host';
        document.body.appendChild(box);
        const d = S.openEntityCard(kind, id, { mode: 'inline', container: box, ctx: kind === 'building' ? { city: CITY_STATES[1] } : {} });
        actionLog.push('inline=' + box.childElementCount);
        const d2 = S.openEntityCard(kind, 'brak', { mode: 'inline', container: box });
        d2();
        if (id === opens[0][1]) { d(); actionLog.push('po-dismiss=' + box.childElementCount); }
      };
      await domCase(M, `inline(${kind}/${id})`, () => runInline(P), () => runInline(V));
    }
    // Tryb hover (`attachHoverDetail`, opóźnienie 220 ms — realny czas).
    for (const [kind, id] of [['building', BUILDING_IDS[0]], ['unit', 'brak']]) {
      const runHover = async (S) => {
        const anchor = document.createElement('div');
        anchor.id = 'hover-anchor';
        anchor.textContent = 'kotwica';
        document.body.appendChild(anchor);
        S.openEntityCard(kind, id, { mode: 'hover', container: anchor });
        fire(anchor, 'mouseenter', { bubbles: false });
        await sleep(300);
      };
      await domCase(M, `hover(${kind}/${id})`, () => runHover(P), () => runHover(V), {
        // mouseleave + odczekanie timera ukrycia PRZED drugą stroną (inaczej timer jednej strony pisze do wspólnego `document`).
        cleanupPin: async () => { fire(document.getElementById('hover-anchor'), 'mouseleave', { bubbles: false }); await sleep(400); },
        cleanupV2: async () => { fire(document.getElementById('hover-anchor'), 'mouseleave', { bubbles: false }); await sleep(400); },
      });
    }
    assertV2(M, [[`render: karta .entity-card z tytułem w DOM v2 (${renderOk.filter(Boolean).length}/${renderOk.length})`, renderOk.length === UNIT_SLUGS.length + BUILDING_IDS.length + TECH_SLUGS.length + IMPROVEMENT_IDS.length - 1 + WONDER_IDS.length && renderOk.every(Boolean)]]);
    notMeasured(M, 'miniatura jednostki w medalionie (`unit3d` → `mountUnitMiniPreview`, kolejka rAF): pin renderuje WebGL (three), v2 obraz z Rust/placeholder (D-UI-3, P5.2) — zrzut DOM robiony PRZED rAF (stan „…” identyczny), stan po rAF nieporównywalny');
    notMeasured(M, 'klawisz Escape (stos `escapeOverlayStack.ts`, moduł P5.1) — nie wysyłany (wspólny `document` obu stron)');
  }

  // 9. techDiscoveryNotice.ts
  {
    const M = 'techDiscoveryNotice.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    cmpVal(M, 'IMPROVEMENT_NAME_TO_KEY', P.IMPROVEMENT_NAME_TO_KEY, V.IMPROVEMENT_NAME_TO_KEY);
    const tdnOk = [];
    const variants = [
      { kind: 'completion' },
      { kind: 'era', eraIndex: 2, tree: true },
      { kind: 'preview', research: true, tree: true },
      { kind: undefined, eraIndex: 9, research: true },
      { kind: 'preview' },
    ];
    for (const [ti, t] of TECHS.entries()) {
      const vs = ti < 6 ? variants : [variants[ti % variants.length]];
      for (const v of vs) {
        const run = (S) => {
          S.showTechDiscoveryNotice({
            techName: t.Technologia, eraIndex: v.eraIndex ?? 1, kind: v.kind,
            onOpenTree: v.tree ? act('onOpenTree') : undefined, onStartResearch: v.research ? act('onStartResearch') : undefined,
          });
          actionLog.push('open=' + S.isTechDiscoveryNoticeOpen());
        };
        const html = await domCase(M, `show(${t.Technologia},${JSON.stringify(v)})`, () => run(P), () => run(V), {
          cleanupPin: () => P.hideTechDiscoveryNotice(), cleanupV2: () => V.hideTechDiscoveryNotice(),
        });
        tdnOk.push(html.includes('tdn-entity-card-v2') && !html.includes('class="tdn-card"'));
      }
    }
    // Interakcje: karta obok (link krzyżowy), podmiana satelity, przyciski akcji, zamknięcie tłem / ✕.
    for (const t of TECHS.slice(0, 12)) {
      const run = (S) => {
        S.showTechDiscoveryNotice({ techName: t.Technologia, eraIndex: 1, kind: 'preview', onOpenTree: act('onOpenTree'), onStartResearch: act('onStartResearch') });
        const links = [...document.querySelectorAll('.tdn-entity-card-v2 button[data-entity-kind][data-entity-id]')];
        if (links[0]) fire(links[0], 'click');
        actionLog.push('side=' + document.querySelectorAll('.tdn-side-card').length);
        const sideLink = document.querySelector('.tdn-side-card button[data-entity-kind][data-entity-id], .tdn-side-card .entity-card-row[data-row-entity-kind]');
        if (sideLink) fire(sideLink, 'click');
        actionLog.push('side2=' + document.querySelectorAll('.tdn-side-card').length);
        const row = document.querySelector('.tdn-entity-card-v2 .entity-card-row[data-row-entity-kind]');
        if (row) fire(row, 'click');
        const snap1 = ser(document.body);
        actionLog.push('stan1:' + snap1);
        const sideClose = document.querySelector('.tdn-side-card .tdn-entity-close');
        if (sideClose) fire(sideClose, 'click');
        actionLog.push('po-zamknieciu-satelity=' + document.querySelectorAll('.tdn-side-card').length);
        if (links[1]) fire(links[1], 'click');
        const btn = [...document.querySelectorAll('.tdn-entity-card-v2 button')].find((b) => /Rozpocznij badanie/.test(b.textContent));
        if (btn) fire(btn, 'click');
        actionLog.push('open-po-akcji=' + S.isTechDiscoveryNoticeOpen());
        S.showTechDiscoveryNotice({ techName: t.Technologia, eraIndex: 3, kind: 'era', onOpenTree: act('onOpenTree') });
        const tree = [...document.querySelectorAll('.tdn-entity-card-v2 button')].find((b) => /Otwórz drzewo/.test(b.textContent));
        if (tree) fire(tree, 'click');
        S.showTechDiscoveryNotice({ techName: t.Technologia, eraIndex: 1, kind: 'completion' });
        click('.tdn-back');
        actionLog.push('po-tle=' + S.isTechDiscoveryNoticeOpen());
        S.showTechDiscoveryNotice({ techName: t.Technologia, eraIndex: 1, kind: 'completion' });
        click('.tdn-entity-card-v2 .tdn-entity-close');
        actionLog.push('po-x=' + S.isTechDiscoveryNoticeOpen());
        S.showTechDiscoveryNotice({ techName: 'Nieznana technologia', eraIndex: 1 });
        actionLog.push('nieznana=' + S.isTechDiscoveryNoticeOpen());
        S.showTechDiscoveryNotice({ techName: t.Technologia, eraIndex: 2, kind: 'era' });
      };
      await domCase(M, `interakcje(${t.Technologia})`, () => run(P), () => run(V), {
        cleanupPin: () => P.hideTechDiscoveryNotice(), cleanupV2: () => V.hideTechDiscoveryNotice(),
      });
    }
    assertV2(M, [[`show: ścieżka entityCards (.tdn-entity-card-v2), nie legacy (${tdnOk.filter(Boolean).length}/${tdnOk.length})`, tdnOk.length === TECHS.length + 6 * (variants.length - 1) && tdnOk.every(Boolean)]]);
    notMeasured(M, '`_legacyShowTechDiscoveryNotice` (pin :880-935) — fallback wołany tylko gdy ścieżka entityCards rzuci wyjątek; na danych pinu nieosiągalny (każda technologia ma wiersz). Kod skopiowany bez zmian poza odczytem katalogu w `buildBody` (diff)');
  }

  // 10. sciencePicker.ts
  {
    const M = 'sciencePicker.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const SL = pin['ui/scienceHubSnapshotLogic.ts'];
    const DC = pin['game/difficulty-cost.ts'];
    // `slugify` = kopia funkcji lokalnej pinu `sciencePicker.ts:121-128` (nieeksportowanej) — harness buduje
    // tę samą mapę węzłów (`TECH_MAP`, kolejność wstawiania = `tech.json`) do wywołania `buildHubTechEntries`.
    const slugify = (name) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const techById = new Map();
    for (const t of TECHS) {
      const id = slugify(t.Technologia);
      techById.set(id, { id, nazwa: t.Technologia, epoka: t.Epoka, koszt: t['Koszt nauki'], prereqIds: [] });
    }
    const SLUGS = [...techById.keys()];
    for (const n of [...TECHS.map((t) => t.Technologia), ...SLUGS, 'Nieznana', '  ', 'ROLNICTWO', 'rolnictwo', '']) {
      cmpVal(M, `techToSlug(${n})`, P.techToSlug(n), V.techToSlug(n));
      cmpVal(M, `techNameFromSlug(${n})`, P.techNameFromSlug(n), V.techNameFromSlug(n));
    }
    for (const s of [...SLUGS, 'brak']) {
      cmpVal(M, `techUnlockItems(${s})`, P.techUnlockItems(s), V.techUnlockItems(s));
      cmpVal(M, `techRequirementItems(${s})`, P.techRequirementItems(s), V.techRequirementItems(s));
    }
    /** „Rust”: ResearchViewDto dla scenariusza (te same dane, które pin dostaje przez haki). */
    const researchView = (sc, owner) => {
      const tempo = sc.tempo ?? 'standardowa';
      const difficulty = sc.difficulty ?? 'normal';
      const st = sc.state ?? null;
      const targetSlug = st?.targetId ? P.techToSlug(st.targetId) : null;
      return {
        techs: [...techById.values()].map((n) => ({ id: n.id, baseCost: n.koszt, effectiveCost: DC.scaledResearchCost(n.koszt, tempo, owner, difficulty, n.epoka),
          epoka: n.epoka, state: '', terrainUnlockLabels: [] })),
        queue: [], queueMax: 4, eraGate: null, tempo, difficulty,
        treeEpoch: SL.hubEpochLabel(sc.era, null, techById, slugify),
        hubEntries: SL.buildHubTechEntries({
          techById, slugify, researchedRaw: sc.researched ?? [], availableRaw: sc.available ?? [], targetSlug, playerEra: sc.era,
          costFor: (base, epoka) => DC.scaledResearchCost(base, tempo, owner, difficulty, epoka),
        }),
      };
    };
    const cfgFor = (sc, side) => {
      const hooks = sc.hooks !== false;
      const c = {
        getResearchState: hooks ? () => sc.state ?? null : undefined,
        getResearchedTechs: hooks ? () => sc.researched ?? [] : undefined,
        getAvailableTechs: hooks ? () => sc.available ?? [] : undefined,
        onSelectTarget: act('onSelectTarget'),
        getPlan: sc.plan ? () => sc.plan : undefined,
      };
      if (side === 'pin') {
        Object.assign(c, {
          getPlayerEra: sc.era === undefined ? undefined : () => sc.era,
          getTempoGry: sc.tempo === undefined ? undefined : () => sc.tempo,
          getDifficulty: sc.difficulty === undefined ? undefined : () => sc.difficulty,
        });
      } else {
        Object.assign(c, { getResearchView: (owner) => researchView(sc, owner) });
      }
      return c;
    };
    const kam = SLUGS.filter((s) => techById.get(s).epoka === 'Kamień');
    const braz = SLUGS.filter((s) => techById.get(s).epoka === 'Brąz');
    const zel = SLUGS.filter((s) => techById.get(s).epoka === 'Żelazo');
    const pickerOk = [];
    const SCEN = [
      { name: 'podgląd-bez-haków', hooks: false },
      { name: 'podgląd-tempo', hooks: false, tempo: 'dluga', difficulty: 'hard' },
      { name: 'start', era: 1, researched: [], available: kam.slice(0, 3), state: null },
      { name: 'cel-nazwą', era: 1, researched: [kam[0]], available: kam.slice(1, 4), state: { pula: 12.4, targetId: TECHS.find((t) => t.Epoka === 'Kamień' && slugify(t.Technologia) === kam[2]).Technologia, kosztCelu: 80, postepFraction: 0.155, turnsLeft: 4 },
        tempo: 'szybka', difficulty: 'easy', plan: [{ id: kam[2], name: 'X', isActive: true, pos: 1 }, { id: kam[3], name: 'Y', isActive: false, pos: 2 }] },
      { name: 'brąz', era: 2, researched: kam, available: braz.slice(0, 4), state: { pula: 3, targetId: braz[1], kosztCelu: 200, postepFraction: 0.02, turnsLeft: 0 }, tempo: 'dluga', difficulty: 'hard' },
      { name: 'żelazo-ułamek', era: 2.6, researched: [...kam, ...braz], available: zel, state: { pula: 0, targetId: null, kosztCelu: 0, postepFraction: 0, turnsLeft: 0 }, difficulty: 'hard' },
      { name: 'epoka-0', era: 0, researched: [], available: [], state: { pula: 5, targetId: 'brak_techu', kosztCelu: 10, postepFraction: 1.4, turnsLeft: 2 } },
      { name: 'epoka-9', era: 9, researched: zel.slice(0, 1), available: zel.slice(1), state: { pula: 5, targetId: zel[2] ?? null, kosztCelu: 10, postepFraction: -0.2, turnsLeft: 1 }, plan: [] },
      { name: 'bez-epoki-z-celem', researched: kam.slice(0, 2), available: [...kam.slice(2), braz[0]], state: { pula: 50, targetId: braz[0], kosztCelu: 120, postepFraction: 0.5, turnsLeft: 3 }, tempo: 'standardowa' },
    ];
    for (const sc of SCEN) {
      for (const owner of [0, 1]) {
        P.configureSciencePicker(cfgFor(sc, 'pin'));
        V.configureSciencePicker(cfgFor(sc, 'v2'));
        cmpVal(M, `snapshot(${sc.name},${owner})`, P.getScienceHubSnapshot(owner), V.getScienceHubSnapshot(owner));
      }
      for (const mode of ['legacy', 'dock']) {
        const run = (S, side) => {
          S.configureSciencePicker(cfgFor(sc, side));
          if (mode === 'dock') S.showSciencePickerDocked(sc.name === 'brąz' ? 1 : 0, { focusTechId: kam[1], onClose: act('onClose') });
          else S.showSciencePicker(sc.name === 'brąz' ? 1 : 0);
          actionLog.push('open=' + S.isSciencePickerOpen() + ' dock=' + S.isSciencePickerDocked());
          // dymek nad trzema węzłami (pierwszy, cel, ostatni)
          const nodes = [...document.querySelectorAll('.civ-sci-node')];
          for (const n of [nodes[0], nodes[Math.floor(nodes.length / 2)], nodes[nodes.length - 1]]) {
            if (!n) continue;
            fire(n, 'mouseover');
            actionLog.push('tt:' + document.querySelector('.civ-sci-tooltip')?.innerHTML);
            fire(n, 'mousemove');
            fire(n, 'mouseout', { relatedTarget: document.body });
          }
          // zakładki epok i „Skocz do celu” (dock)
          document.querySelectorAll('.cs-epoch-tab').forEach((t) => fire(t, 'click'));
          click('[data-jump-target]');
          // wybór celu
          const pick = document.querySelector('.civ-sci [data-pick="1"]');
          if (pick) fire(pick.querySelector('.civ-sci-hit') ?? pick, 'click');
          S.refreshSciencePickerIfOpen();
        };
        const html = await domCase(M, `show(${sc.name},${mode})`, () => run(P, 'pin'), () => run(V, 'v2'), { stash: true });
        pickerOk.push(html.includes('civ-sci-node') && html.includes('id="civ-sci-svg"') && !html.includes('Nie udalo sie odswiezyc'));
        const close = (S, side) => {
          S.configureSciencePicker(cfgFor(sc, side));
          if (mode === 'dock') { click('.cs-back'); actionLog.push('po-back=' + S.isSciencePickerOpen()); S.showSciencePickerDocked(0, { onClose: act('onClose2') }); click('.civ-sci-dim-backdrop'); }
          else { click('.cs-close'); actionLog.push('po-x=' + S.isSciencePickerOpen()); S.showSciencePicker(0); fire(document.querySelector('.civ-sci-overlay'), 'click'); }
          actionLog.push('open=' + S.isSciencePickerOpen());
          S.refreshSciencePickerIfOpen();
          S.hideSciencePicker();
        };
        await domCase(M, `close(${sc.name},${mode})`, () => close(P, 'pin'), () => close(V, 'v2'), { stash: true });
      }
    }
    assertV2(M, [[`show: drzewko SVG z węzłami, bez gałęzi błędu (${pickerOk.filter(Boolean).length}/${pickerOk.length})`, pickerOk.length === 18 && pickerOk.every(Boolean)]]);
    assertV2(M, [['v2 nie importuje buildHubTechEntries (lista huba = ResearchViewDto.hubEntries)', !readFileSync(join(V2_ROOT, 'src/ui/sciencePicker.ts'), 'utf8').includes('buildHubTechEntries(')]]);
    notMeasured(M, 'przewijanie (`scrollIntoView`, pin :1467,1483) — jsdom bez układu; no-op po obu stronach');
    notMeasured(M, 'pozycja dymka (`moveTooltip`, `offsetWidth`/`innerWidth`) — jsdom bez układu (0×0); porównany tylko jako ten sam wynik');
    notMeasured(M, 'gałąź `catch` renderu (pin :1434-1443) — nieosiągalna na danych harnessu');
  }

  // 11. scienceHubHud.ts
  {
    const M = 'scienceHubHud.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const SPp = pin['ui/sciencePicker.ts'];
    for (const s of TECHS.map((t) => SPp.techToSlug(t.Technologia))) {
      for (const it of SPp.techUnlockItems(s)) cmpVal(M, `unlockIconSvg(${s},${it.kind})`, P.unlockIconSvg(it), V.unlockIconSvg(it));
    }
    for (const it of [{ kind: 'budynek', label: 'X', iconKey: 'trybunal', iconCategory: 'Administracja' }, { kind: 'budynek', label: 'Y', iconKey: 'nieznany' },
      { kind: 'surowiec', label: 'krowa/byk', iconKey: 'bydlo' }, { kind: 'ulepszenie', label: '—', iconKey: '—' }]) {
      cmpVal(M, `unlockIconSvg(${JSON.stringify(it)})`, P.unlockIconSvg(it), V.unlockIconSvg(it));
    }
    // Wpisy listy = wynik pinu (`getScienceHubSnapshot` porównany osobno) — ta sama fikstura dla obu stron.
    SPp.configureSciencePicker({ getResearchState: () => ({ pula: 10, targetId: TECHS[2].Technologia, kosztCelu: 50, postepFraction: 0.2, turnsLeft: 3 }),
      getResearchedTechs: () => [SPp.techToSlug(TECHS[0].Technologia)], getAvailableTechs: () => TECHS.slice(1, 6).map((t) => SPp.techToSlug(t.Technologia)),
      getPlayerEra: () => 1, getTempoGry: undefined, getDifficulty: undefined, getPlan: undefined });
    const snap = SPp.getScienceHubSnapshot(0);
    const entries = [...snap.entries, { id: 'x', name: 'Bez ikon <b>', epoka: 'Brąz', koszt: 7, locked: false, isTarget: true },
      { id: 'y', name: 'Zablok.', epoka: 'Żelazo', koszt: 99, locked: true, isTarget: false, lockHint: 'Wymaga: A + B', unlockItems: [{ kind: 'surowiec', label: 'Miedź', iconKey: 'Miedź' }] },
      ...[1, 2, 3, 4, 5].map((i) => ({ id: 'l' + i, name: 'Lock ' + i, epoka: 'Kamień', koszt: i, locked: true, isTarget: false }))];
    const prog = [null, { targetName: null, targetId: null, pula: 0, kosztCelu: 10, postepFraction: 0, turnsLeft: 0 },
      { targetName: TECHS[2].Technologia, targetId: 'x', pula: 10.6, kosztCelu: 50.2, postepFraction: 0.333, turnsLeft: 0, naukaRate: 7 },
      { targetName: 'Nieznana <x>', targetId: 'x', pula: 1, kosztCelu: 3, postepFraction: 2, turnsLeft: 5 }];
    const plans = [undefined, [], [{ id: snap.entries[0]?.id ?? 'a', name: 'Plan A', isActive: true, pos: 1 }, { id: 'b', name: 'Plan <B>', isActive: false, pos: 2 }],
      [1, 2, 3, 4].map((i) => ({ id: 'p' + i, name: 'P' + i, isActive: i === 1, pos: i }))];
    const gates = [null,
      { era: 1, eraLabel: 'Kamień', nextEraLabel: 'Brąz', maxEra: 3, isMaxEra: false, missingTechs: [{ id: 'a', name: 'Łowiectwo' }, { id: 'b', name: 'Rolnictwo <x>' }], techsComplete: false, wonderRequired: false, wonders: [], wonderSatisfied: true, canAdvance: false, blocked: true },
      { era: 2, eraLabel: 'Brąz', nextEraLabel: 'Żelazo', maxEra: 3, isMaxEra: false, missingTechs: [], techsComplete: true, wonderRequired: true,
        wonders: [{ id: 'w1', name: 'Piramida', built: false, inProgress: true }, { id: 'w2', name: 'Mur', built: false, inProgress: false }], wonderSatisfied: false, canAdvance: false, blocked: true },
      { era: 2, eraLabel: 'Brąz', nextEraLabel: 'Żelazo', maxEra: 3, isMaxEra: false, missingTechs: [], techsComplete: true, wonderRequired: true,
        wonders: [{ id: 'w1', name: 'Piramida', built: true, inProgress: false }], wonderSatisfied: true, canAdvance: true, blocked: false }];
    const cfgs = [];
    for (const [pi, p] of prog.entries()) for (const [li, plan] of plans.entries()) {
      cfgs.push({ label: `p${pi}-plan${li}-gate${(pi + li) % gates.length}`, prog: p, plan, gate: gates[(pi + li) % gates.length], full: (pi + li) % 2 === 0 });
    }
    cfgs.push({ label: 'gate2-pełny', prog: prog[2], plan: plans[2], gate: gates[2], full: true, entries: [] });
    const hubOk = [];
    for (const c of cfgs) {
      const mk = (S) => S.createScienceHubHud({
        getProgress: () => c.prog, getEntries: () => c.entries ?? entries, onSelectTech: act('onSelectTech'), onOpenFullTree: act('onOpenFullTree'),
        onShowInTree: act('onShowInTree'), onOpenTreeView: c.full ? act('onOpenTreeView') : undefined, onClose: act('onClose'), isTreeOpen: () => false,
        getPlan: c.plan ? () => c.plan : undefined, onEnqueue: c.full ? act('onEnqueue') : undefined, onDequeue: c.full ? act('onDequeue') : undefined,
        onReorder: c.full ? act('onReorder') : undefined, getEraGateInfo: c.gate === undefined ? undefined : () => c.gate,
      });
      const run = (S, T) => {
        const api = mk(S);
        api.show();
        actionLog.push('open=' + S.isScienceHubHudOpen());
        const snap1 = ser(document.body);
        actionLog.push(snap1);
        // klik w wiersz odblokowany (dodaj do planu) i zablokowany (karta technologii), przycisk „Karta”, usuń z planu
        const rows = [...document.querySelectorAll('.civ-science-hub-hud .sh-item')];
        if (rows[0]) fire(rows[0], 'click');
        const lockedRow = document.querySelector('.civ-science-hub-hud .sh-item.locked');
        if (lockedRow) fire(lockedRow, 'click');
        actionLog.push('karta=' + T.isTechDiscoveryNoticeOpen());
        T.hideTechDiscoveryNotice();
        const cardBtn = document.querySelector('.civ-science-hub-hud .sh-card-btn');
        if (cardBtn) fire(cardBtn, 'click');
        actionLog.push('karta2=' + T.isTechDiscoveryNoticeOpen());
        const research = [...document.querySelectorAll('#civ-tech-discovery-notice-host button')].find((b) => /Rozpocznij badanie/.test(b.textContent));
        if (research) fire(research, 'click');
        T.hideTechDiscoveryNotice();
        rows[1]?.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        click('.civ-science-hub-hud .sh-plan-del');
        const planRow = document.querySelector('.civ-science-hub-hud .sh-plan-item');
        if (planRow) fire(planRow, 'click');
        T.hideTechDiscoveryNotice();
        click('.civ-science-hub-hud .sh-prog-target.sh-clickable');
        actionLog.push('karta3=' + T.isTechDiscoveryNoticeOpen());
        T.hideTechDiscoveryNotice();
        click('.civ-science-hub-hud .sh-tree-btn');
        api.update();
        S.refreshScienceHubIfOpen();
        click('.civ-science-hub-hud .sh-close');
        actionLog.push('po-x=' + S.isScienceHubHudOpen());
        S.toggleScienceHubHud();
        actionLog.push('toggle=' + S.isScienceHubHudOpen());
        S.showScienceHubHud();
      };
      const html = await domCase(M, `hub(${c.label})`, () => run(P, pin['ui/techDiscoveryNotice.ts']), () => run(V, v2['ui/techDiscoveryNotice.ts']), {
        cleanupPin: () => { P.destroyScienceHubHud(); pin['ui/techDiscoveryNotice.ts'].hideTechDiscoveryNotice(); },
        cleanupV2: () => { V.destroyScienceHubHud(); v2['ui/techDiscoveryNotice.ts'].hideTechDiscoveryNotice(); },
      });
      hubOk.push(html.includes('class="civ-science-hub-hud open"') && (html.includes('class="sh-item') || html.includes('class="sh-empty"')));
    }
    assertV2(M, [[`hub: panel z wierszami (.sh-item / .sh-empty) w stanie otwartym (${hubOk.filter(Boolean).length}/${hubOk.length})`, hubOk.length === cfgs.length && hubOk.every(Boolean)]]);
    assertV2(M, [['PLAN_MAX z katalogu = RESEARCH_QUEUE_MAX pinu (4 sloty planu)', catalog.constants.researchQueueMax === 4]]);
    notMeasured(M, 'przeciąganie planu (`dragstart`/`drop`, `DataTransfer`) — jsdom nie implementuje DnD; kod skopiowany bez zmian (diff)');
    notMeasured(M, 'zamknięcie kliknięciem poza panelem (`bindHudPanelOutsideDismiss`, moduł P5.1) — wspólny `document` obu stron, nie wysyłane');
  }

  // ─── raport ────────────────────────────────────────────────────────────────
  const rows = C4.map((m) => R(m));
  let totalCases = 0;
  let totalDiffs = 0;
  for (const r of rows) {
    totalCases += r.cases;
    totalDiffs += r.diffs + (r.v2AssertionsFailed ?? 0);
    const extra = [];
    if (r.v2Assertions) extra.push(`asercje_v2=${r.v2Assertions.length - r.v2AssertionsFailed}/${r.v2Assertions.length}`);
    if (r.domCases) extra.push(`DOM_puste=${r.domEmpty ?? 0}/${r.domCases}`);
    if (r.cases === 0) { extra.push('BRAK_PRZYPADKÓW'); totalDiffs++; }
    console.log(`${r.module.padEnd(34)} przypadki=${String(r.cases).padStart(5)} różnice=${r.diffs}${extra.length ? ' ' + extra.join(' ') : ''}${r.notMeasured.length ? ' NIE_ZMIERZONO=' + r.notMeasured.length : ''}`);
    for (const ex of r.examples) console.log(`   RÓŻNICA ${ex.label} @${ex.at}\n     pin: ${ex.pin}\n     v2 : ${ex.v2}`);
    for (const nm of r.notMeasured) console.log(`   NIE_ZMIERZONO: ${nm}`);
  }
  console.log(`dom-harness-c4: pin=edb8fb56 modułów=${rows.length} przypadków=${totalCases} różnic=${totalDiffs} jsdomErrors=${jsdomErrors.length} consoleErrors=${consoleErrors.length}`);
  if (jsdomErrors.length) console.log('jsdomErrors (unikalne): ' + [...new Set(jsdomErrors)].slice(0, 5).join(' | '));
  if (consoleErrors.length) console.log('consoleErrors (unikalne): ' + [...new Set(consoleErrors)].slice(0, 5).join(' | '));
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ pin: 'edb8fb56', totalCases, totalDiffs, modules: rows }, null, 2) + '\n');
  exitCode = totalDiffs === 0 ? 0 : 1;
} catch (err) {
  console.error = origError;
  console.error('dom-harness-c4: BŁĄD', err?.stack ?? err);
  exitCode = 2;
} finally {
  console.warn = origWarn;
  console.error = origError;
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
