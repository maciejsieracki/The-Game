'use strict';
/**
 * R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1 (runda 2) -- test SCENY, nie tylko modulu.
 *
 * Sprawdza realna sciezke rozstawienia i Reset (`_placeUnitsOneSide`, uzywana przez
 * `_resetDeploySide`) w BattleScene: generał armii atakującej dostaje sprite gwiazdki
 * jako dziecko swojej grupy po rozstawieniu, a zwykła jednostka -- nie dostaje.
 * Mutacja na KOPII zrodla (usuniecie wywolania `_attachCommanderStar` w ostatnim,
 * Resetowym miejscu budowy grupy) MUSI dac czerwony wynik.
 *
 * Uruchomienie: node tools/battle-commander-star-reset-test.cjs  (z katalogu gra/)
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const STAR_NAME_RE = /BATTLE_COMMANDER_STAR_NAME|commanderStar|gwiazd/i;
const RESET_CALL = 'this._attachCommanderStar(group, bu);';
let pass = 0;
let fail = 0;
function check(label, fn) {
  try { fn(); pass++; console.log('PASS:', label); }
  catch (e) { fail++; console.error('FAIL:', label, '--', e && e.message); }
}

/** Ładuje BattleScene z tymi samymi stubami co battle-pace-equal-line-live-test.cjs.
 *  `mutateResetPath`=true usuwa wywołanie gwiazdki w ostatnim miejscu budowy grupy (Reset). */
async function loadBattleScene(mutateResetPath) {
  const bundle = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: ROOT, sourcefile: 'battle-star-reset-entry.ts',
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
      if (mutateResetPath) {
        build.onLoad({ filter: /battleScene\.ts$/ }, args => {
          const src = fs.readFileSync(args.path, 'utf8');
          const at = src.lastIndexOf(RESET_CALL);
          assert.ok(at > 0, 'wywolanie gwiazdki nie znalezione');
          const mutated = src.slice(0, at) + src.slice(at + RESET_CALL.length);
          return { contents: mutated, loader: 'ts', resolveDir: path.dirname(args.path) };
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

/** Minimalny obiekt jednostki BattleUnit: generał (isArmyCommander) albo zwykły żołnierz. */
function bunit(id, commander) {
  return {
    id, nazwa: commander ? 'Wódz' : 'Wojownik', kategoria: commander ? 'dowodca' : 'miecznik',
    stats: { __mp: 2 }, hp: 100, maxHp: 100, ownerColor: 0x3060ff,
    isArmyCommander: commander === true, owner: 'atk',
  };
}

/** Składa scenę-stub i wywołuje realny Reset (_placeUnitsOneSide) dla strony atakującej. */
function runReset(BattleScene) {
  const scene = Object.create(BattleScene.prototype);
  const added = [];
  scene.scene = { add(obj) { added.push(obj); }, remove() {} };
  const blocked = new Set();
  scene.terrainMap = { passable: (c, r) => !blocked.has(`${c},${r}`), at: () => 'plains' };
  scene.occByKey = new Map();
  scene.ownedGeos = [];
  scene.ownedMats = [];
  scene.ownedMats = [];
  scene._deployMode = false;
  scene.deployPhase = true;
  scene.siegeWallCol = -1;
  scene._deployMeleeLines = 1;
  scene._deployArcherLines = 1;
  scene._playerControlSide = () => 'atk';
  scene._updateHpBar = scene._updateMoraleBar = scene._updateAmmoBar = () => {};
  scene._debugRecordSiegeColumns = scene._repositionSiegeAttackers = () => {};
  scene._placeSiegeDefenders = () => [];
  scene._showDeployFeedback = () => {};
  scene._savedAtkBUs = [bunit('wodz', true), bunit('zwykly-1', false), bunit('zwykly-2', false)];
  scene._savedDefBUs = [];
  scene.def = [];
  scene.atk = [];
  scene._placeUnitsOneSide('atk', false);
  return { scene, added };
}

/** Grupy jednostek = obiekty dodane do sceny, które mają dzieci (sprite gwiazdki jest dzieckiem grupy). */
function starsOf(group) {
  return (group.children || []).filter(c => STAR_NAME_RE.test(String(c.name || '')) || c.userData?.commanderStar === true);
}

async function main() {
  const BattleScene = await loadBattleScene(false);
  const { added } = runReset(BattleScene);
  const groups = added.filter(o => o && Array.isArray(o.children));
  check('Reset: scena dostaje grupy jednostek (realna _placeUnitsOneSide)', () => {
    assert.ok(groups.length >= 3, `grup: ${groups.length}`);
  });
  check('Reset: dokladnie jedna grupa z gwiazdka (generał) po rozstawieniu', () => {
    const withStar = groups.filter(g => starsOf(g).length > 0);
    assert.equal(withStar.length, 1, `z gwiazdka: ${withStar.length}`);
  });
  check('Reset: zwykle jednostki nie maja gwiazdki', () => {
    const plain = groups.filter(g => starsOf(g).length === 0);
    assert.equal(plain.length, groups.length - 1);
  });

  const mutatedScene = await loadBattleScene(true);
  const { added: addedMut } = runReset(mutatedScene);
  const groupsMut = addedMut.filter(o => o && Array.isArray(o.children));
  check('mutacja kopii (brak gwiazdki w Resecie) daje czerwono: zadnego generała ze gwiazdka', () => {
    const withStar = groupsMut.filter(g => starsOf(g).length > 0);
    assert.equal(withStar.length, 0, `z gwiazdka po mutacji: ${withStar.length}`);
  });

  console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; });
