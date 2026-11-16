# R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES — Operator, runda 2

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES
GOAL: ulepszenia, nakładki zasobów i wioski per heks w rendererze 3D z DTO (R4 kontraktu P4-1), z mgłą z wejścia
ZMIANY/COMMIT: tylko ten raport (kod bez zmian względem bazy aa9d36ac4; SHA commitu raportu w podsumowaniu rundy)
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --all-targets --no-fail-fast EXIT 0 (70 zestawów, 577 passed, 0 failed, 0 ignored); improvements_sync_r4 12/12; mutacje (a)(b)(c) FAIL
BLOKADY: brak
RUNDY: 2/5
NASTĘPNY KROK: Evaluator na tym commicie
DEPLOY/PUSH: NIE WYKONANO
```

BAZA: `aa9d36ac4` (detached), `git rev-parse HEAD` = `aa9d36ac415e5bd3bab1ace3cee274f43ec0b6d0` przed pracą. Kodu nie przepisywano (zgodnie z DODATKIEM r2).

## 1. Bramki (`rust-port/renderer`)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` unikalny poza repo (katalog scratchpad sesji, `target-p41r4-r2`), usunięty po bramkach i mutacjach.

| bramka | `df -h /` przed (Avail) | wynik |
|---|---|---|
| `cargo fmt --check` | 15 GB | **EXIT 0** |
| `cargo clippy --all-targets -- -D warnings` | 15 GB | **EXIT 0** |
| `cargo test --all-targets --no-fail-fast` | 14 GB (po: 13 GB) | **EXIT 0** — 70 zestawów `test result`, **577 passed, 0 failed, 0 ignored** |

`improvements_sync_r4` w pełnym przebiegu: 12 passed, 0 failed, 0 ignored (`from_dto_pairs_hexes_and_rejects_length_mismatch`, `merged_layers_follow_pin`, `deposit_marker_placement`, `no_camp_groups_without_dto_field`, `overlay_and_improvement_fog`, `relief_sampler_needs_external_predicate`, `later_snapshot_removes_stale_groups`, `improvement_mesh_uses_dto_road_mask_and_pin_placement`, `resource_overlay_gates`, `snapshot_orders_match_pin_call_order`, `villages_follow_dto_and_fog`, `terraces_and_livestock_layers`).

Po usunięciu `CARGO_TARGET_DIR`: `df -h /` = 11 GB (spadek względem 15 GB pochodzi z innych procesów na maszynie). `Cargo.lock` zmieniony lokalnie przez cargo — przywrócony (`git checkout`), poza commitem. `#[ignore]` w teście: 0.

## 2. Mutacje

Skrypt (scratchpad): kopia pliku → podmiana dokładnie jednego wystąpienia → `cargo test --test improvements_sync_r4` → przywrócenie kopii. Po wszystkich mutacjach `git status` bez zmian w `src/`.

| mutacja | plik i zmiana | wynik |
|---|---|---|
| (a1) `road_mask` zignorowany (zero) | `src/improvements/sync/build.rs:119`: `u32::from(road_mask),` → `{ let _ = road_mask; 0u32 },` | **FAIL**, exit 101: `improvement_mesh_uses_dto_road_mask_and_pin_placement` (11 passed, 1 failed) |
| (a2) `road_mask` zignorowany (pełna gwiazda, wariant z r1) | jw.: `u32::from(road_mask) \| 0b11_1111,` | **FAIL**, exit 101: `improvement_mesh_uses_dto_road_mask_and_pin_placement` (11 passed, 1 failed) |
| (b) wioska pokazana we mgle | `src/improvements/sync/mod.rs` `sync_settlement_mesh_fog`: po `apply_hex_fog(...)` dopisane `e.group.root_mut().visible = true;` | **FAIL**, exit 101: `villages_follow_dto_and_fog` (11 passed, 1 failed) |
| (c) zaprzeczenie warunku `zloze` | `src/improvements/sync/build.rs:258` (`zloze_shown`): `if z.is_empty() \|\|` → `if !z.is_empty() \|\|` | **FAIL**, exit 101: `deposit_marker_placement`, `resource_overlay_gates`, `snapshot_orders_match_pin_call_order`, `overlay_and_improvement_fog` (8 passed, 4 failed) |
| (c2, dodatkowa, jawnie) usunięcie samego sprawdzenia `''` | jw.: `if z.is_empty() \|\|` → `if false \|\|` | **PASS** (12/12) — mutant równoważny, patrz niżej |

Uwaga do (c2): `zloze` jest czytane przez `build_styled_resource_overlay_base` (`models/improvements/zasoby.rs:549-600`) wyłącznie, gdy `nakladka` to `Brak`/`Las`, a wtedy `Some("")` trafia w `_ => return None` — ten sam wynik co `None`. Sprawdzenie `''` w `zloze_shown` jest więc obronne (zgodne z `visibleZloze`, `map/deposit-era.ts:25-28` w pinie), a jego usunięcie nie zmienia obserwowalnego zachowania. Mutacja (c) z dispatchu (zaprzeczenie warunku) daje FAIL.

## 3. Bez zmian względem r1

- Obozy barbarzyńców: `NIE_ZMIERZONO` (brak pola w DTO; r1 §3).
- Luki G1–G6 (r1 §4); G5 wyłączona z tej rundy jako osobny temat (DODATEK r2).
- Pozostałe `NIE_ZMIERZONO` z r1 §7 pkt 1–4 bez zmian; pkt 5 (pełny `cargo test --all-targets`) zamknięty w tej rundzie (§1).

## 4. Zakres

Commit tej rundy zawiera wyłącznie ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES/01-operator-r2.md`). Brak zmian w `view-model/**`, `engine/**`, `gra/`, `Cargo.lock`. Bez push.
