STATUS: FAIL (GOAL niepełny: 13/24 plików; Z3 i Z4 naprawione)
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-Q1
GOAL: przepiąć do `src-tauri/frontend-v2/src/ui/` zmiany `gra/src/ui` web `86d510c66 → 9b019a7d8` (FALA 509–532, 24 pliki).

## Odpowiedzi na zarzuty Evaluatora r1

- **Z1 — PRZYJMUJĘ.** GOAL obejmuje 24 pliki, zrobione 13 (partia A). Status r1 `PASS-WITH-NOTES` był błędny; poprawny = `FAIL`,
  temat wraca z tym samym ID. Poprawka: status w tym raporcie i `P5-REPIN-UI-2.md` §11.5. 11 plików (B: armyStackHud,
  siegeMapPanel, unitRecruitCard, newGameFlow, empireDetailTypes; C: empireDetailPanel, hexContextTooltip, buildModeHud;
  D: minimapHud, hud; E: cityPanel bloki K) — nadal nieprzepięte, NIE twierdzę inaczej.
- **Z2 — PRZYJMUJĘ.** `minimapHud` (`updateViewport`), `hud` (baner 3+3), `buildModeHud` (bramka auto-budowy) nie są w porcie.
  Należą do partii C/D (§11.1). ZAŁOŻENIE: kolejność B → C → D → E bez zmian; orkiestrator może zawęzić temat do A i otworzyć osobne ID.
- **Z3 — PRZYJMUJĘ.** `run-cycles.mjs`: gałąź `POMINIĘTE` zastąpiona przypadkiem `API filtra (rozbieżne rewizje …)` liczonym
  do `różnic`. Dowód: czysty pin `edb8fb56` bez nakładki, `--only sidePanelEventFilter.ts` → `przypadków=1 różnic=1`, EXIT=1
  (pin: `filterSidePanelEvents`; v2: `filterSidePanelEventsByTab,relevantInfoEvents,isHiddenAiAiEvent,tabCountsOf`); nakładka
  z `--web3-dir` → 44/0, EXIT=0. `run-repin-ui2e-cycles.mjs`: moduł nie jest tam pakowany (domyślne `--only` = 3 moduły
  dyplomacji), blok był martwy, a `--only sidePanelEventFilter.ts` dawał `modułów=0` EXIT=0; teraz blok wchodzi do raportu →
  EXIT=1. Domyślny przebieg bez zmian (9335/0).
- **Z4 — PRZYJMUJĘ.** Regresja powtórzona na kodzie końcowym (`src/` = `e2879257f` łącznie z `worldOverlayLayer.ts`,
  narzędzia z poprawką Z3), nakładki zbudowane od zera z własnych `git archive` (`edb8fb56`, `86d510c66`, `9b019a7d8`).

## ZMIANY-COMMIT

Gałąź `rustport-repin-web-ui-3-q1-obrona` (od `a2e510c74`, Operator r1 `e2879257f`):
- `2b34e702f`: `tools/dom-harness/run-cycles.mjs`, `tools/dom-harness/run-repin-ui2e-cycles.mjs`, `P5-REPIN-UI-2.md` §11.2 + §11.5.
- commit tego raportu (SHA w odpowiedzi końcowej).
Zero zmian w `src/`, `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `render/`.

## TESTY (kod końcowy, ta runda)

- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (pin 426/0, UI-2 4/0, UI-3 12 kopii + 1 adapter, 0 niezgodnych).
- Nakładka pin+UI-2+UI-3: L0 3861/0, L1A 3618/0, L2 1784/0 (jsdom 354 / console 150 jak baza), C4 1649/0 (75), hud 909/0,
  cityux 164/0, newgame 2195/0 (r1 NIE_ZMIERZONO; zależność istnieje: `newGameFlow` → `icons/brandAssets` → `building-icon-map.json`),
  `run-cycles` 6442/1623 — te same moduły co baza (`diplomacyTradeBasket` 1592 + `diplomacyAudience` 31, E-Z3), sidePanel* 0.
- WEB86U3: UI-2-A 2292/0, B 1356/0 (PIX 0), C 752/0, D 797/0, E 183/0, E-cycles 9335/0, F 35 scen/0, G 9216/0 — wszystkie EXIT=0.
- `run-repin-ui3a` (web3): 33×2 scen, 360 kroków, 24 PNG PIX 0, 56/56, błędów strony 0, EXIT=0.
- `mutate-cycles --only S1,S2`: 2/2 wykryte, pliki przywrócone bajtowo.
- NIE_ZMIERZONO: `mutate-repin-ui3a` (kod `src/` i harness UI-3 bez zmian od r1, Evaluator zmierzył 52/52); GPU / okno Tauri.

## BLOKADY

Brak technicznych. Przyczyna FAIL: GOAL niepełny (11/24 plików, ~28 h wg U3-Z4) — wymaga kolejnych rund lub decyzji orkiestratora o podziale ID.

RUNDY: 2/5 (ryzyko LIMIT-5-EXCEEDED przy B–E w r3–r5 — do oceny orkiestratora)
NASTĘPNY KROK: Evaluator r2 (weryfikacja Z3/Z4); potem Operator r3 — partia UI-3-B, albo zawężenie tematu do A + nowe ID dla B–E.
DEPLOY-PUSH: NIE WYKONANO
