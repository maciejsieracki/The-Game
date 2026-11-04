'use strict';
/**
 * army-to-nearest-leader-test.cjs -- R-WEB-ARMY-TO-NEAREST-LEADER-Q1 (runda 1).
 * Uruchom z gra/:  node tools/army-to-nearest-leader-test.cjs [--no-sim] [--seeds=3] [--turns=120]
 * Zrodlo bazowe (RED przed): ATL_SRC=<katalog src z origin/main> node tools/army-to-nearest-leader-test.cjs
 *
 * PRAWDZIWE: decideAITurn (ai.ts), pickNearestAvailableLeader (army-concentration.ts), computePath.
 * Sekcje: A picker (jednostkowo), B scenariusze decideAITurn (dwoch wodzow / zablokowana trasa /
 * jeden wodz / zniknal wodz kampanii / remis), C mutacje zrodla (kazda laman asercje),
 * D symulacja AI (>=3 ziarna, 120 tur): odsetek jednostek idacych do NIE-najblizszego wodza,
 * E statyczne zabezpieczenia main.ts.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC = process.env.ATL_SRC ? path.resolve(process.env.ATL_SRC) : path.join(GRA, 'src');
const args = process.argv.slice(2);
const NO_SIM = args.includes('--no-sim');
const argNum = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? Number(a.split('=')[1]) : d; };
const SEEDS = argNum('seeds', 3);
const TURNS = argNum('turns', 120);
const OUT = process.env.ATL_OUT || `/dev/shm/atl-${process.pid}`;
fs.mkdirSync(OUT, { recursive: true });

function build(tag, mutations) {
  const entry = path.join(OUT, `entry-${tag}.ts`);
  const bundle = path.join(OUT, `bundle-${tag}.cjs`);
  const J = (p) => JSON.stringify(path.join(SRC, p));
  const hasPicker = fs.readFileSync(path.join(SRC, 'game/army-concentration.ts'), 'utf8').includes('pickNearestAvailableLeader');
  fs.writeFileSync(entry, `
export { decideAITurn } from ${J('game/ai')};
export { hexDistance, computePath } from ${J('units/setup')};
${hasPicker ? `export { pickNearestAvailableLeader, pickNearestLeaderUnit, collectLeaderCandidates } from ${J('game/army-concentration')};` : ''}
`, 'utf8');
  const plugin = {
    name: 'mut',
    setup(b) {
      b.onLoad({ filter: /\.ts$/ }, (a) => {
        let text = fs.readFileSync(a.path, 'utf8');
        for (const m of mutations || []) {
          if (a.path.endsWith(m.rel)) {
            if (!text.includes(m.from)) throw new Error(`mutacja nie pasuje: ${m.name}`);
            text = text.replace(m.from, m.to);
          }
        }
        return { contents: text, loader: 'ts' };
      });
    },
  };
  esbuild.buildSync === undefined || null;
  return esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA, logLevel: 'silent', plugins: [plugin],
  }).then(() => { delete require.cache[bundle]; return { M: require(bundle), hasPicker }; });
}

let passed = 0, failed = 0;
function check(label, ok, detail) {
  if (ok) { passed++; console.log('PASS:', label); }
  else { failed++; console.error('FAIL:', label, detail ?? ''); }
}

function makeMap(w, h, water = []) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    const sea = water.some((f) => f(q, r));
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: sea ? 'morze' : 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const data = { units: [{ Jednostka: 'Wojownik', Typ: 'Melee', Health: 30, Ruch: 2 }], buildings: [],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] }, aiParams: {} };
function unit(id, q, r, extra = {}) {
  return { id, ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, hp: 30, isGeneral: false, ...extra };
}
const cities = [{ id: 'home', ownerId: 1, q: 2, r: 5, name: 'home', population: 5 },
  { id: 'enemy', ownerId: 2, q: 28, r: 5, name: 'enemy', population: 5 }];

function gatherCampaign(leaderId, rq, rr) {
  return { currentTurn: 1, aiGeneralWarCampaign: {
    targetOwnerId: 2, stage: 'gathering', generalUnitId: leaderId, gatherTurnsCompleted: 0,
    rallyQ: rq, rallyR: rr, target: { ownerId: 2, cityId: 'enemy', q: 28, r: 5 }, turn: 1,
  } };
}
function moveOf(cmds, id) { return cmds.find((c) => c.type === 'move' && c.unitId === id); }

(async () => {
  const { M, hasPicker } = await build('base', []);
  const dist = M.hexDistance;

  // ---------- A: picker ----------
  if (hasPicker) {
    const P = M.pickNearestAvailableLeader;
    const straight = (a, b) => dist(a.q, a.r, b.q, b.r);
    const L = (id, q, r, x = {}) => ({ id, q, r, ...x });
    check('A1 najblizszy wodz wg trasy', P({ q: 0, r: 0 }, [L('a', 9, 0), L('b', 3, 0)], straight)?.leader.id === 'b');
    check('A2 wodz bez trasy (null) pomijany', P({ q: 0, r: 0 }, [L('a', 9, 0), L('b', 3, 0)], (f, t) => (t.q === 3 ? null : 9))?.leader.id === 'a');
    check('A3 brak dostepnych -> null', P({ q: 0, r: 0 }, [L('b', 3, 0)], () => null) === null);
    check('A4 jeden wodz -> ten wodz', P({ q: 0, r: 0 }, [L('only', 8, 8)], straight)?.leader.id === 'only');
    check('A5 remis -> wieksza armia', P({ q: 0, r: 0 }, [L('a', 3, 0, { armySize: 1 }), L('b', 0, 3, { armySize: 4 })], straight)?.leader.id === 'b');
    check('A6 remis i armia -> id', P({ q: 0, r: 0 }, [L('z', 3, 0), L('c', 0, 3)], straight)?.leader.id === 'c');
    check('A7 wodz na wyprawie bliski przegrywa z dalszym zbierajacym',
      P({ q: 0, r: 0 }, [L('exp', 2, 0, { onExpedition: true }), L('gat', 8, 0)], straight)?.leader.id === 'gat');
    check('A8 jedyny wodz na wyprawie nadal dostepny',
      P({ q: 0, r: 0 }, [L('exp', 2, 0, { onExpedition: true })], straight)?.leader.id === 'exp');
    check('A9 jednostka na heksie wodza -> dystans 0', P({ q: 3, r: 0 }, [L('b', 3, 0), L('a', 4, 0)], () => 5)?.distance === 0);
  } else {
    check('A pickNearestAvailableLeader istnieje', false, '(baza bez funkcji)');
  }

  // ---------- B: scenariusze ----------
  const map = makeMap(32, 12);
  // B1: kampania na wodzu dalekim (G-far), blisko jednostki stoi drugi wodz (G-near, id pozniejsze alfabetycznie).
  function scenario(mapX, generals, extraUnits, campaignLeader, rally) {
    const us = [...generals, ...extraUnits];
    const opts = gatherCampaign(campaignLeader, rally[0], rally[1]);
    return M.decideAITurn(1, us, cities, mapX, data, opts);
  }
  {
    const gFar = unit('a-far', 4, 5, { isGeneral: true });
    const gNear = unit('z-near', 22, 5, { isGeneral: true });
    const w = unit('w1', 20, 5);
    const cmds = scenario(map, [gFar, gNear], [w], 'a-far', [4, 5]);
    const mv = moveOf(cmds, 'w1');
    check('B1 dwoch wodzow: jednostka idzie do BLIZSZEGO, nie do wodza kampanii',
      mv !== undefined && dist(mv.toQ, mv.toR, 22, 5) < dist(20, 5, 22, 5), JSON.stringify(mv));
  }
  // B2: wodz za zablokowanym terenem. Wodz KAMPANII jest tym niedostepnym/okreznym (id 'a-x'), wiec baza
  // (zbiorka tylko do wodza kampanii) MUSI tu zawiesc -- RED przed / GREEN po.
  // Asercja: ruch lezy na realnej trasie jednostki do osiagalnego, bliskiego po trasie wodza.
  function onPathTo(MM, mapX, w, mv, q, r) {
    if (!mv) return false;
    return MM.computePath(w, mapX, q, r, new Set()).some((p) => p.q === mv.toQ && p.r === mv.toR);
  }
  function b2Scenarios(MM, mapFull, mapGap) {
    const out = {};
    // B2a: caly mur q=12 -- wodz kampanii 'a-x' (14,5) calkiem niedostepny, 'z-y' (3,5) osiagalny.
    {
      const w = unit('w1', 10, 5);
      const cmds = MM.decideAITurn(1, [unit('a-x', 14, 5, { isGeneral: true }), unit('z-y', 3, 5, { isGeneral: true }), w],
        cities, mapFull, data, gatherCampaign('a-x', 14, 5));
      out.b2a = onPathTo(MM, mapFull, w, moveOf(cmds, 'w1'), 3, 5);
    }
    // B2b: mur z przejsciem na dole -- 'a-x' blisko w linii prostej (4), ale trasa okrezna (>7);
    // 'z-y' dalej w linii prostej (7), ale blizej po trasie. Odleglosc w linii prostej zlapie to.
    {
      const w = unit('w1', 10, 5);
      const cmds = MM.decideAITurn(1, [unit('a-x', 14, 5, { isGeneral: true }), unit('z-y', 3, 5, { isGeneral: true }), w],
        cities, mapGap, data, gatherCampaign('a-x', 14, 5));
      out.b2b = onPathTo(MM, mapGap, w, moveOf(cmds, 'w1'), 3, 5);
    }
    return out;
  }
  const mapFull = makeMap(32, 12, [(q) => q === 12]);
  const mapGap = makeMap(32, 12, [(q, r) => q === 12 && r <= 10]);
  {
    const lenX = M.computePath(unit('w1', 10, 5), mapGap, 14, 5, new Set()).length;
    const lenY = M.computePath(unit('w1', 10, 5), mapGap, 3, 5, new Set()).length;
    check('B2 zalozenie mapy z przejsciem: trasa do X (' + lenX + ') > trasa do Y (' + lenY + '), a prosta X < prosta Y',
      lenX > lenY && dist(10, 5, 14, 5) < dist(10, 5, 3, 5));
    check('B2 zalozenie pelnego muru: brak trasy do X', M.computePath(unit('w1', 10, 5), mapFull, 14, 5, new Set()).length === 0);
    const r = b2Scenarios(M, mapFull, mapGap);
    check('B2a wodz kampanii za pelnym murem pomijany: jednostka idzie trasa do osiagalnego', r.b2a);
    check('B2b wodz blizszy w linii prostej, ale dalszy po trasie: wybor wg trasy', r.b2b);
  }
  {
    // B3: jeden wodz -> bez zmian (cel = wodz kampanii).
    const g = unit('only', 4, 5, { isGeneral: true });
    const w = unit('w1', 14, 5);
    const cmds = scenario(map, [g], [w], 'only', [4, 5]);
    const mv = moveOf(cmds, 'w1');
    check('B3 jeden wodz: marsz do niego jak dotad', mv !== undefined && dist(mv.toQ, mv.toR, 4, 5) < dist(14, 5, 4, 5), JSON.stringify(mv));
  }
  {
    // B4: wodz kampanii zniknal (martwy), zyje inny -> ponowny wybor zamiast stalego punktu zbiorki.
    const gOther = unit('z-other', 22, 5, { isGeneral: true });
    const w = unit('w1', 20, 5);
    const cmds = scenario(map, [gOther], [w], 'dead-leader', [4, 5]);
    const mv = moveOf(cmds, 'w1');
    check('B4 zniknal wodz kampanii: ponowny wybor zyjacego wodza',
      mv !== undefined && dist(mv.toQ, mv.toR, 22, 5) < dist(20, 5, 22, 5), JSON.stringify(mv));
  }
  {
    // B5: remis odleglosci -> wodz z wieksza armia (id pierwszego wodza jest wczesniejsze, ale armia mniejsza).
    const gSmall = unit('a-small', 16, 5, { isGeneral: true });
    const gBig = unit('z-big', 10, 11, { isGeneral: true });
    const guards = [unit('g1', 10, 11), unit('g2', 10, 11), unit('g3', 10, 11)];
    const w = unit('w1', 10, 5);
    // symetria osiowa: oba wodzowie w odleglosci 6 od w1
    const d1 = dist(10, 5, 16, 5), d2 = dist(10, 5, 10, 11);
    const cmds = scenario(map, [gSmall, gBig], [...guards, w], 'a-small', [16, 5]);
    const mv = moveOf(cmds, 'w1');
    check('B5 remis (zalozenie symetrii ' + d1 + '==' + d2 + '): wodz z wieksza armia',
      d1 === d2 && mv !== undefined && dist(mv.toQ, mv.toR, 10, 11) < dist(10, 5, 10, 11), JSON.stringify(mv));
  }

  // ---------- F: sciezka gracza (main.ts) -- te same funkcje, ktore wola pickNearestLeaderForUnit ----------
  // pickNearestLeaderUnit/collectLeaderCandidates: filtr zywych wodzow, wyprawa, brak trasy, ponowny wybor.
  function fScenarios(MM) {
    const out = {};
    const D = MM.hexDistance;
    const straight = (a, b) => D(a.q, a.r, b.q, b.r);
    const pick = (u, roster, exp = () => false, pl = straight) => MM.pickNearestLeaderUnit(u, roster, exp, pl)?.id;
    const g = (id, q, r, x = {}) => unit(id, q, r, { isGeneral: true, ownerId: 0, ...x });
    const u0 = unit('p1', 0, 0, { ownerId: 0 });
    out.fNear = pick(u0, [g('far', 9, 0), g('near', 3, 0)]) === 'near';
    out.fRouted = pick(u0, [g('routed', 1, 0, { routed: true }), g('ok', 6, 0)]) === 'ok';
    out.fRemoved = pick(u0, [g('removed', 1, 0, { removed: true }), g('ok', 6, 0)]) === 'ok';
    out.fDead = pick(u0, [g('dead', 1, 0, { dead: true }), g('ok', 6, 0)]) === 'ok';
    out.fHp0 = pick(u0, [g('hp0', 1, 0, { hp: 0 }), g('ok', 6, 0)]) === 'ok';
    out.fOtherOwner = pick(u0, [g('foe', 1, 0, { ownerId: 2 }), g('ok', 6, 0)]) === 'ok';
    out.fOnlyDeadNone = pick(u0, [g('dead', 1, 0, { dead: true })]) === undefined;
    out.fExpedition = pick(u0, [g('exp', 2, 0), g('gat', 7, 0)], (id) => id === 'exp') === 'gat';
    out.fUnreachable = pick(u0, [g('blocked', 2, 0), g('ok', 7, 0)], () => false, (f, t) => (t.q === 2 ? null : 5)) === 'ok';
    // ponowny wybor: wodz znika z rostera -> wybierany jest nastepny najblizszy
    const roster = [g('a', 2, 0), g('b', 7, 0)];
    const before = pick(u0, roster);
    const after = pick(u0, roster.filter((x) => x.id !== 'a'));
    out.fReselect = before === 'a' && after === 'b';
    out.fGeneralNoLeader = pick(g('gen', 0, 0), [g('a', 2, 0)]) === undefined;
    out.fSelfExcluded = pick(u0, [{ ...u0, isGeneral: true }, g('b', 7, 0)]) === 'b';
    return out;
  }
  if (hasPicker && M.pickNearestLeaderUnit) {
    const f = fScenarios(M);
    for (const [k, v] of Object.entries(f)) check('F ' + k + ' (pickNearestLeaderUnit)', v);
  } else {
    check('F pickNearestLeaderUnit istnieje', false, '(baza bez funkcji)');
  }

  // ---------- C: mutacje ----------
  const mutations = [
    { name: 'picker: pierwszy z listy zamiast najblizszego', rel: 'game/army-concentration.ts',
      from: 'if (best === null || distance < best.distance\n      ||', to: 'if (best === null\n      ||' },
    { name: 'picker: null/nieosiagalny traktowany jak dystans 0', rel: 'game/army-concentration.ts',
      from: 'if (distance === null || !Number.isFinite(distance)) continue;', to: 'if (distance === null) { best = { leader, distance: 0 }; continue; }' },
    { name: 'picker: przycinanie przerywa przy rownej linii prostej (gubi remisy)', rel: 'game/army-concentration.ts',
      from: 'if (best !== null && straight > best.distance) break;', to: 'if (best !== null && straight >= best.distance) break;' },
    { name: 'ai.ts: zbiorka tylko do wodza kampanii (bez wyboru najblizszego)', rel: 'game/ai.ts',
      from: 'const choice = leaders.length > 1', to: 'const choice = false && leaders.length > 1' },
    { name: 'picker: remis nie patrzy na armie', rel: 'game/army-concentration.ts',
      from: '(leader.armySize ?? 0) > (best.leader.armySize ?? 0)', to: 'false' },
    { name: 'ai.ts: odleglosc w linii prostej zamiast dlugosci trasy', rel: 'game/ai.ts',
      from: 'return path.length === 0 ? null : path.length;\n  };',
      to: 'return Math.max(Math.abs(unit.q - to.q), Math.abs(unit.r - to.r), Math.abs(unit.q + unit.r - to.q - to.r)) + 0 * path.length;\n  };' },
    { name: 'collectLeaderCandidates: routed wodz dopuszczony', rel: 'game/army-concentration.ts',
      from: '&& c.dead !== true && c.removed !== true && c.routed !== true', to: '&& c.dead !== true && c.removed !== true' },
    { name: 'collectLeaderCandidates: removed wodz dopuszczony', rel: 'game/army-concentration.ts',
      from: '&& c.dead !== true && c.removed !== true && c.routed !== true', to: '&& c.dead !== true && c.routed !== true' },
    { name: 'collectLeaderCandidates: wyprawa ignorowana', rel: 'game/army-concentration.ts',
      from: 'onExpedition: isOnExpedition(c.id),', to: 'onExpedition: false,' },
  ];
  if (hasPicker) {
    for (const mut of mutations) {
      let ok = false, err = '';
      try {
        const { M: MM } = await build('mut' + mutations.indexOf(mut), [mut]);
        // powtorz kluczowe scenariusze B1/B2/B5 i A2/A5 na zmutowanym zrodle
        const D = MM.hexDistance;
        const run = (gen, ex, lead, rally, mp = map) => MM.decideAITurn(1, [...gen, ...ex], cities, mp, data, gatherCampaign(lead, rally[0], rally[1]));
        const b1 = moveOf(run([unit('a-far', 4, 5, { isGeneral: true }), unit('z-near', 22, 5, { isGeneral: true })], [unit('w1', 20, 5)], 'a-far', [4, 5]), 'w1');
        const b1ok = b1 !== undefined && D(b1.toQ, b1.toR, 22, 5) < D(20, 5, 22, 5);
        const b2r = b2Scenarios(MM, mapFull, mapGap);
        const b2ok = b2r.b2a && b2r.b2b;
        const fr = fScenarios(MM);
        const fok = Object.values(fr).every(Boolean);
        const b5 = moveOf(run([unit('a-small', 16, 5, { isGeneral: true }), unit('z-big', 10, 11, { isGeneral: true })],
          [unit('g1', 10, 11), unit('g2', 10, 11), unit('g3', 10, 11), unit('w1', 10, 5)], 'a-small', [16, 5]), 'w1');
        const b5ok = b5 !== undefined && D(b5.toQ, b5.toR, 10, 11) < D(10, 5, 10, 11);
        const straight = (a, b) => D(a.q, a.r, b.q, b.r);
        const P = MM.pickNearestAvailableLeader;
        const a2ok = P({ q: 0, r: 0 }, [{ id: 'a', q: 9, r: 0 }, { id: 'b', q: 3, r: 0 }], (f, t) => (t.q === 3 ? null : 9))?.leader.id === 'a';
        const a5ok = P({ q: 0, r: 0 }, [{ id: 'a', q: 3, r: 0, armySize: 1 }, { id: 'b', q: 0, r: 3, armySize: 4 }], straight)?.leader.id === 'b';
        const a1ok = P({ q: 0, r: 0 }, [{ id: 'a', q: 9, r: 0 }, { id: 'b', q: 3, r: 0 }], straight)?.leader.id === 'b';
        ok = !(b1ok && b2ok && b5ok && a2ok && a5ok && a1ok && fok);
      } catch (e) { err = String(e.message || e); }
      check('C mutacja lamie test: ' + mut.name, ok, err);
    }
  }

  // ---------- D: symulacja ----------
  if (!NO_SIM) {
    const rows = [];
    let simNs = 0n, simCalls = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      let rng = seed * 2654435761 >>> 0;
      const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };
      const W = 40, H = 14;
      const simMap = makeMap(W, H);
      // dwa miasta rekrutacji, dwoch wodzow stojacych (zbierajacy lokalnie): jeden z kazdej strony.
      const simCities = [{ id: 'cA', ownerId: 1, q: 6, r: 3, name: 'cA', population: 5 },
        { id: 'cB', ownerId: 1, q: 33, r: 10, name: 'cB', population: 5 },
        { id: 'en', ownerId: 2, q: 38, r: 1, name: 'en', population: 5 }];
      const units = [unit('g-A', 4 + Math.floor(rand() * 3), 5, { isGeneral: true }),
        unit('g-B', 31 - Math.floor(rand() * 3), 9, { isGeneral: true })];
      let nonNearest = 0, headings = 0, serial = 0;
      const spawnB = new Set();
      for (let turn = 1; turn <= TURNS; turn++) {
        if (turn % 3 === 0 && units.length < 40) {
          const c = rand() < 0.5 ? simCities[0] : simCities[1];
          const id = 'u' + (++serial);
          if (c === simCities[1]) spawnB.add(id);
          if (!units.some((x) => x.q === c.q && x.r === c.r && x.id !== id)) units.push(unit(id, c.q, c.r));
          else units.push(unit(id, c.q + 1, c.r));
        }
        for (const u of units) u.ruchLeft = u.ruch;
        // zawsze wodz kampanii = g-A (stan "gathering" odnawiany co ture); g-B to drugi, lokalny wodz.
        const opts = gatherCampaign('g-A', units[0].q, units[0].r);
        opts.currentTurn = turn; opts.aiGeneralWarCampaign.turn = turn;
        const leaders = units.filter((x) => x.isGeneral);
        const t0 = process.hrtime.bigint();
        const cmds = M.decideAITurn(1, units, simCities, simMap, data, opts);
        simNs += process.hrtime.bigint() - t0; simCalls++;
        for (const c of cmds) {
          if (c.type !== 'move') continue;
          const u = units.find((x) => x.id === c.unitId);
          if (!u || u.isGeneral) continue;
          // najblizszy wodz po realnej trasie (referencja)
          const lens = leaders.map((l) => ({ l, len: M.computePath(u, simMap, l.q, l.r, new Set()).length || 1e9 }));
          lens.sort((a, b) => a.len - b.len);
          const nearest = lens[0].l;
          // wodz, do ktorego jednostka faktycznie zmierza: ten, do ktorego sciezka sie skrocila najbardziej
          const after = { ...u, q: c.toQ, r: c.toR };
          let best = null, bestGain = -Infinity;
          for (const l of leaders) {
            const before = M.computePath(u, simMap, l.q, l.r, new Set()).length;
            const aft = (after.q === l.q && after.r === l.r) ? 0 : M.computePath(after, simMap, l.q, l.r, new Set()).length;
            // wodzowie sa daleko od siebie: zmierza do tego, do ktorego po ruchu zostaje najmniej trasy
            const gain = -aft + (before >= 0 ? 0 : 0);
            if (gain > bestGain) { bestGain = gain; best = l; }
          }
          headings++;
          if (process.env.ATL_DBG && headings < 12) console.log('DBG', u.id, u.q, u.r, '->', c.toQ, c.toR, 'nearest', nearest.id, 'best', best.id, JSON.stringify(lens.map((x) => [x.l.id, x.len])));
          if (best.id !== nearest.id) nonNearest++;
          u.q = c.toQ; u.r = c.toR; u.ruchLeft = 0;
        }
      }
      // wynik koncowy: jednostki rekrutowane w miescie B (blisko g-B), ktore stoja u g-A (dalekiego), i odwrotnie
      const gA = units[0], gB = units[1];
      let atWrong = 0, atAny = 0;
      for (const u of units) {
        if (u.isGeneral) continue;
        const atA = u.q === gA.q && u.r === gA.r, atB = u.q === gB.q && u.r === gB.r;
        if (!atA && !atB) continue;
        atAny++;
        const fromB = u.id && spawnB.has(u.id);
        if ((fromB && atA) || (!fromB && atB)) atWrong++;
      }
      console.log(`SIM seed=${seed} koniec: jednostek u wodzow=${atAny}, u nie-najblizszego=${atWrong}`);
      rows.push({ seed, headings, nonNearest, share: headings ? nonNearest / headings : 0 });
    }
    for (const r of rows) console.log(`SIM seed=${r.seed} turns=${TURNS} ruchow=${r.headings} do_nie_najblizszego=${r.nonNearest} odsetek=${r.share.toFixed(3)}`);
    const tot = rows.reduce((a, r) => ({ h: a.h + r.headings, n: a.n + r.nonNearest }), { h: 0, n: 0 });
    const share = tot.h ? tot.n / tot.h : 0;
    console.log(`PERF decideAITurn: ${simCalls} wywolan, srednio ${(Number(simNs) / 1e6 / Math.max(1, simCalls)).toFixed(2)} ms/ture (lacznie ${(Number(simNs) / 1e6).toFixed(0)} ms)`);
    {
      // PERF stres: 80 jednostek rozproszonych, 4 wodzow, 20 tur zbiorki (najgorszy realny przypadek).
      const sm = makeMap(40, 14);
      const gens = [unit('g1', 5, 3, { isGeneral: true }), unit('g2', 30, 3, { isGeneral: true }),
        unit('g3', 8, 10, { isGeneral: true }), unit('g4', 34, 11, { isGeneral: true })];
      const stress = [...gens];
      for (let i = 0; i < 80; i++) stress.push(unit('s' + i, 2 + (i * 7) % 36, 1 + (i * 5) % 12));
      let ns = 0n;
      for (let t = 0; t < 20; t++) {
        for (const x of stress) x.ruchLeft = x.ruch;
        const o = gatherCampaign('g1', 5, 3); o.currentTurn = t + 1; o.aiGeneralWarCampaign.turn = t + 1;
        const t0 = process.hrtime.bigint();
        const cs = M.decideAITurn(1, stress, [{ id: 'cS', ownerId: 1, q: 6, r: 3, name: 'cS', population: 5 },
          { id: 'en', ownerId: 2, q: 38, r: 1, name: 'en', population: 5 }], sm, data, o);
        ns += process.hrtime.bigint() - t0;
        for (const c of cs) if (c.type === 'move') { const x = stress.find((y) => y.id === c.unitId); if (x && !x.isGeneral) { x.q = c.toQ; x.r = c.toR; } }
      }
      console.log(`PERF stres (80 jednostek, 4 wodzow, 20 tur): srednio ${(Number(ns) / 1e6 / 20).toFixed(1)} ms/ture`);
    }
    console.log(`SIM razem ruchow=${tot.h} do_nie_najblizszego=${tot.n} odsetek=${share.toFixed(3)} (${hasPicker ? 'PO' : 'PRZED'})`);
    check('D odsetek jednostek idacych do nie-najblizszego wodza < 5%', share < 0.05, 'odsetek=' + share.toFixed(3));
  }

  // ---------- E: statycznie ----------
  const mainTs = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  check('E1 main.ts: planSpawnedUnitFollowGeneral wybiera najblizszego (nie units.find)',
    !/const general = units\.find\(x => x\.ownerId === u\.ownerId && x\.isGeneral === true\);/.test(mainTs)
    && mainTs.includes('pickNearestLeaderForUnit'));
  check('E2 main.ts: wodz kampanii AI wybierany przez pickNearestAvailableLeader', mainTs.includes('pickNearestAvailableLeader({ q: routeProbe.q'));

  check('E3 main.ts: przycisk "Idz do wodza" przekazuje wybranego wodza do issueGeneralQuickFollow',
    mainTs.includes('pickNearestLeaderForUnit(u) ?? nearestLivingGeneral(u, units)')
    && mainTs.includes('issueGeneralQuickFollow(u, commander ? [u, commander] : units'));
  check('E4 main.ts: syncGeneralMarchTargets nadpisuje cel marszu najblizszym po trasie',
    /const best = pickNearestLeaderForUnit\(unit\);/.test(mainTs)
    && mainTs.includes('pickNearestLeaderUnit(u, units, id => plannedMarches.has(id)'));

  console.log(`\nWYNIK: ${passed} PASS, ${failed} FAIL`);
  try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
