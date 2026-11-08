'use strict';
/**
 * R-WEB-GENERALS-OVER-LIMIT-Q1: niezmiennik "zywi wodzowie (isGeneral) <= limit epoki wlasciciela".
 * Run from gra/: node tools/generals-limit-invariant-test.cjs
 *
 * Czesc A: modelowy symulator zywych wodzow/kolejek uzywa PRAWDZIWYCH funkcji z game/generals.ts
 *          (bundlowane esbuildem): generalLimitForEra, canRecruitGeneral, canSpawnQueuedGeneral,
 *          planGeneralLimitDemotions. Model "base" odtwarza zachowanie PRZED poprawka (kolejkowy wodz
 *          rodzi sie zawsze jako wodz) i musi lamac niezmiennik -- model "fixed" musi go trzymac.
 * Czesc B: straznik zrodla main.ts -- oba miejsca narodzin jednostki z kolejki rekrutacji bramkuja flage
 *          wodza przez generalMaySpawnForOwner, a wczytanie zapisu wola planGeneralLimitDemotions.
 *          Mutacja (cofniecie poprawki w main.ts) lamie ten straznik.
 */
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const MAIN = path.resolve(GRA, 'src/main.ts');
let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${ok || detail === undefined ? '' : ' -- ' + JSON.stringify(detail)}`);
  if (!ok) failures++;
}

const built = esbuild.buildSync({
  entryPoints: [path.resolve(GRA, 'src/game/generals.ts')], bundle: true, write: false, format: 'cjs', platform: 'node',
});
const G = { exports: {} };
new Function('module', 'exports', built.outputFiles[0].text)(G, G.exports);
const gen = G.exports;
const hasFix = typeof gen.canSpawnQueuedGeneral === 'function' && typeof gen.planGeneralLimitDemotions === 'function';
check('generals.ts eksportuje canSpawnQueuedGeneral + planGeneralLimitDemotions', hasFix);

// ---- model gry (minimum): jednostki, kolejki per miasto, wlasciciele miast, epoki ----
function makeWorld(fixed) {
  const w = { units: [], cities: new Map(), era: new Map(), n: 0 };
  const alive = o => w.units.filter(u => u.ownerId === o && u.isGeneral).length;
  const queued = o => [...w.cities.values()].filter(c => c.ownerId === o).reduce((s, c) => s + c.queue.filter(i => i.isGeneral).length, 0);
  w.addCity = (id, ownerId) => w.cities.set(id, { id, ownerId, queue: [] });
  w.setEra = (o, e) => w.era.set(o, e);
  // zakup (bramka jak attemptGeneralPurchase -> canRecruitGeneral)
  w.buy = (cityId, ownerId) => {
    if (!gen.canRecruitGeneral(w.era.get(ownerId), { alive: alive(ownerId), queued: queued(ownerId) })) return false;
    w.cities.get(cityId).queue.push({ id: 'Rydwan', isGeneral: true });
    return true;
  };
  // narodziny z kolejki (main.ts: 2 miejsca) -- base: zawsze wodz; fixed: wodz tylko pod limitem
  w.spawnFromQueue = cityId => {
    const c = w.cities.get(cityId);
    for (const it of c.queue.splice(0)) {
      const isGeneral = it.isGeneral === true && (!fixed || gen.canSpawnQueuedGeneral(w.era.get(c.ownerId), alive(c.ownerId)));
      w.units.push({ id: 'u' + w.n++, ownerId: c.ownerId, isGeneral });
    }
  };
  w.capture = (cityId, newOwner) => { w.cities.get(cityId).ownerId = newOwner; }; // kolejka przechodzi z miastem
  w.load = () => { // wczytanie zapisu
    if (!fixed) return;
    for (const id of gen.planGeneralLimitDemotions(w.units, o => w.era.get(o))) w.units.find(u => u.id === id).isGeneral = false;
  };
  w.alive = alive;
  return w;
}
function invariant(w) {
  const bad = [];
  for (const [o, e] of w.era) if (w.alive(o) > gen.generalLimitForEra(e)) bad.push({ owner: o, alive: w.alive(o), limit: gen.generalLimitForEra(e) });
  return bad;
}

// S1: zdobycie miasta z zakolejkowanym wodzem przeciwnika -> nowy wlasciciel dostaje dodatkowego wodza
function s1(fixed) {
  const w = makeWorld(fixed);
  w.setEra(0, 2); w.setEra(1, 2);
  w.addCity('capA', 0); w.addCity('capB', 1);
  w.buy('capA', 0); w.spawnFromQueue('capA'); w.buy('capA', 0); w.spawnFromQueue('capA'); // gracz: 2/2 (Braz)
  w.buy('capB', 1);                                                                       // AI: wodz w kolejce
  w.capture('capB', 0);                                                                   // gracz zdobywa stolice AI
  w.spawnFromQueue('capB');
  return w;
}
// S2: dwie cesje/kapitulacje naraz: gracz ma pelny limit (2/2), przejmuje dwa miasta z zakolejkowanymi wodzami AI
function s2(fixed) {
  const w = makeWorld(fixed);
  w.setEra(0, 2); w.setEra(1, 2); w.setEra(2, 2);
  w.addCity('capP', 0); w.addCity('capA', 1); w.addCity('capC', 2);
  w.buy('capP', 0); w.spawnFromQueue('capP'); w.buy('capP', 0); w.spawnFromQueue('capP');
  w.buy('capA', 1); w.buy('capC', 2);
  w.capture('capA', 0); w.capture('capC', 0);
  w.spawnFromQueue('capA'); w.spawnFromQueue('capC');
  return w;
}
// S3: zakup w wielu miastach w jednej turze -- bramka zlicza kolejke wszystkich miast
function s3(fixed) {
  const w = makeWorld(fixed);
  w.setEra(0, 2);
  for (const c of ['a', 'b', 'c', 'd']) w.addCity(c, 0);
  const bought = ['a', 'b', 'c', 'd'].map(c => w.buy(c, 0));
  for (const c of ['a', 'b', 'c', 'd']) w.spawnFromQueue(c);
  w.bought = bought.filter(Boolean).length;
  return w;
}
// S4: zakup + zmiana epoki (limit rosnie, nigdy nie spada) -- kolejna epoka dodaje slot
function s4(fixed) {
  const w = makeWorld(fixed);
  w.setEra(0, 1); w.addCity('cap', 0);
  w.buy('cap', 0); w.spawnFromQueue('cap');
  const second = w.buy('cap', 0);          // Kamien: limit 1 -> odmowa
  w.setEra(0, 2);
  const third = w.buy('cap', 0); w.spawnFromQueue('cap');
  w.second = second; w.third = third;
  return w;
}
// S5: zapis/wczytanie ze starym nadmiarem (3 wodzow w Brazie) + kolejnosc narodzin
function s5(fixed) {
  const w = makeWorld(fixed);
  w.setEra(0, 2); w.setEra(1, 1);
  w.units.push({ id: 'g1', ownerId: 0, isGeneral: true }, { id: 'p', ownerId: 0, isGeneral: false },
    { id: 'g2', ownerId: 0, isGeneral: true }, { id: 'g3', ownerId: 0, isGeneral: true },
    { id: 'h1', ownerId: 1, isGeneral: true }, { id: 'h2', ownerId: 1, isGeneral: true });
  w.load();
  return w;
}

for (const [name, fn] of [['S1 zdobycie miasta z wodzem w kolejce', s1], ['S2 kolejka + utrata miasta', s2], ['S3 zakup w wielu miastach w jednej turze', s3], ['S4 zakup + zmiana epoki', s4], ['S5 zapis/wczytanie ze starym nadmiarem', s5]]) {
  const base = fn(false);
  const fixed = hasFix ? fn(true) : null;
  const baseBad = invariant(base);
  if (name.startsWith('S3') || name.startsWith('S4')) {
    check(`${name}: bramka zakupu trzyma niezmiennik juz na bazie (kontrola)`, baseBad.length === 0, baseBad);
  } else {
    check(`${name}: BAZA lamie niezmiennik (odtworzenie bledu)`, baseBad.length > 0, baseBad);
  }
  check(`${name}: po poprawce niezmiennik zachowany`, fixed !== null && invariant(fixed).length === 0, fixed && invariant(fixed));
  if (fixed) {
    if (name.startsWith('S1')) check('S1: nic nie ginie (jednostka z kolejki powstaje jako zwykla)', fixed.units.length === 3 && fixed.alive(0) === 2, fixed.units);
    if (name.startsWith('S2')) check('S2: nic nie ginie', fixed.units.length === 4 && fixed.alive(0) === 2, fixed.units.length);
    if (name.startsWith('S3')) check('S3: zakupiono tylko 2 z 4 (Braz)', fixed.bought === 2, fixed.bought);
    if (name.startsWith('S4')) check('S4: Kamien odmawia 2.; Braz pozwala', fixed.second === false && fixed.third === true && fixed.alive(0) === 2, { s: fixed.second, t: fixed.third });
    if (name.startsWith('S5')) {
      const ids = fixed.units.filter(u => u.isGeneral).map(u => u.id).sort();
      check('S5: zasada wyboru = najstarsi (kolejnosc tablicy) zostaja wodzami, reszta zwykla; 5 jednostek nadal istnieje',
        JSON.stringify(ids) === JSON.stringify(['g1', 'g2', 'h1']) && fixed.units.length === 6, ids);
    }
  }
}

// S6: kopiowanie flagi / powielanie -- plan democji jest idempotentny i nie rusza zgodnych rosterow
if (hasFix) {
  const ok = [{ id: 'a', ownerId: 0, isGeneral: true }, { id: 'b', ownerId: 1, isGeneral: true }];
  check('S6: zgodny roster bez zmian', gen.planGeneralLimitDemotions(ok, () => 1).length === 0);
  const over = [{ id: 'a', ownerId: 0, isGeneral: true }, { id: 'b', ownerId: 0, isGeneral: true }];
  const first = gen.planGeneralLimitDemotions(over, () => 1);
  over.filter(u => first.includes(u.id)).forEach(u => { u.isGeneral = false; });
  check('S6: democja idempotentna', first.length === 1 && gen.planGeneralLimitDemotions(over, () => 1).length === 0, first);
}

// ---- Czesc B: straznik zrodla main.ts ----
const src = fs.readFileSync(MAIN, 'utf8');
const spawnGuards = (src.match(/isGeneral:\s*(completed|rec)\.isGeneral === true && generalMaySpawnForOwner\(city\.ownerId\)/g) || []).length;
check('main.ts: OBA miejsca narodzin z kolejki bramkuja flage wodza (generalMaySpawnForOwner)', spawnGuards === 2, spawnGuards);
const rawLeaks = (src.match(/isGeneral:\s*(completed|rec)\.isGeneral === true,/g) || []).length;
check('main.ts: brak niebramkowanego kopiowania isGeneral z kolejki', rawLeaks === 0, rawLeaks);
check('main.ts: wczytanie zapisu wola planGeneralLimitDemotions z epoka wlasciciela',
  /planGeneralLimitDemotions\(units,\s*empireEpochForOwner\)/.test(src));
const gmsStart = src.indexOf('function generalMaySpawnForOwner(');
const gms = gmsStart >= 0 ? src.slice(gmsStart, gmsStart + 400) : '';
check('main.ts: generalMaySpawnForOwner liczy zywych wodzow i uzywa canSpawnQueuedGeneral(epoka wlasciciela)',
  /u\.isGeneral === true/.test(gms) && /canSpawnQueuedGeneral\(empireEpochForOwner\(ownerId\)/.test(gms));

console.log(failures === 0 ? 'ALL PASS' : `FAILURES: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
