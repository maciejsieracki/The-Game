'use strict';
/**
 * no-negative-stocks-projection-test.cjs — R-WEB-ECON-NO-NEGATIVE-STOCKS-A-Q1 (podtemat A).
 *
 * Sprawdza src/game/no-negative-stocks.ts (projekcja tylko-odczytowa PO ticku):
 *  (a) projekcja == realny stan po ticku w scenariuszach (skarbiec, spichlerz; także < 0),
 *  (b) projekcja nie mutuje stanu (states, econ, runtime HUD cache),
 *  (c) mutacja składnika dochodu/utrzymania zmienia prognozę (czerwieni oczekiwanie).
 *
 * Realny tick: advanceEmpireFood na PRAWDZIWYM stanie (mutuje), skarbiec wg arytmetyki bloku
 * „Bank treasury” (main.ts nie jest importowalny — to odwzorowanie, nie wywołanie main.ts).
 *
 * Run: node tools/no-negative-stocks-projection-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.no-negative-stocks-projection-entry.ts');
const BUNDLE = path.resolve(__dirname, '.no-negative-stocks-projection-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  projectTreasuryAfterTick,
  projectEmpireFoodAfterTick,
  projectNnsAfterTick,
  evaluateEndTurnStocks,
} from '../src/game/no-negative-stocks';
export {
  advanceEmpireFood,
  buildEmpireFoodParams,
  clearLastEmpireFoodTicks,
  getEmpireFoodMaxCap,
  getEmpireFoodReserve,
  getLastEmpireFoodTick,
} from '../src/game/empire-food';
export { militaryFoodConsumptionWithSpichlerz } from '../src/game/turn-economy';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const UPKEEP = {
  zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 1,
  zywnoscMnoznikTerytorium: 1, zywnoscMnoznikPozaTerytorium: 2,
};
const FOOD_TABLE = { Test: 0.5 };

function city(id, ownerId, o) {
  return {
    cityId: id, ownerId, oblegany: false,
    zywnoscBrutto: o.brutto, kosztRacji: o.koszt, bilansLokalny: o.brutto - o.koszt,
    zywnoscNetto: o.brutto - o.koszt, wzrostProcent: 0,
    pieniadz: o.pieniadz || 0, pieniadzZTras: o.pieniadz || 0, nauka: 0, doPuli: 0,
    praca: 0, kultura: 0, maSpichlerz: !!o.spichlerz, maSpichlerzII: !!o.spichlerzII,
  };
}

function city1(id, b, k, extra) {
  return city(id, 1, Object.assign({ brutto: b, koszt: k }, extra || {}));
}

function econOf(perCity, utrzymanie) {
  const upkeepByOwner = new Map();
  for (const oid of Object.keys(utrzymanie || {})) {
    const u = utrzymanie[oid];
    upkeepByOwner.set(Number(oid), { utrzymanieRazem: u, utrzymanieBudynki: u, utrzymanieJednostki: 0, saldo: 0, deficyt: false });
  }
  return { perCity, upkeepByOwner };
}

function units(n, ownerId) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ id: i + 1, ownerId, typeId: 'Test', onOwnTerritory: true, inGarnizon: false });
  return out;
}

function params(capBaza) {
  return M.buildEmpireFoodParams({ magazyn_centralny_baza_zywnosc: { easy: capBaza, normal: capBaza, hard: capBaza } }, 'normal');
}

function snapshotOf(states, econ) {
  return JSON.stringify({
    states: [...states.entries()],
    perCity: econ.perCity,
    up: [...econ.upkeepByOwner.entries()],
  });
}

/** Jeden scenariusz: projekcja vs realny tick. */
function runScenario(sc) {
  const ownerId = sc.ownerId === undefined ? 1 : sc.ownerId;
  const states = new Map([[ownerId, { zapasyPanstwa: sc.zapasy, turyUjemnychZapasow: 0 }]]);
  const us = sc.units ? units(sc.units, ownerId) : [];
  const econ = econOf(sc.cities, sc.utrzymanie);
  const p = params(sc.cap === undefined ? 1000 : sc.cap);
  const food = { ownerId, states, econ, units: us, upkeep: UPKEEP, params: p, foodTable: FOOD_TABLE };

  // (b) migawka przed projekcją
  const before = snapshotOf(states, econ);
  M.clearLastEmpireFoodTicks();
  const hudBefore = JSON.stringify({
    last: M.getLastEmpireFoodTick(ownerId) || null,
    res: M.getEmpireFoodReserve(ownerId),
    cap: M.getEmpireFoodMaxCap(ownerId),
  });

  const proj = M.projectNnsAfterTick(sc.turn === undefined ? 12 : sc.turn, sc.skarbiec, food);

  ok(snapshotOf(states, econ) === before, sc.name + ': states/econ nietkniete przez projekcje');
  ok(JSON.stringify({
    last: M.getLastEmpireFoodTick(ownerId) || null,
    res: M.getEmpireFoodReserve(ownerId),
    cap: M.getEmpireFoodMaxCap(ownerId),
  }) === hudBefore, sc.name + ': runtime HUD nietkniety przez projekcje');

  // Realny tick na osobnym stanie (mutuje)
  const realStates = new Map([[ownerId, { zapasyPanstwa: sc.zapasy, turyUjemnychZapasow: 0 }]]);
  const real = M.advanceEmpireFood(econ, us, realStates, UPKEEP, p, FOOD_TABLE);
  const rt = real.byOwner.get(ownerId);
  const realSpichlerz = realStates.get(ownerId).zapasyPanstwa;
  const u = (econ.upkeepByOwner.get(ownerId) || {}).utrzymanieRazem || 0;
  let income = 0;
  for (const c of sc.cities) if (c.ownerId === ownerId) income += c.pieniadz || 0;
  const realSkarbiec = sc.skarbiec + income - (u > 0 ? u : 0);

  return { proj, realSkarbiec, realSpichlerz, rt, cap: rt.maxCap, sc, us };
}

function checkScenario(sc, expect) {
  const r = runScenario(sc);
  const proj = r.proj;
  // (a) skarbiec: projekcja == realny stan (bez podlogi)
  ok(proj.skarbiecPo === r.realSkarbiec, sc.name + ': skarbiec proj ' + proj.skarbiecPo + ' == real ' + r.realSkarbiec);
  // (a) spichlerz: zapisany realny stan == min(cap, max(0, prognoza przed klamra))
  const storedFromProj = Math.min(r.cap, Math.max(0, proj.spichlerzPo));
  ok(storedFromProj === r.realSpichlerz, sc.name + ': spichlerz proj->' + storedFromProj + ' == real ' + r.realSpichlerz);
  ok(r.rt.glodWojska === (proj.spichlerzPo < 0), sc.name + ': glod wojska zgodny z prognoza < 0');
  // oczekiwania reczne
  ok(proj.skarbiecPo === expect.skarbiecPo, sc.name + ': skarbiecPo oczekiwane ' + expect.skarbiecPo + ', jest ' + proj.skarbiecPo);
  ok(proj.spichlerzPo === expect.spichlerzPo, sc.name + ': spichlerzPo oczekiwane ' + expect.spichlerzPo + ', jest ' + proj.spichlerzPo);
  return r;
}

// S1: nadwyzka zywnosci i dochod > utrzymanie.
checkScenario({
  name: 'S1 nadwyzka', zapasy: 100, skarbiec: 500,
  cities: [city1('a', 50, 20, { pieniadz: 80 })], utrzymanie: { 1: 30 },
}, { skarbiecPo: 550, spichlerzPo: 130 });

// S2: armia zjada spichlerz ponizej zera; skarbiec dodatni.
{
  const sc = { name: 'S2 armia<0', zapasy: 10, skarbiec: 200, units: 40, cities: [city1('a', 30, 10, { pieniadz: 20 })] };
  const r = runScenario(sc);
  const koszt = M.militaryFoodConsumptionWithSpichlerz(r.us, 1, UPKEEP, FOOD_TABLE);
  ok(koszt > 0, 'S2: koszt armii > 0 (' + koszt + ')');
  ok(r.proj.spichlerzPo < 0, 'S2: prognoza spichlerza < 0 (jest ' + r.proj.spichlerzPo + ')');
  ok(Math.abs(r.proj.spichlerzPo - (10 + 20 - koszt)) < 1e-9, 'S2: prognoza = zapas + bilans - wojsko');
  ok(r.rt.glodWojska === true && r.realSpichlerz === 0, 'S2: realny tick: glod wojska, zapas 0');
  ok(r.proj.skarbiecPo === 220, 'S2: skarbiec dodatni (jest ' + r.proj.skarbiecPo + ')');
}

// S3: skarbiec ponizej zera (utrzymanie > dochod), spichlerz OK.
checkScenario({
  name: 'S3 skarbiec<0', zapasy: 50, skarbiec: 20,
  cities: [city1('a', 10, 5, { pieniadz: 50 })], utrzymanie: { 1: 100 },
}, { skarbiecPo: -30, spichlerzPo: 55 });

// S4: oba stocki ponizej zera naraz.
{
  const sc = {
    name: 'S4 oba<0', zapasy: 5, skarbiec: 10, units: 30,
    cities: [city1('a', 10, 5, { pieniadz: 40 })], utrzymanie: { 1: 90 },
  };
  const r = runScenario(sc);
  ok(r.proj.skarbiecPo === -40, 'S4: skarbiec -40 (jest ' + r.proj.skarbiecPo + ')');
  ok(r.proj.spichlerzPo < 0, 'S4: spichlerz < 0 (jest ' + r.proj.spichlerzPo + ')');
  ok(r.realSkarbiec === -40, 'S4: realny skarbiec -40');
}

// S5: stary zapis z ujemnym spichlerzem, bez zmiany wejscia — prognoza < 0, zapas realny 0.
checkScenario({
  name: 'S5 stary zapis', zapasy: -5, skarbiec: 100,
  cities: [city1('a', 10, 10, { pieniadz: 10 })], utrzymanie: {},
}, { skarbiecPo: 110, spichlerzPo: -5 });

// S6: sufit magazynu centralnego (cap 50) — prognoza powyzej capu, realny = cap.
{
  const sc = { name: 'S6 cap', zapasy: 40, skarbiec: 0, cap: 50, cities: [city1('a', 40, 10, { pieniadz: 0 })], utrzymanie: {} };
  const r = runScenario(sc);
  ok(r.realSpichlerz === 50, 'S6: realny zapas = cap 50 (jest ' + r.realSpichlerz + ')');
  ok(Math.min(r.cap, Math.max(0, r.proj.spichlerzPo)) === 50, 'S6: projekcja po capie == 50');
}

// S7: parytet — ten sam kod dla gracza (owner 0) i AI (owner 1).
{
  const mk = (oid) => ({
    name: 'S7 owner' + oid, ownerId: oid, zapasy: 20, skarbiec: 60,
    cities: [city(oid === 0 ? 'c0' : 'c1', oid, { brutto: 25, koszt: 10, pieniadz: 15 })],
    utrzymanie: { [oid]: 40 },
  });
  const pa = runScenario(mk(0)).proj;
  const pb = runScenario(mk(1)).proj;
  ok(pa.skarbiecPo === 35 && pb.skarbiecPo === 35, 'S7: skarbiec parytet gracz/AI (35)');
  ok(pa.spichlerzPo === 35 && pb.spichlerzPo === 35, 'S7: spichlerz parytet gracz/AI (35)');
}

// S8: wolne tury — ocena nie blokuje w turze 3 mimo prognozy < 0.
{
  const v = M.evaluateEndTurnStocks({ turn: 3, skarbiecObecny: 10, skarbiecPo: -5, spichlerzObecny: 0, spichlerzPo: 0 });
  ok(v.blokada === false, 'S8: tura 3 bez blokady mimo prognozy < 0');
}

// (c) mutacja dochodu lub utrzymania zmienia prognoze.
{
  const base = M.projectTreasuryAfterTick(100, econOf([city1('a', 10, 5, { pieniadz: 50 })], { 1: 0 }), 1);
  const mutInc = M.projectTreasuryAfterTick(100, econOf([city1('a', 10, 5, { pieniadz: 40 })], { 1: 0 }), 1);
  ok(base === 150, 'mutacja: baza 150 (jest ' + base + ')');
  ok(mutInc === 140 && mutInc !== 150, 'mutacja dochodu -10 zmienia prognoze (jest ' + mutInc + ')');
  const mutUp = M.projectTreasuryAfterTick(100, econOf([city1('a', 10, 5, { pieniadz: 50 })], { 1: 7 }), 1);
  ok(mutUp === 143 && mutUp !== 150, 'mutacja utrzymania 7 zmienia prognoze (jest ' + mutUp + ')');
}

// (d) źródło dochodu jak w realnym ticku (zarzut 2 Evaluatora): fotel człowieka filtruje po liście
// miast (sumEconomyForPlayerCities), AI po perCity.ownerId (sumEconomyForOwner). Stary zapis: w
// perCity jest wpis właściciela 1 dla miasta „duch”, którego NIE ma na liście miast gracza 1.
{
  const econ = econOf([
    city1('a', 10, 5, { pieniadz: 50 }),
    city1('duch', 10, 5, { pieniadz: 30 }),
  ], { 1: 0 });
  const miasta = [{ id: 'a', ownerId: 1 }];
  const aiDochod = M.projectTreasuryAfterTick(100, econ, 1);
  const humanDochod = M.projectTreasuryAfterTick(100, econ, 1, miasta);
  ok(aiDochod === 180, 'parytet-zrodla: AI (sumEconomyForOwner) = 100+50+30 = 180 (jest ' + aiDochod + ')');
  ok(humanDochod === 150, 'parytet-zrodla: czlowiek (lista miast) = 100+50 = 150 (jest ' + humanDochod + ')');
}

console.log('no-negative-stocks-projection-test: ' + passed + ' passed, ' + failed + ' failed');
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed === 0 ? 0 : 1);
