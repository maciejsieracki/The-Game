STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane)
TEMAT: R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1
GOAL: Obywatele zużywają ceramikę już w epoce Kamień (1 na obywatela na turę); do czasu Garncarni miasta w Kamieniu mają karę (−2 Szczęścia, −1% Rozwoju za brakujący surowiec).
BAZA: d4c3c39d37c555ea155bedfb5780bbb58cd89ae6 (origin/main), praca w detached HEAD worktree wf_b1f11246-9e1-1.

ZMIANY-COMMIT:
- gra/data/citizen-resource-upkeep.json: epoka 1 (Kamień) surowce = ["drewno", "glina", "ceramika"]. Stawki epok 2+ i listy Brązu/Żelaza bez zmian. Stawka Kamienia 1,0 (m(1)=1) bez zmian w kodzie.
- gra/tools/citizen-resource-upkeep-test.cjs: fixtury epoki 1 rozszerzone o ceramikę (lista, bramka binarna, drain, pokrycie z populacją). Asercje "Epoka 1 = Drewno + Glina" zastąpione "Drewno + Glina + Ceramika".
- gra/tools/citizen-upkeep-era-mult-test.cjs: LIST_LEN[1] 2→3; F1/F2 (Kamień pop 10: razem 30), F7 (pop 50: [50,50,50]).
- gra/tools/citizen-consumption-era-mult-test.cjs: D2 lista Kamienia 2→3.
- gra/tools/szczescie-przebudowa-skali-test.cjs: NSUR epoki 1 = 3; scenariusz optymistyczny pop 8 epoka 1 = 60 pkt (było 58; +2 za dodatkowy dostarczony surowiec).
- Pozostałe punkty ZMIAN z dispatchu NIE wykonane (patrz BLOKADY / NIE ZROBIONE).

Liczenie kary (potwierdzone testem): epoka 1, magazyn bez ceramiki → ceramika w missing (−2 Szczęścia, −1% Rozwoju); z ceramiką → +2 Szczęścia. Drain epoki 1 dla populacji 20 = 20 ceramiki (test deductions.ceramika).

TESTY (surowe wyniki z tego przebiegu):
- node tools/citizen-resource-upkeep-test.cjs: 108 passed, 2 failed. Obie porażki: "main.ts: kotwica const ordPctRaw = evaluateOrderFromBreakdown( znaleziona" oraz "F1 (mutant 1)". Na d4c3c39d3 wzorzec `const ordPctRaw = evaluateOrderFromBreakdown(` w gra/src/main.ts nie występuje (0 trafień), więc to czerwone-na-bazie, nie efekt tej zmiany.
- node tools/citizen-upkeep-era-mult-test.cjs: 681 passed, 0 failed (na bazowym JSON: 663 passed, 0 failed).
- node tools/citizen-consumption-era-mult-test.cjs: 77 passed, 0 failed (na bazowym JSON: 76 passed, 0 failed).
- node tools/szczescie-przebudowa-skali-test.cjs: 516 OK, 4 FAIL. Cztery porażki (katalog budynków 44 vs 41; 2b komplet epok 1/2/3 = 12/24/32 vs 11/23/31) są identyczne na bazowym JSON (515 OK, 4 FAIL). Nowe asercje ceramiki przechodzą.
- node tools/surowce-katalog-kolejnosc-test.cjs: 62 pass, 0 fail, exit 0.
- node tools/porzadek-panel-czytelnosc-test.cjs: 93 passed, 0 failed.
- node tools/resource-usage-breakdown-test.cjs: NIE URUCHOMIONO POPRAWNIE. esbuild: "No loader is configured for .svg" w src/ui/icons/brandAssets.ts:18 i src/ui/icons/scienceOwlIcon.ts:6. Te pliki nie są zmieniane w tym temacie; błąd nie wynika z diffu (NIE_ZMIERZONO na bazie osobno).
- npx tsc --noEmit (w gra/): exit 0, 0 linii wyjścia.
- git diff --check: czysty (exit 0).
- 5 bramek referencyjnych z R-PROC-AUTOBOT §Bramki: NIE_ZMIERZONO (nie uruchamiano w tej rundzie).

POMIAR WPŁYWU NA WCZESNĄ GRĘ (kryterium d): NIE_ZMIERZONO. Nie uruchomiono trybu przyspieszonego (≥3 ziarna × 60 tur). Brak danych o turze, w której gracz/AI zaczyna mieć ceramikę, ani o długości kary.
Obliczenie z danych (NIE pomiar gry): Garncarnia 30 − obywatele 20 (1,0 × 20) − Spichlerz I 10 = 0 ceramiki/turę w epoce 1 dla jednego miasta z 20 obywatelami. Epoki 2–3 nie liczono.

ZRZUT CHROMIUM panelu pokrycia (kryterium e): NIE_ZMIERZONO. Brak zrzutu; UI nie zmieniano.

BLOKADY / NIE ZROBIONE (z dispatchu, świadomie poza tą rundą):
- Dokumentacja: docs/encyklopedia (hasło o zużyciu surowców przez obywateli) oraz docs/PORADNIK-GRACZA (grep "drewno i glina" nie dał trafienia; wymaga przeglądu 08-ekonomia-imperium.md i 01/03 pod kątem frazy o obywatelach) — NIE zrobione.
- gra/data/citizen-resource-upkeep.json: pole _opis (historyczne) — nie zaktualizowane.
- gra/src/game/citizen-resource-upkeep.ts: komentarze/JSDoc — nie zaktualizowane.
- gra/src/ui/** (teksty i lista surowców w panelu pokrycia): nie zmieniane; panel bierze listę z citizenRequiredResourcesForEra, więc ceramika w epoce 1 pojawi się przez dane, ale NIE zweryfikowano tego w UI.
- gra/src/data/wikiBundle.json: regeneracja (tools/bundle-wiki-for-game.cjs) — NIE wykonana (najpierw dokumentacja).
- Rust REPIN tabeli obywateli: dług; rust-port poza allowlistą, nie ruszano.

UWAGI-DLA-ORKIESTRATORA:
1. citizen-resource-upkeep-test.cjs ma dwie czerwone-na-bazie asercje (kotwica main.ts `const ordPctRaw = evaluateOrderFromBreakdown(` nie istnieje). Osobny temat naprawy testu.
2. szczescie-przebudowa-skali-test.cjs ma 4 czerwone-na-bazie asercje o liczbie budynków (katalog 44 vs 41). Osobny temat.
3. resource-usage-breakdown-test.cjs nie buduje się przez brak loadera .svg w esbuild (harness testu). Osobny temat.
4. Wiadomość relayowana od użytkownika („Nie można w mieście zbudować więcej niż jednej garncarni") NIE dotyczy tego dispatchu (dispatch = ceramika obywateli w Kamieniu). Limit Garncarni NIE zaimplementowany. Jeśli ma być osobnym tematem, potrzebny osobny dispatch i decyzja właściciela (jak limit działa dla istniejących miast).
5. node_modules: w worktree zainstalowane przez `npm ci --ignore-scripts` w gra/ (ignorowane przez git). Sprzątanie po stronie orkiestratora.

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja diffu allowlisty (5 plików kodu/testów + raport), wyników testów powyżej, decyzja, czy dokumentacja/UI/wikiBundle i pomiar gry wchodzą w rundę 2 (runda 2/5).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
