STATUS: PASS-WITH-NOTES (obrona rundy 2; brak zmian kodu w tej rundzie, zarzuty rozstrzygnięte dowodami)
DOMAIN: GAME (UI, tekst podpowiedzi „Zakończ turę”)
TEMAT: R-WEB-UI-END-TURN-HINT-DIPLO-AUDIENCE-TEXT-Q1
GOAL: hintEndTurnBlocked() pokazuje komunikat otwartego modala (audiencja / panel łączenia armii / karta techu) PRZED „Zakończ ekran bitwy…”; bez zmiany logiki blokady; runda 2: endturn-battle-deadlock-exec-test wraca do bazy 42/7.
ZMIANY/COMMIT: kandydat obrony r2 = 95a2dd22c (Operator r2, eval 91d69e323). Obrona NIE zmienia kodu: `git status` czysty po przywróceniu mutacji (patrz TESTY, pkt M). Commit obrony zawiera wyłącznie ten plik raportu.
  Allowlista (zgodna z DODATKIEM 1): `git diff --stat 8f6381fc5 95a2dd22c` = main.ts (+13), end-turn-hint-diplo-audience-test.cjs (+172), endturn-battle-deadlock-exec-test.cjs (5 linii, deps), 2 raporty w runs/<ID>. Brak WERSJE.md, manifestu, gra-robocza/, rust-port/. `git diff --check 2bd8bb6fe 95a2dd22c`: czysto.

## Odpowiedzi na zarzuty Evaluatora (20-evaluator-claude.md, eval 91d69e323)

### Zarzut 1 (nota, niski) — kolejność „modal pierwszy” przed inną przyczyną blokady: ODRZUCAM jako zmianę kodu, zostawiam notę
- Dowód dispatchu: GOAL w 00-dispatch (origin/main) i DODATEK 1 wymagają „Kolejność gałęzi: modal PIERWSZY”; ZMIERZONE w kodzie: main.ts 40758–40770 — gałęzie `isDiplomacyAudienceOpen` / `isArmyMergePanelOpen` / `isTechDiscoveryNoticeOpen` są przed `isPreBattleOpen() || hasPendingAutoPreBattle()` (40771), a dalej są oferta handlowa AI (40776), gameOver, endTurnInProgress, NNS.
- Ryzyko wskazane przez Evaluatora jest realne (gdy modal jest otwarty, a przyczyną blokady jest np. NNS, podpowiedź wskaże zamknięcie modala). Nie jest to błąd względem dispatchu; zmiana na „warunkowanie przez rzeczywistą przyczynę” wymagałaby zmiany kolejności zatwierdzonej w dispatchu i wykracza poza ten temat.
- UWAGA DLA ORKIESTRATORA (poza zakresem, nie zlecam): rozważyć osobny temat „podpowiedź wskazuje realną przyczynę blokady przy otwartym modalu”.

### Zarzut 2 (info) — DODATEK 1 mówi, że isOtherEndTurnModalOpen obejmuje tylko audiencję: ODRZUCAM jako błąd kodu
- Dowód (ZMIERZONE w 95a2dd22c): main.ts 33405–33407 i 47553–47555: `isOtherEndTurnModalOpen: () => isDiplomacyAudienceOpen() || isArmyMergePanelOpen() || isTechDiscoveryNoticeOpen()`. Kod obejmuje trzy modale, zgodnie z GOAL. Błędny jest opis w DODATKU 1 (zdanie „obejmuje tylko audiencję”), nie kod. Brak zmiany kodu.

### Zarzut 3 (info) — test wykonuje ciało funkcji przez new Function, nie Chromium: PRZYJMUJĘ jako notę, bez zmiany kodu
- Dispatch (KRYTERIA a) dopuszcza „hook/jednostkowy albo Chromium”; test end-turn-hint-diplo-audience-test.cjs wykonuje wycięte ciało `hintEndTurnBlocked` z jawnymi zmiennymi wolnymi (sekcja e) — to wykonanie, nie tylko tekst.
- Realnego renderu w Chromium NIE_ZMIERZONO (zmiana wyłącznie tekstowa, bez zmiany logiki); nie uruchamiałem przeglądarki w tej rundzie.

## TESTY (surowe wyniki, worktree obrony na 95a2dd22c, po `npm ci` w gra/; bez `npm run build/dev`)
- A. `npx tsc --noEmit` -> exit 0, brak wyjścia (0 błędów).
- B. `node tools/end-turn-hint-diplo-audience-test.cjs` -> `passed=16 failed=0`, exit 0.
- C. Bramki regresji: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0 / TOTAL: 33`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `COMBAT TEST: 6/6 pass`; end-turn-block-event-test `passed=35 failed=0`; endturn-battle-deadlock-test `38 pass, 0 fail`; koniec-tury-f1-f4-runda3-test `39 pass, 0 fail`; diplomacy-sensible-deals-test `63 passed, 0 failed`. Wszystkie exit 0.
- D. endturn-battle-deadlock-exec-test: `42 pass, 7 fail`, exit 1 = wynik bazowy z DODATKU 1 (42/7); regresja r1 (40/9) usunięta. Lista 7 FAIL i pomiar bazy 8f6381fc5 są zgodne z zapisem Evaluatora (dług bazowy, NIE naprawiany, NIE zmieniany). Bazy nie uruchamiałem ponownie w tej rundzie.
- M. Dowód mutacyjny (ZMIERZONE tutaj): w worktree usunięto gałąź `if (isDiplomacyAudienceOpen())` z main.ts (tylko w worktree, nie w commicie) -> `end-turn-hint-diplo-audience-test.cjs`: `passed=10 failed=6`, exit 1 (test wykrywa brak gałęzi audiencji). Następnie main.ts przywrócono `git checkout -- gra/src/main.ts`; `git status` czysty.
- E. `git diff --check 2bd8bb6fe 95a2dd22c` -> czysto.
- F. Audyt polszczyzny: teksty „Zamknij okno audiencji dyplomatycznej / panel łączenia armii / kartę odkrycia technologii, potem zakończ turę.” bez surowych ID i angielskich słów (zgodnie z eval).
- NIE_ZMIERZONO: render w Chromium / realna podpowiedź w przeglądarce przy otwartej audiencji.

## BLOKADY
- brak blokad technicznych. Zarzuty 1 i 3 pozostają notami (patrz wyżej); zarzut 2 wymaga poprawki opisu w DODATKU 1 przez orkiestratora (poza allowlistą tej obrony).

## RUNDY
Obrona rundy 2 (Operator Haiku r2, Obrona Haiku). Limit 5 rund nieprzekroczony.

## NASTĘPNY KROK
Final Control na kandydacie 95a2dd22c (+ commit tej obrony). Przed integracją orkiestrator sprawdza ancestry względem origin/main (7526eebc5, FALA 765): `git merge-base --is-ancestor 95a2dd22c <SHA integracji>`.

## DEPLOY/PUSH: NIE WYKONANO
(Obrona nie integruje, nie deployuje i nie pushuje na main.)
