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

const REC_LINE = 'if (cityNeedsGarrison(city, myUnits, city.ownerId)) out.add(city.id);';
const PINNED_LINE = 'let planned = eligible.filter(u => !keep.has(u.id) && !garrisonIds.has(u.id));';
const WORK = fs.mkdtempSync(path.join(process.env.GARRISON_TMP || os.tmpdir(), 'wcg-'));

async function buildBundle(name, mutate, mutateRecruit) {
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
        if (mutateRecruit) {
          if (text.split(REC_LINE).length !== 2) throw new Error('mutacja: nie znaleziono linii out.add garnizonu');
          // mutant: rekrutacja garnizonow pustych miast wylaczona (zawsze pusty zbior)
          text = text.replace(REC_LINE, 'void myUnits;');
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
  const MUT_REC = BASELINE ? null : await buildBundle('mutrec', false, true);

  const runOn = (B) => {
    const s = scenario();
    const cmds = decide(B, s.units);
    return { s, cmds };
  };

  // ---- Wersja poprawiona ----
  {
    const { s, cmds } = runOn(GOOD);
    ok(movesOf(cmds, s.bGarrison.id).length === 0, 'T1: jedyna jednostka w miescie B zostaje garnizonem (brak rozkazu ruchu)');
    // T2 (miasto z dwoma ruchliwymi jednostkami): patrz blok T2 nizej (osobny swiat, miasto A).
    ok(movesOf(cmds, s.generalB.id).length >= 1, 'T4: wodz w miescie B nie jest garnizonem (rozkaz ruchu wydany)');
  }

  // ---- T2: miasto A z DWIEMA ruchliwymi jednostkami -- dokladnie jedna zostaje garnizonem,
  // druga wychodzi (na bazie obie dostawaly rozkaz ruchu). Wynik: liczba rozkazow per jednostka.
  {
    nextUid = 700;
    const u1 = mk(CITY_A.q, CITY_A.r);
    const u2 = mk(CITY_A.q, CITY_A.r);
    const cmds = decide(GOOD, [u1, u2]);
    const n = [u1, u2].map(u => movesOf(cmds, u.id).length);
    ok(n.filter(x => x === 0).length === 1 && n.filter(x => x >= 1).length === 1,
      `T2: w miescie z dwiema jednostkami dokladnie jedna zostaje garnizonem, druga idzie (rozkazow: ${n.join(',')})`);
    // T2b: jednostka, ktora wychodzi, rusza W STRONE celu wojny (T1-T2 nie wystarcza: samo "ma rozkaz" nie dowodzi kierunku).
    const mover = [u1, u2].find(u => movesOf(cmds, u.id).length >= 1);
    const mv = mover !== undefined ? movesOf(cmds, mover.id)[0] : undefined;
    const dBefore = mover !== undefined ? GOOD.hexDistance(mover.q, mover.r, ENEMY1.q, ENEMY1.r) : NaN;
    const dAfter = mv !== undefined ? GOOD.hexDistance(mv.toQ, mv.toR, ENEMY1.q, ENEMY1.r) : NaN;
    ok(mv !== undefined && dAfter < dBefore,
      `T2b: wychodzaca jednostka zbliza sie do celu wojny (odl. ${dBefore} -> ${dAfter})`);
  }

  // ---- T6: miasto z jednostka bez ruchu (ruchLeft 0) juz ma garnizon -- obie ruchliwe jednostki
  // z tego miasta wychodza (na bazie jedna z nich by zostala zatrzymana bez potrzeby).
  {
    nextUid = 900;
    const immobile = mk(CITY_A.q, CITY_A.r, { ruchLeft: 0 });
    const m1 = mk(CITY_A.q, CITY_A.r);
    const m2 = mk(CITY_A.q, CITY_A.r);
    const cmds = decide(GOOD, [immobile, m1, m2]);
    const n = [m1, m2].map(u => movesOf(cmds, u.id).length);
    ok(n.every(x => x >= 1),
      `T6: ruchliwe jednostki w miescie z unieruchomionym obroncą wychodza obie (rozkazow: ${n.join(',')})`);
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
    // Mutant musi lamac sam T2 (dokladnie jedna zostaje): obie jednostki z miasta A dostaja ruch.
    nextUid = 700;
    const mu1 = mk(CITY_A.q, CITY_A.r);
    const mu2 = mk(CITY_A.q, CITY_A.r);
    const mcmds = decide(MUT, [mu1, mu2]);
    const mn = [mu1, mu2].map(u => movesOf(mcmds, u.id).length);
    ok(!(mn.filter(x => x === 0).length === 1 && mn.filter(x => x >= 1).length === 1),
      `MUTACJA T2: mutant nie zostawia dokladnie jednej jednostki (rozkazow: ${mn.join(',')})`);
  }

  // ---- G: REKRUTACJA garnizonu pustych miast (r3) ----
  // data.units jest puste, wiec zwykla produkcja tez zwraca 'Wojownik' -- garnizon rozpoznajemy
  // przez roznice wzgledem mutanta (rekrutacja wylaczona) oraz przez kolejnosc polecen.
  const buildsOf = (cmds) => cmds.filter(c => c.type === 'build');
  const cntW = (cmds, cityId) => buildsOf(cmds).filter(c => c.cityId === cityId && c.buildingId === 'Wojownik').length;
  const decideWith = (B, units, extraOpts) => {
    const opts = Object.assign({
      civType: 'grecy', currentTurn: 40, canEngageOwner: () => true, capitalCityId: CITY_A.id, atWarWithCiv: true,
      warAllIn: { targets: [{ ownerId: 2, cityId: ENEMY1.id, q: ENEMY1.q, r: ENEMY1.r }], enemyArmies: [], engageRadius: 6,
        enemyStrength: [{ ownerId: 2, strength: 0 }] },
    }, extraOpts || {});
    return B.decideAITurn(1, units, CITIES, MAP, data, opts);
  };
  const noWar = { atWarWithCiv: false, warAllIn: undefined };
  const MUTR = MUT_REC !== null ? MUT_REC : GOOD;
  {
    nextUid = 1100;
    const bW = mk(CITY_B.q, CITY_B.r);
    const cScout = mk(CITY_C.q, CITY_C.r, { typeId: 'Zwiadowca', category: 'zwiadowca' });
    const cGen = mk(CITY_C.q, CITY_C.r, { typeId: 'Wodz', category: 'wodz', isGeneral: true });
    const us = [bW, cScout, cGen];
    const cmds = decideWith(GOOD, us);
    const base = decideWith(MUTR, us);
    ok(cntW(cmds, CITY_A.id) === 1, `G1: puste miasto A w wojnie dostaje dokladnie 1 zakup garnizonu (${cntW(cmds, CITY_A.id)})`);
    ok(cntW(cmds, CITY_B.id) === cntW(base, CITY_B.id), 'G2: miasto B z jednostka bojowa nie dostaje dodatkowego garnizonu');
    ok(cntW(cmds, CITY_C.id) === 1, `G3: miasto C z samym zwiadowca/wodzem liczy sie jako puste (${cntW(cmds, CITY_C.id)})`);
    const idxA = buildsOf(cmds).findIndex(c => c.cityId === CITY_A.id);
    const idxC = buildsOf(cmds).findIndex(c => c.cityId === CITY_C.id);
    const idxB = buildsOf(cmds).findIndex(c => c.cityId === CITY_B.id);
    ok(idxA === 0 && idxC === 1 && idxB > idxC, `G4: garnizony pustych miast (A,C) sa przed reszta polecen build (indeksy A=${idxA} C=${idxC} B=${idxB})`);
    ok(JSON.stringify(cmds) === JSON.stringify(decideWith(GOOD, us)), 'G6: determinizm rekrutacji garnizonow');
    const peace = decideWith(GOOD, [bW], noWar);
    const peaceBase = decideWith(MUTR, [bW], noWar);
    // R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1 (korekta kontraktu G7/G9): garnizon min. 1 bojowa
    // w KAZDYM miescie AI, takze w pokoju (wymog wlasciciela 2026-11-18). Puste miasta A i C
    // dostaja garnizon w pokoju; miasto B z jednostka bojowa nie dostaje dodatkowego.
    // Uwaga: przy pustym data.units zwykla produkcja tez zwraca Wojownika, wiec ten test
    // potwierdza jedynie priorytet (indeks 0); dyskryminujacy dowod rekrutacji w pokoju na
    // realnym units.json jest w tools/ai-city-garrison-min-one-test.cjs.
    const peaceIdxA = buildsOf(peace).findIndex(c => c.cityId === CITY_A.id);
    ok(peaceIdxA === 0, `G7: w pokoju puste miasto A dostaje garnizon z priorytetem (idx ${peaceIdxA})`);
    ok(cntW(peace, CITY_B.id) === cntW(peaceBase, CITY_B.id),
      'G7b: w pokoju miasto B z jednostka bojowa nie dostaje dodatkowego garnizonu');
    const barb = { id: 'barb1', ownerId: -1, typeId: 'Wojownik', category: 'miecznik', q: CITY_A.q + 3, r: CITY_A.r, ruch: 2, ruchLeft: 2 };
    const threat = decideWith(GOOD, [bW, barb], noWar);
    const threatBase = decideWith(MUTR, [bW, barb], noWar);
    const firstA = buildsOf(threat).findIndex(c => c.cityId === CITY_A.id);
    ok(firstA === 0 && cntW(threat, CITY_A.id) === 1, `G8: zagrozone puste miasto A (wrog w zasiegu) dostaje garnizon z priorytetem w pokoju z cywilizacjami (idx ${firstA})`);
    ok(cntW(threat, CITY_C.id) === 1, `G9: niezagrozone puste miasto C w pokoju dostaje garnizon (${cntW(threat, CITY_C.id)})`);
  }
  // G10 (r4): realny data/units.json -- zastapienie produkcji jednostki bojowej garnizonem
  // (jeden build na miasto, bez fallbackIds z Wojownikiem). Dowod na danych, nie na pustej tablicy.
  {
    const realUnits = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'units.json'), 'utf8'));
    const dataReal = Object.assign({}, data, { units: realUnits });
    const decideReal = (B, units) => B.decideAITurn(1, units, CITIES, MAP, dataReal, {
      civType: 'grecy', currentTurn: 40, canEngageOwner: () => true, capitalCityId: CITY_A.id, atWarWithCiv: true,
      warAllIn: { targets: [{ ownerId: 2, cityId: ENEMY1.id, q: ENEMY1.q, r: ENEMY1.r }], enemyArmies: [], engageRadius: 6,
        enemyStrength: [{ ownerId: 2, strength: 0 }] },
    });
    nextUid = 1200;
    const cmdsReal = decideReal(GOOD, [mk(CITY_B.q, CITY_B.r)]);
    const aBuilds = buildsOf(cmdsReal).filter(c => c.cityId === CITY_A.id);
    console.log('G10-PROBE', JSON.stringify(aBuilds));
    ok(aBuilds.length === 1 && aBuilds[0].buildingId === 'Wojownik',
      `G10: puste miasto A (realny units.json): dokladnie 1 polecenie build = Wojownik (${aBuilds.length})`);
    ok(aBuilds.length === 1 && !aBuilds[0].fallbackIds.includes('Wojownik'),
      'G10b: fallbackIds garnizonu nie zawieraja Wojownika');
  }
  if (MUT_REC !== null) {
    nextUid = 1100;
    const bW = mk(CITY_B.q, CITY_B.r);
    const cmds = decideWith(GOOD, [bW]);
    const mcmds = decideWith(MUT_REC, [bW]);
    ok(JSON.stringify(cmds) !== JSON.stringify(mcmds), 'MUTACJA G: bez rekrutacji garnizonow polecenia sie roznia (test czerwony na mutancie)');
    ok(buildsOf(mcmds).filter(c => c.cityId === CITY_A.id).length <= 1 && cntW(mcmds, CITY_A.id) <= 1, 'MUTACJA G2: mutant nie ma zdublowanych polecen');
  }

  console.log(`ai-war-city-garrison-test: ${passed} PASS, ${failed} FAIL`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
