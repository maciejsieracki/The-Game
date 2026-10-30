STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-2-Q1
GOAL: Runda 4 (zakres z dispatchu): (1) meta.battleModeSettingVersion zapis+odczyt; (2) wpiecie plannedMarches i playerBattleAutomaticOnly w zapis/odczyt (logika); (3) wektory z weba dc8a3adc, mutacje, weryfikacja niezalezna.
ZMIANY/COMMIT: commit kodu `edc7835c8` (baza: parity-v2 `aceeeb87f`, detached). Allowlista: `rust-port/engine/src/domain/save_load.rs`, `rust-port/engine/tests/save_load.rs` (addytywnie), `rust-port/engine/tests/p6_repin_wojna_2_r4_save.rs` (nowy), `rust-port/engine/tests/p6_repin_wojna_2_r4_vectors/save-meta.json` (nowy, 93 KB), `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-r4-save-meta.mjs` (nowy), `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-2.md` (sekcja Runda 4). Zero zmian w `gra/**`, `renderer`, `src-tauri`, `Cargo.toml`, `WERSJE.md`, `replay.rs`. Nie scalono ani nie pushowano.
TESTY:
- `cargo fmt --all -- --check` EXIT=0
- `cargo clippy --all-targets -- -D warnings` EXIT=0
- `cargo test --no-fail-fast` EXIT=0, 1634 passed / 0 failed (baza 1629 + 5 nowych)
- nowe: `p6_repin_wojna_2_r4_save` 5/5 (wektory meta 576 przypadkow; brak pol R4 w starym zapisie; round-trip; nie-konforemne wartosci; plannedMarches z wektorow r3 fromSave 900 przypadkow, 254 z autoMarch, przez zapis->odczyt)
- wektory: `save-meta.json` wygenerowane z `battle-mode.ts` @ dc8a3adc uruchomionego w Node v22.22 (`--experimental-strip-types`); wyrazenia `main.ts:40819-40821` i `:29052-29060` odtworzone 1:1 i sprawdzone obecnoscia w `main.ts` (skrypt przerywa, gdy brak)
- mutacje (7/7 KILLED): MB1 `setting_version.is_some()`; MB2 `manual != Some(true)`; MB3 bez `isMe`; MB4 restore przyjmuje dowolna wartosc; MS1 pusty `attackUnitId` przechodzi; MS2 `trunc` wersji; MS3 napis jako `destQ`
- po mutacjach pliki przywrocone (`cmp` OK)
BLOKADY: brak
RUNDY: 4/5 (zgodnie z dispatchem; wpis `RUNDA 4/5`)
NASTEPNY KROK: Evaluator/Final Control rundy 4 na `edc7835c8`; potem integracja do `rust-port/parity-v2`.
ZALOZENIA (luki rozstrzygniete zalozeniem):
- Z-R4-1: `save_load.rs` nie importuje `battle_mode.rs` (replay.rs path-laduje save_load bez battle_mode, a replay.rs jest poza allowlista). Normalizacja `=== 1` i `playerBattleAutomaticOnly` skladane w wywolujacym; w tescie `restored`/`auto_only`.
- Z-R4-2: `Eq` na `SaveSnapshot` zachowany dzieki `serde_json::Number` w polach `destQ/destR` (bez `f64`).
- Z-R4-3: `plannedMarches` zapisywane jako tablica wpisow `{unitId,...}` (nie obiekt jak w web); kolejnosc = kolejnosc zapisu. Obiekt web nie jest odtwarzany 1:1.
- Z-R4-4: `newGameParams` zachowane jako surowy JSON; `battleAlwaysManual` czytane tylko z `advanced.battleAlwaysManual`.
NIE_ZMIERZONO / NASTEPNA-PARTIA:
- Produkcyjny adapter (Tauri/main) wczytujacy `plannedMarches` do stanu gry: brak w repo; `planned_marches_from_save` wywolywany tylko z testu.
- `player_battle_automatic_only` nie jest podpiete pod sterowanie walka gry (UI/bitwa).
- Wartosci web NaN w pamieci nie sa modelowane (JSON zamienia je na null -> None).
- Generator nie uruchamia `main.ts` (plik zbyt duzy do wyizolowania); wyrazenia sa ekstraktem z cytowanych linii.
- Wektory R3 `battle-mode-restore.json` nie zostaly ponownie wygenerowane w tej rundzie (generator R3 `gen-repin-wojna-2-r3-battle-mode.mjs` jest w repo; nie uruchamiany).
UWAGA O NUMERACJI: polecenie zlecenia podawalo „Runda 1/5” i plik `01-operator-r1.md`, ale ten plik istnieje juz na gałęzi (runda 1) i dispatch podaje RUNDA 4/5. Dlatego zapisano `01-operator-r4.md`, bez nadpisywania historii.
DEPLOY/PUSH: NIE WYKONANO
