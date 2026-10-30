STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-2-Q1
GOAL: Runda 4 - pomiary niezalezne (weryfikator Python od zera z TS pinu dc8a3adc, mutacje, bramki z logami EXIT) dla kodu `edc7835c8` (raport Operatora-impl `c90304d00`).
ZMIANY/COMMIT: kod R4 nie zmieniony. Korekty tylko komentarzy/dokumentacji: `rust-port/engine/src/domain/battle_mode.rs` (opis pola `meta` byl nieaktualny), `rust-port/engine/tests/p6_repin_wojna_2_r4_save.rs` (komentarz liczby przypadkow `1.0`), `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-2.md` (podsekcja pomiarow). Nowe: `verify-r4-save-meta.py` + `verify-r4-save-meta.log`, logi `fmt/clippy/test-pomiary-r4*.log`. Commit: SHA w sekcji DEPLOY/PUSH (ponizej). Brak push.
TESTY:
- `cargo fmt --all -- --check` EXIT=0 (`fmt-pomiary-r4.log`)
- `cargo clippy --all-targets -- -D warnings` EXIT=0 (`clippy-pomiary-r4.log`)
- `cargo test --no-fail-fast` EXIT=0, 1634 passed / 0 failed (`test-pomiary-r4.log`); `p6_repin_wojna_2_r4_save` 5/5
- `git diff --check` czysty
- Weryfikator `verify-r4-save-meta.py` (`python3 -I`): meta 576 przypadkow, 0 rozbieznosci (restored=1: 96, autoOnly: 2); plannedMarches fromSave 900 przypadkow, 0 rozbieznosci; wyrazenia `main.ts:32378`, `:40819`, `:29056`, `:29058` i `battle-mode.ts:13` obecne w pinie. Log: `verify-r4-save-meta.log`, EXIT=0.
- Mutacje (po jednej, przywracanie `git checkout`, po kazdej drzewo czyste): MB1 `is_some()` - zabita tylko przez `p6_repin_wojna_2_r3_battle_mode` (test R4 podaje wartosc juz znormalizowana, wiec nie widzi tej galezi); MB2 `!= Some(true)` - zabita (r3 battle_mode); MB3 bez `isMe` - zabita (r4 + r3); MB4 restore przyjmuje dowolna wartosc - zabita (r3 + r4); MS1 pusty `attackUnitId` przechodzi - zabita (r4); MS2 `trunc` wersji - zabita (r4, 1.5 case); MS3 napis jako `destQ` - zabita (r4). 7/7 KILLED.
BLOKADY: brak
RUNDY: 4/5 (pomiary w tej samej rundzie; bez zmiany zakresu)
NASTEPNY KROK: Final Control rundy 4 na `c90304d00` (kod `edc7835c8` + korekty komentarzy z tego commitu), potem integracja do `rust-port/parity-v2`.
ZALOZENIA:
- Z-P4-1: korekty komentarzy nie zmieniaja zachowania; po nich ponownie PASS fmt/clippy/test (logi `*-pomiary-r4.log`).
- Z-P4-2: JSON nie rozroznia `1` i `1.0`; wektor `1` pokrywa oba (opis w tescie poprawiony).
NIE_ZMIERZONO / NASTEPNA-PARTIA:
- Typ `meta`, `plannedMarches` lub `autoMarch` niezgodny z obiektem/tablica (np. string, obiekt web dla `plannedMarches`) daje blad ladowania (serde), a nie normalizacje. Wynika z `Deserialize`, nie uruchomione empirycznie; web nie ma tu bledu (`saved.meta?.x`). Przy integracji z prawdziwymi zapisami web trzeba to rozstrzygnac (format Rust != web: Z-R4-3).
- `meta` nie zachowuje pol web spoza `battleModeSettingVersion` i `newGameParams` (np. `savedAt`, `label`) - round-trip przez Rust je gubi.
- Produkcyjny adapter wczytujacy `plannedMarches` do gry i wpiecie `player_battle_automatic_only` pod sterowanie walka - nadal brak (jak w raporcie Operatora-impl).
DEPLOY/PUSH: NIE WYKONANO
