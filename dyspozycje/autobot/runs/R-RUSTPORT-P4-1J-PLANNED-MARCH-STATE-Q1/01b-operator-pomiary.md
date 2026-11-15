# 01b — Operator (pomiary) · R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1 · runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1
GOAL: niezalezny pomiar implementacji Operatora r1 (2169bd17d): bramki, mutanty, golden zapis.
ZMIANY/COMMIT: nowy test rust-port/engine/tests/p4_1j_planned_march_bounds.rs (domyka 2 mutanty, ktore
      przezyly); ten raport; skrypt mutantow mut-p4-1j-pomiary.py; zrodlo pomiaru golden
      zz_p4_1j_pomiary_golden.rs.txt. Galaz R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1-wip/operator-pomiary
      od 2169bd17d. Kod produkcyjny (playable.rs, save_load.rs) BEZ ZMIAN.
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --all-targets EXIT 0
      (470 zestawow, 3394 passed, 0 failed, 1 ignored = istniejacy e2e::dump_tick1_econ_for_web_generator);
      git diff --check a01363d5f..HEAD czysto; mutanty 21/21 zabite (19 przed nowym testem, N7/N8 po nim);
      golden: 392 pliki JSON fixtur, strumien reserializacji SHA-256 identyczny baza/galaz.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

## 0. Baza i rozbieznosc w poleceniu

- Polecenie workflow wspomina „DODATEK r2” i „parity-v2 zawiera 7817ef0c”. Sprawdzone ponownie:
  `git show origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1/00-dispatch.md`
  to nadal wersja **runda 1** bez dodatku (ostatni commit w katalogu runu na `claude/rust-sivvrn`: `3b025a272`).
  `origin/rust-port/parity-v2` = `a01363d5f`. Pracowalem wg dispatchu rundy 1 (rola Operator-pomiary).
- Baza pomiarow: `2169bd17d` (Operator r1); `git merge-base --is-ancestor a01363d5f 2169bd17d` = tak.
- Gałąź Operatora r1 jest zajeta w innym worktree, wiec pomiary ida na nowej galezi
  `R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1-wip/operator-pomiary` (rodzic `2169bd17d`).

## 1. Bramki (czysty `CARGO_TARGET_DIR` poza repo; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`)

| Bramka | Na `2169bd17d` (przed nowym testem) | Na HEAD tej galezi (z nowym testem) |
|---|---|---|
| `cargo fmt --check` (`rust-port/engine`) | EXIT 0 | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0; 469 zestawow; 3393 passed; 0 failed; 1 ignored | EXIT 0; 470 zestawow; 3394 passed; 0 failed; 1 ignored |
| `git diff --check a01363d5f HEAD` | czysto | czysto |

Jedyny `ignored` = istniejacy `e2e::dump_tick1_econ_for_web_generator` (nie z P4-1J). Liczby z r1 (3393/469)
potwierdzone niezaleznie.

Testy P4-1J w pelnym przebiegu: `p4_1j_planned_march_state` 8/8, `p4_1j_planned_march_pin_vectors` 4/4,
`p4_1j_planned_march_bounds` 1/1.

## 2. Mutanty (niezalezne od M1–M6 z r1)

Skrypt: `mut-p4-1j-pomiary.py` (ten katalog). Kazdy mutant = jedna zamiana tekstu (dokladnie jedno
wystapienie), `cargo test --test p4_1j_planned_march_state --test p4_1j_planned_march_pin_vectors
[--test p4_1j_planned_march_bounds] --no-fail-fast`, przywrocenie pliku `git checkout`. Po przebiegu
`git status` = tylko nowe pliki (zrodla bez zmian).

| Mutant | Plik | Opis | Wynik | Zabijajace testy |
|---|---|---|---|---|
| N1 | playable.rs | `PlayableMarchStopReason` `snake_case` -> `camelCase` | ZABITY | `full_state_roundtrips…`, `state_cases…`, `stop_reasons_serialize_as_web_literals` |
| N2 | playable.rs | `plannedMarches` bez `skip_serializing_if` | ZABITY | `empty_fields_are_omitted…`, `golden_state_files_reserialize_byte_identical` |
| N3 | playable.rs | `marchStopDetail` bez `serde(default)` | ZABITY | `empty_fields_are_omitted…`, `golden_state_files…` |
| N4 | playable.rs | `PlayablePlannedMarch` bez `rename_all = camelCase` | ZABITY | `full_state_roundtrips…` |
| N5 | save_load.rs | odczyt nie czysci `marchStopNotified` | ZABITY | `raw_cases…`, `state_cases…` |
| N6 | save_load.rs | odczyt nie czysci `marchAttackTargets` | ZABITY | `raw_cases…`, `state_cases…` |
| N7 | save_load.rs | `js_i32`: `i32::MAX` wykluczone (`<` zamiast `<=`) | **PRZEZYL** na r1 -> ZABITY po nowym tescie | `i32_bounds_roundtrip_and_one_past_is_reported` |
| N8 | save_load.rs | `js_i32`: `i32::MIN` wykluczone (`>` zamiast `>=`) | **PRZEZYL** na r1 -> ZABITY po nowym tescie | `i32_bounds_roundtrip_and_one_past_is_reported` |
| N9 | save_load.rs | `canonical_unit_id` przyjmuje niekanoniczne (`"07"`) | ZABITY | `raw_cases…`, `raw_deviation_case_is_reported_by_name` |
| N10 | save_load.rs | zapis: klucze nie-indeksy przed indeksami (odwrocona regula sortowania) | ZABITY | `state_cases…` |
| N10b | save_load.rs | zapis: brak sortowania (kolejnosc `Map` zamiast kolejnosci kluczy obiektu JS) | ZABITY | `save_uses_map_semantics…`, `state_cases…` |
| N11 | save_load.rs | `with_playable_planned_marches` gubi `autoMarch` | ZABITY | `state_cases…` |
| N12 | save_load.rs | zapis gubi `attackUnitId` | ZABITY | `save_uses_map_semantics…`, `state_cases…` |
| N13 | save_load.rs | odczyt: zamienione x/y jednostki w filtrze „na celu” | ZABITY | `raw_cases…`, `state_cases…` |
| N14 | save_load.rs | raport nie zbiera `general_target_dropped` | ZABITY | `raw_cases…`, `restore_reports_general_target…` |
| N15 | save_load.rs | nadpisanie planu bez celu nie usuwa celu ataku (`syncMarchAttackTarget` delete) | ZABITY | `restore_keeps_one_entry_per_unit…` |
| N16 | save_load.rs | wspolrzedne zapisu jako float JSON (`3.0`) | ZABITY | `save_uses_map_semantics…`, `state_cases…` |
| N17 | save_load.rs | powtorzony `unitId` dopisywany zamiast nadpisany | ZABITY | `restore_keeps_one_entry_per_unit…` |
| N18 | save_load.rs | odczyt ignoruje legacy `autoMarch` | ZABITY | `raw_cases…` |
| N19 | save_load.rs | odczyt nie czysci `plannedMarches` | ZABITY | `raw_cases…`, `restore_keeps_one_entry…`, `state_cases…` |

Pierwszy przebieg N10 dal `BLAD-WZORCA(2)` (ten sam wzorzec `map_or((1, 0), …)` jest tez w istniejacym
odczycie `save_load.rs:466`); powtorzony z wzorcem zawezonym do linii 862 (zapis P4-1J) — ZABITY.

**Znalezisko pomiarow (luka testowa, nie blad kodu):** granice `i32::MIN`/`i32::MAX` celu nie byly
pokryte; mutanty N7/N8 przechodzily wszystkie testy P4-1J. Skutek mutacji: cel `i32::MAX` z zapisu
trafilby do `unrepresentable` (utrata planu, ktory web trzyma), a zapis planu z takim celem mialby
`destQ = null`. Domkniete testem `tests/p4_1j_planned_march_bounds.rs` (allowlista
`tests/p4_1j_planned_march_*.rs`): MIN/MAX w `destQ` i `destR` przechodza odczyt, zapis (liczby calkowite
JSON) i ponowny odczyt bez zmian; o jeden poza zakresem (4 przypadki) -> `unrepresentable = ["5","6","7","8"]`.
Wzorzec `#[allow(dead_code, unused_imports)]` przy `mod save_load` jak w `p6_wire_war_state.rs:12`.

## 3. Golden zapis — pomiar baza vs galaz (niezalezny od pomiaru r1)

Zrodlo: `zz_p4_1j_pomiary_golden.rs.txt` (tymczasowy test, NIE commitowany jako test; kopia zrodla
w katalogu runu). Ten sam plik uruchomiony na `git archive a01363d5f rust-port/engine` i na
`git archive 2169bd17d rust-port/engine`:

- przechodzi WSZYSTKIE pliki `*.json` w `rust-port/engine/tests/**` (392 pliki); kazdy probuje odczytac
  jako `PlayableState` i jako zapis (`decode_snapshot_str`, loader jak produkcyjny); udane odczyty
  reserializuje (compact, pretty, pretty z `Value`); dopisuje `PlayableState::empty()`,
  `PlayableGame::new(default)` i stan po `advance_turn()`;
- wynik: `files=392 state=3 state_identical=2 snap=0`, strumien 77 305 bajtow,
  **SHA-256 `bacb82e4fe54f1e6b901e94f93c04259bf85a477f9b245eb853f9e921897c5dd` na bazie i na galezi, `cmp` = identyczne.**
- 3 pliki stanu = te same co w r1 (`pre-etap2-state.json`, `old_state_pre_pop.json`, `save_pre_stores.json`);
  2 z 3 odtwarzaja bajty pliku (trzeci juz na bazie nie, pole `population`/`culture` — zgodnie z r1).
- `snap=0`: w repo nie ma plikow fixtur JSON w formacie `SaveSnapshot` (testy zapisu buduja JSON w kodzie,
  np. `tests/save_load.rs:95`, `:139`, `:158`). Zgodnosc zapisu bez planow pokrywaja: pelny `cargo test`
  (wszystkie istniejace testy zapisu zielone) i `snapshot_without_plans_is_byte_identical`.
- `git diff --stat a01363d5f HEAD -- rust-port/engine/tests` poza nowymi `p4_1j_*` = pusty: zadna fixtura
  nie zmieniona.

## 4. Kontrola zakresu i kryteriow dispatchu

| Kryterium | Pomiar |
|---|---|
| 1. Pola §8 z `serde(default, skip_serializing_if)` | potwierdzone w diffie; N2/N3 dowodza, ze atrybuty sa testowane |
| 2. Round-trip z planami i bez; golden bez zmian bajtowych | `state_cases` (67), `raw_cases` (78), nowy test granic; SHA golden §3 |
| 3. Pusta lista nie zmienia zapisu | `snapshot_without_plans_is_byte_identical`; N2 zabity |
| 4. Brak `#[ignore]`, brak oslabionych asercji, `forbid(unsafe_code)` | w diffie `+` 0 trafien `#[ignore]`/`unsafe`/`allow(clippy`; `forbid(unsafe_code)` jest tylko w `view-model` i `renderer` (`lib.rs`), w `civ-engine` nie bylo go na bazie — nic nie usuniete |
| 5. Twierdzenia o webie z plik:linia | wyrywkowo sprawdzone na pinie `07d2fbd72`: `planned-march.ts:16-23` (`PlannedMarchDest`), `:35` (`MarchStopReason`), `:451-482`, `:485-501`; `main.ts:31004/31007/31009/31016`, `:31124-31130`, `:37184`, `:37243-37244`, `:46272-46287` — zgodne z raportem r1 |
| Allowlista | zmiany wzgledem `a01363d5f`: `playable.rs`, `save_load.rs`, `tests/p4_1j_planned_march_{state,pin_vectors,bounds}.rs`, katalog runu; `gra/`, `renderer/`, `view-model/`, `src-tauri/` = 0 zmian; `Cargo.lock` nieśledzony, nie dodany |

Dodatkowa obserwacja parytetu (bez akcji): web `syncMarchAttackTarget` (`main.ts:31125`) i
`plannedMarchesFromSave` (`planned-march.ts:468`) traktuja `attackUnitId = ""` jak brak celu; port
`ruch_jednostek::planned_marches_from_save` (`pathfinding.rs:2197-2201`) filtruje pusty napis przed
`canonical_unit_id`, wiec pusty `attackUnitId` nie powoduje pominiecia planu — zgodnie z webem.

## 5. Dla Evaluatora

1. Rozbieznosc polecenia (DODATEK r2 / `7817ef0c`) nadal nierozstrzygnieta — do orkiestratora.
2. Decyzja techniczna r1 (typy `UnitId`/`i32` + raport `unrepresentable`) wymaga wpisu w `REJESTR-RUST.md`
   (poza allowlista Operatora).
3. Nowy test granic to jedyna zmiana tej rundy pomiarow; kod produkcyjny nietkniety.
