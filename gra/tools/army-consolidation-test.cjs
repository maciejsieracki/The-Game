'use strict';

/*
 * R-WEB-ARMY-CONSOLIDATION-Q1 -- testy czystych funkcji (army-consolidation.ts), wiringu
 * flagi (ai.ts / main.ts) oraz mutacje: usuniecie scalania / podzialu / punktu zbiorki
 * musi dac czerwien. Uruchomienie: node tools/army-consolidation-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC_MODULE = path.join(GRA, 'src', 'game', 'army-consolidation.ts');
const TMP_FILES = [];

function bundleEntry(name, entryBody, dir) {
  const entry = path.join(dir, `.${name}-entry.ts`);
  const bundle = path.join(dir, `.${name}-bundle.cjs`);
  fs.writeFileSync(entry, entryBody);
  TMP_FILES.push(entry, bundle);
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
  // eslint-disable-next-line import/no-dynamic-require
  delete require.cache[bundle];
  return require(bundle);
}

function cleanup() {
  for (const f of TMP_FILES) {
    try { fs.unlinkSync(f); } catch (_) { /* already gone */ }
  }
}

/** Zestaw asercji na module (C). Zwraca { passed, failed, msgs }. */
function runSuite(C) {
  const out = { passed: 0, failed: 0, msgs: [] };
  const ok = (v, m) => { if (v) out.passed++; else { out.failed++; out.msgs.push(m); } };
  const u = (id, q, r, ruchLeft = 2) => ({ id, q, r, ruchLeft });

  // --- kontrakt flagi i parametrow ---
  ok(C.ARMY_CONSOLIDATION_ENABLED === true, 'flaga: domyslnie ON (wydanie robocze nr 6)');
  ok(C.isArmyConsolidationEnabled() === true, 'flaga: isArmyConsolidationEnabled() = true domyslnie');
  C.setArmyConsolidationOverride(true);
  ok(C.isArmyConsolidationEnabled() === true, 'flaga: override ON dziala');
  C.setArmyConsolidationOverride(null);
  ok(C.isArmyConsolidationEnabled() === true, 'flaga: override null wraca do ON (default)');
  ok(C.ARMY_CONSOLIDATION_MAX_PER_HEX === 12, 'params: max per hex = 12 (z JSON)');
  ok(C.ARMY_CONSOLIDATION_HOME_GROUP_SIZE === 2, 'params: home group = 2 (z JSON)');
  ok(C.ARMY_CONSOLIDATION_RALLY_SEARCH_HEX === 12, 'params: rally search = 12 (z JSON)');

  // --- pickRallyCity: stolica, a po jej utracie pierwsze miasto ---
  const cities = [
    { id: 'A', q: 0, r: 0 },
    { id: 'B', q: 5, r: 0 },
    { id: 'C', q: 0, r: 5 },
  ];
  ok(C.pickRallyCity(cities, 'B').id === 'B', 'rally: stolica B wybrana, gdy istnieje');
  ok(C.pickRallyCity(cities, 'Z').id === 'A', 'rally: utrata stolicy -> pierwsze miasto (nie null)');
  ok(C.pickRallyCity(cities, null).id === 'A', 'rally: brak stolicy -> pierwsze miasto');
  ok(C.pickRallyCity([], 'A') === undefined, 'rally: brak miast -> undefined');

  // --- buildRallyCandidates: stolica pierwsza, reszta w promieniu, po odleglosci ---
  const cands = C.buildRallyCandidates(cities, cities[1], 6);
  ok(cands[0].q === 5 && cands[0].r === 0, 'candidates: stolica jest pierwsza');
  ok(cands.length === 3, 'candidates: A i C w promieniu 6 od B (dystans 5)');
  const far = C.buildRallyCandidates(cities, cities[1], 2);
  ok(far.length === 1, 'candidates: miasta poza promieniem wykluczone');

  // --- assignRallyTargets: limit na heks, pierwszy najblizszy stolicy ---
  const capHex = { q: 0, r: 0 };
  const sideHex = { q: 3, r: 0 };
  const four = [u('u1', 1, 0), u('u2', 0, 1), u('u3', 4, 0), u('u4', 4, 1)];
  const a4 = C.assignRallyTargets(four, [capHex, sideHex], 2, new Map());
  const toCap = a4.filter(a => a.targetQ === 0 && a.targetR === 0).map(a => a.unitId).sort();
  const toSide = a4.filter(a => a.targetQ === 3).map(a => a.unitId).sort();
  ok(toCap.length === 2 && toCap.includes('u1') && toCap.includes('u2'), 'assign: dwie najblizsze stolicy -> stolica');
  ok(toSide.length === 2 && toSide.includes('u3') && toSide.includes('u4'), 'assign: nadwyzka -> miasto zapasowe');
  const occFull = C.assignRallyTargets(four, [capHex, sideHex], 2, new Map([['0,0', 2]]));
  ok(occFull.filter(a => a.targetQ === 3).length === 2, 'assign: pelna stolica (occupancy) -> miasto zapasowe przyjmuje limit 2');
  ok(occFull.filter(a => a.targetQ === 0).length === 2, 'assign: nadwyzka ponad limit wraca do najbardziej preferowanego heksu');
  const occ = new Map([['0,0', 1]]);
  C.assignRallyTargets(four, [capHex, sideHex], 2, occ);
  ok(occ.size === 1 && occ.get('0,0') === 1, 'assign: nie mutuje wejsciowej occupancy');
  const shuffled = C.assignRallyTargets([four[3], four[1], four[0], four[2]], [capHex, sideHex], 2, new Map());
  ok(JSON.stringify(shuffled) === JSON.stringify(a4), 'assign: deterministyczny niezaleznie od kolejnosci wejscia');
  const atRally = C.assignRallyTargets([u('x', 0, 0)], [capHex], 12, new Map());
  ok(atRally[0].atRally === true, 'assign: jednostka juz na heksie zbiorki -> atRally');
  ok(C.assignRallyTargets([], [capHex], 12, new Map()).length === 0, 'assign: brak jednostek -> pusto');

  // --- obrona domu: kworum ---

  // --- liczba armii = liczba wojen ---
  ok(C.warArmyCount([]) === 1, 'wojna: brak wrogow -> min 1 armia');
  ok(C.warArmyCount([2, 2, 5]) === 2, 'wojna: dwa rozne wrogi -> 2 armie');
  ok(C.warArmyCount([1, 2, 3]) === 3, 'wojna: trzy wrogi -> 3 armie');

  // --- podzial na armie: zrownowazony, kompletny, bez duplikatow ---
  const six = [u('s1', 0, 0), u('s2', 0, 0), u('s3', 0, 0), u('s4', 0, 0), u('s5', 0, 0), u('s6', 0, 0)];
  const split2 = C.splitIntoWarArmies(six, 2, () => 1);
  ok(split2.length === 2 && split2[0].length === 3 && split2[1].length === 3, 'split: 6 jednostek / 2 armie = 3+3');
  const five3 = C.splitIntoWarArmies(six.slice(0, 5), 3, () => 1);
  ok(five3.length === 3 && five3.map(g => g.length).sort().join(',') === '1,2,2', 'split: 5 jednostek / 3 armie = 2,2,1');
  const strengths = { s1: 5, s2: 4, s3: 3, s4: 2, s5: 1, s6: 1 };
  const bySum = C.splitIntoWarArmies(six, 2, x => strengths[x.id]);
  const sums = bySum.map(g => g.reduce((t, x) => t + strengths[x.id], 0));
  ok(sums.length === 2 && sums[0] === sums[1], 'split: zrownowazenie sila (8 i 8)');
  const all = split2.flat().map(x => x.id).sort().join(',');
  ok(all === 's1,s2,s3,s4,s5,s6', 'split: kazda jednostka dokladnie raz');
  ok(C.splitIntoWarArmies(two(), 5, () => 1).length === 2, 'split: wiecej armii niz jednostek -> tyle, ile jednostek');
  ok(C.splitIntoWarArmies([], 2, () => 1).length === 0, 'split: pusto -> pusto');
  ok(C.splitIntoWarArmies(six, 1, () => 1)[0].length === 6, 'split: 1 wojna -> jedna armia z wszystkimi');

  function two() { return [u('p1', 0, 0), u('p2', 0, 0)]; }
  return out;
}

/** Wiring: ai.ts / main.ts uzywaja flagi i parametrow (zrodlo, nie wykonanie). */
function wiringChecks() {
  const res = { passed: 0, failed: 0, msgs: [] };
  const ok = (v, m) => { if (v) res.passed++; else { res.failed++; res.msgs.push(m); } };
  const ai = fs.readFileSync(path.join(GRA, 'src', 'game', 'ai.ts'), 'utf8');
  const main = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
  ok(ai.includes("from './army-consolidation'"), 'wiring: ai.ts importuje army-consolidation');
  ok(ai.includes('const consolidationPeace = isArmyConsolidationEnabled() && canConcentrateArmy(opts)'), 'wiring: stan pokoju za flaga');
  ok(ai.includes('if (consolidationPeace && !forcedWarAttack) {'), 'wiring: blok pokoju za stanem pokoju');
  ok(ai.includes('const standardConcentration = canConcentrateArmy(opts) && !consolidationPeace'), 'wiring: lokalna koncentracja wylaczona w pokoju (jeden punkt zbiorki)');
  ok(ai.includes('planWarArmiesByEnemy(planned, ctx, nav, warOpts, data)'), 'wiring: wojna dzielona na armie za flaga');
  ok(ai.includes('ARMY_CONSOLIDATION_HOME_GROUP_SIZE : 1'), 'wiring: obrona domu z kworum tylko za flaga (OFF -> 1)');
  ok(main.includes("capitalCityId: isArmyConsolidationEnabled() ? capitalCityIdForOwner(ownerId) : undefined"), 'wiring: main.ts podaje stolice tylko za flaga');
  ok(main.includes("atWarWithCiv: isArmyConsolidationEnabled() ? atWarWithCivFor(ownerId) : undefined"), 'wiring: main.ts podaje stan wojny tylko za flaga');
  ok(main.includes("from './game/army-consolidation'"), 'wiring: main.ts importuje flage');
  ok(ai.includes('capitalCityId?: string | null;'), 'wiring: AITurnOpts ma pole capitalCityId');
  return res;
}

/** Mutacje: kazda musi zepsuc co najmniej jeden test (czerwien). */
function mutationChecks(original) {
  const mutants = [
    ['usuniecie punktu zbiorki (stolica ignorowana)', 'if (capitalCityId) {', 'if (false as boolean) {'],
    ['brak limitu na heks', '< maxPerHex) {', '< Infinity) {'],
    ['brak podzialu na armie (zawsze 1 grupa)', 'const k = Math.min(Math.max(1, Math.floor(armyCount)), units.length);', 'const k = 1;'],
    ['brak zrownowazenia sila (round-robin zle)', 'groups[best]!.units.push(u);', 'groups[0]!.units.push(u);'],
    ['liczba armii bez minimum 1', 'return Math.max(1, new Set(enemyOwnerIds).size);', 'return new Set(enemyOwnerIds).size;'],
    ['brak miasta zapasowego', 'return [{ q: rally.q, r: rally.r }, ...others];', 'return [{ q: rally.q, r: rally.r }];'],
  ];
  const results = [];
  const tmpSrc = path.join(GRA, 'src', 'game', '.army-consolidation-mut.ts');
  TMP_FILES.push(tmpSrc);
  for (const [label, from, to] of mutants) {
    if (!original.includes(from)) {
      results.push({ label, killed: false, note: 'fragment nie znaleziony (mutacja nie zastosowana)' });
      continue;
    }
    fs.writeFileSync(tmpSrc, original.replace(from, to));
    const bundle = bundleEntry(
      'army-consolidation-mut',
      `export * from '../src/game/.army-consolidation-mut';\n`,
      path.join(GRA, 'tools'),
    );
    const r = runSuite(bundle);
    results.push({ label, killed: r.failed > 0, failed: r.failed });
  }
  return results;
}

function main() {
  const toolsDir = __dirname;
  const real = bundleEntry(
    'army-consolidation',
    `export * from '../src/game/army-consolidation';\n`,
    toolsDir,
  );
  const suite = runSuite(real);

  // Wiring w AI: decideAITurn i assignHomeDefenders z ai.ts (OFF = 1:1, ON groupSize 2).
  const aiBundle = bundleEntry(
    'army-consolidation-ai',
    `export { assignHomeDefenders } from '../src/game/ai';\n`,
    toolsDir,
  );
  const aiRes = { passed: 0, failed: 0, msgs: [] };
  const city = { id: 'c', q: 0, r: 0, ownerId: 1 };
  const mk = (id, q, r) => ({ id, q, r, ownerId: 1, typeId: 'Wojownik', category: 'miecznik', ruch: 2, ruchLeft: 2 });
  const threats = [{ id: 't1', q: 3, r: 0, ownerId: 0 }, { id: 't2', q: -3, r: 0, ownerId: 0 }];
  const mine = [mk('m1', 1, 0), mk('m2', 2, 0), mk('m3', -1, 0), mk('m4', -2, 0)];
  const oneEach = aiBundle.assignHomeDefenders(threats, mine, [city], 1);
  const pairs = aiBundle.assignHomeDefenders(threats, mine, [city], 2);
  const okA = (v, m) => { if (v) aiRes.passed++; else { aiRes.failed++; aiRes.msgs.push(m); } };
  okA(oneEach.size === 2, 'ai: groupSize 1 (OFF) -> 1 obronca na zagrozenie');
  okA(pairs.size === 4, 'ai: groupSize 2 (ON) -> 2 obroncow na zagrozenie');
  okA(new Set(pairs.values()).size === 2, 'ai: kworum przypisane do dwoch roznych zagrozen');

  const wiring = wiringChecks();
  const mut = mutationChecks(fs.readFileSync(SRC_MODULE, 'utf8'));

  // Mutacja, ktorej fragment nie istnieje, NIE jest zaliczona (dawniej przechodzila przez note).
  const killedAll = mut.every(m => m.killed);
  const lines = [];
  lines.push(`army-consolidation pure: ${suite.passed} passed / ${suite.failed} failed`);
  for (const m of suite.msgs) lines.push(`  FAIL: ${m}`);
  lines.push(`ai home-defense grouping: ${aiRes.passed} passed / ${aiRes.failed} failed`);
  for (const m of aiRes.msgs) lines.push(`  FAIL: ${m}`);
  lines.push(`wiring (ai.ts/main.ts): ${wiring.passed} passed / ${wiring.failed} failed`);
  for (const m of wiring.msgs) lines.push(`  FAIL: ${m}`);
  for (const m of mut) lines.push(`mutation "${m.label}": ${m.killed ? 'KILLED' : 'SURVIVED'}${m.note ? ' (' + m.note + ')' : ''}`);
  console.log(lines.join('\n'));

  cleanup();
  const bad = suite.failed + aiRes.failed + wiring.failed + (killedAll ? 0 : 1);
  process.exit(bad === 0 ? 0 : 1);
}

main();
