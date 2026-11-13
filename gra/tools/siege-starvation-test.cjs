'use strict';
/**
 * siege-starvation-test.cjs -- R-WEB-SIEGE-STARVATION-SURRENDER-Q1.
 * Oblezenie: etap 1 (zapasy, garnizon zdrowy) -> etap 2 (glod: -6/8/10% maxHP/ture) -> kapitulacja gdy sumaHP/startMaxHP < 0,5
 * (albo pusty garnizon). Miasto bez garnizonu: sciezka historyczna (flaga + nastepny tick).
 *  A. jednostkowa (siege-starvation.ts)     B. replika bloku N3 z REALNYM modulem + REALNYM applyArmyStarvationHpLoss
 *  C. prognoza plakietki == symulacja        D. stare zapisy / bez garnizonu   E. strukturalna main.ts
 *  F. mutacje (prog 0,5->0,4; atrycja od 1. ticka; flaga bez HP)      G. tabela PRZED/PO (scenariusz: 5 jednostek, magazyn 40, ludnosc 6)
 * Run z gra/:  node tools/siege-starvation-test.cjs
 * RED (modul nieobecny): SIEGE_STARV_MODULE=/nie/istnieje node tools/siege-starvation-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d !== undefined ? ' -- ' + JSON.stringify(d) : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ssv-'));
function bundle(tag, modPath) {
  const out = path.join(tmp, tag + '-bundle.cjs');
  esbuild.buildSync({ entryPoints: [modPath], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA });
  return require(out);
}
const REAL = process.env.SIEGE_STARV_MODULE || path.join(GRA, 'src', 'game', 'siege-starvation.ts');
if (!fs.existsSync(REAL)) { console.log('  [FAIL] modul nie istnieje: ' + REAL); console.log('RESULT pass=0 fail=1'); process.exit(1); }
const S = bundle('real', REAL);
const FC = bundle('fc', path.join(GRA, 'src', 'game', 'siege-surrender-forecast.ts'));
const AS = bundle('as', path.join(GRA, 'src', 'game', 'army-starvation.ts'));
const getMaxHp = () => 100;
const FRACS = { Latwy: 0.06, Normalny: 0.08, Trudny: 0.10 };

/** Replika bloku N3 (main.ts) -- wola REALNE siegeStarvationState + applyArmyStarvationHpLoss. Zwraca przebieg. */
function runSiege(mod, c, hpFrac, opts = {}) {
  const city = { oblegane: true, ...c };
  const units = (opts.units ?? Array.from({ length: city.garnizon ?? 0 }, (_, i) => ({ id: 'u' + i, ownerId: 1, typeId: 'x', category: 'inf', hp: 100, hpMax: 100 })));
  const log = [];
  for (let t = 1; t <= 300; t++) {
    const cons = city.population + units.length;
    city.magazynZywnosci = Math.max(0, city.magazynZywnosci - cons);              // turn-economy.ts (oblegane)
    const params = { food: city.magazynZywnosci, getMaxHp };
    const st0 = mod.siegeStarvationState(city, units, params);
    let surrender = st0.surrender;
    if (st0.recordStart) city.siegeStarveStartMaxHp = st0.startMaxHp;
    else if (st0.applyAttrition && !st0.surrender) {
      const r = AS.applyArmyStarvationHpLoss(units, 1, hpFrac, getMaxHp);
      for (let i = units.length - 1; i >= 0; i--) if (r.destroyedIds.includes(units[i].id)) units.splice(i, 1);
      surrender = mod.siegeStarvationState(city, units, params).surrender;
    }
    if (st0.setLegacyPending) city.siegeCapitulationPending = true;
    const hpSum = units.reduce((s, x) => s + x.hp, 0);
    log.push({ t, food: city.magazynZywnosci, units: units.length, hpSum, pending: !!city.siegeCapitulationPending });
    if (surrender) return { surrenderTick: t, log, city, units };
  }
  return { surrenderTick: null, log, city, units };
}

console.log('A. jednostkowa');
const u = (hp, hpMax = 100) => ({ hp, hpMax });
const base = { oblegane: true };
let st = S.siegeStarvationState(base, [u(100), u(100)], { food: 5, getMaxHp });
ok(!st.hungerStarted && !st.applyAttrition && !st.surrender && st.hpFraction === null, 'zapasy > 0: brak glodu, brak atrycji (etap 1)');
st = S.siegeStarvationState({ oblegane: false }, [u(10)], { food: 0, getMaxHp });
ok(!st.hungerStarted && !st.surrender, 'miasto nieoblegane -> nic');
st = S.siegeStarvationState(base, [u(100), u(100)], { food: 0, getMaxHp });
ok(st.hungerStarted && st.recordStart && !st.applyAttrition && !st.surrender && st.startMaxHp === 200, 'tick zera zapasow: zapis startu (200), BEZ atrycji i BEZ poddania');
st = S.siegeStarvationState({ ...base, siegeStarveStartMaxHp: 200 }, [u(92), u(92)], { food: 0, getMaxHp });
ok(st.applyAttrition && !st.surrender && Math.abs(st.hpFraction - 0.92) < 1e-9, 'etap 2: atrycja, 92% -> trzyma sie');
st = S.siegeStarvationState({ ...base, siegeStarveStartMaxHp: 200 }, [u(50), u(50)], { food: 0, getMaxHp });
ok(!st.surrender && st.hpFraction === 0.5, 'remis dokladnie 50,0% = jeszcze sie trzyma');
st = S.siegeStarvationState({ ...base, siegeStarveStartMaxHp: 200 }, [u(50), u(49)], { food: 0, getMaxHp });
ok(st.surrender, '49,5% < 50% -> poddanie');
st = S.siegeStarvationState({ ...base, siegeStarveStartMaxHp: 200 }, [u(100)], { food: 0, getMaxHp });
ok(st.surrender === false && st.hpFraction === 0.5, 'polowa garnizonu zginela, reszta zdrowa = 50% -> trzyma sie');
st = S.siegeStarvationState({ ...base, siegeStarveStartMaxHp: 200 }, [], { food: 0, getMaxHp });
ok(st.surrender, 'garnizon pusty po starcie glodu -> poddanie');
st = S.siegeStarvationState(base, [], { food: 0, getMaxHp });
ok(st.setLegacyPending && !st.surrender && st.hungerStarted, 'bez garnizonu i bez startu: sciezka historyczna (flaga, bez poddania w tym ticku)');
st = S.siegeStarvationState({ ...base, siegeCapitulationPending: true }, [], { food: 0, getMaxHp });
ok(st.surrender, 'flaga pending (stary zapis / bez garnizonu) -> poddanie w nastepnym ticku');
st = S.siegeStarvationState({ ...base, siegeCapitulationPending: true }, [u(100)], { food: 0, getMaxHp });
ok(st.surrender, 'stary zapis z pending i garnizonem -> poddanie (kompatybilnie)');
st = S.siegeStarvationState(base, [{ typeId: 'x' }, { typeId: 'x' }], { food: 0, getMaxHp: () => 80 });
ok(st.startMaxHp === 160 && st.hpFraction === 1, 'brak hp/hpMax -> maxHP z getMaxHp, HP pelne');

console.log('B. przebieg oblezenia (replika N3, 5 jednostek, magazyn 40, ludnosc 6)');
const sc = { population: 6, garnizon: 5, magazynZywnosci: 40 };
const expectedHunger = { Latwy: 9, Normalny: 7, Trudny: 6 };
for (const [name, frac] of Object.entries(FRACS)) {
  const r = runSiege(S, sc, frac);
  const zeroTick = r.log.find(x => x.food === 0).t;
  const healthyUntilZero = r.log.filter(x => x.t <= zeroTick).every(x => x.hpSum === 500 && x.units === 5);
  ok(zeroTick === 4, name + ': magazyn = 0 w ticku 4 (40 / 11 -> ceil 4)', zeroTick);
  ok(healthyUntilZero, name + ': garnizon zdrowy (500/500 HP) przez caly etap 1 i w ticku zera');
  ok(r.surrenderTick === zeroTick + expectedHunger[name], name + ': poddanie w ticku ' + (zeroTick + expectedHunger[name]) + ' (zero zapasow + ' + expectedHunger[name] + ')', r.surrenderTick);
  ok(r.log[zeroTick].hpSum === 500 - 5 * Math.floor(100 * frac), name + ': pierwszy tick atrycji zdejmuje ' + Math.floor(100 * frac) + ' HP/jednostke');
}

console.log('C. prognoza plakietki == symulacja');
let n = 0; const bad = [];
for (const [name, frac] of Object.entries(FRACS)) {
  for (const food of [0, 1, 11, 40, 100]) for (const pop of [1, 6, 12]) for (const units of [1, 2, 5, 9]) for (const hpMax of [40, 100, 250]) {
    const arr = () => Array.from({ length: units }, (_, i) => ({ id: 'u' + i, ownerId: 1, typeId: 'x', category: 'inf', hp: hpMax, hpMax }));
    const city = { population: pop, garnizon: units, magazynZywnosci: food };
    const fc = FC.turnsUntilSiegeSurrender({ oblegane: true, ...city }, { hpFrac: frac, garrison: arr().map(x => ({ hp: x.hp, hpMax: x.hpMax })) });
    const sim = runSiege(S, city, frac, { units: arr() }).surrenderTick;
    n++;
    if (sim !== fc) bad.push({ name, food, pop, units, hpMax, sim, fc });
  }
}
ok(bad.length === 0, 'dokladna prognoza == symulacja dla ' + n + ' scenariuszy (3 trudnosci x zapasy x ludnosc x garnizon x maxHP)', bad.slice(0, 3));
for (const [name, frac] of Object.entries(FRACS)) {
  const fcFrac = FC.turnsUntilSiegeSurrender({ oblegane: true, ...sc }, { hpFrac: frac });
  const sim = runSiege(S, sc, frac).surrenderTick;
  ok(fcFrac === sim, name + ': model ulamkowy (bez listy jednostek) == symulacja (' + sim + ')', { fcFrac, sim });
}
ok(FC.hungerTicksFractional(0.06) === 9 && FC.hungerTicksFractional(0.08) === 7 && FC.hungerTicksFractional(0.10) === 6, 'n = floor(0,5/frac)+1: 9 / 7 / 6 (10% -> 5 tur = 50% NIE wystarcza)');
{
  // licznik plakietki w KAZDEJ turze == pozostale ticki do poddania
  const frac = 0.08; const r = runSiege(S, sc, frac); const total = r.surrenderTick; let mono = true;
  for (let t = 0; t < total; t++) {
    const prev = t === 0 ? { units: 5, food: 40, hpSum: 500 } : r.log[t - 1];
    const city = { oblegane: true, population: 6, garnizon: prev.units, magazynZywnosci: prev.food };
    if (t >= 4) city.siegeStarveStartMaxHp = 500;
    const per = prev.units ? prev.hpSum / prev.units : 0;
    const garrison = Array.from({ length: prev.units }, () => ({ hp: per, hpMax: 100 }));
    if (FC.turnsUntilSiegeSurrender(city, { hpFrac: frac, garrison }) !== total - t) mono = false;
  }
  ok(mono, 'licznik plakietki w kazdej turze == pozostale ticki do poddania (' + total + ' -> 1)');
}

console.log('D. bez garnizonu / stare zapisy');
{
  const r = runSiege(S, { population: 6, garnizon: 0, magazynZywnosci: 40 }, 0.08);
  const zero = r.log.find(x => x.food === 0).t;
  ok(r.surrenderTick === zero + 1 && r.log[zero - 1].pending, 'bez garnizonu: flaga w ticku zera zapasow (' + zero + '), poddanie 1 tick pozniej');
  ok(FC.turnsUntilSiegeSurrender({ oblegane: true, population: 6, garnizon: 0, magazynZywnosci: 40 }) === zero + 1, 'bez garnizonu: prognoza = ceil(M/Z)+1');
  const r2 = runSiege(S, { population: 6, garnizon: 5, magazynZywnosci: 0 }, 0.08);
  ok(r2.surrenderTick === 1 + 7, 'stary zapis (zapasy 0, brak pola startu): pierwszy tick zapisuje start, potem 7 ticków atrycji', r2.surrenderTick);
  const dam = Array.from({ length: 5 }, (_, i) => ({ id: 'u' + i, ownerId: 1, typeId: 'x', category: 'inf', hp: 60, hpMax: 100 }));
  const r3 = runSiege(S, { population: 6, garnizon: 5, magazynZywnosci: 0 }, 0.08, { units: dam });
  ok(r3.surrenderTick === 1 + 2, 'stary zapis z uszkodzonym garnizonem (60%): HP liczone jak sa -> 60->52->44% = 1 + 2 ticki', r3.surrenderTick);
  const pend = runSiege(S, { population: 6, garnizon: 5, magazynZywnosci: 40, siegeCapitulationPending: true }, 0.08);
  ok(pend.surrenderTick === 1, 'stary zapis z pending=true: poddanie w nastepnym ticku');
}

console.log('E. strukturalna (main.ts / turn-economy.ts / cities.ts)');
const main = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
const eco = fs.readFileSync(path.join(GRA, 'src/game/turn-economy.ts'), 'utf8');
const cities = fs.readFileSync(path.join(GRA, 'src/game/cities.ts'), 'utf8');
const n3 = main.slice(main.indexOf('N3: TURA OBLEZENIA'), main.indexOf('N3: TURA OBLEZENIA') + 6500);
ok(/import \{ siegeStarvationState, siegeDefenderUnits \} from '\.\/game\/siege-starvation'/.test(main), 'main.ts importuje siegeStarvationState');
ok(/st0\.recordStart[\s\S]*siegeStarveStartMaxHp = st0\.startMaxHp/.test(n3), 'N3: tick zera zapasow zapisuje start glodu');
ok(/else if \(st0\.applyAttrition && !st0\.surrender\)[\s\S]*applyArmyStarvationHpLoss/.test(n3), 'N3: atrycja WYLACZNIE w etapie glodu (applyAttrition), nie od pierwszej tury');
ok(!/realGarnizonUnits\.length > 0\) \{\s*const garnizonBefore/.test(n3), 'N3: brak bezwarunkowej atrycji od pierwszej tury oblezenia');
ok(/surrenderNow = siegeStarvationState\(/.test(n3) && /else if \(surrenderNow\) \{\s*resolveSiegeSurrender/.test(n3), 'N3: kapitulacja wg ulamka HP po atrycji');
ok(/if \(st0\.setLegacyPending\) \{\s*handleSiegeCapitulationPhase/.test(n3), 'N3: bez garnizonu -> dotychczasowa sciezka flagi');
ok(/magazynPoTurze = Math\.max\(0, magazynPrzed - zuzycie\);/.test(eco), 'turn-economy.ts: etap 1 bez zmian (magazyn -= ludnosc + garnizon)');
ok(/siegeStarveStartMaxHp\?: number/.test(cities), 'cities.ts: pole siegeStarveStartMaxHp (zapis)');
ok((main.match(/delete (city|c)\.siegeStarveStartMaxHp/g) || []).length === 3, 'main.ts: pole kasowane przy starcie/zdjeciu oblezenia (3 miejsca)');
// R-WEB-CITYSTATE-ARMY-FOOD-DIFFICULTY-Q1 r2 zmienil _menuDifficulty na trudnosc WLASCICIELA miasta (miasto-panstwo -> cityStateDifficulty).
ok(/hpFrac: buildEmpireFoodParams\(data\.econParams, effectiveGameDifficultyForOwner\(city\.ownerId\)\)\.glodWojskaHpFrac/.test(main), 'plakietka: prognoza z hpFrac trudnosci wlasciciela miasta');

console.log('F. mutacje');
const src = fs.readFileSync(REAL, 'utf8');
const muts = [
  ['prog 0,5 -> 0,4', s => s.replace('SIEGE_SURRENDER_BELOW_FRAC = 0.5', 'SIEGE_SURRENDER_BELOW_FRAC = 0.4')],
  ['atrycja od pierwszej tury (food>0)', s => s.replace('if (food > 0) return none;', 'if (food > 0) return { ...none, applyAttrition: true, startMaxHp: garrisonHpTotals(garnizonUnits, params.getMaxHp).maxHp };')],
  ['flaga bez HP (poddanie w ticku zera)', s => s.replace('...none, hungerStarted: true, recordStart: true,', '...none, hungerStarted: true, recordStart: true, surrender: true,')],
  ['<= zamiast < (remis poddaje)', s => s.replace('tot.hp / startMax < frac', 'tot.hp / startMax <= frac')],
  ['pusty garnizon nie poddaje', s => s.replace('tot.count === 0 || tot.hp / startMax < frac', 'tot.hp / startMax < frac && tot.count > 0')],
  ['pending ignorowane', s => s.replace('if (city.siegeCapitulationPending === true) {', 'if (false) {')],
];
for (const [name, fn] of muts) {
  const mp = path.join(tmp, 'mut.ts'); const m = fn(src);
  if (m === src) { ok(false, 'mutacja "' + name + '" nie zmienila zrodla'); continue; }
  fs.writeFileSync(mp, m);
  let killed = false;
  try {
    const M = bundle('mut' + Math.random().toString(36).slice(2), mp);
    const r8 = runSiege(M, sc, 0.08);
    const t10 = runSiege(M, sc, 0.10);
    const tie = M.siegeStarvationState({ oblegane: true, siegeStarveStartMaxHp: 200 }, [u(50), u(50)], { food: 0, getMaxHp }).surrender;
    const empty = M.siegeStarvationState({ oblegane: true, siegeStarveStartMaxHp: 200 }, [], { food: 0, getMaxHp }).surrender;
    const pend = M.siegeStarvationState({ oblegane: true, siegeCapitulationPending: true }, [], { food: 0, getMaxHp }).surrender;
    const healthyStage1 = runSiege(M, sc, 0.08).log.slice(0, 4).every(x => x.hpSum === 500);
    killed = r8.surrenderTick !== 11 || t10.surrenderTick !== 10 || tie !== false || empty !== true || pend !== true || !healthyStage1;
  } catch { killed = true; }
  ok(killed, 'mutacja "' + name + '" wywraca testy');
}

console.log('G. PRZED / PO (5 jednostek, magazyn 40, ludnosc 6) -- numery ticków (konców tur)');
function oldRun(frac) {
  // PRZED: atrycja od 1. ticka oblezenia, flaga przy zerze zapasow, poddanie w nastepnym ticku.
  const units = Array.from({ length: 5 }, (_, i) => ({ id: 'u' + i, ownerId: 1, typeId: 'x', category: 'inf', hp: 100, hpMax: 100 }));
  let food = 40, pending = false; const hp = [];
  for (let t = 1; t <= 100; t++) {
    food = Math.max(0, food - (6 + units.length));
    const r = AS.applyArmyStarvationHpLoss(units, 1, frac, getMaxHp);
    for (let i = units.length - 1; i >= 0; i--) if (r.destroyedIds.includes(units[i].id)) units.splice(i, 1);
    hp.push(units.reduce((s, x) => s + x.hp, 0));
    if (food <= 0) { if (pending) return { surrender: t, hp }; pending = true; }
  }
  return { surrender: null, hp };
}
for (const [name, frac] of Object.entries(FRACS)) {
  const o = oldRun(frac); const nw = runSiege(S, sc, frac);
  const zero = nw.log.find(x => x.food === 0).t;
  console.log('  ' + name + ' (' + Math.round(frac * 100) + '%): PRZED poddanie w ticku ' + o.surrender + ', HP po tickach 1-5 = ' + o.hp.slice(0, 5).join('/') +
    ' | PO zero zapasow w ticku ' + zero + ', poddanie w ticku ' + nw.surrenderTick + ', HP po tickach 1-' + nw.surrenderTick + ' = ' + nw.log.map(x => x.hpSum).join('/'));
  ok(o.surrender === 5 && nw.surrenderTick === zero + expectedHunger[name], name + ': PRZED 5 ticków -> PO ' + nw.surrenderTick);
}

console.log('RESULT pass=' + pass + ' fail=' + fail);
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
process.exit(fail ? 1 : 0);
