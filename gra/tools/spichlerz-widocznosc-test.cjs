'use strict';
/**
 * spichlerz-widocznosc-test.cjs — R-BUD-SPICHLERZ-ZNIKA (Maciej 2026-07-26, zgłoszenie
 * blokujące rozgrywkę, playtest bundla 17ca0a4f): "nie mogę budować spichlerza pomimo tego,
 * że mam odkrytą odpowiednią technologię".
 *
 * Ustalenie: Spichlerz NIE jest zablokowany przez technologię (Garncarstwo, jeśli odkryta,
 * jest spełniona) ani przez lokalizację (brak pola `lokalizacja`) ani przez CITY_BUILDING_PREREQ
 * (spichlerz nie ma wpisu). Blokuje go bramka surowcowa (DEPOSIT_LINKED_BUILDING_LABELS w
 * building-resource-gate.ts: `spichlerz: ['Ceramika']`) — Ceramika jest surowcem PRZETWORZONYM
 * (patrz data/resources.json), więc bramka jest spełniona wyłącznie: (a) wybudowaną Garncarnią
 * gdziekolwiek w imperium, (b) aktywną etykietą Ceramika, lub (c) zapasem Ceramiki w puli
 * państwa. To jest ZAMIERZONA bramka (istnieje od commitu 855cd84, sprzed dzisiejszych zmian
 * 58e6819/e36c11c — NIE regresja tych dwóch commitów).
 *
 * Prawdziwy błąd: `eraBuildingCatalog` (production.ts) liczyła status budynku z tech/lokalizacji/
 * CITY_BUILDING_PREREQ, ale NIGDY nie sprawdzała `buildingResourceGateMet` ani wyjątku Piec
 * hutniczy (empireHasKopalniaMiedzi) — więc budynek zablokowany WYŁĄCZNIE tą bramką dostawał
 * status='ready', mimo że `availableProduction`/`buildableProduction` i tak go odrzucały. Efekt:
 * budynek znikał CAŁKOWICIE z panelu (nie trafiał ani do listy "Dostępne", bo silnik go
 * odrzucał, ani do "Jeszcze zablokowane", bo ta sekcja pokazuje tylko status==='locked') —
 * dokładnie objaw ze zgłoszenia. Naprawiono w production.ts (`eraBuildingCatalog`, blok
 * `resourceOk`) + uzupełniono puste pole `wymagania` dla Spichlerza w buildings.json, żeby
 * `formatBuildingCatalogLockHint` (cityPanel.ts) miał czym wypełnić komunikat zamiast pustego
 * "🔒 Niedostępny".
 *
 * Ten test pilnuje regresji dla WSZYSTKICH budynków bramkowanych tym samym mechanizmem
 * (DEPOSIT_LINKED_BUILDING_LABELS + wyjątek Piec hutniczy), nie tylko Spichlerza — te same dwie
 * bramki dotyczą też: garncarnia, cegielnia, spichlerz_ii, stolarnia, kamieniarski, kuznia,
 * mennica, odlewnia_brazu (piec hutniczy).
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
// 1. SPICHLERZ — reprodukcja dokładna zgłoszenia: technologia Garncarstwo odkryta,
//    ale bez dostępu do Ceramiki (brak Garncarni w imperium, brak zapasu, brak aktywnej
//    etykiety) — Spichlerz NIE jest budowalny (bramka poprawna, zamierzona), ALE
//    eraBuildingCatalog musi go pokazać jako 'locked' Z KOMUNIKATEM, nie 'ready'
//    (co powodowało całkowite zniknięcie z panelu — patrz nagłówek pliku).
// ===========================================================================
{
  const techs = ['Garncarstwo'];
  ok(!buildIds(techs, {}).includes('spichlerz'),
    'Spichlerz NIEDOSTĘPNY bez dostępu do Ceramiki (bramka działa poprawnie)');

  const locked = catalogEntry('spichlerz', techs, {});
  ok(!!locked, 'Spichlerz jest OBECNY w eraBuildingCatalog (nie znika z danych silnika)');
  ok(locked && locked.status === 'locked',
    `Spichlerz eraBuildingCatalog status='locked' bez Ceramiki (ma: ${locked && locked.status}) -- PRZED naprawą był 'ready' i znikał z panelu`);
  ok(locked && !locked.locationBlocked, 'Spichlerz nie jest blokowany lokalizacją (brak pola lokalizacja)');
  ok(locked && locked.wymagania && /Ceramik/i.test(locked.wymagania),
    `Spichlerz niesie czytelny powód blokady wymieniający Ceramikę (ma: "${locked && locked.wymagania}")`);

  // 1b. Z wybudowaną Garncarnią gdziekolwiek w imperium (empireBuiltIds) — Spichlerz
  // staje się budowalny i status='ready'.
  const withGarncarnia = { empireBuiltIds: ['garncarnia'] };
  ok(buildIds(techs, withGarncarnia).includes('spichlerz'),
    'Spichlerz DOSTĘPNY z Garncarnią wybudowaną w imperium (empireBuiltIds)');
  const ready = catalogEntry('spichlerz', techs, withGarncarnia);
  ok(ready && ready.status === 'ready',
    `Spichlerz eraBuildingCatalog status='ready' z Garncarnią w imperium (ma: ${ready && ready.status})`);

  // 1c. Z aktywną etykietą Ceramika (activeResourceLabels) — też dostępny.
  const withLabel = { activeResourceLabels: ['Ceramika'] };
  ok(buildIds(techs, withLabel).includes('spichlerz'),
    'Spichlerz DOSTĘPNY z aktywną etykietą Ceramika');
  ok(catalogEntry('spichlerz', techs, withLabel).status === 'ready',
    'Spichlerz eraBuildingCatalog status=\'ready\' z aktywną etykietą Ceramika');

  // 1d. Z zapasem Ceramiki w puli państwa (empireResourceStock) — też dostępny.
  const withStock = { empireResourceStock: { ceramika: 3 } };
  ok(buildIds(techs, withStock).includes('spichlerz'),
    'Spichlerz DOSTĘPNY z zapasem Ceramiki w puli państwa');
  ok(catalogEntry('spichlerz', techs, withStock).status === 'ready',
    'Spichlerz eraBuildingCatalog status=\'ready\' z zapasem Ceramiki w puli państwa');

  // 1e. Bez odkrytej technologii Garncarstwo — Spichlerz zablokowany przez TECH (nie surowiec),
  // komunikat wskazuje missingTech, nie znika.
  const noTech = catalogEntry('spichlerz', [], withGarncarnia);
  ok(noTech && noTech.status === 'locked' && noTech.missingTech === 'Garncarstwo',
    'Spichlerz bez odkrytej technologii Garncarstwo: status=\'locked\', missingTech=\'Garncarstwo\'');
}

// ===========================================================================
// 2. Ta sama regresja dla pozostałych budynków epoki Kamienia (epoka 1) bramkowanych
//    DEPOSIT_LINKED_BUILDING_LABELS: garncarnia (Glina), stolarnia (Drewno),
//    kamieniarski (Kamień).
// ===========================================================================
{
  const cases = [
    ['garncarnia', 'Garncarstwo', 'Glina'],
    ['stolarnia', 'Obróbka drewna', 'Drewno'],
    ['kamieniarski', 'Murarstwo', 'Kamień'],
  ];
  for (const [id, tech, label] of cases) {
    const techs = [tech];
    ok(!buildIds(techs, {}).includes(id), `${id} NIEDOSTĘPNY bez dostępu do ${label} (bramka OK)`);
    const locked = catalogEntry(id, techs, {});
    ok(locked && locked.status === 'locked',
      `${id}: eraBuildingCatalog status='locked' bez ${label} (ma: ${locked && locked.status})`);
    ok(locked && locked.wymagania && locked.wymagania.length > 0,
      `${id}: komunikat "wymagania" niepusty (ma: "${locked && locked.wymagania}")`);

    ok(buildIds(techs, { activeResourceLabels: [label] }).includes(id),
      `${id} DOSTĘPNY z aktywną etykietą ${label}`);
    ok(catalogEntry(id, techs, { activeResourceLabels: [label] }).status === 'ready',
      `${id}: eraBuildingCatalog status='ready' z aktywną etykietą ${label}`);
  }
}

// ===========================================================================
// 3. Ta sama regresja dla budynków epoki Brązu (epoka 2): cegielnia (Glina), kuznia (Ruda),
//    mennica (Złoto + Targowisko w mieście), odlewnia_brazu / Piec hutniczy (Kopalnia miedzi).
// ===========================================================================
{
  const epoch2 = { epoch: 2 };

  // cegielnia
  {
    const techs = ['Garncarstwo'];
    ok(!buildIds(techs, epoch2).includes('cegielnia'), 'cegielnia NIEDOSTĘPNA bez Gliny');
    ok(catalogEntry('cegielnia', techs, epoch2).status === 'locked',
      'cegielnia: eraBuildingCatalog status=\'locked\' bez Gliny');
    const withLabel = Object.assign({ activeResourceLabels: ['Glina'] }, epoch2);
    ok(buildIds(techs, withLabel).includes('cegielnia'), 'cegielnia DOSTĘPNA z Gliną');
    ok(catalogEntry('cegielnia', techs, withLabel).status === 'ready',
      'cegielnia: eraBuildingCatalog status=\'ready\' z Gliną');
  }

  // kuznia
  {
    const techs = ['Brązownictwo'];
    ok(!buildIds(techs, epoch2).includes('kuznia'), 'kuznia NIEDOSTĘPNA bez Rudy');
    ok(catalogEntry('kuznia', techs, epoch2).status === 'locked',
      'kuznia: eraBuildingCatalog status=\'locked\' bez Rudy');
    const withLabel = Object.assign({ activeResourceLabels: ['Ruda'] }, epoch2);
    ok(buildIds(techs, withLabel).includes('kuznia'), 'kuznia DOSTĘPNA z Rudą');
    ok(catalogEntry('kuznia', techs, withLabel).status === 'ready',
      'kuznia: eraBuildingCatalog status=\'ready\' z Rudą');
  }

  // mennica (dwie bramki: Złoto + Targowisko w mieście -- obie musza byc spełnione)
  {
    const techs = ['Waluta'];
    ok(!buildIds(techs, epoch2).includes('mennica'), 'mennica NIEDOSTĘPNA bez Złota i bez Targowiska');
    ok(catalogEntry('mennica', techs, epoch2).status === 'locked',
      'mennica: eraBuildingCatalog status=\'locked\' bez Złota i bez Targowiska');
    const partial = Object.assign({ activeResourceLabels: ['Złoto'] }, epoch2);
    ok(!buildIds(techs, partial).includes('mennica'), 'mennica NIEDOSTĘPNA z samym Złotem (bez Targowiska)');
    ok(catalogEntry('mennica', techs, partial).status === 'locked',
      'mennica: eraBuildingCatalog status=\'locked\' z samym Złotem (bez Targowiska w mieście)');
    const full = Object.assign({ activeResourceLabels: ['Złoto'], builtBuildingIds: ['targowisko'] }, epoch2);
    ok(buildIds(techs, full).includes('mennica'), 'mennica DOSTĘPNA ze Złotem + Targowiskiem');
    ok(catalogEntry('mennica', techs, full).status === 'ready',
      'mennica: eraBuildingCatalog status=\'ready\' ze Złotem + Targowiskiem');
  }

  // odlewnia_brazu / Piec hutniczy (twardy wyjątek terenowy: Kopalnia miedzi w imperium,
  // NIE etykieta -- sprawdzane przez placedImprovements, patrz braz-access.ts)
  {
    const techs = ['Brązownictwo'];
    ok(!buildIds(techs, epoch2).includes('odlewnia_brazu'),
      'odlewnia_brazu (Piec hutniczy) NIEDOSTĘPNA bez Kopalni miedzi w imperium');
    ok(catalogEntry('odlewnia_brazu', techs, epoch2).status === 'locked',
      'odlewnia_brazu: eraBuildingCatalog status=\'locked\' bez Kopalni miedzi');
    const withMine = Object.assign(
      { placedImprovements: new Map([['1,0', 'kopalnia_miedzi']]) },
      epoch2,
    );
    ok(buildIds(techs, withMine).includes('odlewnia_brazu'),
      'odlewnia_brazu (Piec hutniczy) DOSTĘPNA z Kopalnią miedzi w imperium (placedImprovements)');
    ok(catalogEntry('odlewnia_brazu', techs, withMine).status === 'ready',
      'odlewnia_brazu: eraBuildingCatalog status=\'ready\' z Kopalnią miedzi w imperium');
  }
}

console.log(`\nspichlerz-widocznosc-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
