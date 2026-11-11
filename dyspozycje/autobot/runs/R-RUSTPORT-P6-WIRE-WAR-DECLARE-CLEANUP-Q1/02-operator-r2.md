STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-WIRE-WAR-DECLARE-CLEANUP-Q1 (W4), runda 2/5 (obrona zarzutow FC r1)
GOAL: W4 wg dispatchu; r2 usuwa luki zgloszone przez Evaluatora/FC r1.
BAZA: ff1c083fb (operator r1; ancestor d2d533a77 OK). Commit r2: patrz sekcja ZMIANY-COMMIT.

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJE: brak bezpiecznika wojny wymuszonej w register_regular_war_city_loss.
   Web (origin/main gra/src/main.ts ok. 35614-35620): `*ForceWarActiveByPairKey.has` -> return przed liczeniem.
   Poprawka: `has_forced_war_pair` (przeglad wszystkich 3 epok) + wariant `CityLossVerdict::ForcedWarPair`, nic nie zapisane.
   Test: `forced_war_pair_is_not_counted_as_regular_city_loss`, `forced_war_pair_guard_is_era_independent`.
2. PRZYJMUJE: brak odpowiednika cleanupRegularWarOnPeace (web main.ts ok. 11648-11653; wolany przy kazdym pokoju, ok. 11742).
   Poprawka: `cleanup_regular_war_on_peace` czysci regularWarCapturedByPairKey, aiAiPeaceRequestByPairKey, warWearinessByPairKey
   (brak klucza = brak zapisu). Wspolny punkt `finalize_peace_between` (kolejnosc jak web: blokada epoki -> wojna wymuszona -> wojna zwykla).
   Testy: `negotiated_peace_clears_regular_counter_so_next_war_starts_at_zero`, `cleanup_regular_war_removes_all_three_maps_only_for_its_pair`,
   `cleanup_regular_war_without_keys_leaves_meta_untouched`, `finalize_peace_sets_era_lock_then_cleans_forced_war`.
   Dlug ZAMKNIETY w tym zakresie; Z6 (dedup po ownerId, W3-7) NIE zamkniety (bez zmian, jak w r1).
3. PRZYJMUJE CZESCIOWO (podzial + jawne uzasadnienie): testy podzielone na dwa pliki
   (`p6_wire_war_declare.rs` 315 LOC, `p6_wire_war_declare_peace.rs` 126 LOC), modul `war_turn_declare.rs` 473 LOC (wc -l).
   Lacznie partia 914 LOC > 600. Uzasadnienie: Z7 w P6-WIRE-WAR-DECLARE-CLEANUP.md (dalszy podzial modulu rozdzielilby
   spojne funkcje: cykl wojny wymuszonej, sprzatanie, blokade). Decyzja o akceptacji 914 LOC: FC.
4. PRZYJMUJE: bledna liczba w 01-operator-r1.md ("~330 LOC"). Poprawiona na 387 LOC (wc -l r1) z adnotacja korekty.
   Wartosc aktualna: 473 LOC (r2), wpisana w P6 doc sekcja "Rozmiar".
5. PRZYJMUJE: Z1 byl mierzalny. Zweryfikowany grepem: `serializeForcedEraPeaceLocks` = `Array.from(locks.entries())`
   (gra/src/game/forced-war-common.ts:155-158); regularWarCaptured/aiAiPeaceRequest/warWeariness = Array.from(...entries()) (main.ts ok. 37020-37022).
   Z1 w module header i P6 doc oznaczony jako ZWERYFIKOWANE; kod niezmieniony merytorycznie.
6. PRZYJMUJE: kontrakt kolejnosci set_era_peace_lock przed cleanup byl niedokumentowany i nieprzetestowany.
   Poprawka: doc-comment KONTRAKT KOLEJNOSCI przy set_era_peace_lock; `finalize_peace_between` jako jedyna sciezka pokoju;
   test `peace_lock_requires_cleanup_after` (wywolanie po cleanup daje false = udokumentowana utrata, dlatego finalize).

ZMIANY-COMMIT: patrz ponizej (commit r2 po bramkach).
- rust-port/engine/src/domain/war_turn_declare.rs (zmiana: bezpiecznik, cleanup_regular_war_on_peace, finalize_peace_between, kontrakt, Z1 zweryfikowane)
- rust-port/engine/tests/p6_wire_war_declare_peace.rs (NOWY, 7 testow)
- dyspozycje/rust-port/p6/P6-WIRE-WAR-DECLARE-CLEANUP.md (zakres, Z1 zweryfikowane, Z7, Z8, rozmiar)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-DECLARE-CLEANUP-Q1/01-operator-r1.md (korekta LOC)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-DECLARE-CLEANUP-Q1/02-operator-r2.md (NOWY)
Brak zmian w gra/**. Brak zmian w war_turn_state.rs / war_world_view.rs / war_turn_forced.rs.

TESTY (wyniki z tego srodowiska):
- cargo fmt --check: exit 0 (rustfmt na 2 zmienionych plikach).
- cargo clippy --all-targets -- -D warnings: czysto (przed korekta komentarzy/formatu; formatowanie nie zmienia semantyki).
- cargo test --lib: 22 passed, 0 failed, 0 ignored.
- cargo test --test p6_wire_war_declare: 15 passed, 0 failed, 0 ignored.
- cargo test --test p6_wire_war_declare_peace: 7 passed, 0 failed, 0 ignored.
- Regresja W1-W3 (p6_wire_war_forced_step, state, state_snapshot, view): NIE powtorzona w r2 (kod W1-W3 nietkniety; modul nie zmienia ich API). Oznaczam jako NIE_ZMIERZONO w r2.
- Wektory z uruchomionego weba: NIE_ZMIERZONO (logika inline w main.ts). Oczekiwania z odczytanych regul (ZALOZENIE jak W3).

BLOKADY: brak.
ZALOZENIA: Z1 (ZWERYFIKOWANE); Z2-Z6 bez zmian; Z7 (rozmiar partii 914 LOC, do decyzji FC); Z8 (kolejnosc blokady epoki, udokumentowana i przetestowana).
RUNDY: 2/5
NASTEPNY KROK: Evaluator (Sonnet) na r2; po PASS Final Control; integracja orkiestratora po FC (sprawdzic ancestry od commita r2).
DEPLOY/PUSH: NIE WYKONANO
