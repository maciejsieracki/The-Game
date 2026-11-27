# R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1 (SAVEFIX) — obrona Operatora, runda 2/5 (odpowiedź na zarzuty FC r2)

STATUS: BLOCK
DOMAIN: GAME (integralność zapisu, priorytet 1)
TEMAT: R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1
GOAL: znaleźć przyczynę B != A po wczytaniu i naprawić (B == A co najmniej 6 tur). NIE OSIĄGNIĘTE w tej rundzie.
BAZA: kandydat 4d651a3de (raport Evaluatora d387649b4). Obrona wykonana na `git checkout --detach 4d651a3de`.
ZMIANY-COMMIT: tylko dokumenty i przywrócenie narzędzia do stanu bazy (szczegóły niżej). Zero zmian w `gra/src/`.

## Odpowiedź na zarzuty

1. **PRZYJMUJĘ.** Brak poprawki kodu gry. `git diff 31a1ad39d -- gra/` przed obroną = tylko `gra/tools/savedigest-run.cjs` (opcje diagnostyczne); po obronie = 0 linii. B == A nie jest spełnione.

2. **PRZYJMUJĘ.** Przyczyna nie wskazana. Bisekcja P1 (mapy cudów AI jako pola zapisu) i P2 (17 map poziomu modułu z A do B) negatywne. Hipoteza hexów odrzucona w r2. Hipotezy (a) manpower/ownerBonusy, (b) kolejność iteracji Map, (c) zmienne `let` poza mapami: NIE ZBADANE. Zapisane w `dyspozycje/analizy/ZAPIS-WCZYTANIE-ROZBIEZNOSC-NAPRAWA-2026-11-27.md`.

3. **PRZYJMUJĘ.** Brak `save-load-continuity-*.cjs`, testu zgodności wstecznej i mutacji czerwonej. Nie napisano, bo nie ma naprawy, do której test by się odnosił.

4. **PRZYJMUJĘ, ZREALIZOWANE CZĘŚCIOWO.** Dokument `dyspozycje/analizy/ZAPIS-WCZYTANIE-ROZBIEZNOSC-NAPRAWA-2026-11-27.md` został utworzony w tej rundzie jako dokument STANU (przyczyna nieznana, lista prób, NIE ZMIERZONO). Nie zawiera przyczyny ani poprawki, bo ich nie ma.

5. **PRZYJMUJĘ.** Bramki dispatchu (tsc, logic 213, ai-test 297/0, wiring 267/0 itd.) NIE URUCHOMIONE w tej rundzie. Uzasadnienie „brak zmian w grze" nie zwalnia z bramek w rundzie z kodem; dla tej rundy zmiana `gra/` względem bazy = 0 linii (sprawdzone `git diff 31a1ad39d -- gra/ | wc -l` = 0), więc wynik bramek = wynik bazy, ale nie został zmierzony tutaj. NIE ZMIERZONO.

6. **CZĘŚCIOWO ODRZUCAM Z DOWODEM, CZĘŚCIOWO PRZYJMUJĘ.**
   - ODRZUCAM tezę „`__detHarness.restoreJson` omija `mapSnapshot`". Dowód z kodu `gra/src/main.ts`:
     - ~33714: `snapshotJson: () => JSON.stringify(buildSaveGameSnapshot('det-harness'))`;
     - ~42946: `buildSaveGameSnapshot` zawiera `mapSnapshot: serializeMapForSave(map)`;
     - ~33723: `restoreJson: (s) => { restoreGameFromSave(JSON.parse(s)); }` — przekazuje cały zapis, w tym `mapSnapshot`.
     Harness więc NIE omija `mapSnapshot` na poziomie danych. Poprzednie zdanie w raporcie r1/r2 było błędne i zostaje sprostowane w analizie.
   - PRZYJMUJĘ: nie zmierzono, czy `restoreGameFromSave` używa `mapSnapshot` tak samo jak ścieżka UI (`loadNeedsMapRebuild` ~10580, `regenerateWorldForLoad` ~50905). Ścieżka UI w świeżej sesji i wczytanie z pauzy: NIE ZMIERZONO.

7. **PRZYJMUJĘ (weryfikacja):** `grep -rn __savefixDiag gra/src gra/tools` daje trafienie tylko w `gra/tools/savedigest-run.cjs` (linie opcji `--dumpmod`/`--inject`), zero w `gra/src/main.ts`. Opcje zależały od haka nieobecnego w grze, więc były martwe. **Wykonano:** `git checkout 31a1ad39d -- gra/tools/savedigest-run.cjs` (przywrócenie do bazy). Patch `diag-savefix-r2-main.patch` zostaje w katalogu runu jako EKSPERYMENT, NIE DO INTEGRACJI.

## Pomiar w tej rundzie

NIE WYKONANO nowego pomiaru live. Powód: runda obrony dotyczy zarzutów formalnych i higieny; ponowny bieg Chromium (~6 min na parę A/B) nie wnosi nowej przyczyny bez bisekcji, której nie zaplanowano w tej rundzie. Wyniki r2 (cfg max, seed 4242, t3, K=6: B != A t4–t9; nUnits zgodne 49/60/65/74/74/91) pochodzą z poprzedniego raportu Operatora i NIE zostały powtórzone niezależnie.

## Co zmieniono w commicie tej obrony

- `gra/tools/savedigest-run.cjs` — przywrócony do bazy 31a1ad39d (usunięte martwe opcje `--dumpmod`/`--inject`).
- `dyspozycje/analizy/ZAPIS-WCZYTANIE-ROZBIEZNOSC-NAPRAWA-2026-11-27.md` — nowy dokument stanu.
- `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1/30-obrona-claude.md` — ten raport.

## TESTY

NIE ZMIERZONO w tej rundzie. Dowody użyte w odpowiedziach: odczyt kodu (grep, sed na `gra/src/main.ts`) i `git diff`. Brak uruchomionych bramek, brak testów live.

## BLOKADY

- Przyczyna B != A nieznana. Brak poprawki = brak spełnienia GOAL.
- Pomiary poza jednym punktem (cfg max, seed 4242, t3): NIE ZMIERZONO (cfg default/aionly/max+bunt, seed 7, t10).
- Ścieżka UI (menu / pauza) niezmierzona.
- Bramki dispatchu niezmierzone.

## UWAGI-DLA-ORKIESTRATORA

- Warunek Sonneta (2 nieudane rundy Haiku tego samego tematu) jest spełniony po r2 (FC FAIL, obrona BLOCK). Następna runda: bisekcja zrzutem stanu (zgodnie z zaleceniem FC), nie kolejne hipotezy z odczytu kodu.
- Kandydat BŁĄD-GRY (do potwierdzenia testem): wczytanie z pauzy w tej samej grze (`loadNeedsMapRebuild` = false) nie odbudowuje mapy z zapisu.
- Patch `diag-savefix-r2-main.patch` NIE integrować.

RUNDY: 2/5 (FC r2: FAIL; obrona r2: BLOCK; decyzja wymagana: NIE)
NASTĘPNY KROK: runda 3 do TEGO SAMEGO ID — zrzut `ownerBonusy`/`ownerCivKey`/`mpMults` i pól miasta 26 w A@t3 vs B po restore; potem bisekcja po kolejności Map i zmiennych `let`.
DEPLOY/PUSH: NIE WYKONANO
