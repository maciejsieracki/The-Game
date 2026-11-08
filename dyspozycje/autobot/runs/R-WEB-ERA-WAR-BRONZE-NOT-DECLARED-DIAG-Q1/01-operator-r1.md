STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-BRONZE-NOT-DECLARED-DIAG-Q1
GOAL: Ustalić z dowodem, dlaczego żadna AI nie wypowiada graczowi wojny epoki Brązu i czy to błąd, czy zapis decyzji właściciela.
ZMIANY/COMMIT: tylko nowy test gra/tools/era-war-bronze-player-target-test.cjs + ten raport. Kod gry bez zmian. SHA: patrz `git log -1` brancha worktree-wf_d0dd6794-10a-1 (baza 3994c8bf5).
TESTY: era-war-bronze-player-target-test 22/22; logic-test 213/213; ai-test 289/0; tsc 0 błędów; forced-war-bronze 48/48, iron 55/55, stone 31/31; war-rules-multiwar 57/0 (mutacje 16/16); ai-war-nearest-city-peace-2t PASS; forced-war-reguly-multi-turn-simulation 48/48.
BLOKADY: DECISION_REQUIRED (decyzja produktowa, pkt C). Nie zmierzono na zapisie właściciela (brak zapisu).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator; potem pytanie ABC do właściciela (orkiestrator).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedź (B): czy gracz jest w puli celów?
TAK, dla Kamienia, Brązu i Żelaza jednakowo: jedna procedura `assignForcedWarPairings` (forced-war-common.ts:300), wołana raz na turę z main.ts:39066. Filtr `oid > 0` z main.ts ~39958 to P-AI-MAJOR-ABSORB (nie wojna epoki). Filtr `ownerId <= 0` w main.ts:38852 wyklucza gracza tylko jako NAPASTNIKA, nie jako cel.

## Kto/co wyzwala wojnę epoki gracza obecnie
Nie awans gracza do Brązu. Gracz wchodzi do puli (main.ts ~38976) gdy: tura >= 25, `totalActiveForcedWarsByOwner(0) === 0` (brak jakiejkolwiek aktywnej wojny wymuszonej, wszystkie epoki razem), opcja `playerEpochWarEnabled`, oraz (przed turą 40 gracz wypada, bo nie ma tagu epoki). Gdy jest w puli, flaga PLAYER-FIRST (włączona) daje mu parę z najbliższą od stolicy AI spośród WSZYSTKICH głównych AI bez wojny wymuszonej (forced-war-common.ts:316-340), niezależnie od progu 20 tur i pending tej AI; epoka wojny = epoka tej AI. Próg 20 tur od wejścia w Brąz dotyczy tylko AI parowanych AI<->AI.

## Przyczyna zgłoszenia (dowód: scenariusz S1, S1b, S4 w teście)
Gracz ma trwającą wojnę wymuszoną Kamienia -> `totalActiveForcedWarsByOwner(0)=1` -> gracz NIE jest w puli, więc: (1) gałąź gracz-pierwszy się nie uruchamia (wymaga gracza w puli warless, :314); (2) AI w Brązie parują się między sobą (S1: AI1-AI2, AI3-AI4); (3) nieparzysta AI (leftover) ma dołączyć jako trzeci do istniejącej pary, ale main.ts:39100-39107 filtruje pary `targetId !== 0` ("zawsze AI<->AI"), więc para gracza jest niedostępna i leftover trafia do `unresolvedOwnerIds` (log DECISION_REQUIRED co turę). Kontrola S0 (gracz bez wojny): AI1 (najbliższa) wypowiada mu wojnę Brązu, bramka `evaluateEraForcedWarGate` = ok. S2: po pokoju Kamienia gracz wraca do puli i dostaje wojnę.
Tabela odrzuceń AI (S4, gracz w wojnie Kamienia): AI1 próg 20 tur niespełniony (10); AI2 już w wojnie (także zwykłej); AI3 poziom Łatwy (`forcedWarDifficultyLevel===1` wyłącza szukanie, main.ts:38876); AI4 brak pending; AI5 kandydat, ale gracz poza pulą. Bramki nie blokują: Brąz bez limitu równoczesnych wojen (`maxConcurrentWarsFromBronze=null`), `isWarTreatyBlocked` blokuje tylko sojusz formalny (S5), licznik per (cywilizacja, epoka) ma osobny klucz dla Brązu.
To jest spójne z zapisem decyzji (ECHO "Najpierw wszyscy mają wojnę", dopisek 2026-08-09 "kto już ma wojnę, nie musi wypowiadać"), więc nie jest to błąd kodu. Luka produktowa: gracz z wojną Kamienia jest "zakończony" na wszystkie późniejsze wojny epok, a Kamień z graczem trwa do pokoju.

## Hipoteza H2 (NIE ZMIERZONO na zapisie właściciela)
`restoreEraWarCounts` bez pola w zapisie (stary zapis) odtwarza aktywną wojnę Kamienia gracza pod kluczem BIEŻĄCEJ epoki gracza (`0:2`), nie epoki wojny (`0:1`) (S3: klucze ["0:2","6:1"]). Po pokoju licznik zostaje i gracz jest "wyczerpany" w Brązie do wejścia w Żelazo (S3b: przydziałów na gracza 0). Zapis jest udokumentowany jako "świadomie konserwatywny", ale skutek jest niezamierzony. Poprawka wymaga zmiany wywołania w main.ts:45004 (poza allowlistą bloku wyboru celu) -> zgłaszam jako osobny temat, nie naprawiam bez dowodu na zapisie.

## DECISION_REQUIRED (pkt C), opcje
A. Bez zmian (gracz w wojnie Kamienia nie dostaje wojny Brązu; po pokoju dostaje).
B. Gracz ma pierwszeństwo jako cel gdy spełnia progi Brązu (>= 20 tur w Brązie), nawet z trwającą wojną Kamienia: wchodzi do puli warless dla wojen Brązu/Żelaza niezależnie od Kamienia.
C. AI-leftover może dołączyć do pary gracza jako trzeci (zdjąć filtr `targetId !== 0` w kroku D), bez zmiany puli.
Rekomendacja: C (najmniejsza zmiana, zgodna z ECHO "potem trójkąty", dotyczy tylko nieparzystej reszty, nie zmienia 1v1 ani liczników); B tylko jeśli właściciel chce, by każdy awans gracza dawał własną wojnę. Wymaga ABC; progów nie zmieniałem.
