STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1
GOAL: port pętli rund strzałów (combat.ts Phase 0) do Rust tak, by ranged_shot_damage był używany w walce; opcjonalnie fieldPower
ZMIANY/COMMIT: rust-port/engine/src/domain/combat.rs (+ranged_phase), src/domain/unit_power.rs (+field_power), tests/p6_repin_dystans_petla.rs, tests/p6_repin_dystans_fieldpower.rs, tests/p6_repin_dystans_petla_gen.mjs, tests/p6_repin_dystans_vectors/dystans-petla.json + dystans-fieldpower.json, dyspozycje/rust-port/p6/P6-REPIN-DYSTANS-PETLA.md. Zero zmian w gra/**, WERSJE.md, Cargo.toml. Baza: origin/rust-port/parity-v2 6d74770df. SHA: patrz git log gałęzi autobot/p6-repin-dystans (lokalnie, bez push).
TESTY: cargo fmt --check OK; cargo clippy --all-targets -D warnings OK; cargo test --lib 22/22; p6_repin_dystans_formulas 8/8; p6_repin_dystans_petla 3/3 (600 walk, 2827 strzałów z weba); p6_repin_dystans_fieldpower 1/1 (400 jednostek). 0 failed, 0 nowych #[ignore]. NIE_ZMIERZONO: pełny `cargo test` wszystkich binarek (przekroczył timeout 580 s; zmiany są wyłącznie addytywne).
BLOKADY: brak. Luki jako założenia w P6-REPIN-DYSTANS-PETLA.md §2 (m.in. resolve_ranged_phase nie jest jeszcze podpięta do resolve_combat; mody civ/teren/kontra/flanka nie weryfikowane wektorami weba).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator; potem osobny temat: wyliczenie modyfikatorów wejścia + faza zwarcia + podpięcie do resolve_combat
DEPLOY/PUSH: NIE WYKONANO
