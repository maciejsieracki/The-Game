STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ROSTER-SPACE-NEXT-ACTIVE-UNIT-Q1
GOAL: Spacja w rosterze przechodzi do następnej aktywnej jednostki; jednostka oblegająca lub oblegana trafia do kolejki.

## Pomiar (stan przed zmianą)
- Handler: `gra/src/main.ts` ~L40516 (`keydown`, `e.code==='Space'`). Pomija pole tekstowe (INPUT/TEXTAREA/contentEditable), `e.repeat`, `galleryOn`, `isAnimating`, `endTurnInProgress`, `!isWorldMapUnitMode()` (ta ostatnia zwraca false przy otwartym panelu miasta, pre-bitwie, scenie bitwy, podsumowaniu, panelach merge/split/oblężenia). Potem `cycleToAdjacentPlayerUnit(selectedId, 1)`.
- Kolejka: `cyclablePlayerArmyLeads()` (main.ts ~L6643) = `cyclablePlayerArmyLeadsBase(units, true, stackCanMove, isMe)` z `game/army-cycle.ts`: jednostka gracza, nie `sentry`/`autoExplore`/`inGarnizon`/`ufortyfikowanyWPolu`, ze stosem z ruchem > 0 (`stackCanMove`); 1 wiodąca na stos; kolejność przestrzenna (q+r, q, r); zapętlenie `resolveAdjacentPlayerUnitCycle`.
- PRZYCZYNA: oblegająca (`oblegaCityId`, ruch zablokowany) ma ruch 0, a oblegana garnizonowa ma `inGarnizon` — obie wypadały z kolejki.
- Spacja NIE kończy tury (to `N`). Brak aktywnych: `clearPlayerUnitSelection()` — zachowane bez zmian.

## Reguła (ZAŁOŻENIA)
1. Aktywna = dotychczasowa reguła. 2. Dodatkowo do kolejki wchodzi jednostka gracza OBLEGAJĄCA (`oblegaCityId` → miasto z `oblegane===true`) albo OBLEGANA (stoi, także w garnizonie, w WŁASNYM mieście z `oblegane===true`), nawet bez ruchu. 3. Uśpiona / ufortyfikowana w polu / auto-eksplorująca pomijana także w oblężeniu (świadomy rozkaz gracza). 4. Hot-seat: `isMe` fotela. 5. Brak aktywnych: bez zmian (odznaczenie, bez końca tury). 6. Strzałki HUD ◀▶ (`All`) bez zmian. 7. Zaznaczona jednostka spoza kolejki: start od początku listy (istniejąca semantyka bębna).

## Zmiany
- NOWY `gra/src/game/next-active-unit.ts`: czyste `isUnitSiegeInvolved`, `activeUnitQueue`, `nextActiveUnit(units, currentId, ctx)`.
- `gra/src/main.ts`: import + `cyclablePlayerArmyLeads()` deleguje do `activeUnitQueue` (+4/-1 linie). Skrót Spacji nietknięty.
- NOWY test `gra/tools/roster-space-next-active-unit-test.cjs`.
- Zero zmian: `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `gra/src/ui/**`.

## Testy
- Nowy test: 34 OK / 0 FAIL (`gate-test-new.txt`, EXIT=0): A (moduł, 13 scenariuszy: zapętlenie, bez ruchu, sentry, fortyfikacja, auto-explore, garnizon, oblegająca, oblegana, cudze miasto, brak aktywnych, hot-seat), A-RED (to samo na bazie = stara logika: A3 oblegająca i A4 oblegana CZERWONE, reszta zgodna = brak regresji), B (8 mutacji modułu — wszystkie wywracają A), C (5 sond main.ts), D (Chromium `?civTest=1`, vite build do /dev/shm: realny klawisz Spacji pomija jednostkę bez ruchu i ufortyfikowaną, obieg zapętla, pole tekstowe → brak efektu, zero pageerror).
- tsc `--noEmit`: EXIT=0 (`gate-tsc.txt`).
- Regresje PRZED/PO: `scout-explore-deselect-cycle-test` PO 34/0; `army-merge-separate-return-mainguard-test` PO 73/0; `end-turn-modal-sequencing-test` PRZED 35 pass/5 fail = PO 35/5 (identyczne FAIL, nie z tej zmiany); `end-turn-input-stability-test` PRZED i PO padł identycznie (brak przeglądarki Playwright w harnessie); `hotseat-etap6a-input-noop-test` hashe tur 8–9 PRZED i PO identyczne, przebieg przerwany ręcznie po fazie PO (zbyt wolny przy obciążonej maszynie) — niepełny dowód.

## BLOKADY / NOTY
- N1: Chromium nie pokrywa ścieżki oblężenia end-to-end — brak haka ustawiającego `oblegaCityId`/`oblegane` (hooki poza allowlistą); oblężenie pokryte testem modułu na prawdziwej funkcji + sondą main.ts. Do rozważenia: rozszerzenie `__frozenTestDebug.spawn` o `oblegaCityId`.
- N2: Wybór jednostki oblężniczej przy otwartym panelu oblężenia blokuje `isWorldMapUnitMode()` (bez zmian).
- N3: Garnizon NIEoblegany nadal poza kolejką Spacji (bez zmian).
- N4: `node_modules` usunięty po pracy; baza: origin/main 16195968b.

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (R1)
## DEPLOY/PUSH: NIE WYKONANO

ZMIANY/COMMIT: SHA w komunikacie zwrotnym orkiestratora (commit zawierający ten plik).
