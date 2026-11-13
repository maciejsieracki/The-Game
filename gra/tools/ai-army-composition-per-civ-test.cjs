'use strict';
/**
 * ai-army-composition-per-civ-test.cjs — R-WEB-AI-ARMY-COMPOSITION-PER-CIV-Q1.
 *
 * Kontrakt (tabela zatwierdzona przez właściciela 2026-11-09): AI każdej z 15 cywilizacji
 * rekrutuje wg docelowego składu wręcz / dystans / konnica+rydwany (rydwany liczone z konnicą),
 * min. 50% wręcz; brak dostępu do klasy NIE blokuje rekrutacji (udział przechodzi na wręcz);
 * Inkowie: 0 konnicy. Dotyczy wyłącznie AI (chooseCityProduction / decideAITurn).
 *
 * Uruchomienie z katalogu gra:  node tools/ai-army-composition-per-civ-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));

const entry = path.join(__dirname, '.ai-army-composition-entry.ts');
const bundle = path.join(__dirname, '.ai-army-composition-bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn, loadDifficultyParams, buildCandidateIds, pickExecutableCandidate } from '../src/game/ai';
export { availableProduction, unitProductionItem, buildingProductionItem, unitNacjaForCivKey } from '../src/game/production';
export * from '../src/game/ai-army-composition';
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-army-composition-per-civ-test] bundling failed:', e.message || e);
  process.exit(1);
}
const M = require(bundle);

let passed = 0, failed = 0;
function assert(c, msg) { if (c) { passed++; } else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const J = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));
const buildings = J('buildings.json');
const units = J('units.json');
const techNames = J('tech.json').technologie.map(t => t.Technologia);
const data = {
  buildings, units,
  tech: J('tech.json').technologie,
  aiParams: J('ai-params.json'),
  terrainYields: { terrain_types: [{ Teren: 'Równina', Zywnosc: 2, Praca: 1 }] },
};
const defsByName = new Map(units.map(u => [u.Jednostka, u]));
const readParam = (key) => {
  const e = data.aiParams[key];
  return e && typeof e.wartosc === 'number' ? e.wartosc : undefined;
};

// Tabela zatwierdzona (wręcz / dystans / konnica+rydwany, %).
const TABLE = {
  rzymianie: [75, 15, 10], grecy: [70, 20, 10], chinczycy: [60, 20, 20], inkowie: [65, 35, 0],
  zulusi: [60, 25, 15], egipt: [55, 35, 10], sumer: [50, 35, 15], celtowie: [65, 10, 25],
  germanie: [80, 15, 5], harappa: [55, 35, 10], hetyci: [60, 15, 25], slowianie: [70, 25, 5],
  babilonia: [50, 35, 15], asyria: [50, 30, 20], fenicjanie: [55, 35, 10],
};
const CIVS = Object.keys(TABLE);

// ---------------------------------------------------------------------------
console.log('\n--- A. dane: cel składu dla 15 cywilizacji ---');
{
  const civsJson = J('civs.json').cywilizacje.map(c => c.ikonaId);
  eq(CIVS.length, 15, 'A0: tabela ma 15 cywilizacji');
  for (const k of civsJson) assert(CIVS.includes(k), `A0b: cywilizacja ${k} z civs.json ma wpis w tabeli testu`);
  for (const civ of CIVS) {
    const t = M.loadArmyCompositionTarget(civ, readParam);
    assert(t !== null, `A1: ${civ} ma poprawny cel składu w ai-params.json`);
    if (!t) continue;
    eq(`${t.wrecz}/${t.dystans}/${t.konnica}`, TABLE[civ].join('/'), `A2: ${civ} zgodny z tabelą właściciela`);
    eq(t.wrecz + t.dystans + t.konnica, 100, `A3: ${civ} suma 100`);
    assert(t.wrecz >= 50, `A4: ${civ} wręcz >= 50%`);
  }
  eq(M.loadArmyCompositionTarget('inkowie', readParam).konnica, 0, 'A5: Inkowie 0 konnicy');
  // walidacja: niepoprawne cele są odrzucane
  eq(M.isValidArmyCompositionTarget({ wrecz: 49, dystans: 51, konnica: 0 }), false, 'A6: wręcz 49 -> niepoprawny');
  eq(M.isValidArmyCompositionTarget({ wrecz: 60, dystans: 30, konnica: 20 }), false, 'A7: suma 110 -> niepoprawny');
  eq(M.isValidArmyCompositionTarget({ wrecz: 50, dystans: 50, konnica: 0 }), true, 'A8: 50/50/0 poprawny');
  eq(M.loadArmyCompositionTarget('nieistnieje', readParam), null, 'A9: brak wpisu -> null (legacy)');
  eq(M.loadArmyCompositionTarget(undefined, readParam), null, 'A10: brak civ -> null (legacy)');
  eq(M.loadArmyCompositionTarget('grecy', k => (k.endsWith('_wrecz') ? 40 : k.endsWith('_dystans') ? 60 : 0)), null,
    'A11: wręcz 40 w danych -> cel ignorowany');
}

// ---------------------------------------------------------------------------
console.log('\n--- B. klasyfikacja jednostek ---');
{
  const cls = (n) => M.armyClassOfUnit(defsByName.get(n));
  eq(cls('Wojownik'), 'wrecz', 'B1: Wojownik');
  eq(cls('Włócznik'), 'wrecz', 'B2: Włócznik');
  eq(cls('Falanga'), 'wrecz', 'B3: Falanga (Falangite)');
  eq(cls('Wojownik z maczugą (Chaska)'), 'wrecz', 'B4: Offensive');
  eq(cls('Łucznik'), 'dystans', 'B5: Łucznik');
  eq(cls('Procarz'), 'dystans', 'B6: Procarz (Slinger)');
  eq(cls('Konnica'), 'konnica', 'B7: Konnica');
  eq(cls('Rydwan (woły)'), 'konnica', 'B8: rydwany liczone z konnicą');
  eq(cls('Taran'), null, 'B9: machina oblężnicza poza procentami');
  eq(cls('Zwiadowca'), null, 'B10: zwiadowca poza procentami');
  eq(cls('Galera'), null, 'B11: okręt poza procentami');
}

// ---------------------------------------------------------------------------
console.log('\n--- C. wybór klasy i jednostki (czyste funkcje) ---');
{
  const T = { wrecz: 60, dystans: 20, konnica: 20 };
  const all = { wrecz: true, dystans: true, konnica: true };
  eq(M.orderArmyClassesByDeficit(T, { wrecz: 0, dystans: 0, konnica: 0 }, all)[0], 'wrecz', 'C1: pusta armia -> wręcz najpierw (największy deficyt)');
  eq(M.orderArmyClassesByDeficit(T, { wrecz: 6, dystans: 0, konnica: 0 }, all)[0], 'dystans', 'C2: brak dystansu -> dystans (remis wg kolejności klas)');
  eq(M.orderArmyClassesByDeficit(T, { wrecz: 6, dystans: 2, konnica: 0 }, all)[0], 'konnica', 'C3: niedoreprezentowana konnica -> konnica');
  const noMount = M.orderArmyClassesByDeficit(T, { wrecz: 6, dystans: 2, konnica: 0 }, { wrecz: true, dystans: true, konnica: false });
  assert(!noMount.includes('konnica'), 'C4: niedostępna konnica nie jest w kolejce');
  eq(noMount[0], 'wrecz', 'C5: udział niedostępnej konnicy przechodzi na wręcz');
  const inca = M.orderArmyClassesByDeficit({ wrecz: 65, dystans: 35, konnica: 0 }, { wrecz: 0, dystans: 0, konnica: 0 }, all);
  assert(!inca.includes('konnica'), 'C6: cel 0 -> konnica nigdy wybrana');

  // najlepsza jednostka w klasie: specjalna cywilizacji przed generyczną tej samej epoki
  const allowedZulu = units.filter(u => ['Włócznik', 'Impi', 'Wojownik z mieczem i tarczą'].includes(u.Jednostka));
  eq(M.bestUnitForArmyClass('wrecz', allowedZulu).Jednostka, 'Impi', 'C7: preferuj jednostkę specjalną cywilizacji (Impi) nad generyczną');
  const allowedEra = units.filter(u => ['Wojownik', 'Włócznik'].includes(u.Jednostka));
  eq(M.bestUnitForArmyClass('wrecz', allowedEra).Jednostka, 'Włócznik', 'C8: nowsza epoka wygrywa');
  const withSuper = units.filter(u => ['Wojownik', 'Królewska Gwardia'].includes(u.Jednostka));
  eq(M.bestUnitForArmyClass('wrecz', withSuper).Jednostka, 'Wojownik', 'C9: Super-jednostka pomijana (limit 1, osobna logika)');
  eq(M.bestUnitForArmyClass('konnica', units.filter(u => u.Jednostka === 'Wojownik')), null, 'C10: brak jednostki klasy -> null');
  // łańcuch: [klasa z deficytem, wręcz, reszta]
  const chain = M.planCompositionRecruitChain(T, { wrecz: 6, dystans: 2, konnica: 0 },
    units.filter(u => ['Wojownik', 'Łucznik', 'Rydwan (woły)'].includes(u.Jednostka)));
  eq(chain[0], 'Rydwan (woły)', 'C11: łańcuch zaczyna od klasy z największym deficytem');
  eq(chain[1], 'Wojownik', 'C12: drugie ogniwo = wręcz (brak surowca/dostępu -> wręcz)');
}

// ---------------------------------------------------------------------------
// D. Symulacja na REALNYM decideAITurn: AI z N miastami rekrutuje, kolejki rekrutacji
//    liczone przez queuedRecruitUnitIds (jak w main.ts).
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
const map = makeMap(24, 24);
const ALL_BUILDINGS = buildings.map(b => b.id);

/**
 * @param civ        klucz cywilizacji (ikonaId)
 * @param epoch      numer epoki (1 Kamień, 2 Brąz, 3 Żelazo)
 * @param recruits   ile rekrutacji zasymulować
 * @param blocked    predykat typu jednostki niedostępnej (isProductionAllowed=false)
 * @param noStock    predykat typu jednostki bez pokrycia surowcowego (canAfford=false)
 * @param level      poziom trudności 1/2/3
 */
function simulate(civ, epoch, recruits, { blocked = () => false, noStock = () => false, level = 2 } = {}) {
  const ownerId = 7;
  const diff = M.loadDifficultyParams(data, level);
  const cities = [
    { id: 'cA', ownerId, q: 5, r: 5, name: 'A', population: 8, manpower: 99 },
    { id: 'cB', ownerId, q: 9, r: 9, name: 'B', population: 8, manpower: 99 },
    { id: 'cC', ownerId, q: 13, r: 13, name: 'C', population: 8, manpower: 99 },
  ];
  const scouts = [1, 2].map(i => ({ id: `s${i}`, ownerId, typeId: 'Zwiadowca', category: 'zwiadowca', q: 2, r: 2 + i, ruch: 3, ruchLeft: 3 }));
  const queued = [];
  const counts = { wrecz: 0, dystans: 0, konnica: 0 };
  const names = { wrecz: {}, dystans: {}, konnica: {} };
  const nacja = M.unitNacjaForCivKey(civ);
  const allowedIds = (city) => {
    const items = M.availableProduction(city, data, techNames, {
      epoch, builtBuildingIds: ALL_BUILDINGS, productionQueue: [], civKey: civ, civUnitNacja: nacja,
      aliveUnitTypeNames: new Set(), ownerId, hasKopalniaNaZlozuZelaza: true,
      empireActiveResourceLabels: ['Drewno', 'Brąz', 'Żelazo', 'Kamień', 'Ruda', 'Koń'],
      empireResourceStock: { drewno: 999, braz: 999, zelazo: 999, kamien: 999 },
    });
    const ids = new Set();
    for (const it of items) { ids.add(it.id); if (it.nazwa) ids.add(it.nazwa); }
    return ids;
  };
  const allowedCache = new Map();
  const isAllowed = (cityId, itemId) => {
    const def = defsByName.get(itemId);
    if (def && blocked(def)) return false;
    if (!allowedCache.has(cityId)) allowedCache.set(cityId, allowedIds(cities.find(c => c.id === cityId)));
    return allowedCache.get(cityId).has(itemId);
  };
  let guard = 0;
  while (queued.length < recruits && guard++ < recruits * 4) {
    const opts = {
      majorAiOwnerIds: [ownerId], civType: civ, poziomTrudnosci: level, currentTurn: 100 + guard,
      cityBuildings: Object.fromEntries(cities.map(c => [c.id, ALL_BUILDINGS])),
      canAfford: (_cid, id) => { const d = defsByName.get(id); return !(d && noStock(d)); },
      isProductionAllowed: isAllowed,
      queuedRecruitUnitIds: queued.slice(), recruitStockDeficitScratch: new Set(),
    };
    allowedCache.clear();
    const cmds = M.decideAITurn(ownerId, scouts, cities, map, data, opts, diff) || [];
    for (const cmd of cmds) {
      if (cmd.type !== 'build') continue;
      const pick = M.pickExecutableCandidate(M.buildCandidateIds(cmd), {
        isAlreadyQueued: () => false,
        isBuildAllowed: (id) => isAllowed(cmd.cityId, id),
        resolveItem: (id) => (defsByName.has(id) ? { kind: 'jednostka', id } : null),
        canAfford: (it) => { const d = defsByName.get(it.id); return !(d && noStock(d)); },
      });
      if (pick === null || pick.alreadyQueued) continue;
      const cls = M.armyClassOfUnit(defsByName.get(pick.id));
      if (cls === null) continue;
      queued.push(pick.id);
      counts[cls]++;
      names[cls][pick.id] = (names[cls][pick.id] || 0) + 1;
    }
  }
  const total = counts.wrecz + counts.dystans + counts.konnica;
  return { counts, names, total, pct: { wrecz: 100 * counts.wrecz / total, dystans: 100 * counts.dystans / total, konnica: 100 * counts.konnica / total } };
}

const N = 60;
const EPOCHS = [[1, 'Kamień'], [2, 'Brąz'], [3, 'Żelazo']];
console.log(`\n--- D. symulacja ${N} rekrutacji na realnym decideAITurn: 15 civ x 3 epoki (±10 pp od tabeli) ---`);
const ENTRY_EPOCH = Object.fromEntries(J('civs.json').cywilizacje.map(c => [c.ikonaId, { kamien: 1, braz: 2, zelazo: 3 }[c.epokaWejscia] || 1]));
for (const civ of CIVS) {
  for (const [ep, epName] of EPOCHS) {
    if (ep < ENTRY_EPOCH[civ]) continue; // cywilizacja nie istnieje w grze przed epoką wejścia (civs.json: epokaWejscia)
    const r = simulate(civ, ep, N);
    const [w, d, k] = TABLE[civ];
    const tag = `D: ${civ}/${epName}`;
    assert(r.total >= N, `${tag}: zasymulowano ${N} rekrutacji (got ${r.total})`);
    // Rydwan (woły) dostępny od Kamienia; epoka 1 ma tylko generyczne jednostki -> pełne trzy klasy.
    assert(Math.abs(r.pct.wrecz - w) <= 10, `${tag}: wręcz ${r.pct.wrecz.toFixed(1)}% vs ${w}% (±10)`);
    assert(Math.abs(r.pct.dystans - d) <= 10, `${tag}: dystans ${r.pct.dystans.toFixed(1)}% vs ${d}% (±10)`);
    assert(Math.abs(r.pct.konnica - k) <= 10, `${tag}: konnica ${r.pct.konnica.toFixed(1)}% vs ${k}% (±10)`);
    assert(r.pct.wrecz >= 50, `${tag}: min 50% wręcz (got ${r.pct.wrecz.toFixed(1)}%)`);
    if (civ === 'inkowie') eq(r.counts.konnica, 0, `${tag}: Inkowie 0 konnicy`);
    if (ep === 3) console.log(`    ${civ.padEnd(10)} ${epName}: ${r.pct.wrecz.toFixed(0)}/${r.pct.dystans.toFixed(0)}/${r.pct.konnica.toFixed(0)}  ${JSON.stringify(r.names)}`);
  }
}

console.log('\n--- E. brak dostępu NIE blokuje rekrutacji: udział przechodzi na wręcz ---');
for (const civ of ['celtowie', 'hetyci', 'chinczycy']) {
  // E1: brak konia/rydwanu w ogóle (tech/epoka/limit -> isProductionAllowed=false)
  const a = simulate(civ, 3, 40, { blocked: (d) => M.armyClassOfUnit(d) === 'konnica' });
  eq(a.counts.konnica, 0, `E1 ${civ}: brak dostępu do konnicy -> 0 konnicy`);
  assert(a.total >= 40, `E1 ${civ}: rekrutacja trwa mimo braku konnicy (${a.total})`);
  const target = TABLE[civ];
  assert(a.pct.wrecz >= target[0] + target[2] - 10, `E1 ${civ}: udział konnicy przeszedł na wręcz (${a.pct.wrecz.toFixed(1)}%)`);
  assert(Math.abs(a.pct.dystans - target[1]) <= 10, `E1 ${civ}: dystans nadal wg tabeli (${a.pct.dystans.toFixed(1)}%)`);
  // E2: jednostki konne dostępne, ale brak surowca (canAfford=false) -> wręcz
  const b = simulate(civ, 3, 40, { noStock: (d) => M.armyClassOfUnit(d) === 'konnica' });
  eq(b.counts.konnica, 0, `E2 ${civ}: brak surowca na konnicę -> 0 konnicy`);
  assert(b.total >= 40, `E2 ${civ}: rekrutacja trwa mimo braku surowca (${b.total})`);
  assert(b.pct.wrecz >= target[0] + target[2] - 10, `E2 ${civ}: brak surowca -> udział na wręcz (${b.pct.wrecz.toFixed(1)}%)`);
}
{
  // E3: brak dostępu do dystansu i konnicy -> same jednostki wręcz
  const c = simulate('egipt', 3, 30, { blocked: (d) => M.armyClassOfUnit(d) !== 'wrecz' });
  eq(c.counts.dystans + c.counts.konnica, 0, 'E3: tylko wręcz dostępne -> 100% wręcz');
  assert(c.total >= 30, 'E3: rekrutacja trwa');
}

{
  // E4: cywilizacja bez żadnej jednostki wręcz w danej epoce (Celtowie przed epoką wejścia) nadal rekrutuje
  const d = simulate('celtowie', 1, 20);
  assert(d.total >= 20, 'E4: brak jakiejkolwiek jednostki wręcz nie wstrzymuje rekrutacji (' + d.total + ')');
}

console.log('\n--- F. wszystkie poziomy trudności (Łatwy/Normalny/Trudny) ---');
for (const level of [1, 2, 3]) {
  for (const civ of ['rzymianie', 'asyria', 'inkowie']) {
    const r = simulate(civ, 2, 40, { level });
    const [w, d, k] = TABLE[civ];
    const tag = `F: L${level}/${civ}`;
    assert(Math.abs(r.pct.wrecz - w) <= 10 && Math.abs(r.pct.dystans - d) <= 10 && Math.abs(r.pct.konnica - k) <= 10,
      `${tag}: ${r.pct.wrecz.toFixed(0)}/${r.pct.dystans.toFixed(0)}/${r.pct.konnica.toFixed(0)} vs ${w}/${d}/${k}`);
    assert(r.pct.wrecz >= 50, `${tag}: min 50% wręcz`);
  }
}

console.log('\n--- G. nie dotyczy gracza ani miast-państw; legacy bez celu ---');
{
  // G1: brak civType -> zachowanie legacy (Wojownik/Łucznik, bez konnicy)
  const ownerId = 7;
  const diff = M.loadDifficultyParams(data, 2);
  const cities = [{ id: 'cA', ownerId, q: 5, r: 5, name: 'A', population: 8, manpower: 99 }];
  const mk = (extra) => ({
    majorAiOwnerIds: [ownerId], poziomTrudnosci: 2, currentTurn: 150,
    cityBuildings: { cA: ALL_BUILDINGS }, canAfford: () => true,
    isProductionAllowed: (_c, id) => ['Wojownik', 'Łucznik', 'Rydwan (woły)', 'Zwiadowca'].includes(id),
    recruitStockDeficitScratch: new Set(), ...extra,
  });
  const scouts = [1, 2].map(i => ({ id: `s${i}`, ownerId, typeId: 'Zwiadowca', category: 'zwiadowca', q: 2, r: 2 + i, ruch: 3, ruchLeft: 3 }));
  const legacy = (M.decideAITurn(ownerId, scouts, cities, map, data, mk({}), diff) || []).filter(c => c.type === 'build');
  assert(legacy.length > 0 && ['Wojownik', 'Łucznik'].includes(legacy[0].buildingId),
    `G1: bez civType zostaje legacy (Wojownik/Łucznik), got ${legacy[0] && legacy[0].buildingId}`);
  // G2: miasto-państwo (defensiveCopy) nie podlega programowi
  const cs = (M.decideAITurn(ownerId, scouts, cities, map, data, mk({ defensiveCopy: true, civType: 'celtowie', cityStateDifficultyVsPlayer: 'normal' }), diff) || []).filter(c => c.type === 'build');
  assert(cs.every(c => c.buildingId !== 'Rydwan (woły)'), 'G2: miasto-państwo nie dostaje składu per cywilizacja');
}

console.log('\n--- H. kotwice źródłowe (main.ts podaje kolejki rekrutacji) ---');
{
  const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
  assert(/queuedRecruitUnitIds:\s*cities/.test(mainSrc), 'H1: main.ts przekazuje queuedRecruitUnitIds do decideAITurn');
  const aiSrc = fs.readFileSync(path.join(GRA, 'src', 'game', 'ai.ts'), 'utf8');
  assert(/applyArmyCompositionProgram\(available/.test(aiSrc), 'H2: chooseCityProduction woła program składu armii');
  assert(/isMajorAiOwner\(opts\)\)\s*\{\s*available = applyArmyCompositionProgram/.test(aiSrc), 'H3: program tylko dla major AI (nie MP, nie gracz)');
}

try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (_) { /* bundle ignorowany przez .gitignore */ }
console.log(`\nai-army-composition-per-civ-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
