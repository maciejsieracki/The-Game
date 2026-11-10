STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-15B-INDEX-UPDATE-Q1
GOAL: Aktualizacja `P1-15-SCREENSHOT-INDEX.md` o zrzuty dodane po pierwszej rundzie P1.15 (pełne
P1.6, oraz P1.8/P1.9 jeśli już zamknięte w momencie tej rundy — sprawdzić stan w
`dyspozycje/rust-port/LEDGER.md`, nie zakładać).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Przeliczyć `dyspozycje/rust-port/p1/screenshots/` od nowa (lista plików, MD5 dla duplikatów) i
porównać z tabelą w `dyspozycje/rust-port/p1/P1-15-SCREENSHOT-INDEX.md`. Dopisać wiersze dla
WSZYSTKICH plików PNG, których jeszcze nie ma w tabeli (np. z P1.6 pełnego zestawu, P1.8, P1.9 — ile
już istnieje). Zaktualizować listę "braków" na zgodną ze stanem repo w tej rundzie. NIE kasować ani
nie zmieniać wierszy już poprawnie opisanych w poprzedniej rundzie.

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.15: zakaz wymyślania opisu zrzutu, którego plik nie istnieje, zakaz twierdzenia o stanie
tematu P1.8/P1.9 bez sprawdzenia `LEDGER.md` w tej rundzie.

BINARNE KRYTERIUM SUKCESU
Każdy plik PNG istniejący w `screenshots/` w momencie tej rundy ma wiersz w tabeli, lista braków jest
zgodna ze stanem `LEDGER.md` sprawdzonym w tej rundzie.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-15-SCREENSHOT-INDEX.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-15B-INDEX-UPDATE-Q1/**`. Odczyt: `dyspozycje/rust-port/**`
read-only. Zero zapisu poza allowlistą (inne tematy mogą aktywnie zapisywać swoje pliki równolegle —
tylko odczyt).

IZOLACJA
Czysta praca odczytowa na już istniejących plikach w repo.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 300 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
