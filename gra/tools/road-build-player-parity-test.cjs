'use strict';
/**
 * R-WEB-ROAD-BUILD-PLAYER-PARITY-WITH-AI-Q1 — test parzystości budowy dróg gracza i AI.
 *
 * Rozjazd (diagnoza, R1): main.ts podawał regule `droga` zbiór `placedKeys` (KAŻDY heks z ulepszeniem),
 * przez co gracz nie mógł poprowadzić drogi przez farmę/trzodę ani na heks przylegający do miasta z farmą.
 * AI (`buildImprovementQualifier` w auto-improvements.ts) nie podaje `placedKeys` — kwalifikował te heksy.
 *
 * Sprawdza (realny `createImprovementBuildApi` / `roadBuildBlockReason` z gra/src, bez atrap):
 *  (P) parzystość: dla KAŻDEGO heksu mapy `canBuild('droga')` gracza == AI (ta sama reguła, różny tylko
 *      zbiór `placedKeys`, którego AI nie dostaje) — zero rozbieżności;
 *  (F) gracz buduje drogę z heksa-farmy przy mieście (połączenie z miastem przez heks z ulepszeniem);
 *  (R) trasa idzie dalej przez dwa heksy-farmy (po postawieniu drogi na pierwszej) — zaakceptowana;
 *  (D) heks z drogą odrzucony z powodem „Tu już jest droga.”;
 *  (W) woda odrzucona z powodem o lądzie; (T) obcy teren/poza terytorium z powodem o terytorium;
 *  (C) heks w terytorium bez połączenia odrzucony z komunikatem o łączeniu (nie cicho).
 *
 * Run z gra/:   node tools/road-build-player-parity-test.cjs
 * Mutacja:      RPP_SRC_DIR=<kopia gra/src z przywróconym placedKeys> node tools/road-build-player-parity-test.cjs   (MUSI byc czerwony)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.RPP_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'rpp-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { createImprovementBuildApi, roadBuildBlockReason } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { TerenBazowy, Nakladka, Ulepszenie } from ${JSON.stringify(SRC + '/types/hex')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { createImprovementBuildApi, roadBuildBlockReason, TerenBazowy, Nakladka, Ulepszenie } = require(bundle);
try { fs.rmSync(temp, { recursive: true, force: true }); } catch { /* ignore */ }

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}
const K = (q, r) => `${q},${r}`;
const dist = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
const RADIUS = 6;

// Syntetyczna mapa: łąka w promieniu 6 od miasta (0,0); woda (morze) w (3,-3); ulepszenia wg scenariusza.
const hexes = {};
for (let q = -RADIUS; q <= RADIUS; q++) {
  for (let r = -RADIUS; r <= RADIUS; r++) {
    if (dist(q, r) > RADIUS) continue;
    hexes[K(q, r)] = {
      coords: { q, r },
      terenBazowy: TerenBazowy.Laka,
      nakladka: Nakladka.Brak,
      ulepszenie: Ulepszenie.Brak,
      zloze: null,
    };
  }
}
hexes[K(3, -3)].terenBazowy = TerenBazowy.Morze;
const FARM_ADJ = [1, 0];      // farma przy mieście (sąsiad miasta) — trasa wchodzi właśnie tu
const FARM_ROUTE = [2, 0];    // druga farma dalej na trasie
const ROAD_HEX = [0, 1];      // heks z już postawioną drogą (sąsiad miasta)
hexes[K(...FARM_ADJ)].ulepszenie = Ulepszenie.Farma;
hexes[K(...FARM_ROUTE)].ulepszenie = Ulepszenie.Farma;
hexes[K(...ROAD_HEX)].ulepszenie = Ulepszenie.Droga;

const map = { szerokoscQ: 40, wysokoscR: 40, hexes, riverPaths: [] };
const cityNodes = [{ q: 0, r: 0, pop: 5, level: 1 }];

function placedFromHexes() {
  const m = new Map();
  for (const [hk, hex] of Object.entries(hexes)) {
    if (hex.ulepszenie === Ulepszenie.Farma) m.set(hk, 'farma');
    if (hex.ulepszenie === Ulepszenie.Droga) m.set(hk, 'droga');
  }
  return m;
}
const placedImprovements = placedFromHexes();
const placedKeysPlayer = new Set(placedImprovements.keys()); // jak collectPlacedImprovementKeys() w main.ts
const roadKeysPlayer = new Set([K(...ROAD_HEX)]);

// Stan gracza (main.ts: placedKeys + roadKeys) i stan AI (auto-improvements.ts: BEZ placedKeys/roadKeys).
const stateBase = { map, cityNodes, territoryNodes: [], playerOwnerIdNum: 0, placedImprovements, researchedTechs: new Set(['Koło']), playerEra: 2, playerCivArchetype: 'rzymianie' };
const statePlayer = { ...stateBase, placedKeys: placedKeysPlayer, roadKeys: roadKeysPlayer };
const stateAI = { ...stateBase };

const apiPlayer = createImprovementBuildApi(statePlayer, { activeKey: null });
const apiAI = createImprovementBuildApi(stateAI, { activeKey: null });

console.log('R-WEB-ROAD-BUILD-PLAYER-PARITY-WITH-AI-Q1 — test parzystości dróg gracz vs AI');

// (P) parzystość na całej mapie
{
  let mismatches = 0, total = 0, accepted = 0;
  for (const hk of Object.keys(hexes)) {
    const [q, r] = hk.split(',').map(Number);
    const a = apiPlayer.canBuild('droga', q, r);
    const b = apiAI.canBuild('droga', q, r);
    total++;
    if (a) accepted++;
    if (a !== b) { mismatches++; if (mismatches <= 5) console.error(`     rozjazd ${hk}: gracz=${a} AI=${b}`); }
  }
  ok(mismatches === 0, `(P) parzystość canBuild('droga') gracz == AI na ${total} heksach (rozjazdy: ${mismatches}, dozwolonych: ${accepted})`);
}

// (F) gracz: heks-farma przy mieście
ok(apiPlayer.canBuild('droga', ...FARM_ADJ) === true,
  '(F) gracz może postawić drogę na farmie sąsiadującej z miastem (połączenie z miastem przez ulepszenie)');

// (R) trasa dalej przez farmy: po postawieniu drogi na pierwszej farmie, druga farma przy niej — zaakceptowana
{
  const placed2 = new Map(placedImprovements);
  placed2.set(K(...FARM_ADJ), ['farma', 'droga']);
  const hexes2 = { ...hexes, [K(...FARM_ADJ)]: { ...hexes[K(...FARM_ADJ)], ulepszenie: Ulepszenie.Droga } };
  const roadKeys2 = new Set([...roadKeysPlayer, K(...FARM_ADJ)]);
  const state2 = { ...statePlayer, map: { ...map, hexes: hexes2 }, placedImprovements: placed2, placedKeys: new Set(placed2.keys()), roadKeys: roadKeys2 };
  const api2 = createImprovementBuildApi(state2, { activeKey: null });
  ok(api2.canBuild('droga', ...FARM_ROUTE) === true,
    '(R) trasa dalej: druga farma przy postawionej drodze jest akceptowana (wejście w heks z ulepszeniem)');
  ok(api2.canBuild('droga', ...FARM_ADJ) === false,
    '(R) ten sam heks z właśnie postawioną drogą nie przyjmuje drugiej drogi');
}

// (D) heks z drogą odrzucony z powodem
ok(apiPlayer.canBuild('droga', ...ROAD_HEX) === false, '(D) heks z już istniejącą drogą odrzucony');
ok(roadBuildBlockReason(statePlayer, ...ROAD_HEX) === 'Tu już jest droga.', '(D) powód: „Tu już jest droga.”');

// (W) woda: odrzucona z powodem o lądzie
ok(apiPlayer.canBuild('droga', 3, -3) === false, '(W) heks morza odrzucony');
{
  const reason = roadBuildBlockReason(statePlayer, 3, -3) || '';
  ok(/lądzie/.test(reason), `(W) powód dla wody czytelny po polsku („${reason}”)`);
}

// (T) poza terytorium: odrzucony z powodem o terytorium (wybieramy heks daleko od miasta, poza zasięgiem)
{
  let far = null;
  for (const hk of Object.keys(hexes)) {
    const [q, r] = hk.split(',').map(Number);
    if (/terytorium/.test(roadBuildBlockReason(statePlayer, q, r) || '')) { far = [q, r]; break; }
  }
  ok(far !== null, '(T) istnieje heks poza terytorium gracza na mapie testowej');
  if (far) {
    ok(apiPlayer.canBuild('droga', ...far) === false, `(T) heks poza terytorium (${far.join(',')}) odrzucony`);
    const reason = roadBuildBlockReason(statePlayer, ...far) || '';
    ok(/terytorium/.test(reason), `(T) powód: poza terytorium („${reason}”)`);
  }
}

// (C) w terytorium, bez połączenia z miastem/drogą: komunikat o łączeniu (nie cicho)
{
  let found = null;
  for (const hk of Object.keys(hexes)) {
    const [q, r] = hk.split(',').map(Number);
    if (roadBuildBlockReason(statePlayer, q, r) === 'Droga musi łączyć się z miastem lub już istniejącą drogą.') { found = [q, r]; break; }
  }
  ok(found !== null, '(C) istnieje heks w terytorium bez połączenia, z komunikatem o łączeniu z miastem/drogą');
  if (found) ok(apiPlayer.canBuild('droga', ...found) === false, `(C) heks bez połączenia (${found.join(',')}) odrzucony`);
}

// (M) zgodność: UI-powód (api.roadBlockReason) = roadBuildBlockReason; brak powodu dla dozwolonego heksu
ok(apiPlayer.roadBlockReason(...FARM_ADJ) === null, '(M) dozwolony heks (farma przy mieście): brak powodu');
ok(apiPlayer.roadBlockReason(3, -3) === roadBuildBlockReason(statePlayer, 3, -3), '(M) api.roadBlockReason zgodne z roadBuildBlockReason');

console.log(`\nWynik: ${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
