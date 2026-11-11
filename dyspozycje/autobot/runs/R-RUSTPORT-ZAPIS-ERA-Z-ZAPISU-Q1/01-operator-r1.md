STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-ERA-Z-ZAPISU-Q1 (poz. 6, epoka gracza; runda 1/5, Operator)
GOAL: loader wyprowadza epoke każdego właściciela z zapisanego stanu; parametr era_for_owner znika z produkcyjnego API.
ZMIANY/COMMIT: kod f558c4467 na gałęzi R-RUSTPORT-ZAPIS-ERA-Z-ZAPISU-Q1-wip/operator-r1 (baza fdd24d04a = origin/rust-port/parity-v2, SHA startu zapisany). Nie pushowano, nie integrowano.
  Allowlista (5 plików, wszystkie w allowliście lub dozwolona zmiana sygnatury):
  - rust-port/engine/src/domain/save_load.rs: pole `owner_eras` (serde skip), `SnapshotWire.gracze`, `owner_eras_from_save`, `owner_era_pairs`, `SaveSnapshot::owner_era`, `migrate_on_load()` bez parametru, `migrate_on_load_with_era_override` (tylko testy), `SaveMeta::owner_era_entries`, `SaveMeta::start_era_fallback`.
  - rust-port/engine/src/domain/zapis_loader.rs: `load_save_snapshot(text)` (bez `era_for_owner`).
  - rust-port/engine/tests/p6_zapis_era_zapisu.rs (nowy, 7 testów behawioralnych).
  - rust-port/engine/tests/p6_zapis_loader_migrate.rs: zmiana sygnatury wywołań, epoka wstrzykiwana przez `meta.ownerEraByOwner`.
  - rust-port/engine/tests/p6_zapis_migracje_snapshot_load.rs: zmiana sygnatury (`migrate_on_load(|..|)` -> `migrate_on_load_with_era_override(|..|)`), 8 wywołań, bez zmiany asercji.
  Źródła epoki (odpowiednik web `empireEpochForOwner`, `gra/src/main.ts:2069`):
  - ludzie: top-level `gracze[oid].era` (web `playerStateByHuman.era`), mają pierwszeństwo;
  - AI: `meta.ownerEraByOwner` (`[[ownerId, era]]`, web odczyt `main.ts:38414`).
  Brak wpisu: `start_era_fallback()` z `meta.newGameParams.epochId` (zelazo=3, braz=2, kamien=1, brak/nieznany=1). Zob. BLOKADY.
  Nie zmieniono: gra/**, WERSJE.md, Cargo.toml, Cargo.lock, origin/main.
TESTY:
  - cargo fmt --check: czysto (po rustfmt wyłącznie na zmienionych plikach).
  - cargo clippy --all-targets -- -D warnings: czysto (poprawka: zbędny lifetime w `owner_era_pairs`).
  - cargo test --lib: 28 passed, 0 failed.
  - cargo test --test p6_zapis_era_zapisu --test p6_zapis_loader_migrate --test p6_zapis_migracje_snapshot_load (EXIT): 7 + 4 + 10 passed, 0 failed, kod wyjścia 0.
  - git diff --check: czysto.
  Testy behawioralne: `human_era_from_save_gracze_drives_migration` (epoka 2 z zapisu => limit 2 => degradacja wodza 12), `ai_era_from_meta_owner_era_drives_migration`, `human_era_from_gracze_overrides_meta_owner_era`, `save_without_epoch_uses_documented_fallback_from_new_game_params`, `save_without_epoch_and_without_epoch_id_falls_back_to_one`, `malformed_epoch_entries_are_ignored_not_fatal`, `epoch_survives_reload_through_meta_roundtrip`; w `p6_zapis_loader_migrate.rs` testy wczytania przez `load_save_snapshot(text)` z epoką w danych zapisu.
BLOKADY:
  - Zapis nie niesie epoki w polu PlayerState/SaveSnapshot jako takiego: zidentyfikowano źródła grepem w web (`gracze[].era`, `meta.ownerEraByOwner`); Rust `GameStateDto`/`CivilizationDto` nie ma pola epoki (komentarz `save_migrations.rs` to potwierdza).
  - Fallback bez epoki: web bierze `player.era`/`gameStartEra()` z sesji; Rust nie ma sesji i używa wartości z newGameParams (lub 1). ODCHYLENIE udokumentowane w kodzie i tu. NIE_ZMIERZONO względem zachowania weba w praktyce.
  - Poza allowlistą, NIE zmieniano (wymaga osobnej decyzji/tematu): komentarz w `rust-port/engine/src/domain/replay.rs:37-38` (nadal mówi o otwartym długu źródła epoki), komentarz w `save_migrations.rs:13` ("epoka dostarczana przez wywołującego"), `save_migrations.rs` `demote_generals_over_limit`/`migrate_loaded_state` nadal przyjmują closure (to czyste API wewnętrzne; publiczny wejściowy punkt to już `load_save_snapshot`).
  - Serializacja: `owner_eras` jest pomijana (`serde(skip)`); zrodla pozostaja w `meta.ownerEraByOwner` (przez flatten `extra`), ale `gracze` nie jest emitowane przez Rust. Round-trip przez Rust nie zachowuje epoki ludzi w `gracze`. Nie dotyczy testów; do decyzji, czy Rust ma w ogóle emitować zapis w formacie weba.
  - Brak legacy `gracz` (pojedynczy obiekt, sprzed HOTSEAT-ETAP7) - nieobsłużony, epoka takiego zapisu = fallback.
RUNDY: 1/5 (Operator, runda 1); kolejny krok Evaluator.
NASTĘPNY KROK: Evaluator (Sonnet) na kodzie f558c4467, potem Final Control; integracja dopiero po FC przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
