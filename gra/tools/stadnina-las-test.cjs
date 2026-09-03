'use strict';
/**
 * stadnina-las-test.cjs — BRAMKA TEMATU P-STADNINA-LAS-NIEROZSTRZYGNIETE-Q1.
 *
 * GOAL (ECHO właściciela 2026-09-03, dosłowna odpowiedź): „Stadnina, w przeciwieństwie do
 * wyżej wymienionych [owiec/bydła/lam], jest ulepszeniem surowcowym, więc nie może podlegać
 * takim samym zasadom jak owce, bydło i lamy, tylko takim jak tartak czy kopalnie. Jeżeli
 * symbol konia jest na lesie, to nie przeszkadza w tym, żeby tam postawić stadninę. Potem
 * można usunąć las i to też nie powinno usuwać stadniny. Stadnina jest niezależna od lasu,
 * jest tak samo czymś takim samym jak na przykład glinianka."
 *
 * KRYTERIA KOŃCA (00-dispatch.md), pilnowane niżej sekcja po sekcji:
 *   (1) Stadnina KWALIFIKUJE SIĘ do budowy na heksie Łąka/Równina z nakładką Las, gdy
 *       imperium ma odblokowany surowiec 'kon' (surowiecOdblokowany='kon') — DOKŁADNIE tam,
 *       gdzie dziś (przed poprawką) jest zablokowana.
 *   (2) Stadnina POSTAWIONA na zalesionym heksie PRZETRWA usunięcie lasu (dowolny mechanizm
 *       gry) — ŻYWY test, nie wniosek z lektury warunku budowy (reguła przeciw
 *       samooszukiwaniu, dispatch).
 *   (3) Regresja ZERO: owce/bydło/lama — zachowanie identyczne jak dziś (nadal podlegają
 *       regule lasu z 2026-07-29/2026-08-27, bez zmian w tym temacie).
 *   (4) Regresja ZERO: farma i R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1 (sprzątanie farm
 *       reliktowych) — nietknięte, nie zaczynają dotykać stadniny.
 *
 * Dowodem NIE jest grep po źródle, tylko POMIAR ZACHOWANIA realnymi funkcjami gry:
 *   • ścieżka GRACZA          -> buildImprovementQualifier (createQualifier/qualifies)
 *   • gate commitu            -> computeImprovementBuildImpact / isImprovementBlockedOnForest
 *   • odblokowanie imperialne -> computeEmpireLivestockUnlocks + isLivestockUnlockedForPlacement
 *                                (ŚCIEŻKA PRODUKCYJNA: stadnina na realnym złożu konia gdzie
 *                                indziej w imperium, NIE syntetyczna flaga)
 *   • usunięcie lasu (wyrąb)  -> stripImprovementsWhenForestRemoved (dokładnie ta funkcja,
 *                                którą woła main.ts::finalizeHexClearing/stripForestDependent-
 *                                Improvements po wyrębie)
 *   • sprzątanie farm         -> planLegacyFarmOnForestRemoval (kontrola: stadnina NIE jest
 *                                celem tego mechanizmu)
 *
 * Mutacyjny dowód nietautologiczności (wymóg §9 pkt 6a w duchu, choć temat nie jest
 * wizualny/UX): `git stash push -- src/map/improvement-build.ts data/terrain-improvements.json`
 * na tej samej gałęzi z tym plikiem bramki NIEZMIENIONYM czerwieni test — zweryfikowane
 * ręcznie przez Operatora przed commitem (patrz raport rundy), nie jest tu automatyzowane bo
 * wymagałoby dodatkowej infrastruktury (drugi bundle „przed") ponad to, co dają już
 * `map-improvement-qualify-test.cjs`/`hodowla-las-test.cjs` (obie bramki zawierają już taki
 * dowód dla tego samego fixu).
 *
 * Uruchamiaj z gra/:  node tools/stadnina-las-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.stadnina-las-entry.ts');
const BUNDLE = path.resolve(__dirname, '.stadnina-las-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export {
  buildImprovementQualifier,
  isStadninaBlockedOnForest,
  isImprovementBlockedOnForest,
  computeImprovementBuildImpact,
  stripImprovementsWhenForestRemoved,
  planLegacyFarmOnForestRemoval,
  isOwceBaseTerrain,
} from ${JSON.stringify(SRC + '/map/improvement-build')};
export {
  computeEmpireLivestockUnlocks,
  isLivestockUnlockedForPlacement,
  hexHasHorseDeposit,
} from ${JSON.stringify(SRC + '/game/livestock-unlock')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, resolveExtensions: ['.ts', '.js', '.json'], logLevel: 'silent',
});

const M = require(BUNDLE);
const T = M.TerenBazowy;
const N = M.Nakladka;

let pass = 0, fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log(`  [OK] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}${extra !== undefined ? ' :: ' + JSON.stringify(extra) : ''}`); }
};

function mkHex(q, r, teren, nakladka = N.Brak, zloze, ulepszenia) {
  const h = {
    coords: { q, r },
    terenBazowy: teren,
    nakladka,
    zloze,
    rzeka: { obecna: false, krawedzie: [] },
    ulepszenie: 'brak',
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
  };
  if (ulepszenia) h.ulepszenia = ulepszenia;
  return h;
}

// =====================================================================================
// SETUP: mapa syntetyczna — złoże konia GDZIE INDZIEJ w imperium (już ze stadniną), plus
// heks docelowy Łąka+Las BEZ złoża — dokładnie scenariusz z ECHO właściciela („symbol konia
// jest na lesie" == imperium ma go odblokowanego, nie że akurat NA TYM heksie jest złoże).
// =====================================================================================
const DEPOSIT_HEX = mkHex(0, 0, T.Rownina, N.ZlozeKonia);
const FOREST_HEX = mkHex(5, 0, T.Laka, N.Las);
const FOREST_HEX_ROWNINA = mkHex(6, 0, T.Rownina, N.Las);
const OPEN_HEX = mkHex(7, 0, T.Laka);
const hexes = {
  '0,0': DEPOSIT_HEX,
  '5,0': FOREST_HEX,
  '6,0': FOREST_HEX_ROWNINA,
  '7,0': OPEN_HEX,
};
const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
const cityNodes = [{ q: 0, r: 0, pop: 10, level: 1 }];
const territoryNodes = Object.values(hexes).map(h => ({ q: h.coords.q, r: h.coords.r, pop: 10, level: 1, ownerId: 0 }));

// Imperium ma JUŻ stadninę na złożu konia — empireUnlocks.has('kon') liczony PRODUKCYJNIE
// przez computeEmpireLivestockUnlocks (main.ts robi dokładnie to samo w createQualifier).
const placedImprovements = new Map([['0,0', ['stadnina']]]);

function qual() {
  return M.buildImprovementQualifier({
    map, cityNodes, territoryNodes, playerOwnerIdNum: 0,
    playerCivArchetype: 'rzym', playerEra: 1, placedImprovements,
  });
}

console.log('\n--- (0) warunek istotnosci: imperium MA odblokowanego Konia ---');
const empireUnlocks = M.computeEmpireLivestockUnlocks(placedImprovements, map, null);
ok(empireUnlocks.has('kon'), 'computeEmpireLivestockUnlocks (SCIEZKA PRODUKCYJNA) odblokowuje kon ze zloza + stadniny');
ok(M.isLivestockUnlockedForPlacement('stadnina', FOREST_HEX, empireUnlocks),
  'isLivestockUnlockedForPlacement: stadnina bez zloza NA TYM hexie, ale imperium ma kon');

console.log('\n--- (1) KRYTERIUM 1: kwalifikacja budowy na Laka/Rownina + Las ---');
const q = qual();
ok(q('stadnina', 5, 0) === true,
  'GOAL 1: stadnina KWALIFIKUJE SIE na Laka+Las po odblokowaniu Konia (dzis zablokowana PRZED poprawka)');
ok(q('stadnina', 6, 0) === true,
  'GOAL 1: stadnina KWALIFIKUJE SIE tez na Rownina+Las (drugi kwalifikujacy teren bazowy)');
ok(q('stadnina', 7, 0) === true,
  'kontrola: stadnina nadal kwalifikuje sie na golej Lace (bez zmian pozytywnych)');
ok(M.computeImprovementBuildImpact('stadnina', FOREST_HEX, []) !== null,
  'GOAL 1: gate commitu (computeImprovementBuildImpact) NIE blokuje stadniny na lesie');
ok(M.isImprovementBlockedOnForest('stadnina', N.Las) === false,
  'GOAL 1 + GOAL 3: kanoniczny predykat lasu NIE blokuje stadniny (jak glinianka/tartak)');
ok(M.isStadninaBlockedOnForest('stadnina', N.Las) === false,
  'predykat historyczny stadniny zawsze false od tej rundy');

console.log('\n--- (2) KRYTERIUM 2: PRZETRWANIE po usunieciu lasu (zywy test, nie lektura kodu) ---');
// Symulacja DOKLADNIE tej sciezki co main.ts::finalizeHexClearing: (a) postaw stadnine na
// zalesionym hexie [budowa juz udowodniona w sekcji (1)], (b) zawolaj TA SAMA funkcje, ktora
// silnik woli po wyrebie (stripImprovementsWhenForestRemoved), (c) sprawdz stan PO.
const warstwyPrzedWyrebem = ['stadnina'];
ok(!M.isStadninaBlockedOnForest('stadnina', N.Las) /* build path juz sprawdzony wyzej */, 'kontrola: budowa przed wyrebem byla legalna (sekcja 1)');
const warstwyPoWyrebie = M.stripImprovementsWhenForestRemoved(warstwyPrzedWyrebem);
ok(warstwyPoWyrebie.includes('stadnina'),
  'GOAL 2: stadnina POZOSTAJE na hexie po zywej symulacji wyrebu (stripImprovementsWhenForestRemoved)');
ok(warstwyPoWyrebie.length === 1,
  'kontrola: wyrab nie dodaje ani nie usuwa nic innego z warstwy stadniny');
// Kontrola rozroznienia mechanizmow: obóz lowiecki (zalezny OD lasu) NADAL znika identycznie —
// dowod, ze poprawka nie "wylaczyla" calego mechanizmu wyrebu, tylko dolaczyla stadnine do
// listy NIEZALEZNYCH od lasu (jak tartak).
const mieszanePoWyrebie = M.stripImprovementsWhenForestRemoved(['stadnina', 'tartak', 'oboz_lowiecki', 'farma']);
ok(mieszanePoWyrebie.includes('stadnina'), 'GOAL 2 (mix): stadnina przetrwa wsrod innych warstw');
ok(mieszanePoWyrebie.includes('tartak'), 'kontrola: tartak przetrwa (kanon, niezmieniony)');
ok(mieszanePoWyrebie.includes('farma'), 'kontrola: farma NIE jest usuwana TA funkcja (osobny mechanizm, patrz sekcja 4)');
ok(!mieszanePoWyrebie.includes('oboz_lowiecki'), 'kontrola: oboz lowiecki NADAL znika (zalezny od lasu, temat go nie rusza)');

console.log('\n--- (3) KRYTERIUM 3: regresja ZERO na owce/bydlo/lama ---');
// Ten temat NIE dotyka R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1 — owce/bydlo/lama musza
// zachowac DOKLADNIE swoje dzisiejsze zachowanie (podlegaja regule lasu z 2026-07-29/08-27,
// nie zostaly przesuniete do zadnej innej kategorii przez ten fix).
ok(M.isImprovementBlockedOnForest('owce', N.Las) === false, 'kontrola: las nadal NIE blokuje owiec (bez zmian)');
ok(M.isImprovementBlockedOnForest('bydlo', N.Las) === false, 'kontrola: las nadal NIE blokuje bydla (bez zmian)');
ok(M.isImprovementBlockedOnForest('lama', N.Las) === false, 'kontrola: las nadal NIE blokuje lamy (bez zmian)');
ok(M.isOwceBaseTerrain(T.Wzgorza, N.Las) === true, 'kontrola: owce na Wzgorzu+Las bez zmian (regula terenu bazowego)');
ok(M.isStadninaBlockedOnForest('owce', N.Las) === false, 'kontrola: predykat historyczny stadniny nigdy nie lapal owiec');
ok(M.isStadninaBlockedOnForest('bydlo', N.Las) === false, 'kontrola: predykat historyczny stadniny nigdy nie lapal bydla');

console.log('\n--- (4) KRYTERIUM 4: regresja ZERO na farmie / sprzataniu reliktow ---');
ok(M.isImprovementBlockedOnForest('farma', N.Las) === true, 'kontrola: farma NADAL zabroniona na lesie (R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1 nietkniete)');
ok(M.computeImprovementBuildImpact('farma', FOREST_HEX, []) === null, 'kontrola: gate commitu farmy na lesie NADAL null');
// planLegacyFarmOnForestRemoval (R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1) sprzata WYLACZNIE
// farmy-relikty na lesie — stadnina na tym samym mechanizmie MUSI przetrwac nietknieta.
const hexMixLas = mkHex(9, 0, T.Laka, N.Las);
const hexesDoSprzatania = { '9,0': hexMixLas };
const placedMix = new Map([['9,0', ['stadnina', 'tartak']]]);
const raportSprzatania = M.planLegacyFarmOnForestRemoval(hexesDoSprzatania, placedMix);
ok(raportSprzatania.removed === 0,
  'kontrola: sprzatanie farm-reliktow NIE rusza hexa bez farmy (stadnina+tartak przetrwaja)');
ok(raportSprzatania.scanned === 1, 'kontrola: mechanizm faktycznie przeskanowal hex (nie 0 == falszywy pozytyw)');
const placedMixZFarma = new Map([['9,0', ['stadnina', 'farma']]]);
const raportZFarma = M.planLegacyFarmOnForestRemoval(hexesDoSprzatania, placedMixZFarma);
ok(raportZFarma.removed === 1, 'kontrola: sprzatanie NADAL usuwa farme-relikt na tym samym hexie');
ok(raportZFarma.changes[0] && raportZFarma.changes[0].after.includes('stadnina')
  && !raportZFarma.changes[0].after.includes('farma'),
  'GOAL 2+4: sprzatanie farmy NIE zabiera stadniny stojacej obok niej na tym samym hexie',
  raportZFarma.changes[0]);

console.log(`\nstadnina-las-test: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
