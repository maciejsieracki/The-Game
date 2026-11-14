'use strict';
/**
 * default-tax-split-test.cjs -- R-WEB-SETTINGS-DEFAULT-TAX-SPLIT-30-60-10-Q1 (2026-11-14).
 *
 * Domyślny podział Daniny/Podatku NOWEJ GRY gracza i NOWEGO MIASTA = Skarb 30% / Nauka 60% /
 * Zamożność 10% (suma 100%). Zapisy istniejących gier zachowują swój podział. AI nie zmienia
 * zachowania: seed AI zostaje na Zamożności 20% (podział sprzed 2026-11-14).
 *
 * Wartości w kodzie: procentPieniadz = Skarb, procentNauka = Nauka, procentLuksus = Zamożność.
 * Test czerwony na bazie fe802bb (econ-params 20/60/20, DEFAULT 20/60/20) -- patrz raport operatora.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

let passed = 0, failed = 0;
function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`PASS: ${name}`); }
  else { failed++; console.log(`FAIL: ${name}${detail ? ' -- ' + detail : ''}`); }
}

const ROOT = path.resolve(__dirname, '..');
const econ = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'data/econ-params.json'), 'utf8')).ekonomia_miasta;
const panelSrc = fs.readFileSync(path.resolve(ROOT, 'src/ui/empireDetailPanel.ts'), 'utf8');

const ENTRY_FILE = path.resolve(__dirname, '.default-tax-split-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.default-tax-split-bundle.cjs');
const ENTRY_TS = `
import { DEFAULT_PODZIAL_HANDLU, LEGACY_PODZIAL_HANDLU_PRZED_2026_11_14, AI_FIXED_PROCENT_NAUKA, normalizePodzialHandlu } from '../src/game/cities';
import { aiSeedPodzialHandlu } from '../src/game/ai';
import { freshOwnerDefaultPodzialHandlu, resolveCityPodzialHandlu, migrateHandelSplitOnLoad } from '../src/game/empire-handel-split';
export {
  DEFAULT_PODZIAL_HANDLU, LEGACY_PODZIAL_HANDLU_PRZED_2026_11_14, AI_FIXED_PROCENT_NAUKA, normalizePodzialHandlu,
  aiSeedPodzialHandlu, freshOwnerDefaultPodzialHandlu, resolveCityPodzialHandlu, migrateHandelSplitOnLoad,
};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf-8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE_FILE,
    loader: { '.json': 'json', '.ts': 'ts' },
    target: ['node16'],
    logLevel: 'warning',
  });
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch { /* ignore */ }
}
const B = require(BUNDLE_FILE);
const SKARB = 'procentPieniadz', NAUKA = 'procentNauka', ZAMOZ = 'procentLuksus';
const triple = (s) => `${s[SKARB]}/${s[NAUKA]}/${s[ZAMOZ]}`;

// 1. Dane gry (jedna prawda dla nowej gry): econ-params.json, wszystkie poziomy trudności.
for (const lvl of ['easy', 'normal', 'hard']) {
  assert(`econ-params: nauka domyślnie 60 (${lvl})`, econ.suwak_handel_nauka_domyslnie[lvl] === 60,
    `got ${econ.suwak_handel_nauka_domyslnie[lvl]}`);
  assert(`econ-params: skarb (pieniądz) domyślnie 30 (${lvl})`, econ.suwak_handel_pieniadz_domyslnie[lvl] === 30,
    `got ${econ.suwak_handel_pieniadz_domyslnie[lvl]}`);
  assert(`econ-params: zamożność (luksus) domyślnie 10 (${lvl})`, econ.suwak_handel_luksus_domyslnie[lvl] === 10,
    `got ${econ.suwak_handel_luksus_domyslnie[lvl]}`);
}

// 2. Stała domyślna gracza / nowego miasta (cities.ts) zgodna z danymi.
assert('DEFAULT_PODZIAL_HANDLU = Skarb 30 / Nauka 60 / Zamożność 10', triple(B.DEFAULT_PODZIAL_HANDLU) === '30/60/10',
  `got ${triple(B.DEFAULT_PODZIAL_HANDLU)}`);
assert('DEFAULT_PODZIAL_HANDLU sumuje się do 100',
  B.DEFAULT_PODZIAL_HANDLU[SKARB] + B.DEFAULT_PODZIAL_HANDLU[NAUKA] + B.DEFAULT_PODZIAL_HANDLU[ZAMOZ] === 100);

// 3. Nowa gra: gracz (owner 0) startuje na 30/60/10, bez ruszania suwaków.
const fresh = B.freshOwnerDefaultPodzialHandlu();
assert('nowa gra: domyślny podział gracza = 30/60/10 (Skarb/Nauka/Zamożność)', triple(fresh) === '30/60/10',
  `got ${triple(fresh)}`);

// 4. Nowe miasto dziedziczy podział imperium (bez własnego override).
const inherit = B.resolveCityPodzialHandlu({ ownerId: 0, podzialHandlu: undefined, podzialHandluOverride: undefined }, fresh);
assert('nowe miasto dziedziczy 30/60/10 z imperium', triple(inherit) === '30/60/10', `got ${triple(inherit)}`);
const overridden = B.resolveCityPodzialHandlu(
  { ownerId: 0, podzialHandlu: { procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 }, podzialHandluOverride: true },
  fresh);
assert('miasto z własnym override zachowuje swój podział', triple(overridden) === '50/30/20', `got ${triple(overridden)}`);

// 5. AI: seed nie zmienia się -- Zamożność 20% (podział sprzed 2026-11-14), Nauka = AI_FIXED.
const aiSeed = B.aiSeedPodzialHandlu();
assert('AI seed: Zamożność zostaje 20% (nie 10%)', aiSeed[ZAMOZ] === 20, `got ${aiSeed[ZAMOZ]}`);
assert('AI seed: Nauka = AI_FIXED_PROCENT_NAUKA', aiSeed[NAUKA] === B.AI_FIXED_PROCENT_NAUKA, `got ${aiSeed[NAUKA]}`);
assert('AI seed: suma 100%', aiSeed[SKARB] + aiSeed[NAUKA] + aiSeed[ZAMOZ] === 100);
assert('LEGACY (sprzed 2026-11-14) = 20/60/20 na Nauka/Skarb/Zamożność',
  B.LEGACY_PODZIAL_HANDLU_PRZED_2026_11_14[NAUKA] === 20 && B.LEGACY_PODZIAL_HANDLU_PRZED_2026_11_14[SKARB] === 60
  && B.LEGACY_PODZIAL_HANDLU_PRZED_2026_11_14[ZAMOZ] === 20);

// 6. Stary zapis z zapisanym podziałem imperium: wczytanie NIE nadpisuje go nowym domyślnym.
{
  const oldSplit = { procentPieniadz: 60, procentNauka: 20, procentLuksus: 20 };
  const map = new Map();
  const cities = [{ ownerId: 0, podzialHandlu: { ...oldSplit }, podzialHandluOverride: false }];
  B.migrateHandelSplitOnLoad(cities, map, [[0, { ...oldSplit }]]);
  assert('stary zapis (savedDefaults): podział imperium gracza zachowany 20/60/20', triple(map.get(0)) === '60/20/20',
    `got ${triple(map.get(0))}`);
  const cityInherit = B.resolveCityPodzialHandlu(cities[0], map.get(0));
  assert('stary zapis: miasto dziedziczące widzi swój stary podział', triple(cityInherit) === '60/20/20',
    `got ${triple(cityInherit)}`);
}

// 7. Stary zapis BEZ zapisanego podziału (sprzed meta.ownerDefaultPodzialHandlu): miasto bez
// podziału dostaje dawny podział 20/60/20, a nie nowy domyślny gracza 30/60/10.
{
  const map = new Map();
  const cities = [{ ownerId: 0 }];
  B.migrateHandelSplitOnLoad(cities, map, undefined);
  assert('stary zapis bez podziału: właściciel dostaje dawny podział 60/20/20 (nie nowy 30/60/10)',
    map.has(0) && triple(map.get(0)) === '60/20/20', `got ${map.has(0) ? triple(map.get(0)) : 'brak'}`);
}

// 8. Panel imperium (empireDetailPanel.ts): fallback zgodny z nowym domyślnym, brak starego literału.
assert('empireDetailPanel: brak starego literału 60/20/20 w fallbacku panelu',
  !/procentPieniadz: 60, procentNauka: 20, procentLuksus: 20/.test(panelSrc));
assert('empireDetailPanel: fallback panelu = 30/60/10',
  /procentPieniadz: 30, procentNauka: 60, procentLuksus: 10/.test(panelSrc));

console.log(`\n=== default-tax-split-test: ${passed} pass, ${failed} fail ===`);
try { fs.unlinkSync(BUNDLE_FILE); } catch { /* ignore */ }
process.exit(failed === 0 ? 0 : 1);
