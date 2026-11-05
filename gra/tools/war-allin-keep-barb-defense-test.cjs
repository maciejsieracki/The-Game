'use strict';
/**
 * war-allin-keep-barb-defense-test.cjs -- R-WEB-WAR-ALLIN-KEEP-BARB-DEFENSE-Q1.
 * Run from gra/:  node tools/war-allin-keep-barb-defense-test.cjs
 *
 * Problem: applyWarAllInCapitalToCommands (ai.ts) zastepuje komendy ruchu wszystkich jednostek
 * bojowych marszem na stolice wroga. Jednostki przypisane do obrony domu przed zagrozeniem
 * (barbarzyncy w promieniu bramki obrony domu, najezdzcy na wlasnym terenie) dostaja w kroku 4b2
 * komende ruchu ku zagrozeniu -- war-allin ja kasuje, a nakladka applyHomeWarPriorities liczy
 * tylko cywilizacje (BARB = -1 wykluczony), wiec obrona przed barbarzyncami nie ma zadnego
 * zabezpieczenia. Zasada docelowa: obrońcy zagrozenia NIE sa przejmowani przez war-allin.
 *
 * Metoda pomiaru: ten sam stan wywolany dwa razy -- BEZ kontekstu war-allin (baza: komendy
 * obrony domu takie, jakie wydaje rdzen AI) i Z war-allin. Komenda jednostki rozni sie miedzy
 * przebiegami => jednostka zostala nadpisana.
 *
 * Testy importuja RZECZYWISTE decideAITurn z ai.ts (esbuild bundle), bez kopiowania logiki.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[war-allin-keep-barb-defense] esbuild not found. Run: npm ci --ignore-scripts (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE  = path.resolve(__dirname, '.war-allin-keep-barb-defense-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.war-allin-keep-barb-defense-bundle.cjs');

const ENTRY_TS = `
export { decideAITurn, AI_HOME_DEFENSE_VICINITY_HEX, assignHomeDefenders } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { hexDistance } from ${JSON.stringify(AI_SRC + '/units/setup')};
export { setArmyConsolidationOverride } from ${JSON.stringify(AI_SRC + '/game/army-consolidation')};
export { setHomeWarDefenseOverride } from ${JSON.stringify(AI_SRC + '/game/ai-war-home-defense')};
export { setWarAllInCapitalOverride } from ${JSON.stringify(AI_SRC + '/game/warAllInCapital')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[war-allin-keep-barb-defense] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const AI = require(BUNDLE_FILE);
const {
  decideAITurn, hexDistance, setArmyConsolidationOverride, setHomeWarDefenseOverride,
  setWarAllInCapitalOverride,
} = AI;

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const BARB = -1;
const ENEMY_CIV = 2;

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak',
        wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeUnit(id, ownerId, q, r) {
  return { id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2 };
}
function makeCity(id, ownerId, q, r, population) {
  return { id, ownerId, q, r, name: 'TestCity', population };
}
const data = {
  units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }],
  buildings: [{ id: 'koszary', nazwa: 'Koszary' }],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
  aiParams: {},
};

/** Wojna AI(1) z cywilizacja 2 i barbarzyncami; stolica wroga daleko na zachod. */
const WAR_OPTS = (withAllIn) => {
  const opts = {
    canEngageOwner: (t) => t === ENEMY_CIV || t === BARB,
    currentTurn: 1,
    visibleHexes: undefined,
  };
  if (withAllIn) {
    opts.warAllIn = { targets: [{ ownerId: ENEMY_CIV, cityId: 'ec1', q: 2, r: 25 }] };
  }
  return opts;
}

/** Zwraca mapę unitId -> komenda (pierwsza komenda ruchu/ataku danej jednostki). */
function commandsByUnit(cmds) {
  const m = new Map();
  for (const c of cmds) {
    if (c.unitId !== undefined && !m.has(c.unitId)) m.set(c.unitId, c);
  }
  return m;
}
function sameCmd(a, b) {
  if (a === undefined || b === undefined) return a === b;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Scenariusz: miasto AI (pop=5, promien terytorium 5 -> bramka obrony 9 hex), zagrozenie w bramce,
 * wrogie miasto daleko na zachodzie. Obroncą jest jednostka najblizsza zagrozeniu (groupSize=1).
 * Zwraca { defenderId, units, cities, threat } albo jego odmiane.
 */
function scenario({ threatOwner = BARB, threatDist = 7, threatRow = 25 } = {}) {
  const map = makeMap(60, 60);
  const myCity = makeCity('c1', 1, 25, 25, 5);
  const enemyCity = makeCity('ec1', ENEMY_CIV, 2, 25, 5);
  const threat = makeUnit('thr1', threatOwner, 25, 25 + threatDist);
  // Jednostki AI: obroncy blisko zagrozenia, reszta armii dalej (na poziomie miasta / na zachod).
  const units = [
    makeUnit('def1', 1, 25, 27),
    makeUnit('mar1', 1, 22, 25),
    makeUnit('mar2', 1, 22, 24),
    threat,
  ];
  void threatRow;
  return { map, units, cities: [myCity, enemyCity], threat };
}

function nearestOwnUnit(units, threat) {
  const mine = units.filter(u => u.ownerId === 1 && u.ruchLeft > 0);
  return mine.slice().sort((a, b) =>
    hexDistance(a.q, a.r, threat.q, threat.r) - hexDistance(b.q, b.r, threat.q, threat.r) || a.id.localeCompare(b.id))[0];
}

function runBoth(sc) {
  const off = (opts) => decideAITurn(1, sc.units, sc.cities, sc.map, data, opts);
  // Stan bez war-allin: komendy obrony domu takie, jakie wydaje rdzen AI.
  const base = off(WAR_OPTS(false));
  const withAllIn = off(WAR_OPTS(true));
  return { base: commandsByUnit(base), withAllIn: commandsByUnit(withAllIn) };
}

function withFlags(fn) {
  setArmyConsolidationOverride(false);
  setHomeWarDefenseOverride(null);
  setWarAllInCapitalOverride(true);
  try { return fn(); }
  finally {
    setArmyConsolidationOverride(null);
    setHomeWarDefenseOverride(null);
    setWarAllInCapitalOverride(null);
  }
}

withFlags(() => {
  // -------------------------------------------------------------------------
  // T1: obrona przed BARBARZYNCAMI w bramce (dist 7 od miasta, bramka 9).
  // Obrońca musi zachowac komende ruchu ku barbarzyncy; ta sama komenda co w bazie.
  // -------------------------------------------------------------------------
  console.log('\n--- T1: obronca przed barbarzyncami w bramce NIE jest przejmowany przez war-allin ---');
  {
    const sc = scenario({ threatOwner: BARB, threatDist: 7 });
    const defender = nearestOwnUnit(sc.units, sc.threat);
    const { base, withAllIn } = runBoth(sc);
    const cb = base.get(defender.id);
    const ca = withAllIn.get(defender.id);
    assert(cb !== undefined && cb.type === 'move', `T1 baza: obronca ma ruch (${JSON.stringify(cb)})`);
    assert(cb !== undefined && cb.toR > 25, `T1 baza: obronca rusza ku barbarzyncy (toR>25) (${JSON.stringify(cb)})`);
    assert(sameCmd(cb, ca), `T1: komenda obroncy identyczna z baza (baza=${JSON.stringify(cb)}, z war-allin=${JSON.stringify(ca)})`);
  }

  // -------------------------------------------------------------------------
  // T2: reszta armii NADAL idzie na stolice wroga (war-allin dziala dla jednostek marszu).
  // -------------------------------------------------------------------------
  console.log('\n--- T2: jednostki marszu nie ida ku barbarzyncy (war-allin nadal steruje marszem) ---');
  {
    const sc = scenario({ threatOwner: BARB, threatDist: 7 });
    const { withAllIn } = runBoth(sc);
    for (const id of ['mar1', 'mar2']) {
      const c = withAllIn.get(id);
      assert(c === undefined || c.type !== 'move' || c.toR <= 25,
        `T2: ${id} nie maszeruje ku barbarzyncy (${JSON.stringify(c)})`);
    }
  }

  // -------------------------------------------------------------------------
  // T3: granica ujemna -- barbarzynca TUZ POZA bramka (dist 10 > 9): brak obrony,
  // obronca wraca do marszu na stolice (war-allin moze go przejac).
  // -------------------------------------------------------------------------
  console.log('\n--- T3: barbarzynca poza bramka obrony -- brak przydzialu, war-allin przejmuje ---');
  {
    const sc = scenario({ threatOwner: BARB, threatDist: 10 });
    const { withAllIn } = runBoth(sc);
    const defender = nearestOwnUnit(sc.units, sc.threat);
    const ca = withAllIn.get(defender.id);
    assert(ca !== undefined && ca.type === 'move' && ca.toQ < 25,
      `T3: poza bramka obronca idzie na stolice wroga (zachod) (${JSON.stringify(ca)})`);
  }

  // -------------------------------------------------------------------------
  // T4: najezdzca CYWILIZACJI na wlasnym terenie (wojna) -- obronca tez nie jest przejmowany.
  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // T4: najezdzca CYWILIZACJI w bramce obrony -- ZAKRES NIEZMIENIONY. Obrona przed cywilizacjami
  // nalezy do nakladki DEFEND-HOME (applyHomeWarPriorities, ai-war-defend-home-test); ta poprawka
  // obejmuje wylacznie barbarzyncow (ownerId -1). Pin: war-allin nadal przejmuje obronce najezdzcy
  // cywilizacji (stan sprzed poprawki), wiec zmiana tutaj wymagalaby osobnego tematu.
  // -------------------------------------------------------------------------
  console.log('\n--- T4: najezdzca cywilizacji -- poza zakresem poprawki (DEFEND-HOME), zachowanie sprzed zmiany ---');
  {
    const sc = scenario({ threatOwner: ENEMY_CIV, threatDist: 7 });
    const defender = nearestOwnUnit(sc.units, sc.threat);
    const { withAllIn } = runBoth(sc);
    const ca = withAllIn.get(defender.id);
    assert(ca !== undefined && ca.type === 'move' && ca.targetCityId === 'ec1',
      `T4: obronca najezdzcy cywilizacji nadal maszeruje na stolice wroga (pin zakresu) (${JSON.stringify(ca)})`);
  }

  // -------------------------------------------------------------------------
  // T5: deterministycznosc -- dwa identyczne wywolania daja identyczne komendy.
  // -------------------------------------------------------------------------
  console.log('\n--- T5: determinizm ---');
  {
    const sc1 = scenario({ threatOwner: BARB, threatDist: 7 });
    const sc2 = scenario({ threatOwner: BARB, threatDist: 7 });
    const a = JSON.stringify(decideAITurn(1, sc1.units, sc1.cities, sc1.map, data, WAR_OPTS(true)));
    const b = JSON.stringify(decideAITurn(1, sc2.units, sc2.cities, sc2.map, data, WAR_OPTS(true)));
    eq(a, b, 'T5: dwa przebiegi zgodne');
  }
});

console.log(`\nwar-allin-keep-barb-defense-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
process.exit(failed > 0 ? 1 : 0);
