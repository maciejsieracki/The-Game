# DISPATCH R-RUSTPORT-P6-K5DOC-T7-FALANGA-ROZPOZNANIE (runda 1) — rozpoznanie FALANGI (#261, K5DOC-T7), tylko odczyt

DOMENA: engine Rust, ROZPOZNANIE. MODEL: HAIKU. BAZA: `origin/rust-port/parity-v2` = `32c84d6a9`. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Nie pisz kodu, nie zmieniaj `rust-port/**`, nie uruchamiaj cargo (dysk < 8 GB), nie pushuj do parity.

## CEL
1. W pinie: `_phalanxAction` (ok. 6556), `_phalanxLineFront` (ok. 6519), `_fallBackStep`, wywołanie `_advanceStep` z falangi (ok. 6556). Lokalizacje: `git grep -n "_phalanxAction\|_phalanxLineFront\|_fallBackStep" 07d2fbd72 -- gra/src/battle` — nie zgaduj.
2. W Rust: co już istnieje (`siege_tactics_advance.rs` z T4b, `siege_tactics_pathstep.rs` T4a, `siege_tactics_doctrine_*`, `ProdUnit`). Użyj `git grep` na `32c84d6a9`.
3. Lista brakujących wejść, zależności (T4b #313 w integracji, T6 #259 w integracji), proponowana allowlista, wektory z `plik:linia`.

## WYJŚCIE
Zapisz `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T7-FALANGA-ROZPOZNANIE/01-rozpoznanie.md`: pin (mapa funkcji z liniami), Rust (co jest / czego brakuje), zależności, allowlista, wektory, NIE_ZMIERZONO. STATUS (PASS | BLOCK) i jedna linia rekomendacji. Commit tylko tego pliku (jawny `git add`, bez nazwy modelu w trailerach).
