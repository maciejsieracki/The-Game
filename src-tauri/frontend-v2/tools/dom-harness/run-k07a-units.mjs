#!/usr/bin/env node
/**
 * run-k07a-units.mjs — harness porównania wartości/tekstu: jednostki K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1,
 * runda 2) — port (`src/ui/cityPanel/k07a-fundament.ts`) vs pin web `edb8fb56` (`gra/src/ui/cityPanel.ts`).
 *
 * Jednostki pinu wyciągane PO NAZWIE (od `function NAME`/`const NAME` w kolumnie 0 do końca bloku). Zależności
 * zewnętrzne pinu (`cfg`, `buildChipDeltaStockHtml`) są po obu stronach tym samym fixture (`globalThis.__K07_FIX`).
 * `resourceScopeClass` idzie PRAWDZIWYM kodem pinu (`gra/src/ui/resourceColors.ts`) po obu stronach.
 * Port dostaje zależności przez adapter testowy (kontrakt K07A-Z2: `isMe` z fallbackiem, `getCities` z `[]`).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k07a-units.mjs --pin-dir <PIN_DIR> [--v2 <plik-portu>]
 *   <PIN_DIR> = katalog poza repo z `git archive edb8fb56 gra/src gra/data`.
 * EXIT 0 <=> 0 różnic; 1 <=> >=1 różnica; 2 <=> błąd harnessu.
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k07a-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56> [--v2 <plik>]');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const V2_FILE = resolve(argOf('--v2') ?? join(V2_ROOT, 'src/ui/cityPanel/k07a-fundament.ts'));
const PIN_ROOT = resolve(PIN_DIR);
const PIN_FILE = join(PIN_ROOT, 'gra/src/ui/cityPanel.ts');
const PIN_RC = join(PIN_ROOT, 'gra/src/ui/resourceColors.ts');
const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');

/** Blok najwyższego poziomu z pinu: od linii `function NAME`/`const NAME` do `}` (function) lub `;` (const). */
function extractTop(name) {
  const re = new RegExp(`^(export )?(function|const) ${name}\\b`);
  const i = pinLines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak deklaracji ${name}`);
  let j = i;
  if (/^(export )?const /.test(pinLines[i]) && pinLines[i].trimEnd().endsWith(';')) {
    j = i;
  } else if (/^(export )?const /.test(pinLines[i])) {
    while (!/^\S.*;\s*$/.test(pinLines[j]) || j === i) j++;
  } else {
    while (pinLines[j] !== '}') j++;
  }
  return pinLines.slice(i, j + 1).join('\n').replace(/^(export )?(function|const) /m, (_m, _e, kw) => `export ${kw} `);
}

/** Jednostki pinu używane w harnessie (`isMeCity` tylko jako zależność pinu, `W3_STAT_RES_KEY` itd. jako jednostki K07A). */
const UNIT_NAMES = ['isMeCity', 'W3_STAT_RES_KEY', 'resolveActiveCity', 'w3CityChip', 'capitalBadgeOrButtonHtml'];
/** Stan modułu pinu: `let activeCity` (:10159) i `let uxSectionRefresh` (:10365). */
const pinStateActive = pinLines.slice(10158, 10159).join('\n');
const pinStateUx = pinLines.slice(10364, 10365).join('\n');

const PIN_PRELUDE = `
import { resourceScopeClass as __pinRSC } from ${JSON.stringify(PIN_RC)};
const resourceScopeClass = __pinRSC;
const cfg = new Proxy({}, { get: (_t, k) => globalThis.__K07_FIX.cfg[k] });
const buildChipDeltaStockHtml = (r, s) => globalThis.__K07_FIX.chipDeltaStockHtml(r, s);
export const __setCity = (c) => { activeCity = c; };
export const __getCity = () => activeCity;
export const __setUx = (f) => { uxSectionRefresh = f; };
export const __getUx = () => uxSectionRefresh;
`;

/** Fixture: cztery miasta (dwóch właścicieli, stolice, oblężenie), warianty `v` (brak pól cfg, stany). */
function makeFixture(v) {
  const cities = [
    { id: 'c1', ownerId: 0, name: 'Alfa', population: 3, oblegane: false },
    { id: 'c2', ownerId: 0, name: 'Beta', population: 5, oblegane: true },
    { id: 'c3', ownerId: 1, name: 'Gamma', population: 1, oblegane: false },
    { id: 'c4', ownerId: 1, name: 'Delta "x"', population: 2, oblegane: true },
  ];
  const capitals = [{ 0: 'c2', 1: 'c3' }, { 0: 'c1', 1: null }, { 0: 'zz', 1: 'c4' }, { 0: undefined, 1: 'c3' }][v % 4];
  return {
    cfg: {
      isMe: v % 5 === 0 ? undefined : (o) => (o + v) % 2 === 0,
      getCapitalCityId: v % 3 === 0 ? undefined : (o) => capitals[o],
      getCities: v % 4 === 3 ? undefined : () => cities,
      onSetCapital: v % 2 === 0 ? () => {} : undefined,
    },
    chipDeltaStockHtml: (r, s) => `<d ${String(r)}|${String(s)}|v${v}>`,
    cities,
  };
}

/** Wartość porównywalna: JSON z jawnym zapisem liczb niesk., undefined i funkcji. */
function canon(x) {
  return JSON.stringify(x, (_k, val) => {
    if (typeof val === 'number' && !Number.isFinite(val)) return `#${String(val)}`;
    if (val === undefined) return '#undef';
    if (typeof val === 'function') return '#fn';
    return val;
  });
}

const tmp = mkdtempSync(join(tmpdir(), 'p58k07a-harness-'));
let exitCode = 0;
let comparisons = 0;
let diffs = 0;
const report = [];
const perUnit = {};
const cmp = (unit, pinOut, v2Out) => {
  comparisons++;
  perUnit[unit] = (perUnit[unit] ?? 0) + 1;
  const pc = canon(pinOut);
  const vc = canon(v2Out);
  if (pc !== vc) {
    diffs++;
    report.push({ unit, pin: pc, v2: vc });
  }
};

try {
  const pinSrc = [
    PIN_PRELUDE,
    pinStateActive,
    pinStateUx,
    ...UNIT_NAMES.map(extractTop),
    '',
  ].join('\n');
  const probe = join(tmp, 'pin-probe.ts');
  writeFileSync(probe, pinSrc);
  const pinBundle = join(tmp, 'pin.mjs');
  await esbuild.build({ entryPoints: [probe], outfile: pinBundle, bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error' });
  const v2Bundle = join(tmp, 'v2.mjs');
  await esbuild.build({ entryPoints: [V2_FILE], outfile: v2Bundle, bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error' });

  globalThis.__K07_FIX = makeFixture(0);
  const P = await import(pathToFileURL(pinBundle).href);
  const V = await import(pathToFileURL(v2Bundle).href);
  const G = () => globalThis.__K07_FIX;
  /** Adapter testowy zależności portu (kontrakt K07A-Z2): fallbacki pinu przeniesione do adaptera. */
  const installDeps = () => V.setK07aDeps({
    isMe: (o) => G().cfg.isMe?.(o) ?? (o === 0),
    getCapitalCityId: (o) => G().cfg.getCapitalCityId?.(o) ?? null,
    getCities: () => G().cfg.getCities?.() ?? [],
    canSetCapital: !!G().cfg.onSetCapital,
    chipDeltaStockHtml: (r, s) => G().chipDeltaStockHtml(r, s),
  });

  const fnA = () => {};
  const fnB = () => {};
  const copy = (c) => (c === null ? null : { ...c });
  const STATES = [
    null,
    { id: 'c1', ownerId: 0, name: 'STALE', population: 99 },
    { id: 'c3', ownerId: 1, name: 'STALE', population: 0 },
    { id: 'zz', ownerId: 0, name: 'Nieistniejące', population: 7 },
  ];
  const STAT_IDS = ['praca', 'zywnosc', 'zloto', 'nauka', 'kultura', 'religia', 'brak', 'constructor', '__proto__', 'toString'];
  const CIV_RATES = [undefined, 0, 3, -2, Infinity, NaN];
  const CIV_STOCKS = [undefined, 12, NaN, -Infinity];
  const HINTS = ['Tempo "x" & <y>', 'zwykły'];

  for (let v = 0; v < 8; v++) {
    const fix = makeFixture(v);
    globalThis.__K07_FIX = fix;
    installDeps();

    // Stan modułu uxSectionRefresh (K07A-Z3): rejestracja, nadpisanie, wyrejestrowanie.
    for (const f of [fnA, fnB, null]) {
      P.__setUx(f);
      V.setK07aUxSectionRefresh(f);
      const pinS = { isNull: P.__getUx() === null, isA: P.__getUx() === fnA, isB: P.__getUx() === fnB };
      const v2S = { isNull: V.getK07aUxSectionRefresh() === null, isA: V.getK07aUxSectionRefresh() === fnA, isB: V.getK07aUxSectionRefresh() === fnB };
      cmp('uxSectionRefresh', pinS, v2S);
    }

    // W3_STAT_RES_KEY: cała mapa i odczyty kluczy (w tym klucze z prototypu — zachowanie `Record`).
    cmp('W3_STAT_RES_KEY', P.W3_STAT_RES_KEY, V.W3_STAT_RES_KEY_K07);
    for (const k of STAT_IDS) cmp('W3_STAT_RES_KEY', P.W3_STAT_RES_KEY[k], V.W3_STAT_RES_KEY_K07[k]);

    // resolveActiveCity: odświeżenie z listy miast; brak miasta w liście = zachowany stan.
    for (const st of STATES) {
      P.__setCity(copy(st));
      V.setK07aActiveCity(copy(st));
      const pinRet = P.resolveActiveCity();
      const v2Ret = V.resolveK07aActiveCity();
      cmp('resolveActiveCity', { ret: pinRet, after: P.__getCity() }, { ret: v2Ret, after: V.getK07aActiveCity() });
    }
    // resolveActiveCity bez zależności (deps = null) = pin bez `cfg.getCities` (brak odświeżenia).
    {
      const stale = { id: 'c1', ownerId: 0, name: 'STALE', population: 99 };
      const savedGet = fix.cfg.getCities;
      fix.cfg.getCities = undefined;
      P.__setCity(copy(stale));
      const pinRet = P.resolveActiveCity();
      fix.cfg.getCities = savedGet;
      V.setK07aDeps(null);
      V.setK07aActiveCity(copy(stale));
      const v2Ret = V.resolveK07aActiveCity();
      cmp('resolveActiveCity', { ret: pinRet, after: P.__getCity() }, { ret: v2Ret, after: V.getK07aActiveCity() });
      installDeps();
    }

    // w3CityChip: wszystkie identyfikatory statystyk × tempo × zapas × podpowiedź (Infinity/NaN/undefined).
    for (const sid of STAT_IDS) {
      for (const cr of CIV_RATES) {
        for (const cs of CIV_STOCKS) {
          for (const hint of HINTS) {
            cmp(
              'w3CityChip',
              P.w3CityChip('<i>', 'Lbl', '12', 'pos', sid, hint, cr, cs),
              V.w3CityChipK07('<i>', 'Lbl', '12', 'pos', sid, hint, cr, cs),
            );
          }
        }
      }
    }

    // capitalBadgeOrButtonHtml: każde miasto z fixture + miasta spoza listy stolic (właściciel 2, duplikat id).
    const extras = [
      { id: 'c9', ownerId: 2, name: 'Omega', population: 1 },
      { id: 'c3', ownerId: 1, name: 'Gamma-dup', population: 1, oblegane: true },
    ];
    for (const city of [...fix.cities, ...extras]) {
      cmp('capitalBadgeOrButtonHtml', P.capitalBadgeOrButtonHtml(city), V.capitalBadgeOrButtonHtmlK07(city));
    }
  }

  console.log(JSON.stringify({ comparisons, diffs, perUnit, pinFile: 'gra/src/ui/cityPanel.ts (edb8fb56)' }, null, 1));
  if (report.length) console.log(JSON.stringify(report.slice(0, 20), null, 1));
  exitCode = diffs === 0 ? 0 : 1;
} catch (err) {
  console.error('BLAD HARNESSU:', err && err.stack ? err.stack : err);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
