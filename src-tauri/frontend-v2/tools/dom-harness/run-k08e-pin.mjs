#!/usr/bin/env node
/**
 * run-k08e-pin.mjs — harness WYKONUJĄCY funkcje pinu dla WSZYSTKICH 12 jednostek K08E (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1,
 * runda 2; zarzut Evaluatora: brak pin-exec dla jakiejkolwiek jednostki).
 *
 * PIN-EXEC: każda jednostka K08E z `k08e-subs.mjs` (partie magazyn, karty-a, karty-b, topbar) wykonywana z LINII PINU
 * `edb8fb56` (`gra/src/ui/cityPanel.ts`) po podstawieniach `LINE_SUBS_K08E` (ten sam `applySubsK08e`, co generator),
 * w osobnych modułach `pin-k08e-<partia>.ts` w katalogu tymczasowym (poza repo). Nagłówek importów = nagłówek partii
 * (ścieżki względne zamienione na bezwzględne do `--src`); referencje między partiami (`karty-a`/`karty-b` w `topbar`)
 * idą do modułów pin-exec, nie do portu.
 * PORT: `src/ui/cityPanel/k08e-{magazyn,karty-a,karty-b,topbar}.ts` (ten sam `--src`).
 *
 * Wspólne zależności (IDENTYCZNE dla obu stron): helpery K01/K02/K03/K05B, `k08e-deps.ts`, wiring
 * `controller/k08eWiring.ts` (testowany osobno przez run-k08e-wiring.mjs), host K05B (`setK05bHost`) i reguły K01B
 * (`ustawRegulyKontrolera`) — wejścia TESTOWE z JAWNYMI wzorami (nie reguły gry; P5.13).
 *
 * Porównanie: każdy scenariusz wykonany na obu stronach z tym samym FIX (świeży przed każdą stroną) i DOM;
 * wynik = innerHTML/outerHTML albo `THROW:<komunikat>`. Zgodność = identyczny łańcuch. Każda jednostka musi mieć
 * >=1 scenariusz BEZ wyjątku po stronie pinu (inaczej harness nie dowodzi niczego o tej jednostce).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08e-pin.mjs --pin-dir <PIN_DIR> [--src <katalog src>] [--tmp-dir <katalog>]
 * EXIT 0 <=> brak różnic i pokrycie każdej jednostki; 1 <=> >=1 różnica lub brak pokrycia; 2 <=> błąd harnessu.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import * as esbuild from 'esbuild';
import { applySubsK08e, BATCHES_K08E, codeEndLine } from './k08e-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k08e-pin.mjs --pin-dir <PIN_DIR> [--src <katalog src>] [--tmp-dir <katalog>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const CITY = join(SRC, 'ui/cityPanel');
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08e-pin-'));

const results = [];
const check = (id, what, ok, detail = '') => results.push({ id, what, ok: ok === true, detail });

/** Blok pinu: linie po podstawieniach (jak generator) + `export` na deklaracji. */
const pinBlock = (u) => {
  const end = codeEndLine(PIN_LINES, u.a, u.b);
  const lines = applySubsK08e({ a: u.a, b: u.b }, PIN_LINES.slice(u.a - 1, end));
  if (/^(function|const|type) /.test(lines[0])) lines[0] = `export ${lines[0]}`;
  return { text: lines.join('\n'), end };
};

const PIN_MOD = (file) => join(TMP, `pin-${file}`);
/** Nagłówek partii: względne importy -> bezwzględne w `--src`; importy między partiami K08E -> moduły pin-exec. */
const rewriteHeader = (batch) =>
  batch.imports.replace(/from '(\.[^']+)'/g, (m, p) => {
    const sib = p.match(/^\.\/(k08e-(?:karty-a|karty-b|magazyn|topbar))$/);
    if (sib) return `from ${JSON.stringify(PIN_MOD(`${sib[1]}.ts`))}`;
    return `from ${JSON.stringify(join(CITY, p))}`;
  });

for (const b of BATCHES_K08E) {
  const blocks = b.units.map((u) => {
    const { text, end } = pinBlock(u);
    const okStart = PIN_LINES[u.a - 1]?.includes(`function ${u.name}(`) ?? false;
    const okEnd = PIN_LINES[end - 1] === '}';
    check(`pin.range.${u.name}`, `zakres pinu ${u.a}-${end} (${u.name})`, okStart && okEnd);
    return `// pin edb8fb56 gra/src/ui/cityPanel.ts:${u.a}-${end}\n${text}\n// pin-end`;
  });
  writeFileSync(PIN_MOD(b.file), [rewriteHeader(b), '', ...blocks, ''].join('\n'));
}

/* Kotwice treści pinu (literały w cytowanych zakresach). */
const PIN_ANCHORS = [
  ['renderMagazyn', 'Wyżywienie i wzrost'],
  ['buildTopBarLudnoscDetailCard', 'cityId === String(city.id)'],
  ['buildPorzadekDetailCard', 'Porządek — szczegóły'],
  ['capitalBadgeOrButtonHtml', '★ Stolica'],
  ['wireTopBarStatDetails', 'orderResolved.state.porPct != null'],
];
for (const [name, lit] of PIN_ANCHORS) {
  const u = BATCHES_K08E.flatMap((b) => b.units).find((x) => x.name === name);
  check(`pin.anchor.${name}`, `kotwica „${lit}” w pinie ${u.a}-${u.b}`, pinBlock(u).text.includes(lit));
}

/* Wejścia testowe (JAWNE wzory; nie dane gry). */
const CITY_A = { id: 7, ownerId: 0, name: 'Alfa', population: 6, q: 1, r: 2, autoWyzywienie: false, oblegane: false };
const CITY_B = { id: 8, ownerId: 0, name: 'Beta', population: 4, q: 3, r: 4, autoWyzywienie: true, oblegane: false };
const CITY_C = { id: 9, ownerId: 1, name: 'Gamma', population: 2, q: 5, r: 6, autoWyzywienie: false, oblegane: false };
const K01B_SAMPLE = {
  rationGrowthPercent: (level) => ({ 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 })[Math.round(level)] ?? 0,
  growthGainPerTurnSlots: (pop, pct, fed, cap) => (fed && !cap ? Math.max(1, Math.round((pop * pct) / 100)) : 0),
  turnsUntilNextCitizen: (frac, gain) => (gain > 0 ? Math.ceil((1 - frac) / gain) : null),
  rationFoodCostPerPop: (level) => 1 + level * 0.5,
};
const VIEW = {
  praca: 40, pieniadz: 5, nauka: 3, kultura: 2, zywnoscNetto: 2, zywnoscBrutto: 8, kosztRacji: 6, bilansLokalny: 2,
  poziomRacji: 3, wzrostProcent: 4, wzrostUlamkowy: 0.4, handelBrutto: 30, handelNetto: 20,
  growthBreakdown: { total: 4, racje: 2, maleMiasto: 1, spichlerz: 0, zdrowie: 0, szczescie: 1, cywilizacja: 0, zaopatrzenie: 0 },
  maSpichlerz: false, maAkwedukt: false, popCapBezAkweduktu: 5, popCapSpichlerz: 8, popCapZAkweduktem: 12, popCapAktualny: 8,
  atPopCap: false,
  citizenUpkeep: { pokrycie: 1, potrzeba: 0, dostepne: 0, brak: 0 },
};
const EMPIRE = { nauka: 5, kulturaRate: 2, praca: 40, pieniadz: 9, zywnosc: 10, rekruci: 4, zloto: 20, religia: 2 };
const TICK = {
  perCityRows: [{ cityId: '7', nakarmione: true, zywnosc: 3 }, { cityId: '8', nakarmione: false, zywnosc: -1 }],
  total: 2, deficit: 0, surplus: 2,
};
const STATE = { poziom: 3, autoWyzywienie: false, maxSafe: 4 };
const MP = { regenPerTurn: 2, werbMaxPrzyPelnejPuli: 10, ludnoscAbsolutna: 500, ludki: 80, pula: 40, limit: 60 };
const MAP = { tiles: [], width: 10, height: 10 };
const DATA = { buildings: [], units: [], econParams: { difficulty: 'normal' } };
const CFG_BASE = {
  getEpoch: () => 3,
  difficulty: 'normal',
  getCities: () => [CITY_A, CITY_B],
  getBuiltBuildingIds: () => ['targowisko'],
  getCapitalCityId: () => 7,
  getEmpireFoodState: (o) => (o === 0 ? STATE : null),
  getEmpireFoodTick: (o) => (o === 0 ? TICK : null),
  getMaxSafePoziomRacji: () => 2,
  getCachedMaxSafePoziomRacji: () => 4,
  getPoziomRacjiOverride: () => null,
  getGameData: () => DATA,
  getManpowerSnapshot: () => MP,
  getOrderState: () => FIX_ORDER(),
  getCultureState: () => ({ thresholds: [], kulturaMix: [], kulturaSuma: 12, zrodla: [] }),
  getUnitsAt: () => [],
  onSetCapital: () => undefined,
  onCityRationChange: () => undefined,
  onCityAutoWyzywienieChange: () => undefined,
  onPoziomRacjiOverrideToggle: () => undefined,
};
const FIX_ORDER = () => ({ szczescie: 60, porzadek: 12, porPct: 62, szPct: 60, prawPct: 40, szMax: 100, prawMax: 30, bandLabel: 'Napięcie', szLines: [], prawLines: [], revoltWarning: false, revoltGraceRemaining: null, rebelState: false });

/* Katalog statyczny (ZAŁOŻENIE P5.2-Z1): instalowany PRZED ewaluacją modułów (osobny moduł importowany jako pierwszy). */
const setupPath = join(TMP, 'setup.ts');
writeFileSync(
  setupPath,
  [
    `import { installStaticCatalog } from ${JSON.stringify(join(SRC, 'controller/staticCatalog.ts'))};`,
    `import { MOCK_STATIC_CATALOG } from ${JSON.stringify(join(SRC, 'controller/mockCatalog.ts'))};`,
    'installStaticCatalog(MOCK_STATIC_CATALOG);',
    '',
  ].join('\n'),
);
const entry = join(TMP, 'entry.ts');
const P = (rel) => JSON.stringify(join(CITY, rel));
writeFileSync(
  entry,
  [
    `import ${JSON.stringify(setupPath)};`,
    `import { setK06bDeps } from ${P('k06b-deps.ts')};`,
    `import { setK05aCfg } from ${P('k05a-fundament.ts')};`,
    `import { cityPanelChipIconWrap as chipIconWrap } from ${P('k01a-fundament.ts')};`,
    `import { setK08dDeps } from ${P('k08d-deps.ts')};`,
    `import { installK08dWiring } from ${JSON.stringify(join(SRC, 'controller/k08dWiring.ts'))};`,
    `import { setK05bHost } from ${P('k05b-host.ts')};`,
    `import { ustawRegulyKontrolera } from ${P('k01b-reguly.ts')};`,
    `import { installK08eWiring } from ${JSON.stringify(join(SRC, 'controller/k08eWiring.ts'))};`,
    `import * as pinA from ${JSON.stringify(PIN_MOD('k08e-karty-a.ts'))};`,
    `import * as pinB from ${JSON.stringify(PIN_MOD('k08e-karty-b.ts'))};`,
    `import * as pinM from ${JSON.stringify(PIN_MOD('k08e-magazyn.ts'))};`,
    `import * as pinT from ${JSON.stringify(PIN_MOD('k08e-topbar.ts'))};`,
    `import * as portA from ${P('k08e-karty-a.ts')};`,
    `import * as portB from ${P('k08e-karty-b.ts')};`,
    `import * as portM from ${P('k08e-magazyn.ts')};`,
    `import * as portT from ${P('k08e-topbar.ts')};`,
    '// FIX: jedyne źródło wejść (cfg K05B, reguły K01B). Scenariusze go mutują; resetFix() przywraca stan bazowy.',
    'export const FIX: { cfg: Record<string, any>; k01b: Record<string, (...a: any[]) => any>; order: (c: any) => any; health: (c: any) => any } = {',
    '  cfg: {},',
    '  k01b: {},',
    '  order: (_c: any) => ({ szczescie: 60, porzadek: 12, porPct: 62, szPct: 60, prawPct: 40, szMax: 100, prawMax: 30, bandLabel: "Napięcie", szLines: [], prawLines: [], revoltWarning: false, revoltGraceRemaining: null, rebelState: false }),',
    '  health: (_c: any) => ({ total: 3, lines: [{ label: "Głód", value: -1 }], fromEngine: true }),',
    '  empire: (): any => ({}),',
    '};',
    'setK05bHost({',
    '  cfg: new Proxy({}, { get: (_t, k) => FIX.cfg[k as string] }),',
    '  readPodzialHandlu: (_c: any, _d: any) => ({ procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 }),',
    '  isMeCity: (o: number) => o === 0,',
    '  adjustHandelSplit: (s: any) => s,',
    '  freshWealthState: () => ({ poziom: 0, pula: 0 }),',
    '  stockResourceLabel: (k: string) => k,',
    '  rerender: () => undefined,',
    '  rules: new Proxy({ formatManpower: (n: number) => String(n) }, { get: (t, k) => (t as any)[k as string] ?? ((..._a: any[]) => { throw new Error(`stub-host:${String(k)}`); }) }),',
    '} as any);',
    '// K05A: cfg dla gameData() (pin: gameData() = cfg.getGameData?.(); K08E-Z7). Ten sam FIX co K05B.',
    'setK05aCfg(new Proxy({}, { get: (_t, k) => FIX.cfg[k as string] }) as any);',
    '// K06B: wartości i delegaty dla renderCivResourceTopBar / wireTopBarStatDetails (K06B-Z2/Z4).',
    'setK06bDeps({ cfg: new Proxy({}, { get: (_t, k) => FIX.cfg[k as string] }), resolveEmpireSnap: () => FIX.empire(), cityPanelChipIconWrap: (id: string, size?: number) => chipIconWrap(id, size as any), attachInteractiveDetail: () => undefined, showPinnedDetail: () => undefined, el: (tag: string, cls?: string, html?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; } });',
    '// K08D: delegaty dla karty Nauka i paska (wiring K08D testowany w run-k08d-wiring.mjs; tu wejścia testowe).',
    'installK08dWiring({',
    '  mennicaGate: () => ({ maMennicaBudynek: false, mennicaAktywna: false, mennicaSpiZBrakuZlota: false }),',
    '  buildEconParams: () => ({}),',
    '  cityHasBibliotekaLine: (b: readonly string[]) => b.includes("biblioteka"),',
    '  mnoznikHandelPieniadzForCivByDifficulty: (_k: any, _c: any, _d: string, fb: number) => fb,',
    '  computeTradeRouteBuildingBonusByCity: () => new Map<number, number>(),',
    '  religiaSzPunkty: () => 0,',
    '  religiaXRelTop: () => 0,',
    '} as any);',
    'ustawRegulyKontrolera(new Proxy({}, { get: (_t, k) => (...a: any[]) => { const f = FIX.k01b[k as string]; if (!f) throw new TypeError(`stub-k01b:${String(k)}`); return f(...a); } }) as any);',
    'installK08eWiring({',
    '  buildRationParams: (_e: unknown, d: string) => ({ korupcjaWspolczynnikDystansu: 0.1, korupcjaWspolczynnikMiast: 0.05, korupcjaCap: d === "normal" ? 0.3 : 0.5, mennicaMnoznikPoWalucie: 2 } as any),',
    '  cityLudnoscAbsolutna: (p: number, e: number) => p * (e + 1),',
    '  resolveOrderState: (c: any) => ({ state: FIX.order(c), fromEngine: true }),',
    '  switchCity: () => undefined,',
    '  resolveCityHealth: (c: any) => FIX.health(c),',
    '  porPctBand: (por: number) => (por >= 90 ? "lad" : por >= 70 ? "spokoj" : por >= 50 ? "napiecie" : por >= 30 ? "niepokoj" : por >= 10 ? "bunt" : "bunt_skrajny"),',
    '  porBandLabel: (band: string) => ({ lad: "Ład", spokoj: "Spokój", napiecie: "Napięcie", niepokoj: "Niepokój", bunt: "Bunt", bunt_skrajny: "Bunt skrajny" } as Record<string, string>)[band] ?? band,',
    '  ownerCities: (c: any) => (FIX.cfg.getCities?.() ?? []).filter((x: any) => x.ownerId === c.ownerId),',
    '  cityPanelTitle: (c: any) => `Miasto ${c.id}`,',
    '  buildCityOnlyW3FlankChips: () => ({ left: "L", right: "R" }),',
    '});',
    'export const PIN = {',
    '  renderMagazyn: pinM.renderMagazyn, buildGrowthProgressTooltipCard: pinM.buildGrowthProgressTooltipCard, buildRacjeWzrostDetailCard: pinM.buildRacjeWzrostDetailCard,',
    '  buildTopBarZywnoscDetailCard: pinA.buildTopBarZywnoscDetailCard, buildTopBarRekruciDetailCard: pinA.buildTopBarRekruciDetailCard, buildTopBarLudnoscDetailCard: pinA.buildTopBarLudnoscDetailCard,',
    '  buildTopBarNaukaDetailCard: pinB.buildTopBarNaukaDetailCard, buildTopBarKulturaDetailCard: pinB.buildTopBarKulturaDetailCard, buildPorzadekDetailCard: pinB.buildPorzadekDetailCard,',
    '  capitalBadgeOrButtonHtml: pinT.capitalBadgeOrButtonHtml, renderCivResourceTopBar: pinT.renderCivResourceTopBar, wireTopBarStatDetails: pinT.wireTopBarStatDetails,',
    '};',
    'export const PORT = {',
    '  renderMagazyn: portM.renderMagazyn, buildGrowthProgressTooltipCard: portM.buildGrowthProgressTooltipCard, buildRacjeWzrostDetailCard: portM.buildRacjeWzrostDetailCard,',
    '  buildTopBarZywnoscDetailCard: portA.buildTopBarZywnoscDetailCard, buildTopBarRekruciDetailCard: portA.buildTopBarRekruciDetailCard, buildTopBarLudnoscDetailCard: portA.buildTopBarLudnoscDetailCard,',
    '  buildTopBarNaukaDetailCard: portB.buildTopBarNaukaDetailCard, buildTopBarKulturaDetailCard: portB.buildTopBarKulturaDetailCard, buildPorzadekDetailCard: portB.buildPorzadekDetailCard,',
    '  capitalBadgeOrButtonHtml: portT.capitalBadgeOrButtonHtml, renderCivResourceTopBar: portT.renderCivResourceTopBar, wireTopBarStatDetails: portT.wireTopBarStatDetails,',
    '};',
    `export const CITIES: Record<string, any> = { a: ${JSON.stringify(CITY_A)}, b: ${JSON.stringify(CITY_B)}, c: ${JSON.stringify(CITY_C)} };`,
    '',
  ].join('\n'),
);

const out = join(TMP, 'bundle.mjs');
let mod;
try {
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: out,
    logLevel: 'silent',
    plugins: [
      {
        name: 'raw-svg',
        setup(b) {
          b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: resolve(dirname(a.importer), a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
          b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: `export default ${JSON.stringify(readFileSync(a.path, 'utf8'))};`, loader: 'js' }));
          b.onLoad({ filter: /\.ts$/ }, (a) => {
            if (!a.path.startsWith(SRC + '/')) return undefined;
            const src = readFileSync(a.path, 'utf8');
            if (!src.includes('import.meta.glob(')) return undefined;
            return { contents: src.split('import.meta.glob(').join('((..._g: any[]) => ({} as Record<string, any>))('), loader: 'ts' };
          });
        },
      },
    ],
  });
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.HTMLInputElement = dom.window.HTMLInputElement;
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
  globalThis.Node = dom.window.Node;
  globalThis.Element = dom.window.Element;
  globalThis.Event = dom.window.Event;
  globalThis.MouseEvent = dom.window.MouseEvent;
  mod = await import(pathToFileURL(out).href);
  const doc = dom.window.document;

  const resetFix = (extra = {}) => {
    for (const k of Object.keys(mod.FIX.cfg)) delete mod.FIX.cfg[k];
    Object.assign(mod.FIX.cfg, CFG_BASE, extra);
    mod.FIX.k01b = K01B_SAMPLE;
    mod.FIX.empire = () => EMPIRE;
  };
  const mounts = [];
  const mount = () => {
    // Czyść dokument przed każdą montażą: zduplikowane id (#civ-v-garrison-row) psuje querySelector w jsdom/nwsapi.
    for (const x of mounts.splice(0)) x.remove();
    const d = doc.createElement('div');
    doc.body.appendChild(d);
    mounts.push(d);
    return d;
  };
  const safe = async (f) => {
    try {
      return await f();
    } catch (e) {
      return `THROW:${e && e.message}`;
    }
  };
  const inner = (el) => el.innerHTML;
  const outer = (el) => el.outerHTML;

  /** Scenariusze: [jednostka, id, extraCfg, wywołanie(F) -> string]. */
  const SCEN = [
    ['renderMagazyn', 'magazyn.view', {}, (F) => { const m = mount(); F.renderMagazyn(m, CITY_A, VIEW); return inner(m); }],
    ['renderMagazyn', 'magazyn.noView', {}, (F) => { const m = mount(); F.renderMagazyn(m, CITY_B, null); return inner(m); }],
    // Szczegóły sekcji (lazy: attachInteractiveDetail -> mouseenter + 220 ms -> buildContent): pin i port buduja te sama karte.
    ['renderMagazyn', 'magazyn.detailHover', {}, async (F) => { const m = mount(); F.renderMagazyn(m, CITY_A, VIEW); const link = m.querySelector('.civ-w4-panel-detail'); if (!link) return 'NO-LINK'; link.dispatchEvent(new doc.defaultView.MouseEvent('mouseenter')); await new Promise((r) => setTimeout(r, 260)); const card = doc.querySelector('.detail-card'); return card ? outer(card) : 'NO-CARD'; }],
    ['renderMagazyn', 'magazyn.noFoodTick', { getEmpireFoodTick: () => null }, (F) => { const m = mount(); F.renderMagazyn(m, CITY_A, VIEW); return inner(m); }],
    ['buildGrowthProgressTooltipCard', 'growth.fedNoCap', {}, (F) => outer(F.buildGrowthProgressTooltipCard(6, VIEW, 3, true, false))],
    ['buildGrowthProgressTooltipCard', 'growth.capOverride', {}, (F) => outer(F.buildGrowthProgressTooltipCard(6, VIEW, 3, false, true, 7))],
    ['buildRacjeWzrostDetailCard', 'racje.full', {}, (F) => outer(F.buildRacjeWzrostDetailCard(CITY_A, VIEW, STATE, TICK, DATA))],
    ['buildRacjeWzrostDetailCard', 'racje.nullInputs', {}, (F) => outer(F.buildRacjeWzrostDetailCard(CITY_B, VIEW, null, null, null))],
    ['buildTopBarZywnoscDetailCard', 'zywnosc.full', {}, (F) => outer(F.buildTopBarZywnoscDetailCard(CITY_A, VIEW, EMPIRE, DATA))],
    ['buildTopBarZywnoscDetailCard', 'zywnosc.nullTick', { getEmpireFoodTick: () => null }, (F) => outer(F.buildTopBarZywnoscDetailCard(CITY_B, VIEW, EMPIRE, null))],
    ['buildTopBarRekruciDetailCard', 'rekruci.mp', {}, (F) => outer(F.buildTopBarRekruciDetailCard(CITY_A, MP))],
    ['buildTopBarLudnoscDetailCard', 'ludnosc.full', {}, (F) => outer(F.buildTopBarLudnoscDetailCard(CITY_A, VIEW, DATA, MAP))],
    ['buildTopBarLudnoscDetailCard', 'ludnosc.nullView', {}, (F) => outer(F.buildTopBarLudnoscDetailCard(CITY_B, null, null, null))],
    ['buildTopBarNaukaDetailCard', 'nauka.full', {}, (F) => outer(F.buildTopBarNaukaDetailCard(CITY_A, VIEW, EMPIRE, DATA))],
    ['buildTopBarKulturaDetailCard', 'kultura.full', {}, (F) => outer(F.buildTopBarKulturaDetailCard(CITY_A, VIEW, EMPIRE))],
    ['buildPorzadekDetailCard', 'porzadek.band', {}, (F) => outer(F.buildPorzadekDetailCard(CITY_A, FIX_ORDER()))],
    ['buildPorzadekDetailCard', 'porzadek.revolt', {}, (F) => outer(F.buildPorzadekDetailCard(CITY_B, { ...FIX_ORDER(), revoltWarning: true, revoltGraceRemaining: 2, rebelState: true }))],
    // Granica pasma (69 -> 70 = „Spokój"): mutant porPctBand(por + 1) musi zmienić etykietę.
    ['buildPorzadekDetailCard', 'porzadek.edge69', {}, (F) => outer(F.buildPorzadekDetailCard(CITY_A, { ...FIX_ORDER(), porPct: 69, bandLabel: undefined }))],
    ['capitalBadgeOrButtonHtml', 'capital.isCapital', {}, (F) => F.capitalBadgeOrButtonHtml(CITY_A)],
    ['capitalBadgeOrButtonHtml', 'capital.setButton', { getCapitalCityId: () => 9 }, (F) => F.capitalBadgeOrButtonHtml(CITY_B)],
    ['capitalBadgeOrButtonHtml', 'capital.foreign', {}, (F) => F.capitalBadgeOrButtonHtml(CITY_C)],
    ['renderCivResourceTopBar', 'topbar.full', {}, (F) => { const m = mount(); F.renderCivResourceTopBar(m, CITY_A, VIEW, MAP, DATA); return inner(m); }],
    ['renderCivResourceTopBar', 'topbar.nullView', {}, (F) => { const m = mount(); F.renderCivResourceTopBar(m, CITY_B, null, null, null); return inner(m); }],
    ['wireTopBarStatDetails', 'wire.full', {}, (F) => { const m = mount(); F.renderCivResourceTopBar(m, CITY_A, VIEW, MAP, DATA); F.wireTopBarStatDetails(m, CITY_A, VIEW, MAP, DATA); return inner(m); }],
    ['wireTopBarStatDetails', 'wire.nullData', {}, (F) => { const m = mount(); F.renderCivResourceTopBar(m, CITY_B, VIEW, MAP, null); F.wireTopBarStatDetails(m, CITY_B, VIEW, MAP, null); return inner(m); }],
  ];

  for (const u of BATCHES_K08E.flatMap((b) => b.units)) {
    const rows = SCEN.filter((s) => s[0] === u.name);
    let covered = 0;
    for (const [, id, extra, call] of rows) {
      resetFix(extra);
      const pinOut = await safe(() => call(mod.PIN));
      resetFix(extra);
      const portOut = await safe(() => call(mod.PORT));
      const pinOk = !pinOut.startsWith('THROW:');
      if (pinOk) covered += 1;
      let at = 0;
      while (at < Math.min(pinOut.length, portOut.length) && pinOut[at] === portOut[at]) at += 1;
      const diff = portOut === pinOut ? '' : `@${at} pin=…${pinOut.slice(Math.max(0, at - 60), at + 80)} | port=…${portOut.slice(Math.max(0, at - 60), at + 80)}`;
      check(`exec.${id}`, `pin-exec vs port: ${id} (${pinOk ? `${pinOut.length} znaków` : pinOut.slice(0, 80)})${diff ? ` RÓŻNICA ${diff}` : ''}`, portOut === pinOut);
    }
    check(`cover.${u.name}`, `${u.name}: >=1 scenariusz bez wyjątku po stronie pinu (${covered}/${rows.length})`, covered >= 1);
  }
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  rmSync(TMP, { recursive: true, force: true });
  process.exit(2);
}
rmSync(TMP, { recursive: true, force: true });

const fails = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.what}`);
console.log(`\nk08e-pin: ${results.length - fails.length}/${results.length} zgodnych`);
process.exit(fails.length === 0 ? 0 : 1);
