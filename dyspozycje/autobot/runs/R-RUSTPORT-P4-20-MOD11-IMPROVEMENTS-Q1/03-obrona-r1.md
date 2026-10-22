STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1
GOAL: Przenieść paczkę MOD-11 do Rust 1:1 z webem `edb8fb56` (improvements, robloxImprovements z 24 BUILDERS i stosami, p2/p3a/p3b, kopalnie, droga, pastwisko, świnia, styleResources), koń z `unit_core`, drzewo `unit_core::model::UnitModel`, zgodność bitowa z uruchomionym webem.

ROLA: Obrona r1 (Opus 5.5 medium). Stan wyjściowy: `4a2bdea6` (Evaluator) → `4e96a7e8` → `acb1915e` → `bf59164b`.

ODPOWIEDZI NA ZARZUTY (`02-evaluator-r1.md`):
1. Z2 (15 `rbx*` + `addCyl` vs D-MOD-3 = B) — PRZYJMUJĘ. Przeniesione do `rust-port/renderer/src/models/improvements/roblox_legacy.rs` (`RbxLegacy`, `build_rbx_legacy[_into]`, `add_cyl`); helpery współdzielone z `roblox.rs` (`pub(super)`). Weryfikacja: kopia scratch `robloxImprovements.ts` + jedna linia `export {…}` (`tests/fixtures/improvements/legacy-export.txt`) → `legacy.json` (25 pełnych grafów). Pozostałe fixtury z tej kopii bajtowo identyczne z przebiegiem bez linii i z fixturami r1 (`cmp`). Wynik: 0 różnic bitowych/strukturalnych. Mutacje: 7 zabitych, 3 przeżyłe są równoważne (uzasadnienie w dokumencie §10.2).
2. Z1 (D-MOD-1 podane jako otwarte) — PRZYJMUJĘ. Podstawa poprawiona: D-MOD-1 rozstrzygnięte przez D-RR-8 = A (`LEDGER.md:123,127,128`). Kolizja D-MOD-1 ↔ D-MOD-3 = B nazwana `K-MOD11-1` na wzór `D-NM-17`, z pierwszeństwem D-MOD-1 jako decyzji szczegółowej. Zakres nieportowany bez zmian: `resources.ts`, `civ`/`minecraft`, klasyczny `switch`. Do potwierdzenia przez orkiestratora razem z `D-NM-17`.
3. Z6 (NIE_ZMIERZONO) — PRZYJMUJĘ. `gen.ts` sekcja 7 → `protokeys.json`, 12 kluczy: 10 rzuca wyjątek, 2 zwracają pustą grupę, zgodnie z pomiarem Evaluatora. Test `prototype_keys_documented_deviation` przypina odchylenie (Rust zawsze zwraca pustą grupę).

ZMIANY/COMMIT: commit Obrony w worktree `wf_abfb7ff0-c37-3` (SHA w odpowiedzi do orkiestratora; bez push). Pliki: `src/models/improvements/{roblox_legacy.rs (nowy), roblox.rs, mod.rs}`, `tests/improvements_web_parity.rs`, `tests/fixtures/improvements/{gen.ts, README.md, legacy.json, protokeys.json, legacy-export.txt}`, `dyspozycje/rust-port/p4/P4-20-MOD11-IMPROVEMENTS.md` (§0, §1 Z1/Z2/Z6, §2.2, §4, §6, §7, nowy §10), ten raport. `models.rs`, `lib.rs`, `Cargo.toml`, `Cargo.lock`, `gra/**` bez zmian. `git diff --check` czysty.

TESTY: fmt EXIT=0; clippy `-D warnings` EXIT=0, z `--features gpu` też EXIT=0; `cargo test --locked --all-targets` EXIT=0, 18 binarek ok, 0 porażek. `improvements_web_parity`: `models: cases=457: scalars=192046 bit_diff=0 struct_diff=0`; `proto keys: threw=10 empty=2 … bit_diff=0 struct_diff=0`; `data … 0`. Surowe logi w dokumencie §10.3.

BLOKADY: brak technicznych. Do decyzji orkiestratora: `K-MOD11-1` (razem z `D-NM-17`), odchylenie Z6, jeśli wymagane jest 1:1 także dla błędów JS. Bez zmian: skaner `jsmath_wiring.rs` (poza allowlistą; nowy plik ma 0 wywołań trygonometrii platformy), ocena wzrokowa NIE_ZMIERZONO.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (Opus 5.5 medium): odtworzyć `legacy.json`/`protokeys.json` według README, uruchomić bramki na commicie Obrony, rozstrzygnąć K-MOD11-1.
DEPLOY/PUSH: NIE WYKONANO
