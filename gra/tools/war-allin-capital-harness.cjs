'use strict';
/**
 * war-allin-capital-harness.cjs -- wspolny headless harness symulacji wojny
 * (R-WEB-WAR-ALLIN-CAPITAL-Q1). Uzywa PRAWDZIWYCH decideAITurn / decideBarbarianMoves /
 * planWarAllInCapital (esbuild bundle z gra/src albo z drzewa wskazanego AI_SRC_DIR --
 * np. baza origin/main bez modulu warAllInCapital.ts).
 *
 * Silnik zastepczy (NIE main.ts -- main.ts nie jest uruchamialny headless): krok po kroku
 * wykonuje komendy move/attack, przejmuje puste miasta, liczy bitwy. Stolica cywilizacji =
 * jej najstarsze (pierwsze po id) miasto; po utracie stolicy wyznaczana jest kolejna
 * (odpowiednik capitalCityIdForOwner). Gracz (owner 0) NIE dostaje zadnych rozkazow.
 * Ruch jak w main.ts (executeAiCityMove): JEDNO wywolanie decyzji na ture, ruch = 1 heks, ruchLeft=0.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

function loadEngine(srcDir, tag) {
  const src = srcDir || path.resolve(GRA_ROOT, 'src');
  const hasMod = fs.existsSync(path.join(src, 'game', 'warAllInCapital.ts'));
  const entry = path.resolve(__dirname, `.war-allin-${tag}-entry.ts`);
  const bundle = path.resolve(__dirname, `.war-allin-${tag}-bundle.cjs`);
  const J = (p) => JSON.stringify(path.join(src, p));
  fs.writeFileSync(entry, `
export { decideAITurn } from ${J('game/ai')};
export { decideBarbarianMoves, FALLBACK_BARB_PARAMS, BARBARIAN_OWNER_ID } from ${J('game/barbarians')};
export { hexDistance, isCivilianUnit } from ${J('units/setup')};
${hasMod ? `export { setWarAllInCapitalOverride, isWarAllInCapitalEnabled, planWarAllInCapital, WAR_ALLIN_CAPITAL_ENABLED } from ${J('game/warAllInCapital')};` : ''}
`, 'utf8');
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  const eng = require(bundle);
  eng.hasModule = hasMod;
  eng._files = [entry, bundle];
  return eng;
}

function makeMap(w, h, waterRect) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const sea = waterRect && q >= waterRect.q0 && q <= waterRect.q1 && r >= waterRect.r0 && r <= waterRect.r1;
      hexes[`${q},${r}`] = {
        coords: { q, r }, terenBazowy: sea ? 'morze' : 'laka', nakladka: 'brak', ulepszenie: 'brak',
        wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

const DATA = {
  units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }],
  buildings: [{ id: 'koszary', nazwa: 'Koszary' }],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
  aiParams: {},
};

function mkUnit(id, ownerId, q, r, category = 'miecznik') {
  return { id, ownerId, typeId: category === 'zwiadowca' ? 'Zwiadowca' : category === 'osadnik' ? 'Osadnik' : 'Wojownik',
    category, q, r, ruch: 2, ruchLeft: 2, hp: 3 };
}
function mkCity(id, ownerId, q, r, population = 5) {
  return { id, ownerId, q, r, name: id, population };
}

/**
 * state = { map, units, cities, wars: Set('a_b'), aiOwners:[...], humanOwners:[0], barbs:bool }
 * opts = { engine, flag: true|false|null(brak modulu), fog: bool, turns, onTurn }
 */
function simulate(state, o) {
  const E = o.engine;
  if (E.hasModule) E.setWarAllInCapitalOverride(o.flag === null ? null : o.flag);
  const stats = {
    battles: 0, captures: 0, cmdMoves: 0, unitsOrderedToCapital: 0, perTurnMs: [], decisionMs: 0,
    cmdsForForeignUnits: 0, humanUnitMoves: 0, moveBlockedByUnit: 0, log: [],
  };
  const atWar = (a, b) => {
    if (a === E.BARBARIAN_OWNER_ID || b === E.BARBARIAN_OWNER_ID) return a !== b;
    return state.wars.has(a < b ? `${a}_${b}` : `${b}_${a}`);
  };
  const capitalOf = (owner) => {
    const mine = state.cities.filter(c => c.ownerId === owner).sort((x, y) => (x.id < y.id ? -1 : 1));
    return mine[0] || null;
  };
  const ctxFor = (self) => {
    if (!E.hasModule || !E.isWarAllInCapitalEnabled()) return undefined;
    const owners = [...new Set(state.cities.map(c => c.ownerId))]
      .filter(x => x !== self && x !== E.BARBARIAN_OWNER_ID && atWar(self, x)).sort((a, b) => a - b);
    const targets = [];
    for (const ow of owners) {
      const cap = capitalOf(ow);
      if (cap) targets.push({ ownerId: ow, cityId: cap.id, q: cap.q, r: cap.r });
    }
    return { targets };
  };
  const unitAt = (q, r) => state.units.find(u => u.q === q && u.r === r && u.hp > 0);
  const cityAt = (q, r) => state.cities.find(c => c.q === q && c.r === r);

  function applyCmds(cmds, ownerId) {
    let moved = 0;
    for (const c of cmds) {
      if (c.type === 'endTurn') continue;
      if (c.type !== 'move' && c.type !== 'attack') continue;
      const u = state.units.find(x => x.id === c.unitId);
      if (!u || u.hp <= 0) continue;
      if (u.ownerId !== ownerId) { stats.cmdsForForeignUnits++; continue; }
      if (u.ownerId === 0) stats.humanUnitMoves++;
      if (c.type === 'attack') {
        const t = state.units.find(x => x.id === c.targetUnitId);
        if (!t || t.hp <= 0 || E.hexDistance(u.q, u.r, t.q, t.r) > 1 || u.ruchLeft <= 0) continue;
        t.hp -= 1; u.hp -= 0.34; u.ruchLeft = 0; stats.battles++;
        continue;
      }
      if (u.ruchLeft <= 0) continue;
      if (E.hexDistance(u.q, u.r, c.toQ, c.toR) !== 1) continue;
      const occ = unitAt(c.toQ, c.toR);
      const city = cityAt(c.toQ, c.toR);
      if (occ) { stats.moveBlockedByUnit++; continue; }
      if (city && city.ownerId !== u.ownerId) {
        if (!atWar(u.ownerId, city.ownerId) || E.isCivilianUnit(u)) continue;
        city.ownerId = u.ownerId; stats.captures++;
        stats.log.push(`captured ${city.id} by ${u.ownerId}`);
      }
      u.q = c.toQ; u.r = c.toR; u.ruchLeft = 0; moved++; stats.cmdMoves++; // jak executeAiCityMove: ruchLeft=0 po ruchu
    }
    return moved;
  }

  for (let turn = 1; turn <= o.turns; turn++) {
    const t0 = process.hrtime.bigint();
    state.units = state.units.filter(u => u.hp > 0);
    for (const u of state.units) u.ruchLeft = u.ruch;
    let dec = 0n;
    for (const owner of state.aiOwners) {
      for (let round = 0; round < 1; round++) {
        const opts = {
          canEngageOwner: (t) => atWar(owner, t),
          currentTurn: turn,
          warAllIn: ctxFor(owner),
        };
        if (o.fog) {
          // Realna mgla: AI widzi tylko heksy w promieniu 4 od wlasnych jednostek i miast.
          const vis = new Set();
          const srcs = [...state.units.filter(u => u.ownerId === owner), ...state.cities.filter(c => c.ownerId === owner)];
          for (const sx of srcs) {
            for (let dq = -4; dq <= 4; dq++) for (let dr = -4; dr <= 4; dr++) {
              if (E.hexDistance(0, 0, dq, dr) <= 4) vis.add(`${sx.q + dq},${sx.r + dr}`);
            }
          }
          opts.visibleHexes = vis;
        }
        const d0 = process.hrtime.bigint();
        const cmds = E.decideAITurn(owner, state.units, state.cities, state.map, DATA, opts);
        dec += process.hrtime.bigint() - d0;
        const m = applyCmds(cmds, owner);
        if (m === 0) break;
      }
    }
    if (state.barbs) {
      for (let round = 0; round < 1; round++) {
        const barbUnits = state.units.filter(u => u.ownerId === E.BARBARIAN_OWNER_ID && u.hp > 0);
        const others = state.units.filter(u => u.ownerId !== E.BARBARIAN_OWNER_ID && u.hp > 0);
        const d0 = process.hrtime.bigint();
        const cmds = E.decideBarbarianMoves(
          barbUnits, others, state.cities, [], state.map, E.FALLBACK_BARB_PARAMS,
          (t) => atWar(E.BARBARIAN_OWNER_ID, t), 'normal', turn,
          E.hasModule ? ctxFor(E.BARBARIAN_OWNER_ID) : undefined,
        );
        dec += process.hrtime.bigint() - d0;
        const m = applyCmds(cmds, E.BARBARIAN_OWNER_ID);
        if (m === 0) break;
      }
    }
    stats.decisionMs += Number(dec) / 1e6;
    stats.perTurnMs.push(Number(process.hrtime.bigint() - t0) / 1e6);
    if (o.onTurn) o.onTurn(turn, state, stats);
  }
  return stats;
}

function stateHash(state) {
  const body = JSON.stringify({
    u: state.units.map(u => [u.id, u.ownerId, u.q, u.r, Math.round(u.hp * 100)]).sort(),
    c: state.cities.map(c => [c.id, c.ownerId]).sort(),
  });
  return crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
}

function cleanup(E) { for (const f of E._files || []) { try { fs.unlinkSync(f); } catch (_) { /* ok */ } } }

module.exports = { loadEngine, makeMap, mkUnit, mkCity, simulate, stateHash, cleanup, DATA };
