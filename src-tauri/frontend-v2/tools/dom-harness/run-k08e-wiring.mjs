#!/usr/bin/env node
/**
 * run-k08e-wiring.mjs — TEST WYKONANIA wiringu K08E (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 2; zarzut Evaluatora:
 * brak testu wykonania `controller/k08eWiring.ts`).
 *
 * Sprawdza, że:
 *   (1) PRZED `installK08eWiring` każdy delegat K08E (`ui/cityPanel/k08e-deps.ts`) rzuca `K08E: brak delegatu …`
 *       (brak cichej wartości domyślnej, K08E-Z2);
 *   (2) PO `installK08eWiring` każdy delegat przekazuje DOKŁADNIE te same argumenty do hosta o tej samej nazwie
 *       i ZWRACA wynik hosta (żadnego zgubienia/przestawienia argumentów ani wyniku).
 * Host reguł = rejestrator wywołań z unikalnymi wartościami zwrotnymi (NIE reguły gry; P5.13).
 *
 * Opcje: `--wiring <plik.ts>` (mutant wiringu; domyślnie `src/controller/k08eWiring.ts`), `--src <katalog src>`.
 * EXIT 0 <=> wszystkie checki zgodne; 1 <=> >=1 FAIL; 2 <=> błąd harnessu.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WIRING = resolve(argOf('--wiring') ?? join(SRC, 'controller/k08eWiring.ts'));
const TMP = mkdtempSync(join(tmpdir(), 'k08e-wiring-'));

const results = [];
const check = (id, what, ok) => results.push({ id, what, ok: ok === true });

/** Próbki argumentów per delegat (wartości jawne; nie są danymi gry). */
const CITY = { id: 7, ownerId: 0, q: 1, r: 2, population: 3 };
const DATA = { buildings: [], units: [] };
const VIEW = { praca: 1 };
const MAP = { tiles: [] };
const SAMPLES = {
  buildRationParams: ['econ-x', 'hard'],
  cityLudnoscAbsolutna: [5, 3],
  resolveOrderState: [CITY, DATA],
  switchCity: [1],
  resolveCityHealth: [CITY, MAP, DATA],
  porPctBand: [55],
  porBandLabel: ['lad'],
  ownerCities: [CITY],
  cityPanelTitle: [CITY],
  buildCityOnlyW3FlankChips: [CITY, VIEW, DATA, MAP],
};

const entry = join(TMP, 'entry.ts');
writeFileSync(
  entry,
  [
    `import * as deps from ${JSON.stringify(join(SRC, 'ui/cityPanel/k08e-deps.ts'))};`,
    `import { installK08eWiring } from ${JSON.stringify(WIRING)};`,
    'export const d = deps;',
    'export const install = installK08eWiring;',
    'export const names = deps.K08E_FN_NAMES;',
    '',
  ].join('\n'),
);
const out = join(TMP, 'bundle.mjs');
let mod;
try {
  await esbuild.build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'neutral', outfile: out, logLevel: 'silent' });
  mod = await import(pathToFileURL(out).href);

  // (1) Przed instalacją: każdy delegat rzuca jawny wyjątek.
  for (const name of mod.names) {
    let msg = null;
    try {
      mod.d[name](...SAMPLES[name]);
    } catch (e) {
      msg = String(e && e.message);
    }
    check(`pre.${name}`, `przed install: ${name} rzuca „K08E: brak delegatu”`, msg !== null && msg.includes(`K08E: brak delegatu ${name}`));
  }

  // (2) Po instalacji: rejestrator hosta.
  const calls = [];
  const host = {};
  for (const name of mod.names) {
    host[name] = (...a) => {
      calls.push([name, a]);
      return { ret: name };
    };
  }
  mod.install(host);
  for (const name of mod.names) {
    calls.length = 0;
    let got;
    try {
      got = mod.d[name](...SAMPLES[name]);
    } catch (e) {
      // Brak przekazania (np. usunięty delegat w wiringu) = FAIL checku, nie błąd harnessu.
      check(`fwd.${name}.calledOnce`, `${name}: delegat zainstalowany (brak wyjątku: ${String(e && e.message)})`, false);
      continue;
    }
    const one = calls.length === 1;
    check(`fwd.${name}.calledOnce`, `${name}: host wywołany dokładnie raz`, one);
    check(`fwd.${name}.args`, `${name}: argumenty przekazane 1:1`, one && JSON.stringify(calls[0][1]) === JSON.stringify(SAMPLES[name]));
    check(`fwd.${name}.name`, `${name}: trafia do hosta o tej samej nazwie`, one && calls[0][0] === name);
    check(`fwd.${name}.ret`, `${name}: wynik hosta zwrócony bez zmian`, got !== undefined && got.ret === name);
  }
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  rmSync(TMP, { recursive: true, force: true });
  process.exit(2);
}
rmSync(TMP, { recursive: true, force: true });

const fails = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.what}`);
console.log(`\nk08e-wiring: ${results.length - fails.length}/${results.length} zgodnych`);
process.exit(fails.length === 0 ? 0 : 1);
