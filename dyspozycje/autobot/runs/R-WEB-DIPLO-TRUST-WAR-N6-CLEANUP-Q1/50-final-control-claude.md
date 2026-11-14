STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUST-WAR-N6-CLEANUP-Q1
GOAL: usunięcie martwego pola p6.kryzysTurDoWojny z JSON, N hamulca wojny wyłącznie z profilu pary, opis w Civpedii, zachowanie gry bez zmian.
ZMIANY/COMMIT: kandydat 3671610221d5eb956a4f28156f7d3adfe37113e1 (potomek bazy 03f39f0ad, merge-base --is-ancestor = tak). Diff vs baza: JSON (-2 linie), diplomacy-tick-war-brake.ts (tylko komentarz), wypowiedzenie-wojny.md, wikiBundle.json, 5 testów gra/tools, raporty. Allowlista zachowana; brak WERSJE.md/gra-robocza/rust-port. Jedyny odczyt kryzysTurDoWojny w kodzie: main.ts:12183 (w.n nadpisuje) oraz brake.ts:116/120. Regeneracja bundla narzędziem bundle-wiki-for-game.cjs daje identyczny plik (brak różnic w git status).
ZARZUTY: 1 ODDAL (po obronie sekcja 2 pokrywa N=3..7, mutacja czerwona); 2 ODDAL (tsc chroni wiązanie, typ zostaje wymagany celowo); 3 ODDAL (Civpedia zgodna z kodem: atWar -> counter 0; nota dla orkiestratora); 4 ODDAL (nota integracyjna: git merge-tree origin/main 96c30f2c4 z kandydatem czysto, bez konfliktów).
TESTY (surowe): tsc --noEmit 0 błędów; logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; diplo-trust-war-n6-cleanup 17/0 (na bazowych JSON/Civpedii/bundle: 10 pass / 7 fail = czerwony na bazie); diplo-tick-war-brake-unit 69/0; -mutation 17/0; diplo-tick-war-brake-test 51/0; json-descriptions-sync 19/0; diplo-trust-war-drift 14/0; diplo-war-declare-zero-trust 43/0; diplo-war-peace-main-guard 35/0. git diff --check czysty.
BLOKADY: brak. NIE_ZMIERZONO: runtime w przeglądarce (zmiana bez wpływu na grę, tsc+testy źródłowe), testy po merge z main 96c30f2c4.
UWAGI-DLA-ORKIESTRATORA: po merge z origin/main zregeneruj wikiBundle narzędziem i powtórz bramki. Dispatch mówi o liczniku „do wojny”; Civpedia mówi, że w wojnie licznik wynosi 0 (zgodnie z kodem) — brzmienie do ewentualnego doprecyzowania. Dług Rust: REPIN (usunięcie pola w JSON).
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge z origin/main, regeneracja wikiBundle, bramki), potem deploy ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO
