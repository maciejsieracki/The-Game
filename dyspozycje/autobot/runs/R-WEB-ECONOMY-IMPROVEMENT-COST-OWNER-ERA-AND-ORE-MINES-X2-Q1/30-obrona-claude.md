# R-WEB-ECONOMY-IMPROVEMENT-COST-OWNER-ERA-AND-ORE-MINES-X2-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-IMPROVEMENT-COST-OWNER-ERA-AND-ORE-MINES-X2-Q1
GOAL: kopalnie rudy (miedz, cyna, zelazo) x2 w danych; koszt budowy ulepszenia wg epoki WLASCICIELA (0,5/1/2, dalej x2) z jednej funkcji dla gracza, AI, auto-ulepszen i karty; flaga w danych (domyslnie ON, OFF = wartosci sprzed zmiany).
ZMIANY-COMMIT: patrz sekcja SHA ponizej (commit tylko allowlisty tej rundy).

## Odpowiedzi na zarzuty (kandydat d3f6fcf78)

| nr | werdykt | co zrobiono / dowod |
|---|---|---|
| 1 | PRZYJMUJE | auto-improvements.ts: wszystkie wywolania getImprovementMeta dostaly epoke: `playerEra ?? 1` (SinglePass), `fortOwnerEra = a.opts.playerEra ?? 1` (pickFortClaims). Dowod: mutacja fortOwnerEra=1 -> 9 czerwonych. |
| 2 | PRZYJMUJE | main.ts: 45052, 45071, 45110 -> `empireEpochForOwner(hOid)`; 47942 (AI) -> `empireEpochForOwner(ownerId)`. Ta sama definicja epoki co `playerEra` przekazywane do pickera. |
| 3 | PRZYJMUJE | improvementAdapter.ts:179-180: `scaleTerrainImprovementWorkCostForOwner(baseKosztPracaUlepszenia(...), epoka, improvementCardOwnerEra())`. Provider ustawiany w refreshBuildApi (main.ts) na `player.era` = ta sama wartosc co `playerEra` panelu budowy. |
| 4 | PRZYJMUJE z zastrzezeniem | Ustalenie: 2 czerwone „droga” (bez limitu / fort stoi) sa PRZED ZMIANA: bieg zrodel 26ce3b54f daje 61/2 (zweryfikowane podmiana plikow src i powrotem do d3f6fcf). Dodany fail m7(a) byl skutkiem braku epoki w fixturze. Fixtura: FORT_COST = `getImprovementMeta('fort', 3)` (playerEra fixtury = 3). Asercja (a) przepisana jako RE-BASELINE ZAMIERZONY: najdrozszy niedobor (kopalnia zelaza w Zelazie, 176) > fort (100); m7 wykrywa wariant (b) (stadnina x10), wiec wykrywanie m7 nie slabnie. DECYZJA ORKIESTRATORA: akceptacja re-baseline. Wynik: 66 passed / 2 failed (2 = pre-existing droga). |
| 5 | PRZYJMUJE | diplomacy-value-catalog.ts czyta `koszt_praca_przed_x2 ?? koszt_praca` (buildResourceAccessIndex i diplomacyPnUlepszenie). Wycena dyplomatyczna zostaje na wartosci sprzed zmiany. Wynik: diplomacy-value-catalog-test 82 pass / 0 fail (bylo 81/1). DECYZJA WLASCICIELA: czy wycena dyplomatyczna ma podazac za x2 kopalni. |
| 6 | CZESCIOWO | Dodana sekcja Q w auto-fort-claim-test.cjs: picker (playerEra 1 vs 3, pula 55) i AI (civEra 1 vs 3, pula 99). Mutacja picker -> czerwone. POKRYTE: auto-improvements (fort), ai.ts przez decideAITurn (sekcja Q). NIE POKRYTE: mutacja ai.ts:3209 (`getImprovementMeta(key, opts.civEra)` -> bez epoki) zostaje zielona, bo w tej fixturze picker tez czyta civEra i rozstrzyga; brama planExpansionFortBuilding nie jest izolowana. main.ts (glue) nie ma testu jednostkowego — pokryty tylko biegiem dymnym. |
| 7 | PRZYJMUJE | Dane: kopalnie maja `koszt_praca: 44` + `koszt_praca_przed_x2: 22`. `baseKosztPracaUlepszenia()` przy fladze OFF zwraca 22 -> OFF daje kopalnia zelaza 88 (bylo 176 w zlym kandydacie), cyny 44, miedz 44. Test upkeep w trybie OFF czyta to samo pole. Gwarancja bit-w-bit wobec bazy zweryfikowana testami formuly; pelny bieg OFF vs baza NIE ZMIERZONO. |
| 8 | PRZYJMUJE | Dym wykonany — patrz nizej. |
| 9 | PRZYJMUJE | Status tej rundy: PASS-WITH-NOTES, jest commit z praca (nie BLOCK). |

## Zmienione pliki (allowlista)
- gra/data/terrain-improvements.json: kopalnia_miedzi/zelaza/cyny `koszt_praca` 44 + `koszt_praca_przed_x2` 22.
- gra/src/game/terrain-improvements.ts: `baseKosztPracaUlepszenia(row)` (flaga), `setImprovementCardOwnerEraProvider` / `improvementCardOwnerEra()`.
- gra/src/game/improvement-tech.ts: readMeta -> baseKosztPracaUlepszenia.
- gra/src/map/improvement-build.ts: readWorkCost -> baseKosztPracaUlepszenia (fallback 20 bez `koszt_praca` zachowany).
- gra/src/game/auto-improvements.ts: epoka wlasciciela w pickFortClaims i SinglePass.
- gra/src/main.ts: 4 wywolania (epoka wlasciciela) + import i provider w refreshBuildApi.
- gra/src/ui/entityCards/improvementAdapter.ts: koszt karty wg epoki gracza.
- gra/src/game/diplomacy-value-catalog.ts: wycena na wartosci sprzed zmiany.
- gra/tools/auto-fort-claim-test.cjs: FORT_COST era 3, FORT_COST_AI1, re-baseline (a), sekcja Q.
- gra/tools/ai-territory-race-test.cjs: FORT_COST era 3; H5 uses FORT_COST_AI1 (AI civEra 1).
- gra/tools/era-improvement-cost-upkeep-test.cjs: OFF liczy z koszt_praca_przed_x2.
- gra/tools/improvement-cost-owner-era-test.cjs: OFF kopalnia zelaza 88 (bylo 176).
- Nie zmieniano ai.ts (ai.ts przekazuje juz opts.civEra). Nie zmieniano WERSJE.md, gra-robocza, gra-kanon, rust-port.

## Tabela kosztow (Praca, budowa), flaga ON
| ulepszenie (baza, epoka) | Kamien | Braz | Zelazo |
|---|---|---|---|
| farma (20, ep.1) | 20 | 40 | 80 |
| fort (25, ep.3) | 25 | 50 | 100 |
| kopalnia miedzi (44 w danych, ep.2) | 44 | 88 | 176 |
| kopalnia zelaza (44, ep.3) | 44 | 88 | 176 |
| kopalnia cyny (44, ep.2) | 44 | 88 | 176 |
Flaga OFF (sprzed zmiany): kopalnia miedzi 22 -> Braz 44, Zelazo 88; kopalnia zelaza Zelazo 88; cyny Braz 44.

## TESTY (wyniki z surowego wyjscia, bieg po poprawkach)
- tsc --noEmit: EXIT 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/0
- unit-replace-test: 21/21
- combat-test: All sanity checks passed
- econ-era-rebalance-test: 37 ok, 0 FAIL
- ai-economy-measure-hook-test: 23/23, exit 0
- improvement-era-scaling-test: 144 PASS, 0 FAIL
- auto-improvements-test: 46 passed, 0 failed
- ai-improvements-test: 56 passed, 0 failed
- ai-territory-race-test: 29 OK / 0 FAIL (przed poprawka 27/2)
- praca-jeden-podzial-kontrakt-test: 634 OK, 0 FAIL
- roads-city-links-only-test: 57 OK, 0 FAIL
- diplomacy-value-catalog-test: 82 pass, 0 fail
- era-improvement-cost-upkeep-test: 124 pass, 0 fail
- improvement-cost-owner-era-test: 49 pass, 0 fail
- auto-fort-claim-test: 66 passed, 2 failed (2 FAIL = pre-existing „droga” z bazy 26ce3b54f, bez zmian)
- Mutacje: fortOwnerEra=1 -> 9 czerwonych; ai.ts:3209 bez epoki -> zielone (NIE POKRYTE, patrz zarzut 6).

## DYM (zarzut 8)
- Bieg: tools/ai-economy-measure-run.cjs, seed 4242, --turns 45, --player-ai 1, bundle poza repo (scratchpad). Flaga ON: endTurn 45, stop null, wallSec 98, NaN 0, pageerror 0.
- Flaga OFF (ten sam seed): identyczne HUD gracza: praca 6 / 52 / 168 / 441 w turach 2 / 15 / 30 / 45 (ON = OFF). Wniosek: w tym oknie 45 tur koszt ulepszen nie zmienil decyzji (przyczyny nie ustalono, nie sprawdzano listy budow).
- Uwaga dla orkiestratora: wznowienie slotu w runnerze dalo blad „awaitingFirstPlayerCity” — uzyto swiezego profilu.
- Dysk: 6,9 GB wolne przed biegiem dymnym (bundle w scratchpad).

## BLOKADY / DECYZJE DLA ORKIESTRATORA
1. Akceptacja re-baseline m7(a) (zarzut 4).
2. Wycena dyplomatyczna: zostaje na wartosci sprzed zmiany (zarzut 5) — decyzja wlasciciela.
3. Pokrycie ai.ts:3209 i main.ts testem jednostkowym: NIE POKRYTE (zarzut 6).
4. Dwa czerwone testy „droga” w auto-fort-claim sa pre-existing w bazie 26ce3b54f.
5. Porownanie Praca ON vs baza (pelny bieg bazy) NIE ZMIERZONE; ON = OFF w oknie 45 tur.
6. node_modules zainstalowane w worktree gra/ (npm ci --ignore-scripts); nie usuwano (zakaz rm).

NASTEPNY KROK: Evaluator (ponowna ocena 30-obrona-claude.md i commita), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
