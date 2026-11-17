STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-WIRING (runda 2, DODATEK r2; wiring apply_dipl_deltas_to_state w advance_turn, #106/#298/#299)
GOAL: Wpiac apply_dipl_deltas_to_state w advance_turn, parytet "brak wpisu = 0", wektory >= 150 dla apply i D3, mutacje (a)-(e) FAIL.
BAZA: f0eb32ab8 (detached; ancestor of origin/rust-port/parity-v2 = 760be5187 sprawdzone przez `git merge-base --is-ancestor`).
ZMIANY/COMMIT: patrz sekcja "Zmiany" nizej; commit na lokalnej galezi `rust-port-wip/R7K7C-WIRING-r2` (SHA w odpowiedzi operatora). Bez push do parity, bez Cargo.lock, bez gra/, renderer/, view-model/.

## Zmiany
1. ZARZUT 5 (ledger D3, `rust-port/engine/src/domain/turn_war_dipl_steps.rs`, `apply_cyclic_outcome`, galaz Work):
   - nowa funkcja `pay_work_floored` (pub): platnosc Praca = `setOwnerPracaPool(platnik, pula - z)`, potem `setOwnerPracaPool(odbiorca, pula + z)`; kazdy zapis przez podloge `Math.max(0, value)` (pin main.ts:34880, wolania main.ts:24015-24016); odbiorca czytany PO zapisie platnika.
   - przyrost raportu `praca_delta` = faktyczna zmiana po podlodze (nie surowe -z/+z). Dzieki temu `apply_dipl_deltas_to_state` (start + przyrost, potem podloga) daje ten sam wynik co pin.
   - Decyzja orkiestratora "saldo platnika sprawdzane": pin NIE sprawdza salda dla platnosci Praca (tylko dla zlota, applyOneShotGoldTransfer, co Rust juz robi). Podloga zastepuje sprawdzenie; nie dodano dodatkowej bramki. Zapisane jako odstepstwo-zero, bez DECISION_REQUIRED (zgodne z pinem).
2. ZARZUT 6 (rollback): zostaje poprawka Obrony (`economy_before`). Dodano test `niekompletna_kolejka_cofa_przyrost_skarbca_z_fazy_dyplomacji` (`rust-port/engine/src/domain/playable.rs`, modul `r7k7c_rollback_tests`): kolejka bez fazy AI -> Diplomacy stosuje danine (skarbiec 10 i AI 100 -> 50 i 60 przed cofnieciem) -> `TurnPhaseQueueIncomplete` -> test wymaga 10 i 100.
3. ZARZUT 4 / ZARZUT 3 (wektory):
   - apply: istniejace `p6_r7k7c_vectors/apply.json` (232 wektory z pinu, generator `apply_gen.mjs`) i testy wiringu (3 tury, dwa scenariusze: danina/handel trybutowy w `p6_r7k7c.rs`). Sekwencje jednej tury dla tego samego wlasciciela sa pokryte przez `d3_work` (ponizej) po stronie ledgera; apply pozostaje jednym przyrostem na wlasciciela (zgodnie z raportem D3/D6), co jest zgodne z pinem przez netto-przyrost.
   - D3: NOWY generator `rust-port/engine/tests/p6_r7k7c_vectors/d3_work_gen.mjs` wykonuje tekst pinu (`ownerPracaPool`/`setOwnerPracaPool`, main.ts:34876-34894, przez `stripTypeScriptTypes`, straznik zakresow linii) i produkuje `d3_work.json`: 220 wektorow (8 brzegowych + 212 losowych, ziarno 2999), kazdy z `ref` (main.ts:24015-24016 / 34879-34882) i sekwencja 1-4 platnosci (w tym platnik = odbiorca).
   - test `rust-port/engine/tests/p6_r7k7c_d3.rs`: wektory D3 (>= 150 wymagane, jest 220) + 3 testy jednostkowe (podloga po kazdym zapisie, brak wpisu = 0, odrzucenie NaN bez zmian).
   - Uwaga: wektory apply z "sekwencja w jednej turze dla tego samego wlasciciela" NIE zostaly dodane do `apply.json` (apply przyjmuje agregat na wlasciciela). Ta czesc zarzutu 4 jest zrealizowana po stronie D3 (ledger), a nie apply. Oznaczam jako NOTES.
4. Brak-wpisu w apply: istniejace testy `brak_wpisu_*` i wektory `apply.json` (zerowa delta bez wpisu = 0).

## Testy / bramki (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo)
- `cargo fmt --check -p civ-engine`: EXIT 0 (po rustfmt na nowym tescie).
- `cargo clippy -p civ-engine --all-targets -- -D warnings`: EXIT 0.
- `cargo test -p civ-engine --test p6_r7k7c --test p6_r7k7c_owner_pools --test p6_r7k7c_d3`: EXIT 0 (7 + 4 + 15 testow; nowy d3: 4/4).
- `cargo test -p civ-engine --lib r7k7c_rollback`: EXIT 0 (1/1).
- Podzbior testow dotykajacych advance_turn / D3 (EXIT 0 dla kazdego targetu): `--lib` 127/127; `diplomacy` 32/32; `p4_1h_move_model` 9/9; `p6_r7k7c` 7/7; `p6_r7k7c_d3` 4/4; `p6_r7k7c_owner_pools` 15/15; `p6_victory_wiring` 10/10; `p6_wire_war_pipeline` 7/7; `p6_wire_war_stores` 7/7; `playable_slice` 7/7; `smoke` 2/2. Targety `p6_cred_hak_kolejnosc` i `p6_unit_replace_l3_state` NIE_ZMIERZONO (nie uruchomione osobno w tej rundzie; pierwsze wywolanie zbiorcze zakonczylo sie bledem nazwy targetu).
- PELNY `cargo test --all-targets --no-fail-fast`: NIE_ZMIERZONO. Powod: wolne miejsce na dysku 9,7 GB (`df -h /`) przy 515 plikach testowych; pelny przebieg zjadlby ponizej progu 8 GB. Do uruchomienia po zwolnieniu dysku.

## Mutacje (kazda na zmienionym kodzie, potem przywrocona; wynik)
- (a) usuniete wywolanie D3/war-phase w `advance_turn` (`if false && entry.phase() == TurnPhase::Diplomacy`): FAIL - `wiring::trzy_tury_przyrosty_wojny_trafiaja_do_stanu`.
- (b) "brak wpisu traktowany jako blad" (w `apply_dipl_deltas_to_state`, galaz AI): FAIL - `apply::brak_wpisu_wlasciciela_to_zero_nie_blad`, `apply::zerowy_przyrost_bez_wpisu_tworzy_zero_jak_pin`, `apply::wektory_z_pinu_apply_zgodne`.
- (c) zamiana kolejnosci platnosci (odbiorca przed platnikiem) w `pay_work_floored`: FAIL - `wektory_d3_praca_z_pinu_zgodne` (wektor 1, platnik = odbiorca: pin 10, mutant 5).
- (d) usuniecie podlogi po zapisie (ledger D3): FAIL - `wektory_d3_praca_z_pinu_zgodne`, `brak_wpisu_platnika_to_zero_i_zapis_tworzy_wpis`, `podloga_po_kazdym_zapisie_a_nie_tylko_na_koncu`.
- (e) rollback bez `economy` (usuniete `self.state.economy = economy_before` w galezi `phases.len() != PHASE_COUNT`): FAIL - `niekompletna_kolejka_cofa_przyrost_skarbca_z_fazy_dyplomacji`.
Wszystkie mutanty przywrocone; `grep` potwierdza brak `if false` i znacznikow MUTANT w kodzie.

## Rozjazdy z pinem / decyzje
- Brak rozjazdu gameplay wykrytego w tej rundzie. Platnosc Praca bez bramki salda: zgodne z pinem (patrz pkt 1).
- Mutant (c) w dispatchu opisany jako "zamiana kolejnosci apply wzgledem poprzedniego kroku tury" - zrealizowany jako zamiana kolejnosci dwoch zapisow w `pay_work_floored` (jedyne miejsce, gdzie kolejnosc ma obserwowalny skutek po poprawce podlogi). Nie uznawany za rownowazny: wynik zmienia sie dla platnik = odbiorca.
- Zarzut 8 (wielu ludzi, is_human, #282/#253): poza zakresem, nie ruszano.

## Pozostale NIE_ZMIERZONO
- Pelny `cargo test --all-targets` (dysk, patrz wyzej).
- Kody wyjscia podzbioru: EXIT 0 (sekcja "Testy / bramki" wyzej).

RUNDY: 2/5 (DODATEK r2)
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje wektory D3 i mutacje (a)-(e); Final Control po pelnym `cargo test --all-targets` po zwolnieniu dysku.
DEPLOY/PUSH: NIE WYKONANO (push do parity zakazany dispatchem; brak push).
