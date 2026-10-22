// Generator macierzy COUNTER (P3-23 etap 3, grupa WALKA: wiersz 35g, combat.ts:20 / :513-548).
// URUCHAMIA kod TS weba (counterMultiplier z gra/src/game/combat.ts) na pelnej macierzy
// typow 8 x 8 i zapisuje wynik jako JSON. Dane counters.json normalizowane tak samo jak
// normCounters w gra/src/battle/battleScene.ts (klucz "Typ atakujacy" bez diakrytyki).
// Uzycie (z dowolnego katalogu, sciezki bezwzgledne; KORZEN = git archive edb8fb56 gra/src gra/data):
//   node --experimental-transform-types --import <abs>/gen-loader-register.mjs <abs>/gen-counter-web.mjs <KORZEN> <wyjscie.json>
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-counter-web.mjs <KORZEN> <wyjscie.json>');
  process.exit(2);
}
const url = (p) => pathToFileURL(`${root}/${p}`).href;

const combat = await import(url('gra/src/game/combat.ts'));
const raw = (await import(url('gra/data/counters.json'))).default;

// normCounters (battleScene.ts:1267-1275).
const counters = raw.map((c) => ({
  'Typ atakujacy': c['Typ atakujacy'] ?? c['Typ atakujący'],
  'Cel (typ)': c['Cel (typ)'],
  Bonus: c['Bonus'] ?? '',
  'Rodzaj (Atak/Obrona)': c['Rodzaj (Atak/Obrona)'] ?? '',
  Status: c['Status'] ?? '',
}));

// Typy jednostek wystepujace w counters.json (strony atakujaca i celu).
const TYPY = ['Spearman', 'Mount', 'Distance', 'Slinger', 'Swordsman', 'Falangite', 'Offensive', 'Naval'];

const pary = [];
for (const a of TYPY) {
  for (const d of TYPY) {
    pary.push({
      atakujacy: a.toLowerCase(),
      cel: d.toLowerCase(),
      mnoznik: combat.counterMultiplier(a, d, counters),
    });
  }
}

const result = {
  zrodlo: 'uruchomiony kod TS weba: counterMultiplier (gra/src/game/combat.ts) na counters.json (normCounters jak battleScene.ts:1267)',
  typy: TYPY.map((t) => t.toLowerCase()),
  liczba_wierszy_counters: counters.length,
  pary,
};

writeFileSync(out, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(`ZAPISANO ${out}: pary=${pary.length}, typy=${TYPY.length}`);
