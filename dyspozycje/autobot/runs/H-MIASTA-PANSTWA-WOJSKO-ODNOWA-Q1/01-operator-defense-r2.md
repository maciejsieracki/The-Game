STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1
GOAL: Przyznawać pełną armię startową wyłącznie przy pierwszym mieście danego ownera/fotela, zachowując niezależność foteli hot-seat.

OBRONA #1: PRZYJMUJĘ
Dowód z kodu: w `tryFoundPlayerCityAt` stan `isFirstCityForOwner` jest odczytywany przed `cities.push(c)` przez `isAwaitingFirstPlayerCity(c.ownerId)`, a `grantPlayerStartUnits` jest wykonywane wyłącznie pod tym guardem. `playerEverOwnedCityByOwner` jest kluczem per owner/fotel i jest ustawiany po udanym founding; dlatego drugi fotel ma własny pierwszy grant, a kolejne miasta tego samego ownera go nie powtarzają.

ZMIANY/COMMIT:
- `gra/src/main.ts`: guard pierwszego miasta per owner oraz behawioralny hak testowy zakładający drugie miasto tą samą ścieżką `tryFoundPlayerCityAt`.
- `gra/tools/starting-army-first-city-live-test.cjs`: nowy live Chromium test obu foteli, pierwszego i drugiego miasta oraz negatywna kontrola.
- `gra/tools/hotseat-drugi-fotel-tura-test.cjs`: opcjonalny `HOTSEAT_CHROME_PATH` dla istniejącej bramki runtime.
- Commit: uzupełniony po utworzeniu.

TESTY/DOWODY:
- `starting-army-first-city-live-test.cjs`: 13 pass, 0 fail; realny Vite bundle + Chromium, 0 page errors.
- Mutant kontrolny usuwający guard: 12 pass, 1 fail — wykryto ponowne przyznanie 2 jednostek przy drugim mieście.
- Ten sam live test uruchomiony ponownie po przywróceniu guardu: 13 pass, 0 fail.
- `first-player-city-test.cjs`: 16 pass, 0 fail.
- `city-state-start-units-test.cjs`: 16 pass, 0 fail.
- `city-state-start-units-live-test.cjs`: 22 pass, 0 fail.
- `ai-difficulty-bonus-test.cjs`: 79 pass, 0 fail.
- `manpower-test.cjs`: 63 OK, 0 FAIL.
- `r-manpower-uzupelnienie-hp-niezapisuje-q1-test.cjs`: 12 OK, 0 FAIL.
- `hotseat-human-owners-test.cjs`: 29 PASS, 0 FAIL.
- `hotseat-etap7-saveload-test.cjs`: 59 passed, 0 failed.
- TypeScript 5.9.3 `tsc --noEmit`: PASS.
- `node --check` obu testów: PASS.
- `git diff --check`: PASS.

BLOKADY:
- Pełna istniejąca bramka `hotseat-drugi-fotel-tura-test.cjs` zbudowała bundle i uruchomiła Chromium, lecz utknęła w niepowiązanym scenariuszu końca tury: po 420 s `pollUntil(world-end-turn-after-both-seats)` nadal widział `turn: 2, activeHumanOwnerId: 49`. Decydujący scenariusz armii startowej jest zweryfikowany niezależnym live testem powyżej; nie zmieniałem logiki końca tury.

RUNDY: 2/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
