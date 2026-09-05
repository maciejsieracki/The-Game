'use strict';
/**
 * barbarzyncy-krazenie-test.cjs -- bramka tematu P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1.
 * Uruchamiaj z katalogu gra/:  node tools/barbarzyncy-krazenie-test.cjs
 *
 * ZGLOSZENIE (Evaluator A rundy 6 miast barbarzyncow, potwierdzone pomiarem w rundzie 7):
 * jednostka barbarzynska KRAZY miedzy >=2 niebronionymi miastami i NIGDY nie dochodzi do
 * bronionego. Stabilny cykl, bronione miasto nieosiagniete w 300 turach.
 *
 * ECHO WLASCICIELA (2026-09-05, WIAZACE): "NAPRAWIC -- barbarzynca ma dokonac wyboru i isc."
 * JEDNA regula na WSZYSTKICH poziomach trudnosci; warianty "naprawic tylko na normalnym" i
 * "zostawic jako ulge na latwym" zostaly jawnie odrzucone. SWIADOMIE przyjety skutek:
 * barbarzyncy sa grozniejsi na latwym poziomie -- to jest zamierzone, nie defekt.
 *
 * DLACZEGO OSOBNA BRAMKA, a nie tylko asercje w barb-city-behavior-test.cjs: tamten plik
 * testuje decyzje w skali 30-60 tur. Objaw ze zgloszenia to STABILNY CYKL -- rozpoznawalny
 * dopiero po dlugim biegu i po sprawdzeniu POWTARZALNOSCI STANU, nie po pojedynczej decyzji.
 * Ta bramka symuluje 300 tur i wykrywa cykl przez powtorzenie pary (pozycja, pamiec miast).
 *
 * SEKCJE:
 *   1-3. Rezimy 2 / 3 / 4 miast NIEBRONIONYCH + 1 BRONIONE, 300 tur, kazdy z czterech wariantow
 *        `difficulty` (easy / normal / hard / pominiety). Asercje: (a) zero powtorzen stanu
 *        (brak cyklu); (b) kazde niebronione miasto odwiedzone DOKLADNIE RAZ; (c) jednostka
 *        wydaje komende `attack` na bronione miasto w skonczonej liczbie tur.
 *   4.   JEDNA REGULA: logi komend dla easy/normal/hard/pominietego sa BIT-IDENTYCZNE we
 *        wszystkich trzech rezimach. To jest wykonawczy odpowiednik "brak warunku per trudnosc".
 *   5.   Dowod STRUKTURALNY (uzupelnienie sekcji 4, nie zamiennik): w naprawionym fragmencie
 *        wyboru celu w barbarians.ts nie ma zadnego odwolania do `difficulty`.
 *   6.   Rezim "niebronione OSIAGALNE + bronione NIEOSIAGALNE (inna wyspa)": jednostka NIE jest
 *        trwale zamrozona -- dostaje komendy. Zamknieta klasa bledu, ktora runda 6 wprowadzila
 *        (livelock -> trwale zamrozenie) i ktora ta naprawa moglaby powtorzyc, gdyby nie lista
 *        "ostatniej deski ratunku" w decideBarbarianMoves.
 *   7.   M2b -- etykietowanie terenu NIE ostrzejsze niz runtime (sciana Wzgorz, koszt 2).
 *   8.   M3 -- jednostka na terenie o nieskonczonym koszcie (Gory): `unitComp === undefined`,
 *        filtr skladowych pominiety CALKOWICIE, jednostka dostaje komende.
 *   9.   Dowody mutacyjne (self-check w podprocesie, mutacja na KOPII pliku z przywroceniem w
 *        `finally`): cofniecie warunku resetu, cofniecie bramki trudnosci, zaostrzenie
 *        etykietowania (M2b), cofniecie fallbacku `unitComp === undefined` (M3).
 *
 * REGULA PRZECIW SAMOOSZUKIWANIU (z dispatchu): mechanizm ma za soba 7 rund i w kazdej ktos
 * oglaszal go naprawionym. Zadna asercja tego pliku nie opiera sie na czytaniu kodu -- kazda
 * jest wynikiem REALNEGO WYKONANIA `decideBarbarianMoves` z bundla produkcyjnego zrodla.
 */

const fs = require('fs');
const path = require('path');

function hexDist(aq, ar, bq, br) {
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs((-aq - ar) - (-bq - br)));
}

// --- esbuild ---------------------------------------------------------------------------------
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = (() => {
  try { return require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[barbarzyncy-krazenie-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

// Katalog tymczasowy UNIKALNY per przebieg (R-PROC-AUTOBOT.md par.6: stala nazwa pod tmpdir dala
// juz w tym repo dwa potwierdzone falszywe wyniki -- falszywy zielony i falszywy czerwony).
const os = require('os');
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'barbarzyncy-krazenie-'));
const ENTRY_FILE = path.join(WORK_DIR, 'entry.ts');
const BUNDLE_FILE = path.join(WORK_DIR, 'bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  BARBARIAN_OWNER_ID, FALLBACK_BARB_PARAMS, decideBarbarianMoves,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/barbarians'))};
export { canUnitOccupyCityHex } from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/city-hex-movement'))};
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent',
  });
} catch (e) {
  console.error('[barbarzyncy-krazenie-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const { BARBARIAN_OWNER_ID, FALLBACK_BARB_PARAMS, decideBarbarianMoves, canUnitOccupyCityHex } = require(BUNDLE_FILE);

// --- tiny assertion framework ----------------------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// --- helpers ---------------------------------------------------------------------------------
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) hexes[`${q},${r}`] = {
    coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
    wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
  };
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
function barb(id, q, r, extra = {}) {
  return Object.assign({ id, ownerId: BARBARIAN_OWNER_ID, typeId: 'Wojownik', category: 'miecznik',
    q, r, ruch: 2, ruchLeft: 2 }, extra);
}
function enemy(id, q, r) {
  return { id, ownerId: 0, typeId: 'Hastati', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2 };
}
function city(id, q, r) { return { id, q, r, ownerId: 0, name: id }; }

const TURNS = 300;

/**
 * Symulacja `TURNS` tur na planszy: `nUndef` miast NIEBRONIONYCH (q=6,16,26,36, r=4) + jedno
 * BRONIONE (q=60, r=4). Jednostka startuje q=10 z `campId` wskazujacym na nieistniejacy oboz
 * (osierocona -> raidReady -> chaseRadius=Infinity) -- ten sam wzorzec, co sekcje 3c/6b/6d
 * barb-city-behavior-test.cjs. Ruch aplikowany REALNIE, bramkowany `canUnitOccupyCityHex`,
 * dokladnie tak jak main.ts aplikuje komendy barbarzyncow.
 *
 * WYKRYWANIE CYKLU: klucz stanu = pozycja jednostki + posortowana pamiec `clearedCityIds`.
 * To jest KOMPLETNY stan wejsciowy decyzji na tej statycznej planszy (miasta, wrogowie, mapa i
 * parametry sie nie zmieniaja), wiec powtorzenie klucza dowodzi cyklu o nieskonczonym okresie --
 * nie "podejrzenia cyklu". Odwrotnie: brak powtorzenia w 300 turach dowodzi, ze jednostka nie
 * krazy.
 */
function simulate(nUndef, difficulty) {
  const map = makeMap(70, 8);
  const undef = [];
  for (let i = 0; i < nUndef; i++) undef.push(city(`u${i + 1}`, 6 + i * 10, 4));
  const def = city('def', 60, 4);
  const cities = undef.concat([def]);
  const guard = enemy('guard', 60, 4);
  const unit = barb('bKrazenie', 10, 4, { campId: 'destroyed-camp' });
  const P = Object.assign({}, FALLBACK_BARB_PARAMS, { aggroRadius: 6 });

  const seen = new Map();
  const cmdLog = [];
  const arrivals = {}; const wasAt = {};
  for (const c of undef) { arrivals[c.id] = 0; wasAt[c.id] = false; }
  let attackTurn = -1, cyclePeriod = -1, cycleAt = -1, minDistDef = Infinity, idle = 0;

  for (let t = 0; t < TURNS; t++) {
    const cmd = decideBarbarianMoves([unit], [guard], cities, [], map, P, undefined, difficulty)[0];
    cmdLog.push(cmd ? (cmd.type === 'move' ? `m${cmd.toQ},${cmd.toR}` : cmd.type) : 'idle');
    if (!cmd) idle++;
    if (cmd && cmd.type === 'attack') { attackTurn = t; break; }
    if (cmd && cmd.type === 'move' && canUnitOccupyCityHex(unit.ownerId, cmd.toQ, cmd.toR, cities)) {
      unit.q = cmd.toQ; unit.r = cmd.toR;
    }
    const d = hexDist(unit.q, unit.r, def.q, def.r);
    if (d < minDistDef) minDistDef = d;
    for (const c of undef) {
      const near = hexDist(unit.q, unit.r, c.q, c.r) <= 1;
      if (near && !wasAt[c.id]) arrivals[c.id]++;
      wasAt[c.id] = near;
    }
    const key = `${unit.q},${unit.r}|${(unit.clearedCityIds ?? []).slice().sort().join('+')}`;
    if (cyclePeriod === -1 && seen.has(key)) { cyclePeriod = t - seen.get(key); cycleAt = seen.get(key); }
    if (!seen.has(key)) seen.set(key, t);
  }
  return { attackTurn, cyclePeriod, cycleAt, minDistDef, arrivals, idle, cmdLog, turns: cmdLog.length };
}

const DIFFS = ['easy', 'normal', 'hard', undefined];
const runs = {};
for (const n of [2, 3, 4]) for (const d of DIFFS) runs[`${n}|${d === undefined ? 'pominiety' : d}`] = simulate(n, d);

// ==============================================================================================
// 1-3. Rezimy 2 / 3 / 4 miast NIEBRONIONYCH + 1 BRONIONE, 300 tur, wszystkie warianty difficulty.
//      PRZED naprawa (zmierzone tym samym harnessem na commicie bazowym): normal/hard -- stabilny
//      cykl o okresie 20 / 44 / 66 tur, `attack` NIGDY, min. dystans do bronionego 45 / 34 / 24;
//      easy i difficulty pominiete -- jednostka parkowala przy pierwszym niebronionym miescie na
//      stale (okres 1), min. dystans 51 przez cale 300 tur.
// ==============================================================================================
for (const n of [2, 3, 4]) {
  const sekcja = n - 1;
  for (const d of DIFFS) {
    const label = d === undefined ? 'pominiety' : d;
    const r = runs[`${n}|${label}`];

    // (a) BRAK OSCYLACJI -- zero powtorzen pelnego stanu decyzji w calym biegu.
    eq(r.cyclePeriod, -1,
      `${sekcja} (${n} niebronionych, difficulty=${label}): ZERO powtorzen stanu (pozycja+pamiec) w ` +
      `${r.turns} turach -- brak cyklu. Cykl o okresie ${r.cyclePeriod} od tury ${r.cycleAt} oznaczalby ` +
      'krazenie ze zgloszenia wlasciciela');

    // (b) kazde niebronione miasto odwiedzone DOKLADNIE RAZ -- "dokonac wyboru i isc".
    for (const cid of Object.keys(r.arrivals)) {
      eq(r.arrivals[cid], 1,
        `${sekcja} (${n} niebronionych, difficulty=${label}): ${cid} odwiedzone DOKLADNIE RAZ ` +
        '-- powrot na juz sprawdzone miasto to wlasnie krazenie');
    }

    // (c) jednostka DOCIERA do bronionego miasta w skonczonej liczbie tur -- kryterium konca 1.
    assert(r.attackTurn >= 0,
      `${sekcja} (${n} niebronionych, difficulty=${label}): jednostka wydaje komende 'attack' na ` +
      `BRONIONE miasto w budzecie ${TURNS} tur (got attackTurn=${r.attackTurn}, min. dystans do ` +
      `bronionego=${r.minDistDef}) -- przed naprawa NIGDY, w zadnym z ${TURNS} tur`);
    assert(r.attackTurn >= 0 && r.attackTurn < TURNS,
      `${sekcja} (${n} niebronionych, difficulty=${label}): dotarcie miesci sie w budzecie ` +
      `(attackTurn=${r.attackTurn} < ${TURNS})`);
    eq(r.idle, 0,
      `${sekcja} (${n} niebronionych, difficulty=${label}): ZERO tur bez komendy po drodze ` +
      '-- naprawa nie zamienia krazenia na zamrozenie');
  }
}

// ==============================================================================================
// 4. JEDNA REGULA NA WSZYSTKICH POZIOMACH TRUDNOSCI (ECHO wlasciciela) -- dowod WYKONAWCZY.
//    Logi komend dla easy / normal / hard / difficulty pominietego musza byc BIT-IDENTYCZNE.
//    PRZED naprawa ta asercja byla czerwona w kazdym z trzech rezimow (easy szlo inna sciezka).
// ==============================================================================================
for (const n of [2, 3, 4]) {
  const base = runs[`${n}|normal`].cmdLog.join(';');
  for (const label of ['easy', 'hard', 'pominiety']) {
    assert(runs[`${n}|${label}`].cmdLog.join(';') === base,
      `4 (${n} niebronionych): log komend dla difficulty=${label} jest BIT-IDENTYCZNY z normal ` +
      `(${runs[`${n}|${label}`].turns} vs ${runs[`${n}|normal`].turns} tur) -- jedna regula, ` +
      'zero warunkow per trudnosc');
  }
}

// ==============================================================================================
// 5. Dowod STRUKTURALNY (uzupelnienie sekcji 4, NIE zamiennik -- sekcja 4 jest dowodem
//    wykonawczym): w kodzie wyboru celu w barbarians.ts, od `const skipDefenselessCities` do
//    `const nearestCity`, nie pada slowo `difficulty`. Chroni przed wprowadzeniem warunku per
//    trudnosc w przyszlosci przez fragment, ktory akurat nie zmienia zadnego z biegow wyzej.
// ==============================================================================================
{
  const src = fs.readFileSync(path.join(GRA_ROOT, 'src/game/barbarians.ts'), 'utf8');
  const start = src.indexOf('const skipDefenselessCities');
  const end = src.indexOf('const nearestCity = nearest(unit.q, unit.r, civCities);');
  assert(start !== -1 && end !== -1 && end > start,
    '5: fragment wyboru celu odnaleziony w barbarians.ts (od `const skipDefenselessCities` do `const nearestCity`)');
  if (start !== -1 && end !== -1 && end > start) {
    // Same LINIE KODU, bez komentarzy -- komentarze objasniaja USUNIETA bramke trudnosci i
    // sluszne jest, ze slowo `difficulty` w nich pada.
    const kod = src.slice(start, end).split('\n')
      .map(l => l.replace(/^\s*\/\/.*$/, '').trim())
      .filter(l => l.length > 0 && !l.startsWith('//'))
      .join('\n');
    assert(!/difficulty/.test(kod),
      '5: w liniach KODU fragmentu wyboru celu nie ma odwolania do `difficulty` -- jedna regula ' +
      `na wszystkich poziomach trudnosci (fragment ma ${kod.split('\n').length} linii kodu)`);
    assert(/skipDefenselessCities = true/.test(kod),
      '5: bramka trudnosci zastapiona stala (`skipDefenselessCities = true`), nie usunieta po cichu');
  }
}

// ==============================================================================================
// 6. Rezim "niebronione OSIAGALNE + bronione NIEOSIAGALNE (inna wyspa)". To jest ten sam rezim, w
//    ktorym runda 6 zamienila livelock na TRWALE zamrozenie (werdykt zbiorczy rundy 6, punkt 3).
//    Sama naprawa warunku resetu POWTORZYLABY ten blad (zmierzone: 287/300 tur bez komendy przy
//    2 niebronionych, 296/300 przy 1). Lista "ostatniej deski ratunku" w decideBarbarianMoves to
//    domyka. Asercja mowi tylko tyle, ile jest udowodnione: jednostka NIE jest trwale zamrozona.
//    Swiadomie NIE asercjonujemy tu "dociera do bronionego" -- ono jest NIEOSIAGALNE i zadna
//    naprawa tego nie zmieni; asercja "0 komend jest ok" tez sie tu nie pojawia, bo przypielaby
//    blad jako oczekiwane zachowanie.
// ==============================================================================================
for (const nUndef of [1, 2, 3]) {
  for (const d of ['easy', 'normal', 'hard']) {
    const map = makeMap(70, 5);
    for (let r = 0; r < 5; r++) map.hexes[`44,${r}`].terenBazowy = 'morze'; // twarda bariera
    const undef = [];
    for (let i = 0; i < nUndef; i++) undef.push(city(`u${i + 1}`, 6 + i * 10, 2));
    const def = city('d1', 50, 2);
    const cities = undef.concat([def]);
    const guard = enemy('g1', 50, 2);
    const unit = barb('bNieos', 10, 2, { campId: 'destroyed-camp' }); // raidReady -> krok 4 pominiety
    const P = Object.assign({}, FALLBACK_BARB_PARAMS, { aggroRadius: 6 });
    let idle = 0;
    for (let t = 0; t < TURNS; t++) {
      const cmd = decideBarbarianMoves([unit], [guard], cities, [], map, P, undefined, d)[0];
      if (!cmd) { idle++; continue; }
      if (cmd.type === 'attack') break;
      if (cmd.type === 'move' && canUnitOccupyCityHex(unit.ownerId, cmd.toQ, cmd.toR, cities)) {
        unit.q = cmd.toQ; unit.r = cmd.toR;
      }
    }
    eq(idle, 0,
      `6 (${nUndef} niebronione OSIAGALNE + 1 bronione NIEOSIAGALNE, difficulty=${d}): jednostka ` +
      `raid-ready NIE jest zamrozona -- zero tur bez komendy w ${TURNS} turach (got ${idle})`);
  }
}

// ==============================================================================================
// 7. M2b -- etykietowanie spojnych skladowych NIE ostrzejsze niz runtime. Sciana Wzgorz (koszt 2,
//    SKONCZONY) dzieli plansze GEOMETRYCZNIE, ale NIE topologicznie: computeLandComponents uzywa
//    tej samej funkcji kosztu co computePath. Jednostka po zachodniej stronie MUSI dostac komende
//    ruchu w strone bronionego miasta po wschodniej. Dowod mutacyjny w sekcji 9.
// ==============================================================================================
{
  const map = makeMap(11, 3);
  for (let r = 0; r < 3; r++) map.hexes[`5,${r}`].terenBazowy = 'wzgorza';
  const cityE = city('cityHills', 10, 1);
  const guardE = enemy('guardHills', 10, 1);
  const u = barb('bM2b', 0, 1); // bez campId -- NIE raid-ready
  const P = Object.assign({}, FALLBACK_BARB_PARAMS, { aggroRadius: 20 });
  const cmds = decideBarbarianMoves([u], [guardE], [cityE], [], map, P, undefined, 'normal');
  eq(cmds.length, 1, '7 (M2b): jednostka za sciana Wzgorz dostaje DOKLADNIE 1 komende');
  eq(cmds[0]?.type, 'move', '7 (M2b): komenda to ruch, nie zamrozenie');
  if (cmds[0]?.type === 'move') {
    const dBefore = hexDist(u.q, u.r, cityE.q, cityE.r);
    const dAfter = hexDist(cmds[0].toQ, cmds[0].toR, cityE.q, cityE.r);
    assert(dAfter < dBefore,
      `7 (M2b): krok zbliza do bronionego miasta za sciana Wzgorz (before=${dBefore}, after=${dAfter})`);
  }
}

// ==============================================================================================
// 8. M3 -- jednostka na terenie o NIESKONCZONYM koszcie (Gory): `unitComp === undefined`, filtr
//    skladowych musi zostac POMINIETY CALKOWICIE, inaczej `Set.has(undefined)` odrzuca KAZDEGO
//    kandydata i jednostka dostaje 0 komend (klasa bledu "jednostka zamiera na stale" z rundy 5).
// ==============================================================================================
{
  const map = makeMap(6, 1);
  map.hexes['0,0'].terenBazowy = 'gory';
  const cityM = city('cityM3', 5, 0);
  const guardM = enemy('guardM3', 5, 0);
  const u = barb('bM3', 0, 0);
  const P = Object.assign({}, FALLBACK_BARB_PARAMS, { aggroRadius: 20 });
  const cmds = decideBarbarianMoves([u], [guardM], [cityM], [], map, P, undefined, 'normal');
  assert(cmds.length >= 1,
    `8 (M3): jednostka na terenie o nieskonczonym koszcie dostaje >=1 komende (got ${cmds.length})`);
  eq(cmds[0]?.type, 'move', '8 (M3): komenda to ruch, nie zamrozenie');
}

// ==============================================================================================
// 9. DOWODY MUTACYJNE (self-check). Wzorzec identyczny do barb-city-behavior-test.cjs sekcja 9:
//    mutacja barbarians.ts NA DYSKU, ten sam plik odpalany w podprocesie z flaga pomijajaca te
//    sekcje, wymagany niezerowy kod wyjscia ORAZ linia `FAIL:` pasujaca do wzorca numeru sekcji
//    (sam niezerowy exit liczylby awarie kompilacji jako "mutant zlapany"). Oryginal przywracany
//    z KOPII w `finally`, takze przy wyjatku -- nigdy przez `git checkout`.
// ==============================================================================================
if (!process.argv.includes('--self-check-skip-mutation')) {
  const { execSync } = require('child_process');
  const SRC = path.join(GRA_ROOT, 'src/game/barbarians.ts');
  const ORIG = fs.readFileSync(SRC, 'utf8');

  function expectFails(mutated, label, pattern) {
    const backup = fs.readFileSync(SRC, 'utf8');
    let mutantFailed = false, out = '';
    try {
      fs.writeFileSync(SRC, mutated, 'utf8');
      execSync(`node ${JSON.stringify(__filename)} --self-check-skip-mutation`, {
        cwd: __dirname, stdio: 'pipe', timeout: 180000,
      });
    } catch (e) {
      mutantFailed = true;
      out = String(e.stdout ?? '') + '\n' + String(e.stderr ?? '');
    } finally {
      fs.writeFileSync(SRC, backup, 'utf8');
    }
    assert(mutantFailed, `mutacja [${label}] zlapana czerwono przez self-check (niezerowy exit code)`);
    if (mutantFailed) {
      assert(pattern.test(out),
        `mutacja [${label}]: wyjscie podprocesu zawiera linie FAIL: pasujaca do ${pattern} ` +
        '(nie tylko niezerowy exit -- wyklucza falszywie pozytywny dowod z awarii gdzie indziej)');
    }
  }

  // 9a. Cofniecie NAPRAWY: warunek resetu z powrotem na wersje rundy 5 ("odwiedzilem wszystkie
  //     niebronione") -- przywraca krazenie, sekcje 1-3 MUSZA zaczerwienic.
  console.log('-- 9a / mutacja: cofniecie warunku resetu do wersji rundy 5 --');
  {
    const NOWY = '      if (filtered.length === 0 && civCitiesBase.length > 0) {';
    const STARY =
      '      const undefendedCities = civCitiesBase.filter(c => !enemies.some(e => e.q === c.q && e.r === c.r));\n'
      + '      if (undefendedCities.length > 0 && undefendedCities.every(c => clearedSet.includes(c.id))) {';
    const n = ORIG.split(NOWY).length - 1;
    eq(n, 1, '9a mutacja-setup: warunek resetu odnaleziony DOKLADNIE RAZ w barbarians.ts');
    if (n === 1) expectFails(ORIG.replace(NOWY, STARY),
      '9a: warunek resetu cofniety do wersji rundy 5 -- jednostka znow krazy miedzy niebronionymi',
      /FAIL:\s+[123] /);
  }

  // 9b. Cofniecie JEDNEJ REGULY: przywrocenie bramki trudnosci -- sekcja 4 (bit-identycznosc) i
  //     sekcje 1-3 dla easy/pominietego MUSZA zaczerwienic.
  console.log('-- 9b / mutacja: przywrocenie bramki trudnosci --');
  {
    const NOWY = '  const skipDefenselessCities = true;';
    const STARY = "  const skipDefenselessCities = difficulty === 'normal' || difficulty === 'hard';";
    const n = ORIG.split(NOWY).length - 1;
    eq(n, 1, '9b mutacja-setup: stala `skipDefenselessCities = true` odnaleziona DOKLADNIE RAZ');
    if (n === 1) expectFails(ORIG.replace(NOWY, STARY),
      '9b: przywrocona bramka trudnosci -- na easy i przy pominietym difficulty jednostka znow ' +
      'parkuje przy niebronionym miescie, logi przestaja byc bit-identyczne',
      /FAIL:\s+(4 |[123] )/);
  }

  // 9c. M2b -- zaostrzenie etykietowania (Wzgorza nieprzechodnie TYLKO w computeLandComponents,
  //     nadal przechodnie w computePath): sekcja 7 MUSI zaczerwienic.
  console.log('-- 9c / mutacja M2b: zaostrzenie etykietowania spojnych skladowych --');
  {
    const OWN_OLD = 'if (hex === undefined || terrainMoveCost(hex) === Infinity) continue;';
    const OWN_NEW = "if (hex === undefined || terrainMoveCost(hex) === Infinity || hex.terenBazowy === 'wzgorza') continue;";
    const NB_OLD = 'if (nHex === undefined || terrainMoveCost(nHex) === Infinity) continue;';
    const NB_NEW = "if (nHex === undefined || terrainMoveCost(nHex) === Infinity || nHex.terenBazowy === 'wzgorza') continue;";
    const a = ORIG.split(OWN_OLD).length - 1, b = ORIG.split(NB_OLD).length - 1;
    eq(a, 1, '9c mutacja-setup: linia kosztu wlasnego heksu odnaleziona DOKLADNIE RAZ');
    eq(b, 1, '9c mutacja-setup: linia kosztu sasiada odnaleziona DOKLADNIE RAZ');
    if (a === 1 && b === 1) expectFails(ORIG.replace(OWN_OLD, OWN_NEW).replace(NB_OLD, NB_NEW),
      '9c (M2b): etykietowanie ostrzejsze niz runtime -- w pelni osiagalny cel za sciana Wzgorz ' +
      'odrzucony PRZED proba Dijkstry',
      /FAIL:\s+7 /);
  }

  // 9d. M3 -- cofniecie fallbacku `unitComp === undefined`: sekcja 8 MUSI zaczerwienic.
  console.log('-- 9d / mutacja M3: cofniecie fallbacku unitComp === undefined --');
  {
    const NOWY = 'if (unitComp !== undefined) {';
    const STARY = 'if (true) {';
    const n = ORIG.split(NOWY).length - 1;
    eq(n, 1, '9d mutacja-setup: guard fallbacku `unitComp` odnaleziony DOKLADNIE RAZ');
    if (n === 1) expectFails(ORIG.replace(NOWY, STARY),
      '9d (M3): filtr skladowych stosowany bezwarunkowo -- `Set.has(undefined)` zawsze false ' +
      'odrzuca KAZDEGO kandydata, 0 komend zamiast >=1',
      /FAIL:\s+8 /);
  }
}

// --- summary ----------------------------------------------------------------------------------
console.log(`\nbarbarzyncy-krazenie-test: ${passed} passed, ${failed} failed`);
try { fs.rmSync(WORK_DIR, { recursive: true, force: true }); } catch (e) {}
process.exit(failed > 0 ? 1 : 0);
