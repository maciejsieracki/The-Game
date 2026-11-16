# DISPATCH R-RUSTPORT-P6-EKONOMIA-STAN-PLAN-Q1 (runda 1) — plan pól wejściowych ekonomii w PlayableState (#310)

MODEL: HAIKU (Operator), SONNET (Evaluator). Tylko plan i dokument, bez kodu, bez cargo.
BAZA: `origin/rust-port/parity-v2` = `55e00a164`. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt, web-first).
Wejście: `dyspozycje/rust-port/p6/EKONOMIA-TURA-FAZY-ROZPOZNANIE.md`, sekcja 4 (brakujące pola).

## ZADANIE
1. Dla każdego brakującego pola z sekcji 4 podaj: plik:linia w pinie, gdzie web go czyta (`git show 07d2fbd72:gra/src/...`), typ w Rust, proponowaną nazwę pola w PlayableState, wartość domyślną (serde default), czy wpływa na zapis (save_load).
2. Zaproponuj kolejność dodawania pól (najmniejszy zakres pierwszy) i listę testów wektorowych, które będą potrzebne.
3. Wskaż, które pola są już w Rust pod inną nazwą (nie duplikuj).

## WYJŚCIE
- `dyspozycje/rust-port/p6/EKONOMIA-STAN-PLAN.md` (NOWY): tabela pól, kolejność, testy. Niepewne miejsca: NIE_ZMIERZONO.
- Commit jawnym git add, bez zmian kodu, bez push do parity.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/EKONOMIA-STAN-PLAN.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-EKONOMIA-STAN-PLAN-Q1/**`
