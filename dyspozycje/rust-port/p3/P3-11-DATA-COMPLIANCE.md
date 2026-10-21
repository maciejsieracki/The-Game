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
- `terrain_improvements_full_key_set_is_modelled`: parse `terrain-improvements.json` (struktura z `deny_unknown_fields`) — sukces dowodzi zgodności zbioru kluczy.
- `all_29_data_files_parse_with_rust_modules` (punkt 2c, część parse): wszystkie 29 plików JSON parsuje się modułem Rust.

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

## 4. Weryfikacja bajtowa (punkt 2d)

`git ls-tree edb8fb56 gra/data/` vs `git ls-tree HEAD rust-port/engine/data/` oraz `git hash-object rust-port/engine/data/*.json` (SHA z `ls-tree edb8fb56` to ten sam blob-SHA, który zwróciłoby `git rev-parse edb8fb56:gra/data/<plik>`; `rev-parse` nie uruchamiano pojedynczo):

- Plików JSON w `gra/data/` na pinie: **29** (nie 27 jak w dispatchu). Plus `earth-mask-source.png` (nie-JSON, poza zakresem parsowania).
- Plików JSON w `rust-port/engine/data/`: **29**.
- Blob SHA każdego z 29 plików Rust == blob SHA odpowiadającego pliku na pinie: **29/29 identycznych**, zbiór SHA `git hash-object` zgodny (`set equal: True`, `count matched: 29`).
- Przykład (ai-params.json): `9965e8c35871b7d5423a750e810ce1e7def91e7a` — identyczny po obu stronach.

## 5. Wyniki `cargo test --offline` (CARGO_TARGET_DIR=/home/user/cargo-target-shared, CARGO_PROFILE_DEV_DEBUG=0)

- **Baseline (bez nowego pliku):** exit 0, 256 passed, 0 failed (zgodne z dispatchem „oczekiwane 256”). Log: `dyspozycje/autobot/runs/R-RUSTPORT-P3-11-DATA-COMPLIANCE-Q1/00-cargo-test-baseline.log`.
- **Po zmianie:** `EXIT=0`, **265 passed**, 0 failed, 0 ignored. Liczba testów > baseline (+9). Żaden istniejący test nie zniknął. Log: `dyspozycje/autobot/runs/R-RUSTPORT-P3-11-DATA-COMPLIANCE-Q1/01-cargo-test-after.log`.
- Wynik `data_compliance`: `test result: ok. 9 passed; 0 failed; 0 ignored`.
- Brak ostrzeżeń kompilatora dla nowego pliku.

## 6. LUKA: 1:1 round-trip nie jest możliwy dla 22 z 29 plików bez zmiany `src/data/**`

Test typu „typed -> `serde_json::Value` == plik” wymaga `#[derive(Serialize)]`. Stan na pinie:

- `src/data/civilizations.rs`: 82 wystąpienia `Serialize` — round-trip pokryty przez `data_civilizations.rs` (7 plików).
- `src/data/buildings_tech.rs`, `economy_society.rs`, `economy_society_part2.rs`, `terrain_map.rs`, `units_combat.rs`: **0** wystąpień `Serialize` (tylko `Deserialize`).

Zatem 1:1 round-trip dla `buildings`, `wonders`, `tech`, `units`, `resources`, `terrain-*`, `econ-params`, `society-params`, `ai-params`, `e-start-params`, `ui-params`, `miasto-params`, `counters`, `combat-params`, `power-params`, itd. jest niewykonalny w tym temacie (dodanie derive = zmiana `src/data/**`, poza allowlistą). Nie osłabiono testu po cichu: nie ma testu, który by udawał round-trip.

Ryzyko gubienia pól (ustalenie, nie błąd testu):

- Struktury z `#[serde(deny_unknown_fields)]` (`terrain_map.rs` 29 wystąpień, `units_combat.rs` 27, `civilizations.rs` 77): nieznany klucz JSON powoduje błąd parsowania. Sukces parsowania = zbiór kluczy JSON jest zamodelowany (dla pól nieopcjonalnych).
- Struktury BEZ `deny_unknown_fields` (`buildings_tech.rs`, `economy_society.rs`, `economy_society_part2.rs`): nieznane klucze są **cicho pomijane**. Dla tych plików kompletność pól nie jest sprawdzana przez żaden test w tym temacie. Zamknięcie wymaga osobnego tematu (dodanie `Serialize` lub `deny_unknown_fields` w `src/data/**` + round-trip).

## 7. Ustalenia

1. Dane Rust (29 plików JSON) są bajtowo identyczne z pinem `edb8fb56`. Brak rozbieżności danych wykrytej przez testy.
2. Liczności i zbiory ID kluczowych kolekcji zgodne z pinem (9 testów zielonych).
3. Rozbieżność z dispatchem: liczba plików JSON to 29, nie 27.
4. Luka 1:1 round-trip — patrz punkt 6. Test NIE jest oznaczony `#[ignore]` (nie było czego ignorować: test nie został napisany).
