# P6.8H2 — Dostęp do zasobów, partia B (stolica gracza + etykiety)

Status: CZĘŚCIOWO (runda 1/5, Operator-pomiary). Kryteria końca NIE są spełnione.
Commit portu: `598da6429`; pomiary i poprawki: patrz `dyspozycje/autobot/runs/R-RUSTPORT-P6-8H2-DOSTEP-ZASOBOW-B-Q1/02-operator-pomiary-r1.md`.

## Zrealizowane (plik:linia)

| Symbol web | Port Rust | Status | Test |
|---|---|---|---|
| `isPlayerCapitalCity` (society-inputs.ts) | `resource_access/capital_labels.rs` `is_player_capital_city` | PORTED; ZAŁOŻENIE: `found_order` wstrzykiwany (brak `cityFoundOrder` w Rust; `grep -rn 'found_order\|cityFoundOrder' rust-port/engine/src` = brak) | `tests/p6_8h2_capital_labels.rs` `designated_*`, `non_human_owner_*`, `tie_keeps_*` |
| `stolicaEasyBonusActive` | `capital_labels.rs` `stolica_easy_bonus_active` (granice 1..=maxTur, N-1/N/N+1) | PORTED | `turn_bounds_n_minus_1_n_n_plus_1`, `non_easy_difficulty_disables_bonus`, `stolica_bonus_honours_designated_capital` |
| `SUROWIEC_KEY_LABEL` | `surowiec_key_label`, `surowiec_label_or_capitalized` | PORTED | `surowiec_labels_full_table`, `surowiec_fallback_capitalizes_and_empty_is_empty` |
| `ZLOZE_LABEL` | `zloze_label` | PORTED | `zloze_labels_table` |
| `CITY_PANEL_RANGE_DEPOSIT_LABELS` + `filterCityPanelRangeLabels` | `city_panel_range_deposit_labels` | PORTED (porządek bajtowy = localeCompare dla zbioru zamkniętego) | `panel_range_filter_keeps_only_three_and_sorts` |

## Niezrealizowane

| Symbol web | Status |
|---|---|
| `collectActiveAccess`, `getCityResourceAccessForCity`, `getResourceAccessForCity` i pozostałe 13 funkcji `resource-access.ts` (z 16) | NIE PORTOWANE (następna runda Operatora) |
| `clearCityCultureMix` (state.rs:544-581) | NIE ZMIERZONO (tylko dopiski, brak zmian) |
| `placedImprovementsWithZlotoTradeGrant` (main.ts) | NIE ZBADANO (wywołujących nie sprawdzono) |

## Tabela mutantów (gałęzie sterujące `capital_labels.rs`)

Skrypt: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8H2-DOSTEP-ZASOBOW-B-Q1/mutacje-p6-8h2-b.py`.
Wyniki surowe: `mutacje-wyniki-a.txt`, `mutacje-wyniki-b.txt`. Stan po: 19/19 KILLED, 0 SURVIVED.

| ID | Gałąź / symbol | Mutant | Wynik |
|---|---|---|---|
| M01 | `is_player_capital_city`: `if !human_owner_ids.contains` | guard -> `false` | KILLED |
| M02 | designated `return designated == city.id` | `==` -> `!=` | KILLED |
| M03 | designated `return designated == city.id` | -> `false` | KILLED |
| M04 | pętla: `if candidate.owner_id != city.owner_id` | `!=` -> `==` | KILLED |
| M05 | tie-break `order < first_order` | `<` -> `<=` | KILLED |
| M06 | `first.is_none() \|\| order < first_order` | usunięty `first.is_none()` | KILLED |
| M07 | wynik `first.is_some_and(f.id == city.id)` | -> `first.is_some()` | KILLED |
| M08 | `stolica`: `if !is_easy` | -> `if is_easy` | KILLED |
| M09 | `stolica`: `!turn.is_finite() \|\| ...` | usunięty `!is_finite` | KILLED |
| M10 | dolna granica `turn < 1.0` | `<=` | KILLED |
| M11 | górna granica `turn > max_tur` | `>=` | KILLED |
| M12 | `stolica` przekazuje owner `&[0]` | `&[1]` | KILLED |
| M13 | `stolica` przekazuje `designated_capital_id` | `None` | KILLED (po dodaniu `stolica_bonus_honours_designated_capital`; przed dodaniem: SURVIVED) |
| M14 | `city_panel_range_deposit_labels` filtr | negacja | KILLED |
| M15 | `city_panel_range_deposit_labels` sort | usunięty `sort()` | KILLED |
| M16 | `surowiec_label_or_capitalized`: `None => ""` | -> `"X"` | KILLED |
| M17 | fallback `to_uppercase` | bez uppercase | KILLED |
| M18 | `zloze_label`: `"cyna" => "Ruda cyny"` | -> `"Cyna"` | KILLED |
| M19 | `surowiec_key_label`: `"kon" => "Koń"` | -> `"Kon"` | KILLED |

Gałęzie NIE mutowane osobno (NIE_ZMIERZONO jako mutant): pozostałe 13 wpisów tabeli `surowiec_key_label` i `zloze_label` (pokryte asercjami równości w testach tabelarycznych); gałąź `if let Some(label)` w `surowiec_label_or_capitalized` (usunięcie zmieniłoby `kon` na `Kon`, co łapie `surowiec_fallback_capitalizes_and_empty_is_empty`; mutant nie uruchomiony).

## Testy i bramki (surowe logi w katalogu runu, z `EXIT=`)

- `gate-fmt.txt`: `cargo fmt --check -p civ-engine` — EXIT=0 (po `rustfmt` dwóch nowych plików).
- `gate-clippy.txt`: `cargo clippy -p civ-engine --all-targets -- -D warnings` — EXIT=0.
- `gate-test-p6_8h2.txt`: `cargo test --test p6_8h2_capital_labels` — 11 passed, EXIT=0.
- `gate-test-regression.txt`: `p6_8h2_capital_labels` 11 passed + `p6_8h_access` 13 passed, EXIT=0.
- `gate-test-full.txt`: `cargo test -p civ-engine` — 1951 passed, 0 failed, EXIT=0 (baza 1940 + 11 nowych).
- `git diff --check`: patrz raport pomiarowy.

## Brakujące kryteria końca

- Wektory z pinu `91dc998a` (bundle esbuild w `mktemp -d`) NIE wygenerowane; wektory w testach są ręczne wg kontraktu web.
- Wektory JS-vs-Rust (NaN, -0, trim, localeCompare, sort stabilny) poza zakresem partii B bez pinu.
- Mutacje tylko na `capital_labels.rs`; nie objęto jeszcze kodu z 13 niezportowanych funkcji.
- `Cargo.lock` w `rust-port/engine/` jest nieśledzony (artefakt builda, poza allowlistą) — nie commitowany.
