'use strict';
/**
 * praca-podzial-staly-50-50-test.cjs — BRAMKA TEMATU R-AI-PRACA-PODZIAL-STALY-50-50-Q1.
 *
 * Zrzut wlasciciela: „ustaw dla AI cywilizacji oraz panstw-miast sztywny limit 50 na 50:
 * 50% na ulepszenia, 50% na budynki, zeby mial z czego zarowno budowac budynki, jak i
 * generowac ulepszenia".
 *
 * ZYWA, WIELOTUROWA symulacja PRAWDZIWEGO `decideAIEconomySliders` (game/ai.ts) —
 * funkcja importowana z bundla, NIE reimplementowana. Petla ownera nizej ODTWARZA 1:1
 * rownania main.ts (ok. 28461-28553): stan `sliderSt` per owner (parytet
 * `aiSliderStateByOwner`), `clampPodzialPracyBudynkiPercent` (game/cities.ts, PRAWDZIWA
 * funkcja) po kazdej decyzji, `computeMajorAiEarlyGame` (PRAWDZIWA funkcja) do wyznaczenia
 * fazy gry. Scenariusz wojny: bezposrednie ustawienie `atWar=true` w oknie
 * [WAR_START, WAR_START+WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR) — dokladnie ta metoda,
 * ktora kryterium 1 dopuszcza wprost ("bezposrednie ustawienie stanu wojny"), z
 * prawdziwa stala czasu trwania z `game/forced-war-bronze.ts`.
 *
 * PRZED naprawa (Krok 1, ten sam plik, ta sama petla) ten test jest CZERWONY:
 * `decideAIEconomySliders` podbija procentBudynki do 100 w oknie wojny (pula imperium ->
 * 0), zgodnie z RECON w dispatchu. PO naprawie -- ZIELONY: procentBudynki===50 na kazdej
 * turze, w tym w oknie wojny. Uruchomienie w obu stanach (przed/po commit fixu) jest
 * dowodem nietautologicznosci (R-PROC-AUTOBOT.md §9 pkt 6a).
 *
 * Pokrywa kryteria konca 1 (AI cywilizacja glowna), 2 (miasto-panstwo), 5 (pula imperium
 * NIE spada ponizej ok. 50% w wojnie -- pomiar bezposrednio z tej samej symulacji, 5
 * ziaren x 3 trudnosci x 100 tur, jedna cywilizacja przechodzi realistyczne okno wojny
 * wymuszonej). ZASADA 3 (przywracanie po nadwyzce) NIE jest tu cwiczona -- to
 * kryterium 4, pokryte osobno przez `ai5-zasada3-harness.cjs`/`ai-ulepszenia-malo-
 * budowane-test.cjs` (juz istniejace bramki tej samej rodziny, uruchamiane przez tego
 * runa bez zmian).
 *
 * Uruchomienie: node tools/praca-podzial-staly-50-50-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.praca-50-50-entry.ts');
const BUNDLE = path.resolve(__dirname, '.praca-50-50-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { decideAIEconomySliders, computeMajorAiEarlyGame } from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/ai'))};
export { clampPodzialPracyBudynkiPercent, procentPuliImperiumZBudynkow, DEFAULT_PODZIAL_PRACY } from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/cities'))};
export { WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR } from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/forced-war-bronze'))};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
});
const M = require(BUNDLE);
const {
  decideAIEconomySliders, computeMajorAiEarlyGame,
  clampPodzialPracyBudynkiPercent, procentPuliImperiumZBudynkow, DEFAULT_PODZIAL_PRACY,
  WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
} = M;

let PASS = 0, FAIL = 0;
function check(name, cond, detail) {
  if (cond) { PASS++; }
  else { FAIL++; console.error(`FAIL: ${name}${detail ? ' -- ' + detail : ''}`); }
}

const SLIDER_PARAMS = {
  deficytZapasowProg: 0,
  nadwyzkaZapasowProg: 50,
  krokProcentRozwoj: 10,
  krokProcentPracaNauka: 10,
  minOdstepTur: 3,
};

const TURNS = 100;
const WAR_START = 30;
const WAR_END = WAR_START + WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR; // exclusive, real stala (25)
const SEEDS = [7, 99, 512, 4242, 1337];
const DIFFICULTIES = [1, 2, 3];

/**
 * Odtwarza main.ts:28461-28553 dla JEDNEGO ownera przez `turns` tur. Zwraca trajektorie
 * procentBudynki i procentPuliImperium (pula imperium %, 100-procentBudynki).
 */
function simulateOwner({ isMajorAi, seed, poziomTrudnosci, warStart, warEnd, turns }) {
  let sliderSt = {
    procentRozwoj: 70,
    procentBudynki: DEFAULT_PODZIAL_PRACY.procentBudynki, // 70, seeding realny (freshOwnerDefaultPodzialPracy)
    procentNauka: 20,
    lastChangeTurn: null,
  };
  const procentBudynkiByTurn = [];
  const poolShareByTurn = [];
  // Deterministyczny, prosty PRNG per-seed dla zapasyPanstwa/skarbca (bez zaleznosci od mapy/produkcji --
  // ta symulacja mierzy WYLACZNIE decideAIEconomySliders, nie cala ekonomie).
  let rngState = seed;
  const rng = () => {
    rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
    return rngState / 0x7fffffff;
  };
  for (let turn = 1; turn <= turns; turn++) {
    const atWar = turn >= warStart && turn < warEnd;
    const opts = { defensiveCopy: !isMajorAi, currentTurn: turn, poziomTrudnosci };
    const myCities = [{ population: 3 + Math.floor(rng() * 5) }];
    const isEarlyGame = computeMajorAiEarlyGame(opts, myCities, 4 + rng() * 4);
    const zapasyPanstwa = 20 + rng() * 60;
    const treasuryGold = 50 + rng() * 200;
    const upkeepGoldCost = 30 + rng() * 100;
    const decision = decideAIEconomySliders({
      zapasyPanstwa,
      atWar,
      turn,
      lastSliderChangeTurn: sliderSt.lastChangeTurn,
      current: {
        procentRozwoj: sliderSt.procentRozwoj,
        procentBudynki: sliderSt.procentBudynki,
        procentNauka: sliderSt.procentNauka,
      },
      isMajorAi,
      isEarlyGame,
      treasuryGold,
      upkeepGoldCost,
    }, SLIDER_PARAMS);
    if (decision.changed) {
      const aiProcentBudynki = clampPodzialPracyBudynkiPercent(decision.procentBudynki);
      sliderSt = {
        procentRozwoj: decision.procentRozwoj,
        procentBudynki: aiProcentBudynki,
        procentNauka: decision.procentNauka,
        lastChangeTurn: turn,
      };
    }
    procentBudynkiByTurn.push(sliderSt.procentBudynki);
    poolShareByTurn.push(procentPuliImperiumZBudynkow(sliderSt.procentBudynki));
  }
  return { procentBudynkiByTurn, poolShareByTurn };
}

console.log('\n-- 1. AI cywilizacja glowna: procentBudynki===50 KAZDA tura, w tym w oknie wojny --');
{
  let allFifty = true;
  let maxDuringWar = -Infinity;
  let minPoolDuringWar = Infinity;
  for (const seed of SEEDS) {
    for (const poziomTrudnosci of DIFFICULTIES) {
      const { procentBudynkiByTurn, poolShareByTurn } = simulateOwner({
        isMajorAi: true, seed, poziomTrudnosci, warStart: WAR_START, warEnd: WAR_END, turns: TURNS,
      });
      for (let t = 0; t < TURNS; t++) {
        if (procentBudynkiByTurn[t] !== 50) allFifty = false;
        const turn = t + 1;
        if (turn >= WAR_START && turn < WAR_END) {
          maxDuringWar = Math.max(maxDuringWar, procentBudynkiByTurn[t]);
          minPoolDuringWar = Math.min(minPoolDuringWar, poolShareByTurn[t]);
        }
      }
    }
  }
  check('AI major: procentBudynki===50 na kazdej turze (5 ziaren x 3 trudnosci x 100 tur)', allFifty,
    `maxDuringWar=${maxDuringWar}`);
  check('AI major: procentBudynki NIE rosnie ponad 50 w oknie wojny', maxDuringWar <= 50,
    `maxDuringWar=${maxDuringWar} (dzisiejszy kod podbija do 100)`);
  check('AI major: pula imperium NIE spada ponizej ~50% w oknie wojny', minPoolDuringWar >= 50,
    `minPoolDuringWar=${minPoolDuringWar} (dzisiejszy kod schodzi do 0)`);
}

console.log('\n-- 2. Miasto-panstwo (defensiveCopy): ta sama funkcja, ten sam wynik 50 --');
{
  let allFifty = true;
  let maxDuringWar = -Infinity;
  let minPoolDuringWar = Infinity;
  for (const seed of SEEDS) {
    const { procentBudynkiByTurn, poolShareByTurn } = simulateOwner({
      isMajorAi: false, seed, poziomTrudnosci: 2, warStart: WAR_START, warEnd: WAR_END, turns: TURNS,
    });
    for (let t = 0; t < TURNS; t++) {
      if (procentBudynkiByTurn[t] !== 50) allFifty = false;
      const turn = t + 1;
      if (turn >= WAR_START && turn < WAR_END) {
        maxDuringWar = Math.max(maxDuringWar, procentBudynkiByTurn[t]);
        minPoolDuringWar = Math.min(minPoolDuringWar, poolShareByTurn[t]);
      }
    }
  }
  check('Miasto-panstwo: procentBudynki===50 na kazdej turze (5 ziaren x 100 tur)', allFifty,
    `maxDuringWar=${maxDuringWar}`);
  check('Miasto-panstwo: pula imperium NIE spada ponizej ~50% w oknie wojny', minPoolDuringWar >= 50,
    `minPoolDuringWar=${minPoolDuringWar}`);
}

console.log('\n-- 3. Seeding: pierwsza tura AI (early game) juz 50, nie 70 (DEFAULT_PODZIAL_PRACY seed) --');
{
  const { procentBudynkiByTurn } = simulateOwner({
    isMajorAi: true, seed: 1, poziomTrudnosci: 2, warStart: 9999, warEnd: 9999, turns: 1,
  });
  check('Tura 1 AI major: procentBudynki===50 (nie 70 z seedowania)', procentBudynkiByTurn[0] === 50,
    `got ${procentBudynkiByTurn[0]}`);
}

console.log(`\npraca-podzial-staly-50-50-test: ${PASS} passed, ${FAIL} failed`);

try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE); } catch (_e) { /* noop */ }

process.exit(FAIL > 0 ? 1 : 0);
