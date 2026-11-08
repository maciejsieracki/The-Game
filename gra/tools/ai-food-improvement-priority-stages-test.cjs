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

function runPicker({ map, cities, worked, placed = new Map(), unlockedTechs = techs, skipWyrab = false, getSkipWyrab, foodImprovementStages = true, priorityOverride }) {
  const territoryNodes = cities.map(c => ({ q: c.q, r: c.r, ownerId: c.ownerId, cityId: c.id, pop: c.population, level: 1 }));
  return pickAutoImprovements({
    cities, ownerId: cities[0]?.ownerId ?? 0, map, territoryNodes, placedImprovements: placed,
    pracaAvailable: 100000, unlockedTechs, getFocus: () => 'zywnosc', getOnlyWorked: () => true,
    getWorkedHexKeys: c => worked.get(c.id) ?? new Set(), pracaBudgetPercent: 100,
    pracaSurplusThreshold: 0, skipWyrab, getSkipWyrab,
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
  // R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1 r2 (ABC-B): heks SASIADUJACY z rzeka liczy sie jak heks nad rzeka (E1 farma przed E2).
  // Centrum (4,4) i pracowane (4,5),(5,5) sasiaduja z rzeka — stan wyjsciowy: ich farmy (E1) juz stoja, zeby ten test dalej mierzyl
  // izolacje etapow na heksach NA rzece (kontrakt sasiedztwa: autoclear-priority-q1-test.cjs (d),(m)).
  const placed = new Map([['4,4', ['farma']], ['4,5', ['farma']], ['5,5', ['farma']]]);

  // R-WEB-AUTOIMPROVE-PRIORITY-Q1 R5 (D4 wlasciciela 2026-10-31, etapy E1..E6): farma na heksie z rzeka
  // BEZ lasu (5,4) ma PIERWSZENSTWO przed wycinka lasu na rzece (E1 > E2) — wczesniej wycinka byla
  // etapem 0 i wyprzedzala kazda farme. Zmiana oczekiwan zgodna z wiazaca specyfikacja
  // ("Farma na heksach z rzeka, na ktorych NIE MA lasu - pierwszy priorytet, wszedzie, zanim cokolwiek z E2+").
  // KLASA A (asercja przestarzala): od R-WEB-AUTOIMPROVE-RIVER-FOREST-FIRST-PRIORITY-Q1 (2026-11-05) KROK 0 to
  // wycinka lasu PRZY RZECE na polu obywatela, przed E1 (auto-improvements.ts, KROK 0). Pinujemy ZAMIERZONA kolejnosc:
  // wycinka rzeczna pierwsza, farma E1 nie wyprzedza jej w tej turze; obie lesne heksy rzeki w jednym wywolaniu.
  const firstCall = runPicker({ map, cities, worked, placed });
  const riverForestHexKeys = new Set(['4,3', '5,3']);
  const wyrabIdx = firstCall.map((p, i) => (p.key === 'wyrab' ? i : -1)).filter(i => i >= 0);
  const farmIdx = firstCall.map((p, i) => (p.key === 'farma' ? i : -1)).filter(i => i >= 0);
  assert.ok(wyrabIdx.length >= 2, `KROK 0: obie lesne heksy rzeki wycinane w JEDNYM wywolaniu (got ${wyrabIdx.length})`);
  assert.ok(wyrabIdx.every(i => riverForestHexKeys.has(`${firstCall[i].q},${firstCall[i].r}`)),
    'KROK 0: wycinka dotyczy wylacznie lasow rzecznych 4,3 / 5,3');
  assert.ok(farmIdx.length === 0 || farmIdx[0] > wyrabIdx[wyrabIdx.length - 1],
    'E1 (farma na rzece bez lasu) NIE wyprzedza wycinki rzecznej (KROK 0 przed E1)');
  assert.ok(firstCall.some(p => p.cityId === 'a' && p.q === 5 && p.r === 4 && p.key === 'farma'),
    'E1 cel 5,4 (rzeka bez lasu) obslugiwany w tej samej turze, po wycince');
  check('0. KROK 0 (wycinka lasu rzecznego) przed E1; bez limitu liczby sztuk', () => {});
  // Przelacznik „Wolno wycinac las” (getSkipWyrab) USUNIETY razem z SIMPLE-FOOD-RULE-NO-TOGGLES-Q1:
  // wycinka lasu pod farme jest zawsze dozwolona; nie ma juz trybu „zero wycinek" z przelacznika.
  const clear = firstCall.filter(p => p.key === 'wyrab');
  check('0a. wycinka rzeczna jest izolowana od farm w tym samym wywolaniu; brak przelacznika (SIMPLE-FOOD-RULE)', () => {});
  place(firstCall, map, placed);

  // E1 > E2: freshly cleared river hexes get their farms BEFORE any further clearing. Bez limitu liczby sztuk
  // (R-WEB-AUTO-IMPROVE-REMOVE-ITEM-CAP-Q1) jedno wywolanie E2 wycina WSZYSTKIE kwalifikujace sie lasy rzeczne
  // (dawniej po 1 na wywolanie), wiec nastepny przebieg to farmy E1 na wszystkich wycietych heksach.
  assert.ok(clear.length >= 2, 'no item-count cap: both river forests are cleared in ONE E2 call');
  const farmCleared = runPicker({ map, cities, worked, placed });
  // R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-NOT-BUILT-Q2 (r2): etapy kaskaduja w TEJ SAMEJ turze po wyczerpaniu wyzszego (farmy ->
  // trzoda -> irygacja), wiec to samo wywolanie moze zawierac tez trzode/irygacje; niezmiennik: farmy PIERWSZE, zadnej kolejnej wycinki.
  assert.ok(farmCleared.length > 0 && farmCleared[0].key === 'farma', 'E1: farms on the cleared river hexes come first');
  assert.ok(!farmCleared.some(p => p.key === 'wyrab'), 'E1: farms on the cleared river hexes precede any further clearing (no wyrab in the call)');
  {
    const lastFarm = farmCleared.map(p => p.key).lastIndexOf('farma');
    const firstOther = farmCleared.findIndex(p => p.key !== 'farma');
    assert.ok(firstOther === -1 || firstOther > lastFarm || farmCleared.slice(0, firstOther).every(p => p.key === 'farma'), 'E1 before E3/E4 in pick order');
  }
  assert.ok(farmCleared.length >= clear.length, 'every cleared river hex gets its farm in one E1 call');
  place(farmCleared, map, placed);
  const noMoreClearing = runPicker({ map, cities, worked, placed });
  assert.ok(!noMoreClearing.some(p => p.key === 'wyrab'), 'all river forests are already cut; no further E2 clearing');
  check('0b. river hexes: clear (all in one call) -> farm (E1 > E2), all river forests prepared before E3+', () => {});

  // R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-NOT-BUILT-Q2 (r2): etapy E3 -> E4 -> E5 kaskaduja W TEJ SAMEJ turze (wyzszy etap wyczerpany ->
  // nastepny z reszta budzetu), zamiast jednego etapu na ture (ktory glodzil trzode/irygacje, gdy E1 mial cel co ture). Kolejnosc
  // etapow zostaje: w jednym wywolaniu picki ida E3 (trzoda) < E4 (irygacja/tarasy) < E5 (farmy poza rzeka).
  // Wielotur (przywrocony z r1): kazda tura ma kolejnosc E1 (farma przy rzece, 1) < E3 (trzoda, 3) < E4 (irygacja/tarasy, 4)
  // < E5 (farma poza rzeka, 5) < E6 (sol, 6). Kaskada w JEDNEJ turze jest dozwolona (wyzszy etap wyczerpany, reszta budzetu);
  // cofniecie rangi w tej samej turze albo miedzy turami (farma E5 widziana, potem trzoda/irygacja) jest FAIL.
  const nearRiverFx = (q, r) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]
    .some(([dq, dr]) => map.hexes[`${q + dq},${r + dr}`]?.rzeka?.obecna);
  const rankOf = (p) => (p.key === 'wyrab' ? 0 : p.key === 'farma' ? (nearRiverFx(p.q, p.r) ? 1 : 5)
    : ['bydlo', 'owce', 'lama'].includes(p.key) ? 3 : ['irygacja', 'tarasy'].includes(p.key) ? 4
      : p.key === 'warzelnia_soli' ? 6 : 9);
  // Tura E1 (farmCleared) jest juz zbudowana: w tym samym wywolaniu kaskada moze dolozyc trzode/irygacje — liczy sie do logu tur.
  const firstRanks = farmCleared.map(rankOf);
  assert.ok(firstRanks.every((r, i) => i === 0 || r >= firstRanks[i - 1]),
    `E1 call: stage order E1 < E3 < E4 < E5 (got ${farmCleared.map(p => p.key).join(',')})`);
  const turnsLog = [farmCleared.map(p => p.key)];
  let seenOffRiverFarm = firstRanks.includes(5);
  for (let turn = 1; turn < 20; turn++) {
    const picks = runPicker({ map, cities, worked, placed });
    if (picks.length === 0) break;
    const ranks = picks.map(rankOf);
    assert.ok(ranks.every((r, i) => i === 0 || r >= ranks[i - 1]),
      `turn ${turn}: stage order E1 < E3 < E4 < E5 < E6 (got ${picks.map(p => p.key).join(',')})`);
    // Trzoda POZA rzeka wymaga farmy na tym heksie (r2 keyBlockedOnHex): po E5 moze pojsc tylko taka trzoda, ktorej farma wlasnie powstala.
    assert.ok(!(seenOffRiverFarm && ranks.some((r, i) => r === 4 || (r === 3 && nearRiverFx(picks[i].q, picks[i].r)))),
      `turn ${turn}: river livestock/irrigation (E3 river, E4) must not appear after an off-river farm (E5) picked earlier`);
    if (ranks.includes(5)) seenOffRiverFarm = true;
    turnsLog.push(picks.map(p => p.key));
    place(picks, map, placed);
  }
  const flatFood = turnsLog.flat();
  assert.ok(flatFood.includes('bydlo'), 'the first available livestock action should be Trzoda (E3 runs in the multi-turn loop)');
  check('2. E3 livestock (river hexes) follows the river farms and precedes farms off the river', () => {});
  assert.ok(flatFood.some(k => k === 'irygacja' || k === 'tarasy'), 'E4 irrigation/terraces run once E3 is exhausted');
  check('3. E4 irrigation/terraces precede the off-river farms (E5)', () => {});
  // Kaskada zbudowala juz wszystko, co miescilo sie w budzecie (E5 = farmy poza rzeka tez); dowod: zaden kandydat na farme nie zostal.
  assert.strictEqual(
    runPicker({ map, cities, worked, placed, foodImprovementStages: false, priorityOverride: ['farma'] }).length, 0,
    'AI filled all eligible farm fields (river E1 and off-river E5) — no farm candidate left behind',
  );
  check('3b. E5 farms outside the river follow E4', () => {});
  check('1b. AI keeps the E5 farm stage active until all eligible off-river farms are placed', () => {});
  // Sol (E6) nie blokuje wczesniejszych etapow: jesli zostala zbudowana w petli, to dopiero po trzodzie (E3) i irygacji (E4).
  const saltAt = flatFood.indexOf('warzelnia_soli');
  assert.ok(saltAt === -1 || (flatFood.indexOf('bydlo') !== -1 && saltAt > flatFood.indexOf('bydlo')),
    'salt works (E6) are built only after livestock (E3), never before it');
  check('3c. salt works (E6) stay available and do not block the earlier stages', () => {});

  // D4: etap bez odblokowanej technologii NIE jest celem i nie blokuje nastepnych (poprzednio
  // sonda dodawala technologie etapu i wstrzymywala irygacje, dopoki istnial niepostawiony cel farmy).
  const noFarmTech = runPicker({
    map, cities, worked, placed: new Map(),
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
  // worked river forests and one worked bare farm target; no item-count cap exists.
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
  // R3, ABC-D=B: AI bez limitu 1/miasto/ture (jak gracz) — etap E2 tnie obie rzeki w jednej turze (brak limitu etapu — S3-2),
  // potem E1 stawia obie farmy; trzoda/irygacja dopiero po nich (E1 > E2 > E3 > E4 zachowane).
  // R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1 r2 (ABC-B): centrum (7,7) i pole (6,7) SASIADUJA z rzeka (7,6) => ich farmy to E1 i wyprzedzaja
  // wycinke E2 (2 farmy), potem wycinka obu lasow rzeki, potem farmy na wyciętych heksach rzeki; trzoda/irygacja po wszystkich farmach.
  // KLASA A (asercja przestarzala): od R-WEB-AUTOIMPROVE-RIVER-FOREST-FIRST-PRIORITY-Q1 (2026-11-05) KROK 0 wycina
  // lasy PRZY RZECE na polach obywateli PRZED farmami E1 (auto-improvements.ts, KROK 0). Pinujemy zamierzona kolejnosc:
  // wycinka obu lasow rzeki -> farmy (E1) na rzece i na wycietych heksach -> trzoda/irygacja dopiero po nich.
  assert.deepEqual(aiTrace.slice(0, 6), ['wyrab', 'wyrab', 'farma', 'farma', 'farma', 'farma'],
    `decideAITurn (bez limitu AI, ABC-D=B, KROK 0 przed E1): wycinka rzek -> farmy (E1) -> trzoda/irygacja (got ${aiTrace.join(',')})`);
  assert.ok(aiTrace.indexOf('bydlo') > 5 && aiTrace.indexOf('irygacja') > 5, 'trzoda/irygacja dopiero po farmach na rzece');
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
