STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-MANUAL-REBALANCE-OWNER-ERA-Q1
GOAL: tryb reczny -- rebalans robotnikow po zmianie populacji ma uzywac epoki wlasciciela miasta.
ZMIANY/COMMIT: `gra/src/game/population-growth-v85.ts` (+ nowy `gra/tools/manual-rebalance-owner-era-test.cjs`, logi gate-*.txt, ten raport). SHA: patrz `git log` (commit "R-WEB-MANUAL-REBALANCE-OWNER-ERA-Q1 Operator r1"). Baza: origin/main 2d9b6aac8.

PRZED (pomiar):
- `okolica.ts` juz przyjmowal `ownerEra` (yieldOfMapHex:387, seedReczneFromAuto:412, rebalanceWorkersAfterPopulationChange:460, uzycie :475/:481) -- przyczyna NIE w `terrain-improvements.ts`.
- `population-growth-v85.ts:582` wolal rebalans BEZ 7. argumentu `ownerEra`; `ownerEra` byl liczony dopiero 4 linie nizej (dla manpower) -- czyli epoka byla dostepna, tylko nie przekazana.
- RED (prawdziwy applyPostCentralPopulationGrowth, pop 1->2, reczne puste, fokus zrownowazony, zloto/miedz/oboz): epoka 3 wybiera pola 0,1+1,0 (ranking Kamienia) zamiast 1,0 + -1,1 (gate-red-before.txt, EXIT=1).

NAPRAWA: `ownerEra` liczone przed wywolaniem i przekazane jako ostatni argument rebalansu (ta sama mapa `ownerEraByOwner`, co dla manpower). Brak mapy = 1 (bez zmiany zachowania). Brak zmiany balansu poza skutkiem poprawki. Uwaga: epoka wplywa tylko na galezie rankingowe (seed przy pustym `okolicaReczne` oraz spadek populacji); galaz dodawania wolnych pol jest deterministyczna i nie zalezy od plonu.

TESTY:
- nowy test: PRZED 4/5 (FAIL epoka 3), PO 5/5 EXIT=0 (gate-green-after.txt); mutacja MUTATE=noera (usuniecie przekazania) -> FAIL EXIT=1 (gate-mutation.txt).
- REGRESJE (65 plikow *population*/*rebalance*/*improvement*/*era*/*okolica* *-test.cjs, bez live): PRZED == PO identyczne (gate-regr-pre.txt vs gate-regr-post.txt, diff pusty). Wczesniej istniejace FAIL/TIMEOUT (niezwiazane, identyczne przed i po): army-panel-recruit-rally-general, era-change-toast-defer, era-cud-main-ts-integracja, era-recruit-panel-refresh, general-capital-recruitment-order, general-quick-follow-action, generals-purchase-runtime, muzyka-era-live-e2e, okolica-load-reconcile, okolica-ownership-change-reconcile, unit-info-card-army-interaction, weterani (EXIT=1); relief-grid-coverage, river-grid-coverage (TIMEOUT 100 s).
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Przegladarka: NIE_ZMIERZONO (zmiana czysto logiczna, bez UI). `npm run build/dev`: nie uruchamiano.

BLOKADY: brak. node_modules usuniete po pracy; brak plikow tymczasowych w repo.
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
