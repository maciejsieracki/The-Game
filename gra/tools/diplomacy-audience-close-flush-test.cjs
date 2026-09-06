'use strict';
/**
 * diplomacy-audience-close-flush-test.cjs
 *
 * N3 (Evaluator FAIL `a7de65b0`, dyspozycje/PYTANIA-OTWARTE.md sekcja "5. N3", temat
 * P-KONIEC-TURY-ZDARZENIA-NACHODZA-NA-SIEBIE): flush odroczonej bitwy/scalenia armii po
 * zamknięciu audiencji dyplomatycznej odpalał się tylko na `onBack` (klik "Wróć" + Escape).
 * W main.ts było jednak 8 realnych wywołań `hideDiplomacyAudience()` (Evaluator naliczył 9,
 * licząc prawdopodobnie linię importu -- przeliczone tu grepem na nowo, patrz test [A4]);
 * pozostałe 7 zamykało audiencję PO CICHU: `openCityPanelForPlayer`, `closeAllMapToolbarModes`
 * (3 wywołujący z toolbara + 3 z mapToolbar), `toggleWikiFromToolbar`, `openNextOpenDiploProposal`,
 * `ensureDiplomacyUiClosed` (wołane z `selectPlayerUnit` -- dosłowny przykład z werdyktu),
 * `onOpenKnownFactions`, `handleDiploFocusCapital`. Skutek: odroczona bitwa (preBattle w
 * kolejce, czeka na zamknięcie audiencji) przeżywała do najbliższego `finally` NASTĘPNEJ tury
 * zamiast pokazać się od razu po zamknięciu audiencji tymi ścieżkami.
 *
 * FIX (main.ts): nowa funkcja-wrapper `closeDiplomacyAudienceAndFlush()` -- woła
 * `hideDiplomacyAudience()`, POTEM w `requestAnimationFrame` woła
 * `flushDeferredMergePrompts()` + `flushDeferredAutoPreBattle()` (ten sam wzorzec co już
 * istniejący, zaufany flush w `onBack`). Wszystkie 7 wcześniej cichych wywołań podmienione na
 * wrapper; `onBack` (ma już WŁASNY, poprawny flush) zostawiony nietknięty, żeby nie ryzykować
 * regresji w kodzie, który Evaluator już zweryfikował jako poprawny.
 *
 * DLACZEGO RAF, NIE FLUSH SYNCHRONICZNY: część z tych 7 ścieżek w TYM SAMYM ticku od razu
 * OTWIERA kolejny modal (np. `openNextOpenDiploProposal` zamyka audiencję i zaraz otwiera
 * NASTĘPNĄ dla kolejnej propozycji; `closeAllMapToolbarModes` zamyka audiencję i zaraz otwiera
 * listę miast/armii/dyplomacji/tryb budowy). Flush synchroniczny pokazałby preBattle w środku
 * takiej tranzycji -- dokładnie klasa błędu "zdarzenia nachodzą na siebie", którą naprawiał
 * oryginalny commit `a7de65b0`. `flushDeferredAutoPreBattle`/`flushDeferredMergePrompts`
 * re-sprawdzają `isDiplomacyAudienceOpen()`/`isArmyMergePanelOpen()` w chwili wywołania -- gdy
 * odroczone do RAF, ten re-check zdąży zobaczyć nowo otwarty modal (który otworzył się
 * synchronicznie, PRZED odpaleniem RAF) i poprawnie nic nie zrobić, czekając na kolejne
 * zamknięcie.
 *
 * Trzy części:
 *  A) TEKSTOWY PIN na main.ts -- istnienie wrappera z poprawną kolejnością (hide -> RAF ->
 *     oba flushe), migracja WSZYSTKICH 7 wcześniej cichych miejsc, `onBack` NIETKNIĘTY,
 *     oraz IMIENNA KLASYFIKACJA wszystkich gołych wywołań `hideDiplomacyAudience()` w pliku:
 *     dokładnie 3, każde w nazwanym i osiągalnym miejscu (wrapper + `onBack` + hak testowy
 *     `__audienceRelTestDebug.closeAudience`, uzasadnienie i dowody w [A4]) -- łapie przyszłe
 *     wywołanie omijające wrapper także wtedy, gdy ktoś podniósłby sam licznik.
 *     Runda 2: licznik i klasyfikacja liczą WYWOŁANIA na masce kodu (`maskNonCode`,
 *     sekcja A0), nie literał `hideDiplomacyAudience();` ze średnikiem, a przynależność
 *     do haka testowego kotwiczy na ZAKRESIE WŁASNOŚCI `closeAudience`, nie na wierszu
 *     fizycznym -- dowody mutacyjne w `runs/P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1/`.
 *  B) REALNA regresja UI (esbuild + jsdom, bundluje prawdziwy `ui/preBattle.ts`) -- mirror
 *     wrappera (main.ts się nie bundluje, patrz uzasadnienie w innych testach tej sesji,
 *     np. end-turn-modal-sequencing-test.cjs) używa PRAWDZIWEGO, zbundlowanego
 *     `flushDeferredAutoPreBattle`/`isPreBattleOpen`/`showPreBattle`/`configurePreBattle`.
 *     Scenariusz C1 = dosłowny przykład z werdyktu (`ensureDiplomacyUiClosed` przez
 *     `selectPlayerUnit`): odroczona bitwa pokazuje się OD RAZU po zamknięciu audiencji tą
 *     ścieżką, nie czeka do końca tury. Scenariusz C2 = ścieżka tranzycyjna
 *     (`openNextOpenDiploProposal`-podobna): audiencja zamyka się i w TYM SAMYM ticku otwiera
 *     się NOWA -- flush NIE pokazuje bitwy w trakcie tranzycji (dowód, że RAF-deferral chroni
 *     przed dokładnie tą klasą błędu, którą naprawiał `a7de65b0`), a pokazuje ją dopiero gdy
 *     audiencja faktycznie zostaje zamknięta na dobre.
 *  C) KONTROLA MUTACYJNA -- bez flushu w ogóle (dokładnie stan SPRZED tej naprawy) odroczona
 *     bitwa zostaje uwięziona w kolejce na zawsze (aż coś INNEGO ją zflushuje) -- dowodzi, że
 *     test faktycznie mierzy naprawiony mechanizm, nie tautologię.
 *
 * Usage (z gra/): node tools/diplomacy-audience-close-flush-test.cjs
 */
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// A) PIN TEKSTOWY na src/main.ts
// ---------------------------------------------------------------------------
const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

// A0) MASKA NIE-KODU -- kopia main.ts tej samej DLUGOSCI, w ktorej tresc komentarzy,
//     napisow i literalow szablonowych zamieniono na spacje (nowe linie zachowane).
//     Dzieki rownej dlugosci offsety trafien liczone na masce sa offsetami w oryginale.
//
//     PO CO (runda 2, Final Control U1). Wczesniej [A2] i [A4] liczyly ZNAKI: literal
//     `hideDiplomacyAudience();` -- ZE SREDNIKIEM. Wywolanie bez terminatora, zakonczone
//     przecinkiem, albo w zwiezlym ciele strzalki w literale obiektu (`closeAudienceNow:
//     () => hideDiplomacyAudience(),`) bylo dla bramki NIEWIDZIALNE: czwarta, omijajaca
//     wrapper sciezka zamkniecia audiencji przechodzila na ZIELONO -- czyli dokladnie ta
//     regresja, przed ktora [A4] ma bronic (mutacje F3/F4 Final Control, 45/0 mimo defektu).
//     Teraz liczymy WYWOLANIA: nazwa + `(`, w dowolnym zapisie. Samo zdjecie srednika z
//     regexu podnioslo by jednak licznik z 3 na 5, bo main.ts ma dwie WZMIANKI o
//     `hideDiplomacyAudience()` w komentarzach -- dlatego liczymy na masce, a nie
//     "naprawiamy" tego podniesieniem progu. [A4d] pilnuje, ze maska nie zjadla kodu.
//
//     `spansOut` (opcjonalny) zbiera KAZDY wyczyszczony zakres wraz z rodzajem
//     (`comment`/`string`/`tpl`). Dzieki temu [A4d] pyta MASKE wprost, gdzie stoi ukryte
//     wystapienie, zamiast zgadywac po wygladzie linii -- inaczej legalny napis w main.ts
//     (np. `console.warn('hideDiplomacyAudience() nie zadzialalo')`) czerwienil bramke.
function maskNonCode(src, spansOut) {
  const out = src.split('');
  const blank = (from, to, kind) => {
    if (spansOut) spansOut.push({ from, to: Math.min(to, out.length), kind: kind || 'tpl' });
    for (let k = from; k < to && k < out.length; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  const modes = [{ tplText: false, braces: 0 }];
  let i = 0;
  while (i < src.length) {
    const top = modes[modes.length - 1];
    const c = src[i];
    if (top.tplText) {                                   // wnetrze literalu szablonowego
      if (c === '\\') { blank(i, i + 2, 'tpl'); i += 2; continue; }
      if (c === '`') { blank(i, i + 1, 'tpl'); modes.pop(); i += 1; continue; }
      if (c === '$' && src[i + 1] === '{') {              // ${ ... } to znowu KOD
        blank(i, i + 2, 'tpl'); modes.push({ tplText: false, braces: 0, inTpl: true }); i += 2; continue;
      }
      blank(i, i + 1, 'tpl'); i += 1; continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      let j = src.indexOf('\n', i); if (j < 0) j = src.length;
      blank(i, j, 'comment'); i = j; continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      let j = src.indexOf('*/', i + 2); j = j < 0 ? src.length : j + 2;
      blank(i, j, 'comment'); i = j; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== '\n') j += (src[j] === '\\' ? 2 : 1);
      if (j < src.length && src[j] === c) { blank(i, j + 1, 'string'); i = j + 1; continue; }
      i += 1; continue;   // niezamkniety w tej linii -- NIE maskujemy (kierunek bezpieczny)
    }
    if (c === '`') { blank(i, i + 1, 'tpl'); modes.push({ tplText: true, braces: 0 }); i += 1; continue; }
    if (c === '{') { top.braces += 1; i += 1; continue; }
    if (c === '}') {
      if (top.braces === 0 && top.inTpl) { blank(i, i + 1, 'tpl'); modes.pop(); i += 1; continue; }
      top.braces = Math.max(0, top.braces - 1); i += 1; continue;
    }
    i += 1;
  }
  return out.join('');
}
const maskSpans = [];
const codeSrc = maskNonCode(mainSrc, maskSpans);
const maskSpanKindAt = (off) => {
  const s = maskSpans.find(x => off >= x.from && off < x.to);
  return s ? s.kind : null;
};

/** Offsety WYWOLAN `name(...)` w KODZIE main.ts (nie w komentarzu/napisie), niezaleznie
 *  od terminatora: `();`, `(),`, `()` na koncu linii, w argumencie, w ciele strzalki.
 *  Deklaracja `function name(` wywolaniem nie jest i jest odfiltrowana. */
function callOffsets(name) {
  const re = new RegExp('\\b' + name + '\\s*\\(', 'g');
  const hits = [];
  let m;
  while ((m = re.exec(codeSrc)) !== null) {
    if (/\bfunction\s+$/.test(codeSrc.slice(Math.max(0, m.index - 24), m.index))) continue;
    hits.push(m.index);
  }
  return hits;
}
const bareCallOffsets = callOffsets('hideDiplomacyAudience');
const wrapperCallOffsets = callOffsets('closeDiplomacyAudienceAndFlush');
const firstAfter = (offsets, from) => { const o = offsets.find(x => x > from); return o === undefined ? -1 : o; };

// A1) Wrapper istnieje i ma poprawną kolejność: hide -> requestAnimationFrame -> oba flushe.
{
  const fnStart = mainSrc.indexOf('function closeDiplomacyAudienceAndFlush(): void {');
  ok(fnStart >= 0, '[A1] znaleziono function closeDiplomacyAudienceAndFlush( w main.ts');
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf('\n    }', fnStart) : -1;
  const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? mainSrc.slice(fnStart, fnEnd) : '';
  const hideIdx = fnBody.indexOf('hideDiplomacyAudience();');
  const rafIdx = fnBody.indexOf('requestAnimationFrame(');
  const mergeIdx = fnBody.indexOf('flushDeferredMergePrompts();');
  const autoPbIdx = fnBody.indexOf('flushDeferredAutoPreBattle();');
  ok(hideIdx >= 0 && rafIdx > hideIdx && mergeIdx > rafIdx && autoPbIdx > mergeIdx,
    '[A1] wrapper woła w tej kolejności: hideDiplomacyAudience() -> requestAnimationFrame(...) -> flushDeferredMergePrompts() -> flushDeferredAutoPreBattle()');
}

// A2) Wszystkie 7 wcześniej cichych miejsc zamknięcia audiencji podmienione na wrapper.
//     Każdy wpis: unikalna kotwica tekstowa przed miejscem wołania + max odległość (żeby nie
//     złapać przypadkiem innego, dalekiego wywołania).
{
  const sites = [
    { label: 'openCityPanelForPlayer', anchor: 'function openCityPanelForPlayer(city: City): void {', maxDist: 400 },
    { label: 'closeAllMapToolbarModes (toolbar + mapToolbar: cities/army/build)', anchor: 'function closeAllMapToolbarModes(): void {', maxDist: 400 },
    { label: 'toggleWikiFromToolbar', anchor: 'function toggleWikiFromToolbar(): void {', maxDist: 400 },
    { label: 'openNextOpenDiploProposal', anchor: 'function openNextOpenDiploProposal(currentOwnerId: number): void {', maxDist: 300 },
    { label: 'ensureDiplomacyUiClosed (wolane z selectPlayerUnit -- doslowny przyklad z werdyktu)', anchor: 'function ensureDiplomacyUiClosed(): void {', maxDist: 300 },
    { label: 'onOpenKnownFactions', anchor: 'onOpenKnownFactions: () => {', maxDist: 200 },
    { label: 'handleDiploFocusCapital', anchor: 'function handleDiploFocusCapital(ownerId: number): void {', maxDist: 300 },
  ];
  for (const site of sites) {
    const anchorIdx = mainSrc.indexOf(site.anchor);
    ok(anchorIdx >= 0, `[A2] znaleziono kotwice dla "${site.label}"`);
    // Runda 2 (U1): oba szukania ida po WYWOLANIACH z maski kodu, nie po literale ze
    // srednikiem -- inaczej goly `hideDiplomacyAudience()` bez terminatora, wstawiony PRZED
    // wrapperem w tym miejscu, byl dla tej asercji niewidzialny.
    const callIdx = anchorIdx >= 0 ? firstAfter(wrapperCallOffsets, anchorIdx) : -1;
    const bareIdx = anchorIdx >= 0 ? firstAfter(bareCallOffsets, anchorIdx) : -1;
    ok(callIdx > anchorIdx && callIdx - anchorIdx < site.maxDist,
      `[A2] "${site.label}" wola closeDiplomacyAudienceAndFlush() (nie goly hideDiplomacyAudience()) w rozsadnej odleglosci od kotwicy`);
    ok(bareIdx < 0 || bareIdx > callIdx,
      `[A2] "${site.label}": zaden goly hideDiplomacyAudience() nie stoi PRZED wrapperem w tym miejscu`);
  }
}

// A3) onBack ma WŁASNY, nietknięty flush -- goły hideDiplomacyAudience() bezpośrednio w ciele,
//     zaraz potem WŁASNY blok requestAnimationFrame z tryOpenNextFirstContactCard().
{
  const onBackIdx = mainSrc.indexOf('onBack: () => {');
  ok(onBackIdx >= 0, '[A3] znaleziono onBack: () => { w main.ts');
  const bodyEnd = onBackIdx >= 0 ? mainSrc.indexOf('\n        },', onBackIdx) : -1;
  const body = (onBackIdx >= 0 && bodyEnd > onBackIdx) ? mainSrc.slice(onBackIdx, bodyEnd) : '';
  ok(/^\s*hideDiplomacyAudience\(\);/m.test(body),
    '[A3] onBack woła bezpośrednio goły hideDiplomacyAudience() (NIE przez wrapper -- nietknięty, już miał poprawny flush)');
  ok(/requestAnimationFrame\(\(\) => \{[\s\S]*flushDeferredMergePrompts\(\);[\s\S]*flushDeferredAutoPreBattle\(\);[\s\S]*tryOpenNextFirstContactCard\(\);/.test(body),
    '[A3] onBack zachował własny blok RAF: flushDeferredMergePrompts -> flushDeferredAutoPreBattle -> tryOpenNextFirstContactCard');
}

// A4) WSZYSTKIE gołe wywołania hideDiplomacyAudience() w pliku (bez importu) muszą być
//     IMIENNIE ROZPOZNANE. Dopuszczone są DOKŁADNIE TRZY, każde w nazwanym, osiągalnym
//     miejscu; czwarte (albo trzecie w innym miejscu niż nazwane) to regresja.
//
//     PODNIESIENIE PROGU 2 → 3 (P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1, 2026-09-05).
//     Trzecie wywołanie dołożył commit `af542199` (R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1,
//     Obrona rundy 1) jako HAK TESTOWY `window.__audienceRelTestDebug.closeAudience` —
//     dźwignię dla Playwrighta, nie ścieżkę gracza. Dowód, że nie jest zbędne (a więc nie
//     da się go po prostu usunąć): wołają je DWIE żywe bramki tego repo —
//     `tools/dyplo-mapa-odkrycie-live-test.cjs` i
//     `tools/diplomacy-relacje-ai-ai-audiencja-live-test.cjs` (asercja [A4e] niżej pilnuje,
//     że ta osiągalność nie zniknie). Dowód, że nie musi iść przez wrapper: hak nie jest
//     osiągalny ŻADNYM kliknięciem w grze (zero wywołań z `gra/src/**`), więc ryzyko, przed
//     którym ta asercja broni — odroczona bitwa/scalenie uwięzione, bo gameplayowa ścieżka
//     zamknięcia pominęła flush — w nim nie występuje. Wrapper dołożyłby tam flush w RAF,
//     czyli mógłby wystrzelić modal preBattle w środku asercji tych dwóch bramek.
//
//     Sam licznik „ma być 3" byłby słabszy od poprzedniego „ma być 2": za miesiąc doszłoby
//     czwarte i ktoś podniósłby próg do 4. Dlatego liczba idzie w parze z KLASYFIKACJĄ —
//     każde z trzech wywołań musi leżeć w konkretnym, nazwanym miejscu, a każde
//     nierozpoznane czerwieni bramkę niezależnie od licznika.
{
  const importLineEnd = mainSrc.indexOf('\n', mainSrc.indexOf('showDiplomacyAudience, hideDiplomacyAudience'));

  // Liczymy WYWOLANIA (patrz A0/callOffsets), nie znaki -- z pominieciem linii importu.
  const bareOffsets = bareCallOffsets.filter(o => o > importLineEnd);

  ok(bareOffsets.length === 3,
    `[A4] main.ts ma DOKLADNIE 3 gole wywolania hideDiplomacyAudience() poza importem (wrapper + onBack + hak testowy __audienceRelTestDebug.closeAudience) -- got ${bareOffsets.length}. Nowe miejsce zamkniecia audiencji MUSI isc przez closeDiplomacyAudienceAndFlush().`);

  /** Zakres [start, end) nazwanego bloku, kotwiczony na treści (nie na numerze linii). */
  function region(anchor, endMark) {
    const s = mainSrc.indexOf(anchor);
    if (s < 0) return null;
    const e = mainSrc.indexOf(endMark, s);
    return e > s ? [s, e] : null;
  }
  const inside = (off, r) => !!r && off >= r[0] && off < r[1];

  // (1) WRAPPER closeDiplomacyAudienceAndFlush -- jedyne miejsce, przez które wolno zamykać
  //     audiencję ze ścieżek gameplayowych innych niż „Wróć"/Escape.
  const wrapper = region('function closeDiplomacyAudienceAndFlush(): void {', '\n    }');
  const inWrapper = bareOffsets.filter(o => inside(o, wrapper));
  const wrapperCallSites = wrapperCallOffsets.length;
  ok(inWrapper.length === 1,
    `[A4a] dokladnie 1 gole wywolanie lezy w ciele closeDiplomacyAudienceAndFlush() -- got ${inWrapper.length}`);
  ok(wrapperCallSites >= 7,
    `[A4a] OSIAGALNOSC #1: wrapper jest wolany z co najmniej 7 miejsc gameplayowych (patrz [A2]) -- got ${wrapperCallSites}`);

  // (2) onBack audiencji -- klik „Wróć"/„Wyjście" i Escape; ma WŁASNY, wcześniej
  //     zweryfikowany flush, dlatego celowo nie idzie przez wrapper.
  const onBack = region('onBack: () => {', '\n        },');
  const inOnBack = bareOffsets.filter(o => inside(o, onBack));
  const audienceCfg = mainSrc.indexOf('showDiplomacyAudience({');
  ok(inOnBack.length === 1,
    `[A4b] dokladnie 1 gole wywolanie lezy w ciele onBack -- got ${inOnBack.length}`);
  ok(audienceCfg >= 0 && !!onBack && onBack[0] > audienceCfg
    && mainSrc.slice(audienceCfg, onBack[0]).includes('backLabel:'),
    '[A4b] OSIAGALNOSC #2: onBack jest handlerem przycisku powrotu w konfiguracji showDiplomacyAudience({ ... backLabel ... })');

  // (3) HAK TESTOWY __audienceRelTestDebug.closeAudience -- dzwignia dla Playwrighta,
  //     nieosiagalna z UI gry.
  /** Zakres [start, end) literalu obiektowego przypisanego do haka -- domkniety PAROWANIEM
   *  NAWIASOW na masce kodu, nie kotwica na SASIEDNIM haku.
   *
   *  PO CO (Final Control rundy 2, mutacja M7). Poprzednia wersja konczyla region literalem
   *  `'\n    (window as any).__rebelNotifyTestDebug'` -- czyli WIERSZEM SASIADA. Czysto
   *  kosmetyczne zlamanie tamtej linii (`(window as any)\n      .__rebelNotifyTestDebug = {`)
   *  dawalo `region === null`, a stad [A4c] „got 0" + [A4f] -- 44/2 bez ZADNEJ zmiany
   *  semantyki, w dodatku w haku, ktorego ta bramka w ogole nie pilnuje. To ten sam falszywy
   *  alarm, ktory naprawiala U2, tylko przesuniety o jeden poziom na zewnatrz: usuniecie albo
   *  przeformatowanie `__rebelNotifyTestDebug` czerwienilo asercje o `__audienceRelTestDebug`.
   *  Teraz koniec regionu wyznacza wlasna klamra haka i nic poza nim. */
  function debugHookRegion(hookName) {
    const open = new RegExp('\\(window as any\\)\\s*\\.\\s*' + hookName + '\\s*=\\s*\\{').exec(codeSrc);
    if (!open) return null;
    let depth = 0;
    for (let k = open.index + open[0].length - 1; k < codeSrc.length; k++) {
      const ch = codeSrc[k];
      if (ch === '{') depth += 1;
      else if (ch === '}') { depth -= 1; if (depth === 0) return [open.index, k + 1]; }
    }
    return null;
  }
  const hook = debugHookRegion('__audienceRelTestDebug');
  ok(!!hook, '[A4c] znaleziono i domknieto zakres haka (window as any).__audienceRelTestDebug = { ... }');

  /** Zakres [start, end) WARTOSCI wlasnosci `nazwa:` wewnatrz zakresu `r` -- kotwiczenie
   *  SEMANTYCZNE (parowanie nawiasow w kodzie), nie na wierszu fizycznym.
   *
   *  PO CO (runda 2, Final Control U2). Wczesniej [A4c] uznawalo wywolanie za "w haku"
   *  tylko wtedy, gdy `closeAudience:` stalo w TYM SAMYM WIERSZU FIZYCZNYM. Czysto
   *  kosmetyczne rozbicie haka na kilka linii -- semantyka bit w bit ta sama -- czerwienilo
   *  bramke (mutacja F2 Final Control: 43/2). Falszywy alarm od `prettier` uczy wszystkich
   *  ignorowac bramke, wiec kotwica idzie na WLASNOSC, nie na uklad wierszy: od dwukropka
   *  do pierwszego `,` albo `}` na glebokosci 0. Zmiana NAZWY klucza nadal czerwieni. */
  function propertyValueRange(r, propName) {
    if (!r) return null;
    const keyRe = new RegExp('(^|[\\s{,;\\[])' + propName + '\\s*:', 'g');
    keyRe.lastIndex = r[0];
    const hit = keyRe.exec(codeSrc);
    if (!hit || hit.index >= r[1]) return null;
    const start = hit.index + hit[0].length;
    let depth = 0;
    for (let k = start; k < r[1]; k++) {
      const ch = codeSrc[k];
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') { if (depth === 0) return [start, k]; depth--; }
      else if (ch === ',' && depth === 0) return [start, k];
    }
    return [start, r[1]];
  }
  const closeAudienceProp = propertyValueRange(hook, 'closeAudience');
  const inHook = bareOffsets.filter(o => inside(o, closeAudienceProp));
  ok(inHook.length === 1,
    `[A4c] dokladnie 1 gole wywolanie lezy w haku testowym __audienceRelTestDebug.closeAudience -- got ${inHook.length}`);
  const srcCallers = (() => {
    const dir = path.join(__dirname, '..', 'src');
    const hits = [];
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.ts$/.test(e.name) && fs.readFileSync(p, 'utf8').includes('__audienceRelTestDebug.closeAudience')) hits.push(e.name);
      }
    })(dir);
    return hits;
  })();
  ok(srcCallers.length === 0,
    `[A4c] hak pozostaje TYLKO hakiem: zero wywolan __audienceRelTestDebug.closeAudience z gra/src/** -- got ${srcCallers.join(', ')}`);
  const gateCallers = fs.readdirSync(path.join(__dirname))
    .filter(f => /\.cjs$/.test(f) && f !== path.basename(__filename))
    .filter(f => fs.readFileSync(path.join(__dirname, f), 'utf8').includes('__audienceRelTestDebug.closeAudience'));
  ok(gateCallers.length >= 1,
    `[A4e] OSIAGALNOSC #3: hak jest faktycznie wolany przez co najmniej jedna zywa bramke w gra/tools/ (inaczej to martwy kod do usuniecia) -- got ${gateCallers.length}`);

  // (4) FAIL-SAFE MASKI: kazde wystapienie `hideDiplomacyAudience(` w main.ts, ktore maska
  //     uznala za NIE-kod, musi lezec w zakresie, ktory maska SAMA zaraportowala jako
  //     komentarz/napis/szablon. Gdyby maska pomylila sie i schowala realne wywolanie,
  //     licznik [A4] bylby cicho ZANIZONY -- czyli wrocilaby ta sama klasa cichej zieleni,
  //     ktora naprawia ta runda. Wtedy bramka ma czerwieniec.
  //
  //     Final Control rundy 2, mutacja M5: poprzednia wersja pytala o WYGLAD linii
  //     (`//`, `*`, `/*`) i przez to czerwienila legalny napis --
  //     `const s = 'hideDiplomacyAudience() w napisie';` dawalo 45/1. Napis nie jest kodem,
  //     wiec zamaskowanie go jest POPRAWNE; falszywy alarm tej klasy uczy ignorowac bramke.
  //     Teraz pytamy o rodzaj zakresu z `maskSpans`, a nie o wciecie.
  {
    const nameRe = /hideDiplomacyAudience\s*\(/g;
    const NAME = 'hideDiplomacyAudience';
    const OK_KINDS = ['comment', 'string', 'tpl'];
    const suspicious = [];
    let r;
    while ((r = nameRe.exec(mainSrc)) !== null) {
      if (codeSrc.slice(r.index, r.index + NAME.length) === NAME) continue;   // widziane jako kod
      if (OK_KINDS.includes(maskSpanKindAt(r.index))) continue;               // maska wie, czemu
      suspicious.push(mainSrc.slice(mainSrc.lastIndexOf('\n', r.index) + 1, mainSrc.indexOf('\n', r.index)).trim().slice(0, 80));
    }
    ok(suspicious.length === 0,
      `[A4d] maska nie-kodu nie zjadla zadnego WYWOLANIA -- kazde ukryte wystapienie ${NAME}( lezy w zaraportowanym komentarzu/napisie/szablonie. Podejrzane: ${suspicious.join(' | ')}`);
  }

  // (4b) SELF-TEST MASKI na syntetycznej probce. Samo [A4d] pyta maske o jej wlasny werdykt,
  //      wiec bez tego byloby prawie tautologia: maska, ktora zamaskuje CALY plik, przeszlaby
  //      [A4d] (kazde ukryte wystapienie ma zaraportowany zakres) i cicho ZANIZYLA [A4].
  //      Tu sprawdzamy maske na wejsciu o ZNANEJ odpowiedzi -- kod ma zostac widoczny,
  //      nie-kod ma zniknac, a dlugosc i podzial na wiersze musza sie zachowac (bo [A4]
  //      liczy offsety maski jako offsety oryginalu).
  {
    const F = [
      'const a = zzz();',                       // 0 KOD -- widoczne
      '// zzz() w komentarzu liniowym',         // 1 nie-kod
      '/* zzz() w blokowym */ const b = 1;',    // 2 nie-kod
      "const c = 'zzz() w napisie';",           // 3 nie-kod
      'const d = `zzz() w szablonie`;',         // 4 nie-kod
      'const e = `${zzz()}`;',                  // 5 KOD wewnatrz ${} -- widoczne
      'const f = 1; // zzz() na koncu linii',   // 6 nie-kod (komentarz po kodzie)
    ];
    const fixture = F.join('\n');
    const masked = maskNonCode(fixture);
    const mLines = masked.split('\n');
    const visible = (n) => mLines[n].includes('zzz(');
    ok(masked.length === fixture.length && mLines.length === F.length,
      `[A4d2] maska zachowuje dlugosc i podzial na wiersze -- ${masked.length}/${fixture.length}, ${mLines.length}/${F.length}`);
    ok(visible(0) && visible(5),
      '[A4d2] maska ZOSTAWIA kod: zwykle wywolanie i wywolanie w interpolacji ${...} szablonu');
    ok(!visible(1) && !visible(2) && !visible(3) && !visible(4) && !visible(6),
      '[A4d2] maska USUWA nie-kod: komentarz liniowy, blokowy, napis, tekst szablonu, komentarz po kodzie');
    ok(masked.includes('const b = 1;') && masked.includes('const f = 1;'),
      '[A4d2] maska nie zjada kodu stojacego obok nie-kodu w tym samym wierszu');
  }

  // (5) Domkniecie: zaden goly hideDiplomacyAudience() nie moze zostac NIEROZPOZNANY.
  const classified = inWrapper.length + inOnBack.length + inHook.length;
  ok(classified === bareOffsets.length,
    `[A4f] kazde gole wywolanie hideDiplomacyAudience() jest w jednym z trzech NAZWANYCH miejsc -- rozpoznano ${classified} z ${bareOffsets.length}. Nierozpoznane miejsce MUSI isc przez closeDiplomacyAudienceAndFlush().`);
}

// ---------------------------------------------------------------------------
// B) REALNA regresja UI: bundluje prawdziwy ui/preBattle.ts, mirror wrappera main.ts.
// ---------------------------------------------------------------------------
async function runUiPart() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); }
  catch (e) {
    console.error('[diplomacy-audience-close-flush-test] jsdom missing — npm i -D jsdom');
    process.exit(1);
  }

  const ENTRY = path.join(__dirname, '.diplo-audience-close-flush-entry.ts');
  const OUT = path.join(__dirname, '.diplo-audience-close-flush-bundle.cjs');
  const STUB_DIR = path.resolve(__dirname, '.stubs');
  const BRAND_STUB = path.resolve(STUB_DIR, 'diplo-close-flush-brandAssets-stub.ts');

  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(
    BRAND_STUB,
    [
      "export function terrainIconSvg() { return ''; }",
      "export function civIconSvg() { return ''; }",
      "export function brandIconSvg() { return ''; }",
      "export function unitIconSvg() { return ''; }",
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(path.join(STUB_DIR, 'diplo-close-flush-leaderPortraits-stub.ts'), [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return ''; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'diplo-close-flush-audio-stub.ts'), [
    "export function startPreBattleMusic() {}",
    "export function stopPreBattleMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'diplo-close-flush-hud-stub.ts'), [
    "export function setArmyStackHudSuppressed() {}",
  ].join('\n'), 'utf8');

  fs.writeFileSync(
    ENTRY,
    [
      "export {",
      "  showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,",
      "} from '../src/ui/preBattle.ts';",
    ].join('\n'),
    'utf8',
  );

  const stubPlugin = {
    name: 'stub-brand-assets-diplo-close-flush',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({
        path: path.join(STUB_DIR, 'diplo-close-flush-leaderPortraits-stub.ts'),
      }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({
        path: path.join(STUB_DIR, 'diplo-close-flush-audio-stub.ts'),
      }));
      build.onResolve({ filter: /hud$/ }, () => ({
        path: path.join(STUB_DIR, 'diplo-close-flush-hud-stub.ts'),
      }));
    },
  };

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: OUT,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
    plugins: [stubPlugin],
  });

  const {
    showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,
  } = require(OUT);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  // Mirror `requestAnimationFrame` -- wzorzec juz uzywany w innych testach tej sesji
  // (np. diplomacy-basket-duplicate-ui-test.cjs): setTimeout(cb,0) odpala PO biezacym
  // synchronicznym stosie wywolan, dokladnie tak jak realne RAF w przegladarce robi wzgledem
  // reszty kodu main.ts w tym samym ticku.
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  const waitForRaf = () => new Promise((resolve) => setTimeout(resolve, 10));

  const baseInfo = {
    atakujacy: {
      nazwa: 'Barbarzyńcy', ownerId: 99,
      units: [{ nazwa: 'Wojownik', kategoria: 'Wrecz', hp: 10, maxHp: 10, atak: 5 }],
    },
    obronca: {
      nazwa: 'Zwiadowca', ownerId: 0,
      units: [{ nazwa: 'Zwiadowca', kategoria: 'Wrecz', hp: 8, maxHp: 8, atak: 2 }],
    },
    teren: 'Rownina',
    szanseAtkPct: 30,
    miejsce: 'Pole',
    tura: 12,
    canRetreat: false,
  };

  // isOtherEndTurnModalOpen mirror -- sterowalny flagą `audienceOpen`, dokładnie jak realny
  // hook main.ts (isDiplomacyAudienceOpen() || isArmyMergePanelOpen()), tu uproszczony do
  // audiencji (jedyny modal istotny dla N3; army-merge jest już pokryty przez
  // end-turn-modal-sequencing-test.cjs).
  let audienceOpen = false;
  configurePreBattle({ isOtherEndTurnModalOpen: () => audienceOpen });

  /** Mirror main.ts closeDiplomacyAudienceAndFlush() -- pinowany tekstowo w [A1] wyżej,
   * używa PRAWDZIWEGO flushDeferredAutoPreBattle (nie atrapy). */
  function closeDiplomacyAudienceAndFlushMirror() {
    audienceOpen = false; // mirror hideDiplomacyAudience()
    setTimeout(() => {
      flushDeferredAutoPreBattle();
    }, 0);
  }

  // -------------------------------------------------------------------------
  // C1) DOSŁOWNY PRZYKŁAD Z WERDYKTU: ensureDiplomacyUiClosed / selectPlayerUnit.
  //     Audiencja otwarta, bitwa AI/barbarzyńców próbuje się pokazać -- blokowana, odłożona.
  //     Gracz zaznacza jednostkę (ensureDiplomacyUiClosed zamyka audiencję) -- bitwa MUSI
  //     pokazać się od razu, nie czekać do końca tury.
  // -------------------------------------------------------------------------
  audienceOpen = true;
  showPreBattle(
    baseInfo,
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
    { auto: true },
  );
  ok(isPreBattleOpen() === false,
    '[C1] krok 1: audiencja otwarta -- automatyczna bitwa AI/barbarzyńców odroczona, NIE otwiera się na wierzchu audiencji');

  closeDiplomacyAudienceAndFlushMirror(); // == selectPlayerUnit -> ensureDiplomacyUiClosed
  ok(isPreBattleOpen() === false,
    '[C1] krok 2: TUŻ PO zamknięciu audiencji (przed RAF) preBattle jeszcze nie skoczył na wierzch w środku synchronicznego kodu selekcji jednostki');

  await waitForRaf();
  ok(isPreBattleOpen() === true,
    '[C1] krok 3 (SEDNO N3): po RAF (odpalonym przez ensureDiplomacyUiClosed/selectPlayerUnit) odroczona bitwa POKAZUJE SIĘ NATYCHMIAST -- nie czeka do finally następnej tury');
  const titleC1 = document.querySelector('.pb-ttl');
  ok(!!titleC1 && /Pole/.test(titleC1.textContent || ''),
    '[C1] pokazana bitwa to dokładnie ta odłożona (miejsce="Pole" z baseInfo), rostery nie są z innej tury');
  hidePreBattle();
  audienceOpen = false;

  // -------------------------------------------------------------------------
  // C2) ŚCIEŻKA TRANZYCYJNA (openNextOpenDiploProposal-podobna): audiencja zamyka się i W TYM
  //     SAMYM TICKU otwiera się NOWA (dla kolejnej propozycji) -- flush NIE MOŻE pokazać bitwy
  //     w trakcie tej tranzycji (byłby to dokładnie ten sam błąd "modale nachodzą na siebie",
  //     który naprawiał a7de65b0). Bitwa pokazuje się dopiero gdy audiencja faktycznie
  //     zostaje zamknięta na dobre.
  // -------------------------------------------------------------------------
  audienceOpen = true;
  showPreBattle(
    baseInfo,
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
    { auto: true },
  );
  ok(isPreBattleOpen() === false, '[C2] krok 1: bitwa odłożona, pierwsza audiencja otwarta');

  closeDiplomacyAudienceAndFlushMirror(); // zamknięcie audiencji #1
  audienceOpen = true; // W TYM SAMYM TICKU -- otwarcie audiencji #2 dla kolejnej propozycji
  await waitForRaf();
  ok(isPreBattleOpen() === false,
    '[C2] krok 2 (dowod bezpieczenstwa RAF-deferral): flush po zamknieciu audiencji #1 NIE pokazal bitwy, bo audiencja #2 zdazyla sie otworzyc PRZED odpaleniem RAF -- brak "nachodzenia sie" modali');

  closeDiplomacyAudienceAndFlushMirror(); // teraz audiencja #2 zamyka się NA DOBRE
  await waitForRaf();
  ok(isPreBattleOpen() === true,
    '[C2] krok 3: gdy audiencja faktycznie zostaje zamknięta (bez kolejnego natychmiastowego otwarcia), odłożona bitwa w końcu się pokazuje -- żądanie nie zginęło w trakcie tranzycji');
  hidePreBattle();
  audienceOpen = false;

  // -------------------------------------------------------------------------
  // C3) KONTROLA MUTACYJNA -- stan SPRZED naprawy: hideDiplomacyAudience() bez ŻADNEGO
  //     flushu. Odroczona bitwa zostaje uwięziona w kolejce bezterminowo (dopóki coś INNEGO
  //     jej nie zflushuje) -- dowodzi że test C1/C2 mierzy naprawiony mechanizm, nie
  //     tautologię (bez flushu w mirrorze te same asercje by padły).
  // -------------------------------------------------------------------------
  audienceOpen = true;
  showPreBattle(
    baseInfo,
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
    { auto: true },
  );
  ok(isPreBattleOpen() === false, '[C3] krok 1: bitwa odłożona, audiencja otwarta');
  audienceOpen = false; // == goly hideDiplomacyAudience() BEZ flusha (blad sprzed naprawy N3)
  await waitForRaf();
  ok(isPreBattleOpen() === false,
    '[C3] KONTROLA: bez wywołania flushDeferredAutoPreBattle() po zamknięciu audiencji, odłożona bitwa NIE pokazuje się sama -- to jest dokładnie luka N3, którą ta naprawa zamyka');
  // Sprzątanie: teraz flushnij naprawdę, żeby nie zostawić stanu modułu zanieczyszczonego.
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === true, '[C3] sprzątanie: jawny flush w końcu pokazuje odłożoną bitwę');
  hidePreBattle();

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
async function main() {
  await runUiPart();

  console.log(`\ndiplomacy-audience-close-flush-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
