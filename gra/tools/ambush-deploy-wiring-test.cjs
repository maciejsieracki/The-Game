'use strict';
// R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1 (r2, pkt 5 / pkt 12 / pkt 11):
// (a) okablowanie main.ts: sciezki zasadzki (gracz wpada / AI wpada w zasadzke gracza) przekazuja
//     deploy + ambush.surprisedSide do BattleScene (test statyczny, bez przegladarki);
// (b) pkt 12: rozstawienie zasadzki nie zalezy od _manualMode (bez generala): predykaty strefy
//     daja te same wyniki przy manualMode=true i false, a komunikat PL dla bez-generala dziala;
// (c) pkt 11: zapis stanu bitwy jest blokowany w trakcie bitwy (isSaveBlockedByBattle).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.join(__dirname, '..');
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');

let checks = 0;
function ok(cond, msg) { assert.ok(cond, msg); checks++; console.log('  OK   ' + msg); }
function has(snippet, msg) { ok(mainSrc.includes(snippet), msg); }

async function loadBattleScene() {
  const result = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; import { ambushDeployFeedbackText } from './src/battle/ambushDeploy.ts'; module.exports = { BattleScene, ambushDeployFeedbackText };",
      resolveDir: GRA, sourcefile: 'ambush-wiring-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(GRA, 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [{
      name: 'stub-battle-deps',
      setup(build) {
        let seq = 0;
        const stub = (re, contents) => {
          const ns = 'stub-' + (seq++);
          build.onResolve({ filter: re }, () => ({ path: ns, namespace: ns }));
          build.onLoad({ filter: /.*/, namespace: ns }, () => ({ contents, loader: 'js' }));
        };
        stub(/render\/units/, "import * as THREE from 'three'; export const buildUnitModel = () => new THREE.Group();");
        stub(/brandAssets/, 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";');
        stub(/leaderPortraits/, 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";');
        stub(/muzyka-antyczna/, 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};');
        stub(/brandTokenVars/, 'export const CIV_BRAND_SCOPE_VARS = {}; export const ensureBrandRootTokens = () => {};');
      },
    }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: 'ambushWiring.ts' });
  return module.exports;
}

function makeScene(BattleScene, { control, surprised, gate, manual }) {
  const scene = Object.create(BattleScene.prototype);
  scene.terrainMap = { passable: () => true, at: () => 'plains' };
  scene.occByKey = new Map();
  scene._deployPlayerSideOpt = control;
  scene._ambushSurprisedSide = surprised;
  scene._manualCommanderGate = gate;
  scene._manualMode = manual;
  return scene;
}

async function main() {
  // (a) Okablowanie main.ts (statyczne).
  console.log('(a) okablowanie main.ts');
  has("openPlayerMapUnitAttackCore(mover, defender, true);", 'gracz wpada w zasadzke AI: openPlayerMapUnitAttackCore(..., true)');
  // R-WEB-TEST-DEBT-Q14 (HARNESS): od obsługi swapSides strona gracza to `scenePlayerRef`
  // (= swapSides ? defRosterRef : atkRosterRef, main.ts ~38141); warunek deploy ten sam co wcześniej po stronie gracza.
  has("deploy: scenePlayerRef.some(u => u.isGeneral === true) || ambushSurprised,",
    'atak gracza: deploy = generał LUB zasadzka (rozstawienie bez generała)');
  has("...(ambushSurprised ? { ambush: { surprisedSide: 'atk' as const } } : {}),",
    'atak gracza: ambush.surprisedSide="atk" tylko przy zasadzce');
  has("deploy: defRosterRef.some(u => u.isGeneral === true) || ambushSurprisedSide !== undefined,",
    'obrona: deploy = generał LUB zasadzka');
  has("...(ambushSurprisedSide !== undefined ? { ambush: { surprisedSide: ambushSurprisedSide } } : {}),",
    'obrona: ambush.surprisedSide przekazany z parametru');
  has("(cmd as { ambush?: boolean }).ambush === true ? 'atk' : undefined,",
    'AI wpada w zasadzke gracza (cmd.ambush): launchIncomingMapFieldBattle dostaje "atk"');

  const { BattleScene, ambushDeployFeedbackText } = await loadBattleScene();

  // (b) pkt 12: predykaty strefy nie zaleza od _manualMode; komunikat PL dla bez-generala.
  console.log('(b) rozstawienie zasadzki bez generala (manualMode)');
  for (const [control, surprised] of [['def', 'atk'], ['atk', 'atk']]) {
    const on = makeScene(BattleScene, { control, surprised, gate: true, manual: true });
    const off = makeScene(BattleScene, { control, surprised, gate: true, manual: false });
    const probeCols = [-40, 0, 5, 40, 60, 100];
    const probeRows = [0, 40, 76, 77, 78, 79, 80, 120, 200];
    let same = true;
    for (const c of probeCols) for (const r of probeRows) {
      if (on._inDeployPlayerZone(c, r) !== off._inDeployPlayerZone(c, r)) same = false;
    }
    ok(same, `control=${control}, zaskoczony=${surprised}: strefa rozstawienia identyczna przy manualMode on/off`);
    ok(on._clampDeployPlayerRow(200) === off._clampDeployPlayerRow(200)
      && on._clampDeployPlayerCol(200) === off._clampDeployPlayerCol(200),
      `control=${control}: klamp wiersza/kolumny identyczny przy manualMode on/off`);
  }
  const txtNoGen = ambushDeployFeedbackText({ ambusher: false, noGeneralManualBlocked: true });
  ok(txtNoGen.includes('Bez generała') && txtNoGen.includes('AUTO'),
    'komunikat PL bez generala: informuje o trybie AUTO');
  ok(ambushDeployFeedbackText({ ambusher: true, noGeneralManualBlocked: false }) === 'Zasadzka — możesz rozstawić jednostki także na polu wroga.',
    'komunikat PL zastawiajacego (z generalem): bez dopisku');
  ok(ambushDeployFeedbackText({ ambusher: false, noGeneralManualBlocked: false }).startsWith('Wpadłeś w zasadzkę'),
    'komunikat PL zaskoczonego (z generalem): bez dopisku');

  // (c) pkt 11: zapis zablokowany w bitwie (zrodlo prawdy w main.ts).
  console.log('(c) zapis stanu bitwy');
  has("function isSaveBlockedByBattle(): boolean {\n      return isBattleSceneOpen() || isPostBattleSummaryOpen();",
    'isSaveBlockedByBattle obejmuje otwarta scene bitwy (zapis niedostepny w bitwie)');
  has("showHintMessage('Zapis niedostępny w trakcie bitwy', 3000, undefined, true);",
    'komunikat PL o zablokowanym zapisie w bitwie');

  console.log(`\nWYNIK: ${checks} OK / 0 FAIL`);
}

main().catch(e => { console.error('FAIL', e && e.message ? e.message : e); process.exit(1); });
