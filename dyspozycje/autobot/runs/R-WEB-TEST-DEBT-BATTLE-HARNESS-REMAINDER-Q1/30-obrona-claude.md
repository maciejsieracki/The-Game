# R-WEB-TEST-DEBT-BATTLE-HARNESS-REMAINDER-Q1 — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS (narzędzia testowe, tylko `gra/tools` + raport)
TEMAT: R-WEB-TEST-DEBT-BATTLE-HARNESS-REMAINDER-Q1
GOAL: odpowiedzieć na zarzuty 1–3 Evaluatora (`c049ad986`) dowodem; domknąć kryterium (b) (skan 131 harnessów z listą exit-kodów) i (e) (tsc + 5 bramek); zostawić DECISION_REQUIRED dla punktu (3) archer-behind.
BAZA: `db91d89b2` (kandydat Operatora), wyjściowo `604a4f873` (origin/main). `gra/src` i `gra/data` bez zmian (diff pusty, 0 linii).
ZMIANY-COMMIT: patrz sekcja „Commit" na końcu.

## Odpowiedź na zarzuty Evaluatora

### Zarzut 1 — trzy harnessy nadal kończą exit 1 (`import.meta.glob`) — PRZYJĘTY, naprawiony
- Przyczyna (zmierzona na `db91d89b`): `TypeError: import_meta.glob is not a function` (sekcja C / L/M / D4). Esbuild w CJS zamienia `import.meta` na pusty obiekt; moduły `src/ui/icons/brandAssets.ts`, `src/ui/leaderPortraits.ts`, `src/audio/filePlayer.ts` wywołują `import.meta.glob(...)` przy ładowaniu.
- Poprawka (commit): `gra/tools/lib/esbuild-raw-plugin.cjs` — plugin `onLoad` dla `.ts/.tsx/.js/.mjs` zawierających tekst `import.meta.glob(` zamienia wywołanie na `((..._a) => ({}))(` (pusty słownik modułów). Plik źródłowy w `src/` NIE jest zmieniany; zmiana działa tylko w buildzie harnessu.
- Druga przyczyna exit 1 w `empire-armia-produkcja-test` (B10 FAIL, także na bazie): asercja była błędna, nie kod. Regex `/\n\s*armiaProdukcja,\s*$/` wymagał, by `armiaProdukcja` było OSTATNIM polem zwracanego obiektu. W `gra/src/main.ts` (linia ~20657) po nim są `producers: ...` i dalsze pola, a sam test w komentarzu (linie ~243–246) mówi, że kolejność pól nie ma być pilnowana. Zmierzone: w bloku `return` (fragment od `research,\n religion,` do `\n      };`, 570 znaków) regex z `$` = `false`, regex bez `$` (`/\n\s*armiaProdukcja,/`) = `true`. Zmieniono kotwicę na obecność pola w bloku `return` (bez osłabienia: nadal wymagane jest faktyczne wystawienie pola w zwracanym obiekcie).
- Wyniki surowe po poprawce (uruchomione z `gra/`, `node tools/<nazwa>.cjs`):
  - `empire-armia-produkcja-test`: exit=0, `51 passed, 0 failed`
  - `empire-miasta-table-test`: exit=0, `96 passed, 0 failed`
  - `empire-panel-miasto-obywatele-content-test`: exit=0, `116 passed, 0 failed`
- Mutacja helpera (kryterium d): w helperze tymczasowo wyłączono zamianę glob (`if (true || ...)`). Wynik surowy: `empire-miasta-table-test` exit=1, `TypeError: import_meta.glob is not a function`; `empire-panel-miasto-obywatele-content-test` exit=1, ten sam TypeError. Helper przywrócony do wersji commitowanej (Edit odwrotny; treść identyczna z tą w commicie).

### Zarzut 2 — brak pełnej listy exit-kodów skanu 131 harnessów — PRZYJĘTY, zrobione
- Lista: 131 plików `gra/tools/*.cjs` zawierających `menu-emblem.svg?raw` lub `import.meta.glob` (grep). Każdy uruchomiony `node tools/<plik>` z `gra/`, `timeout 45`, cztery równolegle (`xargs -P 4`), wyniki w scratchpad (`scan/_exit.txt`, `scan/<nazwa>.out`).
- Podsumowanie surowe: exit 0: **105**; exit 1: **19**; inne: **7** (4 × 124 = timeout 45 s, 3 × exit 2 = brak argumentu/pliku wejściowego).
- Błędy BUDOWANIA esbuild (`ERROR:` / `Could not resolve` / `No loader`): **1** — `budynek-garnizon-test`: `src/ui/cityPanel.ts:12699:34: ERROR: Multiple exports with the same name "renderBuildList"`. Przyczyna w `gra/src` (poza allowlistą), NIE naprawiana w tym temacie. Pozostałe 130 plików: brak błędu budowania (zero wystąpień `No loader`/`Could not resolve`).
- Pełna lista z exit-kodami — w sekcji „Lista 131 harnessów" na końcu pliku.
- Uwaga metodologiczna: skan równoległy (4 procesy) mógł wydłużyć czasy; 4 timeouty (124) są NIE ZMIERZONE co do wyniku (nie zdążyły w 45 s) i dotyczą harnessów Chromium/render.

### Zarzut 3 — brak tsc i 5 bramek; guard w fixture `_activateUnit` — PRZYJĘTY (zmierzone), guard uzasadniony
- `tsc --noEmit` (`node ./node_modules/typescript/bin/tsc --noEmit`, z `gra/`): **exit=0**, bez wyjścia.
- Bramki referencyjne (z `R-PROC-AUTOBOT.md` §6, wynik surowy):
  - `logic-test`: exit=0, `LOGIC OK (213/213)` — wzorzec 213/213 ✔
  - `tech-tree-test`: exit=0, `tech-tree-test: 20 pass, 0 fail` — wzorzec 20/20 ✔ (0 fail)
  - `research-test`: exit=0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN` — wzorzec 33/33 ✔
  - `unit-replace-test`: exit=0, `WSZYSTKIE TESTY ZIELONE (21/21)` — wzorzec 21/21 ✔
  - `combat-test`: exit=0, `All sanity checks passed.` — wzorzec 6/6 ✔ (wynik: sanity checks, bez licznika w wyjściu)
- `gra/src` i `gra/data`: `git diff -- gra/src gra/data` = 0 linii (kryterium e).
- Guard w `auto-battle-simultaneous-test.cjs` (`makeTurnFixture`, `_activateUnit`): `if (this._autoBatchPlanning) { done(); return; }`. Ocena (ZAŁOŻENIE, do potwierdzenia przez FC):
  - Guard NIE wyłącza kontroli planera: `done()` jest nadal wywoływane, więc przepływ planera (`_snapshotAutoBatchIntents`, `battleScene.ts` ~5966–6030) przebiega identycznie; pomijany jest wyłącznie zapis do rejestru `activated`, który w fixture służy jako dowód realnych aktywacji.
  - Bez guardu zmierzono 4 fałszywe aktywacje (stack trace, operator) i wynik 28 pass / 1 fail; z guardem 29 pass / 0 fail. Test planera nadal sprawdza wynik planu (asercje na intencjach), nie tylko rejestr.
  - Kryterium: fixture = stub, nie kod gry; `src` nietknięty.
- Mutacja F8 (`trimPathToStackRoom` usunięte z `truncatePath` w `src`) — wykonana przez Evaluatora (FAIL F8); NIE powtarzana w tej obronie.

### Punkty (1) i (4) — bez zmian względem Operatora poza zarzutem 1
- (1) `battle-standoff-two-warriors-test`: exit=0, 9 PASS / 0 FAIL; `auto-battle-simultaneous-test`: exit=0, 29 pass / 0 fail (wyniki Operatora; ponownie widoczne w skanie: standoff/auto-battle nie są na liście błędów).
- (2) F8 `army-stack-limit-test`: exit=0, 51 OK (zmiana regex, kod nietknięty).
- (3) `bitwa-auto-atak-wielojednostkowy-evaluation-test`: 7 PASS / 5 FAIL — **DECISION_REQUIRED**, test nietknięty. Źródło semantyki: commit `9dc324bb9` („Fix ranged approach in attack doctrine", 2026-10-29), komentarz w `battleScene.ts` ~6580–6612: łucznik robi pierwszy krok boczny, gdy ten pas otwiera postęp do przodu. Test (`f48894231`, 2026-10-28) jest starszy i zakłada `hold`. Decyzja semantyki gry: właściciel/orkiestrator (A: zaktualizować asercje; B: przywrócić „wstrzymaj” w `src` — poza tematem; C: zostawić czerwony).

## Dowody i ograniczenia
- Środowisko: `npm ci` w `gra/` (71 pakietów) lokalnie w worktree; `node_modules` NIE w commicie.
- NIE ZMIERZONO: harnessy Chromium/render uruchamiane bez `xvfb-run` (exit 1 z komunikatami dbus/Target closed u: `entitycard-rozwiniete-scrollbar-real-render-test`, `hud-gross-net-rest-test`, `hud-topbar-grid-gross-net-test`, `tax-slider-*`) — środowisko bez wyświetlacza; wyniki nie są ocenami regresji. Dispatch nie wymagał ich zielenia.
- NIE ZMIERZONO: `archer-behind` poza decyzją (nie zmieniano).
- Artefakty uruchomień w `gra/tools/` (np. `.empire-*-bundle.cjs`, `.empire-*-entry.ts`, pliki tymczasowe harnessów) są nieśledzone — NIE dodawane do commita; sprzątanie przez orkiestratora.
- W worktree widać `M` na plikach PNG/JSON w `dyspozycje/…` (R-DYPLO…, R-HUD…, R-KARTA…) — nie moja edycja, NIE dodawane do commita.

## Commit
Commit zawiera wyłącznie:
- `gra/tools/lib/esbuild-raw-plugin.cjs` (import.meta.glob w helperze)
- `gra/tools/empire-armia-produkcja-test.cjs` (kotwica B10)
- `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BATTLE-HARNESS-REMAINDER-Q1/30-obrona-claude.md` (ten raport)
SHA: patrz pole `sha` w odpowiedzi (`git rev-parse HEAD` po commicie).

## RUNDY
1/5 (obrona Operatora, Haiku). Zarzuty: 3 (nr 1 PRZYJĘTY-naprawiony; nr 2 PRZYJĘTY-zrobiony; nr 3 PRZYJĘTY-zmierzony, guard zostaje z uzasadnieniem). Odrzucone zarzuty: brak.

## NASTĘPNY KROK
Evaluator: sprawdzić (a) diff helpera i kotwicę B10, (b) listę 131 exit-kodów, (c) decyzję archer-behind (DECISION_REQUIRED dla właściciela/orkiestratora). Orkiestrator: pozycja UWAGI-DLA-ORKIESTRATORA poniżej.

## UWAGI-DLA-ORKIESTRATORA
1. `gra/src/ui/cityPanel.ts:12699` — zduplikowany eksport `renderBuildList` blokuje build `budynek-garnizon-test` (realny błąd w src, poza tym tematem).
2. Decyzja (3) archer-behind — semantyka `9dc324bb9` vs test `f48894231` (DECISION_REQUIRED).
3. Stuby `brandAssets` nadal kopiowane per harness — kandydat na wspólny stub (osobny temat, tylko `gra/tools`).
4. `import.meta.glob` w `src/ui/leaderPortraits.ts`, `src/ui/icons/brandAssets.ts`, `src/audio/filePlayer.ts` — w harnessach stubowane przez helper; w `src` brak zmian (ryzyko dotyczy tylko CJS/node).
5. Cztery harnessy Chromium (`entitycard-rozwiniete-scrollbar`, `hud-gross-net-rest`, `hud-topbar-grid-gross-net`, `tax-slider-*`) wymagają `xvfb-run` / dłuższego limitu — do ponownego pomiaru w środowisku z wyświetlaczem.

## DEPLOY/PUSH: NIE WYKONANO

---

## Lista 131 harnessów (exit-kod, `node tools/<nazwa>.cjs` z `gra/`, timeout 45 s, 4 równolegle)

Legenda: 0 = OK; 1 = asercje/wyjątek w teście (poza błędem budowania, chyba że zaznaczono); 2 = brak argumentu/pliku wejściowego; 124 = timeout 45 s (NIE ZMIERZONO wynik).

```
0  administrator-icon-everywhere-render-test
0  administrator-panel-real-render-test
0  ai5-zasada3-harness
0  army-merge-dismiss-bounce-test
0  army-panel-recruit-remove-test
0  autowyzywienie-stan-przycisku-test
0  bitwa-podsumowanie-dispose-test
0  bottom-bar-hud-wykonaj-overlap-test
1  budynek-garnizon-test
0  build-mode-hud-affordability-test
0  building-card-overlap-real-render-test
0  building-queue-detail-card-test
1  building-resource-visibility-ui-test
0  building-tech-gate-test
1  city-defense-terrain-gate-test
0  city-ro-loop-boot-error-test
0  city-ro-loop-expand-click-test
0  city-side-panels-below-topbanners-test
0  city-view-layout-test
0  civpedia-cross-link-style-real-render-test
0  civpedia-wikihubhud-rys-historyczny-duplikacja-test
0  diplo-active-treaties-resource-deals-test
0  diplo-aggressor-marker-unit-test
0  diplo-quick-actions-labels-test
0  diplomacy-audience-status-banner-real-render-test
0  diplomacy-audience-status-banner-test
0  diplomacy-city-picker-ui-test
0  diplomacy-infografiki-tooltipy-test
0  diplomacy-lista-podglad-przed-wizyta-test
0  diplomacy-proposal-test
0  diplomacy-tech-chip-filter-and-multi-deal-test
0  dyplo-traktat-handlowy-wybor-czasu-real-render-test
0  empire-armia-produkcja-test
1  empire-army-city-recruit-no-inner-scroll-test
0  empire-autofeed-btn-label-real-render-test
0  empire-mass-recruitment-test
0  empire-miasta-table-test
0  empire-panel-miasto-obywatele-content-test
0  empire-trade-route-split-real-render-test
0  emporion-build-list-real-render-test
1  entity-card-action-buttons-real-render-test
0  entity-card-cross-links-button-style-real-render-test
0  entity-card-diorama-real-render-test
0  entity-card-single-dialog-real-render-test
0  entity-cards-resource-icons-real-render-test
0  entity-cards-resource-icons-test
0  entity-cards-yield-icons-real-render-test
0  entity-cards-yield-icons-test
0  entitycard-civpedia-klik-test
1  entitycard-rozwiniete-scrollbar-real-render-test
1  entitycard-sufit-dwoch-kart-test
0  farma-nie-w-lesie-test
0  forced-war-iron-era-enter-turn-save-load-test
0  fort-nodes-save-load-test
0  fortifications-upgrade-chain-ui-test
0  garncarnia-throughput-chromium-render-test
0  garrison-panel-pinning-real-render-test
1  general-capital-recruitment-order-test
0  heks-plony-zloze-parytet-ui-test
0  hex-tooltip-improvement-production-text-test
0  hex-tooltip-mozliwe-ulepszenia-zloze-test
124  hud-gross-net-rest-test
0  hud-number-abbrev-test
0  hud-panels-below-banner-test
0  hud-recruits-abbrev-test
0  hud-resource-deficit-red-test
2  hud-topbar-bigger-numbers-real-render-test
124  hud-topbar-grid-gross-net-test
0  hud-topbar-layout-a-test
0  hud-topbar-no-labels-test
0  hud-topbar-one-row-test
0  hud-zetony-ekonomia-brutto-live-test
1  idb-menu-continue-boot-refresh-test
1  ids-leak-audit-test
0  korupcja-tekst-gracz-real-render-test
0  left-banner-chip-grid-clip-test
0  left-banner-overflow-narrow-test
0  map-field-battle-test
1  march-resume-next-turn-test
2  memory-datauri-duplicates-test
0  muzyka-era-cumulative-test
1  newgame-menu-reorder-layout-test
0  notif-empty-queue-buildable-test
0  notif-empty-queue-gate-behaviour-test
0  oboz-lowiecki-las-test
0  oboz-lowiecki-wymaga-tartaku-test
1  panel-kolejka-pasek-postepu-test
0  praca-jeden-podzial-real-render-test
1  praca-panel-budowy-warstwa-real-render-test
0  praca-panel-emoji-brand-icons-real-render-test
0  prawo-przebudowa-skali-test
0  pre-battle-save-test
0  prebattle-weakened-warning-test
1  recruit-list-order-by-era-test
0  recruit-list-visibility-ui-test
0  recruit-rally-default-ui-test
0  recruit-reset-close-and-siege-visibility-test
1  recruitment-panel-compact-row-test
0  recruitment-panel-height-real-render-test
0  resource-amount-chip-icons-real-render-test
0  resource-building-toggle-test
0  resource-building-toggle-ui-live
0  resource-building-utilization-test
0  resource-card-numbers-only-test
0  resource-cards-gross-net-test
0  resource-cards-plusx-badge-test
0  resource-icons-everywhere-render-test
0  resource-ledger-skad-dom-test
0  resource-usage-breakdown-test
0  science-hub-unlock-icons-real-render-test
0  science-picker-eta-real-render-test
0  science-picker-tooltip-icons-real-render-test
0  side-list-hud-panel-coverage-test
0  side-panel-unit-cycle-arrows-test
0  sidepanel-event-header-wydarzenie-real-render-test
0  sidepanel-events-toolbar-test
0  spichlerz-deficyt-scalenie-test
1  structure-defense-bonus-test
0  szczescie-audyt-e-etykiety-panelu-real-render-test
1  szczescie-przebudowa-skali-test
124  tax-slider-default-panel-scale-test
124  tax-slider-thumb-align-real-render-test
1  tech-discovery-badge-diorama-test
0  tech-discovery-card-click-test
0  tech-discovery-card-real-click-test
0  tech-unlock-units-test
0  technology-discovery-card-visual-test
2  test-hook-setcitylimit-live-bundle
0  unit-card-3d-preview-coverage-test
0  unit-card-ranged-mult-test
0  wonder-text-no-raw-ids-test
```
