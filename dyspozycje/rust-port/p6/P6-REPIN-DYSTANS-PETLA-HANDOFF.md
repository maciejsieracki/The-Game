# HANDOFF — R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1 (dla kolejnego agenta)

Stan na 2026-11-11. Czytaj razem z `P6-REPIN-DYSTANS-PETLA.md` (założenia) i `P6-REPIN-DYSTANS-MULT.md` (poprzednia partia).

## Gdzie jest praca
- Gałąź lokalna `autobot/p6-repin-dystans`, commit `83bc866e6` (+ ten plik w kolejnym commicie), baza `origin/rust-port/parity-v2` `6d74770df`.
- Worktree: `/tmp/wt-dystans` (sparse: `rust-port`, `dyspozycje`). Kontener jest efemeryczny — NIE było `git push`.
  Jeśli worktree zniknęło, odtwórz z commita (jeśli ktoś go wypchnął) albo powtórz temat wg poniższego.
- Zmieniono TYLKO: `rust-port/engine/src/domain/{combat.rs,unit_power.rs}`, `tests/p6_repin_dystans_{petla,fieldpower}.rs`,
  `tests/p6_repin_dystans_petla_gen.mjs`, `tests/p6_repin_dystans_vectors/dystans-{petla,fieldpower}.json`,
  `dyspozycje/rust-port/p6/`, `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1/`.

## Co ustalono / zrobiono
1. W Rust nie było pętli walki ze strzałami; `ranged_shot_damage` (unit_power.rs) nie był nigdzie używany w walce.
2. Dodano `combat.rs::ranged_phase::resolve_ranged_phase` — port „Phase 0: Ranged” z `gra/src/game/combat.ts` (l.1008–1067, origin/main `cffe39cb9`).
   Czysta funkcja: wejście to statystyki PO modyfikatorach + HP/amunicja/próg dezercji/kontra/`def_final_obrona`/`river_mult`; wyjście: HP, amunicja, rundy, routed, lista strzałów.
3. Dodano `unit_power.rs::field_power` + `UnitPowerCoeffs::from_params` (port `unit-power.ts:122`).
4. Wektory z URUCHOMIONEGO weba (esbuild 0.24.2, Node 22, mulberry32 seed 6101): 600 walk / 2827 strzałów, 400 jednostek `fieldPower`. Zgodność 100%.
5. Bramki: fmt, clippy `-D warnings`, `--lib` 22/22, `p6_repin_dystans_*` 8+3+1 — zielone, 0 `#[ignore]`.
6. Regeneracja wektorów: `git archive origin/main gra/src gra/data | tar -x -C <katalog-poza-repo>`; `npm i esbuild@0.24.2` poza repo;
   `node tests/p6_repin_dystans_petla_gen.mjs <katalog> <katalog-esbuild> tests/p6_repin_dystans_vectors/dystans-petla.json` (zapisuje też `dystans-fieldpower.json`).

## Co jest do zrobienia (kolejność sugerowana)
1. **Evaluator + Final Control** dla tego tematu (nie było Workflow; obieg wg CLAUDE.md). Zwrócić uwagę: czy podmoduł w `combat.rs` jest akceptowalny (nowy plik wymagał `domain/mod.rs`, poza allowlistą).
2. **Pełny `cargo test`** wszystkich binarek — NIE_ZMIERZONO (przekroczył timeout 580 s w tym kontenerze). Uruchomić w tle z dłuższym limitem
   (`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo).
3. **Osobny temat: wyliczenie wejścia fazy** — port modyfikatorów z `resolveCombat` (l.842–1000): civ (`civCombatStatMultipliers`), budynki,
   trudność, głód, dług złota, weterani, `canonicalCurrentHp`, flanka/tyły (`flankRearDefensePenalty`), teren (`terrainDefenseMultiplier`,
   `terrainRiverAttackMultiplier`), struktury/mur, `counterMultiplier`. Wektorami weba nie sprawdzono: kontry ≠ 1, rzeki, flanki, civ/budynków, weteranów.
4. **Osobny temat: faza zwarcia** (Phase 1/2, `combat.ts` od l.1068) + `CombatResult`, a następnie podpięcie do `resolve_combat`/`resolve`
   (dziś model siły `effective_strength`). To zmiana zachowania gry → wymaga decyzji produktowej właściciela (ABC: czy Rust przechodzi z modelu siły na rundy).
5. Opcjonalnie: `armyFieldPower` (cache `u.fieldPower` tylko gdy mnożnik == 1; siege = 0), `battle/**` (`battleScene.ts:8964`) — katalog nie istnieje w Rust.
6. Rejestry/WERSJE/deploy: nie ruszano; push i deploy wymagają osobnej autoryzacji po `READY_FOR_DEPLOY`.

## Pułapki
- `cargo` generuje `rust-port/engine/Cargo.lock` (niewersjonowany, poza allowlistą) — usuwać przed commitem.
- `git fetch` repo trwa kilka minut przez proxy; commity `7be18d597`/`e1c4284cc` są w `origin/rust-port/parity-v2`.
- Allowlista zabrania zmian w `gra/**`, `WERSJE.md`, `Cargo.toml`.
