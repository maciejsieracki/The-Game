#!/usr/bin/env node
/**
 * treasury-unit-cost-model.cjs — model skarbca i kosztów jednostek (Pieniądz, surowce, żywność)
 * po FALACH 875–887 (R-WEB-ECONOMY-TREASURY-MODEL-REFRESH-Q1, runda 1).
 *
 * Tylko odczyt: nie zmienia gra/src ani gra/data. Liczby NIE są ze wzorów przepisanych ręcznie —
 * model ładuje PRAWDZIWE funkcje kodu przez esbuild (bundle w pamięci, bez zapisu na dysk):
 *   economy-upkeep.ts     unitUpkeep, buildUnitUpkeepTable, unitResourceUpkeep, unitFoodPerTurn,
 *                         buildUnitFoodTable, DEFAULT_UPKEEP_PARAMS, magazynEraMultiplier
 *   production.ts         unitMoneyCost, unitRecruitBaseMoneyCost (rekrutacja, pace, epoka, dod. mnożnik)
 *   unit-cost-tempo.ts    KOSZT_JEDNOSTEK_PACE (Niski ×1 / Normalny ×2 / Wysoki ×4)
 *   econ-era-rebalance.ts setEraRebalanceEnabledForTest (flaga rebalansu: domyślnie ON w danych)
 *   population-growth-v85.ts computeCityRationCost (racje obywateli, przy m(e) z citizen-consumption-era.ts)
 *
 * Uruchomienie (wymaga gra/node_modules z esbuild):
 *   node gra/tools/treasury-unit-cost-model.cjs
 *
 * Zakładana konfiguracja: flaga rebalansu ON (wartość z gra/data/econ-era-rebalance-params.json),
 * domyślne parametry utrzymania (DEFAULT_UPKEEP_PARAMS), tempo podane w kolumnach.
 *
 * Dane zrzutu „Skarbiec imperium” (Brąz, 20 miast, skarbiec 7096) — z zadania właściciela:
 *   wpływy 1550, utrzymanie budynków 786, utrzymanie jednostek 376, netto skarbca 345 (wartość z panelu).
 *   UWAGA: 1550 − 786 − 376 = 388, nie 345; różnica 43 NIE_ZMIERZONO (Administrator, zaokrąglenia lub inna pozycja).
 *   Skład armii w zrzucie NIE_ZMIERZONO (brak listy jednostek) — 376 nie da się przeliczyć na nowe wzory
 *   bez składu; poniżej podane są przedziały (sekcja 4).
 *
 * Uwaga metodologiczna: model NIE ma sprzężenia zwrotnego (AI/gracz nie zmniejsza armii przy droższych jednostkach).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const GAME_DIR = path.join(GRA_ROOT, 'src', 'game');
const UNITS_PATH = path.join(GRA_ROOT, 'data', 'units.json');

const PACES = ['niski', 'normalny', 'wysoki'];
const SNAP = { income: 1550, buildingUpkeep: 786, unitUpkeep: 376, netPanel: 345, treasury: 7096 };

/** Przykładowa armia 10 jednostek na epokę (założenie modelu; składy NIE_ZMIERZONO w grze). */
const ARMY_BY_ERA = {
  'Kamień': [['Wojownik', 5], ['Łucznik', 5]],
  'Brąz': [['Włócznik', 5], ['Procarz', 5]],
  'Żelazo': [['Falanga', 5], ['Hastati', 5]],
};
const SAMPLE_UNITS = ['Wojownik', 'Łucznik', 'Rydwan (woły)', 'Zwiadowca', 'Włócznik', 'Procarz', 'Rydwan konny', 'Falanga', 'Hastati', 'Konnica'];

/** Ładuje prawdziwe moduły gry (esbuild, bundle w pamięci). */
function loadRealGame() {
  const esbuild = require(path.join(GRA_ROOT, 'node_modules', 'esbuild'));
  const entry = [
    "export * from './economy-upkeep';",
    "export { unitMoneyCost, unitRecruitBaseMoneyCost } from './production';",
    "export { KOSZT_JEDNOSTEK_PACE, applyUnitCostPace } from './unit-cost-tempo';",
    "export { setEraRebalanceEnabledForTest, isEraRebalanceEnabled, ERA_REBALANCE_PARAMS } from './econ-era-rebalance';",
    "export { computeCityRationCost, rationFoodCostPerPop } from './population-growth-v85';",
    "export { citizenConsumptionEraMultiplier } from './citizen-consumption-era';",
  ].join('\n');
  const result = esbuild.buildSync({
    stdin: { contents: entry, resolveDir: GAME_DIR, sourcefile: path.join(GAME_DIR, '.treasury-model-entry.ts'), loader: 'ts' },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    loader: { '.json': 'json' },
    logLevel: 'error',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(mod, mod.exports, require);
  return mod.exports;
}

const G = loadRealGame();
G.setEraRebalanceEnabledForTest(null); // null = wartość z gra/data/econ-era-rebalance-params.json
const units = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
const byName = new Map(units.map((u) => [u['Jednostka'], u]));
const upkeepTable = G.buildUnitUpkeepTable(units);
const foodTable = G.buildUnitFoodTable(units);
const P = G.DEFAULT_UPKEEP_PARAMS;

function recruit(name, pace) {
  const u = byName.get(name);
  return G.unitMoneyCost(G.unitRecruitBaseMoneyCost(u), undefined, pace, 0, 'normal', name);
}
function upkeepMoney(name, pace) {
  const u = byName.get(name);
  // Kategoria jak w unitPieniadzUpkeepCardValue (economy-upkeep.ts): Kategoria ?? 'domyslny'.
  const kategoria = typeof u['Kategoria'] === 'string' && u['Kategoria'].length > 0 ? u['Kategoria'] : 'domyslny';
  return G.unitUpkeep({ typeId: name, category: kategoria }, upkeepTable, P.jednostkaUtrzymanieStd, pace);
}
function upkeepResource(name, pace) {
  return G.unitResourceUpkeep(byName.get(name), pace);
}
function food(name, pace, opts) {
  return G.unitFoodPerTurn({ typeId: name, camping: !!opts.camping, onOwnTerritory: opts.own !== false }, P, foodTable, pace);
}
function fmt(n) {
  return Number.isInteger(n) ? String(n) : (Math.round(n * 100) / 100).toFixed(2);
}
function mdRow(cells) {
  return '| ' + cells.join(' | ') + ' |';
}

function section1Units() {
  console.log('== 1. Pojedyncze jednostki (wywołania prawdziwych funkcji; flaga rebalansu ON) ==');
  console.log(mdRow(['Jednostka', 'Epoka', 'Rekrut. N', 'Rekrut. Nm', 'Rekrut. W', 'Utrz. Pien. N', 'Utrz. Pien. Nm', 'Utrz. Pien. W', 'Surowiec N / Nm / W', 'Żyw. own N / Nm / W', 'Żyw. obóz N / Nm / W', 'Żyw. poza N / Nm / W']));
  console.log(mdRow(Array(12).fill('---')));
  for (const name of SAMPLE_UNITS) {
    const u = byName.get(name);
    if (!u) { console.log(mdRow([name, 'BRAK W units.json'])); continue; }
    const res = PACES.map((p) => upkeepResource(name, p));
    const resStr = res.map((r) => {
      const vals = Object.entries(r);
      return vals.length ? vals.map(([k, v]) => `${k} ${fmt(v)}`).join(',') : '—';
    }).join(' / ');
    const foodStr = (opts) => PACES.map((p) => fmt(food(name, p, opts))).join(' / ');
    console.log(mdRow([
      name, String(u['Epoka']),
      ...PACES.map((p) => fmt(recruit(name, p))),
      ...PACES.map((p) => fmt(upkeepMoney(name, p))),
      resStr,
      foodStr({ own: true, camping: false }),
      foodStr({ own: true, camping: true }),
      foodStr({ own: false, camping: false }),
    ]));
  }
}

function armyForEra(era, pace) {
  const list = ARMY_BY_ERA[era];
  let rec = 0, up = 0, foodOwn = 0, foodCamp = 0, foodOut = 0;
  const res = {};
  for (const [name, n] of list) {
    rec += recruit(name, pace) * n;
    up += upkeepMoney(name, pace) * n;
    foodOwn += food(name, pace, { own: true, camping: false }) * n;
    foodCamp += food(name, pace, { own: true, camping: true }) * n;
    foodOut += food(name, pace, { own: false, camping: false }) * n;
    for (const [k, v] of Object.entries(upkeepResource(name, pace))) res[k] = (res[k] ?? 0) + v * n;
  }
  return { rec, up, res, foodOwn, foodCamp, foodOut };
}

function section2Army() {
  console.log('');
  console.log('== 2. Armia 10 jednostek na epokę (założony skład, patrz ARMY_BY_ERA) ==');
  console.log(mdRow(['Epoka', 'Skład', 'Pace', 'Rekrutacja (Pien.)', 'Utrz. Pien./t', 'Surowiec/t', 'Żyw. own/t', 'Żyw. obóz/t', 'Żyw. poza/t']));
  console.log(mdRow(Array(9).fill('---')));
  for (const era of Object.keys(ARMY_BY_ERA)) {
    const skład = ARMY_BY_ERA[era].map(([n, k]) => `${k}× ${n}`).join(' + ');
    for (const p of PACES) {
      const a = armyForEra(era, p);
      const resStr = Object.keys(a.res).length ? Object.entries(a.res).map(([k, v]) => `${k} ${fmt(v)}`).join(', ') : '—';
      console.log(mdRow([era, skład, p, fmt(a.rec), fmt(a.up), resStr, fmt(a.foodOwn), fmt(a.foodCamp), fmt(a.foodOut)]));
    }
  }
}

function section3Treasury() {
  console.log('');
  console.log('== 3. Bilans skarbca Brąz, 20 miast, Normalny ×2 (przykład; składy NIE_ZMIERZONO) ==');
  const army = armyForEra('Brąz', 'normalny');
  const net = SNAP.income - SNAP.buildingUpkeep - army.up;
  console.log(`wpływy brutto ${SNAP.income} − budynki ${SNAP.buildingUpkeep} − utrz. jednostek (10 × Brąz, Normalny) ${fmt(army.up)} = netto ${fmt(net)} ¤/turę`);
  console.log(`(sama pula budynków i wpływów z zrzutu; armia z sekcji 2 — założenie modelu)`);
  console.log('');
  console.log('Wrażliwość: zrzut podaje utrzymanie jednostek 376 bez składu. Stare wzory (przed FALĄ 884–887): round(stawka×4), bez skali epoki i bez tempa.');
  console.log('Nowe wzory mnożą to samo przez: skalę epoki (Kamień ×1 / Brąz ×2 / Żelazo ×4) oraz tempo (Niski ×1 / Normalny ×2 / Wysoki ×4).');
  console.log('Współczynnik k = skala epoki × tempo; dla puli 376 w całości z jednej epoki:');
  console.log(mdRow(['Pula (przykład)', 'k', 'Utrz. jednostek', 'Netto skarbca (1550 − 786 − X)']));
  console.log(mdRow(['---', '---', '---', '---']));
  for (const [label, k] of [['cała pula Kamień, Normalny', 2], ['cała pula Brąz, Normalny', 4], ['cała pula Żelazo, Normalny', 8]]) {
    const x = SNAP.unitUpkeep * k;
    console.log(mdRow([label, String(k), fmt(x), fmt(SNAP.income - SNAP.buildingUpkeep - x)]));
  }
  console.log('NIE_ZMIERZONO: skład armii w zrzucie; wartości 2/4/8 to skrajne przedziały, nie prognoza.');
}

function section4Ration() {
  console.log('');
  console.log('== 4. Racje obywateli (computeCityRationCost, 1000 obywateli, poziom racji 2) ==');
  console.log(mdRow(['Epoka właściciela', 'm(e) (citizenConsumptionEraMultiplier)', 'Wyżywienie/t (1000 pop.)']));
  console.log(mdRow(['---', '---', '---']));
  for (const era of [1, 2, 3]) {
    const eraName = ['Kamień', 'Brąz', 'Żelazo'][era - 1];
    const m = G.citizenConsumptionEraMultiplier(era);
    const cost = G.computeCityRationCost(1000, 2, undefined, undefined, era);
    console.log(mdRow([eraName, fmt(m), fmt(cost)]));
  }
}

function main() {
  section1Units();
  section2Army();
  section3Treasury();
  section4Ration();
}

main();
