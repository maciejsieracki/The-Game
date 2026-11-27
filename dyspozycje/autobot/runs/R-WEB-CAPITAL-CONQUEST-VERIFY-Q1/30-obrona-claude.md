STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-CONQUEST-VERIFY-Q1 (CAPCONQ), runda obrony po ocenie Evaluatora (kandydat f2a61d5f5, ocena 0cb10e02b)
GOAL: pomiar na żywo po FALI 931 (plunder, S2, S2b, S5, eliminacja) przy maksymalnych ustawieniach, seed 4242, 7, 11; dokument STOLICA-PODBOJ-WERYFIKACJA-2026-11-27.md. Podbój armią (pkt 3) i relacje/lista cywilizacji/ledger po eliminacji (pkt 4) pozostają NIE ZMIERZONO z podanym powodem.
ZMIANY/COMMIT: allowlista, tylko te ścieżki: gra/tools/capital-conquest-verify-live.cjs (asercje, kod wyjścia 2 przy niezgodności, pomiar 2b, odczyt stock przy eliminacji); dyspozycje/analizy/STOLICA-PODBOJ-WERYFIKACJA-2026-11-27.md (przepisany o wyniki rundy 2); dyspozycje/autobot/runs/R-WEB-CAPITAL-CONQUEST-VERIFY-Q1/30-obrona-claude.md. Zero zmian w gra/src (mutant L405 wprowadzony i przywrócony, git status czysty). SHA: patrz pole sha w odpowiedzi.

ODPOWIEDZI NA ZARZUTY:
1. (asercje narzędzia, rc=0 przy mutacji) PRZYJMUJĘ, poprawione. Narzędzie sprawdza każdy punkt i przy niezgodności wypisuje CAPCONQ-FAIL i kończy się kodem 2. DOWÓD: mutacja L405 w capital-capture.ts (usunięte setTreasury zdobywcy w gałęzi Zdarzenia 1), seed 4242: wynik `CAPCONQ-FAIL ["P1: przychod zdobywcy 0 != oczekiwany 777"]`, rc=2. Źródło przywrócone.
2. (oczekiwana kwota = odczyt przed przejęciem) PRZYJMUJĘ, poprawione. Oczekiwanie jest teraz wartością wpisaną przez setTreasury (777 dla P1, 333 dla P4), wzorem Zdarzenia 1 (cały skarbiec → zdobywca, ofiara 0). Dodatkowo asercja, że odczyt przed przejęciem = 777. Wyniki: P1 zmierzone 777 = 777 we wszystkich trzech ziarnach; P4 333 = 333.
3. (GOAL niespełniony w całości) PRZYJMUJĘ częściowo. Pkt 2b zmierzony na żywo i sprawdzony asercją (3 ziarna: PASS, odbicie przez pierwotnego właściciela, skarbiec 0 / gracz 777). Pkt 3 (podbój armią) NIE ZMIERZONO: brak haka wywołującego przechwyt miasta z main.ts ~19286 / ~41565 bez pełnej bitwy; hak `loot` to łup z bitwy, a `startSiege`+`siegeSurrender` to ta sama funkcja co kapitulacja, nie szturm. Dodanie haka poza zakresem tej rundy (dispatch: zmiany gra/src tylko po odtworzeniu błędu). Pkt 4 relacje, lista cywilizacji, ledger i warunek zwycięstwa NIE ZMIERZONO: w main.ts nie ma haka odczytu relacji (getDiploRelation tylko wewnętrzne). Oznaczone w dokumencie.
4. (P4 mierzy tylko skarbiec) PRZYJMUJĘ częściowo. Dodano odczyt __ledgerRealPathDebug.stock przed i po eliminacji dla obu stron. W tym scenariuszu stock zwrócił puste obiekty (brak surowców), więc wzór Zdarzenia 2 dla surowców/Pracy/Spichlerza nie jest tu testowany. Oznaczone NIE ZMIERZONO wzór. Pula Pracy nie ma odczytu w hakach.
5. (ziarna 4242 i 7 dają identyczne liczby) PRZYJMUJĘ jako ograniczenie. Liczby 777 i 333 są wejściem scenariusza (setTreasury), więc są takie same z definicji. Różnią się właściciel S5 i identyfikatory miast (seed 11: S5 city44, stolica po S2b city42, seed 4242 i 7: city45 / city43). Ziarna nie dają niezależnej geometrii, co jest zapisane w dokumencie. Nie stwierdzam, że 3 ziarna są niezależne.
6. (bramki pominięte) PRZYJMUJĘ, uruchomione (surowe wyjścia w katalogu scratchpad, sekcja „Bramki” dokumentu). Wyniki: tsc 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat „All sanity checks passed”; ai-test 297 passed / 0 failed; society-breakdown 56 OK / 0 FAIL; capital-capture 107/107; capital-recapture-stale-designation PASS=12 FAIL=0; git diff --check czysty.

TESTY:
- live, maksimum (Trudny; Wysoki ×4; kultura trudny; dyplomacja trudna; wzrost ON; __settingsLive.startNewGame; Chromium headless, build vite do scratchpad, poza repo):
  - seed 4242: CAPCONQ-PASS, rc=0 (2m57s); P1 777=777; S2 właściciel 1, cap=explicit=city3; S2b właściciel 1, skarbiec 0 / gracz 777; S5 rowne true x2; P4 cap=explicit=null, miasta 0, zwycięzca +333=333; errors []
  - seed 7: CAPCONQ-PASS, rc=0; te same liczby; S5 właściciel 2 rowne true x2
  - seed 11: CAPCONQ-PASS, rc=0; te same liczby; S5 właściciel 3, stolica po S2b city42; rowne true x2
  - mutant L405 (seed 4242): CAPCONQ-FAIL, rc=2 (opisane wyżej)
- gra/: npx tsc --noEmit exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: exit 0 („All sanity checks passed.”)
- capital-capture-test: CAPITAL-CAPTURE-TEST OK (107/107)
- capital-recapture-stale-designation-test: PASS=12 FAIL=0 NIE-ZMIERZONO=1
- ai-test: 297 passed, 0 failed
- society-breakdown-test: 56 OK, 0 FAIL
- git diff --check: czysty

BLOKADY:
- Pkt 3 podbój armią: NIE ZMIERZONO (brak haka przechwytu miasta przez armię bez pełnej bitwy).
- Pkt 4 relacje, lista cywilizacji, ledger, warunek zwycięstwa: NIE ZMIERZONO (brak haka odczytu).
- Pkt 4 wzór Zdarzenia 2 dla surowców/Pracy/Spichlerza: NIE ZMIERZONO (stock pusty w scenariuszu).
- Zamierzenie zwrotu/odbicia po zdobyciu przez gracza (S2b): zachowanie silnika zgodne z kapitulacją oblężenia; wymaga potwierdzenia orkiestratora (decyzja, nie kod).

RUNDY: 2/5 (runda 1 Operator, runda 2 obrona)
NASTĘPNY KROK: orkiestrator decyduje, czy otwierać osobny temat na hak przechwytu miasta przez armię (pkt 3) oraz hak odczytu relacji i listy cywilizacji (pkt 4). Potwierdzenie zamierzenia S2b (zwrot łupu i stolicy przy odbiciu) przez właściciela, jeśli ma to wpływ na grę.
DEPLOY/PUSH: NIE WYKONANO
