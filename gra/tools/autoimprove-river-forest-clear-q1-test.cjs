'use strict';
/**
 * R-WEB-AUTOIMPROVE-RIVER-FOREST-CLEAR-Q1 (zgloszenie wlasciciela 2026-11-04, Ostia: gesty las wokol miasta i przy rzece, brak
 * wycinki/farm): przy profilach automatu „Zywnosc” i „Zrownowazony” wycinka lasu (takze przy rzece) pod farmy dziala NIEZALEZNIE
 * od przelacznika „Wolno wycinac las” (domyslnie WYLACZONY, cities.ts) — przelacznik rzadzi juz tylko wycinka „na drewno”
 * (profile „Surowce”/„Infrastruktura”). Zachowane: (a) tylko pola z obywatelami, (b) las przy rzece MOZE byc wyciety + farma,
 * (c) tartak/oboz na heksie chroni las, (d) zero awaryjnego tartaku.
 *
 * Run z gra/:  node tools/autoimprove-river-forest-clear-q1-test.cjs
 * Mutacja:     RFCT_SRC_DIR=<kopia gra/src z mutacja> node tools/autoimprove-river-forest-clear-q1-test.cjs   (MUSI byc czerwony)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.RFCT_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'rfct-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export * from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const AI = require(bundle);
const { pickAutoImprovements, skipWyrabForFocus } = AI;

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}
const K = (q, r) => `${q},${r}`;
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Brązownictwo',
  'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Irygacja',
  'Drogi brukowane', 'Matematyka', 'Pieniądz', 'Hodowla', 'Nawadnianie',
]);
const W = 30, H = 30, CQ = 15, CR = 15, PID = 3, ERA = 3;
const RIVER = [[15, 11], [15, 12], [15, 13], [15, 14], [16, 14], [16, 16], [16, 17], [15, 18]];
const RIVER_FOREST = [[15, 12], [15, 13]];   // las NA rzece, pole obywatela
const OFF_FOREST = [13, 15];                  // las poza rzeka, pole obywatela
const UNWORKED_RIVER_FOREST = [16, 16];       // las na rzece BEZ obywatela
const TARTAK_FOREST = [12, 12];               // las z tartakiem, pole obywatela

function scenarioMap() {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: (q + r) % 5 === 0 ? 'laka' : 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of RIVER) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of [...RIVER_FOREST, OFF_FOREST, UNWORKED_RIVER_FOREST, TARTAK_FOREST]) hexes[K(q, r)].nakladka = 'las';
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [RIVER.map(([q, r]) => ({ q, r }))] };
}
const WORKED = new Set([
  K(CQ, CR), K(15, 14), K(16, 14), ...RIVER_FOREST.map(([q, r]) => K(q, r)), K(...OFF_FOREST), K(...TARTAK_FOREST),
]);

/** Symulacja `turns` tur automatu gracza; `wolno` = przelacznik „Wolno wycinac las”, `skipRule` = regula wolajacego (main.ts). */
function sim({ focus, wolno, turns = 14, skipRule = (f, w) => (typeof skipWyrabForFocus === 'function' ? skipWyrabForFocus(f, w) : !w), onlyWorked = true }) {
  const map = scenarioMap();
  const city = { id: 'city0', ownerId: PID, q: CQ, r: CR, name: 'Ostia', population: 6 };
  const tn = [{ q: CQ, r: CR, ownerId: PID, cityId: 'city0', pop: 6, level: 1 }];
  const placed = new Map([[K(...TARTAK_FOREST), ['tartak']]]);
  const log = [];
  for (let t = 0; t < turns; t++) {
    const picks = pickAutoImprovements({
      cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: 900,
      unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: true, getSkipWyrab: () => skipRule(focus, wolno),
      demandDriven: true, resourceDeficitKeys: [], getFocus: () => focus, getOnlyWorked: () => onlyWorked,
      getWorkedHexKeys: () => WORKED, pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100,
      civArchetype: 'grecy', playerEra: ERA, foodImprovementStages: () => focus === 'zywnosc' || focus === 'zrownowazone',
      clearingHexKeys: new Set(),
    });
    for (const p of picks) {
      const hk = K(p.q, p.r);
      log.push({ t, key: p.key, hk });
      if (p.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
  }
  return { log, map, placed };
}
const cut = (res, hk) => res.log.some(e => e.key === 'wyrab' && e.hk === hk);
const farmAt = (res, hk) => res.log.some(e => e.key === 'farma' && e.hk === hk);
const HK = a => K(a[0], a[1]);

console.log('\n[1] regula przelacznika (skipWyrabForFocus)');
ok(typeof skipWyrabForFocus === 'function', 'eksport skipWyrabForFocus istnieje');
if (typeof skipWyrabForFocus === 'function') {
  ok(skipWyrabForFocus('zywnosc', false) === false, 'Zywnosc + przelacznik WYL -> wycinka dozwolona');
  ok(skipWyrabForFocus('zrownowazone', false) === false, 'Zrownowazony + przelacznik WYL -> wycinka dozwolona');
  ok(skipWyrabForFocus('surowce', false) === true, 'Surowce + przelacznik WYL -> wycinka zablokowana (przelacznik nadal dziala)');
  ok(skipWyrabForFocus('infrastruktura', false) === true, 'Infrastruktura + przelacznik WYL -> zablokowana');
  ok(skipWyrabForFocus('surowce', true) === false && skipWyrabForFocus('infrastruktura', true) === false, 'Surowce/Infrastruktura + przelacznik WL -> dozwolona');
}

for (const focus of ['zywnosc', 'zrownowazone']) {
  console.log(`\n[2] ${focus}: przelacznik „Wolno wycinac las” WYL (domyslny w grze)`);
  const r = sim({ focus, wolno: false });
  for (const rf of RIVER_FOREST) ok(cut(r, HK(rf)), `${focus}: las NA rzece z obywatelem ${HK(rf)} wyciety`);
  ok(RIVER_FOREST.every(rf => farmAt(r, HK(rf))), `${focus}: po wycince farma na wyciętych polach przy rzece`);
  ok(cut(r, HK(OFF_FOREST)), `${focus}: las poza rzeka z obywatelem ${HK(OFF_FOREST)} tez wyciety (E5, po rzekach)`);
  ok(!cut(r, HK(UNWORKED_RIVER_FOREST)), `${focus}: (a) las na rzece BEZ obywatela NIE wyciety`);
  ok(!cut(r, HK(TARTAK_FOREST)) && r.map.hexes[HK(TARTAK_FOREST)].nakladka === 'las', `${focus}: (c) las z tartakiem nietkniety`);
  ok(!r.log.some(e => e.key === 'tartak' && e.hk !== HK(TARTAK_FOREST)), `${focus}: (d) zero awaryjnego tartaku`);
  ok(r.log.some(e => e.key === 'irygacja'), `${focus}: irygacja nadal powstaje po farmach`);
}

console.log('\n[3] przelacznik WL — bez zmian zachowania Zywnosc/Zrownowazony');
for (const focus of ['zywnosc', 'zrownowazone']) {
  const on = sim({ focus, wolno: true }), off = sim({ focus, wolno: false });
  ok(JSON.stringify(on.log) === JSON.stringify(off.log), `${focus}: wynik identyczny dla przelacznika WL i WYL`);
}

console.log('\n[4] Surowce: przelacznik WYL nadal blokuje wycinke (bez regresji)');
{
  const r = sim({ focus: 'surowce', wolno: false });
  ok(!r.log.some(e => e.key === 'wyrab'), 'surowce + WYL: zero wycinek');
}

console.log('\n[5] onlyWorked OFF (kontrola: profil nie zalezy od przelacznika)');
{
  const r = sim({ focus: 'zywnosc', wolno: false, onlyWorked: false });
  ok(cut(r, HK(RIVER_FOREST[0])), 'zywnosc + onlyWorked OFF + przelacznik WYL: wycinka rzeczna dziala');
}

console.log('\n[6] wiazanie w main.ts (statyczne)');
{
  const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  ok(/getSkipWyrab:\s*c\s*=>\s*\{[\s\S]{0,260}skipWyrabForFocus\(\s*pol\.focus\s*,\s*pol\.wolnoWycinacLas\s*\)/.test(main),
    'main.ts: getSkipWyrab automatu gracza uzywa skipWyrabForFocus(focus, wolnoWycinacLas)');
  ok(!/getSkipWyrab:\s*c\s*=>\s*!effectiveUlepszeniaForCity\(c as City\)\.wolnoWycinacLas/.test(main),
    'main.ts: stare wiazanie „!wolnoWycinacLas dla kazdego profilu” usuniete');
}

console.log(`\n${passed} OK, ${failed} FAIL`);
fs.rmSync(temp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
