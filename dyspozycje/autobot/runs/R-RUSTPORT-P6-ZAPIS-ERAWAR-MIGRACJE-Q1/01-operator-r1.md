STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-ZAPIS-ERAWAR-MIGRACJE-Q1
GOAL: Dług #8 (MULTIWAR-2): zapis/odczyt liczników wojen epoki 1:1 z webem (recordEraForcedWarParticipation, rebuildEraWarCountsFromActivePairs, restoreEraWarCounts; web war-rules-multiwar.ts:241-281, main.ts:35745, :44950-44959). Stary zapis bez pola odbudowuje licznik z aktywnych par; zapis z polem przywraca go bit-w-bit.
ZMIANY/COMMIT: 5506a554bc3ad094e63adb4241ea0b3dbedfd55f (kod + testy + tabela; refs/keep/R-RUSTPORT-P6-ZAPIS-ERAWAR-MIGRACJE-Q1-op1). Baza: detached 0fd287721 (parity-v2).
  Allowlista: rust-port/engine/src/domain/diplomacy_multiwar.rs (nowe funkcje na końcu pliku, `use serde_json::Value`), rust-port/engine/src/domain/save_load.rs (pole `warRulesEraWarCountByCiv` w SaveMeta: with_era_war_counts / era_war_count_by_civ), rust-port/engine/tests/p6_zapis_erawar_counts.rs (10 testów), rust-port/engine/tests/p6_zapis_erawar_save.rs (5 testów), rust-port/engine/tests/p6_zapis_erawar_data/zapis.json (26 wektorów z uruchomionego weba), dyspozycje/rust-port/p6/P6-ZAPIS-ERAWAR.md (tabela symboli, pomiar, założenia). Nie dotknięto gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri, data/, domain/mod.rs.
TESTY:
  - cargo fmt -- --check: OK
  - cargo clippy --all-targets -- -D warnings: OK
  - cargo test --no-fail-fast: 303 binarek (lib + 302 tests/*.rs), 0 failed, 0 nowych #[ignore]; p6_zapis_erawar_counts 10/10, p6_zapis_erawar_save 5/5
  - cargo test --doc: 0 passed, 0 failed
  - Wektory: generator Node 22.22 (--experimental-strip-types) na prawdziwych funkcjach weba z origin/main 679ab078a; jedyny patch to import JSON -> readFileSync.
  - Baseline przed zmianą per binarka: NIE_ZMIERZONO (zmiany addytywne; wszystkie binarki zielone po zmianie).
  - Mutacje: NIE_ZMIERZONO.
BLOKADY:
  - Runtime licznik i aktywne pary (rejestry bronze/stone/iron ForceWar) nie istnieją w Rust; wywołania record przy wypowiedzeniu wojny i wiązanie z main.ts NIE są portowane (POZA ZAKRESEM tematu, dług ERAIGN). Caller musi podać aktywne pary.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) na tym samym ID; następnie Final Control. Dyskusyjne założenia do akceptacji: patrz niżej.
DEPLOY/PUSH: NIE WYKONANO

ZAŁOŻENIA / ODSTĘPSTWA (do akceptacji):
1. ODSTĘPSTWO: liczniki i64 (sygnatury r2 `era_war_count_for`/`can_civ_join_era_forced_war` nie mogą się zmienić w tym temacie: testy p6_dyplo_multiwar_gates poza allowlistą). Odczyt POMIJA wpisy z ułamkiem; web zachowałby np. 1.5. Zapis web nie produkuje ułamków (inkrement o 1), więc nie dotyczy zapisów webowych. Brak wektora dla tego przypadku.
2. Bramka zapisu `isWarRulesMultiwarEnabled()` (web zapisuje pole tylko przy fladze ON) należy do wołającego budującego zapis; SaveMeta jej nie sprawdza. Odczyt nie sprawdza flagi (jak web).
3. `epochOf` zawsze zwraca liczbę (web dla nieznanego ownera dałby klucz "id:undefined"; w grze nie występuje).
4. Pole `warRulesEraWarCountByCiv` trzymane jako surowy JSON (jak battleModeSettingVersion), więc zły typ nie unieważnia całego bloku meta. Zły typ = traktowany jak brak = odbudowa z aktywnych par.
5. Ścieżka: dispatch podał rust-port/engine/src/save_load.rs; faktycznie rust-port/engine/src/domain/save_load.rs (tam były też testy ścieżkowe #[path]).
6. Kolejność wpisów zachowana (EraWarCounts = wektor z semantyką Map.set), więc zapis z odczytu jest identyczny z zapisem źródłowym.
7. Sparse checkout (rust-port, dyspozycje) i CARGO_TARGET_DIR w worktree; po bramkach usunięto target/ i wygenerowany rust-port/engine/Cargo.lock (plik nie jest śledzony w tym crate).
