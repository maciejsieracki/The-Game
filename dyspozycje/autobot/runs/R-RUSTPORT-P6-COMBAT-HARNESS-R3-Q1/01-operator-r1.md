STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-HARNESS-R3-Q1
GOAL: W p6_combat_harness.rs: (a) test, ze roll dokladnie rowny hitPct odwraca trafienie (1 ulp ponizej/powyzej); (b) sprawdzenie znaku zera w polach zdarzen strzalow; (c) mutacja counts_agree jako test failujacy po zaburzeniu licznikow.
ZMIANY/COMMIT: commit a35e6373d na gałęzi wip/R-RUSTPORT-P6-COMBAT-HARNESS-R3-Q1 (baza 23e33793e). Zmieniony plik: rust-port/engine/tests/p6_combat_harness.rs (allowlista). Dodany ten raport (dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-HARNESS-R3-Q1/01-operator-r1.md) w osobnym commicie. Cargo.lock nieskomitowany (untracked, usuniety po bramkach). Brak zmian w rust-port/engine/src, gra/, origin/main, wektorach i generatorze .mjs.
KROK 0 (stan wyjsciowy w 23e33793e, git show):
  - (c) JUZ JEST: p6_combat_harness.rs:329 counts_agree, :384 p6_combat_harness_mutacja_licznika_daje_fail (kazdy z 13 licznikow +1 -> Err). Brak logu (grep println/eprintln: 0 trafien).
  - (a) CZESCIOWO: pokrycie przez wektory (recount: shotsRollEq/JustBelow/JustAbove, asercja >= 20 w p6_combat_harness_wektory_pinu_zgodne). Brak dedykowanego testu granicznego; w Rust roll < hit_pct w combat.rs:1172 i :1204, pin gra/src/game/combat.ts:1040 i :1058 (`if (roll < hitPct)`).
  - (b) CZESCIOWO: check_row porownuje przez same() (to_bits), wiec -0 w oczekiwanych wartosciach jest rozroznione; asercja shots_neg_zero_any_field == 0 to liczba w liczniku, nie bezposrednie sprawdzenie bitu znaku na wyniku Rust.
ZMIANY W TESCIE:
  - one_ranged_shot(draw, def_final_obrona): syntetyczne wejscie 1 strzalu lukiem (atakujacy ammo 1, obronca bez dystansu), odpowiada petli Phase 0 pinu.
  - draw_giving_roll(target): szuka d z d*100.0 == target przez sasiedztwo bitowe (nie kazda wartosc roll = d*100 jest osiagalna, stad parametr obrony).
  - find_boundary_input(): szuka defFinalObrona, dla ktorego hitPct h ma osiagalne losowania dla h, h-1ulp, h+1ulp (deterministyczne, 400 probek).
  - p6_combat_harness_roll_na_hitpct_odwraca_trafienie: roll==h -> pudlo (hit false, damage +0, HP obroncy 30 bit-w-bit); roll h-1ulp -> trafienie (damage>0, HP = 30 - damage); roll h+1ulp -> pudlo.
  - p6_combat_harness_znak_zera_w_polach_zdarzen: dla kazdego zdarzenia strzalu z Rust, kazde pole hitPct/damage/targetHp o wartosci 0 musi miec bit znaku dodatni; licznik zer > 0 (asercja niepustosci).
  - Wektory pinu (vectors.json) i generator .mjs: bez zmian (tylko odczyt).
TESTY:
  - cargo test --test p6_combat_harness: 5 passed, 0 failed, 0 ignored (wektory_pinu_zgodne, mutacja_licznika_daje_fail, nan_roll_i_nan_hp, roll_na_hitpct_odwraca_trafienie, znak_zera_w_polach_zdarzen). Baza przed zmiana: 3 passed.
  - cargo fmt --check: EXIT 0 (po rustfmt na pliku testu; reszta crate bez zmian).
  - cargo clippy --all-targets -- -D warnings: EXIT 0.
  - cargo test --lib: 99 passed, 0 failed, EXIT 0.
  - Flagi bramek: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (w scratchpadzie, usuwany po bramkach).
  - NIE_ZMIERZONO: test mutacyjny (np. `<` -> `<=` w combat.rs), zeby pokazac, ze test (a) failuje na bledzie. Logicznie roll==h musi dac pudlo, wiec zmiana na `<=` powinna failowac; nie uruchomiono.
  - NIE_ZMIERZONO: nie sprawdzano, czy pin (gra/src/game/combat.ts) produkuje -0 w jakimkolwiek polu zdarzenia; pin nie jest uruchamiany w tym temacie (wektory sa wczesniejsze).
BLOKADY: brak. Zakres zgodny z allowlista; bez zmian poza nia.
UWAGA O ATRYBUCJI COMMITU: dispatch wymaga commit bez nazwy modelu i ostatniej linii Claude-Session; system wymaga linii Co-Authored-By z nazwa modelu. Przyjeto dispatch (commit bez Co-Authored-By, ostatnia linia Claude-Session). Do decyzji orkiestratora.
RUNDY: 1/5
NASTEPNY KROK: Evaluator r1: weryfikacja (a) i (b) jako dedykowanych testow (czy nie sa puste), mutacja `<=` na combat.rs (poza allowlista, tylko w worktree Evaluatora), potwierdzenie bramek.
DEPLOY/PUSH: NIE WYKONANO
