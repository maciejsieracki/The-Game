# P3.11 — Zgodność danych Rust z pinem webowym `edb8fb56`

**Temat:** R-RUSTPORT-P3-11-DATA-COMPLIANCE-Q1 · **Runda:** 1/5 · **Rola:** Operator
**Baza kodu:** `origin/rust-port/parity-v2` = `1d53dcdb` (P3.8), zawiera `1d53dcdb`.
**Pin webowy:** `edb8fb56` (`gra/data/`).
**Zmieniony plik:** `rust-port/engine/tests/data_compliance.rs` (NOWY). Brak zmian w `src/**`, `Cargo.toml`, istniejących testach, `gra/**`.

## 1. Inwentarz istniejących testów `tests/data_*.rs` (przed zmianą)

| Plik testowy | Co sprawdza | Czego NIE sprawdza |
|---|---|---|
| `data_civilizations.rs` (7 testów) | parse + spot-checki 7 plików cywilizacji/dyplomacji; **1:1 round-trip** (`typed -> Value == raw`) dla: `civs`, `civ-matrix`, `civ-params`, `civ-ai`, `diplomacy`, `diplomacy-acceptance-points`, `city-names-pools` | liczności/ID względem web |
| `data_buildings_tech.rs` (3) | parse `buildings`, `wonders`, `tech` + spot-checki | round-trip; ID względem web |
| `data_economy_society.rs` (9) | parse 9 plików ekonomii/społeczeństwa/UI + spot-checki | round-trip; ID |
| `data_terrain_map.rs` (4) | parse 4 plików terenu/mapy + spot-checki | round-trip |
| `data_units_combat.rs` (6) | parse 6 plików jednostek/walki + liczności z surowego `Value` | round-trip |

Wniosek: round-trip istnieje TYLKO dla 7 plików cywilizacji. Pozostałe 22 pliki mają parse + spot-checki.

## 2. Co dodaje `data_compliance.rs` (9 testów, wszystkie zielone)

- `web_pin_constants_are_internally_consistent`: długości stałych zgodne z liczbami z pinu; typ cywilizacji == klucze `panstwa` == `_meta.wszystkie_cywilizacje`.
- `civs_count_and_ids_match_web_pin` (punkt 2a): 15 cywilizacji, 11 `start_gry`; zbiór nazw `Cywilizacja` i zbiór ID `typCywilizacji` == web; brak duplikatów.
- `civ_auxiliary_files_civ_ids_match_web_pin`: `civ-matrix`, `civ-params`, `civ-ai` — zbiory `cywilizacja` (i `typ_cywilizacji` w matrix) == web.
- `wonders_state_keys_match_web_pin`: klucze `panstwa` i `_meta.wszystkie_cywilizacje` == web.
- `collection_counts_match_web_pin` (punkt 2b): jednostki 75, budynki 42, technologie 32, cuda 19, parkowane 5, państwa 15, surowce 15, typy terenu 8, modyfikatory terenu 2.
- `collection_id_sets_match_web_pin` (punkt 2b): zbiory ID/nazw jednostek, budynków, technologii, cudów, parkowanych, surowców, typów terenu == web; brak duplikatów.
- `embedded_raw_counts_match_web_pin`: liczby i klucze z surowego `Value` wbudowanych kopii (`include_str!`) == web (niezależnie od struktur Rust).
- `terrain_improvements_parses_strict_with_farma_and_posterunek` (rename z poprzedniej nazwy `..._full_key_set_is_modelled`, która overclaimowała): parse `terrain-improvements.json` (struktura z `deny_unknown_fields`). Dowodzi TYLKO braku kluczy JSON nieznanych strukturze; NIE dowodzi zamodelowania pól opcjonalnych (brakujące pole `Option` przechodzi bez błędu). Sprawdzane 2 pola jako próbka.
- `all_29_data_files_parse_with_rust_modules` (punkt 2c, część parse): wszystkie 29 plików JSON parsuje się modułem Rust; dodatkowo katalog `rust-port/engine/data` skanowany przez `read_dir` musi mieć dokładnie tyle plików `*.json`, ile przeszło probe (pokrycie: brak pliku poza listą = FAIL).
- Usunięte w rundzie 2 tautologie: asercje `WEB_JSON_FILE_COUNT == 29`, `WEB_START_GRY_COUNT == 11`, `WEB_TERRAIN_MODIFIERS_COUNT == 2` (literał == literał). Stałe nadal używane w asercjach właściwych.

## 3. Źródła stałych (punkt „każda stała ma źródło”)

Stałe wygenerowano skryptem z blobów pinu (`git show edb8fb56:gra/data/<plik>.json`), np.:

```
git show edb8fb56:gra/data/civs.json      -> cywilizacje[].Cywilizacja (15), cywilizacje[].typCywilizacji, start_gry (11)
git show edb8fb56:gra/data/units.json     -> tablica, 75 elementów, pole Jednostka
git show edb8fb56:gra/data/buildings.json -> tablica, 42 elementy, pole id
git show edb8fb56:gra/data/tech.json      -> technologie (32), pole Technologia
git show edb8fb56:gra/data/wonders.json   -> cuda (19), parkowane_epoka4plus (5), panstwa (15), _meta.wszystkie_cywilizacje (15)
git show edb8fb56:gra/data/resources.json -> tablica, 15 elementów, pole Surowiec
git show edb8fb56:gra/data/terrain-yields.json -> terrain_types (8), terrain_modifiers (2), pole Teren
git show edb8fb56:gra/data/terrain-improvements.json -> 22 klucze nie zaczynające się od "_"
```

Niezależne potwierdzenie liczności: `dyspozycje/rust-port/p1/P1-12-DATA-CATALOG.md` (gałąź dokumentacyjna, pin `edb8fb56`) podaje te same liczby: units 75, buildings 42, tech 32, cuda 19, parkowane 5, resources 15, terrain_types 8, terrain_modifiers 2, civs 15/11, improvements 22 rekordów.

Potwierdzenie liczby plików (zarzut ewaluatora pkt 8): P1-12 linia 16-17: „Łączna liczba plików w `gra/data/`: 30 … Z tego **29 plików `.json`** i **1 plik `earth-mask-source.png`**”. Zgodne z `git ls-tree edb8fb56 gra/data/` (29 wpisów `.json`).

## 4. Weryfikacja bajtowa (punkt 2d)

`git ls-tree edb8fb56 gra/data/` vs `git ls-tree HEAD rust-port/engine/data/` oraz `git hash-object rust-port/engine/data/*.json` (SHA z `ls-tree edb8fb56` to ten sam blob-SHA, który zwróciłoby `git rev-parse edb8fb56:gra/data/<plik>`; `rev-parse` nie uruchamiano pojedynczo):

- Plików JSON w `gra/data/` na pinie: **29** (nie 27 jak w dispatchu). Plus `earth-mask-source.png` (nie-JSON, poza zakresem parsowania).
- Plików JSON w `rust-port/engine/data/`: **29**.
- Porównanie per plik (runda 2, wykonane pojedynczo dla każdej pary): `git hash-object rust-port/engine/data/<plik>` vs `git rev-parse edb8fb56:gra/data/<plik>`. Wynik (surowy, wklejony z terminala; kolumna wynik = wszystkie 29 par identyczne):

| plik | `git hash-object` (Rust) | `git rev-parse edb8fb56:gra/data/…` (pin) | zgodne |
|---|---|---|---|
| ai-params.json | 9965e8c35871b7d5423a750e810ce1e7def91e7a | 9965e8c35871b7d5423a750e810ce1e7def91e7a | TAK |
| auto-battle-params.json | 38d3eca009d875ee06a33c9ac49fd193ecdf7372 | 38d3eca009d875ee06a33c9ac49fd193ecdf7372 | TAK |
| buildings.json | a4bc388f205f96f4f82e80809e44d90b8dd91549 | a4bc388f205f96f4f82e80809e44d90b8dd91549 | TAK |
| citizen-resource-upkeep.json | c54964d824d9c328a4d3e1081a47502ad223b59d | c54964d824d9c328a4d3e1081a47502ad223b59d | TAK |
| city-names-pools.json | 7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7 | 7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7 | TAK |
| civ-ai.json | 2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf | 2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf | TAK |
| civ-matrix.json | fc94205d99bb39339dbc2cd59072b00479f9defc | fc94205d99bb39339dbc2cd59072b00479f9defc | TAK |
| civ-params.json | 0ac5838b56e71a77191e4c44b2ff1c9eeedcd493 | 0ac5838b56e71a77191e4c44b2ff1c9eeedcd493 | TAK |
| civs.json | 86fd13944ef63c6e22d390517d67a36dbf07c0ae | 86fd13944ef63c6e22d390517d67a36dbf07c0ae | TAK |
| combat-params.json | ceeddbcda947ec4d00151ca487a62af30c0fe2f2 | ceeddbcda947ec4d00151ca487a62af30c0fe2f2 | TAK |
| counters.json | be87c2195833a7c36d65f1f86b69ec95820fe9c7 | be87c2195833a7c36d65f1f86b69ec95820fe9c7 | TAK |
| diplomacy-acceptance-points.json | 19a43485fac5a64661a3b5d3645631c6fd0d588b | 19a43485fac5a64661a3b5d3645631c6fd0d588b | TAK |
| diplomacy.json | 056c0ef91a5ae3a9a6c49d3027301b716a1540b4 | 056c0ef91a5ae3a9a6c49d3027301b716a1540b4 | TAK |
| e-start-params.json | 2186f87f102275eb2b72c2f95d6c413018fec6a7 | 2186f87f102275eb2b72c2f95d6c413018fec6a7 | TAK |
| econ-params.json | edc05299b9054db080be4694171f948f6c0f9243 | edc05299b9054db080be4694171f948f6c0f9243 | TAK |
| epoka-ludnosc-manpower.json | 2911354ee7bff5377cb9080631dcd60c83d66c7e | 2911354ee7bff5377cb9080631dcd60c83d66c7e | TAK |
| map-gen-params.json | 125e23f8286db47ae325a3d4fec1ce8318f300ff | 125e23f8286db47ae325a3d4fec1ce8318f300ff | TAK |
| miasto-params.json | f6fe8e012f8ed167ed3f25b7f7f408a2fc2e3d6f | f6fe8e012f8ed167ed3f25b7f7f408a2fc2e3d6f | TAK |
| power-params.json | b8aab3ec9a2ff3930114eb72542ae2be0c85e2b6 | b8aab3ec9a2ff3930114eb72542ae2be0c85e2b6 | TAK |
| resources.json | 7f2f9cd7fb15be8aeac101079c8958b59ba4548c | 7f2f9cd7fb15be8aeac101079c8958b59ba4548c | TAK |
| society-params.json | d51e7377e9d310b02f287dcbe8740e815944d003 | d51e7377e9d310b02f287dcbe8740e815944d003 | TAK |
| tech.json | 5d97927fd437e318c3bfea6e7c5b435863081a44 | 5d97927fd437e318c3bfea6e7c5b435863081a44 | TAK |
| terrain-combat.json | b00b5f63a521a352eb4ba459dd718fdc9da1a1ce | b00b5f63a521a352eb4ba459dd718fdc9da1a1ce | TAK |
| terrain-improvements.json | cd54b28b3d35fa6e7adb8e4be2d2fee913a2055b | cd54b28b3d35fa6e7adb8e4be2d2fee913a2055b | TAK |
| terrain-movement.json | 021d28d9a6c1374ae9717a38e39bdd664cda6f7a | 021d28d9a6c1374ae9717a38e39bdd664cda6f7a | TAK |
| terrain-yields.json | f366fc21676b6781adbc52ad60079c7729046b98 | f366fc21676b6781adbc52ad60079c7729046b98 | TAK |
| ui-params.json | f2b17280b9d0faf1982ff3e85f618d8452459513 | f2b17280b9d0faf1982ff3e85f618d8452459513 | TAK |
| units.json | 7bf7dd06d0e340bfd287a89948dd53ec4b8121fe | 7bf7dd06d0e340bfd287a89948dd53ec4b8121fe | TAK |
| wonders.json | fe3023465fd731d0c16029656d5d8984cc157fd4 | fe3023465fd731d0c16029656d5d8984cc157fd4 | TAK |

Wynik: **29/29 TAK**, 0 DIFF. Dwa wyjścia (hash-object i rev-parse) pochodzą z osobnych wywołań git i zostały porównane wizualnie kolumna po kolumnie; zbiór jest identyczny.

## 5. Wyniki `cargo test --offline` (CARGO_TARGET_DIR=/home/user/cargo-target-shared, CARGO_PROFILE_DEV_DEBUG=0)

Surowe logi (gitignorowane `*.log`, NIE w commicie; zapisane lokalnie w katalogu runs). Kod wyjścia dopisany `echo "EXIT=$?"` zaraz po komendzie:

Baseline (`00-cargo-test-baseline.log`, bez pliku `data_compliance.rs`), koniec logu:
```
EXIT=0
```
Suma `test result` z tego logu: `passed=256 failed=0 ignored=0`.

Po zmianie (`01-cargo-test-after.log`, commit `b50f51cf` + poprawki rundy 2), koniec logu:
```
EXIT=0
```
Suma `test result`: `passed=265 failed=0 ignored=0`; `Running tests/data_compliance.rs`, sekcja wyników:
```
running 9 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test collection_id_sets_match_web_pin ... ok
test wonders_state_keys_match_web_pin ... ok
test embedded_raw_counts_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
```
Liczba testów > baseline: 256 + 9 = 265 (suma per binarka z baseline, bez zmian w istniejących plikach testowych). Żaden istniejący test nie zniknął. `git diff --check`: exit 0, bez wyjścia.

## 6. LUKA: 1:1 round-trip nie jest możliwy dla 22 z 29 plików bez zmiany `src/data/**`

Test typu „typed -> `serde_json::Value` == plik” wymaga `#[derive(Serialize)]`. Stan na pinie:

- `src/data/civilizations.rs`: 82 wystąpienia `Serialize` — round-trip pokryty przez `data_civilizations.rs` (7 plików).
- `src/data/buildings_tech.rs`, `economy_society.rs`, `economy_society_part2.rs`, `terrain_map.rs`, `units_combat.rs`: **0** wystąpień `Serialize` (tylko `Deserialize`).

Zatem 1:1 round-trip dla `buildings`, `wonders`, `tech`, `units`, `resources`, `terrain-*`, `econ-params`, `society-params`, `ai-params`, `e-start-params`, `ui-params`, `miasto-params`, `counters`, `combat-params`, `power-params`, itd. jest niewykonalny w tym temacie (dodanie derive = zmiana `src/data/**`, poza allowlistą). Nie osłabiono testu po cichu: nie ma testu, który by udawał round-trip.

**Status: DECISION_REQUIRED (właściciel).** GOAL punkt 2c („1:1 dla wszystkich 27/29 plików”) NIE jest dostarczony dla 22 plików. Do wyboru przez właściciela:
(a) osobny temat na `src/data/**`: `#[derive(Serialize)]` w 22 strukturach + round-trip dla 22 plików (zmiana poza allowlistą P3-11), albo
(b) zawężenie GOAL tego tematu do: parse 29/29 + liczności/ID + identyczność bajtowa 29/29 (sekcje 2–4), a round-trip 1:1 przenieść do osobnego tematu.
Operator NIE dodał testu `#[ignore]` z pustym szkieletem: test 1:1 nie został napisany, więc nie ma czego ignorować.

Ryzyko gubienia pól (ustalenie, nie błąd testu):

- Struktury z `#[serde(deny_unknown_fields)]` (`terrain_map.rs` 29 wystąpień, `units_combat.rs` 27, `civilizations.rs` 77): nieznany klucz JSON powoduje błąd parsowania. Sukces parsowania = zbiór kluczy JSON jest zamodelowany (dla pól nieopcjonalnych).
- Struktury BEZ `deny_unknown_fields` (`buildings_tech.rs`, `economy_society.rs`, `economy_society_part2.rs`): nieznane klucze są **cicho pomijane**. Dla tych plików kompletność pól nie jest sprawdzana przez żaden test w tym temacie. Zamknięcie wymaga osobnego tematu (dodanie `Serialize` lub `deny_unknown_fields` w `src/data/**` + round-trip).

## 7. Ustalenia

1. Dane Rust (29 plików JSON) są bajtowo identyczne z pinem `edb8fb56`. Brak rozbieżności danych wykrytej przez testy.
2. Liczności i zbiory ID kluczowych kolekcji zgodne z pinem (9 testów zielonych).
3. Rozbieżność z dispatchem: liczba plików JSON to 29, nie 27.
4. Luka 1:1 round-trip — patrz punkt 6. Status DECISION_REQUIRED dla właściciela (zmiana `src/data/**` albo zawężenie GOAL). Test NIE jest oznaczony `#[ignore]` (test 1:1 nie został napisany).
5. Runda 2 (odpowiedź na zarzuty Evaluatora): doprecyzowana nazwa i komentarz testu terrain-improvements; usunięte tautologie literał==literał; dodane pokrycie katalogu `read_dir`; dopisane wyniki `git hash-object` vs `git rev-parse` per plik (§4); surowe logi z `EXIT=` wklejone (§5); potwierdzenie liczby 29 z P1-12 (§3).
