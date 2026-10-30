# R-RUSTPORT-REPIN-WOJNA-NOWE-C-Q1 - odpowiedzi Operatora na zarzuty Evaluatora (runda 2)

STATUS: PASS-WITH-NOTES (wszystkie zarzuty PRZYJETE z poprawka i dowodem; zadnego FAIL)
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-NOWE-C-Q1
Stan wejsciowy: commit weryfikacji Operatora `d0b62ffa` (ocena Evaluatora).
Kod r2: commit `7f2f5d2f` (fix + testy + mutate-c.py). Dokumentacja r2: commit wskazany w sekcji SHA ponizej.

## Odtworzenie zarzutow (web 91dc998a, uruchomiony JS)

Web przetranspilowany z `git archive 91dc998a gra/src gra/data` (katalog poza repo, `tsc --target es2020 --module commonjs`), sondy `node`:

- `advanceCrisisCounter(1, -1, {kryzysProgZaufania: NaN, ...})` = `{counter: 0, ...}` (reset). Rust r1: counter 2. Zarzut 1 potwierdzony.
- `Math.pow(-1, Infinity)` = NaN; `krokPktWymiany(Infinity, {mnoznik: -1})` = NaN; Rust r1: 100 (powf(-1, inf) = 1). Zarzut 2 potwierdzony.
- `sortCrisisQueue` na 40 wpisach z ~1/3 NaN: brak wyjatku w V8. Zarzut 3: panika Rust sprawdzona w tescie (mutant ponizej) i przyjeta jako defekt kontraktu.

## Odpowiedzi

### Zarzut 1 (NaN progu w advance_crisis_counter): PRZYJMUJE
- Poprawka: `let kryzys = zaufanie <= p.kryzys_prog_zaufania;` z `#[allow(clippy::neg_cmp_op_on_partial_ord)]`, `if !kryzys { reset }` (odpowiednik `!(zaufanie <= prog)`).
- Test: `crisis_counter_hysteresis_and_thresholds` (prog NaN, prev 1, zaufanie -1 -> counter 0, warning/war false).
- Dowod mutacji: cofniecie poprawki -> `crisis_counter_hysteresis_and_thresholds` FAILED (uruchomienie ad hoc, wynik: 23 passed / 1 failed; bez osobnego logu, powtarzalne wg opisu).

### Zarzut 2 (js_pow dla base = -1 i exp = +-Infinity): PRZYJMUJE
- Poprawka: `if base.abs() == 1.0 && exp.is_infinite() { NaN }`.
- Test: `krok_edge_cases_explicit`: mnoznik -1: epoka +Inf -> NaN, -Inf -> 100 (max(1,-Inf)=1), 5 -> 400, 6 -> -400. Web: wszystkie wartosci zweryfikowane sonda `node` (NaN, 100, 400, -400).
- Dowod mutacji: cofniecie poprawki (`base == 1.0`) -> `krok_edge_cases_explicit` FAILED (uruchomienie ad hoc, 23 passed / 1 failed; bez osobnego logu).

### Zarzut 3 (sort_by przy NaN licznika): PRZYJMUJE (z ZALOZENIEM)
- Poprawka: komparator calkowity. Gdy dokladnie jeden licznik jest NaN, wpis z NaN idzie na koniec; przy dwoch NaN albo przy rownych licznikach porzadek wg (min owner, max owner). Dla skonczonych licznikow ten sam porzadek co wczesniej (`partial_cmp` zamiast odejmowania, ten sam znak).
- ZALOZENIE (Z9 w dossierze): NaN nie powstaje w potoku; web dla NaN zwraca wynik zalezny od V8, nie odtwarzamy go.
- Test: `sort_crisis_queue_nan_counters_total_order_no_panic` (300 wpisow, LCG, ~1/3 NaN; deterministycznosc, NaN na koncu, uporzadkowanie czesci skonczonej i NaN-owej).
- Dowod mutacji: stary komparator -> `sort_crisis_queue_nan_counters_total_order_no_panic` FAILED na asercji ulozenia NaN (uruchomienie ad hoc, bez osobnego logu; na tym zbiorze nie doszlo do paniki, test lapie blad przez porzadek). Panika nie jest twierdzona dla tego zbioru.

### Zarzut 4 (kolejnosc parseCrisisCounters): PRZYJMUJE (wariant: usuniecie deklaracji)
- Usunieta deklaracja kolejnosci z docstringu Rust i z naglowka modulu; wynik jest ZBIOREM par (ZALOZENIE Z7).
- Uzasadnienie braku wplywu na wynik: klucze zapisu sa kanoniczne `"lo-hi"` (zapisuje je tylko `crisisPairKey`), wiec unikalne; `sort_crisis_queue` daje dla unikalnych kluczy wynik niezalezny od kolejnosci wejscia.
- Test: `sort_crisis_queue_permutation_invariant_for_canonical_keys` (28 par z `ai_ai_pairs`, odwrocenie i rotacja wejscia -> ten sam wynik).
- Test `parse_crisis_counters_matches_web` nadal porownuje jako zbior (sortowanie po kluczu po obu stronach), zgodnie z ZALOZENIEM.

### Uwaga proceduralna (23 mutacje niezweryfikowane niezaleznie): PRZYJMUJE
- Powtorzono WSZYSTKIE 31 mutacji na kodzie r2 skryptem `mutate-c.py` (cel builda: tmpfs, logi `mut-c-r2-<ID>.log`).
- Wynik: 30 ZABITYCH, 1 SURVIVED = R13 (rownowazna, patrz nizej).
- D02 i D13 przepisane na nowe wzorce (galezie zmienily tekst po poprawkach 1 i 3); pozostale wzorce bez zmian.

| ID | wynik | przykladowy zabijajacy test (liczba w log `mut-c-r2-<ID>.log`) |
|---|---|---|
| R01 | KILLED | truncate_path_matches_web_default_terrain_costs |
| R02 | KILLED | farthest_step_matches_web_default_terrain_costs |
| R03 | KILLED | min_move_first_step_enters_even_if_over_budget |
| R04 | KILLED | missing_key_or_infinity_stops_prefix |
| R05 | KILLED | farthest_step_matches_web_with_blocked_keys |
| R06 | KILLED | missing_key_or_infinity_stops_prefix |
| R07 | KILLED | budget_nan_or_zero_or_negative_returns_empty |
| R08 | KILLED | farthest_target_blocked_steps_back_one |
| R09 | KILLED | farthest_target_blocked_steps_back_one |
| R10 | KILLED | occupancy_matches_web |
| R11 | KILLED | claim_rejects_occupied_target_and_moves_counter |
| R12 | KILLED | claim_rejects_occupied_target_and_moves_counter |
| R13 | SURVIVED = rownowazna | (patrz dowod ponizej) |
| D01 | KILLED | flag_override_wins_over_default |
| D02 | KILLED | crisis_counter_hysteresis_and_thresholds |
| D03 | KILLED | crisis_counter_hysteresis_and_thresholds |
| D04 | KILLED | crisis_counter_hysteresis_and_thresholds |
| D05 | KILLED | crisis_counter_sanitizes_previous_value |
| D06 | KILLED | crisis_counter_hysteresis_and_thresholds |
| D07 | KILLED | crisis_step_at_war_resets_counter |
| D08 | KILLED | krok_edge_cases_explicit |
| D09 | KILLED | trade_bonus_stepwise_and_capped |
| D10 | KILLED | trade_bonus_stepwise_and_capped |
| D11 | KILLED | parse_crisis_counters_drops_garbage |
| D12 | KILLED | parse_crisis_counters_drops_garbage |
| D13 | KILLED | sort_crisis_queue_nan_counters_total_order_no_panic |
| D14 | KILLED | sort_queue_ties_use_owner_ids |
| D15 | KILLED | declarer_dobra_and_pairs_explicit_edges |
| D16 | KILLED | declarer_dobra_and_pairs_explicit_edges |
| D17 | KILLED | declarer_dobra_and_pairs_explicit_edges |
| D18 | KILLED | declarer_dobra_and_pairs_explicit_edges |

R13 (dowod rownowaznosci, `ai_move_range.rs` `claim_hex_for_move`): linia 110 zwraca `false`, gdy `occ[to] > 0`. Przypadek `from != to`: `occ[to]` nie zmienia sie przy usuwaniu `from`, wiec na linii 119 `t = 0`. Przypadek `from == to`: linia 110 wymusza `n = occ[from] = 0`, wiec `t = 0`. Zatem `insert(to, t + 1)` zawsze wstawia 1, czyli mutant `insert(to, 1)` jest identyczny.

## Bramki r2 (kod `7f2f5d2f`)

- `cargo fmt --all -- --check`: EXIT=0 (`fmt-c-r2.log`)
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`clippy-c-r2.log`)
- `cargo test --no-fail-fast`: EXIT=0, 1349 passed / 0 failed (bylo 1347; +2 testy) (`test-c-r2.log`)
- `git diff --check`: czysty.
- Build: `CARGO_TARGET_DIR=/dev/shm/wf_2fae1a05-0e5-4` (dysk wspolny `/` byl zapelniony na chwile; cargo target poza dyskiem, katalog do usuniecia po pracy).

## Zakres i allowlista (commit 7f2f5d2f)

- `rust-port/engine/src/domain/diplomacy_tick_war_brake.rs`, `rust-port/engine/tests/p6_repin_wojna_c_war_brake.rs`, `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-NOWE-C-Q1/mutate-c.py`.
- Dossier `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-NOWE-C.md` (Z4, Z7, Z9, sekcja r2).
- Wektory NIE zmienione; `ai_move_range.rs` NIE zmieniony; `gra/**`, `Cargo.toml`, `WERSJE.md` NIE zmienione; `Cargo.lock` nieSledzony, NIE commitowany.

## SHA

- Kod r2 i testy: `7f2f5d2f`
- Dokumentacja r2 (ten plik, dossier, logi): patrz nastepny commit tej rundy (SHA w raporcie orkiestratora).

DEPLOY/PUSH: NIE WYKONANO
