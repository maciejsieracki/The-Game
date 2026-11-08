STATUS: PASS-WITH-NOTES (Operator r4, odpowiedź na zarzuty rundy 3; G3b = warstwa decyzyjna + porządek ID; pełna pętla main.ts poza zakresem, patrz BLOKADY)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-FORCED-WAR-MODULES-Q1
GOAL: Domknięcie zarzutów rundy 3: (1) G3b trigger/timer jako funkcje czyste, (2) restore — dowód dla danych zapisu z webu + test negatywny dla danych zepsutych, (3) localeCompare — port ICU zamiast porządku bajtowego, (4) budżet LOC — zgłoszony jako ZAŁOŻENIE.
BAZA: 9ef1026a0 (Operator r3, G3a 505631741 na abc5f58b9). Stan odtworzony przez `git checkout --detach 9ef1026a0`.
ZMIANY-COMMIT: patrz SHA na końcu raportu (commit G3b, lokalny, bez push).
- Nowe: `rust-port/engine/src/domain/war_forced_trigger.rs` (should_search_bronze/stone/iron, sweep_stale_forced_war_entries, ForcedEra, ActivePair, ForcedWarRegistries).
- Zmienione: `domain/mod.rs` (+pub mod war_forced_trigger), `domain/war_forced_waves.rs` (compare_ids_icu zamiast a.id.cmp / anchor.id.cmp, 4 miejsca), `dyspozycje/rust-port/p6/P6-FORCED-WAR-MODULES.md` (sekcja 2c, aktualizacja pkt localeCompare).
- Nowe testy/dane: `tests/p6_forced_war_g3b.rs`, `tests/p6_forced_war_g3b_data/{cases.json,gen_cases_g3b.mjs}`.
- Zero zmian w gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri. Wektory generowane z `git archive origin/main gra/src gra/data` (katalog poza repo), Node 22.
- Nieśledzone artefakty (Cargo.lock, target/) usunięte po bramkach; nie są w commicie.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ (częściowo). Dodano G3b: `should_search_bronze/stone/iron` (replika warunku "szukaj" z ownerLoop, main.ts ~38870-38970, z prawdziwymi `is_eligible_*`/`is_resting_*`) oraz `sweep_stale_forced_war_entries` (main.ts ~11206-11260: kolejność Kamień, Żelazo, Brąz; odpoczynek = tura + 20). Wektory: 240 przypadków search (prawdziwe forced-war-{bronze,stone,iron}.ts), 120 sweep (replika kopii). Nie przeniesiono: mutacji pending/era-entry w ownerLoop, podpięcia fal do tury, pruningu w pętli, puli gracza (patrz BLOKADY).
2. ODRZUCAM dla danych z zapisu, PRZYJMUJĘ jako ZAŁOŻENIE dla danych zepsutych. Dowód: web `planForcedWarWave` buduje fale z typowanymi polami (unitIds = id tekstowe, createdTurn liczba, hexy liczbowe); `serializeForcedWarWaves` kopiuje te obiekty; test `g3b_restore_realistic_shape_roundtrip` przechodzi. Rozbieżność dla zepsutego zapisu udokumentowana testem `g3b_restore_malformed_documented_divergence` (unitIds nie-tekstowe odrzucane; createdTurn "x" -> 0; web zachowuje surowo). Wymaga akceptacji właściciela.
3. PRZYJMUJĘ, naprawiono. Porządek bajtowy był błędny: w Node `'dip_5_1'.localeCompare('dip_51_1') = -1`, bajtowo odwrotnie; identyfikatory `dip_<tura>_<seq>` (main.ts allocateDipUnitId) mają `_` i zmienną długość. Nowa `compare_ids_icu` (ICU root/en dla [A-Za-z0-9_-]: `_` < `-` < cyfry < litery; przy równości mała przed wielką). Wektory `idcmp`: 11 640 par, zgodność 100%. Pomiar: root/en vs pl dla tego alfabetu = 0 rozbieżności. G3a vectors (554) nadal zgodne.
4. ZAŁOŻENIE do akceptacji orkiestratora: przekroczenie 600 LOC. Pomiar: war_forced_trigger.rs ~230, p6_forced_war_g3b.rs ~210, gen_cases_g3b.mjs ~260 linii; cases.json ~495 KB (dane). Moduł i test to jedna całość 1:1 (jak G3a/G2a).

TESTY:
- `cargo test --test p6_forced_war_g3b`: 6 passed, 0 failed (search, sweep, idcmp, restore negatywny, restore realistyczny, stałe).
- `--test p6_forced_war_g3`: 2 passed (554 wektorów G3a, po zmianie komparatora). `--test p6_forced_war_g2`: 3 passed. `--test p6_forced_war_g1`: 1 passed. `--lib`: 22 passed.
- Generator G3b w trybie weryfikacji: "weryfikacja OK (plik zgodny z webem)".
- `cargo clippy --all-targets -- -D warnings`: czysto (Finished, bez ostrzeżeń).
- `rustfmt --check` na war_forced_trigger.rs, war_forced_waves.rs, p6_forced_war_g3b.rs: czysto (po rustfmt na nowych plikach).
- Bramki: CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR w worktree (usunięty po bramkach).
- NIE_ZMIERZONO: pełne `cargo test` po wszystkich binarkach (koszt czasu); zmiana komparatora dotyczy tylko modułu fal (grep: użycia wyłącznie w p6_forced_war_g3*.rs).
- Błąd w trakcie: w `should_search_stone` zła kolejność argumentów `is_eligible_for_stone_forced_war` (sygnatura: main_ai, already_at_war, turn, is_stone_era). Wykryty przez test wektorowy, naprawiony przed commitem.

BLOKADY:
- G3b NIE obejmuje pełnej pętli main.ts: mutacje `*PendingOwners` i `*EraEnterTurnByOwner` w ownerLoop, wpis fali i pruning w pętli, podpięcie do `assignForcedWarPairings`, pula gracza (`isPlayerEligibleForEraWarPool`), odpoczynek gracza. Wymaga decyzji orkiestratora o zakresie (kolejna partia G3c lub zgoda na szerszą strukturę stanu).
- Cooldown 20 tur: stała zgodna (test), ale jej zastosowanie w auto-pokoju (`lockTurnsOverride`) to ścieżka dyplomacji, nie zportowana tutaj.
- Akceptacja właściciela: rozbieżność restore dla zepsutych zapisów (pkt 2); ZAŁOŻENIE porządku ICU dla znaków spoza [A-Za-z0-9_-] (bajtowo).
- Akceptacja orkiestratora: budżet LOC (pkt 4).

RUNDY: 4/5 (ta runda = odpowiedź na zarzuty 1-4 rundy 3). Brak eskalacji limitu.
NASTĘPNY KROK: Evaluator (Sonnet 5.5) i Final Control (Sonnet 5.5) na commicie G3b. Decyzja orkiestratora: czy domknąć pętlę main.ts jako G3c (zakres poza war_*.rs) czy przyjąć G3b jako pełny zakres partii G3.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na detached HEAD worktree; brak push).
