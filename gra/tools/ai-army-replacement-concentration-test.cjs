'use strict';
/**
 * ai-army-replacement-concentration-test.cjs -- R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1.
 *
 * Kontrakt: w WOJNIE jednostka spoza skupiska >= ARMY_CONCENTRATION_MIN_UNITS (promien
 * ARMY_CONCENTRATION_RADIUS) nie maszeruje sama na cel. Armia zastepcza (rekrutowana po utracie
 * glownej) zbiera sie w JEDNYM miescie zbiorki (wlasne miasto najblizsze celu); dopiero skupisko
 * >= progu rusza na cel. Prawdziwe funkcje: decideAITurn + planWarReplacementRally (bez atrap AI).
 *
 * Mutacja: bundle z ai.ts, w ktorym wylaczono bramke (`if (false)`), MUSI lamac scenariusze
 * (dowod, ze test lapie regresje). Pomiar pelnej symulacji: tools/ai-army-replacement-sim.cjs
 * (dziecko procesu: PO vs. bramka wylaczona mutacja).
 *
 * Run (z gra/):  node tools/ai-army-replacement-concentration-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GATE_ON = 'if (gateLooseUnits && isArmyConsolidationEnabled()) {';
const WORK = fs.mkdtempSync(path.join(process.env.ARS_TMP || os.tmpdir(), 'arrc-'));

async function buildBundle(name, mutate) {
  const entry = path.join(WORK, `${name}-entry.ts`);
  const out = path.join(WORK, `${name}-bundle.cjs`);
  const srcDir = path.resolve(__dirname, '..', 'src', 'game');
  fs.writeFileSync(entry, `
export { decideAITurn } from ${JSON.stringify(path.join(srcDir, 'ai.ts'))};
export {
  ARMY_CONCENTRATION_MIN_UNITS, ARMY_CONCENTRATION_RADIUS, clusterUnitsByProximity,
  planWarReplacementRally, pickReplacementRallyCity,
} from ${JSON.stringify(path.join(srcDir, 'army-concentration.ts'))};
export { hexDistance } from ${JSON.stringify(path.resolve(__dirname, '..', 'src', 'units', 'setup.ts'))};
`);
  const plugin = {
    name: 'mutate-ai',
    setup(b) {
      b.onLoad({ filter: /game[\\/]ai\.ts$/ }, (args) => {
        let text = fs.readFileSync(args.path, 'utf8');
        if (mutate) {
          if (text.split(GATE_ON).length !== 2) throw new Error('mutacja: nie znaleziono dokladnie jednej bramki w ai.ts');
          text = text.replace(GATE_ON, 'if (false) {');
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
const MAP = makeMap(64, 44);
const CITY_A = { id: 'cityA', ownerId: 1, q: 10, r: 10, name: 'A', population: 5 };
const CITY_B = { id: 'cityB', ownerId: 1, q: 10, r: 26, name: 'B', population: 5 };
const ENEMY = { id: 'cityT', ownerId: 2, q: 44, r: 20, name: 'T', population: 5 };
const CITIES = [CITY_A, CITY_B, ENEMY];
const TARGETS = [{ ownerId: 2, cityId: ENEMY.id, q: ENEMY.q, r: ENEMY.r }];
let nextUid = 0;
const mk = (q, r) => ({ id: 'w' + (nextUid++), ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2 });

/**
 * Zywa petla tur: decideAITurn -> zastosowanie komend 'move' (jak executor) -> opcjonalny hak
 * (rekrutacja/strata). Zwraca metryki: marsze na cel z rozmiarem skupiska < progu, historie pozycji.
 */
function play(B, ownUnits, turns, hook) {
  const stats = { marchBelowThreshold: 0, marchTotal: 0, looseNotApproaching: 0, looseMoves: 0, gatheredTurn: null, gatheredHex: null, clusterTurn: null, launchedTurn: null, minDistToTarget: Infinity, hist: [] };
  const rally = B.pickReplacementRallyCity([CITY_A, CITY_B], TARGETS);
  for (let t = 1; t <= turns; t++) {
    if (hook) hook(t, ownUnits);
    for (const u of ownUnits) u.ruchLeft = u.ruch;
    const clusters = B.clusterUnitsByProximity(ownUnits, B.ARMY_CONCENTRATION_RADIUS);
    const sizeOf = new Map();
    for (const g of clusters) for (const u of g) sizeOf.set(u.id, g.length);
    const opts = {
      civType: 'grecy', currentTurn: 30 + t, canEngageOwner: () => true,
      capitalCityId: CITY_A.id, atWarWithCiv: true,
      warAllIn: { targets: TARGETS, enemyArmies: [], engageRadius: 6, enemyStrength: [{ ownerId: 2, strength: 0 }] },
    };
    const cmds = B.decideAITurn(1, ownUnits, CITIES, MAP, data, opts);
    for (const cmd of cmds) {
      if (cmd.type !== 'move') continue;
      const u = ownUnits.find(x => x.id === cmd.unitId);
      if (!u) continue;
      if (cmd.targetCityId !== undefined) {
        stats.marchTotal++;
        if ((sizeOf.get(u.id) ?? 1) < B.ARMY_CONCENTRATION_MIN_UNITS) stats.marchBelowThreshold++;
        if (stats.launchedTurn === null) stats.launchedTurn = t;
      }
      if ((sizeOf.get(u.id) ?? 1) < B.ARMY_CONCENTRATION_MIN_UNITS) {
        // jednostka luzna: kazdy jej ruch ma byc zblizeniem do miasta zbiorki (nie marszem na cel)
        stats.looseMoves++;
        if (B.hexDistance(cmd.toQ, cmd.toR, rally.q, rally.r) >= B.hexDistance(u.q, u.r, rally.q, rally.r)) stats.looseNotApproaching++;
      }
      u.q = cmd.toQ; u.r = cmd.toR;
    }
    if (stats.clusterTurn === null && B.clusterUnitsByProximity(ownUnits, B.ARMY_CONCENTRATION_RADIUS).some(g => g.length >= B.ARMY_CONCENTRATION_MIN_UNITS)) stats.clusterTurn = t;
    const byHex = new Map();
    for (const u of ownUnits) byHex.set(`${u.q},${u.r}`, (byHex.get(`${u.q},${u.r}`) || 0) + 1);
    for (const [k, n] of byHex) {
      if (n >= B.ARMY_CONCENTRATION_MIN_UNITS && stats.gatheredTurn === null) {
        stats.gatheredTurn = t; stats.gatheredHex = k;
      }
    }
    for (const u of ownUnits) stats.minDistToTarget = Math.min(stats.minDistToTarget, B.hexDistance(u.q, u.r, ENEMY.q, ENEMY.r));
    stats.hist.push(ownUnits.map(u => `${u.q},${u.r}`).join(' '));
  }
  return stats;
}

function scenarioFreshArmy(B) {
  // 5 swiezych, ROZPROSZONYCH jednostek (2 w A, 2 w B, 1 w polu): zadna nie jest w skupisku >= 3.
  const units = [mk(10, 10), mk(10, 10), mk(10, 26), mk(10, 26), mk(14, 18)];
  return { units, stats: play(B, units, 40) };
}

function scenarioReplacementAfterLoss(B) {
  // Glowna armia (6) maszeruje z A, zostaje zniszczona w t=4; potem w A i B rekrutowane sa po 1 jednostce co 2 tury.
  const units = [];
  for (let i = 0; i < 6; i++) units.push(mk(10, 10));
  let spawned = 0;
  const hook = (t, arr) => {
    if (t === 5) arr.splice(0, arr.length); // armia glowna zniszczona
    if (t >= 6 && t % 2 === 0 && spawned < 8) {
      const c = spawned % 2 === 0 ? CITY_A : CITY_B;
      arr.push(mk(c.q, c.r));
      spawned++;
    }
  };
  const stats = play(B, units, 40, hook);
  return { units, stats };
}

(async () => {
  const GOOD = await buildBundle('good', false);
  const MUT = await buildBundle('mut', true);
  const B = GOOD;

  // ---- Kontrakt: stale z army-concentration.ts ponownie uzyte, nie zduplikowane ----
  ok(B.ARMY_CONCENTRATION_MIN_UNITS === 3 && B.ARMY_CONCENTRATION_RADIUS === 4, 'kontrakt: prog 3 / promien 4 (reuzyte)');

  // ---- Jednostkowy kontrakt planWarReplacementRally / pickReplacementRallyCity ----
  const nearT = B.hexDistance(CITY_A.q, CITY_A.r, ENEMY.q, ENEMY.r) <= B.hexDistance(CITY_B.q, CITY_B.r, ENEMY.q, ENEMY.r) ? CITY_A : CITY_B;
  ok(B.pickReplacementRallyCity([CITY_A, CITY_B], TARGETS).id === nearT.id, 'miasto zbiorki = wlasne miasto najblizsze celu');
  ok(B.pickReplacementRallyCity([CITY_B, CITY_A], TARGETS).id === nearT.id, 'miasto zbiorki niezalezne od kolejnosci listy');
  ok(B.pickReplacementRallyCity([], TARGETS) === undefined, 'brak miast -> brak punktu zbiorki');
  {
    const loose = [mk(0, 0), mk(30, 0)];
    ok(B.planWarReplacementRally(loose, [], [CITY_A], []) === null, 'brak celow -> null (zachowanie dotychczasowe)');
    ok(B.planWarReplacementRally(loose, [], [], TARGETS) === null, 'brak miast -> null (zachowanie dotychczasowe)');
    const plan = B.planWarReplacementRally(loose, [], [CITY_A], TARGETS);
    ok(plan !== null && plan.looseUnitIds.length === 2 && plan.moveUnitIds.length === 2, '2 luzne jednostki (<3) -> obie zbieraja sie');
    const army = [mk(0, 0), mk(1, 0), mk(0, 1), mk(40, 0)];
    const plan2 = B.planWarReplacementRally(army, [], [CITY_A], TARGETS);
    ok(plan2 !== null && plan2.looseUnitIds.length === 1 && plan2.looseUnitIds[0] === army[3].id, 'skupisko >=3 rusza, tylko osamotniona jednostka jest luzna');
    const plan3 = B.planWarReplacementRally(army.slice(0, 3), [], [CITY_A], TARGETS);
    ok(plan3 === null, 'skupisko dokladnie 3 (prog) -> brak luznych (armia ruszy)');
    // jednostki walczace (kontekst) licza sie do skupiska, ale nie sa przekierowywane
    const fighting = [mk(1, 0), mk(0, 1)];
    const lone = mk(0, 0);
    ok(B.planWarReplacementRally([lone], fighting, [CITY_A], TARGETS) === null, 'jednostka obok 2 walczacych (razem 3) nie jest luzna');
    const atRally = mk(CITY_A.q, CITY_A.r);
    const plan4 = B.planWarReplacementRally([atRally], [], [CITY_A], [{ q: ENEMY.q, r: ENEMY.r }]);
    ok(plan4 !== null && plan4.moveUnitIds.length === 0 && plan4.looseUnitIds.length === 1, 'jednostka juz w miescie zbiorki: czeka, bez ruchu');
  }

  // ---- Scenariusz 1: swieza, rozproszona armia ----
  const s1 = scenarioFreshArmy(B);
  ok(s1.stats.marchBelowThreshold === 0,
    `S1: ZADNA jednostka nie maszeruje na cel z skupiska < 3 (naruszen: ${s1.stats.marchBelowThreshold})`);
  ok(s1.stats.looseMoves > 0 && s1.stats.looseNotApproaching === 0,
    `S1: kazdy ruch jednostki luznej zbliza ja do miasta zbiorki ${nearT.id} (ruchow: ${s1.stats.looseMoves}, niezgodnych: ${s1.stats.looseNotApproaching})`);
  ok(s1.stats.clusterTurn !== null && s1.stats.launchedTurn !== null && s1.stats.launchedTurn > s1.stats.clusterTurn - 1,
    `S1: skupisko >=3 powstaje (t=${s1.stats.clusterTurn}) i dopiero po nim rusza marsz na cel (t=${s1.stats.launchedTurn})`);
  ok(s1.stats.minDistToTarget < B.hexDistance(nearT.q, nearT.r, ENEMY.q, ENEMY.r),
    'S1: po zebraniu progu armia faktycznie zbliza sie do celu');

  // ---- Scenariusz 2: armia zastepcza po utracie glownej ----
  const s2 = scenarioReplacementAfterLoss(B);
  ok(s2.stats.marchBelowThreshold === 0,
    `S2: po utracie armii glownej nowe jednostki nie ida pojedynczo na cel (naruszen: ${s2.stats.marchBelowThreshold})`);
  ok(s2.stats.looseMoves > 0 && s2.stats.looseNotApproaching === 0,
    `S2: nowe jednostki luzne ida do JEDNEGO miasta zbiorki ${nearT.id} (ruchow: ${s2.stats.looseMoves}, niezgodnych: ${s2.stats.looseNotApproaching})`);
  ok(s2.stats.clusterTurn !== null, `S2: z nowych jednostek powstaje nowa armia glowna (skupisko >=3, t=${s2.stats.clusterTurn})`);

  // ---- Mutacja: bramka wylaczona -> test MUSI zawiesc ----
  const m1 = scenarioFreshArmy(MUT);
  const m2 = scenarioReplacementAfterLoss(MUT);
  ok(m1.stats.marchBelowThreshold > 0, `MUTACJA S1: bez bramki jednostki ida pojedynczo (naruszen: ${m1.stats.marchBelowThreshold}) -- test lapie regresje`);
  ok(m2.stats.marchBelowThreshold > 0, `MUTACJA S2: bez bramki armia zastepcza trickluje (naruszen: ${m2.stats.marchBelowThreshold}) -- test lapie regresje`);

  // ---- Regresja: zdrowa armia (skupisko >= 3) nadal rusza od razu, bez opoznienia przez bramke ----
  {
    const army = [mk(10, 10), mk(10, 10), mk(10, 10), mk(11, 10)];
    const st = play(B, army, 3);
    ok(st.launchedTurn === 1 && st.marchBelowThreshold === 0, 'regresja: skupisko 4 jednostek rusza w turze 1 (bramka nie hamuje zebranej armii)');
  }

  // ---- Pomiar pelnej symulacji (dziecko procesu): PO vs bramka wylaczona mutacja ----
  const sim = path.resolve(__dirname, 'ai-army-replacement-sim.cjs');
  const runSim = (label, mutateEnv) => {
    const outF = path.join(WORK, `sim-${label}.json`);
    cp.execFileSync(process.execPath, [sim, '--seeds', '1,2', '--worlds', 'flat', '--turns', '70', '--label', label, '--out', outF],
      { env: { ...process.env, ARS_TMP: WORK, ARS_MUTATE: mutateEnv }, stdio: 'pipe', timeout: 280000 });
    return JSON.parse(fs.readFileSync(outF, 'utf8')).summary;
  };
  const simPost = runSim('post', '');
  const simMut = runSim('mut', 'gate-off');
  console.log(`POMIAR (2 ziarna x 70 tur, flat): marsz-ponizej-progu PO=${simPost.marchBelowThreshold.share.toFixed(3)} (mutacja ${simMut.marchBelowThreshold.share.toFixed(3)}); ` +
    `ms/tura AI PO=${simPost.aiMsPerCall.toFixed(1)} (mutacja ${simMut.aiMsPerCall.toFixed(1)})`);
  ok(simMut.marchBelowThreshold.share > 0.10, 'pomiar: bez bramki >10% marszow jednostek ze skupiska < 3 (stan przed poprawka)');
  ok(simPost.marchBelowThreshold.share < simMut.marchBelowThreshold.share * 0.5,
    'pomiar: z bramka udzial marszow ponizej progu spada o co najmniej polowe');
  ok(simPost.aiMsPerCall <= simMut.aiMsPerCall * 1.5 + 5, 'pomiar: czas tury AI nie rosnie znaczaco (<= 1.5x + 5 ms)');

  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
