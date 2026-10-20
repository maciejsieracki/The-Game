STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-GATE-SYNTHESIS-Q1
GOAL: Synteza zamknięcia bramki P1 — sprawdzić, dla KAŻDEGO punktu P1.1-P1.18 z
PLAN-PORT-RUST-TAURI-20261020.md §4, czy istnieje odpowiadający plik w `dyspozycje/rust-port/p1/` i
czy jego temat Workflow zakończył się PASS (sprawdzić w `dyspozycje/rust-port/LEDGER.md`). CZĘŚCIOWE
na tę rundę jest dopuszczalne — niektóre tematy (P1.8, P1.9, P1.13b, P1.14b, P1.16b) mogą być jeszcze
w toku; ten temat ma to jawnie odzwierciedlić, nie czekać.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Zapisać w `dyspozycje/rust-port/P1-GATE-SYNTHESIS.md` tabelę: punkt planu (P1.1-P1.18 + warianty b/c
jeśli istnieją) | plik(i) wynikowy(e) | status z LEDGER.md (PASS/w toku/brak) | jedno zdanie
najważniejszego znaleziska z tego punktu. Na końcu: sekcja "Gotowość bramki P1" — czy WSZYSTKIE punkty
mają status PASS (jeśli nie — jawnie wypisać, co jeszcze brakuje, bramka NIE jest otwarta), oraz sekcja
"Najważniejsze znaleziska całej fazy P1 dla właściciela" (max 10 punktów, np.: REUSE=0 w P1.17/17b,
UNKNOWN=169/183 i 107/117, rozmiar portu 892 pliki/517k linii web vs ~28 plików Rust, hot-seat BRAK w
Rust, stan błędu walidacji nieosiągalny w UI, poprawka terenu zintegrowana).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz twierdzenia "PASS" dla punktu bez odnalezienia odpowiedniego wpisu PASS w `LEDGER.md` w tej
rundzie — sprawdzić plik, nie polegać na pamięci/założeniu.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, WSZYSTKIE punkty P1.1-P1.18 (i warianty b) mają wiersz ze statusem zweryfikowanym
względem `LEDGER.md` w tej rundzie, sekcja "Gotowość bramki" jest jawna i zgodna z rzeczywistym stanem
(nie deklaruje gotowości przedwcześnie).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/P1-GATE-SYNTHESIS.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-GATE-SYNTHESIS-Q1/**`. Odczyt: cały `dyspozycje/rust-port/**`
read-only. Zero zapisu poza allowlistą — w szczególności zero modyfikacji plików innych tematów
(niektóre mogą być aktywnie zapisywane przez równolegle działające tematy).

IZOLACJA
Czysta praca odczytowa na już istniejących plikach w repo.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (treść syntezy w pliku, nie w raporcie).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
