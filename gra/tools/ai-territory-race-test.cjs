'use strict';

/**
 * R-WEB-AI-TERRITORY-RACE-FORTS-IMPL-Q1 — wyscig o teren AI: forty i posterunki.
 *   A  prog zysku fortu: fort dopuszczony dokladnie od `fortMinNoweHeksy` NOWYCH heksow (>=), nie od (prog-1)
 *   B  prog zysku posterunku: j.w. dla `posterunekMinNoweHeksy` (osobny prog)
 *   C  kolejnosc: limit miast NIE wyczerpany -> 0 fortow (nawet przy progu 1)
 *   D  zagrozenie w oknie tur -> udzial fortow = 0; poza oknem zagrozenie nie blokuje (jak przed tematem)
 *   E  udzial puli Pracy 15% w oknie [30,90]: fort za drogi dla 15% puli -> brak; poza oknem -> dozwolony
 *   F  gracz (brak `aiTerritoryRace`) niezmieniony: prog 1, brak udzialu
 *   G  parametry w danych: 40 / 16 / 0.15 / 30 / 90
 *
 * Run z gra/:  node tools/ai-territory-race-test.cjs
 * Mutacje:     AI_RACE_SRC_DIR=<kopia gra/src z mutacja> node tools/ai-territory-race-test.cjs
 *   (kopia musi miec takze ../data wzgledem src — patrz komentarz w tools/ai-territory-race-mutate.sh, jesli istnieje)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_RACE_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-race-'));
const entry = path.join(temp, 'entry.ts');
fs.writeFileSync(entry, [
  `export * as AIMP from ${JSON.stringify(SRC + '/game/auto-improvements')};`,
  `export { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};`,
  `export { territoryOwnerAt, cityTerritoryRadius } from ${JSON.stringify(SRC + '/map/territory')};`,
].join('\n') + '\n');

// Warianty parametrow: nadpisanie pol JSON przez zmienne srodowiskowe (plugin esbuild), osobny proces.
function buildBundle(outName, overrides) {
  const out = path.join(temp, outName);
  cp.execFileSync(process.execPath, ['-e', `
const esbuild = require(${JSON.stringify(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'))});
const fs = require('node:fs');
const overrides = ${JSON.stringify(overrides || {})};
esbuild.build({
  entryPoints: [${JSON.stringify(entry)}], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: ${JSON.stringify(out)}, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: ${JSON.stringify(GRA_ROOT)}, logLevel: 'error',
  nodePaths: [${JSON.stringify(path.resolve(GRA_ROOT, 'node_modules'))}],
  plugins: [{ name: 'race-params', setup(b) {
    b.onLoad({ filter: /ai-territory-race-params\\.json$/ }, a => {
      const j = JSON.parse(fs.readFileSync(a.path, 'utf8'));
      Object.assign(j, overrides);
      return { contents: JSON.stringify(j), loader: 'json' };
    });
  } }],
}).catch(e => { console.error(e); process.exit(1); });
`], { stdio: 'inherit' });
  return require(out);
}

const M = buildBundle('bundle-base.cjs', {});
const { pickAutoImprovements, AI_TERRITORY_RACE } = M.AIMP;
const { getImprovementMeta, territoryOwnerAt, cityTerritoryRadius } = M;

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

const FULL = new Set([
  'Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Górnictwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło',
  'Waluta', 'Wojskowość', 'Żegluga', 'Drogi brukowane', 'Matematyka', 'Obróbka kamienia', 'Kamieniarstwo',
]);
const W = 44, H = 44, CQ = 22, CR = 22;
const K = (q, r) => `${q},${r}`;
function makeMap({ mountains = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  hexes[K(CQ, CR)].terenBazowy = 'gory';
  for (const [q, r] of mountains) { hexes[K(q, r)].terenBazowy = 'gory'; }
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [] };
}
// Zlozo/gory: cenny teren. Tu gora = cenny heks (hexHasDepositReserve nie jest potrzebny).
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'A', population: 5 };
const mkTN = () => [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 5, level: 1 }];

// Ten sam tryb co planCityImprovements: ZAWSZE AI-owner gdy `race` podane; gracz gdy undefined.
function call(mod, map, over = {}) {
  const cities = over.cities ?? [{ ...CITY, ulepszeniaFocus: 'zrownowazone' }];
  return mod.AIMP.pickAutoImprovements({
    cities, ownerId: 0, map, territoryNodes: mkTN(),
    placedImprovements: new Map(), pracaAvailable: over.pool ?? 5000, unlockedTechs: FULL,
    pracaSurplusThreshold: 30, skipWyrab: true,
    demandDriven: true, resourceDeficitKeys: [],
    getFocus: () => 'zrownowazone',
    getOnlyWorked: () => true, getWorkedHexKeys: () => new Set(),
    pracaBudgetPercent: 100, civArchetype: 'grecy', playerEra: 3,
    foodImprovementStages: () => true,
    cityLimitExhausted: over.exhausted ?? true,
    ...(over.race !== undefined ? { aiTerritoryRace: over.race } : {}),
  });
}
const keyPicks = (picks, key) => picks.filter(p => p.key === key);

// Nowe heksy dla budujacego w danym miejscu = jak w pickFortClaims (heks lądowy, bez właściciela wg territoryOwnerAt).
function gainAt(q, r, key) {
  const node = { q, r, pop: 0, level: 1, isFort: key === 'fort', isOutpost: key === 'posterunek' };
  const rad = cityTerritoryRadius(node);
  let g = 0;
  for (let dq = -rad; dq <= rad; dq++) {
    for (let dr = Math.max(-rad, -dq - rad); dr <= Math.min(rad, -dq + rad); dr++) {
      const hq = q + dq, hr = r + dr;
      const hx = map0.hexes[K(hq, hr)];
      if (!hx) continue;
      if (territoryOwnerAt(hq, hr, mkTN()) === null) g++;
    }
  }
  return g;
}
const map0 = makeMap({ mountains: [[CQ + 5, CR]] });
const SPOT = [CQ + 5, CR];
const GAIN_F = gainAt(SPOT[0], SPOT[1], 'fort');
const GAIN_P = gainAt(SPOT[0], SPOT[1], 'posterunek');
const FORT_COST = getImprovementMeta('fort').kosztPraca;

console.log(`Dane pomiarowe: zysk fortu na ${SPOT} = ${GAIN_F}, zysk posterunku = ${GAIN_P}, koszt fortu = ${FORT_COST}`);

// =========================================================================
console.log('G. parametry w danych (decyzje wlasciciela 2026-11-19)');
ok(AI_TERRITORY_RACE.fortMinNoweHeksy === 40, 'fortMinNoweHeksy = 40');
ok(AI_TERRITORY_RACE.posterunekMinNoweHeksy === 16, 'posterunekMinNoweHeksy = 16');
ok(AI_TERRITORY_RACE.fortyUdzialPuliPracy === 0.15, 'fortyUdzialPuliPracy = 0.15');
ok(AI_TERRITORY_RACE.fortyOknoOd === 30 && AI_TERRITORY_RACE.fortyOknoDo === 90, 'okno tur [30, 90]');
ok(M.AIMP.FORT_CLAIM_MIN_NEW_HEXES === 1, 'stala gracza FORT_CLAIM_MIN_NEW_HEXES nadal 1 (gracz bez zmian)');

// =========================================================================
console.log('A. prog fortu: dopuszczony od `prog` nowych heksow (>=), zablokowany przy prog-1');
ok(GAIN_F >= 2, `zysk fortu w tej geometrii (${GAIN_F}) > 1, test ma sens`);
{
  // Wariant: prog = zysk -> fort ma byc; prog = zysk+1 -> fort NIE ma byc. Posterunek zablokowany (prog 10^6).
  const modAtEq = buildBundle('bundle-fort-eq.cjs', { fortMinNoweHeksy: GAIN_F, posterunekMinNoweHeksy: 1000000 });
  const modAbove = buildBundle('bundle-fort-above.cjs', { fortMinNoweHeksy: GAIN_F + 1, posterunekMinNoweHeksy: 1000000 });
  const race = { turn: 60, threatFronts: 0 };
  const pEq = call(modAtEq, map0, { race });
  const pAbove = call(modAbove, map0, { race });
  ok(keyPicks(pEq, 'fort').length === 1, `prog = ${GAIN_F} (zysk) -> fort dozwolony (got ${keyPicks(pEq, 'fort').length})`);
  ok(keyPicks(pAbove, 'fort').length === 0, `prog = ${GAIN_F + 1} (zysk-1 wzgledem progu) -> fort zablokowany (got ${keyPicks(pAbove, 'fort').length})`);
}
{
  // Produkcyjne progi 40: geometria z zyskiem < 40 nie moze dac fortu.
  const picks = call(M, map0, { race: { turn: 60, threatFronts: 0 } });
  const fortOk = GAIN_F >= 40 ? keyPicks(picks, 'fort').length === 1 : keyPicks(picks, 'fort').length === 0;
  ok(fortOk, `produkcja (prog 40): zysk ${GAIN_F} -> fort ${GAIN_F >= 40 ? 'dozwolony' : 'zablokowany'} (got ${keyPicks(picks, 'fort').length})`);
}

// =========================================================================
console.log('B. prog posterunku: osobny prog (16), niezalezny od fortu');
{
  const modEq = buildBundle('bundle-post-eq.cjs', { fortMinNoweHeksy: 1000000, posterunekMinNoweHeksy: GAIN_P });
  const modAbove = buildBundle('bundle-post-above.cjs', { fortMinNoweHeksy: 1000000, posterunekMinNoweHeksy: GAIN_P + 1 });
  const race = { turn: 60, threatFronts: 0 };
  ok(keyPicks(call(modEq, map0, { race }), 'posterunek').length === 1, `prog posterunku = ${GAIN_P} (zysk) -> posterunek dozwolony`);
  ok(keyPicks(call(modAbove, map0, { race }), 'posterunek').length === 0, `prog posterunku = ${GAIN_P + 1} -> posterunek zablokowany`);
}

// =========================================================================
console.log('C. kolejnosc: limit miast NIE wyczerpany -> 0 fortow (nawet przy progu 1)');
{
  const modLow = buildBundle('bundle-low.cjs', { fortMinNoweHeksy: 1, posterunekMinNoweHeksy: 1 });
  const picks = call(modLow, map0, { exhausted: false, race: { turn: 60, threatFronts: 0 } });
  ok(forts(picks).length === 0, `cityLimitExhausted=false -> 0 fortow/posterunkow (got ${forts(picks).length})`);
}
function forts(picks) { return picks.filter(p => p.key === 'fort' || p.key === 'posterunek'); }

// =========================================================================
console.log('D. zagrozenie: w oknie tur udzial fortow = 0; poza oknem zagrozenie nie blokuje');
{
  const race = { turn: 60, threatFronts: 1 };
  ok(forts(call(M, map0, { race })).length === 0, 'tura 60 (okno), threatFronts=1 -> 0 fortow (wojsko pierwsze)');
  const raceOut = { turn: 100, threatFronts: 1 };
  const modLow = buildBundle('bundle-low2.cjs', { fortMinNoweHeksy: 1, posterunekMinNoweHeksy: 1 });
  ok(forts(call(modLow, map0, { race: raceOut })).length >= 1, 'tura 100 (poza oknem), threatFronts=1 -> forty dozwolone (jak przed tematem)');
}

// =========================================================================
console.log('E. udzial puli Pracy 15% w oknie [30,90]');
{
  // Pula = 4 * koszt fortu: 15% < koszt fortu -> w oknie fort odrzucony; poza oknem (100) dozwolony.
  const pool = FORT_COST * 4;
  const modLow = buildBundle('bundle-share.cjs', { fortMinNoweHeksy: 1, posterunekMinNoweHeksy: 1 });
  const inWin = call(modLow, map0, { pool, race: { turn: 60, threatFronts: 0 } });
  ok(keyPicks(inWin, 'fort').length === 0, `okno, pula ${pool} (15% < koszt ${FORT_COST}) -> fort odrzucony przez udzial`);
  const outWin = call(modLow, map0, { pool, race: { turn: 100, threatFronts: 0 } });
  ok(keyPicks(outWin, 'fort').length === 1, 'poza oknem (tura 100) ten sam budzet -> fort dozwolony (brak osobnego udzialu)');
  // Pula duza: 15% > koszt -> w oknie fort dozwolony.
  const big = call(modLow, map0, { pool: 5000, race: { turn: 60, threatFronts: 0 } });
  ok(keyPicks(big, 'fort').length === 1, 'okno, pula 5000 (15% > koszt) -> fort dozwolony');
}

// =========================================================================
console.log('F. gracz (brak aiTerritoryRace) niezmieniony: prog 1, brak udzialu');
{
  const modHi = buildBundle('bundle-hi.cjs', { fortMinNoweHeksy: 1000000, posterunekMinNoweHeksy: 1000000 });
  // Gracz ignoruje progi AI (brak `race`) -> progi 1000000 nie maja wplywu; fort dozwolony jak dotad.
  const picks = call(modHi, map0, { pool: FORT_COST * 4 });
  ok(keyPicks(picks, 'fort').length === 1, 'gracz: fort dozwolony mimo progu AI 10^6 i puli 4xkoszt (brak udzialu/progu)');
}

console.log(`\nWYNIK: ${passed} OK / ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
