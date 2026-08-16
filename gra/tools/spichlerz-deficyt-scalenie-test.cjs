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
// jest ostrzeżenie o deficycie, więc liczymy tylko bloki callera ostrzeżenia, unikalne dla
// komunikatu o niepokrytym deficycie.
// AKTUALIZACJA (R-DESIGN-11-ZAKLADEK klatka 4, reskin Spichlerza): ostrzeżenie przeniesione z
// `civ-emp-note" style="color:#e07a7a` na klasę `.civ-emp-alert` (kanoniczny callout z §4
// handoffu Designera). Intencja asercji BEZ ZMIAN — nadal pilnuje, że czerwony blok deficytu
// jest DOKŁADNIE JEDEN, czyli że nie wróciła stara, osobna notka "Głód wojska".
ok(
  (spichlerzFn.match(/civ-emp-alert civ-emp-sp-alert/g) || []).length === 1,
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
// N2 (Evaluator, 7a413462): rozszerzone na oba warianty klasy (civ-emp-note ORAZ civ-emp-alert),
// case-insensitive na "głód wojska" — dawny regex pilnował WYŁĄCZNIE literalnej starej klasy
// `civ-emp-note`, której funkcja po reskinie już nigdy nie generuje w TYM miejscu (przeniesiona
// na `civ-emp-alert`) — asercja była więc martwa: przechodziła zawsze, niezależnie od tego, czy
// separatystyczny blok faktycznie wrócił, bo wracałby dziś pod klasą `civ-emp-alert`, nie
// `civ-emp-note`. / EN: broadened to both class variants (civ-emp-note AND civ-emp-alert),
// case-insensitive on "głód wojska" — the old regex guarded ONLY the literal old class name,
// which the function no longer emits here after the reskin (moved to `civ-emp-alert`), so the
// assertion was dead — it always passed regardless of whether the standalone block actually came
// back, since it would resurface today under `civ-emp-alert`, not `civ-emp-note`.
ok(
  !/if \(food\.glodWojska\) \{\s*h \+= `<div class="civ-emp-(?:note|alert)[^`]*głód wojska/i.test(spichlerzFn),
  'stara, samodzielna notka "Głód wojska" (bez miast) usunięta — scalona do wspólnego bloku (sprawdzone dla obu wariantów klasy: civ-emp-note i civ-emp-alert)',
);
// Per-miasto znacznik ostrzegawczy w tabeli ZOSTAJE (szczegół "które miasto"), informacja nie
// jest tracona.
// AKTUALIZACJA (R-DESIGN-11-ZAKLADEK klatka 4, reskin Spichlerza): znak tekstowy ⚠ zamieniony na
// ikonę SVG `chip-warning` przez brandIconSvg() — reguła "zero emoji" z kanonu (§5 handoffu
// Designera). Intencja asercji BEZ ZMIAN — nadal pilnuje, że znacznik przy nazwie miasta jest
// bramkowany tym samym `row.nakarmione === false` i nie został przy reskinie zgubiony.
// N1 (Evaluator, 7a413462): dawny regex `/row\.nakarmione === false[\s\S]*?chip-warning/` był
// NIEOGRANICZONY — `[\s\S]*?` (choć leniwy) i tak przeszuka CAŁĄ resztę wyciętej funkcji, więc
// łapał `chip-warning` gdziekolwiek dalej, nawet niepowiązany z warunkiem (np. gdyby fedMark stał
// się bezwarunkowy, albo znacznik zniknął, a osobny "chip-warning" pojawił się dalej w tej samej
// funkcji). Naprawa: wiąże `chip-warning` z KONKRETNYM wzorcem ternarnym użytym w kodzie
// (`const unfed = row.nakarmione === false; … const fedMark = unfed ? …chip-warning… : '';`), z
// ograniczonym zasięgiem znaków między każdym elementem ({0,400}/{0,200}) — zbyt daleki lub
// niepowiązany (np. bezwarunkowy, if/else zamiast ternary, albo osobny znacznik gdzie indziej w
// funkcji) NIE dopasuje. Zweryfikowane mutacyjnie (3 regresje z werdyktu Evaluatora — bezwarunkowy
// fedMark, usunięty fedMark + niepowiązany "chip-warning" dalej w funkcji, rozbicie na dwa osobne
// if): stary regex łapał 0/3, nowy 3/3. / EN: the old regex was unbounded — even though `[\s\S]*?`
// is lazy, it still scans the REST of the extracted function, so it matched `chip-warning`
// anywhere further down, unrelated to the condition (e.g. an unconditional fedMark, or the marker
// removed with an unrelated "chip-warning" appearing later in the same function). Fix: ties
// `chip-warning` to the EXACT ternary pattern used in the code, with a bounded character window
// between each piece — anything too far away or structurally different (unconditional, if/else
// instead of ternary, or a stray marker elsewhere) will NOT match. Mutation-tested against the 3
// regressions from the Evaluator's verdict: old regex caught 0/3, new regex catches 3/3.
ok(
  /const unfed = row\.nakarmione === false;[\s\S]{0,400}?fedMark = unfed\s*\n?\s*\?[\s\S]{0,400}?chip-warning[\s\S]{0,200}?:\s*'';/.test(spichlerzFn),
  'znacznik przy nazwie miasta w tabeli zachowany, bramkowany bezpośrednio poprzedzającym ternarnym warunkiem row.nakarmione === false (per-miasto szczegół, nie dowolny chip-warning gdziekolwiek dalej w funkcji)',
);
// N-A (Evaluator, a98f63f8): asercja wyżej pilnuje wyłącznie DEKLARACJI `fedMark` — nie tego, czy
// zmienna jest faktycznie WSTAWIONA do wiersza tabeli. Zweryfikowane mutacyjnie przez Evaluatora:
// usunięcie `${fedMark}` z interpolacji wiersza (przy nietkniętej deklaracji) dawało 50/0, czyli
// znacznik znikał z realnego HTML bez żadnej czerwonej bramki. Domyka lukę.
// EN: the assertion above only guards the DECLARATION of `fedMark`, not whether it's actually
// interpolated into the row. Evaluator-verified: stripping `${fedMark}` from the row interpolation
// (declaration left intact) still passed 50/0 — the marker vanished from real HTML with no red
// gate. This closes that gap.
ok(
  /civ-emp-sp-city-nm">\$\{fedMark\}/.test(spichlerzFn),
  'fedMark faktycznie WSTAWIONY do wiersza (nie tylko zadeklarowany) — civ-emp-sp-city-nm">${fedMark}',
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
  /const lastFoodTickForHud = getLastEmpireFoodTick\(0\);/.test(buildHudStateFn),
  'buildHudState czyta getLastEmpireFoodTick(0) — SAM tick co buildEmpireFoodSnap (panel imperium), zero rozjazdu cross-surface',
);
ok(
  /zywnoscMiastNiedokarmionych,/.test(buildHudStateFn),
  'buildHudState zwraca pole zywnoscMiastNiedokarmionych w HudState',
);

// ---------------------------------------------------------------------------
// 3b) P-SPICHLERZ-CENTRALNY-0-VS-CITY-BILANS-MINUS1 (Maciej 2026-08-10): żywy fallback, gdy
//     `_lastTicks` jest jeszcze puste (nowa gra/świeży zapis/przed 1. końcem tury) — bez tego
//     licznik fałszywie zwracał 0, mimo że panel miasta W TEJ SAMEJ CHWILI poprawnie pokazywał
//     deficyt. Fallback musi liczyć NA ŻYWO z foodProj.unfedCityCount, NIE zastępować danych
//     ticku, gdy tick JEST dostępny (rozpoznanie a71a5e3791099fb13, dispatch a34cb3300165d4371).
// ---------------------------------------------------------------------------
ok(
  /lastFoodTickForHud\s*\n?\s*\?\s*lastFoodTickForHud\.perCityRows\.filter\(r => r\.nakarmione === false\)\.length\s*\n?\s*:\s*foodProj\.unfedCityCount;/.test(buildHudStateFn),
  'zywnoscMiastNiedokarmionych: gdy tick DOSTĘPNY liczy dokładnie jak dotychczas (nakarmione===false z ticku, zero zmiany zachowania); gdy tick PUSTY/undefined — żywy fallback z foodProj.unfedCityCount (nie fałszywe 0)',
);

const projectFn = extractFunctionBody(
  mainSrc,
  'function projectPlayerFoodProjection(): {',
  'projectPlayerFoodProjection w main.ts',
);
ok(
  /unfedCityCount: number;/.test(projectFn),
  'projectPlayerFoodProjection deklaruje unfedCityCount w typie zwracanym',
);
ok(
  /unfedCityCount,\s*\n\s*\};/.test(projectFn),
  'projectPlayerFoodProjection zwraca unfedCityCount (wejście żywego fallbacku buildHudState)',
);
ok(
  /for \(const need of deficitNeedsForFeed\) \{\s*\n\s*const covered = Math\.min\(need, Math\.max\(0, centralForFeed\)\);\s*\n\s*centralForFeed -= covered;\s*\n\s*if \(covered < need\) unfedCityCount\+\+;\s*\n\s*\}/.test(projectFn),
  'unfedCityCount liczony DRUGIM przebiegiem identycznym z advanceEmpireFood (empire-food.ts:235-243): centrala maleje sekwencyjnie przez miasta na deficycie, miasto liczy się jako niepokryte tylko gdy pokrycie < potrzeby',
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
// 5) P-SPICHLERZ-CENTRALNY-0-VS-CITY-BILANS-MINUS1 (Maciej 2026-08-10): scenariusz zgłoszenia —
//    tick PUSTY (nowa gra/świeży zapis/przed 1. końcem tury) + miasto z lokalnym deficytem w
//    preview.perCity ("Bilans −1/t") → licznik i tooltip MUSZĄ pokazać niedokarmione miasto na
//    żywo, NIE 0. Replikujemy TU dokładnie ten sam dwuprzebiegowy algorytm co
//    projectPlayerFoodProjection/advanceEmpireFood (nie uproszczenie) — sekcja 3b wyżej
//    weryfikuje osobno, że dokładnie TA implementacja żyje naprawdę w main.ts (regex na
//    źródło), więc te dwa sprawdzenia razem pilnują i kodu, i jego zachowania.
// ---------------------------------------------------------------------------
function liveUnfedCityCount(reserve, perCityBilans) {
  let central = reserve;
  const deficitNeedsForFeed = [];
  for (const bilans of perCityBilans) {
    if (bilans >= 0) central += bilans;
    else deficitNeedsForFeed.push(-bilans);
  }
  let centralForFeed = central;
  let unfedCityCount = 0;
  for (const need of deficitNeedsForFeed) {
    const covered = Math.min(need, Math.max(0, centralForFeed));
    centralForFeed -= covered;
    if (covered < need) unfedCityCount++;
  }
  return unfedCityCount;
}

// Zgłoszenie Macieja dosłownie: nowa gra (reserve=0, tick jeszcze nie istnieje), jedno miasto
// Produkcja +11, Racje −12 -> Bilans −1/t.
ok(
  liveUnfedCityCount(0, [-1]) === 1,
  'scenariusz zgłoszenia (reserve=0, jedno miasto Bilans −1/t): żywy fallback liczy 1 niedokarmione miasto, NIE 0',
);
// Kontrola przytomności: rezerwa w pełni pokrywa deficyt -> 0 niedokarmionych (test musi
// wykrywać regresję w OBIE strony, nie tylko "zawsze > 0").
ok(
  liveUnfedCityCount(5, [-1]) === 0,
  'kontrola przytomności: rezerwa 5 w pełni pokrywa deficyt −1 -> 0 niedokarmionych miast',
);
// Miasta na plusie NIGDY nie liczą się jako niedokarmione, niezależnie od stanu centrali.
ok(
  liveUnfedCityCount(0, [3, 1]) === 0,
  'same miasta na plusie (bilans>=0): 0 niedokarmionych niezależnie od stanu centrali',
);
// Wiele miast na deficycie, rezerwa starcza tylko na część -> sekwencyjne wyczerpywanie
// centrali w KOLEJNOŚCI miast (tak jak advanceEmpireFood, empire-food.ts:235-243), nie równy
// podział ani sortowanie po potrzebie.
ok(
  liveUnfedCityCount(3, [-2, -2]) === 1,
  'rezerwa 3: PIERWSZE miasto (need=2) pokryte w całości, DRUGIE tylko częściowo (1 z 2) -> 1 niedokarmione',
);

// ---------------------------------------------------------------------------
// 6) P-SPICHLERZ-ZERO-MYLACE (poprawka po Evaluatorze runda 1): polska liczba mnoga ma TRZY
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

// ---------------------------------------------------------------------------
// 7) P-SPICHLERZ-SUMA-WZROST-NOMINALNY-VS-EFEKTYWNY (ECHO B, Maciej 2026-08-16): WZROST% per
//    miasto ORAZ wiersz SUMA muszą liczyć wartość EFEKTYWNĄ (miasto głodujące -> 0), tak samo jak
//    effectiveGrowthPctForUi() w cityPanel.ts (`fed ? total : 0`) -- NIE wartość nominalną wprost z
//    silnika (`row.wzrostProcent`). Dowód mutacyjny z rejestru (Evaluator, znalezisko na
//    `a98f63f8`): 3 miasta po 6% nominalnie, 2 niedokarmione -> SUMA pokazywała błędnie 6%,
//    poprawnie powinna 2% (średnia z efektywnych {6,0,0}).
// ---------------------------------------------------------------------------
ok(
  /const wzrostEff = unfed \? 0 : row\.wzrostProcent;/.test(spichlerzFn),
  'per-miasto WZROST% liczony jako wartość EFEKTYWNA (unfed -> 0), nie nominalna row.wzrostProcent wprost',
);
ok(
  /sumWzrost \+= wzrostEff;/.test(spichlerzFn),
  'wiersz SUMA sumuje już EFEKTYWNE wzrosty (wzrostEff), nie nominalne row.wzrostProcent',
);
ok(
  !/sumWzrost \+= row\.wzrostProcent;/.test(spichlerzFn),
  'stara (błędna) linia sumowania wartości nominalnej NIE wraca (regresja do sumWzrost += row.wzrostProcent)',
);

// Reprodukcja niezależna (ta sama formuła co w kodzie, wzorem liveUnfedCityCount w sekcji 5) --
// dowód liczbowy z przykładu Evaluatora w rejestrze: 3 miasta po 6% nominalnie, 2 niedokarmione.
function effectiveGrowthRows(rows) {
  return rows.map(r => ({ ...r, wzrostEff: r.nakarmione === false ? 0 : r.wzrostProcent }));
}
function sumaWzrostAvg(effRows) {
  const suma = effRows.reduce((s, r) => s + r.wzrostEff, 0);
  return Math.round(suma / effRows.length);
}

const evalRows = [
  { name: 'A', wzrostProcent: 6, nakarmione: true },
  { name: 'B', wzrostProcent: 6, nakarmione: false },
  { name: 'C', wzrostProcent: 6, nakarmione: false },
];
const evalEff = effectiveGrowthRows(evalRows);
ok(evalEff[0].wzrostEff === 6, 'miasto nakarmione: WZROST% w komórce = wartość nominalna (6%)');
ok(
  evalEff[1].wzrostEff === 0 && evalEff[2].wzrostEff === 0,
  'miasta niedokarmione: WZROST% w komórce = 0% (nie 6% nominalne z silnika)',
);
ok(
  sumaWzrostAvg(evalEff) === 2,
  'wiersz SUMA (średnia z wartości efektywnych {6,0,0}) = 2%, NIE 6% (dowód Evaluatora z rejestru P-SPICHLERZ-SUMA-WZROST-NOMINALNY-VS-EFEKTYWNY)',
);
// Kontrola przytomności: gdy WSZYSTKIE miasta nakarmione, efektywna SUMA = nominalna SUMA (bez
// regresji dla zdrowego stanu -- ta zmiana nie zmienia niczego, gdy nikt nie głoduje).
const allFedRows = [
  { name: 'A', wzrostProcent: 6, nakarmione: true },
  { name: 'B', wzrostProcent: 4, nakarmione: true },
];
ok(
  sumaWzrostAvg(effectiveGrowthRows(allFedRows)) === 5,
  'kontrola przytomności: wszystkie miasta nakarmione -> SUMA efektywna = SUMA nominalna (5%, średnia z {6,4})',
);

console.log(`\nspichlerz-deficyt-scalenie-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
