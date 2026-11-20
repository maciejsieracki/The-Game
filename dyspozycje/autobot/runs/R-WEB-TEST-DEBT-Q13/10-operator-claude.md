STATUS: PASS-WITH-NOTES (runda 5/5: cele A i B osiagniete i przekroczone; D nie rozstrzygniete w calosci, E tylko czesciowo sekwencyjnie)
DOMAIN: GAME (testy; zero zmian w gra/src, gra/data)
TEMAT: R-WEB-TEST-DEBT-Q13
GOAL: testy czerwone do obowiazujacych regul bez oslabiania asercji; bledy gry jako kandydaci R-WEB-*.
BAZA: origin/main 1f0f48be5ca79f6909e359cdc424342c91b3bda0 (detached). Operator SONNET 5.5 (uzasadnienie w dispatchu: 2 nieudane rundy Haiku).

ZMIANY/COMMIT: 35 plikow gra/tools/*-test.cjs (tylko testy) + pliki runs/R-WEB-TEST-DEBT-Q13/ (20-sweep-r5-raw.txt, 41-X-klasyfikacja.md, 42-E.md, 43-stan-156-r5.md, categorize2.cjs, overrides-r5.json, sweep-one.sh, ten raport). Zadna asercja nie usunieta ani zluzowana (piny dopasowane do aktualnego kodu/danych, kazdy z komentarzem R-WEB-TEST-DEBT-Q13 r5 i powolaniem na zmiane).

WYNIK 156 pozycji (surowe: 20-sweep-r5-raw.txt, tabela 43-stan-156-r5.md):
- PRZED (r3): P 21 / A 18 / E 29 / X 88.
- PO (r5, ten sam skrypt kategoryzujacy categorize2.cjs): zielone 69 (+48), czerwone 87: A 1, B 10, D 50, E 26.
(1) KATEGORIA A: z 18 pozycji zielone 16 (cel >= 12 z 15 pozostalych spelniony): 3 z r4 + miasta-panstwa-wylaczone (zielone) + recruitment-batch-contract 17/0, tartak-oboz-wyscig-race 13/0, escape-overlay 49/0, move-pass-through 34/0, ui-language-count 39/0, autoimprove-live-hooks 37/0, pr141 10/10, end-turn-hint-diplo-audience 16/0, city-panel-refresh live i open-panel-refresh live (exit 0, ROBOCZA_HTML = build vite poza repo), memory-static-geometry-pool 18/0 (--gra), ambush-deploy-identity (AMBUSH_BASE_GRA z git archive 1c452ec35). Nadal: ai-ai-treaty-live-proof-wiring (analizator wyniku pomiaru, brak katalogu wyniku) i save-load-roundtrip (warstwa dynamiczna > 570 s).
(2) KATEGORIA X: 88 -> zielone 27 (cel B >= 20 spelniony: 27 z X naprawionych, m.in. rekrutacja-skarbiec-only 13/0), B 10, D 50, E 1. Trzej kandydaci D z dispatchu okazali sie B/fixture, nie bledem gry: ai-army-composition-per-civ (garnizon min. 1 w miescie AI, FALA 857 -> fixture bez garnizonu mierzyl tylko garnizon; teraz 341/0), ai-general-war-campaign (1 jednostka zostaje garnizonem miasta, regula wlasciciela 2026-11-18; 52/0), army-leadership (_routWholeArmy; zielone). Lista D w 41-X-klasyfikacja.md: kategoria wg wzorca asercji, przyczyna NIE ZMIERZONO dla wiekszosci (nie analizowano pojedynczo 50 pozycji) -- NIE sa zweryfikowanymi bledami gry.
(3) KATEGORIA E: 45 testow (29 + 16 wolnych) w 42-E.md: 16 PASS, 4 FAIL (rzeczywiste), 25 TIMEOUT przy limicie 285/190 s POD OBCIAZENIEM -P4 (dispatch wymagal sekwencyjnie 1-2: NIE spelnione). save-load-roundtrip (--dist) > 570 s.

BRAMKI (surowe, na HEAD): tsc exit 0; logic 213/213; tech-tree 20/0; research PASSED 33/FAILED 0; unit-replace 21/21; combat 6/6; ai-test 297/0; war-rules-multiwar-main-guard 21 PASS/0 FAIL; forced-war stone 31/0, iron 55/0, bronze 48/0, reguly 48/0; era-war-engine-scenario 27 OK/0; era-war-bronze-player-target 44/0; ai-economy-measure-hook 25 ZIELONE.

BLOKADY / NIE ZMIERZONO: 50 pozycji D bez ustalonej przyczyny; 10 B nienaprawionych (m.in. hud-moc-warstwa i moc-ranking-rozjazd: pin 49 vs units.json Konnica fieldPower=98; march-attack-queue-persist: piny liczbowe wywolan); 25 timeoutow E nie ponowionych solo (300 s); brak kategorii C (rm/unlink zakazane, zadnego nie oznaczono); ai-move-range ma asercje czasowa wrazliwa na obciazenie (solo 46/0).
UWAGI-DLA-ORKIESTRATORA: (a) harnessy tekstowe main.ts gnija przy kazdej zmianie -- warto osobny temat na eksport funkcji; (b) testy generatora mapy trwaja > 190-285 s przy rownoleglym biegu -- potrzebny osobny runner nocny; (c) climate-band-test ("map has polar terrain 0 hexes") i unit-stock-cost ("Brąz 100 vs 50") -- kandydaci do sprawdzenia, czy to decyzje (polar-avoid FALA / RECRUITMULT x2) czy bledy; (d) przyczyna pozostalych D: nowy temat R-WEB-TEST-DEBT-Q14 z analiza po 1 tescie.
RUNDY: 5/5 (limit wyczerpany; reszta D/B/E wymaga decyzji wlasciciela co do kontynuacji).
NASTEPNY KROK: Evaluator -> Obrona -> Final Control (Haiku/Sonnet wg zasady modeli); integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
