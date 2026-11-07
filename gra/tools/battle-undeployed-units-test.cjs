'use strict';
/**
 * R-WEB-BATTLE-UNDEPLOYED-UNITS-LOST-Q1
 * Niezmiennik: jednostki spoza limitu pola bitwy (MAX_PER_SIDE=120) NIE znikaja po bitwie.
 * node gra/tools/battle-undeployed-units-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.undeployed-entry.ts');
const BUNDLE = path.join(__dirname, '.undeployed-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { applyPostBattleMap, battleReserveNotice } from '../src/game/post-battle-map';
export { buildBattleEventLog } from '../src/units/battleRoster';
`);
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, logLevel: 'silent' });
const { applyPostBattleMap, battleReserveNotice, buildBattleEventLog } = require(BUNDLE);
fs.unlinkSync(ENTRY);
fs.unlinkSync(BUNDLE);

let pass = 0;
let fail = 0;
function assert(c, m) {
  if (c) pass++;
  else { fail++; console.error('FAIL:', m); }
}

const CAP = 120;
const isPassableHex = () => true;

function mk(prefix, owner, n, q, r) {
  return Array.from({ length: n }, (_, i) => ({
    id: prefix + i, ownerId: owner, typeId: 'Wojownik', category: 'piechota',
    q, r, hp: 100, ruchLeft: 2, battlesSurvived: 0,
  }));
}

// Symuluje sciezke reczna: BattleScene wystawia pierwsze CAP z kazdej strony,
// zwraca survivors (ocalali z wystawionych) i eventLog (tylko wystawieni).
function runManual({ nAtk, nDef, atkSurvive, defSurvive, winner, useDeployedLog, cityDefense }) {
  const atk = mk('a', 0, nAtk, 10, 10);
  const def = mk('d', 1, nDef, 11, 10);
  const units = [...atk, ...def];
  const atkDeployed = atk.slice(0, CAP);
  const defDeployed = def.slice(0, CAP);
  const survivors = [...atkDeployed.slice(0, atkSurvive), ...defDeployed.slice(0, defSurvive)]
    .map(u => ({ id: u.id, hp: 100 }));
  const log = useDeployedLog
    ? buildBattleEventLog(atkDeployed, defDeployed)
    : buildBattleEventLog(atk, def); // zachowanie sprzed poprawki (main.ts ignorowal res.eventLog)
  const city = cityDefense ? { id: 'c1', ownerId: 1, q: 11, r: 10, name: 'X' } : null;
  applyPostBattleMap({
    units, map: { hexes: {} }, cities: city ? [city] : [], battleQ: 11, battleR: 10,
    atkAnchor: atk[0], atkRoster: atk, defRoster: def,
    atkStart: new Map(atk.map(u => [u.id, { q: 10, r: 10 }])),
    winner, battleEventLog: log,
    manualSurvivors: survivors,
    getDef: () => ({ health: 100 }), maxHpOf: () => 100,
    isPassableHex, isUnitAt: () => false, cityOnBattleHex: city,
  });
  return {
    units,
    own: units.filter(u => u.ownerId === 0),
    enemy: units.filter(u => u.ownerId === 1),
    atk, def,
  };
}

// 1) Bitwa reczna: gracz atakuje 300 vs 200, 100 z 120 wystawionych przezywa, wygrywa.
{
  const r = runManual({ nAtk: 300, nDef: 200, atkSurvive: 100, defSurvive: 0, winner: 'atakujacy', useDeployedLog: true });
  assert(r.own.length === 300 - 20, `reczna atak: 300-20=280 (jest ${r.own.length})`);
  assert(r.enemy.length === 200 - 120, `reczna atak: wrog traci tylko wystawionych (zostaje ${r.enemy.length}, oczek. 80)`);
  assert(r.atk.slice(120).every(u => r.units.includes(u) && u.hp === 100), 'niewystawieni atakujacy: te same ID i pelne HP');
  assert(r.def.slice(120).every(u => r.units.includes(u) && u.hp === 100), 'niewystawieni obroncy: nietknieci');
}
// 2) Obrona miasta: obronca (300) wygrywa z atakujacym (200); rezerwa obu stron nietknieta.
// (Przy WYGRANEJ atakujacego istniejaca regula wipeDefenderOnCityCenter usuwa cala zaloge miasta
// -- rowniez ocalalych -- to zasada zdobycia miasta, nie ta usterka; patrz raport.)
{
  const r = runManual({ nAtk: 200, nDef: 300, atkSurvive: 0, defSurvive: 50, winner: 'obronca', useDeployedLog: true, cityDefense: true });
  assert(r.enemy.length === 300 - 70, `obrona miasta: obronca 300-70=230 (jest ${r.enemy.length})`);
  assert(r.own.length === 200 - 120 && r.atk.slice(120).every(u => r.units.includes(u)), 'obrona miasta: atakujacy traci tylko 120 wystawionych');
  assert(r.def.slice(120).every(u => r.units.includes(u) && u.hp === 100), 'obrona miasta: rezerwa obroncy zachowana (ten sam ID, pelne HP)');
}
// 3) Przegrana atakujacego: odwrot na heks startowy, rezerwa nie ginie
{
  const r = runManual({ nAtk: 300, nDef: 200, atkSurvive: 10, defSurvive: 90, winner: 'obronca', useDeployedLog: true });
  assert(r.own.length === 300 - 110, `przegrana: 300-110=190 (jest ${r.own.length})`);
  assert(r.atk.slice(120).every(u => r.units.includes(u) && u.q === 10 && u.r === 10), 'przegrana: rezerwa zostaje na hexie startowym');
}
// 4) Remis
{
  const r = runManual({ nAtk: 300, nDef: 200, atkSurvive: 60, defSurvive: 60, winner: 'remis', useDeployedLog: true });
  assert(r.own.length === 300 - 60 && r.enemy.length === 200 - 60, 'remis: tylko straty wystawionych');
}
// 5) Dokumentacja mechanizmu bledu: pelny log (stara sciezka) kasuje rezerwe
{
  const r = runManual({ nAtk: 300, nDef: 200, atkSurvive: 100, defSurvive: 0, winner: 'atakujacy', useDeployedLog: false });
  assert(r.own.length === 100, `mechanizm bledu: pelny log kasuje rezerwe (zostalo ${r.own.length} == 100)`);
}
// 6) Bitwa automatyczna (bez limitu 120, pelny sklad w logu): straty procentowe
// dotykaja calego skladu, takze jednostek o indeksie >=120. Brak wystawiania w auto.
{
  const mkAuto = () => {
    const atk = mk('a', 0, 300, 10, 10);
    const def = mk('d', 1, 200, 11, 10);
    return { atk, def, units: [...atk, ...def] };
  };
  const runAuto = (env, lossAtkPct, lossDefPct) => {
    applyPostBattleMap({
      units: env.units, map: { hexes: {} }, cities: [], battleQ: 11, battleR: 10,
      atkAnchor: env.atk[0], atkRoster: env.atk, defRoster: env.def,
      atkStart: new Map(env.atk.map(u => [u.id, { q: 10, r: 10 }])),
      winner: 'atakujacy', lossAtkPct, lossDefPct,
      battleEventLog: buildBattleEventLog(env.atk, env.def),
      getDef: () => ({ health: 100 }), maxHpOf: () => 100,
      isPassableHex, isUnitAt: () => false,
    });
    return env.units;
  };
  // 6a) 0% strat -> nikt nie ginie i nikt nie traci HP
  const e0 = mkAuto();
  runAuto(e0, 0, 0);
  assert(e0.units.filter(u => u.ownerId === 0).length === 300, 'auto 0%: 300 zostaje');
  assert(e0.units.every(u => u.hp === 100), 'auto 0%: pelne HP');
  // 6b) 60% strat atakujacego -> straty realne i rozlozone na caly sklad (>=120)
  const e1 = mkAuto();
  const before = e1.atk.map(u => u.hp);
  runAuto(e1, 0.6, 0); // lossAtkPct to ulamek (0..1), jak w auto-battle-power.ts
  const aliveOwn = e1.units.filter(u => u.ownerId === 0);
  const dead = 300 - aliveOwn.length;
  const hpLoss = e1.atk.reduce((a, u, i) => a + (before[i] - (u.hp ?? 0)), 0);
  assert(dead > 0 || hpLoss > 0, `auto 60%: sa realne straty (dead=${dead}, hpLoss=${hpLoss})`);
  assert(dead < 300, `auto 60%: nie wszyscy gina (dead=${dead})`);
  assert(aliveOwn.length === 300 - dead, 'auto 60%: suma = 300 - straty');
  const hitBeyondCap = e1.atk.slice(120).some((u, i) => {
    const idx = 120 + i;
    return !e1.units.includes(u) || u.hp < before[idx];
  });
  assert(hitBeyondCap, 'auto 60%: straty dotykaja jednostek spoza limitu 120 (pelny sklad, bez ciecia)');
  assert(e1.def.every(u => e1.units.includes(u) && u.hp === 100), 'auto 60%: obrona nietknieta gdy lossDefPct=0');
}
// 7) Weterani: rezerwa nie dostaje wygranej
{
  const r = runManual({ nAtk: 300, nDef: 200, atkSurvive: 100, defSurvive: 0, winner: 'atakujacy', useDeployedLog: true });
  assert(r.atk.slice(0, 100).every(u => u.battlesSurvived === 1), 'weterani: walczacy +1');
  assert(r.atk.slice(120).every(u => (u.battlesSurvived ?? 0) === 0), 'weterani: rezerwa bez +1');
}
// 8) Komunikat o rezerwie
assert(battleReserveNotice(300, 200, 120, 'atk') === '180 jednostek w rezerwie (nie wejdą do bitwy)', 'komunikat gracz-atakujacy');
assert(battleReserveNotice(100, 200, 120, 'def') === '80 jednostek w rezerwie (nie wejdą do bitwy)', 'komunikat gracz-obronca');
assert(battleReserveNotice(100, 100, 120, 'atk') === '', 'brak komunikatu bez rezerwy');
assert(battleReserveNotice(300, 100, 120, 'def') === '', 'brak komunikatu gdy rezerwa tylko u wroga');

// 9) Kontrakt zrodlowy: kazda sciezka RECZNA przekazuje res.eventLog do mapy
const src = (f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');
const main = src('main.ts');
const mfb = src('battle/mapFieldBattle.ts');
function manualCalls(text) {
  const out = [];
  const re = /applyMapBattleOutcomeWithSummary\(\s*[^;]*?res\.survivors,\s*\{/g;
  let m;
  while ((m = re.exec(text))) out.push(text.slice(m.index, m.index + 700));
  return out;
}
const calls = [...manualCalls(main), ...manualCalls(mfb)];
assert(calls.length >= 3 && /res\.survivors,\s*battleOpts/.test(main), `znaleziono >=3 reczne wywolania z literalem opts + siege battleOpts (jest ${calls.length})`);
for (const [i, c] of calls.entries()) {
  assert(/battleEventLog:\s*res\.eventLog/.test(c), `reczne wywolanie #${i + 1} przekazuje res.eventLog`);
}
assert(/battleEventLog:\s*res\.eventLog\s*\?\?/.test(main), 'oblezenie: eventLog z wyniku');
// 10) Kontrakt zrodlowy: log bitwy (onFinish) budowany z WYSTAWIONYCH (this.atk/this.def
// z tablic ciętych do MAX_PER_SIDE), a nie z calego skladu.
const scene = src('battle/battleScene.ts');
assert(/const atkArr = attackers\.slice\(0, MAX_PER_SIDE\);/.test(scene), 'battleScene: atkArr ciety do MAX_PER_SIDE');
assert(/const defArr = defenders\.slice\(0, MAX_PER_SIDE\);/.test(scene), 'battleScene: defArr ciety do MAX_PER_SIDE');
assert(/eventLog:\s*buildBattleEventLog\(\s*this\.atk\.map\(u => u\.bu\),\s*this\.def\.map\(u => u\.bu\),?\s*\)/.test(scene), 'battleScene: eventLog z this.atk/this.def (wystawieni)');

// 11) Komunikat o rezerwie musi byc NAD pelnoekranowa scena bitwy (.overlay z-index 9999):
// hint ma z-index 10030 gdy aboveBattle, a obie sciezki reczne przekazuja ten flag.
assert(/aboveBattle \? '10030'/.test(main), 'hint: aboveBattle -> z-index 10030 (ponad scene bitwy 9999)');
assert((main.match(/showHintMessage\(reserveNote, 5000, undefined, true\)/g) || []).length === 2, 'main.ts: 2 komunikaty o rezerwie z aboveBattle=true');
assert(/deps\.showHint\(note, 5000, true\)/.test(mfb), 'mapFieldBattle: komunikat o rezerwie z aboveBattle=true');

console.log(`battle-undeployed-units-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
