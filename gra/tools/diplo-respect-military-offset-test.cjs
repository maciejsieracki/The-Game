#!/usr/bin/env node
'use strict';
/**
 * diplo-respect-military-offset-test.cjs — R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1 (obrona r1, zarzut 3)
 *
 * Sprawdza, że jednorazowe zdarzenia militarne (+15 / −10) PRZETRWAJĄ pętlę AI, która co turę
 * przelicza Respekt z Mocy (computeRespekt). Kolejność jak w main.ts:
 *   1) applyMilitaryRespektEdgeTick: przejście progu -> applyDiplomaticEvent + respektMilOffset += dR
 *   2) pętla AI (relacja gracz–AI): respekt = respektZKorektaMilitarna(computeRespekt(...), respektMilOffset)
 * Test odtwarza tę sekwencję na tych samych funkcjach co silnik (bez całej gry; pełny tick i UI NIE ZMIERZONE).
 * Mutacja MUTATE_NO_OFFSET=1 (bez korekty w pętli AI) musi czerwienić.
 *
 * Run from gra/: node tools/diplo-respect-military-offset-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('esbuild missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.respect-military-offset-entry.ts');
const BUNDLE = path.join(__dirname, '.respect-military-offset-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  respektMilitaryCrossing, respektZKorektaMilitarna, loadMilitaryStrengthParams,
} from '../src/game/diplomacy-military-strength';
export { applyDiplomaticEvent, computeRespekt } from '../src/game/diplomacy';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
const mod = require(BUNDLE);
const {
  respektMilitaryCrossing, respektZKorektaMilitarna, loadMilitaryStrengthParams,
  applyDiplomaticEvent, computeRespekt,
} = mod;

const NO_OFFSET = process.env.MUTATE_NO_OFFSET === '1';
const MUTATE_DIRECTION = process.env.MUTATE_DIRECTION === '1';
let pass = 0;
let fail = 0;
function check(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

const params = loadMilitaryStrengthParams();
const BASE_POTEGI = [50, 50]; // computeRespekt(50,50) = 50: baza z Mocy, bez zdarzeń
const rel0 = { zaufanie: 50, respekt: 50, status: 'pokoj', relacjaOgolna: 100, traktaty: [], urazyHistoryczne: 0 };

// Harmonogram tur: [siła gracza, siła AI, oczekiwane zdarzenie].
const SCHEDULE = [
  [149, 100, null], // 1,49 — poniżej progu 50%
  [150, 100, 'A'],  // 1,50 — przejście progu: +15 raz
  [160, 100, null], // utrzymanie powyżej progu: brak ponownego naliczenia
  [160, 100, null],
  [90, 100, null],  // spadek poniżej progu (stan 'brak')
  [150, 100, 'A'],  // ponowne przekroczenie: +15 ponownie
  [100, 160, 'B'],  // gracz słabszy o 1,6×: −10 raz
  [100, 160, null], // utrzymanie: brak ponownego −10
];
// Oczekiwany Respekt po pętli AI: baza 50 + korekta ZASTĘPUJĄCA (+15; powrót w pasmo = 0; +15; potem −10).
const OCZEKIWANY = [50, 65, 65, 65, 50, 65, 40, 40];

const SIDE = (id, sila) => ({ id: String(id), sila, armiaPkt: sila });
let meta = { respektPrzewagaStan: undefined, respektMilOffset: 0 };
let rel = { ...rel0 };
const eventsSeen = [];
const respektLog = [];

SCHEDULE.forEach(([sg, sp, expected], turn) => {
  // (1) krok zdarzeń (jak applyMilitaryRespektEdgeTick w main.ts)
  const r = respektMilitaryCrossing(SIDE(0, sg), SIDE(1, sp), meta.respektPrzewagaStan, params);
  const zdarzenie = meta.respektPrzewagaStan === undefined ? null : r.zdarzenieDla;
  if (zdarzenie === null) {
    const zdejmij = r.stan === 'brak' && meta.respektPrzewagaStan !== undefined && meta.respektPrzewagaStan !== 'brak';
    meta = { ...meta, respektPrzewagaStan: r.stan, ...(zdejmij ? { respektMilOffset: 0 } : {}) };
  } else {
    const ev = (MUTATE_DIRECTION ? zdarzenie !== 'A' : zdarzenie === 'A') ? 'przewaga_militarna' : 'slabszy_militarnie';
    const next = applyDiplomaticEvent(rel, ev);
    const dR = next.respekt - rel.respekt;
    meta = { ...meta, respektPrzewagaStan: r.stan, respektMilOffset: dR };
    rel = next;
    eventsSeen.push(`t${turn + 1}:${zdarzenie}:${dR}`);
  }
  // (2) pętla AI: przeliczenie Respektu z Mocy + korekta zdarzeń (jak w main.ts)
  const bazowy = computeRespekt(BASE_POTEGI[0], BASE_POTEGI[1]);
  const efektywny = NO_OFFSET ? bazowy : respektZKorektaMilitarna(bazowy, meta.respektMilOffset);
  rel = { ...rel, respekt: efektywny };
  respektLog.push(efektywny);

  check(zdarzenie === expected, `tura ${turn + 1}: zdarzenie=${zdarzenie} oczekiwane=${expected}`);
});

console.log('  respekt po pętli AI:', respektLog.join(' '));
console.log('  zdarzenia:', eventsSeen.join(' '));
check(eventsSeen.length === 3, `liczba zdarzeń = 3 (+15, +15, −10), jest ${eventsSeen.length}`);
check(JSON.stringify(respektLog) === JSON.stringify(OCZEKIWANY),
  `Respekt po pętli AI = ${JSON.stringify(OCZEKIWANY)} (zdarzenia przeżywają nadpisanie z Mocy)`);
check(respektZKorektaMilitarna(50, undefined) === 50, 'brak pola offsetu = 0 (stare zapisy nie zmieniają Respektu)');
check(respektZKorektaMilitarna(95, 15) === 100 && respektZKorektaMilitarna(5, -10) === 0, 'korekta obcinana do [0,100]');

console.log(`\nRESULT: ${pass} OK, ${fail} FAIL${NO_OFFSET ? ' (MUTATE_NO_OFFSET=1)' : ''}`);
process.exit(fail === 0 ? 0 : 1);
