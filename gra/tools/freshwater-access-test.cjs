'use strict';
/**
 * freshwater-access-test.cjs — R-WEB-FRESHWATER-ACCESS-LAKE-Q1.
 * Run z gra/:  node tools/freshwater-access-test.cjs
 * Mutacje:     FRESHWATER_SRC_DIR=<kopia gra/src> node tools/freshwater-access-test.cjs
 *
 * (A) hasFreshwaterAccess: jezioro TAK, morze/ocean NIE, rzeka TAK, ujście rzeki do morza TAK (przez rzekę),
 *     brzegi sąsiedztwa N-1 / N / N+1, kanał połączony z oceanem = morze (NIE).
 * (B) cityHasWaterAccess (zdrowie): na mapie BEZ jezior wynik identyczny z dawną definicją rzeka-only (każdy heks),
 *     etykieta zdrowia „Jezioro” / „Rzeka”, kara „Brak wody” przy morzu.
 * (C) pickAutoImprovements — decyzja właściciela 2026-11-02: ZERO awaryjnego tartaku/obozu na heksach NA rzece
 *     i SĄSIADUJĄCYCH z rzeką (także sama `rzeka.obecna` sąsiada) ani przy jeziorze; las poza wodą słodką → tartak powstaje;
 *     las przy morzu → tartak powstaje; E2 (wycinka + farma na rzece) zostaje.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.FRESHWATER_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'freshwater-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, [
  `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};`,
  `export { cityHasWaterAccess, computeCityHealthBreakdown } from ${JSON.stringify(SRC + '/game/turn-economy')};`,
  `export { hasFreshwaterAccess, isLakeHex, getLakeHexSet, invalidateFreshwaterCache, isFreshwaterReservedHex } from ${JSON.stringify(SRC + '/map/freshwater')};`,
].join('\n') + '\n');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error', nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(bundle);
const { pickAutoImprovements, cityHasWaterAccess, computeCityHealthBreakdown, hasFreshwaterAccess, isLakeHex, invalidateFreshwaterCache } = M;

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}
const K = (q, r) => `${q},${r}`;
const NB = (q, r) => [[q + 1, r], [q - 1, r], [q, r + 1], [q, r - 1], [q + 1, r - 1], [q - 1, r + 1]];

// ---------------------------------------------------------------- fikstura mapy
const W = 24, H = 24;
/**
 * Mapa 24x24 równiny; obwódka (q lub r = 0 / 23) = Morze (ocean — dotyka krawędzi).
 * opts.lake — heksy Morza w środku lądu (jezioro); opts.channel — Morze połączone z obwódką (zatoka = ocean);
 * opts.river — heksy w riverPaths I z rzeka.obecna; opts.riverVisibleOnly — tylko rzeka.obecna (bez riverPaths);
 * opts.forest — heksy z lasem; opts.ring=false — bez obwódki oceanu.
 */
function makeMap({ lake = [], channel = [], river = [], riverVisibleOnly = [], forest = [], ring = true } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    const edge = ring && (q === 0 || r === 0 || q === W - 1 || r === H - 1);
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: edge ? 'morze' : 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of [...lake, ...channel]) hexes[K(q, r)].terenBazowy = 'plytkie_morze';
  for (const [q, r] of river) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of riverVisibleOnly) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of forest) hexes[K(q, r)].nakladka = 'las';
  return {
    szerokoscQ: W, wysokoscR: H, hexes, seed: 1,
    riverPaths: river.length ? [river.map(([q, r]) => ({ q, r }))] : [],
  };
}

// ---------------------------------------------------------------- (A)
console.log('(A) hasFreshwaterAccess: jezioro / morze / rzeka / ujscie / brzegi N-1,N,N+1');
{
  const LAKE = [[10, 10], [11, 10], [10, 11]];
  const CHANNEL = [[18, 18], [19, 18], [20, 18], [21, 18], [22, 18]]; // dotyka obwodki (23,18) => ocean
  const RIVER = [[5, 15], [5, 14]];
  const MOUTH = [[1, 5], [2, 5], [3, 5]]; // (1,5) sasiaduje z oceanem (0,5)
  const map = makeMap({ lake: LAKE, channel: CHANNEL, river: [...RIVER, ...MOUTH] });
  const has = (q, r) => hasFreshwaterAccess({ q, r }, map);
  ok(isLakeHex(map, 10, 10) && isLakeHex(map, 11, 10) && isLakeHex(map, 10, 11), 'zamkniete Morze w ladzie = jezioro');
  ok(!isLakeHex(map, 20, 18) && !isLakeHex(map, 0, 5), 'zatoka polaczona z krawedzia i obwodka = ocean, NIE jezioro');
  ok(M.getLakeHexSet(map).size === 3, `zbior jezior = 3 heksy (got ${M.getLakeHexSet(map).size})`);
  ok(has(12, 10) && has(10, 9) && has(9, 11), 'miasto przy jeziorze (odleglosc 1) => woda TAK');
  ok(has(11, 11), 'miasto sasiadujace z dwoma heksami jeziora => TAK');
  ok(!has(13, 10) && !has(8, 10), 'N+1: odleglosc 2 od jeziora => NIE');
  ok(!has(17, 18) && !has(1, 18), 'miasto przy zatoce/morzu (ocean) => NIE');
  ok(!has(1, 12), 'miasto przy oceanie (obwodka), bez rzeki i jeziora => NIE');
  ok(has(5, 16) && has(4, 15) && has(5, 15), 'miasto przy rzece (N-1 / na rzece / N) => TAK');
  ok(!has(5, 17), 'N+1: odleglosc 2 od rzeki => NIE');
  ok(has(2, 6) || has(1, 6), 'przy ujsciu rzeki do morza => TAK przez rzeke');
  ok(has(1, 4) && has(1, 5), 'ujscie: heks nad ocean + rzeka => TAK');
  ok(!has(1, 8), 'ta sama linia brzegowa, 3 heksy od ujscia => NIE (morze nie daje wody)');
  // brak jezior => zbior pusty, funkcja rzeka-only
  const none = makeMap({ river: RIVER });
  ok(M.getLakeHexSet(none).size === 0 && !hasFreshwaterAccess({ q: 1, r: 12 }, none) && hasFreshwaterAccess({ q: 5, r: 16 }, none), 'mapa bez jezior: zbior pusty, rzeka-only');
  // invalidacja po mutacji terenu w miejscu
  const m2 = makeMap({});
  ok(!hasFreshwaterAccess({ q: 8, r: 8 }, m2), 'przed mutacja: brak wody');
  m2.hexes[K(9, 8)].terenBazowy = 'morze'; // nowe zamkniete jezioro (stary cache pusty)
  invalidateFreshwaterCache(m2);
  ok(hasFreshwaterAccess({ q: 8, r: 8 }, m2), 'po invalidateFreshwaterCache: nowe jezioro widoczne');
  // jezioro dotykajace krawedzi mapy = ocean (brak ukrytego sasiada); mapa bez obwodki
  const m3 = makeMap({ ring: false, lake: [[0, 5]] });
  ok(!isLakeHex(m3, 0, 5), 'woda przy krawedzi mapy (brak sasiada w siatce) = ocean');
  // zarzut Ev R1 #3: lad na CALYM obwodzie (zadna woda nie dotyka krawedzi) — najwieksza skladowa = ocean, nie jezioro
  const big = [];
  for (let q = 8; q <= 11; q++) for (let r = 8; r <= 11; r++) big.push([q, r]);
  const m4 = makeMap({ ring: false, channel: big, lake: [[3, 3]] });
  ok(!isLakeHex(m4, 9, 9) && !hasFreshwaterAccess({ q: 7, r: 9 }, m4), 'lad na obwodzie: najwieksze morze nadal ocean (miasto przy nim bez wody)');
  ok(isLakeHex(m4, 3, 3) && hasFreshwaterAccess({ q: 4, r: 3 }, m4), 'lad na obwodzie: mniejsza zamknieta skladowa = jezioro (woda TAK)');
}

// ---------------------------------------------------------------- (B)
console.log('(B) cityHasWaterAccess (zdrowie): regres zero na mapie bez jezior + etykieta');
{
  // dawna definicja rzeka-only, 1:1 sprzed zmiany (turn-economy.ts, D17-A)
  function legacy(city, map) {
    const set = new Set();
    for (const p of map.riverPaths ?? []) for (const h of p) set.add(`${h.q},${h.r}`);
    const hex = map.hexes[K(city.q, city.r)];
    if (hex && hex.rzeka && hex.rzeka.obecna) return true;
    if (set.has(K(city.q, city.r))) return true;
    for (const [a, b] of NB(city.q, city.r)) if (set.has(K(a, b))) return true;
    return false;
  }
  const map = makeMap({
    river: [[6, 6], [6, 7], [7, 7], [8, 7], [9, 8], [10, 8]], riverVisibleOnly: [[15, 15], [16, 15]],
    channel: [[14, 20], [15, 20], [16, 20], [17, 20], [18, 20], [19, 20], [20, 20], [21, 20], [22, 20]], forest: [[3, 3]],
  });
  let diff = 0, total = 0, yes = 0;
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    total++;
    const a = cityHasWaterAccess({ q, r }, map);
    const b = legacy({ q, r }, map);
    if (a) yes++;
    if (a !== b) diff++;
  }
  ok(diff === 0, `mapa bez jezior: cityHasWaterAccess == dawna definicja na ${total}/${total} heksach (rozbieznosci: ${diff}, TAK=${yes})`);
  // zdrowie: breakdown
  const lakeMap = makeMap({ lake: [[10, 10]], river: [[5, 15]] });
  const bd = (q, r, m) => computeCityHealthBreakdown(5, [], [], {}, 'normal', { city: { q, r, population: 5 }, map: m });
  const l = bd(11, 10, lakeMap).lines.map(x => x.label);
  ok(l.includes('Jezioro') && !l.includes('Rzeka') && !l.includes('Brak wody'), `miasto przy jeziorze: linia „Jezioro”, brak kary „Brak wody” (${l.join('|')})`);
  const rv = bd(5, 16, lakeMap).lines.map(x => x.label);
  ok(rv.includes('Rzeka') && !rv.includes('Jezioro') && !rv.includes('Brak wody'), `miasto przy rzece: linia „Rzeka” (${rv.join('|')})`);
  const sea = bd(1, 12, lakeMap).lines.map(x => x.label);
  ok(sea.includes('Brak wody') && !sea.includes('Rzeka') && !sea.includes('Jezioro'), `miasto przy morzu: kara „Brak wody” (${sea.join('|')})`);
  const tSea = bd(1, 12, lakeMap).total, tLake = bd(11, 10, lakeMap).total;
  ok(tLake > tSea, `suma zdrowia: jezioro (${tLake}) > morze (${tSea})`);
}

// ---------------------------------------------------------------- (C)
console.log('(C) pickAutoImprovements: ZERO tartaka/obozu na wodzie slodkiej (rzeka, sasiad rzeki, jezioro); poza woda i przy morzu tartak powstaje');
const FULL = ['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Koło', 'Kamieniarstwo'];
const CQ = 12, CR = 12;
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'A', population: 12 };
const TN = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 12, level: 1 }];
function sim(map, forest, { focus = 'surowce', deficit = [], turns = 12 } = {}) {
  const placed = new Map();
  const worked = new Set([...forest.map(([q, r]) => K(q, r)), K(CQ, CR)]);
  const log = [];
  for (let t = 0; t < turns; t++) {
    const picks = pickAutoImprovements({
      cities: [{ ...CITY, ulepszeniaFocus: focus }], ownerId: 0, map, territoryNodes: TN,
      placedImprovements: placed, pracaAvailable: 5000, unlockedTechs: new Set(FULL),
      pracaSurplusThreshold: 30, skipWyrab: false, demandDriven: true, resourceDeficitKeys: deficit,
      getFocus: () => focus, getOnlyWorked: () => true, getWorkedHexKeys: () => worked,
      pracaBudgetPercent: 100, civArchetype: 'grecy', playerEra: 3,
      foodImprovementStages: () => focus === 'zywnosc' || focus === 'zrownowazone',
    });
    for (const p of picks) {
      log.push({ t, key: p.key, hk: K(p.q, p.r) });
      if (p.key === 'wyrab') { map.hexes[K(p.q, p.r)].nakladka = 'brak'; continue; }
      placed.set(K(p.q, p.r), [...(placed.get(K(p.q, p.r)) ?? []), p.key]);
    }
  }
  return log;
}
const wood = log => log.filter(e => e.key === 'tartak' || e.key === 'oboz_lowiecki');
const PROFILES = [['surowce', []], ['zrownowazone', ['drewno']]];
for (const [focus, deficit] of PROFILES) {
  const tag = `[${focus}${deficit.length ? '+niedobor drewna' : ''}]`;
  // 1. las WYLACZNIE przy rzece (riverPaths): na rzece + sasiad => 0 tartakow (brak awaryjnego tartaku)
  {
    const RIV = [[12, 9], [12, 10], [13, 10]];
    const FOR = [[12, 10], [11, 11], [12, 11]]; // na rzece + dwa sasiady rzeki
    const map = makeMap({ river: RIV, forest: FOR });
    const log = sim(map, FOR, { focus, deficit });
    ok(wood(log).length === 0, `${tag} las tylko przy rzece: tartak/oboz 0 (got ${wood(log).map(e => e.key + '@' + e.hk).join(',') || '-'})`);
    if (focus === 'zrownowazone') {
      ok(log.some(e => e.key === 'wyrab' && e.hk === K(12, 10)) && log.some(e => e.key === 'farma' && e.hk === K(12, 10)), `${tag} E2 zostaje: wyrab -> farma na rzece+las`);
    }
  }
  // 2. sasiad z SAMA rzeka.obecna (bez riverPaths) => tez zarezerwowany
  {
    const FOR = [[11, 13]]; // sasiad (11,14) z rzeka.obecna bez wpisu w riverPaths
    const map = makeMap({ riverVisibleOnly: [[11, 14]], forest: FOR });
    const log = sim(map, FOR, { focus, deficit });
    ok(wood(log).length === 0, `${tag} las przy rzece widocznej tylko jako rzeka.obecna: tartak/oboz 0 (got ${wood(log).map(e => e.key + '@' + e.hk).join(',') || '-'})`);
  }
  // 3. las przy JEZIORZE => zarezerwowany pod zywnosc
  {
    const FOR = [[12, 14]]; // sasiad jeziora (12,15)
    const map = makeMap({ lake: [[12, 15]], forest: FOR });
    const log = sim(map, FOR, { focus, deficit });
    ok(wood(log).length === 0, `${tag} las przy jeziorze: tartak/oboz 0 (got ${wood(log).map(e => e.key + '@' + e.hk).join(',') || '-'})`);
  }
  // 4. kontrola: las POZA woda slodka => tartak powstaje
  {
    const FOR = [[14, 12], [11, 13]];
    const map = makeMap({ river: [[12, 7], [12, 6]], lake: [[12, 17]], forest: FOR });
    const log = sim(map, FOR, { focus, deficit });
    const t = log.filter(e => e.key === 'tartak');
    ok(t.length === FOR.length, `${tag} las poza woda slodka: tartak powstaje (${t.length}/${FOR.length})`);
  }
  // 5. kontrola: las przy MORZU (zatoka polaczona z oceanem) => tartak powstaje (morze to nie woda slodka)
  {
    const FOR = [[15, 12]];
    const map = makeMap({ channel: [[16, 12], [17, 12], [18, 12], [19, 12], [20, 12], [21, 12], [22, 12]], forest: FOR });
    const log = sim(map, FOR, { focus, deficit });
    ok(log.some(e => e.key === 'tartak' && e.hk === K(15, 12)), `${tag} las przy morzu: tartak powstaje`);
  }
  // 6. brzeg N+1: las 2 heksy od rzeki (nie sasiad) => tartak powstaje
  {
    const FOR = [[12, 11]]; // rzeka (12,9): dystans 2
    const map = makeMap({ river: [[12, 9], [12, 8]], forest: FOR });
    const log = sim(map, FOR, { focus, deficit });
    ok(log.some(e => e.key === 'tartak' && e.hk === K(12, 11)), `${tag} N+1 (2 heksy od rzeki): tartak powstaje`);
  }
}

console.log('\nWynik:', passed, 'PASS /', failed, 'FAIL');
fs.rmSync(temp, { recursive: true, force: true });
process.exit(failed === 0 ? 0 : 1);
