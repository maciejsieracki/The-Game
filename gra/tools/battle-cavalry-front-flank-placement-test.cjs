'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
const { createServer } = require(path.join(__dirname, '..', 'node_modules', 'vite'));

const GRA = path.resolve(__dirname, '..');
const SCENE_PATH = path.join(GRA, 'src', 'battle', 'battleScene.ts');
const RUN_EVIDENCE = path.resolve(GRA, '..', 'dyspozycje/autobot/runs/R-WEB-CAVALRY-FRONT-FLANKS-PLACEMENT-Q1/evidence');

async function loadBattleScene(mutateSource) {
  const result = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: GRA,
      sourcefile: 'battle-cavalry-front-flank-entry.ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'es2020',
    alias: { three: path.join(GRA, 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [{
      name: 'test-battle-scene-imports',
      setup(build) {
        build.onLoad({ filter: /brandAssets/ }, () => ({
          contents: 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";', loader: 'js',
        }));
        build.onLoad({ filter: /leaderPortraits/ }, () => ({
          contents: 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";', loader: 'js',
        }));
        build.onLoad({ filter: /muzyka-antyczna/ }, () => ({
          contents: 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};', loader: 'js',
        }));
        if (mutateSource) {
          build.onLoad({ filter: /battleScene\.ts$/ }, async args => {
            const original = fs.readFileSync(args.path, 'utf8');
            const mutated = mutateSource(original);
            if (mutated === original) throw new Error('requested mutation did not change battleScene.ts');
            return { contents: mutated, loader: 'ts' };
          });
        }
      },
    }],
    write: false,
    logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout,
  }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

function makeRoster({ infantry = 60, archers = 24, javelins = 12, siege = 4, cavalry = 24, side = 'atk', groupId = null } = {}) {
  const mk = (role, i, category, mounted = false) => ({
    bu: { id: `${side}-${role}-${i}`, kategoria: category, nazwa: role, stats: { 'Jednostka': role } },
    mounted,
    groupId,
    side,
    q: side === 'atk' ? 20 : 40,
    r: 70,
    formationOffset: null,
  });
  return [
    ...Array.from({ length: infantry }, (_, i) => mk('piechota', i, 'miecznik')),
    ...Array.from({ length: javelins }, (_, i) => mk('oszczepnik', i, 'oszczepnik')),
    ...Array.from({ length: archers }, (_, i) => mk('lucznik', i, 'lucznik')),
    ...Array.from({ length: siege }, (_, i) => mk('katapulta', i, 'katapulta')),
    ...Array.from({ length: cavalry }, (_, i) => mk(i % 2 ? 'rydwan' : 'konnica', i, i % 2 ? 'rydwan' : 'konnica', true)),
  ];
}

function makePlanner(BattleScene, mode = 'flanks', groupId = null) {
  const planner = Object.create(BattleScene.prototype);
  planner._deployCavalryMode = mode;
  planner._deployMeleeLines = 2;
  planner._deployArcherLines = 2;
  planner.deployPhase = true;
  planner._playerControlSide = () => planner._testSide ?? 'atk';
  planner._groupMeta = new Map();
  if (groupId) planner._groupMeta.set(groupId, { doctrine: 'steady', autoPlay: true });
  planner._playerRoster = () => planner._testRoster;
  return planner;
}

function absoluteSlots(planner, units, formation) {
  return planner._formationSlotsForUnits(units, formation).map(([unit, dc, dr]) => ({
    unit,
    col: unit.q + planner._colOffForFormation(unit.side, dc),
    row: unit.r + dr,
    dc,
    dr,
  }));
}

async function main() {
  const BattleScene = await loadBattleScene();
  let checks = 0;
  const rosterModes = [
    { infantry: 60, archers: 24, javelins: 12, siege: 4, cavalry: 24 },
    { infantry: 190, archers: 70, javelins: 30, siege: 8, cavalry: 96 },
  ];

  for (const side of ['atk', 'def']) {
    for (const rosterShape of rosterModes) {
      const units = makeRoster({ ...rosterShape, side });
      for (const formation of ['F1', 'F2', 'F3']) {
        for (const mode of ['front', 'flanks', 'rear']) {
          const planner = makePlanner(BattleScene, mode);
          const slots = absoluteSlots(planner, units, formation);
          const mounted = slots.filter(slot => slot.unit.mounted);
          const body = slots.filter(slot => !slot.unit.mounted);
          assert.equal(slots.length, units.length, `${side} ${formation}/${mode}: each unit has a placement`);
          checks++;
          assert.equal(new Set(slots.map(slot => `${slot.col}:${slot.row}`)).size, slots.length,
            `${side} ${formation}/${mode}: mixed large army has no duplicate planned cells`);
          checks++;
          if (mode === 'front') {
            const frontDepth = Math.min(...body.map(slot => slot.dc));
            assert(mounted.every(slot => slot.dc === 0 && slot.dc < frontDepth),
              `${side} ${formation}: mounted line occupies the army-facing front, oriented along its actual side axis`);
            checks++;
            assert(mounted.some(slot => slot.row < 70) && mounted.some(slot => slot.row >= 70),
              `${side} ${formation}: front-mounted line spans both sides of the central row`);
            checks++;
          } else if (mode === 'flanks') {
            const bodyRows = body.map(slot => slot.row);
            const min = Math.min(...bodyRows), max = Math.max(...bodyRows);
            assert(mounted.every(slot => slot.row < min || slot.row > max),
              `${side} ${formation}: flanks stay beside the body, outside its row span`);
            checks++;
            const gaps = mounted.map(slot => slot.row < min ? min - slot.row : slot.row - max);
            assert(Math.max(...gaps) <= 5,
              `${side} ${formation}: flanks remain close to the army, not at battlefield edges`);
            checks++;
          } else {
            assert(mounted.every(slot => slot.dc > Math.max(...body.map(item => item.dc))),
              `${side} ${formation}: rear-mounted units are behind all main bands`);
            checks++;
          }
        }
      }
    }
  }

  // Exercise the actual drag/stretch placement path too. A large wing roster
  // occupies three adjacent lateral rows and uses rear ranks for overflow.
  for (const side of ['atk', 'def']) {
    for (const mode of ['front', 'flanks', 'rear']) {
      const units = makeRoster({ infantry: 20, archers: 8, javelins: 4, siege: 2, cavalry: 24, side });
      const planner = makePlanner(BattleScene, mode);
      planner._testSide = side;
      const anchorCol = side === 'atk' ? 20 : 60;
      const layout = planner._computeDeployStretchLayout(units, anchorCol, 70, anchorCol + (side === 'atk' ? 10 : -10), 70);
      const mounted = units.filter(unit => unit.mounted).map(unit => layout.get(unit.bu.id));
      const body = units.filter(unit => !unit.mounted).map(unit => layout.get(unit.bu.id));
      assert.equal(layout.size, units.length, `${side} drag/${mode}: every mixed-roster unit receives a destination`);
      checks++;
      const layoutKeys = [...layout.values()].map(pos => `${pos.col}:${pos.row}`);
      const collisions = layoutKeys.filter((key, index) => layoutKeys.indexOf(key) !== index);
      const collisionUnits = [...new Set(collisions)].map(key => ({ key, units: units.filter(unit => `${layout.get(unit.bu.id).col}:${layout.get(unit.bu.id).row}` === key).map(unit => unit.bu.id) }));
      assert.equal(new Set(layoutKeys).size, layout.size,
        `${side} drag/${mode}: destinations remain collision-free; collisions=${JSON.stringify(collisionUnits)}`);
      checks++;
      if (mode === 'flanks') {
        const min = Math.min(...body.map(pos => pos.row)), max = Math.max(...body.map(pos => pos.row));
        assert(mounted.every(pos => pos.row < min || pos.row > max), `${side} drag: cavalry sits beside the main body`);
        checks++;
        const gap = Math.max(...mounted.map(pos => pos.row < min ? min - pos.row : pos.row - max));
        assert(gap <= 5, `${side} drag: even 96 mounted units stay close to the body (${gap} rows maximum)`);
        checks++;
      } else if (mode === 'front') {
        const bodyDepth = side === 'atk' ? Math.min(...body.map(pos => pos.col)) : Math.max(...body.map(pos => pos.col));
        const cavDepth = side === 'atk' ? Math.max(...mounted.map(pos => pos.col)) : Math.min(...mounted.map(pos => pos.col));
        assert(side === 'atk' ? cavDepth > bodyDepth : cavDepth < bodyDepth,
          `${side} drag: front cavalry occupies the actual forward axis`);
        checks++;
      } else {
        const bodyDepth = side === 'atk' ? Math.max(...body.map(pos => pos.col)) : Math.min(...body.map(pos => pos.col));
        const cavDepth = side === 'atk' ? Math.min(...mounted.map(pos => pos.col)) : Math.max(...mounted.map(pos => pos.col));
        assert(side === 'atk' ? cavDepth < bodyDepth : cavDepth > bodyDepth,
          `${side} drag: rear cavalry occupies the actual rear axis`);
        checks++;
      }
    }
  }

  // Optional per-group mode is the legacy save shape: it must keep using the
  // toolbar default, whose default remains flanks.
  const legacy = makePlanner(BattleScene, 'flanks', 'group-legacy');
  const legacyUnits = makeRoster({ infantry: 8, archers: 2, javelins: 0, siege: 0, cavalry: 4, groupId: 'group-legacy' });
  assert.equal(legacy._cavalryModeForDeployUnits(legacyUnits), 'flanks', 'missing legacy cavalryMode falls back to default flanks');
  checks++;
  const defaultPlanner = makePlanner(BattleScene);
  assert.equal(defaultPlanner._cavalryModeForDeployUnits(legacyUnits), 'flanks', 'missing option defaults to flanks');
  checks++;
  const legacySlots = absoluteSlots(legacy, legacyUnits, 'F2');
  const legacyBodyRows = legacySlots.filter(slot => !slot.unit.mounted).map(slot => slot.row);
  const legacyMin = Math.min(...legacyBodyRows), legacyMax = Math.max(...legacyBodyRows);
  assert(legacySlots.filter(slot => slot.unit.mounted).every(slot => slot.row < legacyMin || slot.row > legacyMax),
    'legacy missing mode produces actual side placement, not merely a flanks label');
  checks++;

  // Replay/save-load restoration retains a manual group choice. A legacy
  // snapshot with no entry leaves metadata unset so the normal flanks default applies.
  const saved = makePlanner(BattleScene, 'flanks', 'group-manual');
  const manualUnits = makeRoster({ infantry: 6, archers: 2, javelins: 0, siege: 0, cavalry: 3, groupId: 'group-manual' });
  saved._testRoster = manualUnits;
  saved._restoreDeployCavalryModeSnapshot(new Map(manualUnits.map(unit => [unit.bu.id, 'rear'])));
  assert.equal(saved._groupMeta.get('group-manual').cavalryMode, 'rear', 'replay snapshot restores manual cavalry mode for the group');
  checks++;
  assert.equal(saved._cavalryModeForDeployUnits(manualUnits), 'rear', 'restored manual choice wins over the default');
  checks++;
  const oldSnapshot = makePlanner(BattleScene, 'flanks', 'group-old-save');
  const oldUnits = makeRoster({ infantry: 6, archers: 2, javelins: 0, siege: 0, cavalry: 3, groupId: 'group-old-save' });
  oldSnapshot._testRoster = oldUnits;
  oldSnapshot._restoreDeployCavalryModeSnapshot(new Map());
  assert.equal(oldSnapshot._groupMeta.get('group-old-save').cavalryMode, undefined, 'old save without cavalry snapshot keeps legacy undefined metadata');
  assert.equal(oldSnapshot._cavalryModeForDeployUnits(oldUnits), 'flanks', 'old save falls back to flanks');
  checks += 2;

  // Test sensitivity: removing the front plan branch makes the model assertion fail.
  const MutantScene = await loadBattleScene(source => source.replace(
    'let dc = plan.mountedFront.length > 0 ? 1 : 0;',
    'let dc = plan.mountedFront.length > 0 ? 0 : 0;',
  ));
  const mutantPlanner = makePlanner(MutantScene, 'front');
  const mutantUnits = makeRoster({ infantry: 6, archers: 2, javelins: 0, siege: 0, cavalry: 3 });
  const mutantSlots = absoluteSlots(mutantPlanner, mutantUnits, 'F2');
  const mutantBodyFront = Math.min(...mutantSlots.filter(slot => !slot.unit.mounted).map(slot => slot.dc));
  const mutantFront = mutantSlots.filter(slot => slot.unit.mounted).every(slot => slot.dc === 0)
    && mutantBodyFront > 0;
  assert.equal(mutantFront, false, 'front-placement assertions detect a model mutant that drops the front role');
  checks++;

  const source = fs.readFileSync(SCENE_PATH, 'utf8');
  assert(source.includes("{ mode: 'front', label: 'Z przodu'"), 'production popup exposes the requested front option');
  assert(source.includes("{ mode: 'flanks', label: 'Z boku'"), 'production popup retains the default flank option');
  assert(source.includes("{ mode: 'rear', label: 'Z ty\\u0142u'"), 'production popup retains the rear option');
  checks += 3;
  console.log(`battle-cavalry-front-flank-placement-test: PASS (${checks} checks)`);

  if (process.argv.includes('--live')) await runLiveBrowserTest();
}

async function runLiveBrowserTest() {
  let browser;
  const results = [];
  const run = async (mutate = false) => {
    const server = await createServer({
      root: GRA,
      configFile: path.join(GRA, 'vite.config.ts'),
      logLevel: 'error',
      ...(mutate ? { plugins: [{
        name: 'cavalry-front-option-mutation',
        enforce: 'pre',
        transform(code, id) {
          if (!id.endsWith('/src/battle/battleScene.ts')) return null;
          return code.replace(/^\s*\{ mode: 'front', label: 'Z przodu'.*\n/m, '');
        },
      }] } : {}),
      server: { host: '127.0.0.1', port: 0, strictPort: false },
    });
    let page;
    try {
      await server.listen();
      const address = server.httpServer.address();
      page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(`http://127.0.0.1:${address.port}/tools/battle-manual-melee-browser-entry.html`,
        { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__meleeBrowserBattle?.ready === true, undefined, { timeout: 60000 });
      const initial = await page.evaluate(() => {
        const scene = window.__meleeBrowserBattle.scene;
        scene.deployPhase = true;
        scene._buildDeployToolbar();
        scene._initDeployUI();
        scene._syncBattleToolbarMode();
        return { default: scene._deployCavalryMode,
          choices: [...document.querySelectorAll('[data-deploy-cav-option]')].map(el => el.dataset.deployCavOption),
          cavalry: scene.atk.filter(unit => unit.mounted).length };
      });
      if (mutate) {
        results.push({ mutation: 'remove front option from production popup', detected: !initial.choices.includes('front') });
        if (initial.choices.includes('front')) throw new Error('Live mutation survived: front option still exists');
        if (errors.length) throw new Error(`Browser errors in mutation case: ${errors.join(' | ')}`);
        return;
      }
      if (initial.default !== 'flanks' || initial.cavalry < 1) throw new Error(`Unexpected live default/roster: ${JSON.stringify(initial)}`);
      await page.locator('[data-deploy-main-btn="cavalry"]').click();
      const popupVisible = await page.locator('[data-deploy-dropdown="cavalry"]').evaluate(el => getComputedStyle(el).display !== 'none');
      if (!popupVisible || initial.choices.length !== 3 || !initial.choices.includes('front')
        || !initial.choices.includes('flanks') || !initial.choices.includes('rear')) {
        throw new Error(`Production popup choices are incomplete: ${JSON.stringify({ initial, popupVisible })}`);
      }
      fs.mkdirSync(RUN_EVIDENCE, { recursive: true });
      await page.screenshot({ path: path.join(RUN_EVIDENCE, 'cavalry-options-live.png'), fullPage: true });
      await page.locator('[data-deploy-cav-option="front"]').click();
      const front = await page.evaluate(() => {
        const scene = window.__meleeBrowserBattle.scene;
        const mounted = scene.atk.filter(unit => unit.mounted), body = scene.atk.filter(unit => !unit.mounted);
        return { mode: scene._deployCavalryMode, mounted: mounted.length,
          cavFront: Math.min(...mounted.map(unit => unit.q)), bodyFront: Math.min(...body.map(unit => unit.q)) };
      });
      if (front.mode !== 'front' || front.mounted < 1 || front.cavFront <= front.bodyFront) {
        throw new Error(`Front option did not move mounted units to the forward axis: ${JSON.stringify(front)}`);
      }
      await page.screenshot({ path: path.join(RUN_EVIDENCE, 'cavalry-front-applied-live.png'), fullPage: true });
      if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
      results.push({ default: initial.default, options: initial.choices, front, popupVisible, consoleErrors: errors.length });
    } finally {
      await page?.close();
      await server.close();
    }
  };
  try {
    browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
    await run(false);
    await run(true);
    console.log(`battle-cavalry-front-flank-placement-live: PASS ${JSON.stringify(results)}`);
  } finally {
    await browser?.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
