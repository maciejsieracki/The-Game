'use strict';
/**
 * capital-recapture-stale-designation-test.cjs -- R-WEB-CAPITAL-RECAPTURE-Q1 (CAPRECAP), pomiar czysty (bez przegladarki).
 *
 * Pytanie: co dzieje sie z jawnym wpisem stolicy (capitalCityIdByOwner w main.ts), gdy stolica
 * zostanie zbuntowana / oddana w pokoju / odbita? Bunt (transferCityToRebelFactionWithLedger)
 * zmienia TYLKO city.ownerId na -99 i NIE rusza mapy stolic. Wpis zostaje "stary".
 *
 * Zrodla w main.ts (stan af3e0f141):
 *   - capitalCityIdForOwner (~40167): jawny wpis wazny tylko gdy miasto istnieje i ma tego wlasciciela,
 *     inaczej fallback = najstarsze miasto wlasciciela. Zasila etykiety, Mennice, efekty stolicy, panel.
 *   - runCapitalCapturePlunder (~40764): designatedCapitalId = capitalCityIdByOwner.get(oldOwner) (SUROWA
 *     mapa, bez walidacji) przekazywane do applyBarbarianAwareCapitalCapturePlunder -> wasCapitalOfOldOwner.
 *     Gdy podane (nie null), porownanie id jest CALYM kryterium "to byla stolica".
 *
 * Co jest REPLIKOWANE w tym pliku (nie importowane z main.ts, bo main.ts nie jest bundlowalny):
 *   - effectiveCapital  = kopia capitalCityIdForOwner,
 *   - captureRaw        = kopia odczytu designatedCapitalId (surowa mapa).
 * Co jest UZYWANE z modulu gry (bundle esbuild): applyBarbarianAwareCapitalCapturePlunder, oldestCityOfOwner,
 * wasCapitalOfOldOwner z gra/src/game/capital-capture.ts. Przed pomiarem skrypt sprawdza, czy linie
 * replikowane nadal wystepuja w main.ts (kotwice ponizej); gdy nie -- FAIL "replika nieaktualna".
 *
 * Scenariusze (stan startowy: AI=1 ma city1 (najstarsze), city2 (wpis stolicy), city3; gracz=0 ma city4, city5):
 *   S1-AI   stolica AI (city2) zbuntowana -> odbicie FAKTYCZNEJ stolicy (city1) przez gracza -> oczekiwane przejecie_stolicy
 *   S1-GRACZ stolica gracza (city4, wpis ustawiony jak setCapital w main.ts ~40316) zbuntowana -> AI zdobywa city5
 *           (faktyczna stolica gracza) -> oczekiwane przejecie_stolicy
 *   KONTROLA wpis AI wyczyszczony przy buncie -> ten sam atak -> oczekiwane przejecie_stolicy (kierunek poprawki)
 *   S2      zbuntowana stolica wraca do AI -> efektywna stolica = city2 (STAN OBECNY, zamierzenie do potwierdzenia)
 *   S3      stolica AI (city2) zbuntowana i oddana graczowi w pokoju (cesja zbuntowanego miasta) -> atak na
 *           faktyczna stolice AI (city1) przez gracza -> oczekiwane przejecie_stolicy
 *   S4      druga stolica (city2) zbuntowana, potem zbuntowana tez faktyczna stolica (city1) -> atak na city3
 *           -> oczekiwane przejecie_stolicy
 *   S5      round-trip zapisu (snapshotJson/restoreJson) -- NIE ZMIERZONO tutaj (wymaga live; main.ts nie jest bundlowalny).
 *
 * Uruchomienie z gra/ (esbuild z ESBUILD_DIR albo gra/node_modules):
 *   ESBUILD_DIR=<katalog esbuild> node tools/capital-recapture-stale-designation-test.cjs
 * Wynik: tabela PASS/FAIL + linie MEASURE. Kod wyjscia 1 gdy jakikolwiek wiersz FAIL.
 * FAIL na S1/S3/S4 = odtworzenie rozjazdu (stan przed poprawka).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const dir = process.env.ESBUILD_DIR || path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(dir); } catch (_) {
    console.error('[capital-recapture] esbuild nie znaleziony (ustaw ESBUILD_DIR).');
    process.exit(2);
  }
})();

// --- kotwice: replikowane linie musza istniec w main.ts ----------------------
const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');
const ANCHORS = [
  'const explicit = capitalCityIdByOwner.get(ownerId);',
  'if (explicit && cities.some(c => c.id === explicit && c.ownerId === ownerId)) return explicit;',
  'const designatedCapitalId = capitalCityIdByOwner.get(oldOwner) ?? undefined;',
];
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const anchorsOk = ANCHORS.every(a => mainSrc.includes(a));

// --- bundle modulu gry ------------------------------------------------------
const ENTRY_FILE = path.resolve(__dirname, '.capital-recapture-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.capital-recapture-bundle.cjs');
const ENTRY_TS = `
export {
  applyBarbarianAwareCapitalCapturePlunder,
  oldestCityOfOwner,
  wasCapitalOfOldOwner,
} from '../src/game/capital-capture';
`;
let M;
try {
  fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE_FILE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
  M = require(BUNDLE_FILE);
} finally {
  // sprzatanie zawsze (takze po bledzie buildu)
  for (const f of [ENTRY_FILE, BUNDLE_FILE]) { try { fs.unlinkSync(f); } catch (_) { /* brak pliku */ } }
}

const REBEL = -99;
const AI = 1;
const PLAYER = 0;
const ACCESS = {
  // Zerowe akcesory: mierzymy wyłącznie, czy capture daje outcome (kryterium stolicy).
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
  target.ownerId = newOwner;
  const designated = explicitMap.get(oldOwner) ?? undefined;
  return M.applyBarbarianAwareCapitalCapturePlunder(target, oldOwner, newOwner, cities, ACCESS, designated, () => false);
}

function fresh() {
  // AI (1): city1 (najstarsze), city2 (wpis stolicy, nie najstarsze), city3. Gracz (0): city4 (wpis stolicy), city5.
  const cities = [city('city1', AI), city('city2', AI), city('city3', AI), city('city4', PLAYER), city('city5', PLAYER)];
  const explicit = new Map([[AI, 'city2'], [PLAYER, 'city4']]);
  return { cities, explicit };
}

const rows = [];
function check(name, expected, actual, note) {
  const ok = expected === actual;
  rows.push({ name, expected, actual, verdict: ok ? 'PASS' : 'FAIL', note: note || '' });
}
const lines = [];
function measure(tag, obj) { lines.push('MEASURE ' + tag + ' ' + JSON.stringify(obj)); }

// --- S1-AI: bunt stolicy AI, odbicie faktycznej stolicy przez gracza ---------
{
  const { cities, explicit } = fresh();
  cities.find(c => c.id === 'city2').ownerId = REBEL;
  const efektywna = effectiveCapital(AI, explicit, cities);
  check('S1-AI efektywna stolica AI po buncie', 'city1', efektywna, 'resolver (replika)');
  const out = captureRaw('city1', AI, PLAYER, cities, explicit);
  const ev = out ? out.event : null;
  measure('S1-AI-odbicie-faktycznej-stolicy', { wynikCapture: ev, surowyWpis: explicit.get(AI) });
  check('S1-AI przejecie faktycznej stolicy -> plunder/sukcesja', 'przejecie_stolicy', ev,
    'surowy wpis wskazuje miasto -99 (city2)');
}

// --- S1-GRACZ: bunt stolicy gracza, zdobycie faktycznej stolicy gracza przez AI
{
  const { cities, explicit } = fresh();
  cities.find(c => c.id === 'city4').ownerId = REBEL;
  const efektywna = effectiveCapital(PLAYER, explicit, cities);
  check('S1-GRACZ efektywna stolica gracza po buncie', 'city5', efektywna, 'resolver (replika)');
  const out = captureRaw('city5', PLAYER, AI, cities, explicit);
  const ev = out ? out.event : null;
  measure('S1-GRACZ-zdobycie-faktycznej-stolicy', { wynikCapture: ev, surowyWpis: explicit.get(PLAYER) });
  check('S1-GRACZ przejecie faktycznej stolicy -> plunder/sukcesja', 'przejecie_stolicy', ev,
    'surowy wpis wskazuje miasto -99 (city4)');
}

// --- KONTROLA: wpis AI wyczyszczony przy buncie (kierunek poprawki, NIE wdrozony)
{
  const { cities, explicit } = fresh();
  cities.find(c => c.id === 'city2').ownerId = REBEL;
  explicit.delete(AI);
  const out = captureRaw('city1', AI, PLAYER, cities, explicit);
  const ev = out ? out.event : null;
  measure('KONTROLA-wpis-wyczyszczony', { wynikCapture: ev });
  check('KONTROLA wpis wyczyszczony -> przejecie_stolicy', 'przejecie_stolicy', ev,
    'dowodzi, ze przyczyna to surowy wpis; poprawka NIE wdrozona');
}

// --- S2: zbuntowana stolica wraca do AI ------------------------------------------
{
  const { cities, explicit } = fresh();
  cities.find(c => c.id === 'city2').ownerId = REBEL;
  cities.find(c => c.id === 'city2').ownerId = AI;
  const efektywna = effectiveCapital(AI, explicit, cities);
  measure('S2-odzyskanie-stolicy', { efektywnaPo: efektywna, surowyWpis: explicit.get(AI) });
  check('S2 odzyskana stolica wraca jako stolica (stan obecny)', 'city2', efektywna,
    'zachowanie obecne; czy zamierzone -- pytanie do wlasciciela');
}

// --- S3: zbuntowane miasto-stolica oddane graczowi w pokoju ------------------
{
  const { cities, explicit } = fresh();
  cities.find(c => c.id === 'city2').ownerId = REBEL;
  // cesja w pokoju: ownerId zmieniany bez capture (jak transferCityByTreaty, main.ts ~41869)
  cities.find(c => c.id === 'city2').ownerId = PLAYER;
  const efektywna = effectiveCapital(AI, explicit, cities);
  check('S3 efektywna stolica AI po cesji city2', 'city1', efektywna, 'resolver (replika)');
  const out = captureRaw('city1', AI, PLAYER, cities, explicit);
  const ev = out ? out.event : null;
  measure('S3-atak-na-faktyczna-stolice', { wynikCapture: ev, surowyWpis: explicit.get(AI) });
  check('S3 przejecie faktycznej stolicy po cesji -> plunder/sukcesja', 'przejecie_stolicy', ev,
    'surowy wpis wskazuje city2 (teraz gracza)');
}

// --- S4: druga stolica (city2) zbuntowana, potem faktyczna stolica (city1) zbuntowana -----
{
  const { cities, explicit } = fresh();
  cities.find(c => c.id === 'city2').ownerId = REBEL;
  cities.find(c => c.id === 'city1').ownerId = REBEL;
  const efektywna = effectiveCapital(AI, explicit, cities);
  check('S4 efektywna stolica AI po dwoch buntach', 'city3', efektywna, 'resolver (replika)');
  const out = captureRaw('city3', AI, PLAYER, cities, explicit);
  const ev = out ? out.event : null;
  measure('S4-atak-na-trzecie-miasto', { wynikCapture: ev, surowyWpis: explicit.get(AI) });
  check('S4 przejecie faktycznej stolicy po dwoch buntach -> plunder/sukcesja', 'przejecie_stolicy', ev,
    'surowy wpis wskazuje city2 (-99)');
}

// --- S5: poza zakresem modulu -------------------------------------------------
rows.push({ name: 'S5 round-trip zapisu (snapshotJson/restoreJson)', expected: 'n/d', actual: 'NIE ZMIERZONO',
  verdict: 'NIE-ZMIERZONO', note: 'wymaga live (main.ts nie jest bundlowalny)' });

// --- raport ------------------------------------------------------------------
check('kotwice repliki obecne w main.ts', true, anchorsOk, 'gdy FAIL: replika nieaktualna, wyniki niewiarygodne');

console.log(lines.join('\n'));
console.log('');
console.log('| Scenariusz | Oczekiwane | Wynik | Werdykt | Uwaga |');
console.log('|---|---|---|---|---|');
for (const r of rows) {
  console.log(`| ${r.name} | ${JSON.stringify(r.expected)} | ${JSON.stringify(r.actual)} | ${r.verdict} | ${r.note} |`);
}
const fails = rows.filter(r => r.verdict === 'FAIL').length;
const passes = rows.filter(r => r.verdict === 'PASS').length;
console.log(`\nPODSUMOWANIE: PASS=${passes} FAIL=${fails} NIE-ZMIERZONO=${rows.length - passes - fails} (proby deterministyczne: 1 na wiersz)`);
process.exitCode = fails > 0 ? 1 : 0;
