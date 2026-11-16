# DISPATCH R-RUSTPORT-P6-EKONOMIA-TURA-FAZY-ROZP-Q1 (runda 1) — kolejność faz tury web vs advance_turn Rust (#304, audyt L1)

MODEL: HAIKU (Operator), SONNET (Evaluator). TYLKO ODCZYT, bez kodu, bez cargo.
BAZA: `origin/rust-port/parity-v2` = `9a71caf8a`. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt). Web-first: kolejność faz bierz z pinu, nie z Rust.

## PYTANIA
1. W pinie: lista faz tury w kolejności wywołań (funkcja zarządzająca turą i miejsca wołania ekonomii: `runEconomyTick` lub odpowiednik; `git grep -n` w `gra/src`, podaj plik:linia).
2. W Rust: `PlayableGame::advance_turn` (`rust-port/engine/src/domain/playable.rs`, ~1400-1491): jakie fazy są wołane i w jakiej kolejności? (plik:linia).
3. Zestawienie: która faza pinu nie ma odpowiednika w advance_turn, i gdzie dokładnie wpiąć ekonomię (przed/po której fazie) zgodnie z pinem.
4. Co z ekonomią zależy (stan, wejścia), czego brakuje w PlayableState? Lista, bez implementacji.

## WYJŚCIE
- `dyspozycje/rust-port/p6/EKONOMIA-TURA-FAZY-ROZPOZNANIE.md` (NOWY): tabela faz pin ↔ Rust, miejsce wpięcia, zależności.
- Niepewne miejsca oznacz NIE_ZMIERZONO. Commit jawnym git add. Bez zmian kodu, bez push do parity.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/EKONOMIA-TURA-FAZY-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-EKONOMIA-TURA-FAZY-ROZP-Q1/**`
