STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1
GOAL: Port 1:1 territory.ts / territory-work.ts / range-hexes.ts / wonder-placement.ts (pin edb8fb56) do Rust, wektory z uruchomionego weba, weryfikator Python 0 rozbieznosci.
ZMIANY/COMMIT: `src/domain/territory.rs`, `src/domain/wonder_placement.rs`, `tests/p6_m14_{territory,work,range,wonder}.rs`, `tests/p6_m14_vectors/**`, `dyspozycje/rust-port/p6/P6-M14-TERYTORIUM-ZASIEG-CUDA.md`, ten katalog runu. SHA: patrz commit w worktree (bez push).
TESTY: fmt EXIT=0; clippy --all-targets -D warnings EXIT=0; cargo test --no-fail-fast: 618 testow, 617 zielonych, 1 czerwony (p6_m00_skeleton::files_exist_and_are_empty_doc_only - test M00 poza allowlista zaklada pusty szkielet); 23 nowe testy M14; verify-m14-vectors.py checks=5436 rozbieznosci=0; mutacje 22/23 wykryte, 1 rownowazny.
BLOKADY: jawna: stary test M00 (patrz P6-M14 §5) - wymaga decyzji orkiestratora; zaleznosci cityBorderRadius/dominantReligion (P6.16) i computeLostToNearerSiblingByCity (P6.8) przekazywane przez wywolujacego (Z5).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Haiku 5.5) -> Obrona -> Final Control.
DEPLOY/PUSH: NIE WYKONANO
