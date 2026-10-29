#!/usr/bin/env node
/**
 * run-k08d-wiring.mjs — TEST WYKONANIA wiringu K08D (`src/controller/k08dWiring.ts`) i delegatu wymaganego
 * `cfgK08dRequired` (`ui/cityPanel/k08d-deps.ts`), P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, odpowiedź na zarzut
 * Evaluatora r1 (pkt 1: brak testu wykonania wiringu K08D i jego mutacji; pkt 5: cicha wartość domyślna `?? true`).
 *
 * Każdy check = WYKONANIE prawdziwego kodu wiringu (esbuild-bundle, bez DOM), z wartościami-sentinelami per delegat,
 * żeby zamiana delegatów, zła kolejność argumentów, zgubiony delegat lub cicha atrapa dały FAIL:
 *   W1  przed instalacją każdy z 4 delegatów rzuca `K08D: brak delegatu <nazwa>` (brak cichej wartości domyślnej);
 *   W2  każdy delegat przekazuje argumenty w tej samej kolejności i zwraca wynik właściwej metody reguł (sentinele);
 *   W3  błąd po stronie reguł propaguje się (wiring nie połyka wyjątku);
 *   W4  kolejne `installK08dWiring` nadpisuje delegaty (merge z najnowszymi wartościami);
 *   W5  zestaw `K08D_FN_NAMES` = dokładnie 4 delegaty i wszystkie są wywoływalne po instalacji;
 *   W6  `cfgK08dRequired`: brak pola => wyjątek `K08D: brak pola cfg …`; obecne pole => ZWRACA jego wartość (false, nie `true`).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08d-wiring.mjs [--wiring <plik.ts>] [--tmp-dir <katalog poza repo>]
 * EXIT 0 <=> wszystkie checki OK; 1 <=> >=1 FAIL; 2 <=> błąd harnessu.
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
const WIRING = resolve(argOf('--wiring') ?? join(V2_ROOT, 'src/controller/k08dWiring.ts'));
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08d-wiring-'));
const results = [];
/** Wywołanie kodu pod testem: wyjątek = wynik undefined (FAIL checku, nie błąd harnessu). */
const safe = (f) => { try { return f(); } catch { return undefined; } };
const check = (id, desc, ok) => results.push({ id, desc, ok: ok === true });
/** Wyjątek z wywołania (true gdy rzucił komunikat zawierający `needle`). */
const throwsWith = (fn, needle) => {
  try {
    fn();
    return false;
  } catch (e) {
    return String(e && e.message).includes(needle);
  }
};

let exitCode = 0;
try {
  const entry = join(TMP, 'entry.ts');
  writeFileSync(entry, [
    `import * as W from ${JSON.stringify(WIRING)};`,
    `import * as D from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08d-deps.ts'))};`,
    'export { W, D };',
    '',
  ].join('\n'));
  const out = join(TMP, 'bundle.mjs');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: out,
    logLevel: 'silent',
  });
  const M = await import(pathToFileURL(out).href);
  const { W, D } = M;

  // W1 — przed instalacją: wyjątek jawny, nie cicha wartość.
  const calls = {
    mennicaGate: () => D.mennicaGate(0),
    buildEconParams: () => D.buildEconParams({}, 'hard'),
    cityHasBibliotekaLine: () => D.cityHasBibliotekaLine([]),
    mnoznikHandelPieniadzForCivByDifficulty: () => D.mnoznikHandelPieniadzForCivByDifficulty('rz', {}, 'hard', 1),
    computeTradeRouteBuildingBonusByCity: () => D.computeTradeRouteBuildingBonusByCity([]),
  };
  for (const [name, f] of Object.entries(calls)) {
    check(`W1.missing.${name}`, `przed instalacją ${name} rzuca „K08D: brak delegatu ${name}”`,
      throwsWith(f, `K08D: brak delegatu ${name}`));
  }

  // Sentinele: każda metoda reguł zwraca wartość rozpoznawalną po kształcie/treści.
  const seen = [];
  const rules1 = {
    mennicaGate: (o) => { seen.push(['mgt', o]); return { maMennicaBudynek: o === 4, mennicaAktywna: true, mennicaSpiZBrakuZlota: false }; },
    buildEconParams: (d, diff) => { seen.push(['bep', d, diff]); return { tag: 'E', korupcjaWspolczynnikDystansu: 1, korupcjaWspolczynnikMiast: 2, korupcjaCap: 3, mennicaMnoznikPoWalucie: 4 }; },
    cityHasBibliotekaLine: (ids) => { seen.push(['bib', ids.length]); return ids.length === 3; },
    mnoznikHandelPieniadzForCivByDifficulty: (k, c, d, fb) => { seen.push(['mno', k, c, d, fb]); return fb * 100 + (k === 'rz' ? 1 : 0); },
    computeTradeRouteBuildingBonusByCity: (routes) => { seen.push(['trs', routes.length]); return new Map([[routes.length, 77]]); },
  };
  W.installK08dWiring(rules1);

  // W2 — kolejność i wynik każdego delegatu.
  const civs = { x: 1 };
  const gate = safe(() => D.mennicaGate(4));
  check('W2.mennicaGate.args', 'mennicaGate(4) => reguła dostaje ownerId 4 i zwraca jej obiekt bez zmian',
    seen.some((s) => s[0] === 'mgt' && s[1] === 4) && gate?.maMennicaBudynek === true && gate?.mennicaAktywna === true && gate?.mennicaSpiZBrakuZlota === false);
  const bep = safe(() => D.buildEconParams({ data: 1 }, 'hard')) ?? {};
  check('W2.buildEconParams.args', 'buildEconParams(data, "hard") => reguła dostaje (data, "hard")',
    seen.some((s) => s[0] === 'bep' && s[2] === 'hard' && s[1].data === 1));
  check('W2.buildEconParams.value', 'buildEconParams zwraca wynik reguły (tag E, cap 3)', bep.tag === 'E' && bep.korupcjaCap === 3);
  check('W2.cityHasBibliotekaLine', 'cityHasBibliotekaLine(3 ids) => true z reguły (przekazana długość 3)',
    safe(() => D.cityHasBibliotekaLine(['a', 'b', 'c'])) === true && seen.some((s) => s[0] === 'bib' && s[1] === 3));
  const mno = safe(() => D.mnoznikHandelPieniadzForCivByDifficulty('rz', civs, 'hard', 5));
  check('W2.mnoznik.args', 'mnoznik("rz", civs, "hard", 5) => 501 (fb 5 + civKey rz)', mno === 501);
  check('W2.mnoznik.civs', 'mnoznik przekazuje obiekt civs (ta sama referencja)',
    seen.some((s) => s[0] === 'mno' && s[2] === civs));
  const trs = safe(() => D.computeTradeRouteBuildingBonusByCity([{ a: 1 }, { a: 2 }])) ?? new Map();
  check('W2.trasy', 'computeTradeRouteBuildingBonusByCity(2 trasy) => Map: klucz 2 -> 77', trs.get(2) === 77 && trs.size === 1);

  // W3 — błąd reguł propaguje się (nie jest połykany ani zamieniany na wartość).
  const rulesThrow = { ...rules1, cityHasBibliotekaLine: () => { throw new Error('REGULA-X'); } };
  W.installK08dWiring(rulesThrow);
  check('W3.propagate', 'wyjątek reguły „REGULA-X” dociera do wywołującego', throwsWith(() => D.cityHasBibliotekaLine([]), 'REGULA-X'));

  // W4 — ponowna instalacja nadpisuje delegaty.
  W.installK08dWiring({ ...rules1, cityHasBibliotekaLine: () => false });
  check('W4.reinstall', 'ponowna instalacja: cityHasBibliotekaLine => false (nowa reguła)', safe(() => D.cityHasBibliotekaLine(['a', 'b', 'c'])) === false);

  // W5 — zestaw nazw i wywoływalność po instalacji.
  W.installK08dWiring(rules1);
  check('W5.names', 'K08D_FN_NAMES = 5 delegatów (K08D-Z11: + mennicaGate)', D.K08D_FN_NAMES.length === 5);
  const allCallable = D.K08D_FN_NAMES.every((n) => {
    try {
      return calls[n] !== undefined && typeof calls[n] === 'function' && (calls[n](), true);
    } catch {
      return false;
    }
  });
  check('W5.callable', 'po instalacji wszystkie 4 delegaty wywoływalne bez wyjątku', allCallable);

  // W6 — cfgK08dRequired: brak = wyjątek, obecne pole = jego wartość (false zostaje false).
  check('W6.missing', 'cfgK08dRequired({}, getOwnerHasZlotoAccess) rzuca „K08D: brak pola cfg”',
    throwsWith(() => D.cfgK08dRequired({}, 'getOwnerHasZlotoAccess'), 'K08D: brak pola cfg getOwnerHasZlotoAccess'));
  check('W6.falseKept', 'cfgK08dRequired z polem zwracającym false => false (nie domyślne true)',
    D.cfgK08dRequired({ getOwnerHasZlotoAccess: () => false }, 'getOwnerHasZlotoAccess')(0) === false);
  check('W6.trueKept', 'cfgK08dRequired z polem zwracającym true => true',
    D.cfgK08dRequired({ getOwnerHasZlotoAccess: () => true }, 'getOwnerHasZlotoAccess')(0) === true);

  const fails = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.desc}`);
  console.log(`\nk08d-wiring: ${results.length - fails.length}/${results.length} zgodnych`);
  exitCode = fails.length === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(exitCode);
