'use strict';

/**
 * Behavioral contract for the staged Food improvement planner. The fixtures use
 * production pickAutoImprovements + buildImprovementQualifier and observe real picks.
 * Run from gra/: node tools/ai-food-improvement-priority-stages-test.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.FOOD_STAGES_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-food-stages-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};\nexport { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};\n`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, decideAITurn } = require(bundle);

const techs = new Set([
  'Rolnictwo', 'Irygacja', 'Oswojenie zwierząt', 'Łowiectwo', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo',
  'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);

function makeMap(width = 22, height = 14) {
  const hexes = {};
  for (let q = 0; q < width; q++) for (let r = 0; r < height; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: width, wysokoscR: height, hexes, seed: 11, riverPaths: [] };
}

function runPicker({ map, cities, worked, placed = new Map(), unlockedTechs = techs, maxItemsPerCity = Infinity, skipWyrab = false, getSkipWyrab, foodImprovementStages = true, priorityOverride }) {
  const territoryNodes = cities.map(c => ({ q: c.q, r: c.r, ownerId: c.ownerId, cityId: c.id, pop: c.population, level: 1 }));
  return pickAutoImprovements({
    cities, ownerId: cities[0]?.ownerId ?? 0, map, territoryNodes, placedImprovements: placed,
    pracaAvailable: 100000, unlockedTechs, getFocus: () => 'zywnosc', getOnlyWorked: () => true,
    getWorkedHexKeys: c => worked.get(c.id) ?? new Set(), pracaBudgetPercent: 100,
    maxItemsPerCity, pracaSurplusThreshold: 0, skipWyrab, getSkipWyrab,
    foodImprovementStages, priorityOverride,
    civArchetype: 'grecy', playerEra: 3,
  });
}

function place(picks, map, placed) {
  for (const pick of picks) {
    const key = `${pick.q},${pick.r}`;
    if (pick.key === 'wyrab') map.hexes[key].nakladka = 'brak';
    else placed.set(key, [...(placed.get(key) ?? []), pick.key]);
  }
}

function onlyKey(picks, key, label) {
  assert.ok(picks.length > 0, `${label}: expected at least one pick`);
  assert.ok(picks.every(p => p.key === key), `${label}: expected only ${key}, got ${picks.map(p => p.key).join(',')}`);
}

try {
  let passed = 0;
  function check(name, fn) {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  }

  // City A has farms and two river forests; city B has a cattle deposit but no farm
  // candidate. A global stage must still make A's farm precede B's cattle.
  const map = makeMap();
  const cities = [
    { id: 'a', ownerId: 0, q: 4, r: 4, population: 6 },
    { id: 'b', ownerId: 0, q: 14, r: 4, population: 6 },
  ];
  const workA = new Set(['4,3', '5,3', '4,5', '5,5', '5,4']);
  const workB = new Set(['14,3']);
  const worked = new Map([['a', workA], ['b', workB]]);
  map.riverPaths = [[{ q: 4, r: 3 }, { q: 5, r: 3 }, { q: 6, r: 3 }, { q: 5, r: 4 }]];
  for (const [q, r] of [[4, 3], [5, 3]]) {
    map.hexes[`${q},${r}`].nakladka = 'las';
    map.hexes[`${q},${r}`].rzeka = { obecna: true, krawedzie: [] };
  }
  map.hexes['5,4'].rzeka = { obecna: true, krawedzie: [] };
  map.hexes['5,4'].zloze = 'sol';
  map.hexes['14,3'].nakladka = 'zloze_bydla';
  const placed = new Map();

  // R-WEB-AUTOIMPROVE-PRIORITY-Q1 R5 (D4 wlasciciela 2026-10-31, etapy E1..E6): farma na heksie z rzeka
  // BEZ lasu (5,4) ma PIERWSZENSTWO przed wycinka lasu na rzece (E1 > E2) — wczesniej wycinka byla
  // etapem 0 i wyprzedzala kazda farme. Zmiana oczekiwan zgodna z wiazaca specyfikacja
  // ("Farma na heksach z rzeka, na ktorych NIE MA lasu - pierwszy priorytet, wszedzie, zanim cokolwiek z E2+").
  const farmFirst = runPicker({ map, cities, worked, placed, maxItemsPerCity: 1, getSkipWyrab: () => true });
  onlyKey(farmFirst, 'farma', 'E1: farm on the river hex without forest comes before river forest clearing');
  assert.equal(farmFirst.length, 1, 'AI-style one-order-per-city cap must remain intact');
  assert.ok(farmFirst.some(p => p.cityId === 'a' && p.q === 5 && p.r === 4), 'E1 target is the river hex 5,4');
  check('0. E1 river farm (no forest) precedes river forest clearing; AI throttle intact', () => {});
  place(farmFirst, map, placed);

  // R-WEB-AUTOIMPROVE-STAGES2-Q1 (decyzja wlasciciela 2026-10-31, przycisk „Wolno wycinac las”): przy przycisku
  // WYLACZONYM (getSkipWyrab=true) automat gracza NIE wycina nigdzie — takze przy rzece (dawny pin: „E2 overrides
  // the toggle”, 1 wycinka). Przy WLACZONYM wycinka E2 rusza.
  const clearOff = runPicker({ map, cities, worked, placed, maxItemsPerCity: 1, getSkipWyrab: () => true });
  assert.ok(!clearOff.some(p => p.key === 'wyrab'), 'toggle OFF: zero wycinek, takze przy rzece (E2 nie omija przycisku)');
  const clear = runPicker({ map, cities, worked, placed, maxItemsPerCity: 1, getSkipWyrab: () => false });
  onlyKey(clear, 'wyrab', 'stage E2 river clearing runs when the woodcut toggle is ON');
  assert.equal(clear.length, 1, 'AI-style one-order-per-city cap must remain intact');
  check('0a. E2 river forest clearing is isolated from farms/livestock and respects AI throttle', () => {});
  place(clear, map, placed);

  // E1 > E2: the freshly cleared river hex gets its farm BEFORE the next river forest is cut.
  const farmCleared = runPicker({ map, cities, worked, placed, maxItemsPerCity: 1 });
  onlyKey(farmCleared, 'farma', 'E1: farm on the cleared river hex precedes clearing the next river forest');
  place(farmCleared, map, placed);
  const clearAgain = runPicker({ map, cities, worked, placed, maxItemsPerCity: 1 });
  onlyKey(clearAgain, 'wyrab', 'E2 continues with the remaining river forest');
  place(clearAgain, map, placed);
  const farmCleared2 = runPicker({ map, cities, worked, placed, maxItemsPerCity: 1 });
  onlyKey(farmCleared2, 'farma', 'E1: farm on the second cleared river hex');
  place(farmCleared2, map, placed);
  check('0b. river hexes are developed one by one: clear -> farm (E1 > E2), all river forests prepared before E3+', () => {});

  // E3: trzoda przy rzece (poprzednio etap 2 po WSZYSTKICH farmach; teraz farmy poza rzeka sa E5).
  let livestockPasses = 0;
  let lateFood = [];
  for (let turn = 0; turn < 20; turn++) {
    const picks = runPicker({ map, cities, worked, placed, maxItemsPerCity: 1 });
    if (picks.length > 0 && picks.every(p => ['bydlo', 'owce', 'lama'].includes(p.key))) {
      if (turn === 0) {
        assert.ok(picks.some(p => p.key === 'bydlo'), 'the first available livestock action should be Trzoda');
        check('2. E3 livestock (river hexes) follows the river farms and precedes farms off the river', () => {});
      }
      livestockPasses++;
      place(picks, map, placed);
      continue;
    }
    lateFood = picks;
    break;
  }
  assert.ok(livestockPasses > 0, 'livestock stage should run after river farms');
  assert.ok(lateFood.length > 0 && lateFood.every(p => ['irygacja', 'tarasy'].includes(p.key)),
    `E4 irrigation/terraces should be next after river farms and livestock, BEFORE off-river farms (got ${lateFood.map(p => p.key).join(',')})`);
  check('3. E4 irrigation/terraces precede the off-river farms (E5)', () => {});
  let irrPasses = 0;
  let offRiver = lateFood;
  for (let turn = 0; turn < 20; turn++) {
    if (offRiver.length > 0 && offRiver.every(p => ['irygacja', 'tarasy'].includes(p.key))) {
      irrPasses++;
      place(offRiver, map, placed);
      offRiver = runPicker({ map, cities, worked, placed, maxItemsPerCity: 1 });
      continue;
    }
    break;
  }
  assert.ok(irrPasses > 0, 'irrigation stage ran');
  assert.ok(offRiver.length > 0 && offRiver.every(p => p.key === 'farma'),
    `E5 farms off the river come after irrigation (got ${offRiver.map(p => p.key).join(',')})`);
  check('3b. E5 farms outside the river follow E4', () => {});
  let farmPasses = 0;
  for (let turn = 0; turn < 10; turn++) {
    if (offRiver.length > 0 && offRiver.every(p => p.key === 'farma')) {
      farmPasses++;
      place(offRiver, map, placed);
      offRiver = runPicker({ map, cities, worked, placed, maxItemsPerCity: 1 });
      continue;
    }
    break;
  }
  assert.ok(farmPasses >= 1, 'AI keeps filling the eligible off-river farm fields');
  check('1b. AI keeps the E5 farm stage active until all eligible off-river farms are placed', () => {});
  const saltStillAvailable = runPicker({
    map, cities, worked, placed, maxItemsPerCity: 1, foodImprovementStages: false,
    priorityOverride: ['warzelnia_soli'],
  });
  assert.ok(saltStillAvailable.some(p => p.key === 'warzelnia_soli'),
    'salt works remain eligible after livestock, so they must not block earlier phases');
  check('3c. salt works (E6) stay available and do not block the earlier stages', () => {});
  const lateFoodPlaceholder = lateFood;
  place(lateFoodPlaceholder, map, new Map());

  // D4: etap bez odblokowanej technologii NIE jest celem i nie blokuje nastepnych (poprzednio
  // sonda dodawala technologie etapu i wstrzymywala irygacje, dopoki istnial niepostawiony cel farmy).
  const noFarmTech = runPicker({
    map, cities, worked, placed: new Map(), maxItemsPerCity: 1,
    unlockedTechs: new Set(['Gospodarka wodna']),
  });
  assert.ok(noFarmTech.length > 0 && noFarmTech.every(p => p.key === 'irygacja'),
    `locked farm tech must not block irrigation (got ${noFarmTech.map(p => p.key).join(',') || 'none'})`);
  check('edge. a stage without unlocked technology is not a target and does not block later stages (D4)', () => {});

  // Explicit negative: when there are no eligible citizen plots, the planner is a no-op.
  const empty = runPicker({
    map: makeMap(), cities, worked: new Map([['a', new Set()], ['b', new Set()]]),
    placed: new Map(),
  });
  // R4 KOREKTA F (wlasciciel 2026-10-31): heks CENTRUM miasta jest zwyklym heksem, zawsze pracowanym —
  // jedyne dopuszczalne rozkazy bez obywateli leza w centrum miasta; zadnych poza nim.
  const cityCenters = new Set(cities.map(c => `${c.q},${c.r}`));
  assert.ok(empty.every(p => cityCenters.has(`${p.q},${p.r}`)),
    `no worked fields: only city-centre hexes may be built (got ${empty.map(p => `${p.key}@${p.q},${p.r}`).join(' ')})`);
  check('negative. no worked/eligible fields means no food improvement outside the city centre hex (centre = ordinary, always-worked hex)', () => {});

  // Source wiring: both production callers opt into staged planning. Behavioral tests
  // above exercise the shared production picker itself.
  const aiSource = fs.readFileSync(path.resolve(GRA_ROOT, 'src/game/ai.ts'), 'utf8');
  const mainSource = fs.readFileSync(path.resolve(GRA_ROOT, 'src/main.ts'), 'utf8');
  assert.match(aiSource, /foodImprovementStages:\s*true/);
  assert.match(mainSource, /foodImprovementStages:\s*city\s*=>/);
  check('wiring. AI civilization and player auto-build use staged planning', () => {});

  // Exercise the real AI turn planner, not just the shared picker. One city has two
  // worked river forests and one worked bare farm target; maxItemsPerCity stays 1.
  const aiMap = makeMap(16, 16);
  const aiCity = {
    id: 'ai', ownerId: 3, q: 7, r: 7, name: 'AI', population: 6,
    okolicaTryb: 'reczny', okolicaReczne: { '7,5': 1, '7,6': 1, '6,7': 1 },
  };
  const aiTerritory = [{ q: 7, r: 7, ownerId: 3, cityId: 'ai', pop: 6, level: 1 }];
  aiMap.riverPaths = [[{ q: 7, r: 5 }, { q: 7, r: 6 }]];
  for (const key of ['7,5', '7,6']) {
    aiMap.hexes[key].nakladka = 'las';
    aiMap.hexes[key].rzeka = { obecna: true, krawedzie: [] };
  }
  const aiPlaced = new Map();
  const aiTrace = [];
  for (let turn = 0; turn < 8; turn++) {
    const cmds = decideAITurn(3, [], [aiCity], aiMap, { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
      territoryNodes: aiTerritory, placedImprovements: aiPlaced, improvementTechs: techs,
      pracaAvailable: 100000, civEra: 3, resourceDeficitKeys: [],
    }).filter(command => command.type === 'buildImprovement');
    for (const command of cmds) {
      aiTrace.push(command.key);
      const hexKey = `${command.q},${command.r}`;
      if (command.key === 'wyrab') aiMap.hexes[hexKey].nakladka = 'brak';
      else aiPlaced.set(hexKey, [...(aiPlaced.get(hexKey) ?? []), command.key]);
    }
  }
  // D4 (R5): E1 > E2 — kazdy wyciety heks rzeki dostaje farme ZANIM zostanie wyciety nastepny las na rzece;
  // trzoda/irygacja (E3/E4) dopiero gdy na rzece nie ma juz wycinki ani farmy do zrobienia.
  // R3, ABC-D=B: AI bez limitu 1/miasto/ture (jak gracz) — etap E2 tnie obie rzeki w jednej turze (<=3 na etap),
  // potem E1 stawia obie farmy; trzoda/irygacja dopiero po nich (E1 > E2 > E3 > E4 zachowane).
  assert.deepEqual(aiTrace.slice(0, 4), ['wyrab', 'wyrab', 'farma', 'farma'],
    `decideAITurn (bez limitu AI, ABC-D=B): wycinka rzek -> farmy przed trzoda/irygacja (got ${aiTrace.join(',')})`);
  assert.ok(aiTrace.indexOf('bydlo') > 3 && aiTrace.indexOf('irygacja') > 3, 'trzoda/irygacja dopiero po farmach na rzece');
  const lastWyrab = aiTrace.lastIndexOf('wyrab');
  const firstLater = aiTrace.findIndex(k => k === 'bydlo' || k === 'irygacja');
  assert.ok(firstLater > lastWyrab, `E3/E4 start only after the river clearing is finished (got ${aiTrace.join(',')})`);
  check('parity. real AI turn planner develops river hexes clear -> farm (E1 > E2), then E3/E4', () => {});

  if (process.env.FOOD_STAGES_MUTATION_PROBE !== '1') {
    const mutatedRoot = path.join(temp, 'mutated-project');
    const mutatedSrc = path.join(mutatedRoot, 'src');
    fs.cpSync(SRC, mutatedSrc, { recursive: true });
    fs.cpSync(path.resolve(GRA_ROOT, 'data'), path.join(mutatedRoot, 'data'), { recursive: true });
    const plannerFile = path.join(mutatedSrc, 'game/auto-improvements.ts');
    const planner = fs.readFileSync(plannerFile, 'utf8');
    const needle = 'if (stagePicks.length > 0) {';
    assert.ok(planner.includes(needle), 'mutation fixture must identify the stage-selection guard');
    fs.writeFileSync(plannerFile, planner.replace(needle, 'if (false && stagePicks.length > 0) {'));
    const mutation = spawnSync(process.execPath, [__filename], {
      encoding: 'utf8',
      env: { ...process.env, FOOD_STAGES_SRC_DIR: mutatedSrc, FOOD_STAGES_MUTATION_PROBE: '1' },
    });
    const mutationOutput = `${mutation.stdout ?? ''}\n${mutation.stderr ?? ''}`;
    assert.notEqual(mutation.status, 0, 'disabling stage selection must make the behavioral test fail');
    assert.match(mutationOutput, /AssertionError/, 'mutated run must fail on a behavior assertion, not setup');
    passed++;
    console.log('[PASS] mutation. disabling stage selection makes the behavioral gate fail');
  }

  console.log(`ai-food-improvement-priority-stages-test: ${passed} passed, 0 failed`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
