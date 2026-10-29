#!/usr/bin/env node
/**
 * run-k09b-wiring.mjs — TEST WYKONANIA punktu instalacji panelu miasta `controller/cityPanelWiring.ts` (P5-8,
 * R-RUSTPORT-P5-8-CITYPANEL-K09B-Q1, runda 1) oraz adaptera id `controller/cityIdAdapter.ts` (zadanie (2)).
 *
 * Sekcje:
 *   A  adapter id (granice): toEngineCityId / cityIdFromEngine / engineIdHook — czysta logika, bez DOM.
 *   W  instalacja w jsdom, pełna ścieżka: przed `installCityPanelWiring` → `showCityPanel` rzuca `brak setK09aDeps`;
 *      po instalacji → `showCityPanel` → (ramka → most → `paintCityPanelSections`) → `hideCityPanel` bez wyjątku,
 *      bez tekstu `undefined` w DOM, z zapisanym miastem i mapą w stanie K06A; brak `brak delegatu`.
 *   R  rejestracja mostu: po instalacji `cityPanelUxBridge` ma implementację (malowanie wypełnia korzeń ramki);
 *      `cityPanelUxImpl` rzuca przy `activeMap === null` (brak cichej wartości).
 *   O  kolejność: `requireK08aDeps().rerender()` = jednostka K09A (nadpisanie wartości K08C, zadanie (1) krok 6).
 *
 * Fikstury (tylko harness, nie produkcja): wejścia hosta są stałymi zwracającymi wartości neutralne; wywołania reguł
 * są liczone (`ruleCalls`) i raportowane, żeby było widać, które reguły realnie wykonała ścieżka pokazu.
 *
 * Użycie (z `src-tauri/frontend-v2/`): node tools/dom-harness/run-k09b-wiring.mjs [--src <katalog src>] [--tmp-dir <katalog>]
 * EXIT 0 <=> wszystkie checki OK; 1 <=> >=1 FAIL; 2 <=> błąd harnessu.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const CITY = join(SRC, 'ui/cityPanel');
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k09b-wiring-'));
const results = [];
const check = (id, what, ok, detail = '') => results.push({ id, what, ok: ok === true, detail });

// Katalog statyczny (ZAŁOŻENIE P5.2-Z1) instalowany PRZED ewaluacją modułów paneli.
const setupPath = join(TMP, 'setup.ts');
writeFileSync(setupPath, [`import { installStaticCatalog } from ${JSON.stringify(join(SRC, 'controller/staticCatalog.ts'))};`, `import { MOCK_STATIC_CATALOG } from ${JSON.stringify(join(SRC, 'controller/mockCatalog.ts'))};`, 'installStaticCatalog(MOCK_STATIC_CATALOG);', ''].join('\n'));
const entry = join(TMP, 'entry.ts');
const P = (rel) => JSON.stringify(join(CITY, rel));
writeFileSync(
  entry,
  [
    `import ${JSON.stringify(setupPath)};`,
    `import * as ADAPTER from ${JSON.stringify(join(SRC, 'controller/cityIdAdapter.ts'))};`,
    `import * as WIRING from ${JSON.stringify(join(SRC, 'controller/cityPanelWiring.ts'))};`,
    `import * as BR from ${JSON.stringify(join(SRC, 'ui/cityPanelUxBridge.ts'))};`,
    `import * as PAINT from ${P('k09a-paint.ts')};`,
    `import { requireK09aDeps } from ${P('k09a-deps.ts')};`,
    `import { requireK08aDeps } from ${P('k08a-fundament.ts')};`,
    `import { getK06aState, setK06aActive, setK06aPinnedGarrisonCityId } from ${P("k06a-fundament.ts")};`,
    `import { getK06bRootEl, setK06bRootEl } from ${P('k06b-garnizon.ts')};`,
    `import { setK06bDeps } from ${P('k06b-deps.ts')};`,
    `import * as HOVER from ${JSON.stringify(join(SRC, 'ui/hoverDetailDock.ts'))};`,
    `import { isCityUxFrameOpen } from ${JSON.stringify(join(SRC, 'ui/cityUxFrame.ts'))};`,
    `import * as K05B from ${P('k05b-host.ts')};`,
    `import * as K08D from ${P('k08d-deps.ts')};`,
    `import * as K08E from ${P('k08e-deps.ts')};`,
    `import { dep as depK07b } from ${P('k07b-deps.ts')};`,
    '// Wejścia testowe: stan modułów K06A/K06B/K07A i pomocnicze DOM (bez reguł gry).',
    'export { ADAPTER, WIRING, BR, PAINT, requireK09aDeps, requireK08aDeps, getK06aState, setK06aActive, setK06aPinnedGarrisonCityId, getK06bRootEl, setK06bRootEl, setK06bDeps, HOVER, isCityUxFrameOpen, K05B, K08D, K08E, depK07b };',
    '',
  ].join('\n'),
);

const out = join(TMP, 'bundle.mjs');
let W;
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
  globalThis.KeyboardEvent = dom.window.KeyboardEvent;
  W = await import(pathToFileURL(out).href);

  const errOf = (f) => {
    try {
      f();
      return null;
    } catch (e) {
      return e && e.message;
    }
  };

  // ── A: adapter id (granice) ─────────────────────────────────────────────────────────────────────────────────────
  const { ADAPTER: A } = W;
  const okPort = [0, 1, 7, 1234567].every((n) => A.toEngineCityId(n) === String(n));
  check('A1', 'toEngineCityId: liczby kanoniczne (0, 1, 7, 1234567) → ciągi', okPort);
  const badPort = [-1, 1.5, NaN, Infinity, 2 ** 53, '7'];
  const rejPort = badPort.map((v) => errOf(() => A.cityIdToEngine(v)));
  check('A2', 'cityIdToEngine odrzuca -1, 1.5, NaN, Infinity, 2^53 i ciąg „7” (wyjątek, nie cicha konwersja)', rejPort.every((m) => typeof m === 'string' && m.includes('cityIdAdapter')), JSON.stringify(rejPort));
  check('A3', 'cityIdFromEngine(„123”) = 123', A.cityIdFromEngine('123') === 123);
  const badEng = ['', '01', '1.0', '-1', '1e3', ' 1', 'bc_1', '9007199254740993', '0123'];
  const rejEng = badEng.map((v) => errOf(() => A.cityIdFromEngine(v)));
  check('A4', 'cityIdFromEngine odrzuca ciągi niekanoniczne i poza zakresem (9 przypadków)', rejEng.every((m) => typeof m === 'string' && m.includes('cityIdAdapter')), JSON.stringify(rejEng.map((m) => (m ? 'err' : 'ok'))));
  check('A5', 'toEngineCityId(„0”) = „0” (zero kanoniczne) i toEngineCityId(„42”) = „42”', A.toEngineCityId('0') === '0' && A.toEngineCityId('42') === '42');
  check('A6', 'toEngineCityId(„01”) rzuca (ciąg niekanoniczny)', typeof errOf(() => A.toEngineCityId('01')) === 'string');
  const seen = [];
  const hooked = A.engineIdHook((id, x) => { seen.push([typeof id, id, x]); return 'r'; });
  const hookOut = hooked(9, 'k');
  check('A7', 'engineIdHook: port number 9 → silnik „9”, argumenty dalej bez zmian, wynik zachowany', hookOut === 'r' && seen.length === 1 && seen[0][0] === 'string' && seen[0][1] === '9' && seen[0][2] === 'k', JSON.stringify(seen));
  check('A8', 'engineIdHook(undefined) = undefined (brak haku zostaje brakiem)', A.engineIdHook(undefined) === undefined);
  const hookStr = A.engineIdHook((id) => `got:${id}`);
  const hookBad = errOf(() => hookStr('01'));
  check('A9', 'engineIdHook przepuszcza tylko kanoniczne id (’01’ rzuca, nie trafia do silnika)', typeof hookBad === 'string' && hookBad.includes('cityIdAdapter') && hookStr(12) === 'got:12');

  // ── Dane wejściowe (fikstury hosta) ─────────────────────────────────────────────────────────────────────────────
  const city = { id: 7, owner: 0, ownerId: 0, q: 0, r: 0, name: 'Alfa', mapLabel: 'Alfa', population: 6, isCapital: true, isMine: true };
  const map = { tiles: [], width: 1, height: 1 };
  const ruleCalls = {};
  // Reguły: fikstura zwracająca wartość neutralną; każde wywołanie liczone po nazwie.
  const neutral = (name, value) => (...a) => { ruleCalls[name] = (ruleCalls[name] ?? 0) + 1; return typeof value === 'function' ? value(...a) : value; };
  // Metody interfejsu K05bRules wyciągnięte ze źródła (bez ręcznej listy — zmiana interfejsu łamie harness, nie cicho).
  const k05bSrc = readFileSync(join(CITY, 'k05b-host.ts'), 'utf8');
  const k05bBody = k05bSrc.slice(k05bSrc.indexOf('export interface K05bRules {'));
  const k05bMethods = [...k05bBody.slice(0, k05bBody.indexOf('\n}\n')).matchAll(/^ {2}(\w+)\s*\(/gm)].map((m) => m[1]);
  const rules = {};
  for (const m of k05bMethods) rules[m] = neutral(m, null);
  rules.etaTurns = neutral('etaTurns', null);
  rules.formatManpower = neutral('formatManpower', (n) => String(n));
  const hostCfg = {
    difficulty: 'normal',
    getCities: () => [city],
    getBuiltBuildingIds: () => [],
    getTreasury: () => 0,
    getEpoch: () => 0,
    getTradeRoutes: () => [],
    getUnlockedTechs: () => [],
    getUnitsAt: () => [],
    getWorkedTiles: () => [],
  };
  const k08c = {
    rerender: neutral('k08c.rerender', undefined),
    cfg: hostCfg,
    engineSuwaakPracaBudynki: () => null,
    splitPraca: (praca) => ({ praca, pieniadz: 0, nauka: 0, kultura: 0, zywnosc: 0 }),
    computeView: () => null,
    readPodzialHandlu: () => ({ kryteria: {} }),
    isMeCity: () => true,
    adjustHandelSplit: (s) => s,
    freshWealthState: () => ({ poziom: 0, pula: 0 }),
    stockResourceLabel: (k) => k,
    getEmpireHud: () => undefined,
    rules,
  };
  const k07bCfg = { getOrderState: () => undefined, getReligionState: () => undefined };
  const k07b = {
    getCities: () => [city],
    getCapitalCityId: () => '7',
    canSetCapital: false,
    cfg: k07bCfg,
    gameData: () => null,
    activeMap: () => null,
  };
  const k08d = {
    mennicaGate: () => ({ maMennicaBudynek: false, maDostepDoZlota: false, mennicaAktywna: false, mennicaSpiZBrakuZlota: false }),
    religiaSzPunkty: neutral('religiaSzPunkty', 0),
    religiaXRelTop: neutral('religiaXRelTop', 0),
    buildEconParams: neutral('buildEconParams', () => ({})),
    cityHasBibliotekaLine: neutral('cityHasBibliotekaLine', false),
    mnoznikHandelPieniadzForCivByDifficulty: neutral('mnoznikHandel', 1),
    computeTradeRouteBuildingBonusByCity: neutral('computeTradeRouteBonus', () => new Map()),
    loadWealthParams: neutral('loadWealthParams', () => ({})),
    wealthCap: neutral('wealthCap', 0),
    wealthProg: neutral('wealthProg', 0),
    wealthMnoznik: neutral('wealthMnoznik', 1),
    wealthZadowolenie: neutral('wealthZadowolenie', 0),
    wealthRownowaga: neutral('wealthRownowaga', 0),
  };
  const k08e = {
    buildRationParams: neutral('buildRationParams', () => ({})),
    cityLudnoscAbsolutna: neutral('cityLudnoscAbsolutna', (p) => p),
    resolveOrderState: neutral('resolveOrderState', () => ({ state: {}, fromEngine: false })),
    switchCity: neutral('switchCity', undefined),
    resolveCityHealth: neutral('resolveCityHealth', () => ({ total: 0, lines: [], fromEngine: false })),
    porPctBand: neutral('porPctBand', 'srodek'),
    porBandLabel: neutral('porBandLabel', 'Srodek'),
    ownerCities: neutral('ownerCities', () => [city]),
    cityPanelTitle: neutral('cityPanelTitle', 'Alfa'),
    buildCityOnlyW3FlankChips: neutral('buildCityOnlyW3FlankChips', () => []),
  };
  const switched = [];
  const switchedDirs = [];
  const host = {
    k08c,
    k07b,
    k06a: {
      queries: { getOrderState: () => ({ szPct: 0, porPct: 0, revoltWarning: false }), getCities: () => [] },
      ui: {
        cityPanelChipIconWrap: () => '',
        tileYield: () => ({ praca: 0, pieniadz: 0, nauka: 0, kultura: 0, zywnosc: 0 }),
        formatCityMapLabel: (c) => c.name,
        axialToWorld: (q, r) => ({ x: q, z: r }),
        cityTabs: () => [],
        activeDrawerTab: () => 'budowa',
        cityTabIconHtml: () => '',
        switchCity: (dir) => switchedDirs.push(dir),
      },
    },
    k08d,
    k08e,
    k09a: { onSwitchCity: (id) => switched.push(id) },
  };

  // ── W0: przed instalacją pokaz rzuca głośno (nie cichy brak efektu) ───────────────────────────────────────────
  const root = document.createElement('div');
  document.body.appendChild(root);
  W.setK06bRootEl(root);
  const pre = errOf(() => W.PAINT.showCityPanel(city, map, () => undefined));
  check('W0', 'przed installCityPanelWiring showCityPanel rzuca „K09A: brak setK09aDeps”', typeof pre === 'string' && pre.includes('brak setK09aDeps'), String(pre));

  // ── I: instalacja ───────────────────────────────────────────────────────────────────────────────────────────────
  let inst;
  const instErr = errOf(() => { inst = W.WIRING.installCityPanelWiring(host); });
  check('I1', 'installCityPanelWiring(host) wykonuje się bez wyjątku', instErr === null, String(instErr));
  check('I2', 'wynik zawiera listy atrap (k08cStubbed = 5 nazw K08C-Z5, k07bMissing tablica)',
    instErr === null && Array.isArray(inst.k08cStubbed) && inst.k08cStubbed.length === 5 && Array.isArray(inst.k07bMissing),
    JSON.stringify(inst));
  check('I3', 'sześć delegatów K09A jest funkcjami po instalacji', instErr === null && ['hideCityPanel', 'setHoverDetailDocks', 'setMapHudChromeSuppressed', 'showCityUxFrame', 'hideCityUxFrame', 'refreshCityUxFrame'].every((f) => typeof W.requireK09aDeps()[f] === 'function'));

  // ── O: kolejność — K09A nadpisuje rerender K08C ─────────────────────────────────────────────────────────────────
  const orderErr = errOf(() => W.requireK08aDeps().rerender());
  check('O1', 'requireK08aDeps().rerender() NIE woła rerender z hosta K08C (nadpisany przez K09A)', orderErr === null && (ruleCalls['k08c.rerender'] ?? 0) === 0, `err=${orderErr} k08cCalls=${ruleCalls['k08c.rerender'] ?? 0}`);

  // ── W: pełna ścieżka pokazu → malowanie przez most → ukrycie ────────────────────────────────────────────────────
  const showErr = errOf(() => W.PAINT.showCityPanel(city, map, () => undefined));
  check('W1', 'showCityPanel(city, map, onClose) po instalacji bez wyjątku (brak „brak delegatu”)', showErr === null, String(showErr));
  const frameOpen = isOpenSafe(W.isCityUxFrameOpen);
  check('W2', 'po pokazie ramka jest otwarta (isCityUxFrameOpen)', frameOpen === true, String(frameOpen));
  const st = W.getK06aState();
  check('W3', 'K06A zapamiętuje miasto (id 7) i mapę (activeMap ≠ null)', st.activeCity !== null && st.activeCity.id === 7 && st.activeMap === map, JSON.stringify({ id: st.activeCity && st.activeCity.id, mapOk: st.activeMap === map }));
  const topEl = document.querySelector('.civ-ux-top');
  const frameHtml = document.querySelector('.civ-ux-frame')?.innerHTML ?? '';
  check('W4', 'most zarejestrowany: malowanie wypełnia pas górny ramki (top innerHTML niepusty)', !!topEl && topEl.innerHTML.length > 0, `len=${topEl ? topEl.innerHTML.length : 'brak'}`);
  check('W5', 'w DOM ramki nie ma tekstu „undefined” ani „[object Object]”', !frameHtml.includes('undefined') && !frameHtml.includes('[object Object]'));
  const hideErr = errOf(() => W.PAINT.hideCityPanel());
  check('W6', 'hideCityPanel() bez wyjątku i ramka zamknięta', hideErr === null && isOpenSafe(W.isCityUxFrameOpen) === false, String(hideErr));
  check('W7', 'hideCityPanel ukrywa korzeń K06B (display none)', W.getK06bRootEl()?.style.display === 'none');
  check('W8', 'ponowny pokaz po ukryciu działa (ramka wraca)', errOf(() => W.PAINT.showCityPanel(city, map, () => undefined)) === null && isOpenSafe(W.isCityUxFrameOpen) === true);
  W.PAINT.hideCityPanel();
  check('W9', 'po ukryciu most wykonał sprzątanie trybu: K06A activeCity = null (clearCityPanelUxMode)', W.getK06aState().activeCity === null, JSON.stringify(W.getK06aState().activeCity && W.getK06aState().activeCity.id));

  // ── N: nawigacja ←/→ przez most (cityPanelUxBridge → K06A → ui.switchCity) ─────────────────────────────────────────
  W.BR.navigateCityPanel(1);
  W.BR.navigateCityPanel(-1);
  check('N1', 'BR.navigateCityPanel(1) i (-1) trafiają do ui.switchCity w tej kolejności', JSON.stringify(switchedDirs) === '[1,-1]', JSON.stringify(switchedDirs));

  // ── D: delegaty reguł i K07B są zainstalowane (wrappery bez wyjątku „brak delegatu”) ───────────────────────────────
  const d8d = errOf(() => W.K08D.religiaSzPunkty(1, 0));
  check('D1', 'K08D: delegat reguł zainstalowany (religiaSzPunkty nie rzuca „brak delegatu”)', d8d === null, String(d8d));
  const d8e = errOf(() => W.K08E.buildRationParams({}, 'normal'));
  check('D2', 'K08E: delegat reguł zainstalowany (buildRationParams nie rzuca „brak delegatu”)', d8e === null, String(d8e));
  const d07 = errOf(() => W.depK07b('gameData'));
  check('D3', 'K07B: delegat gameData zainstalowany (dep nie rzuca „brak delegatu”)', d07 === null, String(d07));

  // ── R: most — brak mapy = głośny wyjątek ─────────────────────────────────────────────────────────────────────────
  W.setK06aActive(null, null, () => undefined);
  const noMap = errOf(() => W.WIRING.cityPanelUxImpl.paintCityPanelSections({ top: document.createElement('div'), left: document.createElement('div'), right: document.createElement('div') }, city, () => undefined));
  check('R1', 'cityPanelUxImpl.paintCityPanelSections bez activeMap rzuca „brak mapy”', typeof noMap === 'string' && noMap.includes('brak mapy'), String(noMap));

  // ── Ścieżka reguł: wykonane reguły (informacyjnie, bez kryterium) ──────────────────────────────────────────────
  // Informacyjnie (bez kryterium): liczby wywołań fikstur reguł K08C/K08D/K08E podczas pokazu, malowania i ukrycia.
  console.log(`INFO ruleCalls=${JSON.stringify(ruleCalls)} k08cStubbed=${JSON.stringify(inst.k08cStubbed)} k07bMissing=${JSON.stringify(inst.k07bMissing)}`);
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  rmSync(TMP, { recursive: true, force: true });
  process.exit(2);
}
rmSync(TMP, { recursive: true, force: true });

function isOpenSafe(fn) {
  try {
    return fn();
  } catch (e) {
    return `ERR:${e && e.message}`;
  }
}

const fails = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.what}${r.ok || !r.detail ? '' : `\n     ${r.detail}`}`);
console.log(`\nk09b-wiring: ${results.length - fails.length}/${results.length} zgodnych`);
process.exit(fails.length === 0 ? 0 : 1);
