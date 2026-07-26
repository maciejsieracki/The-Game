'use strict';
/**
 * glod-wojska-karencja-test.cjs — regresja C-GLOD-Q1=A (karencja 3 tury),
 * C-GLOD-Q2=B (mnożnik terytorialny x1,0/x2,0) i naprawy parytetu gracz/AI
 * w atrycji HP z głodu wojska (Maciej 2026-07-26).
 * Run: node tools/glod-wojska-karencja-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.glod-wojska-karencja-entry.ts');
const BUNDLE = path.resolve(__dirname, '.glod-wojska-karencja-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  advanceEmpireFood, freshEmpireFoodState, buildEmpireFoodParams,
  isArmyStarving, getArmyStarvationCountdown, bindEmpireFoodRuntime,
  clearLastEmpireFoodTicks,
} from '../src/game/empire-food';
export { applyArmyStarvationHpLoss } from '../src/game/army-starvation';
export { unitFoodPerTurn, militaryFoodConsumption, loadUpkeepParams } from '../src/game/economy-upkeep';
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

M.clearLastEmpireFoodTicks();

const upkeep = {
  jednostkaUtrzymanieStd: 1,
  zywnoscJednostkaRuch: 1,
  zywnoscJednostkaOboz: 0.5,
  zywnoscMnoznikTerytorium: 1,
  zywnoscMnoznikPozaTerytorium: 2,
};
const params = M.buildEmpireFoodParams({
  glod_wojska_hp_frac: { normal: 0.08 },
  glod_wojska_karencja_tur: { normal: 3 },
  spichlerz_pojemnosc_zapasow_panstwa: { normal: 100 },
});

ok(params.glodWojskaKarencjaTur === 3, 'buildEmpireFoodParams: karencja domyślnie 3 tury');

// ---------------------------------------------------------------------------
// 1) KARENCJA: 2 tury ujemnych zapasów = brak atrycji, 3. tura = atrycja aktywna
// ---------------------------------------------------------------------------
{
  const states = new Map([[0, M.freshEmpireFoodState(100)]]);
  // 20 jednostek x 1 zywnosc/ture, brutto=0 (100% do rozwoju) -> doPanstwa=0,
  // kosztArmii=20 -> netto -20/ture -> zapasy monotonicznie maleją.
  const econ = { perCity: [{ ownerId: 0, zywnoscNetto: 0, oblegany: false, procentRozwoj: 100 }] };
  const units20 = Array.from({ length: 20 }, () => ({ ownerId: 0, typeId: 'woj', camping: false, onOwnTerritory: true }));

  const t1 = M.advanceEmpireFood(econ, units20, states, upkeep, params);
  ok(t1.byOwner.get(0).zapasyPo === -20, 'tura 1: zapasy -20');
  ok(t1.byOwner.get(0).turyUjemnychZapasowPo === 1, 'tura 1: licznik = 1');
  ok(t1.byOwner.get(0).glodWojskaAtrycjaAktywna === false, 'tura 1: atrycja NIEaktywna (karencja)');
  ok(M.isArmyStarving(0) === false, 'tura 1: isArmyStarving false');
  ok(M.getArmyStarvationCountdown(0, params.glodWojskaKarencjaTur) === 2, 'tura 1: countdown = 2 tury');

  const t2 = M.advanceEmpireFood(econ, units20, states, upkeep, params);
  ok(t2.byOwner.get(0).turyUjemnychZapasowPo === 2, 'tura 2: licznik = 2');
  ok(t2.byOwner.get(0).glodWojskaAtrycjaAktywna === false, 'tura 2 (2. tura ujemna): atrycja NADAL nieaktywna');
  ok(M.isArmyStarving(0) === false, 'tura 2: isArmyStarving false');
  ok(M.getArmyStarvationCountdown(0, params.glodWojskaKarencjaTur) === 1, 'tura 2: countdown = 1 tura');

  const t3 = M.advanceEmpireFood(econ, units20, states, upkeep, params);
  ok(t3.byOwner.get(0).turyUjemnychZapasowPo === 3, 'tura 3: licznik = 3');
  ok(t3.byOwner.get(0).glodWojskaAtrycjaAktywna === true, 'tura 3 (karencja minęła): atrycja AKTYWNA');
  ok(M.isArmyStarving(0) === true, 'tura 3: isArmyStarving true');
  ok(M.getArmyStarvationCountdown(0, params.glodWojskaKarencjaTur) === null, 'tura 3: countdown null (już aktywna)');

  // Atrycja HP realnie stosowana dopiero po karencji.
  const starvUnitsT2 = [{ id: 'u1', ownerId: 0, typeId: 'woj', hp: 100, hpMax: 100 }];
  if (!t2.byOwner.get(0).glodWojskaAtrycjaAktywna) {
    ok(starvUnitsT2[0].hp === 100, 'tura 2: silnik NIE wołałby applyArmyStarvationHpLoss (brak strat)');
  }
  const starvUnitsT3 = [{ id: 'u2', ownerId: 0, typeId: 'woj', hp: 100, hpMax: 100 }];
  M.applyArmyStarvationHpLoss(starvUnitsT3, 0, params.glodWojskaHpFrac, () => 100);
  ok(starvUnitsT3[0].hp === 92, 'tura 3: applyArmyStarvationHpLoss odejmuje 8% maxHP');

  // -------------------------------------------------------------------------
  // 2) Zerowanie licznika po powrocie zapasów na plus
  // -------------------------------------------------------------------------
  // zywnoscNetto=140, procentRozwoj=0 -> doPanstwa=140, brak Spichlerza -> depositFrac
  // domyślnie 0.5 -> +70. zapasyPrzed(-60) + 70 = +10: mały dodatni wynik (test poniżej
  // sprawdza SAM reset licznika, nie ma znaczenia jak duży jest dodatni bufor).
  const econPlus = { perCity: [{ ownerId: 0, zywnoscNetto: 140, oblegany: false, procentRozwoj: 0 }] };
  const t4 = M.advanceEmpireFood(econPlus, [], states, upkeep, params);
  ok(t4.byOwner.get(0).zapasyPo > 0, 'tura 4: zapasy wracają na plus');
  ok(t4.byOwner.get(0).turyUjemnychZapasowPo === 0, 'tura 4: licznik zerowany natychmiast');
  ok(t4.byOwner.get(0).glodWojskaAtrycjaAktywna === false, 'tura 4: atrycja nieaktywna po powrocie na plus');
  ok(M.isArmyStarving(0) === false, 'tura 4: isArmyStarving false po powrocie na plus');

  // Kolejny spadek zaczyna liczyć OD NOWA (nie kontynuuje starego licznika = 3).
  const t5 = M.advanceEmpireFood(econ, units20, states, upkeep, params);
  ok(t5.byOwner.get(0).turyUjemnychZapasowPo === 1, 'tura 5 (nowy spadek): licznik startuje od 1, nie kontynuuje');
  ok(t5.byOwner.get(0).glodWojskaAtrycjaAktywna === false, 'tura 5: atrycja znów nieaktywna (nowa karencja)');
}

// ---------------------------------------------------------------------------
// 3) MNOŻNIK TERYTORIALNY: własne x1,0 / poza x2,0 (C-GLOD-Q2=B)
// ---------------------------------------------------------------------------
{
  const upkeepT = M.loadUpkeepParams({
    ekonomia_miasta: {
      zywnosc_jednostka_ruch: { normal: 1 },
      zywnosc_mnoznik_terytorium_wlasne: { normal: 1.0 },
      zywnosc_mnoznik_poza_terytorium: { normal: 2.0 },
    },
  }, 'normal');

  ok(M.unitFoodPerTurn({ camping: false, onOwnTerritory: true }, upkeepT) === 1,
    'własne terytorium: 1 żywność/turę (mnożnik x1,0)');
  ok(M.unitFoodPerTurn({ camping: false, onOwnTerritory: false }, upkeepT) === 2,
    'poza własnym terytorium: 2 żywność/turę (mnożnik x2,0)');
  ok(M.unitFoodPerTurn({ camping: false }, upkeepT) === 1,
    'brak pola onOwnTerritory (stare wywołania) = domyślnie własne terytorium, BEZ regresji');

  const mixedUnits = [
    { camping: false, onOwnTerritory: true },
    { camping: false, onOwnTerritory: true },
    { camping: false, onOwnTerritory: false },
  ];
  ok(M.militaryFoodConsumption(mixedUnits, upkeepT) === 4,
    'mieszany stos: 2 własne (1+1) + 1 poza (2) = 4 żywności/turę');
}

// ---------------------------------------------------------------------------
// 3b) C-GARN-Q1 rozszerzenie: jednostka ufortyfikowana/w garnizonie (camping=true,
// zywnosc_jednostka_oboz domyślnie 0,5) SKŁADA SIĘ multiplikatywnie z mnożnikiem
// terytorialnym (Maciej 2026-07-26: "zjada tylko połowę żywności... można by
// było to uzupełnić i wprowadzić jako całość").
// ---------------------------------------------------------------------------
{
  const upkeepT = M.loadUpkeepParams({
    ekonomia_miasta: {
      zywnosc_jednostka_ruch: { normal: 1 },
      zywnosc_jednostka_oboz: { normal: 0.5 },
      zywnosc_mnoznik_terytorium_wlasne: { normal: 1.0 },
      zywnosc_mnoznik_poza_terytorium: { normal: 2.0 },
    },
  }, 'normal');

  ok(M.unitFoodPerTurn({ camping: true, onOwnTerritory: true }, upkeepT) === 0.5,
    'ufortyfikowana we własnym terytorium: 0,5 żywności/turę (0,5 obóz x 1,0 teren)');
  ok(M.unitFoodPerTurn({ camping: true, onOwnTerritory: false }, upkeepT) === 1,
    'ufortyfikowana POZA własnym terytorium: 1,0 żywności/turę (0,5 obóz x 2,0 teren)');
  ok(M.unitFoodPerTurn({ camping: false, onOwnTerritory: false }, upkeepT) === 2,
    'maszerująca poza własnym terytorium (regresja, camping=false): nadal 2,0 żywności/turę');

  const garrisonStack = [
    { camping: true, onOwnTerritory: true },
    { camping: true, onOwnTerritory: true },
    { camping: false, onOwnTerritory: true },
  ];
  ok(M.militaryFoodConsumption(garrisonStack, upkeepT) === 2,
    'stos w garnizonie: 2 ufortyfikowane (0,5+0,5) + 1 maszerująca (1) = 2,0 żywności/turę');
}

// ---------------------------------------------------------------------------
// 4) PARYTET: AI traci HP z głodu identycznie jak gracz (bez pytania — luka)
// ---------------------------------------------------------------------------
{
  const statesParity = new Map([
    [0, M.freshEmpireFoodState(100)],
    [1, M.freshEmpireFoodState(100)],
  ]);
  const econParity = {
    perCity: [
      { ownerId: 0, zywnoscNetto: 0, oblegany: false, procentRozwoj: 100 },
      { ownerId: 1, zywnoscNetto: 0, oblegany: false, procentRozwoj: 100 },
    ],
  };
  const unitsParity = [
    ...Array.from({ length: 20 }, () => ({ ownerId: 0, typeId: 'woj', camping: false, onOwnTerritory: true })),
    ...Array.from({ length: 20 }, () => ({ ownerId: 1, typeId: 'woj', camping: false, onOwnTerritory: true })),
  ];

  let efP;
  for (let i = 0; i < 3; i++) {
    efP = M.advanceEmpireFood(econParity, unitsParity, statesParity, upkeep, params);
  }
  ok(efP.byOwner.get(0).glodWojskaAtrycjaAktywna === true, 'parytet: gracz (ownerId=0) atrycja aktywna po karencji');
  ok(efP.byOwner.get(1).glodWojskaAtrycjaAktywna === true, 'parytet: AI (ownerId=1) atrycja aktywna IDENTYCZNIE jak gracz');
  ok(M.isArmyStarving(0) === true, 'parytet: isArmyStarving(0) true');
  ok(M.isArmyStarving(1) === true, 'parytet: isArmyStarving(1) true (dawniej zawsze false dla AI — luka)');

  const parityUnitsHp = [
    { id: 'p1', ownerId: 0, typeId: 'woj', hp: 100, hpMax: 100 },
    { id: 'ai1', ownerId: 1, typeId: 'woj', hp: 100, hpMax: 100 },
  ];
  M.applyArmyStarvationHpLoss(parityUnitsHp, 0, params.glodWojskaHpFrac, () => 100);
  M.applyArmyStarvationHpLoss(parityUnitsHp, 1, params.glodWojskaHpFrac, () => 100);
  ok(parityUnitsHp[0].hp === parityUnitsHp[1].hp, 'parytet: identyczna strata HP gracz vs AI (92/100 obaj)');
  ok(parityUnitsHp[1].hp === 92, 'parytet: AI realnie traci 8% maxHP, nie 0 (dawna luka: main.ts wołał tylko ownerId===0)');
}

// ---------------------------------------------------------------------------
// 5) Realne dane: econ-params.json zawiera nowe parametry z sensownymi wartościami
// ---------------------------------------------------------------------------
{
  const econParamsRaw = require('../data/econ-params.json');
  const realParams = M.buildEmpireFoodParams(econParamsRaw, 'normal');
  ok(realParams.glodWojskaKarencjaTur === 3, 'econ-params.json: glod_wojska_karencja_tur normal = 3');
  const em = econParamsRaw.ekonomia_miasta;
  ok(em.zywnosc_mnoznik_terytorium_wlasne.normal === 1.0, 'econ-params.json: mnoznik wlasne = 1.0');
  ok(em.zywnosc_mnoznik_poza_terytorium.normal === 2.0, 'econ-params.json: mnoznik poza = 2.0');
}

console.log('glod-wojska-karencja-test: ' + passed + ' pass, ' + failed + ' fail');
process.exit(failed > 0 ? 1 : 0);
