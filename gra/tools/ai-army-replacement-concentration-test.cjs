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
  planWarReplacementRally, pickReplacementRallyCity, resetReplacementRallyState, WAR_REPLACEMENT_RALLY_MAX_WAIT_TURNS, WAR_REPLACEMENT_RALLY_MAX_LOOSE_TURNS,
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
  const stats = { marchBelowThreshold: 0, marchTotal: 0, looseNotApproaching: 0, looseMoves: 0, gatheredTurn: null, gatheredHex: null, clusterTurn: null, launchedTurn: null, minDistToTarget: Infinity, hist: [], violTurns: [], notApproachTurns: [], legitLaunchTurn: null };
  const rally = B.pickReplacementRallyCity([CITY_A, CITY_B], TARGETS);
  for (let t = 1; t <= turns; t++) {
    if (hook && hook(t, ownUnits) === 'reset') stats.legitLaunchTurn = null;
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
        if ((sizeOf.get(u.id) ?? 1) < B.ARMY_CONCENTRATION_MIN_UNITS) { stats.marchBelowThreshold++; stats.violTurns.push(t); }
        else if (stats.legitLaunchTurn === null) stats.legitLaunchTurn = t;
        if (stats.launchedTurn === null) stats.launchedTurn = t;
      }
      if ((sizeOf.get(u.id) ?? 1) < B.ARMY_CONCENTRATION_MIN_UNITS) {
        // jednostka luzna: kazdy jej ruch ma byc zblizeniem do miasta zbiorki (nie marszem na cel)
        stats.looseMoves++;
        if (B.hexDistance(cmd.toQ, cmd.toR, rally.q, rally.r) >= B.hexDistance(u.q, u.r, rally.q, rally.r)) { stats.looseNotApproaching++; stats.notApproachTurns.push(t); }
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
  // Naruszenia liczone DO pierwszego legalnego startu skupiska >= progu. Po nim reszta (np. para bez
  // uzupelnienia) jest z zalozenia zwalniana limitem oczekiwania (anty-zastoj) i maszeruje -- patrz S4.
  const cut = stats.legitLaunchTurn === null ? Infinity : stats.legitLaunchTurn;
  stats.violPre = stats.violTurns.filter(x => x <= cut).length;
  stats.notApproachPre = stats.notApproachTurns.filter(x => x <= cut).length;
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
    if (t === 5) { arr.splice(0, arr.length); return 'reset'; } // armia glowna zniszczona; nowa fala
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
    const loose = [mk(0, 0), mk(30, 0), mk(0, 30)];
    ok(B.planWarReplacementRally(loose, [], [CITY_A], []) === null, 'brak celow -> null (zachowanie dotychczasowe)');
    ok(B.planWarReplacementRally(loose, [], [], TARGETS) === null, 'brak miast -> null (zachowanie dotychczasowe)');
    const plan = B.planWarReplacementRally(loose, [], [CITY_A], TARGETS);
    ok(plan !== null && plan.looseUnitIds.length === 3 && plan.moveUnitIds.length === 3, '3 rozproszone jednostki (zadne skupisko >=3) -> wszystkie zbieraja sie');
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
    const plan4 = B.planWarReplacementRally([atRally, mk(30, 0), mk(0, 30)], [], [CITY_A], [{ q: ENEMY.q, r: ENEMY.r }]);
    ok(plan4 !== null && plan4.looseUnitIds.includes(atRally.id) && !plan4.moveUnitIds.includes(atRally.id), 'jednostka juz w miescie zbiorki: czeka, bez ruchu');
  }

  // ---- Scenariusz 1: swieza, rozproszona armia ----
  const s1 = scenarioFreshArmy(B);
  ok(s1.stats.violPre === 0,
    `S1: ZADNA jednostka nie maszeruje na cel z skupiska < 3 (naruszen przed startem armii: ${s1.stats.violPre})`);
  ok(s1.stats.looseMoves > 0 && s1.stats.notApproachPre === 0,
    `S1: kazdy ruch jednostki luznej zbliza ja do miasta zbiorki ${nearT.id} (ruchow: ${s1.stats.looseMoves}, niezgodnych: ${s1.stats.notApproachPre})`);
  ok(s1.stats.clusterTurn !== null && s1.stats.launchedTurn !== null && s1.stats.launchedTurn > s1.stats.clusterTurn - 1,
    `S1: skupisko >=3 powstaje (t=${s1.stats.clusterTurn}) i dopiero po nim rusza marsz na cel (t=${s1.stats.launchedTurn})`);
  ok(s1.stats.minDistToTarget < B.hexDistance(nearT.q, nearT.r, ENEMY.q, ENEMY.r),
    'S1: po zebraniu progu armia faktycznie zbliza sie do celu');

  // ---- Scenariusz 2: armia zastepcza po utracie glownej ----
  const s2 = scenarioReplacementAfterLoss(B);
  ok(s2.stats.violPre === 0,
    `S2: po utracie armii glownej nowe jednostki nie ida pojedynczo na cel (naruszen przed startem armii: ${s2.stats.violPre})`);
  ok(s2.stats.looseMoves > 0 && s2.stats.notApproachPre === 0,
    `S2: nowe jednostki luzne ida do JEDNEGO miasta zbiorki ${nearT.id} (ruchow: ${s2.stats.looseMoves}, niezgodnych: ${s2.stats.notApproachPre})`);
  ok(s2.stats.clusterTurn !== null, `S2: z nowych jednostek powstaje nowa armia glowna (skupisko >=3, t=${s2.stats.clusterTurn})`);

  // ---- Scenariusz 3 (zastoj): AI z lacznie < 3 jednostkami wojennymi -- czeka ograniczony czas, potem marsz ----
  {
    B.resetReplacementRallyState();
    const solo = [mk(nearT.q, nearT.r)];
    const st = play(B, solo, 20);
    ok(st.launchedTurn !== null && st.launchedTurn <= B.WAR_REPLACEMENT_RALLY_MAX_WAIT_TURNS + 2,
      `S3: jedyna jednostka w miescie zbiorki czeka najwyzej ${B.WAR_REPLACEMENT_RALLY_MAX_WAIT_TURNS} tur i rusza (t=${st.launchedTurn})`);
    B.resetReplacementRallyState();
    const pair = [mk(nearT.q, nearT.r), mk(nearT.q, nearT.r)];
    const st2 = play(B, pair, 20);
    ok(st2.launchedTurn !== null && st2.launchedTurn <= B.WAR_REPLACEMENT_RALLY_MAX_WAIT_TURNS + 2 && st2.minDistToTarget < B.hexDistance(nearT.q, nearT.r, ENEMY.q, ENEMY.r),
      `S3: para bez uzupelnienia nie stoi w zastoju (marsz od t=${st2.launchedTurn}, zblizenie do celu)`);
  }

  // ---- Scenariusz 4 (zastoj): para czeka w miescie zbiorki, trzecia jednostka nigdy nie dociera -> limity ----
  {
    B.resetReplacementRallyState();
    // 4a: jednostkowo -- wszystkie luzne stoja w miescie zbiorki (a 3 jednostka jest w skupisku z kontekstu? nie: poza). Limit czekania.
    const rallyC = nearT;
    const mkAt = () => mk(rallyC.q, rallyC.r);
    const p1 = mkAt(); const p2 = mkAt();
    const far = mk(rallyC.q + 30, rallyC.r); // jedyna trzecia, daleko; zawsze luzna, ale poza miastem
    let releasedAt = null;
    for (let t = 1; t <= 12; t++) {
      const plan = B.planWarReplacementRally([p1, p2, far], [], [CITY_A, CITY_B], TARGETS, { ownerId: 91, currentTurn: t });
      if (plan === null || !plan.looseUnitIds.includes(p1.id)) { releasedAt = t; break; }
    }
    ok(releasedAt === null, '4a: dopoki trzecia jednostka jest w drodze (poza miastem), para czeka (licznik czekania nie biegnie)');
    // wszystkie luzne w miescie zbiorki (kontekst = jednostka tez w miescie, ale kandydat) -> licznik biegnie
    const q1 = mkAt(); const q2 = mkAt();
    let rel = null;
    // trzecia jednostka jako kontekst w tym samym miescie utworzylaby skupisko; uzyj kandydatow: 2 w miescie + 1 kandydat w innym miescie stoi
    const q3 = mk(CITY_A.q === rallyC.q && CITY_A.r === rallyC.r ? CITY_B.q : CITY_A.q, CITY_A.q === rallyC.q && CITY_A.r === rallyC.r ? CITY_B.r : CITY_A.r);
    for (let t = 1; t <= 12; t++) {
      // q3 stoi w drugim miescie -> nie jest w miescie zbiorki -> nie biegnie; zatem odtworz sytuacje 'wszyscy w miescie' przez 2 jednostki + kontekst 1 daleko
      const plan = B.planWarReplacementRally([q1, q2], [mk(rallyC.q + 40, rallyC.r + 40)], [CITY_A, CITY_B], TARGETS, { ownerId: 92, currentTurn: t });
      void q3;
      if (plan === null || !plan.looseUnitIds.includes(q1.id)) { rel = t; break; }
    }
    ok(rel === B.WAR_REPLACEMENT_RALLY_MAX_WAIT_TURNS, `4a: gdy wszystkie luzne kandydaci stoja w miescie zbiorki, limit czekania = ${B.WAR_REPLACEMENT_RALLY_MAX_WAIT_TURNS} tur (zwolnione w t=${rel})`);
    // lepkosc: po zwolnieniu nadal zwolnione
    const again = B.planWarReplacementRally([q1, q2], [mk(rallyC.q + 40, rallyC.r + 40)], [CITY_A, CITY_B], TARGETS, { ownerId: 92, currentTurn: 50 });
    ok(again === null || !again.looseUnitIds.includes(q1.id), '4a: zwolnienie jest lepkie (brak oscylacji)');
    // limit wieku luznej jednostki w tranzycie
    const wanderer = mk(0, 0);
    let relAge = null;
    for (let t = 1; t <= B.WAR_REPLACEMENT_RALLY_MAX_LOOSE_TURNS + 5; t++) {
      const plan = B.planWarReplacementRally([wanderer], [mk(40, 40), mk(0, 40)], [CITY_A, CITY_B], TARGETS, { ownerId: 93, currentTurn: t });
      if (plan === null || !plan.looseUnitIds.includes(wanderer.id)) { relAge = t; break; }
    }
    ok(relAge === B.WAR_REPLACEMENT_RALLY_MAX_LOOSE_TURNS + 1, `4a: luzna jednostka w tranzycie zwolniona po ${B.WAR_REPLACEMENT_RALLY_MAX_LOOSE_TURNS} turach (t=${relAge})`);

    // 4b: zywa petla -- para w miescie zbiorki + trzecia, ktora nigdy nie dociera: AI w koncu rusza na cel
    B.resetReplacementRallyState();
    const a = mkAt(); const b = mkAt();
    const stuck = mk(2, 2);
    const hook = () => { stuck.q = 2; stuck.r = 2; };
    const st = play(B, [a, b, stuck], 45, hook);
    ok(st.launchedTurn !== null && st.launchedTurn <= B.WAR_REPLACEMENT_RALLY_MAX_LOOSE_TURNS + 2,
      `4b: bez trzeciej jednostki para NIE stoi w nieskonczonosc -- ruszyla w t=${st.launchedTurn} (limit ${B.WAR_REPLACEMENT_RALLY_MAX_LOOSE_TURNS})`);
  }

  // ---- Scenariusz 5: brak trasy do miasta zbiorki (firstStep === null) -> fallback do marszu na cel, bez porzucenia ----
  {
    B.resetReplacementRallyState();
    const saved = [];
    // Miasto zbiorki otoczone morzem (nieosiagalne ladem); cel wojny osiagalny.
    for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) {
      const h = MAP.hexes[`${nearT.q + dq},${nearT.r + dr}`];
      if (h) { saved.push([h, h.terenBazowy]); h.terenBazowy = 'morze'; }
    }
    const units = [mk(20, 5), mk(30, 30), mk(25, 14)];
    const cmds = B.decideAITurn(1, units, CITIES, MAP, data, {
      civType: 'grecy', currentTurn: 31, canEngageOwner: () => true, capitalCityId: CITY_A.id, atWarWithCiv: true,
      warAllIn: { targets: TARGETS, enemyArmies: [], engageRadius: 6, enemyStrength: [{ ownerId: 2, strength: 0 }] },
    });
    for (const [h, t] of saved) h.terenBazowy = t;
    const moves = cmds.filter(c => c.type === 'move');
    ok(moves.length === 3, `S5: kazda jednostka bez trasy do miasta zbiorki dostaje komende (fallback, nie porzucenie): ${moves.length}/3`);
    ok(moves.every(c => c.allowFriendlyStack !== true), 'S5: fallback -- zadna komenda nie jest ruchem na miasto zbiorki');
    ok(moves.every(c => B.hexDistance(c.toQ, c.toR, ENEMY.q, ENEMY.r) < B.hexDistance(units.find(u => u.id === c.unitId).q, units.find(u => u.id === c.unitId).r, ENEMY.q, ENEMY.r)),
      'S5: fallback -- komendy zblizaja jednostki do celu wojny (dawny marsz)');
  }

  // ---- Mutacja: bramka wylaczona -> test MUSI zawiesc ----
  const m1 = scenarioFreshArmy(MUT);
  const m2 = scenarioReplacementAfterLoss(MUT);
  ok(m1.stats.violPre > 0, `MUTACJA S1: bez bramki jednostki ida pojedynczo (naruszen: ${m1.stats.marchBelowThreshold}) -- test lapie regresje`);
  ok(m2.stats.violPre > 0, `MUTACJA S2: bez bramki armia zastepcza trickluje (naruszen: ${m2.stats.marchBelowThreshold}) -- test lapie regresje`);

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
