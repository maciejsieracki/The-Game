'use strict';
/**
 * ai-jednostki-tylko-zakup-test.cjs — R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1.
 *
 * Kontrakt (ECHO wlasciciela, `docs/decyzje/P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1.md`,
 * decyzja B z 2026-08-17 + doprecyzowanie z 2026-08-19):
 *   „Gracz, AI i miasta-panstwa maja pozyskiwac jednostki wylacznie przez zakup za
 *    Skarbiec/Pieniadze. Jednostki nie maja byc produkowane w tej samej kolejce Pracy
 *    co budynki."
 *
 * Test pilnuje jednego zdania: ZADNA jednostka AI (ani miasta-panstwa) nie powstaje
 * przez kolejke produkcji miasta oplacana Praca. Sekcja B mierzy to na REALNYM
 * `decideAITurn` przez N tur, nie na mocku decyzji.
 *
 * Uruchomienie z katalogu gra:  node tools/ai-jednostki-tylko-zakup-test.cjs
 */

const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));

const entry  = path.join(__dirname, '.ai-jednostki-tylko-zakup-entry.ts');
const bundle = path.join(__dirname, '.ai-jednostki-tylko-zakup-bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn, loadDifficultyParams, shouldAIPurchaseUnit, buildCandidateIds, pickExecutableCandidate } from '../src/game/ai';
export { enqueue, enqueueRecruitment, advanceProduction, advanceRecruitmentGated,
         sanitizeBuildQueue, insertAtFront, unitProductionItem, buildingProductionItem,
         frontItem } from '../src/game/production';
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-jednostki-tylko-zakup-test] bundling failed:', e.message || e);
  process.exit(1);
}
const M = require(bundle);

let passed = 0, failed = 0;
function assert(c, msg) { if (c) { passed++; } else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const J = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));
const buildings = J('buildings.json');
const units     = J('units.json');
const data = {
  buildings, units,
  tech: J('tech.json').technologie,
  aiParams: J('ai-params.json'),
  terrainYields: { terrain_types: [{ Teren: 'Równina', Zywnosc: 2, Praca: 1 }] },
};
const BUILDING_IDS = new Set(buildings.map(b => b.id));

// ---------------------------------------------------------------------------
// A. Silnik kolejki — bramka i migracja (realne funkcje production.ts)
// ---------------------------------------------------------------------------
console.log('\n--- A. kolejka Pracy vs jednostka (production.ts) ---');
{
  const bud  = { kind: 'budynek',   id: 'spichlerz', nazwa: 'Spichlerz', koszt: 20 };
  const jedn = { kind: 'jednostka', id: 'Wojownik',  nazwa: 'Wojownik',  koszt: 40 };

  // A1: bramka wejscia — enqueue NIGDY nie wpuszcza jednostki do kolejki Pracy.
  const afterEnqueue = M.enqueue({ kolejka: [], postep: 0 }, jedn);
  eq(afterEnqueue.kolejka.length, 0, 'A1: enqueue(jednostka) nie dodaje nic do kolejki Pracy');

  // A2: NIE-TAUTOLOGICZNOSC bramki main.ts — advanceProduction leje Prace we FRONT
  // bez sprawdzania `kind`. Gdyby jednostka mogla zostac na froncie (stan legacy),
  // realnie zbieralaby Prace ("Zebrana Praca X/Y" w panelu PRODUKCJA). To jest
  // dokladnie powod, dla ktorego main.ts musi czyscic kolejke PRZED tickiem Pracy.
  const leaky = M.advanceProduction({ kolejka: [jedn], postep: 0 }, 2);
  eq(Math.round(leaky.prod.postep), 2,
    'A2: advanceProduction NIE zna `kind` — jednostka na froncie zbiera Prace (dowod, ze guard w main.ts jest konieczny)');

  // A2b: druga brama wejscia -- `insertAtFront` (uzywana m.in. przez galaz „brak Manpower"
  // w applyProductionCompleted, main.ts) tez nie odtwarza jednostki w kolejce Pracy.
  const afterInsert = M.insertAtFront({ kolejka: [bud], postep: 5 }, jedn, jedn.koszt);
  eq(afterInsert.kolejka.length, 1, 'A2b: insertAtFront(jednostka) nie wstawia jednostki na front kolejki Pracy');
  eq(afterInsert.kolejka[0].id, 'spichlerz', 'A2c: front kolejki pozostaje budynkiem');

  // A3: migracja — jednostka znika z kolejki Pracy, postep wraca do puli wlasciciela.
  const legacy = { kolejka: [{ ...jedn }, bud], postep: 7, rekrutacja: [{ ...jedn }] };
  const fixed = M.sanitizeBuildQueue(legacy);
  eq(fixed.prod.kolejka.length, 1, 'A3a: po migracji w kolejce Pracy zostaje tylko budynek');
  eq(fixed.prod.kolejka[0].id, 'spichlerz', 'A3b: zostaje wlasnie budynek');
  eq(fixed.refundedPraca, 7, 'A3c: postep jednostki wraca jako Praca do puli wlasciciela');
  eq(fixed.prod.rekrutacja.length, 1, 'A3d: oplacona kolejka rekrutacji (Skarbiec) NIE jest ruszana');
}

// ---------------------------------------------------------------------------
// B. Pomiar realnej sciezki AI przez N tur
// ---------------------------------------------------------------------------
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      q, r, coords: { q, r }, teren: 'ląd', terenBazowy: 'Równina', nakladka: 0,
      rzeka: { obecna: false }, droga: { obecna: false },
      wioska: { istnieje: false }, wlasciciel: null,
    };
  }
  return { width: w, height: h, szerokoscQ: w, wysokoscR: h, hexes };
}
const map  = makeMap(24, 24);
const diff = M.loadDifficultyParams(data, 2);

/**
 * Odtwarza egzekucje main.ts (`cmd.type === 'build'`) na REALNYCH helperach:
 * buildCandidateIds + pickExecutableCandidate (ai.ts) wybieraja kandydata,
 * budynek idzie przez `enqueue` (kolejka Pracy), jednostka przez bramke
 * `shouldAIPurchaseUnit` + `enqueueRecruitment` (kolejka oplacona ze Skarbca).
 */
function simulate(opts0, cityDefs, ownerId, turns, startTreasury, income) {
  const cities = cityDefs.map(c => ({ ...c }));
  const prod  = new Map(cities.map(c => [c.id, { kolejka: [], postep: 0 }]));
  const built = new Map(cities.map(c => [c.id, []]));
  let treasury = startTreasury, uid = 0;
  const army = [];
  const s = { proposedUnit: 0, proposedBuilding: 0, unitsIntoPracaQueue: 0,
              purchasedForTreasury: 0, purchaseRefused: 0, goldSpent: 0, buildingsCompleted: 0 };

  for (let turn = 1; turn <= turns; turn++) {
    const opts = { ...opts0, poziomTrudnosci: 2, currentTurn: turn,
      cityBuildings: Object.fromEntries([...built.entries()]),
      canAfford: () => true, recruitStockDeficitScratch: new Set() };
    for (const cmd of (M.decideAITurn(ownerId, army, cities, map, data, opts, diff) || [])) {
      if (cmd.type !== 'build') continue;
      const p0 = prod.get(cmd.cityId);
      if (!p0) continue;
      const pick = M.pickExecutableCandidate(M.buildCandidateIds(cmd), {
        isAlreadyQueued: (id) => p0.kolejka.some(it => it.id === id),
        isBuildAllowed: () => true,
        resolveItem: (id) => BUILDING_IDS.has(id)
          ? M.buildingProductionItem(id, data, 1, [], 'niski', ownerId, 'normal')
          : M.unitProductionItem(id, data, [], 'niski', ownerId, 'normal'),
        canAfford: () => true,
      });
      if (pick === null || pick.alreadyQueued) continue;
      const item = pick.item;
      if (item.kind === 'budynek') {
        s.proposedBuilding++;
        prod.set(cmd.cityId, M.enqueue(p0, item));
      } else {
        s.proposedUnit++;
        // Czy jednostka w ogole moglaby trafic do kolejki Pracy? (musi byc 0)
        if (M.enqueue(p0, item).kolejka.length > p0.kolejka.length) s.unitsIntoPracaQueue++;
        if (M.shouldAIPurchaseUnit({ treasury, goldCost: item.koszt, hasManpower: true })) {
          treasury -= item.koszt; s.goldSpent += item.koszt; s.purchasedForTreasury++;
          prod.set(cmd.cityId, M.enqueueRecruitment(p0, { ...item }));
        } else { s.purchaseRefused++; }
      }
    }
    for (const c of cities) {
      const adv = M.advanceProduction(prod.get(c.id), 12);
      if (adv.completed) { built.get(c.id).push(adv.completed.id); s.buildingsCompleted++; }
      // jednostki schodza WYLACZNIE z kolejki rekrutacji (koszt juz oplacony Skarbcem)
      const rec = M.advanceRecruitmentGated(adv.prod, { population: c.population, manpower: 99 }, 1, 1, true);
      for (const r of rec.completed) army.push({ id: `u${++uid}`, ownerId, typeId: r.id,
        category: 'wojsko', q: c.q, r: c.r, ruch: 2, ruchLeft: 2 });
      prod.set(c.id, rec.prod);
    }
    treasury += income;
  }
  s.army = army.length;
  s.unitsLeftInPracaQueue = [...prod.values()]
    .reduce((n, p) => n + p.kolejka.filter(i => i.kind === 'jednostka').length, 0);
  return s;
}

const majorCities = [
  { id: 'cA', ownerId: 7, q: 5,  r: 5,  name: 'A', population: 4, manpower: 50 },
  { id: 'cB', ownerId: 7, q: 9,  r: 9,  name: 'B', population: 4, manpower: 50 },
  { id: 'cC', ownerId: 7, q: 13, r: 13, name: 'C', population: 4, manpower: 50 },
];
const mpCities = [{ id: 'mp1', ownerId: 9, q: 3, r: 16, name: 'MP', population: 3, manpower: 30 }];
const TURNS = 40;

console.log(`\n--- B. major AI (3 miasta, ${TURNS} tur, skarbiec zasilany) ---`);
{
  const s = simulate({ majorAiOwnerIds: [7] }, majorCities, 7, TURNS, 300, 30);
  console.log('   ', JSON.stringify(s));
  assert(s.proposedUnit > 0,
    'B1: AI faktycznie proponuje jednostki (inaczej test nic nie mierzy)');
  eq(s.unitsIntoPracaQueue, 0, 'B2: ZERO jednostek AI trafia do kolejki Pracy');
  eq(s.unitsLeftInPracaQueue, 0, 'B3: po N turach w zadnej kolejce Pracy nie stoi jednostka');
  eq(s.purchasedForTreasury, s.proposedUnit,
    'B4: kazda jednostka AI powstaje przez zakup za Skarbiec');
  assert(s.goldSpent > 0, 'B5: zakup faktycznie obciaza Skarbiec');
  assert(s.army > 0, 'B6: AI nadal realnie rekrutuje (nie zostaje bez wojska)');
  assert(s.buildingsCompleted > 0, 'B7: produkcja budynkow za Prace dziala niezaleznie');
}

console.log(`\n--- B'. miasto-panstwo (defensiveCopy, ${TURNS} tur) — ten sam zakaz ---`);
{
  const s = simulate({ defensiveCopy: true, cityStateDifficultyVsPlayer: 'normal' },
    mpCities, 9, TURNS, 300, 30);
  console.log('   ', JSON.stringify(s));
  eq(s.unitsIntoPracaQueue, 0, "B'1: miasto-panstwo tez nie kolejkuje jednostek za Prace");
  eq(s.unitsLeftInPracaQueue, 0, "B'2: kolejka Pracy MP wolna od jednostek po N turach");
  eq(s.purchasedForTreasury, s.proposedUnit, "B'3: MP pozyskuje jednostki wylacznie za Skarbiec");
}

// ---------------------------------------------------------------------------
// C. Kotwice zrodlowe — bariery w main.ts / cityPanel.ts
// ---------------------------------------------------------------------------
console.log('\n--- C. bariery w kodzie (kotwice zrodlowe) ---');
{
  const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
  const panelSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');

  // C2/C3 (kotwice po tekscie wlasnego hunku) usuniete w RUNDZIE 2 — zastapione
  // sekcja D, ktora wykonuje prawdziwy kod main.ts zamiast dopasowywac go regexem.
  assert(/item\.kind === 'jednostka'[\s\S]{0,900}?shouldAIPurchaseUnit/.test(mainSrc),
    'C4: egzekutor build AI kieruje jednostke do bramki zakupu za Skarbiec');
  assert(/shouldAIPurchaseUnit[\s\S]{0,700}?purchaseRecruitmentUnit\(/.test(mainSrc),
    'C5: po bramce zakupu AI wola wspolna z graczem purchaseRecruitmentUnit');
  // Parytet (rule_108): sciezka GRACZA bez zmian — nadal blokuje jednostke w kolejce Pracy.
  assert(/item\.kind === 'jednostka'[\s\S]{0,400}?return;/.test(panelSrc),
    'C6: PARYTET — panel miasta gracza nadal odrzuca jednostke w kolejce Pracy (bez zmian)');
}


// ---------------------------------------------------------------------------
// D. DOWOD BEHAWIORALNY zmienionej linii — prawdziwy kod main.ts, wykonany naprawde
//
// RUNDA 2, uwaga N1. Poprzednia wersja bramki sprawdzala zmieniony hunk regexem po
// jego wlasnym tekscie (C2/C3) — to jest tautologia, nie dowod. Tutaj wycinamy z
// biezacego main.ts PRAWDZIWA tresc `stripLegacyUnitsFromPracaQueue` (nie kopie,
// nie reimplementacje), wykonujemy ja przez `new Function` na PRAWDZIWEJ
// `sanitizeBuildQueue` i puszczamy przez PRAWDZIWY `advanceProduction`.
// Wzorzec kanoniczny w repo: `road-hook-mainguard-test.cjs` §2/§3.
//
// Scenariusz = dokladnie to, co niesie STARY ZAPIS: jednostka stoi na froncie kolejki
// Pracy i ma juz zebrany postep. Sprawdzamy trzy rzeczy z kryterium rundy 2:
//   (a) jednostka znika z kolejki,
//   (b) zebrany postep wraca do puli Pracy wlasciciela,
//   (c) Praca NIE jest w nia dalej lana (nie konczy sie jako jednostka za Prace).
// Plus §D-MUT: mutacje zrodla musza zaczerwienic DOKLADNIE te asercje.
// ---------------------------------------------------------------------------
console.log('\n--- D. dowod behawioralny guardu z main.ts (kod wycinany i wykonywany) ---');

const MAIN_TS = path.join(GRA, 'src', 'main.ts');
const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');
const PROD_TS = path.join(GRA, 'src', 'game', 'production.ts');
const prodTsSrc = fs.readFileSync(PROD_TS, 'utf8');

/** Wycina cialo funkcji po SYGNATURZE (nigdy po numerze linii — te sie przesuwaja). */
function extractFunction(source, signature) {
  const start = source.indexOf(signature);
  if (start < 0) return null;
  const bodyStart = source.indexOf('{', start);
  if (bodyStart < 0) return null;
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  return null;
}

const SYG_GUARD = 'function stripLegacyUnitsFromPracaQueue(';
const guardSrcTs = extractFunction(mainTsSrc, SYG_GUARD);
assert(!!guardSrcTs, 'D0: guard `stripLegacyUnitsFromPracaQueue` jest obecny w main.ts');

/** Kompiluje wyciety TypeScript i zwraca ZYWA funkcje + podgladana pule Pracy. */
function instantiateGuard(tsText) {
  const js = esbuild.transformSync(tsText, { loader: 'ts', target: 'node18' }).code;
  const pool = new Map();
  const warns = [];
  const factory = new Function(
    'sanitizeBuildQueue', 'ownerPracaPool', 'setOwnerPracaPool', 'console',
    `${js}\nreturn stripLegacyUnitsFromPracaQueue;`,
  );
  const guard = factory(
    M.sanitizeBuildQueue,
    (id) => pool.get(id) ?? 0,
    (id, v) => pool.set(id, v),
    { warn: (m) => warns.push(String(m)) },
  );
  return { guard, pool, warns };
}

const UNIT = { kind: 'jednostka', id: 'Wojownik',  nazwa: 'Wojownik',  koszt: 40 };
const BUD  = { kind: 'budynek',   id: 'spichlerz', nazwa: 'Spichlerz', koszt: 20 };
/** Stan ze starego zapisu: Wojownik na froncie kolejki Pracy z 7 zebranej Pracy. */
const legacySave = () => ({
  kolejka: [{ ...UNIT }, { ...BUD }],
  postep: 7,
  rekrutacja: [{ ...UNIT }],
});

/** N tur REALNEGO ticku Pracy — `advanceProduction` z production.ts, bez atrapy. */
function pracaTicks(prod, turns, pracaPerTurn) {
  const done = [];
  let p = prod;
  for (let i = 0; i < turns; i++) {
    const r = M.advanceProduction(p, pracaPerTurn);
    p = r.prod;
    if (r.completed) done.push(r.completed);
  }
  return { prod: p, done };
}

/** Uruchamia scenariusz legacy na podanym wariancie zrodla guardu; zwraca same fakty. */
function behavior(tsText, ownerId) {
  const { guard, pool, warns } = instantiateGuard(tsText);
  const after = guard(ownerId, legacySave(), 'Miasto');
  const run = pracaTicks(after, 3, 12);
  return {
    unitGone:            after.kolejka.every(i => i.kind !== 'jednostka'),
    frontIsBuilding:     !!after.kolejka[0] && after.kolejka[0].id === 'spichlerz',
    refundedToOwner:     (pool.get(ownerId) ?? 0) === 7,
    recruitmentUntouched: Array.isArray(after.rekrutacja) && after.rekrutacja.length === 1,
    noUnitPaidByPraca:   run.done.every(i => i.kind !== 'jednostka'),
    buildingStillBuilt:  run.done.some(i => i.id === 'spichlerz'),
    warned:              warns.length === 1,
  };
}

if (guardSrcTs) {
  // --- D1-D5: zachowanie prawdziwego kodu ------------------------------------
  const b = behavior(guardSrcTs, 7);
  console.log('    PO guardzie (owner 7):', JSON.stringify(b));
  assert(b.unitGone,             'D1a: (a) jednostka znika z kolejki Pracy');
  assert(b.frontIsBuilding,      'D1b: na froncie zostaje budynek, kolejka dziala dalej');
  assert(b.refundedToOwner,      'D2: (b) zebrane 7 Pracy wraca do puli WLASCICIELA');
  assert(b.recruitmentUntouched, 'D3: oplacona ze Skarbca kolejka rekrutacji NIE jest ruszana');
  assert(b.noUnitPaidByPraca,    'D4: (c) po guardzie ZADNA jednostka nie konczy sie za Prace');
  assert(b.buildingStillBuilt,   'D5: budynek nadal powstaje za Prace (guard nie zabija produkcji)');
  assert(b.warned,               'D6: usuniecie legacy zostawia slad w logu (nie cicha korekta)');

  // --- D7: gdyby guardu nie bylo, wyciek jest REALNY (asercja D4 cos mierzy) --
  const leak = pracaTicks(legacySave(), 3, 12);
  assert(leak.done.some(i => i.kind === 'jednostka'),
    'D7: BEZ guardu ten sam stan konczy Wojownika ZA PRACE — wyciek istnieje naprawde');

  // --- D8: parytet gracz / AI / miasto-panstwo (rule_108) --------------------
  const bGracz = behavior(guardSrcTs, 0);
  const bMP    = behavior(guardSrcTs, 9);
  assert(JSON.stringify(bGracz) === JSON.stringify(b) && JSON.stringify(bMP) === JSON.stringify(b),
    'D8: PARYTET — identyczne zachowanie dla gracza (0), AI (7) i miasta-panstwa (9)');

  // --- D-MUT: mutacje zrodla musza zaczerwienic DOKLADNIE te asercje ---------
  const mutNoSanitize = guardSrcTs.replace(
    'const migrated = sanitizeBuildQueue(prod);', 'const migrated = { prod, refundedPraca: 0 };');
  assert(mutNoSanitize !== guardSrcTs, 'D-MUT1a: mutacja "bez sanitizeBuildQueue" faktycznie podmienila zrodlo');
  const m1 = behavior(mutNoSanitize, 7);
  assert(!m1.unitGone && !m1.refundedToOwner && !m1.noUnitPaidByPraca,
    'D-MUT1b: bez `sanitizeBuildQueue` czerwienieja (a), (b) i (c)');

  const mutNoRefund = guardSrcTs.replace(
    /if \(migrated\.refundedPraca > 0\) \{[\s\S]*?\n      \}/,
    'if (false) { /* mutant: zwrot Pracy wyciety */ }');
  assert(mutNoRefund !== guardSrcTs, 'D-MUT2a: mutacja "bez zwrotu Pracy" faktycznie podmienila zrodlo');
  const m2 = behavior(mutNoRefund, 7);
  assert(!m2.refundedToOwner && m2.unitGone && m2.noUnitPaidByPraca,
    'D-MUT2b: wyciecie zwrotu czerwieni DOKLADNIE (b), (a) i (c) zostaja zielone');

  const mutAlwaysSkip = guardSrcTs.replace(
    "if (!prod.kolejka.some(it => it.kind === 'jednostka')) return prod;", 'return prod;');
  assert(mutAlwaysSkip !== guardSrcTs, 'D-MUT3a: mutacja "guard nic nie robi" faktycznie podmienila zrodlo');
  const m3 = behavior(mutAlwaysSkip, 7);
  assert(!m3.unitGone && !m3.refundedToOwner && !m3.noUnitPaidByPraca,
    'D-MUT3b: guard-no-op czerwieni (a), (b) i (c)');

  // --- D9: no-op na czystej kolejce (brak kosztu na sciezce goracej) ---------
  const { guard: g4, pool: p4 } = instantiateGuard(guardSrcTs);
  const clean = { kolejka: [{ ...BUD }], postep: 3 };
  assert(g4(7, clean, 'Miasto') === clean && p4.size === 0,
    'D9: czysta kolejka wraca TYM SAMYM obiektem, pula Pracy nietknieta');

} else {
  // Guard usuniety ze zrodla — trzy kryteria rundy 2 sa wtedy niespelnione WPROST,
  // zeby czerwien byla proporcjonalna do szkody, nie sprowadzona do jednej kotwicy.
  assert(false, 'D1a: (a) jednostka znika z kolejki Pracy — brak guardu w main.ts');
  assert(false, 'D2: (b) zebrany postep wraca do puli Pracy — brak guardu w main.ts');
  assert(false, 'D4: (c) Praca nie jest dalej lana w jednostke — brak guardu w main.ts');
}

// --- D10-D12: wpiecie guardu w tick — relacja, nie tekst hunku --------------
const idxCall = mainTsSrc.indexOf('stripLegacyUnitsFromPracaQueue(city.ownerId, prod0');
const idxAdvance = mainTsSrc.indexOf('advanceProduction(prod0, pracaBudynki)');
assert(idxCall > 0 && idxAdvance > 0 && idxCall < idxAdvance,
  'D10: guard jest wolany PRZED `advanceProduction` w ticku per-miasto');
assert((mainTsSrc.match(/advanceProduction\(/g) || []).length === 1,
  'D11: main.ts ma DOKLADNIE JEDEN punkt zuzycia Pracy — nowy, niebroniony by tu uciekl');
const idxAlloc = prodTsSrc.indexOf('export function allocateEmpirePracaToBuildings(');
assert(idxAlloc > 0 && /front\.kind !== 'budynek'/.test(prodTsSrc.slice(idxAlloc, idxAlloc + 1200)),
  'D12: drugi odbiorca Pracy (`allocateEmpirePracaToBuildings`) NADAL ma wlasna bramke `kind`');

console.log(`\nai-jednostki-tylko-zakup-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch { /* ignore */ }
process.exit(failed === 0 ? 0 : 1);
