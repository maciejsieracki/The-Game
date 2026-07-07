'use strict';
/** node gra/tools/akwedukt-popcap-test.cjs */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.akwedukt-popcap-entry.ts');
const BUNDLE = path.join(__dirname, '.akwedukt-popcap-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { populationGrowth } from '../src/game/economy';
export { populationGrowth };`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const { populationGrowth } = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

const params = {
  progWzrostuWspolczynnik: 8,
  zdrowieModyfikatorWspolczynnik: 0,
  spichlerzZachowaniePoPrzroscie: 0.5,
  akweduktProgLudnosci: 5,
  akweduktMaxLudnosci: 15,
};

const atCap = {
  ludnosc: 5,
  zdrowie: 0,
  maSpichlerz: false,
  maAkwedukt: false,
  magazynZywnosci: 0,
};

const r1 = populationGrowth(atCap, 50, params);
assert(!r1.wzrost && r1.nowaLudnosc === 5, 'pop 5 bez akweduktu — brak wzrostu do 6');

const below = { ...atCap, ludnosc: 4, magazynZywnosci: 40 };
const r2 = populationGrowth(below, 10, params);
assert(r2.wzrost && r2.nowaLudnosc === 5, 'pop 4 z buforem — wzrost do 5');

const withAq = { ...atCap, maAkwedukt: true, magazynZywnosci: 60 };
const r3 = populationGrowth(withAq, 10, params);
assert(r3.wzrost && r3.nowaLudnosc === 6, 'pop 5 z akweduktem — wzrost do 6');

const atCapAq = { ludnosc: 15, zdrowie: 0, maSpichlerz: false, maAkwedukt: true, magazynZywnosci: 200 };
const r4 = populationGrowth(atCapAq, 50, params);
assert(!r4.wzrost && r4.nowaLudnosc === 15, 'pop 15 z akweduktem — brak wzrostu do 16');

const belowAq = { ...atCapAq, ludnosc: 14, magazynZywnosci: 130 };
const r5 = populationGrowth(belowAq, 10, params);
assert(r5.wzrost && r5.nowaLudnosc === 15, 'pop 14 z akweduktem i buforem — wzrost do 15');

console.log('akwedukt-popcap-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
