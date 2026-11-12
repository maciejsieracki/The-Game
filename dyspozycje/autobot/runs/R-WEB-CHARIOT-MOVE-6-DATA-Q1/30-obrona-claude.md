STATUS: BLOCK (zarzut 1 wymaga decyzji orkiestratora: poza allowlistą; zarzut 2 przyjęty jako notatka, poza allowlistą)
DOMAIN: GAME
TEMAT: R-WEB-CHARIOT-MOVE-6-DATA-Q1
GOAL: w bitwie „Ruch w bitwie (heksy)” wpis „Konnica” = 7 (zmiana z 6); „Rydwan (woły)” = 5 bez zmian; pozostałe rydwany = 6 bez zmian; pole „Ruch” (mapa) bez zmian.
BAZA: b77a0b7b940081f9b6da13f2b7cd9028bdf44394 (origin/main)
KANDYDAT (startowy obrony): 7476f541007a999db8a90eafae4b95e713ee5052 (commit „Konnica ruch w bitwie 6 -> 7 (dane + test)”), worktree wf_d2f6f86e-073-3, detached.
SHA KOŃCOWY obrony: brak zmian kodu w tej rundzie (zobacz ZMIANY-COMMIT); raport zacommitowany jako osobny commit na gałęzi obrony.

ODPOWIEDZI NA ZARZUTY EVALUATORA (eval/R-WEB-CHARIOT-MOVE-6-DATA-Q1-claude, 20-evaluator-claude.md, commit 8d88a9080b33db3b70be03903de9d7a692913df5):

Zarzut 1 (regresja rydwan-konnica-x2-test.cjs): PRZYJMUJĘ jako fakt, poprawki NIE wykonuję.
- Dowód (surowe wyjście, `cd gra && node tools/rydwan-konnica-x2-test.cjs`, kandydat 7476f5410):
  ```
  FAIL: 3 niezgodnosci
    - Rydwan (woły).Surowiec: powinno pozostac "Brąz", jest "Drewno"
    - Rydwan (woły).Utrzymanie surowiec: powinno pozostac "Brąz", jest "Drewno"
    - Konnica.Ruch w bitwie (heksy): powinno pozostac 6, jest 7
  ```
- Dowód (baza): ten sam test z units.json z b77a0b7b9 (ścieżka wskazana na plik bazowy przez tymczasową kopię, usuniętą po teście):
  ```
  FAIL: 2 niezgodnosci
    - Rydwan (woły).Surowiec: powinno pozostac "Brąz", jest "Drewno"
    - Rydwan (woły).Utrzymanie surowiec: powinno pozostac "Brąz", jest "Drewno"
  ```
  Dwie pierwsze niezgodności są długiem bazowym. Trzecia (Konnica 6 -> 7) jest NOWA i pochodzi z naszej zmiany.
- Snapshot do zmiany: gra/tools/rydwan-konnica-x2-test.cjs, linia 134 (`"Ruch w bitwie (heksy)": 6,` w bloku wpisu „Konnica”, który zaczyna się w linii 108; przy stosowaniu potwierdzić, że linia należy do bloku „Konnica”). Proponowana zmiana: 6 -> 7. Poprawka jest jednowierszowa.
- Dlaczego NIE wykonuję: plik gra/tools/rydwan-konnica-x2-test.cjs nie jest na allowliście dispatchu (allowlista: gra/data/units.json wyłącznie pole Konnica + nowy gra/tools/chariot-move-6-data-test.cjs; ZAKAZ: wszystko inne). Rozszerzenie allowlisty to decyzja orkiestratora. Edycja bez niej byłaby naruszeniem granicy (natychmiastowy FAIL wg procesu).
- Wymagana decyzja orkiestratora: (a) rozszerzyć allowlistę o gra/tools/rydwan-konnica-x2-test.cjs (jedna linia 134, 6 -> 7), albo (b) zaakceptować czerwień tego testu jako świadomą zmianę i zlecić naprawę osobnym tematem. Po decyzji (a) operator dokończy jednowierszową poprawkę i commit w rundzie 2 (dowód: ponowny run testu -> 2 niezgodności, jak w bazie).

Zarzut 2 (notatka: units.json, Konnica, Top3[0].tytul = „Ruch 4 (6 w bitwie)”, nieaktualne): PRZYJMUJĘ jako fakt, poprawki NIE wykonuję.
- Dowód: `gra/data/units.json:655: "tytul": "Ruch 4 (6 w bitwie)",` (wpis Konnica).
- Dlaczego NIE: pole „tytul” jest innym polem niż dopuszczone w allowliście (tylko „Ruch w bitwie (heksy)”). Zmiana wymaga rozszerzenia allowlisty.
- Wpływ na wikiBundle / Civpedię / karty jednostek: NIE_ZMIERZONO (nie zbudowano wikiBundle, nie uruchomiono renderu kart). Propozycja dla orkiestratora: poprawić tytul na „Ruch 4 (7 w bitwie)” w tym samym temacie (po decyzji o allowliście) lub w osobnym temacie danych.

TESTY (surowe wyjście, kandydat 7476f5410):
- `node tools/chariot-move-6-data-test.cjs` -> `chariot-move-6-data-test: passed=163 failed=0`
- `node tools/rydwan-konnica-x2-test.cjs` -> patrz zarzut 1 (3 niezgodności; baza 2).
- tsc --noEmit, logic, tech-tree, research, unit-replace, combat: NIE_ZMIERZONO w tej rundzie. Nie wykonano `npm ci` (dysk: 1,5 GB wolne przy 97% zajętości / ; wymóg procesu to ≥4 GB dla weba). Evaluator zmierzył tsc sam (zielone); potwierdzenie przez Evaluatora traktuję jako jego dowód, nie własny.
- Długi bazowe (identyczne na bazie i kandydacie, wg Evaluatora): ruch-swiata-tempo, structure-defense-bonus, fortify-pole, battle-natural-chariot-r5 — NIE_ZMIERZONO przeze mnie w tej rundzie.

BLOKADY:
1. Zarzut 1 wymaga rozszerzenia allowlisty (gra/tools/rydwan-konnica-x2-test.cjs). Decyzja orkiestratora.
2. Zarzut 2 wymaga rozszerzenia allowlisty (units.json, pole tytul). Decyzja orkiestratora.
3. Brak miejsca na dysku do pełnych bramek (1,5 GB wolne; wymóg ≥4 GB).

ZMIANY-COMMIT: w tej rundzie brak zmian w gra/. Commit obejmuje wyłącznie ten plik raportu (30-obrona-claude.md). Kod kandydata 7476f5410 bez zmian.

RUNDY: obrona 1/1 (odpowiedź na ewaluację 1/5).
NASTĘPNY KROK: orkiestrator podejmuje decyzję o allowliście (zarzut 1 i 2). Po decyzji (a): operator r2 dodaje zmianę 6 -> 7 w rydwan-konnica-x2-test.cjs (linia 134) i tytul (linia 655) jeśli dopuszczony, uruchamia testy i wraca do Evaluatora.
DEPLOY/PUSH: NIE WYKONANO
