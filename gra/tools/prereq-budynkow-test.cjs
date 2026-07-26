'use strict';
/**
 * prereq-budynkow-test.cjs — REGRESJA-KOLEJNOSC (Maciej 2026-07-25, wieczór).
 *
 * Likwidacja "awansu bocznego" (usunięcie upgradeFrom z czterech par: Biblioteka/Akademia,
 * Mury/Cytadela, Koszary/Akademia wojskowa, Kamienne kręgi/Świątynia) skasowała PRZY OKAZJI
 * wymóg kolejności budowy -- dało się postawić Akademię bez Biblioteki. Właściciel: "budynek
 * wcześniejszy musi być wybudowany, żeby wybudować kolejny", dla wszystkich czterech par.
 * Naprawa: cztery nowe wpisy w CITY_BUILDING_PREREQ (building-resource-gate.ts), sprawdzane w
 * production.ts (`cityBuildingPrereqMet`, wołane zarówno z `availableProduction` jak i z
 * `eraBuildingCatalog` -- to drugie naprawione w tej samej zmianie, patrz niżej).
 *
 * Run from gra/:  node tools/prereq-budynkow-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.prereq-budynkow-entry.ts');
const BUNDLE = path.resolve(__dirname, '.prereq-budynkow-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildableProduction, eraBuildingCatalog,
} from '../src/game/production';
export { CITY_BUILDING_PREREQ } from '../src/game/building-resource-gate';
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
    epoch: 3,
    builtBuildingIds: [],
    productionQueue: [],
    isCapital: true,
    ownerId: 0,
    difficulty: 'normal',
  }, overrides);
}

function buildIds(techs, ctxOverrides) {
  const ctx = baseCtx(ctxOverrides);
  return M.buildableProduction(CITY, DATA, techs, ctx).map(it => it.id);
}

// ===========================================================================
// 1. CITY_BUILDING_PREREQ ma dokładnie dziewięć wpisów: dwa istniejące (nietknięte)
//    + cztery z REGRESJA-KOLEJNOSC + jeden ZLOTO (2026-07-25: mennica -> targowisko)
//    + dwa nowe DECYZJE 54a/54b (2026-07-25: baszta -> mury, akwedukt -> studnia).
// ===========================================================================
{
  const p = M.CITY_BUILDING_PREREQ;
  ok(Array.isArray(p.warsztat_oblezniczy) && p.warsztat_oblezniczy.length === 2
    && p.warsztat_oblezniczy.includes('koszary') && p.warsztat_oblezniczy.includes('akademia_wojskowa'),
    `warsztat_oblezniczy: nietknięty ['koszary','akademia_wojskowa'] (ma: ${JSON.stringify(p.warsztat_oblezniczy)})`);
  ok(p.laznia_publiczna === 'studnia', `laznia_publiczna: nietknięty 'studnia' (ma: ${JSON.stringify(p.laznia_publiczna)})`);
  ok(p.akademia === 'biblioteka', `akademia: 'biblioteka' (ma: ${JSON.stringify(p.akademia)})`);
  ok(p.fort === 'mury', `fort: 'mury' (ma: ${JSON.stringify(p.fort)})`);
  ok(p.akademia_wojskowa === 'koszary', `akademia_wojskowa: 'koszary' (ma: ${JSON.stringify(p.akademia_wojskowa)})`);
  ok(p.swiatynia === 'kamienne_kregi', `swiatynia: 'kamienne_kregi' (ma: ${JSON.stringify(p.swiatynia)})`);
  ok(p.mennica === 'targowisko', `mennica: 'targowisko' (ma: ${JSON.stringify(p.mennica)})`);
  ok(p.baszta === 'mury', `baszta: 'mury' (DECYZJA 54a) (ma: ${JSON.stringify(p.baszta)})`);
  ok(p.akwedukt === 'studnia', `akwedukt: 'studnia' (DECYZJA 54b) (ma: ${JSON.stringify(p.akwedukt)})`);
  ok(Object.keys(p).length === 9, `CITY_BUILDING_PREREQ ma dokładnie 9 wpisów (ma: ${Object.keys(p).length})`);
}

// ===========================================================================
// 1b. ZLOTO (2026-07-25): Mennica niedostępna bez Targowiska w tym mieście, NAWET z
//     aktywnym dostępem do Złota (activeResourceLabels) — obie bramki muszą być spełnione.
// ===========================================================================
{
  const techs = ['Waluta'];
  ok(!buildIds(techs, { epoch: 2, activeResourceLabels: ['Złoto'] }).includes('mennica'),
    'Mennica NIEDOSTĘPNA bez Targowiska w mieście (mimo dostępu do Złota)');
  ok(buildIds(techs, { epoch: 2, activeResourceLabels: ['Złoto'], builtBuildingIds: ['targowisko'] }).includes('mennica'),
    'Mennica DOSTĘPNA z Targowiskiem w mieście + dostępem do Złota');
  ok(!buildIds(techs, { epoch: 2, builtBuildingIds: ['targowisko'] }).includes('mennica'),
    'Mennica NIEDOSTĘPNA z Targowiskiem, ale BEZ dostępu do Złota');
}

// ===========================================================================
// 2. Akademia niedostępna bez Biblioteki, dostępna z Biblioteką.
// ===========================================================================
{
  const techs = ['Filozofia'];
  ok(!buildIds(techs, { epoch: 3 }).includes('akademia'), 'Akademia NIEDOSTĘPNA bez Biblioteki w mieście');
  ok(buildIds(techs, { epoch: 3, builtBuildingIds: ['biblioteka'] }).includes('akademia'),
    'Akademia DOSTĘPNA z Biblioteką w mieście');
}

// ===========================================================================
// 3. Cytadela (fort) niedostępna bez Murów, dostępna z Murami.
// ===========================================================================
{
  const techs = ['Inżynieria'];
  ok(!buildIds(techs, { epoch: 3 }).includes('fort'), 'Cytadela NIEDOSTĘPNA bez Murów w mieście');
  ok(buildIds(techs, { epoch: 3, builtBuildingIds: ['mury'] }).includes('fort'),
    'Cytadela DOSTĘPNA z Murami w mieście');
}

// ===========================================================================
// 3b. DECYZJA 54a: Baszta niedostępna bez Murów, dostępna z Murami.
// ===========================================================================
{
  const techs = ['Inżynieria'];
  ok(!buildIds(techs, { epoch: 3 }).includes('baszta'), 'Baszta NIEDOSTĘPNA bez Murów w mieście');
  ok(buildIds(techs, { epoch: 3, builtBuildingIds: ['mury'] }).includes('baszta'),
    'Baszta DOSTĘPNA z Murami w mieście');
}

// ===========================================================================
// 3c. DECYZJA 54b: Akwedukt niedostępny bez Studni, dostępny ze Studnią.
// ===========================================================================
{
  const techs = ['Budownictwo'];
  ok(!buildIds(techs, { epoch: 2 }).includes('akwedukt'), 'Akwedukt NIEDOSTĘPNY bez Studni w mieście');
  ok(buildIds(techs, { epoch: 2, builtBuildingIds: ['studnia'] }).includes('akwedukt'),
    'Akwedukt DOSTĘPNY ze Studnią w mieście');
}

// ===========================================================================
// 4. Akademia wojskowa niedostępna bez Koszar, dostępna z Koszarami.
// ===========================================================================
{
  const techs = ['Sztuka wojenna'];
  ok(!buildIds(techs, { epoch: 3 }).includes('akademia_wojskowa'),
    'Akademia wojskowa NIEDOSTĘPNA bez Koszar w mieście');
  ok(buildIds(techs, { epoch: 3, builtBuildingIds: ['koszary'] }).includes('akademia_wojskowa'),
    'Akademia wojskowa DOSTĘPNA z Koszarami w mieście');
}

// ===========================================================================
// 5. Świątynia niedostępna bez Kamiennych kręgów, dostępna z Kamiennymi kręgami.
// ===========================================================================
{
  const techs = ['Religia'];
  ok(!buildIds(techs, { epoch: 2 }).includes('swiatynia'),
    'Świątynia NIEDOSTĘPNA bez Kamiennych kręgów w mieście');
  ok(buildIds(techs, { epoch: 2, builtBuildingIds: ['kamienne_kregi'] }).includes('swiatynia'),
    'Świątynia DOSTĘPNA z Kamiennymi kręgami w mieście');
}

// ===========================================================================
// 6. REGRESJA: Warsztat oblężniczy nadal dostępny przy Koszarach ALBO
//    Akademii wojskowej (para OR z dziś rana -- nie ruszona tą zmianą).
// ===========================================================================
{
  const techs = ['Oblężnictwo'];
  ok(!buildIds(techs, { epoch: 3 }).includes('warsztat_oblezniczy'),
    'Warsztat oblężniczy NIEDOSTĘPNY bez Koszar i bez Akademii wojskowej');
  ok(buildIds(techs, { epoch: 3, builtBuildingIds: ['koszary'] }).includes('warsztat_oblezniczy'),
    'Warsztat oblężniczy DOSTĘPNY z samymi Koszarami (regresja z dziś rana)');
  ok(buildIds(techs, { epoch: 3, builtBuildingIds: ['akademia_wojskowa'] }).includes('warsztat_oblezniczy'),
    'Warsztat oblężniczy DOSTĘPNY z samą Akademią wojskową (regresja z dziś rana)');
}

// ===========================================================================
// 7. REGRESJA: Łaźnia publiczna nadal wymaga Studni (nietknięte).
// ===========================================================================
{
  const techs = ['Medycyna'];
  ok(!buildIds(techs, { epoch: 3 }).includes('laznia_publiczna'),
    'Łaźnia publiczna NIEDOSTĘPNA bez Studni');
  ok(buildIds(techs, { epoch: 3, builtBuildingIds: ['studnia'] }).includes('laznia_publiczna'),
    'Łaźnia publiczna DOSTĘPNA ze Studnią');
}

// ===========================================================================
// 8. Stare zapisy: miasto z Akademią zbudowaną BEZ Biblioteki w builtBuildingIds
//    (możliwe dziś, przed tą naprawą) nie wywala wczytywania/liczenia produkcji --
//    prerekwizyt dotyczy tylko BUDOWANIA NOWYCH, nie usuwa/nie blokuje istniejących.
// ===========================================================================
{
  let threw = false;
  let ids = [];
  try {
    ids = buildIds(['Filozofia'], { epoch: 3, builtBuildingIds: ['akademia'] });
  } catch (e) {
    threw = true;
  }
  ok(!threw, 'Stary zapis (Akademia bez Biblioteki w builtBuildingIds) nie wywala availableProduction');
  ok(!ids.includes('akademia'), 'Akademia już zbudowana nie jest oferowana drugi raz (niezależnie od prereq)');
}

// ===========================================================================
// 9. Komunikat dla gracza: eraBuildingCatalog oznacza budynek jako 'locked' i
//    niesie tekst `wymagania` z nazwą brakującego poprzednika -- ta sama
//    konwencja co warsztat_oblezniczy / laznia_publiczna. Naprawiona przy okazji
//    luka: eraBuildingCatalog wcześniej NIE sprawdzał CITY_BUILDING_PREREQ w ogóle,
//    więc budynek zablokowany WYŁĄCZNIE brakiem poprzednika znikał z panelu bez
//    żadnego komunikatu (status zostawał 'ready').
// ===========================================================================
{
  function catalogEntry(id, epoch, techs, builtBuildingIds) {
    const ctx = baseCtx({ epoch, builtBuildingIds });
    const catalog = M.eraBuildingCatalog(DATA, techs, ctx);
    return catalog.find(e => e.id === id);
  }

  const cases = [
    ['akademia', 3, ['Filozofia'], [], 'biblioteka', 'Biblioteka'],
    ['fort', 3, ['Inżynieria'], [], 'mury', 'Mury'],
    ['akademia_wojskowa', 3, ['Sztuka wojenna'], [], 'koszary', 'Koszary'],
    ['swiatynia', 2, ['Religia'], [], 'kamienne_kregi', 'Kamienne kręgi'],
    ['warsztat_oblezniczy', 3, ['Oblężnictwo'], [], null, 'Koszary'],
    ['laznia_publiczna', 3, ['Medycyna'], [], 'studnia', 'Studnia'],
    ['baszta', 3, ['Inżynieria'], [], 'mury', 'Mury'],
    ['akwedukt', 2, ['Budownictwo'], [], 'studnia', 'Studnia'],
  ];
  for (const [id, epoch, techs, built, prereqId, prereqLabel] of cases) {
    const locked = catalogEntry(id, epoch, techs, built);
    ok(locked && locked.status === 'locked',
      `${id}: eraBuildingCatalog status='locked' bez poprzednika (ma: ${locked && locked.status})`);
    ok(locked && locked.wymagania && locked.wymagania.includes(prereqLabel),
      `${id}: komunikat "wymagania" wymienia poprzednika ${prereqLabel} (ma: "${locked && locked.wymagania}")`);

    if (prereqId) {
      const ready = catalogEntry(id, epoch, techs, [prereqId]);
      ok(ready && ready.status === 'ready',
        `${id}: eraBuildingCatalog status='ready' z ${prereqLabel} wybudowaną (ma: ${ready && ready.status})`);
    }
  }
}

// ===========================================================================
// 10. Parytet AI: identyczna lista produkcji (id-y budynków) dla dwóch różnych
//     ownerId, przy identycznym stanie miasta (bez gałęzi po ownerId).
// ===========================================================================
{
  const techs = ['Filozofia', 'Inżynieria', 'Sztuka wojenna', 'Religia', 'Oblężnictwo', 'Medycyna'];
  const built = ['biblioteka', 'mury', 'koszary', 'kamienne_kregi', 'studnia'];
  const idsPlayer = buildIds(techs, { epoch: 3, builtBuildingIds: built, ownerId: 0 }).sort();
  const idsAi = buildIds(techs, { epoch: 3, builtBuildingIds: built, ownerId: 7 }).sort();
  ok(JSON.stringify(idsPlayer) === JSON.stringify(idsAi),
    `Parytet AI: identyczna lista budynków dla ownerId=0 i ownerId=7 (gracz: ${JSON.stringify(idsPlayer)}, AI: ${JSON.stringify(idsAi)})`);
  ok(idsPlayer.includes('akademia') && idsPlayer.includes('fort')
    && idsPlayer.includes('akademia_wojskowa') && idsPlayer.includes('swiatynia')
    && idsPlayer.includes('baszta'),
    'Parytet AI: ze wszystkimi poprzednikami wybudowanymi (w tym Mury dla Baszty -- DECYZJA 54a), wszystkie 5 następników dostępne dla obu');

  // DECYZJA 54b: Akwedukt (epoka 2) dostępny identycznie dla gracza i AI ze Studnią w mieście.
  const idsPlayerAkw = buildIds(['Budownictwo'], { epoch: 2, builtBuildingIds: ['studnia'], ownerId: 0 });
  const idsAiAkw = buildIds(['Budownictwo'], { epoch: 2, builtBuildingIds: ['studnia'], ownerId: 7 });
  ok(idsPlayerAkw.includes('akwedukt') && idsAiAkw.includes('akwedukt'),
    'Parytet AI: Akwedukt dostępny identycznie dla gracza i AI ze Studnią w mieście (DECYZJA 54b)');

  // I odwrotnie -- bez poprzedników, obaj tak samo zablokowani.
  const idsPlayerLocked = buildIds(techs, { epoch: 3, builtBuildingIds: [], ownerId: 0 });
  const idsAiLocked = buildIds(techs, { epoch: 3, builtBuildingIds: [], ownerId: 7 });
  ok(!idsPlayerLocked.includes('akademia') && !idsAiLocked.includes('akademia'),
    'Parytet AI: bez Biblioteki, Akademia niedostępna identycznie dla gracza i AI');
}

console.log(`\nprereq-budynkow-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
