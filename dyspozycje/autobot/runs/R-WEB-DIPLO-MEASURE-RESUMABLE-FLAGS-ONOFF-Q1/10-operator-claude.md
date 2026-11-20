# R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (POMIAR; kod gry nie zmieniany)
TEMAT: R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1
GOAL: wznawialny runner pomiaru dyplomacji + pomiar flag OFF vs ON (seed 4242 i 7, 90 tur) na main d42ec8560.
BAZA: d42ec85605bc26a8cba70adfc1696504acab6f48 (detach).

ZMIANY-COMMIT: gra/tools/diplomacy-harder-measure-run.cjs (--stop-at, slot dipl-measure-<TAG>, state.json, wznowienie, applyFlags po loadSlot; domyślne wywołanie bez zmian); gra/tools/diplomacy-measure-resume-test.cjs (nowy); dyspozycje/analizy/POMIAR-FLAG-DYPLOMACJI-OFF-ON-2026-11-20.md; runs/<ID>/ (4× jsonl.gz, 4× summary.json.gz, wyniki.json, analiza-pomiar.py). Commit: patrz SHA w StructuredOutput.

TESTY:
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- diplomacy-all-flags-measure-hook-test (z bundlem): 35/0
- diplomacy-harder-measure-hook-test: bez bundla 14/0; z bundlem (--dist) 20/1 — CZERWONE B2b „setEnabled(null) wraca do stalej (OFF)”: domyślna wartość to ON od FALI 888 (DIPLO_HARDER_ENABLED_DEFAULT), test oczekuje OFF. Błąd przed tym zmieniem (main.ts i test nietknięte); plik testu poza allowlistą, nie naprawiany.
- diplomacy-measure-resume-test: pin 8/8 + porównanie ciągły vs 2 odcinki (6 tur) 4/4 = 12/12 zielonych.
- Biegi: 4 × 90 tur, każdy 18 wierszy (tury 5..90), zero duplikatów tur.

BLOKADY: brak. Chromium SIGSEGV przy starcie/wczytaniu (22 z 41 logów) — obejście: ponowienie odcinka ze slotu; jeden proces ai-economy-measure-run współbieżny na maszynie (nie mój).

NIE ZMIERZONO: liczba miast AI; zerwania traktatów inne niż przy zerowym zaufaniu; szczyt sojuszy między próbkami (co 5 tur); tor NAP (0 wszędzie); przedziały ufności (2 ziarna × 1 bieg).

WYNIK (tura 90, OFF → ON): sojusze AI↔AI 0→12 (4242), 0→8 (7); zerwania przy zerowym zaufaniu 0→22 (4242), 0→0 (7); wojny 1→5 (4242), 2→3 (7). Brak przejęcia świata w żadnym przebiegu. Kierunek „mniej współbieżnych wojen” NIE potwierdzony. Szczegóły: POMIAR-FLAG-DYPLOMACJI-OFF-ON-2026-11-20.md.

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator — Evaluator (weryfikacja pinów, danych i tabeli) → Final Control.
UWAGI-DLA-ORKIESTRATORA: (1) hook-test B2b jest czerwony z bundlem od FALI 888 — do decyzji: korekta oczekiwania testu (poza tym tematem). (2) SIGSEGV Chromium przy starcie nowej gry — zasługuje na osobny temat stabilności runnerów.
DEPLOY/PUSH: NIE WYKONANO
