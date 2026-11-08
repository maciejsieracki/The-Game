'use strict';
/**
 * spichlerz-widocznosc-test.cjs — katalog budynków + magazyn państwa.
 *
 * P-BRAMKA-SPICHLERZ-WIDOCZNOSC-CZERWONA (2026-08-09): ta wersja zastępuje test z FALA 46
 * (2026-07-28, commit 4504783a) — od tamtej daty DWIE kolejne, udokumentowane decyzje
 * zmieniły mechanikę, którą stary test asercjonował:
 *
 *   1) DOSTEP-SUROWCE-Q1 (Maciej 2026-07-29, commit daacd43a) — budynki z wpisem w
 *      `DEPOSIT_LINKED_BUILDING_LABELS` (building-resource-gate.ts: garncarnia/cegielnia →
 *      Glina, stolarnia → Drewno, kamieniarski → Kamień, kuznia/odlewnia_brazu → Ruda,
 *      mennica → Złoto) WYMAGAJĄ zapasu tej etykiety w magazynie państwa (empireStock > 0),
 *      i to blokuje ZARÓWNO listę (`buildableProduction`/`availableProduction`), JAK I katalog
 *      (`eraBuildingCatalog`) — patrz `buildingResourceGateMet()`, wołane z obu miejsc
 *      (production.ts:797 dla listy, :1532 dla katalogu). Stary test (2026-07-28) zakładał,
 *      że "dostęp do etykiety surowca NIE blokuje budowy" — to było prawdą DZIEŃ PRZED tą
 *      decyzją, nie jest prawdą dziś. Potwierdzone przez siostrzany, zielony test
 *      `deposit-building-gate-test.cjs` (asercje `buildingResourceGateMet` z komentarzem
 *      "DOSTEP-SUROWCE-Q1" wprost).
 *   2) R-STAWKI-STROJENIE (2026-08-03) + R-NADMIAR-POOLS FALA2 (2026-08-04) — koszt
 *      surowcowy budynku (`koszt_surowce` w buildings.json) jest skalowany ×2 przez
 *      `scaleStockCostRecord()` (r-stawki-strojenie.ts, R_STAWKI_FALA2_MULT=2) zanim trafi
 *      do `canAffordBuildingStock()`. Stare wartości zapasu w tym teście (np. drewno:10 dla
 *      Spichlerza, którego koszt_surowce.drewno=8) były policzone BEZ tego mnożnika — dziś
 *      trzeba 16, nie 10. Potwierdzone przez `building-queue-refund-test.cjs`
 *      ("stolarnia koszt_surowce.drewno FALA2×2 = 10", tj. 5×2) i `r-stawki-fala2-test.cjs`.
 *
 * Bramka budowy dziś = DWIE niezależne rzeczy naraz:
 *   (a) ETYKIETA (`buildingResourceGateMet`, DEPOSIT_LINKED_BUILDING_LABELS) — sam zapas > 0
 *       wystarczy, blokuje LISTĘ i KATALOG (nie sprawdza ILE, tylko CZY > 0).
 *   (b) KOSZT (`canAffordBuildingStock`, `koszt_surowce` ×2 FALA2) — blokuje TYLKO status
 *       'ready' w katalogu (lista go nie sprawdza — stąd budynek bywa na liście, ale w
 *       katalogu wciąż 'locked', gdy ma etykietę, ale nie ma pełnej kwoty).
 *
 * Run from gra/:  node tools/spichlerz-widocznosc-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.spichlerz-widocznosc-entry.ts');
const BUNDLE = path.resolve(__dirname, '.spichlerz-widocznosc-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildableProduction, eraBuildingCatalog } from '../src/game/production';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const rawBuildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const DATA = { buildings: rawBuildings, units: [] };

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; }
  else { fail++; console.error('  FAIL:', m); }
}

const CITY = { id: 'c1', q: 0, r: 0, ownerId: 0, population: 5 };

function baseCtx(overrides) {
  return Object.assign({
    epoch: 1,
    builtBuildingIds: [],
    productionQueue: [],
    isCapital: true,
    ownerId: 0,
    difficulty: 'normal',
  }, overrides);
}

function buildIds(techs, ctxOverrides) {
  return M.buildableProduction(CITY, DATA, techs, baseCtx(ctxOverrides)).map(it => it.id);
}

function catalogEntry(id, techs, ctxOverrides) {
  const catalog = M.eraBuildingCatalog(DATA, techs, baseCtx(ctxOverrides));
  return catalog.find(e => e.id === id);
}

// ===========================================================================
// 1. SPICHLERZ — wyjątek: BRAK wpisu w DEPOSIT_LINKED_BUILDING_LABELS (patrz
//    building-resource-gate.ts "spichlerz — celowo brak wpisu"), więc tech wystarczy
//    do listy niezależnie od magazynu; katalog 'ready' wymaga TYLKO afordancji
//    koszt_surowce (drewno=8 ×2 FALA2 = 16).
// ===========================================================================
{
  const techs = ['Garncarstwo'];
  ok(buildIds(techs, {}).includes('spichlerz'),
    'Spichlerz w buildableProduction z samą tech (brak wpisu w DEPOSIT_LINKED — bez bramki etykiety)');

  const locked = catalogEntry('spichlerz', techs, {});
  ok(!!locked, 'Spichlerz jest OBECNY w eraBuildingCatalog');
  ok(locked && locked.status === 'locked',
    `Spichlerz eraBuildingCatalog status='locked' bez drewna w magazynie (ma: ${locked && locked.status})`);

  const withStock = { empireResourceStock: { drewno: 16 } };
  ok(buildIds(techs, withStock).includes('spichlerz'),
    'Spichlerz w buildableProduction z drewnem w magazynie');
  ok(catalogEntry('spichlerz', techs, withStock).status === 'ready',
    'Spichlerz eraBuildingCatalog status=\'ready\' z 16 drewna w magazynie państwa (koszt_surowce.drewno=8 ×2 FALA2=16)');

  const noTech = catalogEntry('spichlerz', [], withStock);
  ok(noTech && noTech.status === 'locked' && noTech.missingTech === 'Garncarstwo',
    'Spichlerz bez tech Garncarstwo: status=\'locked\', missingTech=\'Garncarstwo\'');

  // Asercja graniczna (nota Evaluatora): 16 drewna wystarcza pod KAŻDYM mnożnikiem >=1, więc
  // sama nie dowodzi że test faktycznie pinuje R_STAWKI_FALA2_MULT=2 (canAffordBuildingStock
  // to >=, więc nadmiarowy zapas przechodzi też przy MULT=1). 15 drewna musi zostać 'locked'
  // wyłącznie przy MULT=2 (koszt 16) — przy ewentualnym cofnięciu na MULT=1 (koszt 8) ta sama
  // wartość byłaby 'ready', więc ta asercja łapie regresję z dołu, nie tylko z góry.
  const belowFala2 = { empireResourceStock: { drewno: 15 } };
  const belowFala2Entry = catalogEntry('spichlerz', techs, belowFala2);
  ok(belowFala2Entry && belowFala2Entry.status === 'locked',
    'Spichlerz eraBuildingCatalog status=\'locked\' z 15 drewna (poniżej progu ×2 FALA2=16, pinuje mnożnik od dołu)');
}

// ===========================================================================
// 2. Budynki epoki Kamienia — DEPOSIT_LINKED: garncarnia→Glina, stolarnia→Drewno,
//    kamieniarski→Kamień. Bramka etykiety (a) gatuje LISTĘ; koszt_surowce ×2 FALA2 (b)
//    gatuje dodatkowo status 'ready' w katalogu.
// ===========================================================================
{
  const cases = [
    // [id, tech, etykieta (ascii), zapas etykiety (samo >0), koszt_surowce ×2 FALA2 pełny]
    ['garncarnia', 'Garncarstwo', 'glina', { glina: 1 }, { glina: 1, drewno: 12 }],
    ['stolarnia', 'Obróbka drewna', 'drewno', { drewno: 1 }, { drewno: 10 }],
    ['kamieniarski', 'Murarstwo', 'kamien', { kamien: 1 }, { kamien: 1, drewno: 12 }],
  ];
  for (const [id, tech, label, labelOnlyStock, fullStock] of cases) {
    const techs = [tech];
    ok(!buildIds(techs, {}).includes(id),
      `${id} NIEDOSTĘPNA bez ${label} w magazynie państwa (DOSTEP-SUROWCE-Q1, bramka etykiety)`);
    ok(catalogEntry(id, techs, {}).status === 'locked',
      `${id}: eraBuildingCatalog locked bez magazynu`);
    ok(buildIds(techs, { empireResourceStock: labelOnlyStock }).includes(id),
      `${id} w buildableProduction z samą etykietą ${label} w magazynie (bez pełnego koszt_surowce — lista nie liczy afordancji)`);
    ok(catalogEntry(id, techs, { empireResourceStock: labelOnlyStock }).status === 'locked',
      `${id}: eraBuildingCatalog locked — etykieta ${label} jest, ale koszt_surowce ×2 FALA2 nie pokryty`);
    ok(catalogEntry(id, techs, { empireResourceStock: fullStock }).status === 'ready',
      `${id}: eraBuildingCatalog ready z etykietą ${label} + pełnym koszt_surowce ×2 FALA2 w magazynie państwa`);
  }
}

// ===========================================================================
// 3. Budynki epoki Brązu: cegielnia (Glina), kuznia (Ruda), mennica (Targowisko w
//    mieście + Złoto w magazynie), odlewnia_brazu (Ruda w magazynie — DOSTEP-SUROWCE-Q1
//    Q3: NIE Kopalnia miedzi na mapie, `placedImprovements` nieużywane przez production.ts).
// ===========================================================================
{
  const epoch2 = { epoch: 2 };

  {
    const techs = ['Garncarstwo'];
    ok(!buildIds(techs, epoch2).includes('cegielnia'),
      'cegielnia NIEDOSTĘPNA bez Gliny w magazynie państwa (DOSTEP-SUROWCE-Q1)');
    ok(catalogEntry('cegielnia', techs, epoch2).status === 'locked',
      'cegielnia: catalog locked bez magazynu');
    const glinaOnly = Object.assign({ empireResourceStock: { glina: 1 } }, epoch2);
    ok(buildIds(techs, glinaOnly).includes('cegielnia'),
      'cegielnia w liście z samą Gliną w magazynie (bez pełnego koszt_surowce)');
    ok(catalogEntry('cegielnia', techs, glinaOnly).status === 'locked',
      'cegielnia: catalog locked — Glina jest, ale drewno+kamień ×2 FALA2 nie pokryte');
    const full = Object.assign({ empireResourceStock: { glina: 1, drewno: 12, kamien: 12 } }, epoch2);
    ok(catalogEntry('cegielnia', techs, full).status === 'ready',
      'cegielnia: catalog ready z Gliną + drewnem(12)+kamieniem(12) w magazynie (koszt_surowce {6,6} ×2 FALA2)');
  }

  {
    const techs = ['Brązownictwo'];
    ok(!buildIds(techs, epoch2).includes('kuznia'),
      'kuznia NIEDOSTĘPNA bez Rudy w magazynie państwa (DOSTEP-SUROWCE-Q1)');
    ok(catalogEntry('kuznia', techs, epoch2).status === 'locked',
      'kuznia: catalog locked bez magazynu');
    const rudaOnly = Object.assign({ empireResourceStock: { ruda: 1 } }, epoch2);
    ok(buildIds(techs, rudaOnly).includes('kuznia'),
      'kuznia w liście z samą Rudą w magazynie (bez pełnego koszt_surowce)');
    ok(catalogEntry('kuznia', techs, rudaOnly).status === 'locked',
      'kuznia: catalog locked — Ruda jest, ale drewno+kamień ×2 FALA2 nie pokryte');
    const full = Object.assign({ empireResourceStock: { ruda: 1, drewno: 12, kamien: 12 } }, epoch2);
    ok(catalogEntry('kuznia', techs, full).status === 'ready',
      'kuznia: catalog ready z Rudą + drewnem(12)+kamieniem(12) w magazynie (koszt_surowce {6,6} ×2 FALA2)');
  }

  {
    const techs = ['Waluta'];
    ok(!buildIds(techs, epoch2).includes('mennica'), 'mennica NIEDOSTĘPNA bez Targowiska w mieście');
    const withTarg = Object.assign({ builtBuildingIds: ['targowisko'] }, epoch2);
    ok(!buildIds(techs, withTarg).includes('mennica'),
      'mennica NIEDOSTĘPNA z Targowiskiem, ale bez Złota w magazynie państwa (DOSTEP-SUROWCE-Q1)');
    ok(catalogEntry('mennica', techs, withTarg).status === 'locked',
      'mennica: catalog locked bez Złota/drewna/kamienia w magazynie');
    const zlotoOnly = Object.assign({ empireResourceStock: { zloto: 1 } }, withTarg);
    ok(buildIds(techs, zlotoOnly).includes('mennica'),
      'mennica w liście z Targowiskiem + samym Złotem w magazynie (bez pełnego koszt_surowce)');
    ok(catalogEntry('mennica', techs, zlotoOnly).status === 'locked',
      'mennica: catalog locked — Złoto jest, ale drewno+kamień ×2 FALA2 nie pokryte');
    const fullNoZloto = Object.assign({ empireResourceStock: { drewno: 12, kamien: 16 } }, withTarg);
    ok(catalogEntry('mennica', techs, fullNoZloto).status === 'locked',
      'mennica: catalog locked — drewno+kamień pokryte, ale BEZ Złota w magazynie (bramka etykiety niezależna od kosztu)');
    const full = Object.assign({ empireResourceStock: { zloto: 1, drewno: 12, kamien: 16 } }, withTarg);
    ok(catalogEntry('mennica', techs, full).status === 'ready',
      'mennica: catalog ready z Targowiskiem + Złotem + drewnem(12)+kamieniem(16) w magazynie (koszt_surowce {6,8} ×2 FALA2)');
  }

  {
    const techs = ['Brązownictwo'];
    ok(!buildIds(techs, epoch2).includes('odlewnia_brazu'),
      'odlewnia_brazu NIEDOSTĘPNA bez Rudy w magazynie państwa (DOSTEP-SUROWCE-Q1 Q3 — nie Kopalnia miedzi na mapie)');
    // placedImprovements NIE jest czytane przez production.ts (tylko pole typu w kontekście) —
    // Kopalnia miedzi na mapie sama w sobie nic tu nie odblokowuje, liczy się TYLKO magazyn Rudy.
    const mineOnlyNoStock = Object.assign(
      { placedImprovements: new Map([['1,0', 'kopalnia_miedzi']]) }, epoch2,
    );
    ok(!buildIds(techs, mineOnlyNoStock).includes('odlewnia_brazu'),
      'odlewnia_brazu NIEDOSTĘPNA z samą Kopalnią miedzi na mapie, bez Rudy w magazynie (placedImprovements nieużywane przez production.ts)');
    const rudaOnly = Object.assign({ empireResourceStock: { ruda: 1 } }, epoch2);
    ok(buildIds(techs, rudaOnly).includes('odlewnia_brazu'),
      'odlewnia_brazu DOSTĘPNA z samą Rudą w magazynie (bez pełnego koszt_surowce)');
    ok(catalogEntry('odlewnia_brazu', techs, rudaOnly).status === 'locked',
      'odlewnia_brazu: catalog locked — Ruda jest, ale drewno+kamień ×2 FALA2 nie pokryte');
    const full = Object.assign({ empireResourceStock: { ruda: 1, drewno: 12, kamien: 16 } }, epoch2);
    ok(buildIds(techs, full).includes('odlewnia_brazu'),
      'odlewnia_brazu DOSTĘPNA z Rudą + magazynem pełnym');
    ok(catalogEntry('odlewnia_brazu', techs, full).status === 'ready',
      'odlewnia_brazu: catalog ready z Rudą + drewnem(12)+kamieniem(16) w magazynie (koszt_surowce {6,8} ×2 FALA2)');
  }
}

console.log(`\nspichlerz-widocznosc-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
