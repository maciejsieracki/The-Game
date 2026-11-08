'use strict';
/**
 * ai-war-defend-home-sim.cjs -- wspolny headless silnik zastepczy (R-WEB-AI-WAR-DEFEND-HOME-BEFORE-OFFENSE-Q1).
 * NIE main.ts (main.ts nie jest uruchamialny headless). Uzywa PRAWDZIWEGO decideAITurn (esbuild bundle z gra/src
 * albo z drzewa AI_SRC_DIR) wraz z nakladka obrony domu (ai-war-home-defense.ts) wlaczana/wylaczana
 * przez setHomeWarDefenseOverride (PRZED = OFF, PO = ON na tym samym kodzie).
 *
 * Model walki (deterministyczny, uproszczony): atak = 10 obrazen w cel, kontra 4 (jesli cel zyje); HP 30.
 * Zajecie miasta: wejscie na heks pustego wrogiego miasta (wojna, jednostka bojowa); ustawia
 * capturedFromOwnerId (jak applyCapturePopulationLoss) i origOwner pozostaje pierwotnym zalozycielem.
 * Reinforcements: co `reinforceEvery` tur nowa jednostka w stolicy kazdej cywilizacji (podtrzymanie wojny).
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

function loadEngine(srcDir, tag) {
  const src = srcDir || path.resolve(GRA_ROOT, 'src');
  const entry = path.resolve(__dirname, `.dh-${tag}-entry.ts`);
  const bundle = path.resolve(__dirname, `.dh-${tag}-bundle.cjs`);
  const J = (p) => JSON.stringify(path.join(src, p));
  const baseEntry = `
export { decideAITurn, aiUnitCombatStrength } from ${J('game/ai')};
export { decideBarbarianMoves, FALLBACK_BARB_PARAMS, BARBARIAN_OWNER_ID } from ${J('game/barbarians')};
export { hexDistance, isCivilianUnit, computePath } from ${J('units/setup')};
export { truncatePathWithinBudget } from ${J('game/ai-move-range')};
export { setArmyConsolidationOverride } from ${J('game/army-consolidation')};
export { setWarAllInCapitalOverride } from ${J('game/warAllInCapital')};
export { setHomeWarDefenseOverride, resetHomeWarMemory, planHomeWar } from ${J('game/ai-war-home-defense')};
`;
  // R-WEB-AI-DEFEND-RECAPTURE-ATTACK-PRIORITY-Q1: pole tworcy miasta (cities.ts) -- brak w starszych drzewach (silnik PRZED).
  const withFounder = baseEntry + `export { isCityLostOf, stampCityFounderOnCapture, cityFounderId, ownTerritoryClassOf } from ${J('game/cities')};\n`;
  const build = (text) => {
    fs.writeFileSync(entry, text, 'utf8');
    esbuild.buildSync({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
    });
  };
  try { build(withFounder); } catch (_) { build(baseEntry); }
  const eng = require(bundle);
  eng._files = [entry, bundle];
  return eng;
}

/** Wariant asynchroniczny z mutacjami zrodla ai-war-home-defense.ts (testy mutacyjne): mutations = [[from, to], ...]. */
async function loadEngineMutated(tag, mutations) {
  const src = path.resolve(GRA_ROOT, 'src');
  const entry = path.resolve(__dirname, `.dh-${tag}-entry.ts`);
  const bundle = path.resolve(__dirname, `.dh-${tag}-bundle.cjs`);
  const J = (p) => JSON.stringify(path.join(src, p));
  fs.writeFileSync(entry, `
export { decideAITurn } from ${J('game/ai')};
export { BARBARIAN_OWNER_ID } from ${J('game/barbarians')};
export { hexDistance, isCivilianUnit, computePath } from ${J('units/setup')};
export { truncatePathWithinBudget } from ${J('game/ai-move-range')};
export { setArmyConsolidationOverride } from ${J('game/army-consolidation')};
export { setWarAllInCapitalOverride } from ${J('game/warAllInCapital')};
export { setHomeWarDefenseOverride, resetHomeWarMemory, planHomeWar } from ${J('game/ai-war-home-defense')};
`, 'utf8');
  const plugin = {
    name: 'mutate',
    setup(b) {
      b.onLoad({ filter: /ai-war-home-defense\.ts$/ }, (args) => {
        let text = fs.readFileSync(args.path, 'utf8');
        for (const [from, to] of mutations) {
          if (!text.includes(from)) throw new Error('mutacja nie pasuje: ' + from);
          text = text.replace(from, to);
        }
        return { contents: text, loader: 'ts' };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent', plugins: [plugin],
  });
  delete require.cache[bundle];
  const eng = require(bundle);
  eng._files = [entry, bundle];
  return eng;
}

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

const DATA = {
  units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2, meleeAttack: 10, meleeDefence: 8, armor: 2, weaponDamage: 10 }],
  buildings: [{ id: 'koszary', nazwa: 'Koszary' }],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
  aiParams: {},
};

function mkUnit(id, ownerId, q, r, category = 'miecznik') {
  return {
    id, ownerId, typeId: category === 'zwiadowca' ? 'Zwiadowca' : category === 'osadnik' ? 'Osadnik' : 'Wojownik',
    category, q, r, ruch: 2, ruchLeft: 2, hp: 30,
  };
}
function mkCity(id, ownerId, q, r, population = 5) {
  return { id, ownerId, q, r, name: id, population, origOwner: ownerId };
}

/** o = { engine, homeDefense: bool, turns, reinforceEvery, onTurn, fog } */
function simulate(state, o) {
  const E = o.engine;
  E.setArmyConsolidationOverride(o.consolidation !== false);
  E.setWarAllInCapitalOverride(true);
  E.setHomeWarDefenseOverride(!!o.homeDefense);
  E.resetHomeWarMemory();
  const stats = {
    battles: 0, captures: 0, recaptures: 0, exchanges: 0, lost: {}, gained: {},
    invaderTurns: 0, invaderUnitTurns: 0, longestInvasion: 0, decisionMs: 0, perTurnMs: [], log: [],
    cityLossByOwner: {}, captureEvents: [], longInvasionEpisodes: 0,
  };
  const atWar = (a, b) => {
    if (a === E.BARBARIAN_OWNER_ID || b === E.BARBARIAN_OWNER_ID) return a !== b;
    return state.wars.has(a < b ? `${a}_${b}` : `${b}_${a}`);
  };
  // KONTAKT (R-WEB-AI-DEFEND-RECAPTURE-ATTACK-PRIORITY-Q1): pary bez kontaktu (state.noContact). Domyslnie kontakt.
  const hasContact = (a, b) => {
    if (a === E.BARBARIAN_OWNER_ID || b === E.BARBARIAN_OWNER_ID) return true;
    return !(state.noContact && state.noContact.has(a < b ? `${a}_${b}` : `${b}_${a}`));
  };
  const capitalOf = (owner) => state.cities.filter(c => c.ownerId === owner).sort((x, y) => (x.id < y.id ? -1 : 1))[0] || null;
  const ctxFor = (self) => {
    const owners = [...new Set(state.cities.map(c => c.ownerId))]
      .filter(x => x !== self && x !== E.BARBARIAN_OWNER_ID && atWar(self, x)).sort((a, b) => a - b);
    const targets = [];
    for (const ow of owners) {
      const cap = capitalOf(ow);
      if (cap) targets.push({ ownerId: ow, cityId: cap.id, q: cap.q, r: cap.r });
    }
    return { targets };
  };
  const cityAt = (q, r) => state.cities.find(c => c.q === q && c.r === r);
  const occAt = (q, r, un, stackOk) => state.units.find(x => x.q === q && x.r === r && x.hp > 0
    && !(x.ownerId === un.ownerId && (o.consolidation !== false || stackOk)));
  const captureLog = []; // {turn, by, from, cityId, orig}

  function applyCmds(cmds, ownerId, turn) {
    for (const c of cmds) {
      if (c.type !== 'move' && c.type !== 'attack') continue;
      const u = state.units.find(x => x.id === c.unitId);
      if (!u || u.hp <= 0 || u.ownerId !== ownerId) continue;
      if (c.type === 'attack') {
        const t = state.units.find(x => x.id === c.targetUnitId);
        if (!t || t.hp <= 0 || E.hexDistance(u.q, u.r, t.q, t.r) > 1 || u.ruchLeft <= 0) continue;
        t.hp -= 10; if (t.hp > 0) u.hp -= 4; u.ruchLeft = 0; stats.battles++;
        continue;
      }
      if (u.ruchLeft <= 0) continue;
      let dest = { q: c.toQ, r: c.toR };
      if (E.hexDistance(u.q, u.r, c.toQ, c.toR) !== 1) {
        const blocked = new Set();
        for (const x of state.units) if (x !== u && x.hp > 0 && !(x.ownerId === u.ownerId
          && (o.consolidation !== false || (c.allowFriendlyStack && x.q === c.toQ && x.r === c.toR)))) blocked.add(`${x.q},${x.r}`);
        for (const ct of state.cities) if (ct.ownerId !== u.ownerId) blocked.add(`${ct.q},${ct.r}`);
        const full = E.computePath(u, state.map, c.toQ, c.toR, blocked);
        if (full.length === 0) continue;
        const cut = E.truncatePathWithinBudget(full, u.ruchLeft, state.map);
        let end = cut.length;
        if (end < full.length) while (end > 0 && blocked.has(`${cut[end - 1].q},${cut[end - 1].r}`)) end--;
        if (end === 0) continue;
        dest = cut[end - 1];
        if (end === full.length && occAt(dest.q, dest.r, u, c.allowFriendlyStack)) continue;
      } else if (occAt(dest.q, dest.r, u, c.allowFriendlyStack)) continue;
      const city = cityAt(dest.q, dest.r);
      if (city && city.ownerId !== u.ownerId) {
        if (!atWar(u.ownerId, city.ownerId) || E.isCivilianUnit(u)) continue;
        const prev = city.ownerId;
        city.capturedFromOwnerId = prev;
        if (E.stampCityFounderOnCapture) E.stampCityFounderOnCapture(city, prev); // tworca (cities.ts)
        city.ownerId = u.ownerId;
        stats.captures++;
        const isRecapture = city.origOwner === u.ownerId;
        if (isRecapture) stats.recaptures++;
        captureLog.push({ turn, by: u.ownerId, from: prev, cityId: city.id, orig: city.origOwner, recapture: isRecapture });
        stats.lost[prev] = (stats.lost[prev] || 0) + 1;
        stats.gained[u.ownerId] = (stats.gained[u.ownerId] || 0) + 1;
      }
      u.q = dest.q; u.r = dest.r; u.ruchLeft = 0;
    }
  }

  const invasionRun = new Map(); // `${ownerId}` -> consecutive turns with enemy military on own territory
  for (let turn = 1; turn <= o.turns; turn++) {
    const t0 = process.hrtime.bigint();
    state.units = state.units.filter(u => u.hp > 0);
    for (const u of state.units) u.ruchLeft = u.ruch;
    if (o.reinforceEvery && turn % o.reinforceEvery === 0) {
      for (const ow of state.aiOwners) {
        const cap = capitalOf(ow);
        if (cap && !state.units.some(u => u.q === cap.q && u.r === cap.r)) {
          state.units.push(mkUnit(`r${ow}_${turn}`, ow, cap.q, cap.r));
        }
      }
    }
    // pomiar: obecnosc wroga (w wojnie) na terenie AI -- PRZED ruchem tury
    for (const ow of state.aiOwners) {
      const mine = state.cities.filter(c => c.ownerId === ow);
      const radius = 3;
      const inv = state.units.filter(u => u.ownerId !== ow && atWar(ow, u.ownerId) && u.ownerId !== E.BARBARIAN_OWNER_ID
        && !E.isCivilianUnit(u) && mine.some(c => E.hexDistance(u.q, u.r, c.q, c.r) <= radius));
      if (inv.length > 0) {
        stats.invaderTurns++; stats.invaderUnitTurns += inv.length;
        const n = (invasionRun.get(ow) || 0) + 1; invasionRun.set(ow, n);
        if (n > stats.longestInvasion) stats.longestInvasion = n;
      } else { if ((invasionRun.get(ow) || 0) >= 5) stats.longInvasionEpisodes++; invasionRun.set(ow, 0); }
    }
    let dec = 0n;
    for (const owner of state.aiOwners) {
      const own = capitalOf(owner);
      const opts = {
        canEngageOwner: (t) => atWar(owner, t),
        hasContactWith: (t) => hasContact(owner, t),
        currentTurn: turn,
        warAllIn: ctxFor(owner),
        capitalCityId: own ? own.id : null,
        atWarWithCiv: state.cities.some(c => c.ownerId !== owner && c.ownerId !== E.BARBARIAN_OWNER_ID && atWar(owner, c.ownerId)),
      };
      const d0 = process.hrtime.bigint();
      const cmds = E.decideAITurn(owner, state.units, state.cities, state.map, DATA, opts);
      dec += process.hrtime.bigint() - d0;
      applyCmds(cmds, owner, turn);
    }
    stats.decisionMs += Number(dec) / 1e6;
    stats.perTurnMs.push(Number(process.hrtime.bigint() - t0) / 1e6);
    if (o.onTurn) o.onTurn(turn, state, stats);
  }
  for (const n of invasionRun.values()) if (n >= 5) stats.longInvasionEpisodes++;
  // "wymiana miast": A zajmuje (nie odbija) miasto B w ciagu N tur po tym, jak B zajal (nie odbil) miasto A.
  const N = o.exchangeWindow || 30;
  const fresh = captureLog.filter(c => !c.recapture);
  const used = new Set();
  stats.exchanges = 0;
  for (let i = 0; i < fresh.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < fresh.length; j++) {
      if (used.has(j)) continue;
      if (fresh[i].by === fresh[j].from && fresh[i].from === fresh[j].by && Math.abs(fresh[i].turn - fresh[j].turn) <= N) {
        used.add(i); used.add(j); stats.exchanges++; break;
      }
    }
  }
  // Szeroka "wymiana": zdobycie (nie odbicie) przez cywilizacje, ktora w ciagu N tur wczesniej sama stracila miasto komukolwiek.
  stats.exchangesWide = fresh.filter(c => captureLog.some(d => d.from === c.by && d.turn < c.turn && c.turn - d.turn <= N)).length;
  stats.captureLog = captureLog;
  return stats;
}

function cleanup(E) { for (const f of E._files || []) { try { fs.unlinkSync(f); } catch (_) { /* ok */ } } }

module.exports = { loadEngine, loadEngineMutated, makeMap, mkUnit, mkCity, simulate, cleanup, DATA };
