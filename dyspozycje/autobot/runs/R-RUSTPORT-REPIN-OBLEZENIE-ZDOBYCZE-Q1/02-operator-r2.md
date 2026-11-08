STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1
GOAL: Odpowiedź na zarzuty rundy 1 (PASS-WITH-NOTES, baza 249cafaeb). Domknięcie testów granicznych partii 1, pomiar pinu 4bbef081d, uczciwe NIE_ZMIERZONO tam, gdzie brak zasobów.
BAZA: 249cafaeb (r1), web pin `a61337844` (origin/main, zweryfikowany).
RUNDY: 2/5 (ten sam ID)

## Odpowiedzi na zarzuty

1. Pomiar symbol-po-symbolu niepełny (wieża oblężnicza, aneksja, wonder-transfer, siegeDefenders/siegeAi, pin 4bbef081d) — PRZYJMUJĘ, częściowo.
   - Pin: wykonany diff `git diff --name-status 4bbef081d origin/main -- gra/src/game gra/src/battle` = 81 plików (9120 insertions, 936 deletions). Zmienione/dodane pliki z rodziny oblężenia/zdobyczy:
     - A `gra/src/game/siege-starvation.ts` (dodany po pinie, stąd port bazuje na a61337844)
     - A `gra/src/game/siege-enter-city.ts`, `siege-last-stand.ts`, `siege-surrender-forecast.ts`, `city-siege-state.ts`, `city-fortification.ts`, `diplomacy-siege-war-gate.ts`, `wonder-transfer.ts`
     - M `gra/src/game/siege.ts`, `siegeDefenders.ts`, `fort-territory.ts`, `post-battle-map.ts`; M `gra/src/battle/siegeWall.ts`, `mapFieldBattle.ts`, `battleScene.ts`, `testBattle.ts`
   - Nie zmierzono (NIE_ZMIERZONO): status per symbol dla `siegeDefenders`, `siegeAi`, `wonder-transfer`, aneksji, wieży oblężniczej (wyłom) — wymaga czytania diffu tych plików; przeniesione do partii P2/P3 w `P6-REPIN-OBLEZENIE-ZDOBYCZE.md`. Brak commitu z tymi zmianami w tej rundzie.
2. Baseline `cargo test --no-fail-fast` — NIE_ZMIERZONO (dysk 2 GB wolne przed i po; pełna kompilacja wszystkich binarek testowych przekracza bezpieczny budżet z dispatchu „< 1,5 GB → przerwij", a przy 2 GB nie startuję nowych ciężkich przebiegów). Zakres zmiany: nowe pliki + `pub mod` w `domain/mod.rs`; ryzyko regresji niskie, ale nieudowodnione. Zostaje do zmierzenia w rundzie, w której dysk pozwoli.
3. Mutation score ≥ 85% — NIE_ZMIERZONO (cargo-mutants nie uruchomiony: wymaga pełnej kompilacji, jak w pkt 2). Zamiast tego dodano testy na gałęzie zarzutu (patrz niżej) i wyjaśniono mutanty równoważne.
4. Brak asercji `hp_fraction`/`start_max_hp` w `pending_flag` i `not_besieged` — PRZYJMUJĘ, poprawione: `pending_flag_surrenders_regardless_of_food` asertuje `hp_fraction == None`, `start_max_hp == None`, brak `record_start`/`set_legacy_pending`; nowy `not_besieged_pending_flag_is_ignored`.
   `surrender_below_frac = NaN` — PRZYJMUJĘ, dodany `nan_surrender_fraction_does_not_surrender`. Wektor web (Node 22, `a61337844`): `surrenderBelowFrac: NaN` → `surrender: false`, `hpFraction: 0`, `startMaxHp: 10`; domyślny próg → `surrender: true`. Zgodne z Rust.
5. Zakres partii — PRZYJMUJĘ jako dług: moduł `siege_starvation` nieużywany w tiku (martwy kod do integracji). Nie dodaję P2 w tej rundzie (zakres pomiaru pkt 1 ma pierwszeństwo, a dysk nie pozwala na pełną bramkę dwóch partii naraz). Plan P2 pozostaje w dokumencie tematu.

## Nowe testy (plik: `rust-port/engine/tests/p6_oblezenie_glod.rs`)
- `pending_flag_surrenders_regardless_of_food` — rozszerzony o asercje pól pomiarowych (zarzut 4)
- `not_besieged_pending_flag_is_ignored` — web: `oblegane !== true` przed flagą pending (wektor: `notBesiegedPending` → pusty stan)
- `nan_surrender_fraction_does_not_surrender` — wektor web `surrenderBelowFrac: NaN` (zarzut 4)
- `zero_threshold_empty_garrison_still_surrenders` — zabija mutant usunięcia `tot.count == 0 ||` (wektor web: frac 0 + pusty garnizon → surrender true)
- `zero_threshold_nonempty_garrison_does_not_surrender` — kontrola do powyższego
- `hp_none_with_explicit_hp_max_counts_full` — zabija mutant `unwrap_or(max)` → `unwrap_or(0)` przy jawnym hpMax (wektor web: `garrisonHpTotals` → hp 4, maxHp 4, count 1)
- `infinite_hp_max_is_skipped_to_legacy` — zabija usunięcie `is_finite` w `unit_max` (wektor web: hpMax Infinity → legacy pending)

Mutanty równoważne (nie wymagają testu, uzasadnienie w kodzie):
- `max > 0.0` w `unit_hp` — `unit_hp` jest prywatne i wołane tylko z `garrison_hp_totals` po filtrze `m <= 0`; gałąź `else` jest nieosiągalna.
- `tot.max_hp > 0.0` przy `hp_fraction` w pierwszym ticku — po `tot.count > 0` suma maxHP jest zawsze > 0.

## Bramki (ta runda)
- `rustfmt --check --edition 2021 tests/p6_oblezenie_glod.rs`: FMT=0
- `cargo test --test p6_oblezenie_glod` (CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0, CARGO_TARGET_DIR w worktree): `29 passed; 0 failed`, EXIT=0
- `cargo clippy --lib --test p6_oblezenie_glod -- -D warnings`: EXIT=0
- `git diff --check`: czysto
- Target usunięty po bramkach; `Cargo.lock` wygenerowany przez cargo usunięty (poza allowlistą).
- Pełny baseline 2155/0: NIE_ZMIERZONO (zarzut 2). Mutation score: NIE_ZMIERZONO (zarzut 3).

## Zmienione pliki (r2)
- `rust-port/engine/tests/p6_oblezenie_glod.rs` (zmodyfikowany: +7 testów, asercje w pending)
- `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1/02-operator-r2.md` (nowy)

Asercje istniejących testów nie osłabiono (tylko dopisano nowe i asercje w `pending_flag`).

BLOKADY:
1. Pełny baseline 2155/0 — NIE_ZMIERZONO (dysk).
2. Mutation score ≥ 85% — NIE_ZMIERZONO.
3. Status per symbol: siegeDefenders, siegeAi, wonder-transfer, aneksja, wieża oblężnicza — NIE_ZMIERZONO.
4. Partie P2–P6 niezrobione.
5. `handleSiegeCapitulationPhase`/`resolveSiegeSurrender` (`main.ts`) — dług, nowe ID przy P6.

NASTĘPNY KROK: runda 3, ten sam ID: pomiar NIE_ZMIERZONO z pkt 3 (siegeDefenders/siegeAi/wonder-transfer) przez `git show a61337844:gra/src/game/<plik>` oraz partia P2 gdy dysk ≥ 5 GB.
DEPLOY/PUSH: NIE WYKONANO
