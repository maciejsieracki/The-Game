#!/usr/bin/env node
/**
 * run-k01b.mjs — harness P5-8 K01B (R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1, runda 2): 57 odroczonych jednostek K01
 * (`src/ui/cityPanel/k01b-{t,r,f,dom,reguly,dto}.ts`) vs pin `edb8fb56` `gra/src/ui/cityPanel.ts` — WARTOŚCI i DOM.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-k01b.mjs --pin-dir <PIN_DIR> [--v2-dir <katalog cityPanel>] [--json <plik>]
 *
 * Pinowe odniesienie (`<PIN_DIR>/gra/src/ui/__k01b_pin_ref.ts`, tworzone w kopii pinu, nie w repo):
 *   cały `cityPanel.ts` z `export` dopisanym do deklaracji najwyższego poziomu w kolumnie 0 (treść bez zmian)
 *   + obiekt `__K01B_PORT` z funkcjami reguł importowanymi przez sam pin.
 *
 * Port reguł w v2: wstrzykiwany przez `ustawRegulyKontrolera` (k01b-reguly.ts) jako port TESTOWY = funkcje pinu,
 * z licznikiem wywołań. Sprawdza kontrakt wywołań jednostek R (argumenty, wynik), NIE produkcyjny port kontrolera
 * (NIE_ZMIERZONO — brak zapytań silnika, osobny temat).
 *
 * Bramki (EXIT 0 ⇔ X, E, F, P, N, J zielone):
 *   X  zakres: 57 nazw z `odroczone.json` istnieje w v2 jako eksport wartości lub typ/interfejs w źródle v2.
 *   E  bundle: v2 i pin (odniesienie) pakowane i importowane; `installStaticCatalog` przed ewaluacją.
 *   F  wartości i DOM: każdy eksport wartości v2 i pinu o tej samej nazwie wołany z tym samym zestawem argumentów
 *      (funkcje) lub porównany jako wartość (stałe); wynik = wartość + outerHTML argumentów `@MOUNT`/`@BTN`.
 *      Pokrycie gałęzi: NIE_ZMIERZONO (zestaw argumentów nie jest miarą pokrycia).
 *   P  port reguł: każda z 14 metod `CityPanelRulesPort` wywołana co najmniej raz przez jednostki v2.
 *   N  każda funkcja v2 zwróciła wartość bez wyjątku dla co najmniej jednego zestawu argumentów.
 * EXIT 2 ⇔ błąd harnessu (brak argumentów, plików pinu, listy odroczonych).
 */
import { readFileSync, readdirSync, statSync, mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const FRONT = resolve(HERE, '../..');
const PIN_DIR = argOf('--pin-dir');
const V2_DIR = resolve(argOf('--v2-dir') ?? join(FRONT, 'src/ui/cityPanel'));
const JSON_OUT = argOf('--json');
const ODR = resolve(
  argOf('--odroczone') ?? join(FRONT, '../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1/r3-logi/odroczone.json'),
);
const PIN_CP = PIN_DIR ? join(PIN_DIR, 'gra/src/ui/cityPanel.ts') : '';
const PIN_SRC = PIN_DIR ? join(PIN_DIR, 'gra/src') : '';
const PIN_REF = join(PIN_SRC, 'ui/__k01b_pin_ref.ts');
const V2_MODULES = ['k01b-t.ts', 'k01b-r.ts', 'k01b-f.ts', 'k01b-dom.ts', 'k01b-reguly.ts', 'k01b-dto.ts'];
const PORT_METHODS = [
  'etaTurns', 'buildingEffectAtLevel', 'stockResourceLabel', 'buildingUpkeep', 'buildingResourceUpkeep',
  'addResourceCosts', 'mnoznikRoleForBuildingId', 'cumulativeMnoznikForBuildingId', 'buildingStructuralDefenseBonusPercent',
  'rationGrowthPercent', 'rationFoodCostPerPop', 'growthGainPerTurnSlots', 'turnsUntilNextCitizen',
];

if (!PIN_DIR || !existsSync(PIN_CP)) {
  console.error('Użycie: node tools/dom-harness/run-k01b.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56> [--v2-dir <dir>] [--json <plik>]');
  process.exit(2);
}
if (!existsSync(ODR)) {
  console.error(`brak listy odroczonych: ${ODR}`);
  process.exit(2);
}

const log = (...a) => console.log(...a);
const TOP_DECL = /^(const|let|var|function|class|type|interface|enum|async function)\s/;

// ─── pinowe odniesienie ──────────────────────────────────────────────────────
const pinLines = readFileSync(PIN_CP, 'utf8').split('\n');
const pinRefBody = pinLines.map((l) => (TOP_DECL.test(l) && !/^export /.test(l) ? 'export ' + l : l));
// Stałe importowane przez pin z game/ (np. PODZIAL_PRACY_PULA_LBL z game/cities.ts) — re-eksport do porównania wartości.
pinRefBody.push(`\nexport { PODZIAL_PRACY_PULA_LBL, PODZIAL_PRACY_PULA_LBL_PELNA, PODZIAL_PRACY_PULA_TIP } from '../game/cities';`);
pinRefBody.push(`export { CITY_PANEL_RANGE_DEPOSIT_LABELS } from '../game/resource-access';`);
pinRefBody.push(`export { categoryOf } from '../units/setup';`);
pinRefBody.push(`export { frontItem } from '../game/production';`);
pinRefBody.push(`\nexport const __K01B_PORT = { ${PORT_METHODS.join(', ')} };\n`);
writeFileSync(PIN_REF, pinRefBody.join('\n'));

// ─── dane z pinu ─────────────────────────────────────────────────────────────
const GD = join(PIN_DIR, 'gra/data');
const rawB = JSON.parse(readFileSync(join(GD, 'buildings.json'), 'utf8'));
const rawU = JSON.parse(readFileSync(join(GD, 'units.json'), 'utf8'));
const DATA = { buildings: Array.isArray(rawB) ? rawB : rawB.buildings, units: Array.isArray(rawU) ? rawU : rawU.units };
const UI_PARAMS = JSON.parse(readFileSync(join(GD, 'ui-params.json'), 'utf8'));
const ODR_LIST = JSON.parse(readFileSync(ODR, 'utf8'));

// ─── jsdom (globalne DOM dla obu stron) ──────────────────────────────────────
const jsdomErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => jsdomErrors.push(String(e?.message ?? e).split('\n')[0]));
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true, virtualConsole: vc });
const W = dom.window;
for (const k of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLDivElement', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLSpanElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'localStorage', 'location', 'navigator', 'matchMedia', 'SVGElement', 'DocumentFragment']) {
  const v = k === 'window' ? W : W[k];
  if (v === undefined) continue;
  Object.defineProperty(globalThis, k, { value: typeof v === 'function' && k !== 'window' && /^[a-z]/.test(k) ? v.bind(W) : v, configurable: true, writable: true });
}

const findFile = (dir, base) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      const r = findFile(p, base);
      if (r) return r;
    } else if (name === base) return p;
  }
  return null;
};

// ─── bundle, import, porównanie ──────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'k01b-harness-'));
const gates = { X: false, E: false, F: false, P: false, N: false, J: false };
const report = { gates, details: {} };
let fatal = null;
try {
  const outV2 = join(tmp, 'v2');
  const outPin = join(tmp, 'pin');
  await bundle([...V2_MODULES.map((m) => join(V2_DIR, m)), join(FRONT, 'src/controller/staticCatalog.ts')], outV2);
  // Drugi wpis ustala wspólną bazę wyjścia (pojedynczy wpis dawałby nazwę `.js`).
  await bundle([PIN_REF, join(PIN_SRC, 'ui/formatPl.ts')], outPin);
  gates.E = true;

  // Pin najpierw (nie zależy od katalogu v2): z niego powstaje katalog statyczny v2 (kategorie jednostek).
  const pinBundle = findFile(outPin, '__k01b_pin_ref.js');
  if (!pinBundle) throw new Error('pakiet pinu bez __k01b_pin_ref.js: ' + readdirSync(outPin, { recursive: true }).join(','));
  const P = await import(pathToFileURL(pinBundle).href);

  // Katalog statyczny v2 (StaticCatalogDto): kategorie jednostek = wynik pinowego `categoryOf` (units/setup.ts:239),
  // ta sama funkcja po obu stronach. Nazwa spoza katalogu w v2 = 'domyslny' (ZAŁOŻENIE P5.2-Z2, ADAPT-2) — dlatego
  // mapa nazw-only obejmuje też łańcuchy z zestawów argumentów: gap dla nazw spoza units.json jest opisany, nie ukryty.
  const catCat = {};
  const catNameOnly = {};
  for (const u of DATA.units) {
    catCat[u.Jednostka] = P.categoryOf(u.Jednostka, u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    catNameOnly[u.Jednostka] = P.categoryOf(u.Jednostka, '', false, undefined);
  }
  const SC = await import(pathToFileURL(findFile(outV2, 'staticCatalog.js')).href);
  SC.installStaticCatalog({ uiParams: UI_PARAMS, unitCategory: catCat, unitCategoryNameOnly: catNameOnly });
  const Vmods = {};
  for (const m of V2_MODULES) Vmods[m] = await import(pathToFileURL(findFile(outV2, m.replace(/\.ts$/, '.js'))).href);
  const V = {};
  for (const m of V2_MODULES) {
    for (const [k, v] of Object.entries(Vmods[m])) {
      if (k in V) throw new Error(`kolizja nazwy eksportu v2: ${k}`);
      V[k] = v;
    }
  }

  // Port testowy: funkcje pinu z licznikiem wywołań.
  const portCalls = Object.fromEntries(PORT_METHODS.map((m) => [m, 0]));
  const port = Object.fromEntries(PORT_METHODS.map((m) => [m, (...a) => {
    portCalls[m]++;
    return P.__K01B_PORT[m](...a);
  }]));
  // J: bez wstrzyknięcia port rzuca jawny błąd (brak cichego fallbacku, K01B-Z3). Sprawdzane PRZED wstrzyknięciem.
  let noPortMsg = null;
  try {
    Vmods['k01b-reguly.ts'].reguly();
  } catch (e) {
    noPortMsg = String(e?.message ?? e);
  }
  gates.J = noPortMsg !== null && noPortMsg.includes('nie został wstrzyknięty');
  report.details.J = { noPortMsg };
  Vmods['k01b-reguly.ts'].ustawRegulyKontrolera(port);

  // ─── X: zakres 57 nazw ────────────────────────────────────────────────────
  const typeSrc = V2_MODULES.map((m) => readFileSync(join(V2_DIR, m), 'utf8')).join('\n');
  const missingX = [];
  for (const u of ODR_LIST) {
    const isRuntime = u.name in V;
    const isType = new RegExp(`export\\s+(type|interface)\\s+${u.name}\\b`).test(typeSrc);
    if (!isRuntime && !isType) missingX.push(u.name);
  }
  gates.X = missingX.length === 0 && ODR_LIST.length === 57;
  report.details.X = { units: ODR_LIST.length, missing: missingX };

  // ─── F, N: wartości i DOM ─────────────────────────────────────────────────
  const OBJ = { label: 'Zboze', met: true, iconHtml: '<i>x</i>', value: '3', icon: 'food', id: 'food', nazwa: 'Zboze', wzrost: 12, ilosc: 3, kind: 'building', hint: 'h', cls: 'c', text: 'Tekst', max: 5 };
  const b0 = DATA.buildings[0];
  const u0 = DATA.units[0];
  const PROD = {
    kolejka: [
      { kind: 'budynek', id: b0.id, nazwa: 'B1', koszt: 50, postep: 10 },
      { kind: 'jednostka', id: u0.id, koszt: 30 },
      { kind: 'budynek', id: DATA.buildings[1]?.id ?? b0.id, koszt: 40 },
    ],
    postep: 5,
    wstrzymana: false,
    rekrutacja: [{ kind: 'jednostka', id: DATA.units[1]?.id ?? u0.id, koszt: 25 }],
  };
  const VIEW = {
    praca: 5, pieniadz: 3, nauka: 2, kultura: 1, zywnoscNetto: 2, zywnoscBrutto: 6, kosztRacji: 4, bilansLokalny: 2,
    poziomRacji: 1, wzrostProcent: 12, growthBreakdown: { total: 12, racje: 4, maleMiasto: 0, spichlerz: 2, zdrowie: 1, szczescie: 1, cywilizacja: 2, zaopatrzenie: 2 },
    wzrostUlamkowy: 0.42, maSpichlerz: true, maAkwedukt: false, popCapBezAkweduktu: 5, popCapSpichlerz: 8, popCapZAkweduktem: 12,
    popCapAktualny: 8, atPopCap: false, citizenUpkeep: { pokrycie: 1 },
  };
  const POOL = [
    0, 1, 1234.567, -1, 'food', 'drewno', 'budowa', '@MOUNT', DATA, PROD, VIEW, b0, u0, true, null, undefined,
    [PROD.kolejka[0]], 'Zboze', 'lad', OBJ, '@BTN', 'tur', [b0], 'Podatek', 2,
    'spokoj', 'napiecie', 'niepokoj', 'bunt', 'bunt_skrajny', 'budynek', 'jednostka', 'Pieniądz',
  ];
  const mkArg = (x, mounts) => {
    if (x === '@MOUNT' || x === '@BTN') {
      const m = W.document.createElement(x === '@BTN' ? 'button' : 'div');
      mounts.push(m);
      return m;
    }
    return x === undefined || x === null || typeof x !== 'object' ? x : structuredClone(x);
  };
  const ser = (v) => {
    if (typeof v === 'function') return 'fn:' + v.name;
    if (v === undefined) return '__undef__';
    if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
    if (v && typeof v === 'object' && typeof v.outerHTML === 'string') return { html: v.outerHTML };
    if (v instanceof Set) return { set: [...v].map(ser) };
    if (v instanceof Map) return { map: [...v].map(([k, x]) => [ser(k), ser(x)]) };
    if (Array.isArray(v)) return v.map(ser);
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v).sort()) o[k] = ser(v[k]);
      return o;
    }
    return v;
  };
  const callOut = (fn, a) => {
    const mounts = [];
    const real = a.map((x) => mkArg(x, mounts));
    try {
      const ret = fn(...real);
      return 'ok:' + JSON.stringify({ ret: ser(ret), mounts: mounts.map((m) => m.outerHTML) });
    } catch (e) {
      // Nazwy zmiennych minifikowanych w bundlach różnią się (text5 vs text): cyfry z identyfikatorów odrzucamy.
      const msg = String(e?.message ?? e).replace(/\b([A-Za-z_$]+?)\d+\b/g, '$1').slice(0, 160);
      return 'err:' + e?.name + ':' + msg;
    }
  };
  const combos = (arity) => {
    const n = Math.max(arity, 1);
    const out = [];
    for (let idx = 0; idx < POOL.length; idx++) {
      const a = [];
      for (let i = 0; i < n; i++) a.push(POOL[(idx + 3 * i) % POOL.length]);
      out.push(a.slice(0, arity));
    }
    return out;
  };

  // Scenariusze jawne (argumenty realnego użycia): jednostki R wołające reguły, których losowy zestaw nie trafia.
  // Dobierane z danych pinu przez port odniesienia (nie przez wartości zakodowane w harnessie).
  const mnozDef = DATA.buildings.find((b) => P.__K01B_PORT.mnoznikRoleForBuildingId(b.id) != null) ?? b0;
  const resIds = DATA.buildings.filter((b) => Object.keys(P.__K01B_PORT.buildingResourceUpkeep(b)).length > 0).map((b) => b.id);
  const RES_DISPLAY = { gold: 3, resources: { drewno: 2, kamien: 1 } };
  const PRODR = { ...PROD, rekrutacja: [
    { kind: 'jednostka', id: u0.id, koszt: 10 },
    { kind: 'jednostka', id: DATA.units[1]?.id ?? u0.id, koszt: 20 },
    { kind: 'jednostka', id: DATA.units[2]?.id ?? u0.id, koszt: 30 },
  ] };
  const SCEN = {
    clampedGrowthBreakdown: [[VIEW, 0], [VIEW, 5], [VIEW]],
    moveQueueItem: [[PROD, 1, 1], [PROD, 2, -1], [PROD, 1, -1], [PROD, 0, 1], [PROD, 2, 1]],
    moveRecruitQueueItem: [[PRODR, 1, 1], [PRODR, 2, -1], [PRODR, 1, -1], [PRODR, 0, 1]],
    reorderQueueItem: [[PROD, 1, 2], [PROD, 2, 0], [PROD, 0, 1], [PROD, 2, 1], [PROD, 1, 1]],
    reorderRecruitQueueItem: [[PRODR, 0, 2], [PRODR, 2, 0], [PRODR, 1, 0], [PRODR, 1, 1]],
    buildGrowthProgressUi: [
      [5, VIEW, 0, true, false, 12], [5, VIEW, 0, true, false, 0], [5, VIEW, 0, false, false, 12],
      [5, VIEW, 0, true, true, 12], [5, VIEW, 0, true, false], [0, VIEW, 0, true, false, 12],
    ],
    buildingBonusChipsHtml: [[mnozDef, DATA.buildings, 3, 1], [mnozDef, DATA.buildings, 3, 3], [b0, DATA.buildings, 3, 1]],
    buildingOwnedBonusCompactHtml: [[mnozDef, 1, DATA.buildings], [mnozDef, 2, DATA.buildings, { compact: true }], [b0, 1, DATA.buildings]],
    sumOwnedBuildingsResourceUpkeep: [[resIds, DATA], [['__brak__'], DATA], [[], DATA]],
    buildingUpkeepDisplay: [[mnozDef, 1], [b0, 2], [b0, 0]],
    formatBuildingUpkeepGridValue: [[RES_DISPLAY], [{ gold: 0, resources: {} }]],
    formatBuildingUpkeepRowHtml: [[RES_DISPLAY, false], [RES_DISPLAY, true], [{ gold: 0, resources: {} }, false]],
    formatBuildingUpkeepTotalHtml: [[7, { drewno: 2 }, false], [0, {}, true]],
    formatConverterProductionRowHtml: [[{ consumed: { drewno: 2 }, produced: { zywnosc: 1 } }, false], [{ consumed: {}, produced: {} }, true]],
    formatResourceUpkeepText: [[{ drewno: 2, kamien: 1 }, false], [{ drewno: 2 }, true], [{}, false]],
    productionItemIconHtml: [[DATA, PROD.kolejka[0]], [null, PROD.kolejka[1]], [DATA, PROD.kolejka[2]]],
    unitIconHtml: [[u0, 'x'], [u0, undefined], [undefined, undefined]],
    unitMedallionHtml: [[u0, 'x', 22], [u0, undefined, 30], [undefined]],
    wyzwienieSummaryLabel: [[1, undefined], [2, {}]],
  };
  // Nazwy-only dla łańcuchów z zestawów argumentów (klasyfikacja nazwy spoza units.json: ADAPT-2, P5.2-Z2).
  const nameOnlyMap = SC.staticCatalog().unitCategoryNameOnly;
  for (const x of [...POOL, '__brak__', 'x']) {
    if (typeof x === 'string' && !(x in nameOnlyMap)) nameOnlyMap[x] = P.categoryOf(x, '', false, undefined);
  }
  const names = [...new Set([...Object.keys(V), ...ODR_LIST.map((u) => u.name)])].sort();
  const diffs = [];
  const notMeasuredAllThrow = [];
  let cases = 0;
  let adapt2Count = 0;
  const adapt2Samples = [];
  let diffCount = 0;
  const kinds = { fn: 0, const: 0 };
  // Nazwy v2 różne od pinu (zmiana nazwy K01B-Z5: frontItem -> frontItemK). Pozostałe eksporty v2 spoza pinu
  // (np. `reguly`, `ustawRegulyKontrolera` — infrastruktura portu, bez odpowiednika w pinie) są poza porównaniem.
  const ALIAS = { frontItemK: 'frontItem' };
  const ODR_NAMES = new Set(ODR_LIST.map((u) => u.name));
  const INFRA = [];
  for (const name of names) {
    if (!(name in V)) continue; // typ-only (sprawdzone w X)
    const pinName = ALIAS[name] ?? name;
    if (!(pinName in P)) {
      if (!ODR_NAMES.has(name)) {
        INFRA.push(name);
        continue;
      }
      diffCount++;
      diffs.push({ name, why: 'brak w pinie' });
      continue;
    }
    const fv = V[name];
    const fp = P[pinName];
    if (typeof fv !== typeof fp) {
      diffCount++;
      diffs.push({ name, why: `typ ${typeof fv} vs ${typeof fp}` });
      continue;
    }
    if (typeof fv === 'function') {
      kinds.fn++;
      let okAny = false;
      let firstErr = null;
      for (const a of [...combos(fv.length), ...(SCEN[name] ?? [])]) {
        cases++;
        const x = callOut(fv, a);
        const y = callOut(fp, a);
        if (x.startsWith('ok:')) okAny = true;
        else firstErr ??= x;
        if (x !== y) {
          // ADAPT-2 (P5.2-Z2, ui/icons/brandAssets.ts): pin `categoryOf` przyjmuje tylko łańcuch nazwy (dla innego typu
          // rzuca `normalize`/`replace`); v2 czyta katalog i zwraca 'domyslny'. Klasa rozliczona, NIE ukryta:
          // liczona osobno i wymagana jako jedyna dopuszczalna klasa różnic (gate F = zero różnic poza tą klasą).
          const adapt2 = x.startsWith('ok:') && y.startsWith('err:TypeError:') && /normalize|replace/.test(y);
          if (adapt2) {
            adapt2Count++;
            if (adapt2Samples.length < 8) adapt2Samples.push({ name, args: a.map((z) => (typeof z === 'object' && z !== null ? '{obj}' : String(z))).join('|'), pin: y.slice(0, 90) });
            continue;
          }
          diffCount++;
          if (diffs.length < 400) diffs.push({ name, args: a.map((z) => (typeof z === 'object' && z !== null ? '{obj}' : String(z))).join('|'), v2: x.slice(0, 200), pin: y.slice(0, 200) });
        }
      }
      if (!okAny) notMeasuredAllThrow.push(`${name} [${String(firstErr).slice(0, 120)}]`);
    } else {
      kinds.const++;
      cases++;
      const x = JSON.stringify(ser(fv));
      const y = JSON.stringify(ser(fp));
      if (x !== y) {
        diffCount++;
        diffs.push({ name, v2: x.slice(0, 200), pin: y.slice(0, 200) });
      }
    }
  }
  gates.F = diffCount === 0 && cases > 0;
  gates.N = notMeasuredAllThrow.length === 0;
  report.details.F = { names: names.length, kinds, cases, diffCount, diffs, adapt2Count, adapt2Samples, infraSkipped: INFRA };
  report.details.N = { notMeasuredAllThrow };

  // ─── P: port reguł ────────────────────────────────────────────────────────
  const notCalled = PORT_METHODS.filter((m) => portCalls[m] === 0);
  gates.P = notCalled.length === 0;
  report.details.P = { calls: portCalls, notCalled };
} catch (e) {
  fatal = String(e?.stack ?? e).split('\n').slice(0, 8).join(' | ');
} finally {
  rmSync(tmp, { recursive: true, force: true });
  rmSync(PIN_REF, { force: true });
}

if (fatal) {
  log('run-k01b: BLAD HARNESSU', fatal);
  process.exitCode = 2;
} else {
  const failed = Object.keys(gates).filter((g) => !gates[g]);
  log(`run-k01b: v2=${V2_DIR}`);
  log(`X zakres 57 nazw: ${gates.X ? 'OK' : 'FAIL'} (jednostki ${report.details.X.units}, brak ${report.details.X.missing.length}: ${report.details.X.missing.join(',')})`);
  log(`E bundle v2+pin: ${gates.E ? 'OK' : 'FAIL'}`);
  log(`F wartosci+DOM: ${gates.F ? 'OK' : 'FAIL'} (nazwy ${report.details.F.names}, fn ${report.details.F.kinds.fn}, stale ${report.details.F.kinds.const}, przypadki ${report.details.F.cases}, roznice ${report.details.F.diffCount}, ADAPT-2 rozliczone ${report.details.F.adapt2Count}, pomieta infrastruktura ${report.details.F.infraSkipped.join(',')})`);
  for (const d of report.details.F.diffs) log('  roznica:', JSON.stringify(d).slice(0, 400));
  log(`N bez wyjatku: ${gates.N ? 'OK' : 'FAIL'} (tylko-wyjatki: ${report.details.N.notMeasuredAllThrow.join(',') || 'brak'})`);
  log(`P port regul: ${gates.P ? 'OK' : 'FAIL'} (wywolania ${JSON.stringify(report.details.P.calls)}; nieuzyte: ${report.details.P.notCalled.join(',') || 'brak'})`);
  log(`J brak portu rzuca: ${gates.J ? 'OK' : 'FAIL'} (${report.details.J.noPortMsg ?? 'nie rzucil'})`);
  log(`WYNIK: ${failed.length === 0 ? 'ZIELONE (X,E,F,P,N,J)' : 'CZERWONE: ' + failed.join(',')}`);
  process.exitCode = failed.length === 0 ? 0 : 1;
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ ...report, gates }, null, 2));
}
