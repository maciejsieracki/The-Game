// Generator tabeli RUCH (P3-23 etap 3, wiersz 35i: mnozniki drogi / drogi brukowanej).
// URUCHAMIA kod TS weba: applyRoadMovementModifier (gra/src/map/road-movement.ts) na
// wektorach (koszt bazowy x ulepszenie) oraz odczytuje stale ROAD_MOVE_SPEED_MULT,
// ROAD_BRUK_MOVE_SPEED_MULT, ROAD_MIN_MOVE_COST, ROAD_BRUK_MIN_MOVE_COST.
// Uzycie (sciezki bezwzgledne; KORZEN = git archive edb8fb56 gra/src gra/data w scratch):
//   node --experimental-strip-types --import <abs>/gen-loader-register.mjs <abs>/gen-road-web.mjs <KORZEN> <wyjscie.json>
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-road-web.mjs <KORZEN> <wyjscie.json>');
  process.exit(2);
}
const url = (p) => pathToFileURL(`${root}/${p}`).href;

const road = await import(url('gra/src/map/road-movement.ts'));
const hexTypes = await import(url('gra/src/types/hex.ts'));
const Ulepszenie = hexTypes.Ulepszenie;

const ulepszenia = {
  brak: { ulepszenie: Ulepszenie.Brak ?? null },
  droga: { ulepszenie: Ulepszenie.Droga },
  droga_brukowana: { ulepszenie: Ulepszenie.DrogaBrukowana },
};

const KOSZTY = [0.5, 1, 2, 3];
const wektory = [];
for (const [nazwa, hex] of Object.entries(ulepszenia)) {
  for (const koszt of KOSZTY) {
    wektory.push({
      ulepszenie: nazwa,
      koszt_bazowy: koszt,
      wynik: road.applyRoadMovementModifier(koszt, hex),
    });
  }
}

const result = {
  zrodlo: 'uruchomiony kod TS weba: applyRoadMovementModifier (gra/src/map/road-movement.ts:73-84)',
  stale: {
    ROAD_MOVE_SPEED_MULT: road.ROAD_MOVE_SPEED_MULT,
    ROAD_BRUK_MOVE_SPEED_MULT: road.ROAD_BRUK_MOVE_SPEED_MULT,
    ROAD_MIN_MOVE_COST: road.ROAD_MIN_MOVE_COST,
    ROAD_BRUK_MIN_MOVE_COST: road.ROAD_BRUK_MIN_MOVE_COST,
  },
  wektory,
};

writeFileSync(out, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(`ZAPISANO ${out}: wektory=${wektory.length}`);
