# P3-14 — higiena fmt/clippy dla `src/data/**` (R-RUSTPORT-P3-14-FMT-CLIPPY-HYGIENE-Q1)

Baza: `origin/rust-port/parity-v2` = `914eec6b`. Komendy: `CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0`, `cargo ... --offline`.
Zmienione pliki (allowlista): `rust-port/engine/src/data/{civilizations,economy_society,terrain_map}.rs`.
Bez zmian (już czyste): `buildings_tech.rs`, `economy_society_part2.rs`, `units_combat.rs`.

## 1. Stan PRZED (surowe wyniki)

### `rustfmt --check` (6 plików z allowlisty)

```
Diff in .../src/data/civilizations.rs:1303:   (pusta linia nadmiarowa)
Diff in .../src/data/civilizations.rs:1310:   (DIPLOMACY_ACCEPTANCE_POINTS_JSON > 100 znaków)
Diff in .../src/data/economy_society.rs:148:  (dwa pola struct > 100 znaków)
Diff in .../src/data/terrain_map.rs:9:        (TERRAIN_IMPROVEMENTS_JSON, łamanie linii)
EXIT=1
```

### `cargo clippy --all-targets` (PRZED)

```
warning: duplicated attribute
 --> tests/../src/data/civilizations.rs:3:10
 --> tests/data_civilizations.rs:5:9
warning: large size difference between variants
  --> tests/../src/bridge.rs:22:1
warning: `civ-engine` (test "data_civilizations") generated 1 warning
warning: `civ-engine` (test "bridge_add_player") generated 1 warning
EXIT=0
```

### `cargo test --offline --all-targets` (PRZED)

Suma `test result` = **260 passed, 0 failed**, EXIT=0, 33 binarek testowych.
(Dispatch szacował 256; faktyczna baza to 260 — liczba identyczna przed i po zmianach.)

## 2. Zmiany

1. `rustfmt --edition 2021` uruchomiony WYŁĄCZNIE na 6 plikach z allowlisty (nie `cargo fmt --all`).
   Realnie zmienione: `civilizations.rs`, `economy_society.rs`, `terrain_map.rs`.
2. `civilizations.rs`: usunięty `#![allow(dead_code)]` (linia 3) — duplikat zewnętrznego `#[allow(dead_code)]`
   na `mod civilizations` w `tests/data_civilizations.rs:5` (plik testu poza allowlistą, nietknięty).
   Inner attribute zostaje w ścieżce `src/data/mod.rs` (`pub mod civilizations;`) — tam lint nie raportuje,
   a `cargo clippy -- -D warnings` na całym targetcie przechodzi poza bridge.rs (patrz niżej).

Weryfikacja bez zmian semantyki (token-hash po usunięciu białych znaków, `tr -d ' \t\n\r'`):
- `economy_society.rs`: HEAD == worktree (identyczne tokeny).
- `terrain_map.rs`: HEAD == worktree (identyczne tokeny).
- `civilizations.rs`: różni się WYŁĄCZNIE usuniętą linią `#![allow(dead_code)]` (oraz pustą linią).

`git diff -w --stat`: 3 pliki, 7 insertions / 7 deletions (różnice to przełamania linii i jedna linia atrybutu).

## 3. Stan PO (surowe wyniki)

### `rustfmt --check` (6 plików z allowlisty)

```
EXIT=0
```

### `cargo clippy --all-targets` (PO)

```
warning: large size difference between variants
  --> tests/../src/bridge.rs:22:1
warning: `civ-engine` (test "bridge_add_player") generated 1 warning
EXIT=0
```

Ostrzeżenie `duplicated attribute` zniknęło. Pozostało jedno ostrzeżenie poza allowlistą (`bridge.rs`, P3.4c) — NIE naprawiane, tylko wylistowane.

### `cargo clippy --all-targets -- -D warnings` (PO, informacyjnie)

EXIT=101 wyłącznie przez `bridge.rs:22:1` (large_enum_variant, poza allowlistą). Brak innych błędów.

### `cargo test --offline --all-targets` (PO)

Suma `test result` = **260 passed, 0 failed**, EXIT=0 — identycznie jak baseline.

## 4. Ostrzeżenia poza allowlistą (nienaprawiane)

- `rust-port/engine/src/bridge.rs:22` — `large size difference between variants` (P3.4c, domain/**+bridge.rs).

## 5. Uwagi

- `rust-port/engine/Cargo.lock` powstał lokalnie przy `cargo` i jest NIEŚLEDZONY — NIE commitowany.
- Brak `target/` w worktree (CARGO_TARGET_DIR wskazuje na katalog współdzielony).
- Deploy/push: NIE WYKONANO.
