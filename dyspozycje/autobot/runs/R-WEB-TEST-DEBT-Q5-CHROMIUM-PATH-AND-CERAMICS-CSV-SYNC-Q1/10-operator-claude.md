# R-WEB-TEST-DEBT-Q5 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy/narzędzia; bez zmian logiki gry, bez gra/src, bez gra/data)
TEMAT: R-WEB-TEST-DEBT-Q5-CHROMIUM-PATH-AND-CERAMICS-CSV-SYNC-Q1
GOAL: (A) testy żywe z nieistniejącą ścieżką chromium-1194 startują; (B) test terminologii 799/0 przez korektę, bez zmiany JSON.
ZMIANY-COMMIT:
- e7e535240 (A): 257 plików gra/tools/*.cjs, zamiana `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` na `/opt/pw-browsers/chromium` (tylko ścieżka; asercje bez zmian).
- 4af5b0247 (B): gra/tools/card-text-corrections.cjs. Trzy korekty dla garncarnia (top5.0.tytul, top5.0.zdanie, top5.0.dowod, klasa R) + opcjonalne pole `liczba` w korekcie.
- CSV (budynki-top5.csv) NIE zmieniony: każda zmiana CSV zmienia csvSha256 w `_meta` JSON, więc JSON musiałby być regenerowany. JSON bez zmian.

TESTY:
(A) administrator-panel-real-render-test.cjs
- PRZED: `browserType.launch: Failed to launch chromium because executable doesn't exist at /opt/pw-browsers/chromium-1194/chrome-linux/chrome`
- PO: `55 PASS / 0 FAIL` (exit 0)
(A) administrator-icon-everywhere-render-test.cjs
- PRZED: ten sam błąd launch.
- PO: `administrator-icon-everywhere: 24 PASS, 0 FAIL` (exit 0)
(A) Pozostałe 255 plików: NIE_ZMIERZONO (nie uruchamiano pojedynczo). Dwa komentarze nadal wspominają chromium-1194 (emporion-build-list, barb); nie są ścieżkami.
(B) `node tools/gen-building-cards-top5.cjs --check`
- PRZED: `--check: building-cards-top5.json NIEZGODNY z generatorem` (exit 1)
- PO: `--check OK (dyspozycje/analizy/karty-budynkow/budynki-top5.csv)` (exit 0)
- terminology-trade-vs-tax-test.cjs PO: `799 pass, 0 fail` (exit 0). PRZED nie uruchamiano; wg dispatchu 798/1.
- Mutacja (przywrócenie „do 50” w korekcie, w tym samym pliku, potem przywrócone): --check exit 1; terminology `798 pass, 1 fail` (exit 1). Test czerwony.
- diff-stat JSON: 0 (plik nietknięty).
Bramki (surowe wyjścia): tsc --noEmit exit 0; logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0`; unit-replace-test `(21/21)`; combat-test `COMBAT TEST: 6/6 pass`.
Testy zależne od warstwy korekt:
- building-cards-top5-test: PRZED 1206 pass / 2 fail; PO 1207 / 1. Pozostały fail `[B] spichlerz: każda pozycja ma tytuł i jedno zdanie` jest na bazie 69f5d638 — NOWY dług (nie naprawiany).
- card-resource-purpose-test: PRZED 100 / 3 fail; PO 101 / 2. Pozostałe `[B] adaptery: utrzymanie...` i `[W] buildingAdapter: ...Podatek` są na bazie — dług istniejący (klasa B/C).

BLOKADY: brak dla celu. Uwaga: pełne uruchomienie 255 testów żywych Chromium poza zakresem tej rundy.

RUNDY: 1/5. Ostatni werdykt: n/d (Operator).

NASTĘPNY KROK: Evaluator — zweryfikować diff e7e535240 (tylko ścieżka) i 4af5b0247 (klasa R + pole `liczba`); decyzja, czy klasa R dla korekt synchronizacji z econ-params jest akceptowalna.

UWAGI-DLA-ORKIESTRATORA:
1. Kolumny CSV `Realne_efekty_z_dowodem` i `Co_mozesz_zrobic_OBECNIE` nadal mówią „do 50” dla Garncarni (nie wchodzą do JSON). Do rozważenia synchronizacja CSV w osobnym temacie (wtedy JSON wymaga regeneracji z meta csvSha256).
2. Rozszerzenie `card-text-corrections.cjs`: opcjonalne `liczba` w korekcie (potrzebne, bo w JSON `liczba` „30–110” nie wynika z reguły liczbaOf).
3. Klasa „S” odrzucona przez test [J]; użyto klasy R.

DEPLOY/PUSH: NIE WYKONANO
