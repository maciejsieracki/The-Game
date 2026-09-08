'use strict';
/**
 * ai-early-city-founding-pace-test.cjs — P-AI-WOJNA-WCZESNA-FAZA-MIASTA-PANSTWA-Q1
 * ZADANIE pkt 3: żywa (turn-by-turn, real decideAITurn) symulacja mierząca ile tur
 * zajmuje głównej AI (profil ekspansywności "przeciętny" = 2, ziemia i Praca NIE są
 * wąskim gardłem) osiągnięcie limitu miast per epokę (R-MIASTA-LIMIT-PER-EPOKA-Q1,
 * baza=10). Diagnoza (bez zgadywania): founding NIE jest pozycją w kolejce budowy
 * konkurującą z budynkami — to osobna komenda `foundCityAt` zwracana przez
 * planCityFounding w Step 1b decideAITurn (patrz ai.ts ~linia 3175), a więc "konkuruje
 * nisko z innymi celami budowy" strukturalnie NIE MOŻE zachodzić w obecnej architekturze.
 * Pytanie sprowadza się więc do: jak szybko realnie odpala, biorąc pod uwagę interwał
 * (aiPowerGoalFoundingInterval), rezerwę Pracy i blokady fazy lokalnej ekspansji.
 * Run from gra/: node tools/ai-early-city-founding-pace-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const BUNDLE = path.resolve(__dirname, '.ai-founding-pace-bundle.cjs');
const entryFile = path.resolve(__dirname, '.ai-founding-pace-entry.ts');
fs.writeFileSync(entryFile, `
export { decideAITurn } from '../src/game/ai.ts';
`);
esbuild.buildSync({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});
const { decideAITurn } = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: 'rownina',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeGameData() {
  return {
    units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }],
    buildings: [],
    terrainYields: {
      terrain_types: [{ Teren: 'rownina', Zywnosc: 3, Praca: 2, Handel: 1 }],
    },
    aiParams: {},
  };
}

const OWNER = 1;
const LIMIT_ERY_1 = 10; // R-MIASTA-LIMIT-PER-EPOKA-Q1: base=10, era=1 -> baza+0

/**
 * Symulacja tura-po-turze: profil "przeciętny" (ekspansywnosc=2), ziemia i Praca
 * hojne (NIE wąskie gardło) — mierzymy wyłącznie kadencję samego mechanizmu
 * decyzyjnego, nie ograniczenia ekonomiczne.
 */
function simulateFounding(turns, ekspansywnosc) {
  const map = makeMap(60, 60);
  const data = makeGameData();
  let cities = [{ id: 'cap', ownerId: OWNER, q: 30, r: 30, population: 8 }];
  const foundTurns = [];
  for (let turn = 1; turn <= turns; turn++) {
    const opts = {
      defensiveCopy: false,
      currentTurn: turn,
      civEra: 1,
      civAiProfile: { ekspansywnosc, sklonnoscDoPodboju: 2 },
      pracaAvailable: 200, // hojne — nie jest wąskim gardłem w tej symulacji
    };
    const result = decideAITurn(OWNER, [], cities, map, data, opts);
    const found = result.filter(c => c.type === 'foundCityAt');
    for (const f of found) {
      cities = [...cities, {
        id: `c${cities.length}`, ownerId: OWNER, q: f.q, r: f.r, population: 3,
      }];
      foundTurns.push(turn);
    }
  }
  return { finalCityCount: cities.length, foundTurns };
}

console.log('--- Kadencja foundingu, profil ekspansywnosc=2 (przecietny), 60 tur, ziemia+Praca hojne ---');
{
  const { finalCityCount, foundTurns } = simulateFounding(60, 2);
  console.log(`  Miast po 60 turach: ${finalCityCount} (limit ery 1 = ${LIMIT_ERY_1})`);
  console.log(`  Tury zalozenia: ${foundTurns.join(', ')}`);
  const turnToLimit = foundTurns[LIMIT_ERY_1 - 2]; // -1 stolica juz zalozona, -1 index
  console.log(`  Tura osiagniecia limitu ery 1 (${LIMIT_ERY_1} miast): ${turnToLimit ?? 'NIE OSIAGNIETO w 60 tur'}`);
  assert(finalCityCount >= LIMIT_ERY_1, `mechanizm osiaga limit ery 1 (${LIMIT_ERY_1}) w 60 tur przy hojnej ziemi/Pracy (miast: ${finalCityCount})`);
}

console.log('\n--- Kadencja foundingu, profil ekspansywnosc=5 (maksymalny), 60 tur ---');
{
  const { finalCityCount, foundTurns } = simulateFounding(60, 5);
  console.log(`  Miast po 60 turach: ${finalCityCount}`);
  console.log(`  Tury zalozenia: ${foundTurns.join(', ')}`);
  assert(finalCityCount >= LIMIT_ERY_1, `eksp=5 osiaga limit ery 1 w 60 tur (miast: ${finalCityCount})`);
}

console.log('\n--- Kadencja foundingu, profil ekspansywnosc=0 (minimalny, pacyfista) ---');
{
  const { finalCityCount } = simulateFounding(60, 0);
  console.log(`  Miast po 60 turach: ${finalCityCount}`);
  // Brak asercji binarnej — informacyjne: profil 0 celowo wolniejszy (rezerwa Pracy
  // aiFoundingWorkReserve(0)=10, brak bypassu klastra) -- to jest ZAMIERZONE
  // zroznicowanie archetypow, nie deficyt.
}

console.log('\n========================================');
console.log(`ai-early-city-founding-pace-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
