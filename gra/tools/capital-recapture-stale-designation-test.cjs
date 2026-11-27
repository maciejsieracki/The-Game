'use strict';
/**
 * capital-recapture-stale-designation-test.cjs -- R-WEB-CAPITAL-RECAPTURE-Q1 (CAPRECAP), pomiar czysty (bez przegladarki).
 *
 * Pytanie: co dzieje sie z jawnym wpisem stolicy (capitalCityIdByOwner w main.ts), gdy stolica
 * AI zbuntuje sie? Bunt (transferCityToRebelFactionWithLedger) zmienia TYLKO city.ownerId na -99
 * i NIE rusza mapy stolic. Wpis zostaje "stary" (wskazuje miasto, ktore nie nalezy juz do wlasciciela).
 *
 * Zrodla w main.ts (stan af3e0f141):
 *   - capitalCityIdForOwner: jawny wpis wazny tylko gdy miasto istnieje i ma tego wlasciciela,
 *     inaczej fallback = najstarsze miasto wlasciciela (self-healing dla WIDOCZNEJ stolicy: etykiety,
 *     Mennica, efekty stolicy, panel).
 *   - runCapitalCapturePlunder: designatedCapitalId = capitalCityIdByOwner.get(oldOwner) (SUROWA mapa,
 *     bez walidacji) przekazywane do applyBarbarianAwareCapitalCapturePlunder -> wasCapitalOfOldOwner.
 *     Gdy podane (nie null), porownanie id jest CAŁYM kryterium "to byla stolica".
 *
 * Wniosek testowany tu: po buncie stolicy surowy wpis wskazuje miasto -99, wiec przejecie
 * FAKTYCZNEJ stolicy (fallback = najstarsze miasto) nie przechodzi kryterium wasCapitalOfOldOwner
 * -> brak plunderu skarbca/puli, brak sukcesji i brak komunikatu „przejęcie stolicy”, mimo ze
 * widoczna stolica (capitalCityIdForOwner) zmienila sie z tego miasta. Test mierzy oba stany
 * (surowa mapa vs. efektywny resolver) na tym samym stanie gry.
 *
 * Uruchomienie z gra/ (esbuild z ESBUILD_DIR albo gra/node_modules):
 *   node tools/capital-recapture-stale-designation-test.cjs
 * Wynik: linie MEASURE ... (liczby z uruchomienia). Skrypt NIE jest bramka: wypisuje REPRODUKCJA
 * gdy surowy wpis rozni sie od efektywnej stolicy i capture nie daje outcome.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const dir = process.env.ESBUILD_DIR || path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(dir); } catch (_) {
    console.error('[capital-recapture] esbuild nie znaleziony (ustaw ESBUILD_DIR).');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.capital-recapture-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.capital-recapture-bundle.cjs');
const ENTRY_TS = `
export {
  applyBarbarianAwareCapitalCapturePlunder,
  oldestCityOfOwner,
  wasCapitalOfOldOwner,
} from '../src/game/capital-capture';
`;
fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE_FILE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
});
const M = require(BUNDLE_FILE);
try { fs.unlinkSync(ENTRY_FILE); fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* sprzatanie */ }

const REBEL = -99;
const AI = 1;
const PLAYER = 0;
const ACCESS = {
  // Akcesory zasobow zgodne z OwnerResourceAccess (capital-capture.ts); tu mierzymy tylko,
  // czy capture w ogole daje outcome (kryterium stolicy), wiec wartosci sa zerowe.
  getTreasury: () => 0, setTreasury: () => {},
  getPracaPool: () => 0, setPracaPool: () => {},
  getNaukaPool: () => 0, setNaukaPool: () => {},
  getResearchedTechs: () => new Set(), addResearchedTechs: () => {},
};

function city(id, ownerId) { return { id, ownerId, q: 0, r: 0, name: id, population: 1 }; }

/** Replika capitalCityIdForOwner z main.ts (jawny wpis wazny tylko gdy miasto istnieje i ma tego wlasciciela). */
function effectiveCapital(ownerId, explicitMap, cities) {
  const explicit = explicitMap.get(ownerId);
  if (explicit && cities.some(c => c.id === explicit && c.ownerId === ownerId)) return explicit;
  return M.oldestCityOfOwner(ownerId, cities)?.id ?? null;
}

/** Replika wywolania z runCapitalCapturePlunder: designated = SUROWA mapa, czytana PO zmianie ownerId miasta. */
function captureRaw(cityId, oldOwner, newOwner, cities, explicitMap) {
  const target = cities.find(c => c.id === cityId);
  target.ownerId = newOwner; // jak w main.ts: ownerId juz zmienione przed wywolaniem
  const designated = explicitMap.get(oldOwner) ?? undefined;
  return M.applyBarbarianAwareCapitalCapturePlunder(target, oldOwner, newOwner, cities, ACCESS, designated, () => false);
}

function fresh() {
  // AI (owner 1) ma 3 miasta; stolica przeniesiona recznie (wpis) na city2 (srodkowe, nie najstarsze).
  const cities = [city('city1', AI), city('city2', AI), city('city3', AI), city('city4', PLAYER)];
  const explicit = new Map([[AI, 'city2']]);
  return { cities, explicit };
}

const lines = [];
function measure(tag, obj) { lines.push('MEASURE ' + tag + ' ' + JSON.stringify(obj)); }

// --- S1 (surowy stan po buncie stolicy AI) -----------------------------------
{
  const { cities, explicit } = fresh();
  // Bunt stolicy AI: tylko ownerId (jak transferCityToRebelFactionWithLedger).
  cities.find(c => c.id === 'city2').ownerId = REBEL;
  measure('S1-po-buncie', {
    surowyWpis: explicit.get(AI),
    wpisWazny: cities.some(c => c.id === explicit.get(AI) && c.ownerId === AI),
    efektywnaStolicaAI: effectiveCapital(AI, explicit, cities),
  });
  // Odbicie/podboj FAKTYCZNEJ stolicy AI (city1 = najstarsze, efektywna stolica) przez gracza.
  const outcome = captureRaw('city1', AI, PLAYER, cities, explicit);
  const efektywnaPrzed = 'city1';
  measure('S1-przejecie-efektywnej-stolicy', {
    wynikCapture: outcome ? outcome.event : null,
    oczekiwanoWgResolvera: efektywnaPrzed,
    zgodnosc: outcome ? 'OK' : 'NIEZGODNE (brak plunderu/sukcesji dla faktycznej stolicy)',
    efektywnaStolicaAIpo: effectiveCapital(AI, explicit, cities),
    surowyWpisPo: explicit.get(AI),
  });
}

// --- kontrola: ten sam scenariusz, wpis wyczyszczony przy buncie -------------
{
  const { cities, explicit } = fresh();
  cities.find(c => c.id === 'city2').ownerId = REBEL;
  explicit.delete(AI); // hipotetyczna poprawka: wpis kasowany przy zmianie wlasciciela miasta-stolicy
  const outcome = captureRaw('city1', AI, PLAYER, cities, explicit);
  measure('KONTROLA-wpis-wyczyszczony', {
    wynikCapture: outcome ? outcome.event : null,
    zgodnosc: outcome ? 'OK' : 'NIEZGODNE',
  });
}

// --- S2 (odzyskanie zbuntowanej stolicy przez pierwotnego wlasciciela) -------
{
  const { cities, explicit } = fresh();
  cities.find(c => c.id === 'city2').ownerId = REBEL;
  const przedOdzyskaniem = effectiveCapital(AI, explicit, cities);
  cities.find(c => c.id === 'city2').ownerId = AI; // zwrot miasta (cesja/odbicie)
  measure('S2-odzyskanie-stolicy', {
    efektywnaPrzed: przedOdzyskaniem,
    efektywnaPo: effectiveCapital(AI, explicit, cities),
    surowyWpis: explicit.get(AI),
    uwaga: 'stary wpis wraca do roli stolicy automatycznie (sprawdzic oczekiwanie)',
  });
}

console.log(lines.join('\n'));
