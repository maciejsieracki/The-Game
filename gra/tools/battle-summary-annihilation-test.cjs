'use strict';
/**
 * R-WEB-BATTLE-SUMMARY-ANNIHILATION-LINE-Q1
 * node tools/battle-summary-annihilation-test.cjs   (z katalogu gra/)
 *
 * ABC 2026-11-15 (A): gdy czwarty odwrot w turze niszczy armie, podsumowanie bitwy pokazuje
 * OSOBNA linie "Unicestwienie" (kto, ile jednostek, powod: wyczerpany limit odwrotow).
 *
 * a) prawdziwy applyPostBattleMap: wyczerpany budzet obrony -> licznik unicestwionych > 0;
 * b) bez wyczerpania -> licznik 0 -> brak linii w danych podsumowania;
 * c) buildPostBattleSummary: linia dla obrony i dla atakujacego (parytet gracz/AI), liczba
 *    jednostek z poprawna odmiana polska, powod po polsku;
 * d) wiazanie UI/main.ts (pin tekstowy): linia renderowana w postBattleSummary.ts, licznik
 *    przechwytywany w main.ts. Mutacja (usuniecie linii) => czerwono.
 */
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }

async function bundle(contents, name) {
  const r = await esbuild.build({
    stdin: { contents, resolveDir: ROOT, sourcefile: name },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') },
    plugins: [{ name: 'stub', setup(build) {
      const entries = [
        [/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'],
        [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'],
        [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};'],
      ];
      for (const [filter, namespace, c] of entries) {
        build.onResolve({ filter }, a => ({ path: a.path, namespace }));
        build.onLoad({ filter: /.*/, namespace }, () => ({ contents: c, loader: 'js' }));
      }
    } }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(r.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: name });
  return module.exports;
}

const U = (id, owner, q, r, extra) => Object.assign({ id, ownerId: owner, typeId: 'Wojownik', q, r, ruchLeft: 2, hp: 100 }, extra || {});

function run(P, o) {
  const units = o.units;
  return P.applyPostBattleMap({
    units, map: { hexes: {} }, cities: [],
    battleQ: o.bq, battleR: o.br,
    atkAnchor: o.atk[0], atkRoster: o.atk, defRoster: o.def,
    atkStart: new Map(o.atk.map(u => [u.id, { q: u.q, r: u.r }])),
    winner: o.winner, lossAtkPct: undefined, lossDefPct: undefined,
    manualSurvivors: o.survivors,
    defRetreatBudgetExhausted: o.exhausted === true,
    atkRetreatBudgetExhausted: o.atkExhausted === true,
    battleEventLog: undefined,
    getDef: () => ({ health: 100, 'Rola (linia)': 'Wręcz' }), maxHpOf: () => 100,
    isPassableHex: () => true,
    isUnitAt: (q, r, ex) => units.some(u => u.id !== ex && u.q === q && u.r === r),
    cityOnBattleHex: null,
  });
}

function summaryInput(over) {
  return Object.assign({
    winner: 'atakujacy', atkLabel: 'Rzymianie', defLabel: 'Grecy',
    mode: 'auto', atkBefore: [{ id: 'a0', typeId: 'Wojownik', kategoria: 'Wrecz', hp: 100, maxHp: 100 }],
    defBefore: [
      { id: 'd0', typeId: 'Wojownik', kategoria: 'Wrecz', hp: 100, maxHp: 100 },
      { id: 'd1', typeId: 'Wojownik', kategoria: 'Wrecz', hp: 100, maxHp: 100 },
    ],
    lookupHp: () => null,
  }, over || {});
}

async function main() {
  const P = await bundle("export * from './src/game/post-battle-map';", 'bsa-pb-entry.ts');
  const S = await bundle("export * from './src/game/battle-summary';", 'bsa-sum-entry.ts');

  // a) wyczerpany budzet obrony, atakujacy wygrywa w polu -> 2 jednostki obrony unicestwione.
  const a0 = U('a0', 0, 11, 23);
  const d0 = U('d0', 1, 11, 22);
  const d1 = U('d1', 1, 11, 22);
  const resA = run(P, { units: [a0, d0, d1], bq: 11, br: 22, atk: [a0], def: [d0, d1], winner: 'atakujacy',
    survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 37 }, { id: 'd1', hp: 20 }], exhausted: true });
  assert(resA.defenderAnnihilatedByRetreatLimit === true, 'a1: budzet obrony wyczerpany -> flaga unicestwienia');
  assert(resA.defenderAnnihilatedUnitCount === 2, 'a2: licznik unicestwionych obrony = 2 (ocaleli + polegli rosteru)');
  assert(resA.attackerAnnihilatedUnitCount === 0, 'a3: brak unicestwienia atakujacego');

  // b) bez wyczerpania -> licznik 0 -> brak linii.
  const a0b = U('a0', 0, 11, 23);
  const d0b = U('d0', 1, 11, 22);
  const d1b = U('d1', 1, 11, 22);
  const resB = run(P, { units: [a0b, d0b, d1b], bq: 11, br: 22, atk: [a0b], def: [d0b, d1b], winner: 'atakujacy',
    survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 37 }], exhausted: false });
  assert(resB.defenderAnnihilatedUnitCount === 0, 'b1: bez wyczerpania licznik = 0');
  const noLine = S.buildPostBattleSummary(summaryInput({
    annihilatedDefUnits: resB.defenderAnnihilatedUnitCount,
    annihilatedAtkUnits: resB.attackerAnnihilatedUnitCount,
  }));
  assert(noLine.annihilation === undefined, 'b2: brak linii unicestwienia w danych podsumowania');

  // c1) obrona unicestwiona (atakujacy wygrywa) -> linia po stronie obrony, 2 jednostki.
  const sumDef = S.buildPostBattleSummary(summaryInput({ annihilatedDefUnits: resA.defenderAnnihilatedUnitCount }));
  assert(sumDef.annihilation && sumDef.annihilation.side === 'obronca', 'c1: linia dla obrony');
  assert(sumDef.annihilation.units === 2 && sumDef.annihilation.label === 'Grecy', 'c1: liczba jednostek 2 i etykieta strony');
  const lineDef = S.formatAnnihilationLine(sumDef.annihilation);
  assert(/^Unicestwienie: Grecy — 2 jednostki zniszczone; powód: wyczerpany limit odwrotów \(trzy odwroty w tej turze\)\.$/.test(lineDef),
    'c1: tekst linii po polsku: ' + lineDef);

  // c2) parytet: atakujacy unicestwiony (obrona wygrywa) -> linia po stronie atakujacego.
  const a0c = U('a0', 0, 11, 23);
  const a1c = U('a1', 0, 11, 23);
  const d0c = U('d0', 1, 11, 22);
  const resC = run(P, { units: [a0c, a1c, d0c], bq: 11, br: 22, atk: [a0c, a1c], def: [d0c], winner: 'obronca',
    survivors: [{ id: 'a0', hp: 50 }, { id: 'a1', hp: 40 }, { id: 'd0', hp: 90 }], atkExhausted: true });
  assert(resC.attackerAnnihilatedByRetreatLimit === true && resC.attackerAnnihilatedUnitCount === 2,
    'c2: atakujacy unicestwiony (2 jednostki)');
  const sumAtk = S.buildPostBattleSummary(summaryInput({ winner: 'obronca', annihilatedAtkUnits: resC.attackerAnnihilatedUnitCount }));
  assert(sumAtk.annihilation && sumAtk.annihilation.side === 'atakujacy' && sumAtk.annihilation.label === 'Rzymianie',
    'c2: linia dla atakujacego (parytet gracz/AI)');

  // c3) odmiana: 1 -> jednostka, 5 -> jednostek, 22 -> jednostki, 12 -> jednostek.
  const word = n => S.formatAnnihilationLine({ side: 'obronca', label: 'X', units: n, reason: 'r' });
  assert(word(1).includes(' 1 jednostka zniszczona;'), 'c3: 1 jednostka zniszczona');
  assert(word(21).includes(' 21 jednostka zniszczona;'), 'c3: 21 jednostka zniszczona');
  assert(word(2).includes(' 2 jednostki zniszczone;'), 'c3: 2 jednostki zniszczone');
  assert(word(22).includes(' 22 jednostki zniszczone;'), 'c3: 22 jednostki zniszczone');
  assert(word(5).includes(' 5 jednostek zniszczonych;'), 'c3: 5 jednostek zniszczonych');
  assert(word(11).includes(' 11 jednostek zniszczonych;'), 'c3: 11 jednostek zniszczonych');
  assert(word(12).includes(' 12 jednostek zniszczonych;'), 'c3: 12 jednostek zniszczonych');
  assert(word(14).includes(' 14 jednostek zniszczonych;'), 'c3: 14 jednostek zniszczonych');

  // d) wiazanie UI i main.ts (pin tekstowy).
  const ui = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'postBattleSummary.ts'), 'utf8');
  const main = fs.readFileSync(path.join(ROOT, 'src', 'main.ts'), 'utf8');
  assert(/if \(data\.annihilation\) \{[\s\S]*?formatAnnihilationLine\(data\.annihilation\)[\s\S]*?^\s*body\.appendChild\(annLine\);/m.test(ui),
    'd1: postBattleSummary.ts dolacza linie unicestwienia do DOM (body.appendChild(annLine) w bloku if)');
  assert(/onPostBattleResult: r => \{ pbHolder\.res = r; \}/.test(main)
    && /annihilatedDefUnits: pbRes\?\.defenderAnnihilatedUnitCount/.test(main),
    'd2: main.ts przechwytuje licznik i przekazuje do podsumowania');

  console.log('battle-summary-annihilation-test: pass=' + pass + ' fail=' + fail);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
