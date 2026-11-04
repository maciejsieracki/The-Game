'use strict';
/**
 * ai-army-scattered-merge-test.cjs -- R-WEB-AI-ARMY-SCATTERED-NOT-MERGED-Q1.
 *
 * Kontrakt: skupisko wojsk AI (>= 2 jednostek w promieniu ARMY_CONCENTRATION_RADIUS), ktore stoi na ROZNYCH
 * heksach, NIE maszeruje na cel jako chmura jednoosobowych armii -- najpierw schodzi sie na JEDEN heks i
 * scala w stos (allowFriendlyStack), potem rusza jak dotad. Istniejacy stos nie rozpada sie w marszu.
 * Prawdziwe funkcje: decideAITurn (z domyslnymi flagami: ARMY_CONSOLIDATION ON) + planFieldStackGather.
 * Executor ruchu emulowany wg main.ts (heks zajety przez towarzysza wymaga allowFriendlyStack).
 *
 * Mutacja: bundle z ai.ts, w ktorym wylaczono bramke zbiorki stosu (`if (false)`), MUSI lamac scenariusze.
 * Run (z gra/):  node tools/ai-army-scattered-merge-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GATE_ON = 'if (gateLooseUnits && isArmyConsolidationEnabled() && planned.length >= 2) {';
const WORK = fs.mkdtempSync(path.join(process.env.ARS_TMP || os.tmpdir(), 'asm-'));

async function buildBundle(name, mutate) {
  const entry = path.join(WORK, `${name}-entry.ts`);
  const out = path.join(WORK, `${name}-bundle.cjs`);
  const srcDir = path.resolve(__dirname, '..', 'src', 'game');
  fs.writeFileSync(entry, `
export { decideAITurn } from ${JSON.stringify(path.join(srcDir, 'ai.ts'))};
export {
  ARMY_CONCENTRATION_MIN_UNITS, ARMY_CONCENTRATION_RADIUS, planFieldStackGather, resetStackGatherState,
  noteStackGatherTurn, WAR_STACK_GATHER_MAX_TURNS, resetReplacementRallyState,
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
const MAP = makeMap(70, 50);
const CITY_A = { id: 'cityA', ownerId: 1, q: 10, r: 10, name: 'A', population: 5 };
const CITY_B = { id: 'cityB', ownerId: 1, q: 10, r: 30, name: 'B', population: 5 };
const ENEMY1 = { id: 'cityT1', ownerId: 2, q: 50, r: 24, name: 'T1', population: 5 };
const ENEMY2 = { id: 'cityT2', ownerId: 3, q: 40, r: 45, name: 'T2', population: 5 };
let nextUid = 0;
const mk = (q, r, ruch = 2) => ({ id: 'w' + String(nextUid++).padStart(4, '0'), ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch, ruchLeft: ruch });

/**
 * Zywa petla tur: decideAITurn -> komendy 'move' stosowane jak w main.ts (heks zajety przez towarzysza
 * wymaga allowFriendlyStack; wejscie na wrogie miasto pomijane) -> hak (rekrutacja). Zwraca historie.
 */
function play(B, ownUnits, turns, cfg) {
  const enemies = cfg.enemies;
  const cities = [CITY_A, CITY_B, ...enemies];
  const targets = enemies.map(e => ({ ownerId: e.ownerId, cityId: e.id, q: e.q, r: e.r }));
  const cityHex = new Set([CITY_A, CITY_B].map(c => `${c.q},${c.r}`));
  const res = { armies: [], sizes: [], singles: [], aiMs: 0, calls: 0, trace: [], minDist: enemies.map(() => Infinity) };
  for (let t = 1; t <= turns; t++) {
    if (cfg.hook) cfg.hook(t, ownUnits);
    for (const u of ownUnits) u.ruchLeft = u.ruch;
    const opts = {
      civType: 'grecy', currentTurn: 30 + t, canEngageOwner: () => true, capitalCityId: CITY_A.id, atWarWithCiv: true,
      warAllIn: { targets, enemyArmies: cfg.enemyArmies ?? [], engageRadius: 6, enemyStrength: enemies.map(e => ({ ownerId: e.ownerId, strength: 0 })) },
    };
    const t0 = process.hrtime.bigint();
    const cmds = B.decideAITurn(1, ownUnits, cities, MAP, data, opts);
    res.aiMs += Number(process.hrtime.bigint() - t0) / 1e6; res.calls++;
    for (const cmd of cmds) {
      if (cmd.type !== 'move') continue;
      const u = ownUnits.find(x => x.id === cmd.unitId);
      if (!u) continue;
      if (enemies.some(e => e.q === cmd.toQ && e.r === cmd.toR)) continue;
      const occ = ownUnits.some(o => o.id !== u.id && o.q === cmd.toQ && o.r === cmd.toR);
      if (occ && cmd.allowFriendlyStack !== true) continue;
      u.q = cmd.toQ; u.r = cmd.toR;
    }
    enemies.forEach((e, i) => { for (const u of ownUnits) res.minDist[i] = Math.min(res.minDist[i], B.hexDistance(u.q, u.r, e.q, e.r)); });
    const byHex = new Map();
    for (const u of ownUnits) byHex.set(`${u.q},${u.r}`, (byHex.get(`${u.q},${u.r}`) || 0) + 1);
    const outside = [...byHex.entries()].filter(([k]) => !cityHex.has(k));
    res.armies.push(outside.length);
    res.sizes.push([...byHex.values()].sort((a, b) => b - a));
    res.singles.push(outside.filter(([, n]) => n === 1).length);
    res.trace.push([...byHex.entries()].sort().map(([k, n]) => `${k}x${n}`).join(' '));
  }
  return res;
}
const hash = (r) => crypto.createHash('sha1').update(r.trace.join('|')).digest('hex').slice(0, 12);
const cloud = (n, q0, r0, step) => { const u = []; const side = Math.ceil(Math.sqrt(n)); for (let i = 0; i < n; i++) u.push(mk(q0 + step * (i % side), r0 + step * Math.floor(i / side))); return u; };

(async () => {
  const GOOD = await buildBundle('good', false);
  const MUT = await buildBundle('mut', true);
  const B = GOOD;
  const reset = (b) => { b.resetStackGatherState(); b.resetReplacementRallyState(); };

  // ---- Jednostkowy kontrakt planFieldStackGather ----
  {
    reset(B);
    const o = { ownerId: 91, currentTurn: 1 };
    ok(B.planFieldStackGather([], o) === null, 'gather: brak jednostek -> null');
    ok(B.planFieldStackGather([mk(5, 5)], o) === null, 'gather: jedna jednostka -> null');
    ok(B.planFieldStackGather([mk(5, 5), mk(5, 5), mk(5, 5)], o) === null, 'gather: istniejacy stos (jeden heks) -> null (rusza jak dotad)');
    const a = mk(5, 5); const b = mk(5, 5); const c = mk(7, 5); const far = mk(30, 30);
    const plan = B.planFieldStackGather([c, a, far, b], o);
    ok(plan !== null && plan.groups.length === 1, 'gather: dwa heksy w promieniu + jednostka daleko -> 1 grupa');
    ok(plan.groups[0].anchor.q === 5 && plan.groups[0].anchor.r === 5, 'gather: kotwica = heks z najwieksza liczba jednostek (5,5)');
    ok(plan.groups[0].moveUnitIds.length === 1 && plan.groups[0].moveUnitIds[0] === c.id, 'gather: do kotwicy idzie tylko jednostka spoza heksu');
    ok(plan.groups[0].stayUnitIds.length === 2, 'gather: jednostki na heksie kotwicy czekaja');
    const p2 = B.planFieldStackGather([mk(5, 5), mk(8, 5), mk(8, 6)], { ownerId: 92 });
    ok(p2 !== null && p2.groups[0].moveUnitIds.length + p2.groups[0].stayUnitIds.length === 3, 'gather: 3 jednostki w promieniu 4 -> jedna grupa');
    const blocked = B.planFieldStackGather([mk(5, 5), mk(7, 5)], { ownerId: 93, isGroupBlocked: () => true });
    ok(blocked === null, 'gather: grupa zablokowana (kontakt z wrogiem) -> null');
    const rev = B.planFieldStackGather([mk(5, 5), mk(7, 5), mk(6, 8), mk(9, 5)], { ownerId: 94 });
    const rev2 = B.planFieldStackGather([mk(5, 5), mk(7, 5), mk(6, 8), mk(9, 5)].reverse(), { ownerId: 95 });
    ok(JSON.stringify(rev.groups.map(g => g.anchor)) === JSON.stringify(rev2.groups.map(g => g.anchor)), 'gather: deterministyczny niezaleznie od kolejnosci wejscia');
    // limit zastoju
    reset(B);
    const x = mk(5, 5); const y = mk(7, 5);
    let releasedAt = null;
    for (let t = 1; t <= B.WAR_STACK_GATHER_MAX_TURNS + 3; t++) {
      const pl = B.planFieldStackGather([x, y], { ownerId: 96, currentTurn: t });
      if (pl === null) { releasedAt = t; break; }
      B.noteStackGatherTurn(96, pl.groups.flatMap(g => g.moveUnitIds), t);
    }
    ok(releasedAt === B.WAR_STACK_GATHER_MAX_TURNS + 1, `gather: limit zastoju zwalnia jednostke po ${B.WAR_STACK_GATHER_MAX_TURNS} turach zbierania (t=${releasedAt})`);
  }

  // ---- Scenariusz 1: chmura 16 jednostek (zrzuty: po jednej na heksie, rozstaw 2) w wojnie ----
  const S1 = (b) => { reset(b); return play(b, cloud(16, 8, 4, 2), 18, { enemies: [ENEMY1] }); };
  const s1 = S1(B);
  ok(s1.armies[0] >= 8, `S1: start -- chmura (armii po t1: ${s1.armies[0]})`);
  ok(s1.armies[s1.armies.length - 1] <= 1, `S1: po 18 turach JEDNA armia (armii: ${s1.armies[s1.armies.length - 1]}, rozmiary ${s1.sizes[s1.sizes.length - 1].join('/')})`);
  ok(s1.minDist[0] < 30, `S1: stos faktycznie rusza na cel (min. odleglosc ${s1.minDist[0]}, start ~40)`);
  ok(s1.sizes[s1.sizes.length - 1][0] === 16, 'S1: cala chmura 16 jednostek w jednym stosie');
  ok(Math.max(...s1.singles.slice(13)) <= 0, `S1: po 14 turach brak samotnych jednostek (max ${Math.max(...s1.singles.slice(13))})`);

  // ---- Scenariusz 2: kolumna 16 jednostek po linii (marsz kolumna po jednej jednostce) ----
  const s2 = (() => { reset(B); const u = []; for (let i = 0; i < 16; i++) u.push(mk(12 + i, 10)); return play(B, u, 14, { enemies: [ENEMY1] }); })();
  ok(s2.armies[s2.armies.length - 1] <= 1, `S2: kolumna 16 -> jedna armia po 14 turach (armii: ${s2.armies[s2.armies.length - 1]})`);

  // ---- Scenariusz 3: regresja -- istniejacy stos 16 nie rozpada sie w marszu ----
  const s3 = (() => { reset(B); const u = []; for (let i = 0; i < 16; i++) u.push(mk(10, 10)); return play(B, u, 10, { enemies: [ENEMY1] }); })();
  ok(Math.max(...s3.armies) === 1 && s3.sizes.every(s => s[0] === 16), 'S3: stos 16 maszeruje jako JEDNA armia przez 10 tur (bez rozpadu)');

  // ---- Scenariusz 4: dwie wojny, 20 jednostek-chmura => nie wiecej niz liczba wojen + 1 ----
  const s4 = (() => { reset(B); return play(B, cloud(20, 8, 4, 2), 40, { enemies: [ENEMY1, ENEMY2] }); })();
  ok(s4.armies[s4.armies.length - 1] <= 3, `S4: 2 wojny, 20 jednostek -> <= 3 armie po 40 turach (armii: ${s4.armies[s4.armies.length - 1]})`);
  ok(s4.minDist[0] <= 12 && s4.minDist[1] <= 12, `S4: obie armie faktycznie maszeruja na swoje cele (min. odleglosc do T1=${s4.minDist[0]}, T2=${s4.minDist[1]}; start ~40) -- bez ping-ponga zbiorka/podzial`);
  ok(s4.singles[s4.singles.length - 1] <= 1, `S4: <= 1 jednostka samotna poza miastem (jest: ${s4.singles[s4.singles.length - 1]})`);

  // ---- Scenariusz 5: rekrutacja w dwoch miastach (zbiorka zastepcza) -> jedna armia ----
  const s5 = (() => {
    reset(B);
    let spawned = 0;
    const hook = (t, arr) => { if (t >= 1 && t % 2 === 1 && spawned < 12) { const c = spawned % 2 === 0 ? CITY_A : CITY_B; arr.push(mk(c.q, c.r)); spawned++; } };
    return play(B, [], 40, { enemies: [ENEMY1], hook });
  })();
  ok(s5.singles[s5.singles.length - 1] <= 1, `S5: rekruci z 2 miast nie zostaja rozproszeni (samotnych po 40 turach: ${s5.singles[s5.singles.length - 1]})`);

  // ---- Scenariusz 6: determinizm ----
  if (process.env.ASM_DEBUG) console.log('S1 sizes', JSON.stringify(s1.sizes.map(x => x.join('/'))), '\nTRACE', s1.trace.join('\n'));
  const h1 = hash(S1(B)); const h2 = hash(S1(B));
  ok(h1 === h2, `S6: determinizm historii pozycji (hash ${h1} == ${h2})`);

  // ---- Scenariusz 7: grupa w kontakcie z wrogiem NIE zbiera sie (walke prowadzi logika zaangazowania) ----
  {
    reset(B);
    const u = cloud(9, 20, 10, 2);
    const near = { q: 24, r: 14, ownerId: 2 }; // w promieniu zaangazowania (6) od kotwicy
    const r = play(B, u, 1, { enemies: [ENEMY1], enemyArmies: [near] });
    ok(r.armies[0] >= 5, `S7: wrogie wojsko w promieniu zaangazowania -> brak zbiorki w stos (armii: ${r.armies[0]})`);
  }

  // ---- Scenariusz 8: jednostka bez trasy do kotwicy nie blokuje grupy (zachowanie dotychczasowe) ----
  {
    reset(B);
    const saved = [];
    const lone = mk(40, 20);
    for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) {
      const h = MAP.hexes[`${lone.q + dq},${lone.r + dr}`]; saved.push([h, h.terenBazowy]); h.terenBazowy = 'morze';
    }
    const u = [mk(20, 10), mk(22, 10), mk(24, 10), lone];
    const cmds = B.decideAITurn(1, u, [CITY_A, CITY_B, ENEMY1], MAP, data, {
      civType: 'grecy', currentTurn: 31, canEngageOwner: () => true, capitalCityId: CITY_A.id, atWarWithCiv: true,
      warAllIn: { targets: [{ ownerId: 2, cityId: ENEMY1.id, q: ENEMY1.q, r: ENEMY1.r }], enemyArmies: [], engageRadius: 6, enemyStrength: [{ ownerId: 2, strength: 0 }] },
    });
    for (const [h, t] of saved) h.terenBazowy = t;
    ok(cmds.filter(c => c.type === 'move' && c.unitId !== lone.id).length >= 2, 'S8: jednostki grupy dostaja komendy mimo odcietej jednostki (brak zastoju)');
    ok(cmds.filter(c => c.type === 'move' && c.unitId === lone.id).length === 0, 'S8: jednostka bez trasy nie dostaje komendy (brak wyjatku/zastoju)');
  }

  // ---- Mutacja: bramka wylaczona -> chmura NIE scala sie ----
  {
    const m1 = S1(MUT);
    ok(m1.armies[m1.armies.length - 1] >= 8, `MUTACJA S1: bez bramki chmura zostaje rozproszona (armii po 18 turach: ${m1.armies[m1.armies.length - 1]}) -- test lapie regresje`);
    reset(MUT);
    const u = []; for (let i = 0; i < 16; i++) u.push(mk(12 + i, 10));
    const m2 = play(MUT, u, 14, { enemies: [ENEMY1] });
    ok(m2.armies[m2.armies.length - 1] >= 8, `MUTACJA S2: bez bramki kolumna zostaje rozproszona (armii: ${m2.armies[m2.armies.length - 1]})`);
  }

  // ---- Czas tury AI: stan ustalony bez wzrostu; faza zbierania (przejsciowa) mierzona osobno ----
  {
    // Najlepszy z 3 przebiegow (min) -- odporny na szum CPU innych procesow.
    const bench1 = (b, make, turns) => { reset(b); const r = play(b, make(), turns, { enemies: [ENEMY1] }); return r.aiMs / r.calls; };
    const bench = (b, make, turns) => Math.min(bench1(b, make, turns), bench1(b, make, turns), bench1(b, make, turns));
    const stack40 = () => { const u = []; for (let i = 0; i < 40; i++) u.push(mk(10, 10)); return u; };
    const sa = bench(B, stack40, 6); const sm = bench(MUT, stack40, 6);
    const ca = bench(B, () => cloud(40, 6, 2, 2), 10); const cm = bench(MUT, () => cloud(40, 6, 2, 2), 10);
    console.log(`POMIAR ms/wywolanie decideAITurn (min z 3): stos 40 (stan ustalony) PO=${sa.toFixed(2)} bez bramki=${sm.toFixed(2)}; chmura 40 (faza zbierania, 10 tur) PO=${ca.toFixed(2)} bez bramki=${cm.toFixed(2)}`);
    // Sam planer zbiorki (jedyny nowy koszt w stanie ustalonym) mierzony wprost -- niezalezny od szumu decideAITurn.
    const microStack = []; for (let i = 0; i < 100; i++) microStack.push(mk(10, 10));
    const microCloud = cloud(100, 6, 2, 2);
    const micro = (arr) => { const t0 = process.hrtime.bigint(); for (let i = 0; i < 20; i++) B.planFieldStackGather(arr, { ownerId: 97 }); return Number(process.hrtime.bigint() - t0) / 1e6 / 20; };
    const mStack = micro(microStack); const mCloud = micro(microCloud);
    console.log(`POMIAR planFieldStackGather: stos 100 = ${mStack.toFixed(3)} ms, chmura 100 = ${mCloud.toFixed(3)} ms na wywolanie`);
    ok(mStack < 5 && mCloud < 25, 'koszt planera zbiorki (100 jednostek): stos < 5 ms, chmura < 25 ms na wywolanie');
    ok(sa <= sm * 2 + 50, 'czas tury AI w stanie ustalonym (stos 40): <= 2x + 50 ms wzgledem stanu bez bramki (szum CPU)');
    ok(ca <= cm * 3 + 10, 'czas tury AI w fazie zbierania chmury (przejsciowej) <= 3x + 10 ms');
  }

  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
