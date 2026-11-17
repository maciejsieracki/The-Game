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
    plugins: [require('./lib/esbuild-raw-plugin.cjs'), { name: 'stubs-and-mutation', setup(build) {
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

/** Składa scenę-stub: rozstawienie strony atakującej przez realne ścieżki BattleScene. */
function makeScene(BattleScene) {
  const scene = Object.create(BattleScene.prototype);
  const added = [];
  scene.scene = { add(obj) { added.push(obj); }, remove() {} };
  const blocked = new Set();
  scene.terrainMap = { passable: (c, r) => !blocked.has(`${c},${r}`), at: () => 'plains' };
  scene.occByKey = new Map();
  scene.ownedGeos = [];
  scene.ownedMats = [];
  scene._groups = new Map();
  scene._groupCounter = 0;
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
  scene._clearAllSelection = scene._clearDeploySelection = () => {};
  scene._rebuildDeployRosterGrid = scene._updateDeployRosterHeader = () => {};
  scene._savedAtkBUs = [bunit('wodz', true), bunit('zwykly-1', false), bunit('zwykly-2', false)];
  scene._savedDefBUs = [];
  scene.def = [];
  scene.atk = [];
  return { scene, added };
}

/** Generał = jednostka roster z isArmyCommander; sprawdza gwiazdkę jako dziecko JEJ grupy. */
function rosterStarState(scene) {
  const roster = scene.atk.filter(ru => !ru.removed);
  return {
    total: roster.length,
    commanderStars: roster.filter(ru => ru.isArmyCommander && starsOf(ru.group).length === 1).length,
    plainStars: roster.filter(ru => !ru.isArmyCommander && starsOf(ru.group).length > 0).length,
    starsOutsideGroup: roster.reduce((n, ru) => n + (starsOf(ru.group).some(st => st.parent !== ru.group) ? 1 : 0), 0),
  };
}

/** Sekwencja z DODATKU 1 pkt 2: rozstaw -> Reset -> ruch grupy (render) -> Reset. */
function runSequence(BattleScene, mutate) {
  const { scene } = makeScene(BattleScene);
  const steps = [];
  scene._placeUnitsOneSide('atk', false);
  steps.push(['rozstawienie', rosterStarState(scene)]);
  scene._resetDeploySide('atk');
  steps.push(['Reset #1', rosterStarState(scene)]);
  for (const ru of scene.atk) ru.group.position.x += 2; // przesunięcie grupy, gwiazdka ma podążać (dziecko)
  steps.push(['po ruchu', rosterStarState(scene)]);
  scene._resetDeploySide('atk');
  steps.push(['Reset #2', rosterStarState(scene)]);
  return steps;
}

/** Grupy jednostek = obiekty dodane do sceny, które mają dzieci (sprite gwiazdki jest dzieckiem grupy). */
function starsOf(group) {
  return (group.children || []).filter(c => STAR_NAME_RE.test(String(c.name || '')) || c.userData?.commanderStar === true);
}

async function main() {
  const BattleScene = await loadBattleScene(false);
  const steps = runSequence(BattleScene, false);
  const byLabel = Object.fromEntries(steps);
  for (const [label, st] of steps) {
    check(`${label}: dokladnie jeden generał ze gwiazdka, zwykle bez`, () => {
      assert.equal(st.commanderStars, 1, `generał z gwiazdka: ${st.commanderStars}`);
      assert.equal(st.plainStars, 0, `zwykle ze gwiazdka: ${st.plainStars}`);
      assert.equal(st.total, 3, `jednostek w armii: ${st.total}`);
    });
    check(`${label}: gwiazdka jest dzieckiem grupy (podąża za jednostką)`, () => {
      assert.equal(st.starsOutsideGroup, 0);
    });
  }
  check('sekwencja: wszystkie kroki (rozstaw, Reset, ruch, Reset) zielone', () => {
    assert.equal(Object.keys(byLabel).length, 4);
  });

  const BattleSceneMut = await loadBattleScene(true);
  const mutSteps = runSequence(BattleSceneMut, true);
  const mutReset = mutSteps.find(([l]) => l === 'Reset #1')[1];
  check('mutacja kopii (brak gwiazdki w Resecie) daje czerwono: zadnego generała ze gwiazdka po Reset', () => {
    assert.equal(mutReset.commanderStars, 0, `generał z gwiazdka po mutacji: ${mutReset.commanderStars}`);
  });

  console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; });
