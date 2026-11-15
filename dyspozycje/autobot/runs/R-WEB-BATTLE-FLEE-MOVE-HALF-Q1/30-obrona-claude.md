# R-WEB-BATTLE-FLEE-MOVE-HALF-Q1 — raport Obrony Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FLEE-MOVE-HALF-Q1
GOAL: zrootowana (uciekająca) jednostka w jednej turze bitwy przemieszcza się nie więcej niż floor(0,5 × normalny zasięg), min 1 heks; mnożnik w jednym miejscu (combat-params.json "ucieczka".mnoznik_ruchu); ruch zwykłych jednostek bez zmian.
BAZA: e72b98b73 (kandydat Operatora, potomek 1b8ce0d39). Worktree odłączony na e72b98b73, `npm ci` w gra/ (71 pakietów, rc=0).

## ZMIANY-COMMIT
- Kandydat Operatora (bez zmian): e72b98b73 — `_fleeMovePointsFor`, `fleeBudgetRound` w `_fleeStep`, `combat-params.json` "ucieczka".mnoznik_ruchu = 0,5 (wartość PRZED: brak pola = 1,0; PO: 0,5), test i browser-entry.
- POPRAWKA tej rundy (commit w tej gałęzi, SHA w polu sha raportu): `gra/src/battle/battleScene.ts`, funkcja `_resolveAutoBatchMovement`.
  - Nowy parametr `normalPlan = false`; `_launchAutoBatchResolution` przekazuje `true` tylko w gałęzi „zwykły ruch/atak zaplanowany” (kind move/attack, steps > 0).
  - Nowa galąź: gdy `normalPlan && ru.routed && ru.fleeBudgetRound !== roundNo` → zapas ruchu tury = min(moveLeft, _fleeMovePointsFor − już przebyte), `fleeBudgetRound = roundNo`, dalej `_fleeStep`. Galąź działa PRZED sprawdzeniem końca ścieżki, więc obejmuje też rozbicie w ostatnim kroku.
  - Jednostki złamane JUŻ przy planowaniu nie wchodzą w tę galąź (normalPlan = false): ich ścieżka jest policzona przez `_fleeStep` w klonie planowania.
  - Zmiana: +15 / −2 linie, wyłącznie `battleScene.ts`. Zero dodanych zapisów `.q =`/`.r =` (zmierzone grep-em na diffie).

## ODPOWIEDZI NA ZARZUTY EVALUATORA
1. (ISTOTNY, gałąź AUTO-batch) — PRZYJMUJĘ, z korektą mojego raportu 10-operator.
   - Dowód, że jednostka złamana PRZED planowaniem jest ograniczona: `_beginAutoBatchPhase` → `_snapshotAutoBatchIntents` → `_activateUnit(clone)` (l. ~5828). `_activateUnit` przy `ru.routed` wywołuje `_fleeStep` (l. ~6093). W planowaniu `_schedule` działa synchronicznie (l. ~9792), a `_doMove` w planowaniu zmniejsza `moveLeft` klona (l. ~8899). `_cloneForAutoBatchPlanning` kopiuje pola przez spread, więc `fleeBudgetRound`/`moveLeft` trafiają do klona. Zamrożona ścieżka takiej jednostki jest więc ≤ limitu. Moje wcześniejsze „wszystkie ścieżki idą przez _fleeStep” było prawdziwe dla planowania, ale nie dla wykonania.
   - Prawdziwa luka (przyjęta): jednostka zaplanowana jako ZWYKŁY ruch, złamana W TRAKCIE fali (np. po śmierci sąsiada w tej samej fali, _shakeAlliesOnLoss), dokańczała zamrożoną ścieżkę w normalnym tempie, bo `_resolveAutoBatchMovement` nie sprawdzał `routed` między krokami. Naprawione nową galęzią (patrz ZMIANY-COMMIT).
   - Dowód: tsc --noEmit rc=0; flee-test 43 PASS / 0 FAIL (po poprawce); pursuit 30/0; neverrout 58/0 (rc=0). Test SCENARIUSZA „złamanie w trakcie fali” NIE ZMIERZONO — nie udało się zbudować deterministycznego przypadku w tej rundzie; poprawka opiera się na przeglądzie kodu.
2. (AUTO sceniczne nie zmierzone) — PRZYJMUJĘ jako NIE ZMIERZONO. Tryb `FLEE_MODE=watch` przekracza limit 590 s w pierwszym planie; nie uruchamiałem w tle (zakaz). Kod `_fleeStep` jest wspólny z ręcznym; ścieżka AUTO jest opisana w zarzucie 1.
3. (brak zrzutu ekranu) — ODRZUCAM jako zarzut blokujący: dispatch (punkt 5) wymaga „zrzut/log bitwy”; dowodem jest log kroków na turę z prawdziwej sceny w headless Chromium (flee-test). Zrzutu NIE ZMIERZONO.
4. („Pomiń”/computeInstantResult nie zmierzone) — PRZYJMUJĘ jako NIE ZMIERZONO w runtime. Tryb skip w teście to `scene.skip()` (ścieżka tickowa), nie osobny tryb instant. Przegląd: ruch uciekinierów idzie tylko przez `_fleeStep`/`_doMove` (`_fleeStep` wywoływany z `_activateUnit` i `_resolveAutoBatchMovement`); nie znalazłem osobnej symulacji ruchu ucieczki w `combat.ts`/`auto-battle-power.ts`.
5. (dokumentacja/wikiBundle) — ODRZUCAM: dowód z gra-docs: `docs/PORADNIK-GRACZA/10-walka.md:377` („Morale ucieczki — doświadczony żołnierz łamie się później”) i `14-ai-zagrozenia.md:203` („Odwrót — przy bardzo niskim HP uciekają”) dotyczą morale i odwrotu, nie prędkości uciekiniera. Brak opisu tempa = brak synchronizacji; wikiBundle nie regenerowano (brak zmiany treści).
6. (brak 00-dispatch.md w origin/main) — ODRZUCAM: plik istnieje. `git show origin/main:dyspozycje/autobot/runs/R-WEB-BATTLE-FLEE-MOVE-HALF-Q1/00-dispatch.md` zwraca treść (ZMIERZONO w tej rundzie), a `git ls-tree --name-only e72b98b73 -- dyspozycje/autobot/runs/R-WEB-BATTLE-FLEE-MOVE-HALF-Q1/` wypisuje `00-dispatch.md`, `00-dispatch-DODATEK-claude.md`, `10-operator-claude.md`.
7. (neverrout i mgla nie odtworzone) — PRZYJMUJĘ i mierzę:
   - `battle-neverrout-hold-test.cjs` na poprawce: 58 PASS / 0 FAIL, rc=0 (7 min 01 s, pierwszy plan).
   - `mgla-sciezka-inwariant-test.cjs` na poprawce: 41 pass / 1 fail; jedyny FAIL dotyczy `src/game/ai.ts:3741, 3776, 3777, 3824`. Kandydat i poprawka NIE zmieniają `ai.ts` (`git diff --name-only 1b8ce0d39 e72b98b73 | grep -c ai.ts` = 0) i nie dodają zapisów `.q/.r` (0). Na czystej bazie 1b8ce0d39 NIE ZMIERZONO (dług bazowy wnioskowany z konstrukcji, nie z pomiaru).

## TESTY (surowe wyniki, ZMIERZONO na e72b98b73 + poprawce)
- `node ./node_modules/typescript/bin/tsc --noEmit`: rc=0
- `tools/logic-test.cjs`: LOGIC OK (213/213)
- `tools/tech-tree-test.cjs`: 20 pass, 0 fail
- `tools/research-test.cjs`: ALL GREEN
- `tools/unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (21/21)
- `tools/combat-test.cjs`: All sanity checks passed.
- `tools/battle-flee-move-half-test.cjs` (skip, Chromium headless): 43 PASS / 0 FAIL (rc=0, 1 min 34 s). Uwaga: Operator w swoim raporcie podał 42/0 — liczba różni się o jeden check, wynik pozostaje zielony.
- `tools/battle-routed-pursued-destroyed-test.cjs` (TMPDIR=/dev/shm): 30 PASS / 0 FAIL, rc=0.
- `tools/battle-neverrout-hold-test.cjs`: 58 PASS / 0 FAIL, rc=0.
- `tools/mgla-sciezka-inwariant-test.cjs`: 41 pass / 1 fail (opis w pkt 7).
- Wymagane wcześniej (dowód mutacyjny kandydata, nie powtarzany tutaj): mnoznik_ruchu = 1 → test czerwony (Operator: 6 PASS / 29 FAIL).
- `git diff --check`: wykonany przed commitem (patrz sekcja DEPLOY/PUSH).
- NIE ZMIERZONO: tryb AUTO sceniczny (FLEE_MODE=watch), tryb „Pomiń”/instant, zrzut ekranu, scenariusz „złamanie w trakcie fali”.

## BLOKADY
- Brak blokad infrastrukturalnych.
- Tryb AUTO sceniczny (`FLEE_MODE=watch`) przekracza 590 s w pierwszym planie — NIE ZMIERZONO (zakaz run_in_background).
- Deterministyczny test złamania w trakcie fali nie został zbudowany w tej rundzie — NIE ZMIERZONO.

## RUNDY
1/5 (Obrona, Haiku). Bez powtórki rundy.

## NASTĘPNY KROK
Evaluator (Sonnet) — ponowna ocena poprawki w `_resolveAutoBatchMovement` (normalPlan) i decyzja, czy wymagany jest test scenariusza „złamanie w trakcie fali” przed Final Control. Następnie Final Control (Sonnet).

## UWAGI-DLA-ORKIESTRATORA
- Mój raport 10-operator-claude.md w punkcie „Ścieżki ucieczki: wszystkie ruchy uciekiniera idą przez _fleeStep (w tym planer AUTO-batch)” był zbyt mocny: dla jednostek złamanych w trakcie fali nie był prawdziwy do tej poprawki. Ta runda go koryguje.
- Prośba właściciela cytowana w dispatchu nie dotyczy tego tematu (wspomniane w raporcie Evaluatora).

DEPLOY/PUSH: NIE WYKONANO
