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
export { territoryOwnerAt, territoryOwnerLookup, cityTerritoryRadius, axialDistance } from ${JSON.stringify(SRC + '/map/territory')};
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

// ---- R1-centrum: heks SAMEGO fortu zostaje przy wlascicielu (zarzut 1 Evaluatora) ----
console.log('\n--- R1-centrum: fort gracza (0,0) + miasto AI pop 10 na (3,0) ---');
{
  const city = { q: 3, r: 0, pop: 10, level: 1, ownerId: 1 };
  const nodes = [city].concat(fortTerritoryNodes([{ q: 0, r: 0, ownerId: 0, type: 'fort', builtAtTurn: 1, seq: 0 }]));
  eq(territoryOwnerAt(0, 0, nodes), 0, 'R1c-1: heks fortu (0,0) = wlasciciel fortu (0), nie miasto AI');
  eq(territoryOwnerAt(1, 0, nodes), 1, 'R1c-2: heks sasiedni w zasiegu miasta AI = miasto AI (przesuniecie granicy jak miasto<->miasto)');
  eq(territoryOwnerAt(2, 0, nodes), 1, 'R1c-3: kolejny heks w zasiegu miasta AI = miasto AI');
  // Stadnina (ulepszenie) na heksie fortu liczy sie do wlasciciela heksu => zostaje u gracza.
  const stadninaOwner = territoryOwnerAt(0, 0, nodes);
  eq(stadninaOwner, 0, 'R1c-4: ulepszenie na heksie fortu (stadnina) nalezy do gracza');
}

// ---- R1-indeks: territoryOwnerLookup (indeks dla >=12 wezlow) == territoryOwnerAt ----
console.log('\n--- R1-indeks: territoryOwnerLookup zgodny z territoryOwnerAt (>=12 wezlow) ---');
{
  const city = { q: 3, r: 0, pop: 10, level: 1, ownerId: 1 };
  const far = [];
  for (let i = 0; i < 11; i++) far.push({ q: 60 + i * 3, r: 40, ownerId: 2, type: 'posterunek', builtAtTurn: 3 + i, seq: 10 + i });
  const nodes = [city].concat(fortTerritoryNodes([{ q: 0, r: 0, ownerId: 0, type: 'fort', builtAtTurn: 1, seq: 0 }]), fortTerritoryNodes(far));
  const lookup = M.territoryOwnerLookup(nodes);
  let mism = 0;
  for (let q = -12; q <= 14; q++) for (let r = -12; r <= 12; r++) {
    if (lookup(q, r) !== territoryOwnerAt(q, r, nodes)) mism++;
  }
  eq(mism, 0, 'R1i-1: indeks i territoryOwnerAt zgodne na calym obszarze (0 rozbieznosci)');
  eq(lookup(0, 0), 0, 'R1i-2: indeks: heks fortu (0,0) = wlasciciel fortu');
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

// ---- RF: R-WEB-TERRITORY-FORT-RING-IMPROVEMENTS-NOT-TRANSFERRED-Q1 (ABC C 2026-11-19) ----
// Predykat ulepszenia jest WLASCIWOSCIOWY: shieldsHex(q, r, fortOwnerId) = true tylko gdy ulepszenie
// na (q,r) nalezy do fortOwnerId. Ulepszenie cudzego miasta NIE chroni heksu (regresja zarzutu 1).
// Produkcja NIE podpina predykatu (brak rejestru wlasciciela ulepszen - patrz raport operatora).
{
  // Pierscien fortu gracza (0) na (0,0), r=5. Miasto AI (1) na (7,0), pop 10 -> zasieg 10.
  // Stadnina gracza (0) na (2,0) i (3,0).
  const improved = new Set(['2,0', '3,0']);
  const ownedBy0 = (q, r, o) => o === 0 && improved.has(q + ',' + r);
  const mkFort = (pred, owner = 0, type = 'fort') =>
    FT.fortTerritoryNodes([{ q: 0, r: 0, ownerId: owner, type, builtAtTurn: 1, seq: 0 }], () => pred);
  const city = { q: 7, r: 0, pop: 10, level: 1, ownerId: 1 };
  const withShield = [city].concat(mkFort(ownedBy0));
  console.log('\n--- RF: stadnina gracza w pierscieniu fortu gracza przy nowym miescie AI ---');
  eq(territoryOwnerAt(2, 0, withShield), 0, 'RF-1: heks ze stadnina gracza (2,0) pozostaje u gracza (0)');
  eq(territoryOwnerAt(3, 0, withShield), 0, 'RF-2: heks ze stadnina gracza (3,0) pozostaje u gracza (0)');
  eq(territoryOwnerAt(4, 0, withShield), 1, 'RF-3: heks BEZ ulepszenia (4,0) w zasiegu miasta AI -> miasto AI (1)');
  eq(territoryOwnerAt(5, 0, withShield), 1, 'RF-4: heks BEZ ulepszenia (5,0) -> miasto AI (1)');
  eq(territoryOwnerAt(0, 0, withShield), 0, 'RF-5: centrum fortu (0,0) nadal u gracza (regula centrum bez zmian)');
  eq(territoryOwnerAt(-1, 0, withShield), 1, 'RF-6: heks BEZ ulepszenia (-1,0) w zasiegu miasta AI -> miasto AI (1)');
  eq(territoryOwnerAt(6, 0, withShield), 1, 'RF-7: heks poza promieniem fortu (6,0) -> miasto AI (1)');
  const noPred = [city].concat(mkFort(undefined));
  eq(territoryOwnerAt(2, 0, noPred), 1, 'RF-8: kontrola bez predykatu: heks (2,0) -> miasto AI (stara regula)');
  console.log('\n--- RF-odwrotnie: miasto gracza przy forcie AI z jego ulepszeniem ---');
  const ownedBy1 = (q, r, o) => o === 1 && improved.has(q + ',' + r);
  const cityP = { q: 7, r: 0, pop: 10, level: 1, ownerId: 0 };
  const rev = [cityP].concat(mkFort(ownedBy1, 1, 'posterunek'));
  eq(territoryOwnerAt(2, 0, rev), 1, 'RF-9: stadnina AI w pierscieniu posterunku AI przy miescie gracza -> AI (1)');
  eq(territoryOwnerAt(4, 0, rev), 0, 'RF-10: heks bez ulepszenia (4,0) -> miasto gracza (0)');
  console.log('\n--- RF-regresja (zarzut 1): ulepszenie STAREGO MIASTA Y w pierscieniu fortu X ---');
  {
    // Miasto Y=1 na (2,0) z ulepszeniem (jego wlasnosc); fort X=0 zalozony pozniej na (0,0).
    // Predykat dla fortu X (owner 0) MUSI byc false na (2,0): ulepszenie nalezy do Y=1.
    const cityY = { q: 2, r: 0, pop: 3, level: 1, ownerId: 1 };
    const ownedByY = (q, r, o) => o === 1 && q === 2 && r === 0;
    const fortX = [cityY].concat(mkFort(ownedByY, 0, 'fort'));
    eq(territoryOwnerAt(2, 0, fortX), 1, 'RF-14: ulepszenie miasta Y na (2,0) w pierscieniu fortu X zostaje u Y (1), nie przechodzi do X');
    const cityY2 = { q: 8, r: 0, pop: 3, level: 1, ownerId: 1 };
    eq(territoryOwnerAt(3, 0, [cityY2].concat(mkFort(ownedByY, 0, 'fort'))), 1, 'RF-14b: heks bez ulepszenia Y w pierscieniu fortu -> miasto Y (1)');
  }
  console.log('\n--- RF-wiele fortow roznych cywilizacji (zarzut 6) ---');
  {
    // Fort A (gracz 0, wczesniej: turn 1 seq 0) na (0,0) z ulepszeniem na (2,0); fort B (AI 2, pozniej: turn 2 seq 1) na (4,0).
    // Miasto AI 1 na (9,0) pop 10 (zasieg 10).
    const fA = { q: 0, r: 0, ownerId: 0, type: 'fort', builtAtTurn: 1, seq: 0 };
    const fB = { q: 4, r: 0, ownerId: 2, type: 'fort', builtAtTurn: 2, seq: 1 };
    const predA = (q, r, o) => o === 0 && q === 2 && r === 0;
    const predB = (q, r, o) => o === 2 && q === 2 && r === 0;
    const nodes = [{ q: 9, r: 0, pop: 10, level: 1, ownerId: 1 }]
      .concat(FT.fortTerritoryNodes([fA, fB], () => (q, r, o) => predA(q, r, o) || predB(q, r, o)));
    eq(territoryOwnerAt(2, 0, nodes), 0, 'RF-15: sporny heks (2,0) z ulepszeniem wczesniejszego fortu A -> A (0)');
    eq(territoryOwnerAt(3, 0, nodes), 1, 'RF-15b: heks (3,0) bez ulepszenia w zasiegu miasta AI -> miasto AI (1)');
    const pads = [];
    for (let k = 0; k < 12; k++) pads.push({ q: 20 + k, r: 20, pop: 1, level: 1, ownerId: 3 });
    const padded = nodes.concat(pads);
    const lk = M.territoryOwnerLookup(padded);
    eq(lk(2, 0), territoryOwnerAt(2, 0, padded), 'RF-15c: lookup (>=12 wezlow) zgodny z territoryOwnerAt na sporny heks');
    eq(lk(3, 0), territoryOwnerAt(3, 0, padded), 'RF-15d: lookup zgodny z territoryOwnerAt na heks bez ulepszenia');
    eq(lk(2, 0), territoryOwnerAt(2, 0, nodes.concat([])) , 'RF-15c: lookup zgodny z territoryOwnerAt na sporny heks');
  }
  // Mutacja kopii: stara regula (bez predykatu) oddaje stadnine miastu AI -> RF-1 czerwony.
  const mutNodes = [city].concat(mkFort(undefined));
  assert(territoryOwnerAt(2, 0, mutNodes) === 1, 'RF-M1: mutacja (bez ochrony ulepszen) oddaje stadnine miastu AI -> RF-1 czerwony');
  // Indeks zakresowy (>=12 wezlow) nie cacheuje wynikow zaleznych od ulepszen (predykat zywy).
  let flag = true;
  const dyn = [city].concat(mkFort((q, r, o) => flag && o === 0 && q === 2 && r === 0));
  const lk2 = M.territoryOwnerLookup(dyn);
  eq(lk2(2, 0), 0, 'RF-11: lookup przy ulepszeniu = gracz (0)');
  flag = false;
  eq(lk2(2, 0), territoryOwnerAt(2, 0, dyn), 'RF-12: lookup po usunieciu ulepszenia zgodny z territoryOwnerAt (brak cache)');
  eq(lk2(2, 0), 1, 'RF-13: po usunieciu ulepszenia (2,0) -> miasto AI (1)');
  // RF-16: granica promienia fortu (r=5): ulepszenie wlasciciela fortu na (5,0) (dist 5) -> fort (0);
  // heks (6,0) (dist 6, poza fortem) nie jest chroniony -> miasto AI (1).
  const edgeNodes = [city].concat(mkFort((q, r, o) => o === 0 && q === 5 && r === 0));
  eq(territoryOwnerAt(5, 0, edgeNodes), 0, 'RF-16: ulepszenie na granicy promienia fortu (5,0) -> fort gracza (0)');
  eq(territoryOwnerAt(6, 0, edgeNodes), 1, 'RF-16b: heks (6,0) poza promieniem fortu -> miasto AI (1)');
  // RF-17: rejestr wlasciciela - ulepszenie STAREGO MIASTA (owner 1) w pierscieniu fortu gracza (0) zostaje przy miescie AI.
  const ownerMap = new Map([['2,0', 1]]);
  const cityOwnedImp = [city].concat(mkFort((q, r, o) => ownerMap.get(q + ',' + r) === o && o === 0));
  eq(territoryOwnerAt(2, 0, cityOwnedImp), 1, 'RF-17: ulepszenie miasta AI (owner 1) w pierscieniu fortu gracza -> miasto AI (1)');
  // RF-18: straznik main.ts - rejestr wlascicieli zapisany w meta, predykat podpiety per fort, brak surowych zapisow placedImprovements.
  const mainSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
  assert(/improvementOwners: Array\.from\(improvementOwnerByHex\.entries\(\)\)/.test(mainSrc), 'RF-18a: zapis meta.improvementOwners');
  assert(/fortTerritoryNodes\(fortNodes, f => \(fortRingHasImprovement\(f\) \? improvedByFortOwner : undefined\)\)/.test(mainSrc), 'RF-18b: predykat podpiety per fort z ulepszeniem w pierscieniu');
  const rawWrites = (mainSrc.match(/placedImprovements\.(set|delete|clear)\(/g) || []).length;
  eq(rawWrites, 3, 'RF-18c: surowe zapisy placedImprovements tylko w helperach (set/delete/clear = 3)');
}

console.log(`\n=== city-founding-no-fort-takeover-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
