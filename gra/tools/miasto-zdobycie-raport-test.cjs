'use strict';
/**
 * miasto-zdobycie-raport-test.cjs — R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1.
 *
 * Cel: dowieść, że raport z przejęcia miasta MÓWI PRAWDĘ i ma STRUKTURĘ.
 *   GOAL 1 — komunikat przejęcia stolicy nie twierdzi już, że skarbiec przepadł, i podaje
 *            faktycznie przejętą kwotę; przepada wyłącznie pula pracy (dwa osobne losy);
 *   GOAL 2 — treść to LISTA POZYCJI etykieta/wartość, pozycje zerowe nie powstają,
 *            zero skrótów deweloperskich („tech(y)", „Power"), bez powtórzeń jednostki;
 *   GOAL 3 — WSZYSTKIE TRZY lejki przejęcia (recon D dispatchu) zapisują wpis w panelu
 *            WYDARZENIA, ze szczegółami po kliknięciu;
 *   GOAL 4 — zwykłe miasto nadal NIE daje łupu i raport mówi to wprost („Łup: brak").
 *
 * main.ts nie jest bundlowalny (jedno wielkie domknięcie, zero eksportów — patrz nagłówki
 * capital-capture-test.cjs / eliminacja-lup-kwoty-test.cjs). Dlatego ten test:
 *   1. wycina z main.ts BLOK CZYSTY po jawnych markerach `BLOK CZYSTY: POCZATEK/KONIEC`,
 *      transpiluje go esbuildem (loader 'ts') i URUCHAMIA — asercje na FAKTYCZNIE
 *      wyprodukowanych wierszach, nie na kodzie źródłowym;
 *   2. wycina i URUCHAMIA `reportRowsHtml` z ui/cityCaptureNotice.ts — dowód STRUKTURALNY
 *      (każda pozycja to osobny element `.civ-ccn-row` z osobnymi span-ami etykieta/wartość),
 *      bo „ułożenie" jednego sklejonego stringa w jednym `<div>` jest niemożliwe;
 *   3. dopiero pokrycie trzech lejków i podpięcie kliknięcia sprawdza po źródle — te
 *      wywołania siedzą w domknięciu main.ts i nie dają się wykonać poza grą; każdy lejek
 *      dostaje OSOBNĄ asercję na OSOBNYM, wyciętym ciele funkcji (nie jedno zdanie
 *      „pokryte", patrz „Tryb pierwszy" reguły przeciw samooszukiwaniu).
 *
 * Nietautologiczność (Tryb czwarty): przywrócenie w main.ts choćby jednego „tech(y)"
 * czerwieni sekcję 4 (skan negatywny), a usunięcie `recordCityCaptureEvent` z dowolnego
 * z trzech lejków czerwieni jego własną asercję w sekcji 5.
 *
 * Usage (z gra/): node tools/miasto-zdobycie-raport-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const mainSrc = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
const noticeSrc = fs.readFileSync(path.resolve(GRA, 'src', 'ui', 'cityCaptureNotice.ts'), 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  OK: ' + label); }
  else { fail++; console.log('  FAIL: ' + label); }
}
function eq(a, b, label) {
  ok(a === b, `${label} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}
/** Wycina komentarze — asercja „ciało funkcji woła X" nie może trafić we wzmiankę w komentarzu. */
function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}
function sliceBetween(src, startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  if (a < 0) return null;
  const b = src.indexOf(endMarker, a + startMarker.length);
  if (b < 0) return null;
  return src.slice(a, b);
}
function runTs(code, tail) {
  const js = esbuild.transformSync(code + '\n' + tail, { loader: 'ts', format: 'cjs' }).code;
  // eslint-disable-next-line no-new-func
  return new Function(js)();
}
/** Wygodne skróty na wierszach wyniku. */
const labels = rows => rows.map(r => r.label);
const rowFor = (rows, label) => rows.find(r => r.label === label) || null;

// ===========================================================================
// 0. Wycięcie i uruchomienie BLOKU CZYSTEGO z main.ts
// ===========================================================================
console.log('0. BLOK CZYSTY z main.ts — wycięcie i egzekucja');
const PURE_START = '// R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — BLOK CZYSTY: POCZATEK';
const PURE_END = '// R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — BLOK CZYSTY: KONIEC';
const pureBlock = sliceBetween(mainSrc, PURE_START, PURE_END);
ok(pureBlock !== null, '0a: znaleziono BLOK CZYSTY po markerach POCZATEK/KONIEC');
ok(!!pureBlock && pureBlock.includes('function buildCityCaptureReportRows('),
  '0b: blok zawiera buildCityCaptureReportRows');
ok(!!pureBlock && pureBlock.includes('function captureReportOneLine('),
  '0c: blok zawiera captureReportOneLine');

let build = null;
let oneLine = null;
let shortLine = null;
try {
  const api = runTs(pureBlock,
    'return { buildCityCaptureReportRows, captureReportOneLine, captureReportShortLine };');
  build = api.buildCityCaptureReportRows;
  oneLine = api.captureReportOneLine;
  shortLine = api.captureReportShortLine;
} catch (e) {
  console.log('  (egzekucja bloku rzuciła: ' + e.message + ')');
}
ok(typeof build === 'function' && typeof oneLine === 'function' && typeof shortLine === 'function',
  '0d: blok wykonał się i wystawił wszystkie trzy funkcje');
if (typeof build !== 'function') {
  console.log(`\nPODSUMOWANIE: ${pass} passed, ${fail} failed`);
  process.exit(1);
}

const BAZA = {
  mocEtykieta: 'Moc',
  ludnosc: 4,
  budynki: 2,
  zloto: 0,
  nauka: 0,
  technologie: 0,
  moc: 0,
  barbarzyncaZdobywca: false,
};

// ===========================================================================
// 1. GOAL 1 — stolica, cywilizacja PRZEŻYWA, skarbiec > 0.
//    Kwota faktyczna obecna; słowo „przepadł" NIE dotyczy skarbca; pula pracy przepada.
// ===========================================================================
console.log('1. Stolica (cyw. przeżywa), skarbiec 1234 — kwota zamiast „skarbiec przepadł"');
{
  const rows = build({ ...BAZA, kind: 'stolica', zloto: 1234 });
  const line = oneLine(rows);
  const skarb = rowFor(rows, 'Złoto ze skarbca');
  ok(skarb !== null, '1a: jest pozycja „Złoto ze skarbca"');
  eq(skarb && skarb.value, '+1234', '1b: pozycja niesie FAKTYCZNĄ przejętą kwotę');
  ok(!/skarb[^·]*przepad/i.test(line),
    '1c: NIC w raporcie nie mówi, że skarbiec przepadł (defekt recon A — komunikat kłamał)');
  const praca = rowFor(rows, 'Pula pracy');
  ok(praca !== null && /przepad/.test(praca.value),
    '1d: pula pracy nadal przepada — WŁASNA pozycja, nie sklejona ze skarbcem');
  ok(line.indexOf('Złoto ze skarbca') < line.indexOf('Pula pracy'),
    '1e: oba losy rozróżnione wprost i w kolejności zdobycz → strata');
}

// ===========================================================================
// 2. GOAL 2 (E5) — stolica, skarbiec = 0: pozycja o skarbcu POMINIĘTA, nie „pusty".
// ===========================================================================
console.log('2. Stolica, skarbiec 0 — pozycja pominięta, nie „Skarbiec był pusty"');
{
  const rows = build({ ...BAZA, kind: 'stolica', zloto: 0 });
  const line = oneLine(rows);
  ok(rowFor(rows, 'Złoto ze skarbca') === null,
    '2a: BRAK pozycji o skarbcu (pominięta, nie wypisana z zerem)');
  ok(!/pust/i.test(line), '2b: nigdzie nie pada „pusty" — zero nie jest komunikatem');
  ok(!/\+0\b/.test(line), '2c: żadna pozycja nie ma wartości „+0"');
  const lup = rowFor(rows, 'Łup');
  ok(lup !== null && lup.value === 'brak',
    '2d: skoro łupu nie było — DOKŁADNIE jedna świadoma linia „Łup: brak"');
  ok(rows.filter(r => r.label === 'Łup').length === 1, '2e: linia „Łup" występuje raz');
}

// ===========================================================================
// 3. GOAL 2 (E5, E2) — eliminacja z zerowymi technologiami i Mocą.
// ===========================================================================
console.log('3. Eliminacja, technologie 0 i Moc 0 — te pozycje NIE występują');
{
  const rows = build({ ...BAZA, kind: 'eliminacja', zloto: 900, nauka: 16, technologie: 0, moc: 0 });
  const line = oneLine(rows);
  ok(rowFor(rows, 'Technologie') === null, '3a: BRAK pozycji „Technologie" przy zerze');
  ok(rowFor(rows, 'Moc') === null, '3b: BRAK pozycji „Moc" przy zerze');
  const nauka = rowFor(rows, 'Punkty nauki');
  ok(nauka !== null && nauka.value === '+16', '3c: nauka podana jako liczba, bez zera-szumu');
  ok(!/nauk[ia][^·]*nauk/i.test(line),
    '3d: jednostka „nauka" nie pada dwa razy w jednej pozycji (defekt E2 „Nauka: +16 nauki")');
  ok(rows.every(r => !r.value.includes(r.label)),
    '3e: żadna wartość nie powtarza własnej etykiety');
}
{
  const rows = build({ ...BAZA, kind: 'eliminacja', zloto: 900, nauka: 16, technologie: 3, moc: 420 });
  ok(rowFor(rows, 'Technologie') && rowFor(rows, 'Technologie').value === '+3',
    '3f: przy niezerowej liczbie technologii pozycja JEST (regres w drugą stronę)');
  ok(rowFor(rows, 'Moc') && rowFor(rows, 'Moc').value === '+420',
    '3g: przy niezerowej Mocy pozycja JEST, pod etykietą gracza „Moc"');
}

// ===========================================================================
// 4. GOAL 2 (E3, E4) — skan NEGATYWNY: „tech(y)" i „Power" w tekście dla gracza.
// ===========================================================================
console.log('4. Skan negatywny — zero „tech(y)", zero „Power" w treści dla gracza');
{
  const matrix = [];
  for (const kind of ['zwykle', 'stolica', 'eliminacja']) {
    for (const barb of [false, true]) {
      for (const z of [0, 1234]) {
        for (const t of [0, 3]) {
          matrix.push(build({
            ...BAZA, kind, zloto: z, nauka: z ? 16 : 0, technologie: t, moc: t ? 420 : 0,
            barbarzyncaZdobywca: barb,
          }));
        }
      }
    }
  }
  const allText = matrix.map(rows => oneLine(rows)).join(' | ');
  eq(matrix.length, 24, '4a: przebadano pełną matrycę 24 kombinacji wejścia');
  ok(!allText.includes('tech(y)'),
    '4b: „tech(y)" nie pada w ŻADNEJ z 24 kombinacji wyprodukowanego tekstu');
  ok(!/\bPower\b/.test(allText),
    '4c: „Power" nie pada w ŻADNEJ z 24 kombinacji (etykietą gracza jest „Moc")');
  // Skan po KODZIE (komentarze wycięte) — opis defektu w komentarzu ma prawo cytować
  // stary skrót, natomiast jego powrót do treści dla gracza czerwieni tę asercję.
  const mainCode = stripComments(mainSrc);
  ok(!mainCode.includes('tech(y)'),
    '4d: literał „tech(y)" zniknął z KODU main.ts (przywrócenie go czerwieni tę asercję)');
  ok(!mainCode.includes('Zdobycze Power'),
    '4e: literał „Zdobycze Power" zniknął z KODU main.ts');
  ok(mainSrc.includes('mocEtykieta: mocLabel()'),
    '4f: etykieta Mocy pochodzi z ui/power-labels.ts (mocLabel), nie z literału w main.ts');
}

// ===========================================================================
// 5. GOAL 3 — TRZY lejki przejęcia (recon D), TRZY osobne asercje na TRZECH ciałach.
// ===========================================================================
console.log('5. Trzy lejki przejęcia — każdy zapisuje wpis w panelu WYDARZENIA');
{
  const lejki = [
    {
      nazwa: 'applyCityCaptureToMap (wejście zbrojne: bitwa o miasto / szturm muru / puste miasto)',
      start: '    function applyCityCaptureToMap(',
      end: '\n    function refreshMapAfterCityCapture(',
      klucz: '5a',
    },
    {
      nazwa: 'resolveSiegeSurrender (kapitulacja głodowa)',
      start: '    function resolveSiegeSurrender(cityId: string): void {',
      end: '\n    function endMapSiege(',
      klucz: '5b',
    },
    {
      nazwa: 'runCapitalCapturePlunder (ścieżka stolicy / eliminacji)',
      start: '    function runCapitalCapturePlunder(',
      end: '\n    function maybeResolveBronzeForcedWarOnCityCapture(',
      klucz: '5c',
    },
  ];
  for (const l of lejki) {
    const body = sliceBetween(mainSrc, l.start, l.end);
    ok(body !== null, `${l.klucz}-0: znaleziono ciało lejka ${l.nazwa}`);
    const code = body === null ? '' : stripComments(body);
    ok(code.includes('recordCityCaptureEvent({'),
      `${l.klucz}: lejek ${l.nazwa} woła recordCityCaptureEvent`);
  }
  // Cztery wywołania, nie trzy: lejek stołeczny ma DWA zdarzenia (Zdarzenie 1 „stolica,
  // cywilizacja przeżywa" i Zdarzenie 2 „eliminacja"), każde z własnym zestawem wierszy.
  const recCount = (stripComments(mainSrc).match(/recordCityCaptureEvent\(\{/g) || []).length;
  eq(recCount, 4, '5d: cztery wywołania rejestratora — 1 + 1 + 2 (lejek stołeczny ma dwa zdarzenia)');
  const kapitalBody = stripComments(sliceBetween(mainSrc, '    function runCapitalCapturePlunder(',
    '\n    function maybeResolveBronzeForcedWarOnCityCapture(') || '');
  eq((kapitalBody.match(/recordCityCaptureEvent\(\{/g) || []).length, 2,
    '5e: lejek stołeczny rejestruje OBA swoje zdarzenia (przejęcie stolicy ORAZ eliminację)');
}

// ===========================================================================
// 6. GOAL 4 — zwykłe miasto: wpis istnieje i mówi o BRAKU łupu, nie o zdobyczy.
// ===========================================================================
console.log('6. Zwykłe miasto — raport mówi prawdę: co przejęto i że łupu brak');
{
  const rows = build({ ...BAZA, kind: 'zwykle' });
  const line = oneLine(rows);
  eq(labels(rows).join('|'), 'Ludność|Budynki|Łup',
    '6a: dokładnie trzy pozycje: co przejęto (ludność, budynki) + brak łupu');
  eq(rowFor(rows, 'Łup').value, 'brak', '6b: łup nazwany wprost brakiem (ECHO 1: bez nowej mechaniki)');
  ok(rowFor(rows, 'Złoto ze skarbca') === null && rowFor(rows, 'Punkty nauki') === null
    && rowFor(rows, 'Technologie') === null && rowFor(rows, 'Moc') === null,
    '6c: zwykłe miasto NIE dostaje żadnej pozycji łupu — mechanika bez zmian');
  ok(rowFor(rows, 'Pula pracy') === null,
    '6d: zwykłe miasto nie traci puli pracy — ta pozycja jest wyłącznie stołeczna');
  ok(line.includes('Ludność: +4') && line.includes('Budynki: +2'),
    '6e: raport wymienia FAKTYCZNIE przejęte miasto/ludność/budynki');
}

// ===========================================================================
// 7. Regresja — gałąź barbarzyńska zachowuje swój sens (uwaga recon E).
// ===========================================================================
console.log('7. Gałąź barbarzyńska — ofiara traci, barbarzyńcy nie dziedziczą');
{
  const rows = build({
    ...BAZA, kind: 'eliminacja', zloto: 1234, nauka: 88, technologie: 3, moc: 0,
    barbarzyncaZdobywca: true,
  });
  const lup = rowFor(rows, 'Łup');
  ok(lup !== null && /barbarzyńcy nie dziedziczą/.test(lup.value),
    '7a: własna pozycja mówi wprost, że barbarzyńcy nie dziedziczą łupu');
  ok(rowFor(rows, 'Złoto ze skarbca') === null && rowFor(rows, 'Punkty nauki') === null
    && rowFor(rows, 'Technologie') === null,
    '7b: mimo niezerowych kwot ŻADNA pozycja nie przypisuje ich barbarzyńcom');
  ok(rowFor(rows, 'Pula pracy') !== null,
    '7c: pula pracy ofiary przepada tak samo — strata ofiary, nie nagroda zdobywcy');
}

// ===========================================================================
// 8. GOAL 2 (Tryb trzeci) — DOWÓD STRUKTURALNY: modal renderuje WIERSZE.
// ===========================================================================
console.log('8. Modal renderuje WIERSZE, nie jeden sklejony string');
{
  const fnStart = noticeSrc.indexOf('function reportRowsHtml(');
  ok(fnStart >= 0, '8a: znaleziono reportRowsHtml w ui/cityCaptureNotice.ts');
  const fnEnd = fnStart >= 0 ? noticeSrc.indexOf('\nfunction modalIcon(', fnStart) : -1;
  ok(fnEnd > fnStart, '8b: znaleziono koniec reportRowsHtml');
  const fnCode = fnStart >= 0 && fnEnd > fnStart ? noticeSrc.slice(fnStart, fnEnd) : '';
  let html = '';
  try {
    const render = runTs(
      'function esc(s: string): string { return s; }\n' + fnCode,
      'return reportRowsHtml;',
    );
    html = render([
      { label: 'Ludność', value: '+4', tone: 'gain' },
      { label: 'Złoto ze skarbca', value: '+1234', tone: 'gain' },
      { label: 'Pula pracy', value: 'przepadła', tone: 'loss' },
    ]);
  } catch (e) {
    console.log('  (egzekucja reportRowsHtml rzuciła: ' + e.message + ')');
  }
  const rowCount = (html.match(/class="civ-ccn-row /g) || []).length;
  eq(rowCount, 3, '8c: trzy pozycje dają TRZY osobne elementy wiersza (nie jeden <div>)');
  eq((html.match(/civ-ccn-row-lbl/g) || []).length, 3, '8d: każdy wiersz ma własny span etykiety');
  eq((html.match(/civ-ccn-row-val/g) || []).length, 3, '8e: każdy wiersz ma własny span wartości');
  ok(html.includes('>Złoto ze skarbca<') && html.includes('>+1234<'),
    '8f: etykieta i wartość są w ROZŁĄCZNYCH węzłach — dają się ułożyć w dwie kolumny');
  ok(html.includes('civ-ccn-row-loss'), '8g: ton pozycji (strata) trafia do klasy wiersza');
  ok(render0Empty(), '8h: pusta lista nie renderuje nagłówka „Bilans zdobycia"');
  function render0Empty() {
    try {
      const render = runTs('function esc(s: string): string { return s; }\n' + fnCode, 'return reportRowsHtml;');
      return render([]) === '' && render(undefined) === '';
    } catch { return false; }
  }
  ok(noticeSrc.includes('reportRows?: readonly CaptureReportRow[];'),
    '8i: CityCaptureNoticeOpts przyjmuje wiersze, nie tylko string');
  ok(/reportRowsHtml\(reportRows\)/.test(noticeSrc),
    '8j: modal zdobycia miasta faktycznie wstawia wiersze do swojego HTML');
  ok(noticeSrc.includes('export function showCaptureReportNotice('),
    '8k: istnieje modal raportu otwierany po turach (klik z panelu WYDARZENIA)');
}

// ===========================================================================
// 9. GOAL 3 — wpis w panelu i szczegóły PO KLIKNIĘCIU (wzorzec recordCivElimEvent).
// ===========================================================================
console.log('9. Wpis w panelu WYDARZENIA + szczegóły po kliknięciu');
{
  // Karta niesie tresc SKROCONA (sam lup), modal — pelny bilans. Ten sam podzial co
  // recordCivElimEvent (karta) / civElimNotice.ts (modal).
  const rows = build({ ...BAZA, kind: 'eliminacja', zloto: 1234, nauka: 16, technologie: 2, moc: 418 });
  const krotka = shortLine(rows);
  const pelna = oneLine(rows);
  ok(krotka.length < pelna.length, '9-0a: skrót na kartę jest krótszy niż pełny bilans');
  ok(!krotka.includes('Ludność') && !krotka.includes('Pula pracy'),
    '9-0b: karta pomija „co przejęliśmy" i „co przepadło" — to jest treść modalu');
  ok(krotka.includes('Złoto ze skarbca: +1234') && krotka.includes('Moc: +418'),
    '9-0c: karta niesie sam łup, z faktycznymi kwotami');
  ok(pelna.includes('Ludność: +4') && pelna.includes('Pula pracy: przepadła — nie przechodzi na zdobywcę'),
    '9-0d: modal dostaje PEŁNY bilans, nic z niego nie ginie');
  ok(shortLine(build({ ...BAZA, kind: 'zwykle' })) === 'Łup: brak',
    '9-0e: zwykłe miasto — karta mówi wprost „Łup: brak"');
}
{
  const code = stripComments(mainSrc);
  ok(code.includes("const CITY_CAPTURE_EVENT_PREFIX = 'capture-';"),
    '9a: rodzina wpisów ma własny, rozłączny prefiks id');
  ok(/warEventLog\.unshift\(\{[\s\S]{0,400}?id: evId,/.test(
    sliceBetween(code, 'function recordCityCaptureEvent(', 'function cityCaptureEventLinkFor(') || ''),
    '9b: rejestrator pisze BEZPOŚREDNIO do warEventLog (przeżywa koniec tury, jak elim-cs-*)');
  const rec = sliceBetween(code, 'function recordCityCaptureEvent(', 'function cityCaptureEventLinkFor(') || '';
  ok(rec.includes('if (args.oldOwner !== 0 && args.newOwner !== 0) return;'),
    '9c: przejęcia bez udziału gracza nie zaśmiecają jego panelu (jak recordWarDeclarationEvent)');
  ok(rec.includes('if (cityCaptureEventDetails.has(evId)) return;'),
    '9d: powtórne wywołanie dla tego samego miasta/tury jest no-opem (trzy lejki, jeden wpis)');
  ok(rec.includes('cityCaptureEventDetails.set(evId,'),
    '9e: pełna treść (wiersze) trafia do mapy szczegółów pod tym samym id');
  ok(rec.includes('captureReportShortLine(args.rows)') && rec.includes('rows: [...args.rows],'),
    '9e2: karta dostaje skrót, mapa szczegółów KOMPLET wierszy (karta ≠ modal)');
  ok(code.includes('function openCityCaptureEventLink(id: string): boolean {')
    && /showCaptureReportNotice\(\{/.test(code),
    '9f: kliknięcie karty otwiera modal raportu z zapisanymi wierszami');
  ok(code.includes('?? cityCaptureEventLinkFor(ev.id)'),
    '9g: karta dostaje widoczny skrót z TEGO SAMEGO resolvera co klik (afordancja = akcja)');
  ok(code.includes('if (openCityCaptureEventLink(id)) return;'),
    '9h: handler kliknięcia podpięty w onEventClick');
  ok(code.includes('cityCaptureEventDetails.delete(id);'),
    '9i: ✕ na karcie usuwa też szczegóły (bez wycieku po dismissie)');
  eq((code.match(/cityCaptureEventDetails\.clear\(\);/g) || []).length, 2,
    '9j: mapa szczegółów zerowana w OBU resetach partii, w parze z warEventLog');
}

// ===========================================================================
// 10. Granica dispatchu — ekonomia przejęcia BEZ ZMIAN.
// ===========================================================================
console.log('10. Ekonomia przejęcia nietknięta (ten temat zmienia tylko to, co gracz widzi)');
{
  const pure = stripComments(pureBlock);
  ok(!/access\.|setTreasury|setNaukaPool|setPracaPool|addResearchedTechs/.test(pure),
    '10a: blok raportu nie dotyka żadnego akcesora zasobów — tylko opisuje');
  ok(!/zdobyczePowerByOwner\.set/.test(pure), '10b: blok raportu nie przyznaje Mocy');
  const elim = sliceBetween(mainSrc, '    function runCapitalCapturePlunder(',
    '\n    function maybeResolveBronzeForcedWarOnCityCapture(') || '';
  ok(elim.includes('const powerGain = barbarianCapturedPowerGain(lostPower, barbCaptor);'),
    '10c: reguła dziedziczenia Mocy przez barbarzyńców bez zmian');
  ok(elim.includes('moc: powerGain,'),
    '10d: raport podaje Moc FAKTYCZNIE przejętą (powerGain), nie utraconą przez ofiarę');
}

console.log('');
console.log(`miasto-zdobycie-raport-test: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
