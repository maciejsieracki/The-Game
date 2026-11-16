STATUS: BLOCK (kod i testy sceny gotowe; brak dowodu Chromium z kryterium (f) i AUTO na 3 ziarnach (d) w tej rundzie)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-COLLISION-ARBITRATION-MANUAL-UNSELECTED-Q1
GOAL: w bitwie RECZNEJ pola sporne miedzy jednostkami NIEWYBRANYMI przez gracza rozstrzygane jak w AUTO (piechota pierwsza, lucznik ustepuje, ten sam typ => mniejsze ID); rozkazy wybranych jednostek bez zmian; brak zamiany miejscami i ping-ponga; determinizm.
ZMIANY/COMMIT: baza 8f6381fc5 (origin/main FALA 764) -> kandydat 478e3c58c (raport r1) -> commit obrony (SHA w polu sha wyniku). Zmienione pliki: gra/src/battle/battleScene.ts (dodane: _manualArbOwner, _isManualNonSelected, _autoBatchSnapshots, _computeManualArbitrationClaims, _applyManualArbPhantoms, _clearManualArbPhantoms; wywolania w _beginTurn (tryb reczny), w _activateNext (wokol _activateUnit); _beginAutoBatchPhase korzysta z _autoBatchSnapshots, mapowanie identyczne). Nowy: gra/tools/battle-collision-manual-unselected-test.cjs. Nie zmieniono autoBatchPhase.ts, WERSJE.md, gra-robocza/, rust-port/.
ODPOWIEDZI NA ZARZUTY EVALUATORA:
 1. (kryterium a, brak kodu) PRZYJMUJE: zaimplementowano. Mechanizm: na starcie tury RECZNEJ _computeManualArbitrationClaims liczy plany niewybranych (klony _snapshotAutoBatchIntents) i rozstrzyga je resolveAutoBatchPhase (ta sama funkcja co AUTO); zajete pola zostaja rezerwacja wlasciciela. Przy aktywacji niewybranej jednostki pola zarezerwowane przez INNA jednostke tej samej strony sa na czas aktywacji zajete (_applyManualArbPhantoms), po done() zdejmowane. Dowod: test S1 (ponizej).
 2. (kryterium b) PRZYJMUJE: test S3 - rozkaz wybranego lucznika atk-1 (playerOrder move na (5,1)) wykonany; niewybrana piechota def-2 na (5,1) nie wchodzi.
 3. (kryterium c, mutacja) PRZYJMUJE: --mutate wylacza rezerwacje w trybie recznym -> S1 AssertionError (czerwono).
 4. (kryteria d, e, g NIE ZMIERZONO) PRZYJMUJE i CZESCIOWO ZAMYKA: e i g zmierzone (nizej); d (AUTO bit-w-bit na >=3 ziarnach) NIE ZMIERZONO.
 5. (kryterium f, Chromium) PRZYJMUJE brak dowodu - NIE ZAMKNIETE w tej rundzie (patrz BLOKADY).
 6. (BLOCK bez kodu) PRZYJMUJE: ta runda zawiera kod i commit.
 7. (ref refs/keep/...INFANTRY-FIRST...) ZWERYFIKOWANE: `git for-each-ref refs/keep/` nie zawiera zadnego ref z ARBITRATION-INFANTRY-FIRST (jest tylko refs/keep/R-WEB-UNIT-REPLACE-PROMOTION-TABLE-INFANTRY-Q1-fc). Nic nie ponownie uzyto; implementacja jest nowa.
TESTY (liczby z surowego wyjscia):
 - npm ci w gra/: exit 0 ("added 71 packages"). Dysk przed: 9.9G wolne; po npm ci: 8.7G.
 - npx tsc --noEmit: exit 0, 0 linii wyjscia (po ostatniej zmianie src - bez zmian src od tej bramki).
 - node tools/battle-collision-manual-unselected-test.cjs: exit 0, "battle-collision-manual-unselected-test: passed". Scenariusze (prawdziwe metody BattleScene; stubowane tylko ruch po terenie, planer BFS, timer, UI):
   S1 piechota def-2 (4,1) i lucznik def-1 (5,0) chca to samo pole (5,1), oboje niewybrani: moves=[{def-2 -> 5,1}], lucznik nie wchodzi; rezerwacje arbitrazu dla niewybranych = 1.
   S2 piechota def-10 vs piechota def-2 (ten sam typ, mniejsze ID): winners=[def-2].
   S3 wybrany lucznik atk-1 z rozkazem na (5,1): wchodzi (moves zawiera atk-1 -> 5,1); niewybrana piechota def-2 nie wchodzi.
   S4 30 rund x3 powtorzenia: ping-pong=0, zamiana miejscami=0, odcisk stanu identyczny w 3 powtorzeniach (determinizm).
 - --mutate (wylaczone rezerwacje reczne): exit 1, "AssertionError: S1: piechota def-2 wchodzi na (5,1)" (czerwono, zgodnie z kryterium c).
 - node tools/battle-manual-orders-full-move-test.cjs: exit 0, passed (FALA 764, kryterium e).
 - node tools/battle-manual-orders-routing-test.cjs: exit 0, passed (kryterium e).
 - node tools/battle-attack-move-order-test.cjs: exit 0, passed (kryterium e).
 - BCA_PART=pure node tools/battle-collision-arbitration-test.cjs: exit 0, "WYNIK: 14 ok, 0 FAIL" (FALA 750, czesc pure).
 - git diff --check: exit 0.
 - NIE ZMIERZONO: BCA_PART=mutRev (czesc live w Chromium FALI 750) - przekroczyl 280 s (exit 124), nie dokonczono.
 - NIE ZMIERZONO: kryterium (f) - zywa bitwa RECZNA w Chromium z kolizja niewybranych (log/zrzut). Chromium systemowy jest (/usr/bin/chromium), ale scenariusz live nie zostal napisany/uruchomiony w tej rundzie.
 - NIE ZMIERZONO: kryterium (d) - AUTO bit-w-bit wzgledem bazy na >=3 ziarnach. Kod AUTO zmieniony tylko przez wyciagniecie identycznego mapowania migawki do _autoBatchSnapshots; wszystkie nowe galezie sa warunkowane _manualMode.
 - NIE ZMIERZONO: 5 bramek referencyjnych (poza tsc, testami sceny i FALI 750 pure).
BLOKADY:
 1. Kryterium (f) - brak dowodu Chromium z zywej bitwy recznej z kolizja niewybranych. Do zrobienia: scenariusz live w Chromium (dziel na segmenty < 590 s).
 2. Kryterium (d) - brak porownania AUTO z baza na >=3 ziarnach.
 3. Ograniczenia projektowe (swiadome, do zaakceptowania przez Evaluator/FC):
    a) Kolizje MIEDZY STRONAMI (atk vs def na to samo puste pole) nie sa arbitrowane - rezerwacje sa per strona; AUTO tez tego nie robi (arbitraz FALI 750 dziala w obrebie jednej fazy strony).
    b) Rezerwacja obejmuje CALA sciezke planu na ture (jak AUTO); pole zwalniane dopiero gdy wlasciciel juz dzialal. Moze to opozniac inna niewybrana jednostke w tej samej turze.
    c) Jednostka, ktora dostanie rozkaz w trakcie tury, zachowuje rezerwacje z poczatku tury.
    d) Przelaczenie na tryb reczny w trakcie tury nie tworzy rezerwacji do nastepnej tury.
    e) Planer testu to zachlanny krok (stub BFS) - test sprawdza mechanizm arbitrazu, nie pelna sciezke terenowa.
RUNDY: 2/5 (runda 1: BLOCK bez kodu, 478e3c58c; runda 2: ta odpowiedz)
NASTEPNY KROK: (1) Chromium: scenariusz live bitwy recznej z dwiema niewybranymi jednostkami o to samo pole, log + zrzut, determinizm x3; (2) AUTO bit-w-bit wobec bazy 8f6381fc5 na 3 ziarnach; (3) Evaluator/FC po tych dwoch punktach. Potem integracja przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: (a) Nie podjeto zadnej nowej sesji/zadania/harmonogramu. (b) gra/node_modules zainstalowane przez npm ci w tym worktree (do sprzatania po integracji). (c) Ref FALI 750 nie istnieje w tym repo - jesli orkiestrator oczekuje reuse, trzeba go zapytac, skad ma pochodzic.
