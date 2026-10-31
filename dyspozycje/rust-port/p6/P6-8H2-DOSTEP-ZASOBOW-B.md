# P6.8H2 — Dostęp do zasobów, partia B (stolica gracza + etykiety)

Status: CZĘŚCIOWO (runda 1/5, Operator). Kryteria końca NIE są spełnione.

## Zrealizowane (plik:linia)

| Symbol web | Port Rust | Status | Test |
|---|---|---|---|
| `isPlayerCapitalCity` (society-inputs.ts) | `resource_access/capital_labels.rs` `is_player_capital_city` | PORTED; ZAŁOŻENIE: `found_order` wstrzykiwany (brak `cityFoundOrder` w Rust) | `tests/p6_8h2_capital_labels.rs` (10 testów) |
| `stolicaEasyBonusActive` | `capital_labels.rs` `stolica_easy_bonus_active` (granice 1..=maxTur, N-1/N/N+1) | PORTED | j.w. |
| `SUROWIEC_KEY_LABEL` | `surowiec_key_label`, `surowiec_label_or_capitalized` | PORTED | `surowiec_labels_full_table` |
| `ZLOZE_LABEL` | `zloze_label` | PORTED | `zloze_labels_table` |
| `CITY_PANEL_RANGE_DEPOSIT_LABELS` + `filterCityPanelRangeLabels` | `city_panel_range_deposit_labels` | PORTED (porządek bajtowy = localeCompare dla zbioru zamkniętego) | `city_panel_range_*` |

## Niezrealizowane

| Symbol web | Status |
|---|---|
| `collectActiveAccess`, `getCityResourceAccessForCity`, `getResourceAccessForCity` i pozostałe 13 funkcji `resource-access.ts` | NIE PORTOWANE |
| `clearCityCultureMix` (state.rs:544-581) | NIE ZMIERZONO (tylko dopiski, brak zmian) |
| `placedImprovementsWithZlotoTradeGrant` (main.ts) | NIE ZBADANO |

## Testy i bramki

- `cargo test --test p6_8h2_capital_labels`: 10 passed (po poprawce: tie-break `<` zamiast `<=`, zgodnie z web `order < firstOrder`).
- `cargo test --test p6_8h_access`: 13 passed (regresja partii A).
- `git diff --cached --check`: czysto.

## Brakujące kryteria końca

- Wektory z pinu `91dc998a` (bundle esbuild) NIE wygenerowane; wektory w teście są ręczne wg kontraktu web.
- Brak skryptu mutacji i logów `gate-*.txt`.
- Brak mutacji na każdej gałęzi sterującej.
