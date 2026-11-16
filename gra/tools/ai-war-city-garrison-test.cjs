'use strict';
/**
 * ai-war-city-garrison-test.cjs -- R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1.
 *
 * Kontrakt (w wojnie, sciezka war-all-in): kazde miasto AI z jednostka bojowa na swoim heksie
 * zatrzymuje JEDNA jednostke jako garnizon (nie wychodzi nawet gdy armia idzie na wojne);
 * miasto bez zadnej jednostki bojowej dostaje najblizsza wolna jednostke spoza garnizonow;
 * reszta (nadwyzka) idzie do marszu jak dotad.
 *
 * Prawdziwa funkcja: decideAITurn (ai.ts, bundle esbuild), flagi domyslne (WAR_ALLIN ON,
 * ARMY_CONSOLIDATION ON). Komendy 'move' nie sa wykonywane -- sprawdzane sa wprost.
 *
 * T1 miasto B (1 jednostka) -- jednostka nie dostaje rozkazu ruchu (jedyny obronca zostaje).
 * T2 miasto C (2 jednostki) -- przynajmniej jedna zostaje garnizonem (jedyny obronca nie wychodzi).
 * T4 wodz (isGeneral) w miescie B nie jest garnizonem -- dostaje rozkaz (idzie do zbiorki).
 * T5 determinizm -- dwa identyczne wywolania daja identyczne komendy.
 * Mutacja: bundle bez filtra garnizonow (garnizony wracaja do marszu) MUSI lamac T1/T2.
 *
 * Run (z gra/):  node tools/ai-war-city-garrison-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const PINNED_LINE = 'let planned = eligible.filter(u => !keep.has(u.id) && !garrisonIds.has(u.id));';
const WORK = fs.mkdtempSync(path.join(process.env.GARRISON_TMP || os.tmpdir(), 'wcg-'));

async function buildBundle(name, mutate) {
  const entry = path.join(WORK, `${name}-entry.ts`);
  const out = path.join(WORK, `${name}-bundle.cjs`);
  const srcDir = process.env.GARRISON_SRC_GAME || path.resolve(__dirname, '..', 'src', 'game');
  fs.writeFileSync(entry, `
export { decideAITurn } from ${JSON.stringify(path.join(srcDir, 'ai.ts'))};
export { hexDistance } from ${JSON.stringify(path.resolve(__dirname, '..', 'src', 'units', 'setup.ts'))};
`);
  const plugin = {
    name: 'mutate-garrison',
    setup(b) {
      b.onLoad({ filter: /game[\\/]ai\.ts$/ }, (args) => {
        let text = fs.readFileSync(args.path, 'utf8');
        if (mutate) {
          if (text.split(PINNED_LINE).length !== 2) throw new Error('mutacja: nie znaleziono dokladnie jednej linii planned');
          text = text.replace(PINNED_LINE, 'let planned = eligible.filter(u => !keep.has(u.id));');
          // (mutant: garnizony nie sa wyjmowane z planned -- wracaja do marszu)
        }
        return { contents: text, loader: 'ts' };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out,
    loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent', plugins: [plugin],
  });
  return require(out);
}

let passed = 0;
let failed = 0;
function ok(value, message) { if (value) passed++; else { failed++; console.error('FAIL:', message); } }

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
const MAP = makeMap(70, 50);
const CITY_A = { id: 'cityA', ownerId: 1, q: 10, r: 10, name: 'A', population: 5 };
const CITY_B = { id: 'cityB', ownerId: 1, q: 10, r: 30, name: 'B', population: 5 };
const CITY_C = { id: 'cityC', ownerId: 1, q: 20, r: 20, name: 'C', population: 5 };
const ENEMY1 = { id: 'cityT1', ownerId: 2, q: 50, r: 24, name: 'T1', population: 5 };
const CITIES = [CITY_A, CITY_B, CITY_C, ENEMY1];

let nextUid = 0;
const mk = (q, r, extra = {}) => ({
  id: 'w' + String(nextUid++).padStart(4, '0'), ownerId: 1, typeId: 'Wojownik', category: 'miecznik',
  q, r, ruch: 2, ruchLeft: 2, ...extra,
});

/** Scenariusz: A pusta; B = 1 jednostka; C = 2 jednostki; wolna jednostka przy A; wodz w B. */
function scenario() {
  nextUid = 0;
  const units = [];
  const bGarrison = mk(CITY_B.q, CITY_B.r);
  const cOne = mk(CITY_C.q, CITY_C.r);
  const cTwo = mk(CITY_C.q, CITY_C.r);
  const freeNearA = mk(13, 10);
  const generalB = mk(CITY_B.q, CITY_B.r, { typeId: 'Wodz', category: 'wodz', isGeneral: true });
  units.push(bGarrison, cOne, cTwo, freeNearA, generalB);
  return { units, bGarrison, cOne, cTwo, freeNearA, generalB };
}

function decide(B, units) {
  const opts = {
    civType: 'grecy', currentTurn: 40, canEngageOwner: () => true, capitalCityId: CITY_A.id, atWarWithCiv: true,
    warAllIn: {
      targets: [{ ownerId: 2, cityId: ENEMY1.id, q: ENEMY1.q, r: ENEMY1.r }],
      enemyArmies: [], engageRadius: 6,
      enemyStrength: [{ ownerId: 2, strength: 0 }],
    },
  };
  return B.decideAITurn(1, units, CITIES, MAP, data, opts);
}

const movesOf = (cmds, id) => cmds.filter(c => c.type === 'move' && c.unitId === id);

(async () => {
  const GOOD = await buildBundle('good', false);
  // GARRISON_BASELINE=1: uruchomienie na zrodle bazowym (bez linii pinnedIds) -- mutanta nie budujemy.
  const BASELINE = process.env.GARRISON_BASELINE === '1';
  const MUT = BASELINE ? null : await buildBundle('mut', true);

  const runOn = (B) => {
    const s = scenario();
    const cmds = decide(B, s.units);
    return { s, cmds };
  };

  // ---- Wersja poprawiona ----
  {
    const { s, cmds } = runOn(GOOD);
    ok(movesOf(cmds, s.bGarrison.id).length === 0, 'T1: jedyna jednostka w miescie B zostaje garnizonem (brak rozkazu ruchu)');
    const cMoves = [s.cOne, s.cTwo].map(u => movesOf(cmds, u.id).length);
    ok(cMoves.filter(n => n === 0).length >= 1,
      `T2: w miescie C przynajmniej jedna jednostka zostaje garnizonem (liczba rozkazow: ${cMoves.join(',')})`);
    ok(movesOf(cmds, s.generalB.id).length >= 1, 'T4: wodz w miescie B nie jest garnizonem (rozkaz ruchu wydany)');
  }

  // ---- T5 determinizm: dwa swieze bundle (osobny stan modulu) daja identyczne komendy ----
  {
    const a = runOn(GOOD).cmds;
    const GOOD2 = await buildBundle('good2', false);
    const b = runOn(GOOD2).cmds;
    ok(JSON.stringify(a) === JSON.stringify(b), 'T5: dwa identyczne przebiegi (swieze bundle) daja identyczne komendy');
  }

  // ---- Mutacja: bez pinnedIds garnizony wracaja do marszu -> musi lamac T1-T3 ----
  if (MUT !== null) {
    const { s, cmds } = runOn(MUT);
    const mutBreaks = movesOf(cmds, s.bGarrison.id).length > 0
      || [s.cOne, s.cTwo].every(u => movesOf(cmds, u.id).length >= 1);
    ok(mutBreaks, 'MUTACJA: bez garnizonow jednostki z miast wychodza (test czerwony na mutancie)');
  }

  console.log(`ai-war-city-garrison-test: ${passed} PASS, ${failed} FAIL`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
