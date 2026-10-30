STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1
GOAL: P6.8J - port `society-breakdown.ts` (1172 LOC, 36 fn, pin 91dc998a) do Rust, runda 2/5 (partie 1+2 + domkniecie bramek i mutacji). Wejscie: WIP `56f43f84` (partia 2) wg dispatchu.
ZMIANY/COMMIT:
- Wejscie: `git checkout --detach 56f43f84` (ref `refs/keep/P68J-r2wip`). Kod partii 1 (`3f01bfd5`) i partii 2 (`56f43f84`: `society_breakdown/{breakdown,order}.rs`, `tests/p6_8j_order.rs`, wektory `order`) NIE zmieniony poza pkt nizej.
- Commit rundy 2 (SHA w odpowiedzi orkiestratora): allowlista = `rust-port/engine/tests/p6_8j_society.rs` (+29 linii: test `era_table_edge_cases_match_web`, wzmocnienie mutanta M4) oraz `dyspozycje/autobot/runs/R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1/02-operator-r2.md`.
- Nazwa raportu: zadanie zlecalo `01-operator-r1.md`, ale ten plik istnieje juz z Operatora r1 (`867d11be`). Dla zachowania dowodu rundy 1 zapisano jako `02-operator-r2.md` (zgodnie z RUNDA 2/5 w dispatchu).
- Zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. Brak push, brak deploy.
- Bez zmian w kodzie zrodlowym `src/` w tej rundzie (wszystkie mutanty przywrocono `git checkout --`, `git status` czysty poza commitem).

TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, katalog rust-port/engine):
- `cargo fmt --all -- --check`: EXIT 0 (po dodaniu testu wykonano `cargo fmt --all`, potem EXIT 0).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --test p6_8j_society --test p6_8j_order`: p6_8j_order 18/18, p6_8j_society 8/8 (w tym nowy test), EXIT 0.
- `cargo test --no-fail-fast` (pelny suite engine, przed dodaniem testu): EXIT 0, passed=1521 failed=0 (log w scratchpad sesji).
- Pelny suite NIE powtorzony po dodaniu testu (dodany test tylko w p6_8j_society, zielony osobno).

MUTACJE (na kodzie 56f43f84, 1 mutant naraz, po kazdym `git checkout --` przywrocenie):
- M1 js_round >= 0.5 -> > 0.5: KILLED (runda 1).
- M2 legacy_male pop <= prog -> < prog: KILLED (runda 1).
- M3 pick_osiedle_pop_bonus, galaz NaN: legacy_flat_fallback -> 0.0: KILLED (3 linie FAILED/panicked).
- M4 max_from_era_table, pusta tablica: 24 -> 0.0: SURVIVED przed rundą (brak testu), KILLED po dodaniu `era_table_edge_cases_match_web` (3 linie).
- M5 pop_scale_multiplier, excess bez js_max(0,...): KILLED (5 linii).
- M6 luksus_happiness_bonus, `prog.is_nan() || prog <= 0.0` -> `prog.is_nan()`: KILLED (3 linie).
- M7 pct_from_netto, `max > 0.0` -> `max >= 0.0`: KILLED (3 linie).
- M8 resolve_palac_tier, `1..=3` -> `1..=2`: KILLED (3 linie).
- M9 por_pct_band, `p >= POR_NAPIECIE_MIN` -> `p > ...`: KILLED (9 linii).
- M10 apply_civ_matrix_happiness_modifier, guard `raw == 0.0` usuniety: SURVIVED. Mutant RÓWNOWAZNY: przy raw=0 netto=netto, delta=0, brak linii, a `compute_order_pct_breakdown` z tymi samymi parametrami daje ten sam wynik. Zaakceptowane jako equivalent mutant.
- Pominiete z listy orkiestratora (wymagaja dlugich pomiarow / poza zakresem operatora-impl): mutacje `porPctBand` pasm >=  (czesciowo pokryte M9), `updateRevoltGrace`, `resolvePalacTier` tier 0 (nie mutowano), `pctFromNetto` max<=0 (pokryte M7). Do decyzji Evaluatora.

TABELA SYMBOLI (TS pin 91dc998a / gra HEAD -> Rust; sciezki wzgledem rust-port/engine/src/domain/):
- REVOLT_CRITICAL_POR_PCT, REVOLT_GRACE_TURNS, REBEL_FACTION_OWNER_ID (-99) -> society_breakdown.rs:62-65
- SZ_PCT_CAP, PRAW_PCT_CAP, *_POP_WSP_DEFAULT, *_POP_ODNIESIENIA_DEFAULT -> society_breakdown.rs:68-75
- SZMAX/PRAWMAX/PRAWO_GARNIZON_BUDYNEK/KULT_RELIG *_BY_ERA_DEFAULT -> society_breakdown.rs:79-82
- PODATKI_MIN/MAX/PROG_PCT_DEFAULT -> society_breakdown.rs:88-90
- pickOsiedlePopBonus -> society_breakdown.rs pick_osiedle_pop_bonus
- pickSociety / pickSocietyArray -> society_breakdown.rs pick_society / pick_society_array
- FALLBACK_SOCIETY_SCALE -> fallback_society_scale; loadSocietyScaleParams -> load_society_scale_params
- osiedlePopLabel / osiedlePopMax / isOsiedleRevoltImmune -> osiedle_pop_label / osiedle_pop_max / is_osiedle_revolt_immune
- loadRevoltParams, FALLBACK_REVOLT_PARAMS -> load_revolt_params (society_breakdown.rs); fallback_revolt_params (order.rs)
- resolvePalacTier -> breakdown.rs resolve_palac_tier
- clampPct, pctFromNetto -> clamp_pct, pct_from_netto
- maxFromEraTable (prywatna) -> max_from_era_table; szMaxForEra / prawMaxForEra / prawGarnizonBudynekForEra / kultReligScaleForEra -> sz_max_for_era / praw_max_for_era / praw_garnizon_budynek_for_era / kult_relig_scale_for_era
- proporcjonalneSzczescie, ownShareFromSignal -> proporcjonalne_szczescie, own_share_from_signal
- popScaleMultiplier (prywatna) -> pop_scale_multiplier; szMaxForCity / prawMaxForCity -> sz_max_for_city / praw_max_for_city
- luksusHappinessBonus -> luksus_happiness_bonus
- podzialLuksus (TS:667) -> breakdown.rs:118-119 (inline; brak podzialu -> domyslne 20, jak DEFAULT_PODZIAL_HANDLU)
- udzialLineLabel -> breakdown.rs udzial_line_label
- computeHappinessBreakdown -> breakdown.rs compute_happiness_breakdown; computeLawBreakdown -> breakdown.rs compute_law_breakdown
- porPctBand -> order.rs por_pct_band; POR_BAND_LABELS -> PorPctBand::label (order.rs)
- tierFromPorPct -> tier_from_por_pct; orderEffectsFromPorPct -> order_effects_from_por_pct; computePorPct -> compute_por_pct; orderContributionPct -> order_contribution_pct; computeOrderPctBreakdown -> compute_order_pct_breakdown; evaluateOrderFromBreakdown -> evaluate_order_from_breakdown; updateRevoltGrace -> update_revolt_grace; revoltWarningMessage -> revolt_warning_message (order.rs)
- applyCivMatrixHappinessModifier -> order.rs apply_civ_matrix_happiness_modifier. UWAGA: symbol JEST w pinie 91dc998a (linia 1077), ale NIE ma go w aktualnym `gra/src` (HEAD 56f43f84). Port utrzymany wg Z-8J-2 (pin jest zrodlem prawdy).

LIMITY LOC:
- society_breakdown.rs 539, breakdown.rs 349, order.rs 365: <= 600.
- tests/p6_8j_order.rs 655 (test, >600): zaakceptowane jako wyjatek testowy (Z-8J-6 analogicznie); do rozbicia w razie wymogu.

BLOKADY:
- Brak blokad technicznych. Dysk: 9.1 GB wolne, bez ENOSPC w tej rundzie.
- Dokument tematu `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` nadal nieobecny w `origin` (zalozenie Z-8J-1 z rundy 1 obowiazuje).

ZALOZENIA (bez pytan ABC):
- Z-8J-2 (potwierdzone): `applyCivMatrixHappinessModifier` PORTOWANY (pin 91dc998a), mimo braku w aktualnym gra/src.
- Z-8J-6 (potwierdzone): podzial plikow >600 LOC w `domain/society_breakdown/` jak w 56f43f84 zaakceptowany.
- M10 uznany za mutanta rownowaznego (patrz wyzej).

RUNDY: 2/5
NASTEPNY KROK: Evaluator r2 (niezalezny weryfikator): potwierdzic 9 KILLED + M4 po nowym tescie, M10 jako equivalent, tabele symboli, pełny suite (opcjonalnie powtorka po commicie).
DEPLOY/PUSH: NIE WYKONANO
