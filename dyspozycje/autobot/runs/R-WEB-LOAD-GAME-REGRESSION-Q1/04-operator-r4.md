STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LOAD-GAME-REGRESSION-Q1
GOAL: „Wczytaj grę" w menu głównym i pauzy AKTYWNY przy zapisach na dysku (FSA, także po przeładowaniu), WYSZAROWANY przy ich braku; format zapisu bez zmian.
ZMIANY/COMMIT: baza `0a848702` (r3, na origin/main `fcd86933`). Commit r4: SHA w odpowiedzi orkiestratora. Pliki (allowlista r4):
- `gra/src/game/save-presence.ts`: `markPresent()` jest trwałe (flaga `pinnedByWrite`); przeliczenie stosuje `result || pinnedByWrite` (zarzut 7).
- `gra/src/game/fsa-autosave.ts`: `preloadedIdbHandlePromise` z `const` na `let` + NOWY test-only hook `_setPreloadedIdbHandleForTests` (zarzut 4). Logika `hasRememberedFsaDirectory` NIE zmieniona. Uzasadnienie: test gałęzi `perm !== 'granted'` wymaga wstrzyknięcia uchwytu z IDB.
- `gra/tools/load-game-regression-test.cjs`: testy 2e, 2f, 2g, 3e; mutacje 4c (przeniesiona na guard kolejności, 3c), 4e, 4f.
- `dyspozycje/autobot/runs/R-WEB-LOAD-GAME-REGRESSION-Q1/04-operator-r4.md` (ten raport).
NIE zmieniano `gra/src/main.ts` w r4. Brak zmian w `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `package-lock.json`. Bez push, bez deploy.

ODPOWIEDZI NA ZARZUTY R3:
1. (IDB-only, brak FSA) PRZYJMUJĘ, NIE ZROBIONE w r4. Pokrycie jednostkowe: 1a (slot IDB -> true), 2a/2d. Brak E2E bez FSA. NIE_ZMIERZONO w przeglądarce.
2. (bitwa/kolejka, ≥40 tur) PRZYJMUJĘ jako NIE_ZMIERZONO. Brak harnessu w r4. Uwaga: zastój tury 1->2 w części przebiegów to temat R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1. Wniosek z kodu `resetEndTurnBlockers` (main.ts ~8160-8196) NIE został zweryfikowany w r4.
3. (load rzeczywisty) PRZYJMUJĘ, NIE ZROBIONE w r4. E2E nadal kończy się na liście zapisów. Brak testu: wczytanie slotu FSA/IDB/starego zapisu i sprawdzenie tury, miast, jednostek i konsoli.
4. (mutacja przeżywa w `hasRememberedFsaDirectory`) PRZYJMUJĘ - POPRAWKA. Test 2e (prompt -> true), 2f (granted + pusty katalog -> false), 2g (queryPermission rzuca -> true). Mutacja 4f (`return true` -> `return false` w gałęzi `perm !== 'granted'`) jest wykrywana przez 2e. Wynik: 29 PASS / 0 FAIL.
5. (atrapa zawsze 'granted') PRZYJMUJĘ, NIE ZROBIONE w E2E. Gałąź „prompt" pokryta tylko jednostkowo (2e), na podstawie ZAŁOŻENIA. Nie zmierzono w prawdziwym Chrome.
6. (prompt + pusty zapamiętany katalog = aktywny) PRZYJMUJĘ jako kompromis. Brak hintu poza kliknięciem. Decyzja orkiestratora (ZAŁOŻENIE z r2/r3 utrzymane). Test 2e dokumentuje zachowanie.
7. (wyścig po markPresent) PRZYJMUJĘ - POPRAWKA. Przed: przeliczenie wystartowane po markPresent, czytające `false`, ustawiało `value=false`. Po: `pinnedByWrite` trzyma `true`. Test 3e (wynik `false` z przeliczenia nie wyszarza przycisku), mutacja 4e (bez trwałości) wykrywana. Ograniczenie: flaga czyszczona tylko przez przeładowanie. Brak ścieżki usuwania zapisów w grze (sprawdzono: brak deleteSave/removeSave poza czyszczeniem metadanych w `save.ts` 848/1009).
8. (allowlista `main.ts`) PRZYJMUJĘ jako decyzję orkiestratora. r4 nie rusza `main.ts`. Zmiany `fsa-autosave.ts` w r4 to test hook (patrz ZMIANY). Wiring `markPresent` z r2 (main.ts 31258, 31441, 31468) bez zmian.
9. (pozostałe luki) PRZYJMUJĘ, bez poprawki w r4: wiring main.ts sprawdzany regexem (5a-5d), kolizja z DEADLOCK NIE_ZMIERZONA, S3 nie sprawdza `title` (E2E zwraca `null`), zastój tury poza zakresem.

TESTY:
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/load-game-regression-test.cjs`: 29 PASS / 0 FAIL.
- `node tools/fsa-autosave-test.cjs`: 55 pass / 0 fail.
- `node tools/autosave-quota-fail-test.cjs`: 20 pass / 0 fail.
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `git diff --check`: do wykonania przed commitem (wynik w odpowiedzi).
- E2E Chromium (`load-game-regression-e2e.cjs`): NIE uruchamiano w r4. Zmiany nie dotyczą harnessu; wynik r3 nieaktualny dla kodu r4.

BLOKADY: zarzuty 1, 2 i 3 nadal otwarte (E2E bez FSA, pomiar bitwy/≥40 tur, load rzeczywisty). Temat nie jest zamknięty. Zależność od DEADLOCK: NIE_ZMIERZONO.
RUNDY: 4/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5 medium) przegląd r4: trwałość `pinnedByWrite` (zarzut 7), hook testowy w `fsa-autosave.ts` (zarzut 4). Orkiestrator rozstrzyga: zakres 1-3 (osobny temat lub DEADLOCK), allowlistę `main.ts`, kompromis „prompt = aktywny". Następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
