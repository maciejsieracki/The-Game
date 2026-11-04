'use strict';
/** node gra/tools/popcap-spichlerz2-akwedukt20-test.cjs
 * R-WEB-POPCAP-SPICHLERZ2-12-AKWEDUKT-20-Q1: drabinka limitu ludności 5 / 8 / 12 / 20.
 * Używa PRAWDZIWEGO econ-params.json (loadEconParams) + prawdziwych funkcji cityPopulationCap
 * / applyFractionalGrowthV85 / populationGrowth. */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.popcap-s2a20-entry.ts');
const BUNDLE = path.join(__dirname, '.popcap-s2a20-bundle.cjs');
fs.writeFileSync(ENTRY, `import { cityPopulationCap, loadEconParams, populationGrowth } from '../src/game/economy';
import { applyFractionalGrowthV85 } from '../src/game/population-growth-v85';
export { cityPopulationCap, loadEconParams, populationGrowth, applyFractionalGrowthV85 };`);
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, logLevel: 'silent' });
const { cityPopulationCap, loadEconParams, populationGrowth, applyFractionalGrowthV85 } = require(BUNDLE);
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'econ-params.json'), 'utf8'));

let pass = 0, fail = 0;
const assert = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL:', m); } };

for (const diff of ['easy', 'normal', 'hard']) {
  const p = loadEconParams(raw, diff);
  const base = { easy: 6, normal: 5, hard: 4 }[diff];
  // cityPopulationCap(maAkwedukt, maSpichlerz, params, delta, maSpichlerzII)
  assert(cityPopulationCap(false, false, p) === base, `${diff}: bez budynku = ${base}`);
  assert(cityPopulationCap(false, true, p) === 8, `${diff}: Spichlerz I = 8`);
  assert(cityPopulationCap(false, true, p, 0, true) === 12, `${diff}: Spichlerz II bez Akweduktu = 12`);
  assert(cityPopulationCap(false, false, p, 0, true) === 12, `${diff}: flaga II sama = 12`);
  assert(cityPopulationCap(true, false, p) === 20, `${diff}: Akwedukt bez Spichlerza = 20`);
  assert(cityPopulationCap(true, true, p) === 20, `${diff}: Akwedukt + Spichlerz I = 20`);
  assert(cityPopulationCap(true, true, p, 0, true) === 20, `${diff}: Akwedukt + Spichlerz II = 20`);
  assert(cityPopulationCap(true, true, p, 2, true) === 22, `${diff}: Akwedukt + delta macierzy +2 = 22 (clamp nie ucina)`);
  assert(cityPopulationCap(true, true, p, 5, true) === 20, `${diff}: delta spoza {-1..2} ignorowana`);
  assert(cityPopulationCap(false, true, p, 1, true) === 13, `${diff}: Spichlerz II + delta +1 = 13`);
}
const pn = loadEconParams(raw, 'normal');
assert(pn.spichlerzIIProgLudnosci === 12 && pn.spichlerzProgLudnosci === 8 && pn.akweduktMaxLudnosci === 20,
  'JSON -> EconParams: 12 / 8 / 20');
assert(cityPopulationCap(false, true, { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8 }, 0) === 8, "niekompletny fixture bez akweduktMaxLudnosci: Spichlerz I = 8 (nie NaN)");
assert(cityPopulationCap(false, true, { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 20 }, 0, true) === 8,
  'brak klucza II w params -> fallback do spichlerzProgLudnosci');

// Ścieżka v85: (city, growthPct, fed, maAkwedukt, econParams, maSpichlerz, capDelta, maSpichlerzII)
const grow = (pop, aq, sp, sp2) => applyFractionalGrowthV85(
  { population: pop, wzrostUlamkowy: 0 }, 100, true, aq, pn, sp, 0, sp2);
assert(grow(8, false, true, false).nowaLudnosc === 8, 'v85: Sp I stoi na 8');
assert(grow(7, false, true, false).nowaLudnosc === 8, 'v85: Sp I rośnie 7->8');
assert(grow(8, false, true, true).nowaLudnosc > 8, 'v85: Sp II rośnie ponad 8');
assert(grow(11, false, true, true).nowaLudnosc === 12, 'v85: Sp II rośnie do 12');
assert(grow(12, false, true, true).nowaLudnosc === 12, 'v85: Sp II stoi na 12');
assert(grow(19, true, false, false).nowaLudnosc === 20, 'v85: Akwedukt rośnie do 20');
assert(grow(20, true, true, true).nowaLudnosc === 20, 'v85: Akwedukt stoi na 20');
assert(grow(5, false, false, false).nowaLudnosc === 5, 'v85: bez budynku stoi na 5');

// Legacy populationGrowth (economy.ts)
const params = { ...pn, progWzrostuWspolczynnik: 8, zdrowieModyfikatorWspolczynnik: 0 };
const city = (l, o) => ({ ludnosc: l, zdrowie: 0, maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 5000, ...o });
assert(!populationGrowth(city(12, { maSpichlerzII: true }), 50, params).wzrost, 'legacy: Sp II stoi na 12');
assert(populationGrowth(city(11, { maSpichlerzII: true }), 50, params).wzrost, 'legacy: Sp II rośnie 11->12');
assert(!populationGrowth(city(8, { maSpichlerz: true }), 50, params).wzrost, 'legacy: Sp I stoi na 8');
assert(populationGrowth(city(19, { maAkwedukt: true }), 50, params).wzrost, 'legacy: Akwedukt rośnie 19->20');
assert(!populationGrowth(city(20, { maAkwedukt: true, maSpichlerzII: true }), 50, params).wzrost, 'legacy: Akwedukt stoi na 20');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
console.log(`popcap-spichlerz2-akwedukt20-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
