# P6.8H2 — Dostęp do zasobów, partia B (stolica gracza + etykiety + dostęp miasta)

Status: CZĘŚCIOWO — runda 3/5 (Operator, po FC r2 FAIL). Zakres `resource-access.ts` (16 funkcji)
domknięty z zachowanymi lukami ZAŁOŻONYMI niżej (Z1, Z6, Z7). Kryteria końca NIE są w pełni spełnione.
Pin wektorów: `91dc998a`. Commit: patrz `dyspozycje/autobot/runs/R-RUSTPORT-P6-8H2-DOSTEP-ZASOBOW-B-Q1/04-operator-r3.md` (SHA).
Historia: r1 `598da6429` (stolica + etykiety), r2 `93815cafc` (FC FAIL `099296ace`), r3 = ten commit.

## Symbole `society-inputs.ts` i `resource-access.ts` — status per symbol

| Symbol web (plik:linia pinu) | Port Rust | Status | Test / dowód |
|---|---|---|---|
| `isPlayerCapitalCity` (society-inputs.ts:89) | `resource_access/capital_labels.rs` `is_player_capital_city` | PORTED; ZAŁOŻENIE: `found_order` wstrzykiwany (`grep -rn 'found_order\|cityFoundOrder' rust-port/engine/src` = brak) | `p6_8h2_capital_labels.rs` (11) |
| `stolicaEasyBonusActive` | `capital_labels.rs` `stolica_easy_bonus_active` | PORTED | `p6_8h2_capital_labels.rs`, M08–M13 |
| `isForeignReligionDominant` (society-inputs.ts:11) | — | **NIE PORTOWANE → NASTĘPNA-PARTIA** (zależy od `dominantReligion`, culture-religion.ts:698; `grep -rn 'fn dominant_religion\|fn is_foreign_religion' rust-port/engine/src` = brak) | — (Z6) |
| `clearCityCultureMix` (society-inputs.ts:40) | `state.rs:546` `clear_city_culture_mix` (właściwa ścieżka); `resource_access.rs:319` duplikat bez wywołującego | PORTED w state.rs; duplikat w resource_access.rs — do ujednolicenia w następnej partii (allowlista: state.rs tylko odczyt) | wywołanie web: `conquest-stability.ts:51` (ten sam kulturowy krąg); Rust: `state.rs:581` |
| `placedImprovementsWithZlotoTradeGrant` (zloto-access.ts:140, no-op) | `resource_access.rs:265` `placed_improvements_with_zloto_trade_grant` | PORTED (no-op) — **brak wywołującego w Rust** (hak bez produkcyjnego wywołującego → NASTĘPNA-PARTIA) | Web: składany w `main.ts:5084` `placedImprovementsWithTradeGrants`, wywoływany w 9 miejscach `main.ts` (6625, 6659, 7679, 8755, 16051, 26543, 34604, 35888, 37324). Z7 |
| `labelForHex` (prywatna) | `active_access.rs` `label_for_hex` | PORTED (rozbieżność Z5 dla `constructor`) | `hex_labels_match_pinned_web_vectors_except_documented_prototype_keys` |
| `hexDepositDisplayLabel` | `hex_deposit_display_label` | PORTED | jw. (1224 przypadki hex) |
| `hexHiddenDepositHint` | `hex_hidden_deposit_hint` | PORTED (Z5) | jw. |
| `labelsForImprovementUnlock` | `labels_for_improvement_unlock` | PORTED | `labels_for_improvement_unlock_match_pinned_web_vectors` (22 klucze) |
| `parseSurowiecOdblokowany` | `parse_surowiec_odblokowany` | PORTED | `surowiec_parse_branches` + wektory |
| `improvementUnlockActiveOnHex` | `improvement_unlock_active_on_hex` | PORTED | `unlock_activity_matches_pinned_web_vectors` (3960 przypadków) |
| `labelsForKopalniaMiedziOnHex` | `labels_for_kopalnia_miedzi_on_hex` | PORTED | wektory city; M08 (ekwiwalent) |
| `activeLabelsForImprovementOnHex` | `active_labels_for_improvement_on_hex` | PORTED | wektory city; M09 |
| `sortLabels` (`localeCompare(_, 'pl')`) | `active_access.rs` `sort_labels` + `pl_collation_cmp` | PORTED przybliżenie (Z4) | `polish_collation_matches_locale_compare_over_label_universe` (900 par, 30 etykiet) |
| `filterCityPanelRangeLabels` + `CITY_PANEL_RANGE_DEPOSIT_LABELS` | `capital_labels.rs` `city_panel_range_deposit_labels` | PORTED (r1) | `panel_range_filter_keeps_only_three_and_sorts`, M14–M15 |
| `hexesInCitySight` | inline w `collect_deposit_potential` (`hex_keys_within_radius` + `axial_distance`) | PORTED | M12, M13, `potential_sight_boundary_n_minus_1_n_n_plus_1` |
| `collectDepositPotential` | `collect_deposit_potential` | PORTED | wektory city |
| `collectActiveAccess` | `collect_active_access` (bez gałęzi `computeEmpireLivestockUnlocks`, Z1) | PORTED z lukami Z1 | M10, M11, M14–M16, M26, M29; `sight_boundary_n_minus_1_n_n_plus_1` |
| `getCityResourceAccessForCity` | `get_city_resource_access_for_city` | PORTED | wektory city (8116 przypadków) |
| `getResourceAccessForCity` | `get_resource_access_for_city` | PORTED | jw. |
| `improvementKeysOnPlacedHex` | `resource_access.rs` `keys_normalized_only` (partia A, reuse) | PORTED (reuse) | jw. |
| `computeEmpireLivestockUnlocks` (livestock-unlock.ts:113) | — | **NIE PORTOWANE** (poza 16 funkcjami; `grep -rn computeEmpireLivestockUnlocks rust-port/engine/src` = brak) — Z1 | — |

Podsumowanie: 16/16 funkcji `resource-access.ts` w Rust (z zastrzeżeniami Z1, Z4, Z5); 3 pozycje zakresu z dispatchu poza tym zbiorem: `isForeignReligionDominant` (NIE), `computeEmpireLivestockUnlocks` (NIE), `placedImprovementsWithZlotoTradeGrant` (port no-op bez wywołującego).

## Założenia i rozbieżności (jawne)

- **Z1 — `computeEmpireLivestockUnlocks` nie portowane.** Web: `options.empireLivestockUnlocks ?? (placedImprovements ? compute(...) : undefined)` (resource-access.ts:~307). Rust przyjmuje wynik gotowy (`empire_livestock_unlocks`). Gałąź `compute` NIE JEST zmierzona: wektory zawsze podają jawny zbiór, a `UNDEF` tylko przy `placed = null`. Kandydat na następną partię.
- **Z2 — `cityBorderRadius` (P6.16) wstrzykiwane** jako `border_radius: &dyn Fn(f64)->f64`; w wektorach tabela `borderTable` z web `cityBorderRadius` (klucz `String(kultura)`, `NaN`).
- **Z3 — `zlozeMinEra`** w `BuildHex` nie istnieje; wektory używają realistycznego stanu (pole nieobecne; `zlozeMinEraFor` = tabela metali / domyślna = `ensureDepositEraMeta`).
- **Z4 — `localeCompare(_, 'pl')`** przybliżone `pl_collation_cmp` (polskie litery z ogonkami jako osobne litery za podstawową: Ą za A, Ó za O, Ś za S, Ź/Ż za Z; wielkość liter: małe przed dużymi). Zweryfikowane 900 parami dla uniwersum 30 etykiet, nie dla pełnego ICU.
- **Z5 — prototypowe klucze JS (`constructor`).** Web: `ZLOZE_LABEL['constructor']` i `METAL_DEPOSIT_MIN_ERA['constructor']` zwracają funkcję z `Object.prototype` (`!= null` = prawda). Efekt w web: złoże `constructor` jest ZAWSZE ukryte (porównanie z funkcją = false), `hexHiddenDepositHint` zawiera tekst funkcji. Rust: `zloze_min_era_for` (`mapgen/params.rs:1340`, poza allowlistą) nie zna klucza → widoczna etykieta `Constructor` od epoki domyślnej. Dotyczy wyłącznie `hexDepositDisplayLabel` / `hexHiddenDepositHint` (72 przypadki pominięte w teście, marker `<<fn:...>>` w wektorach). Wyniki miast NIE są dotknięte (filtr panelu zostawia tylko Koń/Sól/Złoto; wektory miast z tym złożem przechodzą). Dane mapy nie zawierają `constructor` (NIE_ZMIERZONO w generatorze mapy) — do decyzji FC.
- **Z6 — `isForeignReligionDominant` NIE PORTOWANE** (zależność `dominantReligion`/`leadingReligion`, culture-religion.ts:698, brak w Rust).
- **Z7 — `placedImprovementsWithZlotoTradeGrant` (no-op):** port istnieje, brak wywołującego w Rust; web wywołuje przez `placedImprovementsWithTradeGrants` (main.ts:5084, 9 miejsc). Hak zostaje w module jako NASTĘPNA-PARTIA (lekcja 3).
- **Duplikat:** `clear_city_culture_mix` w `resource_access.rs:319` i w `state.rs:546` — ten sam byt; wywołanie produkcyjne tylko z `state.rs:581`.

## Wektory z pinu `91dc998a`

- Generator: `rust-port/engine/tests/p6_8h2_vectors/gen-vectors.sh` (`git archive` do katalogu tymczasowego; `esbuild@0.28.2`, `three@0.160.0`; `gra/` nie budowane), `gen_cases.py` (deterministyczny), `entry.ts.in` (szablon bundla).
- Pliki: `cases.json` (2 726 461 B), `vectors.json` (893 605 B), razem ~3,6 MB (≤ 6 MB).
- Liczby: city 8116, hex 1224, unlock 3960, labelsUnlock 22, plPairs 900, borderTable 6 kluczy.
- Regeneracja: 2× bajt-identyczna. md5 `vectors.json` = `28e36ce6e6297592f3229911ee462e99`, `cases.json` = `c75348a1c5bfa4b4480740d4261e52a0`.

## Mutacje (gałęzie sterujące)

Skrypty (ścieżki względne): `mutacje-p6-8h2-b-active.py`, `mutacje-p6-8h2-b-capital.py`, `mutacja-m13-bez-testu.py`. Logi surowe: `mutacje-wyniki-r3-active.txt` (append-only: wpisy M25/M19/M21/M22/M29 po poprawkach skryptu; `M25 NIE_ZASTOSOWANO` to błąd dopasowania fragmentu po rustfmt, poprawiony), `mutacje-wyniki-r3-capital.txt`, `mutacja-m13-bez-testu-wynik.txt`.

### `active_access.rs` — 29 mutantów: 26 KILLED, 3 SURVIVED = RÓWNOWAŻNE (dowód niżej)

| ID | Gałąź | Wynik |
|---|---|---|
| M01–M07 | `label_for_hex` (guard widoczności, nakładka Rudy), `hex_hidden_deposit_hint` (guard), `improvement_unlock_active_on_hex` (NO_DEPOSIT, LIVESTOCK, `||`→`&&` w warzelni, DEPOSIT_LINKED) | KILLED |
| M08 | `labels_for_kopalnia_miedzi_on_hex`: `\|\|`→`&&` | SURVIVED = RÓWNOWAŻNY (obie gałęzie dają `["Ruda"]`: `kopalnia_miedzi.surowiecOdblokowany = "ruda"` → `SUROWIEC_KEY_LABEL.ruda = "Ruda"`, `terrain-improvements.json`, `resource-access.ts`) |
| M09 | `active_labels`: LIVESTOCK_NOT_RESOURCE | KILLED |
| M10–M13 | bramki `sight > 0` (aktywny i potencjał), dystans `> sight`→`>=` (aktywny i potencjał) | KILLED |
| M14–M16 | gałęzie: livestock `kon`, Brąz (`has_braz_access`), Złoto (`owner_has_zloto_stock`) | KILLED |
| M17 | wykluczenie aktywnych z potencjału | KILLED |
| M18–M20 | `parse_surowiec`: `starts_with('[')`, pusty napis, lista | KILLED |
| M21 | filtr pustych etykiet w `labels_for_improvement_unlock` | SURVIVED = RÓWNOWAŻNY: `surowiec_label_or_capitalized(k)` nie daje `""` dla niepustego `k`; w danych nie ma pustego `surowiecOdblokowany` (sprawdzone skryptem: `[] `) |
| M22 | filtr pustego klucza | SURVIVED = RÓWNOWAŻNY: `""` nie jest kluczem `terrain-improvements.json` (sprawdzone: `'' in d` = False), więc `row("")` = None → ta sama ścieżka `[]` |
| M23 | poziom wielkości liter w `pl_collation_cmp` | KILLED |
| M24 | wpis `era_ui_name` (2 → Brąz) | KILLED |
| M25 | domyślna kultura `unwrap_or(0.0)` → `1.0` | KILLED |
| M26 | gałąź `if let Some(placed)` → nigdy | KILLED |
| M27 | operand `zloze == "sol"` w warzelni | KILLED |
| M28 | brak normalizacji klucza → `true` | KILLED |
| M29 | klucz spoza mapy: `continue` → `return` | KILLED (dodany przypadek `9,9` w wektorach) |

### `capital_labels.rs` — tabele i gałąź `if let Some` (zarzut FC 5)

| ID | Cel | Wynik |
|---|---|---|
| C01 | `surowiec_label_or_capitalized`: gałąź `if let Some(label)` → nigdy | KILLED |
| C02–C04 | wiersze tabeli SUROWIEC (`zloto`, `kon`, `braz`) | KILLED |
| C05–C07 | wiersze tabeli ZLOZE (`miedz`, `sol`, `wegiel`) | KILLED |

Poprzednie mutanty r1/r2 (M01–M19 w `mutacje-p6-8h2-b.py`, `mutacje-wyniki-a/b.txt`) pozostają ważne; test stolicy z designated (`stolica_bonus_honours_designated_capital`) jest od r2.

### Zarzut FC 6 — surowy log M13 przed poprawką

`mutacja-m13-bez-testu.py` na teście z commita `598da6429` (bez testu designated): **M13 SURVIVED rc=0** (`mutacja-m13-bez-testu-wynik.txt`). Z obecnym testem: KILLED (r2).

## Bramki (surowe logi w katalogu runu, z `EXIT=`)

- `gate-fmt-r3.txt`: `cargo fmt --check -p civ-engine` — EXIT=0.
- `gate-clippy-r3.txt`: `cargo clippy -p civ-engine --all-targets -- -D warnings` — EXIT=0.
- `gate-test-p6_8h2-r3.txt`: `p6_8h2_active_access` 11 passed, `p6_8h2_capital_labels` 11 passed, `p6_8h_access` 13 passed — EXIT=0.
- `gate-test-regression-r3.txt`: ta sama seria (regresja).
- `gate-test-full-r3.txt`: `cargo test -p civ-engine --no-fail-fast` — 1962 passed, 0 failed — EXIT=0 (r2: 1951).
- `git diff --check`: `gate-diffcheck-r3.txt` (po `git add` allowlisty, `--cached`).

## Pozostałe kryteria końca — status

- Wektory z pinu `91dc998a`: SPEŁNIONE (generator w repo, regeneracja bajt-identyczna).
- Mutacje na KAŻDEJ gałęzi sterującej: SPEŁNIONE dla `active_access.rs` i tabel `capital_labels.rs`; gałęzie NIE objęte: compute `computeEmpireLivestockUnlocks` (Z1 — brak kodu).
- Brzegi N-1/N/N+1: dystans aktywny i potencjał, zasięg miasta (`sight_boundary_*`, `potential_sight_boundary_*`).
- NaN / brakujące klucze: populacja NaN, kultura NaN, skarb NaN, klucz spoza mapy, `zloze` `undefined`/`null`, prototypy `constructor` (Z5).
- Komparatory V8: `localeCompare` przybliżone i zweryfikowane (Z4).
- NIE SPEŁNIONE: Z1, Z6, Z7 (zakres); wywołania `placedImprovementsWithZlotoTradeGrant` i `clearCityCultureMix` opisane z grep (powyżej).

## Nieśledzone (poza allowlistą, nie commitowane)

- `rust-port/engine/Cargo.lock` — artefakt builda; usuwany przed commitem.
- Gałąź `p6-8h2-dostep-zasobow-b` wskazuje `598da6429`; przeniesienie na SHA końcowy: krok integracji (lokalna gałąź, bez push), patrz raport r3.
