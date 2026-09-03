'use strict';
/**
 * ai5-zasada3-harness.cjs — WSPOLNY harness do wykonywania PRAWDZIWEGO kodu ZASADY 3
 * z `src/main.ts` poza przegladarka (R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, runda 5).
 *
 * Uzywany przez:
 *   - `tools/ai4-popyt-obywatele-test.cjs` (bramka tematu, asercje Z3l/Z3m),
 *   - `tools/ai5-z3-fc2-probe.cjs`        (sonda dowodowa PRZED/PO).
 * Jedna implementacja, dwa konsumenty — zeby bramka i sonda nie rozjechaly sie w metodzie.
 *
 * DLACZEGO EKSTRAKCJA, A NIE IMPORT: `main.ts` zyje jako jedno ogromne domkniecie
 * (setki wspolzaleznych zmiennych lokalnych, `import.meta.glob`, loadery .svg) i nie da
 * sie go zbundlowac w izolacji — to samo ograniczenie i ta sama odpowiedz co w
 * `tools/fort-nodes-save-load-test.cjs`: WYTNIJ prawdziwy tekst z main.ts i WYKONAJ go
 * przez `new Function` (skladnia TS-only przepuszczona przez esbuild, jak w buildzie
 * produkcyjnym). Lokalizacja przez sasiedztwo tekstu, NIGDY przez numer linii — numery
 * dryfuja przy kazdej edycji pliku.
 */
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const ZASADA3_ANCHOR = 'const surplusRep = aiSurplusReportByOwner.get(ownerId);';
const SAVE_SIG = 'function buildSaveGameSnapshot(label?: string): SaveGame {';
const RESTORE_SIG = 'function restoreGameFromSave(saved: SaveGame): void {';

function ts2js(code) {
  return esbuild.transformSync(code, { loader: 'ts', target: 'node18' }).code;
}

/**
 * Blok ZASADY 3 z main.ts: od otwierajacej linii `if (...) {` / `try {` przed kotwica
 * az do klamry domykajacej (dopasowanie klamr, nie heurystyka wciecia).
 * Zwraca rowniez sam tekst straznika — to on niesie naprawe FC-2.
 */
function extractZasada3(src) {
  const anchor = src.indexOf(ZASADA3_ANCHOR);
  if (anchor < 0) return { body: null, guard: null, err: 'kotwica ZASADY 3 nie znaleziona' };
  const before = src.slice(0, anchor);
  const ifIdx = before.lastIndexOf('\n            if (');
  const tryIdx = before.lastIndexOf('\n            try {');
  const start = Math.max(ifIdx, tryIdx);
  if (start < 0) return { body: null, guard: null, err: 'poczatek bloku ZASADY 3 nie znaleziony' };
  const guard = src.slice(start + 1, src.indexOf('\n', start + 1)).trim();
  let depth = 0, end = -1;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end < 0) return { body: null, guard, err: 'klamra domykajaca bloku ZASADY 3 nie znaleziona' };
  return { body: ts2js(src.slice(start + 1, end)), guard, err: null };
}

/** RHS linii `aiSurplusRedirectedOwners: <expr>,` WEWNATRZ buildSaveGameSnapshot. */
function extractSaveRhs(src) {
  const saveIdx = src.indexOf(SAVE_SIG);
  if (saveIdx < 0) return { rhs: null, err: 'buildSaveGameSnapshot nie znaleziona' };
  const restoreIdx = src.indexOf(RESTORE_SIG, saveIdx);
  const marker = 'aiSurplusRedirectedOwners:';
  const mIdx = src.indexOf(marker, saveIdx);
  if (mIdx < 0 || (restoreIdx >= 0 && mIdx > restoreIdx)) {
    return { rhs: null, err: 'BRAK zapisu `aiSurplusRedirectedOwners:` w buildSaveGameSnapshot' };
  }
  const lineEnd = src.indexOf('\n', mIdx);
  return { rhs: src.slice(mIdx + marker.length, lineEnd).trim().replace(/,\s*$/, ''), err: null };
}

/** Blok odczytu `aiSurplusRedirectedOwners` WEWNATRZ restoreGameFromSave. */
function extractLoadBlock(src) {
  const restoreIdx = src.indexOf(RESTORE_SIG);
  if (restoreIdx < 0) return { body: null, err: 'restoreGameFromSave nie znaleziona' };
  const startMarker = 'aiSurplusRedirectedOwners.clear();';
  const startIdx = src.indexOf(startMarker, restoreIdx);
  if (startIdx < 0) return { body: null, err: 'BRAK odczytu `aiSurplusRedirectedOwners` w restoreGameFromSave' };
  const endMarker = 'aiSurplusRedirectedOwners.add(oid);';
  const endIdx = src.indexOf(endMarker, startIdx);
  if (endIdx < 0) return { body: null, err: 'BRAK `.add(oid)` po `clear()` — odczyt niepelny' };
  const close = src.indexOf('}', endIdx + endMarker.length);
  return { body: ts2js(src.slice(startIdx, close + 1)), err: null };
}

/** Minimalna „sesja gry": dokladnie te struktury main.ts, ktorych dotyka ZASADA 3. */
function makeSession() {
  return {
    ownerDefaultPodzialPracy: new Map(),
    aiSurplusRedirectedOwners: new Set(),
    aiSurplusReportByOwner: new Map(),
    aiSliderStateByOwner: new Map(),
    cities: [],
  };
}

/** Jedna tura ZASADY 3 dla jednego ownera — WYKONANIE wycietego kodu main.ts. */
function runZasada3(body, S, ownerId, opts, CITIES) {
  new Function(
    'opts', 'ownerId', 'cities', 'aiSurplusReportByOwner', 'aiSurplusRedirectedOwners',
    'ownerDefaultPodzialPracy', 'aiSliderStateByOwner',
    'MAX_PODZIAL_PRACY_BUDYNKI_PERCENT', 'DEFAULT_PODZIAL_PRACY',
    // R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1 (Krok 3): blok ZASADY 3 wyciety z main.ts od tego
    // tematu referencuje TAKZE `MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA` (dolna granica
    // przekierowania) — w main.ts jest to zwykly import modulu na poziomie pliku, wiec musi
    // byc jawnie wstrzykniety tu, tak samo jak pozostale importy z `game/cities`. Bez tego
    // wyciety kod rzuca ReferenceError, ktory GLOB TRY/CATCH ZASADY 3 (main.ts) po cichu
    // polyka (`console.error`), wiec test bez tej zmiany NIE FAILUJE GLOSNO — po prostu
    // przekierowanie nigdy sie nie wykonuje (zlapane Evaluatorem/Operatorem tego tematu:
    // Z3l/Z3m spadaly do wartosci sprzed przekierowania, „70->70").
    'MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA',
    // R-AI-PRACA-PODZIAL-STALY-50-50-Q1 (Krok 2): fallback przywracania (main.ts ok.
    // 29705-29709) od tego tematu referencuje TAKZE `AI_FIXED_PROCENT_BUDYNKI` (import z
    // `game/cities`) zamiast `DEFAULT_PODZIAL_PRACY.procentBudynki` -- musi byc jawnie
    // wstrzykniety tu, SAMYM wzorcem co `MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA` powyzej
    // (komentarz tamze: bez tego wyciety kod cicho polyka ReferenceError, test NIE FAILUJE
    // GLOSNO -- przekierowanie po prostu nigdy sie nie cofa).
    'AI_FIXED_PROCENT_BUDYNKI',
    'clampPodzialPracyBudynkiPercent', 'console',
    body,
  )(
    opts, ownerId, S.cities, S.aiSurplusReportByOwner, S.aiSurplusRedirectedOwners,
    S.ownerDefaultPodzialPracy, S.aiSliderStateByOwner,
    CITIES.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT, CITIES.DEFAULT_PODZIAL_PRACY,
    CITIES.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA,
    CITIES.AI_FIXED_PROCENT_BUDYNKI,
    CITIES.clampPodzialPracyBudynkiPercent, console,
  );
}

/**
 * Wartosc `procentBudynki`, na jaka ZASADA 3 przestawia AI CYWILIZACJI PODCZAS nadwyzki —
 * liczona TA SAMA formula co main.ts (`Math.min(MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
 * 100 - MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA)`), nie zaslepka. Testy porownuja do
 * TEJ funkcji, nie do surowego `MAX_PODZIAL_PRACY_BUDYNKI_PERCENT` — inaczej pinowalyby
 * wartosc SPRZED Kroku 3 tego tematu.
 */
function przekierowanyProcentBudynki(CITIES) {
  return Math.min(
    CITIES.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
    100 - CITIES.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA,
  );
}

const rap = (surplus) => ({ surplus, anyCandidate: !surplus, deficitActive: false, demandActive: true });

/**
 * SCENARIUSZ Z-3: tura z NADWYZKA -> save -> load w SWIEZEJ sesji -> tura BEZ nadwyzki.
 * Zwraca to, co widzi gracz po wczytaniu: `procentBudynki` ownera i % puli imperium.
 */
function scenariuszZ3(src, CITIES) {
  const z3 = extractZasada3(src);
  if (z3.err) throw new Error('Z-3 ekstrakcja: ' + z3.err);
  const save = extractSaveRhs(src);
  const load = extractLoadBlock(src);
  const OWNER = 3;

  // --- SESJA 1: tura z nadwyzka
  const S1 = makeSession();
  S1.cities = [
    { id: 'c0', ownerId: OWNER, podzialPracy: { procentBudynki: 70 }, podzialPracyOverride: false },
    { id: 'c1', ownerId: OWNER, podzialPracy: { procentBudynki: 70 }, podzialPracyOverride: false },
  ];
  S1.ownerDefaultPodzialPracy.set(OWNER, { procentBudynki: 70 });
  // AI samo wybralo 85% (decideAIEconomySliders) — celowo INNA wartosc niz DEFAULT (70),
  // zeby widac bylo, do czego dokladnie wraca podzial: `aiSliderStateByOwner` NIE jest
  // persistowany (osobna sprawa, poza zakresem naprawy Z-3), wiec po load sciezka
  // powrotu spada na DEFAULT_PODZIAL_PRACY.
  S1.aiSliderStateByOwner.set(OWNER, { procentBudynki: 85, lastChangeTurn: 4 });
  S1.aiSurplusReportByOwner.set(OWNER, rap(true));
  runZasada3(z3.body, S1, OWNER, { defensiveCopy: false }, CITIES);
  const procentWNadwyzce = S1.ownerDefaultPodzialPracy.get(OWNER).procentBudynki;

  // --- SAVE: prawdziwy RHS z main.ts + JSON round-trip (jak realna persystencja)
  const meta = {
    ownerDefaultPodzialPracy: Array.from(S1.ownerDefaultPodzialPracy.entries()),
    cities: S1.cities.map(c => ({ ...c, podzialPracy: { ...c.podzialPracy } })),
  };
  if (save.rhs) {
    meta.aiSurplusRedirectedOwners =
      new Function('aiSurplusRedirectedOwners', `return (${save.rhs});`)(S1.aiSurplusRedirectedOwners);
  }
  const saved = JSON.parse(JSON.stringify({ meta }));

  // --- SESJA 2: swieza sesja przegladarki + `load`
  const S2 = makeSession();
  S2.cities = saved.meta.cities.map(c => ({ ...c }));
  for (const [oid, p] of saved.meta.ownerDefaultPodzialPracy) S2.ownerDefaultPodzialPracy.set(oid, p);
  if (load.body) {
    new Function('aiSurplusRedirectedOwners', 'saved', load.body)(S2.aiSurplusRedirectedOwners, saved);
  }
  const redirectedPoLoad = S2.aiSurplusRedirectedOwners.has(OWNER);

  // --- SESJA 2: tura BEZ nadwyzki (nadwyzka juz minela)
  S2.aiSurplusReportByOwner.set(OWNER, rap(false));
  runZasada3(z3.body, S2, OWNER, { defensiveCopy: false }, CITIES);

  const procentPo = S2.ownerDefaultPodzialPracy.get(OWNER).procentBudynki;
  return {
    guard: z3.guard, saveRhs: save.rhs, saveErr: save.err, loadErr: load.err,
    procentWNadwyzce, redirectedPoLoad, procentPo,
    pulaImperiumPo: CITIES.procentPuliImperiumZBudynkow(procentPo),
    miastaPo: S2.cities.map(c => c.podzialPracy.procentBudynki),
  };
}

/** Deterministyczny roster ownerow z ziarna: kto jest kopia obronna (miastem-panstwem). */
function rosterZZiarna(seed) {
  let s = seed >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const owners = [];
  for (let oid = 1; oid <= 8; oid++) owners.push({ ownerId: oid, defensiveCopy: rnd() < 0.5 });
  if (!owners.some(o => o.defensiveCopy)) owners[0].defensiveCopy = true;   // ziarno MUSI miec PM
  if (owners.every(o => o.defensiveCopy)) owners[1].defensiveCopy = false;  // ... i cywilizacje
  return owners;
}

/** SCENARIUSZ FC-2: caly roster jednego ziarna w stanie NADWYZKI, jedna tura ZASADY 3. */
function scenariuszFC2(src, seed, CITIES) {
  const z3 = extractZasada3(src);
  if (z3.err) throw new Error('FC-2 ekstrakcja: ' + z3.err);
  const owners = rosterZZiarna(seed);
  const S = makeSession();
  for (const o of owners) {
    S.cities.push({ id: `s${seed}-c${o.ownerId}`, ownerId: o.ownerId, podzialPracy: { procentBudynki: 70 }, podzialPracyOverride: false });
    S.ownerDefaultPodzialPracy.set(o.ownerId, { procentBudynki: 70 });
    S.aiSliderStateByOwner.set(o.ownerId, { procentBudynki: 70, lastChangeTurn: 1 });
    // WSZYSCY w nadwyzce — raport jest wypelniany takze kopiom obronnym, bo
    // decideDefensiveCopyTurn wola ten sam `planCityImprovements` co AI CYWILIZACJI.
    S.aiSurplusReportByOwner.set(o.ownerId, rap(true));
  }
  for (const o of owners) runZasada3(z3.body, S, o.ownerId, { defensiveCopy: o.defensiveCopy }, CITIES);
  const pm = owners.filter(o => o.defensiveCopy);
  const civ = owners.filter(o => !o.defensiveCopy);
  const redirectedPct = przekierowanyProcentBudynki(CITIES);
  const naPrzekierowanej = (o) => S.ownerDefaultPodzialPracy.get(o.ownerId).procentBudynki === redirectedPct;
  return {
    seed, guard: z3.guard,
    pmIds: pm.map(o => o.ownerId), civIds: civ.map(o => o.ownerId),
    pmPrzekierowane: pm.filter(naPrzekierowanej).length, pmWszystkich: pm.length,
    civPrzekierowane: civ.filter(naPrzekierowanej).length, civWszystkich: civ.length,
    pmZnaczniki: pm.filter(o => S.aiSurplusRedirectedOwners.has(o.ownerId)).length,
    pmMiastaNaMax: S.cities.filter(c => pm.some(o => o.ownerId === c.ownerId)
      && c.podzialPracy.procentBudynki === redirectedPct).length,
  };
}

module.exports = {
  ZASADA3_ANCHOR, SAVE_SIG, RESTORE_SIG,
  ts2js, extractZasada3, extractSaveRhs, extractLoadBlock,
  makeSession, runZasada3, przekierowanyProcentBudynki, scenariuszZ3, rosterZZiarna, scenariuszFC2,
};
