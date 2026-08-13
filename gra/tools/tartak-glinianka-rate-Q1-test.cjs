'use strict';
/**
 * tartak-glinianka-rate-Q1-test.cjs -- korekta balansu Maciej 2026-08-09,
 * ZASTAPIONA korekta R-ZUZYCIE-SUROWCOW-OBYWATELE-PROD-Q1 (Maciej 2026-08-12):
 * Tartak->drewno 4->10/ture, Glinianka->glina 4->10/ture, Kamieniolom->kamien
 * 4->10/ture (wszystkie trzy razem, referencja teraz TEZ zmieniona).
 *
 * Run from gra/: node tools/tartak-glinianka-rate-Q1-test.cjs
 *
 * Pokrywa:
 *   A. terrain-improvements.json: surowiec_ilosc_tura Tartak=10, Glinianka=10,
 *      Kamieniolom=10 (odczyt bezposredni z danych zrodlowych).
 *   B. Silnik: territoryResourceYieldForImprovement (SUROW-TERYT-01) zwraca
 *      10 dla obu kluczy, NIE stara wartosc 4 (funkcja realna, nie JSON).
 *   C. Integracja: advanceCityEconomy -- Tartak w terytorium daje +10 drewna/ture
 *      do magazynu panstwa (nie +4), Glinianka na zlozu gliny daje +10 gliny/ture
 *      (nie +4).
 *   D. Regresja P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO: capPerType (cap panstwa,
 *      reconcileOwnerResourceCaps przez advanceCityEconomy) nadal poprawnie klamruje
 *      SUME do cap-u panstwa przy nowej, wyzszej stawce produkcji (10/ture) -- test
 *      wielu Tartakow przez wiele tur az suma przekroczy cap, potwierdzenie ze
 *      suma nigdy nie przekracza cap-u panstwa.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[tartak-glinianka-rate-Q1-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.tartak-glinianka-rate-entry.ts');
const BUNDLE = path.join(__dirname, '.tartak-glinianka-rate-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  territoryResourceYieldForImprovement,
} from '../src/game/terrain-improvements';
export {
  advanceCityEconomy,
  computeTerritoryResourceYieldByCity,
  ownerResourceCap,
} from '../src/game/turn-economy';
export { buildTerritoryNodesFromCities } from '../src/map/territory-work';
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
const terrainImprovements = require('../data/terrain-improvements.json');
const econParams = require('../data/econ-params.json');
const civs = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const units = require('../data/units.json');
const tech = require('../data/tech.json');

const DATA = { civs, econParams, societyParams, buildings, units, tech };

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

console.log('\n-- A. terrain-improvements.json: surowiec_ilosc_tura po korekcie 2026-08-13 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, x5 vs 2026-08-12) --\n');
eq(terrainImprovements.tartak.surowiec_ilosc_tura, 50, 'JSON: tartak.surowiec_ilosc_tura === 50 (bylo 10)');
eq(terrainImprovements.glinianka.surowiec_ilosc_tura, 50, 'JSON: glinianka.surowiec_ilosc_tura === 50 (bylo 10)');
eq(terrainImprovements.kamieniolom.surowiec_ilosc_tura, 50, 'JSON: kamieniolom.surowiec_ilosc_tura === 50 (R-ZUZYCIE-SUROWCOW-OBYWATELE-PROD-Q1 -> R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)');

console.log('\n-- B. territoryResourceYieldForImprovement (silnik, SUROW-TERYT-01) --\n');
const tartakYield = M.territoryResourceYieldForImprovement('tartak');
const glinianKaYield = M.territoryResourceYieldForImprovement('glinianka');
const kamieniolomYield = M.territoryResourceYieldForImprovement('kamieniolom');
ok(!!tartakYield, 'tartak: territoryResourceYieldForImprovement zwraca wpis');
ok(!!glinianKaYield, 'glinianka: territoryResourceYieldForImprovement zwraca wpis');
ok(!!kamieniolomYield, 'kamieniolom: territoryResourceYieldForImprovement zwraca wpis');
eq(tartakYield && tartakYield.resourceKey, 'drewno', 'tartak: resourceKey = drewno');
eq(tartakYield && tartakYield.amount, 50, 'silnik: tartak amount === 50 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)');
eq(glinianKaYield && glinianKaYield.resourceKey, 'glina', 'glinianka: resourceKey = glina');
eq(glinianKaYield && glinianKaYield.amount, 50, 'silnik: glinianka amount === 50 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)');
// N5 (Maciej 2026-08-12, dispatch po ecbddda8): luka pokrycia -- kamieniolom mial
// dotad asercje TYLKO na poziomie JSON (sekcja A wyzej), NIE na poziomie silnika.
// EN: coverage gap -- kamieniolom previously had assertions ONLY at the JSON level
// (section A above), NOT at the engine level.
eq(kamieniolomYield && kamieniolomYield.resourceKey, 'kamien', 'kamieniolom: resourceKey = kamien');
eq(kamieniolomYield && kamieniolomYield.amount, 50, 'silnik: kamieniolom amount === 50 (odczyt z JSON, R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)');

console.log('\n-- C. Integracja: advanceCityEconomy -- Tartak/Glinianka w terytorium +50/ture do magazynu --\n');

function makeCity(overrides = {}) {
  return {
    id: 'city0',
    ownerId: 0,
    q: 0,
    r: 0,
    name: 'Test',
    population: 1,
    magazynZywnosci: 10,
    surowce: {},
    ...overrides,
  };
}

function runTick(city, builtIds, map) {
  const builtByCity = new Map([[city.id, builtIds]]);
  const c = makeCity({ ...city, surowce: { ...(city.surowce ?? {}) } });
  M.advanceCityEconomy([c], map, DATA, 'normal', [], new Map(), builtByCity);
  return c.surowce ?? {};
}

{
  // Tartak solo na Górach (bez lasu, bez worked-tile bonusu drewna) -- izoluje
  // dokladnie territoryYield (SUROW-TERYT-01), bez tileYield addytywnego.
  const city = makeCity({ population: 1 });
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: 'gory',
        nakladka: 'brak',
        rzeka: null,
        ulepszenia: ['tartak'],
      },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const terr = M.computeTerritoryResourceYieldByCity([city], map, nodes);
  const terrDrewno = terr.get(city.id)?.drewno ?? 0;
  eq(terrDrewno, 50, 'computeTerritoryResourceYieldByCity: Tartak solo terrYield drewno = 50/ture (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)');
}

{
  // Glinianka na zlozu gliny -- territoryYield izolowany (Glinianka nie ma
  // drewna/kamien w tileYield, tylko bonus.glina=10 osobno w worked, x5 po
  // R-EKONOMIA-SUROWCE-SKALA-5X-Q1 Runda 2/B1 -- bylo 2 -- tu
  // sprawdzamy WYLACZNIE territoryYield/magazyn panstwa SUROW-TERYT-01).
  const city = makeCity({ population: 1 });
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: 'rownina',
        nakladka: 'brak',
        rzeka: null,
        zloze: 'glina',
        ulepszenia: ['glinianka'],
      },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const terr = M.computeTerritoryResourceYieldByCity([city], map, nodes);
  const terrGlina = terr.get(city.id)?.glina ?? 0;
  eq(terrGlina, 50, 'computeTerritoryResourceYieldByCity: Glinianka terrYield glina = 50/ture (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)');
}

console.log('\n-- D. Regresja P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO: cap panstwa nadal klamruje przy 10/ture --\n');
{
  // Cap panstwa faktyczny (odczyt runtime, NIE zahardkodowany -- DEFAULT_OWNER_STORAGE_PARAMS
  // w economy-upkeep.ts jest dzis 1000 + 100/Magazyn, patrz komentarz "baza 100->500->1000";
  // odczytujemy realna wartosc przez ownerResourceCap zamiast zakladac liczbe na sztywno).
  // 8x Tartak w terytorium = 8x10 = 80 drewna/ture -- wystarczy by w rozsadnej
  // liczbie tur przekroczyc dowolny sensowny cap panstwa i wymusic klamrowanie.
  const N_TARTAK = 8;
  const hexes = {};
  for (let i = 0; i < N_TARTAK; i++) {
    hexes[`${i},0`] = {
      coords: { q: i, r: 0 },
      terenBazowy: 'gory',
      nakladka: 'brak',
      rzeka: null,
      ulepszenia: ['tartak'],
    };
  }
  const map = { hexes };
  let city = makeCity({ population: 1, surowce: {} });
  const builtByCity = new Map([[city.id, []]]);
  const expectedCap = M.ownerResourceCap([city], builtByCity, 0, DATA, 'normal');
  ok(expectedCap > 0, `sanity: cap panstwa odczytany runtime > 0 (${expectedCap})`);

  const perTurn = N_TARTAK * 10; // stawka NOWA (10/ture x Tartak), nie stara 4/ture
  // P-MAGAZYN-SKALOWANIE-EPOKA-Q1 (Maciej 2026-08-12): margines x2 (nie tylko +15) --
  // po podniesieniu magazyn_baza_surowce 1000->10000 sama nominalna stawka (perTurn=80)
  // nie trafia netto do magazynu (empirycznie ~62/ture po odjeciu innego zuzycia miasta),
  // wiec staly dodatek +15 tur, wystarczajacy przy starym, malym capie, przestal
  // wystarczac przy 10x wiekszym capie -- margines musi skalowac sie MULTIPLIKATYWNIE
  // z capem, nie addytywnie stala liczba tur.
  const turnsToExceedCap = Math.ceil((expectedCap / perTurn) * 2) + 15; // margines x2 + kilkanascie tur ponad przekroczenie cap-u

  let maxSeen = 0;
  for (let t = 0; t < turnsToExceedCap; t++) {
    const c = makeCity({ ...city, surowce: { ...(city.surowce ?? {}) } });
    M.advanceCityEconomy([c], map, DATA, 'normal', [], new Map(), builtByCity);
    city = c;
    const drewno = city.surowce?.drewno ?? 0;
    maxSeen = Math.max(maxSeen, drewno);
    ok(drewno <= expectedCap, `tura ${t + 1}: drewno (${drewno}) <= cap panstwa (${expectedCap})`);
  }
  ok(maxSeen === expectedCap, `capPerType aktywowal sie: suma osiagnela dokladnie cap (${maxSeen} === ${expectedCap}) mimo wyzszej stawki 10/ture x${N_TARTAK} Tartakow`);
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed ? 1 : 0);
