# DISPATCH R-RUSTPORT-P6-AUDIT-ZINTEGROWANE (runda 1) — audyt statusów ZINTEGROWANE vs wołanie produkcyjne (#309, #356)

DOMENA: PROCESS / dokumentacja (tylko odczyt). BEZ cargo, BEZ zmian w kodzie, BEZ push, BEZ edycji `REJESTR-RUST.md`. MODEL: HAIKU (Operator), SONNET (Ewaluator, FC), HAIKU (Obrona).
BAZA: `origin/rust-port/parity-v2` = `f85622878`.
CEL: dla każdego modułu oznaczonego w `dyspozycje/rust-port/REJESTR-RUST.md` jako ZINTEGROWANE (`git show f85622878:dyspozycje/rust-port/REJESTR-RUST.md | grep -n ZINTEGROWAN`) sprawdź, czy istnieje WOŁAJĄCY W PRODUKCJI (kod poza `#[cfg(test)]` i poza `tests/`), i czy status „ZINTEGROWANE” jest uzasadniony.
METODA: `git grep -n "nazwa_modułu::\|use .*nazwa_modułu" f85622878 -- rust-port/*/src` i odfiltruj wystąpienia w `#[cfg(test)]` / plikach testów. Podaj plik:linia wołającego produkcyjnego.
WYJŚCIE: `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUDIT-ZINTEGROWANE/01-audyt.md` — tabela: moduł | status w rejestrze | wołający produkcyjni (plik:linia) lub BRAK | propozycja korekty (ZINTEGROWANE / WOŁANE TYLKO W TESTACH / BRAK). Na końcu: liczba modułów z BRAK i lista 5 najważniejszych.
NIE ROBIĆ: nie zmieniaj REJESTR-RUST.md (propozycje zapisz w raporcie, orkiestrator zaktualizuje), nie zmieniaj kodu, nie uruchamiaj cargo.
KRYTERIA KOŃCA: tabela kompletna dla wszystkich modułów ZINTEGROWANE z rejestru; każdy wpis z dowodem grep (plik:linia) lub oznaczony NIE_ZMIERZONO; commit tylko pliku 01-audyt.md (jawny `git add`, bez nazwy modelu w trailerach).
