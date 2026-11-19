/**
 * R-WEB-TERRITORY-CITY-FOUNDING-NO-FORT-TAKEOVER-Q1 (decyzja wlasciciela 2026-11-19).
 *
 * Regula docelowa:
 *  (R0) zalozenie miasta NIE przejmuje cudzego fortu/posterunku w swoim zasiegu
 *       (ownerId zostaje; ulepszenia na heksach fortu zostaja przy wlascicielu);
 *       jedyny wyjatek F1 = fort DOKLADNIE na hexie miasta fizycznie znika.
 *  (R1) spor o heks fort<->miasto rozstrzyga territoryOwnerAt (jak miasto<->miasto).
 *  (R2) zdobycie fortu/posterunku WYLACZNIE silowo: wroga jednostka wojskowa w stanie wojny
 *       (applyFortCaptureByOccupation). Pokoj / brak wojny / jednostka cywilna -> brak zdobycia.
 *
 * Mutacje kopii (przywrocenie starej reguly 4) sa liczone jako czerwone: test sprawdza, ze
 * stara logika (zaimitowana tu lokalnie) daje przejecie, a aktualna nie.
 */
const fs = require('fs');
const path = require('path');
let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.city-nofort-entry.ts');
const BUNDLE = path.resolve(__dirname, '.city-nofort-bundle.cjs');
fs.writeFileSync(ENTRY, `
export * as FT from ${JSON.stringify(SRC + '/game/fort-territory')};
export { territoryOwnerAt, cityTerritoryRadius, axialDistance } from ${JSON.stringify(SRC + '/map/territory')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
} catch (e) { console.error('bundle failed', e.message || e); process.exit(1); }
const M = require(BUNDLE);
const { FT, territoryOwnerAt, cityTerritoryRadius, axialDistance } = M;
const fortTerritoryNodes = FT.fortTerritoryNodes;
const applyTakeover = FT.applyFortTakeoverOnCityFounded;
const applyCapture = FT.applyFortCaptureByOccupation;

// Stara regula 4 (przed zmiana) -- tylko do mutacji kopii; NIE jest uzywana w produkcji.
function oldRule4Takeover(newCity, forts) {
  const radius = cityTerritoryRadius({ q: newCity.q, r: newCity.r, pop: newCity.population, level: 1 });
  const events = [];
  for (const f of forts) {
    if (f.ownerId === newCity.ownerId) continue;
    if (axialDistance(newCity.q, newCity.r, f.q, f.r) > radius) continue;
    events.push({ q: f.q, r: f.r, prevOwnerId: f.ownerId, newOwnerId: newCity.ownerId });
    f.ownerId = newCity.ownerId;
    f.contestedUseless = false;
  }
  return events;
}

// ---- R0: zalozenie miasta nie przejmuje cudzego fortu w zasiegu ----
console.log('\n--- R0: miasto AI obok fortu gracza -> fort NADAL gracza ---');
{
  // Fort gracza (ownerId 0) na (0,0); miasto AI (ownerId 1) w jego zasiegu, ale NIE na hexie fortu.
  const fort = { q: 0, r: 0, ownerId: 0, type: 'fort' };
  const forts = [fort];
  const city = { q: 3, r: 0, ownerId: 1, population: 10 };
  const ev = applyTakeover(city, forts);
  eq(ev.length, 0, 'R0-1: zero zdarzen przejecia (fort gracza w zasiegu miasta AI)');
  eq(fort.ownerId, 0, 'R0-2: fort nadal nalezy do gracza (0)');
  eq(forts.length, 1, 'R0-3: wezel fortu nie znika (hex fortu != hex miasta)');
  eq(fort.contestedUseless, undefined, 'R0-4: brak resetu znacznika (nic nie przejete)');
}
console.log('\n--- R0-odwrotnie: miasto gracza obok fortu AI ---');
{
  const fort = { q: 0, r: 0, ownerId: 1, type: 'posterunek' };
  const forts = [fort];
  const ev = applyTakeover({ q: 2, r: 0, ownerId: 0, population: 10 }, forts);
  eq(ev.length, 0, 'R0-5: miasto gracza nie zabiera fortu AI');
  eq(fort.ownerId, 1, 'R0-6: posterunek AI nadal AI');
}
console.log('\n--- R0-F1: miasto DOKLADNIE na hexie cudzego fortu -> wezel znika (F1 bez zmian) ---');
{
  const forts = [{ q: 0, r: 0, ownerId: 0, type: 'fort' }];
  const ev = applyTakeover({ q: 0, r: 0, ownerId: 1, population: 10 }, forts);
  eq(ev.length, 1, 'R0-7: F1 generuje 1 zdarzenie (ewakuacja z hexu)');
  eq(forts.length, 0, 'R0-8: F1 usuwa wezel z hexu miasta');
}
console.log('\n--- R0-mutacja: stara regula 4 (przywrocenie przejecia) -> czerwone ---');
{
  const fort = { q: 0, r: 0, ownerId: 0, type: 'fort' };
  const ev = oldRule4Takeover({ q: 3, r: 0, ownerId: 1, population: 10 }, [fort]);
  assert(ev.length === 1 && fort.ownerId === 1, 'R0-M1: mutacja (stara regula) PRZEJMUJE fort -> test R0-1/R0-2 bylby czerwony');
}

// ---- R1: heks sporny fort<->miasto rozstrzygany przez territoryOwnerAt ----
console.log('\n--- R1: sporny heks fort<->miasto = territoryOwnerAt (miasto wygrywa w swoim promieniu) ---');
{
  const city = { q: 0, r: 0, pop: 5, level: 1, ownerId: 1 };
  const nodes = [city].concat(fortTerritoryNodes([{ q: 7, r: 0, ownerId: 0, type: 'fort', builtAtTurn: 1, seq: 0 }]));
  eq(territoryOwnerAt(3, 0, nodes), 1, 'R1-1: heks w promieniu miasta -> wlasciciel miasta');
  eq(territoryOwnerAt(7, 0, nodes), 0, 'R1-2: heks fortu -> wlasciciel fortu (nie przepisany przez miasto)');
  const nodes2 = fortTerritoryNodes([{ q: 0, r: 0, ownerId: 0, type: 'fort', builtAtTurn: 1, seq: 0 }, { q: 8, r: 0, ownerId: 1, type: 'fort', builtAtTurn: 2, seq: 1 }]);
  eq(territoryOwnerAt(4, 0, nodes2), 0, 'R1-3: spor fort-fort: wczesniejszy (tura 1) wygrywa');
}

// ---- R2: zdobycie fortu wylacznie silowo (wojna + jednostka wojskowa) ----
console.log('\n--- R2: applyFortCaptureByOccupation -- war/peace/civilian/barbarian ---');
{
  const warOnly = (a, b) => (a === 1 && b === 0) || (a === 0 && b === 1); // 1 vs 0 = wojna
  const noBarb = () => false;
  const mkFort = () => [{ q: 4, r: 4, ownerId: 0, type: 'fort' }];
  // peace: isEnemy false
  const peaceEnemy = () => false;
  eq(applyCapture(mkFort(), [{ ownerId: 1, q: 4, r: 4, military: true }], peaceEnemy, noBarb).length, 0, 'R2-1: pokoj/brak wojny + jednostka bojowa -> BRAK zdobycia');
  eq(applyCapture(mkFort(), [{ ownerId: 1, q: 4, r: 4, military: false }], warOnly, noBarb).length, 0, 'R2-2: wojna + jednostka CYWILNA/zwiadowca (military=false) -> BRAK zdobycia');
  const f = mkFort();
  const evs = applyCapture(f, [{ ownerId: 1, q: 4, r: 4, military: true }], warOnly, noBarb);
  eq(evs.length, 1, 'R2-3: wojna + jednostka wojskowa na heksie fortu -> ZDOBYCIE (1 zdarzenie)');
  eq(f[0].ownerId, 1, 'R2-4: fort przechodzi na zdobywce');
  eq(applyCapture(mkFort(), [{ ownerId: 0, q: 4, r: 4, military: true }, { ownerId: 1, q: 4, r: 4, military: true }], warOnly, noBarb).length, 0, 'R2-5: wlasciciel ma jednostke na heksie -> brak zdobycia');
  eq(applyCapture(mkFort(), [{ ownerId: 1, q: 4, r: 4, military: true }], warOnly, () => true).length, 0, 'R2-6: barbarzynca nie zdobywa fortu');
}
console.log('\n--- R2-zrodlo: sweepFortCaptures uzywa areEnemyOwners (wojna) i nie-cywilnej jednostki ---');
{
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
  const sweep = main.slice(main.indexOf('function sweepFortCaptures'), main.indexOf('function sweepFortCaptures') + 900);
  assert(/areEnemyOwners/.test(sweep), 'R2-7: sweepFortCaptures przekazuje areEnemyOwners (stan wojny)');
  assert(/military:\s*!isCivilianUnit\(u\)/.test(sweep), 'R2-8: sweepFortCaptures: military = !isCivilianUnit');
  const areEnemy = main.slice(main.indexOf('function areEnemyOwners'), main.indexOf('function areEnemyOwners') + 260);
  assert(/getDiploRelation\(a, b\)\.status === 'wojna'/.test(areEnemy), 'R2-9: areEnemyOwners = status wojna (nie pokoj/rozejm/sojusz)');
}

console.log(`\n=== city-founding-no-fort-takeover-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
