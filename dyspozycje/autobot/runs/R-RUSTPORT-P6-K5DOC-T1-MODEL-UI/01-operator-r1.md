STATUS: BLOCK (INFRA) — jedna bramka niewykonana: `cargo test --all-targets --no-fail-fast` (dysk 7,7 GB < 8 GB z dispatchu). Pozostałe bramki i mutacje: zielone.
DOMAIN: INFRA (bramka pełnego testu), GAME (model doktryny)
TEMAT: R-RUSTPORT-P6-K5DOC-T1-MODEL-UI (runda 1, Operator)
GOAL: Port modelu konfiguracji doktryny grupy po stronie domeny, bez UI: typ `GroupDoctrine`, meta grupy z domyślną wartością, `ensure_group_meta` (idempotentnie), `set_group_doctrine` (walidacja napisu). Wykonanie kroku doktryny (`_executeGroupDoctrineStep`) poza zakresem (#264).
BAZA: `origin/rust-port/parity-v2` = `760be5187` (worktree detached, potem gałąź wip).
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`: `type GroupDoctrine` (l. 1938), `_ensureGroupMeta` (17586-17593, domyślne `steady`/`autoPlay: true` w l. 17589), `_setGroupDoctrine` (17864-17929, część modelu: `autoPlay = doctrine != manual`, l. 17866-17878).

ZMIANY/COMMIT:
- NOWY `rust-port/engine/src/domain/siege_tactics_doctrine_model.rs`: `DEFAULT_GROUP_DOCTRINE`, `doctrine_str`, `GroupDoctrineMeta` (Default = steady/true), `UnknownDoctrine`, `GroupDoctrineTable` z `get`, `ensure_group_meta`, `set_group_doctrine`, `len`, `is_empty`.
- `rust-port/engine/src/domain/mod.rs`: +1 linia `pub mod siege_tactics_doctrine_model;`.
- NOWY `rust-port/engine/tests/p6_k5doc_t1.rs` (13 testów).
- NOWY `rust-port/engine/tests/p6_k5doc_t1_gen.mjs` (generator: wykonuje tekst pina przez TypeScript, straże linii, skróty SHA-256 wycinków).
- NOWY `rust-port/engine/tests/p6_k5doc_t1_vectors/vectors.json` (wygenerowany z pina).
- NOWY `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T1-MODEL-UI/01-operator-r1.md` (ten raport).
- Commit: SHA w sekcji DEPLOY/PUSH poniżej (commit lokalny, bez push).

DECYZJE TECHNICZNE (orkiestrator, do REJESTR-RUST):
- D-T1-1: `GroupDoctrine` reużyty z `siege_tactics_doctrine_state` (ma już `parse`). Nie dodawano czwartej kopii enumu. Uwaga: w repo istnieją jeszcze dwie kopie (`player_order_move_gate.rs`, `siege_tactics_doctrine_state.rs`); ujednolicenie to osobny temat porządkowy, poza allowlistą.
- D-T1-2: zakres `set_group_doctrine` = walidacja + `doctrine` + `autoPlay`. Efekty uboczne pinu (formacja, `rallyCol/rallyRow`, flagi skirmish, kolejka rozkazów, komunikaty) NIE są portowane w T1; należą do #264 / K5EXEC.
- D-T1-3: przy błędzie walidacji meta NIE jest tworzona (pin nie ma walidacji — TypeScript zawęża typ; w Rust napis wejściowy jest walidowany).

TESTY (katalog `rust-port/engine`, `CARGO_TARGET_DIR` w scratchpadzie, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`):
- `cargo fmt --check -p civ-engine`: EXIT 0 (po rustfmt na nowych plikach).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --test p6_k5doc_t1`: EXIT 0, 13/13 zielonych.
- Mutacje (każda na osobnej kopii, przywrócenie z kopii i `cmp` OK):
  - (a) domyślna doktryna `Defensive` zamiast pina `Steady`: EXIT 101, FAIL 2 testy (`domyslna_doktryna_grupy_zgodna_z_pinem`, `ensure_tworzy_brakujaca_mete_z_domyslna_doktryna_z_wektora`). Wynik: PASS wymagany FAIL — spełnione.
  - (b) `ensure_group_meta` nadpisuje istniejącą metę: EXIT 101, FAIL 1 test (`ensure_jest_idempotentne_i_nie_nadpisuje_istniejacej_mety`). Spełnione.
  - (c) walidacja pomija `skirmish`: EXIT 101, FAIL 4 testy (`set_zapisuje_kazda_z_pieciu_wartosci_zgodnie_z_wektorem`, `set_akceptuje_kazdy_z_pieciu_wariantow_bez_wyjatku_walidacji`, `set_sekwencja_zgodna_z_pinem`, `set_nieznana_wartosc_nie_nadpisuje_istniejacej_mety`). Spełnione.
- Po przywróceniu: `cargo test --test p6_k5doc_t1` EXIT 0, 13/13; plik modelu zgodny z kopią (`cmp` OK).
- `cargo test --all-targets --no-fail-fast`: NIE WYKONANO. Powód: `df -h /` = 7,7 GB wolnego (dispatch wymaga ≥ 8 GB przed bramkami). Zmierzono 8,4 GB na starcie sesji, ale NIE mierzono ponownie przed bramkami targetowanymi i mutacjami (uchybienie procesowe, ujawnione tutaj). Pełny test NIE został uruchomiony, żeby nie zejść dalej z dyskiem poniżej progu.
- Sprzątanie: `CARGO_TARGET_DIR` tematu usunięty po bramkach (do wyjaśnienia w DEPLOY/PUSH).

BLOKADY:
- Pełny `cargo test --all-targets` (bramka 3 z dispatchu) — INFRA, dysk 7,7 GB < 8 GB. Do wykonania w kolejnej rundzie (ten sam ID, DODATEK r2) po zwolnieniu dysku.
- Brak blokad merytorycznych.

RUNDY: 1/5 (wynik: BLOCK INFRA na bramce pełnego testu; kod kompletny i zielony na bramkach celowanych).

NASTĘPNY KROK: runda 2 (DODATEK r2 do dispatchu) — uruchomić `cargo test --all-targets --no-fail-fast` przy ≥ 8 GB, zapisać EXIT. Potem FC. Integracja: #264 (K5DOC-T8) zależy od tego modelu.

DEPLOY/PUSH: NIE WYKONANO (zgodnie z dispatchem: bez push do parity, bez integracji). Commit lokalny na gałęzi `rust-port-wip/R-RUSTPORT-P6-K5DOC-T1-MODEL-UI`. Trailer commitu: bez nazwy modelu (dispatch, decyzja #289).
