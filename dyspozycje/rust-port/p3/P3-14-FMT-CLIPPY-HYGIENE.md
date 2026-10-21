# P3-14 — higiena fmt/clippy dla `src/data/**` (R-RUSTPORT-P3-14-FMT-CLIPPY-HYGIENE-Q1)

Baza: `origin/rust-port/parity-v2` = `914eec6b`. Commit poprawki: `c6a548c7` (runda 1, Operator), korekta dokumentu: patrz `02-operator-odpowiedz.md` w runie (runda 2).
Komendy: `CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0`, `cargo ... --offline`, `rustfmt --edition 2021 --color never --check <6 plików>`.
Zmienione pliki (allowlista): `rust-port/engine/src/data/{civilizations,economy_society,terrain_map}.rs`.
Bez zmian (już czyste przed zmianą): `buildings_tech.rs`, `economy_society_part2.rs`, `units_combat.rs`.

Surowe wyjścia poniżej są wklejone dosłownie z plików logów (kolor wyłączony; pełne logi nie są w repo, wklejone bloki są kompletne, testy — patrz sekcja 1c).

## 1. Stan PRZED (baza `914eec6b`, surowe wyniki)

### 1a. `rustfmt --check` (6 plików z allowlisty)

Polecenie: `rustfmt --edition 2021 --color never --check src/data/civilizations.rs src/data/economy_society.rs src/data/terrain_map.rs src/data/buildings_tech.rs src/data/economy_society_part2.rs src/data/units_combat.rs; echo EXIT=$?`

```
Diff in /home/user/The-Game/.claude/worktrees/wf_29ac35b4-c5a-3/rust-port/engine/src/data/civilizations.rs:1303:

 pub type CityNamesPoolsFile = BTreeMap<String, CityPool>;

-
 pub const CIVS_JSON: &str = include_str!("../../data/civs.json");
 pub const CIV_MATRIX_JSON: &str = include_str!("../../data/civ-matrix.json");
 pub const CIV_PARAMS_JSON: &str = include_str!("../../data/civ-params.json");
Diff in /home/user/The-Game/.claude/worktrees/wf_29ac35b4-c5a-3/rust-port/engine/src/data/civilizations.rs:1310:
 pub const CIV_AI_JSON: &str = include_str!("../../data/civ-ai.json");
 pub const DIPLOMACY_JSON: &str = include_str!("../../data/diplomacy.json");
-pub const DIPLOMACY_ACCEPTANCE_POINTS_JSON: &str = include_str!("../../data/diplomacy-acceptance-points.json");
+pub const DIPLOMACY_ACCEPTANCE_POINTS_JSON: &str =
+    include_str!("../../data/diplomacy-acceptance-points.json");
 pub const CITY_NAMES_POOLS_JSON: &str = include_str!("../../data/city-names-pools.json");

 pub fn parse_civs() -> serde_json::Result<CivsFile> {
Diff in /home/user/The-Game/.claude/worktrees/wf_29ac35b4-c5a-3/rust-port/engine/src/data/economy_society.rs:148:
     #[serde(rename = "budynek_stolarnia_bonus_drewna_civ")]
     pub budynek_stolarnia_bonus_drewna_civ: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
     #[serde(rename = "budynek_kamieniarski_bonus_kamienia_civ")]
-    pub budynek_kamieniarski_bonus_kamienia_civ: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
+    pub budynek_kamieniarski_bonus_kamienia_civ:
+        EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
     #[serde(rename = "budynek_garncarnia_bonus_zywnosci_lokalnie")]
-    pub budynek_garncarnia_bonus_zywnosci_lokalnie: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
+    pub budynek_garncarnia_bonus_zywnosci_lokalnie:
+        EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
     #[serde(rename = "ulepszenie_surowcowe_upkeep_praca")]
     pub ulepszenie_surowcowe_upkeep_praca: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
     #[serde(rename = "budynek_mennica_mnoznik")]
Diff in /home/user/The-Game/.claude/worktrees/wf_29ac35b4-c5a-3/rust-port/engine/src/data/terrain_map.rs:9:

 use serde::Deserialize;

-pub const TERRAIN_IMPROVEMENTS_JSON: &str =
-    include_str!("../../data/terrain-improvements.json");
+pub const TERRAIN_IMPROVEMENTS_JSON: &str = include_str!("../../data/terrain-improvements.json");
 pub const TERRAIN_MOVEMENT_JSON: &str = include_str!("../../data/terrain-movement.json");
 pub const TERRAIN_YIELDS_JSON: &str = include_str!("../../data/terrain-yields.json");
 pub const MAP_GEN_PARAMS_JSON: &str = include_str!("../../data/map-gen-params.json");
EXIT=1
```

### 1b. `cargo clippy --all-targets` (PRZED, pełny stdout+stderr)

Polecenie: `cargo clippy --offline --all-targets; echo EXIT=$?`

```
    Locking 17 packages to latest compatible versions
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_29ac35b4-c5a-3/rust-port/engine)
warning: duplicated attribute
 --> tests/../src/data/civilizations.rs:3:10
  |
3 | #![allow(dead_code)]
  |          ^^^^^^^^^
  |
note: first defined here
 --> tests/data_civilizations.rs:5:9
  |
5 | #[allow(dead_code)]
  |         ^^^^^^^^^
help: remove this attribute
 --> tests/../src/data/civilizations.rs:3:10
  |
3 | #![allow(dead_code)]
  |          ^^^^^^^^^
  = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes
  = note: `#[warn(clippy::duplicated_attributes)]` on by default

warning: large size difference between variants
  --> tests/../src/bridge.rs:22:1
   |
22 | /  pub enum EngineCommand {
23 | |      /// Start a fresh deterministic session from the wizard DTO.
24 | |/     CreateSession {
25 | ||         #[serde(default)]
26 | ||         params: StartGameParams,
27 | ||     },
   | ||_____- the largest variant contains at least 840 bytes
28 | |      /// Compatibility command for bridge probes that add a non-human player.
29 | |      AddPlayer { id: u64, name: String },
   | |      ----------------------------------- the second-largest variant contains at least 32 bytes
...  |
40 | |      GetState,
41 | |  }
   | |__^ the entire enum is at least 840 bytes
   |
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#large_enum_variant
   = note: `#[warn(clippy::large_enum_variant)]` on by default
help: consider boxing the large fields or introducing indirection in some other way to reduce the total size of the enum
   |
26 -         params: StartGameParams,
26 +         params: Box<StartGameParams>,
   |

warning: `civ-engine` (test "bridge_add_player") generated 1 warning
warning: `civ-engine` (test "data_civilizations") generated 1 warning
    Finished `dev` profile [unoptimized] target(s) in 18.38s
EXIT=0
```

### 1c. `cargo test --offline --all-targets` (PRZED)

Wynik: `EXIT=0`. Dosłowne linie `test result` (33 binarki, `grep -E '^test result'`):

```
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

Suma: **260 passed, 0 failed**. Dispatch szacował 256; faktyczna baza to 260 (rozbieżność ujawniona, nie zmieniana).

## 2. Zmiany (commit `c6a548c7`)

1. `rustfmt --edition 2021` uruchomiony WYŁĄCZNIE na 6 plikach z allowlisty (nie `cargo fmt --all`).
   Realnie zmienione: `civilizations.rs`, `economy_society.rs`, `terrain_map.rs`.
2. `civilizations.rs`: usunięty `#![allow(dead_code)]` (linia 3). Lint `duplicated_attributes` wskazywał na duplikat
   zewnętrznego `#[allow(dead_code)]` na `mod civilizations` w `tests/data_civilizations.rs:5` (plik testu poza allowlistą, nietknięty).
   Po usunięciu: brak nowego `dead_code` w `cargo clippy --all-targets` (lib i testy) — potwierdzone w sekcji 3b.

Weryfikacja bez zmian semantyki:
- `git diff -w --stat 914eec6b c6a548c7 -- rust-port/engine/src/data`:
  ```
   rust-port/engine/src/data/civilizations.rs   | 5 ++---
   rust-port/engine/src/data/economy_society.rs | 6 ++++--
   rust-port/engine/src/data/terrain_map.rs     | 3 +--
   3 files changed, 7 insertions(+), 7 deletions(-)
  ```
- `git diff -w 914eec6b c6a548c7 -- rust-port/engine/src/data | grep -E '^[-+][^-+]'`:
  ```
  -#![allow(dead_code)]
  -pub const DIPLOMACY_ACCEPTANCE_POINTS_JSON: &str = include_str!("../../data/diplomacy-acceptance-points.json");
  +pub const DIPLOMACY_ACCEPTANCE_POINTS_JSON: &str =
  +    include_str!("../../data/diplomacy-acceptance-points.json");
  -    pub budynek_kamieniarski_bonus_kamienia_civ: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
  +    pub budynek_kamieniarski_bonus_kamienia_civ:
  +        EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
  -    pub budynek_garncarnia_bonus_zywnosci_lokalnie: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
  +    pub budynek_garncarnia_bonus_zywnosci_lokalnie:
  +        EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
  -pub const TERRAIN_IMPROVEMENTS_JSON: &str =
  -    include_str!("../../data/terrain-improvements.json");
  +pub const TERRAIN_IMPROVEMENTS_JSON: &str = include_str!("../../data/terrain-improvements.json");
  ```
  Zmiany semantyczne: brak. Jedyna zmiana nie-biała to usunięcie linii `#![allow(dead_code)]`. Różnica `-w` pokazuje też usunięcie pustej linii w `civilizations.rs:1303` (whitespace-only, poza `-w` widoczne tylko w pełnym diffie).
- `git diff --check 914eec6b c6a548c7` → EXIT=0 (czysto).

## 3. Stan PO (commit `c6a548c7`, surowe wyniki)

### 3a. `rustfmt --check` (6 plików z allowlisty)

```
EXIT=0
```

### 3b. `cargo clippy --all-targets` (PO)

```
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_29ac35b4-c5a-3/rust-port/engine)
warning: large size difference between variants
  --> tests/../src/bridge.rs:22:1
   |
22 | /  pub enum EngineCommand {
23 | |      /// Start a fresh deterministic session from the wizard DTO.
24 | |/     CreateSession {
25 | ||         #[serde(default)]
26 | ||         params: StartGameParams,
27 | ||     },
   | ||_____- the largest variant contains at least 840 bytes
28 | |      /// Compatibility command for bridge probes that add a non-human player.
29 | |      AddPlayer { id: u64, name: String },
   | |      ----------------------------------- the second-largest variant contains at least 32 bytes
...  |
40 | |      GetState,
41 | |  }
   | |__^ the entire enum is at least 840 bytes
   |
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#large_enum_variant
   = note: `#[warn(clippy::large_enum_variant)]` on by default
help: consider boxing the large fields or introducing indirection in some other way to reduce the total size of the enum
   |
26 -         params: StartGameParams,
26 +         params: Box<StartGameParams>,
   |

warning: `civ-engine` (test "bridge_add_player") generated 1 warning
    Finished `dev` profile [unoptimized] target(s) in 13.99s
EXIT=0
```

Ostrzeżenie `duplicated attribute` zniknęło (w 1b były dwa ostrzeżenia `generated 1 warning`: `data_civilizations` i `bridge_add_player`; w 3b pozostał jeden, `bridge_add_player`).

`duplicated attribute` zniknęło. Pozostało jedno ostrzeżenie poza allowlistą (`bridge.rs:22`, P3.4c) — NIE naprawiane.

### 3c. `cargo clippy --all-targets -- -D warnings` (PO, informacyjnie)

```
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_29ac35b4-c5a-3/rust-port/engine)
error: large size difference between variants
  --> tests/../src/bridge.rs:22:1
   |
22 | /  pub enum EngineCommand {
23 | |      /// Start a fresh deterministic session from the wizard DTO.
24 | |/     CreateSession {
25 | ||         #[serde(default)]
26 | ||         params: StartGameParams,
27 | ||     },
   | ||_____- the largest variant contains at least 840 bytes
28 | |      /// Compatibility command for bridge probes that add a non-human player.
29 | |      AddPlayer { id: u64, name: String },
   | |      ----------------------------------- the second-largest variant contains at least 32 bytes
...  |
40 | |      GetState,
41 | |  }
   | |__^ the entire enum is at least 840 bytes
   |
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#large_enum_variant
   = note: `-D clippy::large-enum-variant` implied by `-D warnings`
   = help: to override `-D warnings` add `#[allow(clippy::large_enum_variant)]`
help: consider boxing the large fields or introducing indirection in some other way to reduce the total size of the enum
   |
26 -         params: StartGameParams,
26 +         params: Box<StartGameParams>,
   |

error: could not compile `civ-engine` (test "bridge_add_player") due to 1 previous error
warning: build failed, waiting for other jobs to finish...
EXIT=101
```

Wynik: EXIT=101 wyłącznie przez `bridge.rs:22` (poza allowlistą). Bramka CI `cargo clippy --all-targets -- -D warnings` (`.github/workflows/rust-engine.yml`) NIE jest zielona — patrz sekcja 5.

### 3d. `cargo test --offline --all-targets` (PO)

Polecenie: `cargo test --offline --all-targets; echo EXIT=$?` → `EXIT=0`.
Porównanie per binarka (`grep -E '^test result' | awk '{print $4,$6}'`, baza vs po): **IDENTICAL-PER-BINARY** (33 binarki, każda ta sama liczba passed/failed).
Suma po zmianie: **260 passed, 0 failed** = baseline.

## 4. Ostrzeżenia poza allowlistą (nienaprawiane)

- `rust-port/engine/src/bridge.rs:22` — `large_enum_variant` (P3.4c, domena `domain/**` + `bridge.rs`). Nie naprawiane zgodnie z allowlistą.

## 5. Stan bramek CI (`.github/workflows/rust-engine.yml`) po tej zmianie — NIE zielone

Ten temat domyka WYŁĄCZNIE allowlistę `src/data` (6 plików). Dwie bramki CI pozostają czerwone z przyczyn POZA zakresem:

1. `Format check`: `cargo fmt --all -- --check` (krok CI L45) — EXIT=1 w `c6a548c7`. Diffy w plikach testów spoza allowlisty:
   ```
   tests/data_buildings_tech.rs:12
   tests/data_civilizations.rs:7
   tests/data_civilizations.rs:60
   tests/data_economy_society.rs:9, :17, :25, :33, :41, :58, :66, :74
   tests/data_units_combat.rs:19, :61, :99, :131, :170
   ```
   (`cargo fmt --all -- --check --color never` → EXIT=1, 16 bloków `Diff in`; wszystkie w `tests/**`, poza allowlistą.) Naprawa wymaga osobnego tematu z allowlistą `tests/**`.
2. `Clippy` (`cargo clippy --all-targets -- -D warnings`, krok CI L54) — EXIT=101 przez `bridge.rs:22` (sekcja 3c). Naprawa należy do P3.4c.

Zatem nazwanie tematu „higieną bramek CI" byłoby nadużyciem; prawdziwy zakres: higiena allowlisty `src/data`, bez zmiany zachowania.

## 6. Ryzyko procesowe: nagłówek `civilizations.rs`

Linie 1–2 pliku: `// GENEROWANE 1:1 z ksztaltu JSON na pinie edb8fb56 (gra/data/*.json) przez skrypt gen.py. / Nie edytowac recznie bez ponownego wygenerowania i testu round-trip.`
- `git ls-files` nie zawiera `gen.py`; `git log --all -- '*gen.py'` nie zwraca historii (sprawdzone w worktree).
- Commit `c6a548c7` edytuje `civilizations.rs` ręcznie (usunięcie `#![allow(dead_code)]`, re-wrap linii 1310 i pustej linii 1303).
- Skutek: nie da się zweryfikować, że regeneracja z generatora nie przywróci duplikatu atrybutu ani łamań linii. To ryzyko do decyzji właściciela pliku. Nagłówka nie zmieniano (poza zakresem tematu, brak narzędzia do regeneracji).

## 7. Informacyjnie: baseline

Dispatch podawał baseline 256 passed; zmierzona baza `914eec6b` to 260 passed (sekcja 1c). Liczba po zmianie identyczna (260).

## 8. Uwagi

- `rust-port/engine/Cargo.lock` powstał lokalnie przy `cargo` i jest NIEŚLEDZONY — NIE commitowany.
- Brak `target/` w worktree (CARGO_TARGET_DIR wskazuje na katalog współdzielony).
- Deploy/push: NIE WYKONANO.
