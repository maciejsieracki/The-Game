'use strict';
/**
 * R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 (ETAP 2): zatrzask wzwarcia wrecz.
 * Regula wlasciciela (2026-11-13): rowne tempo marszu TYLKO do pierwszego wzwarcia wrecz; od tego
 * momentu cala armia jedzie wlasnym tempem. Test pilnuje, ze po zerwaniu kontaktu (wrog rozbity /
 * uciekl) sufity _paceCapFor i _lineAdvanceCap NIE wracaja.
 *
 * Uruchom z gra/: node tools/battle-pace-latch-test.cjs
 * Mutacja (MUSI zaczerwienic test): sufit odblokowany markerem /*MELEE_LATCH*\/ -> false.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');
const MARKER = '/*MELEE_LATCH*/';
const MARKER_LINE = '/*MELEE_LATCH_LINE*/';

async function loadBattleScene(mutate) {
  const bundle = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: ROOT, sourcefile: 'battle-latch-entry.ts',
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
      if (mutate) {
        build.onLoad({ filter: /battleScene\.ts$/ }, args => {
          let src = fs.readFileSync(args.path, 'utf8');
          // Bez markerow (kod bazowy bez zatrzasku) mutacja nie ma czego zamienic: test (a) i tak pada.
          if (!src.includes('this._meleeLatched ' + MARKER)) return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
          src = src.replace('this._meleeLatched ' + MARKER, 'false').replace('this._meleeLatched ' + MARKER_LINE, 'false');
          return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
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

/** Jednostka testowa: konnica (7 MP, mounted) albo piechota (2 MP). */
function unit(id, side, q, r, kind, group) {
  const mounted = kind === 'cavalry';
  return {
    bu: { id, nazwa: mounted ? 'Konnica' : 'Wojownik', kategoria: 'miecznik', stats: { __mp: mounted ? 7 : 2 }, hp: 100, maxHp: 100 },
    q, r, side, dead: false, fadingOut: false, removed: false, routed: false,
    mounted, rangedBase: false, ranged: false, range: 0, rangeBase: 0, ammoLeft: 0, ammoMax: 0, moveLeft: 0,
    acted: false, morale: 100, moraleMax: 100, playerOrder: { type: 'none' },
    groupId: group, formationRank: mounted ? 2 : 0,
  };
}

/** Styk: sasiedztwo 1 hex (przyblizenie testowe; produkcyjny _canAttackFrom tu nie jest potrzebny). */
function adjacent(a, b) {
  return Math.abs(a.q - b.q) <= 1 && Math.abs(a.r - b.r) <= 1 && !(a.q === b.q && a.r === b.r);
}

function makeScene(BattleScene, enemyQ) {
  const cav = unit('atk-cav-0', 'atk', 10, 20, 'cavalry', 'atk-g');
  const inf = unit('atk-inf-0', 'atk', 10, 22, 'infantry', 'atk-g');
  const en = unit('def-inf-0', 'def', enemyQ, 20, 'infantry', 'def-g');
  const scene = Object.create(BattleScene.prototype);
  Object.assign(scene, {
    atk: [cav, inf], def: [en], finished: false, started: true, siegeWallCol: -1, roundNo: 1,
    _paceCache: null, _lineCapCache: null, _lineAdvanceState: undefined, _meleeLatched: false,
    _effectiveMetaForUnit: () => ({ doctrine: 'steady' }),
    _movementPointsFor: bu => bu.stats.__mp,
    _canAttackFrom: (u, q, r) => {
      const foes = u.side === 'atk' ? [en] : [cav, inf];
      return foes.some(f => !f.dead && !f.routed && adjacent({ q, r }, f));
    },
  });
  return { scene, cav, inf, en };
}

(async () => {
  const BattleScene = await loadBattleScene(false);
  const results = [];
  const check = (name, fn) => { try { fn(); results.push([name, 'PASS']); } catch (e) { results.push([name, 'FAIL: ' + e.message.split('\n')[0]]); } };

  // (b) przed pierwszym wzwarciem tempo nadal rowne: sufit konnicy = pula piechoty (2 MP).
  check('(b) przed wzwarciem: sufit tempa konnicy = pula piechoty', () => {
    const { scene, cav } = makeScene(BattleScene, 40);
    assert.equal(scene._paceCapFor(cav), 2);
    assert.equal(scene._meleeLatched, false);
  });

  // (a) czerwony na bazie: kontakt, potem zerwanie kontaktu -> sufit NIE wraca.
  check('(a) po zerwaniu kontaktu konnica nie jest ucinana do tempa piechoty', () => {
    const { scene, cav, en } = makeScene(BattleScene, 11);
    assert.equal(scene._paceCapFor(cav), Number.POSITIVE_INFINITY, 'w kontakcie sufit = +inf');
    en.routed = true; en.q = 40; // wrog rozbity i odjechal: kontakt zanika
    scene.roundNo = 2;
    assert.equal(scene._paceCapFor(cav), Number.POSITIVE_INFINITY, 'po zerwaniu kontaktu sufit nadal +inf (zatrzask)');
  });

  check('(a2) zatrzask zdejmuje tez sufit natarcia rangi piechoty', () => {
    const { scene, cav, inf, en } = makeScene(BattleScene, 11);
    scene._paceCapFor(cav); // pierwsze wzwarcie (leniwy kontakt rundy 1)
    en.q = 40; en.routed = true; scene.roundNo = 2;
    assert.equal(scene._lineAdvanceCap(inf), Number.POSITIVE_INFINITY);
  });

  check('(a3) zatrzask z poczatku rundy (_refreshMeleeLatch) przezywa zerwanie kontaktu', () => {
    const { scene, cav, en } = makeScene(BattleScene, 11);
    if (typeof scene._refreshMeleeLatch !== 'function') throw new Error('brak _refreshMeleeLatch (sufit bez zatrzasku)');
    scene._refreshMeleeLatch();
    assert.equal(scene._meleeLatched, true);
    en.q = 40; en.routed = true; scene.roundNo = 2;
    assert.equal(scene._paceCapFor(cav), Number.POSITIVE_INFINITY);
  });

  check('(a4) brak kontaktu na poczatku bitwy -> zatrzask nie ustawia sie sam', () => {
    const { scene, cav } = makeScene(BattleScene, 40);
    scene._paceCapFor(cav);
    if (typeof scene._refreshMeleeLatch === 'function') scene._refreshMeleeLatch();
    assert.equal(scene._meleeLatched, false);
  });

  // Mutacja: MELEE_LATCH -> false musi zaczerwienic (a) i (a2).
  const mutantScene = await loadBattleScene(true);
  check('MUTACJA (oczekiwana czerwona): odblokowany sufit musi wykryc test (a)', () => {
    const { scene, cav, en } = makeScene(mutantScene, 11);
    scene._paceCapFor(cav);
    en.q = 40; en.routed = true; scene.roundNo = 2;
    assert.equal(scene._paceCapFor(cav), Number.POSITIVE_INFINITY);
  });

  const real = results.filter(r => !r[0].startsWith('MUTACJA'));
  const mutantRes = results.find(r => r[0].startsWith('MUTACJA'));
  for (const [name, res] of results) {
    console.log(`${res === 'PASS' ? 'ok  ' : 'FAIL'} ${name}${res === 'PASS' ? '' : ' -- ' + res.slice(6)}`);
  }
  const pass = real.filter(r => r[1] === 'PASS').length;
  const fail = real.length - pass;
  const detected = mutantRes[1] !== 'PASS';
  console.log(`=== battle-pace-latch-test: ${pass}/${real.length} pass, ${fail} fail; mutacja MELEE_LATCH ${detected ? 'wykryta (czerwona)' : 'NIE wykryta'} ===`);
  if (fail > 0 || !detected) process.exitCode = 1;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
