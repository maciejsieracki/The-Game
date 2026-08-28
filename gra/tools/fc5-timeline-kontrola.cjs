/*
 * FC5 — Final Control, runda 5: NIEZALEZNA sonda kontrolna Z-3 i FC-2.
 *
 * Metoda ROZNA od Operatora i Evaluatora:
 *  - scenariusz to OS CZASU wielu tur (T1 nadwyzka -> SAVE -> NOWA SESJA (load) -> T2 bez
 *    nadwyzki -> T3 bez nadwyzki), a nie pojedyncza kolumna PRZED/PO;
 *  - miedzy zapisem a odczytem stoi PRAWDZIWY `JSON.stringify` / `JSON.parse` (Evaluator
 *    swiadomie go pominal, Operator serializowal w pamieci) — sprawdza tez, czy Set
 *    przechodzi przez JSON jako tablica liczb;
 *  - kolumne PRZED buduje z tego samego zrodla przez ZDJECIE naprawy (zapis+odczyt / straznik),
 *    a nie przez osobna kopie kodu;
 *  - ekstrakcja bloku ZASADY 3 idzie OD STRAZNIKA `if (!opts.defensiveCopy) {` w dol,
 *    ze skanerem klamr pomijajacym stringi/komentarze/template-literale.
 *
 * Wykonywany jest PRAWDZIWY TEKST `gra/src/main.ts` (blok ZASADY 3, wyrazenie zapisu
 * do `meta` i instrukcje odtworzenia w `restoreGameFromSave`), nie jego przepisana kopia.
 *
 * §13a: to NIE jest dowod zachowania w rozgrywce w przegladarce — kod biegnie poza petla
 * tury, poza `runAiPhase`, poza localStorage/IndexedDB i poza `validateLoadedSave`.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'main.ts');
const src = fs.readFileSync(SRC, 'utf8');

let pass = 0, fail = 0;
const t = (name, cond, det) => {
  if (cond) { pass++; console.log(`  [OK] ${name}${det ? '  — ' + det : ''}`); }
  else { fail++; console.log(`  [FAIL] ${name}${det ? '  — ' + det : ''}`); }
};

/* ---------- skaner: maska „to jest kod" (poza stringiem/komentarzem) ---------- */
function codeMask(s) {
  const m = new Uint8Array(s.length);
  let i = 0, st = 'code';
  while (i < s.length) {
    const c = s[i], c2 = s.substr(i, 2);
    if (st === 'code') {
      if (c2 === '//') { st = 'lc'; i += 2; continue; }
      if (c2 === '/*') { st = 'bc'; i += 2; continue; }
      if (c === "'") { st = 'sq'; i++; continue; }
      if (c === '"') { st = 'dq'; i++; continue; }
      if (c === '`') { st = 'tpl'; i++; continue; }
      m[i] = 1; i++; continue;
    }
    if (st === 'lc') { if (c === '\n') st = 'code'; i++; continue; }
    if (st === 'bc') { if (c2 === '*/') { st = 'code'; i += 2; continue; } i++; continue; }
    if (st === 'sq') { if (c === '\\') { i += 2; continue; } if (c === "'") st = 'code'; i++; continue; }
    if (st === 'dq') { if (c === '\\') { i += 2; continue; } if (c === '"') st = 'code'; i++; continue; }
    if (st === 'tpl') { if (c === '\\') { i += 2; continue; } if (c === '`') st = 'code'; i++; continue; }
  }
  return m;
}
const MASK = codeMask(src);
const lineOf = off => src.slice(0, off).split('\n').length;
function matchBrace(open) {
  let d = 0;
  for (let i = open; i < src.length; i++) {
    if (!MASK[i]) continue;
    if (src[i] === '{') d++;
    else if (src[i] === '}') { d--; if (d === 0) return i; }
  }
  return -1;
}

/* ---------- 1. ekstrakcja: blok ZASADY 3 razem ze straznikiem FC-2 ---------- */
const ANCHOR = src.indexOf('[AI] Zasada 3 (nadwyzka ulepszen)');
if (ANCHOR < 0) { console.error('BRAK kotwicy ZASADY 3'); process.exit(2); }
// stos otwartych klamr przed kotwica -> najblizsze otwarcie poprzedzone `if (!opts.defensiveCopy)`
const stack = [];
for (let i = 0; i < ANCHOR; i++) { if (!MASK[i]) continue; if (src[i] === '{') stack.push(i); else if (src[i] === '}') stack.pop(); }
let guardOpen = -1;
for (let k = stack.length - 1; k >= 0 && k >= stack.length - 8; k--) {
  const o = stack[k];
  let p = o - 1; while (p >= 0 && /\s/.test(src[p])) p--;
  if (/if\s*\(\s*!\s*opts\.defensiveCopy\s*\)$/.test(src.slice(Math.max(0, p - 60), p + 1))) { guardOpen = o; break; }
}
t('straznik FC-2 `if (!opts.defensiveCopy) {` otacza blok ZASADY 3', guardOpen > 0,
  guardOpen > 0 ? `linia ${lineOf(guardOpen)}` : 'NIE ZNALEZIONO');
if (guardOpen < 0) process.exit(2);
// poczatek instrukcji `if` (cofnij sie do `if`)
let ifStart = src.lastIndexOf('if', guardOpen);
const guardClose = matchBrace(guardOpen);
const BLOK_PO = src.slice(ifStart, guardClose + 1);          // PO naprawie FC-2
const BLOK_PRZED_FC2 = src.slice(guardOpen + 1, guardClose); // PRZED: samo cialo, bez straznika
t('wyciety blok ZASADY 3 zawiera obie galezie (add/delete znacznika)',
  /aiSurplusRedirectedOwners\.add\(ownerId\)/.test(BLOK_PO) && /aiSurplusRedirectedOwners\.delete\(ownerId\)/.test(BLOK_PO),
  `linie ${lineOf(ifStart)}..${lineOf(guardClose)}`);

/* ---------- 2. ekstrakcja: zapis do `meta` i odtworzenie w restoreGameFromSave ---------- */
const ZAPIS = (src.match(/^[ \t]*aiSurplusRedirectedOwners:\s*Array\.from\(aiSurplusRedirectedOwners\),[ \t]*$/m) || [null])[0];
t('linia ZAPISU do sejwu wycieta doslownie ze zrodla', !!ZAPIS, ZAPIS ? ZAPIS.trim() : 'BRAK');
const ODCZYT = (src.match(/aiSurplusRedirectedOwners\.clear\(\);\s*\n\s*const savedSurplusRedirected[\s\S]*?\n\s*\}/) || [null])[0];
t('blok ODCZYTU z sejwu wyciety doslownie ze zrodla', !!ODCZYT && /saved\.meta\?\.aiSurplusRedirectedOwners/.test(ODCZYT), '');
if (!ZAPIS || !ODCZYT) process.exit(2);

/* ---------- 3. atrapa silnika: minimum, ktorego dotyka blok ---------- */
const MAX_PODZIAL_PRACY_BUDYNKI_PERCENT = 100;
const DEFAULT_PODZIAL_PRACY = { procentBudynki: 70 };
const clampPodzialPracyBudynkiPercent = v => Math.max(0, Math.min(100, Number(v) || 0));
// realna formula z main.ts: 100% budynkow => 0% Pracy do puli imperium (zero ulepszen terenu)
const procentPuliImperiumZBudynkow = pb => 100 - clampPodzialPracyBudynkiPercent(pb);

function nowySwiat(roster) {
  // roster: [{ownerId, mp:boolean, miasta:n, sliderPct:n}]
  const cities = [];
  for (const o of roster) for (let i = 0; i < o.miasta; i++)
    cities.push({ id: `c${o.ownerId}_${i}`, ownerId: o.ownerId, podzialPracy: { procentBudynki: DEFAULT_PODZIAL_PRACY.procentBudynki }, podzialPracyOverride: false });
  return {
    cities,
    aiSurplusRedirectedOwners: new Set(),
    aiSurplusReportByOwner: new Map(),
    ownerDefaultPodzialPracy: new Map(),
    aiSliderStateByOwner: new Map(roster.map(o => [o.ownerId, { procentBudynki: o.sliderPct }])),
    typCityCopy: new Set(roster.filter(o => o.mp).map(o => o.ownerId)),
  };
}

function turaZasady3(W, ownerId, blokText) {
  const fn = new Function(
    'opts', 'ownerId', 'cities', 'aiSurplusReportByOwner', 'aiSurplusRedirectedOwners',
    'ownerDefaultPodzialPracy', 'aiSliderStateByOwner',
    'MAX_PODZIAL_PRACY_BUDYNKI_PERCENT', 'DEFAULT_PODZIAL_PRACY', 'clampPodzialPracyBudynkiPercent', 'console',
    '"use strict";\n' + blokText,
  );
  fn({ defensiveCopy: W.typCityCopy.has(ownerId) }, ownerId, W.cities, W.aiSurplusReportByOwner,
     W.aiSurplusRedirectedOwners, W.ownerDefaultPodzialPracy, W.aiSliderStateByOwner,
     MAX_PODZIAL_PRACY_BUDYNKI_PERCENT, DEFAULT_PODZIAL_PRACY, clampPodzialPracyBudynkiPercent, console);
}

/* zapis -> JSON -> odczyt, PRAWDZIWYMI liniami ze zrodla */
function zapiszSejw(W, zPersystencja) {
  const meta = {};
  if (zPersystencja) {
    new Function('meta', 'aiSurplusRedirectedOwners', `"use strict"; Object.assign(meta, {\n${ZAPIS}\n});`)
      (meta, W.aiSurplusRedirectedOwners);
  }
  // pelny round-trip przez JSON (tak jak sejw w localStorage/IndexedDB)
  return JSON.parse(JSON.stringify({
    meta,
    cities: W.cities.map(c => ({ ...c })),
    ownerDefault: Array.from(W.ownerDefaultPodzialPracy.entries()),
    slider: Array.from(W.aiSliderStateByOwner.entries()),
  }));
}
function wczytajSejw(saved, roster, zPersystencja) {
  const W = nowySwiat(roster);          // ŚWIEŻA sesja: wszystkie zbiory puste
  W.cities = saved.cities.map(c => ({ ...c, podzialPracy: { ...c.podzialPracy } }));
  W.ownerDefaultPodzialPracy = new Map(saved.ownerDefault);
  W.aiSliderStateByOwner = new Map(saved.slider);
  if (zPersystencja) {
    // jedyna ingerencja w wyciety tekst: zdjecie adnotacji typu TS (`as number[] | undefined`),
    // ktorej goly Node nie parsuje. Logika odczytu bez zmian.
    const odczytJs = ODCZYT.replace(/\s+as\s+number\[\]\s*\|\s*undefined/, '');
    new Function('saved', 'aiSurplusRedirectedOwners', '"use strict";\n' + odczytJs)(saved, W.aiSurplusRedirectedOwners);
  }
  return W;
}
const pb = (W, ownerId) => W.cities.filter(c => c.ownerId === ownerId).map(c => c.podzialPracy.procentBudynki);

/* ---------- 4. OS CZASU: Z-3 ---------- */
console.log('\n--- Z-3: os czasu T1 nadwyzka -> SAVE -> NOWA SESJA -> T2/T3 bez nadwyzki ---');
const ROSTER = [
  { ownerId: 11, mp: false, miasta: 3, sliderPct: 40 },  // AI CYWILIZACJI, nadwyzka w T1
  { ownerId: 12, mp: false, miasta: 2, sliderPct: 55 },  // AI CYWILIZACJI, NIGDY nadwyzki
];
function osCzasu(zPersystencja) {
  const W = nowySwiat(ROSTER);
  // T1: owner 11 w nadwyzce
  W.aiSurplusReportByOwner.set(11, { surplus: true });
  W.aiSurplusReportByOwner.set(12, { surplus: false });
  for (const o of ROSTER) turaZasady3(W, o.ownerId, BLOK_PO);
  const t1 = { p11: pb(W, 11), p12: pb(W, 12), znacznik: [...W.aiSurplusRedirectedOwners] };
  // SAVE w turze z nadwyzka + JSON round-trip + LOAD w swiezej sesji
  const sejw = zapiszSejw(W, zPersystencja);
  const W2 = wczytajSejw(sejw, ROSTER, zPersystencja);
  const poLoad = { p11: pb(W2, 11), znacznik: [...W2.aiSurplusRedirectedOwners] };
  // T2, T3: nadwyzka JUZ MINELA dla wszystkich
  W2.aiSurplusReportByOwner.set(11, { surplus: false });
  W2.aiSurplusReportByOwner.set(12, { surplus: false });
  for (const o of ROSTER) turaZasady3(W2, o.ownerId, BLOK_PO);
  const t2 = { p11: pb(W2, 11), p12: pb(W2, 12) };
  for (const o of ROSTER) turaZasady3(W2, o.ownerId, BLOK_PO);
  const t3 = { p11: pb(W2, 11) };
  return { t1, sejwMeta: sejw.meta, poLoad, t2, t3 };
}
const PRZED = osCzasu(false);
const PO    = osCzasu(true);
console.log(`  PRZED: T1 ${PRZED.t1.p11} | meta=${JSON.stringify(PRZED.sejwMeta)} | poLoad ${PRZED.poLoad.p11} znacznik=${JSON.stringify(PRZED.poLoad.znacznik)} | T2 ${PRZED.t2.p11} | T3 ${PRZED.t3.p11}`);
console.log(`  PO   : T1 ${PO.t1.p11} | meta=${JSON.stringify(PO.sejwMeta)} | poLoad ${PO.poLoad.p11} znacznik=${JSON.stringify(PO.poLoad.znacznik)} | T2 ${PO.t2.p11} | T3 ${PO.t3.p11}`);

t('T1 (obie kolumny): nadwyzka podnosi AI CYWILIZACJI do 100% budynkow',
  PRZED.t1.p11.every(v => v === 100) && PO.t1.p11.every(v => v === 100), `PRZED ${PRZED.t1.p11} / PO ${PO.t1.p11}`);
t('PRZED: znacznik NIE trafia do sejwu (meta puste)', Object.keys(PRZED.sejwMeta).length === 0, JSON.stringify(PRZED.sejwMeta));
t('PO: znacznik trafia do sejwu jako plaska tablica ownerId i PRZEZYWA JSON',
  Array.isArray(PO.sejwMeta.aiSurplusRedirectedOwners)
  && PO.sejwMeta.aiSurplusRedirectedOwners.every(x => typeof x === 'number')
  && PO.sejwMeta.aiSurplusRedirectedOwners.join(',') === '11',
  JSON.stringify(PO.sejwMeta.aiSurplusRedirectedOwners));
t('PRZED: po wczytaniu znacznik PUSTY -> galaz powrotu martwa',
  PRZED.poLoad.znacznik.length === 0, JSON.stringify(PRZED.poLoad.znacznik));
t('PO: po wczytaniu znacznik ODTWORZONY', PO.poLoad.znacznik.join(',') === '11', JSON.stringify(PO.poLoad.znacznik));
t('PRZED: T2 po ustaniu nadwyzki AI CYWILIZACJI ZOSTAJE na 100% (regres Z-3)',
  PRZED.t2.p11.every(v => v === 100), `${PRZED.t2.p11}`);
t('PRZED: T3 — regres TRWALY, nie jednorazowy', PRZED.t3.p11.every(v => v === 100), `${PRZED.t3.p11}`);
t('PO: T2 po ustaniu nadwyzki AI CYWILIZACJI WRACA z 100%',
  PO.t2.p11.every(v => v !== 100), `${PO.t2.p11}`);
t('PRZED: pula imperium ownera 11 zostaje na 0% -> zero Pracy na ulepszenia terenu',
  procentPuliImperiumZBudynkow(PRZED.t3.p11[0]) === 0, `pula ${procentPuliImperiumZBudynkow(PRZED.t3.p11[0])}%`);
t('PO: pula imperium ownera 11 wraca > 0%',
  procentPuliImperiumZBudynkow(PO.t2.p11[0]) > 0, `pula ${procentPuliImperiumZBudynkow(PO.t2.p11[0])}%`);
t('owner 12 (NIGDY nadwyzki) nietkniety w obu kolumnach na calej osi czasu',
  PRZED.t1.p12.every(v => v === 70) && PO.t1.p12.every(v => v === 70)
  && PRZED.t2.p12.every(v => v === 70) && PO.t2.p12.every(v => v === 70),
  `PRZED T2 ${PRZED.t2.p12} / PO T2 ${PO.t2.p12}`);
// stary sejw sprzed naprawy wczytany przez NOWY kod
{
  const stary = JSON.parse(JSON.stringify({ meta: {}, cities: [], ownerDefault: [], slider: [] }));
  let ok = true, err = '';
  try { const W = wczytajSejw(stary, ROSTER, true); ok = W.aiSurplusRedirectedOwners.size === 0; }
  catch (e) { ok = false; err = String(e && e.message); }
  t('STARY sejw bez pola nie wywala odczytu i daje pusty zbior (kompatybilnosc wstecz)', ok, err);
}

/* ---------- 5. FC-2: miasta-panstwa na tej samej osi czasu, 3 rostery ---------- */
console.log('\n--- FC-2: miasta-panstwa vs AI CYWILIZACJI, 3 rostery, wszyscy w nadwyzce ---');
const ROSTERY = [
  [{ ownerId: 21, mp: true, miasta: 4, sliderPct: 30 }, { ownerId: 22, mp: false, miasta: 3, sliderPct: 30 }],
  [{ ownerId: 31, mp: true, miasta: 2, sliderPct: 45 }, { ownerId: 32, mp: true, miasta: 5, sliderPct: 45 }, { ownerId: 33, mp: false, miasta: 2, sliderPct: 45 }],
  [{ ownerId: 41, mp: true, miasta: 1, sliderPct: 60 }, { ownerId: 42, mp: false, miasta: 4, sliderPct: 60 }, { ownerId: 43, mp: false, miasta: 1, sliderPct: 60 }],
];
for (let i = 0; i < ROSTERY.length; i++) {
  const R = ROSTERY[i];
  const kol = blok => {
    const W = nowySwiat(R);
    for (const o of R) W.aiSurplusReportByOwner.set(o.ownerId, { surplus: true });
    for (const o of R) turaZasady3(W, o.ownerId, blok);
    const mp = R.filter(o => o.mp), civ = R.filter(o => !o.mp);
    const cnt = (list) => list.reduce((a, o) => a + pb(W, o.ownerId).filter(v => v === 100).length, 0);
    const tot = (list) => list.reduce((a, o) => a + o.miasta, 0);
    return { mp: `${cnt(mp)}/${tot(mp)}`, civ: `${cnt(civ)}/${tot(civ)}`, znacznikMp: mp.filter(o => W.aiSurplusRedirectedOwners.has(o.ownerId)).length };
  };
  const przed = kol(BLOK_PRZED_FC2), po = kol(BLOK_PO);
  console.log(`  roster ${i + 1}: PRZED mp=${przed.mp} civ=${przed.civ} znacznikMP=${przed.znacznikMp} | PO mp=${po.mp} civ=${po.civ} znacznikMP=${po.znacznikMp}`);
  const totMp = R.filter(o => o.mp).reduce((a, o) => a + o.miasta, 0);
  t(`roster ${i + 1}: PRZED miasta-panstwa DOSTAWALY przekierowanie`, przed.mp === `${totMp}/${totMp}`, przed.mp);
  t(`roster ${i + 1}: PO miasta-panstwa NIE dostaja przekierowania (0/N) i nie dostaja znacznika`,
    po.mp === `0/${totMp}` && po.znacznikMp === 0, `${po.mp}, znacznikMP=${po.znacznikMp}`);
  t(`roster ${i + 1}: AI CYWILIZACJI dostaje przekierowanie w OBU kolumnach (naprawa nie zwezila zakresu)`,
    przed.civ === po.civ && po.civ.split('/')[0] === po.civ.split('/')[1], `PRZED ${przed.civ} / PO ${po.civ}`);
}

console.log(`\nfc5-timeline-kontrola: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
