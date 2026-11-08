STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-HOME-DEFENDERS-CIVILIAN-FILTER-Q1
GOAL: Obrona domu (krok 4b/4b2 decideAITurn) przydzielana wylacznie jednostkom bojowym ladowym; jedna wspolna homeDefenderPool dla obu sciezek.
ZMIANY/COMMIT: SHA do integracji 24ab89a1e (baza origin/main 037e6be36 = aktualny origin/main, rebase czysty). Diff do allowlisty: ai.ts (homeDefenderPool + 2 wywolania), nowy ai-home-defense-civilian-filter-test.cjs, war-allin-capital-test.cjs (hash REF_OFF.aiVsAi 20a5bc2c7abcba1b, uzasadniony), katalog runu. git diff --check czysto. Poza allowlista: brak.
WERDYKT ZARZUTOW:
- Z1 flaky ai-army-scattered-merge (asercja czasowa): ODDAL (poza zakresem; planFieldStackGather nie uzywa homeDefenderPool; moj przebieg 33/0). Dlug: stabilizacja progu 25 ms osobnym tematem.
- Z2 czas decyzji: ODDAL (zmierzone przez Operatora, roznica w szumie ok. 2 ms).
- Z3 naglowek T7/T8: ODDAL (poprawione w 24ab89a1e).
- Z4 rebase / hash: ODDAL (origin/main = baza 037e6be36, war-allin-capital 98/0 u mnie).
TESTY (wlasne, na 24ab89a1e): tsc EXIT=0; civilian-filter 8/0; general-path-barb-defense 24/0; keep-barb-defense 8/0; ai-home-defense-vs-barbarians 46/0; ai-war-defend-home 30/0; ai-general-war-campaign 51/0; army-concentration 56/0; ai-move-full-range 20/0; war-allin-capital 98/0; ai-army-scattered-merge 33/0; ai-test 274/20 (zestaw FAIL identyczny z baza wg Operatora/Evaluatora). Mutacja i RED na bazie: potwierdzone przez Evaluatora, nie powtarzane.
BLOKADY: brak.
RUNDY: FC 1/5.
NASTEPNY KROK: integracja orkiestratora: cherry-pick 24ab89a1e na origin/main (037e6be36; jesli main ruszy dalej, powtorzyc hash REF_OFF.aiVsAi w war-allin-capital); wzgledem origin/rust-port/parity-v2 (b520768b0) niezalezne (zmiana tylko w gra/), merge do main przed REPIN Rust.
DEPLOY/PUSH: NIE WYKONANO
