'use strict';
/**
 * diplo-respect-battle-win-plus5-test.cjs — R-WEB-DIPLO-RESPECT-BATTLE-WIN-PLUS5-IN-BAR-AUDIT-Q1
 *
 * Pomiar (czyste funkcje z prawdziwych modułów gry, bundlowane esbuildem):
 *   - applyDiplomaticEvent(…,'wygrana_bitwa') z diplomacy.ts  -> +5 do rel.respekt (zdarzenie)
 *   - tick AI z main.ts (linia ~45396): rel.respekt = respektZKorektaMilitarna(computeRespekt(potAI, potPl), offset)
 *   - pasek w UI (diplomacy-display.ts formatPowerRelationLine + main.ts respektBarWithMilitaryOffset):
 *       bar = respektZKorektaMilitarna(computeRespekt(playerPower, otherPower), offset)
 *   - Moc z computeObjectivePower (power-objective.ts), wygrana dokłada pkt do bitwyPktSum
 *     (main.ts ~38069: battlePowerPointsFromDefeatedEnemy(M pokonanego składu)).
 *
 * Scenariusz: 4 wygrane bitwy gracza z AI, po każdej 3 tury ticku.
 *   S0: pts=0 na wygraną (izolacja: sam +5 zdarzenia, bez zmiany Mocy)
 *   S1: pts=60 na wygraną (przykładowy M pokonanego składu; wartość ZAŁOŻONA, do potwierdzenia)
 *
 * Mutacja: w kopii tej logiki pominięcie tick-overwrite NIE jest tu testowane; test mierzy stan
 * kodu main.ts (sprawdzany regexem) i raportuje surowe liczby.
 *
 * Run from gra/:  node tools/diplo-respect-battle-win-plus5-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.battle-win-plus5-bundle.cjs');
const entryFile = path.resolve(__dirname, '.battle-win-plus5-entry.ts');
fs.writeFileSync(entryFile, `
export { applyDiplomaticEvent, computeRespekt, DIPLOMACY_PARAMS, militaryWinRespectPair } from '../src/game/diplomacy.ts';
export { respektZKorektaMilitarna } from '../src/game/diplomacy-military-strength.ts';
export { formatPowerRelationLine } from '../src/game/diplomacy-display.ts';
export { computeObjectivePower, battlePowerPointsFromDefeatedEnemy } from '../src/game/power-objective.ts';
`, 'utf8');

const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');

async function main() {
  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
  });

  const {
    applyDiplomaticEvent, computeRespekt, DIPLOMACY_PARAMS,
    respektZKorektaMilitarna, formatPowerRelationLine,
    computeObjectivePower, battlePowerPointsFromDefeatedEnemy,
  } = require(BUNDLE);

  const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
  const hasTick = /const respektAI = respektZKorektaMilitarna\(\s*computeRespekt\(potAI, potPlr\)/.test(mainSrc);
  const hasBarRead = /respektBarWithMilitaryOffset\(ownerId, powerLine\.respekt\)/.test(mainSrc);

  // Surowe liczniki imperiów (wartości ZAŁOŻONE, stałe między scenariuszami).
  function rawEmpire(ownerId, bitwyPktSum) {
    return {
      ownerId, epoka: 1, jednostki: 10, wygraneBitwy: 0, bitwyPktSum,
      sumaLudkow: 20, rekrutEkw: 0, miasta: 3, heksyTerytorium: 20,
      budynki: 5, techZbadane: 3, ulepszeniaTerenu: 0,
    };
  }
  const PL = 0;
  const AI = 1;

  function runScenario(label, ptsPerWin) {
    let ptsPl = 0;
    let ptsAi = 0;
    // Relacja gracz->AI: pokój, zaufanie 50, respekt startowy = wartość z tick (zakładana).
    let rel = { zaufanie: 50, respekt: 50, status: 'pokoj' };
    const potOf = (oid) => computeObjectivePower(rawEmpire(oid, oid === PL ? ptsPl : ptsAi)).power;
    const barNow = () => respektZKorektaMilitarna(
      computeRespekt(potOf(PL), potOf(AI)), 0);
    const rows = [];
    const tick = () => {
      // Tick AI (main.ts ~45396): stored rel.respekt = respektZKorektaMilitarna(computeRespekt(potAI, potPl), off)
      rel = { ...rel, respekt: respektZKorektaMilitarna(computeRespekt(potOf(AI), potOf(PL)), 0) };
    };
    tick();
    console.log(`\n== ${label} (pts/wygrana=${ptsPerWin}) ==`);
    console.log('  start: bar=' + barNow() + ' rel.respekt=' + rel.respekt + ' potPl=' + potOf(PL).toFixed(2));
    for (let w = 1; w <= 4; w++) {
      const barBefore = barNow();
      ptsPl += battlePowerPointsFromDefeatedEnemy(ptsPerWin);
      rel = applyDiplomaticEvent(rel, 'wygrana_bitwa', DIPLOMACY_PARAMS);
      const relAfterEvent = rel.respekt;
      const barAfterEvent = barNow();
      const row = { win: w, barBefore, relAfterEvent, barAfterEvent, ticks: [] };
      for (let t = 1; t <= 3; t++) {
        tick();
        row.ticks.push({ t, relRespekt: rel.respekt, bar: barNow() });
      }
      rows.push(row);
      console.log(`  wygrana ${w}: bar ${barBefore} -> ${barAfterEvent} (zdarzenie) | rel.respekt po zdarzeniu=${relAfterEvent}` +
        ` | po ticku: ` + row.ticks.map(k => `t${k.t} rel=${k.relRespekt} bar=${k.bar}`).join(', '));
    }
    return { rows, finalBar: barNow(), finalRel: rel.respekt };
  }

  const s0 = runScenario('S0 izolacja +5', 0);
  const s1 = runScenario('S1 +5 i Moc z bitew', 60);

  // Kontrola: ten sam tick BEZ zdarzenia (baza do porównania rel.respekt).
  let relBase = { zaufanie: 50, respekt: 50, status: 'pokoj' };
  relBase = { ...relBase, respekt: respektZKorektaMilitarna(computeRespekt(computeObjectivePower(rawEmpire(AI, 0)).power, computeObjectivePower(rawEmpire(PL, 0)).power), 0) };
  console.log('\n== KONTROLA bez zdarzenia: rel.respekt po ticku =', relBase.respekt);

  const s0BarMoved = s0.rows.some(r => r.barAfterEvent !== r.barBefore);
  const s0RelAfterTick = s0.rows.map(r => r.ticks[0].relRespekt);
  const s0RelLost = s0RelAfterTick.every(v => v === relBase.respekt);

  console.log('\n== WIRING main.ts ==');
  console.log('  tick nadpisuje rel.respekt (45396 wzorzec):', hasTick);
  console.log('  pasek czyta powerLine.respekt (main.ts):', hasBarRead);

  console.log('\n== WYNIK ==');
  console.log('  S0: zdarzenie zmienia pasek?', s0BarMoved ? 'TAK' : 'NIE');
  console.log('  S0: po ticku rel.respekt == kontrola bez zdarzenia (+5 nadpisane)?', s0RelLost ? 'TAK' : 'NIE');
  console.log('  S1: pasek po 4 wygranych', s1.rows[0].barBefore, '->', s1.finalBar, '(sam wkład Mocy z bitew)');
  console.log('  formatPowerRelationLine sanity:', JSON.stringify(formatPowerRelationLine(60, 40)));

  // Asercje: twarde, żeby wynik był zielony/czerwony.
  let fail = 0;
  const ok = (c, m) => { if (c) console.log('  OK:', m); else { fail++; console.error('  FAIL:', m); } };
  ok(hasTick, 'tick AI nadpisuje rel.respekt (main.ts)');
  ok(hasBarRead, 'pasek liczony z powerLine.respekt (main.ts)');
  ok(!s0BarMoved, 'S0: sam +5 nie zmienia paska');
  ok(s0RelLost, 'S0: +5 w rel.respekt znika po ticku (nadpisanie)');
  process.exitCode = fail ? 1 : 0;
}

main().catch(e => { console.error(e); process.exit(1); });
