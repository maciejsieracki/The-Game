STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LOAD-GAME-REGRESSION-Q1
GOAL: „Wczytaj grę" w menu głównym i pauzy jest AKTYWNY przy zapisach na dysku (FSA, także po przeładowaniu) i WYSZAROWANY przy ich braku; format zapisu bez zmian.
ZMIANY/COMMIT: baza 8b7b4d9a (r2), commit r3 na wierzchu (SHA w odpowiedzi orkiestratora). Allowlista r3: `gra/src/game/fsa-autosave.ts` (hasRememberedFsaDirectory: liczy pliki rotacji, gdy zgoda jest; bez zgody ZAŁOŻENIE: zapamiętany katalog = obecny), `gra/src/game/save-presence.ts` (createSavePresenceCache: poprawka wyścigu, opis niżej), `gra/tools/load-game-regression-test.cjs` (test 3d, mutacja 4c dostosowana), `gra/tools/load-game-regression-e2e.cjs` (NOWY, E2E Chromium), ten raport. NIE zmieniano `gra/src/main.ts` w r3 (markPresent z r2 pozostaje). Brak zmian w `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `package-lock.json`. Bez push, bez deploy.

ODPOWIEDZI NA ZARZUTY R2:
1. (Odtworzenie w Chromium) WYKONANO, E2E `tools/load-game-regression-e2e.cjs`. Atrapa FSA: `showDirectoryPicker` -> katalog OPFS (klonowalny do IDB, przeżywa reload). Nowa gra, tury z autozapisem co 1 turę: w przebiegach zanotowano 1, 2 i 5 rozegranych tur, sloty `civ-autosave-1..N` zgodne z liczbą tur (log: `[Autosave] rotacyjny (dysk) slot=1..5 tura=2..6`). PRZED poprawką wyścigu (ten sam kod bez kroku 3d): menu pauzy wyszarzone „Brak zapisu" mimo pliku na dysku (1 z 2 przebiegów); po reloadzie menu główne wyszarzone (przebieg diagnostyczny). PO poprawce: pauza aktywna, po reloadzie menu główne aktywne, klik „Wczytaj grę" otwiera listę bez błędu konsoli. Pomiar „przed" z origin/main sprzed r2 NIE_ZMIERZONO.
2. (Load przy bitwie/kolejce, ≥40 tur) NIE_ZMIERZONO. Obserwacja: w części przebiegów tura 1→2 zostaje ZASTOJONA (`[data-end]` aria-disabled=true, 12 jednostek, 9 miast, brak logu blokady w konsoli). To jest zachowanie tematu R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1, nie tego tematu; nie naprawiano (poza zakresem). Brak harnessu wymuszającego bitwę i ≥40 tur w tej sesji (budżet czasu; zastój uniemożliwia ≥40 tur).
3. (Stan przycisku bez zapisów / z zapisami) WYKONANO. Zmiana w `hasRememberedFsaDirectory`: zgoda `granted` -> liczenie plików `civ-autosave-N.json` (przycisk aktywny TYLKO przy plikach); brak zgody -> ZAŁOŻENIE: zapamiętany katalog = obecny (bez gestu nie wolno pytać, stąd kompromis z r2 pozostaje dla stanu „prompt"). Zweryfikowano: z plikami aktywny (S1, S2), pusty katalog wyszarzony (S3). Format zapisu nietknięty; testy `fsa-autosave-test` 55/0 i `autosave-quota-fail-test` 20/0 przechodzą.
4. (Mutacja ścieżki przycisku) WYKONANO częściowo: mutacja 4c (cache bez ochrony) i 4d (wiring `refreshHasAnySaveSlotCache`/`savePresence.refresh` zamienione na `listSaves()`) czerwienią test. Test 4d jest tekstowy na main.ts (behawioralny jest 3b/3c/3d na prawdziwym cache). NIE_ZMIERZONO: mutacja samego `hasAnySaveSlot` w przeglądarce.

ZNALEZIONA PRZYCZYNA (r3, Chromium): wyścig w r2. `createSavePresenceCache` odrzucał wynik każdego przeliczenia, gdy wystartowało inne (numer generacji). Startowe przeliczenie (poprawnie `true`) było porzucane, a jego `.then` przebudowy menu czytał `false` -> menu główne zostawało wyszarzone po przeładowaniu (widoczne w logu: `refresh my=1 gen=2 result=true`). Poprawka: przeliczenie stosuje wynik, jeśli jest NOWSZE niż ostatnio zastosowane (kolejność startu), i NIE stosuje go, jeśli w międzyczasie był `markPresent()`. Test 3d (regresja) i 3b/3c zielone; 4c zmutowane czerwieni 3b.

5. (Sygnalizacja braku zapisów) bez zmian wobec r2 (diagWarn SAVE-PRESENCE, title „Brak zapisu", hint przy kliku). Brak nowego UI.
6. (Wyścigi) poprawione (patrz wyżej); koszt skanu katalogu przy otwarciu menu NIE_ZMIERZONO.
7. (Allowlista) bez zmian w r3 względem decyzji orkiestratora (markPresent w main.ts z r2).
8. (Weryfikacja w przeglądarce) WYKONANO dla pkt 1 i 3: zrzut `s2-load.png` w scratchpad (nie w repo), DOM menu/pauzy odczytany.

TESTY:
- `npx tsc --noEmit`: exit 0.
- `node tools/load-game-regression-test.cjs`: 23 PASS / 0 FAIL.
- `node tools/fsa-autosave-test.cjs`: 55 pass / 0 fail.
- `node tools/autosave-quota-fail-test.cjs`: 20 pass / 0 fail.
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/load-game-regression-e2e.cjs --turns 5` (Chromium, build Vite do katalogu tymczasowego, serwer http 127.0.0.1:8765): OK (0 FAIL) w ostatnim przebiegu; S1 liczba plików = rozegrane tury (zapis finalizowany z opóźnieniem, test czeka do 20 s).

BLOKADY: zastój tury w części przebiegów (tema DEADLOCK, poza zakresem); brak wymuszenia bitwy i ≥40 tur.
RUNDY: 3/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5 medium) przegląd `save-presence.ts` (zmiana semantyki wyścigu) i `hasRememberedFsaDirectory` (zał. „zapamiętany = obecny" bez zgody); Final Control; orkiestrator decyduje o zakresie bitwa/≥40 tur (ewentualnie w DEADLOCK).
DEPLOY/PUSH: NIE WYKONANO
