STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-1B-REMAINING-DIRS-Q1
GOAL: Uzupełnienie P1.1 — katalog plików pozostałych podkatalogów `gra/src/*` NIEOBJĘTYCH pierwotnym
P1.1 (który pokrył tylko: game, ui, map, units, battle, render). Final Control P1.1 odnotował istnienie
dodatkowych katalogów (util, types, input, perf, oblezenie, wonderpreview, data, audio, assets) ze
"zgodnymi" liczbami, ale bez pełnej, równie szczegółowej tabeli jak 6 głównych katalogów. Na pinie
main=edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Ustalić pełną listę podkatalogów bezpośrednio w `gra/src/` (np. `ls gra/src` na świeżym checkoucie
main=edb8fb56), odjąć od niej 6 już skatalogowanych w P1.1 (game, ui, map, units, battle, render).
Dla KAŻDEGO pozostałego podkatalogu zapisać w `dyspozycje/rust-port/p1/P1-1B-REMAINING-DIRS.md`: liczbę
plików, liczbę linii, jedno zdanie przeznaczenia per plik (jak w P1.1), zweryfikowane komendą w tej
rundzie. Dopisać też zaktualizowane globalne podsumowanie `gra/src` (suma WSZYSTKICH podkatalogów,
P1.1 + ten temat) na końcu pliku.

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.1: zakaz liczb z pamięci, wszystko z `find`/`wc -l` w tej rundzie na pinie `edb8fb56`.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, pokrywa WSZYSTKIE podkatalogi `gra/src/*` nieobjęte oryginalnym P1.1 (zero pominięć),
każdy plik ma wiersz, suma globalna `gra/src` podana na końcu.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-1B-REMAINING-DIRS.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-1B-REMAINING-DIRS-Q1/**`. Odczyt: `gra/src/**` read-only (main
edb8fb56). Zero zapisu w `gra/**`, zero modyfikacji `P1-1-FILE-CATALOG.md` (osobny plik).

IZOLACJA
Świeży checkout/clone `main` (edb8fb56), NIE wspólny checkout sesji orkiestratora — praca wyłącznie
odczytowa.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 350 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
