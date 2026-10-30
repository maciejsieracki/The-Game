# R-RUSTPORT-REPIN-WOJNA-2-Q1 - runda 4, obrona Operatora (odpowiedzi na zarzuty Evaluatora)

Baza: `4ec46dd08` (pomiary Operatora; Evaluator sprawdzal ten SHA). Commit obrony: podany w raporcie koncowym.

| Zarzut | Decyzja | Dowod / zmiana |
|---|---|---|
| 1 (sredni) brak produkcyjnego wpiecia auto-only i restore | PRZYJMUJE czesciowo | Dodano `battle_mode::player_battle_automatic_only_from_save(is_me, raw_version, battle_always_manual)` (funkcja w module lib, nie w tescie); helper testu uzywa jej. `src/domain/mod.rs` nie zawiera `save_load` (modul ladowany tylko przez sciezke w testach), wiec konsument w grze nie istnieje w grafie lib. Konsument stanu gry: NASTEPNA-PARTIA (ZALOZENIE). |
| 2 (niski) format `plannedMarches` web (obiekt uid->dest) vs Rust (lista) | PRZYJMUJE | `lenient_planned_marches` w `save_load.rs` akceptuje oba ksztalty (web: `planned-march.ts:440-462`, `null` pomijane). Test `planned_marches_web_object_form_decodes_like_list_form` na wektorach `planned-march-general.json` (fromSave). Zapis Rust pozostaje lista (format wewnetrzny). |
| 3 (niski) `#[allow(dead_code)]` na module w `tests/save_load.rs` | ODRZUCAM | Ten sam wzorzec module-level `allow` uzywa `tests/replay.rs:2,6,10` i `tests/save_load.rs:2`; linia dodana w R4 jest tym samym wzorcem dla sciezkowego modulu. Zmiana addytywna, asercje nietkniete. |
| 4 (niski, pokrycie) cienkie auto-only | PRZYJMUJE czesciowo | Dodano `player_auto_only_from_save_needs_player_marker_and_explicit_false_in_advanced` (isMe true/false, brak markera). Mutacja MB (ignorowanie isMe) zabita przez 3 testy. Wektory meta bez zmian (576 przypadkow, asercje 96/2 bez oslabienia). |
| 5 (informacyjny) typy niepoprawne -> blad serde; utrata pol web | PRZYJMUJE (typy), ODRZUCAM (utrata pol) | Typy: `lenient_object` dla `meta` i `autoMarch`; test `wrong_json_types_for_r4_fields_are_ignored_like_web_optional_lookups`. Utrata pol web (`savedAt`, `label`, `saveOrigin`): ZALOZENIE - snapshot Rust nie jest plikiem zapisu web; przenosi tylko pola R4. Zakres poza tematem. |

Mutacje (kazda przywrocona, `cmp` potwierdzony):
- MA: `Value::Object` w `plannedMarches` -> pusta lista -> FAILED `planned_marches_web_object_form_decodes_like_list_form` (KILLED).
- MB: `player_battle_automatic_only_from_save` z `true` zamiast `is_me` -> FAILED 3 testy (KILLED).

Bramki (`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, cel `/home/user/cargo-target-shared/wf_b78e75ce-90f-4`):
- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`clippy-r4-obrona.log`)
- `cargo test --no-fail-fast`: EXIT=0, 1637 passed / 0 failed (`test-r4-obrona.log`)

NASTEPNA-PARTIA: konsument stanu gry dla `player_battle_automatic_only_from_save` i wczytanie `plannedMarches` do gry (wymaga modulu save w grafie lib).
DEPLOY/PUSH: NIE WYKONANO
