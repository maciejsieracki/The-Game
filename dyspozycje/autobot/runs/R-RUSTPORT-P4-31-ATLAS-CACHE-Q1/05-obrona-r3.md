STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-31-ATLAS-CACHE-Q1
GOAL: RR-T8d (P4-25 §6) w `rust-port/renderer`: klucze treści (port `cityMapBadgeKey` i pokrewnych, wektory z uruchomionego weba), cache LRU/refcount M2 z testem N tur, mipmapy CPU T7/T9/T11, skala DPI×LOD z limitem 2048, upload wgpu za cechą `gpu`, rejestr RR-T6 bez duplikacji.
ZMIANY/COMMIT: kod obrony `d850b6b86` (rodzic `95930b446` = `origin/rust-port/parity-v2`; lokalna gałąź `p431-obrona-r3-code`; bez push). Pliki: `rust-port/renderer/src/raster/atlas/cache.rs` (doc pkt 3 + test w module), `rust-port/renderer/tests/atlas_nturns.rs` (1 test), `rust-port/renderer/tests/fixtures/atlas/README.md` (zastrzeżenie wersji narzędzi). Dokumentacja (ten plik, `P4-31-ATLAS-CACHE.md` §3 wiersz LRU + §13, `dowody/16..18-obrona-r3-*`) — osobny commit na `afea15d17` (Evaluator r3); SHA w odpowiedzi Obrony. Bez zmian: `Cargo.toml`, `Cargo.lock`, `lib.rs`, `raster/mod.rs`, `assets/**`, `gra/**`, `rust-port/engine/**`, fixtury JSON i `SHA256SUMS`.
TESTY: `dowody/16-obrona-r3-gates.log` (drzewo = `d850b6b86`, czysty `CARGO_TARGET_DIR` poza repo, `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_{DEV,TEST}_DEBUG=0`, rustc 1.97.0): fmt EXIT=0; clippy CPU `-D warnings` EXIT=0; clippy `--features gpu` EXIT=0; `cargo test --locked --all-targets` EXIT=0 (468 passed, 0 failed, 0 ignored — liczba wyższa niż 305 u Evaluatora, bo baza to obecny parity); `--features gpu --test atlas_gpu --test gpu_probe` EXIT=0 (2 passed + 1 ignored z powodem; `SKIPPED: no GPU adapter`); mutant E12 → `end_of_turn_alone_keeps_the_key_index_bounded` FAILED, EXIT=101 (zabity); `git diff --check` EXIT=0; Cargo.toml/lock bez zmian. MSRV (`dowody/17-obrona-r3-msrv.log`): `cargo +1.87.0 test --locked --all-targets` EXIT=0 (468/0/0), `cargo +1.87.0 check --locked --all-targets --features gpu` EXIT=0.
BLOKADY: brak. Uwagi: zarzut 1 i 2 są procesowe (dla orkiestratora/FC); GPU i D3D11 nadal NIE_ZMIERZONO.
RUNDY: Obrona r3 (dodatek r3 dispatchu; Operator 2/5 + obrona).
NASTĘPNY KROK: Final Control R-RUSTPORT-P4-31-ATLAS-CACHE-Q1 na `d850b6b86` (= parity `95930b446` + obrona); potem integracja `d850b6b86` na parity (FF, jeśli parity się nie ruszył).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora r3

### 1. [PROCES] Kod na parity-v2 bez Evaluatora i FC; `a827fac07` zmienił atlas po integracji — PRZYJMUJĘ (fakt), uzupełniam pomiar

Fakt potwierdzony (`dowody/18-obrona-r3-parity-atlas-diff.log`): `1429ba434` i `5259741ab` są na first-parent `origin/rust-port/parity-v2` (`95930b446`). Integracji nie wykonał Operator (rola nie integruje) — to odstępstwo orkiestratora od obiegu Operator → Evaluator → FC → integracja; do zapisania w rejestrze. Obrona nie może go cofnąć; może zmierzyć stan na parity, czego Evaluator nie zrobił (NIE_ZMIERZONO):

- Różnica `5259741ab..parity` w ścieżkach atlasu (`src/raster/atlas/**`, `tests/atlas_*.rs`, `tests/fixtures/atlas/**`): wyłącznie
  - `a827fac07` (REPIN-3D-B2, własny obieg z FC `0eefb3a00` „Final Control R1 PASS”): `keys.rs` (+`ring_hex` w `OwnerEmblemContext`, `normalize_ring_hex`, klucz `civ:<civ>:<era>:<ring>`), `tests/atlas_keys.rs` (+`ring_hex: None`), `atlas_keys.json`/`SHA256SUMS`/`README.md` (regeneracja na `origin/main` `86d510c66`: zmienione tylko 304 `emblemKeys[].key`);
  - `8f5aa88d7` (REPIN-3D-B4): tylko `tests/fixtures/atlas/README.md`.
  - `cache.rs`, `mip.rs`, `scale.rs`, `upload.rs`, `gpu.rs`, `mod.rs`, `tests/atlas_{gpu,json,mip,nturns}.rs`, `atlas_gl.json`, generatory — bez zmian względem `5259741ab`.
  (Statystyka `src/raster/**` w logu obejmuje też `canvas.rs`, `image/emoji.rs`, `text/mod.rs` z P4.35 — to nie jest kod atlasu.)
- Bramki obrony (fmt, clippy CPU/gpu, pełny `cargo test`, MSRV) uruchomiłem na drzewie parity `95930b446` + obrona, więc obecny kod atlasu na parity (wraz z `ring_hex`) jest zmierzony: wszystkie EXIT=0, `atlas_keys` (w tym `related_keys_match_web` z regenerowaną fixturą) zielone.
- Dla FC: ocenić `d850b6b86`; różnica względem ocenianego `5259741ab` w atlasie = zmiany REPIN-3D-B2/B4 (ocenione w ich własnym obiegu) + obrona r3.

### 2. [ŚLAD AUDYTOWY] Brak `02-evaluator-r1.md` — PRZYJMUJĘ (fakt)

`git log --all -- …/R-RUSTPORT-P4-31-ATLAS-CACHE-Q1/02-evaluator-r1.md` = 0 commitów (`dowody/18-…log`). Nie tworzę pliku o tej nazwie — byłby to fałszywy ślad oryginału. Poniżej **REKONSTRUKCJA (nie oryginał)** zarzutów r1, wyłącznie z treści odpowiedzi Operatora (`03-operator-r2.md`, `P4-31-ATLAS-CACHE.md` §12); brzmienie, numeracja i ewentualne dalsze zarzuty r1 — NIE_ZMIERZONO:

| # r1 (wg odpowiedzi) | Treść zarzutu odtworzona z odpowiedzi | Odpowiedź r2 |
|---|---|---|
| 1 | test `upload_and_read_back_every_level` tworzy teksturę bez `COPY_SRC`, więc odczyt na GPU by padł | PRZYJĘTE (`READBACK_TEXTURE_USAGE`) |
| 2 | liczby w doc-komentarzach `mip.rs`/`upload.rs` niezgodne z testem i §4.2; błędny opis arytmetyki („`f64`”) | PRZYJĘTE |
| 3 | mutacja `ends_with` → `contains` w `purge_other_lod` przeżywa | fakt ODRZUCONY (na `d4d15f5e` zabita), wzmocnienie PRZYJĘTE |
| 4 | brak fixtury rozmiaru T7 w repo | PRZYJĘTE (512×168 sRGB) |
| 5 | `unpremultiply` dla `a = 0` niepokryte testem | PRZYJĘTE |
| E-31-1 | założenie Evaluatora r1 o mapowaniu ocen na pkt dispatchu | przyjęte przez Operatora |

Zalecenie dla orkiestratora: odnotować w rejestrze, że raport Evaluatora r1 nie został zapisany w repo (prawdopodobnie istniał tylko jako wynik agenta Workflow).

### 3. [DOWODY] Repro fixtur z r1; „bajt w bajt” bez zastrzeżenia — PRZYJMUJĘ

`tests/fixtures/atlas/README.md` (`d850b6b86`): identyczność bajtowa obowiązuje tylko przy tych samych wersjach narzędzi; `06-fixtures-repro.log` dotyczy plików rundy 1 (`64bba615…`/`6ff44618…`); pola metadanych `node` (`atlas_keys.json`) oraz `browser`, `userAgent` (`atlas_gl.json`) zmieniają SHA pliku przy innym node/Chromium, sekcje danych pozostają identyczne — co zmierzył Evaluator r3 na plikach r2 (`dowody/15-evaluator-r3-fixtures-regen.log`: node v22.23.4, Chromium 153.0.8010.12). Dopisane zalecenie: przy regeneracji innymi wersjami porównywać sekcje danych, nie SHA plików. README nie jest w `SHA256SUMS`, więc sumy bez zmian. Ponownie generatorów nie uruchamiałem (zrobił to Evaluator r3; obrona nie zmienia fixtur JSON).

### 4. [TEST] Mutant E12 przeżywa — PRZYJMUJĘ

Nowy test w module (`src/raster/atlas/cache.rs`, `#[cfg(test)] mod tests`, bo publiczne `keys()` filtruje po `inner` i nieaktualny indeks jest niewidoczny przez API): `end_of_turn_alone_keeps_the_key_index_bounded` — 500 tur, w każdej 2 nowe klucze (jeden trzymany jako „na ekranie” przez jedną turę, drugi puszczony od razu), wyłącznie `end_of_turn` (bez prune i purge). Po każdej turze `keys.len() == inner.len()` i `len() == 1`; na końcu po zwolnieniu wszystkiego indeks pusty i 0 żywych tekstur w `FakeGpu`. Z mutantem E12 (usunięte `keys.retain(...)` w `end_of_turn`) test pada na asercji „index == entries” (`cache.rs:422` w `d850b6b86`; `dowody/16-obrona-r3-gates.log`: FAILED, EXIT=101). Kod produkcyjny bez zmian (był poprawny; brakowało testu).

### 5. [OBSERWACJA] LRU RR-T6 bez `ref_count` → duplikat VRAM — PRZYJMUJĘ (doc + test), zmiana RR-T6 poza allowlistą

- Doc modułu `src/raster/atlas/cache.rs`, pkt 3: LRU (`assets/cache.rs`, `Cache::enforce_limits`) usuwa najstarszy wpis bez sprawdzania licznika odwołań, także teksturę widoczną; tekstura żyje dalej u posiadaczy, ale cache jej nie znajduje, więc następne `acquire` tego klucza maluje drugą teksturę o tej samej treści. Przy przypiętych teksturach ciasne LRU nie ogranicza pamięci GPU i może ją podwoić; ogranicznikiem M2 jest pkt 2 (prune / czyszczenie LOD), a domyślna polityka T14 to `CachePolicy::UNBOUNDED`.
- Test charakteryzujący `tests/atlas_nturns.rs::lru_eviction_of_a_shown_texture_duplicates_it`: `max_entries(1)`, miasto c1 = „Ateny”, c2 = „Sparta” (wyrzuca widoczne „Ateny” z cache: `evicted_lru == 1`, 2 żywe tekstury), c3 = „Ateny” → nowa tekstura (`handle` c1 ≠ c3) → **3 tekstury przy 2 kluczach na ekranie**; po zdjęciu c1 i `flush` zostają 2. Test utrwala obecne zachowanie RR-T6 i zacznie padać, gdy ktoś zmieni politykę eviction (wtedy trzeba go świadomie zaktualizować).
- `P4-31-ATLAS-CACHE.md` §3: wiersz LRU uzupełniony o zastrzeżenie (klucze unikalne per miasto).
- Ewentualna zmiana `enforce_limits` (pomijanie wpisów z `ref_count > 1`) wymaga osobnego tematu z allowlistą `src/assets/**` — propozycja dla orkiestratora, nie wykonana.

### 6. [NIE_ZMIERZONO] MSRV, GPU, D3D11 — PRZYJMUJĘ, MSRV domknięte

- MSRV 1.87: toolchain doinstalowany (`rustup toolchain install 1.87.0 --profile minimal`), `cargo +1.87.0 test --locked --all-targets` EXIT=0, 468 passed / 0 failed (w tym oba nowe testy); `cargo +1.87.0 check --locked --all-targets --features gpu` EXIT=0 (`dowody/17-obrona-r3-msrv.log`).
- Upload/odczyt wgpu na prawdziwym GPU (`upload_and_read_back_every_level`, `#[ignore]` z powodem) i filtr `generateMipmap` / niepremultiplikacja na ANGLE → D3D11: nadal **NIE_ZMIERZONO** (brak adaptera w kontenerze; spike P4-15 u właściciela) — zgodnie z dispatchem pkt 5 i §10–§11 dokumentu.

## Ślad

- Skrypty i logi: `dowody/16-obrona-r3-gates.{sh,log}`, `dowody/17-obrona-r3-msrv.{sh,log}`, `dowody/18-obrona-r3-parity-atlas-diff.{sh,log}`.
- Worktree kodu był sparse (`rust-port/renderer`) poza repo, `CARGO_TARGET_DIR` poza repo — usunięte po bramkach.
