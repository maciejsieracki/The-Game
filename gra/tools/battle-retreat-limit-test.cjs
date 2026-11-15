'use strict';
/**
 * R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1
 * node tools/battle-retreat-limit-test.cjs   (z katalogu gra/)
 *
 * Regula (Maciej 2026-11-14 + ABC): armia moze wykonac do TRZECH odwrotow w jednej turze.
 * Odwrot = wycofanie przed bitwa (przycisk Wycofaj) albo odwrot ocalalych przegranej o 2 heksy.
 * Po wyczerpaniu limitu KOLEJNA przegrana bitwa w tej turze = unicestwienie armii.
 * Licznik zeruje sie na poczatku nastepnej tury. Dotyczy gracza i AI (wspolny licznik rosteru).
 *
 * Czesc 1: helper game/battle-retreat-limit.ts (limit z combat-params.json, migracja boolean -> 1/0,
 *          liczenie na rosterze, reset).
 * Czesc 2: prawdziwy applyPostBattleMap (field, atakujacy wygrywa):
 *          - budzet niewyczerpany -> ocaleli wycofuja sie i licznik rosnie;
 *          - trzeci odwrot (licznik 2 -> 3) dziala;
 *          - budzet wyczerpany -> przegrana = unicestwienie (ocalali usunieci, flaga true);
 *          - garnizon nie liczy odwrotu;
 *          - wlasciciel AI (ownerId 1) ma ten sam limit (parytet).
 * Czesc 3: pin tekstowy main.ts (wiazanie: licznik przed pre-battle, zapis po Wycofaj, EOT reset,
 *          unicestwienie i komunikat).
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
const at = (units, id) => units.find(u => u.id === id);

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

/** Scenariusz: atakujacy (a0) wygrywa z obrona (d0 ocalaly, d1 polegl) na heksie (11,22). */
function fieldFight(P, o) {
  const a0 = U('a0', 0, 11, 23);
  const d0 = U('d0', o.defOwner ?? 1, 11, 22, o.d0Extra || {});
  const d1 = U('d1', o.defOwner ?? 1, 11, 22);
  const units = [a0, d0, d1];
  const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0, d1], winner: 'atakujacy',
    survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 37 }], exhausted: o.exhausted });
  return { units, res, a0, d0, d1 };
}

async function main() {
  const P = await bundle("export * from './src/game/post-battle-map';", 'brl-pb-entry.ts');
  const H = await bundle("export * from './src/game/battle-retreat-limit';", 'brl-helper-entry.ts');

  // ---------- Czesc 1: helper ----------
  const paramsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'combat-params.json'), 'utf8'));
  assert(paramsJson.odwrot && paramsJson.odwrot.max_na_ture === 3, '1a: combat-params.json odwrot.max_na_ture === 3');
  assert(H.MAX_ODWROTOW_NA_TURE === 3, '1b: MAX_ODWROTOW_NA_TURE czytany z danych = 3');
  {
    const u1 = { id: 'x', retreatedThisTurn: true };          // stary zapis (boolean)
    const u0 = { id: 'y' };                                    // brak pola
    assert(H.retreatCountOfUnit(u1) === 1, '1c: migracja stary boolean true -> 1');
    assert(H.retreatCountOfUnit(u0) === 0, '1d: brak pola -> 0');
    const roster = [{ id: 'p', odwrotyWTurze: 2 }, { id: 'q', odwrotyWTurze: 1 }];
    assert(H.retreatCountOfRoster(roster) === 2, '1e: licznik rosteru = maksimum (2)');
    assert(!H.retreatBudgetExhausted(roster), '1f: 2 odwroty < 3 -> budzet niewyczerpany');
    const full = [{ id: 'p', odwrotyWTurze: 3 }];
    assert(H.retreatBudgetExhausted(full), '1g: 3 odwroty -> budzet wyczerpany');
    const r2 = [{ id: 'a' }, { id: 'b', retreatedThisTurn: true }];
    const next = H.recordRetreatOnRoster(r2);
    assert(next === 2 && r2.every(u => u.odwrotyWTurze === 2), '1h: zapis odwrotu = +1 (od migrowanego maksimum 1) na calym rosterze');
    assert(r2.every(u => u.retreatedThisTurn === undefined), '1i: zapis czyści stary boolean (migracja w miejscu)');
    H.resetRetreatCountOfUnit(r2[0]);
    assert(r2[0].odwrotyWTurze === 0, '1j: reset licznika = 0');
  }

  // ---------- Czesc 2: applyPostBattleMap ----------
  // 2a) budzet niewyczerpany (licznik 0) -> ocalaly sie wycofuje (zyje), roster dostaje licznik.
  {
    const f = fieldFight(P, {});
    assert(!!at(f.units, 'd0'), '2a: ocalaly obrony zyje po odwrocie');
    assert(!f.res.defenderAnnihilatedByRetreatLimit, '2a: brak unicestwienia przy niewyczerpanym budzecie');
    assert(!at(f.units, 'd1'), '2a: polegly d1 usuniety');
  }
  // 2b) licznik 2 (dwa odwroty wykonane) -> trzeci odwrot dziala, licznik przechodzi na 3.
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22, { odwrotyWTurze: 2 });
    const d1 = U('d1', 1, 11, 22, { odwrotyWTurze: 2 });
    const units = [a0, d0, d1];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0, d1], winner: 'atakujacy',
      survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 37 }], exhausted: false });
    assert(!!at(units, 'd0') && !res.defenderAnnihilatedByRetreatLimit, '2b: trzeci odwrot (2->3) wykonany, ocaleli zyja');
    assert(at(units, 'd0').odwrotyWTurze === 3, '2b: licznik po trzecim odwrocie = 3');
  }
  // 2c) budzet wyczerpany (3 odwroty) -> kolejna przegrana = unicestwienie.
  {
    const f = fieldFight(P, { exhausted: true, d0Extra: { odwrotyWTurze: 3 } });
    assert(!at(f.units, 'd0'), '2c: po wyczerpaniu limitu ocaleli d0 ginie (unicestwienie)');
    assert(!at(f.units, 'd1'), '2c: d1 nadal martwy');
    assert(!!at(f.units, 'a0'), '2c: atakujacy zyje');
    assert(f.res.defenderAnnihilatedByRetreatLimit === true, '2c: wynik zglasza unicestwienie armii (flaga true)');
    assert(f.res.removedIds.includes('d0'), '2c: d0 w removedIds (sprzatanie po stronie wolajacego)');
  }
  // 2d) parytet AI: ten sam limit dla wlasciciela AI (ownerId 1 = obrona AI/barbarzynca w tescie).
  {
    const f = fieldFight(P, { defOwner: 2, exhausted: true, d0Extra: { odwrotyWTurze: 3 } });
    assert(!at(f.units, 'd0') && f.res.defenderAnnihilatedByRetreatLimit === true,
      '2d: parytet AI — obrona AI po wyczerpaniu limitu ginie');
  }
  // 2e) garnizon: obronca w garnizonie nie liczy odwrotu (licznik nie rosnie).
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22, { inGarnizon: true, odwrotyWTurze: 0 });
    const d1 = U('d1', 1, 11, 22, { inGarnizon: true });
    const units = [a0, d0, d1];
    run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0, d1], winner: 'atakujacy',
      survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 37 }], exhausted: false });
    assert(!!at(units, 'd0') && !at(units, 'd1'), '2e: garnizon — ocalaly garnizonu zyje, polegly d1 usuniety (bez unicestwienia)');
    assert(H.retreatCountOfUnit(at(units, 'd0')) === 0 && at(units, 'd0').odwrotyWTurze === 0,
      '2e: garnizon — licznik odwrotow nie jest zwiekszany (brak odwrotu do liczenia)');
  }
  // 2f) stary zapis: boolean retreatedThisTurn=true bez licznika -> liczony jako 1, nie wyczerpany.
  {
    const d0 = { id: 'd0', retreatedThisTurn: true };
    assert(!H.retreatBudgetExhausted([d0]), '2f: stary zapis boolean true = 1 odwrot, budzet nie wyczerpany');
  }

  // 2g) LUSTRO: atakujacy przegrywa po wyczerpaniu limitu (obrona wygrywa w polu) -> unicestwienie atakujacego.
  {
    const a0 = U('a0', 0, 11, 23, { odwrotyWTurze: 3 });
    const d0 = U('d0', 1, 11, 22);
    const units = [a0, d0];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'obronca',
      survivors: [{ id: 'd0', hp: 90 }, { id: 'a0', hp: 37 }], exhausted: false, atkExhausted: true });
    assert(!at(units, 'a0'), '2g: atakujacy po wyczerpaniu limitu ginie (unicestwienie armii)');
    assert(!!at(units, 'd0'), '2g: zwycieski obronca zyje');
    assert(res.attackerAnnihilatedByRetreatLimit === true, '2g: wynik zglasza unicestwienie atakujacego');
    assert(res.defenderAnnihilatedByRetreatLimit === false, '2g: brak falszywej flagi unicestwienia obrony');
    assert(res.removedIds.includes('a0'), '2g: a0 w removedIds');
  }
  // 2h) LUSTRO, budzet niewyczerpany: ocalaly atakujacego cofa sie (zyje) i licznik rosnie o 1.
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22);
    const units = [a0, d0];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'obronca',
      survivors: [{ id: 'd0', hp: 90 }, { id: 'a0', hp: 37 }], exhausted: false, atkExhausted: false });
    assert(!!at(units, 'a0') && res.attackerAnnihilatedByRetreatLimit === false,
      '2h: atakujacy po przegranej (budzet 0) — ocalaly zyje, brak unicestwienia');
    assert(at(units, 'a0').odwrotyWTurze === 1, '2h: odwrot ocalalego atakujacego liczy sie do limitu (licznik 0 -> 1)');
  }
  // 2i) LICZNIK ROSTERU = MAKSIMUM: jednostka świeża (0) przy jednostce z 3 odwrotami -> budzet wyczerpany.
  {
    assert(H.retreatBudgetExhausted([{ id: 'n', odwrotyWTurze: 0 }, { id: 'o', odwrotyWTurze: 3 }]),
      '2i: roster mieszany (0 + 3) -> budzet wyczerpany (maksimum)');
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22, { odwrotyWTurze: 0 });
    const d1 = U('d1', 1, 11, 22, { odwrotyWTurze: 3 });
    const units = [a0, d0, d1];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0, d1], winner: 'atakujacy',
      survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 37 }], exhausted: true });
    assert(!at(units, 'd0') && res.defenderAnnihilatedByRetreatLimit === true,
      '2i: swiezy obronca w armii z 3 odwrotami ginie razem z armia (unicestwienie)');
  }
  // 2j) REMIS: odwrot obroncow przy remisie NIE jest liczony i NIE unicestwia (zalozenie Operatora, decyzja 7).
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22);
    const units = [a0, d0];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'remis',
      survivors: [{ id: 'a0', hp: 40 }, { id: 'd0', hp: 40 }], exhausted: true, atkExhausted: true });
    assert(res.defenderAnnihilatedByRetreatLimit === false && res.attackerAnnihilatedByRetreatLimit === false,
      '2j: remis — brak unicestwienia (remis to nie przegrana)');
    assert(at(units, 'd0').odwrotyWTurze === undefined && at(units, 'a0').odwrotyWTurze === undefined,
      '2j: remis — licznik nie zmieniony (ZALOZENIE: remis nie jest odwrotem z dispatchu)');
  }

  // ---------- Czesc 3: pin tekstowy main.ts ----------
  const mainSrc = fs.readFileSync(path.join(ROOT, 'src', 'main.ts'), 'utf8');
  // Piny wiążą wyrażenie z KODEM (linia nieskomentowana), nie z samym tekstem w komentarzu.
  const codeLines = mainSrc.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l));
  const codeHas = re => codeLines.some(l => re.test(l));
  const codeBlock = (startRe, lines) => {
    const i = codeLines.findIndex(l => startRe.test(l));
    return i < 0 ? '' : codeLines.slice(i, i + lines).join('\n');
  };
  assert(codeHas(/const retreatExhaustedThisTurn = retreatBudgetExhausted\(defRosterRef\);/),
    '3a: main.ts: retreatExhaustedThisTurn liczony z licznika rosteru (retreatBudgetExhausted)');
  assert(codeHas(/^\s*recordRetreatOnRoster\(defRosterRef\);\s*$/),
    '3b: main.ts: po Wycofaj zapis odwrotu na rosterze obrony (recordRetreatOnRoster)');
  const eotBlock = codeBlock(/turn\+\+;/, 1) && mainSrc.slice(mainSrc.indexOf('// Restore movement for all units'), mainSrc.indexOf('// Restore movement for all units') + 4000);
  const eotCall = eotBlock.split('\n').find(l => /resetRetreatCountOfUnit\(u\);/.test(l) && !/^\s*\/\//.test(l));
  assert(!!eotCall && /for \(const u of units\)/.test(eotBlock.slice(0, eotBlock.indexOf('resetRetreatCountOfUnit(u);'))) ,
    '3c: main.ts: reset licznika w petli po units w EOT (nieskomentowany)');
  assert(codeHas(/defRetreatBudgetExhausted: !cityOnHex$/) && codeHas(/&& !allDefendersFortifiedInGarnizon\(defRoster\)$/)
    && codeHas(/&& retreatBudgetExhausted\(defRoster\),$/),
    '3d: main.ts: defRetreatBudgetExhausted = !miasto && !garnizon && retreatBudgetExhausted(defRoster) (dokladna forma)');
  assert(codeHas(/atkRetreatBudgetExhausted: !cityOnHex && retreatBudgetExhausted\(atkRoster\),/),
    '3g: main.ts: atkRetreatBudgetExhausted = !miasto && retreatBudgetExhausted(atkRoster) (lustro)');
  assert(codeHas(/showHintMessage\(playerArmyDestroyed \? ARMIA_UNICESTWIONA_KOMUNIKAT : ARMIA_WROGA_UNICESTWIONA_KOMUNIKAT/),
    '3e: main.ts: komunikat „Armia unicestwiona” (gracz) / wariant wrogi po unicestwieniu');
  assert(codeHas(/if \(postBattleRes\.defenderAnnihilatedByRetreatLimit \|\| postBattleRes\.attackerAnnihilatedByRetreatLimit\)/),
    '3h: main.ts: komunikat wywolywany dla obu stron (obrona i atak)');
  assert(!/u\.retreatedThisTurn = true/.test(mainSrc) && !/if \(u\.retreatedThisTurn\) u\.retreatedThisTurn = false/.test(mainSrc),
    '3f: main.ts: stare zapisy boolean nie są już ustawiane (migracja przez helper)');

  console.log(`battle-retreat-limit-test: ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
