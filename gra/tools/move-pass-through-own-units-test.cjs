'use strict';
/**
 * move-pass-through-own-units-test.cjs -- R-WEB-MOVE-PASS-THROUGH-OWN-UNITS-Q1.
 * Uruchom z gra/:  node tools/move-pass-through-own-units-test.cjs
 *
 * Zasady: (1) przez WLASNE jednostki wolno przechodzic (koszt terenu jak zwykle), przez OBCE (kazdy inny
 * wlasciciel: wojna/pokoj/panstwa-miasta/barbarzyncy) nie; (2) ruch KONCZACY sie na wlasnej jednostce =
 * laczenie (coLocatedForMergePrompt niepuste), ruch tylko PRZECHODZACY = brak laczenia (koniec na wolnym heksie).
 * Sciezki: computePath/Reachable, marsz gracza (executeMarchStep), AI firstStep, barbarzynca firstStep,
 * egzekutor komendy move AI, planer wojny all-in, zwiad.
 * Mutacje (sekcja M) podmieniaja tekst PRAWDZIWEGO zrodla w pamieci (esbuild onLoad).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const H = require('./war-allin-capital-harness.cjs');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const abs = (rel) => path.join(SRC, rel);

const SETUP = 'units/setup.ts';
const MUTS = {
  OWN_BLOCKS: { name: 'przywrocona blokada WLASNYCH jednostek', rel: SETUP,
    from: 'if (u.ownerId !== moverOwnerId) occ.add(keyOf(u.q, u.r));', to: 'occ.add(keyOf(u.q, u.r));' },
  FOREIGN_FREE: { name: 'zniesiona blokada OBCYCH jednostek', rel: SETUP,
    from: 'if (u.ownerId !== moverOwnerId) occ.add(keyOf(u.q, u.r));', to: 'if (false) occ.add(keyOf(u.q, u.r));' },
  MERGE_ON_PASS: { name: 'segment konczy sie na wlasnej jednostce (propozycja laczenia przy przejsciu)', rel: SETUP,
    from: 'if (segment.length >= fullLength) return segment;', to: 'return segment;' },
};

async function makeBundle(tag, mutations) {
  const entry = path.resolve(__dirname, `.mpt-${tag}-entry.ts`);
  const bundle = path.resolve(__dirname, `.mpt-${tag}-bundle.cjs`);
  const probe = new Set([abs('game/ai.ts'), abs('game/barbarians.ts')]);
  const muts = mutations.map((m) => ({ ...m, abs: abs(m.rel) }));
  const J = (r) => JSON.stringify(abs(r));
  fs.writeFileSync(entry, [
    `export { __firstStep as aiFirstStep } from ${J('game/ai.ts')};`,
    `export { __firstStep as barbFirstStep } from ${J('game/barbarians.ts')};`,
    `export { computePath, computeReachable, buildMoveOccupancy, MoveOccupancy, trimSegmentEndOffPassThrough, keyOf, hexDistance } from ${J(SETUP)};`,
    `export { planPathTurns, executeMarchStep } from ${J('game/planned-march.ts')};`,
    `export { planWarAllInCapital } from ${J('game/warAllInCapital.ts')};`,
    `export { executeAiCityMove } from ${J('game/ai-city-capture-executor.ts')};`,
    `export { coLocatedForMergePrompt } from ${J('game/armyMerge.ts')};`,
    `export { advanceScoutAutoExplore } from ${J('game/scout-auto-explore.ts')};`,
    '',
  ].join('\n'), 'utf8');
  const plugin = {
    name: 'mpt-probe',
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        if (!args.path.startsWith(SRC + path.sep)) return undefined;
        let text = fs.readFileSync(args.path, 'utf8');
        for (const m of muts) {
          if (args.path !== m.abs) continue;
          const n = text.split(m.from).length - 1;
          if (n < 1) throw new Error(`mutacja "${m.name}": wzorzec nieznaleziony w ${m.rel}`);
          text = text.split(m.from).join(m.to);
        }
        if (probe.has(args.path)) text += '\nexport { firstStep as __firstStep };\n';
        return { contents: text, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
  try {
    await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: bundle, absWorkingDir: GRA, logLevel: 'silent', plugins: [plugin] });
    return require(bundle);
  } finally {
    for (const f of [entry, bundle]) { try { fs.unlinkSync(f); } catch (_) { /* brak */ } }
  }
}

// Korytarz 1-heksowy: tylko (0..9, 0) -- brak objazdu, wiec "omija" == "brak trasy".
const corridor = () => H.makeMap(10, 1);
const U = (id, owner, q, ruchLeft = 5) => { const u = H.mkUnit(id, owner, q, 0); u.ruchLeft = ruchLeft; u.ruch = ruchLeft; return u; };

function scenarios(M) {
  const map = corridor();
  const r = {};
  const K = M.keyOf;
  {
    const mover = U('m', 1, 0);
    r.pathOwn = M.computePath(mover, map, 8, 0, M.buildMoveOccupancy([mover, U('o', 1, 3)], 1, ['m'])).length;
    r.pathForeign = M.computePath(mover, map, 8, 0, M.buildMoveOccupancy([mover, U('f', 2, 3)], 1, ['m'])).length;
    r.pathNeutral = M.computePath(mover, map, 8, 0, M.buildMoveOccupancy([mover, U('p', 3, 3)], 1, ['m'])).length;
    r.pathMixedHex = M.computePath(mover, map, 8, 0,
      M.buildMoveOccupancy([mover, U('o', 1, 3), U('f', 2, 3)], 1, ['m'])).length;
  }
  {
    const mover = U('m', 1, 0, 5);
    const reach = M.computeReachable(mover, map, M.buildMoveOccupancy([mover, U('o', 1, 3)], 1, ['m']));
    r.reachHasOwnHex = reach.has(K(3, 0));
    r.reachBeyond = reach.has(K(5, 0));
  }
  {
    const run = (budget, destQ, units) => {
      const mover = units.find((u) => u.id === 'm'); mover.ruchLeft = budget;
      const occ = M.buildMoveOccupancy(units, 1, ['m']);
      const res = M.executeMarchStep(mover, { destQ, destR: 0 }, map, occ, budget, () => true, 5);
      const last = res.movePath[res.movePath.length - 1];
      if (last) { mover.q = last.q; mover.r = last.r; }
      const merge = M.coLocatedForMergePrompt(units, mover.q, mover.r, 1).filter((x) => x.id !== 'm').length;
      return { ok: res.ok, endQ: last ? last.q : null, merge, arrived: res.arrived, stop: res.stopReason };
    };
    const mk = () => [U('m', 1, 0), U('o', 1, 3)];
    r.marchPass5 = run(5, 8, mk());
    r.marchPass3 = run(3, 8, mk());
    r.marchEndOnOwn = run(5, 3, mk());
    r.marchForeign = run(5, 8, [U('m', 1, 0), U('f', 2, 3)]);
    r.marchOnly1 = run(1, 8, [U('m', 1, 0), U('o', 1, 1)]);
  }
  {
    const step = (budget, owner) => {
      const us = [U('a1', 1, 0, budget), U('b', owner, 3)];
      return M.aiFirstStep(us[0], map, 8, 0, us);
    };
    r.aiPass5 = step(5, 1);
    r.aiPass3 = step(3, 1);
    r.aiForeign = step(5, 2);
    const us = [U('a1', 1, 0, 8), U('b', 1, 3)];
    r.aiToOwnDest = M.aiFirstStep(us[0], map, 3, 0, us, true);
  }
  {
    const bstep = (budget, owner) => {
      const m = U('b1', 9, 0, budget); const us = [m, U('x', owner, 3)];
      return M.barbFirstStep(m, map, 8, 0, M.buildMoveOccupancy(us, 9, ['b1']));
    };
    r.barbPass5 = bstep(5, 9);
    r.barbPass3 = bstep(3, 9);
    r.barbForeign = bstep(5, 8);
  }
  {
    const exec = (blocker, cut, budget) => {
      const m = U('c1', 1, 0, budget); const us = [m, U('x', blocker, 3)];
      const blockedKeys = M.buildMoveOccupancy(us, 1, ['c1']);
      M.executeAiCityMove({
        command: { unitId: 'c1', toQ: 8, toR: 0 }, unit: m, cities: [], cityBuiltIds: [], hasCityDefenders: false,
        unitIsCivilian: false, targetVisible: true, canOccupyCityHex: true,
        blockedKeys, destinationKey: K(8, 0),
        computePath: (u, toQ, toR, occ) => M.computePath(u, map, toQ, toR, occ),
        truncatePath: (full) => full.slice(0, cut),
      });
      return m.q;
    };
    r.execOwn = exec(1, 5, 5);
    r.execForeign = exec(2, 5, 5);
    r.execTrim = exec(1, 3, 3);
  }
  {
    const plan = (budget, passThrough, occupiedKeys) => {
      const units = [{ id: 'w1', q: 0, r: 0, ruchLeft: budget }];
      const nav = { map, blocked: new Set(), occupied: new Set(occupiedKeys), passThrough };
      const p = M.planWarAllInCapital(units, [{ ownerId: 2, cityId: 'cap', q: 9, r: 0 }], nav);
      return p.orders[0] ? p.orders[0].step.q : null;
    };
    r.warOwn = plan(5, new Set([K(3, 0)]), [K(3, 0)]);
    r.warForeign = plan(5, new Set(), [K(3, 0)]);
    r.warOwnEnd = plan(3, new Set([K(3, 0)]), [K(3, 0)]);
  }
  {
    const scout = (budget, villageQ = 3) => {
      const mm = JSON.parse(JSON.stringify(map));
      mm.hexes[villageQ + ',0'].wioska = { istnieje: true, ludnosc: 1 };
      const s = H.mkUnit('s1', 1, 0, 0, 'zwiadowca'); s.ruchLeft = budget; s.ruch = budget;
      const friend = H.mkUnit('f1', 1, 1, 0);
      const explored = new Set(['0,0', '1,0', '2,0', '3,0']);
      M.advanceScoutAutoExplore(s, mm, explored, [s, friend], 1, () => 0.5);
      return s.q;
    };
    r.scout3 = scout(3); r.scout2 = scout(2, 2); r.scout1 = scout(1);
  }
  return r;
}

async function main() {
  const bundles = { main: await makeBundle('main', []) };
  for (const [k, m] of Object.entries(MUTS)) bundles[k] = await makeBundle(k.toLowerCase(), [m]);
  let ok = 0; let fail = 0;
  const assert = (c, m) => { if (c) { ok++; console.log('  [OK] ' + m); } else { fail++; console.error('  [FAIL] ' + m); } };
  const eq = (a, b, m) => assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);

  const R = scenarios(bundles.main);
  console.log('\n--- A: computePath / computeReachable ---');
  eq(R.pathOwn, 8, 'A1 wlasna jednostka w korytarzu: trasa PRZECHODZI (8 heksow)');
  eq(R.pathForeign, 0, 'A2 obca jednostka (wojna lub pokoj) w korytarzu: brak trasy');
  eq(R.pathNeutral, 0, 'A3 trzeci wlasciciel (neutralny/panstwo-miasto) tez blokuje');
  eq(R.pathMixedHex, 0, 'A4 heks z wlasna I obca jednostka = blokada');
  eq(R.reachHasOwnHex, false, 'A5 zasieg nie zawiera heksu z wlasna jednostka (nie wolno tam stanac)');
  eq(R.reachBeyond, true, 'A6 zasieg obejmuje heksy ZA wlasna jednostka');

  console.log('\n--- B: marsz gracza (executeMarchStep) i propozycja polaczenia ---');
  eq(R.marchPass5.endQ, 5, 'B1 przejscie przez wlasna (3): ruch konczy sie na 5');
  eq(R.marchPass5.merge, 0, 'B2 przejscie: BRAK propozycji polaczenia');
  eq(R.marchPass3.endQ, 2, 'B3 budzet 3 -> zatrzymanie PRZED wlasna jednostka (2)');
  eq(R.marchPass3.merge, 0, 'B4 zatrzymanie przed wlasna: brak polaczenia');
  eq(R.marchEndOnOwn.endQ, 3, 'B5 cel = wlasna jednostka: ruch konczy sie na niej');
  assert(R.marchEndOnOwn.merge >= 1, 'B6 koniec na wlasnej: propozycja polaczenia JEST');
  eq(R.marchForeign.ok, false, 'B7 obca na trasie: marsz nie przechodzi');
  eq(R.marchOnly1.endQ, null, 'B8 jedyny heks w zasiegu to wlasna jednostka: stoi (bez polaczenia)');
  eq(R.marchOnly1.stop, 'obstacle', 'B9 powod postoju = przeszkoda (nie "brak ruchu")');

  console.log('\n--- C: AI i barbarzyncy (firstStep) ---');
  eq(R.aiPass5 && R.aiPass5.q, 5, 'C1 AI: wlasna w korytarzu -> przechodzi, krok na 5');
  eq(R.aiPass3 && R.aiPass3.q, 2, 'C2 AI: budzet 3 -> krok na 2 (nie staje na wlasnej)');
  eq(R.aiForeign, null, 'C3 AI: obca na trasie -> brak kroku');
  eq(R.aiToOwnDest && R.aiToOwnDest.q, 3, 'C4 AI: cel = wlasny stos (zbiorka) -> krok NA stos (laczenie)');
  eq(R.barbPass5 && R.barbPass5.q, 5, 'C5 barbarzynca: wlasna w korytarzu -> przechodzi, krok na 5');
  eq(R.barbPass3 && R.barbPass3.q, 2, 'C6 barbarzynca: budzet 3 -> 2');
  eq(R.barbForeign, null, 'C7 barbarzynca: obca (inny wlasciciel) blokuje');

  console.log('\n--- D: egzekutor komendy move AI, planer wojny, zwiad ---');
  eq(R.execOwn, 5, 'D1 egzekutor: przejscie przez wlasna, jednostka konczy na 5');
  eq(R.execForeign, 0, 'D2 egzekutor: obca blokuje (stoi)');
  eq(R.execTrim, 2, 'D3 egzekutor: skrocona trasa nie konczy sie na wlasnej (cofniecie do 2)');
  eq(R.warOwn, 5, 'D4 planer wojny: przechodzi przez wlasna, krok na 5');
  assert(R.warForeign === null || R.warForeign <= 2, `D5 planer wojny: obca blokuje (krok ${R.warForeign} <= 2)`);
  eq(R.warOwnEnd, 2, 'D6 planer wojny: budzet 3 -> nie staje na wlasnej (2)');
  eq(R.scout3, 3, 'D7 zwiad: chatka za wlasna jednostka osiagalna (budzet 3)');
  eq(R.scout2, 2, 'D8 zwiad: chatka na (2) za wlasna (1), budzet 2 -> dociera przez wlasna');
  eq(R.scout1, 0, 'D9 zwiad: budzet 1 -> nie wchodzi na wlasna (staje)');

  console.log('\n--- M: mutacje REALNEGO zrodla musza czerwienic ---');
  {
    const A = scenarios(bundles.OWN_BLOCKS);
    assert(A.pathOwn !== 8 && A.marchPass5.endQ !== 5 && A.aiPass5 === null,
      `M1 ${MUTS.OWN_BLOCKS.name}: A1/B1/C1 czerwone (pathOwn=${A.pathOwn})`);
    const B = scenarios(bundles.FOREIGN_FREE);
    assert(B.pathForeign !== 0 && B.marchForeign.ok === true && B.aiForeign !== null && B.execForeign !== 0,
      `M2 ${MUTS.FOREIGN_FREE.name}: A2/B7/C3/D2 czerwone (pathForeign=${B.pathForeign})`);
    const C = scenarios(bundles.MERGE_ON_PASS);
    assert(C.marchPass3.merge >= 1 && C.marchPass3.endQ === 3,
      `M3 ${MUTS.MERGE_ON_PASS.name}: B3/B4 czerwone (merge=${C.marchPass3.merge})`);
  }

  console.log(`\nWYNIK: ${ok} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(2); });
