'use strict';
/**
 * spichlerz-deficyt-scalenie-test.cjs — P-SPICHLERZ-ZERO-MYLACE (ECHO C Maciej 2026-08-10).
 *
 * Przed tą zmianą liczba magazynu centralnego („W magazynie: 0 🍞", panel imperium →
 * renderSpichlerzCentralnySection) i ostrzeżenie o niepokrytym deficycie żywotnym żyły w DWÓCH
 * rozłącznych miejscach: (a) osobna notka „Głód wojska" TYLKO dla armii (nic o miastach), (b)
 * osobny ⚠ przy nazwie miasta w tabeli niżej (perCityRows), bez podsumowania przy samej liczbie.
 * Sama liczba „0" nie mówiła, czy to zdrowe zero, czy realny niepokryty deficyt. ECHO C Macieja:
 * scalić OBA sygnały w JEDNO miejsce prawdy, TUŻ PRZY liczbie magazynu (empireDetailPanel.ts), i —
 * dla spójności cross-surface (C-039) — w tooltipie/kolorze chipu HUD „Spichlerz" (hud.ts), który
 * pokazuje TĘ SAMĄ liczbę magazynu centralnego poza panelem imperium.
 *
 * Ten test NIE bundluje empireDetailPanel.ts/hud.ts przez esbuild — oba importują SVG przez
 * `?raw`/`import.meta.glob` (ten sam znany pre-istniejący problem harnessu co
 * map-field-battle-test.cjs/pre-battle-save-test.cjs, patrz CLAUDE.md §BRAMKI). Zamiast tego,
 * wzorem `spichlerz-cap-citypanel-wiring-test.cjs` (chroni jedną linię wiring w cityPanel.ts) i
 * `surowce-dostep-test.cjs` (testuje kontrakt danych, nie DOM), wycina realne ciała funkcji jako
 * tekst i sprawdza regexem, że scalona logika istnieje NAPRAWDĘ w źródle — nie w reimplementacji.
 *
 * Run from gra/:  node tools/spichlerz-deficyt-scalenie-test.cjs
 */

const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

/** Wycina ciało funkcji `name(...) {` do zamykającej klamry na wcięciu top-level (kolejne `\nfunction`/`\nexport function`). */
function extractFunctionBody(src, startMarker, label) {
  const start = src.indexOf(startMarker);
  ok(start >= 0, `znaleziono ${label}`);
  if (start < 0) return '';
  const nextFn = src.slice(start + startMarker.length).search(/\n(export )?function /);
  const end = nextFn >= 0 ? start + startMarker.length + nextFn : src.length;
  return src.slice(start, end);
}

// ---------------------------------------------------------------------------
// 1) empireDetailPanel.ts — renderSpichlerzCentralnySection: scalenie przy liczbie magazynu.
// ---------------------------------------------------------------------------
const EMPIRE_PANEL_TS = path.join(__dirname, '..', 'src', 'ui', 'empireDetailPanel.ts');
const empireSrc = fs.readFileSync(EMPIRE_PANEL_TS, 'utf8');

const spichlerzFn = extractFunctionBody(
  empireSrc,
  'function renderSpichlerzCentralnySection(food: EmpireFoodSnap): string {',
  'renderSpichlerzCentralnySection w empireDetailPanel.ts',
);

ok(
  /const unfedRows = food\.perCityRows\.filter\(r => r\.nakarmione === false\)/.test(spichlerzFn),
  'renderSpichlerzCentralnySection liczy miasta niedokarmione z food.perCityRows (ten sam tick co ⚠ w tabeli)',
);

// Scalone: JEDEN warunek gałęzi bramkuje OBA sygnały (miasta + wojsko) w JEDNYM bloku ostrzeżenia —
// nie dwa niezależne "if" (stary kod miał osobny "if (food.glodWojska)" PRZED tabelą i osobny ⚠ W tabeli).
ok(
  /if \(unfedRows\.length > 0 \|\| food\.glodWojska\) \{/.test(spichlerzFn),
  'JEDEN warunek gałęzi łączy "miasto niedokarmione" i "głód wojska" (nie dwa osobne if)',
);
// Uwaga: "civ-emp-note" jako klasa CSS jest też użyta gdzie indziej w tej funkcji (notka
// informacyjna "Podsumowanie tury pojawi się..." gdy brak jeszcze pierwszego ticku) — to NIE
// jest ostrzeżenie o deficycie, więc liczymy tylko bloki z czerwonym stylem deficytu
// (color:#e07a7a), unikalnym dla ostrzeżenia o niepokrytym deficycie.
ok(
  (spichlerzFn.match(/civ-emp-note" style="color:#e07a7a/g) || []).length === 1,
  'dokładnie JEDEN czerwony blok ostrzeżenia o deficycie — bez starej osobnej notki "Głód wojska"',
);
ok(
  /Realny niepokryty deficyt żywności/.test(spichlerzFn),
  'nowy scalony komunikat nazywa wprost "realny niepokryty deficyt żywności" (nie goła liczba bez kontekstu)',
);
// Kolejność: blok ostrzeżenia musi siedzieć PRZED tabelą miast (perCityRows.length > 0) —
// czyli TUŻ PRZY liczbie magazynu, nie za tabelą.
const warnIdx = spichlerzFn.indexOf('Realny niepokryty deficyt żywności');
const tableIdx = spichlerzFn.indexOf('food.perCityRows.length > 0');
ok(warnIdx >= 0 && tableIdx >= 0 && warnIdx < tableIdx,
  'ostrzeżenie renderuje się PRZED tabelą miast — tuż przy nagłówku "W magazynie", nie po nim');
// Regresja architektury: stara, ROZŁĄCZNA notka "Głód wojska — magazyn centralny..." (bez
// wzmianki o miastach) NIE może dalej istnieć jako osobny, samodzielny blok w tej funkcji.
ok(
  !/if \(food\.glodWojska\) \{\s*h \+= `<div class="civ-emp-note"[^`]*Głód wojska/.test(spichlerzFn),
  'stara, samodzielna notka "Głód wojska" (bez miast) usunięta — scalona do wspólnego bloku',
);
// Per-miasto ⚠ w tabeli ZOSTAJE (szczegół "które miasto"), informacja nie jest tracona.
ok(
  /row\.nakarmione === false.*⚠/.test(spichlerzFn),
  '⚠ przy nazwie miasta w tabeli zachowane (per-miasto szczegół, nie duplikat — uzupełnienie zbiorczego komunikatu)',
);

// ---------------------------------------------------------------------------
// 2) hud.ts — spichlerzChipTitle: cross-surface (C-039), ta sama liczba magazynu na HUD mapy.
// ---------------------------------------------------------------------------
const HUD_TS = path.join(__dirname, '..', 'src', 'ui', 'hud.ts');
const hudSrc = fs.readFileSync(HUD_TS, 'utf8');

const chipTitleFn = extractFunctionBody(
  hudSrc,
  'function spichlerzChipTitle(s: HudState): string {',
  'spichlerzChipTitle w hud.ts',
);
ok(
  /s\.zywnoscMiastNiedokarmionych/.test(chipTitleFn),
  'tooltip chipu HUD „Spichlerz" czyta zywnoscMiastNiedokarmionych — ta sama liczba magazynu, spójna z panelem imperium',
);
ok(
  /Realny niepokryty deficyt/.test(chipTitleFn),
  'tooltip chipu HUD używa tej samej frazy "Realny niepokryty deficyt" co panel imperium (spójność komunikatu)',
);

ok(
  /HudState \{[\s\S]*?zywnoscMiastNiedokarmionych\?: number;/.test(hudSrc),
  'HudState deklaruje pole zywnoscMiastNiedokarmionych?: number',
);

const chipBlockMatch = hudSrc.match(/label: 'Spichlerz',[\s\S]*?act: 'spichlerz',/);
ok(!!chipBlockMatch, 'znaleziono blok chip6cHtml dla Spichlerza w renderBarD1B');
ok(
  !!chipBlockMatch && /zywnoscMiastNiedokarmionych/.test(chipBlockMatch[0]),
  'rateWarn (kolor chipu) uwzględnia zywnoscMiastNiedokarmionych — chip czerwony też przy niedokarmionych miastach',
);

// ---------------------------------------------------------------------------
// 3) main.ts — buildHudState: wiring pola z tego samego ticku, co panel imperium (buildEmpireFoodSnap).
// ---------------------------------------------------------------------------
const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

const buildHudStateFn = extractFunctionBody(
  mainSrc,
  'function buildHudState(): HudState {',
  'buildHudState w main.ts',
);
ok(
  /getLastEmpireFoodTick\(0\)\?\.perCityRows.*\)\s*\n?\s*\.filter\(r => r\.nakarmione === false\)\.length/.test(buildHudStateFn),
  'buildHudState liczy zywnoscMiastNiedokarmionych z getLastEmpireFoodTick(0).perCityRows — SAM tick co buildEmpireFoodSnap (panel imperium), zero rozjazdu cross-surface',
);
ok(
  /zywnoscMiastNiedokarmionych,/.test(buildHudStateFn),
  'buildHudState zwraca pole zywnoscMiastNiedokarmionych w HudState',
);

// ---------------------------------------------------------------------------
// 4) Logika kontraktu (bez importu modułów UI — wzorem surowce-dostep-test.cjs): odtwarzamy
//    dokładnie ten sam filtr co w kodzie i sprawdzamy oczekiwane zachowanie na mockowanych danych.
// ---------------------------------------------------------------------------
function unfedRowsOf(perCityRows) {
  return perCityRows.filter(r => r.nakarmione === false);
}

const healthyRows = [
  { cityId: 'a', name: 'Ateny', bilans: 3, nakarmione: true },
  { cityId: 'b', name: 'Sparta', bilans: 1, nakarmione: true },
];
ok(unfedRowsOf(healthyRows).length === 0, 'zdrowy stan: 0 miast niedokarmionych mimo zapasy=0 (nie znaczy automatycznie deficytu)');

const deficitRows = [
  { cityId: 'a', name: 'Ateny', bilans: 3, nakarmione: true },
  { cityId: 'b', name: 'Sparta', bilans: -4, nakarmione: false },
];
const unfed = unfedRowsOf(deficitRows);
ok(unfed.length === 1 && unfed[0].name === 'Sparta', 'deficyt: dokładnie 1 miasto niedokarmione, nazwane po imieniu (Sparta)');

// ---------------------------------------------------------------------------
// 5) P-SPICHLERZ-ZERO-MYLACE (poprawka po Evaluatorze runda 1): polska liczba mnoga ma TRZY
//    formy (1 / 2-4 poza 12-14 / 5+ i 12-14), nie dwie. Wycinamy realny helper z każdego pliku
//    (nie reimplementację) i wywołujemy go naprawdę — wzorem "extractFunctionBody" wyżej, tylko
//    tu dodatkowo ewaluujemy wycięty kod (po zdjęciu adnotacji typów TS), żeby sprawdzić
//    faktyczne zachowanie, nie samą obecność wzorca regexem.
// ---------------------------------------------------------------------------
function tsFnToCallable(fnSrc, name, label) {
  // Zdejmujemy adnotacje typów TS (": number" / ": string"), żeby uzyskać czysty JS do eval.
  const jsSrc = fnSrc.replace(/:\s*number/g, '').replace(/:\s*string/g, '');
  ok(jsSrc.trim().length > 0, `wycięto niepustą treść ${label}`);
  // Deklaracja funkcji jest hoistowana wewnątrz Function body — "return name" zwraca
  // realną, wywoływalną funkcję z wyciętego (a nie zreimplementowanego) źródła.
  // eslint-disable-next-line no-new-func
  return new Function(`${jsSrc}\nreturn ${name};`)();
}

function extractPluralFn(src, name) {
  const marker = `function ${name}(n: number): string {`;
  const start = src.indexOf(marker);
  ok(start >= 0, `znaleziono ${name}`);
  if (start < 0) return null;
  const nextFn = src.slice(start + marker.length).search(/\n(export )?function /);
  const end = nextFn >= 0 ? start + marker.length + nextFn : src.length;
  const fnSrc = src.slice(start, end).trimEnd();
  return tsFnToCallable(fnSrc, name, name);
}

const hudPluralFn = extractPluralFn(hudSrc, 'miastoNiedokarmioneWordHud');
const empirePluralFn = extractPluralFn(empireSrc, 'miastoNiedokarmioneWord');

const pluralCases = [
  [1, 'miasto niedokarmione'],
  [2, 'miasta niedokarmione'],
  [3, 'miasta niedokarmione'],
  [4, 'miasta niedokarmione'],
  [5, 'miast niedokarmionych'],
  [11, 'miast niedokarmionych'],
  [12, 'miast niedokarmionych'],
  [14, 'miast niedokarmionych'],
  [22, 'miasta niedokarmione'],
];

for (const [n, expected] of pluralCases) {
  if (hudPluralFn) {
    ok(hudPluralFn(n) === expected, `hud.ts miastoNiedokarmioneWordHud(${n}) === "${expected}" (got "${hudPluralFn(n)}")`);
  }
  if (empirePluralFn) {
    ok(empirePluralFn(n) === expected, `empireDetailPanel.ts miastoNiedokarmioneWord(${n}) === "${expected}" (got "${empirePluralFn(n)}")`);
  }
}

console.log(`\nspichlerz-deficyt-scalenie-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
