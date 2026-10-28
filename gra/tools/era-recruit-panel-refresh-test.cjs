'use strict';
/**
 * Regression: an open recruitment panel is rebuilt after a real player era advance.
 * The extracted notifier runs against a small stub context, while the refresh callback
 * rebuilds the visible unit list through the real production availability module.
 * Run from gra/: node tools/era-recruit-panel-refresh-test.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const MAIN = path.resolve(__dirname, '..', 'src', 'main.ts');
const ENTRY = path.resolve(__dirname, '.era-recruit-panel-refresh-entry.ts');
const BUNDLE = path.resolve(__dirname, '.era-recruit-panel-refresh-bundle.cjs');
let passed = 0;
let failed = 0;
function check(name, condition, details) {
  if (condition) { passed++; console.log('PASS:', name); }
  else { failed++; console.error('FAIL:', name, details === undefined ? '' : JSON.stringify(details)); }
}

try {
  fs.writeFileSync(ENTRY, "export { purchasableUnits } from '../src/game/production';\n", 'utf8');
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
  const { purchasableUnits } = require(BUNDLE);
  const main = fs.readFileSync(MAIN, 'utf8');
  const start = main.indexOf('    function notifyPlayerEraChangeIfAdvanced(prevEra: number): void {');
  const nextFn = main.indexOf('    /**\n     * P-EPOKA-TOAST-EOT-POLYKANY: wypuść odłożony toast', start);
  if (start < 0 || nextFn < 0) throw new Error('Could not isolate notifyPlayerEraChangeIfAdvanced');
  const fnSource = main.slice(start, nextFn)
    .replace('function notifyPlayerEraChangeIfAdvanced(prevEra: number): void',
      'function notifyPlayerEraChangeIfAdvanced(prevEra)');

  const player = { era: 2 };
  const city = { id: 'open-city', q: 0, r: 0, ownerId: 0, population: 3 };
  const data = {
    buildings: [],
    units: [
      { Jednostka: 'Stone Guard', Epoka: 'Kamien', Typ: 'Melee', Tech: '-', 'W zamian za': '-', 'Pieniadz (koszt)': 5 },
      { Jednostka: 'Bronze Guard', Epoka: 'Braz', Typ: 'Melee', Tech: '-', 'W zamian za': '-', 'Pieniadz (koszt)': 8 },
    ],
  };
  let refreshes = 0;
  let visibleIds = [];
  const context = {
    player,
    shouldNotifyPlayerEraChange: (before, after) => after > before,
    refreshCityPanelIfOpen: () => {
      refreshes++;
      visibleIds = purchasableUnits(city, data, [], {
        epoch: player.era, builtBuildingIds: [], showStockGatedUnits: true,
      }).map(item => item.id);
    },
    eraChangeNotifyToastHtml: () => '',
    ERA_CHANGE_NOTIFY: { toastDurationMs: 1 },
    endTurnInProgress: false,
    showHintMessage: () => {},
    turn: 1,
    warEventLog: [],
    eraChangeJournalTitle: () => '',
    eraChangeJournalSubtitle: () => '',
    refreshD1bHud: () => {},
    pendingEraDiscoveryTech: null,
    showTechDiscoveryNotice: () => {},
    showTechTreeView: () => {},
  };
  vm.runInNewContext(fnSource + '\nthis.runNotify = notifyPlayerEraChangeIfAdvanced;', context);

  player.era = 2;
  context.runNotify(1);
  check('real era advance refreshes the open recruitment panel once', refreshes === 1, refreshes);
  check('refreshed Bronze list keeps Stone units visible without Barracks',
    visibleIds.includes('Stone Guard'), visibleIds);
  check('Bronze units remain gated in the refreshed list without Barracks',
    !visibleIds.includes('Bronze Guard'), visibleIds);
  context.runNotify(2);
  check('no-op era notification does not refresh the panel again', refreshes === 1, refreshes);
} finally {
  for (const file of [ENTRY, BUNDLE]) {
    try { fs.unlinkSync(file); } catch (_) { /* ignore */ }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
