STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CHARIOT-MOVE-6-DATA-Q1
GOAL: w bitwie „Ruch w bitwie (heksy)” wpis „Konnica” = 7 (zmiana z 6); „Rydwan (woły)” = 5 bez zmian; pozostałe rydwany = 6 bez zmian; pole „Ruch” (mapa) bez zmian.
BAZA/KANDYDAT: 3a9f67bb55df5ca35589e9f542b8a9de7e2b8eec (origin/main, detached), worktree wf_32bba6a4-2d1-1.
RUNDA: 2/5 (po FC FAIL r1; DODATEK orkiestratora rozszerzył allowlistę o dwa miejsca skutku decyzji).

ZMIANY/COMMIT (runda 2):
- gra/data/units.json: wpis „Konnica”, Top3[0].tytul „Ruch 4 (6 w bitwie)” -> „Ruch 4 (7 w bitwie)” (linia 655). Tylko ten tekst. Pole „Ruch w bitwie (heksy)” = 7 już było w kandydacie 7476f5410.
- gra/tools/rydwan-konnica-x2-test.cjs: linia 134, blok „Konnica” w BEFORE: „Ruch w bitwie (heksy)” 6 -> 7. Nic więcej.
- Pozostałe pliki z r1 (gra/tools/chariot-move-6-data-test.cjs, wpis Konnica w units.json) bez zmian.
- SHA: patrz sekcja „SHA” na końcu (commit rundy 2 zawiera oba pliki kodu i ten raport).
- git diff --stat: 2 pliki, 2 insertions, 2 deletions (przed raportem). git diff --check: czysto.

TESTY (surowe wyjście, runda 2):
- cd gra && node tools/chariot-move-6-data-test.cjs -> `chariot-move-6-data-test: passed=163 failed=0` (exit 0).
- cd gra && node tools/rydwan-konnica-x2-test.cjs -> `FAIL: 2 niezgodnosci`:
    - Rydwan (woły).Surowiec: powinno pozostac "Brąz", jest "Drewno"
    - Rydwan (woły).Utrzymanie surowiec: powinno pozostac "Brąz", jest "Drewno"
  To są dokładnie dwie niezgodności długu bazowego z 3a9f67bb (zmierzone w r1 na bazie b77a0b7b9). Trzecia niezgodność (Konnica 6 -> 7) zniknęła, bo snapshot zmieniono na 7.
- npm ci w gra/ (dysk przed startem: 7,2 GB wolne) -> `added 71 packages in 4s`, exit 0.
- cd gra && node_modules/.bin/tsc --noEmit -> exit 0, bez wyjścia (0 linii).
- Długi bazowe (ruch-swiata-tempo, structure-defense-bonus, fortify-pole, battle-natural-chariot-r5, Drewno/Brąz w rydwan-konnica-x2): NIE_ZMIERZONO w tej rundzie; nie są częścią tematu, zostają jako dług.
- npm run build / npm run dev: NIE uruchamiane (zakaz).

BLOKADY: brak w zakresie tematu. Luka: DODATEK podawał bazę 3a9f67bb jako „kod kandydata 7476f5410 bez zmian” — zgodne z git (3a9f67bb to commit raportu obrony na 7476f5410). Dispatch 00-dispatch.md istnieje tylko na gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (nie w origin/main); DODATEK jest w tym samym pliku, sekcja na końcu.

ZAŁOŻENIA:
- Rozszerzona allowlista z DODATKU obejmuje wyłącznie: units.json (pole tytul wpisu Konnica) i rydwan-konnica-x2-test.cjs (linia 134). Żadnych innych zmian.
- Commit rundy 2 zawiera kod (oba pliki) i raport razem, bo Evaluator i FC potrzebują diffu kodu; dodano tylko ścieżki jawnie (nigdy -A).

RUNDY: 2/5 (r1: Operator PASS-WITH-NOTES, Obrona BLOCK, Evaluator FAIL; r2: Operator PASS-WITH-NOTES)
NASTĘPNY KROK: Evaluator r2 (diff: 2 pliki; oczekiwany wynik testu rydwan-konnica-x2 = 2 niezgodności jak w bazie), potem Obrona/FC.
DEPLOY/PUSH: NIE WYKONANO
