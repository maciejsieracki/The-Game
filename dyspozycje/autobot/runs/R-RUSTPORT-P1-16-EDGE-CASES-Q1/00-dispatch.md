STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16-EDGE-CASES-Q1
GOAL: P1.16 z PLAN-PORT-RUST-TAURI-20261020.md §4 — spisane edge case'y i znane błędy w kodzie
webowym (bez benchmarków), na pinie main=edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Przeszukać `gra/src/**` i `dyspozycje/*.md` (ten sam repo, dokumentacja istniejących audytów/błędów —
np. pliki `BLAD-*`, `AUDYT-*` w `dyspozycje/`) pod kątem: komentarzy TODO/FIXME/HACK/XXX w kodzie,
znanych, udokumentowanych błędów (plik `dyspozycje/BLEDY-DO-NAPRAWY-2026-07-05.md` i podobne — ustal
czy nadal aktualne na obecnym pinie), edge case'ów jawnie obsłużonych w kodzie (np. walidacje,
guard clauses z komentarzem wyjaśniającym dlaczego). Zapisać w
`dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md`: listę z ścieżką+linią+cytatem, kategorię (TODO w
kodzie / udokumentowany błąd / obsłużony edge case), czy dotyczy systemu który będzie portowany w P6.

ANTY-HALUCYNACYJNA REGUŁA
Każdy wpis musi mieć ścieżkę+linię+cytat z komendy uruchomionej w tej rundzie (grep/git grep), nie z
pamięci starych audytów. Dla dokumentów `dyspozycje/BLAD-*`/`AUDYT-*` jawnie sprawdzić, czy opisany
błąd nadal istnieje w kodzie na pinie `edb8fb56` (nie zakładać, że stary dokument = aktualny stan).

BINARNE KRYTERIUM SUKCESU
Plik istnieje, lista TODO/FIXME ma policzoną liczbę trafień (grep) ze ścieżkami, co najmniej 5
najstarszych/najistotniejszych udokumentowanych błędów ze starych audytów sprawdzonych wprost na
obecnym pinie (nadal istnieje / naprawiony), podsumowanie które systemy z P1.14 mają najwięcej
otwartych edge case'ów.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16-EDGE-CASES-Q1/**`. Odczyt: `gra/src/**` i `dyspozycje/*.md`
read-only (main edb8fb56). Zero zapisu w `gra/**` ani poza allowlistą w `dyspozycje/**`.

IZOLACJA
Świeży checkout/clone `main` (edb8fb56), praca wyłącznie odczytowa (grep/cat).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 350 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
