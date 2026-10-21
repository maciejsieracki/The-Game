# P3.8B — Trwała walidacja manifestu assetów (`rust-port/assets/MANIFEST.tsv`)

**Temat:** R-RUSTPORT-P3-8B-ASSET-MANIFEST-VALIDATION-Q1 · **Domena:** GAME · **Runda:** 1/5 (Operator)
**Baza:** `origin/rust-port/parity-v2` @ `1d53dcdb` (P3.8), detached HEAD; baza zawiera `rust-port/assets/MANIFEST.tsv` (429 linii = nagłówek + 428).
**Cel (GOAL):** bramka P3 „manifest assetów przechodzi walidację wobec web”. Jednorazowa weryfikacja P3.8 (428/428, blob-hash) zostaje zamieniona w trwały, powtarzalny test `rust-port/engine/tests/assets_manifest.rs`.

## Zakres

- Nowy plik: `rust-port/engine/tests/assets_manifest.rs` (13 testów).
- Nowy dokument: `dyspozycje/rust-port/p3/P3-8B-ASSET-MANIFEST-VALIDATION.md` (ten plik).
- Raport etapu: `dyspozycje/autobot/runs/R-RUSTPORT-P3-8B-ASSET-MANIFEST-VALIDATION-Q1/01-operator.md`.
- Zero zmian w `src/**`, `Cargo.toml`, `rust-port/assets/**`, `gra/**`. Bez nowych zależności (SHA-1 zaimplementowane ręcznie, walk przez `std::fs`).
- `Cargo.lock` i `target/` nie są commitowane.

## Co sprawdzają testy

| # | Test | Co weryfikuje |
|---|---|---|
| 1 | `manifest_has_header_and_428_data_rows` | nagłówek `blob_sha_edb8fb56 size_bytes source_web_path dest_rust_port_path`; 428 wierszy danych |
| 2 | `manifest_dest_paths_are_unique` | unikalność ścieżek docelowych, prefiks `rust-port/assets/` |
| 3 | `every_manifest_entry_exists_with_declared_size` | każda ścieżka istnieje, rozmiar w bajtach == kolumna rozmiaru |
| 4 | `every_entry_blob_sha1_matches_manifest_column` | `sha1("blob <len>\0" + bajty)` == kolumna SHA (428/428) |
| 5 | `no_files_outside_manifest_in_assets_dir` | rekurencyjny spacer: na dysku dokładnie 428 plików + `MANIFEST.tsv` |
| 6 | `counts_per_extension_match_p1_11` | svg 307, json 8, css 4, jpg 45, png 2, mp3 62 |
| 7 | `byte_sums_per_category_match_p1_11` | kategorie i sumy bajtów zgodne z P1.11 §2 (patrz niżej) |
| 8 | `sha1_matches_known_vectors` | samotest implementacji SHA-1 (wektory FIPS 180-4, `git blob` pustego pliku) |
| 9 | `negative_validator_rejects_wrong_size` | mutacja: zły rozmiar → dokładnie 1 błąd |
| 10 | `negative_validator_rejects_missing_file` | mutacja: brakujący plik → dokładnie 1 błąd |
| 11 | `negative_validator_rejects_duplicate_dest` | mutacja: duplikat ścieżki → dokładnie 1 błąd |
| 12 | `negative_validator_rejects_wrong_sha` | mutacja: zły SHA → dokładnie 1 błąd (przy prawdziwych wpisach 0 błędów) |
| 13 | `negative_parser_rejects_bad_header_and_columns` | zły nagłówek i wiersz z 3 kolumnami są odrzucane |

Testy negatywne (9–13) mają kontrolę pozytywną w tym samym teście, więc walidator nie jest „zawsze zielony” i nie jest „zawsze czerwony”.

## Źródła liczb (weryfikacja, nie przepisywanie)

Liczby w teście pochodzą z `dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md` (katalog na gałęzi dokumentacyjnej `claude/sprawdzenie-funkcjonalnosci-ek4ra0`), §2 „Kategorie — pliki, liczba, rozmiar”:

| Kategoria w teście | Wiersz §2 | Pliki | Bajty |
|---|---|---:|---:|
| icons (SVG 307 + JSON 8 + CSS 4) | wiersz 26 (SVG 108 231 B) + wiersz 27 (JSON/CSS 27 945 B) | 319 | 136 176 |
| portraits (JPG) | wiersz 28 | 45 | 445 951 |
| hero (PNG) | wiersz 29 | 2 | 4 214 674 |
| music (MP3 aktywne 59 + wykluczone 3) | wiersz 31 (42 350 853 B) + wiersz 32 (2 233 830 B) | 62 | 44 584 683 |

Suma 428 = 307 + 12 + 45 + 2 + 62; §2 podaje 441 plików, z czego 10 `.ts` i 3 `README.md` nie są assetami runtime (poza zakresem manifestu). Cztery kategorie są wyczerpujące: fonty, modele 3D i SFX jako pliki mają 0 wpisów (P1.11 §5), co test 7 sprawdza przez `sums.len() == 4`.

Niezależna weryfikacja przed napisaniem testu (skrypt Python `hashlib` poza repo, plus `git hash-object` na pliku testowym): 428/428 SHA zgodne, 428/428 rozmiary zgodne, ścieżki unikalne, 0 plików dodatkowych, 0 brakujących. `git hash-object rust-port/assets/icons/brand/units/unit-worker.svg` = `5437e0d4…` = `git rev-parse 1d53dcdb:rust-port/assets/icons/brand/units/unit-worker.svg`.

## Wynik

- Rozbieżności manifestu wobec katalogu: **brak**. Test 7 nie wykrył odchyleń; nic w `rust-port/assets/**` nie zostało zmienione.
- Baseline (przed zmianą, `origin/rust-port/parity-v2` @ `1d53dcdb`): **256 passed**, EXIT=0.
- Po zmianie: **269 passed** (256 + 13), 0 failed, EXIT=0.

### Surowy log (wklejony z terminala)

```
$ cd rust-port/engine && CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline --test assets_manifest; echo "EXIT=$?"
     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/debug/deps/assets_manifest-547aecae805379df)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test manifest_dest_paths_are_unique ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.65s
EXIT=0
```

Pełny `cargo test --offline` (ta sama konfiguracja, `CARGO_INCREMENTAL=0`), wynik skrócony do linii podsumowania:

```
$ cd rust-port/engine && CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline; echo "EXIT=$?"
test result: ok. 6 passed; ...   (lib)
... 31 binariów tests/*.rs bez zmian, wszystkie "ok", plus tests/assets_manifest.rs: "13 passed" ...
EXIT=0
suma "passed" = 269, "failed" = 0
```

Pełny log (surowy, bez skracania) w scratchpadzie orkiestracji, nie w repo. Uwaga: pierwsza próba pełnego przebiegu zakończyła się EXIT=101 z powodu `No space left on device` (dysk `/` 99% zajęty); patrz BLOKADY.

## Ograniczenia i uczciwość

- Hash-weryfikacja jest w teście (SHA-1 ręczny, opcja 5 dispatchu), więc nie trzeba polegać na `git hash-object` w CI.
- Test 4 czyta 49 MB plików; w buildzie debug trwa ok. 1,6 s.
- Ścieżki w teście są względne do `CARGO_MANIFEST_DIR` (`../assets`, `../..`), więc test działa tylko z układem repo rust-port/engine + rust-port/assets.
- Pliki wykluczone z gry (`_wykluczone/`) są w manifeście i w liczbach 62 MP3, zgodnie z P3-8 i P1.11 §2 wiersz 32.
