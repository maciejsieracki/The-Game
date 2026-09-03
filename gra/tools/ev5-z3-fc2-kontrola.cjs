'use strict';
/**
 * ev5-z3-fc2-kontrola.cjs — NIEZALEZNA kontrola Evaluatora (runda 5,
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1). Powtarza oba scenariusze dowodowe Operatora
 * WLASNA METODA — inny algorytm lokalizacji kodu w `src/main.ts`, inny scenariusz.
 *
 * Roznice wobec `ai5-zasada3-harness.cjs` (Operator):
 *  - blok ZASADY 3 lokalizowany OD KONCA: kotwica `[AI] Zasada 3` w `console.error`,
 *    potem ODWROTNE dopasowanie klamr do otwarcia straznika (Operator szuka W PRZOD
 *    ostatniego `if (`/`try {` o wcieciu 12);
 *  - zapis: wycinam CALY literal `meta: { ... }` z `buildSaveGameSnapshot` i szukam
 *    klucza na GLEBOKOSCI 1 tego literalu (Operator: `indexOf` miedzy dwiema sygnaturami);
 *  - scenariusz Z-3: TRZECH ownerow naraz (cywilizacja w nadwyzce, cywilizacja BEZ
 *    nadwyzki, miasto-panstwo w nadwyzce) — sprawdza nie tylko powrot, ale i to, ze
 *    naprawa nie rusza ownera, ktory nigdy nie byl przekierowany;
 *  - dodatkowy przypadek: SEJW STARY (bez pola) — kontrola zgodnosci wstecz;
 *  - scenariusz FC-2: JAWNE rostery (nie ziarno PRNG Operatora).
 *
 * Uruchomienie: node tools/ev5-z3-fc2-kontrola.cjs   (z katalogu gra/)
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const MAIN_TS = process.env.EV5_MAIN_TS || path.resolve(GRA_ROOT, 'src', 'main.ts');
const ts2js = (code) => esbuild.transformSync(code, { loader: 'ts', target: 'node18' }).code;

let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? '  OK  ' : ' FAIL '} ${msg}`); if (!cond) fails++; };

// ---------------------------------------------------------------- ekstrakcja

/** Dopasowanie klamr W PRZOD od podanego `{`. */
function fwd(src, openIdx) {
  let d = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === '{') d++;
    else if (src[i] === '}') { d--; if (d === 0) return i; }
  }
  return -1;
}

/** Dopasowanie klamr WSTECZ od podanego `}` — zwraca indeks pasujacego `{`. */
function back(src, closeIdx) {
  let d = 0;
  for (let i = closeIdx; i >= 0; i--) {
    if (src[i] === '}') d++;
    else if (src[i] === '{') { d--; if (d === 0) return i; }
  }
  return -1;
}

/**
 * ZASADA 3 — lokalizacja OD KONCA. Kotwica: `console.error` z tekstem `[AI] Zasada 3`.
 * Idziemy: kotwica -> koniec bloku `catch` -> nastepna klamra domykajaca to koniec
 * straznika -> wstecz do jego `{` -> poczatek linii = tekst straznika.
 */
function wytnijZasada3(src) {
  const anchor = src.indexOf('[AI] Zasada 3');
  if (anchor < 0) return { err: 'kotwica `[AI] Zasada 3` nie znaleziona' };
  // koniec bloku catch: pierwsza `}` po kotwicy, ktora domyka blok catch
  const catchOpen = src.lastIndexOf('{', anchor);
  const catchClose = fwd(src, catchOpen);
  if (catchClose < 0) return { err: 'nie domknieto bloku catch' };
  // nastepna niepusta klamra domykajaca po catch = koniec straznika (jesli straznik jest)
  let i = catchClose + 1;
  while (i < src.length && /\s/.test(src[i])) i++;
  const maStraznik = src[i] === '}';
  const closeIdx = maStraznik ? i : catchClose;
  const openIdx = back(src, closeIdx);
  const lineStart = src.lastIndexOf('\n', openIdx) + 1;
  const guard = src.slice(lineStart, src.indexOf('\n', lineStart)).trim();
  return { body: ts2js(src.slice(lineStart, closeIdx + 1)), guard, maStraznik, err: null };
}

/** CALY literal `meta: { ... }` z buildSaveGameSnapshot + klucze na glebokosci 1. */
function wytnijMeta(src) {
  const fn = src.indexOf('function buildSaveGameSnapshot');
  if (fn < 0) return { err: 'buildSaveGameSnapshot nie znaleziona' };
  const metaKey = src.indexOf('\n         meta: {', fn) >= 0
    ? src.indexOf('\n         meta: {', fn)
    : src.indexOf('meta: {', fn);
  const open = src.indexOf('{', metaKey);
  const close = fwd(src, open);
  if (close < 0) return { err: 'literal meta nie domkniety' };
  const body = src.slice(open + 1, close);
  // klucze na glebokosci 1 (poza zagniezdzeniami i poza stringami/komentarzami — dosc,
  // bo szukamy tylko naszego klucza na poczatku linii)
  const klucze = new Map();
  let d = 0;
  for (let j = 0; j < body.length; j++) {
    const ch = body[j];
    if (ch === '{' || ch === '[' || ch === '(') d++;
    else if (ch === '}' || ch === ']' || ch === ')') d--;
    else if (d === 0 && ch === '\n') {
      const lineEnd = body.indexOf('\n', j + 1);
      const line = body.slice(j + 1, lineEnd < 0 ? body.length : lineEnd);
      const m = /^\s*([A-Za-z_$][\w$]*)\s*:\s*(.*)$/.exec(line);
      if (m && !line.trim().startsWith('//')) klucze.set(m[1], m[2].replace(/,\s*$/, ''));
    }
  }
  return { klucze, err: null };
}

/** Blok odczytu w restoreGameFromSave — od `clear()` do `}` po `.add(`. */
function wytnijOdczyt(src) {
  const fn = src.indexOf('function restoreGameFromSave');
  if (fn < 0) return { err: 'restoreGameFromSave nie znaleziona' };
  const ref = src.indexOf('saved.meta?.aiSurplusRedirectedOwners', fn);
  if (ref < 0) return { err: 'BRAK odczytu `saved.meta?.aiSurplusRedirectedOwners`' };
  const clr = src.lastIndexOf('aiSurplusRedirectedOwners.clear();', ref);
  if (clr < 0 || clr < fn) return { err: 'BRAK `clear()` przed odczytem' };
  const add = src.indexOf('aiSurplusRedirectedOwners.add(', ref);
  if (add < 0) return { err: 'BRAK `.add(` po odczycie' };
  const close = src.indexOf('}', add);
  return { body: ts2js(src.slice(clr, close + 1)), err: null };
}

// ---------------------------------------------------------------- sesja

const _ENTRY = path.resolve(__dirname, '.ev5-entry.ts');
const _BUNDLE = path.resolve(__dirname, '.ev5-bundle.cjs');
fs.writeFileSync(_ENTRY, `export * as CITIES from ${JSON.stringify(path.resolve(GRA_ROOT, 'src', 'game', 'cities'))};\n`, 'utf8');
esbuild.buildSync({
  entryPoints: [_ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: _BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const CITIES = require(_BUNDLE).CITIES;

function mkSesja() {
  return {
    ownerDefaultPodzialPracy: new Map(),
    aiSurplusRedirectedOwners: new Set(),
    aiSurplusReportByOwner: new Map(),
    aiSliderStateByOwner: new Map(),
    cities: [],
  };
}

function tura(body, S, ownerId, defensiveCopy, K) {
  new Function(
    'opts', 'ownerId', 'cities', 'aiSurplusReportByOwner', 'aiSurplusRedirectedOwners',
    'ownerDefaultPodzialPracy', 'aiSliderStateByOwner',
    'MAX_PODZIAL_PRACY_BUDYNKI_PERCENT', 'DEFAULT_PODZIAL_PRACY',
    // R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1 (Krok 3): blok ZASADY 3 aktualnego main.ts
    // referencuje TAKZE `MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA` (import na poziomie
    // pliku w main.ts) — bez wstrzykniecia tutaj `new Function` rzuca ReferenceError,
    // POLYKANY przez try/catch ZASADY 3, wiec przekierowanie po cichu nigdy sie nie
    // wykonuje (dokladnie tak samo jak w `ai5-zasada3-harness.cjs`, patrz komentarz tam).
    'MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA',
    // R-AI-PRACA-PODZIAL-STALY-50-50-Q1 (Krok 2): fallback przywracania (main.ts ok.
    // 29705-29709) referencuje TAKZE `AI_FIXED_PROCENT_BUDYNKI` (import z `game/cities`)
    // zamiast `DEFAULT_PODZIAL_PRACY.procentBudynki` — SAM wzorzec wstrzykniecia co
    // `MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA` powyzej (bez tego: ReferenceError
    // polykany przez try/catch ZASADY 3, przekierowanie po cichu nigdy sie nie cofa).
    'AI_FIXED_PROCENT_BUDYNKI',
    'clampPodzialPracyBudynkiPercent', 'console',
    body,
  )(
    { defensiveCopy }, ownerId, S.cities, S.aiSurplusReportByOwner, S.aiSurplusRedirectedOwners,
    S.ownerDefaultPodzialPracy, S.aiSliderStateByOwner,
    K.MAX, K.DEF, K.MIN_NADWYZKA, K.AI_FIXED, K.clamp, console,
  );
}

const rap = (surplus) => ({ surplus, anyCandidate: !surplus, deficitActive: false, demandActive: true });

module.exports = { wytnijZasada3, wytnijMeta, wytnijOdczyt, mkSesja, tura, rap, ts2js, ok };

// ---------------------------------------------------------------- scenariusze

function scenariuszZ3(src, K, { pomijZapis = false, pomijOdczyt = false, staryicSejw = false } = {}) {
  const z3 = wytnijZasada3(src);
  if (z3.err) throw new Error('Z-3: ' + z3.err);
  const meta = wytnijMeta(src);
  if (meta.err) throw new Error('Z-3 meta: ' + meta.err);
  const zapisRhs = meta.klucze.get('aiSurplusRedirectedOwners') || null;
  const odczyt = wytnijOdczyt(src);

  const CIV_NADW = 11;   // AI CYWILIZACJI w nadwyzce
  const CIV_BEZ  = 12;   // AI CYWILIZACJI bez nadwyzki (kontrola: nie ruszamy jej)
  const PM       = 13;   // miasto-panstwo w nadwyzce

  // --- SESJA 1 ---
  const S1 = mkSesja();
  for (const oid of [CIV_NADW, CIV_BEZ, PM]) {
    S1.cities.push({ id: `c${oid}`, ownerId: oid, podzialPracy: { procentBudynki: 60 }, podzialPracyOverride: false });
    S1.ownerDefaultPodzialPracy.set(oid, { procentBudynki: 60 });
    S1.aiSliderStateByOwner.set(oid, { procentBudynki: 60, lastChangeTurn: 2 });
  }
  S1.aiSurplusReportByOwner.set(CIV_NADW, rap(true));
  S1.aiSurplusReportByOwner.set(CIV_BEZ, rap(false));
  S1.aiSurplusReportByOwner.set(PM, rap(true));
  tura(z3.body, S1, CIV_NADW, false, K);
  tura(z3.body, S1, CIV_BEZ, false, K);
  tura(z3.body, S1, PM, true, K);

  const t1 = {
    civNadw: S1.ownerDefaultPodzialPracy.get(CIV_NADW).procentBudynki,
    civBez: S1.ownerDefaultPodzialPracy.get(CIV_BEZ).procentBudynki,
    pm: S1.ownerDefaultPodzialPracy.get(PM).procentBudynki,
    znaczniki: Array.from(S1.aiSurplusRedirectedOwners).sort((a, b) => a - b),
  };

  // --- SAVE (prawdziwy RHS z meta) + JSON round-trip ---
  const metaObj = {
    ownerDefaultPodzialPracy: Array.from(S1.ownerDefaultPodzialPracy.entries()),
    cities: S1.cities.map(c => ({ ...c, podzialPracy: { ...c.podzialPracy } })),
  };
  if (zapisRhs && !pomijZapis && !staryicSejw) {
    metaObj.aiSurplusRedirectedOwners =
      new Function('aiSurplusRedirectedOwners', `return (${zapisRhs});`)(S1.aiSurplusRedirectedOwners);
  }
  const saved = JSON.parse(JSON.stringify({ meta: metaObj }));

  // --- SESJA 2 (swieza sesja przegladarki) + LOAD ---
  const S2 = mkSesja();
  S2.cities = saved.meta.cities.map(c => ({ ...c, podzialPracy: { ...c.podzialPracy } }));
  for (const [oid, p] of saved.meta.ownerDefaultPodzialPracy) S2.ownerDefaultPodzialPracy.set(oid, { ...p });
  if (odczyt.body && !pomijOdczyt) {
    new Function('aiSurplusRedirectedOwners', 'saved', odczyt.body)(S2.aiSurplusRedirectedOwners, saved);
  }
  const znacznikiPoLoad = Array.from(S2.aiSurplusRedirectedOwners).sort((a, b) => a - b);

  // --- SESJA 2: tura BEZ nadwyzki u nikogo ---
  for (const oid of [CIV_NADW, CIV_BEZ, PM]) S2.aiSurplusReportByOwner.set(oid, rap(false));
  tura(z3.body, S2, CIV_NADW, false, K);
  tura(z3.body, S2, CIV_BEZ, false, K);
  tura(z3.body, S2, PM, true, K);

  const p = (oid) => S2.ownerDefaultPodzialPracy.get(oid).procentBudynki;
  return {
    guard: z3.guard, maStraznik: z3.maStraznik, zapisRhs, odczytErr: odczyt.err,
    metaKlucze: meta.klucze.size, t1, znacznikiPoLoad,
    po: { civNadw: p(CIV_NADW), civBez: p(CIV_BEZ), pm: p(PM) },
    pulaImperium: {
      civNadw: K.pula(p(CIV_NADW)), civBez: K.pula(p(CIV_BEZ)), pm: K.pula(p(PM)),
    },
    miastaPo: S2.cities.map(c => [c.ownerId, c.podzialPracy.procentBudynki]),
  };
}

function scenariuszFC2(src, K, roster) {
  const z3 = wytnijZasada3(src);
  if (z3.err) throw new Error('FC-2: ' + z3.err);
  const S = mkSesja();
  for (const o of roster) {
    S.cities.push({ id: `c${o.id}`, ownerId: o.id, podzialPracy: { procentBudynki: 55 }, podzialPracyOverride: false });
    S.ownerDefaultPodzialPracy.set(o.id, { procentBudynki: 55 });
    S.aiSliderStateByOwner.set(o.id, { procentBudynki: 55, lastChangeTurn: 1 });
    S.aiSurplusReportByOwner.set(o.id, rap(true));
  }
  for (const o of roster) tura(z3.body, S, o.id, o.pm, K);
  const naPrzekierowanej = (o) => S.ownerDefaultPodzialPracy.get(o.id).procentBudynki === K.redirected;
  const pm = roster.filter(o => o.pm), civ = roster.filter(o => !o.pm);
  return {
    pmPrzekierowane: pm.filter(naPrzekierowanej).length, pmIle: pm.length,
    civPrzekierowane: civ.filter(naPrzekierowanej).length, civIle: civ.length,
    pmZnaczniki: pm.filter(o => S.aiSurplusRedirectedOwners.has(o.id)).length,
    pmMiastaNaMax: S.cities.filter(c => pm.some(o => o.id === c.ownerId)
      && c.podzialPracy.procentBudynki === K.redirected).length,
  };
}

// ---------------------------------------------------------------- main

if (require.main === module) {
  const src = fs.readFileSync(MAIN_TS, 'utf8');
  const K = {
    MAX: CITIES.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
    DEF: CITIES.DEFAULT_PODZIAL_PRACY,
    AI_FIXED: CITIES.AI_FIXED_PROCENT_BUDYNKI,
    clamp: CITIES.clampPodzialPracyBudynkiPercent,
    pula: CITIES.procentPuliImperiumZBudynkow,
    // R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1 (Krok 3): cel ZASADY 3 juz nie jest `MAX` (100 —
    // zero puli imperium na stale, patrz uzasadnienie przy `MIN_PROCENT_PULI_IMPERIUM_
    // ZASADA3_NADWYZKA` w game/cities.ts) — jest to WARTOSC PRZYCIETA PODLOGA.
    MIN_NADWYZKA: CITIES.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA,
    redirected: Math.min(
      CITIES.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
      100 - CITIES.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA,
    ),
  };
  console.log('=== ev5-z3-fc2-kontrola (Evaluator, wlasna metoda) ===');
  console.log('main.ts:', MAIN_TS);
  console.log(`stale z cities.ts: MAX=${K.MAX} DEFAULT=${K.DEF.procentBudynki} pula(MAX)=${K.pula(K.MAX)}% `
    + `cel-przekierowania=${K.redirected} (podloga nadwyzki=${K.MIN_NADWYZKA})`);

  // mutacje zrodla — kolumna PRZED
  const bezStraznika = src.replace('if (!opts.defensiveCopy) {\n              try {', 'if (true) {\n              try {');
  ok(bezStraznika !== src, 'mutacja FC-2 (zdjecie straznika) zmienila tekst zrodla');

  console.log('\n--- Z-3: save w turze z nadwyzka -> load -> tura bez nadwyzki ---');
  const po = scenariuszZ3(src, K);
  const przed = scenariuszZ3(src, K, { pomijZapis: true, pomijOdczyt: true });
  const legacy = scenariuszZ3(src, K, { staryicSejw: true });
  const fmt = (r, tag) => console.log(
    `  ${tag} | zapis: ${r.zapisRhs ?? 'BRAK'} | znaczniki po load: [${r.znacznikiPoLoad}]\n` +
    `        CIV-w-nadwyzce ${r.t1.civNadw} -> ${r.po.civNadw} (pula ${r.pulaImperium.civNadw}%) | ` +
    `CIV-bez-nadwyzki ${r.t1.civBez} -> ${r.po.civBez} | PM ${r.t1.pm} -> ${r.po.pm}`);
  fmt(przed, 'PRZED ');
  fmt(po,    'PO    ');
  fmt(legacy, 'LEGACY');

  // R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1 (Krok 3): cel przekierowania ZASADY 3 = `K.redirected`
  // (przyciety podloga), NIE `K.MAX` — patrz uzasadnienie przy budowie `K` wyzej. Pula
  // imperium podczas "utkniecia" (blad Z-3 tego historycznego tematu odtworzony) jest wiec
  // TERAZ `K.MIN_NADWYZKA`%, nie 0% — Krok 3 tego tematu ZLAGODZIL TAKZE najgorszy przypadek
  // starego bledu Z-3, jesli mialby kiedys wrocic (podloga dziala niezaleznie od przyczyny
  // "utkniecia" na przekierowanej wartosci).
  ok(przed.po.civNadw === K.redirected, `PRZED: AI CYWILIZACJI zostaje na ${K.redirected}% budynkow (blad Z-3 odtworzony)`);
  ok(K.pula(przed.po.civNadw) === K.MIN_NADWYZKA, `PRZED: pula imperium ${K.MIN_NADWYZKA}% (podloga) — Praca na ulepszenia terenu przycieta do minimum, trwale`);
  ok(po.po.civNadw !== K.redirected, `PO: AI CYWILIZACJI wraca z ${K.redirected}% (jest ${po.po.civNadw}%)`);
  ok(K.pula(po.po.civNadw) > K.MIN_NADWYZKA, `PO: pula imperium ${K.pula(po.po.civNadw)}% > podlogi ${K.MIN_NADWYZKA}% — Praca znowu plynie na ulepszenia w normalnym tempie`);
  ok(po.znacznikiPoLoad.length === 1 && po.znacznikiPoLoad[0] === 11, `PO: po load znacznik ma dokladnie [11], jest [${po.znacznikiPoLoad}]`);
  ok(po.po.civBez === 60, `PO: owner NIGDY nieprzekierowany nietkniety (60 -> ${po.po.civBez})`);
  ok(po.miastaPo.every(([oid, v]) => oid !== 11 || v === po.po.civNadw), 'PO: miasta ownera zgodne z podzialem imperium');
  ok(legacy.po.civNadw === K.redirected, 'LEGACY (sejw bez pola): zbior pusty -> zachowanie jak PRZED (zgodnosc wsteczna, nie crash)');

  console.log('\n--- FC-2: miasta-panstwa vs AI CYWILIZACJI, jawne rostery ---');
  const rostery = [
    { nazwa: 'R1 3PM/3CIV', r: [{ id: 1, pm: true }, { id: 2, pm: true }, { id: 3, pm: true }, { id: 4, pm: false }, { id: 5, pm: false }, { id: 6, pm: false }] },
    { nazwa: 'R2 1PM/5CIV', r: [{ id: 1, pm: true }, { id: 2, pm: false }, { id: 3, pm: false }, { id: 4, pm: false }, { id: 5, pm: false }, { id: 6, pm: false }] },
    { nazwa: 'R3 5PM/1CIV', r: [{ id: 1, pm: true }, { id: 2, pm: true }, { id: 3, pm: true }, { id: 4, pm: true }, { id: 5, pm: true }, { id: 6, pm: false }] },
  ];
  for (const { nazwa, r } of rostery) {
    const a = scenariuszFC2(bezStraznika, K, r);
    const b = scenariuszFC2(src, K, r);
    console.log(`  ${nazwa}  PRZED: PM ${a.pmPrzekierowane}/${a.pmIle}, znaczniki ${a.pmZnaczniki}, miasta PM na MAX ${a.pmMiastaNaMax} | CIV ${a.civPrzekierowane}/${a.civIle}`);
    console.log(`  ${' '.repeat(nazwa.length)}  PO:    PM ${b.pmPrzekierowane}/${b.pmIle}, znaczniki ${b.pmZnaczniki}, miasta PM na MAX ${b.pmMiastaNaMax} | CIV ${b.civPrzekierowane}/${b.civIle}`);
    ok(a.pmPrzekierowane === a.pmIle, `${nazwa} PRZED: wszystkie miasta-panstwa przekierowane (blad FC-2 odtworzony)`);
    ok(b.pmPrzekierowane === 0 && b.pmZnaczniki === 0 && b.pmMiastaNaMax === 0, `${nazwa} PO: zadne miasto-panstwo nieprzekierowane`);
    ok(b.civPrzekierowane === b.civIle, `${nazwa} PO: AI CYWILIZACJI nadal przekierowane ${b.civPrzekierowane}/${b.civIle} (naprawa nie oslabia Zasady 3)`);
  }

  console.log(`\n=== ${fails === 0 ? 'WSZYSTKO OK' : fails + ' BLEDOW'} ===`);
  process.exit(fails === 0 ? 0 : 1);
}
