# Zapis niedostępny przed założeniem pierwszego miasta — analiza i stan wiążący

TEMAT: R-WEB-SAVE-BLOCK-PRE-CAPITAL-Q43B (tag SAVEBLOCKQ43B). Decyzja właściciela: pytanie Q43 = **B**.
BAZA: origin/main `42992edde48ccf32da3065ebf4924cafa291371e`.

## Stan wiążący

- **Zachowanie:** dopóki KTÓRYKOLWIEK fotel ludzki nie założył pierwszego miasta (stolicy), każda ścieżka zapisu odrzuca zapis i pokazuje komunikat **„Zapis niedostępny przed założeniem pierwszego miasta”**. Po założeniu stolicy zapis działa jak dotąd.
- **Wczytywanie nie jest blokowane** (`loadGameFromSlot`, `restoreGameFromSave` bez bramki — sprawdzone testem statycznym).
- **Format zapisu bez zmian.**
- **Predykat:** `isSaveBlockedByFirstCity()` = `humanSeats.humanOwnerIds.some(oid => isAwaitingFirstPlayerCity(oid))` (gra/src/main.ts, obok `isSaveBlockedByBattle`). `isAwaitingFirstPlayerCity` = brak wpisu `playerEverOwnedCityByOwner` i brak miasta fotela (`gra/src/game/first-player-city.ts::isAwaitingFirstPlayerCity`, opakowanie `computeAwaitingFirstPlayerCity`).

## Ścieżki zapisu (gra/src/main.ts) i bramki

| Ścieżka | Funkcja | Bramka |
|---|---|---|
| Menu pauzy → „Zapisz” (dialog zapisu) | `openSaveGameDialog` | przed otwarciem dialogu; przy kliknięciu „Zapisz” w dialogu gałąź `else if (isSaveBlockedByFirstCity())` pokazuje komunikat zamiast „brak localStorage” |
| Ctrl+S / przycisk szybkiego zapisu (także z bitwy/przed bitwą, `onSave`/`onQuickSave`) | `doQuickSave` | przed `persistSaveToSlot` |
| Każdy zapis przez `persistSaveToSlot` (także hooki testowe) | `persistSaveToSlot` | twarda bramka przed `saveToLocal` |
| Autozapis rotacyjny (FSA i localStorage) | `doRotatingAutosave` | przed `fsaRotatingAutosaveWrite` i fallbackiem localStorage (ciche pominięcie tury, `console.warn`) |

Bramka bitwy (`isSaveBlockedByBattle`) pozostaje nietknięta i działa jak dotąd.

## Predykat „pierwsze miasto założone” i hotseat

- Założenie stolicy: `tryFoundPlayerCityAt` → `playerEverOwnedCityByOwner.add(ME())` (gra/src/main.ts, ok. linia 17912), a w tej samej funkcji `spawnPendingForeignClusters()` i `spawnPendingSameTypeRivals(q, r, c.ownerId)` drenują kolejki.
- Kolejki `pendingForeignSpawnCities`, `pendingSameTypeRivalCount` / `…Second` są ustawiane w planie startu gry (ok. linia 11831) i **nie są w zapisie** (FAKTY Q43). Dlatego zapis przed założeniem stolicy byłby niekompletny.
- **Hotseat:** kolejka drugiego fotela (`pendingSameTypeRivalCountSecond`, `spawnPendingSameTypeRivals` z `founderOwnerId === secondPlayerOwnerIdForRivals`) jest drenowana dopiero przy założeniu stolicy przez drugi fotel. Dlatego predykat sprawdza **każdy** fotel z `humanSeats.humanOwnerIds`: dopóki choć jeden fotel nie założył miasta, zapis jest zablokowany. Jest to świadome założenie (wariant „wszyscy fotele”); alternatywa „pierwszy fotel” zostawiałaby niedrenowaną kolejkę fotela 2 poza zapisem.
- Po odebraniu wszystkich miast przez fotel, który kiedyś miał miasto, predykat zwraca false (flaga `playerEverOwnedCityByOwner` zostaje), więc blokada nie wraca — zgodnie z istniejącą semantyką porażki (`isPlayerDefeatedNow`).
- Wczytanie zapisu odtwarza `playerEverOwnedCityByOwner` (`restoreGameFromSave`), więc zapis po wczytaniu z miastem nie jest blokowany.

## Założenia

1. Predykat dotyczy wszystkich foteli ludzkich (hotseat), nie tylko aktywnego.
2. Blokada nie zależy od tury ani od tego, czy gracz dotknął kreatora — wyłącznie od stanu `playerEverOwnedCityByOwner` / miast fotela.
3. Komunikat bramki w `persistSaveToSlot` zwraca `reason: 'other'`, więc przy zapisie z dialogu nie ma mylącego komunikatu „brak localStorage”.

## Testy

- **Statyczny** `gra/tools/save-block-pre-capital-test.cjs`: PASS=26 FAIL=0. Mutanty czerwone (9/9): brak bramki w `persistSaveToSlot`, `doQuickSave`, `openSaveGameDialog`, `doRotatingAutosave`; predykat tylko dla fotela primary; predykat odwrócony; zły komunikat; bramka po operacji zapisu; bramka w `loadGameFromSlot`.
- **Bramki (wykonane 28.11, surowe wyniki):** `tsc --noEmit` EXIT=0; `logic-test` 213/213; `tech-tree-test` 20 pass 0 fail; `research-test` 33/33; `unit-replace-test` 21/21; `combat-test` 6/6; `ai-test` 297 passed 0 failed; `save-load-ai-cs-absorption-state-test` 27 PASS 0 FAIL; `save-load-ai-state-fields-test` 29 PASS 0 FAIL; `battle-save-disabled-test` 8 PASS 0 FAIL; `pre-battle-save-test` OK; `fsa-autosave-test` 55/0; `autosave-quota-fail-test` 22/0; `save-label-test` OK; `save-load-player-owned-city-test` PASS; `save-load-sort-test` 4/4; `save-load-ledger-history-test` 4/0; `save-load-budowa-priorytet-on-load-test` 6/0; `saveload-hud-cache-hotseat-wiring-test` 9/0; `hotseat-etap7-saveload-test` 59/0; `resource-ledger-save-history-test` 15/0; `recruit-rally-default-save-test` PASS.
- **Testy nieuruchomione poprawnie (nie są regresją):** `save-load-deserialize-fields-audit` wymaga `--dist` lub `--raw-a/--raw-b`; `save-load-roundtrip-state-drift-test` wymaga `--dist` z index.html (wyjście „podano: \"\"”). Oba wymagają argumentów, których w tym przebiegu nie podano.
- **Live (Chromium, bundle `test-hook-setcitylimit-live-bundle.cjs` poza repo, poziom MAKSYMALNY: Trudny, rivals=9, civTypesCount=14, kultura trudny/AI trudny, dyplomacja trudna, Koszty jednostek Wysoki, Wysoka): PASS** — skrypt `gra/tools/save-block-pre-capital-live.cjs`. Wynik (runda 2): przed stolicą `saveRoundTrip` saved=false; Ctrl+S nie tworzy nowego klucza w localStorage i pokazuje w `#civ-hint-toast` komunikat „Zapis niedostępny przed założeniem pierwszego miasta”; po `foundFirstCity()` `saveRoundTrip` saved=true i ustawienia po wczytaniu = przed zapisem. Poprzednia runda (NIE ZMIERZONO) nie czytała komunikatu z dymka podpowiedzi, tylko z DOM poza nim; błąd był w harnessie, nie w grze.
- Pozycja menu pauzy przed stolicą: nie zmierzona (brak haka do kliknięcia pozycji; ścieżka `openSaveGameDialog` pokryta testem statycznym).
- Testy live z `saveRoundTrip` po poprawce (zakładają stolicę przed zapisem): `ai-plus10-live-roundtrip-test.cjs` 4/4 scenariuszy zielone (exit 0); `verify-live-growth-toggle-test.cjs` WSZYSTKIE ASERCJE ZIELONE, mutacja czerwona (exit 0).
- Test continuity (`save-load-continuity-live.cjs`, B==A ≥6 tur) NIE URUCHOMIONY w tym przebiegu (czas; sam test sprawdza ciągłość po wczytaniu, nie blokadę).

## NIE ZMIERZONO

- Live pozycja menu pauzy przed stolicą (Ctrl+S i persistSaveToSlot są zmierzone live).
- Live po założeniu stolicy: zapis + wczytanie ≥6 tur B==A.
- Zachowanie na maksimum suwaków poza wymienionymi (kultura/dyplomacja/barbarzyńcy na najwyższym poziomie) — nie ustawiano w teście live.
- Hotseat na żywo (dwa fotele): tylko predykat w kodzie, bez testu w przeglądarce.
