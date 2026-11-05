'use strict';
/**
 * war-allin-general-path-barb-defense-test.cjs -- R-WEB-WAR-ALLIN-GENERAL-PATH-BARB-DEFENSE-Q1.
 * Run from gra/:  node tools/war-allin-general-path-barb-defense-test.cjs
 *
 * Problem: sciezka kampanii wodza (appendAiGeneralCampaignOrders, etap 'attacking') wraca z
 * decideAITurnCore PRZED krokiem 4b2 (obrona domu). Drugie wywolanie applyWarAllInCapitalToCommands
 * w tej sciezce nie dostawalo zbioru obroncow, wiec obronca domu przed barbarzyncami byl wysylany
 * na stolice wroga, mimo ze barbarzynca stal w bramce obrony miasta.
 * Zasada: obronca przed barbarzyncami nie jest przejmowany przez war-allin w ZADNEJ sciezce.
 *
 * Metoda pomiaru: ten sam stan, rozkaz ruchu jednostki-obroncy (def1) przed i po poprawce.
 * Testy importuja RZECZYWISTE decideAITurn z ai.ts (esbuild bundle), bez kopiowania logiki.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[war-allin-general-path-barb-defense] esbuild not found. Run: npm ci --ignore-scripts (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE  = path.resolve(__dirname, '.war-allin-general-path-barb-defense-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.war-allin-general-path-barb-defense-bundle.cjs');

const ENTRY_TS = `
export { decideAITurn } from ${JSON.stringify(AI_SRC + '/game/ai')};
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
  console.error('[war-allin-general-path-barb-defense] esbuild bundling failed:\n', e.message || e);
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
const MY_CITY = { q: 25, r: 25 };
const ENEMY_CAPITAL = { q: 2, r: 25 };

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

function makeUnit(id, ownerId, q, r, extra) {
  return { id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, ...(extra || {}) };
}
const data = {
  units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }],
  buildings: [{ id: 'koszary', nazwa: 'Koszary' }],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
  aiParams: {},
};

/** Kampania wodza w etapie attacking: generał zyje, cel = stolica wroga. */
function campaignOpts(turn = 6) {
  return {
    currentTurn: turn,
    canEngageOwner: (t) => t === ENEMY_CIV || t === BARB,
    aiGeneralWarCampaign: {
      targetOwnerId: ENEMY_CIV, stage: 'attacking', generalUnitId: 'gen1',
      gatherTurnsCompleted: 5, turn,
      target: { ownerId: ENEMY_CIV, cityId: 'ec1', q: ENEMY_CAPITAL.q, r: ENEMY_CAPITAL.r },
    },
  };
}

/**
 * Scenariusz: miasto AI (pop=5, bramka obrony 9 hex), barbarzynca w odleglosci threatDist od miasta,
 * generał i zwykli zolnierze na zachod od miasta (w kierunku stolicy wroga), obronca miedzy nimi.
 */
function scenario({ threatOwner = BARB, threatDist = 7, extraUnits = [] } = {}) {
  const map = makeMap(60, 60);
  const cities = [
    { id: 'c1', ownerId: 1, q: MY_CITY.q, r: MY_CITY.r, name: 'TestCity', population: 5 },
    { id: 'ec1', ownerId: ENEMY_CIV, q: ENEMY_CAPITAL.q, r: ENEMY_CAPITAL.r, name: 'Enemy', population: 5 },
  ];
  const threat = makeUnit('thr1', threatOwner, MY_CITY.q, MY_CITY.r + threatDist);
  const units = [
    makeUnit('gen1', 1, 22, 25, { isGeneral: true }),
    makeUnit('def1', 1, 25, 27),
    makeUnit('mar1', 1, 22, 24),
    threat,
    ...extraUnits,
  ];
  return { map, units, cities, threat };
}

function commandsByUnit(cmds) {
  const m = new Map();
  for (const c of cmds) {
    if (c.unitId !== undefined && !m.has(c.unitId)) m.set(c.unitId, c);
  }
  return m;
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
  // T1: obronca domu przy barbarzyncy w bramce NIE idzie na stolice wroga -- rusza ku barbarzyncy.
  // PRZED poprawka: def1 dostaje ruch na zachod (toQ < 25, na stolice).
  // -------------------------------------------------------------------------
  console.log('\n--- T1: obronca domu (kampania wodza, etap attacking) rusza ku barbarzyncy w bramce ---');
  {
    const sc = scenario({ threatOwner: BARB, threatDist: 7 });
    const cmds = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data, campaignOpts()));
    const cd = cmds.get('def1');
    assert(cd !== undefined && cd.type === 'move', `T1: obronca ma ruch (${JSON.stringify(cd)})`);
    if (cd !== undefined && cd.type === 'move') {
      const before = hexDistance(25, 27, sc.threat.q, sc.threat.r);
      const after = hexDistance(cd.toQ, cd.toR, sc.threat.q, sc.threat.r);
      assert(after < before, `T1: krok obroncy zbliza do barbarzyncy (przed=${before}, po=${after}, ruch=${JSON.stringify(cd)})`);
      assert(cd.toQ >= 25, `T1: obronca nie idzie na zachod, na stolice wroga (${JSON.stringify(cd)})`);
      assert(cd.targetCityId === undefined, `T1: obronca nie ma celu-miasta wroga (${JSON.stringify(cd)})`);
    }
  }

  // -------------------------------------------------------------------------
  // T2: reszta armii NADAL idzie na stolice wroga (kampania steruje marszem).
  // -------------------------------------------------------------------------
  console.log('\n--- T2: jednostki marszu kampanii nadal ida na stolice wroga ---');
  {
    const sc = scenario({ threatOwner: BARB, threatDist: 7 });
    const cmds = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data, campaignOpts()));
    for (const id of ['gen1', 'mar1']) {
      const c = cmds.get(id);
      assert(c !== undefined && c.type === 'move' && c.targetCityId === 'ec1',
        `T2: ${id} maszeruje na stolice wroga (${JSON.stringify(c)})`);
    }
  }

  // -------------------------------------------------------------------------
  // T3: granica -- barbarzynca POZA bramka obrony (dist 10 > 9): brak przydzialu, obronca
  // wraca do marszu kampanii na stolice wroga.
  // -------------------------------------------------------------------------
  console.log('\n--- T3: barbarzynca poza bramka obrony -- brak przydzialu, obronca idzie na stolice ---');
  {
    const sc = scenario({ threatOwner: BARB, threatDist: 10 });
    const cmds = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data, campaignOpts()));
    const cd = cmds.get('def1');
    assert(cd !== undefined && cd.type === 'move' && cd.toQ < 25,
      `T3: poza bramka obronca idzie na stolice wroga (zachod) (${JSON.stringify(cd)})`);
  }

  // -------------------------------------------------------------------------
  // T4: obronca w TYM SAMYM heksie co zwykly zolnierz kampanii (stos) -- nie jest rozwijany
  // do stolicy przez ekspansje stosu; zachowuje ruch ku barbarzyncy.
  // -------------------------------------------------------------------------
  console.log('\n--- T4: obronca w stosie z zolnierzem kampanii zachowuje ruch ku barbarzyncy ---');
  {
    const map = makeMap(60, 60);
    const cities = [
      { id: 'c1', ownerId: 1, q: MY_CITY.q, r: MY_CITY.r, name: 'TestCity', population: 5 },
      { id: 'ec1', ownerId: ENEMY_CIV, q: ENEMY_CAPITAL.q, r: ENEMY_CAPITAL.r, name: 'Enemy', population: 5 },
    ];
    const threat = makeUnit('thr1', BARB, 25, 32);
    const units = [
      makeUnit('gen1', 1, 22, 25, { isGeneral: true }),
      makeUnit('def1', 1, 25, 27),
      makeUnit('mar1', 1, 25, 27),
      makeUnit('mar2', 1, 25, 27),
      threat,
    ];
    const cmds = decideAITurn(1, units, cities, map, data, campaignOpts());
    // Wszystkie rozkazy obroncy (nie tylko pierwszy): zduplikowany rozkaz na stolice tez jest bledem.
    const defMoves = cmds.filter(c => c.unitId === 'def1');
    assert(defMoves.length === 1, `T4: obronca dostaje dokladnie jeden rozkaz (${JSON.stringify(defMoves)})`);
    const cd = defMoves[0];
    assert(cd !== undefined && cd.type === 'move' && hexDistance(cd.toQ, cd.toR, 25, 32) < hexDistance(25, 27, 25, 32),
      `T4: obronca w stosie zbliza sie do barbarzyncy (${JSON.stringify(cd)})`);
    assert(cd === undefined || cd.targetCityId === undefined,
      `T4: obronca w stosie nie dostaje celu-miasta wroga (${JSON.stringify(cd)})`);
  }

  // -------------------------------------------------------------------------
  // T5: NIE kampania (brak aiGeneralWarCampaign) -- sciezka glowna bez zmian: obronca rusza ku
  // barbarzyncy, komenda identyczna przy war-allin i bez (pin zachowania sprzed poprawki).
  // -------------------------------------------------------------------------
  console.log('\n--- T5: sciezka glowna (bez kampanii) -- zachowanie bez zmian ---');
  {
    const sc = scenario({ threatOwner: BARB, threatDist: 7 });
    const withAllIn = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data,
      { currentTurn: 1, canEngageOwner: (t) => t === ENEMY_CIV || t === BARB,
        warAllIn: { targets: [{ ownerId: ENEMY_CIV, cityId: 'ec1', q: ENEMY_CAPITAL.q, r: ENEMY_CAPITAL.r }] } }));
    const cd = withAllIn.get('def1');
    assert(cd !== undefined && cd.type === 'move' && cd.toQ >= 25,
      `T5: sciezka glowna -- obronca ku barbarzyncy (${JSON.stringify(cd)})`);
  }

  // -------------------------------------------------------------------------
  // T7: zatrzymany obronca domu NIE jest kotwica armii zastepczej. Dwie luzne jednostki zastepcze
  // stoja w promieniu skupiska od obroncy. Gdyby obronca liczyl sie do skupiska (3 >= MIN), zastepcy
  // nie zostaliby luzni i maszerowaliby pojedynczo na stolice; z wykluczeniem obroncy (2 < MIN)
  // sa luzne i ida do miasta zbiorki (c1). Sciezka glowna, ARMY_CONSOLIDATION ON.
  // -------------------------------------------------------------------------
  console.log('\n--- T7: obronca domu nie jest kotwica armii zastepczej (planWarReplacementRally) ---');
  {
    setArmyConsolidationOverride(true);
    try {
      const map = makeMap(60, 60);
      const cities = [
        { id: 'c1', ownerId: 1, q: MY_CITY.q, r: MY_CITY.r, name: 'TestCity', population: 5 },
        { id: 'ec1', ownerId: ENEMY_CIV, q: ENEMY_CAPITAL.q, r: ENEMY_CAPITAL.r, name: 'Enemy', population: 5 },
      ];
      const threat = makeUnit('thr1', BARB, 25, 32);
      const units = [
        makeUnit('def1', 1, 25, 27),
        makeUnit('rep1', 1, 21, 27),
        makeUnit('rep2', 1, 21, 28),
        threat,
      ];
      const cmds = commandsByUnit(decideAITurn(1, units, cities, map, data,
        { currentTurn: 1, canEngageOwner: (t) => t === ENEMY_CIV || t === BARB,
          warAllIn: { targets: [{ ownerId: ENEMY_CIV, cityId: 'ec1', q: ENEMY_CAPITAL.q, r: ENEMY_CAPITAL.r }] } }));
      const cd = cmds.get('def1');
      assert(cd !== undefined && cd.type === 'move' && hexDistance(cd.toQ, cd.toR, 25, 32) < 5,
        `T7: obronca nadal zbliza sie do barbarzyncy (${JSON.stringify(cd)})`);
      const repStart = { rep1: [21, 27], rep2: [21, 28] };
      for (const id of Object.keys(repStart)) {
        const c = cmds.get(id);
        const [sq, sr] = repStart[id];
        // R-WEB-MOVE-PASS-THROUGH-OWN-UNITS-Q1: rep2 jest drugim obronca domu (kworum 2: najblizszy barbarzyncy po
        // def1), nie luzna jednostka -- jego krok to trasa ku barbarzyncy; remis rownowaznych tras zalezy od tego,
        // czy wlasne jednostki blokuja Dijkstre (teraz przechodza), wiec dopuszczamy oba kierunki dozwolone
        // (miasto zbiorki ALBO barbarzynca), nadal NIE stolica wroga (brak targetCityId).
        assert(c !== undefined && c.type === 'move' && c.targetCityId === undefined
          && (hexDistance(c.toQ, c.toR, MY_CITY.q, MY_CITY.r) < hexDistance(sq, sr, MY_CITY.q, MY_CITY.r)
            || hexDistance(c.toQ, c.toR, threat.q, threat.r) < hexDistance(sq, sr, threat.q, threat.r)),
        `T7: zastepca ${id} idzie do miasta zbiorki c1 (lub obrona ku barbarzyncy), nie na stolice (${JSON.stringify(c)})`);
      }
    } finally {
      setArmyConsolidationOverride(false);
    }
  }

  // -------------------------------------------------------------------------
  // T8: obrona domu w kampanii wodza wybiera WOJSKO -- cywil (robotnik), jednostka na okrecie
  // i sam wodz kampanii, choc bliżej barbarzyncy, nie sa przydzielani jako obrona.
  // PRZED poprawka planCampaignBarbarianHomeDefense brala pelny myUnits: najblizszy cywil/wodz
  // dostawal ruch ku barbarzyncy i wypadal z marszu kampanii; obronca def1 zostawal bez rozkazu.
  // -------------------------------------------------------------------------
  console.log('\n--- T8: obrona domu w kampanii wybiera wojsko, nie cywila / okret / wodza ---');
  {
    const cases = [
      { name: 'cywil (robotnik) bliżej', extra: [makeUnit('wrk1', 1, 25, 29, { category: 'robotnik', typeId: 'Robotnik' })], nearId: 'wrk1' },
      { name: 'jednostka na okrecie bliżej', extra: [makeUnit('emb1', 1, 25, 30, { embarked: true })], nearId: 'emb1' },
      { name: 'wodz kampanii bliżej', extra: [], genAt: [25, 30], nearId: 'gen1' },
    ];
    for (const cs of cases) {
      const map = makeMap(60, 60);
      const cities = [
        { id: 'c1', ownerId: 1, q: MY_CITY.q, r: MY_CITY.r, name: 'TestCity', population: 5 },
        { id: 'ec1', ownerId: ENEMY_CIV, q: ENEMY_CAPITAL.q, r: ENEMY_CAPITAL.r, name: 'Enemy', population: 5 },
      ];
      const genQ = cs.genAt ? cs.genAt[0] : 22;
      const genR = cs.genAt ? cs.genAt[1] : 25;
      const threat = makeUnit('thr1', BARB, 25, 32);
      const units = [
        makeUnit('gen1', 1, genQ, genR, { isGeneral: true }),
        makeUnit('def1', 1, 25, 27),
        ...cs.extra,
        threat,
      ];
      const cmds = commandsByUnit(decideAITurn(1, units, cities, map, data, campaignOpts()));
      const cd = cmds.get('def1');
      assert(cd !== undefined && cd.type === 'move' && hexDistance(cd.toQ, cd.toR, 25, 32) < hexDistance(25, 27, 25, 32),
        `T8 (${cs.name}): wojskowy obronca def1 zbliza sie do barbarzyncy (${JSON.stringify(cd)})`);
      const near = cmds.get(cs.nearId);
      if (cs.nearId === 'gen1') {
        assert(near !== undefined && near.type === 'move' && near.targetCityId === 'ec1',
          `T8 (${cs.name}): wodz nie wypada z marszu na stolice (${JSON.stringify(near)})`);
      } else if (cs.nearId === 'emb1') {
        assert(near === undefined || near.type !== 'move' || near.toQ !== undefined,
          `T8 (${cs.name}): jednostka na okrecie nie jest obroncą (${JSON.stringify(near)})`);
      } else {
        assert(near === undefined || near.type !== 'move' || hexDistance(near.toQ, near.toR, 25, 32) >= hexDistance(25, 29, 25, 32),
          `T8 (${cs.name}): cywil nie jest obroncą domu (${JSON.stringify(near)})`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // T9: stos z JEDNYM obroncą domu i JEDNYM zwyklym zolnierzem kampanii. Obronca idzie ku
  // barbarzyncy; zolnierz (po odfiltrowaniu obroncy stos ma <2 jednostek, ekspansja stosu pominieta)
  // NADAL dostaje rozkaz marszu na stolice wroga -- nie zostaje bez rozkazu.
  // -------------------------------------------------------------------------
  console.log('\n--- T9: stos z obroncą i zolnierzem kampanii -- zolnierz dostaje marsz na stolice ---');
  {
    const map = makeMap(60, 60);
    const cities = [
      { id: 'c1', ownerId: 1, q: MY_CITY.q, r: MY_CITY.r, name: 'TestCity', population: 5 },
      { id: 'ec1', ownerId: ENEMY_CIV, q: ENEMY_CAPITAL.q, r: ENEMY_CAPITAL.r, name: 'Enemy', population: 5 },
    ];
    const threat = makeUnit('thr1', BARB, 25, 32);
    const units = [
      makeUnit('gen1', 1, 22, 25, { isGeneral: true }),
      makeUnit('def1', 1, 25, 27),
      makeUnit('mar1', 1, 25, 27),
      threat,
    ];
    const cmds = decideAITurn(1, units, cities, map, data, campaignOpts());
    const cd = cmds.find(c => c.unitId === 'def1');
    assert(cd !== undefined && cd.type === 'move' && hexDistance(cd.toQ, cd.toR, 25, 32) < hexDistance(25, 27, 25, 32),
      `T9: obronca w stosie zbliza sie do barbarzyncy (${JSON.stringify(cd)})`);
    const mv = cmds.filter(c => c.unitId === 'mar1');
    assert(mv.length === 1, `T9: zolnierz kampanii dostaje dokladnie jeden rozkaz (${JSON.stringify(mv)})`);
    const m = mv[0];
    assert(m !== undefined && m.type === 'move' && hexDistance(m.toQ, m.toR, ENEMY_CAPITAL.q, ENEMY_CAPITAL.r) < hexDistance(25, 27, ENEMY_CAPITAL.q, ENEMY_CAPITAL.r),
      `T9: zolnierz kampanii idzie w strone stolicy wroga (${JSON.stringify(m)})`);
  }

  // -------------------------------------------------------------------------
  // T6: determinizm -- dwa identyczne wywolania daja identyczne komendy.
  // -------------------------------------------------------------------------
  console.log('\n--- T6: determinizm ---');
  {
    const sc1 = scenario({ threatOwner: BARB, threatDist: 7 });
    const sc2 = scenario({ threatOwner: BARB, threatDist: 7 });
    const a = JSON.stringify(decideAITurn(1, sc1.units, sc1.cities, sc1.map, data, campaignOpts()));
    const b = JSON.stringify(decideAITurn(1, sc2.units, sc2.cities, sc2.map, data, campaignOpts()));
    eq(a, b, 'T6: dwa przebiegi zgodne');
  }
});

// Pomiar czasu decyzji (bez asercji): mediana ms na scenariuszu kampanii wodza z barbarzyncą.
if (process.env.BARB_DEF_PERF === '1') {
  const times = [];
  for (let i = 0; i < 60; i++) {
    const sc = scenario({ threatOwner: BARB, threatDist: 7 });
    const t0 = process.hrtime.bigint();
    decideAITurn(1, sc.units, sc.cities, sc.map, data, campaignOpts());
    times.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  times.sort((a, b) => a - b);
  console.log(`PERF campaign-barb median_ms=${times[30].toFixed(3)} p10=${times[6].toFixed(3)} p90=${times[54].toFixed(3)} n=${times.length}`);
}
console.log(`\nwar-allin-general-path-barb-defense-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
process.exit(failed > 0 ? 1 : 0);
