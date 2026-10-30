# P6.8J — Społeczeństwo: `society-breakdown.ts` → Rust (dokument tematu)

**Temat:** `R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1`
**Źródło (web, pin):** `gra/src/game/society-breakdown.ts` @ `91dc998a` (1172 LOC, 36 funkcji eksportowanych)
**Cel Rust:** `rust-port/engine/src/domain/society_breakdown.rs` (+ `society_breakdown/breakdown.rs`, `society_breakdown/order.rs`)
**Wektory:** `rust-port/engine/tests/p6_8j_vectors/society.json` (wygenerowane z URUCHOMIONEGO weba 91dc998a, generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1/gen-p6-8j-society-vectors.mjs`)

## Założenia (jawne)

- **Z-8J-1.** Dokument nadrzędny podziału `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` (§9 treść tematu, §11 lista symboli `8J-P*`) NIE istnieje w repozytorium ani na gałęzi `origin/rust-port/parity-v2`. Tabela symboli poniżej jest więc jedynym trwałym źródłem listy symboli dla tego tematu; została zbudowana z pinowanego pliku TS (numery linii wg `91dc998a`) i z kodu Rust. Nie tworzono dokumentu nadrzędnego.
- **Z-8J-2.** `applyCivMatrixHappinessModifier` (TS:1077) — PORTOWANE (jest w pinie `91dc998a`, nie ma go w bieżącym `gra/src`; zgodnie z decyzją orkiestratora).
- **Z-8J-6.** Pliki `src` ≤ 600 LOC (`society_breakdown.rs` 539, `breakdown.rs` 349, `order.rs` 365+). Testy `tests/p6_8j_order.rs` (ok. 670 LOC) i `tests/p6_8j_guards.rs` są plikami testowymi (wyjątek testowy).
- **Z-8J-7.** `podzialLuksus` (TS:667) nie ma osobnej funkcji w Rust: jest wbudowany w `compute_happiness_breakdown` (`breakdown.rs:118-120`) jako `input.podzial_procent_luksus.unwrap_or(DEFAULT_PROCENT_LUKSUS)` (= 20, zgodnie z `DEFAULT_PODZIAL_HANDLU.procentLuksus`, `cities.ts:439`). Semantyka `??` z webu: tylko brak (`None`) zastępuje domyślną; `NaN` przechodzi dalej (jak w JS).

## Tabela symboli (36 funkcji z pinu 91dc998a)

| Linia TS | Symbol TS | Symbol Rust | Miejsce Rust (plik:linia) |
|---|---|---|---|
| 312 | `pickOsiedlePopBonus` | `pick_osiedle_pop_bonus` | society_breakdown:256 |
| 332 | `pickSociety` | `pick_society` | society_breakdown:217 |
| 349 | `pickSocietyArray` | `pick_society_array` | society_breakdown:231 |
| 416 | `loadSocietyScaleParams` | `load_society_scale_params` | society_breakdown:288 |
| 445 | `osiedlePopLabel` | `osiedle_pop_label` | society_breakdown:340 |
| 451 | `osiedlePopMax` | `osiedle_pop_max` | society_breakdown:346 |
| 465 | `isOsiedleRevoltImmune` | `is_osiedle_revolt_immune` | society_breakdown:355 |
| 475 | `loadRevoltParams` | `load_revolt_params` | society_breakdown:368 |
| 491 | `resolvePalacTier` | `resolve_palac_tier` | society_breakdown/breakdown:209 |
| 498 | `clampPct` | `clamp_pct` | society_breakdown:501 |
| 503 | `pctFromNetto` | `pct_from_netto` | society_breakdown:509 |
| 512 | `maxFromEraTable` | `max_from_era_table` | society_breakdown:387 |
| 519 | `szMaxForEra` | `sz_max_for_era` | society_breakdown:406 |
| 526 | `prawMaxForEra` | `praw_max_for_era` | society_breakdown:411 |
| 538 | `prawGarnizonBudynekForEra` | `praw_garnizon_budynek_for_era` | society_breakdown:416 |
| 550 | `kultReligScaleForEra` | `kult_relig_scale_for_era` | society_breakdown:421 |
| 573 | `proporcjonalneSzczescie` | `proporcjonalne_szczescie` | society_breakdown:441 |
| 585 | `ownShareFromSignal` | `own_share_from_signal` | society_breakdown:452 |
| 607 | `popScaleMultiplier` | `pop_scale_multiplier` | society_breakdown:458 |
| 616 | `szMaxForCity` | `sz_max_for_city` | society_breakdown:479 |
| 627 | `prawMaxForCity` | `praw_max_for_city` | society_breakdown:490 |
| 652 | `luksusHappinessBonus` | `luksus_happiness_bonus` | society_breakdown:515 |
| 667 | `podzialLuksus` | (wbudowane, patrz Z-8J-7) | society_breakdown/breakdown:118 |
| 676 | `udzialLineLabel` | `udzial_line_label` | society_breakdown/breakdown:181 |
| 701 | `computeHappinessBreakdown` | `compute_happiness_breakdown` | society_breakdown/breakdown:33 |
| 816 | `computeLawBreakdown` | `compute_law_breakdown` | society_breakdown/breakdown:218 |
| 911 | `porPctBand` | `por_pct_band` | society_breakdown/order:112 |
| 931 | `tierFromPorPct` | `tier_from_por_pct` | society_breakdown/order:135 |
| 938 | `orderEffectsFromPorPct` | `order_effects_from_por_pct` | society_breakdown/order:147 |
| 990 | `computePorPct` | `compute_por_pct` | society_breakdown/order:186 |
| 1019 | `orderContributionPct` | `order_contribution_pct` | society_breakdown/order:199 |
| 1039 | `computeOrderPctBreakdown` | `compute_order_pct_breakdown` | society_breakdown/order:227 |
| 1063 | `evaluateOrderFromBreakdown` | `evaluate_order_from_breakdown` | society_breakdown/order:249 |
| 1077 | `applyCivMatrixHappinessModifier` | `apply_civ_matrix_happiness_modifier` | society_breakdown/order:264 |
| 1120 | `updateRevoltGrace` | `update_revolt_grace` | society_breakdown/order:305 |
| 1164 | `revoltWarningMessage` | `revolt_warning_message` | society_breakdown/order:346 |

Pozostałe pomocnicze funkcje Rust bez odpowiednika eksportowanego w TS (`js_round`, `js_max`, `js_min`, `js_truthy`, `js_num_str`, `round_to`, `finite_opt`, `finite_or_zero`, `sub`, `row`, `pick_society_*`, `fallback_*`) odpowiadają semantyce JS (`Math.round/max/min`, `Number.isFinite`, prawdziwość, `String(x)`) i są opisane w nagłówkach modułów.

## Pokrycie testami

| Plik testowy | Testy | Zakres |
|---|---|---|
| `tests/p6_8j_society.rs` | 8 | skala %, mianowniki, capy, odczyt wierszy JSON, progi buntu, rozpiski Szczęścia i Prawa (wektory weba) |
| `tests/p6_8j_order.rs` | 18 | pasma i tiery PorPct, efekty, `computePorPct`, wkład porządku, rozpiska porządku, macierz (`applyCivMatrixHappinessModifier`), łaska buntu, komunikaty, testy jednostkowe gałęzi |
| `tests/p6_8j_guards.rs` | 4 | semantyka zera ze znakiem (`Math.max/min/round`), NaN jako falsy w `haWealth`/`haCuda`, awaryjne tablice epok (pusta i niefinitna) |

Wyniki bramek i mutacji: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1/04-operator-r3.md` oraz `logs/mut-r3.log` w tym samym runie.
