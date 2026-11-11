'use strict';
/**
 * R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1
 * node gra/tools/battle-defeat-survivor-retreat-two-hex-test.cjs
 * Ocalali przegranej strony cofaja sie o 2 heksy od zwyciezcy (nie znikaja); polegli usuwani.
 * Czesc 1: prawdziwy applyPostBattleMap (auto/manual, atakujacy/obronca, krawedzie).
 * Czesc 2: prawdziwy BattleScene._battleUnitsForMapExport (ocalali przegranych w wyniku bitwy).
 */
const path = require('path');
const vm = require('vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }

async function bundle(contents, name, extra) {
  const r = await esbuild.build({
    stdin: { contents, resolveDir: ROOT, sourcefile: name },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') },
    plugins: extra ? [extra] : [], write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(r.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: name });
  return module.exports;
}

const stubs = { name: 'stub', setup(build) {
  const entries = [
    [/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'],
    [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'],
    [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};'],
  ];
  for (const [filter, namespace, contents] of entries) {
    build.onResolve({ filter }, a => ({ path: a.path, namespace }));
    build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' }));
  }
} };

const U = (id, owner, q, r, extra) => Object.assign({ id, ownerId: owner, typeId: 'Wojownik', q, r, ruchLeft: 2, hp: 100 }, extra || {});
const at = (units, id) => units.find(u => u.id === id);

function run(P, o) {
  const units = o.units;
  return P.applyPostBattleMap({
    units, map: { hexes: {} }, cities: o.cities || [],
    battleQ: o.bq, battleR: o.br,
    atkAnchor: o.atk[0], atkRoster: o.atk, defRoster: o.def,
    atkStart: new Map(o.atk.map(u => [u.id, { q: u.q, r: u.r }])),
    winner: o.winner, lossAtkPct: o.lossAtkPct, lossDefPct: o.lossDefPct,
    manualSurvivors: o.survivors,
    battleEventLog: o.log,
    getDef: () => ({ health: 100, 'Rola (linia)': 'Wręcz' }), maxHpOf: () => 100,
    isPassableHex: o.pass || (() => true),
    isUnitAt: (q, r, ex) => units.some(u => u.id !== ex && u.q === q && u.r === r),
    cityOnBattleHex: o.cityOnBattleHex || null,
  });
}

async function main() {
  const P = await bundle("export * from './src/game/post-battle-map';", 'pb-entry.ts');
  const dist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;

  // 1) MANUAL, atakujacy wygrywa: obroncy na heksie bitwy (11,22), atak z poludnia (11,23).
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22, { isGeneral: true, battlesSurvived: 2, hp: 100 });
    const d1 = U('d1', 1, 11, 22);
    const units = [a0, d0, d1];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0, d1], winner: 'atakujacy',
      survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 37 }] });
    assert(!at(units, 'd1'), '1: polegly d1 usuniety');
    const d = at(units, 'd0');
    assert(!!d, '1: ocalaly d0 nie znika');
    assert(d && dist(d, { q: 11, r: 22 }) === 2, '1: d0 o 2 heksy od heksu bitwy, jest ' + (d && d.q + ',' + d.r));
    assert(d && d.r === 20, '1: cofniecie od atakujacego (polnoc), r=' + (d && d.r));
    assert(d && d.hp === 37 && d.isGeneral === true && d.battlesSurvived === 2 && d.id === 'd0', '1: HP/general/doswiadczenie zachowane');
    assert(at(units, 'a0').q === 11 && at(units, 'a0').r === 22, '1: zwyciezca zajmuje heks bitwy');
    assert(res.retreatedTwoHexIds.includes('d0'), '1: raport retreatedTwoHexIds');
  }

  // 2) MANUAL, obronca wygrywa: ocalali atakujacy (rozbici, hp>0) cofaja sie o 2 heksy; martwy znika.
  {
    const a0 = U('a0', 0, 11, 23);
    const a1 = U('a1', 0, 11, 23);
    const a2 = U('a2', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22);
    const units = [a0, a1, a2, d0];
    run(P, { units, bq: 11, br: 22, atk: [a0, a1, a2], def: [d0], winner: 'obronca',
      survivors: [{ id: 'd0', hp: 80 }, { id: 'a0', hp: 5 }, { id: 'a1', hp: 12 }] });
    assert(!at(units, 'a2'), '2: polegly a2 usuniety');
    for (const id of ['a0', 'a1']) {
      const u = at(units, id);
      assert(u && dist(u, { q: 11, r: 22 }) === 2, '2: ' + id + ' o 2 heksy od bitwy');
    }
    assert(at(units, 'a0').q === at(units, 'a1').q && at(units, 'a0').r === at(units, 'a1').r, '2: stos zostaje razem');
    assert(at(units, 'a0').hp === 5 && at(units, 'a1').hp === 12, '2: niskie HP zachowane (nie pelne)');
    assert(at(units, 'd0').q === 11 && at(units, 'd0').r === 22, '2: obronca trzyma pozycje');
  }

  // 3) AUTO (lossPct, bez survivors) - ocalali przegranych cofaja sie, polegli usuwani wg % strat.
  {
    const a0 = U('a0', 0, 11, 23);
    const d = [U('d0', 1, 11, 22), U('d1', 1, 11, 22), U('d2', 1, 11, 22, { hp: 1 }), U('d3', 1, 11, 22, { hp: 1 })];
    const units = [a0, ...d];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: d, winner: 'atakujacy', lossAtkPct: 0.1, lossDefPct: 0.5 });
    const alive = d.filter(x => at(units, x.id));
    assert(alive.length > 0 && alive.length < 4, '3: czesc zywa, czesc polegla (zywych ' + alive.length + ')');
    assert(res.removedIds.length === 4 - alive.length, '3: removedIds = polegli');
    for (const x of alive) assert(dist(x, { q: 11, r: 22 }) === 2, '3: ocalaly ' + x.id + ' o 2 heksy');
  }

  // 4) Krawedz: cel (2. heks) nieprzechodni -> brak trasy 2 heksow; zachowanie dotychczasowe, BEZ kasacji/teleportu.
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22);
    const units = [a0, d0];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'atakujacy',
      survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 40 }], pass: (q, r) => !(q === 13 && r === 20) });
    const d = at(units, 'd0');
    assert(!!d, '4: jednostka nie skasowana');
    assert(d && dist(d, { q: 11, r: 22 }) <= 1, '4: bez trasy 2-heksowej: zachowanie dotychczasowe (<=1), jest ' + (d && d.q + ',' + d.r));
    assert(res.retreatNoTwoHexRouteIds.includes('d0') && !res.retreatedTwoHexIds.includes('d0'), '4: raport retreatNoTwoHexRouteIds');
  }

  // 5) Krawedz: pierwszy heks nieprzechodni -> brak skoku nad nim.
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22);
    const units = [a0, d0];
    run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'atakujacy',
      survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 40 }], pass: (q, r) => !(q === 12 && r === 21) });
    const d = at(units, 'd0');
    assert(d && !(d.q === 13 && d.r === 20), '5: nie przeskakuje nieprzechodniego heksu posredniego');
  }

  // 6) Krawedz: cel zajety / posrednik zajety przez obca jednostke -> brak 2-heks, bez nakladania.
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22);
    const blocker = U('blk', 2, 13, 20);
    const units = [a0, d0, blocker];
    run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'atakujacy', survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 40 }] });
    const d = at(units, 'd0');
    assert(d && !(d.q === 13 && d.r === 20), '6: nie wchodzi na zajety heks');
    const a1 = U('a1', 0, 11, 23);
    const e0 = U('e0', 1, 11, 22);
    const foe = U('foe', 0, 12, 21);
    const units2 = [a1, e0, foe];
    run(P, { units: units2, bq: 11, br: 22, atk: [a1], def: [e0], winner: 'atakujacy', survivors: [{ id: 'a1', hp: 90 }, { id: 'e0', hp: 40 }] });
    const e = at(units2, 'e0');
    assert(e && !(e.q === 12 && e.r === 21), '6: nie wchodzi na wrogi heks');
  }

  // 7) Krawedz: miasto zwyciezcy jako cel -> nie wchodzi.
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22);
    const units = [a0, d0];
    run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'atakujacy', cities: [{ id: 'c', ownerId: 0, q: 13, r: 20, name: 'W' }],
      survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 40 }] });
    const d = at(units, 'd0');
    assert(d && !(d.q === 13 && d.r === 20), '7: nie cofa sie do miasta zwyciezcy');
  }

  // 8) Oblezenie: oblegajacy (oblegaCityId) przegrywa szturm -> zostaje na pozycji blokady, nie znika.
  {
    const a0 = U('a0', 0, 11, 23, { oblegaCityId: 'cX' });
    const d0 = U('d0', 1, 11, 22);
    const units = [a0, d0];
    const res8 = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'obronca', survivors: [{ id: 'd0', hp: 90 }, { id: 'a0', hp: 20 }] });
    const a = at(units, 'a0');
    assert(a && a.q === 11 && a.r === 23 && a.hp === 20, '8: oblegajacy zostaje na pozycji blokady z HP');
    assert(res8.retreatNoTwoHexRouteIds.includes('a0') && !res8.retreatedTwoHexIds.includes('a0'), '8: oblegajacy raportowany w retreatNoTwoHexRouteIds');
  }

  // 9) Rezerwy: jednostka poza logiem zdarzen (rezerwa) nie ginie.
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22);
    const dres = U('dres', 1, 11, 22);
    const units = [a0, d0, dres];
    run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0, dres], winner: 'atakujacy',
      log: { attackerUnitIds: ['a0'], defenderUnitIds: ['d0'] }, survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 40 }] });
    assert(!!at(units, 'dres'), '9: rezerwa nie ginie');
    assert(dist(at(units, 'dres'), { q: 11, r: 22 }) === 2, '9: rezerwa cofa sie ze stosem');
  }

  // 10) Zapis/wczytanie po odwrocie.
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22, { isGeneral: true, battlesSurvived: 1 });
    const units = [a0, d0];
    run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'atakujacy', survivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 33 }] });
    const back = JSON.parse(JSON.stringify(units));
    assert(at(back, 'd0').q === at(units, 'd0').q && at(back, 'd0').hp === 33 && at(back, 'd0').isGeneral === true, '10: save/load po odwrocie');
  }

  // 11) Remis: bez odwrotu 2-heksowego.
  {
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22);
    const units = [a0, d0];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'remis', survivors: [{ id: 'a0', hp: 50 }, { id: 'd0', hp: 50 }] });
    assert(res.retreatedTwoHexIds.length === 0, '11: remis nie uzywa odwrotu 2-heksowego');
  }

  // 12) Oblezenie, realna geometria: miasto obroncy na heksie bitwy (cityOnBattleHex), wygrywa atakujacy.
  //     Garnizon NA centrum miasta jest kasowany (istniejaca zasada zdobycia miasta, poza zakresem tematu --
  //     decyzja ABC); obroncy POZA centrum (heks obok) cofaja sie o 2 heksy; oblegajacy z oblegaCityId
  //     wchodzi na heks bitwy; miasto (cudze dla przegranych poza centrum nie liczy sie) nie jest celem.
  {
    const city = { id: 'cD', ownerId: 1, q: 11, r: 22, name: 'D' };
    const a0 = U('a0', 0, 11, 23, { oblegaCityId: 'cD' });
    const gar = U('gar', 1, 11, 22);
    const out0 = U('out0', 1, 10, 22);
    const units = [a0, gar, out0];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [gar, out0], winner: 'atakujacy',
      cities: [city], cityOnBattleHex: { q: 11, r: 22 },
      survivors: [{ id: 'a0', hp: 80 }, { id: 'gar', hp: 30 }, { id: 'out0', hp: 30 }] });
    assert(!at(units, 'gar'), '12: garnizon na centrum miasta kasowany (istniejaca zasada zdobycia miasta)');
    const o = at(units, 'out0');
    assert(!!o, '12: obronca poza centrum nie znika');
    assert(o && dist(o, { q: 11, r: 22 }) === 2, '12: obronca poza centrum o 2 heksy, jest ' + (o && o.q + ',' + o.r));
    assert(!(o && o.q === 11 && o.r === 22), '12: nie wraca na centrum miasta');
    assert(res.retreatedTwoHexIds.includes('out0'), '12: out0 w retreatedTwoHexIds');
  }

  // 13) Oblezenie, przegrany szturm: miasto obroncy (wlasne dla obroncy) nie jest legalnym celem odwrotu
  //     atakujacych (cudze miasto) -- atakujacy bez oblegaCityId; start sasiaduje z bitwa, cel odwrotu = miasto wroga.
  {
    const city = { id: 'cE', ownerId: 1, q: 11, r: 24, name: 'E' };
    const a0 = U('a0', 0, 11, 23);
    const d0 = U('d0', 1, 11, 22);
    const units = [a0, d0];
    const res = run(P, { units, bq: 11, br: 22, atk: [a0], def: [d0], winner: 'obronca', cities: [city],
      survivors: [{ id: 'd0', hp: 90 }, { id: 'a0', hp: 20 }] });
    const a = at(units, 'a0');
    assert(a && !(a.q === 11 && a.r === 24), '13: atakujacy nie cofa sie do cudzego miasta');
    assert(a && res.retreatNoTwoHexRouteIds.includes('a0'), '13: brak trasy raportowany, nie skasowany/teleportowany');
  }

  // Czesc 2: eksport ocalalych z bitwy (BattleScene) -- przegrani z HP>0 wracaja na mape.
  {
    const { BattleScene } = await bundle("import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", 'bs-entry.ts', stubs);
    const mk = (id, hp, dead, routed) => ({ bu: { id, hp, maxHp: 100 }, dead, routed });
    const roster = [mk('w1', 60, false, false), mk('l_routed', 30, true, true), mk('l_alive', 10, false, false), mk('l_dead', 0, true, false)];
    const out = BattleScene.prototype._battleUnitsForMapExport.call({}, roster).map(u => u.id);
    assert(out.includes('l_routed') && out.includes('l_alive') && out.includes('w1'), 'BS: ocalali (w tym rozbici) eksportowani');
    assert(!out.includes('l_dead'), 'BS: polegly (hp 0) nie eksportowany');
  }

  console.log('battle-defeat-survivor-retreat-two-hex-test: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
