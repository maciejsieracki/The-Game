STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-WIRING-Q1
GOAL: (1) apply_dipl_deltas_to_state: brak wpisu skarbca AI / puli Pracy = 0 (parytet z pinem); (2) wpiecie w faze Diplomacy (advance_turn); (3) wektory z pinu >=150 dla apply i >=150 dla D3; (4) test zgodnosci wstecznej.
BAZA: 358cb6cf6 (origin/rust-port/parity-v2 po INTEG-B18), worktree --detach. Pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (tylko odczyt).
ZMIANY/COMMIT: rust-port/engine/src/domain/turn_war_dipl_steps.rs (apply: brak wpisu = 0, bez bledu; blad tylko dla NaN/Inf, atomowo); rust-port/engine/src/domain/playable.rs (run_diplomacy_war_phase: po run_war_turn wywolanie apply_dipl_deltas_to_state z report.dipl.treasury_deltas / praca_deltas; import); rust-port/engine/tests/p6_r7k7c_owner_pools.rs (zmiana asercji); rust-port/engine/tests/p6_r7k7c_wiring.rs (nowy, 3 testy); ten raport. SHA commitu: patrz git log -1 na gałęzi roboczej.
ZMIENIONE ASERCJE (jedyne dozwolone, pkt 1): p6_r7k7c_owner_pools::apply_deltas_is_atomic_on_missing_owner (oczekiwal DiplStep dla brakujacego wlasciciela) zastapiony testem parytetu apply_missing_owner_entry_counts_as_zero_like_pin; atomowosc pokryta przez apply_deltas_is_atomic_on_non_finite_entry. Zadnych innych asercji nie zmieniono.
TESTY:
- cargo fmt --check (rust-port/engine): OK
- cargo clippy --all-targets -- -D warnings: OK
- cargo test --lib: 94 passed, 0 failed
- p6_r7k7c_owner_pools 14/14; p6_r7k7c_wiring 3/3 (nowy)
- p6_wire_war_* (20 targetow: declare, declare_peace, dipl_steps, diplo, epoch, forced_step, inputs, march_adapter, march_core, march_vectors, pipeline, pop, siege_aiai, siege_aiai_peace, siege_aiai_seq, state, state_owner, state_snapshot, stores, view): wszystkie PASS
- playable_slice 7/7; smoke 2/2
BLOKADY / NIE_ZMIERZONO:
- (3) wektory z pinu NIE ZROBIONE. Apply ani D3 nie sa wyodrebnialne z pinu jako samodzielna funkcja: writery skarbca/puli sa domknieciami wewnatrz main.ts (AI add ok. linia 22642; setOwnerTreasury/setOwnerPracaPool ok. 34867-34890; D3 tickCyclicResourceTradeDeals ok. 24077), bez eksportu. Wykonanie tekstu wymaga bundlowania main.ts z zaleznosciami i harnessu (esbuild poza repo). Nie dodano wektorow i nie podajemy zadnych liczb jako pinowych. Istniejace testy apply sa z recznie wyliczonych wartosci.
- Sciezka z niezerowymi deltami przez advance_turn NIE jest pokryta end-to-end: PlayableGame nie daje wstrzyknac stanu umow/skarbcow z zewnatrz (brak state_mut / konstruktora ze stanu). Test wiringu obejmuje tylko tury bez umow (brak spurious wpisow) i zgodnosc wsteczna.
- city_resources z raportu D3 (zapas miast) NIE jest zapisywany do PlayableState w tym temacie (poza zakresem: dispatch wymienia skarbce i pule).
- Ledger::balance (D3) nadal zwraca blad dla brakujacego producenta skarbca; dispatch nie wskazuje jej do zmiany. Brak wpisu AI w inputs.treasury przy niezerowych umowach moze wciaz konczyc ture bledem w D3 -- do rozstrzygniecia.
RUNDY: 1/5
NASTEPNY KROK: Evaluator r1: weryfikacja decyzji parytetu (add AI bez podlogi; praca z podloga max(0)) wzgledem pinu; osobny temat na wektory pinu dla apply/D3 (pkt 3) i zapis city_resources.
DEPLOY/PUSH: NIE WYKONANO (zakaz push i integracji w tym temacie)
