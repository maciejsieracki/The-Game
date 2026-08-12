'use strict';
/**
 * building-tech-gate-test.cjs -- P-TARGOWISKO-BLEDNA-BRAMKA-BADAN (2026-08-12)
 * Run: cd gra && node tools/building-tech-gate-test.cjs
 *
 * BUG: karta budynku Targowisko (Rynek) w panelu miasta pokazywala sekcje
 * "WYMAGANE BADANIA" na czerwono (niespelnione) mimo ze gracz mial zbadane
 * WSZYSTKIE wymagane technologie (Garncarstwo + Rolnictwo + Oswojenie zwierzat,
 * a takze sam tech "Wymiana", ktory Targowisko wprost odblokowuje -- pole
 * buildings.json targowisko.techUnlock === "Wymiana").
 *
 * PRZYCZYNA (src/ui/cityPanel.ts, funkcja lokalna techPrereqChain -- NIE mylic
 * z techPrereqChain w src/game/tech-tree.ts, ktora jest osobna funkcja o innym
 * przeznaczeniu -- "glowna os" liniowego podgladu drzewka, celowo idzie tylko
 * pierwszym prereq, tam to poprawne uzycie):
 *
 *   Stary kod (PRZED naprawa):
 *     function techPrereqChain(data, techName) {
 *       const chain = [];
 *       let cur = techName.trim();
 *       const seen = new Set();
 *       while (cur && !isEmptyDataVal(cur) && !seen.has(cur)) {
 *         seen.add(cur);
 *         chain.unshift(cur);
 *         const t = getTechDef(data, cur);
 *         const prereq = t?.['Wymaga (prereq)'];
 *         if (!prereq || isEmptyDataVal(prereq)) break;
 *         cur = String(prereq).trim();   // <-- BUG: cale pole "A + B + C" jako JEDNA nazwa
 *       }
 *       return chain;
 *     }
 *
 *   Pole "Wymaga (prereq)" tech.json bywa lista zlaczona "+" (dla "Wymiana":
 *   "Garncarstwo + Rolnictwo + Oswojenie zwierzat"). Stary kod NIE rozbijal
 *   tego napisu (brak .split('+') / parsePrerequisites) -- traktowal caly
 *   napis jako JEDNA nazwe technologii i wstawial ja do lancucha. getTechDef()
 *   nigdy takiej "technologii" nie znajdowal (bo to nie jest realna nazwa w
 *   tech.json), wiec ten sztuczny wpis nigdy nie mogl trafic do zbioru
 *   zbadanych (unlockedTechs) -- lancuch dla "Wymiana" wychodzil
 *   ["Garncarstwo + Rolnictwo + Oswojenie zwierzat", "Wymiana"], a
 *   missingTechSteps() zawsze zwracal ten pierwszy (fikcyjny) wpis jako
 *   brakujacy -- karta budynku byla czerwona NA ZAWSZE, niezaleznie od tego,
 *   co gracz naprawde zbadal.
 *
 *   Silnik badan (src/game/research.ts, parsePrerequisites) ten sam napis
 *   rozbija poprawnie na ["Garncarstwo","Rolnictwo","Oswojenie zwierzat"] --
 *   od dawna uzywany przez logike odblokowywania technologii. Bug byl WYLACZNIE
 *   w UI (cityPanel.ts mial WLASNA, osobna, blednie napisana kopie funkcji
 *   lancucha zamiast reuzywac parsePrerequisites).
 *
 * NAPRAWA: techPrereqChain w cityPanel.ts przepisana na rekurencyjne DFS
 * uzywajace prawdziwego parsePrerequisites (import z '../game/research'),
 * odwiedzajace KAZDA galaz AND (nie tylko pierwsza).
 *
 * SKALA: bug dotyczyl NIE TYLKO Targowiska -- kazdy tech z wieloczlonowym
 * prereq (17 wpisow w dzisiejszym tech.json: Wymiana, Brazownictwo, Pismo,
 * Religia, Jezdziectwo, Matematyka, Handel, Kodeks, Budownictwo, Waluta,
 * Astronomia, Oblezenictwo, Filozofia, Prawo, Drogi brukowane, Obrobka
 * zelaza, Sztuka wojenna) i kazdy budynek, ktory taki tech wymaga (wprost
 * lub przez lancuch), mial ten sam problem. Test [4] sprawdza to systemowo,
 * nie tylko punktowo dla Targowiska.
 *
 * DLACZEGO REGEX + REIMPLEMENTACJA, NIE PELNY IMPORT Z cityPanel.ts:
 * cityPanel.ts (>10 000 linii) transitywnie importuje src/ui/icons/brandAssets.ts,
 * ktory na poziomie MODULU wola `import.meta.glob(...)` -- w bundlu esbuild/cjs
 * (wymaganym zeby uruchomic TS w node bez Vite) ta linia rzuca
 * `TypeError: import_meta.glob is not a function` natychmiast przy require(),
 * zanim jakikolwiek test zdazy wywolac funkcje. Ten sam, juz udokumentowany w
 * CLAUDE.md defekt harnessu co w map-field-battle-test.cjs / pre-battle-save-test.cjs.
 * Ten sam wzor pragmatyczny co juz przyjety w city-panel-growth-percent-separator-test.cjs
 * i heks-plony-zloze-parytet-ui-test.cjs: [1] regexem PRZYPINAMY dokladna tresc
 * naprawionej funkcji w zrodle (chroni przed cichym cofnieciem), [2] wolamy
 * PRAWDZIWY, bundlowalny parsePrerequisites (research.ts -- czysty modul, bez DOM)
 * i realne dane z data/tech.json + data/buildings.json, [3] reimplementujemy
 * TYLKO szkielet petli DFS (identyczny z naprawionym kodem), zeby dowiesc
 * zachowania end-to-end bez importu calego pliku UI.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const CITY_PANEL_SRC = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
const ENTRY = path.join(__dirname, '.building-tech-gate-entry.ts');
const BUNDLE = path.join(__dirname, '.building-tech-gate-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { parsePrerequisites } from '../src/game/research';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[building-tech-gate-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(got, want, msg) {
  assert(
    JSON.stringify(got) === JSON.stringify(want),
    `${msg} (got=${JSON.stringify(got)} want=${JSON.stringify(want)})`,
  );
}

console.log('building-tech-gate-test (P-TARGOWISKO-BLEDNA-BRAMKA-BADAN)\n');

// --- [1] PRZYPIETA LOKALIZACJA -- naprawiony kod faktycznie w cityPanel.ts -------------------
console.log('[1] cityPanel.ts: techPrereqChain uzywa parsePrerequisites (nie surowego stringa)');
const src = fs.readFileSync(CITY_PANEL_SRC, 'utf8');

assert(
  /import\s*\{\s*parsePrerequisites\s*\}\s*from\s*['"]\.\.\/game\/research['"]/.test(src),
  "cityPanel.ts importuje parsePrerequisites z '../game/research'",
);

const fnMatch = src.match(/function techPrereqChain\(data: GameData, techName: string\): string\[\] \{[\s\S]*?\n\}/);
assert(fnMatch !== null, 'znaleziono definicje techPrereqChain(data, techName) w cityPanel.ts');
if (fnMatch) {
  const body = fnMatch[0];
  assert(
    /parsePrerequisites\(String\(prereqRaw\)\)/.test(body),
    'cialo funkcji faktycznie woła parsePrerequisites(...) na polu prereq (rozbija AND-liste)',
  );
  assert(
    /for \(const p of parsePrerequisites/.test(body),
    'petla odwiedza KAZDY prereq z rozbitej listy (nie tylko pierwszy)',
  );
  assert(
    !/cur = String\(prereq\)\.trim\(\);/.test(body),
    'stary wzorzec „cur = String(prereq).trim()” (caly napis jako 1 nazwa techu) ZNIKNAL',
  );
  // N2 (Evaluator 7b02eb2d): nie wystarczy, ze cialo woła parsePrerequisites na
  // TOP-LEVEL techName -- plaski, jednopoziomowy split (bez rekurencji) tez by
  // przeszedl powyzsze asercje, a nie rozwijalby lancucha GLEBIEJ niz 1 poziom
  // (np. Hutnictwo zelaza -> Brazownictwo -> Garncarstwo/Murarstwo/Obrobka drewna).
  // Ta asercja przypina, ze funkcja wewnetrzna `visit` WOLA SAMA SIEBIE na kazdym
  // rozbitym prereq (`visit(p)` w petli `for (const p of parsePrerequisites(...))`),
  // czyli rozwijanie jest REKURENCYJNE, nie tylko jednopoziomowe.
  // EN: it is not enough that the body calls parsePrerequisites on the TOP-LEVEL
  // techName -- a flat, single-level split (no recursion) would pass the assertions
  // above too, without expanding the chain deeper than 1 level. This assertion pins
  // that the inner `visit` function calls ITSELF on every split prereq (`visit(p)`
  // inside the `for (const p of parsePrerequisites(...))` loop), i.e. expansion is
  // RECURSIVE, not merely one level flat.
  assert(
    /function visit\([\s\S]*?\bvisit\(p\)/.test(body),
    'rozwijanie jest REKURENCYJNE (visit woła siebie na każdym prereq) — płaski split nie wystarczy',
  );
}

// --- [2] DANE -- Targowisko i tech.json bez literowek ----------------------------------------
console.log('\n[2] dane: buildings.json / tech.json bez rozjazdu ID (literowka byla by inna przyczyna)');
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const techRoot = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));
const techs = techRoot.technologie;
const techByName = new Map(techs.map(t => [t.Technologia, t]));

const targowisko = buildings.find(b => b.id === 'targowisko');
assert(targowisko !== undefined, "buildings.json zawiera budynek id=\"targowisko\"");
eq(targowisko && targowisko.techUnlock, 'Wymiana', 'Targowisko.techUnlock === "Wymiana" (dokladnie, bez literowki)');

const wymiana = techByName.get('Wymiana');
assert(wymiana !== undefined, 'tech.json zawiera technologie "Wymiana"');
eq(
  M.parsePrerequisites(wymiana && wymiana['Wymaga (prereq)']),
  ['Garncarstwo', 'Rolnictwo', 'Oswojenie zwierząt'],
  'parsePrerequisites("Wymiana".prereq) rozbija AND-liste na 3 realne nazwy techow',
);
for (const nazwa of ['Garncarstwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Wymiana']) {
  assert(techByName.has(nazwa), `tech.json ma wpis Technologia="${nazwa}" (bez literowki)`);
}

// Dokumentuje przyczyne: stary kod szukalby technologii o nazwie calego,
// zlaczonego "+" wyrazenia -- taka "technologia" nigdy nie istnieje.
assert(
  !techByName.has('Garncarstwo + Rolnictwo + Oswojenie zwierząt'),
  'zlozony napis prereq NIE jest realna nazwa technologii w tech.json (to byl korzen bledu)',
);

// --- [3] REIMPLEMENTACJA NAPRAWIONEGO ALGORYTMU -- lancuch + ocena spelnienia ----------------
console.log('\n[3] naprawiony techPrereqChain: Targowisko/Wymiana -- lancuch i „met” po zbadaniu wszystkiego');

/** Wierna reimplementacja naprawionej petli z cityPanel.ts (rekurencja + parsePrerequisites). */
function techPrereqChainFixed(techName) {
  const chain = [];
  const seen = new Set();
  function isEmpty(v) {
    return v == null || v === '' || v === '—' || v === '-';
  }
  function visit(name) {
    const trimmed = String(name).trim();
    if (!trimmed || isEmpty(trimmed) || seen.has(trimmed)) return;
    seen.add(trimmed);
    const t = techByName.get(trimmed);
    const prereqRaw = t && t['Wymaga (prereq)'];
    if (prereqRaw && !isEmpty(prereqRaw)) {
      for (const p of M.parsePrerequisites(String(prereqRaw))) visit(p);
    }
    chain.push(trimmed);
  }
  visit(techName);
  return chain;
}
function missingSteps(techName, unlockedSet) {
  return techPrereqChainFixed(techName).filter(t => !unlockedSet.has(t));
}

const wymianaChain = techPrereqChainFixed('Wymiana');
eq(
  [...wymianaChain].sort(),
  ['Garncarstwo', 'Oswojenie zwierząt', 'Rolnictwo', 'Wymiana'].sort(),
  'lancuch dla "Wymiana" = dokladnie {Garncarstwo, Rolnictwo, Oswojenie zwierząt, Wymiana} (bez sztucznego wpisu "+")',
);
assert(wymianaChain.indexOf('Wymiana') === wymianaChain.length - 1, 'sam tech docelowy ("Wymiana") jest ostatni w lancuchu');

// Scenariusz ZGLOSZENIA: gracz ma zbadane WSZYSTKIE 4 -- karta MUSI byc zielona (met=true).
const wszystkoZbadane = new Set(['Garncarstwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Wymiana']);
eq(missingSteps('Wymiana', wszystkoZbadane), [], 'po zbadaniu wszystkich 4 -- missingSteps() PUSTE (chip Targowiska = zielony)');

// Regresja bramki: brakuje TYLKO "Rolnictwo" (i w konsekwencji "Wymiana") -- MUSI zostac czerwona.
const brakRolnictwa = new Set(['Garncarstwo', 'Oswojenie zwierząt']);
const stepsBrakRolnictwa = missingSteps('Wymiana', brakRolnictwa);
assert(stepsBrakRolnictwa.includes('Rolnictwo'), 'brak "Rolnictwo" w zbadanych -> missingSteps() je wymienia (gate nadal dziala)');
assert(stepsBrakRolnictwa.length > 0, 'brak jednego z wymogow -> chip Targowiska pozostaje czerwony (nie zawsze-zielony)');

// --- [4] SKALA -- KAZDY tech z AND-prereq w dzisiejszym drzewku, nie tylko Wymiana ------------
console.log('\n[4] systemowo: wszystkie techy z wieloczlonowym prereq -- po zbadaniu calego lancucha, missingSteps=[]');
const andTechs = techs.filter(t => {
  const p = t['Wymaga (prereq)'];
  return typeof p === 'string' && p.includes('+');
});
assert(andTechs.length >= 10, `co najmniej 10 technologii z AND-prereq w tech.json (dzis: ${andTechs.length})`);

for (const t of andTechs) {
  const chain = techPrereqChainFixed(t.Technologia);
  // Sztuczny wpis "+" nigdy nie moze wyladowac w lancuchu (dowod ze fix dziala tez dla innych techow).
  assert(
    chain.every(name => !name.includes(' + ')),
    `${t.Technologia}: lancuch nie zawiera zlaczonego "+" wpisu (zaden krok = ${JSON.stringify(chain.find(n => n.includes(' + ')))})`,
  );
  const allResearched = new Set(chain);
  eq(
    missingSteps(t.Technologia, allResearched),
    [],
    `${t.Technologia}: po zbadaniu calego lancucha (${chain.length} techow) -- missingSteps() puste`,
  );
}

// Budynki dotkniete AND-prereqem -- NIE TYLKO te z techUnlock BEZPOSREDNIO w AND-tech
// (np. Targowisko -> Wymiana), ale i te, ktorych PELNY lancuch prereqow (przez
// techPrereqChainFixed) PRZECHODZI przez jakis AND-tech gdzies wyzej (np.
// odlewnia_zelaza -> techUnlock="Hutnictwo żelaza" -> prereq "Brązownictwo" (AND) ->
// "Garncarstwo + Murarstwo + Obróbka drewna"). Filtr WYLACZNIE po b.techUnlock
// bezposrednio w andTechNames (N1, Evaluator 7b02eb2d) pomijal 7 takich budynkow,
// ktore przed naprawa mialy karte trwale czerwona identycznie jak Targowisko --
// stary blad w techPrereqChain psul KAZDY poziom lancucha, nie tylko najblizszy.
// EN: buildings affected by an AND-prereq -- NOT ONLY those with techUnlock DIRECTLY
// in AND-tech (e.g. Targowisko -> Wymiana), but also those whose FULL prereq chain
// (via techPrereqChainFixed) PASSES THROUGH an AND-tech somewhere upstream (e.g.
// odlewnia_zelaza -> techUnlock="Hutnictwo żelaza" -> prereq "Brązownictwo" (AND) ->
// "Garncarstwo + Murarstwo + Obróbka drewna"). Filtering ONLY on b.techUnlock being
// directly in andTechNames (N1, Evaluator 7b02eb2d) skipped 7 such buildings, which
// before the fix had a permanently red card exactly like Targowisko -- the old bug in
// techPrereqChain broke EVERY level of the chain, not just the nearest one.
console.log('\n[5] budynki, ktorych PELNY lancuch prereqow zawiera AND-tech (bezposrednio lub przez lancuch) -- chip „met” po zbadaniu calosci');
const andTechNames = new Set(andTechs.map(t => t.Technologia));
const affectedBuildings = buildings.filter(b => {
  if (!b.techUnlock) return false;
  const chain = techPrereqChainFixed(b.techUnlock);
  return chain.some(name => andTechNames.has(name));
});
assert(affectedBuildings.length >= 1, `co najmniej 1 budynek dotkniety AND-tech w lancuchu (dzis: ${affectedBuildings.length}, np. Targowisko)`);
// N1 (Evaluator 7b02eb2d): dowod ze rozszerzenie faktycznie objelo 7 budynkow
// posrednio dotknietych (nie tylko bezposrednio bramkowane techUnlock w AND-tech).
const posrednioDotknietyOczekiwane = [
  'odlewnia_zelaza', 'kuznia_zelaza', 'port_wielki', 'fort', 'baszta', 'koszary', 'laznia_publiczna',
];
const affectedIds = new Set(affectedBuildings.map(b => b.id));
for (const id of posrednioDotknietyOczekiwane) {
  assert(
    affectedIds.has(id),
    `budynek "${id}" jest ujety w [5] mimo ze jego techUnlock NIE jest bezposrednio AND-tech (lancuch przechodzi przez AND-tech wyzej)`,
  );
}
for (const b of affectedBuildings) {
  const chain = techPrereqChainFixed(b.techUnlock);
  const allResearched = new Set(chain);
  eq(
    missingSteps(b.techUnlock, allResearched),
    [],
    `budynek "${b.id}" (techUnlock="${b.techUnlock}"): po zbadaniu calego lancucha -- chip zielony`,
  );
}

console.log(`\n${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
