'use strict';
/**
 * hodowla-las-test.cjs — BRAMKA TEMATU R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1.
 *
 * GOAL: hodowla zwierzęca (owce, bydło/Trzoda, lama) przestaje być zakazana na heksie
 * z nakładką Las. Każda z trzech kwalifikuje się na lesie wg WŁASNEJ reguły terenu bazowego
 * (Wzgórza — owce, Łąka/Równina — bydło, Wzgórza/Góry — lama); reszta kwalifikacji bez zmian.
 * ECHO właściciela 2026-08-27: „Tak, odwracamy — wszystkie trzy" (uchyla zakaz z 2026-07-29).
 *
 * Dowodem NIE jest grep po źródle, tylko POMIAR ZACHOWANIA na obu ścieżkach budowy:
 *   • ścieżka GRACZA                 -> buildImprovementQualifier (createQualifier/qualifies)
 *   • ścieżka AUTOMATU i AI CYWILIZACJI -> pickAutoImprovements (ta sama funkcja dla obu:
 *                                       main.ts auto-manager miasta ORAZ ai.ts
 *                                       planCityImprovements -> pickAutoImprovements)
 *   • gate commitu (poza panelem)    -> computeImprovementBuildImpact / isImprovementBlockedOnForest
 *   • dane/CivPedia                  -> terrain-improvements.json (pole `warunek`/`teren`,
 *                                       renderowane przez ui/entityCards/improvementAdapter.ts)
 *
 * UWAGA na to, co ten temat świadomie ZOSTAWIA bez zmian (asercje kontrolne niżej):
 *   • `stadnina` NADAL zabroniona na lesie — wpadła w zakaz z 2026-07-29 pochodną definicji
 *     (`surowiecOdblokowany === 'kon'` ⊂ LIVESTOCK_SUROWIEC_KEYS), a ECHO właściciela objęło
 *     wyłącznie owce/bydło/lamę. Zdjęcie zakazu też ze stadniny byłoby czwartą, niezamówioną
 *     zmianą reguły terenu (§14).
 *   • `farma`/`irygacja`/`tarasy` — bez zmian (osobne, zamknięte tematy).
 *   • reguły terenu bazowego i bramka cywilizacji (lama = tylko Inkowie; Nowy Świat: bydło/owce
 *     od epoki 3) — bez zmian.
 *
 * Uruchamiaj z gra/:  node tools/hodowla-las-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.HODOWLA_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.hodowla-las-entry.ts');
const BUNDLE = path.resolve(__dirname, '.hodowla-las-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export {
  buildImprovementQualifier,
  galleryTerrainEligible,
  isOwceBaseTerrain,
  isStadninaBlockedOnForest,
  isImprovementBlockedOnForest,
  getImprovementForestBlockHint,
  computeImprovementBuildImpact,
  stripImprovementsWhenForestRemoved,
} from ${JSON.stringify(SRC + '/map/improvement-build')};
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
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
  else { fail++; console.log(`  [FAIL] ${name}${extra ? ' :: ' + extra : ''}`); }
};

const TECHS = new Set([
  'lowiectwo', 'Łowiectwo', 'rolnictwo', 'Rolnictwo', 'Oswojenie zwierząt', 'hodowla', 'Hodowla',
  'jezdziectwo', 'Jeździectwo', 'gornictwo', 'Górnictwo', 'ceramika', 'Ceramika',
  'budownictwo', 'Budownictwo', 'stolarstwo', 'Stolarstwo', 'irygacja', 'Irygacja', 'tarasy',
]);

function mkHex(q, r, teren, nakladka = N.Brak, zloze) {
  return {
    coords: { q, r },
    terenBazowy: teren,
    nakladka,
    zloze,
    rzeka: { obecna: false, krawedzie: [] },
    ulepszenie: 'brak',
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
  };
}

/**
 * Terytorium gracza = CAŁA mapa (izolujemy regułę terenu od reguły zasięgu miasta).
 *
 * `tradeRouteKonUnlocked: true` daje imperialne odblokowanie Konia — BEZ niego stadnina nie
 * kwalifikuje się NIGDZIE poza heksem ze złożem konia, więc każda asercja „stadnina NIE na
 * lesie" byłaby TAUTOLOGICZNA (przechodziłaby z powodu braku odblokowania, nie z powodu lasu).
 * Z odblokowaniem stadnina kwalifikuje się na każdej Łące/Równinie i jedynym powodem jej
 * nieobecności na zalesionym heksie jest zakaz lasu — dokładnie to, co ta bramka ma pilnować.
 */
function stateForWholeMap(map, civ, era, placed) {
  const nodes = [];
  for (const k of Object.keys(map.hexes)) {
    const h = map.hexes[k];
    if (!h) continue;
    nodes.push({ q: h.coords.q, r: h.coords.r, ownerId: 0, cityId: 'c0' });
  }
  return {
    map,
    cityNodes: [{ q: 0, r: 0, pop: 9, level: 5 }],
    territoryNodes: nodes,
    playerOwnerIdNum: 0,
    placedImprovements: placed || new Map(),
    researchedTechs: TECHS,
    playerCivArchetype: civ,
    playerEra: era,
    tradeRouteKonUnlocked: true,
  };
}

// =====================================================================================
// (1) PREDYKATY TERENU — reguła w izolacji
// =====================================================================================
console.log('\n--- (1) predykaty terenu ---');
ok(M.isOwceBaseTerrain(T.Wzgorza, N.Las) === true, 'owce: Wzgorza + Las DOZWOLONE (zakaz cofniety)');
ok(M.isOwceBaseTerrain(T.Wzgorza, N.Brak) === true, 'owce: gole Wzgorza bez zmian');
ok(M.isOwceBaseTerrain(T.Wzgorza, N.ZlozeOwiec) === true, 'owce: zloze owiec bez zmian');
ok(M.isOwceBaseTerrain(T.Wzgorza, N.ZlozeGliny) === false, 'owce: inna nakladka NADAL blokuje');
ok(M.isOwceBaseTerrain(T.Laka, N.Las) === false, 'owce: Las na Lace to nie Wzgorza (teren bazowy rzadzi)');
ok(M.isOwceBaseTerrain(T.Gory, N.Las) === false, 'owce: Las w Gorach nie kwalifikuje');

ok(M.isImprovementBlockedOnForest('owce', N.Las) === false, 'las NIE blokuje owiec');
ok(M.isImprovementBlockedOnForest('bydlo', N.Las) === false, 'las NIE blokuje bydla');
ok(M.isImprovementBlockedOnForest('lama', N.Las) === false, 'las NIE blokuje lamy');

// Kontrola: to, czego temat NIE rusza.
ok(M.isImprovementBlockedOnForest('stadnina', N.Las) === true, 'KONTROLA: stadnina NADAL blokowana na lesie');
ok(M.isStadninaBlockedOnForest('stadnina', N.Las) === true, 'KONTROLA: predykat stadniny dziala');
ok(M.isStadninaBlockedOnForest('stadnina', N.Brak) === false, 'KONTROLA: stadnina poza lasem nie blokowana');
ok(M.isStadninaBlockedOnForest('owce', N.Las) === false, 'KONTROLA: predykat stadniny nie lapie owiec');
ok(M.isImprovementBlockedOnForest('farma', N.Las) === true, 'KONTROLA: farma nadal zabroniona na lesie');
ok(M.isImprovementBlockedOnForest('irygacja', N.Las) === true, 'KONTROLA: irygacja nadal zabroniona');
ok(M.isImprovementBlockedOnForest('tarasy', N.Las) === true, 'KONTROLA: tarasy nadal zabronione');
ok(M.isImprovementBlockedOnForest('owce', N.Brak) === false, 'poza lasem predykat zawsze false');

// Podpowiedź blokady nie obiecuje już hodowli w lesie (martwy, kłamiący tekst usunięty).
const hintOwce = M.getImprovementForestBlockHint('owce');
ok(!hintOwce.includes('Obóz łowiecki') && !hintOwce.includes('obóz'),
  'hint blokady lasu nie odsyla juz hodowli do obozu lowieckiego', hintOwce);
ok(M.getImprovementForestBlockHint('stadnina').includes('wyrąb'),
  'hint dla stadniny radzi wyrab (poprawna rada — po wyrebie kwalifikuje sie)');

// =====================================================================================
// (2) ŚCIEŻKA GRACZA — qualifies() na mapie syntetycznej
// =====================================================================================
console.log('\n--- (2) sciezka gracza: buildImprovementQualifier ---');
const hexes = {
  '0,0': mkHex(0, 0, T.Laka),                 // miasto
  '1,0': mkHex(1, 0, T.Wzgorza, N.Las),       // owce + lama TAK
  '2,0': mkHex(2, 0, T.Laka, N.Las),          // bydlo TAK, owce/lama NIE
  '3,0': mkHex(3, 0, T.Rownina, N.Las),       // bydlo TAK
  '4,0': mkHex(4, 0, T.Gory, N.Las),          // lama TAK, owce/bydlo NIE
  '5,0': mkHex(5, 0, T.Pustynia, N.Las),      // nic z hodowli
  '6,0': mkHex(6, 0, T.Wzgorza),              // kontrola bez lasu: owce/lama TAK
  '7,0': mkHex(7, 0, T.Laka),                 // kontrola bez lasu: bydlo TAK
  '8,0': mkHex(8, 0, T.Pustynia),             // kontrola bez lasu: nic
};
const smap = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
const qRzym = M.buildImprovementQualifier(stateForWholeMap(smap, 'rzym', 5));
const qInka = M.buildImprovementQualifier(stateForWholeMap(smap, 'inkowie', 5));

ok(qRzym('owce', 1, 0) === true, 'GRACZ: owce na Wzgorzu Z LASEM');
ok(qRzym('bydlo', 2, 0) === true, 'GRACZ: bydlo na Lace Z LASEM');
ok(qRzym('bydlo', 3, 0) === true, 'GRACZ: bydlo na Rowninie Z LASEM');
ok(qInka('lama', 1, 0) === true, 'GRACZ: lama na Wzgorzu Z LASEM (Inkowie)');
ok(qInka('lama', 4, 0) === true, 'GRACZ: lama w Gorach Z LASEM (Inkowie)');

// Reguła terenu bazowego działa POD lasem tak samo jak bez lasu — nie jest zniesiona.
ok(qRzym('owce', 2, 0) === false, 'GRACZ: owce NIE na Lace z lasem (teren bazowy rzadzi)');
ok(qRzym('bydlo', 1, 0) === false, 'GRACZ: bydlo NIE na Wzgorzu z lasem');
ok(qInka('lama', 2, 0) === false, 'GRACZ: lama NIE na Lace z lasem');
ok(qRzym('bydlo', 5, 0) === false, 'GRACZ: bydlo NIE na Pustyni z lasem');
ok(qRzym('owce', 5, 0) === false, 'GRACZ: owce NIE na Pustyni z lasem');
ok(qRzym('lama', 1, 0) === false, 'GRACZ: lama NIE dla Rzymu (bramka cywilizacji bez zmian)');
ok(qRzym('stadnina', 7, 0) === true, 'KONTROLA GRACZ: stadnina NA golej Lace (warunek istotnosci)');
ok(qRzym('stadnina', 2, 0) === false, 'KONTROLA GRACZ: stadnina NIE na Lace z lasem');
ok(qRzym('farma', 7, 0) === true, 'KONTROLA GRACZ: farma NA golej Lace (warunek istotnosci)');
ok(qRzym('farma', 2, 0) === false, 'KONTROLA GRACZ: farma NIE na Lace z lasem');

// Kontrola „bez lasu bez zmian" — te same heksy bez nakładki.
ok(qRzym('owce', 6, 0) === true, 'GRACZ bez lasu: owce na golym Wzgorzu (bez zmian)');
ok(qRzym('bydlo', 7, 0) === true, 'GRACZ bez lasu: bydlo na golej Lace (bez zmian)');
ok(qInka('lama', 6, 0) === true, 'GRACZ bez lasu: lama na golym Wzgorzu (bez zmian)');
ok(qRzym('owce', 7, 0) === false, 'GRACZ bez lasu: owce NIE na Lace (bez zmian)');
ok(qRzym('bydlo', 8, 0) === false, 'GRACZ bez lasu: bydlo NIE na Pustyni (bez zmian)');

// Bramka epoki dla cywilizacji Nowego Świata (Inkowie) — NIE ruszona przez ten temat.
const qInkaE1 = M.buildImprovementQualifier(stateForWholeMap(smap, 'inkowie', 1));
ok(qInkaE1('owce', 1, 0) === false, 'KONTROLA: Inkowie epoka 1 — owce nadal zablokowane (Nowy Swiat)');
ok(qInkaE1('bydlo', 2, 0) === false, 'KONTROLA: Inkowie epoka 1 — bydlo nadal zablokowane');

// =====================================================================================
// (3) GATE COMMITU — computeImprovementBuildImpact (ścieżka omijająca panel budowy)
// =====================================================================================
console.log('\n--- (3) gate commitu: computeImprovementBuildImpact ---');
ok(M.computeImprovementBuildImpact('owce', hexes['1,0'], []) !== null, 'COMMIT: owce na Wzgorzu+Las przechodzi');
ok(M.computeImprovementBuildImpact('bydlo', hexes['2,0'], []) !== null, 'COMMIT: bydlo na Lace+Las przechodzi');
ok(M.computeImprovementBuildImpact('lama', hexes['4,0'], []) !== null, 'COMMIT: lama w Gorach+Las przechodzi');
ok(M.computeImprovementBuildImpact('owce', hexes['2,0'], []) === null, 'COMMIT: owce na Lace+Las nadal null');
ok(M.computeImprovementBuildImpact('stadnina', hexes['2,0'], []) === null, 'KONTROLA COMMIT: stadnina na lesie null');
ok(M.computeImprovementBuildImpact('farma', hexes['2,0'], []) === null, 'KONTROLA COMMIT: farma na lesie null');

// Współistnienie sektorów: tartak ('las') + hodowla ('hodowla') na tym samym zalesionym heksie.
const impOwceTartak = M.computeImprovementBuildImpact('owce', hexes['1,0'], ['tartak']);
ok(impOwceTartak !== null, 'COMMIT: owce obok tartaku na tym samym lesie');
ok(impOwceTartak && impOwceTartak.removedImprovements.length === 0, 'COMMIT: owce NIE zdejmuja tartaku');
ok(impOwceTartak && impOwceTartak.removesForest === false, 'COMMIT: budowa hodowli NIE usuwa lasu (bez wyrebu)');
const impOwceOboz = M.computeImprovementBuildImpact('owce', hexes['1,0'], ['oboz_lowiecki']);
ok(impOwceOboz !== null && impOwceOboz.removedImprovements.length === 0,
  'COMMIT: owce obok obozu lowieckiego (sektor lowiectwo != hodowla)');

// Wyrąb spod hodowli: hodowla NIE jest zależna od lasu, więc zostaje na heksie.
const poWyrebie = M.stripImprovementsWhenForestRemoved(['owce', 'bydlo', 'lama', 'tartak', 'oboz_lowiecki']);
ok(poWyrebie.includes('owce') && poWyrebie.includes('bydlo') && poWyrebie.includes('lama'),
  'WYRAB: hodowla zostaje po wyrebie (las nie jest jej warunkiem)');
ok(!poWyrebie.includes('oboz_lowiecki'), 'KONTROLA WYRAB: oboz lowiecki nadal znika po wyrebie');
ok(poWyrebie.includes('tartak'), 'KONTROLA WYRAB: tartak nadal zostaje po wyrebie');

// =====================================================================================
// (4) AUTOMAT MIASTA I AI CYWILIZACJI — pickAutoImprovements (jedna funkcja dla obu)
// =====================================================================================
console.log('\n--- (4) automat miasta + AI CYWILIZACJI: pickAutoImprovements ---');
// `pickAutoImprovements` nie zna pola `tradeRouteKonUnlocked`, ale liczy empireUnlocks z
// `placedImprovements` (computeEmpireLivestockUnlocks). Dokładamy więc do KAŻDEJ mapy heks ze
// złożem konia z już postawioną stadniną — imperium ma odblokowanego Konia, więc asercje
// „automat NIE stawia stadniny na lesie" przestają być tautologiczne (bez tego stadnina nie
// kwalifikowałaby się nigdzie poza złożem, niezależnie od lasu).
const KON_Q = 99, KON_R = 99;
function pickOn(hex, key, civ, era) {
  const konHex = mkHex(KON_Q, KON_R, T.Laka, N.ZlozeKonia);
  const one = {
    hexes: { [`${hex.coords.q},${hex.coords.r}`]: hex, [`${KON_Q},${KON_R}`]: konHex },
    riverPaths: [], startPositions: [],
  };
  const picks = M.pickAutoImprovements({
    cities: [{ id: 'c0', ownerId: 0, q: hex.coords.q, r: hex.coords.r, population: 1 }],
    ownerId: 0,
    map: one,
    territoryNodes: [
      { q: hex.coords.q, r: hex.coords.r, ownerId: 0, cityId: 'c0' },
      { q: KON_Q, r: KON_R, ownerId: 0, cityId: 'c0' },
    ],
    placedImprovements: new Map([[`${KON_Q},${KON_R}`, ['stadnina']]]),
    pracaAvailable: 100000,
    unlockedTechs: TECHS,
    pracaSurplusThreshold: 0,
    pracaBudgetPercent: 100,
    maxItemsPerCity: 5,
    skipWyrab: true,
    civArchetype: civ,
    playerEra: era,
    priorityOverride: [key],
  });
  return picks.some(p => p.key === key && p.q === hex.coords.q && p.r === hex.coords.r);
}
ok(pickOn(mkHex(0, 0, T.Wzgorza, N.Las), 'owce', 'rzym', 5) === true,
  'AUTOMAT/AI CYW: stawia owce na Wzgorzu Z LASEM');
ok(pickOn(mkHex(0, 0, T.Laka, N.Las), 'bydlo', 'rzym', 5) === true,
  'AUTOMAT/AI CYW: stawia bydlo na Lace Z LASEM');
ok(pickOn(mkHex(0, 0, T.Gory, N.Las), 'lama', 'inkowie', 5) === true,
  'AUTOMAT/AI CYW: stawia lame w Gorach Z LASEM');
ok(pickOn(mkHex(0, 0, T.Laka, N.Las), 'owce', 'rzym', 5) === false,
  'AUTOMAT/AI CYW: NIE stawia owiec na Lace z lasem (teren bazowy rzadzi)');
ok(pickOn(mkHex(0, 0, T.Laka), 'stadnina', 'rzym', 5) === true,
  'KONTROLA AUTOMAT/AI CYW: stawia stadnine na golej Lace (warunek istotnosci)');
ok(pickOn(mkHex(0, 0, T.Laka, N.Las), 'stadnina', 'rzym', 5) === false,
  'KONTROLA AUTOMAT/AI CYW: NIE stawia stadniny na lesie');
ok(pickOn(mkHex(0, 0, T.Laka), 'farma', 'rzym', 5) === true,
  'KONTROLA AUTOMAT/AI CYW: stawia farme na golej Lace (warunek istotnosci)');
ok(pickOn(mkHex(0, 0, T.Laka, N.Las), 'farma', 'rzym', 5) === false,
  'KONTROLA AUTOMAT/AI CYW: NIE stawia farmy na lesie');
ok(pickOn(mkHex(0, 0, T.Wzgorza), 'owce', 'rzym', 5) === true,
  'KONTROLA AUTOMAT/AI CYW bez lasu: owce na golym Wzgorzu (bez zmian)');

// =====================================================================================
// (5) TOOLTIP / GALERIA — galleryTerrainEligible (nie widzi nakładki; ma zostać bez zmian)
// =====================================================================================
console.log('\n--- (5) galeria/tooltip: galleryTerrainEligible bez zmian ---');
ok(M.galleryTerrainEligible('owce', T.Wzgorza) === true, 'galeria: owce na Wzgorzach');
ok(M.galleryTerrainEligible('owce', T.Laka) === false, 'galeria: owce nie na Lace');
ok(M.galleryTerrainEligible('bydlo', T.Laka) === true, 'galeria: bydlo na Lace');
ok(M.galleryTerrainEligible('bydlo', T.Wzgorza) === false, 'galeria: bydlo nie na Wzgorzach');
ok(M.galleryTerrainEligible('lama', T.Gory) === true, 'galeria: lama w Gorach');
ok(M.galleryTerrainEligible('lama', T.Pustynia) === false, 'galeria: lama nie na Pustyni');

// =====================================================================================
// (6) MAPA FAKTYCZNIE WYGENEROWANA — nie syntetyk
// =====================================================================================
console.log('\n--- (6) mapy z generateMap (3 ziarna) ---');
for (const seed of [90210, 777, 31415]) {
  const gmap = M.generateMap(36, 28, seed, 'kontynenty');
  const gq = M.buildImprovementQualifier(stateForWholeMap(gmap, 'inkowie', 5));
  let owceLas = 0, bydloLas = 0, lamaLas = 0, stadninaLas = 0, farmaLas = 0, lasHex = 0;
  let stadninaBezLasu = 0, farmaBezLasu = 0;
  for (const k of Object.keys(gmap.hexes)) {
    const h = gmap.hexes[k];
    if (!h) continue;
    const { q, r } = h.coords;
    if (h.nakladka !== N.Las) {
      if (gq('stadnina', q, r)) stadninaBezLasu++;
      if (gq('farma', q, r)) farmaBezLasu++;
      continue;
    }
    lasHex++;
    if (gq('owce', q, r)) owceLas++;
    if (gq('bydlo', q, r)) bydloLas++;
    if (gq('lama', q, r)) lamaLas++;
    if (gq('stadnina', q, r)) stadninaLas++;
    if (gq('farma', q, r)) farmaLas++;
  }
  console.log(`  seed ${seed}: lasHex=${lasHex} owce=${owceLas} bydlo=${bydloLas} lama=${lamaLas} stadnina=${stadninaLas} farma=${farmaLas} | bez lasu: stadnina=${stadninaBezLasu} farma=${farmaBezLasu}`);
  ok(lasHex > 0, `mapa ${seed}: sa heksy z lasem (warunek istotnosci)`);
  // Warunki istotnosci dla asercji kontrolnych nizej — inaczej „0 na lesie" bylo by prawda
  // z powodu braku odblokowania/terenu, a nie z powodu zakazu lasu.
  ok(stadninaBezLasu > 0, `mapa ${seed}: stadnina kwalifikuje sie POZA lasem (warunek istotnosci)`);
  ok(farmaBezLasu > 0, `mapa ${seed}: farma kwalifikuje sie POZA lasem (warunek istotnosci)`);
  ok(owceLas > 0, `mapa ${seed}: owce kwalifikuja sie na >0 heksach z lasem`);
  ok(bydloLas > 0, `mapa ${seed}: bydlo kwalifikuje sie na >0 heksach z lasem`);
  ok(lamaLas > 0, `mapa ${seed}: lama kwalifikuje sie na >0 heksach z lasem`);
  ok(stadninaLas === 0, `KONTROLA mapa ${seed}: stadnina na 0 heksach z lasem`);
  ok(farmaLas === 0, `KONTROLA mapa ${seed}: farma na 0 heksach z lasem`);
}

// =====================================================================================
// (7) DANE — terrain-improvements.json (źródło tekstu w CivPedii)
// =====================================================================================
console.log('\n--- (7) dane: terrain-improvements.json ---');
const data = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '..', 'data', 'terrain-improvements.json'), 'utf8'));
ok(!data.owce.warunek.includes('nakładka Las zabroniona)'),
  'JSON: owce.warunek nie stawia juz zakazu lasu jako warunku');
ok(data.owce.warunek.includes('COFNIĘTY') && data.owce.warunek.includes('2026-08-27'),
  'JSON: owce.warunek zachowuje slad decyzji (zakaz cofniety, data)');
ok(data.owce.warunek.includes('2026-07-29'),
  'JSON: owce.warunek nie wymazuje historii (data pierwotnego zakazu)');
ok(!data.owce.teren.includes('bez lasu'), 'JSON: owce.teren nie mowi juz „bez lasu"');
ok(data.bydlo.warunek.includes('2026-08-27'), 'JSON: bydlo.warunek ma slad cofniecia zakazu');
ok(data.lama.warunek.includes('2026-08-27'), 'JSON: lama.warunek ma slad cofniecia zakazu');
ok(data.stadnina.warunek.includes('NADAL zabroniona'),
  'KONTROLA JSON: stadnina.warunek mowi wprost, ze zakaz lasu ZOSTAJE');

console.log(`\nhodowla-las-test: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
