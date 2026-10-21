# P3.13 — Final Control danych i assetów przed otwarciem P4–P6

STATUS: FAIL (rekomendacja Operatora; klauzula 2 bramki PASS, klauzula 1 NIE SPEŁNIONA w runtime)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-13-GATE-FINAL-CONTROL-Q1
RUNDA: 1/5
BAZA: `origin/rust-port/parity-v2` = `17454b33abbd3ab4a87a7e75ac2b17c5d86a4d8a` (HEAD worktree detached; zweryfikowane `git rev-parse HEAD`)
PIN danych: `edb8fb56` (`gra/data/*`)
DEPLOY/PUSH: NIE WYKONANO

Bramka P3 (PLAN §4): „dane ładowane ze źródła (nie hard-coded), manifest assetów przechodzi walidację wobec web".
Źródła: `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` §P3, `LEDGER.md` (wpisy P3.*), `p1/P1-11-ASSET-CATALOG.md`, `p2/P2-9-ASSET-DATA-MAPPING.md`, `p3/P3-4C-IDS-REMAINING.md` — odczytane z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja) przez `git show`. Wpisy LEDGER użyte jako wskazówka, każdy status poniżej sprawdzony własnym dowodem tam, gdzie to możliwe.

Oznaczenia: **ZMIERZONO** = własna komenda w tym przebiegu; **LEDGER** = tylko zapis w LEDGER (nie re-weryfikowane); **NIE_ZMIERZONO** = brak dowodu.

---

## 1. Surowe bramki (własny przebieg, pełne wyjścia w załącznikach A–C)

| Komenda (`rust-port/engine`) | Wynik | Dowód |
|---|---|---|
| `cargo fmt --all -- --check` | EXIT=0 | Załącznik A |
| `cargo clippy --all-targets -- -D warnings` | EXIT=0 | Załącznik B |
| `cargo test --offline` | 323 passed, 0 failed, EXIT=0 (40 sekcji `test result`, suma passed = 323) | Załącznik C |

Uruchomienie: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_472a4359-063-1 CARGO_PROFILE_DEV_DEBUG=0`. Po zakończeniu podkatalog targetu zostanie usunięty. Powstał nieśledzony `rust-port/engine/Cargo.lock` — NIE został dodany do commita.

---

## 2. Dane: 29/29 plików `gra/data/*.json`

### 2.1 Tabela hashy (ZMIERZONO)

Lewa kolumna: `git hash-object rust-port/engine/data/<plik>` (worktree `17454b33`). Prawa: blob w pinie `edb8fb56:gra/data/<plik>` (`git ls-tree -r edb8fb56 -- gra/data`).

| # | Plik | SHA worktree (hash-object) | SHA pin edb8fb56 | Zgodność |
|---|---|---|---|---|
| 1 | ai-params.json | 9965e8c35871b7d5423a750e810ce1e7def91e7a | 9965e8c35871b7d5423a750e810ce1e7def91e7a | MATCH |
| 2 | auto-battle-params.json | 38d3eca009d875ee06a33c9ac49fd193ecdf7372 | 38d3eca009d875ee06a33c9ac49fd193ecdf7372 | MATCH |
| 3 | buildings.json | a4bc388f205f96f4f82e80809e44d90b8dd91549 | a4bc388f205f96f4f82e80809e44d90b8dd91549 | MATCH |
| 4 | citizen-resource-upkeep.json | c54964d824d9c328a4d3e1081a47502ad223b59d | c54964d824d9c328a4d3e1081a47502ad223b59d | MATCH |
| 5 | city-names-pools.json | 7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7 | 7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7 | MATCH |
| 6 | civ-ai.json | 2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf | 2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf | MATCH |
| 7 | civ-matrix.json | fc94205d99bb39339dbc2cd59072b00479f9defc | fc94205d99bb39339dbc2cd59072b00479f9defc | MATCH |
| 8 | civ-params.json | 0ac5838b56e71a77191e4c44b2ff1c9eeedcd493 | 0ac5838b56e71a77191e4c44b2ff1c9eeedcd493 | MATCH |
| 9 | civs.json | 86fd13944ef63c6e22d390517d67a36dbf07c0ae | 86fd13944ef63c6e22d390517d67a36dbf07c0ae | MATCH |
| 10 | combat-params.json | ceeddbcda947ec4d00151ca487a62af30c0fe2f2 | ceeddbcda947ec4d00151ca487a62af30c0fe2f2 | MATCH |
| 11 | counters.json | be87c2195833a7c36d65f1f86b69ec95820fe9c7 | be87c2195833a7c36d65f1f86b69ec95820fe9c7 | MATCH |
| 12 | diplomacy-acceptance-points.json | 19a43485fac5a64661a3b5d3645631c6fd0d588b | 19a43485fac5a64661a3b5d3645631c6fd0d588b | MATCH |
| 13 | diplomacy.json | 056c0ef91a5ae3a9a6c49d3027301b716a1540b4 | 056c0ef91a5ae3a9a6c49d3027301b716a1540b4 | MATCH |
| 14 | e-start-params.json | 2186f87f102275eb2b72c2f95d6c413018fec6a7 | 2186f87f102275eb2b72c2f95d6c413018fec6a7 | MATCH |
| 15 | econ-params.json | edc05299b9054db080be4694171f948f6c0f9243 | edc05299b9054db080be4694171f948f6c0f9243 | MATCH |
| 16 | epoka-ludnosc-manpower.json | 2911354ee7bff5377cb9080631dcd60c83d66c7e | 2911354ee7bff5377cb9080631dcd60c83d66c7e | MATCH |
| 17 | map-gen-params.json | 125e23f8286db47ae325a3d4fec1ce8318f300ff | 125e23f8286db47ae325a3d4fec1ce8318f300ff | MATCH |
| 18 | miasto-params.json | f6fe8e012f8ed167ed3f25b7f7f408a2fc2e3d6f | f6fe8e012f8ed167ed3f25b7f7f408a2fc2e3d6f | MATCH |
| 19 | power-params.json | b8aab3ec9a2ff3930114eb72542ae2be0c85e2b6 | b8aab3ec9a2ff3930114eb72542ae2be0c85e2b6 | MATCH |
| 20 | resources.json | 7f2f9cd7fb15be8aeac101079c8958b59ba4548c | 7f2f9cd7fb15be8aeac101079c8958b59ba4548c | MATCH |
| 21 | society-params.json | d51e7377e9d310b02f287dcbe8740e815944d003 | d51e7377e9d310b02f287dcbe8740e815944d003 | MATCH |
| 22 | tech.json | 5d97927fd437e318c3bfea6e7c5b435863081a44 | 5d97927fd437e318c3bfea6e7c5b435863081a44 | MATCH |
| 23 | terrain-combat.json | b00b5f63a521a352eb4ba459dd718fdc9da1a1ce | b00b5f63a521a352eb4ba459dd718fdc9da1a1ce | MATCH |
| 24 | terrain-improvements.json | cd54b28b3d35fa6e7adb8e4be2d2fee913a2055b | cd54b28b3d35fa6e7adb8e4be2d2fee913a2055b | MATCH |
| 25 | terrain-movement.json | 021d28d9a6c1374ae9717a38e39bdd664cda6f7a | 021d28d9a6c1374ae9717a38e39bdd664cda6f7a | MATCH |
| 26 | terrain-yields.json | f366fc21676b6781adbc52ad60079c7729046b98 | f366fc21676b6781adbc52ad60079c7729046b98 | MATCH |
| 27 | ui-params.json | f2b17280b9d0faf1982ff3e85f618d8452459513 | f2b17280b9d0faf1982ff3e85f618d8452459513 | MATCH |
| 28 | units.json | 7bf7dd06d0e340bfd287a89948dd53ec4b8121fe | 7bf7dd06d0e340bfd287a89948dd53ec4b8121fe | MATCH |
| 29 | wonders.json | fe3023465fd731d0c16029656d5d8984cc157fd4 | fe3023465fd731d0c16029656d5d8984cc157fd4 | MATCH |

**Wynik: 29/29 MATCH.** Zbiór nazw plików w `rust-port/engine/data/` = zbiór 29 JSON z pinu (ZMIERZONO: `ls` + diff). Pin zawiera dodatkowo `gra/data/earth-mask-source.png` (poza zakresem 29 JSON; maska lądów, P1.11 §2 „poza sumą 441”; w `rust-port/engine/data/` nie ma jej i nie jest wymagana przez bramkę).

### 2.2 Ścieżka ładowania (ZMIERZONO)

- **Loader z katalogu istnieje:** `rust-port/engine/src/data/loader.rs` — `load_file(dir, name)` i `load_all(dir)`, lista 29 plików z jednej tabeli `data_table!`. Brak `include_str!` w loaderze. Testy `tests/data_loader.rs` (14, ok) w tym: `neg_every_listed_file_is_required_by_load_all`.
- **`include_str!` w `src/data/*` — 29 wystąpień** (`civilizations.rs` 7, `buildings_tech.rs` 3, `economy_society.rs` 6, `economy_society_part2.rs` 3, `terrain_map.rs` 4, `units_combat.rs` 6). Każdy z 29 plików jest osadzony w binarce przez funkcje `parse_*` / stałe `*_JSON`.
- **Wywołania produkcyjne:** `grep` po `src/` poza `src/data/`, `src-tauri/src` i `tests/`: ZERO wywołań `parse_*`, `load_all`, `load_file`, stałych `*_JSON`. Wszystkie wywołania są w `tests/` (`data_*.rs`, `data_compliance.rs`, `data_loader.rs`).
- **Domena nie używa danych:** `grep -rn "data::\|civilizations::\|buildings_tech::\|units_combat::" src/domain` → 0 trafień.
- **`src-tauri`:** brak `include_str!`, brak odwołań do `civ_engine::data`.

**Ocena klauzuli „dane ładowane ze źródła (nie hard-coded)":** loader ze źródła istnieje i działa (testy), ale **silnik nie ładuje danych w runtime**. Ponadto domena zawiera tabelę wpisaną ręcznie: `rust-port/engine/src/domain/recruitment.rs:204` `canonical_recruitment_costs()` — komentarz „mirrored from `gra/data/units.json`" (LEDGER P2.9: 75/75 nazw zgodnych, **75/75 wartości rozbieżnych**; P3.5B świadomie nie naprawiony). Klauzula 1 bramki **nie jest spełniona** w runtime.

### 2.3 Round-trip i normalizacje (P3.11 / P3.15)

- `tests/data_compliance.rs` przeszedł w `cargo test` (ZMIERZONO). Obejmuje m.in. `roundtrip_covers_all_29_data_files` (ZMIERZONO: nazwa w wyjściu, ok).
- LEDGER P3.15: literalnie równe 22/29; 7 plików (buildings, map-gen-params, power-params, tech, terrain-improvements, units, wonders) przez N1 (brak klucza `Option` ≡ `null`, 1190 wystąpień) i N2 (int vs f64, 120 wystąpień), liczniki przypięte w teście — **LEDGER, nie re-weryfikowane osobno liczniki**.
- Ocena: N1/N2 to różnice reprezentacji, nie wartości; akceptowalne dla bramki danych. Ryzyko: N1 maskuje różnicę „brak klucza vs null" — do oceny przy kontrakcie zapisu (P2.7).

---

## 3. Assety: 428/428 + manifest (ZMIERZONO)

### 3.1 Walidacja manifestu (niezależna, Python, bez git)

`rust-port/assets/MANIFEST.tsv`: 429 linii = nagłówek + 428 wierszy danych. Dla każdego wiersza: istnienie pliku — **0 braków**; rozmiar zgodny z `size_bytes` — **0 niezgodności**. SHA-1 (blob) weryfikowane przez `tests/assets_manifest.rs::every_entry_blob_sha1_matches_manifest_column` (ok).

Testy `tests/assets_manifest.rs`: **13/13 ok** (w tym `manifest_has_header_and_428_data_rows`, `no_files_outside_manifest_in_assets_dir`, `counts_per_extension_match_p1_11`, `byte_sums_per_category_match_p1_11`, 5× `negative_*`).

Zawartość `rust-port/assets/` = 429 plików = 428 + `MANIFEST.tsv`.

### 3.2 Sumy per kategoria vs P1.11 §2

| Kategoria | P1.11 §2 (liczba / bajty) | Manifest (liczba / bajty, ZMIERZONO) | Zgodność |
|---|---|---|---|
| SVG (ikony) | 307 / 108 231 | 307 / 108 231 | TAK |
| JSON (mapy ikon) + CSS (style) | 12 (8+4) / 27 945 | 12 (8 JSON 20 000 + 4 CSS 7 945) / 27 945 | TAK |
| JPG (portrety) | 45 / 445 951 | 45 / 445 951 | TAK |
| PNG (hero) | 2 / 4 214 674 | 2 / 4 214 674 | TAK |
| MP3 aktywna | 59 / 42 350 853 | 59 (łącznie z wykluczonymi, patrz niżej) | TAK (suma poniżej) |
| MP3 wykluczona (`_wykluczone/`) | 3 / 2 233 830 | 3 / 2 233 830 | TAK, ale patrz uwaga |
| MP3 razem | 62 / 44 584 683 | 62 / 44 584 683 | TAK |
| **Razem** | **428 / 49 381 484** (441 łącznie z `.ts`/`.md`, 49 545 994 B) | **428 / 49 381 484** | TAK |

Uwaga: P1.11 §2 oznacza 3 pliki `_wykluczone/` jako „do decyzji właściciela, czy wchodzą do manifestu". Manifest je zawiera. Decyzja właściciela — NIE_ZMIERZONO, do potwierdzenia.

### 3.3 Brak fontów / modeli 3D / SFX w pinie (P3.8)

Rozszerzenia w manifeście: wyłącznie `svg, json, css, jpg, png, mp3`. P1.11 §2: fonty 0, modele 3D 0, SFX-pliki 0 — **zgodne**. Dźwięk SFX jest syntetyzowany w kodzie Web Audio (P1.11 §5), muzyka brązu/kamienia częściowo syntetyczna — to do odtworzenia w Rust/Tauri (P3.8/P5), nie kopiowania plików.

Zgodność z decyzją o rendererze: LEDGER (ostatni wpis zmiany decyzji właściciela) — renderer w Rust (wgpu), modele 3D jako kod (P4.4). Pin ma 88 plików `three` w `gra/src/render/**` i geometrię proceduralną (P1.11 §5). Brak plików modeli jest zgodny z tą decyzją. Nie weryfikowałem decyzji poza LEDGER.

---

## 4. Zgodność ID i newtypów (P3.4b/c)

Źródło: `dyspozycje/rust-port/p3/P3-4C-IDS-REMAINING.md` §1b (LEDGER: `5e694021`). Zmienione na newtypy: `PlayerId`/`UnitId` (P3.4b), `CityId`/`UnitId` w `AiCity`, `PlayableCity`, `PlayableUnit`, `CitySnapshot` (P3.4c). Pozostają `u64` (wg §1b, ZMIERZONO spot-check: 73 deklaracje (P3-4C podaje 91 miejsc łącznie z użyciami) `owner_id: i64|Option<u64>|u64` w `src/`; `OwnerRef` obecny tylko w dokumentacji, nie w kodzie):

| Grupa | Liczba | Pola | Blokuje P4–P6? |
|---|---|---|---|
| CITY | 7 | `AiOptions.city_buildings` (klucz mapy), `AiCommand::Build.city_id`, `choose_*`, `BarbUnit.cleared_city_ids`, `BarbCityGarrison(Spawn).city_id` | P6 (barbarzyńcy, produkcja AI) — niskie |
| CAMP | 7 | `BarbCamp.id`, `BarbUnit.camp_id`, `BarbSpawn.camp_id` — brak `CampId` w `ids.rs` | P6 — średnie |
| OWNER | 91 | `owner_id`/`player_id`; `MapTile.owner_id: Option<u64>`; `barbarians.rs:143` `owner_id: i64` (ujemny sentinel) | **P6 (dyplomacja, handel, hot-seat) — TAK, wysokie**; P4 nie |
| UNIT-CMD | 6 | `AiCommand::{Move,FoundCity,Attack,Build}`, `BarbCommand::{Move,Attack}` | P6 — niskie (kontrakt JSON) |
| UNIT-RESULT / SURVIVORS | 1 + 2 | `UnitCombatResult.id`, `survivors_*` | P6 — niskie |
| UNIT-BOUNDARY / PLAYER-INPUT | 6 + 2 | granica komend `bridge.rs`, `select_unit`, `add_player(id: u64)` | P5 (kontrakt UI) — niskie |
| CTOR-WRAP | 2 | `BarbUnit::new`, `CombatUnit::new` | nie |

Ocena: nic z tego nie blokuje P4 (geometria/renderer). **OWNER (91) i sentinel `i64` blokują P6** — brak typowania właścicieli (`OwnerRef` z P2.3 §9) to realny dług kontraktu. Dispatch zakładał listę z P3-4C §1b — zgodna.

---

## 5. Tabela statusu P3 (temat → SHA integracji → dowód → status)

| Temat | SHA integracji (LEDGER) | Dowód | Status |
|---|---|---|---|
| P3.1–P3.2 toolchain | `9e33fc77` (baza) | LEDGER PASS (224/224); ZMIERZONO: `cargo test` 323 ok, `cargo build` ok | PASS |
| P3.3 błędy/logging | `logging.rs` integrated (LEDGER PASS-ZINTEGROWANE) | ZMIERZONO: `pub mod logging;` w `lib.rs`; `tracing` NIE podpięty do `bridge.rs`/`src-tauri` (LEDGER) | PASS-WITH-NOTES |
| P3.4 ID/config/wersjonowanie | LEDGER: `SCHEMA_VERSION` w `src/version.rs` | ZMIERZONO: `pub mod version;` w `lib.rs`; zakres częściowy (LEDGER) | PASS-WITH-NOTES |
| P3.4b newtypy PlayerId/UnitId | `914eec6b` | LEDGER PASS-WITH-NOTES (build src-tauri niezweryfikowany) | PASS-WITH-NOTES |
| P3.4c newtypy CityId/UnitId | `5e694021` | LEDGER PASS; §4 tego dokumentu | PASS (z pozostawionymi u64, §4) |
| P3.5A–E dane (29 plików) | `df8d8592` (5A, ostatni z LEDGER-SHA), `401a625f` (5B); 5C/5D/5E wg LEDGER zintegrowane | ZMIERZONO: 29/29 hash MATCH (§2.1), `include_str!` 29 (§2.2) | PASS dla pliku/zawartości; runtime — patrz P3.9 |
| P3.6–P3.7 (zakres w P3.5A–E) | jw. | jw. | PASS |
| P3.8 assety | `1d53dcdb` (LEDGER: 428/428 PASS) | ZMIERZONO: 428/428, sumy zgodne (§3) | PASS |
| P3.8b walidacja manifestu | `667f1743` | ZMIERZONO: `tests/assets_manifest.rs` 13/13 ok | PASS |
| P3.9 loader/walidator (podpięcie modułów) | LEDGER: podpięcie `pub mod data;` | ZMIERZONO: `pub mod data;` w `lib.rs`; **brak wywołań produkcyjnych loadera** (§2.2) | PASS-WITH-NOTES (w literalnym sensie „ze źródła" NIE — §2.2) |
| P3.10 fixtures seedów/map/scenariuszy | BRAK | ZMIERZONO: brak `P3-10*` w `dyspozycje/rust-port/p3/`; `find rust-port -iname "*fixture*"` → 0 plików; LEDGER: „zablokowane" | **NIE ZAMKNIĘTE** (blokada: brak nagrań z web; P2.10 — D-FIX-1,3,4,9–14,16–19 otwarte) |
| P3.11 testy zgodności liczby/ID civ | `f3cbbf04` (LEDGER PASS-WITH-NOTES) | ZMIERZONO: `data_compliance.rs` ok | PASS-WITH-NOTES (round-trip domknięty przez P3.15) |
| P3.12 testy brakujących/uszkodzonych danych | `5cecefc8`/`4caa8717` (LEDGER PASS-WITH-NOTES) | ZMIERZONO: `data_loader.rs` 14 ok | PASS-WITH-NOTES |
| P3.14 fmt/clippy hygiene | `aa7b225b` (LEDGER PASS) | ZMIERZONO: fmt EXIT=0, clippy EXIT=0 | PASS |
| P3.15 round-trip 29/29 | `f7aa0997` (LEDGER PASS) | ZMIERZONO: `roundtrip_covers_all_29_data_files` ok; N1/N2 (§2.3) | PASS-WITH-NOTES |
| P3.16 bramki CI zielone | `17454b33` | ZMIERZONO: fmt 0, clippy 0, test 323/0 | PASS |
| P3.13 (ten temat) | — | niniejszy dokument | FAIL (klauzula 1) |

Dodatkowo: `gen.py` — `rust-port/engine/src/data/civilizations.rs:1` deklaruje generowanie przez `gen.py`; skrypt NIE istnieje w repo (ZMIERZONO: `grep -rln "gen\.py" rust-port/engine` → tylko ten plik). Pochodzenie 1:1 nieodtwarzalne; nie blokuje testów.

---

## 6. Lista otwartych punktów

| # | Punkt | Ocena | Blokuje |
|---|---|---|---|
| 1 | **Loader nie podpięty do runtime; domena nie czyta `gra/data`** (§2.2) | Klauzula 1 bramki NIE spełniona | **P6** (gameplay); P4 tylko jeśli P4 nie konsumuje danych gameplay |
| 2 | **`recruitment.rs:204` hard-coded tabela; 75/75 wartości ≠ `units.json`** (LEDGER P2.9; P3.5B świadomie nie naprawione) | Realna rozbieżność danych | **P6** (rekrutacja) |
| 3 | P3.10 fixtures — brak (blokada: brak nagrań z web; P2.10 D-FIX otwarte) | Nie zamknięte | **P6 testy zgodności**; nie P4 |
| 4 | OWNER: 91× `u64`/`i64`, `OwnerRef` nieobecny w kodzie (§4) | Dług kontraktu P2.3 §9 | **P6** (dyplomacja/handel/hot-seat) |
| 5 | CAMP: brak `CampId` (§4) | Dług | P6 (barbarzyńcy) |
| 6 | `gen.py` nieobecny w repo (§5) | Nieodtwarzalna proweniencja | nie |
| 7 | `src-tauri` nie buduje się w kontenerze (brak GTK3/gdk-3.0; LEDGER P0/P3.4b) | Blokada środowiskowa, NIE zweryfikowane w tym przebiegu | P2/P7 (wg LEDGER); nie P4 |
| 8 | `tracing` nie podpięty do `bridge.rs` / `src-tauri` (LEDGER P3.3) | Dług | nie |
| 9 | Round-trip N1/N2 dla 7/29 plików (§2.3) | Akceptowalne z notą | P2.7-zgodność zapisu, nie P4 |
| 10 | 3 pliki MP3 `_wykluczone/` w manifeście (§3.2) | Decyzja właściciela NIE_ZMIERZONO | nie |
| 11 | `Cargo.lock` nieśledzony w repo (LEDGER P3.1–2); w worktree nieśledzony | Dług (nie commitować) | nie |
| 12 | Serde `deny_unknown_fields` w 3 modułach (LEDGER P3.15) — pozostałe moduły nie | Dług | nie |

---

## 7. Werdykt bramki P3 i rekomendacja

**Werdykt: FAIL** (w literalnym brzmieniu bramki PLAN §4).

- Klauzula 2 „manifest assetów przechodzi walidację wobec web": **PASS** — 428/428 (rozmiary, SHA-1, brak braków, sumy per kategoria = P1.11 §2), 13/13 testów.
- Klauzula 1 „dane ładowane ze źródła (nie hard-coded)": **NIE SPEŁNIONA w runtime** — 29/29 plików bajtowo zgodnych z pinem i loader z katalogu istnieje, ale silnik nie wywołuje loadera; domena zawiera ręczną tabelę rekrutacji rozjechaną z `units.json` (75/75 wartości).

**Rekomendacja orkiestratora:**

1. **Teraz można otwierać:** P4.1–P4.5 wyłącznie w zakresie, który nie konsumuje tabel gameplay (geometria hex, renderer shell, manifest assetów, który jest zwalidowany). Assety i dane są gotowe jako źródło (klauzula 2).
2. **Przed P6 (gameplay core) — warunki obowiązkowe:** (a) podpięcie loadera do ścieżki runtime i usunięcie `canonical_recruitment_costs()` (lub wygenerowanie z `units.json`) — nowy temat, plik `recruitment.rs` + testy; (b) decyzja `OwnerRef`/`CampId` (P2.3 §9) przed dyplomacją/handlem; (c) P3.10 fixtures lub jawna decyzja właściciela o ich odłożeniu przed testami zgodności P6.
3. **Nie blokuje:** gen.py, tracing, src-tauri (poza P2/P7), N1/N2 (z notą), 3× MP3 (decyzja właściciela).
4. Ponowna bramka P3.13 po wykonaniu punktu 2(a) i 2(c).

Nie zmieniono kodu, danych, assetów, `src-tauri`, `gra/`. Zmiany tylko w allowliście (§8).

---

## 8. Allowlista i zakres zmian

- Nowy dokument: `dyspozycje/rust-port/p3/P3-13-GATE-FINAL-CONTROL.md` (ten plik).
- Dowody surowe: `dyspozycje/autobot/runs/R-RUSTPORT-P3-13-GATE-FINAL-CONTROL-Q1/` (fmt.txt, clippy.txt, test.txt).
- Zmian poza allowlistą: brak (`git status` przed commitem: tylko powyższe + nieśledzony `Cargo.lock`, który NIE jest dodawany).

---

## Załącznik A — `cargo fmt --all -- --check` (pełne wyjście)

```text
EXIT=0
```

## Załącznik B — `cargo clippy --all-targets -- -D warnings` (pełne wyjście)

```text
    Updating crates.io index
     Locking 17 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling serde v1.0.229
    Checking once_cell v1.21.4
   Compiling serde_json v1.0.154
    Checking tracing-core v0.1.36
    Checking itoa v1.0.18
    Checking pin-project-lite v0.2.17
    Checking memchr v2.8.3
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
    Checking tracing v0.1.44
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_472a4359-063-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 29.31s
EXIT=0
```

## Załącznik C — `cargo test --offline` (pełne wyjście)

```text
   Compiling serde_core v1.0.229
   Compiling once_cell v1.21.4
   Compiling zmij v1.0.23
   Compiling pin-project-lite v0.2.17
   Compiling memchr v2.8.3
   Compiling tracing-core v0.1.36
   Compiling itoa v1.0.18
   Compiling tracing v0.1.44
   Compiling serde_json v1.0.154
   Compiling serde v1.0.229
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_472a4359-063-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 38.28s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test manifest_dest_paths_are_unique ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_wrong_size ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.99s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_auto_battle_params ... ok
test rt_ai_params ... ok
test rt_citizen_resource_upkeep ... ok
test rt_city_names_pools ... ok
test rt_buildings ... ok
test rt_civ_ai ... ok
test rt_civ_params ... ok
test rt_civ_matrix ... ok
test rt_combat_params ... ok
test rt_civs ... ok
test rt_counters ... ok
test rt_diplomacy ... ok
test rt_diplomacy_acceptance_points ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_econ_params ... ok
test rt_e_start_params ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_map_gen_params ... ok
test rt_power_params ... ok
test rt_resources ... ok
test rt_miasto_params ... ok
test rt_terrain_combat ... ok
test rt_tech ... ok
test rt_society_params ... ok
test rt_terrain_yields ... ok
test rt_terrain_improvements ... ok
test rt_terrain_movement ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test rt_ui_params ... ok
test rt_wonders ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_missing_file_is_file_missing ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_unreadable_file_is_io ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.48s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test production_diplomacy_api_is_public ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test map_dimensions_and_seed_are_stable ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test public_engine_wire_aliases_are_stable ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 7 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test multiple_layers_stack_additively_per_resource ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test canonical_state_round_trips_through_serde ... ok
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test land_route_bfs_crosses_desert_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diff_and_serialization_preserve_route_contract ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test pure_preview_does_not_mutate_input_balances ... ok
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_and_balances_round_trip_through_serde ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_472a4359-063-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test scout_is_available_in_every_epoch ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test current_and_previous_epochs_are_available ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```
