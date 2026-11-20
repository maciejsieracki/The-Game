#!/usr/bin/env node
/**
 * food-granary-model.cjs — model żywności i Spichlerza Centralnego (Brąz) po FALACH 875–887
 * (R-WEB-ECONOMY-TREASURY-MODEL-REFRESH-Q1, runda 1). Zastępuje wcześniejszą wersję z wzorami
 * przepisanymi ręcznie (żywność jednostek ×3^(e-1), brak tempa, stare racje).
 *
 * Tylko odczyt, bez zmian w gra/src i gra/data. Liczby żywności jednostek i racji obywateli pochodzą
 * z PRAWDZIWYCH funkcji kodu (bundle esbuild w pamięci, jak w treasury-unit-cost-model.cjs):
 *   economy-upkeep.ts       unitFoodPerTurn, buildUnitFoodTable, DEFAULT_UPKEEP_PARAMS, magazynEraMultiplier
 *   population-growth-v85.ts computeCityRationCost
 *   citizen-consumption-era.ts citizenConsumptionEraMultiplier (m(e), flaga rebalansu)
 *   building-resource-gate.ts SPICHLERZ_EMPIRE_CAP_I / SPICHLERZ_EMPIRE_CAP_II_FULL
 *
 * Uruchomienie (wymaga gra/node_modules z esbuild):
 *   node gra/tools/food-granary-model.cjs
 *
 * Formuły (stan kodu, flaga rebalansu ON z danych):
 *   cap centralny = 1000 + magazynEraMultiplier(e) × (1000·nI + 1500·nII)   [magazynEraMultiplier = 2^(e-1)]
 *   zapas po turze = min(cap, zapas + produkcja − wyżywienie − armia); nadwyżka ponad cap PRZEPADA
 *   armia (żywność jednostek) = unitFoodPerTurn: baza epoki jednostki (×1/×4/×16) × R_STAWKI ×4 × terytorium × tempo
 *   wyżywienie = Σ pop × poziomRacji × 2 × m(e)   [m(e) = 2^(e-1) przy fladze ON]
 *
 * Dane zrzutu „SPICHLERZ CENTRALNY” (Brąz, starszy stan): zapas 29 086 / cap 54 000; produkcja 3363;
 * wyżywienie 1046; wojsko 312; przyrost 2005. Moment pomiaru i skład armii NIE_ZMIERZONO.
 * Dekompozycja 54 000 = 1000 + 2×(1000·a + 1500·b): np. (10 I, 11 II) — który zestaw NIE_ZMIERZONO.
 *
 * Wszystkie warianty to PROPOZYCJE do wyboru przez właściciela (ABC), nie przyjęte wartości.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const GAME_DIR = path.join(GRA_ROOT, 'src', 'game');
const UNITS_PATH = path.join(GRA_ROOT, 'data', 'units.json');

const SNAP = { zapas: 29086, produkcja: 3363, wyzywienie: 1046, wojsko: 312, epoka: 2, nI: 10, nII: 11 };
const ARMY_BY_ERA_10 = [['Włócznik', 5], ['Procarz', 5]]; // założony skład 10 jednostek Brąz (jak w treasury-unit-cost-model.cjs)

function loadRealGame() {
  const esbuild = require(path.join(GRA_ROOT, 'node_modules', 'esbuild'));
  const entry = [
    "export * from './economy-upkeep';",
    "export { computeCityRationCost } from './population-growth-v85';",
    "export { citizenConsumptionEraMultiplier } from './citizen-consumption-era';",
    "export { setEraRebalanceEnabledForTest } from './econ-era-rebalance';",
    "export { SPICHLERZ_EMPIRE_CAP_I, SPICHLERZ_EMPIRE_CAP_II_FULL } from './building-resource-gate';",
  ].join('\n');
  const result = esbuild.buildSync({
    stdin: { contents: entry, resolveDir: GAME_DIR, sourcefile: path.join(GAME_DIR, '.food-model-entry.ts'), loader: 'ts' },
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
G.setEraRebalanceEnabledForTest(null);
const units = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
const foodTable = G.buildUnitFoodTable(units);
const P = G.DEFAULT_UPKEEP_PARAMS;
const PACES = ['niski', 'normalny', 'wysoki'];

function armyFood(list, pace, own) {
  let s = 0;
  for (const [name, n] of list) {
    s += G.unitFoodPerTurn({ typeId: name, camping: false, onOwnTerritory: own }, P, foodTable, pace) * n;
  }
  return s;
}

function capFor({ nI, nII, e }) {
  return 1000 + G.magazynEraMultiplier(e) * (G.SPICHLERZ_EMPIRE_CAP_I * nI + G.SPICHLERZ_EMPIRE_CAP_II_FULL * nII);
}

/** Symulacja zapasu. Parametry: prodMult (ulepszenia), decay (psucie nad progiem), conv (konwersja nadwyżki na ¤). */
function simulate({ cap, army, cons, prodMult = 1, decayRate = 0, decayFrom = 1, convRate = 0, convFrom = 1, turns = 60 }) {
  let stock = SNAP.zapas;
  const prod = SNAP.produkcja * prodMult;
  let gold = 0;
  let fullTurn = null;
  let wasted = 0;
  for (let t = 1; t <= turns; t++) {
    let next = stock + prod - cons - army;
    const over = stock - decayFrom * cap;
    if (over > 0 && decayRate > 0) next -= decayRate * over;
    const convOver = stock - convFrom * cap;
    if (convOver > 0 && convRate > 0) {
      const conv = Math.min(convOver, Math.max(0, next - stock));
      next -= conv;
      gold += conv * convRate;
    }
    if (next >= cap) {
      if (fullTurn === null) fullTurn = t;
      wasted += next - cap;
      next = cap;
    }
    stock = Math.max(0, next);
  }
  return { stockEnd: Math.round(stock), fullTurn, wastedTotal: Math.round(wasted), goldTotal: Math.round(gold), netPerTurn: Math.round(prod - cons - army) };
}

function section1() {
  console.log('== 1. Żywność jednostek (unitFoodPerTurn, flaga ON, Brąz = epoka jednostki) — ta sama wartość co w silniku ==');
  console.log('| Jednostka | Epoka | own N/Nm/W | obóz N/Nm/W | poza N/Nm/W |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const name of ['Wojownik', 'Włócznik', 'Falanga', 'Zwiadowca']) {
    const u = units.find((x) => x['Jednostka'] === name);
    const row = [name, String(u['Epoka'])];
    for (const opts of [{ own: true, camping: false }, { own: true, camping: true }, { own: false, camping: false }]) {
      row.push(PACES.map((p) => String(G.unitFoodPerTurn({ typeId: name, camping: opts.camping, onOwnTerritory: opts.own }, P, foodTable, p))).join(' / '));
    }
    console.log('| ' + row.join(' | ') + ' |');
  }
  console.log('');
  console.log('== 2. Racje obywateli (computeCityRationCost, 1000 obywateli, poziom 2) ==');
  for (const era of [1, 2, 3]) {
    console.log(`epoka ${era}: m(e)=${G.citizenConsumptionEraMultiplier(era)}  wyżywienie/t=${G.computeCityRationCost(1000, 2, undefined, undefined, era)}`);
  }
}

function section3() {
  console.log('');
  console.log('== 3. Spichlerz centralny, Brąz (e=2) — punkt wyjścia z zrzutu, armia i racje z sekcji 1–2 ==');
  const cap = capFor({ nI: SNAP.nI, nII: SNAP.nII, e: SNAP.epoka });
  const armyNow = armyFood(ARMY_BY_ERA_10, 'normalny', true);
  // Wyżywienie zrzutu (1046) przyjęte bez przeliczania: skład populacji miast NIE_ZMIERZONO.
  const consNow = SNAP.wyzywienie;
  console.log(`cap (10 I + 11 II, e=2) = ${cap}  (zrzut: 54000; dekompozycja NIE_ZMIERZONO)`);
  console.log(`armia 10 × Brąz (Włócznik+Procarz) żywność/t, Normalny, own = ${armyNow}  (zrzut „wojsko” ${SNAP.wojsko}; moment zrzutu NIE_ZMIERZONO)`);
  console.log(`wyżywienie w zrzucie ${SNAP.wyzywienie} — zakładane bez zmiany (skala m(e) NIE_ZMIERZONO względem stanu zrzutu)`);
  console.log(`netto/t przy zrzucie ${SNAP.produkcja} − ${SNAP.wyzywienie} − ${SNAP.wojsko} = ${SNAP.produkcja - SNAP.wyzywienie - SNAP.wojsko}; przy armii real ${Math.round(SNAP.produkcja - SNAP.wyzywienie - armyNow)}`);
  console.log(`tury do capu (zrzut armii): ${Math.ceil((cap - SNAP.zapas) / (SNAP.produkcja - SNAP.wyzywienie - SNAP.wojsko))}`);
  console.log(`(stała konsumpcja racji użyta w symulacji: ${Math.round(consNow)})`);
  return { cap, armyNow, consNow };
}

function section4(ctx) {
  console.log('');
  console.log('== 4. Warianty do decyzji (PROPOZYCJE, 60 tur) ==');
  const { cap, armyNow, consNow } = ctx;
  const variants = [
    ['V0 obecnie (produkcja zrzutu, armia real)', {}],
    ['V1 ostrożny: produkcja ulepszeń −10%', { prodMult: 0.9 }],
    ['V2 średni: produkcja −20% + psucie 2%/t nad 50% capu', { prodMult: 0.8, decayRate: 0.02, decayFrom: 0.5 }],
    ['V3 mocny: produkcja −30% + konwersja 0,2 ¤/żyw. nad 70% capu', { prodMult: 0.7, convRate: 0.2, convFrom: 0.7 }],
  ];
  console.log('| wariant | zapas po 60 t | pierwsza tura przy capie | przepadek (suma) | ¤ z konwersji | netto/t przed psuciem |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const [label, v] of variants) {
    const r = simulate({ cap, army: armyNow, cons: consNow, ...v });
    console.log(`| ${label} | ${r.stockEnd} | ${r.fullTurn ?? '—'} | ${r.wastedTotal} | ${r.goldTotal} | ${r.netPerTurn} |`);
  }
  console.log('');
  console.log('Uwaga: psucie „2%/t nad 50% capu” NIE zatrzymuje wzrostu przy capie (stacjonarny zapas > cap); skutek tylko przy niższej produkcji.');
}

function main() {
  section1();
  const ctx = section3();
  section4(ctx);
}

main();
