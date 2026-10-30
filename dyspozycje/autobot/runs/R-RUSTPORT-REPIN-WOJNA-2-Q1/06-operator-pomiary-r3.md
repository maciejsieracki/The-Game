# R-RUSTPORT-REPIN-WOJNA-2-Q1 - Operator-pomiary (runda 3), raport

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-2-Q1
GOAL: REPIN-WOJNA-2 (pin `dc8a3adc`), weryfikacja niezalezna zakresu rundy 3 z commita Operatora-impl `6ee3141a7`: planned-march `generalTargetId` (save/load), logika battle-mode z zapisem, domkniecie NaN z R2. Temat pozostaje OTWARTY (brak `meta.battleModeSettingVersion` w `save_load.rs`).
ZMIANY/COMMIT: baza `6ee3141a7` (detached). Zmiany tylko dokumentacyjne i logi: `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-2.md` (sekcja „Weryfikacja niezalezna R3"), katalog runu (`06-operator-pomiary-r3.md`, logi `*-pomiary-r3*`, `mut-pomiary-r3-*.log`, `vectors-regen-pomiary-r3.log`). Kod Rust NIE zmieniony. SHA: patrz `git log -1` tej galezi.
TESTY:
- `cargo fmt --all -- --check`: EXIT=0 (`fmt-pomiary-r3.log`)
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`clippy-pomiary-r3.log`)
- `cargo test --no-fail-fast`: EXIT=0, 220 wierszy `test result`, 1591 passed / 0 failed (`test-pomiary-r3.log`)
- `python3 -I verify-r3.py`: EXIT=0, nearest 400 (328 z NaN) 0 rozbieznosci; from-save 900, to-save 300, battle-mode 126, fails=0 (`verify-r3-pomiary.log`)
- Regeneracja wektorow z weba `dc8a3adc` (generatory z runu, uruchomione ponownie): `planned-march-general.json`, `battle-mode-restore.json`, `nearest-nan.json` identyczne bajt po bajcie z plikami w repo (`vectors-regen-pomiary-r3.log`)
- Mutanty na galeziach R3, wszystkie zabite: PM3, PM4 (`generalTargetId` bez filtra niepustego), NM2 (`>=` w komparatorze), NM3 (NaN jak `>0`), NM4 (odwrocona detekcja runu), NM5 (`hp >= 0`), BM2 (`restored_setting_version` = `is_some`). Logi `mut-pomiary-r3-<ID>.log`. Po kazdym pliku przywrocono oryginal (asercja rownosci).
- Przeglad zgodnosci z TS pinu: `planned-march.ts:426-490`, `battle-mode.ts:9-14`, `main.ts:29052-29060`, `main.ts:40819-40821`, `generals.ts:76-82`: zgodne.
BLOKADY: `meta.battleModeSettingVersion` w zapisie nie wykonane (zmiana formatu SnapshotV2, poza zakresem tej rundy). Wpiecie `player_battle_automatic_only` i planned-march w zapis/odczyt gry: nie wykonane.
UWAGI (nowe):
1. Funkcje R3 (`planned_marches_from_save/to_save`, `restored_setting_version`, `player_battle_automatic_only`) nie maja wywolan produkcyjnych, tylko testy. „PORTOWANE" w dossier oznacza funkcje czyste.
2. Z-P-1 (ZALOZENIE): kolejnosc kluczy JS dla identyfikatorow calkowitoliczbowych w `plannedMarches` moze sie roznic od kolejnosci `Map`; identyfikatory produkcyjne NIE_ZMIERZONO.
3. Z-R3-1 (rostery >= 64, sortowanie V8) NIE_ZMIERZONO.
RUNDY: 3/5 (ten sam numer co Operator-impl; ta runda to weryfikacja tej samej rundy). Ostatni werdykt: brak.
NASTEPNY KROK: osobna partia: `meta.battleModeSettingVersion` (zapis `_battleModeSettingVersion`, odczyt przez `restored_setting_version`) w `save_load.rs`, wpiecie `player_battle_automatic_only` i planned-march w zapis/odczyt gry. Potem zamkniecie tematu.
DEPLOY/PUSH: NIE WYKONANO
