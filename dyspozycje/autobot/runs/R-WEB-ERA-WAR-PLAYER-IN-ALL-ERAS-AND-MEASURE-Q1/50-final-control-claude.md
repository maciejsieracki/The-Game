STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: gracz jako cel wojen epoki Kamienia/Brazu/Zelaza na rowni z AI + narzedzie pomiarowe + bieg dymny + dlug progow testow
ZMIANY/COMMIT: kandydat ea4863ef0 (potomek bazy 49f8e1ea8: `git merge-base --is-ancestor` = tak). Diff 13 plikow, +314/-42: main.ts (+18), forced-war-common.ts, ui-params.json, 7 testow, nowy era-war-player-included-test.cjs, raporty 10/30. Allowlista zachowana (brak gra-robocza/, WERSJE.md, war-rules-params.json, rust-port/).

TESTY (wlasny bieg w worktree na ea4863ef0, node_modules doinstalowane lokalnie, package*.json przywrocone):
- tsc --noEmit: exit 0 (bez flagi --ignoreDeprecations; zarzut 8 o fladze potwierdzony, sam tsc czysty)
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- era-war-defer-not-cancel 28/0; era-war-delays 55/0; era-war-ignore-treaties 22/0
- era-war-player-included 10/0; era-war-bronze-player-target 44/0
- forced-war-bronze 48/0; forced-war-iron 55/0; forced-war-stone 31/0; multi-turn 48/0 (cele pkt 5 dispatchu spelnione)
- forced-war-iron-main-guard 35 PASS / 1 FAIL (cleanupIronForcedWarOnPeace, regex na main.ts l.12787; hunki ea4863ef0 w main.ts sa ok. l.45554+, nie dotykaja tej funkcji ani finalizePeaceTreatyBetween -> czerwona przedtem, nie regresja tej rundy; zarzut 1 naprawiony)

OCENA ZARZUTOW:
1 (regresja regex freeTargetCandidates): NAPRAWIONY, 33/2 -> 35/1; pozostaly FAIL przedistniejacy. ODDAL.
2 (brak pokrycia hunka main.ts): CZESCIOWO. Pin zrodlowy dodany, ale testu silnikowego/mutacyjnego toru main brak. NAPRAW.
3 (scenariusz silnikowy Kamien trwa -> Braz pending -> pokoj -> start w 1. turze): NIE ZROBIONY; esbuild jest dostepny po `npm install --ignore-scripts` (obrona myli sie, twierdzac inaczej). NAPRAW.
4 (hook __eraWarMeasure + runner era-war-measure-run.cjs): NIE ZROBIONY, pkt 3 dispatchu. NAPRAW.
5 (bieg dymny seed 4242 i 7, 120 tur, tabela per epoka): NIE ZROBIONY, pkt 4 dispatchu; zachowanie AI->gracz w ai.ts niezmierzone. NAPRAW.
6 (Kamien bez fallbacku dla gracza): odrzucenie z zalozeniem PRZYJMUJE. Fallback Kamienia wylaczony dla wszystkich (forced-war-common.ts, test T4), gracz pozostaje celem Kamienia przez pule; spojne z "na rowni z AI". Zalozenie do potwierdzenia przez orkiestratora. ODDAL (uwaga).
7 (gracz w fallbacku omija prog 40 tur): NAPRAWIONY (playerEraPoolEligible steruje freeTargetCandidates). Brak testu silnikowego (jak pkt 2).
8 (ui-params.json): NAPRAWIONY (opis opcji K2 OFF zaktualizowany do biezacej reguly).

UZASADNIENIE WERDYKTU: zmiana kodu gry (fallback gracza) i dlug progow (pkt 5) sa poprawne i zielone, ale trzy zasadnicze punkty dispatchu (pkt 3 narzedzie pomiarowe, pkt 4 bieg dymny, pkt 6 scenariusz silnikowy) pozostaja niewykonane mimo dostepnego esbuild; dispatch zakazuje zatrzymania na DECISION_REQUIRED. Wymog "mutacja kopii czerwona" dla toru main niespelniony.

BLOKADY: brak techniczny (esbuild/tsc dzialaja po `npm install --ignore-scripts` w gra/; wolne ok. 4 GB dysku).
RUNDY: 2/5 zuzyte; kolejna runda 3/5, ten sam ID, baza ea4863ef0.
NASTEPNY KROK: Operator rundy 3: (a) hook __eraWarMeasure (read-only) + era-war-measure-run.cjs; (b) test silnikowy Kamien trwa -> Braz pending -> pokoj -> start w 1. turze po pokoju, w tym blokada wojna naturalna, z mutacja kopii main.ts czerwona (cofniecie hunka freeTargetCandidates); (c) bieg dymny seed 4242 i 7 x 120 tur z tabela per epoka; (d) potwierdzic zalozenie pkt 6. Potem Evaluator i FC.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: iron-main-guard 1 FAIL jest przedistniejacy (pin cleanupIronForcedWarOnPeace) i wymaga osobnej poprawki. Operator rundy 3 niech zainstaluje zaleznosci przez `npm install --ignore-scripts` (nie commitowac package*.json). Dysk ok. 4 GB wolnego - na granicy progu startu web.
