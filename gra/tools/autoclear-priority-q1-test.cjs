'use strict';

/**
 * R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1 (zgloszenie wlasciciela 2026-11-01, Rodos: „system mogl budowac farme, a robi trzode”).
 * Rejestr decyzji #1: (E1) farma na heksie BEZ lasu przy rzece -> (E2) wycinka + farma -> (E3) trzoda -> (E4) irygacja.
 *
 * PRZYCZYNA (zmierzona na realnej mapie z nowej gry, ziarno 778899: 1961 heksow `rzeka.obecna`, tylko 1173 w `riverPaths`):
 * picker definiowal „heks z rzeka” (E1/E2/E3) WYLACZNIE przez `map.riverPaths`; centrum miasta / pole obywatela z
 * `rzeka.obecna` poza `riverPaths` nie bylo kandydatem E1, a trzoda stawala wczesniej na innym heksie sciezki rzeki.
 * Farma na tamtym heksie czekala do E5 — za trzoda i irygacja (irygacja ponad % budzetu wstrzymuje E5).
 *
 * KONTRAKT (ten plik):
 *   (a) centrum na rzece z `rzeka.obecna` BEZ wpisu w `riverPaths`: pierwsza budowa = farma NA CENTRUM, zanim padnie jakakolwiek trzoda;
 *   (b) pole obywatela na rzece z `rzeka.obecna` poza `riverPaths`: farma przed jakakolwiek trzoda;
 *   (c) trzoda dopiero PO farmie na tym samym heksie, irygacja po trzodzie (kolejnosc E1 < E3 < E4 zachowana);
 *   (d) r2 (ABC-B): heks TYLKO sasiadujacy z rzeka (bez wlasnej rzeki) = E1 — farma przed trzoda (E3) i irygacja (E4);
 *   (m) r2 Rodos: 1 obywatel, trawa bez lasu przy rzece, centrum przy rzece — pierwsza budowa farma, przed trzoda (K1 i K2);
 *   (e) tylko „Oswojenie zwierzat” (bez Rolnictwa): trzoda moze byc pierwsza (ABC-5=A, technologia nie blokuje nizszych etapow);
 *   (f) K1 „Zywnosc” i K2 „Zrownowazone” — ta sama kolejnosc.
 *
 * Run z gra/:  node tools/autoclear-priority-q1-test.cjs
 * Mutacja:     AUTOCLEAR_SRC_DIR=<kopia gra/src z mutacja> node tools/autoclear-priority-q1-test.cjs   (test MUSI byc czerwony)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AUTOCLEAR_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'autoclear-q1-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements } = require(bundle);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

const FULL = ['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo'];
const W = 24, H = 24, CQ = 12, CR = 12;
const K = (q, r) => `${q},${r}`;
/** `pathRiver` = heksy w `riverPaths`; `flagRiver` = heksy z `rzeka.obecna` BEZ wpisu w `riverPaths` (rzeka widoczna na mapie). */
function makeMap({ pathRiver = [], flagRiver = [], forest = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of pathRiver) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of flagRiver) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of forest) hexes[K(q, r)].nakladka = 'las';
  return {
    szerokoscQ: W, wysokoscR: H, hexes, seed: 7,
    riverPaths: pathRiver.length ? [pathRiver.map(([q, r]) => ({ q, r }))] : [],
  };
}
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'Rodos', population: 1 };
const TN = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 1, level: 1 }];
const FOCUS_OF = { K1: 'zywnosc', K2: 'zrownowazone' };

/** Symulacja tura po turze (jak gracz: picker per tura, wynik wchodzi do `placed`). */
function sim({ map, worked, profil, techs = FULL, turns = 20, pool0 = 300, income = 25, pct = 33, skipWyrab = true, clearTurns = 1 }) {
  const placed = new Map();
  const clearing = new Map(); // hk -> tura zakonczenia wycinki (symulacja city-hex-clear: las znika po `clearTurns` turach)
  const workedSet = new Set(worked.map(([q, r]) => K(q, r)));
  let pool = pool0;
  const log = [];
  for (let t = 0; t < turns; t++) {
    const picks = pickAutoImprovements({
      cities: [{ ...CITY, ulepszeniaFocus: FOCUS_OF[profil] }], ownerId: 0, map, territoryNodes: TN,
      placedImprovements: placed, pracaAvailable: pool, unlockedTechs: new Set(techs),
      pracaSurplusThreshold: 30, skipWyrab, demandDriven: true, resourceDeficitKeys: [],
      getFocus: () => FOCUS_OF[profil], getOnlyWorked: () => true, getWorkedHexKeys: () => workedSet,
      pracaBudgetPercent: pct, getPracaBudgetPercent: () => pct, civArchetype: 'rzymianie', playerEra: 1,
      foodImprovementStages: () => true, clearingHexKeys: new Set(clearing.keys()),
    });
    for (const p of picks) {
      const hk = K(p.q, p.r);
      log.push({ t, key: p.key, hk });
      if (p.key === 'wyrab') { clearing.set(hk, t + clearTurns); continue; }
      pool -= p.kosztPraca;
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
    pool += income;
    for (const [hk, doneT] of [...clearing]) if (t + 1 >= doneT) { map.hexes[hk].nakladka = 'brak'; clearing.delete(hk); }
  }
  return { log, placed };
}
const idx = (log, key, hk) => log.findIndex(e => e.key === key && e.hk === hk);
const firstIdx = (log, key) => log.findIndex(e => e.key === key);

// Rzeka NA heksach (12,9),(12,10),(13,10) w `riverPaths`; centrum (12,12) i pole obywatela (11,12) maja WLASNA rzeke bez wpisu w `riverPaths`.
const PATH = [[12, 9], [12, 10], [13, 10]];
const FLAG = [[12, 12], [11, 12]];

for (const profil of ['K1', 'K2']) {
  console.log(`(a,b,c) [${profil}] centrum i pole obywatela na rzece poza riverPaths: farma przed jakakolwiek trzoda`);
  const map = makeMap({ pathRiver: PATH, flagRiver: FLAG });
  const { log } = sim({ map, worked: [...PATH, [11, 12]], profil });
  const firstBydlo = firstIdx(log, 'bydlo');
  const fCenter = idx(log, 'farma', K(12, 12)), fCitizen = idx(log, 'farma', K(11, 12));
  ok(fCenter >= 0 && fCitizen >= 0, `[${profil}] farma stoi na centrum (${fCenter}) i na polu obywatela (${fCitizen}) przy rzece poza riverPaths`);
  ok(firstBydlo < 0 || (fCenter < firstBydlo && fCitizen < firstBydlo),
    `[${profil}] obie farmy (${fCenter}, ${fCitizen}) PRZED pierwsza trzoda (${firstBydlo}) — rejestr #1: E1 < E3`);
  ok(log[0] && log[0].key === 'farma', `[${profil}] pierwsza budowa to farma (jest: ${log[0] && log[0].key}@${log[0] && log[0].hk})`);
  for (const hk of [K(12, 12), K(11, 12)]) {
    const f = idx(log, 'farma', hk), b = idx(log, 'bydlo', hk), c = idx(log, 'irygacja', hk);
    ok(f >= 0 && (b < 0 || b > f) && (c < 0 || c > f), `[${profil}] ${hk}: farma(${f}) przed trzoda(${b}) i irygacja(${c})`);
  }
}

for (const profil of ['K1', 'K2']) {
  console.log(`(c) [${profil}] heks rzeki w riverPaths: farma < trzoda < irygacja (bez zmian)`);
  const map = makeMap({ pathRiver: PATH });
  const { log } = sim({ map, worked: PATH, profil });
  for (const [q, r] of PATH) {
    const hk = K(q, r);
    const a = idx(log, 'farma', hk), b = idx(log, 'bydlo', hk), c = idx(log, 'irygacja', hk);
    ok(a >= 0 && b > a && c > b, `[${profil}] ${hk}: farma(${a}) < bydlo(${b}) < irygacja(${c})`);
  }
}

console.log('(d) r2 (decyzja orkiestratora ABC-B): heks SASIADUJACY z rzeka (bez wlasnej rzeki) = E1 — farma PRZED trzoda (E3) i irygacja (E4)');
for (const profil of ['K1', 'K2']) {
  const map = makeMap({ pathRiver: PATH });
  // (12,11) sasiaduje z (12,10) z riverPaths, nie ma wlasnej rzeki — dawniej farma dopiero w E5 (po E3/E4).
  const NEAR = [[12, 11]];
  const { log } = sim({ map, worked: [...PATH, ...NEAR], profil, turns: 40, pool0: 600 });
  const fRiver = idx(log, 'farma', K(12, 10));
  const fNear = idx(log, 'farma', K(12, 11));
  const bFirst = firstIdx(log, 'bydlo'), iFirst = firstIdx(log, 'irygacja');
  ok(fRiver >= 0 && fNear >= 0, `[${profil}] farma na rzece (${fRiver}) i na heksie przy rzece (12,11) (${fNear})`);
  ok(fNear < bFirst && fNear < iFirst, `[${profil}] farma przy rzece (${fNear}) PRZED pierwsza trzoda (${bFirst}) i irygacja (${iFirst}) — E1 < E3 < E4`);
  const bNear = idx(log, 'bydlo', K(12, 11));
  ok(bNear < 0 || bNear > fNear, `[${profil}] trzoda na heksie przy rzece (${bNear}) dopiero po farmie (${fNear})`);
}

console.log('(m) RODOS (zgloszenie wlasciciela 2026-11-01): 1 obywatel, trawa BEZ lasu przy rzece, centrum na trawie przy rzece — pierwsza budowa = farma, przed trzoda');
for (const profil of ['K1', 'K2']) {
  // rzeka (12,11),(13,11) w riverPaths; centrum (12,12) SASIADUJE z nia (nie ma wlasnej rzeki); obywatel stoi na (12,11) (na rzece),
  // a (11,12) to wolny, otwarty heks trawiasty przy rzece (tez sasiaduje z (12,11)).
  const RIV = [[12, 11], [13, 11]];
  const map = makeMap({ pathRiver: RIV });
  const { log } = sim({ map, worked: [[12, 11], [11, 12]], profil, turns: 12 });
  const first = log[0];
  ok(first && first.key === 'farma', `[${profil}] Rodos: pierwsza budowa to farma (jest: ${first && first.key}@${first && first.hk})`);
  const bFirst = firstIdx(log, 'bydlo');
  const fC = idx(log, 'farma', K(CQ, CR)), fF = idx(log, 'farma', K(11, 12)), fR = idx(log, 'farma', K(12, 11));
  ok(fC >= 0 && fF >= 0 && fR >= 0, `[${profil}] Rodos: farma na centrum (${fC}), na trawie przy rzece (${fF}) i na polu obywatela (${fR})`);
  ok(bFirst < 0 || (fC < bFirst && fF < bFirst && fR < bFirst), `[${profil}] Rodos: wszystkie 3 farmy PRZED pierwsza trzoda (${bFirst})`);
}

console.log('(e) tylko „Oswojenie zwierzat” (brak Rolnictwa): trzoda moze byc pierwsza (ABC-5=A — technologia nie blokuje nizszych etapow)');
{
  const map = makeMap({ pathRiver: PATH, flagRiver: FLAG });
  const { log } = sim({ map, worked: [...PATH, [11, 12]], profil: 'K2', techs: ['Oswojenie zwierząt'] });
  ok(log.length > 0 && log[0].key === 'bydlo' && firstIdx(log, 'farma') < 0, `bez Rolnictwa: pierwsza budowa to trzoda, zero farm (${log.map(e => e.key).slice(0, 4).join(',')})`);
}

// ---- E2 (wycinka przy rzece) — zarzut Evaluatora R1 #1: zmiana `onRiverHex` dotyczy tez `wyrabMaSens`/`rzekiDoZagospodarowania`/`keyBlockedOnHex` ----
// Korynt: las wszedzie (takze na centrum-sasiadach), rzeka widoczna (`rzeka.obecna`) POZA `riverPaths`, pole obywatela = las.
const FOREST_AROUND = [];
for (let dq = -2; dq <= 2; dq++) for (let dr = -2; dr <= 2; dr++) if (Math.abs(dq + dr) <= 2 && (dq || dr)) FOREST_AROUND.push([CQ + dq, CR + dr]);
const FLAG_FOREST = [[11, 12], [13, 12]]; // pola obywateli: las + wlasna rzeka poza riverPaths
for (const profil of ['K1', 'K2']) {
  console.log(`(g) [${profil}] wycinka ON, pole obywatela = las przy rzece poza riverPaths: wycinka -> farma PRZED jakakolwiek trzoda (E2 < E3)`);
  const map = makeMap({ pathRiver: PATH, flagRiver: [...FLAG, ...FLAG_FOREST], forest: FOREST_AROUND });
  const { log } = sim({ map, worked: [...PATH, ...FLAG_FOREST], profil, skipWyrab: false, turns: 12 });
  for (const [q, r] of FLAG_FOREST) {
    const hk = K(q, r);
    const w = idx(log, 'wyrab', hk), f = idx(log, 'farma', hk), b = idx(log, 'bydlo', hk);
    ok(w >= 0 && f > w, `[${profil}] ${hk}: wycinka(${w}) potem farma(${f})`);
    ok(b > f, `[${profil}] ${hk}: trzoda STAWIA SIE (${b}) dopiero PO farmie (${f}) na wyciętym heksie z rzeka poza riverPaths (E2 < E3)`);
  }
  const fb = firstIdx(log, 'bydlo');
  const fFarms = FLAG_FOREST.map(([q, r]) => idx(log, 'farma', K(q, r)));
  ok(fb < 0 || fFarms.every(i => i >= 0 && i < fb), `[${profil}] farmy na wycietych polach (${fFarms}) przed pierwsza trzoda (${fb}) — rejestr #1: E2 < E3`);
  ok(log.findIndex(e => e.key === 'wyrab') < (fb < 0 ? 1e9 : fb), `[${profil}] pierwsza wycinka przed pierwsza trzoda`);
}
console.log('(h) wycinka OFF (skipWyrab): zero wycinki mimo lasu przy rzece (przycisk „Wolno wycinac las” OFF)');
{
  const map = makeMap({ pathRiver: PATH, flagRiver: [...FLAG, ...FLAG_FOREST], forest: FOREST_AROUND });
  const { log } = sim({ map, worked: [...PATH, ...FLAG_FOREST], profil: 'K2', skipWyrab: true, turns: 12 });
  ok(firstIdx(log, 'wyrab') < 0, 'OFF: brak wycinki');
  ok(FLAG_FOREST.every(([q, r]) => idx(log, 'farma', K(q, r)) < 0 && idx(log, 'bydlo', K(q, r)) < 0), 'OFF: ani farma ani trzoda na lesie (trzoda NIE na lesie)');
}
console.log('(i) las na heksie rzeki w riverPaths — wycinka rowniez dziala (kontrola: nie zepsulismy sciezki bazowej)');
{
  const map = makeMap({ pathRiver: PATH, forest: [[12, 10]] });
  const { log } = sim({ map, worked: PATH, profil: 'K2', skipWyrab: false, turns: 12 });
  const w = idx(log, 'wyrab', K(12, 10)), f = idx(log, 'farma', K(12, 10));
  ok(w >= 0 && f > w, `(12,10) w riverPaths: wycinka(${w}) potem farma(${f})`);
}

console.log('(k) wycinka na heksie z rzeka (poza riverPaths) PRZED wycinka poza rzeka (E2 < E5), trzoda PO farmie na centrum-rzece');
for (const profil of ['K1', 'K2']) {
  const OFF = [11, 11]; // heks lasu BEZ rzeki (poza rzeka) — bez Gospodarki wodnej nie liczy sie jako rzeka
  const ON = [13, 12];  // heks lasu z rzeka poza riverPaths
  const map = makeMap({ pathRiver: PATH, flagRiver: [...FLAG, ON], forest: [OFF, ON, ...FOREST_AROUND] });
  const { log } = sim({ map, worked: [...PATH, [11, 12], OFF, ON], profil, skipWyrab: false, turns: 16, pool0: 600 });
  const wOn = idx(log, 'wyrab', K(...ON)), wOff = idx(log, 'wyrab', K(...OFF));
  ok(wOn >= 0, `[${profil}] wycinka na heksie z rzeka (${wOn})`);
  ok(wOff < 0 || wOn < wOff, `[${profil}] wycinka z rzeka (${wOn}) przed wycinka poza rzeka (${wOff}) — E2 < E5`);
  const bC = idx(log, 'bydlo', K(CQ, CR)), fC = idx(log, 'farma', K(CQ, CR));
  ok(bC > fC && fC >= 0, `[${profil}] trzoda na centrum z rzeka poza riverPaths (${bC}) stawia sie PO farmie (${fC})`);
}

console.log('(l) jedyny „heks do zagospodarowania” to las z rzeka poza riverPaths: wycinka poza rzeka CZEKA (bramka rzekiDoZagospodarowania, E2 < E5)');
for (const profil of ['K1', 'K2']) {
  const OFF = [11, 12];  // las bez rzeki, bliżej centrum
  const ON = [14, 12];   // las z rzeka poza riverPaths, dalej
  const map = makeMap({ flagRiver: [ON], forest: [OFF, ON] });
  const { log } = sim({ map, worked: [OFF, ON], profil, skipWyrab: false, turns: 12, pool0: 600 });
  const wOn = idx(log, 'wyrab', K(...ON)), wOff = idx(log, 'wyrab', K(...OFF));
  ok(wOn >= 0, `[${profil}] wycinka na lesie z rzeka (${wOn})`);
  ok(wOff < 0 || wOn < wOff, `[${profil}] wycinka z rzeka (${wOn}) przed wycinka poza rzeka (${wOff})`);
}

console.log(`\nautoclear-priority-q1-test: ${passed} passed, ${failed} failed`);
fs.rmSync(temp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
