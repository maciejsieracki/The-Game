STATUS: PASS-WITH-NOTES (obrona r1: zarzuty 7 i 8 wykonane z commitem; zarzuty 1–6 i 9 przyjęte jako otwarte zakresy partii 2–4 lub notatka procesu; TEMAT NIE JEST ZAKOŃCZONY)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: obrona partii 1 (kandydat 151658632) przed zarzutami Evaluatora; start 1516586327766e0520dd1f57bc0761ef4d52268e; wynik: poprawki dla zarzutów 7 i 8, pozostałe zarzuty przyjęte jako zakres otwarty z jawnym planem.
ZMIANY/COMMIT:
- 60afb0e45 (kod + test): gra/src/game/turn-economy.ts, gra/tools/resource-ledger-test.cjs
- Ten raport: dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1/30-obrona-claude.md (osobny commit)
- Lokalnie utworzono gra/node_modules przez npm ci (gitignored, do sprzątnięcia przez orkiestratora).
- Brak pusha, brak integracji, brak deployu.

ODPOWIEDZI NA ZARZUTY:
- Zarzut 1 (księga nie domyka bilansu w grze: brak zużycia obywateli, utrzymania, jednostek, budowy, handlu, szlaków, zdobycia miast, łupów, prezentów; test tylko na fixture): PRZYJMUJĘ jako zakres partii 2–4. Stan partii 1 potwierdzony: zapisy tylko w tickEmpireResourcePipeline (teren, drewno/stolarnia, konwersja, wejścia, drain Spichlerza). Brak zapisów w pozostałych miejscach modyfikacji City.surowce. Nic nie dopisane w tej rundzie (poza zarzutem 8), bo to zakres partii 2 i 3 wg dispatchu.
- Zarzut 2 (brak źródeł „Umowa wymiany z <civ>” i „Warzelnia (<miasto>)”, brak testu soli): PRZYJMUJĘ jako otwarte. Potwierdzam grep: brak etykiet umowy wymiany w gra/src. Wykonanie w partii 2 (handel/umowy) i partii 3 (warzelnia test soli).
- Zarzut 3 (brak UI „Skąd zapasy” i zrzutu Chromium dla soli i ceramiki): PRZYJMUJĘ jako otwarte, NIE ZMIERZONO. Partia 4.
- Zarzut 4 (brak pomiaru czasu tury tick 100 tur przed/po): PRZYJMUJĘ jako otwarte, NIE ZMIERZONO. Wymaga pomiaru z istniejącym narzędziem perf; pomiar w partii końcowej po wpięciu księgi do gry.
- Zarzut 5 (pamięć N tur niepodłączona: appendLedgerTurn/readLedgerHistoryTurns tylko w teście, resourceLedgerByOwner bez konsumenta): PRZYJMUJĘ jako otwarte. Potwierdzam: wynik tury odrzucany po turze, brak pola w zapisie gry. Wpięcie (historia N=10 z econ-params, opcjonalne pole zapisu) w partii 4 razem z testem zapis/odczyt.
- Zarzut 6 (brak pomiaru determinizmu hashem stanu gry; test (c) tylko na fixture): PRZYJMUJĘ jako otwarte, NIE ZMIERZONO. Test (c) na fixture: stan miast z księgą i bez księgi identyczny przez 30 tur (resource-ledger-test.cjs, sekcja (c)). Pełny hash stanu gry w partii końcowej.
- Zarzut 7 (brak scenariusza capu: czy r.produced = faktyczny przyrost po ucięciu): PRZYJMUJĘ, WYKONANO w 60afb0e45. Dodany wariant (a-var) cap-12: test asertuje, że magazyn dochodzi do limitu (sawClipped), i sprawdza różnicę księgi i magazynu przez 30 tur. Wynik: maks. różnica 0. Dla konwersji ucięcie przez cap jest w runConverters (converters.ts), a r.produced zgadza się z realnym przyrostem w tym wariancie.
- Zarzut 8 (rodzaj 'stolarnia' nieużywany, drewno ze Stolarni jako „Teren i plony z mapy”): PRZYJMUJĘ, WYKONANO w 60afb0e45. Część drewna ponad bazę mapy (bonus Stolarni, po ucięciu capem: min(got, bonus)) zapisywana jest jako kind 'stolarnia', klucz `stolarnia|<cityId>`, etykieta „Stolarnia (<miasto>)”. Reszta nadal jako „teren”. Wariant stolarnia (count 2, bonus 0.5) w teście: źródło obecne, różnica 0 przez 30 tur.
- Zarzut 9 (proces: 5f5f1c3ca nie jest przodkiem origin/main; DODATEK identyczny z 00-dispatch.md, brak instrukcji rundy): PRZYJMUJĘ jako notatkę dla orkiestratora, bez zmiany kodu. Nie mogę zmienić DODATKU ani bazy dispatchu (to pliki orkiestratora). Orkiestrator powinien przed partią 2 wpisać do DODATKU bazę (SHA kandydata 60afb0e45 lub następnego) i instrukcję rundy. Potwierdzam fakt: merge-base 5f5f1c3ca z origin/main nie jest przodkiem (origin/main = 3d1670626 w chwili obrony).

TESTY (surowe wyniki z tej rundy):
- node tools/resource-ledger-test.cjs: [a] maks. różnica 0; [a-var] cap-12: maks. różnica 0; [a-var] stolarnia: maks. różnica 0; "resource-ledger-test: 1028 passed, 0 failed"
- npx tsc --noEmit (gra/): exit 0, bez wyjścia
- node tools/logic-test.cjs: "LOGIC OK (213/213)"
- node tools/tech-tree-test.cjs: "tech-tree-test: 20 pass, 0 fail"
- node tools/research-test.cjs: "ALL GREEN"
- node tools/unit-replace-test.cjs: "WSZYSTKIE TESTY ZIELONE (21/21)"
- node tools/combat-test.cjs: "All sanity checks passed." (exit 0)
- git diff --check: czysty (exit 0)
- Nie uruchamiano building-upkeep-resources-test (D10 jest długiem bazowym wg raportu Evaluatora; poza zakresem tej obrony)

BLOKADY:
- Zarzuty 1–6 wymagają pracy partii 2–4 (zużycie w grze, handel/umowy/warzelnia, UI + Chromium, pomiar perf, wpięcie historii N, hash stanu gry). Nie wykonane w tej rundzie.
- Nie ma pomiaru perf ani Chromium: NIE ZMIERZONO.

RUNDY: 1/5 (obrona r1 tematu; wynik nie zamyka tematu, bo partia 1/4)

NASTĘPNY KROK: orkiestrator decyduje o partii 2 (zużycie: obywatele, utrzymanie, jednostki, budowa; handel i umowy, szlak, miasto, łup) z zarzutami 1–2 jako zakresem. Przed partią 2 uzupełnić DODATEK o bazę i instrukcję rundy (zarzut 9).

DEPLOY/PUSH: NIE WYKONANO
