# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — obrona Operatora, RUNDA 3 (odpowiedź na zarzuty Evaluatora r3)

STATUS: PASS-WITH-NOTES (obrona r3 domknięta na zarzutach 2, 3, 8 i częściowo 1 i 5; zarzuty 4, 6, 7 OTWARTE z dowodem; KANDYDAT NIE NADAJE SIĘ DO DEPLOYU — brak Chromium, brak wyzwolenia przez barbarzyńców, brak znacznika na żetonie mapy)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL: usunąć luki wskazane przez Evaluatora r3, które da się zamknąć punktowo i bez ryzyka błędnej bitwy (cykl Spacja, scalenie, widoczność dla wroga, filtr AI), oraz uczciwie oznaczyć to, czego nie zrobiono.
BAZA: kandydat r3 `23906617804f9182a85c10f9ec59cf61380acbb1` (skrót `239066178`; w zadaniu podany skrót `239066178dbc2c6b4e7e8dcf6e2eae0ee3d34ac0` NIE istnieje w repo — to ten sam commit, pełny SHA z `git rev-parse`). Kod obrony: commit `9ab9002d8` (na detached HEAD worktree, bez gałęzi). Raport w tym commicie (SHA podaje sekcja ZMIANY-COMMIT).
UWAGA BAZY: `origin/main` = `6d474b82691798fe5bbdec6881520bd4886f4036` (FALA 785). Kandydat NIE jest jego przodkiem (sprawdzone: `git merge-base --is-ancestor 23906617 6d474b82` → nie). Kandydat stoi na `64069b1a2` (FALA 783) przez merge `87c613722`. Integracja z aktualnym mainem należy do orkiestratora; nie scalałem.

## Odpowiedzi na zarzuty Evaluatora (nr jak w zarzutach)

1. PRZYJMUJĘ CZĘŚCIOWO. Dodany blok `E2` w `gra/tools/ambush-wiring-test.cjs`: asercje na KONKRETNE linie wpięcia — `cancelAmbush(stack)` w `startAnimatedMove` (M2), `reconcileAmbush(units, (q, r) => cities.some(...))` z realnym `hasCity` (M3), guard `if (!launchAttack) return false; // ...` (M4), filtr renderu `rawSrc.filter(u => isUnitVisibleToViewer(u, ME()))` (M9). Wynik: `Wynik: 28 OK, 0 FAIL`.
   - ZASTRZEŻENIE: NIE ZMIERZONO dynamicznej mutacji M2/M3/M4/M9 (nie puszczałem mutantów przez testy po dodaniu E2). E2 jest testem strukturalnym (obecność tekstu), nie testem realnego kroku ruchu. Test wyzwalacza na realnej ścieżce kroku ruchu — OTWARTE.

2. PRZYJMUJĘ — poprawka. `gra/src/game/next-active-unit.ts` `hasNoStandingOrder` i `gra/src/game/army-cycle.ts` `isUnitActiveForCycle` dostały warunek `u.ambush !== true` (zasadzka wyłączona z Spacji i z „następnej aktywnej jednostki”; po odnowieniu ruchu nie wraca do kolejki). 
   - UWAGA ALLOWLISTA: oba pliki NIE są na allowlistcie DODATKU 1/2. Zmiana jest jednowierszowa i konieczna do kryterium „zasadzka nie wraca do kolejki co turę”. Orkiestrator decyduje: zaakceptować rozszerzenie allowlisty albo cofnąć te 2 linie (commit `9ab9002d8`).
   - Test cyklu NIE DODANY (weryfikacja: tsc exit 0 i testy bramek). Brak dowodu dynamicznego — NIE ZMIERZONO w grze.

3. PRZYJMUJĘ — zmiana zgodna z DODATKIEM 1 pkt 4 („reszta zostaje”). Usunięty blok „spójność grupy” z `reconcileAmbush` (`gra/src/game/ambush.ts`). Dołączenie widocznej jednostki do stosu w zasadzce NIE ujawnia reszty; część, która się przemieściła, traci zasadzkę przez pieczęć heksu (`ambushAt`). Test C6 w wiringu zaktualizowany: `reconcileAmbush` zwraca 0, `a` i `b` nadal `ambush===true`, dołączona `n` bez stanu. Zarzut „ujawnia cały stos” zamknięty. Konsekwencja gry: stos mieszany (widoczny + zasadzka) — wróg widzi tylko widoczną jednostkę; to nie jest bitwa z ukrytą zasadzką (zob. zarzut 1/4).

4. PRZYJMUJĘ — NIE ZMIERZONO (kryterium e). Nie uruchomiono builda vite ani przeglądarki w tej rundzie. Żadnej bitwy z zasadzki nie wykonano w grze (ani gracz→AI, ani AI→gracz). Niezweryfikowane: otwarcie `preBattle` z `renderLoop` i z końca tury, wznowienie fazy AI po `attack{ambush:true}`, brak dwóch jednostek na jednym heksie w realnej grze. Kandydat NIE jest gotowy do deployu bez tego pomiaru.

5. PRZYJMUJĘ CZĘŚCIOWO. Naprawiony wyciek: `wakeSentryUnitsOnEnemyContact` (`gra/src/main.ts`) liczy wroga tylko gdy `isUnitVisibleToViewer(v, su.ownerId)` — ukryta zasadzka nie budzi czuwającego (brak komunikatu „wróg w polu widzenia”). 
   - NIE ZROBIONE / OTWARTE: tooltipy heksu, minimapa, wybór jednostki i HUD „siły wroga” nie były audytowane ani testowane w tej rundzie. `barbarians.ts` nadal widzi zasadzkę jako zwykły cel (zob. 6). Test wycieku w wiringu NIE dodany.

6. PRZYJMUJĘ — OTWARTE, NIE ZROBIONE. Potwierdzam dowód: barbarzyńcy liczą zajęcie przez `buildHexOccupancy(units, keyOf)` (`gra/src/main.ts` ~46541), który widzi ukrytą zasadzkę jak zwykłą jednostkę; ruch barbarzyńcy na heks zasadzki jest blokowany, a `resolveAmbushTrigger` nie jest wołany. Nie ma wyjątku w wiki. Przyczyna braku poprawki: wyzwolenie przez barbarzyńcę wymaga otwarcia bitwy po jego stronie (wzór gałęzi `attack` barbarzyńców ~46600, `launchIncomingMapFieldBattle`), czego nie wpinam w tej rundzie. 
   - DECYZJA DO ORKIESTRATORA: czy barbarzyńca wyzwala zasadzkę (ABC A mówi „wejście wroga”, barbarzyńcy są wrogami wg `areEnemyOwners`) — jeśli tak, osobny temat z testem.

7. PRZYJMUJĘ — OTWARTE, NIE ZROBIONE. Znacznik „w zasadzce” istnieje tylko jako tekst `ash-ambush-mark` w nagłówku panelu armii (`gra/src/ui/armyStackHud.ts`). Brak ikony/obrysu na żetonie stosu na mapie, w liście armii i w karcie jednostki. Nie dodawałem: zmiana renderu żetonów w `main.ts` poza zakresem tej obrony.

8. PRZYJMUJĘ CZĘŚCIOWO. `decideAITurn` (`gra/src/game/ai.ts`) ukrywa zasadzkę tylko gdy `aiCanEngageOwner(opts, u.ownerId)` (ta sama bramka co ataki AI), zamiast wszystkich cudzych właścicieli. Sojusznik/pokój nie jest ukryty w planowaniu, więc AI widzi jego heks jako zajęty — zgodnie z executorem (`buildMoveOccupancy(..., areEnemyOwners)`). Import `unitsVisibleToViewer` w `ai.ts` usunięty (nieużywany).
   - ZAŁOŻENIE (NIE ZWERYFIKOWANE w `main.ts`): `opts.canEngageOwner` w silniku = status „wojna” (lub barbarzyńca). Nie sprawdziłem wiązania `canEngageOwner` w `main.ts`; gdyby było szersze, filtr AI różniłby się od executora.
   - Test kombinacji sojusznik/pokój NIE dodany (D4 mutacja nadal sprawdza istnienie filtra przez string-gate w wiringu; wiring 28/0). Ruch końca tury z `launchAttack=false` (return false) bez komunikatu — NIE ZMIENIANO.

## ZMIANY-COMMIT
- Kod + testy: commit `9ab9002d8` (6 plików: `gra/src/game/ai.ts`, `gra/src/game/ambush.ts`, `gra/src/game/army-cycle.ts`, `gra/src/game/next-active-unit.ts` [POZA ALLOWLISTĄ — zob. zarzut 2], `gra/src/main.ts`, `gra/tools/ambush-wiring-test.cjs`). `git diff --check` czysty. Diff stat: 30 insertions, 25 deletions.
- Raport: osobny commit po tym pliku (SHA w odpowiedzi orkiestratora).
- NIE zmieniano: `gra/src/data/wikiBundle.json`, `docs/`, `save.ts`, `armyMerge.ts`, `setup.ts`.

## TESTY (surowe wyniki, worktree `23906617`+`9ab9002d8`, `npm ci --ignore-scripts` wykonane)
- `npx tsc --noEmit` → exit 0.
- `node tools/ambush-wiring-test.cjs` → `Wynik: 28 OK, 0 FAIL`, exit 0 (było 27; +E2, C6 zmienione).
- `node tools/ambush-core-test.cjs` → `Wynik: 40 OK, 0 FAIL`, exit 0.
- `node tools/ambush-ui-reason-test.cjs` → `Wynik: 5 OK, 0 FAIL`, exit 0.
- `node tools/ambush-save-roundtrip-test.cjs` → `Wynik: 5 OK, 0 FAIL`, exit 0.
- Bramki referencyjne: `logic-test` → `LOGIC OK (213/213)`, exit 0; `tech-tree-test` → `tech-tree-test: 20 pass, 0 fail`, exit 0; `research-test` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0; `unit-replace-test` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0; `combat-test` → `All sanity checks passed.`, exit 0.
- Regresja: `load-game-regression-test` → `load-game-regression: 34 PASS / 0 FAIL`, exit 0; `army-merge-colocated-test` → `4 pass, 0 fail`, exit 0; `army-merge-besieger-only-move-test` → `WYNIK: 8 OK / 0 FAIL`, exit 0; `army-merge-dismiss-bounce-test` → `16 pass, 0 fail`, exit 0; `army-merge-bounce-test` → `4 pass, 0 fail`, exit 0.
- Determinizm: `determinism-same-seed-test` → `WYNIK: PASS`, exit 0; `determinism-digest-stackgroup-test` → `ZIELONY (5/5)`, exit 0.
- NIE ZMIERZONO: Chromium / żywa gra / zrzuty 1280×720; testy mutacyjne M2/M3/M4/M9 dynamicznie; `siege-*`, `ai-*`, pełne `battle-*-test.cjs`.

## BLOKADY
1. Chromium / żywa bitwa z zasadzki — NIE ZMIERZONO (zarzut 4). Blokuje PASS.
2. Barbarzyńcy nie wyzwalają zasadzki (zarzut 6) — OTWARTE, wymaga decyzji orkiestratora.
3. Znacznik na żetonie mapy (zarzut 7) — OTWARTE.
4. Cykl Spacja w allowliście — `next-active-unit.ts` i `army-cycle.ts` poza allowlistą (zarzut 2). Wymaga decyzji orkiestratora.
5. Baza: kandydat nie jest na aktualnym `origin/main` (`6d474b826`) — integracja do orkiestratora.

## RUNDY
3/5 (obrona). Poprzednia wartość `RUNDY` w dispatchu zakładała Operatora Sonnet po 2 nieudanych rundach Haiku — ta obrona jest prowadzona na Haiku zgodnie z rolą „Operator (obrona)”.

## UWAGI-DLA-ORKIESTRATORA
- Lista do deployu (nowe/zmienione testy): `gra/tools/ambush-wiring-test.cjs` (zmieniony), `gra/tools/ambush-core-test.cjs`, `gra/tools/ambush-ui-reason-test.cjs`, `gra/tools/ambush-save-roundtrip-test.cjs`. Wiki `docs/encyklopedia/pojecia/zasadzka.md` z r2 (bez zmian w r3).
- Dług do osobnego tematu: wyzwalacz w ruchu wroga na realnym kroku (gracz i AI), przerwanie ruchu i otwarcie bitwy; barbarzyńcy (zarzut 6); znacznik na mapie (zarzut 7); tooltipy/minimapa/HUD siły wroga (zarzut 5); test kombinacji sojusznik/pokój w AI (zarzut 8).
- Nie uruchamiałem nowych sesji ani zadań; nie pushowałem; nie integrowałem na main.

NASTĘPNY KROK: orkiestrator — decyzje: (a) allowlista `next-active-unit.ts`/`army-cycle.ts`, (b) barbarzyńcy wyzwalają zasadzkę?, (c) wpięcie wyzwalacza w realnym kroku ruchu i pomiar w Chromium (osobny temat lub kolejna runda). Kandydat do Evaluatora r4 po decyzjach.
DEPLOY/PUSH: NIE WYKONANO
