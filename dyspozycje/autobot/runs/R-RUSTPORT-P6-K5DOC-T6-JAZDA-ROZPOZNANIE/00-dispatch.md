# DISPATCH R-RUSTPORT-P6-K5DOC-T6-JAZDA-ROZPOZNANIE (runda 1) — rozpoznanie JAZDY (#259, K5DOC-T6), tylko odczyt

DOMENA: engine Rust, ROZPOZNANIE. MODEL: HAIKU. BAZA: `origin/rust-port/parity-v2` = `2edc808d7`. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Nie pisz kodu, nie zmieniaj `rust-port/**`, nie uruchamiaj cargo, nie pushuj do parity.

## CEL
1. W pinie: `_cavalryAction`, `_cavalryTarget`, manewry omijania włóczni (`gra/src/battle/battleScene.ts`). Lokalizacje: `git grep -n "_cavalryAction\|_cavalryTarget\|spear\|_avoidSpear" 07d2fbd72 -- gra/src/battle` — nie zgaduj.
2. W Rust: co już istnieje (`siege_tactics_*.rs`, `ProdUnit`, `ProdDoctrineState`, helpery T4a, `first_step_along_path_to_attack`, `step_toward`).
3. Lista brakujących wejść, zależności (T4b #313, T5a #257), proponowana allowlista, wektory z `plik:linia`.

## WYJŚCIE
Zapisz `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T6-JAZDA-ROZPOZNANIE/01-rozpoznanie.md`: pin (mapa funkcji z liniami), Rust (co jest / czego brakuje), zależności, allowlista, wektory, NIE_ZMIERZONO. Na końcu STATUS (PASS | BLOCK) i jedna linia rekomendacji. Commit tylko tego pliku (jawny `git add`, bez nazwy modelu w trailerach).
