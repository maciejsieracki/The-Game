# DISPATCH — R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1 (runda Evaluator + Final Control)

Orkiestrator: czat RUST (gałąź `claude/rust-sivvrn`). Dispatch zapisany PRZED uruchomieniem Workflow.

## Baza i kod do oceny
- Kod Operatora r1: `origin/autobot/p6-repin-dystans` = `3b7841f14` (commity `83bc866e6` kod, `3b7841f14` handoff).
- Baza: `origin/rust-port/parity-v2` = `6d74770df` (merge-base). Merge-tree z aktualnym `parity-v2` `db390d49d`: czysty.
- Raport Operatora r1: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1/01-operator-r1.md` (na tej samej gałęzi).
- Opis zakresu i założenia: `dyspozycje/rust-port/p6/P6-REPIN-DYSTANS-PETLA.md` (§2, zał. 1–9), handoff: `dyspozycje/rust-port/p6/P6-REPIN-DYSTANS-PETLA-HANDOFF.md`.

## Allowlista (naruszenie = FAIL)
- `rust-port/engine/src/domain/combat.rs`, `rust-port/engine/src/domain/unit_power.rs`
- `rust-port/engine/tests/p6_repin_dystans_petla.rs`, `rust-port/engine/tests/p6_repin_dystans_fieldpower.rs`, `rust-port/engine/tests/p6_repin_dystans_petla_gen.mjs`
- `rust-port/engine/tests/p6_repin_dystans_vectors/dystans-petla.json`, `.../dystans-fieldpower.json`
- `dyspozycje/rust-port/p6/**`, `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1/**`
- ZAKAZ: `gra/**`, `origin/main`, `WERSJE.md`, `rust-port/engine/Cargo.toml`, `rust-port/engine/src/domain/mod.rs` (zmiana tego pliku = FAIL, nie zmieniać), `REJESTR-PROSB-I-ZADAN.md`.
- `Cargo.lock` niewersjonowany (artefakt cargo): nie commitować; jeśli pojawi się w diffie — to zarzut.

## Rola Evaluatora (adwersarialnie)
1. Odtwórz bramki sam, w worktree z `git checkout --detach 3b7841f14`, z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w worktree:
   `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_repin_dystans_petla --test p6_repin_dystans_fieldpower --test p6_repin_dystans_formulas`. Surowe logi i EXIT.
2. Sprawdź allowlistę (`git diff --name-only 6d74770df 3b7841f14`) i brak osłabionych testów (`#[ignore]`, usunięte asercje).
3. Sprawdź wektory: czy pochodzą z `git archive origin/main gra/src gra/data` poza repo (pin `cffe39cb9`), a nie są pisane ręcznie.
4. Oceń kryteria binarne: pętla strzałów zgodna z `combat.ts:1008-1067`; `ranged_shot_damage` używany w pętli; `field_power` zgodny z `unit-power.ts:122`; testy weba 100%.
5. Zarzuty muszą być ponumerowane. Pusta lista tylko po realnym sprawdzeniu.

## Ustalone ZAŁOŻENIA (NIE są zarzutem)
- Faza dystansowa NIE jest podpięta do `resolve_combat` i NIE jest faza zwarcia — to osobny temat i decyzja właściciela (ABC). Brak podpięcia nie jest FAIL tego tematu.
- Wejście fazy (modyfikatory civ/teren/flanka/kontra/weterani) NIE zweryfikowane wektorami — udokumentowane jako NIE_ZMIERZONO w §2 pkt 8. Nie jest FAIL, jeśli jest opisane uczciwie.
- Pełny `cargo test` wszystkich binarek: NIE_ZMIERZONO w r1. Evaluator ma go uruchomić w tle, jeśli czas pozwoli; jego brak przy uczciwym opisie nie jest FAIL, ale pass-with-notes.

## Rola Final Control
- Dla każdego zarzutu: NAPRAW / ODDAL / DO DECYZJI CZŁOWIEKA. Jeden NAPRAW = FAIL; same ODDAL = PASS.
- Zapisz `03-final-control.md` w runie (na gałęzi kodu operatora `3b7841f14` nie commitować — zapis w worktree i commit na gałęzi dokumentacji orkiestratora).
- Nie integruj, nie pushuj do `parity-v2`, nie deployuj. Integrację wykonuje orkiestrator po READY_FOR_DEPLOY.

## Format raportu
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY (1/5 r1, Evaluator = runda 2) / NASTĘPNY KROK / DEPLOY-PUSH: NIE WYKONANO
