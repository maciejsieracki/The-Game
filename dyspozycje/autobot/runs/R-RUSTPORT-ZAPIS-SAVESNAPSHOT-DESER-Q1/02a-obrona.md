STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-SAVESNAPSHOT-DESER-Q1
GOAL: SaveSnapshot bez publicznego Deserialize; wczytanie wylacznie przez migrujace sciezki (zapis_loader::load_save_snapshot, ReplayLog::load_json_with_migration_reports); brak osłabionych asercji.
ZMIANY/COMMIT: baza 8209c5575 (operator r3). Commit obrony: lokalny, bez push (SHA w raporcie orkiestratora). Zmienione pliki (allowlista r3): rust-port/engine/src/domain/save_load.rs (doctest compile_fail na SaveSnapshot), rust-port/engine/tests/p6_zapis_loader_migrate.rs (przywrocona asercja surowego zapisu), rust-port/engine/tests/p6_wire_war_state_snapshot.rs (komentarz). Cargo.lock nie commitowany.
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0 (dwukrotnie, w tym po finalnej zmianie); cargo test --lib 37 passed; cargo test --doc save_load 1 passed (compile_fail E0277); cargo test --doc replay 2 passed; 11 targetow integracyjnych (save_load, replay, p6_zapis_loader_migrate, p6_zapis_migracje_snapshot_load, p6_zapis_replay_migrate, p6_zapis_era_zapisu, p6_repin_wojna_2_r4_save, p6_repin_wojna_3_hook, p6_wire_war_state_snapshot, p6_zapis_erawar_save, p6_zapis_migracje_snapshot_flags): 71 passed, 0 failed, EXIT 0. Logi: /tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/obrona-r4/.
BLOKADY: brak. Jedna regresja wykryta w trakcie obrony (asercja JSON z bledna nazwa pola `isGeneral`) i naprawiona przed commitem; finalny stan przeszedl wszystkie bramki.
RUNDY: 4/5 (obrona r4 po zarzutach Evaluatora r3)
NASTEPNY KROK: Evaluator r4 i Final Control r4 na commicie obrony.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Z1. Usunieta asercja generals(&raw_loaded)==[10,11,12,20] w p6_zapis_loader_migrate.rs
PRZYJMUJE. Asercja zostala przywrocona bez prywatnego typu i bez publicznej surowej sciezki:
`general_ids_in_text(&text) == [10, 11, 12, 20]` (przed `load_save_snapshot`). Helper czyta `state.units[].is_general`
bezposrednio z tekstu JSON zapisu (bez deserializacji do SaveSnapshot i bez migracji), wiec sprawdza dokladnie to samo co
stara asercja: 4 wodzow w zapisie przed migracja. Asercja po migracji (`[10,11,20]`, `demoted_generals == [12]`) zostaje bez zmian.
Dowod: test `p6_zapis_loader_migrates_old_save_through_production_path` PASS (4/4 w binarce).
Uwaga: pierwsza wersja helpera uzywala klucza `isGeneral` (bledny, pole Rust to `is_general`); wykryte w bramce, poprawione, testy powtorzone.

### Z2. Brak doctestu compile_fail dla braku Deserialize na SaveSnapshot
PRZYJMUJE. Dodano doctest w doc-comment `SaveSnapshot` (save_load.rs), wzorowany na istniejacym dla ReplayLog/ReplayStep:
```
/// ```compile_fail,E0277
/// fn requires_deserialize<T: serde::de::DeserializeOwned>() {}
/// requires_deserialize::<civ_engine::domain::save_load::SaveSnapshot>();
/// ```
```
Kod bledu E0277 wymusza, ze doctest failuje z powodu brakujacej implementacji, a nie z innego bledu kompilacji. Ponowne dodanie
`Deserialize` na SaveSnapshot sprawi, ze doctest przestanie sie kompilowac-z-bledem i `cargo test --doc save_load` padnie.
Dowod: `cargo test --doc save_load` 1 passed.

### Z3a. Helpery decode_snapshot_* dodaja migrate_on_load do sciezek, ktore byly surowe
ODRZUCAM (dowod). Dispatch r1 GOAL i r2 wprost wymagaja: "testy ... przepiac na sciezke z migracja (nie usuwac asercji)". Zmiana
sciezki na migrujaca jest zamierzona. Wyjatek, ktory byl surowy celowo, to `p6_zapis_migracje_snapshot_load.rs` (helper
`decode_raw_snapshot_value`, bez `migrate_on_load`, testy same wywoluja `migrate_on_load_with_era_override_for_test`).
Wszystkie asercje w pozostalych plikach przechodza na sciezce z migracja (71/71 PASS), wiec przepiecie nie zmienilo ich wynikow.

### Z3b. Komentarz przy decode_snapshot_value w p6_wire_war_state_snapshot.rs odwoluje sie do decode_snapshot_str
PRZYJMUJE. Komentarz przepisany na opis faktycznej semantyki: "surowy wczyt przez `RawSnapshot`, potem `migrate_on_load`
(jak `zapis_loader::load_save_snapshot`)". Brak odwolania do nieistniejacej funkcji.

### Z4. Helpery decode_snapshot_* zduplikowane w 6 plikach testowych
ODRZUCAM jako blokujace (zgodnie z ocena Evaluatora: dlug stylistyczny, nieblokujacy). Wspolny modul testowy wymagalby nowego pliku
w tests/ (poza allowlista r3) albo zmiany `#[path]` we wszystkich plikach. Zostaje jako dlug do osobnego tematu. Nie blokuje kryteriow 1-4.

### Z5. Bramki odtworzone (potwierdzenie, nie zarzut)
PRZYJETE jako potwierdzenie. Bramki po obronie powtorzone: fmt, clippy, lib, doctesty, 11 targetow integracyjnych (patrz TESTY).
Rowniez `git grep` na `from_str::<SaveSnapshot>` / `from_value::<SaveSnapshot>` w rust-port: 0 trafien. Brak `Deserialize` dla
SaveSnapshot w save_load.rs (pozostale `derive(Deserialize)` dotycza innych typow).
