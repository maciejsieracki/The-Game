STATUS: BLOCK
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1
GOAL: REPIN web FALA 600/606: (a) oblezenie bez wylomu, sufit 150 tur = REMIS; (b) SIEGE-NEARBY. Runda 2 = odpowiedz na zarzuty werdyktu FAIL rundy 1.
ZMIANY/COMMIT: allowlista. rust-port/engine/src/data/units_combat.rs (pola struktury Oblezenie, "data/** dla parametru"), rust-port/engine/data/combat-params.json, rust-port/engine/src/domain/siege_no_breach.rs, rust-port/engine/tests/p6_repin_oblezenie_limit_{cap,lock,web}.rs, rust-port/engine/tests/p6_repin_oblezenie_limit_vectors/vectors.rs (GENEROWANY), dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-LIMIT-BLOKADA.md, dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1/ (gen-vectors.cjs, 02-operator-r2.md). Zero zmian w gra/**, Cargo.toml, WERSJE.md, src-tauri, renderer. Commit: SHA w sekcji COMMIT (ponizej).
TESTY (runda 2; CARGO_INCREMENTAL=0, debug off, target w worktree, usuniety po bramkach):
- rustfmt --check: OK na zmienionych plikach Rust (tablice wektorow z #[rustfmt::skip]).
- cargo clippy --all-targets -- -D warnings: exit 0.
- cargo test --test p6_repin_oblezenie_limit_cap: 8/8 OK.
- cargo test --test p6_repin_oblezenie_limit_lock: 6/6 OK.
- cargo test --test p6_repin_oblezenie_limit_web (NOWE, wektory z uruchomionego weba): 3/3 OK (cap 15 przypadkow, werdykt 336 przypadkow, SIEGE-NEARBY 400 scenariuszy).
- cargo test --test data_units_combat: 6/6 OK; --test data_compliance: 40/40 OK; --lib: 22/22 OK.
- Wektory: Node v22.22.0 uruchamia kod z `git archive origin/main gra/src gra/data` (web 638e90bea) w katalogu scratchpad poza repo; generator: dyspozycje/.../gen-vectors.cjs.
ODPOWIEDZI NA ZARZUTY:
1. (parametr nie wpiety do danych) PRZYJMUJE. Dodane pola Oblezenie.bez_wylomu_max_tur i _bez_wylomu_max_tur_opis (src/data/units_combat.rs); klucze w rust-port/engine/data/combat-params.json (150, opis z gra/data). Stala SIEGE_NO_BREACH_MAX_ROUNDS_WEB usunieta; siege_no_breach_max_rounds_from_data() czyta z danych. Test cap_wartosc_webowa_150_z_danych. Uwaga NIE_ZMIERZONO: plik Rust nie jest pelna kopia webowego (np. brak ranged_damage_mult, militia_*); rozjazd poza tematem.
2. (wektory nie z uruchomionego weba) PRZYJMUJE. gen-vectors.cjs uruchamia w Node 22 doslowne wyciagi z gra/src: battleScene.ts (cap ~1128, _roundCapVerdict ~9445), armyMerge.ts (stackGroupIdOf, besiegeArmyGroups, besiegeLockTargets), setup.ts (hexDistance). Tablice w tests/p6_repin_oblezenie_limit_vectors/vectors.rs; testy w p6_repin_oblezenie_limit_web.rs. Reczne testy zostaja jako dodatkowe, nie jako dowod.
   PRZY OKAZJI ZNALEZIONY BLAD RUNDY 1 I NAPRAWIONY: siege_no_breach_cap ograniczal wynik do 400. Web nie ogranicza tam; Math.min(..., FF) jest dopiero w _roundCapVerdict (battleScene.ts ~9448). Wektor cap(900) = 900 pokazal rozjazd; poprawione w siege_no_breach.rs i w tescie cap_zaokraglenie_js_i_granice.
3. (cel (a) end-to-end niezrealizowany: brak petli taktycznej, muru, wylomu, bitwy recznej/Pomin) PRZYJMUJE jako NIEROZWIAZANE w tej rundzie. Brak w Rust: petla tur bitwy (combat.rs::resolve_combat jednorazowe), stan muru/wylomu, bitwa reczna i Pomin. Wymaga osobnego tematu albo decyzji o zawezeniu GOAL. Operator nie zmienia zakresu sam.
4. (brak testow zachowania miasta/strat, bitwy recznej, Pomin) PRZYJMUJE jako luke. Brak testow, bo brak petli bitwy w Rust. Do domkniecia razem z pkt 3.
5. (Cargo.lock nieslidzony w drzewie) PRZYJMUJE. Cargo.lock powstal przez cargo, nie jest w commicie; usuniety przed commitem.
SIEGE-NEARBY: w Rust nadal brak commitBesiege/siegeArmyGroupId i dolaczania poza miastem (L9-L10, poza zakresem tej rundy). Wektory SIEGE-NEARBY (funkcje czyste) sa z weba.
RUNDY: 2/5; ostatni werdykt r1: FAIL (zarzuty 1-5). Decyzja wymagana od orkiestratora: (a) zawezic GOAL do "czyste funkcje + parametr" (wtedy temat moze isc do FC po commicie), albo (b) rozszerzyc zakres o petle taktyczna + stan muru/wylomu + bitwe reczna/Pomin + warstwe stanu SIEGE-NEARBY (osobne tematy, L2-L5, L9-L10).
NASTEPNY KROK: decyzja orkiestratora (a)/(b); bez niej temat zostaje BLOCK. Operator nie zadaje pytan ABC.
DEPLOY/PUSH: NIE WYKONANO
