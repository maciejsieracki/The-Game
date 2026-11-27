# R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1 (SAVEFIX) — obrona Operatora (odpowiedź na zarzuty Evaluatora r3 i FC r3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (integralność zapisu, priorytet 1)
TEMAT: R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1
GOAL: po wczytaniu zapisu z pauzy przebieg identyczny z ciągłym (B == A, co najmniej 6 tur); zgodność wsteczna; mutacja czerwona.
BAZA: kandydat 84444886d (baza 87a8d6e81, origin/main). Obrona na drzewie z 84444886d.
ZMIANY-COMMIT: patrz sekcja „Co zmieniono” niżej (SHA w polu sha odpowiedzi).

## Zarzuty Evaluatora r3 — odpowiedzi
1. Macierz 4/16 — PRZYJĘTE CZĘŚCIOWO. Na nowej ścieżce produkcyjnej zmierzone: max/4242/t3, max/4242/t10, aionly/7/t3 (wszystkie PASS 6/6) oraz mutant max/4242/t3. Pozostałe komórki (default, bunt, seed 7 t10, aionly 4242, default 7) NIE ZMIERZONO.
2. Hak powtarzał warunek; mutacja w loadGameFromSlot nie czerwieniła testu — PRZYJĘTE I NAPRAWIONE. Hak `__detHarness.loadJsonAsPauseLoad(json, slot)` zapisuje JSON do slotu i woła produkcyjne `loadGameFromSlot(slot, true)`; nie zawiera warunku decyzji. Mutant (w `loadGameFromSlot` usunięta klauzula `fromInGamePause && liveMapDiffersFromSave`): 6/6 tur ROZJAZD (`dane/r4-bmut-max-4242-3-bez-klauzuli.json`).
3. Brak opcjonalnego pola w serializacji — ODRZUCONE Z DOWODEM. Dispatch r3 pkt 3 dopuszcza „albo deterministyczne odtworzenie po wczytaniu”. Przyczyną jest żywa mapa, a `mapSnapshot` już jest w zapisie (`buildSaveGameSnapshot`, ok. linii 42946 w main.ts), więc brakującego pola nie ma. Zgodność wsteczna (zapis bez `mapSnapshot`) testowana: `--legacy 1` PASS.
4. „wiring 267/0” nieznane — ROZSTRZYGNIĘTE. To `gra/tools/ai-city-order-need-wiring-test.cjs`: uruchomione na r4, wynik `267 passed, 0 failed (of 267)`.
5. Test live niewpięty w bramkę — PRZYJĘTE, nie zmieniane (R-PROC-AUTOBOT poza allowlistą). Propozycja dla orkiestratora: bramka live = `save-load-continuity-live.cjs --mode A` i `--mode B` (dwa wywołania, ok. 7 min każde).
6. A==A' i „ai-test bit-w-bit” tylko pośrednio — PRZYJĘTE jako NIE ZMIERZONE osobno. ai-test 297/0 zmierzono na r4; A==A' nie uruchomiono.

## Pomiary r4 (cfg max = maksymalne ustawienia nowej gry: Trudny, dyplomacja trudna, Wysoki x4, kultura trudny/AI trudny; K=6)
| Przebieg | Zapis | mapDiffers | rebuild z loadNeedsMapRebuild | Tury po wczytaniu | Wynik |
|---|---|---|---|---|---|
| max / 4242 | t3 | true | false | t4–t9: 6/6 OK | PASS |
| max / 4242 | t10 | true | false | t11–t16: 6/6 OK | PASS |
| aionly / 7 | t3 | true | false | t4–t9: 6/6 OK | PASS |
| max / 4242, mutant | t3 | true | false | 6/6 ROZJAZD | wykryte (expect diff PASS) |
| max / 4242, legacy (bez mapSnapshot) | t3 | false (brak mapSnapshot) | false | t4 wykonana, pageErrors 0 | PASS |

Uwaga: `rebuild` = false jest poprawne, bo wczytanie z pauzy tej samej gry nie zmienia ziarna ani rozmiaru. Odbudowę mapy wymusza klauzula `liveMapDiffersFromSave` w `loadGameFromSlot`, a mutant potwierdza, że bez niej test czerwieni się.
Pliki surowe: `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1/dane/r4-*.json`.

## Bramki na drzewie r4
- tsc --noEmit: 0 błędów (exit 0).
- ai-test: 297 passed, 0 failed.
- ai-city-order-need-wiring-test: 267 passed, 0 failed.
- logic-test: 213/213; tech-tree-test: 20 pass / 0 fail; research-test: 33/0; combat-test: sanity OK.
- society-breakdown-test: 56 OK / 0 FAIL.
- save-load-sort-test: 4/4; save-load-ledger-history-test: 4/0; save-load-budowa-priorytet-on-load-test: 6/0; save-load-player-owned-city-test: PASS; determinism-save-load-resume-test: PASS.
- Nie uruchomione na r4 (wynik z 84444886d przez Evaluatora): ai-plus10-live-roundtrip, culture-religion-level, ai-plus10-culture/matrix, ai-city-rebellion-gate/news, diplo-world-news. Kod gry poza hakiem testowym jest identyczny z 84444886d.

## Co zmieniono w tej obronie (diff względem 84444886d)
- `gra/src/main.ts`: import bez `buildGameMapFromSnapshot`; stary hak `restoreJsonAsPauseLoad` zastąpiony hakiem `loadJsonAsPauseLoad` (tylko civTest). Logika `loadGameFromSlot` bez zmian.
- `gra/tools/save-load-continuity-live.cjs`: tryby pause i legacy wołają `loadJsonAsPauseLoad` z slotem `civtest-savefix-pause-load`.
- `dyspozycje/analizy/ZAPIS-WCZYTANIE-ROZBIEZNOSC-NAPRAWA-2026-11-27.md`: sekcja 7 (runda 4).
- `dane/r4-*.json` (5 plików) i ten raport.

## TESTY
Patrz sekcje powyżej. Liczby z surowych wyjść narzędzi (JSON z pomiarów, `passed/failed` z konsoli).

## BLOKADY
- Pokrycie macierzy: 3 z 16 komórek na nowej ścieżce (+ mutant); reszta NIE ZMIERZONO (koszt ok. 7–9 min na komórkę przy obciążeniu maszyny).
- Ścieżka UI (klik w menu pauzy, render sceny 3D po odbudowie): NIE ZMIERZONO.
- Brak blokad technicznych. Chromium nie padł w 8 przebiegach tej rundy.

## UWAGI-DLA-ORKIESTRATORA
- Kandydat BŁĄD-GRY (potwierdzony pomiarem, wymaga FALI po FC): wczytanie z pauzy po dłuższej grze zostawiało żywą mapę ze zmianami z tur po zapisie (`loadNeedsMapRebuild` = false). Poprawka to klauzula `liveMapDiffersFromSave` w `loadGameFromSlot` (zmiana dotyka tylko ścieżki wczytania).
- Bramka live (zarzut 5): propozycja dodania `save-load-continuity-live.cjs --mode A/B` do bramek R-PROC §6.
- Pliki robocze poza repo (dist vite w scratchpad, skopiowany node_modules) zostały usunięte po pracy.

RUNDY: 3/5 (obrona po FC r3 FAIL; kod zmieniony w tej obronie)
NASTĘPNY KROK: Final Control do TEGO SAMEGO ID na sha obrony (pomiary r4 i bramki wyżej); FC ma sprawdzić sekcję 7 dokumentu i pliki dane/r4-*.json.
DEPLOY/PUSH: NIE WYKONANO
