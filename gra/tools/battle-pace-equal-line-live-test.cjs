'use strict';
/**
 * R-WEB-BATTLE-PACE-EQUAL-LINE-LIVE-BUG-Q1 (runda 2, decyzja wlasciciela 2026-11-13):
 * "rowne tempo" = w KAZDEJ turze marszu, do pierwszego wzwarcia, roznica miedzy najszybsza a najwolniejsza
 * jednostka armii (liczba przebytych hexow w turze) wynosi <= 1. Sufit obejmuje piechote, strzelcow,
 * konnice i machiny; armia to cala strona (dwie grupy, kilka rang), nie jedna ranga.
 * Symulacja headless na produkcyjnej petli tury (ta sama metoda co battle-line-advance-uniform-test.cjs).
 * Uruchom z gra/: node tools/battle-pace-equal-line-live-test.cjs
 *   MEASURE=1  -- tabele przebytych hexow per tura
 * Mutacje (kazda MUSI zaczerwienic test) sa sprawdzane w tym samym przebiegu -- patrz MUTATIONS.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');
const MAX_DIFF = 1;          // decyzja wlasciciela: roznica najszybsza-najwolniejsza <= 1 hex
const ROUNDS = 12;
const MARKER = '/*PACE_EXEMPT*/false';

/** exempt: wyrazenie (jednostka `u`) wstawiane w miejsce markera -- mutacja sufitu dla klasy. */
async function loadBattleScene(exempt) {
  const bundle = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: ROOT, sourcefile: 'battle-pace-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') },
    plugins: [{ name: 'stubs-and-mutation', setup(build) {
      const stubs = [
        [/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'],
        [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'],
        [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};'],
      ];
      for (const [filter, namespace, contents] of stubs) {
        build.onResolve({ filter }, args => ({ path: args.path, namespace }));
        build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' }));
      }
      if (exempt) {
        build.onLoad({ filter: /battleScene\.ts$/ }, args => {
          const src = fs.readFileSync(args.path, 'utf8');
          assert.ok(src.includes(MARKER), 'marker ' + MARKER + ' not found in battleScene.ts');
          return { contents: src.replace(MARKER, exempt), loader: 'ts', resolveDir: path.dirname(args.path) };
        });
      }
    } }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout,
  }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

const KINDS = {
  // rows: przesuniecia wierszy wzgledem frontu (konnica na skrzydlach, machiny z tylu w srodku -- bez kolizji pasow)
  infantry: { nazwa: 'Wojownik', kategoria: 'miecznik', mp: 2, rank: 0, qOff: 0, rows: [0, 1, 2, 3, 4, 5, 6, 7] },
  archer:   { nazwa: 'Lucznik', kategoria: 'lucznik', mp: 5, rank: 1, qOff: 6, rows: [0, 1, 2, 3, 4, 5, 6, 7], ranged: true },
  cavalry:  { nazwa: 'Konnica', kategoria: 'konnica', mp: 7, rank: 2, qOff: 0, rows: [-2, 9], mounted: true },
  siege:    { nazwa: 'Katapulta', kategoria: 'machina', mp: 7, rank: 3, qOff: 9, rows: [-1, 8], siege: true, ranged: true },
};

function unit(id, side, q, r, kind, group) {
  const k = KINDS[kind];
  const ranged = !!k.ranged;
  const bu = { id, nazwa: k.nazwa, kategoria: k.kategoria, stats: { __mp: k.mp }, hp: 100, maxHp: 100 };
  if (k.siege) bu['Rola (linia)'] = 'Oblężnicza';
  return {
    bu, q, r, side, kind, dead: false, fadingOut: false, removed: false, routed: false,
    mounted: !!k.mounted, rangedBase: ranged, primaryRanged: ranged, ranged,
    range: ranged ? 4 : 0, rangeBase: ranged ? 4 : 0, ammoLeft: ranged ? 10 : 0, ammoMax: ranged ? 10 : 0, moveLeft: k.mp,
    acted: false, morale: 100, moraleMax: 100, playerOrder: { type: 'none' },
    attackDirection: 'front', facing: side === 'atk' ? 'E' : 'W',
    groupId: group, formationRank: k.rank,
  };
}

/** Armia: dwie grupy (gorna/dolna polowa frontu), kazda z tym samym skladem; kolumny wg rangi. */
function army(side, q0, kinds, rows, rowStart) {
  const sign = side === 'atk' ? 1 : -1;
  const out = [];
  kinds.forEach(kind => {
    KINDS[kind].rows.forEach((off, n) => {
      const group = `${side}-${off < rows / 2 ? 'top' : 'bottom'}`;
      out.push(unit(`${side}-${kind}-${n}`, side, q0 - sign * KINDS[kind].qOff, rowStart + off, kind, group));
    });
  });
  return out;
}

function runSim(BattleScene, kinds, rounds = ROUNDS) {
  const rows = 8, rowStart = 20;
  const atk = army('atk', 10, kinds, rows, rowStart);
  const def = army('def', 70, kinds, rows, rowStart);
  const queue = [], frames = [];
  const snapshot = () => [...atk, ...def].map(u => ({ id: u.bu.id, side: u.side, kind: u.kind, q: u.q, r: u.r }));
  const scene = Object.create(BattleScene.prototype);
  Object.assign(scene, {
    atk, def, finished: false, started: true, busy: false, _battleAwaitingOrders: false,
    _manualMode: false, siegeWallCol: -1, roundNo: 0, activeSide: 'atk', turnOrder: [], turnIdx: 0,
    _deployPlayerSideOpt: 'atk', _autoBattleSuspended: false, _stallTurns: 0, _stallSig: '',
    _counterBudget: { beginTurn() {}, canCounter() { return true; }, spend() {}, consume() {} },
    _generalSettings: { blockadeActive: false, blockadeCol: null },
    _groupMeta: new Map(), _groups: new Map(), _selectedUnits: new Set(),
    _queuedOrderUnitIds: new Set(), log: [], vTimers: [], engaged: new Set(), routedUnits: [],
    _autoBatchResolutions: [], _autoBatchPending: 0, _autoBatchToken: 0, _autoBatchPhase: null,
    occByKey: new Map([...atk, ...def].map(u => [`${u.q},${u.r}`, u])),
    terrainMap: { passable: () => true, moveCost: () => 1, at: () => 0, combatTerrainName: () => 'Równina' }, terrainData: [],
    _targetPriorities: { mounted: ['melee'], ranged: ['melee'], melee: ['melee'] },
    _applyTerrainRange() {}, _updateFacing() {}, _updateMoraleBar() {}, _updateAmmoBar() {},
    _refreshQueuedOrderVisuals() {}, _updateBattlePhaseBanner() {}, _updateStallWatch() {},
    _disposeQueuedOrderArrows() {}, _syncAllGroupFrameMarkers() {}, hint: { textContent: '' },
    _priorityScore() { return 0; },
    vNow: 0, _battleStartVNow: 0, _destAllowedByBlockade() { return true; },
    _movementPointsFor(bu) { return (bu.stats && bu.stats.__mp) || 2; },
    _checkEnd() { if (frames.length <= this.roundNo) frames.push(snapshot()); return this.roundNo >= rounds; },
    _schedule(_d, cb) { if (this._autoBatchPlanning) cb(); else queue.push(cb); },
    _doMove(u, q, r, done) {
      if (this._autoBatchPlanning) return BattleScene.prototype._doMove.call(this, u, q, r, done);
      this.occByKey.delete(`${u.q},${u.r}`);
      u.q = q; u.r = r; u.moveLeft--;
      this.occByKey.set(`${q},${r}`, u);
      done();
    },
    _doAttack(u, target, done) { done(); },
  });
  queue.push(() => scene._beginTurn());
  let steps = 0;
  while (queue.length && steps < 1500000) { steps++; queue.shift()(); }
  return { frames };
}

/** Tury marszu do wzwarcia: pomiar tylko dopoki zadne dwie jednostki wrogich stron nie sa blizej niz 12 hexow. */
function perRoundTravel(frames, side) {
  const out = [];
  for (let k = 0; k + 1 < frames.length; k++) {
    const a = frames[k], b = frames[k + 1];
    const A = a.filter(u => u.side === 'atk'), D = a.filter(u => u.side === 'def');
    const minGap = Math.min(...A.flatMap(x => D.map(y => Math.abs(x.q - y.q) + Math.abs(x.r - y.r))));
    if (minGap < 12) break;
    const trav = {};
    const prev = new Map(a.map(u => [u.id, u]));
    for (const u of b.filter(x => x.side === side)) {
      const p = prev.get(u.id);
      const d = Math.abs(u.q - p.q) + Math.abs(u.r - p.r);
      (trav[u.kind] = trav[u.kind] || []).push(d);
    }
    const all = Object.values(trav).flat();
    out.push({ round: k + 1, min: Math.min(...all), max: Math.max(...all), diff: Math.max(...all) - Math.min(...all), trav });
  }
  return out;
}

const COMPOSITIONS = {
  infantry: ['infantry'],
  infantry_archers: ['infantry', 'archer'],
  infantry_archers_cavalry: ['infantry', 'archer', 'cavalry'],
  full_mixed: ['infantry', 'archer', 'cavalry', 'siege'],
};

function evaluate(BattleScene) {
  const res = [];
  for (const [name, kinds] of Object.entries(COMPOSITIONS)) {
    const { frames } = runSim(BattleScene, kinds);
    for (const side of ['atk']) {
      const rows = perRoundTravel(frames, side);
      if (process.env.MEASURE) {
        console.log(`\n== ${name} / ${side} (tur zmierzonych: ${rows.length})`);
        rows.forEach(r => console.log(`tura ${r.round}: min=${r.min} max=${r.max} roznica=${r.diff} ` +
          Object.entries(r.trav).map(([k, v]) => `${k}[${[...new Set(v)].join('/')}]`).join(' ')));
      }
      res.push({ name, side, rounds: rows.length, bad: rows.filter(r => r.diff > MAX_DIFF).length,
        maxDiff: rows.length ? Math.max(...rows.map(r => r.diff)) : -1 });
    }
  }
  return res;
}

const MUTATIONS = {
  'sufit wylaczony dla piechoty': '(!_u.mounted && !_u.rangedBase && !isSiegeUnit(_u.bu))',
  'sufit wylaczony dla strzelcow': '_u.rangedBase',
  'sufit wylaczony dla konnicy': '_u.mounted',
  'sufit wylaczony dla machin': 'isSiegeUnit(_u.bu)',
};

module.exports = { loadBattleScene, runSim, evaluate, COMPOSITIONS };

async function main() {
  const checks = [];
  const base = evaluate(await loadBattleScene(null));
  for (const r of base) {
    checks.push([`${r.name}/${r.side}: 0 z ${r.rounds} tur marszu z roznica > ${MAX_DIFF} hex (max roznica ${r.maxDiff})`,
      r.rounds >= 5 && r.bad === 0]);
  }
  for (const [label, pred] of Object.entries(MUTATIONS)) {
    const mutated = evaluate(await loadBattleScene(pred));
    const red = mutated.reduce((n, r) => n + r.bad, 0);
    checks.push([`mutacja "${label}" czerwieni test (tur z roznica > ${MAX_DIFF}: ${red})`, red > 0]);
  }
  let failed = 0;
  for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
  console.log(`=== battle-pace-equal-line-live-test: ${checks.length - failed} pass, ${failed} fail ===`);
  assert.equal(failed, 0, `${failed} check(s) failed`);
}
if (require.main === module) main().catch(e => { console.error(e.stack || e.message); process.exit(1); });
