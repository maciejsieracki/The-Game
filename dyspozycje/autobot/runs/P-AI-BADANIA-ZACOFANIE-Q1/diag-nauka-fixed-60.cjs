'use strict';
/**
 * diag-nauka-fixed-60.cjs — dowod PRZED/PO dla P-AI-BADANIA-ZACOFANIE-Q1.
 *
 * Zywa, wieloturowa symulacja PRAWDZIWYCH funkcji silnika (importowane z bundla, nie
 * reimplementowane): `decideAIEconomySliders` + `computeMajorAiEarlyGame` (game/ai.ts),
 * `chooseAIResearch` (game/ai.ts, ta sama funkcja co realny AI), `createResearchState` /
 * `startResearch` / `advanceResearch` / `techCost` (game/research.ts), na PRAWDZIWYM
 * drzewku `data/tech.json`. Wzorowana na juz zintegrowanym
 * `tools/praca-podzial-staly-50-50-test.cjs` (ten sam styl petli ownera, ta sama metoda
 * bundlowania esbuild, ten sam synetyczny generator zapasyPanstwa/treasuryGold przez
 * prosty PRNG per-seed -- ten sam poziom realizmu co juz zaakceptowana bramka procentBudynki).
 *
 * Przeliczenie suwaka procentNauka na punkty nauki/turę i zloto/turę jest SYNTETYCZNYM,
 * ale DETERMINISTYCZNYM modelem handlu rosnacego z liczba miast/tur (ten sam model dla
 * PRZED i PO -- jedyna zmienna miedzy przebiegami to trajektoria procentNauka zwrocona
 * przez decideAIEconomySliders). To NIE jest twierdzenie o dokladnych liczbach tur do
 * zelaza w realnej rozgrywce -- to pomiar EFEKTU FIXU na tej samej, kontrolowanej symulacji.
 *
 * Uruchomienie: node dyspozycje/autobot/runs/P-AI-BADANIA-ZACOFANIE-Q1/diag-nauka-fixed-60.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..', '..', '..', '..', 'gra');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.nauka-fixed-60-entry.ts');
const BUNDLE = path.resolve(__dirname, `.nauka-fixed-60-bundle-${process.pid}.cjs`);

fs.writeFileSync(ENTRY, `
export { decideAIEconomySliders, computeMajorAiEarlyGame, chooseAIResearch } from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/ai'))};
export { createResearchState, startResearch, advanceResearch, techCost, availableTechs } from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/research'))};
export { DEFAULT_PODZIAL_HANDLU, AI_FIXED_PROCENT_NAUKA } from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/cities'))};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
});
const M = require(BUNDLE);
const {
  decideAIEconomySliders, computeMajorAiEarlyGame, chooseAIResearch,
  createResearchState, startResearch, advanceResearch, techCost,
  DEFAULT_PODZIAL_HANDLU, AI_FIXED_PROCENT_NAUKA,
} = M;

// RUNDA 2 -- metodyka naprawiona (Evaluator Rundy 1: kolejnosc byla ODWROCONA wzgledem
// main.ts, wiec luka tury 1 byla niewidoczna). W main.ts (initOwnerDefaultPodzialHandlu /
// seedCityOwnerDefaults / dwa analogiczne seedy) ekonomia tury 1 (advanceCityEconomy)
// CZYTA `ownerDefaultPodzialHandlu` PRZED pierwszym wywolaniem decideAIEconomySliders dla
// tego ownera w tej samej turze (ownerLoop wola decyzje suwaka PO advanceCityEconomy).
// Ponizej: `seedNauka` = wartosc, ktora PRAWDZIWY main.ts wstawia do
// ownerDefaultPodzialHandlu.procentNauka dla nowego ownera AI -- PRZED fixem Rundy 2 to
// DEFAULT_PODZIAL_HANDLU.procentNauka (20, default GRACZA, bez galezi AI), PO fixie to
// AI_FIXED_PROCENT_NAUKA (60). W kazdej turze: 1) ekonomia zuzywa BIEZACY procentNauka
// (seed na turze 1, wynik zeszlorocznej decyzji na kolejnych turach) -- DOKLADNIE jak
// advanceCityEconomy w main.ts; 2) DOPIERO PO NIEJ wola sie decideAIEconomySliders, ktora
// aktualizuje suwak na potrzeby NASTEPNEJ tury -- DOKLADNIE jak ownerLoop w main.ts.

const techRoot = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data', 'tech.json'), 'utf8'));
const TECH_DATA = techRoot.technologie;

const SLIDER_PARAMS = {
  deficytZapasowProg: 0,
  nadwyzkaZapasowProg: 50,
  krokProcentRozwoj: 10,
  krokProcentPracaNauka: 10,
  minOdstepTur: 3,
};

const TURNS = 150;
const SEEDS = [7, 99, 512, 4242, 1337];
// Okna wojny wymuszone -- rozlozone, tak zeby czesc gry AI byla w wojnie (zgloszenie
// wlasciciela: "kazda wojna cofa postep Nauki" -- dispatch pkt 3b). Symetryczne dla
// PRZED/PO.
const WAR_WINDOWS = [[15, 30], [55, 68], [90, 100]];

function isAtWar(turn) {
  return WAR_WINDOWS.some(([a, b]) => turn >= a && turn < b);
}

function mkRng(seed) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

/**
 * Symuluje JEDNEGO majora AI przez `TURNS` tur, z zadanym startowym `seedNauka` --
 * wartoscia, ktora ownerDefaultPodzialHandlu.procentNauka mialby dla tego ownera na
 * poczatku tury 1 w main.ts (patrz komentarz wyzej).
 */
function simulateOwner(seed, seedNauka) {
  let sliderSt = { procentRozwoj: 70, procentBudynki: 70, procentNauka: seedNauka, lastChangeTurn: null };
  const rng = mkRng(seed);
  const naukaByTurn = [];
  const zlotoByTurn = [];
  let zloto = 100;
  let research = createResearchState();
  const techCountByTurn = [];
  let bankructwaTury = 0;

  for (let turn = 1; turn <= TURNS; turn++) {
    const atWar = isAtWar(turn);
    const myCities = [{ population: 3 + Math.floor(rng() * 5) + Math.floor(turn / 20) }];
    const isEarlyGame = computeMajorAiEarlyGame(
      { defensiveCopy: false, currentTurn: turn, poziomTrudnosci: 2 },
      myCities, 3 + turn / 30,
    );
    // Ekonomia rosnaca z liczba/populacja miast i tura -- ten sam wzor w PRZED i PO.
    const totalTrade = 8 * myCities[0].population + turn * 0.5;
    const upkeep = 4 * myCities[0].population + turn * 0.6;
    const treasuryGold = zloto;

    // KROK 1 (jak advanceCityEconomy w main.ts): ekonomia tej tury liczy sie z BIEZACYM
    // procentNauka -- na turze 1 to `seedNauka` (wartosc z ownerDefaultPodzialHandlu),
    // na kolejnych turach to wynik decyzji suwaka Z POPRZEDNIEJ tury. decideAIEconomySliders
    // dla TEJ tury jeszcze sie NIE ODBYLA.
    const procentNauka = sliderSt.procentNauka;
    const naukaPerTurn = totalTrade * (procentNauka / 100);
    const zlotoPerTurn = totalTrade * ((100 - procentNauka) / 100) - upkeep;
    zloto += zlotoPerTurn;
    if (zloto < 0) bankructwaTury++;
    naukaByTurn.push(procentNauka);
    zlotoByTurn.push(Math.round(zloto));

    // AI wybiera i posuwa badania real. funkcja + real drzewko -- korzysta z procentNauka
    // TEJ tury, dokladnie jak w kroku 1.
    const doneSet = new Set(research.ukonczone);
    if (research.biezace == null) {
      const pick = chooseAIResearch(TECH_DATA, doneSet, {});
      if (pick) research = startResearch(research, pick);
    }
    const { state: nextState, completed } = advanceResearch(research, naukaPerTurn, TECH_DATA);
    research = nextState;
    if (completed) {
      const pick = chooseAIResearch(TECH_DATA, new Set(research.ukonczone), {});
      if (pick) research = startResearch(research, pick);
    }
    techCountByTurn.push(research.ukonczone.length);

    // KROK 2 (jak ownerLoop w main.ts, PO advanceCityEconomy tej samej tury): dopiero
    // TERAZ decideAIEconomySliders aktualizuje suwak -- efekt widoczny w ekonomii
    // NASTEPNEJ tury (KROK 1 iteracji turn+1), nie tej.
    const decision = decideAIEconomySliders({
      zapasyPanstwa: 20 + rng() * 60,
      atWar, turn, lastSliderChangeTurn: sliderSt.lastChangeTurn,
      current: { procentRozwoj: sliderSt.procentRozwoj, procentBudynki: sliderSt.procentBudynki, procentNauka: sliderSt.procentNauka },
      isMajorAi: true, isEarlyGame, treasuryGold, upkeepGoldCost: upkeep,
    }, SLIDER_PARAMS);
    if (decision.changed) {
      sliderSt = { procentRozwoj: decision.procentRozwoj, procentBudynki: decision.procentBudynki, procentNauka: decision.procentNauka, lastChangeTurn: turn };
    }
  }
  return { naukaByTurn, zlotoByTurn, techCountByTurn, bankructwaTury };
}

// PRZED (Runda 2): `seedNauka` = to, co PRAWDZIWY main.ts SPRZED tej naprawy wstawial do
// ownerDefaultPodzialHandlu dla nowego ownera AI -- DEFAULT_PODZIAL_HANDLU.procentNauka
// (20, default GRACZA, zero galezi AI). PO: AI_FIXED_PROCENT_NAUKA (60, main.ts PO
// naprawie Rundy 2). decideAIEconomySliders (fix Rundy 1) jest IDENTYCZNA w obu
// przebiegach -- jedyna zmienna to seed uzyty PRZED jej pierwszym wywolaniem.
function runScenario(label, seedNauka) {
  console.log(`\n=== diag-nauka-fixed-60 [${label}]: seedNauka=${seedNauka}, ${SEEDS.length} ziaren x ${TURNS} tur ===`);
  let minNaukaEver = 100, maxNaukaEver = 0, sumTech50 = 0, sumTech100 = 0, sumTech150 = 0, maxBankructwa = 0, minZlotoEver = Infinity;
  const turn1Values = [];
  for (const seed of SEEDS) {
    const { naukaByTurn, zlotoByTurn, techCountByTurn, bankructwaTury } = simulateOwner(seed, seedNauka);
    minNaukaEver = Math.min(minNaukaEver, ...naukaByTurn);
    maxNaukaEver = Math.max(maxNaukaEver, ...naukaByTurn);
    sumTech50 += techCountByTurn[49];
    sumTech100 += techCountByTurn[99];
    sumTech150 += techCountByTurn[149];
    maxBankructwa = Math.max(maxBankructwa, bankructwaTury);
    minZlotoEver = Math.min(minZlotoEver, ...zlotoByTurn);
    turn1Values.push(naukaByTurn[0]);
    console.log(`seed=${seed}: procentNauka t1=${naukaByTurn[0]} t2=${naukaByTurn[1]} t25=${naukaByTurn[24]} t50=${naukaByTurn[49]} t100=${naukaByTurn[99]} t150=${naukaByTurn[149]} | techy t50=${techCountByTurn[49]} t100=${techCountByTurn[99]} t150=${techCountByTurn[149]} | zloto min=${Math.min(...zlotoByTurn)} tur<0=${bankructwaTury}`);
  }
  console.log(`AGREGAT [${label}]: procentNauka t1 (KAZDE ziarno)=${turn1Values.join(',')} | min=${minNaukaEver} max=${maxNaukaEver} (5 ziaren x ${TURNS} tur)`);
  console.log(`AGREGAT [${label}]: sredni licznik technologii t50=${(sumTech50/SEEDS.length).toFixed(1)} t100=${(sumTech100/SEEDS.length).toFixed(1)} t150=${(sumTech150/SEEDS.length).toFixed(1)}`);
  console.log(`AGREGAT [${label}]: max tur ze zlotem<0 (bankructwo) w jednym ziarnie = ${maxBankructwa}, najnizsze zloto = ${minZlotoEver}`);
  return { turn1Values, minNaukaEver, maxNaukaEver };
}

const przed = runScenario('PRZED (bug tury 1: seed=DEFAULT_PODZIAL_HANDLU.procentNauka)', DEFAULT_PODZIAL_HANDLU.procentNauka);
const po = runScenario('PO (fix Rundy 2: seed=AI_FIXED_PROCENT_NAUKA)', AI_FIXED_PROCENT_NAUKA);

console.log('\n=== WERDYKT (kryterium binarne Rundy 2: procentNauka=60 w KAZDEJ turze, wlacznie z tura 1) ===');
let ok = true;
if (!przed.turn1Values.every(v => v === DEFAULT_PODZIAL_HANDLU.procentNauka)) {
  console.log(`NIESPODZIEWANE: PRZED-scenariusz nie zwraca t1=${DEFAULT_PODZIAL_HANDLU.procentNauka} dla kazdego ziarna -- ${przed.turn1Values.join(',')}`);
  ok = false;
}
if (przed.minNaukaEver !== AI_FIXED_PROCENT_NAUKA && przed.turn1Values.some(v => v !== AI_FIXED_PROCENT_NAUKA)) {
  console.log(`POTWIERDZONA LUKA PRZED (oczekiwana, to jest dowod bledu): t1=${przed.turn1Values[0]} != ${AI_FIXED_PROCENT_NAUKA}`);
}
if (po.minNaukaEver !== AI_FIXED_PROCENT_NAUKA || po.maxNaukaEver !== AI_FIXED_PROCENT_NAUKA) {
  console.log(`FAIL: PO-fixie procentNauka NIE jest stale ${AI_FIXED_PROCENT_NAUKA} w kazdej turze -- min=${po.minNaukaEver} max=${po.maxNaukaEver}`);
  ok = false;
} else {
  console.log(`PASS: PO-fixie procentNauka=${AI_FIXED_PROCENT_NAUKA} w KAZDEJ z ${TURNS} tur x ${SEEDS.length} ziaren, WLACZNIE z tura 1 (t1=${po.turn1Values.join(',')}).`);
}
if (!ok) process.exitCode = 1;

try { fs.unlinkSync(ENTRY); } catch (_e) {}
try { fs.unlinkSync(BUNDLE); } catch (_e) {}
