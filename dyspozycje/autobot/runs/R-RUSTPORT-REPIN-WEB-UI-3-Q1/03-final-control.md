STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-Q1
GOAL: Przepiąć do `src-tauri/frontend-v2/src/ui/` zmiany `gra/src/ui` z web `86d510c66` do `9b019a7d8` (FALA 509–532, 24 pliki).

## Orzeczenia zarzutów (Evaluator r1)

| Zarzut | Orzeczenie | Dowód FC |
|---|---|---|
| Z1 GOAL 13/24 | **NAPRAW** (otwarty) | Porównanie blobów `git ls-tree` gałęzi obrony z `9b019a7d8:gra/src/ui` dla 24 plików z `git diff --name-only 86d510c66 9b019a7d8 -- gra/src/ui`: 12 SAME, `armyStackLabel` DIFF (adapter, oczekiwane), `cityPanel.ts` brak jako plik (bloki K), DIFF: `armyStackHud`, `buildModeHud`, `empireDetailPanel`, `empireDetailTypes`, `hexContextTooltip`, `hud`, `minimapHud`, `newGameFlow`, `siegeMapPanel`, `unitRecruitCard`. Partie B–E nieprzepięte. Obrona przyznaje. |
| Z2 minimapHud/hud/buildModeHud | **NAPRAW** (otwarty) | Jak wyżej: `minimapHud`, `hud`, `buildModeHud` = DIFF wobec `9b019a7d8`. |
| Z3 gałąź POMINIĘTE | **ODDAL** (naprawione w `2b34e702f`) | Diff `a2e510c74..2b34e702f`: gałąź `else` w `run-cycles.mjs` i `run-repin-ui2e-cycles.mjs` woła `record(...)` (różnica), a raport UI-2-E dołącza `sidePanelEventFilter.ts`. Uruchomione samodzielnie: `run-cycles.mjs --pin-dir <git archive edb8fb56> --only sidePanelEventFilter.ts` → `przypadków=1 różnic=1`, EXIT=1 (pin: `filterSidePanelEvents`; v2: `filterSidePanelEventsByTab,relevantInfoEvents,isHiddenAiAiEvent,tabCountsOf`). |
| Z4 regresja na kodzie końcowym | **ODDAL** (naprawione przez pomiar obrony) | Obrona zmierzyła regresję na `src/` = `e2879257f` (z `worldOverlayLayer.ts`): L0/L1A/L2/C4/hud/cityux/newgame 0 różnic, `run-cycles` 1623 tylko w znanych modułach dyplomacji (E-Z3), UI-2-A…G 0. `src/` nie zmienił się między `e2879257f` a `a035bc097` (diff obrony dotyka tylko 2 harnessów + doc). FC nie powtórzył pełnej regresji — NIE_ZMIERZONO przez FC; zastrzeżenie, nie zarzut. |

Dwa NAPRAW → **FAIL**. Brak DO DECYZJI CZŁOWIEKA (dokończenie partii B–E wynika wprost z GOAL; zawężenie tematu to decyzja procesowa orkiestratora, nie produktowa).

## ZMIANY-COMMIT
- Oceniona gałąź `rustport-repin-web-ui-3-q1-obrona` @ `a035bc097` (kod `e2879257f` + `2b34e702f`, raporty `a2e510c74`, `a035bc097`), baza `b520768b0` (przodek `origin/rust-port/parity-v2` = `707696397`).
- `git diff --name-only b520768b0..a035bc097`: 52 pliki, wszystkie w allowliście; 0 w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `render/`. `git diff --check` czysty.
- Zmiany FC: wyłącznie ten raport (gałąź `rustport-repin-web-ui-3-q1-fc`, od `a035bc097`).

## TESTY (FC, samodzielnie, @ `a035bc097`)
- `npm ci` → `tsc --noEmit`: EXIT=0.
- `npm run check`: EXIT=0 (pin 426/0; UI-2 4/0; UI-3: 12 kopii, 1 adapter, 3 bloki, 1 dep, 0 niezgodnych).
- Z3 negatyw: EXIT=1, różnic=1 (wyżej).
- NIE_ZMIERZONO przez FC: `run-repin-ui3a`, `mutate-repin-ui3a` (Evaluator r1: 0 różnic, 52/52; `src/` i te harnessy bez zmian od r1), pełna regresja starszych harnessów, GPU/okno Tauri.

## BLOKADY
Techniczne brak. FAIL = niepełny GOAL (11/24 plików, partie B–E).

## RUNDY
2/5. Ryzyko LIMIT-5-EXCEEDED przy ~28 h pracy B–E w rundach 3–5.

## NASTĘPNY KROK
Powrót do Operatora z tym samym ID, runda 3: partia UI-3-B (`armyStackHud`, `siegeMapPanel`, `unitRecruitCard`, `newGameFlow`, `empireDetailTypes`), potem C/D/E. Alternatywa (decyzja orkiestratora): zawęzić temat do partii A (jest gotowa i zweryfikowana) i otworzyć osobne ID dla B–E.

## SHA do integracji i kolejność
Integracja całego tematu: NIE (FAIL). Jeżeli orkiestrator zawęzi temat do partii A: kandydat `a035bc097` (lub ten raport), integrowany PO aktualnym `origin/rust-port/parity-v2` `707696397` (zawiera RENDER-3) — baza `b520768b0` jest przodkiem, więc wymagany merge/rebase na `707696397` z ręcznym scaleniem plików wspólnych (`pin-manifest.json`, `repin-ui2-overlay.mjs`, `package.json`, `P5-REPIN-UI-2.md`), następnie ponowne `tsc` + `npm run check` na wyniku scalenia.

Sprzątanie: usunięte jawnymi ścieżkami `src-tauri/frontend-v2/node_modules` i kopia pinu w scratchpadzie.

DEPLOY-PUSH: NIE WYKONANO
