#!/usr/bin/env node
/**
 * run-k09a-pin.mjs — harness WYKONUJĄCY funkcje pinu dla 9 jednostek K09A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1,
 * runda 2; zarzut Evaluatora Z1: brak pin-exec harnessu dla jednostek K09A).
 *
 * PIN-EXEC: każda jednostka K09A (`switchCity`, `rerender`, `renderCityIconRightRail`, `renderOkolicaPanel`,
 * `renderLeftPanelTab`, `renderRightPanelTab`, `paintCityPanelSections`, `showCityPanel`, `hideCityPanel`) jest wykonywana
 * z SUROWEJ LINII PINU `edb8fb56` (`gra/src/ui/cityPanel.ts`, zakresy z markerów `// pin edb8fb56 …` portu — bez
 * podstawień tekstowych) w module `pin-k09a.ts` w katalogu tymczasowym (poza repo). Stan modułu pinu
 * (`rootEl`, `activeCity`, `activeMap`, `activeOnClose`, `pinnedGarrisonCityId`, `uxSectionRefresh`, `scalePx`,
 * `activeDrawerTab`, `activeCityPanelTab`) jest zmiennymi tego modułu; `cfg` = ten sam obiekt wejść testowych co
 * K05B (`FIX.cfg`). Efekty zewnętrzne pinu (`setHoverDetailDocks`, `setMapHudChromeSuppressed`, `showCityUxFrame`,
 * `hideCityUxFrame`, `refreshCityUxFrame`, `ensureStyles`, `clearGarrisonPanel`) to rejestratory w `FIX.log`.
 *
 * PORT: `src/ui/cityPanel/k09a-{rerender,tabs,paint}.ts` (ten sam `--src`), ze stanem w K06A/K07A/K08A/K06B i
 * delegatami `setK09aDeps` (rejestratory o tych samych tagach co pin). Nagłówek importów pin-modułu = importy portu
 * minus nazwy stanu/efektów pinu (bez `cfg`, `clearGarrisonPanel`, …).
 *
 * Porównanie: każdy scenariusz na obu stronach z TYM SAMYM wejściem (świeży DOM i stan przed każdą stroną);
 * wynik = {wyjście, log efektów, odczyt stanu}. Zgodność = identyczny łańcuch JSON. Każda jednostka musi mieć
 * >=1 scenariusz BEZ wyjątku po stronie pinu (inaczej harness nie dowodzi niczego o tej jednostce).
 * Znane, udokumentowane różnice (dossier P5-8-K09A.md §2): K09A-Z4 (`showCityUxFrame`/`refreshCityUxFrame` bez
 * `map` — rejestrator loguje tylko `city.id`), K09A-Z5 (`renderReligia` z `data`), K09A-Z6 (`name ?? ''`).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k09a-pin.mjs --pin-dir <PIN_DIR> [--src <katalog src>] [--tmp-dir <katalog>]
 * <PIN_DIR> = katalog zawierający `gra/src/ui/cityPanel.ts` (np. `git archive edb8fb56 gra/src | tar -x -C <dir>`).
 * EXIT 0 <=> brak różnic i pokrycie każdej jednostki; 1 <=> >=1 różnica lub brak pokrycia; 2 <=> błąd harnessu.
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k09a-pin.mjs --pin-dir <PIN_DIR> [--src <katalog src>] [--tmp-dir <katalog>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const CITY = join(SRC, 'ui/cityPanel');
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k09a-pin-'));

const results = [];
const diffAt = (p, q) => { if (p === q) return ''; let i = 0; while (i < Math.min(p.length, q.length) && p[i] === q[i]) i += 1; return `@${i} pin=…${p.slice(Math.max(0, i - 150), i + 150)} | port=…${q.slice(Math.max(0, i - 150), i + 150)}`; };
const check = (id, what, ok, detail = '') => results.push({ id, what, ok: ok === true, detail });

/* ── 1. Zakresy jednostek: markery `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B` w portie K09A ───────────────────── */
const PORT_FILES = ['k09a-rerender.ts', 'k09a-tabs.ts', 'k09a-paint.ts'].map((f) => join(CITY, f));
const UNITS = [];
for (const file of PORT_FILES) {
  const src = readFileSync(file, 'utf8');
  const re = /\/\/ pin edb8fb56 gra\/src\/ui\/cityPanel\.ts:(\d+)-(\d+)\n(?:export )?function (\w+)\(/g;
  let m;
  while ((m = re.exec(src)) !== null) UNITS.push({ a: Number(m[1]), b: Number(m[2]), name: m[3], file: file.split('/').pop() });
}
check('units.count', `jednostki K09A z markerów portu: ${UNITS.length} (oczekiwane 9)`, UNITS.length === 9);

/** Blok pinu surowy (bez podstawień); `export` na deklaracji. */
const pinBlock = (u) => {
  const lines = PIN_LINES.slice(u.a - 1, u.b);
  const okStart = new RegExp(`^(export )?function ${u.name}\\(`).test(lines[0]);
  const okEnd = lines[lines.length - 1] === '}';
  check(`pin.range.${u.name}`, `zakres pinu ${u.a}-${u.b} (${u.name}) zaczyna się i kończy poprawnie`, okStart && okEnd);
  const text = lines.join('\n').replace(/^function /, 'export function ');
  return text;
};

/** Pomocnicze funkcje pinu (poza jednostkami K09A, potrzebne przez ich treść) — kopiowane z pinu dosłownie. */
const pinFunction = (name) => {
  const start = PIN_LINES.findIndex((l) => new RegExp(`^(export )?function ${name}\\(`).test(l));
  if (start < 0) throw new Error(`brak funkcji pinu ${name}`);
  let end = start;
  while (PIN_LINES[end] !== '}') end += 1;
  return PIN_LINES.slice(start, end + 1).join('\n');
};
const PIN_HELPERS = ['ownerCities', 'ownerCitiesForNav', 'resolveActiveCity'].map(pinFunction);

/* ── 2. Nagłówek importów: importy portu K09A bez nazw stanu/efektów pinu (budowane z portu, ścieżki absolutne) ── */
const PIN_LOCAL = new Set([
  'cfg', 'rootEl', 'activeCity', 'activeMap', 'activeOnClose', 'pinnedGarrisonCityId', 'activeDrawerTab', 'scalePx',
  'activeCityPanelTab', 'uxSectionRefresh', 'clearGarrisonPanel', 'ensureStyles', 'setHoverDetailDocks',
  'setMapHudChromeSuppressed', 'showCityUxFrame', 'hideCityUxFrame', 'refreshCityUxFrame', 'resolveActiveCity',
  'ownerCities', 'ownerCitiesForNav', 'switchCity', 'rerender', 'renderCityIconRightRail', 'renderOkolicaPanel',
  'renderLeftPanelTab', 'renderRightPanelTab', 'paintCityPanelSections', 'showCityPanel', 'hideCityPanel', 'FIX',
  'PIN_STATE', 'UI_PARAMS', 'skeleton', 'SCALES', 'cityPanelTitle', 'brandIconSvg',
]);
const SEEN = new Set();
const headerLines = [];
for (const file of PORT_FILES) {
  const src = readFileSync(file, 'utf8');
  const re = /^import\s+(type\s+)?([\s\S]*?)\s+from\s+'([^']+)';/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const spec = m[3];
    if (spec.startsWith('./k09a-')) continue;
    const abs = spec.startsWith('.') ? resolve(dirname(file), spec) : spec;
    const body = m[2].trim();
    const named = body.match(/^\{([\s\S]*)\}$/);
    const defaultName = named ? null : body;
    const kept = [];
    if (named) {
      for (const raw of named[1].split(',').map((s) => s.trim()).filter(Boolean)) {
        const isType = raw.startsWith('type ');
        const clean = isType ? raw.slice(5).trim() : raw;
        const local = clean.includes(' as ') ? clean.split(' as ')[1].trim() : clean;
        if (PIN_LOCAL.has(local) || SEEN.has(local)) continue;
        SEEN.add(local);
        kept.push(clean);
      }
      if (kept.length === 0) continue;
      headerLines.push(`import ${m[1] ?? ''}{ ${kept.join(', ')} } from ${JSON.stringify(abs)};`);
    } else {
      if (PIN_LOCAL.has(defaultName) || SEEN.has(defaultName)) continue;
      SEEN.add(defaultName);
      headerLines.push(`import ${defaultName} from ${JSON.stringify(abs)};`);
    }
  }
}
headerLines.push(`import { UI_PARAMS } from ${JSON.stringify(join(SRC, 'ui/uiParams.ts'))};`);
headerLines.push(`import { skeleton as skeletonK07a, setK07aScalePx, setK07aDrawerTab } from ${JSON.stringify(join(SRC, 'ui/cityPanel/k07a-fundament.ts'))};`);

/* ── 3. Moduł env (FIX: jedyne źródło wejść testowych; rejestr efektów) ─────────────────────────────────────────── */
const envPath = join(TMP, 'env.ts');
writeFileSync(
  envPath,
  [
    '// FIX: wejścia testowe (cfg K05B = obiekt cfg pinu) i rejestr efektów (log). Scenariusze mutują FIX; resetFix przywraca.',
    'export const FIX: { cfg: Record<string, any>; k01b: Record<string, (...a: any[]) => any>; log: any[]; frame: any; order: (c: any) => any; health: (c: any) => any; empire: () => any; computeView: (c: any, m: any, d: any) => any; rules: any } = {',
    '  cfg: {},',
    '  k01b: {},',
    '  log: [],',
    '  frame: null,',
    '  order: (_c: any) => ({ szczescie: 60, porzadek: 12, porPct: 62, szPct: 60, prawPct: 40, szMax: 100, prawMax: 30, bandLabel: "Napięcie", szLines: [], prawLines: [], revoltWarning: false, revoltGraceRemaining: null, rebelState: false }),',
    '  health: (_c: any) => ({ total: 3, lines: [{ label: "Głód", value: -1 }], fromEngine: true }),',
    '  empire: (): any => ({}),',
    '  computeView: (_c: any, _m: any, _d: any): any => null,',
    '  rules: {',
    '    formatManpower: (n: number) => String(n),',
    '    etaTurns: (koszt: number, postep: number, praca: number) => (praca > 0 ? Math.ceil((koszt - postep) / praca) : 0),',
    '    getProd: (_id: number) => ({ kolejka: [] }),',
    '    productionCtxForCity: () => ({}),',
    '    mennicaGate: () => ({ maMennicaBudynek: false, mennicaAktywna: false, mennicaSpiZBrakuZlota: false }),',
    '    religiaSzPunkty: () => 0,',
    '    religiaXRelTop: () => 0,',
    '    buildEconParams: () => ({}),',
    '    cityHasBibliotekaLine: (b: readonly string[]) => b.includes("biblioteka"),',
    '    mnoznikHandelPieniadzForCivByDifficulty: (_k: unknown, _c: unknown, _d: string, fb: number) => fb,',
    '    computeTradeRouteBuildingBonusByCity: () => new Map(),',
    '    loadWealthParams: () => ({ zachowaniePoAwansie: 0, mnoznikNaPoziom: 1, progNaPoziom: 10 }),',
    '    wealthCap: () => 5,',
    '    wealthProg: () => 10,',
    '    wealthMnoznik: () => 1,',
    '    wealthZadowolenie: () => 0,',
    '    wealthRownowaga: () => 0,',
    '  },',
    '};',
    '',
  ].join('\n'),
);

/* ── 4. Moduł pinu: nagłówek + stan modułu pinu + rejestratory efektów + surowe bloki pinu ───────────────────────── */
const UNIT_BLOCKS = UNITS.map((u) => pinBlock(u));
const pinModPath = join(TMP, 'pin-k09a.ts');
writeFileSync(
  pinModPath,
  [
    ...headerLines,
    `import { FIX } from ${JSON.stringify(envPath)};`,
    '',
    '// ── stan modułu pinu (`let` z pinu 10158–10163, 919, 1791, 11593, uxSectionRefresh z K07A) ──',
    'let rootEl: HTMLDivElement | null = null;',
    'let activeCity: any = null;',
    'let activeMap: any = null;',
    'let activeOnClose: () => void = () => {};',
    'let pinnedGarrisonCityId: string | null = null;',
    "let activeDrawerTab: any = 'plony';",
    'let scalePx: number = UI_PARAMS.panel_miasta.font_scale_domyslna_px;',
    "let activeCityPanelTab: any = 'budowa';",
    'let uxSectionRefresh: (() => void) | null = null;',
    'const SCALES: ReadonlyArray<{ label: string; px: number }> = UI_PARAMS.panel_miasta.font_scale;',
    '// cityPanelTitle pinu = formatCityMapLabel (game/display-names, poza portem): wejście testowe o tej samej postaci co K07A ext.',
    'const cityPanelTitle = (c: any): string => `Miasto ${c.id}`;',
    '// skeleton pinu (10247) czyta stan pinu (scalePx, activeDrawerTab); port K07A czyta swój stan: lustro pinu przed wywołaniem (K09A-Z1).',
    'const skeleton = (c: any, v: any): string => { setK07aScalePx(scalePx); setK07aDrawerTab(activeDrawerTab); return skeletonK07a(c, v); };',
    'const cfg: any = FIX.cfg;',
    '// render/hexutil pinu (poza portem; K06A-Z4): ta sama postać co wejście testowe K06A deps.axialToWorld.',
    'const HEX_R = 1.0;',
    'const axialToWorld = (q: number, r: number, R: number): { x: number; z: number } => ({ x: R * Math.sqrt(3) * (q + r / 2), z: R * 1.5 * r });',
    '',
    '// ── efekty zewnętrzne pinu → rejestratory (tagi wspólne z delegatami portu w run) ──',
    "const setHoverDetailDocks = (m: any) => FIX.log.push(['hover', m === null ? 'null' : Object.entries(m).map(([k, v]: any) => k + '=' + (v ? v.className || v.tagName : 'null')).join(',')]);",
    "const setMapHudChromeSuppressed = (s: boolean) => FIX.log.push(['hud', s]);",
    "const showCityUxFrame = (c: any, _map: any, refresh: any, onClose: any) => { FIX.log.push(['frame.show', c?.id]); FIX.frame = { refresh, onClose }; };",
    "const hideCityUxFrame = () => FIX.log.push(['frame.hide']);",
    "const refreshCityUxFrame = (c: any, _map: any, refresh: any) => { FIX.log.push(['frame.refresh', c?.id]); FIX.frame = { ...(FIX.frame ?? {}), refresh }; };",
    "const ensureStyles = () => ensureCityPanelStyles();",
    'function clearGarrisonPanel(): void { pinnedGarrisonCityId = null; }',
    '',
    '// ── pomocnicze funkcje pinu (dosłowne) ──',
    ...PIN_HELPERS,
    '',
    '// ── jednostki K09A (surowe bloki pinu) ──',
    ...UNIT_BLOCKS,
    '',
    'export const PIN_STATE = {',
    '  set(s: any) {',
    '    rootEl = s.root; activeCity = s.city; activeMap = s.map; activeOnClose = s.onClose ?? (() => {});',
    '    uxSectionRefresh = s.refresh; pinnedGarrisonCityId = s.pinned; scalePx = s.scale;',
    '    activeDrawerTab = s.drawer; activeCityPanelTab = s.tab;',
    '  },',
    '  get() {',
    '    return {',
    '      activeCity: activeCity ? activeCity.id : null, k07: activeCity ? activeCity.id : null,',
    '      activeMapNull: activeMap === null, pinned: pinnedGarrisonCityId, refresh: uxSectionRefresh !== null,',
    '      scale: scalePx, drawer: activeDrawerTab, tab: activeCityPanelTab,',
    '    };',
    '  },',
    '  onClose() { return activeOnClose; },',
    '};',
    '',
  ].join('\n'),
);

/* ── 5. Wejścia testowe (JAWNE wzory; nie dane gry) ─────────────────────────────────────────────────────────────── */
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
const FIX_ORDER = () => ({ szczescie: 60, porzadek: 12, porPct: 62, szPct: 60, prawPct: 40, szMax: 100, prawMax: 30, bandLabel: 'Napięcie', szLines: [], prawLines: [], revoltWarning: false, revoltGraceRemaining: null, rebelState: false });
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
  getCityWorkedRange: () => 1,
  getWorkedTiles: () => [],
  getOkolicaState: () => ({ focus: 'zrownowazone', tryb: 'auto' }),
  onSetCapital: () => undefined,
  onCityRationChange: () => undefined,
  onCityAutoWyzywienieChange: () => undefined,
  onPoziomRacjiOverrideToggle: () => undefined,
};

/* ── 6. Wejście (entry): instalacja zależności K05–K08 (jak run-k08e-pin) + delegaty K09A (rejestratory) ─────────── */
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
const P = (rel) => JSON.stringify(join(CITY, rel));
const portEntry = join(TMP, 'port-units.ts');
/* K06B: delegaty z IMPLEMENTACJI PORTU (eksporty src/**, wyszukane po nazwie z K06B_FN_NAMES). Nazwy bez eksportu
 * w portcie dostają neutralne wejścia testowe (lista K06B_STUBBED) — NIE_ZMIERZONO (delegaty niezaportowane). */
const walkTs = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkTs(join(d, e.name)) : e.name.endsWith('.ts') ? [join(d, e.name)] : []));
// Pomijane: moduły k06b-* oraz *-deps.ts (delegaty-opakowania dep(nazwa) o tej samej nazwie: rekurencja po podpięciu;
// ich implementacje podłącza wiring K08B/K08C/K08D, K09A harness nie zmienia tego podziału).
const SRC_FILES = walkTs(SRC).filter((p) => !/\/k06b-[^/]*$/.test(p) && !/-deps\.ts$/.test(p));
const K06B_NAMES = JSON.parse(readFileSync(join(CITY, 'k06b-deps.ts'), 'utf8').match(/K06B_FN_NAMES = (\[[^\]]*\])/)[1]);
const k06bImports = [];
const k06bEntries = [];
for (const n of K06B_NAMES) {
  const re = new RegExp(`^export (function|const) ${n}\\b`, 'm');
  const file = SRC_FILES.find((p) => re.test(readFileSync(p, 'utf8')));
  if (file) {
    k06bImports.push(`import { ${n} as k06bImpl_${n} } from ${JSON.stringify(file)};`);
    k06bEntries.push(`${n}: k06bImpl_${n}`);
  }
}
k06bEntries.push('EPOCH_NUMBER_TO_NAME: { 1: \'E1\', 2: \'E2\', 3: \'E3\' }', 'IMPROVEMENT_KEY_TO_NAME: {}', 'Nakladka: {}');
const k06bSetLine = `setK06bDeps({ ${k06bEntries.join(', ')} } as any);`;
const K06B_STUBBED = K06B_NAMES.filter((n) => !k06bEntries.some((e) => e.startsWith(n + ':')));
check('k06b.wired', `K06B: ${k06bEntries.length} delegatów z portu, ${K06B_STUBBED.length} neutralnych wejść testowych (${K06B_STUBBED.join(' ')})`, k06bEntries.length > 0);
const entry = join(TMP, 'entry.ts');
writeFileSync(
  entry,
  [
    `import ${JSON.stringify(setupPath)};`,
    ...k06bImports,
    `import { FIX } from ${JSON.stringify(envPath)};`,
    `import { setK06bDeps } from ${P('k06b-deps.ts')};`,
    `import { setK06aCfg, setK06aDeps } from ${P('k06a-fundament.ts')};`,
    `import { setK06bRootEl } from ${P('k06b-garnizon.ts')};`,
    `import { setK06aActive, getK06aState, setK06aPinnedGarrisonCityId } from ${P('k06a-fundament.ts')};`,
    `import { setK07aExt, setK07aActiveCity, setK07aUxSectionRefresh, getK07aUxSectionRefresh, setK07aScalePx, getK07aScalePx, setK07aDrawerTab, getK07aDrawerTab, getK07aActiveCity } from ${P('k07a-fundament.ts')};`,
    `import { setK08aActiveCityPanelTab, getK08aActiveCityPanelTab } from ${P('k08a-fundament.ts')};`,
    `import { setK05aCfg, setK05aRules } from ${P('k05a-fundament.ts')};`,
    `import { productionCtxForCity as prodCtxK05b } from ${P('k05b-host.ts')};`,
    `import { cityPanelChipIconWrap as chipIconWrap } from ${P('k01a-fundament.ts')};`,
    `import { setK08dDeps } from ${P('k08d-deps.ts')};`,
    `import { installK08dWiring } from ${JSON.stringify(join(SRC, 'controller/k08dWiring.ts'))};`,
    `import { installK08cWiring } from ${JSON.stringify(join(SRC, 'controller/k08cWiring.ts'))};`,
    `import { setK05bHost } from ${P('k05b-host.ts')};`,
    `import { ustawRegulyKontrolera } from ${P('k01b-reguly.ts')};`,
    `import { installK08eWiring } from ${JSON.stringify(join(SRC, 'controller/k08eWiring.ts'))};`,
    `import { setK09aDeps, setK09aHooks } from ${P('k09a-deps.ts')};`,
    `import * as HOVER from ${JSON.stringify(join(SRC, 'ui/hoverDetailDock.ts'))};`,
    `import * as CUF from ${JSON.stringify(join(SRC, 'ui/cityUxFrame.ts'))};`,
    `import { installK07bWiring } from ${JSON.stringify(join(SRC, 'controller/k07bWiring.ts'))};`,
    `import { hideCityPanel as portHideCityPanel } from ${P('k09a-paint.ts')};`,
    `import * as PORT from ${JSON.stringify(portEntry)};`,
    `import * as PIN from ${JSON.stringify(pinModPath)};`,
    'export { PIN_STATE } from ' + JSON.stringify(pinModPath) + ';',
    '',
    '// K05B host + K06B + K08C: produkcyjny wiring K08C (installK08cWiring) z wejściami testowymi hosta (bez reguł gry).',
    'installK08cWiring({ rerender: () => undefined, cfg: FIX.cfg, engineSuwaakPracaBudynki: () => null, splitPraca: (praca: number, frac: number) => ({ total: praca, doBudynkow: Math.round(praca * frac), doPuli: praca - Math.round(praca * frac) }), computeView: (c: any, m: any, d: any) => FIX.computeView(c, m, d), readPodzialHandlu: () => ({ procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 }), isMeCity: (o: number) => o === 0, adjustHandelSplit: (x: any) => x, freshWealthState: () => ({ poziom: 0, pula: 0 }), stockResourceLabel: (k: string) => k, rules: FIX.rules } as any, { sumOwnedBuildingsUpkeep: () => 0, groupBuiltBuildingIds: () => [], appendRecruitMilitaryResourceStrip: () => undefined, purchasableUnits: () => [], sortByUnitPowerDescending: (u: any[]) => u } as any);',
    'setK05aCfg(new Proxy({}, { get: (_t, k) => FIX.cfg[k as string] }) as any);',
    `setK06bDeps({ cfg: new Proxy({}, { get: (_t, k) => FIX.cfg[k as string] }), resolveEmpireSnap: () => FIX.empire(), computeView: (c: any, m: any, d: any) => FIX.computeView(c, m, d), cityPanelChipIconWrap: (id: string, size?: number) => chipIconWrap(id, size as any), attachInteractiveDetail: () => undefined, showPinnedDetail: () => undefined, el: (tag: string, cls?: string, html?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; } });`,
    '// K06B/K07B: delegaty DOM z realnych modułów (hover dock, ramka) — jak w produkcyjnym wiringu K07B (installK07bWiring).',
    k06bSetLine,
    'setK06bDeps({ productionCtxForCity: (c: any) => prodCtxK05b(c), getShowEraBuildingPreview: () => false, setShowEraBuildingPreview: () => undefined, appendCityResourceStockStrip: () => undefined, bindBuildQueueDragReorder: () => undefined, bindRecruitQueueDragReorder: () => undefined, buildableProduction: () => [], buildingLevelForEpoch: () => 0, buildingOwnedLevel: () => 0, buildingProductionItem: () => null, buildingTypeQueued: () => false, cancelQueueItem: () => undefined, dequeueRecruitment: () => undefined, filterRuntimeActiveBuiltIds: (ids: any) => ids, promoteToFront: () => undefined, resolveOwnedBuildingInactiveStatus: () => null, tileYield: () => ({}), clearPinnedDetail: HOVER.clearPinnedDetail, showPinnedDetail: HOVER.showPinnedDetail, attachInteractiveDetail: HOVER.attachInteractiveDetail, attachHoverDetail: HOVER.attachHoverDetail, showHoverDetailNow: HOVER.showHoverDetailNow, isCityUxFrameOpen: CUF.isCityUxFrameOpen, isMeCity: (o: number) => o === 0 } as any);',
    '// K05A: reguły silnika (wejścia testowe; brak wartości = neutralna funkcja zwracająca pustą tablicę — NIE_ZMIERZONO).',
    '// K06A: cfg (getCities) i delegat axialToWorld (wejście testowe; ta sama postać co w pinie, patrz PIN axialToWorld).',
    'setK06aCfg(FIX.cfg as any);',
    'setK06aDeps({ axialToWorld: (q: number, r: number, R: number) => ({ x: R * Math.sqrt(3) * (q + r / 2), z: R * 1.5 * r }) } as any);',
    'setK05aRules(new Proxy({}, { get: (t: any, k: any) => (k in t ? t[k] : (..._a: any[]) => []) }) as any);',
    'setK07aExt({ cfg: FIX.cfg, isMeCity: (o: number) => o === 0, ownerCities: (c: any) => (FIX.cfg.getCities?.() ?? []).filter((x: any) => x.ownerId === c.ownerId), cityPanelTitle: (c: any) => `Miasto ${c.id}`, headerOrderBadge: () => \'\', drawerTabButtons: () => \'\', formatManpower: (n: number) => String(n), daninaLabelForCity: () => \'Danina\', resolveEmpireSnap: () => FIX.empire(), cityPracaSplit: (_c: any, v: any) => ({ total: v.praca, doBudynkow: 0, doPuli: v.praca, pctBudynki: 0, pctPuli: 100 }), readPodzialHandlu: () => ({ procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 }), civWideSixStatsFromEmpireSnap: (_e: any, six: any) => six, resolveOrderState: (c: any) => ({ state: FIX.order(c) }) } as any);',
    'installK07bWiring({ getCities: () => (FIX.cfg.getCities?.() ?? []), getCapitalCityId: (o: number) => FIX.cfg.getCapitalCityId?.(o) ?? null, isMe: (o: number) => o === 0, canSetCapital: false, cfg: FIX.cfg, gameData: () => FIX.cfg.getGameData?.() ?? null, activeMap: () => getK06aState().activeMap } as any, { isCityUxFrameOpen: CUF.isCityUxFrameOpen } as any);',
    'installK08dWiring(FIX.rules as any);',
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
    '// Delegaty K09A po stronie portu: te same tagi co rejestratory pinu (K09A-Z2/Z3/Z4).',
    'setK09aDeps({',
    '  hideCityPanel: () => portHideCityPanel(),',
    "  setHoverDetailDocks: (m: any) => FIX.log.push(['hover', m === null ? 'null' : Object.entries(m).map(([k, v]: any) => k + '=' + (v ? v.className || v.tagName : 'null')).join(',')]),",
    "  setMapHudChromeSuppressed: (s: boolean) => FIX.log.push(['hud', s]),",
    "  showCityUxFrame: (c: any, paint: any, onClose: any) => { FIX.log.push(['frame.show', c?.id]); FIX.frame = { refresh: paint, onClose }; },",
    "  hideCityUxFrame: () => FIX.log.push(['frame.hide']),",
    "  refreshCityUxFrame: (c: any, paint: any) => { FIX.log.push(['frame.refresh', c?.id]); FIX.frame = { ...(FIX.frame ?? {}), refresh: paint }; },",
    '} as any);',
    'setK09aHooks(new Proxy({}, { get: (_t, k) => (FIX.cfg[k as string] ? (...a: any[]) => FIX.cfg[k as string](...a) : undefined) }) as any);',
    '',
    'export const PINX = PIN;',
    'export { PORT, FIX };',
    `export const CITIES: Record<string, any> = { a: ${JSON.stringify(CITY_A)}, b: ${JSON.stringify(CITY_B)}, c: ${JSON.stringify(CITY_C)} };`,
    'export const PORT_STATE = {',
    '  set(s: any) {',
    '    setK06bRootEl(s.root);',
    '    setK07aActiveCity(s.k07Null ? null : (s.city ?? null));',
    '    setK06aActive(s.city ?? null, s.map ?? null, s.onClose ?? (() => {}));',
    '    setK07aUxSectionRefresh(s.refresh ?? null);',
    '    setK06aPinnedGarrisonCityId(s.pinned ?? null);',
    '    setK07aScalePx(s.scale);',
    '    setK07aDrawerTab(s.drawer);',
    '    setK08aActiveCityPanelTab(s.tab);',
    '  },',
    '  get() {',
    '    const k6 = getK06aState();',
    '    return {',
    '      activeCity: k6.activeCity ? k6.activeCity.id : null, k07: getK07aActiveCity() ? getK07aActiveCity()!.id : null,',
    '      activeMapNull: k6.activeMap === null, pinned: k6.pinnedGarrisonCityId, refresh: getK07aUxSectionRefresh() !== null,',
    '      scale: getK07aScalePx(), drawer: getK07aDrawerTab(), tab: getK08aActiveCityPanelTab(),',
    '    };',
    '  },',
    '  onClose() { return getK06aState().activeOnClose; },',
    '};',
    '',
  ].join('\n'),
);

/* Plik wejściowy portu: re-eksport 9 jednostek K09A (importowany jako PORT). */
writeFileSync(
  portEntry,
  [
    `export { switchCity, rerender, renderCityIconRightRail } from ${P('k09a-rerender.ts')};`,
    `export { renderOkolicaPanel, renderLeftPanelTab, renderRightPanelTab } from ${P('k09a-tabs.ts')};`,
    `export { paintCityPanelSections, showCityPanel, hideCityPanel } from ${P('k09a-paint.ts')};`,
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
  const { FIX } = mod;

  const resetFix = (extra = {}) => {
    for (const k of Object.keys(FIX.cfg)) delete FIX.cfg[k];
    Object.assign(FIX.cfg, CFG_BASE, extra);
    if (!('onSwitchCity' in extra)) FIX.cfg.onSwitchCity = (id) => FIX.log.push(['switchHook', id]);
    FIX.k01b = K01B_SAMPLE;
    FIX.empire = () => EMPIRE;
    FIX.computeView = () => VIEW;
    FIX.log.length = 0;
    FIX.frame = null;
  };
  const mk = (tag = 'div') => {
    const d = doc.createElement(tag);
    doc.body.appendChild(d);
    return d;
  };
  const clearDoc = () => {
    doc.body.innerHTML = '';
  };
  const safe = async (f) => {
    try {
      return await f();
    } catch (e) {
      if (process.env.K09A_SHOW) console.log('STACK', e && e.stack);
      return `THROW:${e && e.message}`;
    }
  };
  const mountsOf = () => ({
    top: mk(), left: mk(), leftIconRail: mk(), rightIconRail: mk(), leftDetailDock: mk(), detailDock: mk(), right: mk(), mapChrome: mk(),
  });
  const mountsHtml = (m) => JSON.stringify(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v ? v.outerHTML : null])));

  /** Zestaw stanu: pin i port dostają ten sam stan początkowy (świeży DOM). */

  /**
   * Scenariusz: [jednostka, id, cfgExtra, stan, wywołanie(E, ctx) -> string].
   * ctx: { root, mounts, city, map, refresh, onCloseNew } — tworzone osobno dla każdej strony.
   */
  const SCEN = [];
  const add = (unit, id, cfgExtra, state, call) => SCEN.push({ unit, id, cfgExtra, state, call });
  const baseState = (over = {}) => ({ city: CITY_A, map: MAP, refresh: null, pinned: null, scale: 16, drawer: 'plony', tab: 'budowa', ...over });

  // switchCity
  add('switchCity', 'switch.next', {}, baseState(), (E, c) => { E.switchCity(1); return c.root.outerHTML; });
  add('switchCity', 'switch.prevWrap', {}, baseState(), (E, c) => { E.switchCity(-1); return c.root.outerHTML; });
  add('switchCity', 'switch.single', { getCities: () => [CITY_A] }, baseState(), (E, c) => { E.switchCity(1); return c.root.outerHTML; });
  add('switchCity', 'switch.noActive', {}, baseState({ city: null }), (E, c) => { E.switchCity(1); return c.root.outerHTML; });
  add('switchCity', 'switch.pinnedClear', {}, baseState({ pinned: '9' }), (E, c) => { E.switchCity(1); return c.root.outerHTML; });

  // rerender
  add('rerender', 'rerender.full', {}, baseState(), (E, c) => { E.rerender(); return c.root.outerHTML; });
  add('rerender', 'rerender.refresh', {}, baseState({ refresh: true }), (E, c) => { E.rerender(); return c.root.outerHTML; });
  add('rerender', 'rerender.noRoot', {}, baseState({ noRoot: true }), (E, c) => { return 'noRoot'; });
  add('rerender', 'rerender.noMap', {}, baseState({ map: null }), (E, c) => { E.rerender(); return c.root.outerHTML; });
  add('rerender', 'rerender.noCity', {}, baseState({ city: null }), (E, c) => { E.rerender(); return c.root.outerHTML; });
  add('rerender', 'rerender.scale20', {}, baseState({ scale: 20 }), (E, c) => { E.rerender(); return c.root.outerHTML; });
  add('rerender', 'rerender.praca', { onPodzialPracyChange: () => undefined }, baseState(), (E, c) => { E.rerender(); return c.root.outerHTML; });
  add('rerender', 'rerender.manager', { isAutoManageEnabled: () => true, onAutoManage: () => FIX_LOG('auto') }, baseState(), (E, c) => { E.rerender(); const m = c.root.querySelector('#cs-manager'); if (m) m.click(); return c.root.outerHTML; });
  add('rerender', 'rerender.close', {}, baseState(), (E, c) => { E.rerender(); const b = c.root.querySelector('#cs-close'); if (b) b.click(); return c.root.outerHTML; });
  add('rerender', 'rerender.mapbtn.hook', { onOpenMapForOkolica: (id) => FIX_LOG(['map', id]) }, baseState(), (E, c) => { E.rerender(); const b = c.root.querySelector('#cs-mapbtn'); if (b) b.click(); return c.root.outerHTML; });
  add('rerender', 'rerender.mapbtn.noHook', {}, baseState(), (E, c) => { E.rerender(); const b = c.root.querySelector('#cs-mapbtn'); if (b) b.click(); return c.root.outerHTML; });
  add('rerender', 'rerender.next', {}, baseState(), (E, c) => { E.rerender(); const b = c.root.querySelector('#cs-next'); if (b) b.click(); return c.root.outerHTML; });
  add('rerender', 'rerender.fsbtn', {}, baseState(), (E, c) => { E.rerender(); const b = c.root.querySelector('.fsbtn'); if (b) b.click(); return c.root.outerHTML; });

  // renderCityIconRightRail
  add('renderCityIconRightRail', 'rail.right.A', {}, baseState(), (E, c) => { const m = mk(); E.renderCityIconRightRail(m, CITY_A); return m.outerHTML; });
  add('renderCityIconRightRail', 'rail.right.C', {}, baseState(), (E, c) => { const m = mk(); E.renderCityIconRightRail(m, CITY_C); return m.outerHTML; });

  // renderOkolicaPanel
  add('renderOkolicaPanel', 'okolica.A', {}, baseState(), (E, c) => { const m = mk(); E.renderOkolicaPanel(m, CITY_A, MAP); return m.outerHTML; });

  // renderLeftPanelTab
  add('renderLeftPanelTab', 'left.budowa', {}, baseState(), (E, c) => { const m = mk(); E.renderLeftPanelTab(m, 'budowa', CITY_A, MAP, VIEW, DATA); return m.outerHTML; });
  add('renderLeftPanelTab', 'left.rekrutacja', {}, baseState(), (E, c) => { const m = mk(); E.renderLeftPanelTab(m, 'rekrutacja', CITY_A, MAP, VIEW, DATA); return m.outerHTML; });
  add('renderLeftPanelTab', 'left.default', {}, baseState(), (E, c) => { const m = mk(); E.renderLeftPanelTab(m, 'xyz', CITY_A, MAP, null, null); return m.outerHTML; });

  // renderRightPanelTab
  for (const tab of ['spichlerz', 'handel', 'porzadek', 'zdrowie', 'kultura', 'religia', 'xyz']) {
    add('renderRightPanelTab', `right.${tab}`, {}, baseState(), (E, c) => { const m = mk(); E.renderRightPanelTab(m, tab, CITY_A, MAP, VIEW, DATA); return m.outerHTML; });
  }
  add('renderRightPanelTab', 'right.praca.hook', { onPodzialPracyChange: () => undefined }, baseState(), (E, c) => { const m = mk(); E.renderRightPanelTab(m, 'praca', CITY_A, MAP, VIEW, DATA); return m.outerHTML; });
  add('renderRightPanelTab', 'right.praca.noHook', {}, baseState(), (E, c) => { const m = mk(); E.renderRightPanelTab(m, 'praca', CITY_A, MAP, VIEW, DATA); return m.outerHTML; });
  add('renderRightPanelTab', 'right.porzadek.noData', {}, baseState(), (E, c) => { const m = mk(); E.renderRightPanelTab(m, 'porzadek', CITY_A, MAP, VIEW, null); return m.outerHTML; });

  // paintCityPanelSections
  const paintCall = (_tab) => (E, c) => {
    E.paintCityPanelSections(c.mounts, c.city, c.map, c.refresh, c.onCloseNew);
    return mountsHtml(c.mounts);
  };
  add('paintCityPanelSections', 'paint.budowa', {}, baseState(), paintCall('budowa'));
  add('paintCityPanelSections', 'paint.rekrutacja', {}, baseState({ tab: 'rekrutacja' }), paintCall('rekrutacja'));
  add('paintCityPanelSections', 'paint.spichlerz', {}, baseState({ tab: 'spichlerz' }), paintCall('spichlerz'));
  add('paintCityPanelSections', 'paint.scale18', {}, baseState({ scale: 18 }), paintCall('budowa'));
  add('paintCityPanelSections', 'paint.pinnedOther', {}, baseState({ pinned: '9' }), paintCall('budowa'));
  add('paintCityPanelSections', 'paint.noDocks', {}, baseState(), (E, c) => { c.mounts.leftDetailDock = undefined; c.mounts.detailDock = undefined; E.paintCityPanelSections(c.mounts, c.city, c.map, c.refresh, c.onCloseNew); return mountsHtml(c.mounts); });
  add('paintCityPanelSections', 'paint.prefilled', {}, baseState(), (E, c) => { c.mounts.top.innerHTML = '<i>OLD</i>'; E.paintCityPanelSections(c.mounts, c.city, c.map, c.refresh, c.onCloseNew); return mountsHtml(c.mounts); });
  add('paintCityPanelSections', 'paint.newOnClose', {}, baseState(), (E, c) => { E.paintCityPanelSections(c.mounts, c.city, c.map, c.refresh, c.onCloseNew); return 'closeTest'; });
  add('paintCityPanelSections', 'paint.keepOnClose', {}, baseState(), (E, c) => { E.paintCityPanelSections(c.mounts, c.city, c.map, c.refresh, undefined); return 'closeTest'; });
  // argRefresh: paint dostaje refresh z argumentu (stan bez refresh); k07Null: lustro K07A rozjechane przed wejściem.
  add('paintCityPanelSections', 'paint.argRefresh', {}, baseState(), (E, c) => { E.paintCityPanelSections(c.mounts, c.city, c.map, c.refresh, c.onCloseNew); return 'argRefresh'; });
  SCEN[SCEN.length - 1].argRefresh = true;
  add('paintCityPanelSections', 'paint.k07Null', {}, { ...baseState(), k07Null: true }, (E, c) => { E.paintCityPanelSections(c.mounts, c.city, c.map, c.refresh, c.onCloseNew); return 'k07Null'; });

  // showCityPanel
  add('showCityPanel', 'show.basic', {}, baseState(), (E, c) => { E.showCityPanel(CITY_A, MAP, c.onCloseNew); return c.root.outerHTML; });
  add('showCityPanel', 'show.refreshCb', {}, baseState(), (E, c) => { E.showCityPanel(CITY_A, MAP, c.onCloseNew); if (FIX.frame && FIX.frame.refresh) FIX.frame.refresh(); return c.root.outerHTML; });
  add('showCityPanel', 'show.refreshNoMap', {}, baseState({ map: null }), (E, c) => { E.showCityPanel(CITY_A, null, c.onCloseNew); if (FIX.frame && FIX.frame.refresh) FIX.frame.refresh(); return c.root.outerHTML; });

  // hideCityPanel
  add('hideCityPanel', 'hide.basic', {}, baseState(), (E, c) => { E.hideCityPanel(); return c.root.outerHTML; });

  // rejestrator log z wnętrza scenariuszy (tylko pin i port dzielą FIX)
  function FIX_LOG(v) { FIX.log.push(v); }

  const runSide = async (side, sc) => {
    resetFix(sc.cfgExtra);
    clearDoc();
    const E = side === 'pin' ? mod.PINX : mod.PORT;
    const root = mk();
    const ctx = {
      root: sc.state.noRoot ? null : root,
      mounts: null,
      city: sc.state.city,
      map: sc.state.map,
      refresh: sc.state.refresh || sc.argRefresh ? () => FIX.log.push(['refresh']) : null,
      onCloseNew: () => FIX.log.push(['onCloseNew']),
    };
    ctx.mounts = mountsOf();
    // Stan OBU stron: moduły portu (K06A/K07A/K08A/K06B) są współdzielone przez renderery, więc stan portu jest
    // ustawiany zawsze (także dla strony pinu), inaczej strona pinu czytałaby stan poprzedniego scenariusza.
    const onClose = sc.id.startsWith('paint.keep') ? () => FIX.log.push(['keptClose']) : () => FIX.log.push(['oldClose']);
    const state = { ...sc.state, root: ctx.root, refresh: sc.state.refresh ? ctx.refresh : null, onClose };
    mod.PINX.PIN_STATE.set(state);
    mod.PORT_STATE.set(state);
    const outStr = await safe(() => sc.call(E, ctx));
    // Efekt zamknięcia: wywołanie aktywnego onClose po scenariuszu (sprawdza identyczność wiązania).
    const closeFn = side === 'pin' ? mod.PINX.PIN_STATE.onClose() : mod.PORT_STATE.onClose();
    if (sc.id.startsWith('paint.')) await safe(() => closeFn());
    const snap = side === 'pin' ? mod.PINX.PIN_STATE.get() : mod.PORT_STATE.get();
    return JSON.stringify({ out: outStr, log: FIX.log, st: snap });
  };

  for (const u of UNITS) {
    const rows = SCEN.filter((s) => s.unit === u.name);
    let covered = 0;
    for (const sc of rows) {
      const pinOut = await runSide('pin', sc);
      const portOut = await runSide('port', sc);
      const pinOk = !JSON.parse(pinOut).out?.toString().startsWith('THROW:');
      if (process.env.K09A_SHOW === sc.id) console.log(`SHOW ${sc.id} pin=${pinOut.slice(0, 1500)}\nSHOW ${sc.id} port=${portOut.slice(0, 1500)}`);
      if (pinOk) covered += 1;
      check(`exec.${sc.id}`, `pin-exec vs port: ${sc.id}${pinOk ? '' : ' (pin THROW)'}`, portOut === pinOut && pinOk, pinOk ? diffAt(pinOut, portOut) : pinOut.slice(0, 400));
    }
    check(`cover.${u.name}`, `${u.name}: >=1 scenariusz bez wyjątku po stronie pinu (${covered}/${rows.length})`, covered >= 1);
  }
  clearDoc();
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  rmSync(TMP, { recursive: true, force: true });
  process.exit(2);
}
rmSync(TMP, { recursive: true, force: true });

const fails = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.what}${r.ok || !r.detail ? '' : `\n     ${r.detail}`}`);
console.log(`\nk09a-pin: ${results.length - fails.length}/${results.length} zgodnych`);
process.exit(fails.length === 0 ? 0 : 1);
